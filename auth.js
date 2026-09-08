function requireLogin() {
  const token = localStorage.getItem('bianos_token');
  if (!token) {
    window.location.href = 'index.html';
    return null;
  }
  return {
    token: token,
    role: localStorage.getItem('bianos_role'),
    username: localStorage.getItem('bianos_username')
  };
}

function requireAdmin(user) {
  if (user.role !== 'admin') {
    alert('Administrator access only.');
    window.location.href = 'dashboard.html';
  }
}

async function doLogout() {
  await apiCall('logout', {});
  localStorage.removeItem('bianos_token');
  localStorage.removeItem('bianos_role');
  localStorage.removeItem('bianos_username');
  window.location.href = 'index.html';
}
