(function () {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    } catch (e) {
        user = null;
    }
    const role = user && user.role ? String(user.role).toLowerCase() : "";
    if (role !== "admin") {
        const target = role === "teacher" ? "teacher-dashboard.html" : role === "student" ? "student-dashboard.html" : "login.html";
        window.location.replace(target);
    }
})();

// ================================
// SIDEBAR ACTIVE BASED ON PAGE
// ================================

function setActivePage() {
    const currentPage = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll(".sidebar ul li a");

    links.forEach(function(link) {
        const href = link.getAttribute("href");
        if (href === currentPage) {
            link.parentElement.classList.add("active");
        }
    });
}

setActivePage();

// ================================
// LOGOUT BUTTON
// ================================

const logoutBtn = document.querySelector(".logout-item");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
        e.preventDefault();
        localStorage.removeItem("loggedInUser");
        alert("Logged out successfully!");
        window.location.href = "login.html";
    });
}
