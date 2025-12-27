// KVヘルパー（JSONのget/put、初期データの用意）

export async function kvGetJson(kv, key, fallback = null) {
  const raw = await kv.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function kvPutJson(kv, key, value, options) {
  await kv.put(key, JSON.stringify(value), options);
}

export function newId() {
  // 依存なしの簡易ID（UUIDほど強くはないがPoCとして十分）
  // 例: 1700000000000-4f8c1b2a9d3e
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

export function toMonth(dateISO) {
  return String(dateISO).slice(0, 7);
}

export async function ensureDefaultCategories(kv) {
  const key = "categories";
  const existing = await kv.get(key);
  if (existing) return;

  const defaults = ["食費", "日用品", "交通費", "家賃", "光熱費", "通信費", "娯楽", "医療", "交際費", "その他"];
  await kv.put(key, JSON.stringify(defaults));
}
