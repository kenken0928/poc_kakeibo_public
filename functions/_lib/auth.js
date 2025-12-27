import { parseCookieHeader } from "./cookies.js";

export function getSessionToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  const parsed = parseCookieHeader(cookie);
  return parsed.session || null;
}

export async function requireSession(context) {
  const token = getSessionToken(context.request);
  if (!token) return { ok: false };

  const raw = await context.env.KAKEIBO_KV.get(`session:${token}`);
  if (!raw) return { ok: false };

  try {
    const session = JSON.parse(raw);
    return { ok: true, token, session };
  } catch {
    return { ok: false };
  }
}
