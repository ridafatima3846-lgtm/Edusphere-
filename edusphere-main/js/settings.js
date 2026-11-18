// ================================
// PROFILE FORM
// ================================

const profileForm = document.getElementById("profileForm");

// Load saved profile
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    if (profile.name) document.getElementById("profileName").value = profile.name;
    if (profile.email) document.getElementById("profileEmail").value = profile.email;
    if (profile.phone) document.getElementById("profilePhone").value = profile.phone;
}

profileForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const profile = {
        name: document.getElementById("profileName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        phone: document.getElementById("profilePhone").value.trim()
    };

    localStorage.setItem("profile", JSON.stringify(profile));
    alert("Profile Saved Successfully!");
});

loadProfile();

// ================================
// CHANGE PASSWORD
// ================================

const passwordForm = document.getElementById("passwordForm");

passwordForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;

    if (newPass.length < 6) {
        alert("New password must be at least 6 characters!");
        return;
    }

    if (newPass !== confirm) {
        alert("New password and confirm password do not match!");
        return;
    }

    const savedPassword = localStorage.getItem("adminPassword") || "admin123";

    if (current !== savedPassword) {
        alert("Current password is incorrect!");
        return;
    }

    localStorage.setItem("adminPassword", newPass);
    passwordForm.reset();
    alert("Password Updated Successfully!");
});

// ================================
// CLEAR ALL DATA
// ================================

document.getElementById("clearDataBtn").addEventListener("click", function() {
    if (confirm("Are you sure you want to clear ALL data? This cannot be undone!")) {
        if (confirm("This will delete all students, teachers, courses, results, assignments, and announcements. Continue?")) {
            localStorage.removeItem("students");
            localStorage.removeItem("teachers");
            localStorage.removeItem("courses");
            localStorage.removeItem("results");
            localStorage.removeItem("assignments");
            localStorage.removeItem("announcements");
            localStorage.removeItem("profile");
            alert("All data has been cleared!");
        }
    }
});

// ================================
// LOGOUT
// ================================

document.getElementById("logoutBtn").addEventListener("click", function() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "login.html";
    }
});
