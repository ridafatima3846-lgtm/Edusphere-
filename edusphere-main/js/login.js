// ==========================
// SHOW / HIDE PASSWORD
// ==========================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";
        togglePassword.classList.remove("fa-eye");
        togglePassword.classList.add("fa-eye-slash");

    } else {

        password.type = "password";
        togglePassword.classList.remove("fa-eye-slash");
        togglePassword.classList.add("fa-eye");

    }

});

// ==========================
// LOCAL STORAGE HELPERS
// ==========================

function getUsers() {
    const data = localStorage.getItem("users");
    return data ? JSON.parse(data) : [];
}

function getTeachers() {
    const data = localStorage.getItem("teachers");
    return data ? JSON.parse(data) : [];
}

// ==========================
// ADMIN CREDENTIALS
// (Change these to your university admin credentials)
// ==========================

const ADMIN_EMAIL = "admin@edusphere.com";
const ADMIN_PASSWORD = "admin123";

// ==========================
// LOGIN FORM VALIDATION
// ==========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const passwordValue = document.getElementById("password").value.trim();
        const roleSelect = document.getElementById("loginRole");
        const role = roleSelect ? roleSelect.value : "";

        console.log("Email:", email);
        console.log("Password:", passwordValue);
        console.log("Role:", role);

        if (email === "" || passwordValue === "") {

            alert("Please fill in all fields.");
            return;

        }

        if (!email.includes("@")) {

            alert("Please enter a valid email address.");
            return;

        }

        if (passwordValue.length < 6) {

            alert("Password must be at least 6 characters.");
            return;

        }

        if (role === "" || role === undefined) {

            alert("Please select your role.");
            return;

        }

        // ==================
        // ADMIN LOGIN (Hardcoded - Only specific admin can login)
        // ==================

        if (role === "admin") {

            if (email === ADMIN_EMAIL && passwordValue === ADMIN_PASSWORD) {

                localStorage.setItem("loggedInUser", JSON.stringify({
                    name: "Admin",
                    email: email,
                    role: "admin"
                }));

                alert("Admin Login Successful!");
                window.location.href = "admin-dashboard.html";
                return;

            } else {

                alert("Invalid admin credentials. Only authorized admin can login.");
                return;

            }

        }

        // ==================
        // TEACHER / STUDENT LOGIN
        // ==================

        const users = getUsers();
        const user = users.find(function(u) {
            return u.email === email && u.password === passwordValue && u.role === role;
        });

        if (user) {

            localStorage.setItem("loggedInUser", JSON.stringify({
                name: user.name,
                email: user.email,
                role: user.role
            }));

            alert("Login Successful!");

            if (user.role === "teacher") {
                window.location.href = "teacher-dashboard.html";
            } else {
                window.location.href = "student-dashboard.html";
            }

            return;

        }

        // Check if teacher exists in teachers table (added by admin)
        if (role === "teacher") {
            const teachers = getTeachers();
            const teacher = teachers.find(function(t) {
                return t.email === email;
            });

            if (teacher) {

                localStorage.setItem("loggedInUser", JSON.stringify({
                    name: teacher.name,
                    email: teacher.email,
                    role: "teacher",
                    id: teacher.id
                }));

                alert("Teacher Login Successful!");
                window.location.href = "teacher-dashboard.html";
                return;

            }
        }

        alert("Invalid email or password. Please register first.");

    });

}