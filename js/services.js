
"use strict";

/* =========================================
   KEWADEV ADMIN — SERVICES
   File: js/services.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

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
    const serviceStatusFilter = document.getElementById("serviceStatusFilter");
    const serviceSortFilter = document.getElementById("serviceSortFilter");

    const servicesTableBody = document.getElementById("servicesTableBody");

    const serviceEmptyState = document.getElementById("serviceEmptyState");
    const serviceEmptyTitle = document.getElementById("serviceEmptyTitle");
    const serviceEmptyDescription = document.getElementById("serviceEmptyDescription");

    const servicePaginationInfo = document.getElementById("servicePaginationInfo");
    const previousServicePageBtn = document.getElementById("previousServicePageBtn");
    const currentServicePage = document.getElementById("currentServicePage");
    const nextServicePageBtn = document.getElementById("nextServicePageBtn");

    const servicePageMessage = document.getElementById("servicePageMessage");
    const currentYear = document.getElementById("currentYear");

    const serviceModal = document.getElementById("serviceModal");
    const closeServiceModal = document.getElementById("closeServiceModal");
    const serviceForm = document.getElementById("serviceForm");
    const serviceId = document.getElementById("serviceId");
    const serviceName = document.getElementById("serviceName");
    const serviceCategory = document.getElementById("serviceCategory");
    const serviceIcon = document.getElementById("serviceIcon");
    const serviceDescription = document.getElementById("serviceDescription");
    const serviceStatus = document.getElementById("serviceStatus");
    const cancelServiceBtn = document.getElementById("cancelServiceBtn");
    const saveServiceBtn = document.getElementById("saveServiceBtn");


    /* ---------- SETTINGS ---------- */

    const STORAGE_KEY = "kewadev_admin_services";
    const THEME_KEY = "kewadev_admin_theme";

    const ITEMS_PER_PAGE = 5;

    let currentPage = 1;
    let services = [];
    let messageTimeout;


    /* ---------- DEFAULT SERVICES ---------- */

    const defaultServices = [
        {
            id: "service-1",
            name: "Website Development",
            category: "Development",
            icon: "💻",
            description: "Responsive websites for businesses and individuals.",
            status: "Active",
            createdAt: Date.now()
        },
        {
            id: "service-2",
            name: "Landing Page Design",
            category: "Design",
            icon: "🎨",
            description: "Modern landing pages designed to showcase products and services.",
            status: "Active",
            createdAt: Date.now() - 1000
        },
        {
            id: "service-3",
            name: "Web App Development",
            category: "Development",
            icon: "⚙️",
            description: "Interactive web applications for everyday business needs.",
            status: "Inactive",
            createdAt: Date.now() - 2000
        }
    ];


    /* ---------- STORAGE ---------- */

    function loadServices() {
        try {
            const savedServices = localStorage.getItem(STORAGE_KEY);

            if (savedServices === null) {
                services = [...defaultServices];
                saveServices();
                return;
            }

            const parsedServices = JSON.parse(savedServices);

            if (Array.isArray(parsedServices)) {
                services = parsedServices;
            } else {
                services = [...defaultServices];
                saveServices();
            }

        } catch (error) {
            console.error("Unable to load services:", error);
            services = [...defaultServices];
        }
    }


    function saveServices() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(services)
            );

            return true;

        } catch (error) {
            console.error("Unable to save services:", error);

            showMessage(
                "Could not save data. Check your browser storage.",
                "error"
            );

            return false;
        }
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


    /* ---------- FILTER + SORT ---------- */

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
                    String(service.name || "").toLowerCase().includes(searchText) ||
                    String(service.category || "").toLowerCase().includes(searchText) ||
                    String(service.description || "").toLowerCase().includes(searchText)
                );
            });
        }

        if (selectedStatus && selectedStatus !== "all") {
            filtered = filtered.filter(function (service) {
                return service.status.toLowerCase() === selectedStatus.toLowerCase();
            });
        }

        if (selectedSort === "newest") {
            filtered.sort(function (a, b) {
                return (b.createdAt || 0) - (a.createdAt || 0);
            });

        } else if (selectedSort === "oldest") {
            filtered.sort(function (a, b) {
                return (a.createdAt || 0) - (b.createdAt || 0);
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
                serviceEmptyTitle.textContent =
                    services.length === 0
                        ? "No services added yet"
                        : "No matching services found";
            }

            if (serviceEmptyDescription) {
                serviceEmptyDescription.textContent =
                    services.length === 0
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
                                ${escapeHTML(service.icon || "🛠️")}
                            </span>

                            <div>
                                <strong>${escapeHTML(service.name)}</strong>
                                <small>${escapeHTML(service.description || "")}</small>
                            </div>
                        </div>
                    </td>

                    <td>${escapeHTML(service.category || "General")}</td>

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
            if (filteredServices.length === 0) {
                servicePaginationInfo.textContent = "Showing 0 services";
            } else {
                servicePaginationInfo.textContent =
                    "Showing " +
                    (startIndex + 1) +
                    "–" +
                    Math.min(startIndex + ITEMS_PER_PAGE, filteredServices.length) +
                    " of " +
                    filteredServices.length;
            }
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


    /* ---------- OPEN MODAL ---------- */

    function openModal(service = null) {
        if (!serviceModal || !serviceForm) return;

        serviceForm.reset();

        if (serviceId) {
            serviceId.value = service ? service.id : "";
        }

        if (serviceName) {
            serviceName.value = service ? service.name : "";
        }

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
        document.body.classList.add("modal-open");

        if (saveServiceBtn) {
            saveServiceBtn.textContent = service
                ? "Update Service"
                : "Save Service";
        }

        if (serviceName) {
            serviceName.focus();
        }
    }


    /* ---------- CLOSE MODAL ---------- */

    function closeModal() {
        if (!serviceModal) return;

        serviceModal.classList.remove("active");
        serviceModal.hidden = true;
        document.body.classList.remove("modal-open");
    }


    /* ---------- ADD / EDIT SERVICE ---------- */

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

    if (closeServiceModal) {
        closeServiceModal.addEventListener("click", closeModal);
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
        if (event.key === "Escape" && serviceModal &&
            !serviceModal.hidden) {
            closeModal();
        }
    });


    /* ---------- SAVE FORM ---------- */

    if (serviceForm) {
        serviceForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = serviceName
                ? serviceName.value.trim()
                : "";

            const category = serviceCategory
                ? serviceCategory.value.trim()
                : "General";

            const icon = serviceIcon
                ? serviceIcon.value.trim()
                : "🛠️";

            const description = serviceDescription
                ? serviceDescription.value.trim()
                : "";

            const status = serviceStatus
                ? serviceStatus.value
                : "Active";

            const editingId = serviceId
                ? serviceId.value
                : "";

            if (!name) {
                showMessage("Please enter a service name.", "error");

                if (serviceName) serviceName.focus();

                return;
            }

            const duplicate = services.some(function (service) {
                return (
                    service.name.toLowerCase() === name.toLowerCase() &&
                    service.id !== editingId
                );
            });

            if (duplicate) {
                showMessage(
                    "A service with this name already exists.",
                    "error"
                );

                if (serviceName) serviceName.focus();

                return;
            }

            if (status !== "Active" && status !== "Inactive") {
                showMessage("Please select a valid status.", "error");
                return;
            }

            if (editingId) {
                const index = services.findIndex(function (service) {
                    return service.id === editingId;
                });

                if (index === -1) {
                    showMessage("Service not found.", "error");
                    return;
                }

                const updatedService = {
                    ...services[index],
                    name: name,
                    category: category || "General",
                    icon: icon || "🛠️",
                    description: description,
                    status: status
                };

                services[index] = updatedService;

                if (!saveServices()) return;

                closeModal();
                renderServices();
                showMessage("Service updated successfully.");

            } else {
                const newService = {
                    id: "service-" + Date.now() + "-" +
                        Math.random().toString(36).slice(2, 7),
                    name: name,
                    category: category || "General",
                    icon: icon || "🛠️",
                    description: description,
                    status: status,
                    createdAt: Date.now()
                };

                services.unshift(newService);

                if (!saveServices()) {
                    services.shift();
                    return;
                }

                currentPage = 1;

                closeModal();
                renderServices();
                showMessage("New service added successfully.");
            }
        });
    }


   
    /* ---------- EDIT / DELETE BUTTONS ---------- */

    if (servicesTableBody) {
        servicesTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            const service = services.find(function (item) {
                return item.id === id;
            });

            if (!service) {
                showMessage("Service not found.", "error");
                return;
            }

            if (action === "edit") {
                openModal(service);
            }

            if (action === "delete") {
                const confirmed = window.confirm(
                    'Are you sure you want to delete "' +
                    service.name +
                    '"? This action cannot be undone.'
                );

                if (!confirmed) return;

                const previousServices = [...services];

                services = services.filter(function (item) {
                    return item.id !== id;
                });

                if (!saveServices()) {
                    services = previousServices;
                    return;
                }

                renderServices();
                showMessage("Service deleted successfully.");
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


    /* ---------- SORT ---------- */

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
        document.body.classList.remove("sidebar-open");
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", function () {
            if (!sidebar) return;

            sidebar.classList.toggle("open");
            sidebarOverlay.classList.toggle("active");

            document.body.classList.toggle(
                "sidebar-open",
                sidebar.classList.contains("open")
            );
        });
    }

    sidebarOverlay.addEventListener("click", closeSidebar);


    /* ---------- THEME ---------- */

    function applyTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);

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
                console.error("Unable to save theme:", error);
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


    /* ---------- FOOTER YEAR ---------- */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* ---------- INITIALIZE ---------- */

    applyTheme();
    loadServices();
    renderServices();

    console.log("KEWADEV Services JS loaded successfully.");

});
                    