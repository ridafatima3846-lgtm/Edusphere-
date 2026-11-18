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

// ================================
// GET STUDENT DATA
// ================================

const user = getLoggedInUser();
const studentNameEl = document.getElementById("studentName");

if (user) {
    studentNameEl.textContent = user.name;
}

function getStudentEmail() {
    if (!user) return null;
    return user.email;
}

const studentEmail = getStudentEmail();

// ================================
// LOAD STATS
// ================================

function loadStats() {
    
    const courses = getCourses();
    const assignments = getAssignments();
    const results = getResults();
    
    // Get courses where student is enrolled
    const myCourses = courses.filter(function(c) {
        return c.students && c.students.includes(studentEmail);
    });
    
    // Get assignments for student's courses
    const myCourseNames = myCourses.map(function(c) { return c.name; });
    const myAssignments = assignments.filter(function(a) {
        return myCourseNames.includes(a.course);
    });
    
    // Get results for this student
    const myResults = results.filter(function(r) {
        return r.studentEmail === studentEmail || r.studentName === user.name;
    });
    
    // Calculate average GPA
    let avgGPA = "-";
    if (myResults.length > 0) {
        const gradePoints = {
            "A+": 4.0, "A": 4.0, "A-": 3.7,
            "B+": 3.3, "B": 3.0, "B-": 2.7,
            "C+": 2.3, "C": 2.0, "C-": 1.7,
            "D": 1.0, "F": 0.0
        };
        
        let totalPoints = 0;
        let count = 0;
        myResults.forEach(function(r) {
            if (gradePoints[r.grade] !== undefined) {
                totalPoints += gradePoints[r.grade];
                count++;
            }
        });
        
        if (count > 0) {
            avgGPA = (totalPoints / count).toFixed(2);
        }
    }
    
    document.getElementById("myCourses").textContent = myCourses.length;
    document.getElementById("myAssignments").textContent = myAssignments.length;
    document.getElementById("myResults").textContent = myResults.length;
    document.getElementById("myGPA").textContent = avgGPA;
    
    // Store for activities
    window.studentData = {
        myCourses: myCourses,
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
    
    if (!window.studentData) return;
    
    // Recent courses
    window.studentData.myCourses.slice(-3).forEach(function(course) {
        activities.push({
            icon: "fa-book",
            text: "Enrolled in: " + course.name
        });
    });
    
    // Recent results
    window.studentData.myResults.slice(-3).forEach(function(result) {
        activities.push({
            icon: "fa-square-poll-vertical",
            text: "Result: " + result.course + " - " + result.grade
        });
    });
    
    // Recent assignments
    window.studentData.myAssignments.slice(-3).forEach(function(assignment) {
        activities.push({
            icon: "fa-file-lines",
            text: "Assignment: " + assignment.title
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
// LOAD COURSE CARDS
// ================================

function loadCourseCards() {
    
    const container = document.getElementById("courseCards");
    
    if (!window.studentData || window.studentData.myCourses.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;">No courses enrolled yet.</p>';
        return;
    }
    
    container.innerHTML = "";
    window.studentData.myCourses.forEach(function(course) {
        const div = document.createElement("div");
        div.className = "course-card";
        div.innerHTML = `
            <h3>${course.name}</h3>
            <p>${course.department}</p>
            <p>Semester: ${course.semester}</p>
            <span class="course-code">${course.code}</span>
        `;
        container.appendChild(div);
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
loadCourseCards();
loadAnnouncements();
