import { jsonResponse, readJson } from "../_lib/resp.js";
import { baseHeaders } from "../_lib/cors.js";
import { buildSessionCookie } from "../_lib/cookies.js";
import { ensureDefaultCategories, kvPutJson } from "../_lib/kv.js";

// 環境変数から取得（コードに秘密情報を置かない）
function getCredentials(env) {
  const id = env?.FIXED_LOGIN_ID;
  const pass = env?.FIXED_LOGIN_PASS;
  return { id, pass };
}

const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7日

function randomToken() {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // フォールバック（開発用）
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random()
    .toString(16)
    .slice(2)}`;
}

export async function onRequestPost(context) {
  const { id: FIXED_ID, pass: FIXED_PASS } = getCredentials(context.env);

  // サーバー設定不備の検出（事故防止）
  if (!FIXED_ID || !FIXED_PASS) {
    return jsonResponse(
      { error: "login is not configured on server" },
      { status: 500 }
    );
  }

  const body = await readJson(context.request);
  const id = body?.id ?? "";
  const pass = body?.pass ?? "";

  if (id !== FIXED_ID || pass !== FIXED_PASS) {
    return jsonResponse(
      { error: "IDまたはPasswordが違います" },
      { status: 401 }
    );
  }

  // 初期分類がなければ作成
  await ensureDefaultCategories(context.env.KAKEIBO_KV);

  const token = randomToken();
  const now = Date.now();

  const session = {
    user: FIXED_ID,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SEC * 1000,
  };

  // KVへ保存（TTL付き）
  await kvPutJson(
    context.env.KAKEIBO_KV,
    `session:${token}`,
    session,
    { expirationTtl: SESSION_TTL_SEC }
  );

  const headers = baseHeaders();
  headers.append(
    "Set-Cookie",
    buildSessionCookie(token, { maxAgeSec: SESSION_TTL_SEC })
  );

  return jsonResponse({ ok: true }, { status: 200, headers });
}
