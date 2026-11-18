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

function saveAssignments(assignments) {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

// ================================
// ELEMENTS
// ================================

const addAssignmentBtn = document.getElementById("addAssignmentBtn");
const modal = document.getElementById("assignmentModal");
const closeBtn = document.querySelector("#assignmentModal .close-btn");
const assignmentForm = document.getElementById("assignmentForm");
const assignmentTable = document.getElementById("assignmentTable");
const searchAssignment = document.getElementById("searchAssignment");
const modalTitle = document.getElementById("modalTitle");

const user = getLoggedInUser();

// ================================
// LOAD COURSE DROPDOWN
// ================================

function loadCourseDropdown() {
    const courses = getCourses();
    const select = document.getElementById("assignmentCourse");
    select.innerHTML = '<option value="">Select Course</option>';

    const myCourses = courses.filter(function(c) {
        return c.teacherEmail && c.teacherEmail === user.email;
    });

    myCourses.forEach(function(course) {
        select.innerHTML += '<option value="' + course.name + '">' + course.name + ' (' + course.code + ')</option>';
    });
}

// ================================
// RENDER TABLE
// ================================

function loadAssignmentTable() {
    const assignments = getAssignments();
    assignmentTable.innerHTML = "";

    const myAssignments = assignments.filter(function(a) {
        return a.teacherEmail && a.teacherEmail === user.email;
    });

    if (myAssignments.length === 0) {
        assignmentTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6b7280;">No assignments created yet.</td></tr>';
        return;
    }

    myAssignments.forEach(function(assignment, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td>${assignment.title}</td>
            <td>${assignment.course}</td>
            <td>${assignment.deadline}</td>
            <td>${assignment.marks}</td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        assignmentTable.appendChild(row);
    });
}

// ================================
// MODAL
// ================================

addAssignmentBtn.addEventListener("click", function() {
    assignmentForm.reset();
    loadCourseDropdown();
    modalTitle.textContent = "Create Assignment";
    assignmentForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

// ================================
// SUBMIT
// ================================

assignmentForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const obj = {
        title: document.getElementById("assignmentTitle").value.trim(),
        course: document.getElementById("assignmentCourse").value,
        description: document.getElementById("assignmentDescription").value.trim(),
        deadline: document.getElementById("assignmentDeadline").value,
        marks: document.getElementById("assignmentMarks").value,
        teacher: user.name,
        teacherEmail: user.email
    };

    const assignments = getAssignments();
    const editIndex = assignmentForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        assignments[parseInt(editIndex)] = obj;
    } else {
        assignments.push(obj);
    }

    saveAssignments(assignments);
    loadAssignmentTable();
    assignmentForm.reset();
    assignmentForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Create Assignment";
    modal.style.display = "none";
});

// ================================
// TABLE ACTIONS
// ================================

assignmentTable.addEventListener("click", function(e) {

    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this assignment?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const assignments = getAssignments();
            const myAssignments = assignments.filter(function(a) {
                return a.teacherEmail && a.teacherEmail === user.email;
            });
            const assignment = myAssignments[index];
            const realIndex = assignments.indexOf(assignment);
            assignments.splice(realIndex, 1);
            saveAssignments(assignments);
            loadAssignmentTable();
        }
    }

    if (e.target.closest(".view")) {
        const row = e.target.closest("tr");
        const d = row.children;
        alert(
`Assignment Details

Title       : ${d[0].textContent}
Course      : ${d[1].textContent}
Deadline    : ${d[2].textContent}
Marks       : ${d[3].textContent}`
        );
    }

    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        loadCourseDropdown();

        document.getElementById("assignmentTitle").value = row.cells[0].textContent;
        document.getElementById("assignmentCourse").value = row.cells[1].textContent;
        document.getElementById("assignmentDeadline").value = row.cells[2].textContent;
        document.getElementById("assignmentMarks").value = row.cells[3].textContent;

        modalTitle.textContent = "Edit Assignment";
        assignmentForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

});

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

loadAssignmentTable();
