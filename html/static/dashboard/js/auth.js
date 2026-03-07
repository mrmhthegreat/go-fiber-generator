"use strict";

let validatePassword = (password) => {
  const errors = [];
  const rules = {
    length: "Password must be at least 8 characters long.",
    upper: "Password must contain at least one uppercase letter.",
    number: "Password must contain at least one number.",
    special: "Password must contain at least one special character.",
  };

  if (password.length < 8) errors.push(rules.length);
  if (!/[A-Z]/.test(password)) errors.push(rules.upper);
  if (!/[0-9]/.test(password)) errors.push(rules.number);
  if (!/[!@#$%^&*(),.?":{}|<>~_-]/.test(password)) errors.push(rules.special);

  return errors;
};

let handleInputValidation = (event, inputId, validator) => {
  const value = event.target.value;
  const input = document.getElementById(inputId);
  const errors = validator(value);
  if (errors.length > 0) {
    input.classList.remove("hidden");
  } else {
    input.classList.add("hidden");
  }
};

document
  .getElementById("signin-password")
  .addEventListener("input", function (event) {
    handleInputValidation(event, "signin-password-error", validatePassword);
  });

// HTMX event listener for signin form
document
  .getElementById("signin-form")
  .addEventListener("htmx:beforeRequest", function (event) {
    // Get input values
    const email = document.getElementById("signin-email")?.value.trim();
    const password = document.getElementById("signin-password")?.value.trim();
    const emailInput = document.getElementById("signin-email");
    const passwordInput = document.getElementById("signin-password");
    emailInput?.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "border-green-500",
      "focus:ring-green-500"
    );
    passwordInput?.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "border-green-500",
      "focus:ring-green-500"
    );
    document.getElementById("signin-email-error")?.classList.add("hidden");
    document.getElementById("signin-password-error")?.classList.add("hidden");

    // Perform validation
    let isValid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("signin-email-error")?.classList.remove("hidden");
      emailInput?.classList.add("border-red-500", "focus:ring-red-500");
      isValid = false;
    }

    if (!password || validatePassword(password).length > 0) {
      document
        .getElementById("signin-password-error")
        ?.classList.remove("hidden");
      passwordInput?.classList.add("border-red-500", "focus:ring-red-500");
      showNotification("Invalid Password", "error");
      isValid = false;
    }
    // Prevent form submission if validation fails
    if (!isValid) {
      event.preventDefault(); // Stop the HTMX request
      event.detail.shouldAbort = true; // Additional HTMX-specific flag to ensure request is aborted
    }
  });

document
  .getElementById("signin-form")
  .addEventListener("htmx:afterRequest", function (event) {
    const xhr = event.detail.xhr;
    const redirectURL = xhr.getResponseHeader("HX-Redirect");
    try {
      const response = JSON.parse(xhr.responseText);
      if (redirectURL) {
        window.location.href = redirectURL;
      } else {
        if (response.password) {
          document
            .getElementById("signin-password-error")
            ?.classList.remove("hidden");
          document
            .getElementById("signin-password")
            ?.classList.add("border-red-500", "focus:ring-red-500");
        }
        if (response.email) {
          document
            .getElementById("signin-email-error")
            ?.classList.remove("hidden");
          document
            .getElementById("signin-email")
            ?.classList.add("border-red-500", "focus:ring-red-500");
        }
        if (response.error) {
          showNotification(response.error, "error");
        }
        if (response.message) {
          showNotification(response.message, "info");
        }
      }
    } catch (e) {
      showNotification("An error occurred. Please try again.", "error");
    }
  });
