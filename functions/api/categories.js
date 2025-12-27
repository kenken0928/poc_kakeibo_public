import { jsonResponse, readJson } from "../_lib/resp.js";
import { requireSession } from "../_lib/auth.js";
import { ensureDefaultCategories, kvGetJson, kvPutJson } from "../_lib/kv.js";

async function getCats(kv) {
  await ensureDefaultCategories(kv);
  return await kvGetJson(kv, "categories", []);
}

export async function onRequestGet(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const cats = await getCats(context.env.KAKEIBO_KV);
  return jsonResponse(cats);
}

export async function onRequestPost(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(context.request);
  const name = (body?.name ?? "").trim();
  if (!name) return jsonResponse({ error: "name is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const cats = await getCats(kv);
  if (cats.includes(name)) return jsonResponse({ error: "already exists" }, { status: 409 });

  cats.push(name);
  await kvPutJson(kv, "categories", cats);
  return jsonResponse({ ok: true });
}

export async function onRequestPut(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(context.request);
  const oldName = (body?.oldName ?? "").trim();
  const newName = (body?.newName ?? "").trim();
  if (!oldName || !newName) return jsonResponse({ error: "oldName/newName required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const cats = await getCats(kv);
  const idx = cats.indexOf(oldName);
  if (idx === -1) return jsonResponse({ error: "not found" }, { status: 404 });
  if (cats.includes(newName)) return jsonResponse({ error: "newName already exists" }, { status: 409 });

  cats[idx] = newName;
  await kvPutJson(kv, "categories", cats);

  // 既存明細の category 置換（全キー走査。PoCとして許容）
  // 本番なら別途インデックスやマイグレーションを考える。
  let cursor = undefined;
  do {
    const listed = await kv.list({ prefix: "expense:", cursor });
    for (const k of listed.keys) {
      const raw = await kv.get(k.name);
      if (!raw) continue;
      try {
        const e = JSON.parse(raw);
        if (e.category === oldName) {
          e.category = newName;
          await kvPutJson(kv, k.name, e);
        }
      } catch {}
    }
    cursor = listed.cursor;
    if (!listed.list_complete && cursor) continue;
    break;
  } while (true);

  return jsonResponse({ ok: true });
}

export async function onRequestDelete(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(context.request);
  const name = (body?.name ?? "").trim();
  if (!name) return jsonResponse({ error: "name is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const cats = await getCats(kv);
  const next = cats.filter((c) => c !== name);
  if (next.length === cats.length) return jsonResponse({ error: "not found" }, { status: 404 });

  await kvPutJson(kv, "categories", next);
  return jsonResponse({ ok: true });
}
