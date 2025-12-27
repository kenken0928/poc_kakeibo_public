import { jsonResponse } from "../_lib/resp.js";
import { requireSession } from "../_lib/auth.js";
import { baseHeaders } from "../_lib/cors.js";

export async function onRequestGet(context) {
  const headers = baseHeaders();

  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401, headers });

  return jsonResponse({ user: s.session.user }, { status: 200, headers });
}
