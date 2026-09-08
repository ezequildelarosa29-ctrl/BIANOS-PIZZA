document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('dashboard', user);

  const data = await apiCall('getDashboard', {});
  if (data.error) return;

  document.getElementById('statMenu').textContent = data.totalMenuItems;
  document.getElementById('statStock').textContent = data.totalIngredientStock;
  document.getElementById('statLow').textContent = data.lowStock;
  document.getElementById('statSales').textContent = '\u20B1' + Number(data.totalSales).toLocaleString();

  const tbody = document.getElementById('recentBody');
  if (!data.recent.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-note">No activity yet.</td></tr>';
  } else {
    tbody.innerHTML = data.recent.map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${r.type}</td>
        <td>${r.item}</td>
        <td>${r.qty}</td>
      </tr>
    `).join('');
  }
});
