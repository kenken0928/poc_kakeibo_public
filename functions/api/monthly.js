import { jsonResponse } from "../_lib/resp.js";
import { requireSession } from "../_lib/auth.js";
import { kvGetJson } from "../_lib/kv.js";

export async function onRequestGet(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const url = new URL(context.request.url);
  const month = url.searchParams.get("month") || "";
  if (!month) return jsonResponse({ error: "month is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;

  const ids = await kvGetJson(kv, `month:${month}`, []);
  const items = [];
  for (const id of ids) {
    const raw = await kv.get(`expense:${id}`);
    if (!raw) continue;
    try {
      items.push(JSON.parse(raw));
    } catch {}
  }

  // 集計
  const byCategory = {};
  let total = 0;
  for (const e of items) {
    const amt = Number(e.amount || 0);
    total += amt;
    const k = e.category || "未分類";
    byCategory[k] = (byCategory[k] || 0) + amt;
  }

  return jsonResponse({
    month,
    total,
    byCategory,
    count: items.length,
  });
}
