
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // ================= STORAGE =================

    const STORAGE_KEY = "kewadev_admin_settings";
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

    let messageTimer;

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

    // ================= SAFE STORAGE =================

    function readSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return { ...defaultSettings };
            }

            const parsed = JSON.parse(saved);

            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {
                return { ...defaultSettings };
            }

            return {
                ...defaultSettings,
                ...parsed
            };

        } catch (error) {
            console.error("Could not load settings:", error);
            return { ...defaultSettings };
        }
    }

    function writeSettings(settings) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            return true;

        } catch (error) {
            console.error("Could not save settings:", error);
            return false;
        }
    }

    // ================= MESSAGE =================

    function showMessage(message, type) {
        if (!settingsMessage) return;

        clearTimeout(messageTimer);

        settingsMessage.textContent = message;
        settingsMessage.className = "settings-message " + type;
        settingsMessage.hidden = false;

        messageTimer = setTimeout(function () {
            settingsMessage.textContent = "";
            settingsMessage.className = "settings-message";
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
        businessName.value = settings.businessName;
        businessEmail.value = settings.businessEmail;
        businessWebsite.value = settings.businessWebsite;
        businessCurrency.value = settings.businessCurrency;
        businessDescription.value = settings.businessDescription;

        notifyEnquiries.checked = settings.notifyEnquiries;
        notifyProjects.checked = settings.notifyProjects;
        notifyServices.checked = settings.notifyServices;

        themePreference.value = settings.themePreference;
        languagePreference.value = settings.languagePreference;

        apiBaseUrl.value = settings.apiBaseUrl;
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

    // ================= APPLY THEME =================

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

    // ================= THEME PREFERENCE CHANGE =================

    themePreference.addEventListener("change", function () {
        applyTheme(themePreference.value);
    });

    // ================= SAVE SETTINGS =================

    function saveSettings() {
        if (!settingsForm.reportValidity()) {
            return;
        }

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
            showMessage("Please enter valid website and API URLs.", "error");
            return;
        }

        if (!writeSettings(settings)) {
            showMessage(
                "Settings could not be saved. Check browser storage.",
                "error"
            );
            return;
        }

        applyTheme(settings.themePreference);

        try {
            localStorage.setItem(
                LANGUAGE_KEY,
                settings.languagePreference
            );
        } catch (error) {
            console.warn("Could not save language preference.", error);
        }

        showMessage("Settings saved successfully.", "success");
    }

    settingsForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveSettings();
    });

    saveAllSettingsButton.addEventListener("click", function () {
        saveSettings();
    });

    /* PART 1 ENDS HERE */

// ================= RESET FORM =================

    resetSettingsButton.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Reset the form to default settings? Saved settings will not be changed until you click Save."
        );

        if (!confirmed) return;

        fillForm({ ...defaultSettings });
        applyTheme(defaultSettings.themePreference);

        showMessage(
            "Form reset. Click Save Settings to save these defaults.",
            "success"
        );
    });


    // ================= API CONNECTION STATUS =================

    function updateConnectionStatus(message, type) {
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
                "No backend URL configured. The admin panel is using browser storage.",
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
            "Backend URL entered. Checking connection...",
            "checking"
        );

        try {
            const controller = new AbortController();

            const timeoutId = setTimeout(function () {
                controller.abort();
            }, 8000);

            let response;

            try {
                response = await fetch(baseURL, {
                    method: "GET",
                    signal: controller.signal,
                    mode: "cors"
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (response.ok) {
                updateConnectionStatus(
                    "Backend responded successfully. This does not verify authentication or every API endpoint.",
                    "connected"
                );
            } else {
                updateConnectionStatus(
                    "The server responded with HTTP " +
                    response.status +
                    ". Check the backend URL and endpoint.",
                    "disconnected"
                );
            }

        } catch (error) {
            console.error("API connection check failed:", error);

            updateConnectionStatus(
                "Connection could not be verified. Check the URL, CORS settings, server status, and internet connection.",
                "disconnected"
            );
        }
    }

    apiBaseUrl.addEventListener("change", function () {
        if (!apiBaseUrl.value.trim()) {
            updateConnectionStatus(
                "Backend connection has not been verified.",
                ""
            );
            return;
        }

        updateConnectionStatus(
            "URL entered. Save settings, then check the connection.",
            ""
        );
    });

    // Check connection only when this button is clicked.
    // This avoids unnecessary requests to an unconfigured backend.
    const connectionInfo = document.querySelector(".connection-info");

    if (connectionInfo) {
        connectionInfo.style.cursor = "pointer";
        connectionInfo.setAttribute(
            "title",
            "Tap to check the backend connection"
        );

        connectionInfo.addEventListener("click", checkAPIConnection);
        connectionInfo.setAttribute("role", "button");
        connectionInfo.setAttribute("tabindex", "0");

        connectionInfo.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                checkAPIConnection();
            }
        });
    }


    // ================= HEADER THEME BUTTON =================

    themeToggle.addEventListener("click", function () {
        const isCurrentlyLight =
            document.body.classList.contains("light-theme");

        const nextTheme = isCurrentlyLight ? "dark" : "light";

        themePreference.value = nextTheme;
        applyTheme(nextTheme);

        const settings = collectSettings();

        if (writeSettings(settings)) {
            showMessage("Theme preference saved.", "success");
        } else {
            showMessage(
                "Theme changed, but the preference could not be saved.",
                "error"
            );
        }
    });


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

    menuToggle.addEventListener("click", function () {
        toggleSidebar();
    });

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

    logoutButton.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Are you sure you want to leave the admin panel?"
        );

        if (confirmed) {
            window.location.href = "login.html";
        }
    });


    // ================= FOOTER YEAR =================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // ================= SYSTEM THEME UPDATES =================

    const systemThemeQuery = window.matchMedia(
        "(prefers-color-scheme: light)"
    );

    systemThemeQuery.addEventListener("change", function () {
        if (themePreference.value === "system") {
            applyTheme("system");
        }
    });


    // ================= INITIALIZE SETTINGS =================

    const savedSettings = readSettings();

    fillForm(savedSettings);
    applyTheme(savedSettings.themePreference);

    updateConnectionStatus(
        savedSettings.apiBaseUrl
            ? "Backend URL is configured. Tap here to check the connection."
            : "Backend connection has not been verified.",
        ""
    );

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    console.log("KEWA Admin Settings initialized.");

});
