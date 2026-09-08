function renderSuppliers(list) {
  const tbody = document.getElementById('suppliersBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-note">No suppliers found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${s.ID}</td>
      <td>${s.Name}</td>
      <td>${s.Contact || '-'}</td>
      <td>${s.Phone || '-'}</td>
      <td><span class="status-tag status-active">${s.Status}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('suppliers', user);

  let suppliers = await apiCall('getSuppliers', {});
  if (!Array.isArray(suppliers)) suppliers = [];
  renderSuppliers(suppliers);

  const modal = document.getElementById('supplierModal');
  document.getElementById('addSupplierBtn').addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('cancelSupplierBtn').addEventListener('click', () => modal.classList.remove('open'));

  document.getElementById('supplierForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('addSupplier', {
      name: document.getElementById('sName').value,
      contact: document.getElementById('sContact').value,
      phone: document.getElementById('sPhone').value,
      email: document.getElementById('sEmail').value
    });
    if (res.error) { alert('Error: ' + res.error); return; }
    modal.classList.remove('open');
    document.getElementById('supplierForm').reset();
    suppliers = await apiCall('getSuppliers', {});
    renderSuppliers(suppliers);
  });
});
