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

function getResults() {
    const data = localStorage.getItem("results");
    return data ? JSON.parse(data) : [];
}

function saveResults(results) {
    localStorage.setItem("results", JSON.stringify(results));
}

// ================================
// ELEMENTS
// ================================

const addResultBtn = document.getElementById("addResultBtn");
const modal = document.getElementById("resultModal");
const closeBtn = document.querySelector("#resultModal .close-btn");
const resultForm = document.getElementById("resultForm");
const resultTable = document.getElementById("resultTable");
const searchResult = document.getElementById("searchResult");
const modalTitle = document.getElementById("modalTitle");

const user = getLoggedInUser();

// ================================
// LOAD DROPDOWNS
// ================================

function loadDropdowns() {
    const courses = getCourses();
    const students = getStudents();

    const courseSelect = document.getElementById("resultCourse");
    const studentSelect = document.getElementById("resultStudent");

    const myCourses = courses.filter(function(c) {
        return c.teacherEmail && c.teacherEmail === user.email;
    });

    courseSelect.innerHTML = '<option value="">Select Course</option>';
    myCourses.forEach(function(course) {
        courseSelect.innerHTML += '<option value="' + course.name + '">' + course.name + ' (' + course.code + ')</option>';
    });

    const myStudentEmails = new Set();
    myCourses.forEach(function(course) {
        if (course.students) {
            course.students.forEach(function(email) {
                myStudentEmails.add(email);
            });
        }
    });

    studentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(function(student) {
        if (myStudentEmails.has(student.email)) {
            studentSelect.innerHTML += '<option value="' + student.name + '">' + student.name + ' (' + student.rollNo + ')</option>';
        }
    });
}

// ================================
// RENDER TABLE
// ================================

function loadResultTable() {
    const results = getResults();
    resultTable.innerHTML = "";

    const myResults = results.filter(function(r) {
        return r.teacherEmail && r.teacherEmail === user.email;
    });

    if (myResults.length === 0) {
        resultTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">No results uploaded yet.</td></tr>';
        return;
    }

    myResults.forEach(function(result, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);

        let statusClass = "status-pending";
        if (result.status === "Published") statusClass = "status-published";
        if (result.status === "Rejected") statusClass = "status-rejected";

        row.innerHTML = `
            <td>${result.studentName}</td>
            <td>${result.course}</td>
            <td>${result.marks}/${result.totalMarks || 100}</td>
            <td><strong>${result.grade}</strong></td>
            <td><span class="status-badge ${statusClass}">${result.status}</span></td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        resultTable.appendChild(row);
    });
}

// ================================
// MODAL
// ================================

addResultBtn.addEventListener("click", function() {
    resultForm.reset();
    loadDropdowns();
    modalTitle.textContent = "Add Result";
    resultForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

// ================================
// SUBMIT
// ================================

resultForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const obj = {
        studentName: document.getElementById("resultStudent").value,
        course: document.getElementById("resultCourse").value,
        marks: document.getElementById("resultMarks").value,
        totalMarks: document.getElementById("resultTotalMarks").value,
        grade: document.getElementById("resultGrade").value,
        status: document.getElementById("resultStatus").value,
        teacher: user.name,
        teacherEmail: user.email
    };

    const results = getResults();
    const editIndex = resultForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        results[parseInt(editIndex)] = obj;
    } else {
        results.push(obj);
    }

    saveResults(results);
    loadResultTable();
    resultForm.reset();
    resultForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add Result";
    modal.style.display = "none";
});

// ================================
// TABLE ACTIONS
// ================================

resultTable.addEventListener("click", function(e) {

    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this result?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const results = getResults();
            const myResults = results.filter(function(r) {
                return r.teacherEmail && r.teacherEmail === user.email;
            });
            const result = myResults[index];
            const realIndex = results.indexOf(result);
            results.splice(realIndex, 1);
            saveResults(results);
            loadResultTable();
        }
    }

    if (e.target.closest(".view")) {
        const row = e.target.closest("tr");
        const d = row.children;
        alert(
`Result Details

Student     : ${d[0].textContent}
Course      : ${d[1].textContent}
Marks       : ${d[2].textContent}
Grade       : ${d[3].textContent}
Status      : ${d[4].textContent}`
        );
    }

    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        loadDropdowns();

        document.getElementById("resultStudent").value = row.cells[0].textContent;
        document.getElementById("resultCourse").value = row.cells[1].textContent;

        const marksText = row.cells[2].textContent;
        const marksArr = marksText.split("/");
        document.getElementById("resultMarks").value = marksArr[0];
        document.getElementById("resultTotalMarks").value = marksArr[1];

        document.getElementById("resultGrade").value = row.cells[3].textContent;

        const statusText = row.cells[4].textContent.trim();
        document.getElementById("resultStatus").value = statusText;

        modalTitle.textContent = "Edit Result";
        resultForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

});

// ================================
// SEARCH
// ================================

searchResult.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    resultTable.querySelectorAll("tr").forEach(function(row) {
        const student = row.cells[0] ? row.cells[0].textContent.toLowerCase() : "";
        const course = row.cells[1] ? row.cells[1].textContent.toLowerCase() : "";
        row.style.display = (student.includes(value) || course.includes(value)) ? "" : "none";
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

loadResultTable();
