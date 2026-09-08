function renderNav(activePage, user) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
    { id: 'menu', label: 'Menu', href: 'menu.html' },
    { id: 'stock-in', label: 'Stock In', href: 'stock-in.html' },
    { id: 'orders', label: 'Orders', href: 'orders.html' },
    { id: 'suppliers', label: 'Suppliers', href: 'suppliers.html' },
    { id: 'reports', label: 'Reports', href: 'reports.html' }
  ];

  if (user && user.role === 'admin') {
    links.push({ id: 'users', label: 'Users', href: 'users.html' });
  }

  const navHtml = links.map(link => `
    <a href="${link.href}" class="${link.id === activePage ? 'active' : ''}">
      ${link.label}
    </a>
  `).join('');

  const root = document.getElementById('app-shell-nav');
  if (!root) return;

  root.innerHTML = `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:11px;">
        <button class="hamburger" id="hamburgerBtn" aria-label="Open navigation">☰</button>
        <div class="brand">Biano's Pizza</div>
      </div>

      <div class="user-info">
        <span class="username">${escapeHtml(user?.username || 'Staff')} · ${escapeHtml(user?.role || '')}</span>
        <button class="logout-btn" id="logoutBtn">Log out</button>
      </div>
    </div>

    <aside class="sidebar" id="sidebarNav">
      <nav>${navHtml}</nav>
    </aside>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      document.getElementById('sidebarNav')?.classList.toggle('open');
    });
  }

  document.querySelectorAll('#sidebarNav a').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('sidebarNav')?.classList.remove('open');
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
