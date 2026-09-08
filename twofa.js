function showMsg(text, type) {
  document.getElementById('msgBox').innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}

let secondsLeft = 300;
let timerInterval;

function startTimer() {
  timerInterval = setInterval(() => {
    secondsLeft--;
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    document.getElementById('timerText').textContent = `Code expires in ${m}:${s}`;
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timerText').textContent = 'Code expired. Please resend.';
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  const userId = sessionStorage.getItem('bianos_pending_userid');
  if (!userId) {
    window.location.href = 'index.html';
    return;
  }
  startTimer();

  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((el, idx) => {
    el.addEventListener('input', () => {
      if (el.value && idx < digits.length - 1) digits[idx + 1].focus();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !el.value && idx > 0) digits[idx - 1].focus();
    });
  });

  document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = Array.from(digits).map(d => d.value).join('');
    if (otp.length !== 6) {
      showMsg('Please enter all 6 digits.', 'error');
      return;
    }

    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying…';

    const res = await apiCall('verifyOtp', { userId, otp });

    btn.disabled = false;
    btn.textContent = 'Verify code';

    if (res.error) {
      const messages = { invalid_otp: 'Incorrect code.', otp_expired: 'Code expired. Please resend.' };
      showMsg(messages[res.error] || 'Verification failed.', 'error');
      return;
    }

    localStorage.setItem('bianos_token', res.token);
    localStorage.setItem('bianos_role', res.role);
    localStorage.setItem('bianos_username', res.username);
    sessionStorage.removeItem('bianos_pending_userid');
    window.location.href = 'dashboard.html';
  });

  document.getElementById('resendLink').addEventListener('click', async (e) => {
    e.preventDefault();
    await apiCall('resendOtp', { userId });
    secondsLeft = 300;
    showMsg('A new code has been sent.', 'ok');
  });
});
