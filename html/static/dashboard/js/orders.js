(function () {
  "use strict";

  document.addEventListener("alpine:init", () => {
    setTimeout(() => {
      flatpickr(".orderdatepicker", {
        mode: "range",
        static: true,
        monthSelectorType: "static",
        dateFormat: "M j, Y",
        defaultDate: [new Date().setDate(new Date().getDate() - 6), new Date()],
        prevArrow:
          '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        nextArrow:
          '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        onReady: (selectedDates, dateStr, instance) => {
          instance.element.value = dateStr.replace("to", "-");
          const customClass = instance.element.getAttribute("data-class");
          if (customClass) {
            instance.calendarContainer.classList.add(customClass);
          }
        },
        onChange: (selectedDates, dateStr, instance) => {
          instance.element.value = dateStr.replace("to", "-");
          // Update Alpine.js data
          const tableData = Alpine.$data(document.body);
          if (tableData && tableData.orderfilters) {
            tableData.orderfilters.date_range = dateStr.replace("to", "-");
          }
        },
      });
    }, 100);
  });
})();


async function loadOrderDetail(orderId, tableData) {
  document.getElementById("order-details-page").innerHTML = "";

  // Check if id="two" exists for conditional OOB swap
  try {
    const response = await htmxAjaxPromise(
      "GET",
      `/dashboard/orders/${orderId}/`,
      {
        target: `#order-details-page`,
        swap: "innerHTML",
      }
    );

    // Check for HX-Redirect header

    tableData.isLoading = false; // Set loading state
    const redirectURL = response.getResponseHeader("HX-Redirect");
    if (redirectURL) {
      window.location.href = redirectURL;
    }
    // Handle success
    if (response.status != 200) {
      tableData.isOrderDetailsModalOpen = false;
      const message = response.responseText
        ? JSON.parse(response.responseText).error || "Failed to update status"
        : "Failed to update status";
      showNotification(message, "error");
    }
  } catch (error) {
    tableData.isOrderDetailsModalOpen = false;

    tableData.isLoading = false;
    // Set loading state
    showNotification("Failed to update status", "error");
  }
}

function orderTableData() {
  return {
    orderfilters: {
      receipt_status: "",
      delivery_status: "",
      sort_by: "placed_at",
      sort_order: "desc",
      search: "",
      date_range: "",
      placed_from: "",
      placed_to: "",
    },
    orderpagination: {
      limit: 10,
      offset: 0,
    },
    hasMoreOrders: false,
    loadingMoreOrder: false,
    isLoading: false,
    totalorderLoaded: 0,
    isOrderDetailsModalOpen: false,
    isReciptModalOpen: false,
    currentOrderID: 0,
    currentSrc: "",
    applyorderfilters() {
      this.orderpagination.offset = 0; // Reset to first page
      this.parseOrderDateRange();
      this.loadOrderTable(true);
    },

    resetorderfilters() {
      this.orderfilters.receipt_status = "";
      this.orderfilters.delivery_status = "";
      this.orderfilters.sort_by = "placed_at";
      this.orderfilters.sort_order = "desc";
      this.orderfilters.search = "";
      this.orderfilters.date_range = "";
      this.orderfilters.placed_from = "";
      this.orderfilters.placed_to = "";
      this.orderpagination.limit = 10;

      // Reset flatpickr
      const datePicker = document.querySelector(".orderdatepicker");
      if (datePicker && datePicker._flatpickr) {
        datePicker._flatpickr.clear();
      }
      this.hasMoreOrders = false;
      this.totalorderLoaded = 0;
      this.applyorderfilters();
    },

    parseOrderDateRange() {
      if (this.orderfilters.date_range && this.orderfilters.date_range.includes(" - ")) {
        const dates = this.orderfilters.date_range.split(" - ");
        this.orderfilters.placed_from = this.formatOrderDateForAPI(dates[0]);
        this.orderfilters.placed_to = this.formatOrderDateForAPI(dates[1]);
      } else {
        this.orderfilters.placed_from = "";
        this.orderfilters.placed_to = "";
      }
    },

    formatOrderDateForAPI(dateStr) {
      try {
        // Expected input format: "M j, Y" (e.g., "Aug 10, 2025")
        const months = {
          Jan: "01",
          Feb: "02",
          Mar: "03",
          Apr: "04",
          May: "05",
          Jun: "06",
          Jul: "07",
          Aug: "08",
          Sep: "09",
          Oct: "10",
          Nov: "11",
          Dec: "12",
        };

        const parts = dateStr.replace(",", "").split(" ");
        if (parts.length !== 3) {
          throw new Error("Invalid date format");
        }

        const month = months[parts[0]];
        const day = parts[1].padStart(2, "0"); // Ensure two-digit day
        const year = parts[2];

        if (!month || !day || !year || isNaN(day) || isNaN(year)) {
          throw new Error("Invalid date components");
        }

        return `${year}-${month}-${day}`;
      } catch (error) {
        return "";
      }
    },

    async loadOrderTable(reset = false) {
      this.loadingMoreOrder = true;
      this.hasMoreOrders = false;

      if (reset) {
        document.getElementById("orders-table-container").innerHTML = "";
      } else {
        this.orderpagination.offset += this.orderpagination.limit;
      }

      try {
        const response = await window.htmxAjaxPromise(
          "GET",
          "/dashboard/orders-table",
          {
            target: "#orders-table-container",
            swap: reset ? "innerHTML" : "beforeend",
            values: this.getOrderFilterValues(),
          }
        );
        if (response.status != 200) {
          showNotification("Something Went Wrong", "error");
        }
        const rows = document.querySelectorAll(
          "#orders-table-container tr[data-order-id]"
        );

        if (rows.length < this.orderpagination.limit + this.orderpagination.offset) {
          this.hasMoreOrders = false;
        } else {
          this.hasMoreOrders = true;
        }
        this.loadingMoreOrder = false;

        this.totalorderLoaded += rows.length;
      } finally {
        this.loadingMoreOrder = false;
      }
    },
   
    openOrderDetailsView(orderId) {
      this.currentOrderID = orderId;
      this.isOrderDetailsModalOpen = true;
      this.isReciptModalOpen = false;
      this.isLoading = true; // Set loading state

      window.loadOrderDetail(orderId, this);
    },
  
   
    openReciptView(src) {
      this.currentSrc = src + "#toolbar=0&view=FitH";
      this.isReciptModalOpen = true;
    },
    getOrderFilterValues() {
      return {
        receipt_status: this.orderfilters.receipt_status,
        delivery_status: this.orderfilters.delivery_status,
        sort_by: this.orderfilters.sort_by,
        sort_order: this.orderfilters.sort_order,
        search: this.orderfilters.search,
        placed_from: this.orderfilters.placed_from,
        placed_to: this.orderfilters.placed_to,
        csrf_token:
          document.querySelector('input[name="csrf_token"]')?.value || "",
        offset: this.orderpagination.offset,
        limit: this.orderpagination.limit,
      };
    },
    init() {
      // This runs when Alpine initializes
      this.$nextTick(() => {
        this.loadOrderTable(true);
      });
    },
  };
}
