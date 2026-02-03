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
 * - Row-level validation: skip blank rows; skip invalid rows but still import valid ones.
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
 * Convert fullwidth ASCII variants into halfwidth.
 * Covers common spreadsheet-export quirks for Latin letters, digits, and punctuation.
 */
function toHalfWidthAscii(s) {
  const str = toStringSafe(s);
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    // Fullwidth space -> normal space
    if (code === 0x3000) out += " ";
    // Fullwidth ASCII range -> halfwidth
    else if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0);
    else out += ch;
  }
  return out;
}

/**
 * Normalize headers to a comparison key:
 * - Trim
 * - Case-insensitive
 * - Remove BOM and zero-width characters
 * - Fullwidth -> halfwidth for ASCII-ish characters
 * - Remove whitespace, underscores, hyphens
 * - Remove common punctuation separators
 */
function normalizeHeaderKey(k) {
  return toHalfWidthAscii(toStringSafe(k))
    .replace(/^\uFEFF/, "") // BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars (defensive)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "")
    .replace(/[()\u3010\u3011[\]{}:\uFF1A/\\|.\uFF0C,;\uFF1B]/g, "");
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
    "test name",
    "case name",
    "casename",
    "item",
    "case",
    // WiFi plan common
    "testitem",
    "function",
    "feature",
    // Chinese (simplified/traditional variants)
    "用例名称",
    "测试用例名称",
    "用例名",
    "用例",
    "名稱",
    "标题",
    "標題",
    "测试项",
    "測試項",
    "测试项目",
    "測試項目",
    "功能点",
    "功能",
  ].map(normalizeHeaderKey),

  /**
   * Project column is often inconsistent across orgs:
   * - Project / 项目 / 專案 / 項目
   * - "Project Name"
   * - "产品/产品线" sometimes used to indicate project/product line
   */
  project: [
    "projectid",
    "project",
    "projectname",
    "project name",
    "suite",
    "plan",
    "planname",
    // Chinese simplified
    "项目",
    "项目名称",
    "所属项目",
    "工程",
    "工程名称",
    "产品",
    "产品名称",
    "产品线",
    "產品",
    "產品名稱",
    "產品線",
    // Chinese traditional
    "專案",
    "專案名稱",
    "項目",
    "項目名稱",
    // Slash-style headers commonly seen in templates
    "产品/产品线",
    "產品/產品線",
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
    "說明",
    "概要",
    "前置条件",
    "前置條件",
    "步骤",
    "步驟",
    "测试步骤",
    "測試步驟",
    "操作步骤",
    "操作步驟",
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
    "結果",
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
    "輸入",
    "输入",
    "输入参数",
    "輸入參數",
    "测试数据",
    "測試數據",
  ].map(normalizeHeaderKey),

  tags: [
    "tags",
    "tag",
    "labels",
    // some plans store category-ish content in tags-like columns
    "label",
    // Chinese
    "标签",
    "標籤",
    "标记",
    "標記",
  ].map(normalizeHeaderKey),

  category: [
    "category",
    "module",
    "feature",
    "type",
    // Chinese
    "分类",
    "分類",
    "模块",
    "模塊",
    "类型",
    "類型",
  ].map(normalizeHeaderKey),

  priority: [
    "priority",
    "prio",
    "p",
    // Chinese
    "优先级",
    "優先級",
    "重要度",
    "等级",
    "等級",
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
  const s = toStringSafe(v).replace(/\uFF1B/g, ";").replace(/\uFF0C/g, ",").replace(/;/g, ",");
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
    .replace(/\uFF1B/g, ";")
    .replace(/\uFF0C/g, ",")
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
      "測試",
      "测试用例",
      "測試用例",
      "计划",
      "計劃",
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

/**
 * Determine which canonical fields appear to be present in the file headers.
 * We look at *header keys* (not row values) so users can understand mapping issues quickly.
 */
function detectHeaderPresence(rows, { mapping } = {}) {
  const presentKeys = new Set();

  // Add normalized keys seen in headers across rows
  for (const row of rows || []) {
    for (const k of Object.keys(row || {})) {
      const nk = normalizeHeaderKey(k);
      if (nk) presentKeys.add(nk);
    }
  }

  // If user provided explicit mapping overrides, treat those as "present" too (if they exist in keys)
  const mapped = {};
  for (const field of Object.keys(HEADER_ALIASES)) {
    const mk = mapping?.[field] ? normalizeHeaderKey(mapping[field]) : "";
    if (mk) mapped[field] = mk;
  }

  const canonicalFields = Object.keys(HEADER_ALIASES);
  const detected = {};
  const missing = {};

  for (const field of canonicalFields) {
    const aliasKeys = HEADER_ALIASES[field] || [];
    const mappedKey = mapped[field];

    const hit =
      (mappedKey && presentKeys.has(mappedKey) && mappedKey) ||
      aliasKeys.find((k) => presentKeys.has(k)) ||
      (presentKeys.has(normalizeHeaderKey(field)) ? normalizeHeaderKey(field) : "");

    if (hit) detected[field] = hit;
    else missing[field] = aliasKeys.slice(0, 6); // short list for display
  }

  return { presentKeys, detected, missing };
}

function buildRequiredColumnsHelp() {
  // Keep this simple and user-facing; it shows typical headers we can read.
  return [
    "Required columns: Name (用例名称) and Project (项目).",
    "Optional columns: ID (编号), Description/Steps (描述/步骤), Parameters (参数), ExpectedResult (预期结果), Tags (标签), Category (分类), Priority (优先级).",
  ].join(" ");
}

/**
 * Convert one row to a TestCase object (or return a structured invalid result).
 * @returns {{ ok: true, item: any } | { ok: false, reason: string, missing: string[] }}
 */
function rowToTestCaseValidated(row, { defaultProjectId, mapping } = {}) {
  const r = normalizeRowKeys(row);

  const name = strTrim(getFieldValue(r, { field: "name", mapping }));
  const projectId = strTrim(getFieldValue(r, { field: "project", mapping })) || strTrim(defaultProjectId);

  const missing = [];
  if (!name) missing.push("Name");
  if (!projectId) missing.push("Project");

  if (missing.length) {
    return { ok: false, reason: `Missing required value(s): ${missing.join(", ")}`, missing };
  }

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

  return {
    ok: true,
    item: {
      id: externalId ? toStringSafe(externalId) : undefined,
      name,
      projectId,
      description,
      tags: mergedTags,
      parameters,
      usage: { executions: 0, results: 0 },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  };
}

/**
 * Validate the *file-level* presence of required columns/values.
 *
 * Important: We do NOT fail the entire import just because some rows are missing Project.
 * We only throw if we can't find any plausible Name/Project values at all (i.e., header mapping likely wrong),
 * and no defaultProjectId fallback is provided.
 */
function validateFileLevel(rows, { defaultProjectId, mapping } = {}) {
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

  // If we can't find any name at all, we should fail early: likely wrong header.
  if (!hasAnyName) issues.push("Could not find any values for Name (用例名称). Check the header row/aliases.");

  // If no defaultProjectId is provided AND we never see any project values, likely wrong header.
  if (!hasAnyProject) issues.push("Could not find any values for Project (项目/專案/項目/产品线). Check the header row/aliases.");

  return issues;
}

// PUBLIC_INTERFACE
export async function parseTestPlanFile(file, { defaultProjectId, mapping } = {}) {
  /**
   * Parses a CSV/XLSX/JSON TestPlan file into normalized TestCase-like objects.
   *
   * Returns:
   * {
   *   items: TestCase[],
   *   warnings: string[],
   *   summary: {
   *     totalRows, blankRows, importedRows, skippedRows,
   *     skippedMissingProject, skippedMissingName,
   *     missingHeaders: string[],
   *     detectedHeaders: Record<string,string>
   *   }
   * }
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

  rows = Array.isArray(rows) ? rows : [];
  if (rows.length === 0) {
    throw new Error("No rows found in file");
  }

  const totalRowsBefore = rows.length;
  const nonBlankRows = rows.filter((r) => !isRowEmpty(r));
  const blankRows = totalRowsBefore - nonBlankRows.length;

  if (blankRows > 0) warnings.push(`Skipped ${blankRows} blank row(s).`);

  rows = nonBlankRows;

  if (rows.length > MAX_ROWS) {
    warnings.push(`File contains ${rows.length} rows; only the first ${MAX_ROWS} will be imported.`);
    rows = rows.slice(0, MAX_ROWS);
  }

  const headerPresence = detectHeaderPresence(rows, { mapping });
  const requiredHeaderFields = ["name", "project"];
  const missingHeaders = requiredHeaderFields.filter((f) => !headerPresence.detected[f]);

  // Add a helpful header summary note (requested: helpful toast summary listing detected/missing).
  const detectedPairs = Object.entries(headerPresence.detected)
    .filter(([k]) => requiredHeaderFields.includes(k))
    .map(([k, v]) => `${k}→${v}`);
  warnings.push(
    `Detected headers: ${detectedPairs.length ? detectedPairs.join(", ") : "(none)"}; Missing: ${
      missingHeaders.length ? missingHeaders.join(", ") : "(none)"
    }.`
  );

  // File-level validation: avoid false "missing Project" when headers vary.
  // Only fail if we truly can't find any values at all for required fields.
  const fileLevelIssues = validateFileLevel(rows, { defaultProjectId, mapping });
  if (fileLevelIssues.length) {
    const extra = buildRequiredColumnsHelp();
    throw new Error(`${fileLevelIssues.join(" ")} ${extra}`);
  }

  const items = [];
  let skippedRows = 0;
  let skippedMissingProject = 0;
  let skippedMissingName = 0;

  const missingSamples = [];
  const maxSamples = 5;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const res = rowToTestCaseValidated(row, { defaultProjectId, mapping });
    if (!res.ok) {
      skippedRows += 1;
      if (res.missing.includes("Project")) skippedMissingProject += 1;
      if (res.missing.includes("Name")) skippedMissingName += 1;

      // Keep a few examples to help user fix their sheet
      if (missingSamples.length < maxSamples) {
        missingSamples.push(`Row ${i + 2}: ${res.reason}`); // +2: header row is row 1 in spreadsheets
      }
      continue;
    }
    items.push(res.item);
  }

  if (items.length === 0) {
    throw new Error(`No valid test cases found after parsing. ${buildRequiredColumnsHelp()}`);
  }

  if (skippedRows > 0) {
    warnings.push(
      `Skipped ${skippedRows} row(s) missing required values. (Missing Project: ${skippedMissingProject}, Missing Name: ${skippedMissingName})`
    );
    if (missingSamples.length) warnings.push(`Examples: ${missingSamples.join(" | ")}`);
  }

  const summary = {
    totalRows: totalRowsBefore,
    blankRows,
    importedRows: items.length,
    skippedRows,
    skippedMissingProject,
    skippedMissingName,
    detectedHeaders: headerPresence.detected,
    missingHeaders,
  };

  return { items, warnings, summary };
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
