
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // ================= BACKEND CONFIG =================

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";

    const PROJECTS_API = `${API_BASE_URL}/api/projects`;
    const ENQUIRIES_API = `${API_BASE_URL}/api/enquiries`;

    // Theme/settings browser mein hi rahenge
    const THEME_KEY = "kewadev_admin_theme";
    const SETTINGS_KEY = "kewadev_admin_settings";

    // ================= HTML ELEMENTS =================

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const themeBtn = document.getElementById("themeBtn");
    const globalSearch = document.getElementById("globalSearch");
    const logoutBtn = document.getElementById("logoutBtn");

    const totalProjects = document.getElementById("totalProjects");
    const totalEnquiries = document.getElementById("totalEnquiries");
    const activeProjects = document.getElementById("activeProjects");
    const websiteVisitors = document.getElementById("websiteVisitors");

    const projectSummary = document.getElementById("projectSummary");
    const enquirySummary = document.getElementById("enquirySummary");

    const currentDate = document.getElementById("currentDate");
    const currentTime = document.getElementById("currentTime");
    const currentYear = document.getElementById("currentYear");

    let projects = [];
    let enquiries = [];

    // ================= LOCAL SETTINGS =================

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            if (value === null) return fallback;

            return JSON.parse(value);
        } catch (error) {
            console.warn("Could not read settings:", key, error);
            return fallback;
        }
    }

    function saveValue(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn("Could not save settings:", error);
            return false;
        }
    }

    // ================= BACKEND API =================

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Accept": "application/json",
                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(
                `Backend request failed: ${response.status}`
            );
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    // ================= HTML ESCAPING =================

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

    // ================= LOAD PROJECTS FROM BACKEND =================

    async function loadProjects() {
        try {
            const data = await apiRequest(PROJECTS_API);

            projects = Array.isArray(data)
                ? data
                : Array.isArray(data?.projects)
                    ? data.projects
                    : [];

        } catch (error) {
            console.error("Could not load projects:", error);
            projects = [];
        }
    }

    // ================= LOAD ENQUIRIES FROM BACKEND =================

    async function loadEnquiries() {
        try {
            const data = await apiRequest(ENQUIRIES_API);

            enquiries = Array.isArray(data)
                ? data
                : Array.isArray(data?.enquiries)
                    ? data.enquiries
                    : [];

        } catch (error) {
            console.error("Could not load enquiries:", error);
            enquiries = [];
        }
    }

    // ================= DATE HELPERS =================

    function getTimestamp(item) {
        const value =
            item.updatedAt ||
            item.createdAt ||
            item.date ||
            item.timestamp ||
            0;

        if (typeof value === "number") return value;

        const parsed = Date.parse(value);

        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function formatDate(value) {
        if (!value) return "Date unavailable";

        const timestamp =
            typeof value === "number" ? value : Date.parse(value);

        if (!Number.isFinite(timestamp)) {
            return "Date unavailable";
        }

        return new Date(timestamp).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    // ================= PROJECT STATUS =================

    function isPublished(project) {
        return String(project.status || "").toLowerCase() === "published";
    }

    // ================= UPDATE STATISTICS =================

    function updateStatistics() {
        totalProjects.textContent = projects.length;
        totalEnquiries.textContent = enquiries.length;

        activeProjects.textContent = projects.filter(function (project) {
            return isPublished(project);
        }).length;

        // Visitor analytics abhi connect nahi hai.
        websiteVisitors.textContent = "—";
    }

    // ================= SEARCH HELPERS =================

    function getSearchTerm() {
        return globalSearch.value.trim().toLowerCase();
    }

    function matchesSearch(item, fields, term) {
        if (!term) return true;

        return fields.some(function (field) {
            const value = item[field];

            if (Array.isArray(value)) {
                return value.join(" ").toLowerCase().includes(term);
            }

            return String(value || "").toLowerCase().includes(term);
        });
    }

    // ================= RENDER PROJECT OVERVIEW =================

    function renderProjects() {
        const term = getSearchTerm();

        const filteredProjects = projects
            .filter(function (project) {
                return matchesSearch(
                    project,
                    [
                        "name",
                        "shortDescription",
                        "description",
                        "category",
                        "status",
                        "technologies"
                    ],
                    term
                );
            })
            .sort(function (a, b) {
                return getTimestamp(b) - getTimestamp(a);
            })
            .slice(0, 5);

        if (filteredProjects.length === 0) {
            projectSummary.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">▤</div>
                    <h4>${term ? "No matching projects" : "No project data yet"}</h4>
                    <p>${
                        term
                            ? "Try another search term."
                            : "Your project statistics will appear here."
                    }</p>
                    <a href="pages/projects.html" class="primary-btn">
                        Manage Projects
                    </a>
                </div>
            `;

            return;
        }

        projectSummary.innerHTML = filteredProjects.map(function (project) {
            const name = escapeHTML(project.name || "Untitled Project");

            const description = escapeHTML(
                project.shortDescription || "No description provided."
            );

            const status = isPublished(project) ? "Published" : "Draft";

            const statusClass = isPublished(project)
                ? "published"
                : "draft";

            const date = formatDate(
                project.updatedAt || project.createdAt
            );

            return `
                <div class="project-row">
                    <div class="project-row-info">
                        <h4>${name}</h4>
                        <p>${description}</p>
                        <small>Updated: ${escapeHTML(date)}</small>
                    </div>

                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </div>
            `;
        }).join("");
    }

    // ================= RENDER ENQUIRY OVERVIEW =================

    function renderEnquiries() {
        const term = getSearchTerm();

        const filteredEnquiries = enquiries
            .filter(function (enquiry) {
                return matchesSearch(
                    enquiry,
                    [
                        "name",
                        "clientName",
                        "email",
                        "subject",
                        "message",
                        "status"
                    ],
                    term
                );
            })
            .sort(function (a, b) {
                return getTimestamp(b) - getTimestamp(a);
            })
            .slice(0, 5);

        if (filteredEnquiries.length === 0) {
            enquirySummary.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✉</div>
                    <h4>${term ? "No matching enquiries" : "No enquiries yet"}</h4>
                    <p>${
                        term
                            ? "Try another search term."
                            : "New client enquiries will appear here."
                    }</p>
                </div>
            `;

            return;
        }

        enquirySummary.innerHTML = filteredEnquiries.map(function (enquiry) {
            const name = escapeHTML(
                enquiry.name || enquiry.clientName || "Unknown Client"
            );

            const subject = escapeHTML(
                enquiry.subject || enquiry.message || "No message provided."
            );

            const date = formatDate(
                enquiry.createdAt || enquiry.date || enquiry.timestamp
            );

            const status = escapeHTML(enquiry.status || "New");

            return `
                <div class="enquiry-row">
                    <div class="enquiry-row-info">
                        <h4>${name}</h4>
                        <p>${subject}</p>
                        <small>${escapeHTML(date)}</small>
                    </div>

                    <span class="status-badge">${status}</span>
                </div>
            `;
        }).join("");
    }

    // ================= GLOBAL SEARCH =================

    function handleSearch() {
        renderProjects();
        renderEnquiries();
    }

    globalSearch.addEventListener("input", handleSearch);

    // ================= THEME =================

    function getThemePreference() {
        let preference = "dark";

        const storedTheme = readJSON(THEME_KEY, null);

        let rawTheme = null;

        try {
            rawTheme = localStorage.getItem(THEME_KEY);
        } catch (error) {
            console.warn("Could not read theme:", error);
        }

        if (rawTheme && ["dark", "light", "system"].includes(rawTheme)) {
            preference = rawTheme;
        }

        const settings = readJSON(SETTINGS_KEY, null);

        if (
            settings &&
            ["dark", "light", "system"].includes(settings.themePreference)
        ) {
            preference = settings.themePreference;
        } else if (
            storedTheme &&
            ["dark", "light", "system"].includes(storedTheme)
        ) {
            preference = storedTheme;
        }

        return preference;
    }

    function applyTheme(preference) {
        let effectiveTheme = preference;

        if (preference === "system") {
            effectiveTheme = window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches ? "light" : "dark";
        }

        document.body.classList.toggle(
            "light-theme",
            effectiveTheme === "light"
        );

        themeBtn.textContent =
            effectiveTheme === "light" ? "☀" : "☾";

        themeBtn.setAttribute(
            "aria-pressed",
            String(effectiveTheme === "light")
        );
    }

    function saveTheme(preference) {
        saveValue(THEME_KEY, preference);

        const settings = readJSON(SETTINGS_KEY, null);

        if (settings && typeof settings === "object") {
            settings.themePreference = preference;
            saveValue(SETTINGS_KEY, JSON.stringify(settings));
        }

        applyTheme(preference);
    }

    themeBtn.addEventListener("click", function () {
        const isLight = document.body.classList.contains("light-theme");

        saveTheme(isLight ? "dark" : "light");
    });

    const systemThemeQuery = window.matchMedia(
        "(prefers-color-scheme: light)"
    );

    systemThemeQuery.addEventListener("change", function () {
        if (getThemePreference() === "system") {
            applyTheme("system");
        }
    });

    // ================= MOBILE SIDEBAR =================

    let sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement("div");
        sidebarOverlay.className = "sidebar-overlay";
        document.body.appendChild(sidebarOverlay);
    }

    function setSidebar(open) {
        sidebar.classList.toggle("open", open);
        sidebarOverlay.classList.toggle("active", open);

        menuBtn.setAttribute("aria-expanded", String(open));

        document.body.classList.toggle("sidebar-open", open);
    }

    menuBtn.addEventListener("click", function () {
        setSidebar(!sidebar.classList.contains("open"));
    });

    sidebarOverlay.addEventListener("click", function () {
        setSidebar(false);
    });

    sidebar.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
            setSidebar(false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setSidebar(false);
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            setSidebar(false);
        }
    });

    // ================= LOGOUT =================

    logoutBtn.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Are you sure you want to leave the admin panel?"
        );

        if (confirmed) {
            window.location.href = "login.html";
        }
    });

    // ================= DATE AND TIME =================

    function updateDateTime() {
        const now = new Date();

        currentDate.textContent = now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        currentTime.textContent = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        currentYear.textContent = now.getFullYear();
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ================= INITIALIZE DASHBOARD =================

    async function initializeDashboard() {
        applyTheme(getThemePreference());

        await Promise.all([
            loadProjects(),
            loadEnquiries()
        ]);

        updateStatistics();
        renderProjects();
        renderEnquiries();

        console.log("KEWA Admin Dashboard initialized.");
    }

    initializeDashboard();

});
