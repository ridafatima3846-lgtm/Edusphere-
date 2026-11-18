(function () {
    const storedUser = localStorage.getItem("loggedInUser");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (currentUser && currentUser.role === "admin") {
        window.location.replace("admin-dashboard.html");
    }
})();

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

// ================================
// LOCAL STORAGE
// ================================

function getAssignments() {
    const data = localStorage.getItem("assignments");
    return data ? JSON.parse(data) : [];
}

function saveAssignments(assignments) {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

// ================================
// RENDER TABLE
// ================================

function loadAssignmentTable() {
    const assignments = getAssignments();
    assignmentTable.innerHTML = "";

    assignments.forEach(function(a, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td>${a.title}</td>
            <td>${a.course}</td>
            <td>${a.teacher}</td>
            <td>${a.deadline}</td>
            <td>${a.marks}</td>
            <td><span class="status-badge status-pending">Active</span></td>
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
    modalTitle.textContent = "Add New Assignment";
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
        course: document.getElementById("assignmentCourse").value.trim(),
        teacher: document.getElementById("assignmentTeacher").value.trim(),
        deadline: document.getElementById("assignmentDeadline").value,
        marks: document.getElementById("assignmentMarks").value
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
    modalTitle.textContent = "Add New Assignment";
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
            assignments.splice(index, 1);
            saveAssignments(assignments);
            loadAssignmentTable();
        }
    }

    if (e.target.closest(".view")) {
        const d = e.target.closest("tr").children;
        alert(`Assignment Details\n\nTitle       : ${d[0].textContent}\nCourse      : ${d[1].textContent}\nTeacher     : ${d[2].textContent}\nDeadline    : ${d[3].textContent}\nTotal Marks : ${d[4].textContent}`);
    }

    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        document.getElementById("assignmentTitle").value = row.cells[0].textContent;
        document.getElementById("assignmentCourse").value = row.cells[1].textContent;
        document.getElementById("assignmentTeacher").value = row.cells[2].textContent;
        document.getElementById("assignmentDeadline").value = row.cells[3].textContent;
        document.getElementById("assignmentMarks").value = row.cells[4].textContent;

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
        const title = row.cells[0].textContent.toLowerCase();
        const course = row.cells[1].textContent.toLowerCase();
        const teacher = row.cells[2].textContent.toLowerCase();
        row.style.display = (title.includes(value) || course.includes(value) || teacher.includes(value)) ? "" : "none";
    });
});

loadAssignmentTable();
