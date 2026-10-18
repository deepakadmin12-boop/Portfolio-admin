
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       KEWA PORTFOLIO ADMIN
       File: js/projects.js
       ===================================== */

    const STORAGE_KEY = "kewadev_admin_projects";
    const THEME_KEY = "kewadev_admin_theme";
    const ITEMS_PER_PAGE = 5;

    let projects = [];
    let currentPage = 1;
    let pendingDeleteId = null;
    let messageTimer;


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
    const projectShortDescription = document.getElementById("projectShortDescription");
    const projectDescription = document.getElementById("projectDescription");
    const projectCategory = document.getElementById("projectCategory");
    const projectStatus = document.getElementById("projectStatus");
    const projectImage = document.getElementById("projectImage");
    const projectLiveUrl = document.getElementById("projectLiveUrl");
    const projectGithubUrl = document.getElementById("projectGithubUrl");
    const projectTechnologies = document.getElementById("projectTechnologies");
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


    /* ---------- DEFAULT PROJECT ---------- */

    const defaultProjects = [
        {
            id: "kewa-trade-tracker",
            name: "KEWA Trade Tracker",
            shortDescription:
                "A trading profit and loss tracking application.",
            description:
                "KEWA Trade Tracker helps users record trades, calculate profit and loss, monitor trading performance and generate reports.",
            category: "web",
            status: "published",
            image: "",
            liveUrl: "https://trade-tracker-h0lo.vercel.app/",
            githubUrl: "",
            technologies: ["HTML", "CSS", "JavaScript", "LocalStorage"],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    ];


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


    /* ---------- LOAD PROJECTS ---------- */

    function loadProjects() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved === null) {
                projects = [...defaultProjects];
                saveProjects();
                return;
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                projects = [...defaultProjects];
                saveProjects();
                return;
            }

            projects = parsed.map(function (item) {
                return {
                    id: String(item.id || createId()),
                    name: String(item.name || ""),
                    shortDescription: String(item.shortDescription || ""),
                    description: String(item.description || ""),
                    category: categories[item.category]
                        ? item.category
                        : "other",
                    status: statuses[item.status]
                        ? item.status
                        : "draft",
                    image: String(item.image || ""),
                    liveUrl: String(item.liveUrl || ""),
                    githubUrl: String(item.githubUrl || ""),
                    technologies: Array.isArray(item.technologies)
                        ? item.technologies.map(String)
                        : [],
                    createdAt: Number(item.createdAt) || Date.now(),
                    updatedAt: Number(item.updatedAt) || Date.now()
                };
            });

        } catch (error) {
            console.error("Could not load projects:", error);
            projects = [];
            showMessage("Could not load saved projects.", "error");
        }
    }


    /* ---------- SAVE PROJECTS ---------- */

    function saveProjects() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            return true;

        } catch (error) {
            console.error("Could not save projects:", error);
            showMessage("Could not save projects. Check browser storage.", "error");
            return false;
        }
    }


    /* ---------- CREATE ID ---------- */

    function createId() {
        return "project-" +
            Date.now() + "-" +
            Math.random().toString(36).slice(2, 8);
    }


    /* ---------- STATISTICS ---------- */

    function updateStatistics() {
        const published = projects.filter(function (project) {
            return project.status === "published";
        }).length;

        const drafts = projects.filter(function (project) {
            return project.status === "draft";
        }).length;

        if (totalProjects) {
            totalProjects.textContent = projects.length;
        }

        if (publishedProjects) {
            publishedProjects.textContent = published;
        }

        if (draftProjects) {
            draftProjects.textContent = drafts;
        }
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
                const technologies = project.technologies.join(" ");

                return (
                    project.name.toLowerCase().includes(search) ||
                    project.shortDescription.toLowerCase().includes(search) ||
                    project.description.toLowerCase().includes(search) ||
                    technologies.toLowerCase().includes(search)
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
            return b.updatedAt - a.updatedAt;
        });

        return result;
    }


    /* ---------- RENDER PROJECT TABLE ---------- */

    function renderProjects() {
        if (!projectsTableBody) return;

        updateStatistics();

        const filtered = getFilteredProjects();

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / ITEMS_PER_PAGE)
        );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

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
                ? `<img
                       src="${escapeHTML(project.image)}"
                       alt=""
                       class="project-thumb"
                       loading="lazy"
                       referrerpolicy="no-referrer"
                   >`
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
                        <button
                            type="button"
                            class="edit-btn"
                            data-action="edit"
                            data-id="${escapeHTML(project.id)}"
                        >Edit</button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(project.id)}"
                        >Delete</button>
                    </div>
                </td>
            `;

            projectsTableBody.appendChild(row);
        });

        if (paginationInfo) {
            paginationInfo.textContent = filtered.length === 0
                ? "Showing 0 projects"
                : "Showing " +
                    (startIndex + 1) +
                    "–" +
                    Math.min(startIndex + ITEMS_PER_PAGE, filtered.length) +
                    " of " +
                    filtered.length +
                    " projects";
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

    /* PART 1 ENDS HERE */

    // ================= ADD / EDIT PROJECT MODAL =================

    function openProjectModal(project = null) {
        projectForm.reset();

        if (project) {
            modalTitle.textContent = "Edit Project";
            saveProjectBtn.textContent = "Update Project";

            projectId.value = project.id || "";
            projectName.value = project.name || "";
            projectShortDescription.value = project.shortDescription || "";
            projectDescription.value = project.description || "";
            projectCategory.value = project.category || "web";
            projectStatus.value = project.status || "draft";
            projectImage.value = project.image || "";
            projectLiveUrl.value = project.liveUrl || "";
            projectGithubUrl.value = project.githubUrl || "";
            projectTechnologies.value = Array.isArray(project.technologies)
                ? project.technologies.join(", ")
                : "";
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
            projectName.focus();
        }, 50);
    }

    function closeProjectModal() {
        projectModal.hidden = true;
        projectModal.setAttribute("aria-hidden", "true");

        if (deleteModal.hidden) {
            document.body.classList.remove("modal-open");
        }

        projectForm.reset();
    }


    // ================= DELETE CONFIRMATION MODAL =================

    function openDeleteModal(id) {
        pendingDeleteId = id;

        deleteModal.hidden = false;
        deleteModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        deleteModal.hidden = true;
        deleteModal.setAttribute("aria-hidden", "true");
        pendingDeleteId = null;

        if (projectModal.hidden) {
            document.body.classList.remove("modal-open");
        }
    }


    // ================= VALIDATE OPTIONAL URLS =================

    function isValidOptionalURL(value) {
        if (!value.trim()) {
            return true;
        }

        try {
            const parsedURL = new URL(value.trim());

            return (
                parsedURL.protocol === "https:" ||
                parsedURL.protocol === "http:"
            );
        } catch (error) {
            return false;
        }
    }


    // ================= ADD PROJECT BUTTONS =================

    addProjectBtn.addEventListener("click", function () {
        openProjectModal();
    });

    emptyAddProjectBtn.addEventListener("click", function () {
        openProjectModal();
    });


    // ================= CLOSE PROJECT MODAL =================

    closeModalBtn.addEventListener("click", closeProjectModal);
    cancelProjectBtn.addEventListener("click", closeProjectModal);

    modalBackdrop.addEventListener("click", function () {
        closeProjectModal();
    });


    // ================= SAVE / UPDATE PROJECT =================

    projectForm.addEventListener("submit", function (event) {
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
            showMessage(
                "Please fill in all required project fields.",
                "error"
            );
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
            showMessage(
                "Please enter valid image, live demo, or GitHub URLs.",
                "error"
            );
            return;
        }

        const now = Date.now();
        const previousProjects = projects.map(function (item) {
            return { ...item };
        });

        if (id) {
            const index = projects.findIndex(function (item) {
                return item.id === id;
            });

            if (index === -1) {
                showMessage("Project not found. Please refresh.", "error");
                return;
            }

            projects[index] = {
                ...projects[index],
                name: name,
                shortDescription: shortDescription,
                description: description,
                category: category,
                status: status,
                image: image,
                liveUrl: liveUrl,
                githubUrl: githubUrl,
                technologies: technologies,
                updatedAt: now
            };
        } else {
            projects.unshift({
                id: createId(),
                name: name,
                shortDescription: shortDescription,
                description: description,
                category: category,
                status: status,
                image: image,
                liveUrl: liveUrl,
                githubUrl: githubUrl,
                technologies: technologies,
                createdAt: now,
                updatedAt: now
            });
        }

        if (!saveProjects()) {
            projects = previousProjects;
            showMessage(
                "Could not save project. Please check your browser storage.",
                "error"
            );
            return;
        }

        closeProjectModal();
        currentPage = 1;
        renderProjects();

        showMessage(
            id ? "Project updated successfully." : "Project added successfully.",
            "success"
        );
    });


    // ================= PROJECT TABLE EDIT / DELETE =================

    projectsTableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-action][data-id]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        const project = projects.find(function (item) {
            return item.id === id;
        });

        if (!project) {
            showMessage("Project not found.", "error");
            return;
        }

        if (action === "edit") {
            openProjectModal(project);
        }

        if (action === "delete") {
            openDeleteModal(id);
        }
    });


    // ================= CLOSE DELETE MODAL =================

    cancelDeleteBtn.addEventListener("click", closeDeleteModal);

    deleteBackdrop.addEventListener("click", function () {
        closeDeleteModal();
    });


    // ================= CONFIRM DELETE PROJECT =================

    confirmDeleteBtn.addEventListener("click", function () {
        if (!pendingDeleteId) {
            return;
        }

        const previousProjects = projects.map(function (item) {
            return { ...item };
        });

        const idToDelete = pendingDeleteId;

        projects = projects.filter(function (item) {
            return item.id !== idToDelete;
        });

        if (projects.length === previousProjects.length) {
            closeDeleteModal();
            showMessage("Project not found.", "error");
            return;
        }

        if (!saveProjects()) {
            projects = previousProjects;
            closeDeleteModal();

            showMessage(
                "Could not delete project. Please try again.",
                "error"
            );
            return;
        }

        closeDeleteModal();

        const filteredProjects = getFilteredProjects();
        const totalPages = Math.max(
            1,
            Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
        );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        renderProjects();
        showMessage("Project deleted successfully.", "success");
    });


    // ================= SEARCH PROJECTS =================

    projectSearch.addEventListener("input", function () {
        currentPage = 1;
        renderProjects();
    });


    // ================= CATEGORY FILTER =================

    categoryFilter.addEventListener("change", function () {
        currentPage = 1;
        renderProjects();
    });


    // ================= STATUS FILTER =================

    statusFilter.addEventListener("change", function () {
        currentPage = 1;
        renderProjects();
    });


    // ================= REFRESH PROJECTS =================

    refreshProjectsBtn.addEventListener("click", function () {
        loadProjects();
        currentPage = 1;
        renderProjects();

        showMessage("Projects refreshed from this browser's storage.", "success");
    });


    // ================= PAGINATION =================

    previousPageBtn.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderProjects();
        }
    });

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


    // ================= THEME TOGGLE =================

    function applyTheme() {
        let savedTheme = "dark";

        try {
            savedTheme = localStorage.getItem(THEME_KEY) || "dark";
        } catch (error) {
            console.warn("Could not read saved theme.", error);
        }

        document.body.classList.toggle(
            "light-theme",
            savedTheme === "light"
        );

        themeBtn.setAttribute(
            "aria-pressed",
            savedTheme === "light" ? "true" : "false"
        );

        themeBtn.setAttribute(
            "aria-label",
            savedTheme === "light"
                ? "Switch to dark theme"
                : "Switch to light theme"
        );
    }

    themeBtn.addEventListener("click", function () {
        const isLight = document.body.classList.toggle("light-theme");
        const newTheme = isLight ? "light" : "dark";

        try {
            localStorage.setItem(THEME_KEY, newTheme);
        } catch (error) {
            console.warn("Could not save theme.", error);
        }

        themeBtn.setAttribute("aria-pressed", String(isLight));
        themeBtn.setAttribute(
            "aria-label",
            isLight ? "Switch to dark theme" : "Switch to light theme"
        );
    });


    // ================= MOBILE SIDEBAR =================

    let sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement("div");
        sidebarOverlay.className = "sidebar-overlay";
        document.body.appendChild(sidebarOverlay);
    }

    function toggleSidebar(forceState) {
        const shouldOpen =
            typeof forceState === "boolean"
                ? forceState
                : !sidebar.classList.contains("open");

        sidebar.classList.toggle("open", shouldOpen);
        sidebarOverlay.classList.toggle("active", shouldOpen);
        menuBtn.setAttribute("aria-expanded", String(shouldOpen));
        document.body.classList.toggle("sidebar-open", shouldOpen);
    }

    menuBtn.addEventListener("click", function () {
        toggleSidebar();
    });

    sidebarOverlay.addEventListener("click", function () {
        toggleSidebar(false);
    });


    // ================= ESCAPE KEY =================

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (!deleteModal.hidden) {
            closeDeleteModal();
        }

        if (!projectModal.hidden) {
            closeProjectModal();
        }

        toggleSidebar(false);
    });


    // ================= LOGOUT =================

    logoutBtn.addEventListener("click", function () {
        const confirmed = window.confirm("Are you sure you want to logout?");

        if (confirmed) {
            window.location.href = "../login.html";
        }
    });


    // ================= FOOTER YEAR =================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // ================= INITIALIZE PROJECTS PAGE =================

    applyTheme();
    loadProjects();
    renderProjects();

    console.log("KEWADEV Projects Admin initialized.");

});
