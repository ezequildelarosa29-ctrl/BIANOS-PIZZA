// ============================================================
// BIANO'S PIZZA
// TWO-FACTOR AUTHENTICATION / OTP VERIFICATION
// ============================================================

"use strict";


// ============================================================
// SETTINGS
// ============================================================

const OTP_LENGTH = 6;
const OTP_TIME_LIMIT = 5 * 60; // 5 minutes


// ============================================================
// PAGE ELEMENTS
// ============================================================

const otpForm = document.getElementById("otpForm");
const verifyBtn = document.getElementById("verifyBtn");
const resendLink = document.getElementById("resendLink");
const timerText = document.getElementById("timerText");
const msgBox = document.getElementById("msgBox");

const otpInputs = Array.from(
    document.querySelectorAll(".otp-digit")
);


// ============================================================
// VARIABLES
// ============================================================

let timerInterval = null;
let remainingSeconds = OTP_TIME_LIMIT;


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(message, type = "error") {

    if (!msgBox) {
        return;
    }

    if (!message) {
        msgBox.innerHTML = "";
        return;
    }

    let className = "msg-error";

    if (type === "success") {
        className = "msg-success";
    }

    if (type === "info") {
        className = "msg-info";
    }

    msgBox.innerHTML = `
        <div class="${className}">
            ${message}
        </div>
    `;
}


// ============================================================
// GET PENDING USER ID
// ============================================================

function getPendingUserId() {

    const userId = sessionStorage.getItem(
        "bianos_pending_userid"
    );

    console.log(
        "Pending User ID:",
        userId
    );

    return userId;
}


// ============================================================
// GET OTP FROM SIX BOXES
// ============================================================

function getOtpValue() {

    return otpInputs
        .map(input => input.value.trim())
        .join("");
}


// ============================================================
// CLEAR OTP BOXES
// ============================================================

function clearOtpBoxes() {

    otpInputs.forEach(input => {
        input.value = "";
    });

    if (otpInputs.length > 0) {
        otpInputs[0].focus();
    }
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);

    const secondsLeft = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secondsLeft).padStart(2, "0")
    );
}


// ============================================================
// START OTP TIMER
// ============================================================

function startTimer() {

    clearInterval(timerInterval);

    remainingSeconds = OTP_TIME_LIMIT;

    if (timerText) {

        timerText.textContent =
            "Code expires in " +
            formatTime(remainingSeconds);
    }

    if (verifyBtn) {
        verifyBtn.disabled = false;
    }

    timerInterval = setInterval(() => {

        remainingSeconds--;

        if (remainingSeconds <= 0) {

            clearInterval(timerInterval);

            remainingSeconds = 0;

            if (timerText) {
                timerText.textContent =
                    "Code expired.";
            }

            if (verifyBtn) {
                verifyBtn.disabled = true;
            }

            showMessage(
                "Your verification code has expired. Please request a new code.",
                "error"
            );

            return;
        }

        if (timerText) {

            timerText.textContent =
                "Code expires in " +
                formatTime(remainingSeconds);
        }

    }, 1000);
}


// ============================================================
// HANDLE OTP INPUT
// ============================================================

otpInputs.forEach((input, index) => {

    // --------------------------------------------------------
    // Only allow numbers
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Keyboard controls
    // --------------------------------------------------------

    input.addEventListener("keydown", event => {

        if (
            event.key === "Backspace" &&
            input.value === "" &&
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


    // --------------------------------------------------------
    // Paste OTP
    // --------------------------------------------------------

    input.addEventListener("paste", event => {

        event.preventDefault();

        const clipboard =
            event.clipboardData ||
            window.clipboardData;

        if (!clipboard) {
            return;
        }

        const pastedCode =
            clipboard
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LENGTH);


        if (!pastedCode) {
            return;
        }


        // Put each number into its own box

        otpInputs.forEach((box, i) => {

            box.value =
                pastedCode.charAt(i) || "";
        });


        // Focus last entered number

        const focusIndex =
            Math.min(
                pastedCode.length,
                OTP_LENGTH
            ) - 1;


        if (focusIndex >= 0) {

            otpInputs[focusIndex].focus();
        }
    });

});


// ============================================================
// VERIFY OTP
// ============================================================

if (otpForm) {

    otpForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            // ------------------------------------------------
            // Get user ID
            // ------------------------------------------------

            const userId =
                getPendingUserId();


            // ------------------------------------------------
            // Get OTP
            // ------------------------------------------------

            const otp =
                getOtpValue();


            console.log(
                "================================="
            );

            console.log(
                "BIANO'S PIZZA OTP VERIFICATION"
            );

            console.log(
                "User ID:",
                userId
            );

            console.log(
                "OTP length:",
                otp.length
            );

            console.log(
                "================================="
            );


            // ------------------------------------------------
            // Check user ID
            // ------------------------------------------------

            if (!userId) {

                showMessage(
                    "Your login session was lost. Please go back to sign in and try again.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // Check OTP
            // ------------------------------------------------

            if (otp.length !== OTP_LENGTH) {

                showMessage(
                    "Please enter the complete 6-digit verification code.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // Check timer
            // ------------------------------------------------

            if (remainingSeconds <= 0) {

                showMessage(
                    "This verification code has expired. Please click Resend.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // Disable button
            // ------------------------------------------------

            if (verifyBtn) {

                verifyBtn.disabled = true;

                verifyBtn.textContent =
                    "Verifying...";
            }


            showMessage(
                "Checking your verification code...",
                "info"
            );


            try {

                // =================================================
                // SEND OTP TO GOOGLE APPS SCRIPT
                // =================================================

                const response = await apiCall(
                    "verifyOtp",
                    {
                        userId: String(userId).trim(),
                        otp: String(otp).trim()
                    }
                );


                console.log(
                    "Google Apps Script response:",
                    response
                );


                // -------------------------------------------------
                // No response
                // -------------------------------------------------

                if (!response) {

                    throw new Error(
                        "The server returned no response."
                    );
                }


                // -------------------------------------------------
                // Server returned an error
                // -------------------------------------------------

                if (response.error) {

                    console.error(
                        "OTP server error:",
                        response.error
                    );


                    let errorMessage =
                        "Incorrect verification code.";


                    if (
                        response.error ===
                        "invalid_otp"
                    ) {

                        errorMessage =
                            "Incorrect code. Please use the newest 6-digit code sent to your Gmail.";
                    }


                    else if (
                        response.error ===
                        "otp_expired"
                    ) {

                        errorMessage =
                            "This verification code has expired. Please click Resend.";
                    }


                    else if (
                        response.error ===
                        "invalid_user"
                    ) {

                        errorMessage =
                            "Your login session is invalid. Please go back to Sign in and try again.";
                    }


                    else if (
                        response.error ===
                        "invalid_session"
                    ) {

                        errorMessage =
                            "Your session is invalid. Please sign in again.";
                    }


                    else {

                        errorMessage =
                            "Verification failed: " +
                            response.error;
                    }


                    showMessage(
                        errorMessage,
                        "error"
                    );


                    if (verifyBtn) {

                        verifyBtn.disabled = false;

                        verifyBtn.textContent =
                            "Verify code";
                    }


                    return;
                }


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (response.token) {

                    console.log(
                        "OTP verification successful."
                    );


                    // Save authentication token

                    localStorage.setItem(
                        "bianos_token",
                        response.token
                    );


                    // Save username

                    localStorage.setItem(
                        "bianos_username",
                        response.username || ""
                    );


                    // Save role

                    localStorage.setItem(
                        "bianos_role",
                        response.role || ""
                    );


                    // Remove temporary login user ID

                    sessionStorage.removeItem(
                        "bianos_pending_userid"
                    );


                    // Stop timer

                    clearInterval(
                        timerInterval
                    );


                    showMessage(
                        "Verification successful! Opening dashboard...",
                        "success"
                    );


                    if (verifyBtn) {

                        verifyBtn.textContent =
                            "Verified";
                    }


                    // Go to dashboard

                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 700);


                    return;
                }


                // -------------------------------------------------
                // Unexpected response
                // -------------------------------------------------

                console.error(
                    "Unexpected server response:",
                    response
                );


                throw new Error(
                    "The server did not return a login token."
                );


            } catch (error) {

                console.error(
                    "OTP verification failed:",
                    error
                );


                showMessage(
                    "Could not verify the code. Please try again.",
                    "error"
                );


                if (verifyBtn) {

                    verifyBtn.disabled = false;

                    verifyBtn.textContent =
                        "Verify code";
                }
            }

        }
    );
}


// ============================================================
// RESEND OTP
// ============================================================

if (resendLink) {

    resendLink.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            const userId =
                getPendingUserId();


            if (!userId) {

                showMessage(
                    "Your login session was lost. Please go back to sign in.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // Disable resend temporarily
            // ------------------------------------------------

            resendLink.style.pointerEvents =
                "none";

            resendLink.style.opacity =
                "0.5";


            showMessage(
                "Sending a new verification code...",
                "info"
            );


            try {

                const response =
                    await apiCall(
                        "resendOtp",
                        {
                            userId:
                                String(userId).trim()
                        }
                    );


                console.log(
                    "Resend response:",
                    response
                );


                // ------------------------------------------------
                // Server error
                // ------------------------------------------------

                if (
                    response &&
                    response.error
                ) {

                    showMessage(
                        "Could not resend the code: " +
                        response.error,
                        "error"
                    );

                    return;
                }


                // ------------------------------------------------
                // Clear old code
                // ------------------------------------------------

                clearOtpBoxes();


                // ------------------------------------------------
                // Enable verification
                // ------------------------------------------------

                if (verifyBtn) {

                    verifyBtn.disabled =
                        false;

                    verifyBtn.textContent =
                        "Verify code";
                }


                // ------------------------------------------------
                // Restart timer
                // ------------------------------------------------

                startTimer();


                showMessage(
                    "A new verification code has been sent to your Gmail.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Resend OTP failed:",
                    error
                );


                showMessage(
                    "Could not send a new verification code. Please try again.",
                    "error"
                );


            } finally {

                // Enable resend after 3 seconds

                setTimeout(() => {

                    resendLink.style.pointerEvents =
                        "";

                    resendLink.style.opacity =
                        "";

                }, 3000);
            }

        }
    );
}


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Biano's Pizza 2FA page loaded."
        );


        const userId =
            getPendingUserId();


        // ----------------------------------------------------
        // Check pending login
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Start timer
        // ----------------------------------------------------

        startTimer();


        // ----------------------------------------------------
        // Focus first OTP box
        // ----------------------------------------------------

        if (otpInputs.length > 0) {

            otpInputs[0].focus();
        }

    }
);
