import { __private_normalizeHeaderKeyForTests as normalizeHeaderKeyForTests, parseTestPlanFile } from "./testPlanParser";

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
  });

  test("parses CSV with common Chinese headers into TestCase items", async () => {
    const csv = [
      "编号,用例名称,项目,参数,预期结果,标签",
      "TC-001,WiFi连接稳定性,WiFi功能测试,band=5G;ssid=TestAP,连接成功且稳定,smoke;wifi",
    ].join("\n");

    const file = makeTextFile("WiFi Function TestPlan.csv", csv);
    const { items, warnings, summary } = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "TC-001",
      name: "WiFi连接稳定性",
      projectId: "WiFi功能测试",
    });
    expect(items[0].description).toContain("Expected:");
    expect(items[0].tags).toEqual(expect.arrayContaining(["smoke", "wifi"]));
    expect(items[0].parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "band", value: "5G" }),
        expect.objectContaining({ key: "ssid", value: "TestAP" }),
      ])
    );

    // Summary should exist and not show missing required headers
    expect(summary).toBeTruthy();
    expect(summary.missingHeaders || []).toEqual([]);
    expect(Array.isArray(warnings)).toBe(true);
  });

  test("supports additional header aliases (traditional Chinese + English variants)", async () => {
    const csv = [
      "Case Name,Project Name,描述",
      "Roaming basic,專案A,Some steps",
    ].join("\n");

    const file = makeTextFile("aliases.csv", csv);
    const { items, summary } = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      name: "Roaming basic",
      projectId: "專案A",
    });
    expect(summary.missingHeaders || []).toEqual([]);
  });

  test("supports exact WiFi Function TestPlan header variant: Project/Project Name", async () => {
    const csv = [
      "ID,Test Case Name,Project/Project Name,Expected Result,Tags",
      "TC-9,Connect 2.4G,WiFi Function Test,OK,smoke",
    ].join("\n");

    const file = makeTextFile("wifi-plan.csv", csv);
    const { items, summary } = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "TC-9",
      name: "Connect 2.4G",
      projectId: "WiFi Function Test",
    });

    expect(summary.missingHeaders || []).toEqual([]);
  });

  test("does not fail entire import if some rows are missing Project (skips invalid rows and reports counts)", async () => {
    const csv = [
      "用例名,项目,标签",
      "Valid case,ProjA,smoke",
      "Missing project,,wifi",
      ",ProjB,blankname",
      "  ,  ,  ", // blank row
      "Another valid,項目B,regression",
    ].join("\n");

    const file = makeTextFile("partial.csv", csv);
    const { items, summary, warnings } = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(items).toHaveLength(2);
    expect(items.map((x) => x.projectId)).toEqual(expect.arrayContaining(["ProjA", "項目B"]));

    expect(summary.importedRows).toBe(2);
    expect(summary.skippedRows).toBeGreaterThanOrEqual(2);
    expect(summary.skippedMissingProject).toBeGreaterThanOrEqual(1);
    expect(summary.blankRows).toBeGreaterThanOrEqual(1);

    // Warnings should include skip info
    expect((warnings || []).join(" ")).toMatch(/Skipped/i);
  });

  test("fails with clear error when required fields cannot be found at all", async () => {
    const csv = ["ID,SomethingElse", "1,abc"].join("\n");
    const file = makeTextFile("bad.csv", csv);

    await expect(parseTestPlanFile(file)).rejects.toThrow(/Could not find any values for Name/i);
  });
});
