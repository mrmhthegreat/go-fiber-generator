(function () {
  "use strict";

  // ===================================
  // CLEAVE.JS FORMATTING
  // ===================================
  
  // Initialize Cleave.js for commission amounts with dollar formatting
  var commissionBaseFormat = new Cleave('.commission-base-format', {
    numeral: true,
    numeralThousandsGroupStyle: 'thousand',
    numeralDecimalScale: 2,
    prefix: '',
    rawValueTrimPrefix: true
  });

  var commissionExtraFormat = new Cleave('.commission-extra-format', {
    numeral: true,
    numeralThousandsGroupStyle: 'thousand',
    numeralDecimalScale: 2,
    prefix: '',
    rawValueTrimPrefix: true
  });

  // ===================================
  // COMMISSION LOGIC
  // ===================================
  
  const commissionTypeSelect = document.getElementById("commission_type");
  const commissionExtraWrapper = document.getElementById("commission_extra_wrapper");
  const commissionExtraInput = document.getElementById("commission_extra_amount");
  const baseCommissionLabel = document.getElementById("base_commission_label");

  // Function to toggle commission extra field and update labels
  function toggleCommissionFields() {
    if (!commissionTypeSelect || !commissionExtraWrapper) return;
    
    const selectedType = commissionTypeSelect.value;
    
    if (selectedType === "Per Item") {
      // Show extra commission field
      commissionExtraWrapper.classList.remove("hidden");
      commissionExtraInput.setAttribute("required", "required");
      baseCommissionLabel.textContent = "Base Commission";
    } else {
      // Hide extra commission field
      commissionExtraWrapper.classList.add("hidden");
      commissionExtraInput.removeAttribute("required");
      commissionExtraInput.value = "";
      
      // Update label based on type
      if (selectedType === "Per Order") {
        baseCommissionLabel.textContent = "Commission per Order";
      } else if (selectedType === "Per Day") {
        baseCommissionLabel.textContent = "Commission per Day";
      } else if (selectedType === "Zero") {
        baseCommissionLabel.textContent = "Commission Amount";
      } else {
        baseCommissionLabel.textContent = "Base Commission";
      }
    }
  }

  // Listen for commission type changes
  if (commissionTypeSelect) {
    commissionTypeSelect.addEventListener("change", toggleCommissionFields);
    // Initialize on page load
    toggleCommissionFields();
  }

  // ===================================
  // COMMISSION FORM HANDLERS
  // ===================================
  
  const commissionForm = document.getElementById("commissionForm");
  
  if (commissionForm) {
    commissionForm.addEventListener("htmx:beforeRequest", (event) => {
      const selectedType = commissionTypeSelect.value;
      
      // Validate extra commission is filled when type is "Per Item"
      if (selectedType === "Per Item") {
        const extraAmount = commissionExtraInput.value.trim();
        if (!extraAmount) {
          event.preventDefault();
          showNotification("Please enter commission for extra items", "error");
          commissionExtraInput.classList.add("border-red-500");
          return;
        }
      }
    });

    commissionForm.addEventListener("htmx:afterRequest", function (event) {
      const xhr = event.detail.xhr;
      const redirectURL = xhr.getResponseHeader("HX-Redirect");
      const response = event.detail.xhr.response;

      try {
        if (redirectURL) {
          showNotification("Commission updated successfully", "success");
          setTimeout(() => {
            window.location.href = redirectURL;
          }, 1000);
        } else if (xhr.status >= 400) {
          try {
            const errorData = JSON.parse(response);
            if (errorData.error) {
              showNotification(errorData.error, "error");
            } else if (errorData.message) {
              showNotification(errorData.message, "error");
            }
          } catch (e) {
            showNotification("An unexpected error occurred", "error");
          }
        } else if (xhr.status === 200) {
          showNotification("Commission updated successfully", "success");
        }
      } catch (e) {
        showNotification("An unexpected error occurred", "error");
      }
    });
  }

  // ===================================
  // USERNAME CHANGE LOGIC
  // ===================================
  
  // Reserved usernames
  const reservedNames = new Set([
    "admin",
    "user",
    "root",
    "system",
    "guest",
    "moderator",
    "dashboard",
    "api",
    "settings",
    "profile",
  ]);

  // Function to generate random username
  function generateRandomUsername() {
    const words = [
      "CoolUser",
      "HappyStar",
      "SunnyHill",
      "BraveFox",
      "QuickWave",
      "BrightSky",
      "LuckyLeaf",
    ];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const username = `${randomWord}_${randomNum}`;
    if (reservedNames.has(username.toLowerCase())) {
      return generateRandomUsername();
    }
    return username;
  }

  // Function to generate suggestions
  function generateSuggestions(input) {
    const num1 = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    const num2 = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    const suggestion1 = `${input}_${num1}`;
    const suggestion2 = `${input}_${num2}`;
    
    if (
      reservedNames.has(suggestion1.toLowerCase()) ||
      reservedNames.has(suggestion2.toLowerCase()) ||
      !/^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(suggestion1) ||
      !/^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(suggestion2)
    ) {
      return generateSuggestions(input);
    }
    return [suggestion1, suggestion2];
  }

  // Username validation
  const usernameInput = document.getElementById("new_username");
  
  if (usernameInput) {
    usernameInput.addEventListener("input", async function (event) {
      const input = event.target;
      const value = input.value.trim();
      const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value);
      const isNotReserved = !reservedNames.has(value.toLowerCase());

      const usernameLink = document.getElementById("username-link-modal");
      const usernameInvalid = document.getElementById("username-invalid-feedback-modal");
      const usernameValid = document.getElementById("username-valid-feedback-modal");

      // Reset classes
      input.classList.remove(
        "border-red-500", "border-green-500", 
        "ring-red-500", "ring-green-500",
        "focus:ring-red-500", "focus:ring-green-500"
      );
      usernameInvalid.classList.add("hidden");
      usernameValid.classList.add("hidden");

      // Update link preview
      usernameLink.textContent = value || "username";
      usernameInvalid.textContent = "";
      usernameValid.textContent = "";

      // Handle empty input
      if (!value) {
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `Try: ${generateRandomUsername()}`;
        return;
      }

      // Handle invalid format
      if (!isValidFormat) {
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `Minimum 4 characters, start with a letter, use only letters, numbers, or underscores`;
        return;
      }

      // Handle reserved names
      if (!isNotReserved) {
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `${value} is a reserved name`;
        return;
      }

      // Check API for availability
      try {
        const response = await fetch(
          `/web/check-username?query=${encodeURIComponent(value)}`
        );

        if (response.status === 200) {
          // Username taken
          const [suggestion1, suggestion2] = generateSuggestions(value);
          input.classList.add("border-red-500", "focus:ring-red-500");
          usernameInvalid.classList.remove("hidden");
          usernameInvalid.textContent = `${value} is taken, try ${suggestion1} or ${suggestion2}`;
        } else if (response.status === 409) {
          // Username available
          input.classList.add("border-green-500", "focus:ring-green-500");
          usernameValid.classList.remove("hidden");
          usernameValid.textContent = `${value} is available`;
        } else {
          const [suggestion1, suggestion2] = generateSuggestions(value);
          input.classList.add("border-red-500", "focus:ring-red-500");
          usernameInvalid.classList.remove("hidden");
          usernameInvalid.textContent = `${value} is taken, try ${suggestion1} or ${suggestion2}`;
        }
      } catch (error) {
        const [suggestion1, suggestion2] = generateSuggestions(value);
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `${value} is taken, try ${suggestion1} or ${suggestion2}`;
      }
    });
  }

  // ===================================
  // USERNAME FORM HANDLERS
  // ===================================
  
  const usernameForm = document.getElementById("usernameChangeForm");
  
  if (usernameForm) {
    usernameForm.addEventListener("htmx:beforeRequest", (event) => {
      const input = document.getElementById("new_username");
      const value = input.value.trim();
      const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value);
      const isNotReserved = !reservedNames.has(value.toLowerCase());

      const usernameInvalid = document.getElementById("username-invalid-feedback-modal");

      // Reset
      input.classList.remove("border-red-500", "border-green-500");
      usernameInvalid.classList.add("hidden");

      // Validate before request
      if (!value) {
        event.preventDefault();
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `Try: ${generateRandomUsername()}`;
        return;
      }

      if (!isValidFormat) {
        event.preventDefault();
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `Minimum 4 characters, start with a letter, use only letters, numbers, or underscores`;
        return;
      }

      if (!isNotReserved) {
        event.preventDefault();
        input.classList.add("border-red-500", "focus:ring-red-500");
        usernameInvalid.classList.remove("hidden");
        usernameInvalid.textContent = `${value} is a reserved name`;
        return;
      }
    });

    usernameForm.addEventListener("htmx:afterRequest", function (event) {
      const xhr = event.detail.xhr;
      const redirectURL = xhr.getResponseHeader("HX-Redirect");
      const input = document.getElementById("new_username");
      const usernameInvalid = document.getElementById("username-invalid-feedback-modal");

      try {
        const response = JSON.parse(xhr.responseText);
        
        if (redirectURL) {
          showNotification("Username updated successfully", "success");
          setTimeout(() => {
            window.location.href = redirectURL;
          }, 1000);
        } else if (xhr.status === 406) {
          const value = input.value.trim();
          input.classList.add("border-red-500", "focus:ring-red-500");
          usernameInvalid.classList.remove("hidden");
          usernameInvalid.textContent = `${value} is already taken`;
          showNotification("Username already taken", "error");
        } else if (response.message) {
          showNotification(response.message, "error");
        } else if (response.error) {
          showNotification(response.error, "error");
        }
      } catch (e) {
        showNotification("An unexpected error occurred", "error");
      }
    });
  }

  // ===================================
  // PROFILE INFO FORM HANDLER
  // ===================================
  
  let loadFile = function (event) {
    var reader = new FileReader();
    reader.onload = function () {
      var output = document.getElementById("profile-img");
      if (event.target.files[0].type.match("image.*")) {
        output.src = reader.result;
      } else {
        event.target.value = "";
        alert("please select a valid image");
      }
    };
    reader.readAsDataURL(event.target.files[0]);
  };

  // for profile photo update
  let ProfileChange = document.querySelector("#profile-change");
  if (ProfileChange) {
    ProfileChange.addEventListener("change", loadFile);
  }

  const profileForm = document.getElementById("profileformupdate");
  
  if (profileForm) {
    profileForm.addEventListener("htmx:afterRequest", function (event) {
      const xhr = event.detail.xhr;
      const redirectURL = xhr.getResponseHeader("HX-Redirect");
      const response = event.detail.xhr.response;
      
      try {
        if (redirectURL) {
          showNotification("Profile updated successfully", "success");
          setTimeout(() => {
            window.location.href = redirectURL;
          }, 1000);
        } else if (xhr.status >= 400) {
          try {
            const errorData = JSON.parse(response);
            if (errorData.error) {
              showNotification(errorData.error, "error");
            } else if (errorData.message) {
              showNotification(errorData.message, "error");
            }
          } catch (e) {
            showNotification("An unexpected error occurred", "error");
          }
        }
      } catch (e) {
        showNotification("An unexpected error occurred", "error");
      }
    });
  }
})();

// ===================================
// NOTIFICATION FUNCTION
// ===================================

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;

  const icon =
    type === "success"
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
      : type === "error"
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icon}
      </svg>
      <span class="text-sm">${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}