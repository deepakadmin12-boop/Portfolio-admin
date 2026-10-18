/* ========================================
   KEWADEV - ADMIN AUTHENTICATION UI
   File: js/login.js
======================================== */

document.addEventListener("DOMContentLoaded", () => {
    const sections = [
        "loginSection",
        "registerSection",
        "setPasswordSection",
        "forgotSection"
    ];

    // Current year in footer
    const year = document.getElementById("currentYear");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Switch between authentication sections
    function showSection(sectionId) {
        sections.forEach((id) => {
            const section = document.getElementById(id);

            if (section) {
                section.hidden = id !== sectionId;
            }
        });

        clearMessages();
    }

    // Clear status messages
    function clearMessages() {
        document.querySelectorAll(".login-message").forEach((message) => {
            message.textContent = "";
            message.hidden = true;
            message.classList.remove("success", "error");
        });
    }

    // Show a message
    function showMessage(elementId, message, type = "error") {
        const element = document.getElementById(elementId);

        if (!element) return;

        element.textContent = message;
        element.hidden = false;
        element.classList.remove("success", "error");
        element.classList.add(type);
    }

    // Links to switch forms
    document.querySelectorAll("[data-open]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const target = link.dataset.open;

            if (sections.includes(target)) {
                showSection(target);
            }
        });
    });

    // Show / hide password
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

    // Basic password confirmation validation
    const setPasswordForm = document.getElementById("setPasswordForm");

    if (setPasswordForm) {
        setPasswordForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const newPassword =
                document.getElementById("newPassword")?.value ?? "";

            const confirmPassword =
                document.getElementById("confirmPassword")?.value ?? "";

            const token =
                document.getElementById("setupToken")?.value.trim() ?? "";

            if (!token) {
                showMessage(
                    "setPasswordMessage",
                    "Valid password setup link se aaya token required hai."
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

            showMessage(
                "setPasswordMessage",
                "Validation successful. Password save karne ke liye backend connect karna hoga.",
                "success"
            );
        });
    }

    // Form submit handlers
    // These validate input only; they do NOT authenticate users.
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            showMessage(
                "loginMessage",
                "Login system abhi backend se connect nahi hai. Authentication API connect karni hogi."
            );
        });
    }

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const name =
                document.getElementById("registerName")?.value.trim() ?? "";
            const email =
                document.getElementById("registerEmail")?.value.trim() ?? "";
            const inviteCode =
                document.getElementById("inviteCode")?.value.trim() ?? "";
            const newPassword =
                document.getElementById("registerPassword")?.value ?? "";

            if (!name || !email || !inviteCode || !newPassword) {
                showMessage(
                    "registerMessage",
                    "Saari fields fill karo."
                );
                return;
            }

            if (newPassword.length < 8) {
                showMessage(
                    "registerMessage",
                    "Password kam se kam 8 characters ka hona chahiye."
                );
                return;
            }

            showMessage(
                "registerMessage",
                "Details valid hain. Owner invite verification aur account creation ke liye backend zaroori hai.",
                "success"
            );
        });
    }

    const forgotForm = document.getElementById("forgotForm");

    if (forgotForm) {
        forgotForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const email =
                document.getElementById("forgotEmail")?.value.trim() ?? "";

            if (!email) {
                showMessage(
                    "forgotMessage",
                    "Apna email address enter karo."
                );
                return;
            }

            showMessage(
                "forgotMessage",
                "Password reset email bhejne ke liye backend aur email service connect karni hogi."
            );
        });
    }

    // Ensure only the login section is visible initially
    showSection("loginSection");
});