/**
 * Headers を壊さずに返すためのレスポンスヘルパー
 * - Headers を object 展開して潰さない
 * - Set-Cookie を append できる形で維持
 */
export function jsonResponse(data, { status = 200, headers } = {}) {
  const h = headers instanceof Headers ? headers : new Headers(headers || {});
  if (!h.has("Content-Type")) h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function textResponse(text, { status = 200, headers } = {}) {
  const h = headers instanceof Headers ? headers : new Headers(headers || {});
  if (!h.has("Content-Type")) h.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(text, { status, headers: h });
}

export async function readJson(request) {
  const ct = request.headers.get("Content-Type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
