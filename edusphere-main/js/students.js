// ================================
// ELEMENTS
// ================================

const addStudentBtn = document.getElementById("addStudentBtn");
const modal = document.getElementById("studentModal");
const closeBtn = document.querySelector("#studentModal .close-btn");
const studentForm = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const searchStudent = document.getElementById("searchStudent");
const filterClass = document.getElementById("filterClass");
const modalTitle = document.getElementById("modalTitle");

// ================================
// LOCAL STORAGE
// ================================

function getStudents() {
    const data = localStorage.getItem("students");
    return data ? JSON.parse(data) : [];
}

function saveStudents(students) {
    localStorage.setItem("students", JSON.stringify(students));
}

function getClasses() {
    const data = localStorage.getItem("classes");
    return data ? JSON.parse(data) : [];
}

// ================================
// LOAD CLASS DROPDOWN
// ================================

function loadClassDropdown() {
    const classes = getClasses();
    const studentClassSelect = document.getElementById("studentClass");
    const filterClassSelect = document.getElementById("filterClass");

    // Student form dropdown
    studentClassSelect.innerHTML = '<option value="">Select Class</option>';
    classes.forEach(function(cls) {
        studentClassSelect.innerHTML += '<option>' + cls.name + '</option>';
    });

    // Filter dropdown
    filterClassSelect.innerHTML = '<option value="">All Classes</option>';
    classes.forEach(function(cls) {
        filterClassSelect.innerHTML += '<option>' + cls.name + '</option>';
    });
}

loadClassDropdown();

// ================================
// RENDER TABLE
// ================================

function loadStudentTable(filterValue) {
    const students = getStudents();
    studentTable.innerHTML = "";

    students.forEach(function(student, index) {
        // Apply filter
        if (filterValue && student.className !== filterValue) return;

        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td>${student.rollNo}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.cnic}</td>
            <td>${student.className || '-'}</td>
            <td>${student.department}</td>
            <td>${student.semester}</td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        studentTable.appendChild(row);
    });
}

// ================================
// MODAL
// ================================

addStudentBtn.addEventListener("click", function() {
    studentForm.reset();
    loadClassDropdown();
    modalTitle.textContent = "Add New Student";
    studentForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

// ================================
// SUBMIT
// ================================

studentForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const studentObj = {
        rollNo: document.getElementById("rollNo").value.trim(),
        name: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        cnic: document.getElementById("CNIC").value.trim(),
        className: document.getElementById("studentClass").value,
        department: document.getElementById("department").value.trim(),
        semester: document.getElementById("semester").value
    };

    const students = getStudents();
    const editIndex = studentForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        students[parseInt(editIndex)] = studentObj;
    } else {
        students.push(studentObj);
    }

    saveStudents(students);
    loadStudentTable(filterClass.value);
    studentForm.reset();
    studentForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Student";
    modal.style.display = "none";
});

// ================================
// TABLE ACTIONS
// ================================

studentTable.addEventListener("click", function(e) {

    // DELETE
    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this student?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const students = getStudents();
            students.splice(index, 1);
            saveStudents(students);
            loadStudentTable(filterClass.value);
        }
    }

    // VIEW
    if (e.target.closest(".view")) {
        const d = e.target.closest("tr").children;
        alert(
`Student Details

Roll No      : ${d[0].textContent}
Name         : ${d[1].textContent}
Email        : ${d[2].textContent}
CNIC         : ${d[3].textContent}
Class        : ${d[4].textContent}
Department   : ${d[5].textContent}
Semester     : ${d[6].textContent}`
        );
    }

    // EDIT
    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        loadClassDropdown();

        document.getElementById("rollNo").value = row.cells[0].textContent;
        document.getElementById("studentName").value = row.cells[1].textContent;
        document.getElementById("studentEmail").value = row.cells[2].textContent;
        document.getElementById("CNIC").value = row.cells[3].textContent;
        document.getElementById("studentClass").value = row.cells[4].textContent === '-' ? '' : row.cells[4].textContent;
        document.getElementById("department").value = row.cells[5].textContent;
        document.getElementById("semester").value = row.cells[6].textContent;

        modalTitle.textContent = "Edit Student";
        studentForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

});

// ================================
// SEARCH
// ================================

searchStudent.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    studentTable.querySelectorAll("tr").forEach(function(row) {
        const roll = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const cnic = row.cells[3].textContent.toLowerCase();
        const cls = row.cells[4].textContent.toLowerCase();
        const dept = row.cells[5].textContent.toLowerCase();

        row.style.display = (roll.includes(value) || name.includes(value) || email.includes(value) || cnic.includes(value) || cls.includes(value) || dept.includes(value)) ? "" : "none";
    });
});

// ================================
// FILTER BY CLASS
// ================================

filterClass.addEventListener("change", function() {
    loadStudentTable(this.value);
});

// ================================
// LOAD ON START
// ================================

loadStudentTable("");
