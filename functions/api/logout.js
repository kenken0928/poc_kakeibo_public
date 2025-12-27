import { jsonResponse } from "../_lib/resp.js";
import { baseHeaders } from "../_lib/cors.js";
import { buildDeleteSessionCookie } from "../_lib/cookies.js";
import { getSessionToken } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const token = getSessionToken(context.request);
  if (token) {
    await context.env.KAKEIBO_KV.delete(`session:${token}`);
  }

  const headers = baseHeaders();
  headers.append("Set-Cookie", buildDeleteSessionCookie());

  return jsonResponse({ ok: true }, { headers });
}
