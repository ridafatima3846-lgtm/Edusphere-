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

function getAssignments() {
    const data = localStorage.getItem("assignments");
    return data ? JSON.parse(data) : [];
}

// ================================
// ELEMENTS
// ================================

const assignmentTable = document.getElementById("assignmentTable");
const searchAssignment = document.getElementById("searchAssignment");

// ================================
// GET STUDENT DATA
// ================================

const user = getLoggedInUser();
const studentEmail = user ? user.email : null;

// ================================
// RENDER TABLE
// ================================

function loadAssignmentTable() {
    
    const courses = getCourses();
    const assignments = getAssignments();
    assignmentTable.innerHTML = "";
    
    // Get student's courses
    const myCourses = courses.filter(function(c) {
        return c.students && c.students.includes(studentEmail);
    });
    
    const myCourseNames = myCourses.map(function(c) { return c.name; });
    
    // Get assignments for student's courses
    const myAssignments = assignments.filter(function(a) {
        return myCourseNames.includes(a.course);
    });
    
    if (myAssignments.length === 0) {
        assignmentTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6b7280;">No assignments yet.</td></tr>';
        return;
    }
    
    myAssignments.forEach(function(assignment) {
        const row = document.createElement("tr");
        
        // Check deadline status
        const today = new Date();
        const deadline = new Date(assignment.deadline);
        let deadlineStatus = "";
        
        if (deadline < today) {
            deadlineStatus = '<span class="status-badge status-rejected">Expired</span>';
        } else if (deadline.toDateString() === today.toDateString()) {
            deadlineStatus = '<span class="status-badge status-pending">Today</span>';
        } else {
            deadlineStatus = '<span class="status-badge status-published">Active</span>';
        }
        
        row.innerHTML = `
            <td>${assignment.title}</td>
            <td>${assignment.course}</td>
            <td>${assignment.deadline} ${deadlineStatus}</td>
            <td>${assignment.marks}</td>
            <td>${assignment.description || '-'}</td>
        `;
        assignmentTable.appendChild(row);
    });
}

// ================================
// SEARCH
// ================================

searchAssignment.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    assignmentTable.querySelectorAll("tr").forEach(function(row) {
        const title = row.cells[0] ? row.cells[0].textContent.toLowerCase() : "";
        const course = row.cells[1] ? row.cells[1].textContent.toLowerCase() : "";
        row.style.display = (title.includes(value) || course.includes(value)) ? "" : "none";
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

loadAssignmentTable();
