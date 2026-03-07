"use strict";

document.getElementById("forget-password-form")?.addEventListener("htmx:beforeRequest", function (event) {
  const email = document.getElementById("forget-email")?.value.trim();
  const emailInput = document.getElementById("forget-email");
  const emailError = document.getElementById("forget-email-error");

  emailInput?.classList.remove("border-red-500","focus:ring-red-500","border-green-500","focus:ring-green-500");
  emailError?.classList.add("hidden");

  let isValid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError?.classList.remove("hidden");
    emailInput?.classList.add("border-red-500","focus:ring-red-500");
    isValid = false;
  }

  if (!isValid) {
    event.preventDefault();
    event.detail.shouldAbort = true;
  }
});

document.getElementById("forget-password-form")?.addEventListener("htmx:afterRequest", function (event) {
  const xhr = event.detail.xhr;
  const emailInput = document.getElementById("forget-email");
  const emailError = document.getElementById("forget-email-error");
  try {
    const response = JSON.parse(xhr.responseText || "{}");
    if (response.email) {
      emailError?.classList.remove("hidden");
      emailInput?.classList.add("border-red-500","focus:ring-red-500");
    }
    if (response.message && typeof showNotification === "function") {
      showNotification(response.message, "info");
    }
  } catch (e) {
    // no-op
  }
});

"use strict";



document
  .getElementById("forget-password-form")
  .addEventListener("htmx:afterRequest", function (event) {
    const xhr = event.detail.xhr;
    const redirectURL = xhr.getResponseHeader("HX-Redirect");
    try {
      const response = JSON.parse(xhr.responseText);
      if (redirectURL) {
        window.location.href = redirectURL;
      } else {
        if (response.email) {
          document.getElementById("forget-email-error")?.classList.remove("hidden");
        }
        if (response.error) {
          showNotification(response.error, "error");
        }
        if (response.message) {
          showNotification(response.message, "info");
        }
      }
    } catch (e) {
      showNotification("An error occurred. Please try again.","error");
    }
  });
