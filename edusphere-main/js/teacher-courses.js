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

function getCourses() {
    const data = localStorage.getItem("courses");
    return data ? JSON.parse(data) : [];
}

// ================================
// ELEMENTS
// ================================

const courseTable = document.getElementById("courseTable");
const searchCourse = document.getElementById("searchCourse");

const user = getLoggedInUser();

// ================================
// RENDER TABLE
// ================================

function loadCourseTable() {
    const courses = getCourses();
    courseTable.innerHTML = "";

    const myCourses = courses.filter(function(c) {
        return c.teacherEmail && c.teacherEmail === user.email;
    });

    if (myCourses.length === 0) {
        courseTable.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#6b7280;">No courses assigned to you yet. Ask admin to assign courses.</td></tr>';
        return;
    }

    myCourses.forEach(function(course) {
        const row = document.createElement("tr");
        const enrolledClasses = course.enrolledClasses ? course.enrolledClasses.join(", ") : "None";
        row.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${enrolledClasses}</td>
            <td>${course.department}</td>
            <td>${course.credits}</td>
            <td>${course.semester}</td>
            <td>${course.students ? course.students.length : 0} Students</td>
        `;
        courseTable.appendChild(row);
    });
}

// ================================
// SEARCH
// ================================

searchCourse.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    courseTable.querySelectorAll("tr").forEach(function(row) {
        const code = row.cells[0] ? row.cells[0].textContent.toLowerCase() : "";
        const name = row.cells[1] ? row.cells[1].textContent.toLowerCase() : "";
        const dept = row.cells[3] ? row.cells[3].textContent.toLowerCase() : "";
        row.style.display = (code.includes(value) || name.includes(value) || dept.includes(value)) ? "" : "none";
    });
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

loadCourseTable();
