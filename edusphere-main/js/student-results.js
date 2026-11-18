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

function getResults() {
    const data = localStorage.getItem("results");
    return data ? JSON.parse(data) : [];
}

// ================================
// ELEMENTS
// ================================

const resultTable = document.getElementById("resultTable");
const searchResult = document.getElementById("searchResult");

// ================================
// GET STUDENT DATA
// ================================

const user = getLoggedInUser();
const studentEmail = user ? user.email : null;

// ================================
// RENDER TABLE
// ================================

function loadResultTable() {
    
    const results = getResults();
    resultTable.innerHTML = "";
    
    // Get only PUBLISHED results for this student
    const myResults = results.filter(function(r) {
        return (r.studentName === user.name) && r.status === "Published";
    });
    
    if (myResults.length === 0) {
        resultTable.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#6b7280;">No published results yet.</td></tr>';
        return;
    }
    
    myResults.forEach(function(result) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${result.course}</td>
            <td>${result.marks}/${result.totalMarks || 100}</td>
            <td><strong>${result.grade}</strong></td>
            <td><span class="status-badge status-published">Published</span></td>
        `;
        resultTable.appendChild(row);
    });
}

// ================================
// SEARCH
// ================================

searchResult.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    resultTable.querySelectorAll("tr").forEach(function(row) {
        const course = row.cells[0] ? row.cells[0].textContent.toLowerCase() : "";
        row.style.display = course.includes(value) ? "" : "none";
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

loadResultTable();
