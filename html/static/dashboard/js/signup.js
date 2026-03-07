"use strict";

// Utilities
const reservedNames = new Set(["admin", "user", "root", "system", "guest", "moderator"]);


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

function generateRandomUsername() {
  const words = ["CoolUser", "HappyStar", "SunnyHill", "BraveFox", "QuickWave", "BrightSky", "LuckyLeaf"];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const username = `${randomWord}_${randomNum}`;
  if (reservedNames.has(username.toLowerCase())) return generateRandomUsername();
  return username;
}

function generateSuggestions(input) {
  const num1 = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const num2 = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const suggestion1 = `${input}_${num1}`;
  const suggestion2 = `${input}_${num2}`;
  return [suggestion1, suggestion2];
}

// Username live validation
document.getElementById("signup-username")?.addEventListener("input", async function (event) {
  const input = event.target;
  const value = input.value.trim();
  const link = document.getElementById("signup-username-link");
  const err = document.getElementById("signup-username-error");
  const ok = document.getElementById("signup-username-ok");

  link.textContent = value;
  err.classList.add("hidden");
  ok.classList.add("hidden");

  input.classList.remove("border-red-500", "focus:ring-red-500", "border-green-500", "focus:ring-green-500");

  if (!value) {
    input.classList.add("border-red-500", "focus:ring-red-500");
    err.classList.remove("hidden");
    err.textContent = `Try: ${generateRandomUsername()}`;
    return;
  }

  const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value);
  if (!isValidFormat || reservedNames.has(value.toLowerCase())) {
    input.classList.add("border-red-500", "focus:ring-red-500");
    err.classList.remove("hidden");
    err.textContent = "Use letters, numbers, underscore; start with a letter.";
    return;
  }

  try {
    const response = await fetch(`/web/check-username?query=${encodeURIComponent(value)}`);
    const data = await response.json();
    if (data && data.available === false) {
      const [s1, s2] = generateSuggestions(value);
      input.classList.add("border-red-500", "focus:ring-red-500");
      err.classList.remove("hidden");
      err.textContent = `${value} (taken, try ${s1} or ${s2})`;
    } else {
      input.classList.add("border-green-500", "focus:ring-green-500");
      ok.classList.remove("hidden");
      ok.textContent = `${value} (available)`;
    }
  } catch (e) {
    const [s1, s2] = generateSuggestions(value);
    input.classList.add("border-red-500", "focus:ring-red-500");
    err.classList.remove("hidden");
    err.textContent = `${value} (try ${s1} or ${s2})`;
  }
});

// Password strength hint
document.getElementById("signup-password")?.addEventListener("input", function (event) {
  const value = event.target.value;
  const errors = validatePassword(value);
  const el = document.getElementById("signup-password-error");
  if (errors.length) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
});

// Form guard + HTMX hooks
document.getElementById("signup-form")?.addEventListener("htmx:beforeRequest", function (event) {
  const fullname = document.getElementById("signup-fullname")?.value.trim();
  const username = document.getElementById("signup-username")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const password = document.getElementById("signup-password")?.value.trim();

  let isValid = true;

  if (!fullname) isValid = false;
  if (!username || !/^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(username)) {
    document.getElementById("signup-username-error")?.classList.remove("hidden");
    isValid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("signup-email-error")?.classList.remove("hidden");
    isValid = false;
  }
  if (!password || validatePassword(password).length) {
    document.getElementById("signup-password-error")?.classList.remove("hidden");
    isValid = false;
  }

  if (!isValid) {
    event.preventDefault();
    event.detail.shouldAbort = true;
  }
});

document.getElementById("signup-form")?.addEventListener("htmx:afterRequest", function (event) {
  const xhr = event.detail.xhr;
  const redirectURL = xhr.getResponseHeader("HX-Redirect");
  try {
    const response = JSON.parse(xhr.responseText || "{}");
    if (redirectURL) {
      window.location.href = redirectURL;
      return;
    }
    if (response.username) {
      document.getElementById("signup-username-error")?.classList.remove("hidden");
    }
    if (response.email) {
      document.getElementById("signup-email-error")?.classList.remove("hidden");
    }
    if (response.password) {
      document.getElementById("signup-password-error")?.classList.remove("hidden");
    }
    if (response.error && typeof showNotification === "function") {
      showNotification(response.error, "error");
    }
    if (response.message && typeof showNotification === "function") {
      showNotification(response.message, "info");
    }
  } catch (e) {
    if (typeof showNotification === "function") {
      showNotification("An error occurred. Please try again.", "error");
    }
  }
});



