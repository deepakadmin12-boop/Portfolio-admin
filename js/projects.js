
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       KEWADEV ADMIN - PROJECTS
       Backend connected version
       ===================================== */

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";
    const THEME_KEY = "kewadev_admin_theme";
    const ITEMS_PER_PAGE = 5;

    let projects = [];
    let currentPage = 1;
    let pendingDeleteId = null;
    let messageTimer = null;

    /* ---------- ELEMENTS ---------- */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const themeBtn = document.getElementById("themeBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const addProjectBtn = document.getElementById("addProjectBtn");
    const emptyAddProjectBtn = document.getElementById("emptyAddProjectBtn");
    const refreshProjectsBtn = document.getElementById("refreshProjectsBtn");

    const totalProjects = document.getElementById("totalProjects");
    const publishedProjects = document.getElementById("publishedProjects");
    const draftProjects = document.getElementById("draftProjects");

    const projectSearch = document.getElementById("projectSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const statusFilter = document.getElementById("statusFilter");

    const projectsTableBody = document.getElementById("projectsTableBody");
    const pageMessage = document.getElementById("pageMessage");
    const emptyState = document.getElementById("emptyState");

    const paginationInfo = document.getElementById("paginationInfo");
    const previousPageBtn = document.getElementById("previousPageBtn");
    const currentPageElement = document.getElementById("currentPage");
    const nextPageBtn = document.getElementById("nextPageBtn");

    const projectModal = document.getElementById("projectModal");
    const modalBackdrop = document.getElementById("modalBackdrop");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelProjectBtn = document.getElementById("cancelProjectBtn");

    const projectForm = document.getElementById("projectForm");
    const projectId = document.getElementById("projectId");
    const projectName = document.getElementById("projectName");
    const projectShortDescription =
        document.getElementById("projectShortDescription");
    const projectDescription =
        document.getElementById("projectDescription");
    const projectCategory = document.getElementById("projectCategory");
    const projectStatus = document.getElementById("projectStatus");
    const projectImage = document.getElementById("projectImage");
    const projectLiveUrl = document.getElementById("projectLiveUrl");
    const projectGithubUrl = document.getElementById("projectGithubUrl");
    const projectTechnologies =
        document.getElementById("projectTechnologies");
    const modalTitle = document.getElementById("modalTitle");
    const saveProjectBtn = document.getElementById("saveProjectBtn");

    const deleteModal = document.getElementById("deleteModal");
    const deleteBackdrop = document.getElementById("deleteBackdrop");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    const currentYear = document.getElementById("currentYear");

    /* ---------- CONSTANTS ---------- */

    const categories = {
        web: "Web App",
        website: "Website",
        tool: "Developer Tool",
        other: "Other"
    };

    const statuses = {
        published: "Published",
        draft: "Draft"
    };

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

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
                credentials: "include"
            }
        );

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
                `Request failed with status ${response.status}`
            );
        }

        return result;
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

    /* ---------- MESSAGE ---------- */

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

    /* ---------- DATE ---------- */

    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    /* ---------- NORMALIZE PROJECT ---------- */

    function normalizeProject(item) {
        return {
            id: String(item.id ?? item._id ?? ""),
            name: String(item.name || ""),
            shortDescription: String(item.shortDescription || ""),
            description: String(item.description || ""),
            category: categories[item.category] ? item.category : "other",
            status: statuses[item.status] ? item.status : "draft",
            image: String(item.image || ""),
            liveUrl: String(item.liveUrl || ""),
            githubUrl: String(item.githubUrl || ""),
            technologies: Array.isArray(item.technologies)
                ? item.technologies.map(String)
                : [],
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || item.createdAt || Date.now()
        };
    }

    /* ---------- LOAD PROJECTS FROM BACKEND ---------- */

    async function loadProjects() {
        const result = await apiRequest("/api/projects", {
            method: "GET"
        });

        let list;

        if (Array.isArray(result)) {
            list = result;
        } else if (Array.isArray(result?.projects)) {
            list = result.projects;
        } else if (Array.isArray(result?.data)) {
            list = result.data;
        } else {
            throw new Error(
                "Backend response mein projects array nahi mila."
            );
        }

        projects = list.map(normalizeProject);
    }

    /* ---------- STATISTICS ---------- */

    function updateStatistics() {
        const published = projects.filter(function (project) {
            return project.status === "published";
        }).length;

        const drafts = projects.filter(function (project) {
            return project.status === "draft";
        }).length;

        if (totalProjects) totalProjects.textContent = projects.length;
        if (publishedProjects) publishedProjects.textContent = published;
        if (draftProjects) draftProjects.textContent = drafts;
    }

    /* ---------- SEARCH AND FILTER ---------- */

    function getFilteredProjects() {
        let result = [...projects];

        const search = projectSearch
            ? projectSearch.value.trim().toLowerCase()
            : "";

        const category = categoryFilter
            ? categoryFilter.value
            : "all";

        const status = statusFilter
            ? statusFilter.value
            : "all";

        if (search) {
            result = result.filter(function (project) {
                return (
                    project.name.toLowerCase().includes(search) ||
                    project.shortDescription.toLowerCase().includes(search) ||
                    project.description.toLowerCase().includes(search) ||
                    project.technologies.join(" ").toLowerCase().includes(search)
                );
            });
        }

        if (category !== "all") {
            result = result.filter(function (project) {
                return project.category === category;
            });
        }

        if (status !== "all") {
            result = result.filter(function (project) {
                return project.status === status;
            });
        }

        result.sort(function (a, b) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        return result;
    }

    /* ---------- RENDER PROJECTS ---------- */

    function renderProjects() {
        if (!projectsTableBody) return;

        updateStatistics();

        const filtered = getFilteredProjects();

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / ITEMS_PER_PAGE)
        );

        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

        const visibleProjects = filtered.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        projectsTableBody.innerHTML = "";

        if (emptyState) {
            emptyState.hidden = visibleProjects.length > 0;
        }

        visibleProjects.forEach(function (project) {
            const row = document.createElement("tr");

            const categoryName = categories[project.category] || "Other";
            const statusName = statuses[project.status] || "Draft";

            const imageMarkup = project.image
                ? `<img src="${escapeHTML(project.image)}"
                        alt=""
                        class="project-thumb"
                        loading="lazy"
                        referrerpolicy="no-referrer">`
                : `<span class="project-thumb-placeholder">▣</span>`;

            row.innerHTML = `
                <td>
                    <div class="project-cell">
                        ${imageMarkup}
                        <div class="project-info">
                            <strong>${escapeHTML(project.name)}</strong>
                            <small>${escapeHTML(project.shortDescription)}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHTML(categoryName)}</td>
                <td>
                    <span class="status-badge ${escapeHTML(project.status)}">
                        ${escapeHTML(statusName)}
                    </span>
                </td>
                <td>${escapeHTML(formatDate(project.updatedAt))}</td>
                <td>
                    <div class="project-actions">
                        <button type="button"
                            class="edit-btn"
                            data-action="edit"
                            data-id="${escapeHTML(project.id)}">Edit</button>
                        <button type="button"
                            class="delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(project.id)}">Delete</button>
                    </div>
                </td>
            `;

            projectsTableBody.appendChild(row);
        });

        if (paginationInfo) {
            paginationInfo.textContent = filtered.length === 0
                ? "Showing 0 projects"
                : `Showing ${startIndex + 1}–${Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    filtered.length
                )} of ${filtered.length} projects`;
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

    /* PART 1 ENDS — PART 2 IS NEXT */

    /* ---------- CREATE / EDIT MODAL ---------- */

    function openProjectModal(project = null) {
        if (!projectForm || !projectModal) return;

        projectForm.reset();

        if (project) {
            modalTitle.textContent = "Edit Project";
            saveProjectBtn.textContent = "Update Project";

            projectId.value = project.id;
            projectName.value = project.name;
            projectShortDescription.value = project.shortDescription;
            projectDescription.value = project.description;
            projectCategory.value = project.category;
            projectStatus.value = project.status;
            projectImage.value = project.image;
            projectLiveUrl.value = project.liveUrl;
            projectGithubUrl.value = project.githubUrl;
            projectTechnologies.value = project.technologies.join(", ");
        } else {
            modalTitle.textContent = "Add New Project";
            saveProjectBtn.textContent = "Save Project";

            projectId.value = "";
            projectCategory.value = "web";
            projectStatus.value = "draft";
        }

        projectModal.hidden = false;
        projectModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        setTimeout(function () {
            projectName?.focus();
        }, 50);
    }

    function closeProjectModal() {
        if (!projectModal) return;

        projectModal.hidden = true;
        projectModal.setAttribute("aria-hidden", "true");

        if (!deleteModal || deleteModal.hidden) {
            document.body.classList.remove("modal-open");
        }

        projectForm?.reset();
    }

    /* ---------- DELETE MODAL ---------- */

    function openDeleteModal(id) {
        pendingDeleteId = id;

        deleteModal.hidden = false;
        deleteModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        if (!deleteModal) return;

        deleteModal.hidden = true;
        deleteModal.setAttribute("aria-hidden", "true");
        pendingDeleteId = null;

        if (!projectModal || projectModal.hidden) {
            document.body.classList.remove("modal-open");
        }
    }

    /* ---------- URL VALIDATION ---------- */

    function isValidOptionalURL(value) {
        if (!value.trim()) return true;

        try {
            const parsedURL = new URL(value.trim());

            return (
                parsedURL.protocol === "https:" ||
                parsedURL.protocol === "http:"
            );
        } catch (_) {
            return false;
        }
    }

    /* ---------- ADD BUTTONS ---------- */

    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", function () {
            openProjectModal();
        });
    }

    if (emptyAddProjectBtn) {
        emptyAddProjectBtn.addEventListener("click", function () {
            openProjectModal();
        });
    }

    /* ---------- CLOSE MODAL BUTTONS ---------- */

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeProjectModal);
    }

    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener("click", closeProjectModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", closeProjectModal);
    }

    /* ---------- SAVE / UPDATE PROJECT ---------- */

    if (projectForm) {
        projectForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const id = projectId.value.trim();
            const name = projectName.value.trim();
            const shortDescription = projectShortDescription.value.trim();
            const description = projectDescription.value.trim();
            const category = projectCategory.value;
            const status = projectStatus.value;
            const image = projectImage.value.trim();
            const liveUrl = projectLiveUrl.value.trim();
            const githubUrl = projectGithubUrl.value.trim();

            const technologies = projectTechnologies.value
                .split(",")
                .map(function (technology) {
                    return technology.trim();
                })
                .filter(Boolean);

            if (!name || !shortDescription || !description) {
                showMessage("Please fill in all required project fields.", "error");
                return;
            }

            if (!Object.prototype.hasOwnProperty.call(categories, category)) {
                showMessage("Please select a valid category.", "error");
                return;
            }

            if (!Object.prototype.hasOwnProperty.call(statuses, status)) {
                showMessage("Please select a valid status.", "error");
                return;
            }

            if (
                !isValidOptionalURL(image) ||
                !isValidOptionalURL(liveUrl) ||
                !isValidOptionalURL(githubUrl)
            ) {
                showMessage("Please enter valid HTTP or HTTPS URLs.", "error");
                return;
            }

            const payload = {
                name,
                shortDescription,
                description,
                category,
                status,
                image,
                liveUrl,
                githubUrl,
                technologies
            };

            const oldText = saveProjectBtn.textContent;
            saveProjectBtn.disabled = true;
            saveProjectBtn.textContent = id ? "Updating..." : "Saving...";

            try {
                const result = await apiRequest(
                    id
                        ? `/api/projects/${encodeURIComponent(id)}`
                        : "/api/projects",
                    {
                        method: id ? "PUT" : "POST",
                        body: JSON.stringify(payload)
                    }
                );

                await loadProjects();
                currentPage = 1;
                renderProjects();
                closeProjectModal();

                showMessage(
                    result?.message ||
                    (id ? "Project updated successfully." : "Project added successfully."),
                    "success"
                );
            } catch (error) {
                console.error("Save project error:", error);
                showMessage(error.message || "Could not save project.", "error");
            } finally {
                saveProjectBtn.disabled = false;
                saveProjectBtn.textContent = oldText;
            }
        });
    }

    /* ---------- EDIT / DELETE ACTIONS ---------- */

    if (projectsTableBody) {
        projectsTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const project = projects.find(function (item) {
                return String(item.id) === String(button.dataset.id);
            });

            if (!project) {
                showMessage("Project not found. Refresh and try again.", "error");
                return;
            }

            if (button.dataset.action === "edit") {
                openProjectModal(project);
            }

            if (button.dataset.action === "delete") {
                openDeleteModal(project.id);
            }
        });
    }

    /* ---------- DELETE PROJECT ---------- */

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    }

    if (deleteBackdrop) {
        deleteBackdrop.addEventListener("click", closeDeleteModal);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async function () {
            if (!pendingDeleteId) return;

            const id = pendingDeleteId;
            const oldText = confirmDeleteBtn.textContent;

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = "Deleting...";

            try {
                const result = await apiRequest(
                    `/api/projects/${encodeURIComponent(id)}`,
                    { method: "DELETE" }
                );

                closeDeleteModal();
                await loadProjects();
                renderProjects();

                showMessage(
                    result?.message || "Project deleted successfully.",
                    "success"
                );
            } catch (error) {
                console.error("Delete project error:", error);
                showMessage(error.message || "Could not delete project.", "error");
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = oldText;
            }
        });
    }

    /* ---------- SEARCH / FILTER ---------- */

    if (projectSearch) {
        projectSearch.addEventListener("input", function () {
            currentPage = 1;
            renderProjects();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", function () {
            currentPage = 1;
            renderProjects();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", function () {
            currentPage = 1;
            renderProjects();
        });
    }

    /* ---------- PAGINATION ---------- */

    if (previousPageBtn) {
        previousPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                renderProjects();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function () {
            const totalPages = Math.max(
                1,
                Math.ceil(getFilteredProjects().length / ITEMS_PER_PAGE)
            );

            if (currentPage < totalPages) {
                currentPage++;
                renderProjects();
            }
        });
    }

    /* ---------- REFRESH ---------- */

    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener("click", async function () {
            const oldText = refreshProjectsBtn.textContent;

            refreshProjectsBtn.disabled = true;
            refreshProjectsBtn.textContent = "Refreshing...";

            try {
                await loadProjects();
                currentPage = 1;
                renderProjects();
                showMessage("Projects refreshed.", "success");
            } catch (error) {
                console.error("Refresh error:", error);
                showMessage(error.message || "Could not refresh projects.", "error");
            } finally {
                refreshProjectsBtn.disabled = false;
                refreshProjectsBtn.textContent = oldText;
            }
        });
    }

    /* ---------- KEYBOARD ---------- */

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (projectModal && !projectModal.hidden) closeProjectModal();
            if (deleteModal && !deleteModal.hidden) closeDeleteModal();
        }
    });

    /* ---------- THEME ---------- */

    function applyTheme(theme) {
        const isLight = theme === "light";

        document.body.classList.toggle("light-theme", isLight);
        document.documentElement.setAttribute("data-theme", theme);

        if (themeBtn) {
            themeBtn.textContent = isLight ? "☾" : "☼";
            themeBtn.setAttribute(
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
            console.warn("Could not load theme.", error);
        }

        applyTheme(theme);
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", function () {
            const currentTheme = document.body.classList.contains("light-theme")
                ? "light"
                : "dark";

            const newTheme = currentTheme === "light" ? "dark" : "light";

            applyTheme(newTheme);

            try {
                localStorage.setItem(THEME_KEY, newTheme);
            } catch (error) {
                console.warn("Could not save theme.", error);
            }
        });
    }

    /* ---------- MOBILE SIDEBAR ---------- */

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("open");

        const overlay = document.querySelector(".sidebar-overlay");
        if (overlay) overlay.classList.remove("active");
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
        if (window.innerWidth > 850) closeSidebar();
    });

    /* ---------- LOGOUT ---------- */

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function (event) {
            event.preventDefault();

            if (!window.confirm("Kya tum logout karna chahte ho?")) return;

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

    async function initializeProjects() {
        loadTheme();

        try {
            await loadProjects();
            renderProjects();
        } catch (error) {
            console.error("Load projects error:", error);
            showMessage(
                "Projects load nahi hue. Backend server aur API route check karo.",
                "error"
            );
        }

        console.log("KEWADEV Projects JS loaded.");
    }

    initializeProjects();

});
