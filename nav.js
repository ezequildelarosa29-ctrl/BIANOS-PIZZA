function renderNav(activePage, user) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
    { id: 'menu', label: 'Menu', href: 'menu.html' },
    { id: 'stock-in', label: 'Stock In', href: 'stock-in.html' },
    { id: 'orders', label: 'Orders', href: 'orders.html' },
    { id: 'suppliers', label: 'Suppliers', href: 'suppliers.html' },
    { id: 'reports', label: 'Reports', href: 'reports.html' }
  ];
  if (user.role === 'admin') {
    links.push({ id: 'users', label: 'Users', href: 'users.html' });
  }

  const navHtml = links.map(l =>
    `<a href="${l.href}" class="${l.id === activePage ? 'active' : ''}">${l.label}</a>`
  ).join('');

  document.getElementById('app-shell-nav').innerHTML = `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="hamburger" id="hamburgerBtn">&#9776;</button>
        <div class="brand">Biano's Pizza</div>
      </div>
      <div class="user-info">
        <span class="username">${user.username} | ${user.role}</span>
        <button class="logout-btn" id="logoutBtn">Logout</button>
      </div>
    </div>
    <div class="sidebar" id="sidebarNav">
      <nav>${navHtml}</nav>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', doLogout);
  document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('sidebarNav').classList.toggle('open');
  });
}
