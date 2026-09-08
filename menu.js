let allMenuItems = [];

function renderMenu(list) {
  const tbody = document.getElementById('menuBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-note">No menu items found.<"use strict";
let allMenuItems = [];

function menuMsg(text, type="error") {
  let box = document.getElementById("msgBox");
  if (!box) { box = document.createElement("div"); box.id = "msgBox"; document.querySelector(".content")?.prepend(box); }
  box.innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}
function renderMenu(list) {
  const tbody = document.getElementById("menuBody");
  if (!tbody) return;
  if (!Array.isArray(list) || !list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-note">No menu items found.</td></tr>'; return; }
  tbody.innerHTML = list.map(m => `<tr><td>${m.ID||""}</td><td>${m.Name||""}</td><td>${m.Category||""}</td><td>${m.Size||""}</td><td>₱${Number(m.Price||0).toLocaleString()}</td><td><span class="status-tag ${String(m.Status).toLowerCase()==="available"?"status-active":"status-low"}">${String(m.Status).toLowerCase()==="available"?"Available":"Unavailable"}</span></td></tr>`).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireLogin(); if (!user) return;
  renderNav("menu", user);

  // IMPORTANT: bind buttons BEFORE waiting for the server.
  const modal = document.getElementById("itemModal");
  const addBtn = document.getElementById("addItemBtn");
  const cancelBtn = document.getElementById("cancelItemBtn");
  const form = document.getElementById("itemForm");
  if (addBtn && modal) addBtn.addEventListener("click", () => modal.classList.add("open"));
  if (cancelBtn && modal) cancelBtn.addEventListener("click", () => modal.classList.remove("open"));
  if (modal) modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
  if (form) form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
    try {
      const res = await apiCall("addMenuItem", { name:mName.value.trim(), category:mCategory.value, size:mSize.value, price:mPrice.value, cost:mCost.value });
      if (res.error) { menuMsg("Error: " + res.error); return; }
      modal?.classList.remove("open"); form.reset(); await loadMenu(); menuMsg("Menu item added successfully.", "ok");
    } catch (err) { menuMsg(err.message); } finally { if (btn) btn.disabled = false; }
  });
  const search = document.getElementById("searchBox");
  if (search) search.addEventListener("input", e => { const q=e.target.value.toLowerCase(); renderMenu(allMenuItems.filter(m => String(m.Name||"").toLowerCase().includes(q)||String(m.Category||"").toLowerCase().includes(q))); });

  async function loadMenu() {
    try { const res = await apiCall("getMenu", {}); if (res && res.error) throw new Error(res.error); allMenuItems = Array.isArray(res) ? res : []; renderMenu(allMenuItems); }
    catch (err) { allMenuItems=[]; renderMenu([]); menuMsg("Could not load menu: " + err.message); }
  }
  await loadMenu();
});
/td></tr>';
    return;
  }
  tbody.innerHTML = list.map(m => `
    <tr>
      <td>${m.ID}</td>
      <td>${m.Name}</td>
      <td>${m.Category}</td>
      <td>${m.Size}</td>
      <td>\u20B1${Number(m.Price).toLocaleString()}</td>
      <td><span class="status-tag ${m.Status === 'available' ? 'status-active' : 'status-low'}">${m.Status === 'available' ? 'Available' : 'Unavailable'}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('menu', user);

  allMenuItems = await apiCall('getMenu', {});
  if (!Array.isArray(allMenuItems)) allMenuItems = [];
  renderMenu(allMenuItems);

  document.getElementById('searchBox').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderMenu(allMenuItems.filter(m => m.Name.toLowerCase().includes(q) || m.Category.toLowerCase().includes(q)));
  });

  const modal = document.getElementById('itemModal');
  document.getElementById('addItemBtn').addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('cancelItemBtn').addEventListener('click', () => modal.classList.remove('open'));

  document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('addMenuItem', {
      name: document.getElementById('mName').value,
      category: document.getElementById('mCategory').value,
      size: document.getElementById('mSize').value,
      price: document.getElementById('mPrice').value,
      cost: document.getElementById('mCost').value
    });
    if (res.error) { alert('Error: ' + res.error); return; }
    modal.classList.remove('open');
    document.getElementById('itemForm').reset();
    allMenuItems = await apiCall('getMenu', {});
    renderMenu(allMenuItems);
  });
});
