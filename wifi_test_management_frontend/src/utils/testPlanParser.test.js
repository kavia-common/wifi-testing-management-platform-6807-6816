import { __private_normalizeHeaderKeyForTests as normalizeHeaderKeyForTests, parseTestPlanFile } from "./testPlanParser";

function makeTextFile(name, text) {
  return {
    name,
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

describe("testPlanParser", () => {
  test("normalizeHeaderKey removes BOM/whitespace/punctuation and lowercases", () => {
    expect(normalizeHeaderKeyForTests("\uFEFF Test Case Name ")).toBe("testcasename");
    expect(normalizeHeaderKeyForTests("预期结果")).toBe("预期结果");
    expect(normalizeHeaderKeyForTests("Project_ID")).toBe("projectid");
    expect(normalizeHeaderKeyForTests("标签/Tags")).toBe("标签tags");
  });

  test("parses CSV with common Chinese headers into TestCase items", async () => {
    const csv = [
      "编号,用例名称,项目,参数,预期结果,标签",
      "TC-001,WiFi连接稳定性,WiFi功能测试,band=5G;ssid=TestAP,连接成功且稳定,smoke;wifi",
    ].join("\n");

    const file = makeTextFile("WiFi Function TestPlan.csv", csv);
    const { items, warnings } = await parseTestPlanFile(file, { defaultProjectId: "" });

    expect(warnings || []).toEqual([]);
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
  });

  test("fails with clear error when required columns/values are missing", async () => {
    const csv = ["ID,SomethingElse", "1,abc"].join("\n");
    const file = makeTextFile("bad.csv", csv);

    await expect(parseTestPlanFile(file)).rejects.toThrow(/Missing required column\/value for Name/i);
  });
});
