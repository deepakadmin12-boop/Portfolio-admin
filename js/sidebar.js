
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("adminSidebar");
    const menuToggle = document.getElementById("menuToggle");

    if (!sidebar || !menuToggle) {
        console.warn("Sidebar elements were not found on this page.");
        return;
    }

    let overlay = document.querySelector(".sidebar-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
    }

    function setSidebar(open) {
        sidebar.classList.toggle("open", open);
        overlay.classList.toggle("active", open);

        menuToggle.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("sidebar-open", open);
    }

    menuToggle.addEventListener("click", function () {
        const isOpen = sidebar.classList.contains("open");
        setSidebar(!isOpen);
    });

    overlay.addEventListener("click", function () {
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

    // Close sidebar automatically on larger screens.
    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            setSidebar(false);
        }
    });

    console.log("KEWA sidebar initialized.");

});
