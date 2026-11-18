// ================================
// GET LOGGED IN USER
// ================================

function getLoggedInUser() {
    const data = localStorage.getItem("loggedInUser");
    return data ? JSON.parse(data) : null;
}

// ================================
// LOCAL STORAGE HELPERS
// ================================

function getUsers() {
    const data = localStorage.getItem("users");
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// ================================
// ELEMENTS
// ================================

const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

// ================================
// LOAD PROFILE
// ================================

const user = getLoggedInUser();

if (user) {
    document.getElementById("profileName").value = user.name || "";
    document.getElementById("profileEmail").value = user.email || "";
}

// ================================
// SAVE PROFILE
// ================================

profileForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();
    
    if (name === "" || email === "") {
        alert("Name and email are required.");
        return;
    }
    
    if (!email.includes("@")) {
        alert("Please enter a valid email address.");
        return;
    }
    
    // Update users table
    const users = getUsers();
    const userIndex = users.findIndex(function(u) {
        return u.email === user.email;
    });
    
    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].email = email;
        users[userIndex].phone = phone;
        saveUsers(users);
    }
    
    // Update logged in user
    const updatedUser = {
        name: name,
        email: email,
        role: user.role
    };
    
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    
    alert("Profile updated successfully!");
});

// ================================
// CHANGE PASSWORD
// ================================

passwordForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;
    
    if (currentPassword === "" || newPassword === "" || confirmNewPassword === "") {
        alert("Please fill all fields.");
        return;
    }
    
    if (newPassword.length < 8) {
        alert("New password must be at least 8 characters.");
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        alert("New passwords do not match.");
        return;
    }
    
    // Check current password
    const users = getUsers();
    const userObj = users.find(function(u) {
        return u.email === user.email;
    });
    
    if (userObj && userObj.password !== currentPassword) {
        alert("Current password is incorrect.");
        return;
    }
    
    // Update password
    if (userObj) {
        userObj.password = newPassword;
        saveUsers(users);
    }
    
    alert("Password updated successfully!");
    passwordForm.reset();
});

// ================================
// LOGOUT
// ================================

document.getElementById("logoutBtn").addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.removeItem("loggedInUser");
    alert("Logged out successfully!");
    window.location.href = "login.html";
});
