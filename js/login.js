
/* ========================================
   KEWADEV - ADMIN AUTHENTICATION
   File: js/login.js
======================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // ======================================
    // CONFIGURATION
    // ======================================

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";
    const AUTH_API = `${API_BASE_URL}/api/auth`;

    // Apne actual dashboard page ka path yahan set karna.
    const DASHBOARD_URL = "dashboard.html";

    const sections = [
        "loginSection",
        "registerSection",
        "setPasswordSection",
        "forgotSection"
    ];

    // ======================================
    // FOOTER YEAR
    // ======================================

    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // ======================================
    // SECTION SWITCHING
    // ======================================

    function showSection(sectionId) {
        sections.forEach((id) => {
            const section = document.getElementById(id);

            if (section) {
                section.hidden = id !== sectionId;
            }
        });

        clearMessages();
    }

    // ======================================
    // MESSAGES
    // ======================================

    function clearMessages() {
        document.querySelectorAll(".login-message").forEach((message) => {
            message.textContent = "";
            message.hidden = true;
            message.classList.remove("success", "error");
        });
    }

    function showMessage(elementId, message, type = "error") {
        const element = document.getElementById(elementId);

        if (!element) {
            console.log(message);
            return;
        }

        element.textContent = message;
        element.hidden = false;
        element.classList.remove("success", "error");
        element.classList.add(type);
    }

    // ======================================
    // API REQUEST HELPER
    // ======================================

    async function apiRequest(endpoint, data) {
        let response;

        try {
            response = await fetch(`${AUTH_API}${endpoint}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            throw new Error(
                "Backend se connection nahi ho raha. Server check karo."
            );
        }

        let result = {};

        try {
            result = await response.json();
        } catch (_) {
            // Response JSON na ho to default error use hoga.
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                `Request fail hua (${response.status}).`
            );
        }

        return result;
    }

    // ======================================
    // FORM SUBMIT HELPER
    // ======================================

    function setLoading(form, loading) {
        if (!form) return;

        const button = form.querySelector('[type="submit"]');

        if (button) {
            if (loading) {
                button.dataset.originalText = button.textContent;
                button.disabled = true;
                button.textContent = "Please wait...";
            } else {
                button.disabled = false;

                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                    delete button.dataset.originalText;
                }
            }
        }
    }

    // ======================================
    // SWITCH AUTH FORMS
    // ======================================

    document.querySelectorAll("[data-open]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const target = link.dataset.open;

            if (sections.includes(target)) {
                showSection(target);
            }
        });
    });

    // ======================================
    // SHOW / HIDE PASSWORD
    // ======================================

    const togglePassword = document.getElementById("togglePassword");
    const password = document.getElementById("password");

    if (togglePassword && password) {
        togglePassword.addEventListener("click", () => {
            const isHidden = password.type === "password";

            password.type = isHidden ? "text" : "password";
            togglePassword.textContent = isHidden ? "Hide" : "Show";

            togglePassword.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
        });
    }

    // ======================================
    // LOGIN
    // ======================================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessages();

            const email =
                document.getElementById("email")?.value.trim() || "";

            const loginPassword =
                document.getElementById("password")?.value || "";

            if (!email || !loginPassword) {
                showMessage(
                    "loginMessage",
                    "Email aur password dono enter karo."
                );
                return;
            }

            setLoading(loginForm, true);

            try {
                await apiRequest("/login", {
                    email,
                    password: loginPassword
                });

                showMessage(
                    "loginMessage",
                    "Login successful. Dashboard open ho raha hai.",
                    "success"
                );

                window.location.href = DASHBOARD_URL;
            } catch (error) {
                showMessage("loginMessage", error.message);
            } finally {
                setLoading(loginForm, false);
            }
        });
    }

    // ======================================
    // REGISTER
    // ======================================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessages();

            const name =
                document.getElementById("registerName")?.value.trim() || "";

            const email =
                document.getElementById("registerEmail")?.value.trim() || "";

            const inviteCode =
                document.getElementById("inviteCode")?.value.trim() || "";

            const registerPassword =
                document.getElementById("registerPassword")?.value || "";

            if (!name || !email || !inviteCode || !registerPassword) {
                showMessage(
                    "registerMessage",
                    "Saari fields fill karo."
                );
                return;
            }

            if (registerPassword.length < 8) {
                showMessage(
                    "registerMessage",
                    "Password kam se kam 8 characters ka hona chahiye."
                );
                return;
            }

            setLoading(registerForm, true);

            try {
                const result = await apiRequest("/register", {
                    name,
                    email,
                    inviteCode,
                    password: registerPassword
                });

                showMessage(
                    "registerMessage",
                    result.message ||
                    "Registration successful.",
                    "success"
                );

                registerForm.reset();
            } catch (error) {
                showMessage("registerMessage", error.message);
            } finally {
                setLoading(registerForm, false);
            }
        });
    }

    // ======================================
    // SET PASSWORD
    // ======================================

    const setPasswordForm = document.getElementById("setPasswordForm");

    if (setPasswordForm) {
        setPasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessages();

            const newPassword =
                document.getElementById("newPassword")?.value || "";

            const confirmPassword =
                document.getElementById("confirmPassword")?.value || "";

            const token =
                document.getElementById("setupToken")?.value.trim() || "";

            if (!token) {
                showMessage(
                    "setPasswordMessage",
                    "Valid password setup link se mila token required hai."
                );
                return;
            }

            if (newPassword.length < 8) {
                showMessage(
                    "setPasswordMessage",
                    "Password kam se kam 8 characters ka hona chahiye."
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage(
                    "setPasswordMessage",
                    "Dono passwords match nahi kar rahe."
                );
                return;
            }

            setLoading(setPasswordForm, true);

            try {
                const result = await apiRequest("/set-password", {
                    token,
                    password: newPassword
                });

                showMessage(
                    "setPasswordMessage",
                    result.message ||
                    "Password successfully set ho gaya.",
                    "success"
                );

                setPasswordForm.reset();
            } catch (error) {
                showMessage("setPasswordMessage", error.message);
            } finally {
                setLoading(setPasswordForm, false);
            }
        });
    }

    // ======================================
    // FORGOT PASSWORD
    // ======================================

    const forgotForm = document.getElementById("forgotForm");

    if (forgotForm) {
        forgotForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessages();

            const email =
                document.getElementById("forgotEmail")?.value.trim() || "";

            if (!email) {
                showMessage(
                    "forgotMessage",
                    "Apna email address enter karo."
                );
                return;
            }

            setLoading(forgotForm, true);

            try {
                const result = await apiRequest("/forgot-password", {
                    email
                });

                showMessage(
                    "forgotMessage",
                    result.message ||
                    "Agar account eligible hai, to password reset instructions email par bhej di jayengi.",
                    "success"
                );

                forgotForm.reset();
            } catch (error) {
                showMessage("forgotMessage", error.message);
            } finally {
                setLoading(forgotForm, false);
            }
        });
    }

    // ======================================
    // INITIAL SECTION
    // ======================================

    showSection("loginSection");
});
