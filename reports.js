document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('reports', user);

  const data = await apiCall('getReports', {});
  if (data.error) return;

  document.getElementById('rInvValue').textContent = '\u20B1' + Number(data.inventoryValue).toLocaleString();
  document.getElementById('rSales').textContent = '\u20B1' + Number(data.totalSales).toLocaleString();
  document.getElementById('rStockIn').textContent = data.totalStockIn + ' units';
  document.getElementById('rOrders').textContent = data.totalOrders + ' items';

  const lowBody = document.getElementById('lowStockBody');
  lowBody.innerHTML = data.lowStock.length
    ? data.lowStock.map(r => `<tr><td>${r.item}</td><td>${r.stock}</td><td>${r.reorder}</td><td><span class="status-tag status-low">${r.status}</span></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty-note">No low stock ingredients.</td></tr>';

  const actBody = document.getElementById('activityBody');
  actBody.innerHTML = data.recentActivity.length
    ? data.recentActivity.map(a => `<tr><td>${new Date(a.date).toLocaleString()}</td><td>${a.user}</td><td>${a.action}</td><td>${a.description}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty-note">No recent activity.</td></tr>';
});
