
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // ==========================================
  // CONFIGURATION
  // ==========================================

  const API_BASE_URL = "https://backend-port-wr91.onrender.com";
  const ENQUIRIES_API = `${API_BASE_URL}/api/enquiries`;

  const THEME_KEY = "kewadev_admin_theme";
  const ITEMS_PER_PAGE = 5;

  let enquiries = [];
  let currentPage = 1;
  let messageTimer = null;

  // ==========================================
  // DOM ELEMENTS
  // ==========================================

  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.querySelector("#menuToggle");
  const themeToggle = document.querySelector("#themeToggle");
  const logoutBtn = document.querySelector("#logoutBtn");

  const totalEnquiriesEl = document.querySelector("#totalEnquiries");
  const newEnquiriesEl = document.querySelector("#newEnquiries");
  const pendingEnquiriesEl = document.querySelector("#pendingEnquiries");
  const completedEnquiriesEl = document.querySelector("#completedEnquiries");

  const exportBtn = document.querySelector("#exportBtn");
  const searchInput = document.querySelector("#searchInput");
  const statusFilter = document.querySelector("#statusFilter");
  const sortSelect = document.querySelector("#sortSelect");

  const enquiriesTableBody = document.querySelector("#enquiriesTableBody");
  const enquiriesTable = document.querySelector("#enquiriesTable");
  const messageEl = document.querySelector("#message");
  const emptyState = document.querySelector("#emptyState");

  const pagination = document.querySelector("#pagination");
  const currentYearEl = document.querySelector("#currentYear");

  const enquiryModal = document.querySelector("#enquiryModal");
  const closeModalBtn = document.querySelector("#closeModal");
  const enquiryDetails = document.querySelector("#enquiryDetails");
  const enquiryStatusForm = document.querySelector("#enquiryStatusForm");
  const enquiryStatusSelect = document.querySelector("#enquiryStatus");

  // ==========================================
  // STATUS LABELS
  // ==========================================

  const statusLabels = {
    new: "New",
    "in-progress": "In Progress",
    completed: "Completed",
    archived: "Archived"
  };

  function normaliseStatus(status) {
    const value = String(status || "new").toLowerCase();

    if (value === "pending" || value === "in progress") {
      return "in-progress";
    }

    if (["new", "in-progress", "completed", "archived"].includes(value)) {
      return value;
    }

    return "new";
  }

  // ==========================================
  // API HELPER
  // ==========================================

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;

      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorMessage;
      } catch (_) {
        // Response may not contain JSON.
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return null;
  }

  // ==========================================
  // SECURITY / HTML ESCAPING
  // ==========================================

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    });
  }

  // ==========================================
  // NORMALISE API DATA
  // ==========================================

  function normaliseEnquiry(item) {
    return {
      id: item.id ?? item._id,
      name: item.name ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      subject: item.subject ?? "",
      message: item.message ?? "",
      status: normaliseStatus(item.status),
      createdAt: item.createdAt ?? item.created_at ?? item.date ?? null
    };
  }

  // ==========================================
  // LOAD ENQUIRIES FROM BACKEND
  // ==========================================

  async function loadEnquiries() {
    if (enquiriesTableBody) {
      enquiriesTableBody.innerHTML =
        '<tr><td colspan="7">Loading enquiries...</td></tr>';
    }

    try {
      const result = await apiRequest(ENQUIRIES_API);

      const data = Array.isArray(result)
        ? result
        : result?.enquiries;

      if (!Array.isArray(data)) {
        throw new Error("Backend response format is incorrect.");
      }

      enquiries = data.map(normaliseEnquiry);
      return true;
    } catch (error) {
      console.error("Load enquiries error:", error);
      enquiries = [];

      showMessage(
        `Enquiries load nahi hui: ${error.message}`,
        "error"
      );

      if (enquiriesTableBody) {
        enquiriesTableBody.innerHTML = "";
      }

      return false;
    }
  }

  // ==========================================
  // SAVE STATUS TO BACKEND
  // ==========================================

  async function updateEnquiryOnServer(id, status) {
    return apiRequest(
      `${ENQUIRIES_API}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );
  }

  // ==========================================
  // DELETE ENQUIRY FROM BACKEND
  // ==========================================

  async function deleteEnquiryOnServer(id) {
    return apiRequest(
      `${ENQUIRIES_API}/${encodeURIComponent(id)}`,
      {
        method: "DELETE"
      }
    );
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  function showMessage(message, type = "success") {
    if (!messageEl) {
      console.log(message);
      return;
    }

    clearTimeout(messageTimer);

    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.hidden = false;

    messageTimer = setTimeout(function () {
      messageEl.hidden = true;
    }, 3500);
  }

  // ==========================================
  // DATE FORMATTING
  // ==========================================

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  function updateStatistics() {
    const total = enquiries.length;

    const newCount = enquiries.filter(
      item => item.status === "new"
    ).length;

    const pendingCount = enquiries.filter(
      item => item.status === "in-progress"
    ).length;

    const completedCount = enquiries.filter(
      item => item.status === "completed"
    ).length;

    if (totalEnquiriesEl) totalEnquiriesEl.textContent = total;
    if (newEnquiriesEl) newEnquiriesEl.textContent = newCount;
    if (pendingEnquiriesEl) pendingEnquiriesEl.textContent = pendingCount;
    if (completedEnquiriesEl) {
      completedEnquiriesEl.textContent = completedCount;
    }
  }

  // ==========================================
  // FILTER AND SORT
  // ==========================================

  function getFilteredEnquiries() {
    const searchTerm = (searchInput?.value || "")
      .trim()
      .toLowerCase();

    const selectedStatus = statusFilter?.value || "all";
    const sortValue = sortSelect?.value || "newest";

    let filtered = enquiries.filter(function (item) {
      const searchableText = [
        item.name,
        item.email,
        item.phone,
        item.subject,
        item.message
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);

      const matchesStatus =
        selectedStatus === "all" ||
        item.status === normaliseStatus(selectedStatus);

      return matchesSearch && matchesStatus;
    });

    filtered.sort(function (a, b) {
      const dateA = new Date(a.createdAt || 0).getTime() || 0;
      const dateB = new Date(b.createdAt || 0).getTime() || 0;

      if (sortValue === "oldest") return dateA - dateB;
      if (sortValue === "name") {
        return a.name.localeCompare(b.name);
      }

      return dateB - dateA;
    });

    return filtered;
  }

  // ==========================================
  // RENDER TABLE AND PAGINATION
  // ==========================================

  function renderEnquiries() {
    updateStatistics();

    if (!enquiriesTableBody) return;

    const filtered = getFilteredEnquiries();
    const totalPages = Math.max(
      1,
      Math.ceil(filtered.length / ITEMS_PER_PAGE)
    );

    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    if (emptyState) {
      emptyState.hidden = filtered.length !== 0;
    }

    if (enquiriesTable) {
      enquiriesTable.hidden = filtered.length === 0;
    }

    if (pageItems.length === 0) {
      enquiriesTableBody.innerHTML = "";
    } else {
      enquiriesTableBody.innerHTML = pageItems.map(function (item) {
        const status = normaliseStatus(item.status);
        const safeId = escapeHTML(item.id);

        return `
          <tr>
            <td>${escapeHTML(item.name)}</td>
            <td>${escapeHTML(item.email)}</td>
            <td>${escapeHTML(item.subject || "—")}</td>
            <td>${escapeHTML(formatDate(item.createdAt))}</td>
            <td>
              <span class="status status-${escapeHTML(status)}">
                ${escapeHTML(statusLabels[status])}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="view-btn"
                data-action="view"
                data-id="${safeId}"
              >View</button>

              <button
                type="button"
                class="delete-btn"
                data-action="delete"
                data-id="${safeId}"
              >Delete</button>
            </td>
          </tr>
        `;
      }).join("");
    }

    renderPagination(filtered.length, totalPages);
  }

  function renderPagination(totalItems, totalPages) {
    if (!pagination) return;

    if (totalItems <= ITEMS_PER_PAGE) {
      pagination.innerHTML = "";
      return;
    }

    let html = `
      <button type="button" data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}>
        Previous
      </button>
    `;

    for (let page = 1; page <= totalPages; page++) {
      html += `
        <button type="button"
          data-page="${page}"
          ${page === currentPage ? 'aria-current="page"' : ""}>
          ${page}
        </button>
      `;
    }

    html += `
      <button type="button" data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}>
        Next
      </button>
    `;

    pagination.innerHTML = html;
  }

  // ==========================================
  // ENQUIRY DETAILS MODAL
  // ==========================================

  function openEnquiryModal(item) {
    if (!enquiryModal || !enquiryDetails) return;

    enquiryDetails.innerHTML = `
      <p><strong>Name:</strong> ${escapeHTML(item.name)}</p>
      <p><strong>Email:</strong> ${escapeHTML(item.email)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(item.phone || "—")}</p>
      <p><strong>Subject:</strong> ${escapeHTML(item.subject || "—")}</p>
      <p><strong>Message:</strong></p>
      <p class="enquiry-message">${escapeHTML(item.message || "—")}</p>
      <p><strong>Received:</strong> ${escapeHTML(formatDateTime(item.createdAt))}</p>
    `;

    if (enquiryStatusSelect) {
      enquiryStatusSelect.value = normaliseStatus(item.status);
    }

    enquiryModal.dataset.enquiryId = item.id;
    enquiryModal.hidden = false;
    enquiryModal.classList.add("open");
    enquiryModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!enquiryModal) return;

    enquiryModal.hidden = true;
    enquiryModal.classList.remove("open");
    enquiryModal.setAttribute("aria-hidden", "true");
    delete enquiryModal.dataset.enquiryId;
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (enquiryModal) {
    enquiryModal.addEventListener("click", function (event) {
      if (event.target === enquiryModal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  // ==========================================
  // VIEW / DELETE ACTIONS
  // ==========================================

  if (enquiriesTableBody) {
    enquiriesTableBody.addEventListener("click", async function (event) {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const id = button.dataset.id;
      const action = button.dataset.action;

      const item = enquiries.find(
        enquiry => String(enquiry.id) === String(id)
      );

      if (!item) {
        showMessage("Enquiry nahi mili.", "error");
        return;
      }

      if (action === "view") {
        openEnquiryModal(item);
        return;
      }

      if (action === "delete") {
        const confirmed = window.confirm(
          `Kya aap ${item.name || "is enquiry"} ko delete karna chahte hain?`
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
          await deleteEnquiryOnServer(item.id);

          enquiries = enquiries.filter(
            enquiry => String(enquiry.id) !== String(item.id)
          );

          renderEnquiries();
          showMessage("Enquiry successfully delete ho gayi.");
        } catch (error) {
          console.error("Delete enquiry error:", error);
          showMessage(`Delete nahi hui: ${error.message}`, "error");
          button.disabled = false;
        }
      }
    });
  }

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  if (enquiryStatusForm) {
    enquiryStatusForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const id = enquiryModal?.dataset.enquiryId;
      const selectedStatus = normaliseStatus(
        enquiryStatusSelect?.value
      );

      if (!id) {
        showMessage("Enquiry ID nahi mili.", "error");
        return;
      }

      const item = enquiries.find(
        enquiry => String(enquiry.id) === String(id)
      );

      if (!item) {
        showMessage("Enquiry nahi mili.", "error");
        return;
      }

      const submitButton = enquiryStatusForm.querySelector(
        'button[type="submit"]'
      );

      if (submitButton) submitButton.disabled = true;

      try {
        await updateEnquiryOnServer(item.id, selectedStatus);

        item.status = selectedStatus;

        closeModal();
        renderEnquiries();
        showMessage("Enquiry status update ho gaya.");
      } catch (error) {
        console.error("Update status error:", error);
        showMessage(`Status update nahi hua: ${error.message}`, "error");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  // ==========================================
  // SEARCH / FILTER / SORT
  // ==========================================

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentPage = 1;
      renderEnquiries();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      currentPage = 1;
      renderEnquiries();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      currentPage = 1;
      renderEnquiries();
    });
  }

  // ==========================================
  // PAGINATION EVENTS
  // ==========================================

  if (pagination) {
    pagination.addEventListener("click", function (event) {
      const button = event.target.closest("[data-page]");
      if (!button || button.disabled) return;

      const page = Number(button.dataset.page);

      if (!Number.isInteger(page) || page < 1) return;

      currentPage = page;
      renderEnquiries();
    });
  }

  // ==========================================
  // CSV EXPORT
  // ==========================================

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      const filtered = getFilteredEnquiries();

      if (filtered.length === 0) {
        showMessage("Export karne ke liye enquiries nahi hain.", "error");
        return;
      }

      const headers = [
        "Name",
        "Email",
        "Phone",
        "Subject",
        "Message",
        "Status",
        "Created At"
      ];

      const rows = filtered.map(function (item) {
        return [
          item.name,
          item.email,
          item.phone,
          item.subject,
          item.message,
          statusLabels[item.status] || item.status,
          formatDateTime(item.createdAt)
        ];
      });

      const csvContent = [
        headers.map(csvEscape).join(","),
        ...rows.map(row => row.map(csvEscape).join(","))
      ].join("\r\n");

      const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `kewa-enquiries-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showMessage("CSV export ho gaya.");
    });
  }

  // ==========================================
  // SIDEBAR / MOBILE MENU
  // ==========================================

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // ==========================================
  // THEME
  // ==========================================

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";

      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      applyTheme(nextTheme);
      localStorage.setItem(THEME_KEY, nextTheme);
    });
  }

  
  // ==========================================
  // LOGOUT
  // ==========================================

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (event) {
      event.preventDefault();

      const confirmed = window.confirm(
        "Kya aap logout karna chahte hain?"
      );

      if (!confirmed) return;

      // Apne authentication system ke hisaab se adjust karein.
      window.location.href = "login.html";
    });
  }

  // ==========================================
  // FOOTER YEAR
  // ==========================================

  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  // ==========================================
  // INITIALISE
  // ==========================================

  async function initializeEnquiries() {
    await loadEnquiries();
    renderEnquiries();
  }

  initializeEnquiries();

});
