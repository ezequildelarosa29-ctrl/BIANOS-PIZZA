function renderUsers(list) {
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = list.map(u => `
    <tr>
      <td>${u.ID}</td>
      <td>${u.Username}</td>
      <td>${u.Role}</td>
      <td><span class="status-tag status-active">${u.Status}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  requireAdmin(user);
  renderNav('users', user);

  let users = await apiCall('getUsers', {});
  if (!Array.isArray(users)) users = [];
  renderUsers(users);

  const modal = document.getElementById('userModal');
  document.getElementById('addUserBtn').addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('cancelUserBtn').addEventListener('click', () => modal.classList.remove('open'));

  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('addUser', {
      username: document.getElementById('uUsername').value,
      password: document.getElementById('uPassword').value,
      email: document.getElementById('uEmail').value,
      role: document.getElementById('uRole').value
    });
    if (res.error) { alert('Error: ' + res.error); return; }
    modal.classList.remove('open');
    document.getElementById('userForm').reset();
    users = await apiCall('getUsers', {});
    renderUsers(users);
  });
});
