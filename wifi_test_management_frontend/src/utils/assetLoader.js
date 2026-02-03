/**
 * Utilities for loading project assets (binary files) via URL in the browser.
 * Intended for mock-mode workflows that import files from a user-provided asset URL.
 */

function stripQueryAndHash(url) {
  const s = String(url || "");
  const q = s.indexOf("?");
  const h = s.indexOf("#");
  const cut = Math.min(q === -1 ? s.length : q, h === -1 ? s.length : h);
  return s.slice(0, cut);
}

function inferExtensionFromUrl(url) {
  const clean = stripQueryAndHash(url).toLowerCase();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return "";
  return clean.slice(lastDot + 1);
}

function contentTypeLooksLikeExcel(contentType) {
  const ct = String(contentType || "").toLowerCase();
  return (
    ct.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    ct.includes("application/vnd.ms-excel")
  );
}

// PUBLIC_INTERFACE
export async function fetchArrayBufferFromUrl(url, { timeoutMs = 20000 } = {}) {
  /**
   * Fetch a URL and return { arrayBuffer, contentType, fileNameHint, extensionHint }.
   *
   * Notes:
   * - Uses standard fetch; if the server blocks CORS, the browser will throw a TypeError.
   * - Provides a user-friendly error message for common failure cases.
   */
  const assetUrl = String(url || "").trim();
  if (!assetUrl) throw new Error("Provide an asset URL to load.");

  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(assetUrl, { method: "GET", signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch asset (${res.status}). Ensure the URL is accessible.`);
    }

    const contentType = res.headers.get("content-type") || "";
    const cd = res.headers.get("content-disposition") || "";

    // Best-effort filename hint from content-disposition
    const fileNameHint =
      /filename\*=UTF-8''([^;]+)/i.test(cd)
        ? decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || "")
        : /filename="([^"]+)"/i.test(cd)
          ? cd.match(/filename="([^"]+)"/i)?.[1] || ""
          : "";

    const arrayBuffer = await res.arrayBuffer();

    const extensionHint = inferExtensionFromUrl(assetUrl) || (contentTypeLooksLikeExcel(contentType) ? "xlsx" : "");

    return { arrayBuffer, contentType, fileNameHint, extensionHint };
  } catch (e) {
    // fetch() throws TypeError for CORS/network failures
    const isAbort = e?.name === "AbortError";
    const isType = e instanceof TypeError;

    if (isAbort) {
      throw new Error("Asset fetch timed out. Verify the URL and try again.");
    }

    if (isType) {
      throw new Error(
        "Unable to fetch asset. This is often caused by CORS restrictions or a private URL. " +
          "Try using a URL that is publicly accessible from the browser, or download the file and use “Import TestPlan”."
      );
    }

    throw new Error(e?.message || "Unable to fetch asset URL.");
  } finally {
    window.clearTimeout(t);
  }
}

export function __private_inferExtensionFromUrlForTests(url) {
  return inferExtensionFromUrl(url);
}
