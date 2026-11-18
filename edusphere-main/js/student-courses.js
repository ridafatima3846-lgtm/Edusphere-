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

// ================================
// GET STUDENT EMAIL
// ================================

const user = getLoggedInUser();
const studentEmail = user ? user.email : null;

// ================================
// RENDER TABLE
// ================================

function loadCourseTable() {
    
    const courses = getCourses();
    courseTable.innerHTML = "";
    
    // Get courses where student is enrolled
    const myCourses = courses.filter(function(c) {
        return c.students && c.students.includes(studentEmail);
    });
    
    if (myCourses.length === 0) {
        courseTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">No courses enrolled yet.</td></tr>';
        return;
    }
    
    myCourses.forEach(function(course) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.teacher || 'Not Assigned'}</td>
            <td>${course.department}</td>
            <td>${course.credits}</td>
            <td>${course.semester}</td>
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
        const teacher = row.cells[2] ? row.cells[2].textContent.toLowerCase() : "";
        row.style.display = (code.includes(value) || name.includes(value) || teacher.includes(value)) ? "" : "none";
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

// ================================
// LOAD ON START
// ================================

loadCourseTable();
