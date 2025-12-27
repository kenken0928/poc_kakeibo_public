// 共通ユーティリティ（認証・API呼び出し・UI）
export function qs(sel, root = document) {
  return root.querySelector(sel);
}
export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function formatYen(n) {
  const num = Number(n || 0);
  return num.toLocaleString("ja-JP");
}

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
export function monthFromISO(dateISO) {
  return String(dateISO).slice(0, 7);
}
export function currentMonth() {
  return monthFromISO(todayISO());
}

export function showToast(el, message, type = "success") {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("success", "error");
  el.classList.add("show", type);
  setTimeout(() => el.classList.remove("show"), 3500);
}

/**
 * 認証付き fetch
 * - 401の場合は login.html に飛ばす（ログイン画面以外）
 */
export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const init = {
    method,
    credentials: "include",
    headers: {
      ...(headers || {}),
    },
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(path, init);

  if (res.status === 401) {
    // login.html 自身ではリダイレクトしない
    const isLogin = location.pathname.endsWith("/login.html") || location.pathname === "/login.html";
    if (!isLogin) {
      location.href = "/login.html";
    }
    return res;
  }
  return res;
}

export async function requireAuth() {
  const res = await apiFetch("/api/me");
  if (!res.ok) return null;
  return await res.json();
}

export async function logout() {
  await apiFetch("/api/logout", { method: "POST" });
  location.href = "/login.html";
}

export function setHeaderLinks(active) {
  const nav = qs("#nav");
  if (!nav) return;
  nav.innerHTML = `
    <a class="btn ${active === "index" ? "primary" : ""}" href="/index.html">入力</a>
    <a class="btn ${active === "monthly" ? "primary" : ""}" href="/monthly_sum.html">月次</a>
    <a class="btn ${active === "admin" ? "primary" : ""}" href="/admin.html">管理</a>
    <button class="btn ghost" id="btnLogout" type="button">ログアウト</button>
  `;
  qs("#btnLogout").addEventListener("click", () => logout());
}

export function mountHeader(title, badge = "PoC", active = "") {
  const header = qs("#header");
  if (!header) return;

  header.innerHTML = `
    <div class="brand">
      <h1>${title}</h1>
      <span class="badge">${badge}</span>
    </div>
    <div class="nav" id="nav"></div>
  `;
  setHeaderLinks(active);
}
