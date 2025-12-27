import { apiFetch, requireAuth, mountHeader, showToast, currentMonth } from "/common.js";

const toast = document.getElementById("toast");
const newCat = document.getElementById("newCat");
const btnAdd = document.getElementById("btnAdd");
const catList = document.getElementById("catList");

const purgeMonth = document.getElementById("purgeMonth");
const btnPurgeMonth = document.getElementById("btnPurgeMonth");
const btnPurgeAll = document.getElementById("btnPurgeAll");

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
  return await res.json();
}

function renderList(cats) {
  if (!cats.length) {
    catList.innerHTML = `<div class="small">分類がありません</div>`;
    return;
  }

  catList.innerHTML = `
    <table>
      <thead>
        <tr><th>名称</th><th>変更</th><th></th></tr>
      </thead>
      <tbody>
        ${cats
          .map(
            (c) => `
          <tr data-name="${escapeHtml(c)}">
            <td><span class="pill">${escapeHtml(c)}</span></td>
            <td><input class="rename" type="text" maxlength="30" placeholder="新しい名称" /></td>
            <td class="right">
              <button class="btn primary btnRename" type="button">変更</button>
              <button class="btn danger btnDelete" type="button">削除</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  catList.querySelectorAll(".btnRename").forEach((b) => {
    b.addEventListener("click", async () => {
      const tr = b.closest("tr");
      const oldName = tr.dataset.name;
      const newName = tr.querySelector(".rename").value.trim();
      if (!newName) return showToast(toast, "新しい名称を入力してください", "error");

      const res = await apiFetch("/api/categories", { method: "PUT", body: { oldName, newName } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return showToast(toast, j?.error || "変更に失敗しました", "error");
      }
      showToast(toast, "変更しました");
      await refresh();
    });
  });

  catList.querySelectorAll(".btnDelete").forEach((b) => {
    b.addEventListener("click", async () => {
      const tr = b.closest("tr");
      const name = tr.dataset.name;
      if (!confirm(`分類「${name}」を削除しますか？`)) return;

      const res = await apiFetch("/api/categories", { method: "DELETE", body: { name } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return showToast(toast, j?.error || "削除に失敗しました", "error");
      }
      showToast(toast, "削除しました");
      await refresh();
    });
  });
}

async function refresh() {
  const cats = await loadCategories();
  renderList(cats);
}

async function addCategory() {
  const name = newCat.value.trim();
  if (!name) return showToast(toast, "名称を入力してください", "error");

  const res = await apiFetch("/api/categories", { method: "POST", body: { name } });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return showToast(toast, j?.error || "追加に失敗しました", "error");
  }
  newCat.value = "";
  showToast(toast, "追加しました");
  await refresh();
}

async function purgeMonthData() {
  const month = purgeMonth.value;
  if (!month) return showToast(toast, "月を選択してください", "error");
  if (!confirm(`${month} のデータを一括削除します。よろしいですか？`)) return;

  const res = await apiFetch("/api/admin/purge-month", { method: "POST", body: { month } });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return showToast(toast, j?.error || "削除に失敗しました", "error");
  }
  const j = await res.json().catch(() => ({}));
  showToast(toast, `削除しました（件数: ${j?.deleted ?? "?"}）`);
}

async function purgeAllData() {
  if (!confirm("全データを削除します。取り消せません。本当によろしいですか？")) return;
  if (!confirm("最終確認：本当に全削除しますか？")) return;

  const res = await apiFetch("/api/admin/purge-all", { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return showToast(toast, j?.error || "全削除に失敗しました", "error");
  }
  const j = await res.json().catch(() => ({}));
  showToast(toast, `全削除しました（削除キー数: ${j?.deletedKeys ?? "?"}）`);
  await refresh();
}

async function main() {
  const me = await requireAuth();
  if (!me) return;

  mountHeader("家計簿アプリ", "PoC", "admin");

  btnAdd.addEventListener("click", addCategory);
  newCat.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCategory();
  });

  purgeMonth.value = currentMonth();
  btnPurgeMonth.addEventListener("click", purgeMonthData);
  btnPurgeAll.addEventListener("click", purgeAllData);

  await refresh();
}

main();
