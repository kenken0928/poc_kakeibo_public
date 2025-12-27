import { jsonResponse } from "../../_lib/resp.js";
import { requireSession } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const s = await requireSession(context);
  if (!s.ok) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  const kv = context.env.KAKEIBO_KV;

  // KVはlistでキー一覧取得できる（ページングあり）
  let cursor = undefined;
  let deletedKeys = 0;

  do {
    const listed = await kv.list({ cursor });
    for (const k of listed.keys) {
      // セッションは残したいなら除外可能だが、要件「全データ一括削除」なので全部消す
      await kv.delete(k.name);
      deletedKeys++;
    }
    cursor = listed.cursor;
    if (!listed.list_complete && cursor) continue;
    break;
  } while (true);

  return jsonResponse({ ok: true, deletedKeys });
}
