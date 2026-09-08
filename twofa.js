function showMsg(text, type) {
  const msgBox = document.getElementById('msgBox');

  if (!msgBox) {
    return;
  }

  msgBox.innerHTML =
    `<div class="msg msg-${type}">${text}</div>`;
}

let secondsLeft = 300;
let timerInterval = null;

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  updateTimer();

  timerInterval = setInterval(() => {
    secondsLeft--;

    updateTimer();

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      const timerText =
        document.getElementById('timerText');

      if (timerText) {
        timerText.textContent =
          'Code expired. Please resend.';
      }
    }
  }, 1000);
}

function updateTimer() {
  const timerText =
    document.getElementById('timerText');

  if (!timerText) {
    return;
  }

  const m =
    String(
      Math.floor(secondsLeft / 60)
    ).padStart(2, '0');

  const s =
    String(
      secondsLeft % 60
    ).padStart(2, '0');

  timerText.textContent =
    `Code expires in ${m}:${s}`;
}

document.addEventListener(
  'DOMContentLoaded',
  () => {

    const userId =
      sessionStorage.getItem(
        'emcor_pending_userid'
      );

    if (!userId) {
      window.location.href =
        'index.html';
      return;
    }

    const digits =
      document.querySelectorAll(
        '.otp-digit'
      );

    const otpForm =
      document.getElementById(
        'otpForm'
      );

    const verifyBtn =
      document.getElementById(
        'verifyBtn'
      );

    const resendLink =
      document.getElementById(
        'resendLink'
      );

    startTimer();

    digits.forEach(
      (el, idx) => {

        el.setAttribute(
          'inputmode',
          'numeric'
        );

        el.setAttribute(
          'maxlength',
          '1'
        );

        el.addEventListener(
          'input',
          () => {

            el.value =
              el.value.replace(
                /\D/g,
                ''
              );

            if (
              el.value &&
              idx <
                digits.length - 1
            ) {
              digits[
                idx + 1
              ].focus();
            }
          }
        );

        el.addEventListener(
          'keydown',
          (e) => {

            if (
              e.key === 'Backspace' &&
              !el.value &&
              idx > 0
            ) {
              digits[
                idx - 1
              ].focus();
            }
          }
        );

        el.addEventListener(
          'paste',
          (e) => {

            e.preventDefault();

            const pasted =
              (
                e.clipboardData ||
                window.clipboardData
              )
                .getData('text')
                .replace(
                  /\D/g,
                  ''
                )
                .slice(0, 6);

            if (!pasted) {
              return;
            }

            pasted
              .split('')
              .forEach(
                (value, i) => {

                  if (
                    digits[i]
                  ) {
                    digits[i].value =
                      value;
                  }
                }
              );

            const nextIndex =
              Math.min(
                pasted.length,
                digits.length - 1
              );

            digits[
              nextIndex
            ].focus();
          }
        );
      }
    );

    if (otpForm) {
      otpForm.addEventListener(
        'submit',
        async (e) => {

          e.preventDefault();

          const otp =
            Array.from(digits)
              .map(
                d =>
                  String(
                    d.value || ''
                  ).trim()
              )
              .join('');

          if (
            !/^\d{6}$/.test(otp)
          ) {
            showMsg(
              'Please enter all 6 digits.',
              'error'
            );
            return;
          }

          if (verifyBtn) {
            verifyBtn.disabled =
              true;

            verifyBtn.textContent =
              'VERIFYING...';
          }

          try {

            const res =
              await apiCall(
                'verifyOtp',
                {
                  userId:
                    String(
                      userId
                    ).trim(),
                  otp:
                    String(
                      otp
                    ).trim()
                }
              );

            if (
              !res ||
              res.error
            ) {

              const messages = {
                invalid_otp:
                  'Incorrect code.',
                otp_expired:
                  'Code expired. Please resend.',
                otp_missing:
                  'No active verification code. Please resend.',
                invalid_user:
                  'User session is invalid. Please login again.',
                server_error:
                  'Server error. Please try again.'
              };

              showMsg(
                messages[
                  res?.error
                ] ||
                'Verification failed.',
                'error'
              );

              if (verifyBtn) {
                verifyBtn.disabled =
                  false;

                verifyBtn.textContent =
                  'VERIFY';
              }

              return;
            }

            if (
              !res.token ||
              !res.role ||
              !res.username
            ) {

              showMsg(
                'Invalid server response. Please try again.',
                'error'
              );

              if (verifyBtn) {
                verifyBtn.disabled =
                  false;

                verifyBtn.textContent =
                  'VERIFY';
              }

              return;
            }

            localStorage.setItem(
              'emcor_token',
              res.token
            );

            localStorage.setItem(
              'emcor_role',
              res.role
            );

            localStorage.setItem(
              'emcor_username',
              res.username
            );

            sessionStorage.removeItem(
              'emcor_pending_userid'
            );

            window.location.href =
              'dashboard.html';

          } catch (error) {

            console.error(
              'OTP verification error:',
              error
            );

            showMsg(
              'Unable to verify the code. Please try again.',
              'error'
            );

            if (verifyBtn) {
              verifyBtn.disabled =
                false;

              verifyBtn.textContent =
                'VERIFY';
            }
          }
        }
      );
    }

    if (resendLink) {
      resendLink.addEventListener(
        'click',
        async (e) => {

          e.preventDefault();

          resendLink.style.pointerEvents =
            'none';

          try {

            const res =
              await apiCall(
                'resendOtp',
                {
                  userId:
                    String(
                      userId
                    ).trim()
                }
              );

            if (
              !res ||
              res.error
            ) {

              const messages = {
                invalid_user:
                  'User session is invalid. Please login again.'
              };

              showMsg(
                messages[
                  res?.error
                ] ||
                'Unable to resend the code.',
                'error'
              );

              return;
            }

            secondsLeft =
              300;

            startTimer();

            digits.forEach(
              digit => {
                digit.value = '';
              }
            );

            if (digits.length > 0) {
              digits[0].focus();
            }

            showMsg(
              'A new code has been sent.',
              'ok'
            );

          } catch (error) {

            console.error(
              'OTP resend error:',
              error
            );

            showMsg(
              'Unable to resend the code. Please try again.',
              'error'
            );

          } finally {

            setTimeout(
              () => {
                resendLink.style.pointerEvents =
                  '';
              },
              2000
            );
          }
        }
      );
    }
  }
);
