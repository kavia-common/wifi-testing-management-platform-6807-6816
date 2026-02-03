import {
  __private_applyMergesToAoaHeadersForTests as applyMergesToAoaHeadersForTests,
  __private_concatVerticalHeaderFragmentsForTests as concatVerticalHeaderFragmentsForTests,
  __private_normalizeHeaderKeyForTests as normalizeHeaderKeyForTests,
  parseTestPlanFile,
} from "./testPlanParser";

function makeTextFile(name, text) {
  return {
    name,
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

describe("testPlanParser", () => {
  test("normalizeHeaderKey removes BOM/whitespace/punctuation and lowercases (and halfwidth normalizes)", () => {
    expect(normalizeHeaderKeyForTests("\uFEFF Test Case Name ")).toBe("testcasename");
    expect(normalizeHeaderKeyForTests("预期结果")).toBe("预期结果");
    expect(normalizeHeaderKeyForTests("Project_ID")).toBe("projectid");
    expect(normalizeHeaderKeyForTests("标签/Tags")).toBe("标签tags");

    // Fullwidth ASCII should normalize
    expect(normalizeHeaderKeyForTests("Ｐｒｏｊｅｃｔ　Ｎａｍｅ")).toBe("projectname");

    // Punctuation / brackets / slashes should normalize away
    expect(normalizeHeaderKeyForTests("Project（项目）")).toBe("project项目");
    expect(normalizeHeaderKeyForTests("Project/项目")).toBe("project项目");
    expect(normalizeHeaderKeyForTests("Project_name")).toBe("projectname");
  });

  test("multi-row header concatenation concatenates vertically per column", () => {
    const headerRows = [
      ["ID", "Project", "Test Case Name"],
      ["", "（项目）", ""],
    ];
    const headers = concatVerticalHeaderFragmentsForTests(headerRows, 3);
    expect(headers).toEqual(["ID", "Project（项目）", "Test Case Name"]);
    expect(normalizeHeaderKeyForTests(headers[1])).toBe("project项目");
  });

  test("merged header propagation spreads merged cell value across covered columns", () => {
    const aoa = [
      ["Project", "", "Name"],
      ["项目", "", "用例名称"],
    ];
    const merges = [
      // merge A1:B1 (0,0) to (0,1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ];

    const out = applyMergesToAoaHeadersForTests(aoa, merges);
    expect(out[0][0]).toBe("Project");
    expect(out[0][1]).toBe("Project"); // propagated into merged region
  });

  test("parses CSV with common Chinese headers into TestCase items", async () => {
    const csv = [
      "编号,用例名称,项目,参数,预期结果,标签",
      "TC-001,WiFi连接稳定性,WiFi功能测试,band=5G;ssid=TestAP,连接成功且稳定,smoke;wifi",
    ].join("\n");

    const file = makeTextFile("WiFi Function TestPlan.csv", csv);
    const res = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(res.ok).toBe(true);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toMatchObject({
      id: "TC-001",
      name: "WiFi连接稳定性",
      projectId: "WiFi功能测试",
    });
    expect(res.items[0].description).toContain("Expected:");
    expect(res.items[0].tags).toEqual(expect.arrayContaining(["smoke", "wifi"]));
    expect(res.items[0].parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "band", value: "5G" }),
        expect.objectContaining({ key: "ssid", value: "TestAP" }),
      ])
    );

    expect(res.summary).toBeTruthy();
    expect(res.summary.missingHeaders || []).toEqual([]);
    expect(Array.isArray(res.warnings)).toBe(true);
  });

  test("supports new Project alias variants including 产品线 and traditional Chinese", async () => {
    const csv = ["Case Name,产品线,描述", "Roaming basic,产品线A,Some steps"].join("\n");

    const file = makeTextFile("aliases.csv", csv);
    const res = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(res.ok).toBe(true);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toMatchObject({
      name: "Roaming basic",
      projectId: "产品线A",
    });
    expect(res.summary.missingHeaders || []).toEqual([]);
  });

  test("supports exact header variant: Project（项目） via normalization", async () => {
    const csv = ["ID,Test Case Name,Project（项目）,Expected Result,Tags", "TC-9,Connect 2.4G,WiFi Function Test,OK,smoke"].join(
      "\n"
    );

    const file = makeTextFile("wifi-plan.csv", csv);
    const res = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(res.ok).toBe(true);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toMatchObject({
      id: "TC-9",
      name: "Connect 2.4G",
      projectId: "WiFi Function Test",
    });

    expect(res.summary.missingHeaders || []).toEqual([]);
  });

  test("fallback mapping path: returns candidate headers when alias fails (no throw)", async () => {
    const csv = ["A,B,C", "1,2,3"].join("\n");
    const file = makeTextFile("unknown.csv", csv);

    const res = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(res.ok).toBe(false);
    expect(res.needsMapping).toBe(true);
    expect(res.summary).toBeTruthy();
    expect(res.summary.candidateHeaders).toEqual(expect.arrayContaining(["A", "B", "C"]));
    expect(String(res.message || "")).toMatch(/Missing required|choose which columns/i);
  });

  test("does not fail entire import if some rows are missing Project (skips invalid rows and reports counts)", async () => {
    const csv = [
      "用例名,项目,标签",
      "Valid case,ProjA,smoke",
      "Missing project,,wifi",
      ",ProjB,blankname",
      "  ,  ,  ",
      "Another valid,项目B,regression",
    ].join("\n");

    const file = makeTextFile("partial.csv", csv);
    const res = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(res.ok).toBe(true);
    expect(res.items).toHaveLength(2);
    expect(res.items.map((x) => x.projectId)).toEqual(expect.arrayContaining(["ProjA", "项目B"]));

    expect(res.summary.importedRows).toBe(2);
    expect(res.summary.skippedRows).toBeGreaterThanOrEqual(2);
    expect(res.summary.skippedMissingProject).toBeGreaterThanOrEqual(1);
    expect(res.summary.blankRows).toBeGreaterThanOrEqual(1);

    expect((res.warnings || []).join(" ")).toMatch(/Skipped/i);
  });
});
