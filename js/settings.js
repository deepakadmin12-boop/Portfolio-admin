"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // ================= CONFIGURATION =================

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";
    const THEME_KEY = "kewadev_admin_theme";
    const LANGUAGE_KEY = "kewadev_admin_language";

    // ================= ELEMENTS =================

    const settingsForm = document.getElementById("settingsForm");
    const settingsMessage = document.getElementById("settingsMessage");

    const businessName = document.getElementById("businessName");
    const businessEmail = document.getElementById("businessEmail");
    const businessWebsite = document.getElementById("businessWebsite");
    const businessCurrency = document.getElementById("businessCurrency");
    const businessDescription = document.getElementById("businessDescription");

    const notifyEnquiries = document.getElementById("notifyEnquiries");
    const notifyProjects = document.getElementById("notifyProjects");
    const notifyServices = document.getElementById("notifyServices");

    const themePreference = document.getElementById("themePreference");
    const languagePreference = document.getElementById("languagePreference");

    const apiBaseUrl = document.getElementById("apiBaseUrl");
    const connectionStatus = document.getElementById("connectionStatus");

    const saveAllSettingsButton =
        document.getElementById("saveAllSettingsButton");

    const resetSettingsButton =
        document.getElementById("resetSettingsButton");

    const themeToggle = document.getElementById("themeToggle");
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutButton = document.getElementById("logoutButton");
    const currentYear = document.getElementById("currentYear");

    let messageTimer = null;
    let isSaving = false;

    // ================= DEFAULT SETTINGS =================

    const defaultSettings = {
        businessName: "KEWA Software Development",
        businessEmail: "",
        businessWebsite: "",
        businessCurrency: "INR",
        businessDescription: "",

        notifyEnquiries: true,
        notifyProjects: true,
        notifyServices: false,

        themePreference: "dark",
        languagePreference: "en",

        apiBaseUrl: ""
    };

    // ================= API REQUEST =================

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

        const contentType =
            response.headers.get("content-type") || "";

        let result = null;

        if (contentType.includes("application/json")) {
            result = await response.json();
        } else {
            result = await response.text();
        }

        if (!response.ok) {
            const message =
                result &&
                typeof result === "object" &&
                result.message
                    ? result.message
                    : `Request failed: HTTP ${response.status}`;

            throw new Error(message);
        }

        return result;
    }

    // ================= MESSAGE =================

    function showMessage(message, type = "success") {
        if (!settingsMessage) return;

        clearTimeout(messageTimer);

        settingsMessage.textContent = message;
        settingsMessage.className = "settings-message " + type;
        settingsMessage.hidden = false;

        messageTimer = setTimeout(function () {
            settingsMessage.textContent = "";
            settingsMessage.className = "settings-message";
            settingsMessage.hidden = true;
        }, 4000);
    }

    // ================= COLLECT FORM DATA =================

    function collectSettings() {
        return {
            businessName: businessName.value.trim(),
            businessEmail: businessEmail.value.trim(),
            businessWebsite: businessWebsite.value.trim(),
            businessCurrency: businessCurrency.value,
            businessDescription: businessDescription.value.trim(),

            notifyEnquiries: notifyEnquiries.checked,
            notifyProjects: notifyProjects.checked,
            notifyServices: notifyServices.checked,

            themePreference: themePreference.value,
            languagePreference: languagePreference.value,

            apiBaseUrl: apiBaseUrl.value.trim()
        };
    }

    // ================= FILL FORM =================

    function fillForm(settings) {
        businessName.value = settings.businessName ?? "";
        businessEmail.value = settings.businessEmail ?? "";
        businessWebsite.value = settings.businessWebsite ?? "";
        businessCurrency.value = settings.businessCurrency ?? "INR";
        businessDescription.value = settings.businessDescription ?? "";

        notifyEnquiries.checked = settings.notifyEnquiries ?? true;
        notifyProjects.checked = settings.notifyProjects ?? true;
        notifyServices.checked = settings.notifyServices ?? false;

        themePreference.value = settings.themePreference ?? "dark";
        languagePreference.value = settings.languagePreference ?? "en";

        apiBaseUrl.value = settings.apiBaseUrl ?? "";
    }

    // ================= URL VALIDATION =================

    function isValidOptionalURL(value) {
        if (!value.trim()) return true;

        try {
            const parsed = new URL(value);

            return (
                parsed.protocol === "https:" ||
                parsed.protocol === "http:"
            );
        } catch (error) {
            return false;
        }
    }

    // ================= THEME =================

    function applyTheme(theme) {
        let selectedTheme = theme;

        if (selectedTheme === "system") {
            selectedTheme = window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches ? "light" : "dark";
        }

        document.body.classList.toggle(
            "light-theme",
            selectedTheme === "light"
        );

        try {
            localStorage.setItem(THEME_KEY, selectedTheme);
        } catch (error) {
            console.warn("Could not save theme preference.", error);
        }
    }

    // ================= LANGUAGE PREFERENCE =================

    function saveLanguagePreference(language) {
        try {
            localStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.warn("Could not save language preference.", error);
        }
    }

    // ================= LOAD SETTINGS FROM BACKEND =================

    async function loadSettings() {
        try {
            const result = await apiRequest("/api/settings", {
                method: "GET"
            });

            const settings =
                result &&
                typeof result === "object" &&
                !Array.isArray(result)
                    ? (result.settings || result.data || result)
                    : null;

            if (!settings || typeof settings !== "object") {
                throw new Error("Invalid settings response from backend.");
            }

            fillForm({
                ...defaultSettings,
                ...settings
            });

            applyTheme(themePreference.value);
            saveLanguagePreference(languagePreference.value);

            updateConnectionStatus(
                "Settings loaded successfully from backend.",
                "connected"
            );

        } catch (error) {
            console.error("Could not load settings:", error);

            fillForm({ ...defaultSettings });
            applyTheme(defaultSettings.themePreference);

            updateConnectionStatus(
                "Could not load settings. Check backend and API routes.",
                "disconnected"
            );

            showMessage(
                "Settings load nahi hui. Backend connection aur /api/settings route check karo.",
                "error"
            );
        }
    }

    // ================= SAVE SETTINGS TO BACKEND =================

    async function saveSettings() {
        if (isSaving) return;

        if (!settingsForm.reportValidity()) return;

        const settings = collectSettings();

        if (!settings.businessName) {
            showMessage("Please enter your business name.", "error");
            businessName.focus();
            return;
        }

        if (
            !isValidOptionalURL(settings.businessWebsite) ||
            !isValidOptionalURL(settings.apiBaseUrl)
        ) {
            showMessage(
                "Please enter valid website and API URLs.",
                "error"
            );
            return;
        }

        isSaving = true;

        if (saveAllSettingsButton) {
            saveAllSettingsButton.disabled = true;
        }

        try {
            await apiRequest("/api/settings", {
                method: "PUT",
                body: JSON.stringify(settings)
            });

            applyTheme(settings.themePreference);
            saveLanguagePreference(settings.languagePreference);

            showMessage("Settings saved successfully.", "success");

        } catch (error) {
            console.error("Could not save settings:", error);

            showMessage(
                error.message || "Could not save settings to backend.",
                "error"
            );

        } finally {
            isSaving = false;

            if (saveAllSettingsButton) {
                saveAllSettingsButton.disabled = false;
            }
        }
    }

    // ================= FORM EVENTS =================

    if (settingsForm) {
        settingsForm.addEventListener("submit", function (event) {
            event.preventDefault();
            saveSettings();
        });
    }

    // ================= THEME PREFERENCE CHANGE =================

    if (themePreference) {
        themePreference.addEventListener("change", function () {
            applyTheme(themePreference.value);
        });
    }

    /* ========== PART 1 ENDS HERE ========== */
      // ================= RESET FORM =================

    if (resetSettingsButton) {
        resetSettingsButton.addEventListener("click", function () {
            const confirmed = window.confirm(
                "Reset the form to default settings? Changes will not be saved until you click Save Settings."
            );

            if (!confirmed) return;

            fillForm({ ...defaultSettings });
            applyTheme(defaultSettings.themePreference);

            showMessage(
                "Form reset. Click Save Settings to save these defaults.",
                "success"
            );
        });
    }

    // ================= API CONNECTION STATUS =================

    function updateConnectionStatus(message, type = "") {
        if (!connectionStatus) return;

        connectionStatus.textContent = message;

        connectionStatus.classList.remove(
            "connected",
            "disconnected",
            "checking"
        );

        if (type) {
            connectionStatus.classList.add(type);
        }
    }

    async function checkAPIConnection() {
        const baseURL = apiBaseUrl.value.trim();

        if (!baseURL) {
            updateConnectionStatus(
                "Enter your backend URL first.",
                "disconnected"
            );
            return;
        }

        if (!isValidOptionalURL(baseURL)) {
            updateConnectionStatus(
                "Please enter a valid HTTP or HTTPS backend URL.",
                "disconnected"
            );
            return;
        }

        updateConnectionStatus(
            "Checking backend connection...",
            "checking"
        );

        const controller = new AbortController();

        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 8000);

        try {
            const response = await fetch(baseURL, {
                method: "GET",
                mode: "cors",
                signal: controller.signal
            });

            if (response.ok) {
                updateConnectionStatus(
                    "Backend responded. Individual API routes and authentication are not yet verified.",
                    "connected"
                );
            } else {
                updateConnectionStatus(
                    `Server responded with HTTP ${response.status}. Check the URL or endpoint.`,
                    "disconnected"
                );
            }

        } catch (error) {
            console.error("API connection check failed:", error);

            updateConnectionStatus(
                "Connection failed. Check URL, CORS, and server status.",
                "disconnected"
            );

        } finally {
            clearTimeout(timeoutId);
        }
    }

    if (apiBaseUrl) {
        apiBaseUrl.addEventListener("change", function () {
            updateConnectionStatus(
                apiBaseUrl.value.trim()
                    ? "URL entered. Tap here to check the connection."
                    : "Backend URL has not been configured.",
                ""
            );
        });
    }

    // Tap/click connection information to test the URL.
    const connectionInfo = document.querySelector(".connection-info");

    if (connectionInfo) {
        connectionInfo.style.cursor = "pointer";

        connectionInfo.setAttribute(
            "title",
            "Tap to check the backend connection"
        );

        connectionInfo.setAttribute("role", "button");
        connectionInfo.setAttribute("tabindex", "0");

        connectionInfo.addEventListener("click", checkAPIConnection);

        connectionInfo.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                checkAPIConnection();
            }
        });
    }

    // ================= HEADER THEME BUTTON =================

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isCurrentlyLight =
                document.body.classList.contains("light-theme");

            const nextTheme = isCurrentlyLight ? "dark" : "light";

            if (themePreference) {
                themePreference.value = nextTheme;
            }

            applyTheme(nextTheme);

            // Save theme locally immediately.
            // Backend settings are saved when Save Settings is clicked.
            showMessage(
                "Theme changed. Click Save Settings to save all settings to the backend.",
                "success"
            );
        });
    }

    // ================= MOBILE SIDEBAR =================

    let sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement("div");
        sidebarOverlay.className = "sidebar-overlay";
        document.body.appendChild(sidebarOverlay);
    }

    function toggleSidebar(forceState) {
        if (!adminSidebar || !menuToggle) return;

        const shouldOpen =
            typeof forceState === "boolean"
                ? forceState
                : !adminSidebar.classList.contains("open");

        adminSidebar.classList.toggle("open", shouldOpen);
        sidebarOverlay.classList.toggle("active", shouldOpen);

        menuToggle.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            toggleSidebar();
        });
    }

    sidebarOverlay.addEventListener("click", function () {
        toggleSidebar(false);
    });

    document.querySelectorAll(".sidebar-nav .nav-link").forEach(
        function (link) {
            link.addEventListener("click", function () {
                toggleSidebar(false);
            });
        }
    );

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            toggleSidebar(false);
        }
    });

    // ================= LOGOUT =================

    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            const confirmed = window.confirm(
                "Are you sure you want to log out?"
            );

            if (!confirmed) return;

            logoutButton.disabled = true;

            try {
                await apiRequest("/api/auth/logout", {
                    method: "POST",
                    body: JSON.stringify({})
                });

            } catch (error) {
                console.error("Logout request failed:", error);
            } finally {
                // Redirect even if the logout endpoint is unavailable.
                window.location.href = "../login.html";
            }
        });
    }

    // ================= FOOTER YEAR =================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // ================= SYSTEM THEME UPDATES =================

    const systemThemeQuery = window.matchMedia(
        "(prefers-color-scheme: light)"
    );

    systemThemeQuery.addEventListener("change", function () {
        if (themePreference && themePreference.value === "system") {
            applyTheme("system");
        }
    });

    // ================= INITIALIZE =================

    const localTheme = localStorage.getItem(THEME_KEY);

    if (localTheme) {
        applyTheme(localTheme);
    }

    loadSettings();

    console.log("KEWA Admin Settings initialized.");

});