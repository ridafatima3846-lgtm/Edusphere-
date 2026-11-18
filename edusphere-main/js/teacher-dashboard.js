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

function getAssignments() {
    const data = localStorage.getItem("assignments");
    return data ? JSON.parse(data) : [];
}

function getResults() {
    const data = localStorage.getItem("results");
    return data ? JSON.parse(data) : [];
}

function getAnnouncements() {
    const data = localStorage.getItem("announcements");
    return data ? JSON.parse(data) : [];
}

function getTeachers() {
    const data = localStorage.getItem("teachers");
    return data ? JSON.parse(data) : [];
}

// ================================
// LOAD TEACHER DATA
// ================================

const user = getLoggedInUser();
const teacherNameEl = document.getElementById("teacherName");

if (user) {
    teacherNameEl.textContent = user.name;
}

// Get teacher ID from teachers table
function getTeacherId() {
    if (!user) return null;
    
    // If logged in via teachers table
    if (user.id) return user.id;
    
    // If registered, find in teachers table by email
    const teachers = getTeachers();
    const teacher = teachers.find(function(t) {
        return t.email === user.email;
    });
    
    return teacher ? teacher.id : null;
}

const teacherId = getTeacherId();

// ================================
// LOAD STATS
// ================================

function loadStats() {
    
    const courses = getCourses();
    const students = getStudents();
    const assignments = getAssignments();
    const results = getResults();
    
    // Filter courses assigned to this teacher
    const myCourses = courses.filter(function(c) {
        return c.teacher === user.name || c.teacherId === teacherId;
    });
    
    // Filter students in teacher's courses
    const myStudentEmails = new Set();
    myCourses.forEach(function(course) {
        if (course.students) {
            course.students.forEach(function(email) {
                myStudentEmails.add(email);
            });
        }
    });
    
    const myStudents = students.filter(function(s) {
        return myStudentEmails.has(s.email);
    });
    
    // Filter assignments by this teacher
    const myAssignments = assignments.filter(function(a) {
        return a.teacher === user.name || a.teacherId === teacherId;
    });
    
    // Filter results by this teacher
    const myResults = results.filter(function(r) {
        return r.teacher === user.name || r.teacherId === teacherId;
    });
    
    document.getElementById("myCourses").textContent = myCourses.length;
    document.getElementById("myStudents").textContent = myStudents.length;
    document.getElementById("myAssignments").textContent = myAssignments.length;
    document.getElementById("myResults").textContent = myResults.length;
    
    // Store for activities
    window.teacherData = {
        myCourses: myCourses,
        myStudents: myStudents,
        myAssignments: myAssignments,
        myResults: myResults
    };
}

// ================================
// LOAD ACTIVITIES
// ================================

function loadActivities() {
    
    const activitiesList = document.getElementById("activitiesList");
    const activities = [];
    
    if (!window.teacherData) return;
    
    // Recent courses
    window.teacherData.myCourses.slice(-3).forEach(function(course) {
        activities.push({
            icon: "fa-book",
            text: "Course: " + course.name + " (" + course.code + ")"
        });
    });
    
    // Recent assignments
    window.teacherData.myAssignments.slice(-3).forEach(function(assignment) {
        activities.push({
            icon: "fa-file-lines",
            text: "Assignment: " + assignment.title
        });
    });
    
    // Recent results
    window.teacherData.myResults.slice(-3).forEach(function(result) {
        activities.push({
            icon: "fa-square-poll-vertical",
            text: "Result: " + result.studentName + " - " + result.course
        });
    });
    
    if (activities.length === 0) {
        activitiesList.innerHTML = "<li>No recent activities yet.</li>";
        return;
    }
    
    activitiesList.innerHTML = "";
    activities.slice(-5).reverse().forEach(function(activity) {
        const li = document.createElement("li");
        li.innerHTML = '<i class="fa-solid ' + activity.icon + '"></i>' + activity.text;
        activitiesList.appendChild(li);
    });
}

// ================================
// LOAD ANNOUNCEMENTS
// ================================

function loadAnnouncements() {
    
    const announcements = getAnnouncements();
    const container = document.getElementById("announcementsList");
    
    if (announcements.length === 0) {
        container.innerHTML = '<div class="announcement-card"><h3>No Announcements</h3><p>No announcements at this time.</p></div>';
        return;
    }
    
    container.innerHTML = "";
    announcements.slice(-3).reverse().forEach(function(ann) {
        const div = document.createElement("div");
        div.className = "announcement-card";
        div.innerHTML = '<h3>' + ann.title + '</h3><p>' + ann.message + '</p>';
        container.appendChild(div);
    });
}

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
// INITIALIZE
// ================================

loadStats();
loadActivities();
loadAnnouncements();
