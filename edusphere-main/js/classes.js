// ================================
// ELEMENTS
// ================================

const addClassBtn = document.getElementById("addClassBtn");
const modal = document.getElementById("classModal");
const closeBtn = document.querySelector("#classModal .close-btn");
const classForm = document.getElementById("classForm");
const classesGrid = document.getElementById("classesGrid");
const searchClass = document.getElementById("searchClass");
const modalTitle = document.getElementById("modalTitle");

const detailModal = document.getElementById("classDetailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const classStudentsList = document.getElementById("classStudentsList");
const detailModalTitle = document.getElementById("detailModalTitle");

// ================================
// LOCAL STORAGE
// ================================

function getClasses() {
    const data = localStorage.getItem("classes");
    return data ? JSON.parse(data) : [];
}

function saveClasses(classes) {
    localStorage.setItem("classes", JSON.stringify(classes));
}

function getStudents() {
    const data = localStorage.getItem("students");
    return data ? JSON.parse(data) : [];
}

// ================================
// RENDER CLASS CARDS
// ================================

function loadClasses() {
    const classes = getClasses();
    classesGrid.innerHTML = "";

    if (classes.length === 0) {
        classesGrid.innerHTML = '<p style="color:#6b7280;text-align:center;padding:40px;font-size:16px;">No classes created yet. Click "Add Class" to create one.</p>';
        return;
    }

    classes.forEach(function(cls, index) {
        const students = getStudents();
        const studentCount = students.filter(function(s) {
            return s.className === cls.name;
        }).length;

        const card = document.createElement("div");
        card.className = "class-card";
        card.setAttribute("data-index", index);
        card.innerHTML = `
            <div class="class-card-header">
                <div class="class-icon">
                    <i class="fa-solid fa-chalkboard"></i>
                </div>
                <div class="class-actions">
                    <button class="action-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="class-card-body">
                <h3>${cls.name}</h3>
                <p><i class="fa-solid fa-building"></i> ${cls.department}</p>
                <p><i class="fa-solid fa-calendar"></i> ${cls.semester}</p>
                <p><i class="fa-solid fa-tag"></i> Section ${cls.section}</p>
            </div>
            <div class="class-card-footer">
                <span class="student-count">
                    <i class="fa-solid fa-user-graduate"></i>
                    ${studentCount} Student${studentCount !== 1 ? 's' : ''}
                </span>
                <button class="view-students-btn" data-class="${cls.name}">
                    View Students <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
        classesGrid.appendChild(card);
    });

    // Attach view students listeners
    document.querySelectorAll(".view-students-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            const className = this.getAttribute("data-class");
            showClassStudents(className);
        });
    });
}

// ================================
// SHOW CLASS STUDENTS
// ================================

function showClassStudents(className) {
    const students = getStudents();
    const classStudents = students.filter(function(s) {
        return s.className === className;
    });

    detailModalTitle.textContent = "Students in " + className;
    classStudentsList.innerHTML = "";

    if (classStudents.length === 0) {
        classStudentsList.innerHTML = '<p style="color:#6b7280;text-align:center;padding:30px;">No students in this class yet.</p>';
    } else {
        let html = '<table><thead><tr><th>Roll No</th><th>Name</th><th>Email</th><th>CNIC</th><th>Semester</th></tr></thead><tbody>';

        classStudents.forEach(function(s) {
            html += `<tr><td>${s.rollNo}</td><td>${s.name}</td><td>${s.email}</td><td>${s.cnic}</td><td>${s.semester}</td></tr>`;
        });

        html += '</tbody></table>';
        classStudentsList.innerHTML = html;
    }

    detailModal.style.display = "flex";
}

// ================================
// MODAL
// ================================

addClassBtn.addEventListener("click", function() {
    classForm.reset();
    modalTitle.textContent = "Add New Class";
    classForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === detailModal) detailModal.style.display = "none";
});

closeDetailModal.addEventListener("click", function() { detailModal.style.display = "none"; });

// ================================
// SUBMIT
// ================================

classForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const obj = {
        name: document.getElementById("className").value.trim(),
        department: document.getElementById("classDepartment").value,
        semester: document.getElementById("classSemester").value,
        section: document.getElementById("classSection").value.trim()
    };

    const classes = getClasses();
    const editIndex = classForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        const oldName = classes[parseInt(editIndex)].name;
        // Update class name in students if name changed
        if (oldName !== obj.name) {
            const students = getStudents();
            students.forEach(function(s) {
                if (s.className === oldName) {
                    s.className = obj.name;
                }
            });
            localStorage.setItem("students", JSON.stringify(students));
        }
        classes[parseInt(editIndex)] = obj;
    } else {
        classes.push(obj);
    }

    saveClasses(classes);
    loadClasses();
    classForm.reset();
    classForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Class";
    modal.style.display = "none";
});

// ================================
// CARD ACTIONS (Edit / Delete)
// ================================

classesGrid.addEventListener("click", function(e) {
    const card = e.target.closest(".class-card");
    if (!card) return;
    const index = parseInt(card.getAttribute("data-index"));

    // DELETE
    if (e.target.closest(".delete")) {
        const classes = getClasses();
        if (confirm('Are you sure you want to delete class "' + classes[index].name + '"?')) {
            classes.splice(index, 1);
            saveClasses(classes);
            loadClasses();
        }
    }

    // EDIT
    if (e.target.closest(".edit")) {
        const classes = getClasses();
        const cls = classes[index];

        document.getElementById("className").value = cls.name;
        document.getElementById("classDepartment").value = cls.department;
        document.getElementById("classSemester").value = cls.semester;
        document.getElementById("classSection").value = cls.section;

        modalTitle.textContent = "Edit Class";
        classForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }
});

// ================================
// SEARCH
// ================================

searchClass.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    const cards = classesGrid.querySelectorAll(".class-card");

    cards.forEach(function(card) {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const dept = card.querySelector(".class-card-body p:nth-child(2)").textContent.toLowerCase();
        const sem = card.querySelector(".class-card-body p:nth-child(3)").textContent.toLowerCase();
        card.style.display = (name.includes(value) || dept.includes(value) || sem.includes(value)) ? "" : "none";
    });
});

// ================================
// LOAD ON START
// ================================

loadClasses();
