import {
  apiFetch,
  requireAuth,
  mountHeader,
  showToast,
  currentMonth,
  formatYen,
} from "/common.js";

const toast = document.getElementById("toast");
const monthEl = document.getElementById("month");
const btnLoad = document.getElementById("btnLoad");
const tbody = document.getElementById("tbody");
const totalEl = document.getElementById("total");
const byCatEl = document.getElementById("byCat");

let categories = [];

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadCategories() {
  const res = await apiFetch("/api/categories");
  if (!res.ok) return [];
  categories = await res.json();
  return categories;
}

function categorySelectHtml(value) {
  const opts = categories
    .map((c) => {
      const sel = c === value ? "selected" : "";
      return `<option ${sel} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
    })
    .join("");
  return `<select class="edit-cat">${opts}</select>`;
}

function rowHtml(x) {
  return `
    <tr data-id="${escapeHtml(x.id)}">
      <td class="mono"><input class="edit-date" type="date" value="${escapeHtml(x.date)}" /></td>
      <td><input class="edit-item" type="text" maxlength="200" value="${escapeHtml(x.item)}" /></td>
      <td>${categorySelectHtml(x.category)}</td>
      <td class="right mono"><input class="edit-amount" type="number" min="0" step="1" value="${escapeHtml(x.amount)}" style="text-align:right;" /></td>
      <td class="right">
        <button class="btn primary btnSave" type="button">保存</button>
        <button class="btn danger btnDel" type="button">削除</button>
      </td>
    </tr>
  `;
}

function renderSummary(summary) {
  totalEl.textContent = formatYen(summary.total);

  const keys = Object.keys(summary.byCategory || {});
  if (keys.length === 0) {
    byCatEl.innerHTML = `<div class="small">データがありません</div>`;
    return;
  }

  byCatEl.innerHTML = `
    <table>
      <thead>
        <tr><th>分類</th><th style="text-align:right;">小計</th></tr>
      </thead>
      <tbody>
        ${keys
          .sort()
          .map(
            (k) => `
            <tr>
              <td><span class="pill">${escapeHtml(k)}</span></td>
              <td class="right mono">${formatYen(summary.byCategory[k])}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function loadMonth(month) {
  // 月次サマリ
  const resSum = await apiFetch(`/api/monthly?month=${encodeURIComponent(month)}`);
  if (!resSum.ok) {
    const j = await resSum.json().catch(() => ({}));
    showToast(toast, j?.error || "読み込みに失敗しました", "error");
    return;
  }
  const summary = await resSum.json();
  renderSummary(summary);

  // 明細
  const res = await apiFetch(`/api/expenses?month=${encodeURIComponent(month)}&limit=500`);
  if (!res.ok) return;
  const items = await res.json();
  tbody.innerHTML = items.map(rowHtml).join("");

  // イベント
  tbody.querySelectorAll(".btnSave").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      await saveRow(tr);
      await loadMonth(monthEl.value);
    });
  });
  tbody.querySelectorAll(".btnDel").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      await deleteRow(tr);
      await loadMonth(monthEl.value);
    });
  });
}

async function saveRow(tr) {
  const id = tr.dataset.id;
  const date = tr.querySelector(".edit-date").value;
  const item = tr.querySelector(".edit-item").value.trim();
  const category = tr.querySelector(".edit-cat").value;
  const amount = Number(tr.querySelector(".edit-amount").value);

  if (!id || !date || !item || !category || !Number.isFinite(amount) || amount < 0) {
    showToast(toast, "入力を確認してください", "error");
    return;
  }

  const res = await apiFetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { date, item, category, amount },
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    showToast(toast, j?.error || "保存に失敗しました", "error");
    return;
  }
  showToast(toast, "保存しました");
}

async function deleteRow(tr) {
  const id = tr.dataset.id;
  if (!id) return;

  if (!confirm("この明細を削除しますか？")) return;

  const res = await apiFetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    showToast(toast, j?.error || "削除に失敗しました", "error");
    return;
  }
  showToast(toast, "削除しました");
}

async function main() {
  const me = await requireAuth();
  if (!me) return;

  mountHeader("家計簿アプリ", "PoC", "monthly");

  await loadCategories();
  monthEl.value = currentMonth();

  btnLoad.addEventListener("click", () => loadMonth(monthEl.value));
  await loadMonth(monthEl.value);
}

main();
