
function renderNav(activePage, user) {
  const items = [
    {id:'dashboard', label:'Dashboard', href:'dashboard.html', icon:'⌂'},
    {id:'menu', label:'Menu Management', href:'menu.html', icon:'🍕'},
    {id:'stock-in', label:'Inventory / Stock In', href:'stock-in.html', icon:'▣'},
    {id:'orders', label:'Orders & Sales', href:'orders.html', icon:'🧾'},
    {id:'suppliers', label:'Suppliers', href:'suppliers.html', icon:'♧'},
    {id:'reports', label:'Reports & Analytics', href:'reports.html', icon:'▥'}
  ];

  if (user && user.role === 'admin') {
    items.push({id:'users', label:'User Management', href:'users.html', icon:'♙'});
  }

  const navHtml = items.map(item => `
    <a href="${item.href}" class="${item.id === activePage ? 'active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  const root = document.getElementById('app-shell-nav');
  if (!root) return;

  const initials = String(user?.username || 'B').slice(0,1).toUpperCase();

  root.innerHTML = `
    <aside class="sidebar" id="sidebarNav">
      <div class="sidebar-brand">
        <div class="mini-mark">B</div>
        <strong>Biano's Pizza</strong>
        <span>Ordering & Inventory Desk</span>
      </div>

      <div class="nav-label">Main workspace</div>
      <nav>${navHtml}</nav>

      <div class="sidebar-footer">
        <b>System status</b>
        Connected to Biano's Pizza database
      </div>
    </aside>

    <header class="topbar">
      <div class="topbar-left">
        <button class="hamburger" id="hamburgerBtn">☰</button>
        <div>
          <div class="topbar-title">Biano's Pizza</div>
          <div class="topbar-sub">Order, inventory & sales management</div>
        </div>
      </div>

      <div class="user-info">
        <div class="avatar">${initials}</div>
        <div>
          <div class="username">${escapeHtml(user?.username || 'Staff')}</div>
          <div class="role-pill">${escapeHtml(user?.role || 'staff')}</div>
        </div>
        <button class="logout-btn" id="logoutBtn">Log out</button>
      </div>
    </header>
  `;

  document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
  document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
    document.getElementById('sidebarNav')?.classList.toggle('open');
  });

  document.querySelectorAll('#sidebarNav a').forEach(a => {
    a.addEventListener('click', () => document.getElementById('sidebarNav')?.classList.remove('open'));
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
