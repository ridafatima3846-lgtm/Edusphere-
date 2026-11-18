// ================================
// GET HTML ELEMENTS
// ================================

const addTeacherBtn = document.getElementById("addTeacherBtn");
const modal = document.getElementById("teacherModal");
const closeBtn = document.querySelector("#teacherModal .close-btn");
const teacherForm = document.getElementById("teacherForm");
const teacherTable = document.getElementById("teacherTable");
const searchTeacher = document.getElementById("searchTeacher");
const modalTitle = document.getElementById("modalTitle");

let loggedInUser = null;
try {
    loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "null");
} catch (e) {
    loggedInUser = null;
}

const canManageTeachers = !!loggedInUser && String(loggedInUser.role || "").toLowerCase() === "admin";

if (!canManageTeachers && addTeacherBtn) {
    addTeacherBtn.style.display = "none";
}

// ================================
// LOCAL STORAGE HELPERS
// ================================

function getTeachers() {
    const data = localStorage.getItem("teachers");
    return data ? JSON.parse(data) : [];
}

function saveTeachers(teachers) {
    localStorage.setItem("teachers", JSON.stringify(teachers));
}

// ================================
// RENDER TABLE
// ================================

function loadTeacherTable() {
    const teachers = getTeachers();
    teacherTable.innerHTML = "";

    teachers.forEach(function(teacher, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td>${teacher.id}</td>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.phone}</td>
            <td>${teacher.subject}</td>
            <td>${teacher.qualification}</td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                ${canManageTeachers ? '<button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>' : ''}
                ${canManageTeachers ? '<button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>' : ''}
            </td>
        `;
        teacherTable.appendChild(row);
    });
}

// ================================
// OPEN MODAL (Add)
// ================================

addTeacherBtn.addEventListener("click", function() {
    if (!canManageTeachers) {
        alert("Only the admin can add or edit teachers.");
        return;
    }
    teacherForm.reset();
    modalTitle.textContent = "Add New Teacher";
    teacherForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

// ================================
// CLOSE MODAL
// ================================

closeBtn.addEventListener("click", function() {
    modal.style.display = "none";
});

window.addEventListener("click", function(e) {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// ================================
// ADD / EDIT TEACHER
// ================================

teacherForm.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!canManageTeachers) {
        alert("Only the admin can add or edit teachers.");
        return;
    }

    const teacherObj = {
        id: document.getElementById("teacherId").value.trim(),
        name: document.getElementById("teacherName").value.trim(),
        email: document.getElementById("teacherEmail").value.trim(),
        phone: document.getElementById("teacherPhone").value.trim(),
        subject: document.getElementById("teacherSubject").value.trim(),
        qualification: document.getElementById("teacherQualification").value
    };

    const teachers = getTeachers();
    const editIndex = teacherForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        teachers[parseInt(editIndex)] = teacherObj;
        saveTeachers(teachers);
        loadTeacherTable();
    } else {
        teachers.push(teacherObj);
        saveTeachers(teachers);
        loadTeacherTable();
    }

    teacherForm.reset();
    teacherForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Teacher";
    modal.style.display = "none";
});

// ================================
// TABLE ACTIONS
// ================================

teacherTable.addEventListener("click", function(e) {

    if (!canManageTeachers && (e.target.closest(".edit") || e.target.closest(".delete"))) {
        alert("Only the admin can add or edit teachers.");
        return;
    }

    // DELETE
    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this teacher?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const teachers = getTeachers();
            teachers.splice(index, 1);
            saveTeachers(teachers);
            loadTeacherTable();
        }
    }

    // VIEW
    if (e.target.closest(".view")) {
        const row = e.target.closest("tr");
        const d = row.children;
        alert(
`Teacher Details

ID            : ${d[0].textContent}
Name          : ${d[1].textContent}
Email         : ${d[2].textContent}
Phone         : ${d[3].textContent}
Subject       : ${d[4].textContent}
Qualification : ${d[5].textContent}`
        );
    }

    // EDIT
    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        document.getElementById("teacherId").value = row.cells[0].textContent;
        document.getElementById("teacherName").value = row.cells[1].textContent;
        document.getElementById("teacherEmail").value = row.cells[2].textContent;
        document.getElementById("teacherPhone").value = row.cells[3].textContent;
        document.getElementById("teacherSubject").value = row.cells[4].textContent;
        document.getElementById("teacherQualification").value = row.cells[5].textContent;

        modalTitle.textContent = "Edit Teacher";
        teacherForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

});

// ================================
// SEARCH
// ================================

searchTeacher.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    const rows = teacherTable.querySelectorAll("tr");

    rows.forEach(function(row) {
        const id = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const subject = row.cells[4].textContent.toLowerCase();

        if (id.includes(value) || name.includes(value) || email.includes(value) || subject.includes(value)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

// ================================
// LOAD ON START
// ================================

loadTeacherTable();
