import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeParametersList, normalizeTagsFromString } from "../pages/testCasesMockData";

/**
 * Supported mapping targets:
 *  - id?: string
 *  - name: string
 *  - projectId: string
 *  - description?: string
 *  - tags?: string[]
 *  - parameters?: Array<{key,value}>
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

function normalizeHeaderKey(k) {
  return toStringSafe(k)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");
}

function firstNonEmpty(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null) continue;
    const s = toStringSafe(v).trim();
    if (s) return s;
  }
  return "";
}

function parseTagsAny(v) {
  if (Array.isArray(v)) {
    // de-dupe (case-insensitive) while preserving first casing
    const out = [];
    const seen = new Set();
    for (const t of v.map((x) => toStringSafe(x).trim()).filter(Boolean)) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out.slice(0, 12);
  }
  // allow comma/semicolon separated
  const s = toStringSafe(v).replace(/;/g, ",");
  return normalizeTagsFromString(s);
}

function parseParametersAny(v) {
  // Accept:
  // - array of {key,value}
  // - object map {k:v}
  // - string "k=v; a=b" or JSON string
  if (Array.isArray(v)) return normalizeParametersList(v);

  if (v && typeof v === "object") {
    return normalizeParametersList(
      Object.entries(v).map(([key, value]) => ({ key, value: toStringSafe(value) }))
    );
  }

  const raw = toStringSafe(v).trim();
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

  // key=value pairs separated by ; or ,
  const parts = raw
    .split(/[;,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const list = [];
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) {
      list.push({ key: part, value: "" });
    } else {
      list.push({ key: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim() });
    }
  }
  return normalizeParametersList(list);
}

function normalizeRowKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    out[normalizeHeaderKey(k)] = v;
  }
  return out;
}

function rowToTestCase(row, { defaultProjectId } = {}) {
  const r = normalizeRowKeys(row);

  const name = firstNonEmpty(r, ["name", "testcase", "testcasename", "title", "testname", "item", "case"]);
  const projectId =
    firstNonEmpty(r, ["projectid", "project", "projectname", "suite", "plan", "planname"]) ||
    toStringSafe(defaultProjectId || "").trim();

  const description = firstNonEmpty(r, ["description", "desc", "objective", "summary", "steps", "procedure", "details"]);
  const tags = parseTagsAny(firstNonEmpty(r, ["tags", "tag", "labels", "category", "categories"]) || r.tags);
  const parameters = parseParametersAny(
    firstNonEmpty(r, ["parameters", "params", "inputs", "arguments", "args"]) || r.parameters
  );

  const externalId = firstNonEmpty(r, ["id", "testcaseid", "caseid", "tcid", "key", "uid"]);

  // Minimal validation (more handled by caller)
  if (!name || !projectId) return null;

  return {
    id: externalId ? toStringSafe(externalId) : undefined,
    name: toStringSafe(name).trim(),
    projectId: toStringSafe(projectId).trim(),
    description: toStringSafe(description).trim(),
    tags,
    parameters,
    usage: { executions: 0, results: 0 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function parseCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first.message || "Invalid CSV"}`);
  }
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows;
}

function parseXlsx(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) throw new Error("XLSX file has no sheets");
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return Array.isArray(rows) ? rows : [];
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

// PUBLIC_INTERFACE
export async function parseTestPlanFile(file, { defaultProjectId } = {}) {
  /**
   * Parses a CSV/XLSX/JSON TestPlan file into normalized TestCase-like objects.
   * Returns { items, warnings } where warnings are user-displayable strings.
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

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No rows found in file");
  }

  if (rows.length > MAX_ROWS) {
    warnings.push(`File contains ${rows.length} rows; only the first ${MAX_ROWS} will be imported.`);
    rows = rows.slice(0, MAX_ROWS);
  }

  const items = [];
  let dropped = 0;

  for (const row of rows) {
    const tc = rowToTestCase(row, { defaultProjectId });
    if (!tc) {
      dropped += 1;
      continue;
    }
    items.push(tc);
  }

  if (items.length === 0) {
    throw new Error("No valid test cases found. Ensure each row has at least a name and a project/projectId.");
  }

  if (dropped > 0) warnings.push(`${dropped} row(s) were skipped due to missing required fields (name/project).`);

  return { items, warnings };
}

// PUBLIC_INTERFACE
export function stableTestCaseKey(testCase) {
  /** Stable de-duplication key: name + projectId (case-insensitive). */
  const name = toStringSafe(testCase?.name).trim().toLowerCase();
  const projectId = toStringSafe(testCase?.projectId).trim().toLowerCase();
  return `${projectId}::${name}`;
}
