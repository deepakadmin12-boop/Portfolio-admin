
/* =========================================
   KEWADEV ADMIN - PROFILE JAVASCRIPT
   File: js/profile.js
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // ======================================
    // CONFIGURATION
    // ======================================

    const API_BASE_URL = "https://backend-port-wr91.onrender.com";
    const PROFILE_API = `${API_BASE_URL}/api/profile`;
    const AUTH_API = `${API_BASE_URL}/api/auth`;
    const THEME_STORAGE_KEY = "kewadev_admin_theme";

    // ======================================
    // DOM ELEMENTS
    // ======================================

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const themeToggle = document.getElementById("themeToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileEmail = document.getElementById("profileEmail");
    const profilePhone = document.getElementById("profilePhone");
    const profileWebsite = document.getElementById("profileWebsite");
    const profileBio = document.getElementById("profileBio");

    const profilePhoto = document.getElementById("profilePhoto");
    const removePhotoBtn = document.getElementById("removePhotoBtn");

    const profileAvatar = document.getElementById("profileAvatar");
    const uploadAvatarPreview = document.getElementById(
        "uploadAvatarPreview"
    );
    const sidebarAvatar = document.getElementById("sidebarAvatar");

    const profileDisplayName = document.getElementById(
        "profileDisplayName"
    );
    const profileDisplayEmail = document.getElementById(
        "profileDisplayEmail"
    );
    const sidebarName = document.getElementById("sidebarName");

    const profileLastUpdated = document.getElementById(
        "profileLastUpdated"
    );
    const bioCharacterCount = document.getElementById(
        "bioCharacterCount"
    );

    const profileMessage = document.getElementById("profileMessage");
    const currentYear = document.getElementById("currentYear");

    // ======================================
    // DEFAULT PROFILE
    // ======================================

    const defaultProfile = {
        name: "",
        username: "",
        email: "",
        phone: "",
        website: "",
        bio: "",
        photo: "",
        updatedAt: ""
    };

    let currentProfile = { ...defaultProfile };
    let currentPhotoURL = "";
    let pendingPhotoFile = null;
    let photoRemoved = false;
    let messageTimeout = null;
    let previewObjectURL = null;
    let sidebarOverlay = null;

    // ======================================
    // API HELPER
    // ======================================

    async function apiRequest(url, options = {}) {
        const headers = {
            ...(options.headers || {})
        };

        // FormData ke liye Content-Type manually set nahi karna.
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers,
                credentials: "include"
            });
        } catch (error) {
            throw new Error(
                "Backend se connection nahi ho raha. Server check karo."
            );
        }

        let result = null;

        if (response.status !== 204) {
            const contentType =
                response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (_) {
                    result = null;
                }
            } else {
                const text = await response.text();
                result = text ? { message: text } : null;
            }
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                `Request fail hua (${response.status}).`
            );
        }

        return result;
    }

    // ======================================
    // MESSAGE
    // ======================================

    function showMessage(message, type = "success") {
        if (!profileMessage) {
            console.log(message);
            return;
        }

        clearTimeout(messageTimeout);

        profileMessage.textContent = message;
        profileMessage.className = `profile-message ${type}`;
        profileMessage.hidden = false;

        messageTimeout = setTimeout(() => {
            profileMessage.hidden = true;
        }, 4000);
    }

    // ======================================
    // FORM LOADING
    // ======================================

    function setFormLoading(form, loading) {
        if (!form) return;

        const button = form.querySelector('[type="submit"]');

        if (!button) return;

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

    // ======================================
    // AVATAR HELPERS
    // ======================================

    function getInitial(name) {
        const cleanName = String(name || "").trim();

        return cleanName
            ? cleanName.charAt(0).toUpperCase()
            : "A";
    }

    function renderAvatar(element, name, photo = "") {
        if (!element) return;

        element.replaceChildren();

        if (!photo) {
            element.textContent = getInitial(name);
            return;
        }

        const image = document.createElement("img");

        image.src = photo;
        image.alt = "Profile photo";

        image.addEventListener("error", () => {
            element.replaceChildren();
            element.textContent = getInitial(name);
        }, { once: true });

        element.appendChild(image);
    }

    function renderAllAvatars(name, photo = "") {
        renderAvatar(profileAvatar, name, photo);
        renderAvatar(uploadAvatarPreview, name, photo);
        renderAvatar(sidebarAvatar, name, photo);
    }

    // ======================================
    // BIO CHARACTER COUNT
    // ======================================

    function updateBioCount() {
        if (!profileBio || !bioCharacterCount) return;

        bioCharacterCount.textContent = String(
            profileBio.value.length
        );
    }

    if (profileBio) {
        profileBio.addEventListener("input", updateBioCount);
    }

    // ======================================
    // RENDER PROFILE
    // ======================================

    function renderProfile(profile = currentProfile) {
        if (profileName) {
            profileName.value = profile.name || "";
        }

        if (profileUsername) {
            profileUsername.value = profile.username || "";
        }

        if (profileEmail) {
            profileEmail.value = profile.email || "";
        }

        if (profilePhone) {
            profilePhone.value = profile.phone || "";
        }

        if (profileWebsite) {
            profileWebsite.value = profile.website || "";
        }

        if (profileBio) {
            profileBio.value = profile.bio || "";
        }

        currentPhotoURL = profile.photo || "";

        renderAllAvatars(
            profile.name || "Admin",
            currentPhotoURL
        );

        if (profileDisplayName) {
            profileDisplayName.textContent =
                profile.name || "Admin User";
        }

        if (profileDisplayEmail) {
            profileDisplayEmail.textContent =
                profile.email || "";
        }

        if (sidebarName) {
            sidebarName.textContent = profile.name || "Admin";
        }

        if (profileLastUpdated) {
            profileLastUpdated.textContent =
                profile.updatedAt || "Not available";
        }

        updateBioCount();
    }

    // ======================================
    // LOAD PROFILE FROM BACKEND
    // ======================================

    async function loadProfile() {
        if (profileForm) {
            profileForm.querySelectorAll("input, textarea, button")
                .forEach((element) => {
                    if (element.type !== "reset") {
                        element.disabled = true;
                    }
                });
        }

        try {
            const result = await apiRequest(PROFILE_API);

            const profileData = result?.profile || result;

            if (!profileData || typeof profileData !== "object") {
                throw new Error("Backend se profile data nahi mila.");
            }

            currentProfile = {
                ...defaultProfile,
                ...profileData
            };

            currentPhotoURL = currentProfile.photo || "";

            renderProfile(currentProfile);
        } catch (error) {
            console.error("Load profile error:", error);

            showMessage(
                `Profile load nahi hui: ${error.message}`,
                "error"
            );
        } finally {
            if (profileForm) {
                profileForm.querySelectorAll(
                    "input, textarea, button"
                ).forEach((element) => {
                    if (element.type !== "reset") {
                        element.disabled = false;
                    }
                });
            }
        }
    }

    // ======================================
    // COLLECT PROFILE DATA
    // ======================================

    function collectProfileData() {
        return {
            name: profileName?.value.trim() || "",
            username: profileUsername?.value.trim() || "",
            email: profileEmail?.value.trim() || "",
            phone: profilePhone?.value.trim() || "",
            website: profileWebsite?.value.trim() || "",
            bio: profileBio?.value.trim() || ""
        };
    }

    // ======================================
    // VALIDATE PROFILE
    // ======================================

    function validateProfile(profile) {
        if (!profile.name || !profile.username || !profile.email) {
            showMessage(
                "Name, username aur email bharna zaroori hai.",
                "error"
            );
            return false;
        }

        if (
            profileEmail &&
            !profileEmail.validity.valid
        ) {
            showMessage("Valid email address enter karo.", "error");
            profileEmail.focus();
            return false;
        }

        if (profile.website) {
            try {
                const url = new URL(profile.website);

                if (
                    url.protocol !== "https:" &&
                    url.protocol !== "http:"
                ) {
                    throw new Error("Invalid protocol");
                }
            } catch (_) {
                showMessage(
                    "Valid website URL enter karo.",
                    "error"
                );

                profileWebsite?.focus();
                return false;
            }
        }

        return true;
    }

    // ======================================
    // UPLOAD PROFILE PHOTO
    // ======================================

    async function uploadPhoto(file) {
        const formData = new FormData();

        formData.append("photo", file);

        const result = await apiRequest(
            `${PROFILE_API}/photo`,
            {
                method: "POST",
                body: formData
            }
        );

        const photoURL =
            result?.photo ||
            result?.photoUrl ||
            result?.url;

        if (!photoURL) {
            throw new Error(
                "Photo upload response mein photo URL nahi mila."
            );
        }

        return photoURL;
    }

    // ======================================
    // REMOVE PHOTO ON SERVER
    // ======================================

    async function removePhotoOnServer() {
        await apiRequest(`${PROFILE_API}/photo`, {
            method: "DELETE"
        });
    }

    // ======================================
    // SAVE PROFILE TO BACKEND
    // ======================================

    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!profileForm.reportValidity()) return;

            const profile = collectProfileData();

            if (!validateProfile(profile)) return;

            setFormLoading(profileForm, true);

            try {
                let photoURL = currentPhotoURL;

                // Remove existing photo on server if requested.
                if (photoRemoved) {
                    await removePhotoOnServer();
                    photoURL = "";
                }

                // Upload newly selected photo.
                if (pendingPhotoFile) {
                    photoURL = await uploadPhoto(pendingPhotoFile);
                }

                const result = await apiRequest(PROFILE_API, {
                    method: "PUT",
                    body: JSON.stringify({
                        ...profile,
                        photo: photoURL
                    })
                });

                const savedProfile = result?.profile || result;

                currentProfile = {
                    ...profile,
                    photo: savedProfile?.photo ?? photoURL,
                    updatedAt:
                        savedProfile?.updatedAt ||
                        savedProfile?.updated_at ||
                        new Date().toLocaleString()
                };

                currentPhotoURL = currentProfile.photo || "";
                pendingPhotoFile = null;
                photoRemoved = false;

                if (profilePhoto) {
                    profilePhoto.value = "";
                }

                renderProfile(currentProfile);

                showMessage(
                    "Profile successfully backend par save ho gayi!",
                    "success"
                );
            } catch (error) {
                console.error("Save profile error:", error);

                showMessage(
                    `Profile save nahi hui: ${error.message}`,
                    "error"
                );
            } finally {
                setFormLoading(profileForm, false);
            }
        });
    }

    // ======================================
    // RESET PROFILE FORM
    // ======================================

    if (profileForm) {
        profileForm.addEventListener("reset", () => {
            setTimeout(() => {
                pendingPhotoFile = null;
                photoRemoved = false;

                if (profilePhoto) {
                    profilePhoto.value = "";
                }

                renderProfile(currentProfile);
            }, 0);
        });
    }

    // ======================================
    // PHOTO PREVIEW
    // ======================================

    if (profilePhoto) {
        profilePhoto.addEventListener("change", () => {
            const file = profilePhoto.files?.[0];

            if (!file) return;

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                showMessage(
                    "Sirf JPG, PNG ya WEBP image select karo.",
                    "error"
                );

                profilePhoto.value = "";
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                showMessage(
                    "Photo ka size 2 MB se kam hona chahiye.",
                    "error"
                );

                profilePhoto.value = "";
                return;
            }

            if (previewObjectURL) {
                URL.revokeObjectURL(previewObjectURL);
            }

            previewObjectURL = URL.createObjectURL(file);

            pendingPhotoFile = file;
            photoRemoved = false;

            renderAllAvatars(
                profileName?.value.trim() || "Admin",
                previewObjectURL
            );

            showMessage(
                "Photo preview ready hai. Save Changes dabao.",
                "success"
            );
        });
    }

    // ======================================
    // REMOVE PHOTO
    // ======================================

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener("click", () => {
            pendingPhotoFile = null;
            photoRemoved = Boolean(currentPhotoURL);

            if (profilePhoto) {
                profilePhoto.value = "";
            }

            if (previewObjectURL) {
                URL.revokeObjectURL(previewObjectURL);
                previewObjectURL = null;
            }

            renderAllAvatars(
                profileName?.value.trim() || "Admin",
                ""
            );

            showMessage(
                "Photo removal select ho gaya. Confirm karne ke liye Save Changes dabao.",
                "success"
            );
        });
    }

    // ======================================
    // LIVE AVATAR INITIAL
    // ======================================

    if (profileName) {
        profileName.addEventListener("input", () => {
            if (pendingPhotoFile || currentPhotoURL) return;

            renderAllAvatars(
                profileName.value.trim() || "Admin",
                ""
            );
        });
    }

    // ======================================
    // PASSWORD VISIBILITY
    // ======================================

    document.querySelectorAll("[data-password-target]").forEach(
        (button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById(
                    button.dataset.passwordTarget
                );

                if (!input) return;

                const showing = input.type === "text";

                input.type = showing ? "password" : "text";
                button.textContent = showing ? "Show" : "Hide";

                button.setAttribute(
                    "aria-label",
                    showing ? "Show password" : "Hide password"
                );
            });
        }
    );

    
    // ======================================
    // CHANGE PASSWORD THROUGH BACKEND
    // ======================================

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!passwordForm.reportValidity()) return;

            const currentPassword =
                document.getElementById("currentPassword")?.value || "";

            const newPassword =
                document.getElementById("newPassword")?.value || "";

            const confirmPassword =
                document.getElementById("confirmPassword")?.value || "";

            if (!currentPassword) {
                showMessage("Current password enter karo.", "error");
                return;
            }

            if (newPassword.length < 8) {
                showMessage(
                    "Naya password kam se kam 8 characters ka hona chahiye.",
                    "error"
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage(
                    "New password aur confirm password match nahi karte.",
                    "error"
                );
                return;
            }

            if (currentPassword === newPassword) {
                showMessage(
                    "Naya password current password se alag rakho.",
                    "error"
                );
                return;
            }

            setFormLoading(passwordForm, true);

            try {
                const result = await apiRequest(
                    `${AUTH_API}/change-password`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                    }
                );

                passwordForm.reset();

                passwordForm.querySelectorAll(
                    "[data-password-target]"
                ).forEach((button) => {
                    button.textContent = "Show";
                    button.setAttribute("aria-label", "Show password");
                });

                showMessage(
                    result?.message ||
                    "Password successfully change ho gaya.",
                    "success"
                );
            } catch (error) {
                console.error("Change password error:", error);

                showMessage(
                    `Password change nahi hua: ${error.message}`,
                    "error"
                );
            } finally {
                setFormLoading(passwordForm, false);
            }
        });
    }

    // ======================================
    // THEME
    // ======================================

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
            theme =
                localStorage.getItem(THEME_STORAGE_KEY) || "dark";
        } catch (_) {
            // Theme preference is optional.
        }

        applyTheme(theme);
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isLight =
                document.body.classList.contains("light-theme");

            const newTheme = isLight ? "dark" : "light";

            applyTheme(newTheme);

            try {
                localStorage.setItem(
                    THEME_STORAGE_KEY,
                    newTheme
                );
            } catch (_) {
                // Theme preference could not be persisted.
            }
        });
    }

    // ======================================
    // MOBILE SIDEBAR
    // ======================================

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }
    }

    function openSidebar() {
        if (!sidebar) return;

        if (!sidebarOverlay) {
            sidebarOverlay = document.createElement("div");
            sidebarOverlay.className = "sidebar-overlay";

            sidebarOverlay.addEventListener("click", closeSidebar);

            document.body.appendChild(sidebarOverlay);
        }

        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            if (sidebar?.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    window.addEventListener("resize", () => {
        if (window.innerWidth > 850) {
            closeSidebar();
        }
    });

    // ======================================
    // LOGOUT
    // ======================================

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (event) => {
            event.preventDefault();

            const confirmed = window.confirm(
                "Kya tum logout karna chahte ho?"
            );

            if (!confirmed) return;

            try {
                await apiRequest(`${AUTH_API}/logout`, {});
            } catch (error) {
                console.error("Logout request error:", error);
            }

            window.location.href = "../login.html";
        });
    }

    // ======================================
    // FOOTER YEAR
    // ======================================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // ======================================
    // INITIALIZE
    // ======================================

    loadTheme();
    loadProfile();

    console.log("KEWADEV Profile JS loaded.");
});
