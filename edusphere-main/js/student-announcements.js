// ================================
// LOCAL STORAGE HELPERS
// ================================

function getAnnouncements() {
    const data = localStorage.getItem("announcements");
    return data ? JSON.parse(data) : [];
}

// ================================
// ELEMENTS
// ================================

const announcementsList = document.getElementById("announcementsList");
const searchAnnouncement = document.getElementById("searchAnnouncement");

// ================================
// RENDER ANNOUNCEMENTS
// ================================

function loadAnnouncements() {
    
    const announcements = getAnnouncements();
    announcementsList.innerHTML = "";
    
    if (announcements.length === 0) {
        announcementsList.innerHTML = '<div class="announcement-card"><h3>No Announcements</h3><p>No announcements at this time.</p></div>';
        return;
    }
    
    announcements.forEach(function(ann) {
        const div = document.createElement("div");
        div.className = "announcement-card";
        div.innerHTML = `
            <h3>${ann.title}</h3>
            <p>${ann.message}</p>
            <small style="color:#9ca3af;margin-top:10px;display:block;">${ann.date || ''}</small>
        `;
        announcementsList.appendChild(div);
    });
}

// ================================
// SEARCH
// ================================

searchAnnouncement.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    announcementsList.querySelectorAll(".announcement-card").forEach(function(card) {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const message = card.querySelector("p").textContent.toLowerCase();
        card.style.display = (title.includes(value) || message.includes(value)) ? "" : "none";
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

loadAnnouncements();
