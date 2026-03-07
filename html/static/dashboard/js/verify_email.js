"use strict";

let combineOTP = () => {
  const otp = ["one", "two", "three", "four", "five", "six"]
    .map((id) => document.getElementById(id).value.trim())
    .join("");
  document.getElementById("otp").value = otp;
};

// Auto-advance between OTP inputs and handle backspace/paste
let setupOtpInputs = () => {
  const inputs = Array.from(document.querySelectorAll("#otp-container .otp-input"));
  if (!inputs.length) return;

  inputs.forEach((input, idx) => {
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("autocomplete", "one-time-code");

    input.addEventListener("input", (e) => {
      const v = e.target.value.replace(/\D/g, "");
      e.target.value = v.slice(-1);
      if (e.target.value && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
        inputs[idx - 1].focus();
        inputs[idx - 1].value = "";
      }
      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        inputs[idx - 1].focus();
      }
      if (e.key === "ArrowRight" && idx < inputs.length - 1) {
        e.preventDefault();
        inputs[idx + 1].focus();
      }
    });
  });

  // Paste handler: fill all inputs from pasted 6 digits
  inputs[0].closest("#otp-container").addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!text) return;
    const digits = text.replace(/\D/g, "").slice(0, inputs.length).split("");
    if (!digits.length) return;
    e.preventDefault();
    inputs.forEach((inp, i) => {
      inp.value = digits[i] || "";
    });
    const lastFilled = Math.min(digits.length, inputs.length) - 1;
    if (lastFilled >= 0 && lastFilled < inputs.length) {
      inputs[lastFilled].focus();
    }
  });
};

document
  .getElementById("verifyEmailForm")
  .addEventListener("htmx:afterRequest", function (event) {
    const xhr = event.detail.xhr;
    const redirectURL = xhr.getResponseHeader("HX-Redirect");

    try {
      const response = JSON.parse(xhr.responseText || "{}");
      if (redirectURL) {
        window.location.href = redirectURL;
      } else if (xhr.status === 200) {
        if (response.message) {
          showNotification(response.message, "success");
        }
      } else if (response.message) {
        showNotification(response.message, "info");
      } else if (response.error) {
        showNotification(response.error, "error");
      }
    } catch (e) {
      console.error("JSON parse error:", e);
    }
  });

// Show toast notification with auto-hide
let timer;
let duration = 10; // countdown from 10 seconds

let startCountdown = () => {
  let countdownEl = document.getElementById("countdown");
  let messageEl = document.getElementById("resend");
  clearInterval(timer); // clear previous interval if any
  let timeLeft = duration;

  countdownEl.style.display = "block";
  messageEl.style.display = "none";

  timer = setInterval(() => {
    countdownEl.innerText = `Time left: ${timeLeft} second(s)`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timer);
      countdownEl.style.display = "none";
      messageEl.style.display = "block";
    }
  }, 1000);
};

document.addEventListener("DOMContentLoaded", () => {
  setupOtpInputs();
});


