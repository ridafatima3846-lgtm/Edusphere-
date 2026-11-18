// ================================
// ELEMENTS
// ================================

const addCourseBtn = document.getElementById("addCourseBtn");
const modal = document.getElementById("courseModal");
const closeBtn = document.querySelector("#courseModal .close-btn");
const courseForm = document.getElementById("courseForm");
const courseTable = document.getElementById("courseTable");
const searchCourse = document.getElementById("searchCourse");
const modalTitle = document.getElementById("modalTitle");

// Enroll Modal
const enrollModal = document.getElementById("enrollModal");
const enrollCloseBtn = document.querySelector("#enrollModal .close-btn");
const enrollCourseName = document.getElementById("enrollCourseName");
const classCheckboxes = document.getElementById("classCheckboxes");
const saveEnrollBtn = document.getElementById("saveEnrollBtn");

let currentEnrollIndex = null;

// ================================
// LOCAL STORAGE
// ================================

function getCourses() {
    const data = localStorage.getItem("courses");
    return data ? JSON.parse(data) : [];
}

function saveCourses(courses) {
    localStorage.setItem("courses", JSON.stringify(courses));
}

function getTeachers() {
    const data = localStorage.getItem("teachers");
    return data ? JSON.parse(data) : [];
}

function getClasses() {
    const data = localStorage.getItem("classes");
    return data ? JSON.parse(data) : [];
}

function getStudents() {
    const data = localStorage.getItem("students");
    return data ? JSON.parse(data) : [];
}

// ================================
// LOAD TEACHER DROPDOWN
// ================================

function loadTeacherDropdown() {
    const teachers = getTeachers();
    const select = document.getElementById("courseTeacher");
    select.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(function(teacher) {
        select.innerHTML += '<option value="' + teacher.name + '" data-email="' + teacher.email + '">' + teacher.name + ' (' + teacher.subject + ')</option>';
    });
}

// ================================
// LOAD CLASS DROPDOWN
// ================================

function loadClassDropdown() {
    const classes = getClasses();
    const select = document.getElementById("courseClass");
    select.innerHTML = '<option value="">Select Class</option>';
    classes.forEach(function(cls) {
        select.innerHTML += '<option value="' + cls.name + '">' + cls.name + '</option>';
    });
}

// ================================
// RENDER TABLE
// ================================

function loadCourseTable() {
    const courses = getCourses();
    courseTable.innerHTML = "";

    courses.forEach(function(course, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        const enrolledClasses = course.enrolledClasses ? course.enrolledClasses.length : 0;
        row.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.teacher || '<span style="color:#9ca3af">Not Assigned</span>'}</td>
            <td>${course.className || '<span style="color:#9ca3af">Not Assigned</span>'}</td>
            <td>${course.department}</td>
            <td>${course.credits}</td>
            <td>${course.semester}</td>
            <td>
                <button class="action-btn enroll" title="Enroll Classes"><i class="fa-solid fa-user-plus"></i></button>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        courseTable.appendChild(row);
    });
}

// ================================
// ADD/EDIT MODAL
// ================================

addCourseBtn.addEventListener("click", function() {
    courseForm.reset();
    loadTeacherDropdown();
    loadClassDropdown();
    modalTitle.textContent = "Add New Course";
    courseForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

// ================================
// SUBMIT COURSE
// ================================

courseForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const teacherSelect = document.getElementById("courseTeacher");
    const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
    const teacherEmail = selectedOption ? (selectedOption.getAttribute("data-email") || "") : "";

    const obj = {
        code: document.getElementById("courseCode").value.trim(),
        name: document.getElementById("courseName").value.trim(),
        teacher: document.getElementById("courseTeacher").value,
        teacherEmail: teacherEmail,
        className: document.getElementById("courseClass").value,
        department: document.getElementById("courseDepartment").value,
        credits: document.getElementById("courseCredits").value,
        semester: document.getElementById("courseSemester").value,
        enrolledClasses: []
    };

    const courses = getCourses();
    const editIndex = courseForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        const existing = courses[parseInt(editIndex)];
        obj.enrolledClasses = existing.enrolledClasses || [];
        courses[parseInt(editIndex)] = obj;
    } else {
        courses.push(obj);
    }

    saveCourses(courses);
    loadCourseTable();
    courseForm.reset();
    courseForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Course";
    modal.style.display = "none";
});

// ================================
// ENROLL MODAL (CLASS-BASED)
// ================================

enrollCloseBtn.addEventListener("click", function() { enrollModal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === enrollModal) enrollModal.style.display = "none"; });

function openEnrollModal(index) {
    currentEnrollIndex = index;
    const courses = getCourses();
    const course = courses[index];
    const classes = getClasses();

    enrollCourseName.textContent = "Course: " + course.name + " (" + course.code + ")";
    classCheckboxes.innerHTML = "";

    if (classes.length === 0) {
        classCheckboxes.innerHTML = '<p style="color:#6b7280;text-align:center;">No classes found. Add classes first.</p>';
        enrollModal.style.display = "flex";
        return;
    }

    const enrolledClasses = course.enrolledClasses || [];

    classes.forEach(function(cls) {
        const studentCount = getStudents().filter(function(s) {
            return s.className === cls.name;
        }).length;

        const isChecked = enrolledClasses.includes(cls.name) ? "checked" : "";
        const div = document.createElement("div");
        div.style.cssText = "padding:12px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;";
        div.innerHTML = `
            <input type="checkbox" value="${cls.name}" id="cls_${cls.name}" ${isChecked} style="width:18px;height:18px;cursor:pointer;">
            <label for="cls_${cls.name}" style="cursor:pointer;flex:1;">
                <strong>${cls.name}</strong> <span style="color:#6b7280;">(${studentCount} students)</span>
            </label>
        `;
        classCheckboxes.appendChild(div);
    });

    enrollModal.style.display = "flex";
}

saveEnrollBtn.addEventListener("click", function() {
    if (currentEnrollIndex === null) return;

    const courses = getCourses();
    const checkboxes = classCheckboxes.querySelectorAll("input[type='checkbox']");
    const enrolledClasses = [];

    checkboxes.forEach(function(cb) {
        if (cb.checked) {
            enrolledClasses.push(cb.value);
        }
    });

    courses[currentEnrollIndex].enrolledClasses = enrolledClasses;

    // Auto-update students array from enrolled classes
    const allStudents = getStudents();
    const studentEmails = [];
    enrolledClasses.forEach(function(className) {
        allStudents.forEach(function(s) {
            if (s.className === className && !studentEmails.includes(s.email)) {
                studentEmails.push(s.email);
            }
        });
    });
    courses[currentEnrollIndex].students = studentEmails;

    saveCourses(courses);
    loadCourseTable();
    enrollModal.style.display = "none";
    alert("Classes enrolled successfully! (" + enrolledClasses.length + " classes, " + studentEmails.length + " students)");
});

// ================================
// TABLE ACTIONS
// ================================

courseTable.addEventListener("click", function(e) {

    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this course?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const courses = getCourses();
            courses.splice(index, 1);
            saveCourses(courses);
            loadCourseTable();
        }
    }

    if (e.target.closest(".view")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        const course = getCourses()[index];
        const enrolledClasses = course.enrolledClasses ? course.enrolledClasses.join(", ") : "None";
        alert(`Course Details\n\nCode        : ${course.code}\nName        : ${course.name}\nTeacher     : ${course.teacher || 'Not Assigned'}\nClass       : ${course.className || 'Not Assigned'}\nDepartment  : ${course.department}\nCredits     : ${course.credits}\nSemester    : ${course.semester}\nEnrolled    : ${enrolledClasses}`);
    }

    if (e.target.closest(".edit")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        const course = getCourses()[index];

        loadTeacherDropdown();
        loadClassDropdown();

        document.getElementById("courseCode").value = course.code;
        document.getElementById("courseName").value = course.name;
        document.getElementById("courseTeacher").value = course.teacher || '';
        document.getElementById("courseClass").value = course.className || '';
        document.getElementById("courseDepartment").value = course.department;
        document.getElementById("courseCredits").value = course.credits;
        document.getElementById("courseSemester").value = course.semester;

        modalTitle.textContent = "Edit Course";
        courseForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

    if (e.target.closest(".enroll")) {
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        openEnrollModal(index);
    }

});

// ================================
// SEARCH
// ================================

searchCourse.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    courseTable.querySelectorAll("tr").forEach(function(row) {
        const code = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const teacher = row.cells[2].textContent.toLowerCase();
        const cls = row.cells[3].textContent.toLowerCase();
        const dept = row.cells[4].textContent.toLowerCase();
        row.style.display = (code.includes(value) || name.includes(value) || teacher.includes(value) || cls.includes(value) || dept.includes(value)) ? "" : "none";
    });
});

loadCourseTable();
