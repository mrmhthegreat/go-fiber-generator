// URL helper for role-aware dashboard paths
// Usage: fetch(u('/orders/123')) -> fetch('/superadmin/orders/123') or fetch('/dashboard/orders/123')
window.u = function (path) {
  return (window.DASH_BASE || '') + path;
};

function dropdown(){
  return {
 open: false,
  toggle() {
    this.open = !this.open;
    if (this.open) this.position();
  },
  position() {
    this.$nextTick(() => {
      const button = this.$el;
      const dropdown = this.$refs.dropdown;
      const rect = button.getBoundingClientRect();
      dropdown.style.position = "fixed";
      dropdown.style.top = `${rect.bottom + window.scrollY}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
      dropdown.style.zIndex = "999";

      // Reposition if would overflow viewport
      const dropdownRect = dropdown.getBoundingClientRect();
      if (dropdownRect.bottom > window.innerHeight) {
        dropdown.style.top = `${rect.top + window.scrollY - dropdownRect.height}px`;
      }
    });
  },
  init() {
    this.$watch("open", value => {
      if (value) this.position();
    });
  }
}
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed bottom-5 right-4 z-999991 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${type === "success"
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

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}
function htmxAjaxPromise(method, url, options) {
  return new Promise((resolve, reject) => {
    // Add event listeners
    const afterRequestHandler = (evt) => {
      if (evt.detail.pathInfo.requestPath === url) {
        document.removeEventListener("htmx:afterRequest", afterRequestHandler);
        document.removeEventListener("htmx:responseError", errorHandler);
        resolve(evt.detail.xhr);
      }
    };

    const errorHandler = (evt) => {
      if (evt.detail.pathInfo.requestPath === url) {
        document.removeEventListener("htmx:afterRequest", afterRequestHandler);
        document.removeEventListener("htmx:responseError", errorHandler);
        reject(evt.detail.xhr);
      }
    };

    document.addEventListener("htmx:afterRequest", afterRequestHandler);
    document.addEventListener("htmx:responseError", errorHandler);

    // Make the HTMX request
    htmx.ajax(method, url, options);
  });
}