// ============================================================
// BIANO'S PIZZA - EMAIL OTP / TWO-FACTOR VERIFICATION
// ============================================================

"use strict";

const OTP_LENGTH = 6;
const OTP_DISPLAY_SECONDS = 5 * 60;

const otpForm = document.getElementById("otpForm");
const verifyBtn = document.getElementById("verifyBtn");
const resendLink = document.getElementById("resendLink");
const timerText = document.getElementById("timerText");
const msgBox = document.getElementById("msgBox");

const otpInputs = Array.from(
  document.querySelectorAll(".otp-digit")
);

let timerInterval = null;
let remainingSeconds = OTP_DISPLAY_SECONDS;

function showMessage(message, type = "error") {
  if (!msgBox) return;

  const className =
    type === "success"
      ? "msg-success"
      : type === "info"
      ? "msg-info"
      : "msg-error";

  msgBox.innerHTML =
    '<div class="' + className + '">' +
    message +
    "</div>";
}

function getUserId() {
  return (
    sessionStorage.getItem(
      "bianos_pending_userid"
    ) || ""
  ).trim();
}

function getOtp() {
  return otpInputs
    .map(input => input.value.trim())
    .join("");
}

function clearOtp() {
  otpInputs.forEach(input => {
    input.value = "";
  });

  if (otpInputs[0]) {
    otpInputs[0].focus();
  }
}

function updateTimer() {
  if (!timerText) return;

  const minutes =
    Math.floor(remainingSeconds / 60);

  const seconds =
    remainingSeconds % 60;

  timerText.textContent =
    "Code expires in " +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
}

function startTimer() {
  clearInterval(timerInterval);

  remainingSeconds =
    OTP_DISPLAY_SECONDS;

  updateTimer();

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);

      if (timerText) {
        timerText.textContent =
          "Code may have expired. You can still click Verify.";
      }

      // IMPORTANT:
      // Do NOT disable Verify here.
      // Google Apps Script decides actual OTP expiry.
      if (verifyBtn) {
        verifyBtn.disabled = false;
      }

      return;
    }

    updateTimer();
  }, 1000);
}

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value =
      input.value
        .replace(/\D/g, "")
        .slice(0, 1);

    if (
      input.value &&
      index < otpInputs.length - 1
    ) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", event => {
    if (
      event.key === "Backspace" &&
      !input.value &&
      index > 0
    ) {
      otpInputs[index - 1].focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      otpInputs[index - 1].focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < otpInputs.length - 1
    ) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("paste", event => {
    event.preventDefault();

    const clipboard =
      event.clipboardData ||
      window.clipboardData;

    if (!clipboard) return;

    const pasted =
      clipboard
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH);

    if (!pasted) return;

    otpInputs.forEach((box, i) => {
      box.value =
        pasted.charAt(i) || "";
    });

    const lastIndex =
      Math.min(
        pasted.length,
        OTP_LENGTH
      ) - 1;

    if (lastIndex >= 0) {
      otpInputs[lastIndex].focus();
    }
  });
});

if (otpForm) {
  otpForm.addEventListener("submit", async event => {
    event.preventDefault();

    const userId = getUserId();
    const otp = getOtp();

    console.log(
      "Biano's Pizza OTP verification:",
      {
        userId: userId,
        otpLength: otp.length
      }
    );

    if (!userId) {
      showMessage(
        "Your login verification session was lost. Please sign in again.",
        "error"
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      showMessage(
        "Please enter the complete 6-digit verification code.",
        "error"
      );
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying…";

    showMessage(
      "Verifying your Biano's Pizza code...",
      "info"
    );

    try {
      // IMPORTANT:
      // Do not redirect to index.html for invalid_session here.
      const res = await apiCall(
        "verifyOtp",
        {
          userId: userId,
          otp: otp
        },
        false
      );

      console.log(
        "Biano's Pizza verifyOtp response:",
        res
      );

      if (!res) {
        throw new Error(
          "No response from Biano's Pizza server."
        );
      }

      if (res.error) {
        const messages = {
          invalid_otp:
            "Incorrect verification code. Use the newest code from Gmail.",

          otp_missing:
            "No verification code is stored. Please click Resend.",

          otp_expired:
            "This verification code has expired. Please click Resend.",

          invalid_user:
            "Your login session is invalid. Please sign in again.",

          server_error:
            "Biano's Pizza server error."
        };

        showMessage(
          messages[res.error] ||
          "Verification failed: " +
          res.error,
          "error"
        );

        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify code";
        return;
      }

      if (!res.token) {
        throw new Error(
          "The server did not return a login token."
        );
      }

      // ======================================================
      // FULL LOGIN SUCCESS
      // ======================================================

      localStorage.setItem(
        "bianos_token",
        String(res.token)
      );

      localStorage.setItem(
        "bianos_username",
        String(res.username || "")
      );

      localStorage.setItem(
        "bianos_role",
        String(res.role || "")
      );

      sessionStorage.removeItem(
        "bianos_pending_userid"
      );

      clearInterval(timerInterval);

      showMessage(
        "Verification successful! Opening Biano's Pizza dashboard...",
        "success"
      );

      verifyBtn.textContent = "Verified";

      setTimeout(() => {
        window.location.replace(
          "dashboard.html"
        );
      }, 500);

    } catch (error) {
      console.error(
        "Biano's Pizza OTP error:",
        error
      );

      showMessage(
        error.message ||
        "Could not verify the code.",
        "error"
      );

      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify code";
    }
  });
}

if (resendLink) {
  resendLink.addEventListener("click", async event => {
    event.preventDefault();

    const userId = getUserId();

    if (!userId) {
      showMessage(
        "Your login verification session was lost. Please sign in again.",
        "error"
      );
      return;
    }

    resendLink.style.pointerEvents = "none";
    resendLink.style.opacity = "0.5";

    showMessage(
      "Sending a new Biano's Pizza verification code...",
      "info"
    );

    try {
      const res = await apiCall(
        "resendOtp",
        { userId: userId },
        false
      );

      console.log(
        "Biano's Pizza resendOtp response:",
        res
      );

      if (res && res.error) {
        showMessage(
          "Could not resend the code: " +
          res.error,
          "error"
        );
        return;
      }

      clearOtp();

      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify code";
      }

      startTimer();

      showMessage(
        "A new verification code has been sent to your Gmail.",
        "success"
      );

    } catch (error) {
      console.error(
        "Biano's Pizza resend error:",
        error
      );

      showMessage(
        "Could not send a new verification code.",
        "error"
      );

    } finally {
      setTimeout(() => {
        resendLink.style.pointerEvents = "";
        resendLink.style.opacity = "";
      }, 3000);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = getUserId();

  console.log(
    "Biano's Pizza 2FA loaded. Pending user:",
    userId
  );

  if (!userId) {
    showMessage(
      "No pending login was found. Please go back to Sign in.",
      "error"
    );

    if (verifyBtn) {
      verifyBtn.disabled = true;
    }

    return;
  }

  startTimer();

  if (otpInputs[0]) {
    otpInputs[0].focus();
  }
});
