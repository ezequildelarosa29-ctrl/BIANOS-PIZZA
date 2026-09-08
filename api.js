// ====== SET THIS AFTER YOU DEPLOY THE APPS SCRIPT WEB APP ======
const API_URL = "https://script.google.com/macros/s/AKfycbwOLVof34QaHTQ6TFwRtEZ-wuUDgLFEpO9xb8sGJ-cF6W6oGST2AsP9svsBGRB33I6wWA/exec";
// e.g. "https://script.google.com/macros/s/AKfycb.../exec"

async function apiCall(action, payload = {}) {
  const token = localStorage.getItem('bianos_token');
  const body = JSON.stringify(Object.assign({ action, token }, payload));

  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight (OPTIONS) request, which Apps Script can't handle.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: body
  });

  const data = await res.json();

  if (data.error === 'invalid_session') {
    localStorage.removeItem('bianos_token');
    localStorage.removeItem('bianos_role');
    localStorage.removeItem('bianos_username');
    window.location.href = 'index.html';
  }
  return data;
}
