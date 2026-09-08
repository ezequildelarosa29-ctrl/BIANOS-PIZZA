let currentCaptchaId = null;

function showMsg(text, type) {
  document.getElementById('msgBox').innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}

async function loadCaptcha() {
  try {
    const res = await apiCall('getCaptcha', {});
    if (!res || res.error) throw new Error(res && res.error ? res.error : 'no_response');
    currentCaptchaId = res.captchaId;
    document.getElementById('captchaQuestion').textContent = res.question;
    document.getElementById('captchaAnswer').value = '';
  } catch (err) {
    document.getElementById('captchaQuestion').textContent = 'Captcha failed to load';
    showMsg('Could not reach the server. Check that API_URL in js/api.js is set to your deployed Apps Script URL, and that the Web App deployment access is set to "Anyone".', 'error');
    console.error('getCaptcha failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('bianos_token')) {
    window.location.href = 'dashboard.html';
    return;
  }
  loadCaptcha();

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Checking…';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const captchaAnswer = document.getElementById('captchaAnswer').value.trim();

    const res = await apiCall('login', {
      username, password,
      captchaId: currentCaptchaId,
      captchaAnswer
    });

    btn.disabled = false;
    btn.textContent = 'Log in';

    if (res.error) {
      const messages = {
        invalid_credentials: 'Incorrect username or password.',
        invalid_captcha: 'Captcha answer is incorrect.',
        account_locked: 'Account temporarily locked due to failed attempts. Try again later.',
        account_inactive: 'This account has been deactivated.'
      };
      showMsg(messages[res.error] || 'Login failed. Please try again.', 'error');
      loadCaptcha();
      return;
    }

    if (res.status === 'otp_required') {
      sessionStorage.setItem('bianos_pending_userid', res.userId);
      window.location.href = '2fa.html';
    }
  });
});
