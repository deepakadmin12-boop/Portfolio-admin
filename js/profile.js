
/* =========================================
   KEWADEV ADMIN - PROFILE JAVASCRIPT
   File: js/profile.js
========================================= */

"use strict";


/* ---------- STORAGE KEYS ---------- */

const PROFILE_STORAGE_KEY = "kewadev_admin_profile";
const THEME_STORAGE_KEY = "kewadev_admin_theme";


/* ---------- DOM ELEMENTS ---------- */

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


/* ---------- DEFAULT PROFILE ---------- */

const defaultProfile = {
    name: "Admin User",
    username: "admin",
    email: "admin@example.com",
    phone: "",
    website: "",
    bio: "",
    photo: "",
    updatedAt: ""
};

let currentPhotoData = "";


/* ---------- SAFE STORAGE HELPERS ---------- */

function readProfile() {
    try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);

        if (!saved) {
            return { ...defaultProfile };
        }

        const parsed = JSON.parse(saved);

        if (!parsed || typeof parsed !== "object") {
            return { ...defaultProfile };
        }

        return {
            ...defaultProfile,
            ...parsed
        };

    } catch (error) {
        console.error("Could not read profile:", error);
        return { ...defaultProfile };
    }
}


function writeProfile(profile) {
    try {
        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(profile)
        );

        return true;

    } catch (error) {
        console.error("Could not save profile:", error);
        showMessage(
            "Profile save nahi hua. Browser storage full ho sakta hai.",
            "error"
        );

        return false;
    }
}


/* ---------- NOTIFICATION ---------- */

let messageTimeout;

function showMessage(message, type = "success") {
    if (!profileMessage) return;

    clearTimeout(messageTimeout);

    profileMessage.textContent = message;
    profileMessage.className = "profile-message " + type;
    profileMessage.hidden = false;

    messageTimeout = setTimeout(() => {
        profileMessage.hidden = true;
    }, 3500);
}


/* ---------- AVATAR HELPERS ---------- */

function getInitial(name) {
    const cleanName = String(name || "").trim();

    return cleanName ? cleanName.charAt(0).toUpperCase() : "D";
}


function renderAvatar(element, name, photo = "") {
    if (!element) return;

    element.replaceChildren();

    if (photo) {
        const image = document.createElement("img");

        image.src = photo;
        image.alt = "Profile photo";

        image.addEventListener("error", () => {
            element.textContent = getInitial(name);
        }, { once: true });

        element.appendChild(image);

    } else {
        element.textContent = getInitial(name);
    }
}


/* ---------- RENDER PROFILE ---------- */

function renderProfile(profile = readProfile()) {
    if (profileName) {
        profileName.value = profile.name;
    }

    if (profileUsername) {
        profileUsername.value = profile.username;
    }

    if (profileEmail) {
        profileEmail.value = profile.email;
    }

    if (profilePhone) {
        profilePhone.value = profile.phone;
    }

    if (profileWebsite) {
        profileWebsite.value = profile.website;
    }

    if (profileBio) {
        profileBio.value = profile.bio;
    }

    currentPhotoData = profile.photo || "";

    renderAvatar(
        profileAvatar,
        profile.name,
        currentPhotoData
    );

    renderAvatar(
        uploadAvatarPreview,
        profile.name,
        currentPhotoData
    );

    renderAvatar(
        sidebarAvatar,
        profile.name,
        currentPhotoData
    );

    if (profileDisplayName) {
        profileDisplayName.textContent =
            profile.name || "Admin User";
    }

    if (profileDisplayEmail) {
        profileDisplayEmail.textContent =
            profile.email || "admin@example.com";
    }

    if (sidebarName) {
        sidebarName.textContent =
            profile.name || "Admin";
    }

    if (profileLastUpdated) {
        profileLastUpdated.textContent =
            profile.updatedAt || "Not available";
    }

    updateBioCount();
}


/* ---------- COLLECT FORM DATA ---------- */

function collectProfileData() {
    const oldProfile = readProfile();

    return {
        name: profileName.value.trim(),
        username: profileUsername.value.trim(),
        email: profileEmail.value.trim(),
        phone: profilePhone.value.trim(),
        website: profileWebsite.value.trim(),
        bio: profileBio.value.trim(),
        photo: currentPhotoData,
        updatedAt: new Date().toLocaleString(),
        createdAt: oldProfile.createdAt || ""
    };
}


/* ---------- SAVE PROFILE ---------- */

if (profileForm) {
    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!profileForm.reportValidity()) {
            return;
        }

        const profile = collectProfileData();

        if (!profile.name || !profile.username || !profile.email) {
            showMessage(
                "Name, username aur email bharna zaroori hai.",
                "error"
            );
            return;
        }

        if (profile.website) {
            try {
                const websiteURL = new URL(profile.website);

                if (
                    websiteURL.protocol !== "https:" &&
                    websiteURL.protocol !== "http:"
                ) {
                    throw new Error("Invalid protocol");
                }

            } catch (error) {
                showMessage(
                    "Valid website URL enter karo.",
                    "error"
                );

                profileWebsite.focus();
                return;
            }
        }

        if (writeProfile(profile)) {
            renderProfile(profile);

            showMessage(
                "Profile successfully save ho gayi!",
                "success"
            );
        }
    });
}


/* ---------- RESET PROFILE FORM ---------- */

if (profileForm) {
    profileForm.addEventListener("reset", function () {
        setTimeout(() => {
            renderProfile(readProfile());
        }, 0);
    });
}


/* ---------- BIO CHARACTER COUNT ---------- */

function updateBioCount() {
    if (!profileBio || !bioCharacterCount) return;

    bioCharacterCount.textContent =
        String(profileBio.value.length);
}


if (profileBio) {
    profileBio.addEventListener("input", updateBioCount);
}


/* ---------- PHOTO PREVIEW ---------- */

if (profilePhoto) {
    profilePhoto.addEventListener("change", function () {
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

        const reader = new FileReader();

        reader.onload = function () {
            if (typeof reader.result !== "string") {
                showMessage("Photo read nahi ho paayi.", "error");
                return;
            }

            currentPhotoData = reader.result;

            const name = profileName?.value.trim() || "Admin";

            renderAvatar(profileAvatar, name, currentPhotoData);
            renderAvatar(uploadAvatarPreview, name, currentPhotoData);
            renderAvatar(sidebarAvatar, name, currentPhotoData);

            showMessage(
                "Photo preview ready hai. Save Changes dabana mat bhoolna.",
                "success"
            );
        };

        reader.onerror = function () {
            showMessage("Photo read nahi ho paayi.", "error");
        };

        reader.readAsDataURL(file);
    });
}


/* ---------- REMOVE PROFILE PHOTO ---------- */

if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", function () {
        currentPhotoData = "";

        if (profilePhoto) {
            profilePhoto.value = "";
        }

        const name = profileName?.value.trim() || "Admin";

        renderAvatar(profileAvatar, name);
        renderAvatar(uploadAvatarPreview, name);
        renderAvatar(sidebarAvatar, name);

        showMessage(
            "Photo remove preview ho gayi. Save Changes dabakar confirm karo.",
            "success"
        );
    });
}


/* ---------- UPDATE AVATAR INITIAL LIVE ---------- */

if (profileName) {
    profileName.addEventListener("input", function () {
        if (currentPhotoData) return;

        const name = profileName.value.trim() || "Admin";

        renderAvatar(profileAvatar, name);
        renderAvatar(uploadAvatarPreview, name);
        renderAvatar(sidebarAvatar, name);
    });
}


/* ---------- PASSWORD VISIBILITY ---------- */

document.querySelectorAll("[data-password-target]").forEach(
    function (button) {
        button.addEventListener("click", function () {
            const targetId = button.dataset.passwordTarget;
            const input = document.getElementById(targetId);

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


/* ---------- PASSWORD FORM VALIDATION ---------- */

/*
   IMPORTANT:
   Frontend-only JavaScript cannot securely change an
   authenticated account password.

   Do not save passwords in localStorage.
   Real password changes require a backend/auth provider.
*/

if (passwordForm) {
    passwordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!passwordForm.reportValidity()) {
            return;
        }

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!currentPassword) {
            showMessage(
                "Current password enter karo.",
                "error"
            );
            return;
        }

        if (newPassword.length < 8) {
            showMessage(
                "New password kam se kam 8 characters ka hona chahiye.",
                "error"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(
                "New password aur confirm password match nahi karte.",
                "error"
            );

            document.getElementById("confirmPassword").focus();
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(
                "Naya password current password se alag rakho.",
                "error"
            );
            return;
        }

        showMessage(
            "Password form validate ho gaya, lekin real password change ke liye backend/authentication connect karna hoga.",
            "error"
        );
    });
}


/* ---------- PASSWORD FORM RESET ---------- */

if (passwordForm) {
    passwordForm.addEventListener("reset", function () {
        setTimeout(() => {
            passwordForm.querySelectorAll(
                ".password-toggle"
            ).forEach(function (button) {
                button.textContent = "Show";
                button.setAttribute("aria-label", "Show password");
            });
        }, 0);
    });
}


/* ---------- THEME ---------- */

function applyTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-theme", isLight);

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
        theme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch (error) {
        console.warn("Theme preference unavailable.");
    }

    applyTheme(theme);
}


if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        const isLight =
            document.body.classList.contains("light-theme");

        const newTheme = isLight ? "dark" : "light";

        applyTheme(newTheme);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.warn("Could not save theme preference.");
        }
    });
}


/* ---------- MOBILE SIDEBAR ---------- */

let sidebarOverlay = null;


function createSidebarOverlay() {
    if (!sidebar || sidebarOverlay) return;

    sidebarOverlay = document.createElement("div");
    sidebarOverlay.className = "sidebar-overlay";

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.body.appendChild(sidebarOverlay);
}


function openSidebar() {
    if (!sidebar) return;

    createSidebarOverlay();

    sidebar.classList.add("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
    }
}


function closeSidebar() {
    if (!sidebar) return;

    sidebar.classList.remove("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }
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
    logoutBtn.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Kya tum login page par wapas jaana chahte ho?"
        );

        if (!confirmed) return;

        window.location.href = "../login.html";
    });
}


/* ---------- FOOTER YEAR ---------- */

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* ---------- INITIALIZE ---------- */

renderProfile();
loadTheme();

console.log("KEWADEV Profile JS loaded successfully.");
