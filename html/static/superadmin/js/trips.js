(function () {
  "use strict";
  document.addEventListener("alpine:init", () => {
    setTimeout(() => {
      flatpickr(".tripdatepicker", {
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
          const tableData = Alpine.$data(document.body);
          if (tableData && tableData.tripfilters) {
            tableData.tripfilters.date_range = dateStr.replace("to", "-");
            tableData.applyTripFilters();
          }
        },
      });
    }, 100);
  });
})();

// Standalone function to handle form submission
async function submitTripStatus(tableData) {
  const form = document.getElementById("update-trip-status-form");
  if (!form) {
    showNotification("Form not found", "error");
    return;
  }

  tableData.isLoading = true; // Set loading state
  const formValues = new FormData(form);
  const tripId = formValues.get("trip_id");
  const csrfToken = formValues.get("_csrf");
  const receiptStatus = formValues.get("status");
  const note = formValues.get("note");

  if (!tripId) {
    showNotification("Trip ID is missing", "error");
    return;
  }

  if (!receiptStatus) {
    showNotification("Receipt status is required", "error");
    return;
  }

  // Check if id="two" exists for conditional OOB swap
  try {
    const response = await htmxAjaxPromise(
      "PUT",
      u(`/trips/${tripId}/trips-status`),
      {
        target: `#TripStatus-${tripId}`,
        swap: "innerHTML",
        values: {
          _csrf: csrfToken,
          status: receiptStatus,
          note: note || "",
          hasTwo: tableData.isTripDetailsModalOpen ? "true" : "false",
        },
      }
    );

    // Check for HX-Redirect header

    tableData.isLoading = false; // Set loading state
    const redirectURL = response.getResponseHeader("HX-Redirect");
    if (redirectURL) {
      window.location.href = redirectURL;
    }
    // Handle success
    if (response.status === 200) {
      tableData.isUpdateTripModalOpen = false;
      showNotification("Trip updated successfully", "success");
    } else {
      const message = response.responseText
        ? JSON.parse(response.responseText).error || "Failed to update status"
        : "Failed to update status";
      showNotification(message, "error");
    }
  } catch (error) {
    tableData.isLoading = false; // Set loading state
    showNotification("Failed to update status", "error");
  }
}
// Standalone function to handle form submission
async function submitOrderStatusInsideTrip(tableData) {
  const form = document.getElementById("update-order-trip-status-form");
  if (!form) {
    showNotification("Form not found", "error");
    return;
  }

  tableData.isLoading = true; // Set loading state
  const formValues = new FormData(form);
  const orderId = formValues.get("order_id");
  const csrfToken = formValues.get("_csrf");
  const receiptStatus = formValues.get("receipt_status");
  const note = formValues.get("note");

  if (!orderId) {
    showNotification("Order ID is missing", "error");
    return;
  }

  if (!receiptStatus) {
    showNotification("Receipt status is required", "error");
    return;
  }

  // Check if id="two" exists for conditional OOB swap
  try {
    const response = await htmxAjaxPromise(
      "PUT",
      u(`/orders/${orderId}/receipt-status`),
      {
        target: `.ReceiptStatus`,
        swap: "none",
        values: {
          _csrf: csrfToken,
          receipt_status: receiptStatus,
          note: note || "",
          hasTwo: tableData.isTripDetailsModalOpen ? "true" : "false",
          swap: "false",
        },
      }
    );

    // Check for HX-Redirect header

    tableData.isLoading = false; // Set loading state
    const redirectURL = response.getResponseHeader("HX-Redirect");
    if (redirectURL) {
      window.location.href = redirectURL;
    }
    // Handle success
    if (response.status === 200) {
      const alpineComponent = document.getElementById("data-orders-container");
      const alpineData = Alpine.$data(alpineComponent);
      if (!alpineData) {
      } else {
        if (receiptStatus) {
          alpineData.updateCurrentOrder("receiptStatus", receiptStatus);
        }
        if (note) {
          alpineData.updateCurrentOrder("note", note);
        }
      }

      tableData.isOrderStautdUpdateModalOpenTrip = false;

      showNotification("Order updated successfully", "success");
    } else {
      const message = response.responseText
        ? JSON.parse(response.responseText).error || "Failed to update status"
        : "Failed to update status";
      showNotification(message, "error");
    }
  } catch (error) {
    tableData.isLoading = false; // Set loading state
    showNotification("Failed to update status", "error");
  }
}

async function submitOrderDeliveryStatusInsideTrip(tableData) {
  const form = document.getElementById("update-order-delivey-trip-status-form");
  if (!form) {
    showNotification("Form not found", "error");
    return;
  }

  tableData.isLoading = true; // Set loading state
  const formValues = new FormData(form);
  const orderId = formValues.get("order_id");
  const csrfToken = formValues.get("_csrf");
  const receiptStatus = formValues.get("delivery_status");

  if (!orderId) {
    showNotification("Order ID is missing", "error");
    return;
  }

  if (!receiptStatus) {
    showNotification("Receipt status is required", "error");
    return;
  }

  // Check if id="two" exists for conditional OOB swap
  try {
    const response = await htmxAjaxPromise(
      "PUT",
      u(`/orders/${orderId}/delivery-status`),
      {
        target: `.DeliveryStatus`,
        swap: "none",
        values: {
          _csrf: csrfToken,
          delivery_status: receiptStatus,
          hasTwo: tableData.isTripDetailsModalOpen ? "true" : "false",
          swap: "false",
        },
      }
    );

    // Check for HX-Redirect header

    tableData.isLoading = false; // Set loading state
    const redirectURL = response.getResponseHeader("HX-Redirect");
    if (redirectURL) {
      window.location.href = redirectURL;
    }
    // Handle success
    if (response.status === 200) {
      const alpineComponent = document.getElementById("data-orders-container");
      const alpineData = Alpine.$data(alpineComponent);
      if (!alpineData) {
      } else {
        if (receiptStatus) {
          alpineData.updateCurrentOrder("status", receiptStatus);
        }
      }

      tableData.isOrderDeliveryStautdUpdateModalOpenTrip = false;

      showNotification("Order updated successfully", "success");
    } else {
      const message = response.responseText
        ? JSON.parse(response.responseText).error || "Failed to update status"
        : "Failed to update status";
      showNotification(message, "error");
    }
  } catch (error) {
    tableData.isLoading = false; // Set loading state
    showNotification("Failed to update status", "error");
  }
}
async function loadTripDetail(tripID, tableData) {
  document.getElementById("trip-details-page").innerHTML = "";

  // Check if id="two" exists for conditional OOB swap
  try {
    const response = await htmxAjaxPromise(
      "GET",
      u(`/trips/${tripID}`),
      {
        target: `#trip-details-page`,
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
      tableData.isTripDetailsModalOpen = false;
      const message = response.responseText
        ? JSON.parse(response.responseText).error || "Failed to update status"
        : "Failed to update status";
      showNotification(message, "error");
    }
  } catch (error) {
    tableData.isTripDetailsModalOpen = false;

    tableData.isLoading = false;
    // Set loading state
    showNotification("Failed to update status", "error");
  }
}

function shoppingTripsTableData() {
  return {
    tripfilters: {
      status: "",
      sort_by: "created_at",
      sort_order: "desc",
      search: "",
      date_range: "",
      created_from: "",
      created_to: "",
    },
    trippagination: {
      limit: 10,
      offset: 0,
    },
    hasMoreTrips: false,
    loadingMoreTrip: false,
    isLoading: false,
    totalLoadedTrip: 0,
    isOrderStautdUpdateModalOpenTrip: false,
    isOrderDeliveryStautdUpdateModalOpenTrip: false,

    isTripDetailsModalOpen: false,
    isReciptModalOpen: false,
    isUpdateTripModalOpen: false,
    currentTripID: 0,
    currentOrderID: 0,
    currentSrc: "",

    applyTripFilters() {
      this.trippagination.offset = 0; // Reset to first page
      this.parseTripDateRange();
      this.loadTripTable(true);
    },

    resetTripFilters() {
      this.tripfilters.status = "";
      this.tripfilters.sort_by = "created_at";
      this.tripfilters.sort_order = "desc";
      this.tripfilters.search = "";
      this.tripfilters.date_range = "";
      this.tripfilters.created_from = "";
      this.tripfilters.created_to = "";
      this.trippagination.limit = 10;

      const datePicker = document.querySelector(".tripdatepicker");
      if (datePicker && datePicker._flatpickr) {
        datePicker._flatpickr.clear();
      }
      this.hasMoreTrips = false;
      this.totalLoadedTrip = 0;
      this.applyTripFilters();
    },

    parseTripDateRange() {
      if (
        this.tripfilters.date_range &&
        this.tripfilters.date_range.includes(" - ")
      ) {
        const dates = this.tripfilters.date_range.split(" - ");
        this.tripfilters.created_from = this.formatTripDateForAPI(dates[0]);
        this.tripfilters.created_to = this.formatTripDateForAPI(dates[1]);
      } else {
        this.tripfilters.created_from = "";
        this.tripfilters.created_to = "";
      }
    },

    formatTripDateForAPI(dateStr) {
      try {
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
        const day = parts[1].padStart(2, "0");
        const year = parts[2];
        if (!month || !day || !year || isNaN(day) || isNaN(year)) {
          throw new Error("Invalid date components");
        }
        return `${year}-${month}-${day}`;
      } catch (error) {
        return "";
      }
    },

    async loadTripTable(reset = false) {
      this.loadingMoreTrip = true;
      this.hasMoreTrips = false;

      if (reset) {
        document.getElementById("trips-table-container").innerHTML = "";
      } else {
        this.trippagination.offset += this.trippagination.limit;
      }
      try {
        const response = await window.htmxAjaxPromise(
          "GET",
          u("/trips-table"),
          {
            target: "#trips-table-container",
            swap: reset ? "innerHTML" : "beforeend",
            values: this.getTripFilterValues(),
          }
        );
        if (response.status != 200) {
          showNotification("Something Went Wrong", "error");
        }
        const rows = document.querySelectorAll(
          "#trips-table-container tr[data-trips-id]"
        );

        if (
          rows.length <
          this.trippagination.limit + this.trippagination.offset
        ) {
          this.hasMoreTrips = false;
        } else {
          this.hasMoreTrips = true;
        }
        this.loadingMoreTrip = false;

        this.totalLoadedTrip += rows.length;
      } finally {
        this.loadingMoreTrip = false;
      }
    },
    submitOrderStatusInsideTrip() {
      window.submitOrderStatusInsideTrip(this);
    },
    submitOrderDeliveryStatusInsideTrip() {
      window.submitOrderDeliveryStatusInsideTrip(this);
    },
    submitTripStatus() {
      window.submitTripStatus(this);
    },
    openTripDetailsView(tripId) {
      this.currentTripID = tripId;
      this.isTripDetailsModalOpen = true;
      this.isReciptModalOpen = false;
      this.isOrderStautdUpdateModalOpenTrip = false;
      this.isOrderDeliveryStautdUpdateModalOpenTrip = false;
      this.isLoading = true; // Set loading state
      window.loadTripDetail(tripId, this);
    },
    openTripUpdateView(tripId) {
      this.currentTripID = tripId;
      this.isReciptModalOpen = false;
      this.isOrderStautdUpdateModalOpenTrip = false;
      this.isOrderDeliveryStautdUpdateModalOpenTrip = false;

      this.isUpdateTripModalOpen = true;
    },
    openOrderUpdateViewTrip(orderId) {
      this.currentOrderID = orderId;
      this.isReciptModalOpen = false;
      this.isOrderStautdUpdateModalOpenTrip = true;
      this.isOrderDeliveryStautdUpdateModalOpenTrip = false;

      this.isUpdateTripModalOpen = false;
    },
    openOrderDeleiveryUpdateViewTrip(orderId) {
      this.currentOrderID = orderId;
      this.isReciptModalOpen = false;
      this.isOrderStautdUpdateModalOpenTrip = false;
      this.isOrderDeliveryStautdUpdateModalOpenTrip = true;
      this.isUpdateTripModalOpen = false;
    },
    openReciptView(src) {
      this.currentSrc = src + "#toolbar=0&view=FitH";
      this.isOrderStautdUpdateModalOpenTrip = false;
      this.isOrderDeliveryStautdUpdateModalOpenTrip = false;

      this.isUpdateTripModalOpen = false;
      this.isReciptModalOpen = true;
    },
    getTripFilterValues() {
      return {
        status: this.tripfilters.status,
        sort_by: this.tripfilters.sort_by,
        sort_order: this.tripfilters.sort_order,
        limit: this.trippagination.limit,
        offset: this.trippagination.offset,
        search: this.tripfilters.search,
        created_from: this.tripfilters.created_from,
        created_to: this.tripfilters.created_to,
        csrf_token:
          document.querySelector('input[name="csrf_token"]')?.value || "",
      };
    },
    init() {
      // This runs when Alpine initializes
      this.$nextTick(() => {
        this.loadTripTable(true);
      });
    },
  };
}
