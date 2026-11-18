// ================================
// GET LOGGED IN USER
// ================================

function getLoggedInUser() {
    const data = localStorage.getItem("loggedInUser");
    return data ? JSON.parse(data) : null;
}

const user = getLoggedInUser();
const welcomeName = document.querySelector(".welcome h1");

if (user && welcomeName) {
    welcomeName.textContent = "Welcome, " + user.name;
}

// ================================
// GET COUNTS FROM LOCALSTORAGE
// ================================

function getCount(key) {
    const data = localStorage.getItem(key);
    if (data) {
        return JSON.parse(data).length;
    }
    return 0;
}

// ================================
// UPDATE STATISTICS CARDS
// ================================

function updateStats() {
    const students = getCount("students");
    const teachers = getCount("teachers");
    const courses = getCount("courses");
    const classes = getCount("classes");
    const announcements = getCount("announcements");

    document.getElementById("totalStudents").textContent = students;
    document.getElementById("totalTeachers").textContent = teachers;
    document.getElementById("totalCourses").textContent = courses;
    document.getElementById("totalClasses").textContent = classes;
    document.getElementById("totalAnnouncements").textContent = announcements;
}

updateStats();

// ================================
// LOAD RECENT ACTIVITIES
// ================================

function loadActivities() {
    const list = document.getElementById("activitiesList");
    const activities = [];

    // Students
    const students = JSON.parse(localStorage.getItem("students") || "[]");
    students.slice(-3).forEach(function(s) {
        activities.push({
            icon: "fa-solid fa-user-graduate",
            text: 'Student <strong>' + s.name + '</strong> registered.'
        });
    });

    // Teachers
    const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    teachers.slice(-3).forEach(function(t) {
        activities.push({
            icon: "fa-solid fa-chalkboard-user",
            text: 'Teacher <strong>' + t.name + '</strong> added.'
        });
    });

    // Courses
    const courses = JSON.parse(localStorage.getItem("courses") || "[]");
    courses.slice(-3).forEach(function(c) {
        activities.push({
            icon: "fa-solid fa-book-open",
            text: 'Course <strong>' + c.name + '</strong> added.'
        });
    });

    // Announcements
    const announcements = JSON.parse(localStorage.getItem("announcements") || "[]");
    announcements.slice(-3).forEach(function(a) {
        activities.push({
            icon: "fa-solid fa-bullhorn",
            text: 'Announcement: <strong>' + a.title + '</strong>'
        });
    });

    if (activities.length === 0) {
        list.innerHTML = '<li><i class="fa-solid fa-circle-info"></i> No recent activities yet.</li>';
        return;
    }

    // Show last 5 activities
    const recent = activities.slice(-5).reverse();
    list.innerHTML = "";

    recent.forEach(function(item) {
        const li = document.createElement("li");
        li.innerHTML = '<i class="' + item.icon + '"></i> ' + item.text;
        list.appendChild(li);
    });
}

loadActivities();

// ================================
// LOAD ANNOUNCEMENTS
// ================================

function loadAnnouncements() {
    const container = document.getElementById("announcementsList");
    const announcements = JSON.parse(localStorage.getItem("announcements") || "[]");

    if (announcements.length === 0) {
        container.innerHTML = '<div class="announcement-card"><h3>Welcome to EduSphere LMS</h3><p>New semester classes will start from 15 September.</p></div>';
        return;
    }

    container.innerHTML = "";

    announcements.slice(-3).reverse().forEach(function(a) {
        const div = document.createElement("div");
        div.className = "announcement-card";
        div.innerHTML = '<h3>' + a.title + '</h3><p>' + a.message + '</p>';
        container.appendChild(div);
    });
}

loadAnnouncements();
