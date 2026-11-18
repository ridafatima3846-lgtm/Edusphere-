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

function getStudents() {
    const data = localStorage.getItem("students");
    return data ? JSON.parse(data) : [];
}

// ================================
// ELEMENTS
// ================================

const studentTable = document.getElementById("studentTable");
const searchStudent = document.getElementById("searchStudent");

const user = getLoggedInUser();

// ================================
// RENDER TABLE
// ================================

function loadStudentTable() {
    const courses = getCourses();
    const students = getStudents();
    studentTable.innerHTML = "";

    const myCourses = courses.filter(function(c) {
        return c.teacherEmail && c.teacherEmail === user.email;
    });

    if (myCourses.length === 0) {
        studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">No courses assigned to you yet. Ask admin to assign courses.</td></tr>';
        return;
    }

    const myStudentEmails = new Set();
    myCourses.forEach(function(course) {
        if (course.students) {
            course.students.forEach(function(email) {
                myStudentEmails.add(email);
            });
        }
    });

    const myStudents = students.filter(function(s) {
        return myStudentEmails.has(s.email);
    });

    if (myStudents.length === 0) {
        studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">No students enrolled in your courses yet. Ask admin to enroll classes.</td></tr>';
        return;
    }

    myStudents.forEach(function(student) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.rollNo}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.className || '-'}</td>
            <td>${student.department}</td>
            <td>${student.semester}</td>
        `;
        studentTable.appendChild(row);
    });
}

// ================================
// SEARCH
// ================================

searchStudent.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    studentTable.querySelectorAll("tr").forEach(function(row) {
        const roll = row.cells[0] ? row.cells[0].textContent.toLowerCase() : "";
        const name = row.cells[1] ? row.cells[1].textContent.toLowerCase() : "";
        const email = row.cells[2] ? row.cells[2].textContent.toLowerCase() : "";
        const cls = row.cells[3] ? row.cells[3].textContent.toLowerCase() : "";
        row.style.display = (roll.includes(value) || name.includes(value) || email.includes(value) || cls.includes(value)) ? "" : "none";
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

loadStudentTable();
