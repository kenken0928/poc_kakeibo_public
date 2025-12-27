import { jsonResponse, readJson } from "../_lib/resp.js";
import { requireSession } from "../_lib/auth.js";
import { kvGetJson, kvPutJson, newId, toMonth } from "../_lib/kv.js";

async function getMonthIds(kv, month) {
  return await kvGetJson(kv, `month:${month}`, []);
}
async function setMonthIds(kv, month, ids) {
  await kvPutJson(kv, `month:${month}`, ids);
}
async function getMonths(kv) {
  return await kvGetJson(kv, "months", []);
}
async function setMonths(kv, months) {
  await kvPutJson(kv, "months", months);
}

async function addMonthIfNeeded(kv, month) {
  const months = await getMonths(kv);
  if (!months.includes(month)) {
    months.push(month);
    months.sort();
    await setMonths(kv, months);
  }
}

async function removeMonthIfEmpty(kv, month) {
  const ids = await getMonthIds(kv, month);
  if (ids.length > 0) return;
  await kv.delete(`month:${month}`);
  const months = await getMonths(kv);
  const next = months.filter((m) => m !== month);
  await setMonths(kv, next);
}

function sortByDateDesc(a, b) {
  // date: YYYY-MM-DD
  if (a.date === b.date) return (b.createdAt || 0) - (a.createdAt || 0);
  return a.date < b.date ? 1 : -1;
}

export async function onRequestGet(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const url = new URL(context.request.url);
  const month = url.searchParams.get("month") || "";
  const limit = Number(url.searchParams.get("limit") || "500");

  if (!month) return jsonResponse({ error: "month is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const ids = await getMonthIds(kv, month);

  const items = [];
  for (const id of ids) {
    const raw = await kv.get(`expense:${id}`);
    if (!raw) continue;
    try {
      items.push(JSON.parse(raw));
    } catch {}
  }

  items.sort(sortByDateDesc);
  const sliced = items.slice(0, Math.max(0, Math.min(limit, 2000)));
  return jsonResponse(sliced);
}

export async function onRequestPost(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(context.request);
  const date = String(body?.date || "").slice(0, 10);
  const item = (body?.item ?? "").trim();
  const category = (body?.category ?? "").trim();
  const amount = Number(body?.amount);

  if (!date || !item || !category || !Number.isFinite(amount) || amount < 0) {
    return jsonResponse({ error: "invalid input" }, { status: 400 });
  }

  const kv = context.env.KAKEIBO_KV;
  const id = newId();
  const month = toMonth(date);

  const expense = {
    id,
    date,
    month,
    item,
    category,
    amount: Math.floor(amount),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await kvPutJson(kv, `expense:${id}`, expense);

  const ids = await getMonthIds(kv, month);
  ids.push(id);
  await setMonthIds(kv, month, ids);
  await addMonthIfNeeded(kv, month);

  return jsonResponse({ ok: true, id });
}

export async function onRequestPut(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "id is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const raw = await kv.get(`expense:${id}`);
  if (!raw) return jsonResponse({ error: "not found" }, { status: 404 });

  let prev;
  try {
    prev = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: "corrupted data" }, { status: 500 });
  }

  const body = await readJson(context.request);
  const date = String(body?.date || "").slice(0, 10);
  const item = (body?.item ?? "").trim();
  const category = (body?.category ?? "").trim();
  const amount = Number(body?.amount);

  if (!date || !item || !category || !Number.isFinite(amount) || amount < 0) {
    return jsonResponse({ error: "invalid input" }, { status: 400 });
  }

  const nextMonth = toMonth(date);
  const prevMonth = prev.month;

  const next = {
    ...prev,
    date,
    month: nextMonth,
    item,
    category,
    amount: Math.floor(amount),
    updatedAt: Date.now(),
  };

  await kvPutJson(kv, `expense:${id}`, next);

  // 月が変わった場合はインデックス移動
  if (prevMonth !== nextMonth) {
    const prevIds = await getMonthIds(kv, prevMonth);
    const nextIds = await getMonthIds(kv, nextMonth);

    await setMonthIds(kv, prevMonth, prevIds.filter((x) => x !== id));
    nextIds.push(id);
    await setMonthIds(kv, nextMonth, nextIds);
    await addMonthIfNeeded(kv, nextMonth);
    await removeMonthIfEmpty(kv, prevMonth);
  }

  return jsonResponse({ ok: true });
}

export async function onRequestDelete(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "id is required" }, { status: 400 });

  const kv = context.env.KAKEIBO_KV;
  const raw = await kv.get(`expense:${id}`);
  if (!raw) return jsonResponse({ error: "not found" }, { status: 404 });

  let prev;
  try {
    prev = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: "corrupted data" }, { status: 500 });
  }

  await kv.delete(`expense:${id}`);

  const month = prev.month;
  const ids = await getMonthIds(kv, month);
  await setMonthIds(kv, month, ids.filter((x) => x !== id));
  await removeMonthIfEmpty(kv, month);

  return jsonResponse({ ok: true });
}
