export function baseHeaders() {
  const h = new Headers();

  // ★認証/個人データ系APIはキャッシュ禁止
  h.set("Cache-Control", "no-store");
  h.set("Pragma", "no-cache");

  // Cookieで内容が変わるので、CDNに「Cookieで分けろ」と伝える
  h.append("Vary", "Cookie");

  return h;
}
