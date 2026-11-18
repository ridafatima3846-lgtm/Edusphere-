// ================================
// ELEMENTS
// ================================

const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");
const modal = document.getElementById("announcementModal");
const closeBtn = document.querySelector("#announcementModal .close-btn");
const announcementForm = document.getElementById("announcementForm");
const announcementTable = document.getElementById("announcementTable");
const searchAnnouncement = document.getElementById("searchAnnouncement");
const modalTitle = document.getElementById("modalTitle");

// ================================
// LOCAL STORAGE
// ================================

function getAnnouncements() {
    const data = localStorage.getItem("announcements");
    return data ? JSON.parse(data) : [];
}

function saveAnnouncements(announcements) {
    localStorage.setItem("announcements", JSON.stringify(announcements));
}

// ================================
// RENDER TABLE
// ================================

function loadAnnouncementTable() {
    const announcements = getAnnouncements();
    announcementTable.innerHTML = "";

    announcements.forEach(function(a, index) {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        const shortMsg = a.message.length > 50 ? a.message.substring(0, 50) + "..." : a.message;
        row.innerHTML = `
            <td>${a.title}</td>
            <td>${shortMsg}</td>
            <td>${a.date}</td>
            <td>
                <button class="action-btn view"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        announcementTable.appendChild(row);
    });
}

// ================================
// MODAL
// ================================

addAnnouncementBtn.addEventListener("click", function() {
    announcementForm.reset();
    modalTitle.textContent = "Add New Announcement";
    announcementForm.removeAttribute("data-edit-index");
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
window.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

// ================================
// SUBMIT
// ================================

announcementForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const today = new Date();
    const dateStr = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();

    const obj = {
        title: document.getElementById("announcementTitle").value.trim(),
        message: document.getElementById("announcementMessage").value.trim(),
        date: dateStr
    };

    const announcements = getAnnouncements();
    const editIndex = announcementForm.getAttribute("data-edit-index");

    if (editIndex !== null) {
        obj.date = announcements[parseInt(editIndex)].date;
        announcements[parseInt(editIndex)] = obj;
    } else {
        announcements.push(obj);
    }

    saveAnnouncements(announcements);
    loadAnnouncementTable();
    announcementForm.reset();
    announcementForm.removeAttribute("data-edit-index");
    modalTitle.textContent = "Add New Announcement";
    modal.style.display = "none";
});

// ================================
// TABLE ACTIONS
// ================================

announcementTable.addEventListener("click", function(e) {

    if (e.target.closest(".delete")) {
        if (confirm("Are you sure you want to delete this announcement?")) {
            const row = e.target.closest("tr");
            const index = parseInt(row.getAttribute("data-index"));
            const announcements = getAnnouncements();
            announcements.splice(index, 1);
            saveAnnouncements(announcements);
            loadAnnouncementTable();
        }
    }

    if (e.target.closest(".view")) {
        const announcements = getAnnouncements();
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        const a = announcements[index];
        alert(`Announcement\n\nTitle : ${a.title}\nDate  : ${a.date}\n\n${a.message}`);
    }

    if (e.target.closest(".edit")) {
        const announcements = getAnnouncements();
        const row = e.target.closest("tr");
        const index = parseInt(row.getAttribute("data-index"));
        const a = announcements[index];

        document.getElementById("announcementTitle").value = a.title;
        document.getElementById("announcementMessage").value = a.message;

        modalTitle.textContent = "Edit Announcement";
        announcementForm.setAttribute("data-edit-index", index);
        modal.style.display = "flex";
    }

});

// ================================
// SEARCH
// ================================

searchAnnouncement.addEventListener("input", function() {
    const value = this.value.toLowerCase();
    announcementTable.querySelectorAll("tr").forEach(function(row) {
        const title = row.cells[0].textContent.toLowerCase();
        const msg = row.cells[1].textContent.toLowerCase();
        row.style.display = (title.includes(value) || msg.includes(value)) ? "" : "none";
    });
});

loadAnnouncementTable();
