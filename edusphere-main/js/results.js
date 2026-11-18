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

// ================================
// LOCAL STORAGE
// ================================

function getResults() {
    const data = localStorage.getItem("results");
    return data ? JSON.parse(data) : [];
}

function saveResults(results) {
    localStorage.setItem("results", JSON.stringify(results));
}

// ================================
// RENDER TABLE
// ================================

function loadResultTable() {
    const results = getResults();
    resultTable.innerHTML = "";

    results.forEach(function(result, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);

        const statusClass = result.status === "Published" ? "status-published" :
                           result.status === "Rejected" ? "status-rejected" : "status-pending";

        row.innerHTML = `
            <td>${result.studentName}</td>
            <td>${result.course}</td>
            <td>${result.marks}/${result.totalMarks || 100}</td>
            <td>${result.grade}</td>
            <td><span class="status-badge ${statusClass}">${result.status}</span></td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                ${result.status !== "Published" ? `<button class="action-btn publish"><i class="fa-solid fa-check"></i></button>` : ""}
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
    modalTitle.textContent = "Add New Result";
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
        studentName: document.getElementById("resultStudentName").value.trim(),
        course: document.getElementById("resultCourse").value.trim(),
        marks: document.getElementById("resultMarks").value,
        totalMarks: document.getElementById("resultTotalMarks").value || 100,
        grade: document.getElementById("resultGrade").value,
        status: "Pending"
    };

    const results = getResults();
    const editIndex = resultForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        obj.status = results[parseInt(editIndex)].status;
        obj.teacher = results[parseInt(editIndex)].teacher || "";
        results[parseInt(editIndex)] = obj;
    } else {
        results.push(obj);
    }

    saveResults(results);
    loadResultTable();
    resultForm.reset();
    resultForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Result";
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
            results.splice(index, 1);
            saveResults(results);
            loadResultTable();
        }
    }

    if (e.target.closest(".view")) {
        const d = e.target.closest("tr").children;
        alert(`Result Details\n\nStudent   : ${d[0].textContent}\nCourse    : ${d[1].textContent}\nMarks     : ${d[2].textContent}\nGrade     : ${d[3].textContent}\nStatus    : ${d[4].textContent}`);
    }

    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));

        document.getElementById("resultStudentName").value = row.cells[0].textContent;
        document.getElementById("resultCourse").value = row.cells[1].textContent;

        const marksText = row.cells[2].textContent;
        const marksArr = marksText.split("/");
        document.getElementById("resultMarks").value = marksArr[0];
        document.getElementById("resultTotalMarks").value = marksArr[1];

        document.getElementById("resultGrade").value = row.cells[3].textContent;

        modalTitle.textContent = "Edit Result";
        resultForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

    if (e.target.closest(".publish")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        const results = getResults();
        results[index].status = "Published";
        saveResults(results);
        loadResultTable();
        alert("Result Published Successfully!");
    }

});

// ================================
// SEARCH
// ================================

searchResult.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    resultTable.querySelectorAll("tr").forEach(function(row) {
        const name = row.cells[0].textContent.toLowerCase();
        const course = row.cells[1].textContent.toLowerCase();
        row.style.display = (name.includes(value) || course.includes(value)) ? "" : "none";
    });
});

loadResultTable();
