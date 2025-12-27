import { jsonResponse, readJson } from "../../_lib/resp.js";
import { requireSession } from "../../_lib/auth.js";
import { kvGetJson, kvPutJson } from "../../_lib/kv.js";

export async function onRequestPost(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(context.request);
  const month = (body?.month ?? "").trim();
  if (!month) return jsonResponse({ error: "month is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;

  const ids = await kvGetJson(kv, `month:${month}`, []);
  let deleted = 0;
  for (const id of ids) {
    await kv.delete(`expense:${id}`);
    deleted++;
  }

  await kv.delete(`month:${month}`);

  // months から除去
  const months = await kvGetJson(kv, "months", []);
  const next = months.filter((m) => m !== month);
  await kvPutJson(kv, "months", next);

  return jsonResponse({ ok: true, deleted });
}
