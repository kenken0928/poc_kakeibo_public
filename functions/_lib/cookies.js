export function parseCookieHeader(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * ローカル(http) だと Secure cookie が保存されないので、
 * request URL を見て https のときだけ Secure を付ける形にする。
 */
export function buildSessionCookie(token, { maxAgeSec, isHttps }) {
  const parts = [
    `session=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    Number.isFinite(maxAgeSec) ? `Max-Age=${Math.floor(maxAgeSec)}` : null,
    isHttps ? `Secure` : null,
  ].filter(Boolean);

  return parts.join("; ");
}

export function buildDeleteSessionCookie({ isHttps }) {
  const parts = [
    `session=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
    isHttps ? `Secure` : null,
  ].filter(Boolean);

  return parts.join("; ");
}
