import { apiFetch, requireAuth, mountHeader, showToast, todayISO, currentMonth, formatYen } from "/common.js";

const toast = document.getElementById("toast");
const dateEl = document.getElementById("date");
const amountEl = document.getElementById("amount");
const itemEl = document.getElementById("item");
const catEl = document.getElementById("category");
const tbody = document.getElementById("tbody");
const pillMonth = document.getElementById("pillMonth");

async function loadCategories() {
  const res = await apiFetch("/api/categories");
  if (!res.ok) return [];
  const cats = await res.json();
  catEl.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  return cats;
}

async function loadLatestThisMonth() {
  const month = currentMonth();
  pillMonth.textContent = `対象月：${month}`;
  const res = await apiFetch(`/api/expenses?month=${encodeURIComponent(month)}&limit=20`);
  if (!res.ok) return;
  const items = await res.json();
  tbody.innerHTML = items
    .map(
      (x) => `
      <tr>
        <td class="mono">${escapeHtml(x.date)}</td>
        <td>${escapeHtml(x.item)}</td>
        <td><span class="pill">${escapeHtml(x.category)}</span></td>
        <td class="right mono">${formatYen(x.amount)}</td>
      </tr>
    `
    )
    .join("");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function main() {
  const me = await requireAuth();
  if (!me) return;

  mountHeader("家計簿アプリ", "PoC", "index");

  dateEl.value = todayISO();
  amountEl.value = "";
  itemEl.value = "";

  await loadCategories();
  await loadLatestThisMonth();

  document.getElementById("formAdd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = dateEl.value;
    const amount = Number(amountEl.value);
    const item = itemEl.value.trim();
    const category = catEl.value;

    if (!date || !item || !category || !Number.isFinite(amount) || amount < 0) {
      showToast(toast, "入力を確認してください", "error");
      return;
    }

    const res = await apiFetch("/api/expenses", {
      method: "POST",
      body: { date, amount, item, category },
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showToast(toast, j?.error || "登録に失敗しました", "error");
      return;
    }

    showToast(toast, "登録しました");
    amountEl.value = "";
    itemEl.value = "";
    await loadLatestThisMonth();
  });
}

main();
