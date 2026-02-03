import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeParametersList, normalizeTagsFromString } from "../pages/testCasesMockData";

/**
 * Parser for TestPlan imports (CSV/XLSX/JSON) that normalizes rows into the app TestCase shape.
 *
 * Key goals:
 * - Robust XLSX parsing (sheet selection heuristics, empty row handling).
 * - Header normalization + tolerant mapping for common WiFi test plan columns (including localized headers).
 * - Clear, actionable error messages when required fields are missing.
 */

/** Max rows to import for safety (avoid locking UI on huge files). */
const MAX_ROWS = 2000;

function nowIso() {
  return new Date().toISOString();
}

function toStringSafe(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

/**
 * Normalize headers to a comparison key:
 * - Trim
 * - Lowercase
 * - Remove BOM and zero-width characters
 * - Remove whitespace, underscores, hyphens
 * - Remove common punctuation separators
 */
function normalizeHeaderKey(k) {
  return toStringSafe(k)
    .replace(/^\uFEFF/, "") // BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars (defensive)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "")
    .replace(/[()【】[\]{}:：/\\|.，,;；]/g, "");
}

/** Trim and turn any value into a non-empty string or "" */
function strTrim(v) {
  return toStringSafe(v).trim();
}

function isRowEmpty(row) {
  if (!row || typeof row !== "object") return true;
  for (const v of Object.values(row)) {
    if (strTrim(v)) return false;
  }
  return true;
}

function normalizeRowKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    const nk = normalizeHeaderKey(k);
    if (!nk) continue;
    // Prefer first occurrence if duplicates appear after normalization
    if (!(nk in out)) out[nk] = v;
  }
  return out;
}

function firstNonEmpty(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    const s = strTrim(v);
    if (s) return s;
  }
  return "";
}

/**
 * Header aliases for typical WiFi Function TestPlan spreadsheets.
 * Keep these keys already normalized by normalizeHeaderKey().
 */
const HEADER_ALIASES = {
  // Required target fields
  name: [
    // English-ish
    "name",
    "testcase",
    "testcasename",
    "title",
    "testname",
    "item",
    "case",
    "casename",
    // WiFi plan common
    "testitem",
    "function",
    "feature",
    // Chinese
    "用例名称",
    "测试用例名称",
    "用例名",
    "名称",
    "标题",
    "测试项",
    "测试项目",
    "功能点",
    "功能",
  ].map(normalizeHeaderKey),

  project: [
    "projectid",
    "project",
    "projectname",
    "suite",
    "plan",
    "planname",
    // Chinese
    "项目",
    "项目名称",
    "工程",
    "工程名称",
    "产品",
    "产品名称",
    "所属项目",
  ].map(normalizeHeaderKey),

  id: [
    "id",
    "testcaseid",
    "caseid",
    "tcid",
    "key",
    "uid",
    "no",
    "number",
    "index",
    // Chinese
    "编号",
    "序号",
    "用例编号",
    "用例id",
    "id编号",
  ].map(normalizeHeaderKey),

  description: [
    "description",
    "desc",
    "objective",
    "summary",
    "steps",
    "procedure",
    "details",
    // WiFi-ish
    "teststeps",
    "precondition",
    "preconditions",
    // Chinese
    "描述",
    "说明",
    "概要",
    "前置条件",
    "步骤",
    "测试步骤",
    "操作步骤",
  ].map(normalizeHeaderKey),

  expectedResult: [
    "expectedresult",
    "expected",
    "expect",
    "result",
    "expectedresults",
    // Chinese
    "预期结果",
    "期望结果",
    "预期",
    "结果",
  ].map(normalizeHeaderKey),

  parameters: [
    "parameters",
    "params",
    "inputs",
    "arguments",
    "args",
    "input",
    // Chinese
    "参数",
    "输入",
    "输入参数",
    "测试数据",
  ].map(normalizeHeaderKey),

  tags: [
    "tags",
    "tag",
    "labels",
    // some plans store category-ish content in tags-like columns
    "label",
    // Chinese
    "标签",
    "标记",
  ].map(normalizeHeaderKey),

  category: [
    "category",
    "module",
    "feature",
    "type",
    // Chinese
    "分类",
    "模块",
    "类型",
  ].map(normalizeHeaderKey),

  priority: [
    "priority",
    "prio",
    "p",
    // Chinese
    "优先级",
    "重要度",
    "等级",
  ].map(normalizeHeaderKey),
};

/**
 * Parse tags from:
 * - array
 * - comma/semicolon-separated string
 */
function parseTagsAny(v) {
  if (Array.isArray(v)) {
    // de-dupe (case-insensitive) while preserving first casing
    const out = [];
    const seen = new Set();
    for (const t of v.map((x) => strTrim(x)).filter(Boolean)) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out.slice(0, 20);
  }

  // allow comma/semicolon separated
  const s = toStringSafe(v).replace(/；/g, ";").replace(/，/g, ",").replace(/;/g, ",");
  return normalizeTagsFromString(s);
}

/**
 * Parameters parser:
 * - array of {key,value}
 * - object map {k:v}
 * - string "k=v; a=b" or JSON string
 */
function parseParametersAny(v) {
  if (Array.isArray(v)) return normalizeParametersList(v);

  if (v && typeof v === "object") {
    return normalizeParametersList(
      Object.entries(v).map(([key, value]) => ({ key, value: toStringSafe(value) }))
    );
  }

  const raw = strTrim(v);
  if (!raw) return [];

  // JSON-ish string
  if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
    try {
      const parsed = JSON.parse(raw);
      return parseParametersAny(parsed);
    } catch {
      // fallthrough to key=value parsing
    }
  }

  // key=value pairs separated by ; or , (including Chinese punctuation normalized above)
  const parts = raw
    .replace(/；/g, ";")
    .replace(/，/g, ",")
    .split(/[;,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const list = [];
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) list.push({ key: part, value: "" });
    else list.push({ key: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim() });
  }
  return normalizeParametersList(list);
}

function parseCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => (typeof h === "string" ? h.replace(/^\uFEFF/, "") : h),
  });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first.message || "Invalid CSV"}`);
  }
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows;
}

/**
 * Choose a sheet:
 * - Prefer sheet names that look like actual case tables: "test", "case", "plan", "用例", "测试"
 * - Otherwise choose the sheet with the most non-empty rows.
 */
function chooseBestSheet(workbook) {
  const names = workbook.SheetNames || [];
  if (!names.length) return "";

  const scoreName = (n) => {
    const s = String(n).toLowerCase();
    const hits = [
      "test",
      "case",
      "plan",
      "suite",
      "tc",
      "用例",
      "测试",
      "测试用例",
      "计划",
      "功能",
    ].some((w) => s.includes(w));
    return hits ? 10 : 0;
  };

  let best = names[0];
  let bestScore = -Infinity;

  for (const name of names) {
    const sheet = workbook.Sheets?.[name];
    if (!sheet) continue;

    // Use raw array-of-arrays to quickly count rows that contain any value.
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
    const nonEmptyRowCount = (aoa || []).filter((r) => Array.isArray(r) && r.some((c) => strTrim(c))).length;

    const score = scoreName(name) + Math.min(nonEmptyRowCount, 500) / 50; // small tie-breaker
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

function parseXlsx(arrayBuffer) {
  // cellDates: keep dates (if any) as Date objects; we eventually stringify
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

  const sheetName = chooseBestSheet(workbook);
  if (!sheetName) throw new Error("XLSX file has no sheets");

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("Unable to read XLSX sheet");

  // defval: preserve columns even if empty; blankrows: false to avoid extra empty objects
  let rows = XLSX.utils.sheet_to_json(sheet, { defval: "", blankrows: false });

  // Remove fully empty rows (common in exported sheets)
  rows = (Array.isArray(rows) ? rows : []).filter((r) => !isRowEmpty(r));

  return rows;
}

function parseJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }

  // Accept:
  // - array of items
  // - object with items/testCases/testcases/rows
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const arr =
      parsed.items ||
      parsed.testCases ||
      parsed.testcases ||
      parsed.rows ||
      parsed.data ||
      parsed.cases;
    if (Array.isArray(arr)) return arr;
  }
  throw new Error("JSON must be an array of rows or contain an items/testCases/rows array");
}

function inferKindFromFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (name.endsWith(".json")) return "json";
  return "unknown";
}

/**
 * Attempt to find a field value by trying:
 * - explicit mapping overrides
 * - alias list matching
 * - direct key match
 */
function getFieldValue(normalizedRow, { field, mapping }) {
  const mappingKey = mapping?.[field] ? normalizeHeaderKey(mapping[field]) : "";
  if (mappingKey && mappingKey in normalizedRow) return normalizedRow[mappingKey];

  const aliases = HEADER_ALIASES[field] || [];
  const hit = firstNonEmpty(normalizedRow, aliases);
  if (hit) return hit;

  // Also accept direct normalized field name if present.
  const direct = strTrim(normalizedRow?.[normalizeHeaderKey(field)]);
  if (direct) return direct;

  return "";
}

function buildRequiredColumnsHelp() {
  // Keep this simple and user-facing; it shows typical headers we can read.
  return [
    "Required columns: Name (用例名称) and Project (项目).",
    "Optional columns: ID (编号), Description/Steps (描述/步骤), Parameters (参数), ExpectedResult (预期结果), Tags (标签), Category (分类), Priority (优先级).",
  ].join(" ");
}

function rowToTestCase(row, { defaultProjectId, mapping } = {}) {
  const r = normalizeRowKeys(row);

  const name = strTrim(getFieldValue(r, { field: "name", mapping }));
  const projectId = strTrim(getFieldValue(r, { field: "project", mapping })) || strTrim(defaultProjectId);

  const externalId = strTrim(getFieldValue(r, { field: "id", mapping }));

  const descriptionBase =
    strTrim(getFieldValue(r, { field: "description", mapping })) ||
    strTrim(firstNonEmpty(r, ["steps", "procedure", "teststeps"].map(normalizeHeaderKey)));

  const expectedResult = strTrim(getFieldValue(r, { field: "expectedResult", mapping }));
  const description = expectedResult
    ? `${descriptionBase}${descriptionBase ? "\n\n" : ""}Expected: ${expectedResult}`
    : descriptionBase;

  const tagsRaw = getFieldValue(r, { field: "tags", mapping }) || r.tags;
  const tags = parseTagsAny(tagsRaw);

  // Category / priority: add as tags so we don't lose info (since core TestCase shape doesn't have these fields)
  const category = strTrim(getFieldValue(r, { field: "category", mapping }));
  const priority = strTrim(getFieldValue(r, { field: "priority", mapping }));
  const extraTags = [];
  if (category) extraTags.push(`Category:${category}`);
  if (priority) extraTags.push(`Priority:${priority}`);

  const mergedTags = parseTagsAny([...(tags || []), ...extraTags].filter(Boolean));

  const parameters = parseParametersAny(getFieldValue(r, { field: "parameters", mapping }) || r.parameters);

  // Minimal validation (more handled by caller)
  if (!name || !projectId) return null;

  return {
    id: externalId ? toStringSafe(externalId) : undefined,
    name,
    projectId,
    description,
    tags: mergedTags,
    parameters,
    usage: { executions: 0, results: 0 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

/**
 * Validate that rows contain required columns.
 * We validate by checking if at least one row contains a non-empty value for both required fields.
 */
function validateRequiredColumns(rows, { defaultProjectId, mapping } = {}) {
  const issues = [];

  let hasAnyName = false;
  let hasAnyProject = Boolean(strTrim(defaultProjectId));

  for (const row of rows) {
    const r = normalizeRowKeys(row);
    const name = strTrim(getFieldValue(r, { field: "name", mapping }));
    const project = strTrim(getFieldValue(r, { field: "project", mapping }));

    if (name) hasAnyName = true;
    if (project) hasAnyProject = true;

    if (hasAnyName && hasAnyProject) break;
  }

  if (!hasAnyName) issues.push("Missing required column/value for Name (用例名称).");
  if (!hasAnyProject) issues.push("Missing required column/value for Project (项目).");

  return issues;
}

// PUBLIC_INTERFACE
export async function parseTestPlanFile(file, { defaultProjectId, mapping } = {}) {
  /**
   * Parses a CSV/XLSX/JSON TestPlan file into normalized TestCase-like objects.
   * Returns { items, warnings } where warnings are user-displayable strings.
   *
   * Options:
   * - defaultProjectId: if provided, rows missing Project can still import (projectId fallback).
   * - mapping: optional mapping overrides, e.g. { name: "用例名称", project: "项目" }
   */
  if (!file) throw new Error("No file selected");

  const kind = inferKindFromFile(file);
  const warnings = [];

  let rows = [];
  if (kind === "csv") {
    const text = await file.text();
    rows = parseCsv(text);
  } else if (kind === "json") {
    const text = await file.text();
    rows = parseJson(text);
  } else if (kind === "xlsx") {
    const buf = await file.arrayBuffer();
    rows = parseXlsx(buf);
  } else {
    // Autodetect by attempting JSON, then CSV. (XLSX cannot be reliably guessed without extension.)
    const text = await file.text();
    try {
      rows = parseJson(text);
      warnings.push("Detected JSON format without a .json extension.");
    } catch {
      rows = parseCsv(text);
      warnings.push("Detected CSV format without a .csv extension.");
    }
  }

  rows = (Array.isArray(rows) ? rows : []).filter((r) => !isRowEmpty(r));

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No rows found in file");
  }

  if (rows.length > MAX_ROWS) {
    warnings.push(`File contains ${rows.length} rows; only the first ${MAX_ROWS} will be imported.`);
    rows = rows.slice(0, MAX_ROWS);
  }

  // Validate required columns/values with a user-friendly message.
  const requiredIssues = validateRequiredColumns(rows, { defaultProjectId, mapping });
  if (requiredIssues.length) {
    const extra = buildRequiredColumnsHelp();
    throw new Error(`${requiredIssues.join(" ")} ${extra}`);
  }

  const items = [];
  let dropped = 0;

  for (const row of rows) {
    const tc = rowToTestCase(row, { defaultProjectId, mapping });
    if (!tc) {
      dropped += 1;
      continue;
    }
    items.push(tc);
  }

  if (items.length === 0) {
    throw new Error(
      `No valid test cases found after parsing. ${buildRequiredColumnsHelp()}`
    );
  }

  if (dropped > 0) {
    warnings.push(
      `${dropped} row(s) were skipped due to missing required fields (Name/Project).`
    );
  }

  return { items, warnings };
}

// PUBLIC_INTERFACE
export function stableTestCaseKey(testCase) {
  /** Stable de-duplication key: name + projectId (case-insensitive). */
  const name = toStringSafe(testCase?.name).trim().toLowerCase();
  const projectId = toStringSafe(testCase?.projectId).trim().toLowerCase();
  return `${projectId}::${name}`;
}

// PUBLIC_INTERFACE
export function __private_normalizeHeaderKeyForTests(header) {
  /**
   * Exposed for unit tests only.
   * Not intended for production usage elsewhere.
   */
  return normalizeHeaderKey(header);
}
