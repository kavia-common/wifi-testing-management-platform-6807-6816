import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeParametersList, normalizeTagsFromString } from "../pages/testCasesMockData";

/**
 * Parser for TestPlan imports (CSV/XLSX/JSON) that normalizes rows into the app TestCase shape.
 *
 * Key goals:
 * - Robust XLSX parsing (sheet selection heuristics, multi-row / merged headers, empty row handling).
 * - Header normalization + tolerant mapping for common WiFi test plan columns (including localized headers).
 * - Clear, actionable guidance when required fields are missing.
 * - Row-level validation: skip blank rows; skip invalid rows but still import valid ones.
 *
 * IMPORTANT:
 * - When required columns (Name/Project) cannot be auto-detected, this parser can return a structured
 *   response indicating that interactive mapping is needed (instead of throwing), so UI can present
 *   a manual mapping dialog and re-run parsing with the chosen mapping.
 */

/** Max rows to import for safety (avoid locking UI on huge files). */
const MAX_ROWS = 2000;

/** localStorage key used by UI; parser accepts it as an override when passed in. */
export const TESTPLAN_MAPPING_STORAGE_KEY = "wifi.testplan.mapping";

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
 * Normalize header into a tolerant comparison key:
 * - Trim
 * - Case-insensitive for English
 * - Remove BOM and zero-width characters
 * - Fullwidth -> halfwidth for ASCII-ish characters
 * - Remove whitespace and common punctuation
 * - Remove brackets/parentheses ()（）[]【】{}<>
 * - Remove slashes and hyphens (and similar separators)
 *
 * Notes:
 * - For CJK, we keep the characters but strip punctuation surrounding them.
 */
function normalizeHeaderKey(k) {
  return toHalfWidthAscii(toStringSafe(k))
    .replace(/^\uFEFF/, "") // BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars (defensive)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(
      /[._\-—–·•,:;，；、/\\|'"“”‘’`~!@#$%^&*+=?<>]/g,
      ""
    )
    .replace(/[()（）[\]【】{}《》]/g, "");
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

function firstNonEmpty(obj, keys, { treatNAAsEmpty = false } = {}) {
  for (const k of keys) {
    const v = obj?.[k];
    const s = strTrim(v);
    if (!s) continue;

    if (treatNAAsEmpty) {
      const t = s.trim().toLowerCase();
      if (t === "n/a" || t === "na" || t === "-" || t === "--") continue;
    }

    return s;
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

    // Exact/common WiFi Function TestPlan variants (as seen in user templates)
    "Test Item",
    "Test Item Name",
    "Test Case Name",

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
   * Project column is often inconsistent across orgs.
   * Expanded per user request to include many variants and tolerate punctuation/whitespace/brackets.
   */
  project: [
    // Existing-ish
    "projectid",
    "project",
    "projectname",
    "project name",
    "suite",
    "plan",
    "planname",

    // Requested aliases (including CJK)
    "项目",
    "專案",
    "項目",
    "产品线",
    "產品線",
    "Project",
    "Project Name",
    "Project/项目",
    "Project（项目）",
    "專案名稱",
    "项目名称",
    "Test Project",
    "Product Line",
    "产品線",
    "Proj",
    "專案/Project",
    "Project_name",

    // Extra common combined variants still seen in older templates
    "Project/Project Name",
    "Project / Project Name",
    "Project（Project Name）",
    "Project(Project Name)",

    // Other CN variants previously supported
    "所属项目",
    "工程",
    "工程名称",
    "产品",
    "产品名称",
    "產品",
    "產品名稱",
    "產品線",
    "專案名稱",
    "項目名稱",
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
 * Expand merged header cells (XLSX only) by propagating the merged top-left value
 * across all covered cells in the merge range.
 */
function applyMergesToAoaHeaders(aoa, merges) {
  if (!Array.isArray(aoa) || !Array.isArray(merges) || merges.length === 0) return aoa;

  const out = aoa.map((r) => (Array.isArray(r) ? [...r] : []));
  for (const m of merges) {
    const s = m?.s;
    const e = m?.e;
    if (!s || !e) continue;

    const v = out?.[s.r]?.[s.c];
    if (v == null || strTrim(v) === "") continue;

    for (let r = s.r; r <= e.r; r += 1) {
      if (!out[r]) out[r] = [];
      for (let c = s.c; c <= e.c; c += 1) {
        if (out[r][c] == null || strTrim(out[r][c]) === "") {
          out[r][c] = v;
        }
      }
    }
  }
  return out;
}

function rowLooksLikeHeaderFragment(row) {
  if (!Array.isArray(row)) return false;
  const nonEmpty = row.map((c) => strTrim(c)).filter(Boolean);
  if (nonEmpty.length === 0) return false;

  // Heuristic: header rows typically have short-ish tokens, not long sentences.
  const avgLen =
    nonEmpty.reduce((sum, s) => sum + String(s).length, 0) / Math.max(1, nonEmpty.length);

  return avgLen <= 28;
}

function concatVerticalHeaderFragments(headerRows, colCount) {
  const headers = [];
  for (let c = 0; c < colCount; c += 1) {
    const parts = [];
    for (const r of headerRows) {
      const v = strTrim(r?.[c]);
      if (v) parts.push(v);
    }
    headers[c] = parts.join("");
  }
  return headers;
}

function aoaToObjects(aoa, headers, startRowIdx) {
  const out = [];
  for (let r = startRowIdx; r < aoa.length; r += 1) {
    const row = aoa[r];
    if (!Array.isArray(row)) continue;

    const obj = {};
    for (let c = 0; c < headers.length; c += 1) {
      const h = headers[c] != null ? String(headers[c]) : "";
      if (!h) continue;
      obj[h] = row[c] == null ? "" : row[c];
    }
    out.push(obj);
  }
  return out;
}

/**
 * Determine which canonical fields appear to be present in the file headers.
 * We look at *header keys* (not row values) so users can understand mapping issues quickly.
 */
function detectHeaderPresenceFromHeaderList(headerList, { mapping } = {}) {
  const presentKeys = new Set((headerList || []).map((h) => normalizeHeaderKey(h)).filter(Boolean));

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
    else missing[field] = aliasKeys.slice(0, 10); // short list for display
  }

  return { presentKeys, detected, missing };
}

function detectHeaderPresence(rows, { mapping } = {}) {
  const presentKeys = new Set();

  // Add normalized keys seen in headers across rows
  for (const row of rows || []) {
    for (const k of Object.keys(row || {})) {
      const nk = normalizeHeaderKey(k);
      if (nk) presentKeys.add(nk);
    }
  }

  const canonicalFields = Object.keys(HEADER_ALIASES);
  const detected = {};
  const missing = {};

  for (const field of canonicalFields) {
    const mk = mapping?.[field] ? normalizeHeaderKey(mapping[field]) : "";
    const aliasKeys = HEADER_ALIASES[field] || [];

    const hit =
      (mk && presentKeys.has(mk) && mk) ||
      aliasKeys.find((k) => presentKeys.has(k)) ||
      (presentKeys.has(normalizeHeaderKey(field)) ? normalizeHeaderKey(field) : "");

    if (hit) detected[field] = hit;
    else missing[field] = aliasKeys.slice(0, 10);
  }

  return { presentKeys, detected, missing };
}

function buildRequiredColumnsHelp() {
  return [
    "Required columns: Name (用例名称) and Project (项目/專案/項目/产品线).",
    "If your sheet uses a two-row header (e.g., Project + (项目)) or merged header cells, import should still work.",
    "If auto-detection fails, use the column mapping dialog to select the correct columns.",
  ].join(" ");
}

/**
 * Attempt to find a field value by trying:
 * - explicit mapping overrides
 * - alias list matching
 * - direct key match
 */
function getFieldValue(normalizedRow, { field, mapping, treatNAAsEmpty = false }) {
  const mappingKey = mapping?.[field] ? normalizeHeaderKey(mapping[field]) : "";
  if (mappingKey && mappingKey in normalizedRow) return normalizedRow[mappingKey];

  const aliases = HEADER_ALIASES[field] || [];
  const hit = firstNonEmpty(normalizedRow, aliases, { treatNAAsEmpty });
  if (hit) return hit;

  // Also accept direct normalized field name if present.
  const directRaw = normalizedRow?.[normalizeHeaderKey(field)];
  const direct = strTrim(directRaw);
  if (direct) {
    if (treatNAAsEmpty) {
      const t = direct.trim().toLowerCase();
      if (t === "n/a" || t === "na" || t === "-" || t === "--") return "";
    }
    return direct;
  }

  return "";
}

/**
 * Convert one row to a TestCase object (or return a structured invalid result).
 * @returns {{ ok: true, item: any } | { ok: false, reason: string, missing: string[] }}
 */
function rowToTestCaseValidated(row, { defaultProjectId, mapping, projectConstant, treatNAAsEmpty = false } = {}) {
  const r = normalizeRowKeys(row);

  const name = strTrim(getFieldValue(r, { field: "name", mapping, treatNAAsEmpty }));
  const projectFromRow = strTrim(getFieldValue(r, { field: "project", mapping, treatNAAsEmpty }));
  const projectId = projectFromRow || strTrim(projectConstant) || strTrim(defaultProjectId);

  const missing = [];
  if (!name) missing.push("Name");
  if (!projectId) missing.push("Project");

  if (missing.length) {
    return { ok: false, reason: `Missing required value(s): ${missing.join(", ")}`, missing };
  }

  const externalId = strTrim(getFieldValue(r, { field: "id", mapping, treatNAAsEmpty }));

  const descriptionBase =
    strTrim(getFieldValue(r, { field: "description", mapping })) ||
    strTrim(firstNonEmpty(r, ["steps", "procedure", "teststeps"].map(normalizeHeaderKey)));

  const expectedResult = strTrim(getFieldValue(r, { field: "expectedResult", mapping }));
  const description = expectedResult
    ? `${descriptionBase}${descriptionBase ? "\n\n" : ""}Expected: ${expectedResult}`
    : descriptionBase;

  const tagsRaw = getFieldValue(r, { field: "tags", mapping }) || r.tags;
  const tags = parseTagsAny(tagsRaw);

  // Category / priority: add as tags so we don't lose info
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

function getHeaderCandidates(rows) {
  const seen = new Map(); // normalizedKey -> original header string
  for (const row of rows || []) {
    for (const k of Object.keys(row || {})) {
      const nk = normalizeHeaderKey(k);
      if (!nk) continue;
      if (!seen.has(nk)) seen.set(nk, String(k));
    }
  }
  return Array.from(seen.values());
}

function validateFileLevel(rows, { defaultProjectId, mapping, projectConstant } = {}) {
  const issues = [];
  let hasAnyName = false;
  let hasAnyProject = Boolean(strTrim(projectConstant)) || Boolean(strTrim(defaultProjectId));

  for (const row of rows) {
    const r = normalizeRowKeys(row);
    const name = strTrim(getFieldValue(r, { field: "name", mapping }));
    const project = strTrim(getFieldValue(r, { field: "project", mapping }));

    if (name) hasAnyName = true;
    if (project) hasAnyProject = true;

    if (hasAnyName && hasAnyProject) break;
  }

  if (!hasAnyName) issues.push("Could not find any values for Name (用例名称). Check the header row/aliases.");
  if (!hasAnyProject) issues.push("Could not find any values for Project (项目/專案/項目/产品线). Check the header row/aliases.");

  return issues;
}

/**
 * Decide whether a sheet seems to contain required columns by scanning its first few header rows
 * and looking for any alias tokens for required fields.
 */
function sheetHasAnyRequiredAlias(sheet) {
  const aoaRaw = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  const merges = sheet?.["!merges"] || [];
  const aoa = applyMergesToAoaHeaders(aoaRaw, merges);

  const firstRows = (aoa || []).slice(0, 3);
  const flattened = firstRows.flatMap((r) => (Array.isArray(r) ? r : [])).map((c) => normalizeHeaderKey(c));

  const requiredAliases = new Set([...(HEADER_ALIASES.name || []), ...(HEADER_ALIASES.project || [])]);
  return flattened.some((k) => requiredAliases.has(k));
}

/**
 * Choose a sheet:
 * - If multiple sheets exist, prefer the first sheet that contains any required alias token in its top header area.
 * - Otherwise fall back to first sheet.
 */
function chooseBestSheet(workbook) {
  const names = workbook.SheetNames || [];
  if (!names.length) return "";

  if (names.length > 1) {
    for (const name of names) {
      const sheet = workbook.Sheets?.[name];
      if (!sheet) continue;
      if (sheetHasAnyRequiredAlias(sheet)) return name;
    }
  }

  return names[0];
}

/**
 * Parse XLSX with support for:
 * - merged header cells (!merges)
 * - multi-row header fragments (top 2-3 rows) concatenated per column
 */
function parseXlsx(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

  const sheetName = chooseBestSheet(workbook);
  if (!sheetName) throw new Error("XLSX file has no sheets");

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("Unable to read XLSX sheet");

  const aoaRaw = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  const merges = sheet?.["!merges"] || [];
  const aoa = applyMergesToAoaHeaders(aoaRaw, merges);

  const firstRows = (aoa || []).slice(0, 3);
  const candidateHeaderRows = [];

  for (let i = 0; i < firstRows.length; i += 1) {
    const row = firstRows[i];
    if (!Array.isArray(row)) continue;
    if (rowLooksLikeHeaderFragment(row)) candidateHeaderRows.push(row);
    else break;
  }

  const headerRowCount = Math.min(Math.max(candidateHeaderRows.length, 1), 3);
  const headerRows = (aoa || []).slice(0, headerRowCount);

  const colCount = Math.max(
    0,
    ...(headerRows || []).map((r) => (Array.isArray(r) ? r.length : 0))
  );

  const headers =
    headerRowCount > 1 ? concatVerticalHeaderFragments(headerRows, colCount) : (headerRows?.[0] || []).slice(0, colCount);

  let rows = aoaToObjects(aoa || [], headers, headerRowCount);

  // Remove fully empty rows
  rows = (Array.isArray(rows) ? rows : []).filter((r) => !isRowEmpty(r));

  return rows;
}

// PUBLIC_INTERFACE
export async function parseTestPlanFile(
  file,
  {
    defaultProjectId,
    mapping,
    allowInteractiveMapping = true,
    projectConstant = "",
    treatNAAsEmpty = false,
  } = {}
) {
  /**
   * Parses a CSV/XLSX/JSON TestPlan file into normalized TestCase-like objects.
   *
   * Returns one of:
   *
   * 1) Success:
   * {
   *   ok: true,
   *   items: TestCase[],
   *   warnings: string[],
   *   summary: {...},
   * }
   *
   * 2) Needs mapping (no throw; UI should show mapping modal and re-run with mapping):
   * {
   *   ok: false,
   *   needsMapping: true,
   *   message: string,
   *   warnings: string[],
   *   summary: {
   *     detectedHeaders,
   *     missingHeaders,
   *     candidateHeaders: string[],
   *   }
   * }
   *
   * Options:
   * - defaultProjectId: if provided, rows missing Project can still import (projectId fallback).
   * - mapping: optional mapping overrides, e.g. { name: "用例名称", project: "项目" }
   * - allowInteractiveMapping: when true and required headers are missing, return needsMapping payload.
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

  // Add a helpful header summary note
  const detectedPairs = Object.entries(headerPresence.detected)
    .filter(([k]) => requiredHeaderFields.includes(k))
    .map(([k, v]) => `${k}→${v}`);

  warnings.push(
    `Detected required headers: ${detectedPairs.length ? detectedPairs.join(", ") : "(none)"}; Missing: ${
      missingHeaders.length ? missingHeaders.join(", ") : "(none)"
    }.`
  );

  // If we are missing required headers, prefer returning candidates for interactive mapping.
  if (missingHeaders.length > 0 && allowInteractiveMapping) {
    const candidates = getHeaderCandidates(rows);
    return {
      ok: false,
      needsMapping: true,
      message:
        `Missing required column header(s): ${missingHeaders.join(", ")}. ` +
        "You can manually choose which columns map to Name/Project and re-run import.",
      warnings,
      summary: {
        totalRows: totalRowsBefore,
        blankRows,
        importedRows: 0,
        skippedRows: 0,
        skippedMissingProject: 0,
        skippedMissingName: 0,
        detectedHeaders: headerPresence.detected,
        missingHeaders,
        candidateHeaders: candidates,
      },
    };
  }

  // File-level validation: only fail if we truly can't find any values at all for required fields.
  const fileLevelIssues = validateFileLevel(rows, { defaultProjectId, mapping, projectConstant });
  if (fileLevelIssues.length) {
    const extra = buildRequiredColumnsHelp();
    const msg = `${fileLevelIssues.join(" ")} ${extra}`;

    // If mapping is allowed, provide candidates as well (users often have correct data but odd headers).
    if (allowInteractiveMapping) {
      const candidates = getHeaderCandidates(rows);
      return {
        ok: false,
        needsMapping: true,
        message: msg,
        warnings,
        summary: {
          totalRows: totalRowsBefore,
          blankRows,
          importedRows: 0,
          skippedRows: 0,
          skippedMissingProject: 0,
          skippedMissingName: 0,
          detectedHeaders: headerPresence.detected,
          missingHeaders: requiredHeaderFields,
          candidateHeaders: candidates,
        },
      };
    }

    throw new Error(msg);
  }

  const items = [];
  let skippedRows = 0;
  let skippedMissingProject = 0;
  let skippedMissingName = 0;

  const missingSamples = [];
  const maxSamples = 5;

  // Track whether project header exists but values are mostly blank (common with merged/misaligned columns)
  let rowsWithAnyName = 0;
  let rowsWithProjectValue = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];

    const normalized = normalizeRowKeys(row);
    const nameProbe = strTrim(getFieldValue(normalized, { field: "name", mapping, treatNAAsEmpty }));
    const projectProbe = strTrim(getFieldValue(normalized, { field: "project", mapping, treatNAAsEmpty }));

    if (nameProbe) rowsWithAnyName += 1;
    if (projectProbe) rowsWithProjectValue += 1;

    const res = rowToTestCaseValidated(row, {
      defaultProjectId,
      mapping,
      projectConstant,
      treatNAAsEmpty,
    });

    if (!res.ok) {
      skippedRows += 1;
      if (res.missing.includes("Project")) skippedMissingProject += 1;
      if (res.missing.includes("Name")) skippedMissingName += 1;

      if (missingSamples.length < maxSamples) {
        missingSamples.push(`Row ${i + 2}: ${res.reason}`); // +2: header row is row 1 in spreadsheets
      }
      continue;
    }
    items.push(res.item);
  }

  // If we detected a project header but very few rows have project values, guide user to mapping/constant.
  // This addresses cases where the header exists (so auto-detection reports OK) but column values are blank
  // because of merged header cells or the real Project column is elsewhere.
  const projectHeaderDetected = Boolean(headerPresence?.detected?.project);
  const effectiveHasFallback = Boolean(strTrim(projectConstant)) || Boolean(strTrim(defaultProjectId));
  const projectCoverage = rowsWithAnyName > 0 ? rowsWithProjectValue / rowsWithAnyName : 0;

  if (
    allowInteractiveMapping &&
    projectHeaderDetected &&
    !effectiveHasFallback &&
    rowsWithAnyName >= 3 &&
    projectCoverage <= 0.15
  ) {
    const candidates = getHeaderCandidates(rows);
    return {
      ok: false,
      needsMapping: true,
      message:
        "Project header was detected, but most rows have blank Project values. " +
        "This often happens with merged cells or misaligned columns. Please select the correct Project column or set a constant Project.",
      warnings,
      summary: {
        totalRows: totalRowsBefore,
        blankRows,
        importedRows: 0,
        skippedRows: 0,
        skippedMissingProject: 0,
        skippedMissingName: 0,
        detectedHeaders: headerPresence.detected,
        missingHeaders: [],
        candidateHeaders: candidates,
      },
    };
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

  return { ok: true, items, warnings, summary };
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

// PUBLIC_INTERFACE
export function __private_applyMergesToAoaHeadersForTests(aoa, merges) {
  /**
   * Exposed for unit tests only (merged header propagation).
   */
  return applyMergesToAoaHeaders(aoa, merges);
}

// PUBLIC_INTERFACE
export function __private_concatVerticalHeaderFragmentsForTests(headerRows, colCount) {
  /**
   * Exposed for unit tests only (multi-row header concatenation).
   */
  return concatVerticalHeaderFragments(headerRows, colCount);
}
