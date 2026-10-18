
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       KEWADEV ADMIN - ENQUIRIES
       File: js/enquiries.js
       ===================================== */

    const STORAGE_KEY = "kewadev_admin_enquiries";
    const THEME_KEY = "kewadev_admin_theme";
    const ITEMS_PER_PAGE = 5;

    let enquiries = [];
    let currentPage = 1;
    let messageTimer;


    /* ---------- ELEMENTS ---------- */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const themeToggle = document.getElementById("themeToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    const totalEnquiries = document.getElementById("totalEnquiries");
    const newEnquiries = document.getElementById("newEnquiries");
    const completedEnquiries = document.getElementById("completedEnquiries");

    const exportEnquiriesBtn = document.getElementById("exportEnquiriesBtn");

    const recordCount = document.getElementById("recordCount");
    const enquirySearch = document.getElementById("enquirySearch");
    const statusFilter = document.getElementById("statusFilter");
    const sortFilter = document.getElementById("sortFilter");

    const enquiriesTableBody = document.getElementById("enquiriesTableBody");

    const pageMessage = document.getElementById("pageMessage");

    const emptyState = document.getElementById("emptyState");
    const emptyTitle = document.getElementById("emptyTitle");
    const emptyDescription = document.getElementById("emptyDescription");

    const paginationInfo = document.getElementById("paginationInfo");
    const previousPageBtn = document.getElementById("previousPageBtn");
    const currentPageElement = document.getElementById("currentPage");
    const nextPageBtn = document.getElementById("nextPageBtn");

    const currentYear = document.getElementById("currentYear");

    const enquiryModal = document.getElementById("enquiryModal");
    const closeEnquiryModal = document.getElementById("closeEnquiryModal");
    const enquiryDetails = document.getElementById("enquiryDetails");
    const enquiryStatusForm = document.getElementById("enquiryStatusForm");
    const enquiryId = document.getElementById("enquiryId");
    const enquiryStatus = document.getElementById("enquiryStatus");
    const cancelEnquiryBtn = document.getElementById("cancelEnquiryBtn");


    /* ---------- STATUS LABELS ---------- */

    const statusLabels = {
        "new": "New",
        "in-progress": "In Progress",
        "completed": "Completed",
        "archived": "Archived"
    };

    function normaliseStatus(status) {
        return Object.prototype.hasOwnProperty.call(statusLabels, status)
            ? status
            : "new";
    }


    /* ---------- SAFE HTML ---------- */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[char];
        });
    }


    /* ---------- LOAD / SAVE ---------- */

    function loadEnquiries() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved === null) {
                enquiries = [];
                return;
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                enquiries = [];
                showMessage("Saved enquiry data could not be read.", "error");
                return;
            }

            enquiries = parsed.map(function (item, index) {
                return {
                    id: String(item.id || "enquiry-" + index),
                    name: String(item.name || "Unknown"),
                    email: String(item.email || ""),
                    phone: String(item.phone || ""),
                    subject: String(item.subject || "No subject"),
                    message: String(item.message || ""),
                    status: normaliseStatus(item.status),
                    createdAt: Number(item.createdAt) || Date.now()
                };
            });

        } catch (error) {
            console.error("Error loading enquiries:", error);
            enquiries = [];
            showMessage("Could not load enquiries from storage.", "error");
        }
    }


    function saveEnquiries() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(enquiries));
            return true;

        } catch (error) {
            console.error("Error saving enquiries:", error);
            showMessage("Could not save changes. Check browser storage.", "error");
            return false;
        }
    }


    /* ---------- STATUS MESSAGE ---------- */

    function showMessage(message, type = "success") {
        if (!pageMessage) return;

        clearTimeout(messageTimer);

        pageMessage.textContent = message;
        pageMessage.className = "page-message " + type;
        pageMessage.hidden = false;

        messageTimer = setTimeout(function () {
            pageMessage.hidden = true;
        }, 3500);
    }


    /* ---------- DATE FORMAT ---------- */

    function formatDate(timestamp) {
        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function formatDateTime(timestamp) {
        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    /* ---------- STATISTICS ---------- */

    function updateStatistics() {
        const newCount = enquiries.filter(function (item) {
            return item.status === "new";
        }).length;

        const completedCount = enquiries.filter(function (item) {
            return item.status === "completed";
        }).length;

        if (totalEnquiries) {
            totalEnquiries.textContent = enquiries.length;
        }

        if (newEnquiries) {
            newEnquiries.textContent = newCount;
        }

        if (completedEnquiries) {
            completedEnquiries.textContent = completedCount;
        }
    }


    /* ---------- SEARCH / FILTER / SORT ---------- */

    function getFilteredEnquiries() {
        let result = [...enquiries];

        const search = enquirySearch
            ? enquirySearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "all";

        const selectedSort = sortFilter
            ? sortFilter.value
            : "newest";

        if (search) {
            result = result.filter(function (item) {
                return (
                    item.name.toLowerCase().includes(search) ||
                    item.email.toLowerCase().includes(search) ||
                    item.subject.toLowerCase().includes(search) ||
                    item.message.toLowerCase().includes(search)
                );
            });
        }

        if (selectedStatus !== "all") {
            result = result.filter(function (item) {
                return item.status === selectedStatus;
            });
        }

        if (selectedSort === "newest") {
            result.sort(function (a, b) {
                return b.createdAt - a.createdAt;
            });
        } else if (selectedSort === "oldest") {
            result.sort(function (a, b) {
                return a.createdAt - b.createdAt;
            });
        } else if (selectedSort === "name") {
            result.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }

        return result;
    }


    /* ---------- RENDER TABLE ---------- */

    function renderEnquiries() {
        if (!enquiriesTableBody) return;

        updateStatistics();

        const filtered = getFilteredEnquiries();

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / ITEMS_PER_PAGE)
        );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

        const pageItems = filtered.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        enquiriesTableBody.innerHTML = "";

        if (recordCount) {
            recordCount.textContent = filtered.length + " records";
        }

        if (emptyState) {
            emptyState.hidden = pageItems.length !== 0;
        }

        if (emptyTitle && pageItems.length === 0) {
            emptyTitle.textContent = enquiries.length === 0
                ? "No enquiries yet"
                : "No matching enquiries";
        }

        if (emptyDescription && pageItems.length === 0) {
            emptyDescription.textContent = enquiries.length === 0
                ? "Enquiries will appear here once you connect a contact form or add enquiry data."
                : "Try changing your search or status filter.";
        }

        pageItems.forEach(function (item) {
            const row = document.createElement("tr");

            const statusClass = item.status.replace("-", "");

            row.innerHTML = `
                <td>
                    <div class="client-cell">
                        <div class="client-avatar">
                            ${escapeHTML(
                                item.name.trim().charAt(0).toUpperCase() || "?"
                            )}
                        </div>

                        <div class="client-info">
                            <strong>${escapeHTML(item.name)}</strong>
                            <small>${escapeHTML(item.email)}</small>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="subject-text">
                        ${escapeHTML(item.subject)}
                    </span>
                </td>

                <td>${escapeHTML(formatDate(item.createdAt))}</td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(statusLabels[item.status])}
                    </span>
                </td>

                <td>
                    <div class="table-actions">
                        <button
                            type="button"
                            class="view-btn"
                            data-action="view"
                            data-id="${escapeHTML(item.id)}"
                        >View</button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                        >Delete</button>
                    </div>
                </td>
            `;

            enquiriesTableBody.appendChild(row);
        });

        if (paginationInfo) {
            paginationInfo.textContent = filtered.length === 0
                ? "Showing 0 of 0 enquiries"
                : "Showing " +
                    (startIndex + 1) +
                    "–" +
                    Math.min(startIndex + ITEMS_PER_PAGE, filtered.length) +
                    " of " +
                    filtered.length +
                    " enquiries";
        }

        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }

        if (previousPageBtn) {
            previousPageBtn.disabled = currentPage <= 1;
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }


    /* ---------- OPEN DETAILS MODAL ---------- */

    function openEnquiryModal(item) {
        if (!enquiryModal || !enquiryDetails) return;

        enquiryId.value = item.id;
        enquiryStatus.value = item.status;

        enquiryDetails.innerHTML = `
            <div class="detail-item">
                <span>Client Name</span>
                <strong>${escapeHTML(item.name)}</strong>
            </div>

            <div class="detail-item">
                <span>Email Address</span>
                <strong>${escapeHTML(item.email || "Not provided")}</strong>
            </div>

            <div class="detail-item">
                <span>Phone</span>
                <strong>${escapeHTML(item.phone || "Not provided")}</strong>
            </div>

            <div class="detail-item">
                <span>Subject</span>
                <strong>${escapeHTML(item.subject)}</strong>
            </div>

            <div class="detail-item">
                <span>Received</span>
                <strong>${escapeHTML(formatDateTime(item.createdAt))}</strong>
            </div>

            <div class="detail-item message-detail">
                <span>Client Message</span>
                <p>${escapeHTML(item.message || "No message provided.")}</p>
            </div>
        `;

        enquiryModal.hidden = false;
        enquiryModal.classList.add("active");
        document.body.classList.add("modal-open");
    }


    /* ---------- CLOSE MODAL ---------- */

    function closeModal() {
        if (!enquiryModal) return;

        enquiryModal.classList.remove("active");
        enquiryModal.hidden = true;
        document.body.classList.remove("modal-open");
    }


    if (closeEnquiryModal) {
        closeEnquiryModal.addEventListener("click", closeModal);
    }

    if (cancelEnquiryBtn) {
        cancelEnquiryBtn.addEventListener("click", closeModal);
    }

    if (enquiryModal) {
        enquiryModal.addEventListener("click", function (event) {
            if (event.target.closest("[data-close-modal]")) {
                closeModal();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && enquiryModal && !enquiryModal.hidden) {
            closeModal();
        }
    });


    /* ---------- VIEW / DELETE ---------- */

    if (enquiriesTableBody) {
        enquiriesTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            const item = enquiries.find(function (enquiry) {
                return enquiry.id === id;
            });

            if (!item) {
                showMessage("Enquiry not found.", "error");
                return;
            }

            if (action === "view") {
                openEnquiryModal(item);
            }

            if (action === "delete") {
                const confirmed = window.confirm(
                    'Delete the enquiry from "' + item.name + '"?'
                );

                if (!confirmed) return;

                const oldEnquiries = [...enquiries];

                enquiries = enquiries.filter(function (enquiry) {
                    return enquiry.id !== id;
                });

                if (!saveEnquiries()) {
                    enquiries = oldEnquiries;
                    return;
                }

                renderEnquiries();
                showMessage("Enquiry deleted successfully.");
            }
        });
    }


    /* ---------- SAVE STATUS ---------- */

    if (enquiryStatusForm) {
        enquiryStatusForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const id = enquiryId.value;
            const selectedStatus = enquiryStatus.value;

            if (!Object.prototype.hasOwnProperty.call(
                statusLabels,
                selectedStatus
            )) {
                showMessage("Please select a valid status.", "error");
                return;
            }

            const index = enquiries.findIndex(function (item) {
                return item.id === id;
            });

            if (index === -1) {
                showMessage("Enquiry not found.", "error");
                closeModal();
                return;
            }

            const oldStatus = enquiries[index].status;

            enquiries[index].status = selectedStatus;

            if (!saveEnquiries()) {
                enquiries[index].status = oldStatus;
                return;
            }

            closeModal();
            renderEnquiries();

            showMessage("Enquiry status updated successfully.");
        });
    }


    /* ---------- SEARCH ---------- */

    if (enquirySearch) {
        enquirySearch.addEventListener("input", function () {
            currentPage = 1;
            renderEnquiries();
        });
    }


    /* ---------- FILTER ---------- */

    if (statusFilter) {
        statusFilter.addEventListener("change", function () {
            currentPage = 1;
            renderEnquiries();
        });
    }


    /* ---------- SORT ---------- */

    if (sortFilter) {
        sortFilter.addEventListener("change", function () {
            currentPage = 1;
            renderEnquiries();
        });
    }


    /* ---------- PAGINATION ---------- */

    if (previousPageBtn) {
        previousPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                renderEnquiries();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function () {
            const totalPages = Math.max(
                1,
                Math.ceil(getFilteredEnquiries().length / ITEMS_PER_PAGE)
            );

            if (currentPage < totalPages) {
                currentPage++;
                renderEnquiries();
            }
        });
    }


  
    /* ---------- EXPORT CSV ---------- */

    function csvEscape(value) {
        return '"' + String(value ?? "").replace(/"/g, '""') + '"';
    }

    if (exportEnquiriesBtn) {
        exportEnquiriesBtn.addEventListener("click", function () {
            if (enquiries.length === 0) {
                showMessage("There are no enquiries to export.", "error");
                return;
            }

            const headers = [
                "Client Name",
                "Email",
                "Phone",
                "Subject",
                "Message",
                "Status",
                "Received Date"
            ];

            const rows = enquiries.map(function (item) {
                return [
                    item.name,
                    item.email,
                    item.phone,
                    item.subject,
                    item.message,
                    statusLabels[item.status],
                    formatDateTime(item.createdAt)
                ];
            });

            const csvContent = [
                headers.map(csvEscape).join(","),
                ...rows.map(function (row) {
                    return row.map(csvEscape).join(",");
                })
            ].join("\r\n");

            const blob = new Blob(
                ["\uFEFF" + csvContent],
                { type: "text/csv;charset=utf-8;" }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "kewadev-enquiries.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            showMessage("CSV export started.");
        });
    }


    /* ---------- MOBILE SIDEBAR ---------- */

    let sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement("div");
        sidebarOverlay.className = "sidebar-overlay";
        document.body.appendChild(sidebarOverlay);
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        sidebarOverlay.classList.remove("active");

        if (menuBtn) {
            menuBtn.setAttribute("aria-expanded", "false");
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", function () {
            if (!sidebar) return;

            const isOpen = sidebar.classList.toggle("open");

            sidebarOverlay.classList.toggle("active", isOpen);
            menuBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    sidebarOverlay.addEventListener("click", closeSidebar);


    /* ---------- THEME ---------- */

    function applyTheme() {
        let savedTheme = "dark";

        try {
            savedTheme = localStorage.getItem(THEME_KEY) || "dark";
        } catch (error) {
            console.error("Could not read saved theme:", error);
        }

        document.body.classList.toggle(
            "light-theme",
            savedTheme === "light"
        );
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isLight =
                document.body.classList.contains("light-theme");

            document.body.classList.toggle("light-theme", !isLight);

            try {
                localStorage.setItem(
                    THEME_KEY,
                    isLight ? "dark" : "light"
                );
            } catch (error) {
                console.error("Could not save theme:", error);
            }
        });
    }


    /* ---------- LOGOUT ---------- */

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            const confirmed = window.confirm(
                "Are you sure you want to log out?"
            );

            if (confirmed) {
                window.location.href = "../login.html";
            }
        });
    }


    /* ---------- FOOTER ---------- */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* ---------- INITIALIZE ---------- */

    applyTheme();
    loadEnquiries();
    renderEnquiries();

    console.log("KEWADEV Enquiries JS loaded successfully.");

});
