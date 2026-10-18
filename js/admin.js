/* =========================================
   KEWA ADMIN — COMMON JAVASCRIPT
   File: admin/js/admin.js
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menu-toggle");

    // Create mobile overlay automatically
    let overlay = document.querySelector(".sidebar-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        overlay.setAttribute("aria-hidden", "true");

        document.body.appendChild(overlay);
    }

    // Open sidebar
    function openSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("active");
        overlay.classList.add("active");

        document.body.classList.add("sidebar-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close menu");
        }
    }

    // Close sidebar
    function closeSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("active");
        overlay.classList.remove("active");

        document.body.classList.remove("sidebar-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open menu");
        }
    }

    // Toggle hamburger menu
    if (menuToggle && sidebar) {
        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.addEventListener("click", function (event) {
            event.preventDefault();

            if (sidebar.classList.contains("active")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close menu when overlay is clicked
    overlay.addEventListener("click", closeSidebar);

    // Close menu with Escape key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // Close mobile menu after selecting a navigation link
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when switching to desktop layout
    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Logout handling
    document.querySelectorAll("[data-logout]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            const confirmed = window.confirm(
                "Are you sure you want to logout?"
            );

            if (!confirmed) return;

            // Clear the demo login session
            // Production authentication needs server-side logout.
            try {
                sessionStorage.removeItem("kewaAdminLoggedIn");
            } catch (error) {
                console.warn("Session cleanup was unavailable.");
            }

            window.location.href = "login.html";
        });
    });

    // Mark current page in sidebar automatically
    const currentPage = window.location.pathname
        .split("/")
        .pop() || "index.html";

    document.querySelectorAll(".sidebar .nav-link[href]").forEach(function (link) {
        const linkPage = link.getAttribute("href").split("/").pop();

        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});