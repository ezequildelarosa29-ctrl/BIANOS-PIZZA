let allMenuItems = [];

function renderMenu(list) {
  const tbody = document.getElementById('menuBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-note">No menu items found.</td></tr>';
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
