"use strict";

function renderNav(activePage, user) {
  const host = document.getElementById("app-shell-nav");
  if (!host) return;

  const links = [
    { id:"dashboard", label:"Dashboard", icon:"⌂", href:"dashboard.html" },
    { id:"menu", label:"Menu Management", icon:"🍕", href:"menu.html" },
    { id:"stock-in", label:"Inventory / Stock In", icon:"📦", href:"stock-in.html" },
    { id:"orders", label:"Orders & Sales", icon:"🧾", href:"orders.html" },
    { id:"suppliers", label:"Suppliers", icon:"🚚", href:"suppliers.html" },
    { id:"reports", label:"Reports & Analytics", icon:"📊", href:"reports.html" }
  ];
  if (String(user.role).toLowerCase() === "admin") {
    links.push({ id:"users", label:"User Management", icon:"👤", href:"users.html" });
  }

  host.innerHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <button class="hamburger" id="hamburgerBtn" type="button" aria-label="Open menu">☰</button>
        <div class="brand-wrap">
          <div class="brand-mark">B</div>
          <div><div class="brand">BIANO'S PIZZA</div><div class="brand-sub">ORDER & INVENTORY DESK</div></div>
        </div>
      </div>
      <div class="user-info">
        <div class="user-avatar">${String(user.username || "U").charAt(0).toUpperCase()}</div>
        <div class="user-meta"><strong>${user.username || "User"}</strong><span>${user.role || "staff"}</span></div>
        <button class="logout-btn" id="logoutBtn" type="button">Logout</button>
      </div>
    </header>
    <aside class="sidebar" id="sidebarNav">
      <div class="side-label">MAIN MODULES</div>
      <nav>${links.map(l => `<a href="${l.href}" class="${l.id === activePage ? "active" : ""}"><span class="nav-icon">${l.icon}</span><span>${l.label}</span></a>`).join("")}</nav>
      <div class="system-status"><span class="status-dot"></span><div><strong>System Online</strong><small>Biano's Pizza ERP</small></div></div>
    </aside>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

  const hamburger = document.getElementById("hamburgerBtn");
  if (hamburger) hamburger.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebarNav");
    if (sidebar) sidebar.classList.toggle("open");
  });
}
