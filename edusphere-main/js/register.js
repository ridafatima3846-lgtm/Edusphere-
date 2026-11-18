// ================================
// SHOW / HIDE PASSWORD
// ================================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";

        this.classList.remove("fa-eye");
        this.classList.add("fa-eye-slash");

    } else {

        password.type = "password";

        this.classList.remove("fa-eye-slash");
        this.classList.add("fa-eye");

    }

});

// ================================
// SHOW / HIDE CONFIRM PASSWORD
// ================================

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPassword = document.getElementById("confirmPassword");

toggleConfirmPassword.addEventListener("click", function () {

    if (confirmPassword.type === "password") {

        confirmPassword.type = "text";

        this.classList.remove("fa-eye");
        this.classList.add("fa-eye-slash");

    } else {

        confirmPassword.type = "password";

        this.classList.remove("fa-eye-slash");
        this.classList.add("fa-eye");

    }

});

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
// REGISTER FORM VALIDATION
// ================================

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const role = document.getElementById("role").value;
    const passwordValue = document.getElementById("password").value;
    const confirmPasswordValue = document.getElementById("confirmPassword").value;

    if (
        fullName === "" ||
        email === "" ||
        phone === "" ||
        role === "" ||
        passwordValue === "" ||
        confirmPasswordValue === ""
    ) {

        alert("Please fill all fields.");
        return;

    }

    if (!email.includes("@")) {

        alert("Please enter a valid email address.");
        return;

    }

    if (phone.length < 11) {

        alert("Enter a valid phone number.");
        return;

    }

    if (passwordValue.length < 8) {

        alert("Password must be at least 8 characters.");
        return;

    }

    if (passwordValue !== confirmPasswordValue) {

        alert("Passwords do not match.");
        return;

    }

    // Check if email already exists
    const users = getUsers();
    const exists = users.find(function(u) {
        return u.email === email;
    });

    if (exists) {

        alert("Email already registered. Please login.");
        return;

    }

    // Save user
    const userObj = {
        name: fullName,
        email: email,
        phone: phone,
        role: role,
        password: passwordValue
    };

    users.push(userObj);
    saveUsers(users);

    alert("Registration Successful! You can now login.");

    registerForm.reset();

    // Redirect to login
    window.location.href = "login.html";

});