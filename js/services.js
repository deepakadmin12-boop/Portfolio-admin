
"use strict";

/* =========================================
   KEWADEV ADMIN — SERVICES
   File: js/services.js
   Backend-connected version
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* ---------- CONFIGURATION ---------- */

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";
    const THEME_KEY = "kewadev_admin_theme";
    const ITEMS_PER_PAGE = 5;

    let currentPage = 1;
    let services = [];
    let messageTimeout = null;

    /* ---------- ELEMENTS ---------- */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const themeToggle = document.getElementById("themeToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    const addServiceBtn = document.getElementById("addServiceBtn");
    const emptyAddServiceBtn = document.getElementById("emptyAddServiceBtn");

    const totalServices = document.getElementById("totalServices");
    const activeServices = document.getElementById("activeServices");
    const inactiveServices = document.getElementById("inactiveServices");

    const serviceRecordCount = document.getElementById("serviceRecordCount");
    const serviceSearch = document.getElementById("serviceSearch");
    const serviceStatusFilter =
        document.getElementById("serviceStatusFilter");
    const serviceSortFilter =
        document.getElementById("serviceSortFilter");

    const servicesTableBody = document.getElementById("servicesTableBody");

    const serviceEmptyState = document.getElementById("serviceEmptyState");
    const serviceEmptyTitle = document.getElementById("serviceEmptyTitle");
    const serviceEmptyDescription =
        document.getElementById("serviceEmptyDescription");

    const servicePaginationInfo =
        document.getElementById("servicePaginationInfo");
    const previousServicePageBtn =
        document.getElementById("previousServicePageBtn");
    const currentServicePage =
        document.getElementById("currentServicePage");
    const nextServicePageBtn =
        document.getElementById("nextServicePageBtn");

    const servicePageMessage =
        document.getElementById("servicePageMessage");
    const currentYear = document.getElementById("currentYear");

    const serviceModal = document.getElementById("serviceModal");
    const closeServiceModalBtn =
        document.getElementById("closeServiceModal");
    const serviceForm = document.getElementById("serviceForm");
    const serviceId = document.getElementById("serviceId");
    const serviceName = document.getElementById("serviceName");
    const serviceCategory = document.getElementById("serviceCategory");
    const serviceIcon = document.getElementById("serviceIcon");
    const serviceDescription =
        document.getElementById("serviceDescription");
    const serviceStatus = document.getElementById("serviceStatus");
    const cancelServiceBtn = document.getElementById("cancelServiceBtn");
    const saveServiceBtn = document.getElementById("saveServiceBtn");

    /* ---------- API HELPER ---------- */

    async function apiRequest(endpoint, options = {}) {
        const headers = new Headers(options.headers || {});

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers.has("Content-Type")
        ) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(API_BASE_URL + endpoint, {
            ...options,
            headers,
            credentials: "include"
        });

        const contentType = response.headers.get("content-type") || "";
        let result = null;

        if (contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const text = await response.text();
            result = text ? { message: text } : null;
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                "Request failed with status " + response.status
            );
        }

        return result;
    }

    /* ---------- MESSAGE ---------- */

    function showMessage(message, type = "success") {
        if (!servicePageMessage) return;

        clearTimeout(messageTimeout);

        servicePageMessage.textContent = message;
        servicePageMessage.className = "page-message " + type;
        servicePageMessage.hidden = false;

        messageTimeout = setTimeout(function () {
            servicePageMessage.hidden = true;
        }, 3500);
    }

    /* ---------- HTML SAFETY ---------- */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    /* ---------- NORMALIZE SERVICE ---------- */

    function normalizeService(item) {
        const rawStatus = String(item.status || "Active").toLowerCase();

        return {
            id: String(item.id ?? item._id ?? ""),
            name: String(item.name || ""),
            category: String(item.category || "General"),
            icon: String(item.icon || "🛠️"),
            description: String(item.description || ""),
            status: rawStatus === "inactive" ? "Inactive" : "Active",
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || item.createdAt || Date.now()
        };
    }

    /* ---------- LOAD SERVICES FROM BACKEND ---------- */

    async function loadServices() {
        const result = await apiRequest("/api/services", {
            method: "GET"
        });

        let list;

        if (Array.isArray(result)) {
            list = result;
        } else if (Array.isArray(result?.services)) {
            list = result.services;
        } else if (Array.isArray(result?.data)) {
            list = result.data;
        } else {
            throw new Error(
                "Backend response mein services array nahi mila."
            );
        }

        services = list.map(normalizeService);
    }

    /* ---------- STATISTICS ---------- */

    function updateStatistics() {
        const activeCount = services.filter(function (service) {
            return service.status === "Active";
        }).length;

        const inactiveCount = services.filter(function (service) {
            return service.status === "Inactive";
        }).length;

        if (totalServices) {
            totalServices.textContent = services.length;
        }

        if (activeServices) {
            activeServices.textContent = activeCount;
        }

        if (inactiveServices) {
            inactiveServices.textContent = inactiveCount;
        }
    }

    /* ---------- FILTER AND SORT ---------- */

    function getFilteredServices() {
        let filtered = [...services];

        const searchText = serviceSearch
            ? serviceSearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = serviceStatusFilter
            ? serviceStatusFilter.value
            : "all";

        const selectedSort = serviceSortFilter
            ? serviceSortFilter.value
            : "newest";

        if (searchText) {
            filtered = filtered.filter(function (service) {
                return (
                    service.name.toLowerCase().includes(searchText) ||
                    service.category.toLowerCase().includes(searchText) ||
                    service.description.toLowerCase().includes(searchText)
                );
            });
        }

        if (selectedStatus && selectedStatus !== "all") {
            filtered = filtered.filter(function (service) {
                return service.status.toLowerCase() ===
                    selectedStatus.toLowerCase();
            });
        }

        if (selectedSort === "newest") {
            filtered.sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else if (selectedSort === "oldest") {
            filtered.sort(function (a, b) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
        } else if (selectedSort === "name-asc") {
            filtered.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        } else if (selectedSort === "name-desc") {
            filtered.sort(function (a, b) {
                return b.name.localeCompare(a.name);
            });
        }

        return filtered;
    }

    /* ---------- RENDER SERVICES ---------- */

    function renderServices() {
        if (!servicesTableBody) return;

        updateStatistics();

        const filteredServices = getFilteredServices();

        const totalPages = Math.max(
            1,
            Math.ceil(filteredServices.length / ITEMS_PER_PAGE)
        );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

        const pageServices = filteredServices.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        servicesTableBody.innerHTML = "";

        if (serviceRecordCount) {
            serviceRecordCount.textContent =
                filteredServices.length + " services";
        }

        if (pageServices.length === 0) {
            if (serviceEmptyState) {
                serviceEmptyState.hidden = false;
            }

            if (serviceEmptyTitle) {
                serviceEmptyTitle.textContent = services.length === 0
                    ? "No services added yet"
                    : "No matching services found";
            }

            if (serviceEmptyDescription) {
                serviceEmptyDescription.textContent = services.length === 0
                    ? "Add your first service to get started."
                    : "Try changing your search or filter.";
            }
        } else {
            if (serviceEmptyState) {
                serviceEmptyState.hidden = true;
            }

            pageServices.forEach(function (service) {
                const row = document.createElement("tr");

                const statusClass =
                    service.status === "Active" ? "active" : "inactive";

                row.innerHTML = `
                    <td>
                        <div class="service-name-cell">
                            <span class="service-icon">
                                ${escapeHTML(service.icon)}
                            </span>
                            <div>
                                <strong>${escapeHTML(service.name)}</strong>
                                <small>${escapeHTML(service.description)}</small>
                            </div>
                        </div>
                    </td>

                    <td>${escapeHTML(service.category)}</td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${escapeHTML(service.status)}
                        </span>
                    </td>

                    <td>
                        <div class="service-actions">
                            <button
                                type="button"
                                class="edit-service-btn"
                                data-action="edit"
                                data-id="${escapeHTML(service.id)}"
                                aria-label="Edit service"
                            >Edit</button>

                            <button
                                type="button"
                                class="delete-service-btn"
                                data-action="delete"
                                data-id="${escapeHTML(service.id)}"
                                aria-label="Delete service"
                            >Delete</button>
                        </div>
                    </td>
                `;

                servicesTableBody.appendChild(row);
            });
        }

        if (servicePaginationInfo) {
            servicePaginationInfo.textContent =
                filteredServices.length === 0
                    ? "Showing 0 services"
                    : "Showing " + (startIndex + 1) + "–" +
                      Math.min(
                          startIndex + ITEMS_PER_PAGE,
                          filteredServices.length
                      ) + " of " + filteredServices.length;
        }

        if (currentServicePage) {
            currentServicePage.textContent = currentPage;
        }

        if (previousServicePageBtn) {
            previousServicePageBtn.disabled = currentPage <= 1;
        }

        if (nextServicePageBtn) {
            nextServicePageBtn.disabled = currentPage >= totalPages;
        }
    }

    /* ---------- PART 1 ENDS HERE ---------- */

    /* ---------- OPEN SERVICE MODAL ---------- */

    function openModal(service = null) {
        if (!serviceModal || !serviceForm) return;

        serviceForm.reset();

        if (serviceId) serviceId.value = service ? service.id : "";
        if (serviceName) serviceName.value = service ? service.name : "";
        if (serviceCategory) {
            serviceCategory.value = service ? service.category : "";
        }
        if (serviceIcon) {
            serviceIcon.value = service ? service.icon : "🛠️";
        }
        if (serviceDescription) {
            serviceDescription.value = service ? service.description : "";
        }
        if (serviceStatus) {
            serviceStatus.value = service ? service.status : "Active";
        }

        serviceModal.hidden = false;
        serviceModal.classList.add("active");
        serviceModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        if (saveServiceBtn) {
            saveServiceBtn.textContent = service
                ? "Update Service"
                : "Save Service";
        }

        serviceName?.focus();
    }

    /* ---------- CLOSE SERVICE MODAL ---------- */

    function closeModal() {
        if (!serviceModal) return;

        serviceModal.classList.remove("active");
        serviceModal.hidden = true;
        serviceModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");

        serviceForm?.reset();
    }

    /* ---------- ADD SERVICE BUTTONS ---------- */

    if (addServiceBtn) {
        addServiceBtn.addEventListener("click", function () {
            openModal();
        });
    }

    if (emptyAddServiceBtn) {
        emptyAddServiceBtn.addEventListener("click", function () {
            openModal();
        });
    }

    if (closeServiceModalBtn) {
        closeServiceModalBtn.addEventListener("click", closeModal);
    }

    if (cancelServiceBtn) {
        cancelServiceBtn.addEventListener("click", closeModal);
    }

    if (serviceModal) {
        serviceModal.addEventListener("click", function (event) {
            if (event.target.closest("[data-close-service-modal]")) {
                closeModal();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            serviceModal &&
            !serviceModal.hidden
        ) {
            closeModal();
        }
    });

    /* ---------- SAVE / UPDATE SERVICE ---------- */

    if (serviceForm) {
        serviceForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = serviceName?.value.trim() || "";
            const category = serviceCategory?.value.trim() || "General";
            const icon = serviceIcon?.value.trim() || "🛠️";
            const description = serviceDescription?.value.trim() || "";
            const status = serviceStatus?.value || "Active";
            const editingId = serviceId?.value.trim() || "";

            if (!name) {
                showMessage("Please enter a service name.", "error");
                serviceName?.focus();
                return;
            }

            if (status !== "Active" && status !== "Inactive") {
                showMessage("Please select a valid status.", "error");
                return;
            }

            const duplicate = services.some(function (service) {
                return (
                    service.name.toLowerCase() === name.toLowerCase() &&
                    String(service.id) !== editingId
                );
            });

            if (duplicate) {
                showMessage(
                    "A service with this name already exists.",
                    "error"
                );
                serviceName?.focus();
                return;
            }

            const payload = {
                name,
                category,
                icon,
                description,
                status
            };

            const oldButtonText = saveServiceBtn
                ? saveServiceBtn.textContent
                : "Save Service";

            if (saveServiceBtn) {
                saveServiceBtn.disabled = true;
                saveServiceBtn.textContent = editingId
                    ? "Updating..."
                    : "Saving...";
            }

            try {
                const result = await apiRequest(
                    editingId
                        ? "/api/services/" + encodeURIComponent(editingId)
                        : "/api/services",
                    {
                        method: editingId ? "PUT" : "POST",
                        body: JSON.stringify(payload)
                    }
                );

                await loadServices();

                currentPage = 1;
                renderServices();
                closeModal();

                showMessage(
                    result?.message ||
                    (
                        editingId
                            ? "Service updated successfully."
                            : "Service added successfully."
                    ),
                    "success"
                );
            } catch (error) {
                console.error("Save service error:", error);

                showMessage(
                    error.message || "Could not save service.",
                    "error"
                );
            } finally {
                if (saveServiceBtn) {
                    saveServiceBtn.disabled = false;
                    saveServiceBtn.textContent = oldButtonText;
                }
            }
        });
    }

    /* ---------- EDIT / DELETE ACTIONS ---------- */

    if (servicesTableBody) {
        servicesTableBody.addEventListener("click", async function (event) {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            const service = services.find(function (item) {
                return String(item.id) === String(id);
            });

            if (!service) {
                showMessage("Service not found. Refresh and try again.", "error");
                return;
            }

            if (action === "edit") {
                openModal(service);
                return;
            }

            if (action === "delete") {
                const confirmed = window.confirm(
                    'Are you sure you want to delete "' +
                    service.name +
                    '"? This action cannot be undone.'
                );

                if (!confirmed) return;

                const oldButtonText = button.textContent;
                button.disabled = true;
                button.textContent = "Deleting...";

                try {
                    const result = await apiRequest(
                        "/api/services/" + encodeURIComponent(id),
                        {
                            method: "DELETE"
                        }
                    );

                    await loadServices();
                    renderServices();

                    showMessage(
                        result?.message || "Service deleted successfully.",
                        "success"
                    );
                } catch (error) {
                    console.error("Delete service error:", error);

                    showMessage(
                        error.message || "Could not delete service.",
                        "error"
                    );

                    button.disabled = false;
                    button.textContent = oldButtonText;
                }
            }
        });
    }

    /* ---------- SEARCH ---------- */

    if (serviceSearch) {
        serviceSearch.addEventListener("input", function () {
            currentPage = 1;
            renderServices();
        });
    }

    /* ---------- STATUS FILTER ---------- */

    if (serviceStatusFilter) {
        serviceStatusFilter.addEventListener("change", function () {
            currentPage = 1;
            renderServices();
        });
    }

    /* ---------- SORT FILTER ---------- */

    if (serviceSortFilter) {
        serviceSortFilter.addEventListener("change", function () {
            currentPage = 1;
            renderServices();
        });
    }

    /* ---------- PAGINATION ---------- */

    if (previousServicePageBtn) {
        previousServicePageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                renderServices();
            }
        });
    }

    if (nextServicePageBtn) {
        nextServicePageBtn.addEventListener("click", function () {
            const totalPages = Math.max(
                1,
                Math.ceil(
                    getFilteredServices().length / ITEMS_PER_PAGE
                )
            );

            if (currentPage < totalPages) {
                currentPage++;
                renderServices();
            }
        });
    }

    /* ---------- THEME ---------- */

    function applyTheme(theme) {
        const isLight = theme === "light";

        document.body.classList.toggle("light-theme", isLight);
        document.documentElement.setAttribute("data-theme", theme);

        if (themeToggle) {
            themeToggle.textContent = isLight ? "☾" : "☼";
            themeToggle.setAttribute(
                "aria-label",
                isLight ? "Switch to dark theme" : "Switch to light theme"
            );
        }
    }

    function loadTheme() {
        let theme = "dark";

        try {
            theme = localStorage.getItem(THEME_KEY) || "dark";
        } catch (error) {
            console.warn("Could not load theme preference:", error);
        }

        applyTheme(theme);
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const currentTheme =
                document.body.classList.contains("light-theme")
                    ? "light"
                    : "dark";

            const newTheme =
                currentTheme === "light" ? "dark" : "light";

            applyTheme(newTheme);

            try {
                localStorage.setItem(THEME_KEY, newTheme);
            } catch (error) {
                console.warn("Could not save theme preference:", error);
            }
        });
    }

    /* ---------- MOBILE SIDEBAR ---------- */

    function closeSidebar() {
        sidebar?.classList.remove("open");

        const overlay = document.querySelector(".sidebar-overlay");

        if (overlay) {
            overlay.classList.remove("active");
        }
    }

    function openSidebar() {
        if (!sidebar) return;

        let overlay = document.querySelector(".sidebar-overlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            overlay.addEventListener("click", closeSidebar);
            document.body.appendChild(overlay);
        }

        sidebar.classList.add("open");
        overlay.classList.add("active");
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", function () {
            if (sidebar?.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > 850) {
            closeSidebar();
        }
    });

    /* ---------- LOGOUT ---------- */

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function (event) {
            event.preventDefault();

            const confirmed = window.confirm(
                "Kya tum logout karna chahte ho?"
            );

            if (!confirmed) return;

            try {
                await apiRequest("/api/auth/logout", {
                    method: "POST",
                    body: JSON.stringify({})
                });
            } catch (error) {
                console.error("Logout error:", error);
            }

            window.location.href = "../login.html";
        });
    }

    /* ---------- FOOTER YEAR ---------- */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    /* ---------- INITIALIZE ---------- */

    async function initializeServices() {
        loadTheme();

        try {
            await loadServices();
            renderServices();
        } catch (error) {
            console.error("Load services error:", error);

            showMessage(
                "Services load nahi hui. Backend server aur API route check karo.",
                "error"
            );
        }

        console.log("KEWADEV Services JS loaded.");
    }

    initializeServices();

});
