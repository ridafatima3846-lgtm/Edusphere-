(function () {
  const ROLE_KEY = "edusphere.demo.role";
  const THEME_KEY = "edusphere.theme";
  const NAV = {
    principal: [
      { group: "Administration", items: [
        ["overview", "Overview", "fa-gauge-high"],
        ["students", "Student Management", "fa-user-graduate"],
        ["teachers", "Teacher Management", "fa-chalkboard-user"],
        ["promotion", "Promotion & Transfer", "fa-arrows-rotate"]
      ]},
      { group: "Academic Structure", items: [
        ["departments", "Departments", "fa-building-columns"],
        ["programs", "Programs", "fa-scroll"],
        ["academic-years", "Academic Years", "fa-calendar-range"],
        ["semesters", "Semesters", "fa-layer-group"],
        ["sections", "Classes & Sections", "fa-chalkboard"],
        ["courses", "Courses & Subjects", "fa-book-open"],
        ["teacher-assignments", "Teacher Assignments", "fa-user-check"]
      ]},
      { group: "Academic Operations", items: [
        ["timetable", "Timetable Management", "fa-table-list"],
        ["attendance", "Attendance Overview", "fa-clipboard-check"],
        ["quizzes", "Quizzes", "fa-circle-question"],
        ["examinations", "Examination Management", "fa-file-pen"],
        ["results", "Result Management", "fa-square-poll-vertical"],
        ["result-approval", "Result Approval", "fa-check-to-slot"],
        ["calendar", "Academic Calendar", "fa-calendar-days"]
      ]},
      { group: "Communication", items: [
        ["announcements", "Announcements", "fa-bullhorn"],
        ["messages", "Messages", "fa-envelope"],
        ["notifications", "Notifications", "fa-bell"]
      ]},
      { group: "System", items: [
        ["reports", "Reports & Analytics", "fa-chart-pie"],
        ["activity", "Activity History", "fa-clock-rotate-left"],
        ["import-export", "Import & Export", "fa-file-arrow-down"],
        ["settings", "Settings", "fa-gear"]
      ]}
    ],
    teacher: [
      { group: "Workspace", items: [
        ["overview", "Overview", "fa-gauge-high"],
        ["courses", "My Courses", "fa-book-open"],
        ["students", "My Students", "fa-user-graduate"],
        ["timetable", "My Timetable", "fa-table-list"]
      ]},
      { group: "Teaching", items: [
        ["attendance", "Mark Attendance", "fa-clipboard-check"],
        ["attendance-history", "Attendance History", "fa-clock-rotate-left"],
        ["corrections", "Correction Requests", "fa-file-circle-question"],
        ["assignments", "Assignments", "fa-file-lines"],
        ["quizzes", "Quizzes", "fa-circle-question"],
        ["results", "Result Management", "fa-square-poll-vertical"]
      ]},
      { group: "Academic", items: [
        ["calendar", "Academic Calendar", "fa-calendar-days"],
        ["announcements", "Announcements", "fa-bullhorn"],
        ["messages", "Messages", "fa-envelope"],
        ["notifications", "Notifications", "fa-bell"],
        ["profile", "Profile & Settings", "fa-gear"]
      ]}
    ],
    student: [
      { group: "My Workspace", items: [
        ["overview", "Overview", "fa-gauge-high"],
        ["profile", "My Profile", "fa-user"],
        ["courses", "My Courses", "fa-book-open"],
        ["timetable", "My Timetable", "fa-table-list"]
      ]},
      { group: "My academics", items: [
        ["attendance", "My Attendance", "fa-clipboard-check"],
        ["assignments", "My Assignments", "fa-file-lines"],
        ["quizzes", "My Quizzes", "fa-circle-question"],
        ["results", "My Results", "fa-square-poll-vertical"],
        ["previous-results", "Previous Results", "fa-archive"]
      ]},
      { group: "Updates", items: [
        ["announcements", "Announcements", "fa-bullhorn"],
        ["messages", "Messages", "fa-envelope"],
        ["notifications", "Notifications", "fa-bell"],
        ["settings", "Settings", "fa-gear"]
      ]}
    ]
  };

  const ROLE_LABELS = { principal: "Principal", teacher: "Teacher", student: "Student" };
  const app = {
    state: { role: "principal", page: "overview" },
    nav: NAV,
    labels: ROLE_LABELS
  };

  function readHash() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    let role = parts[0];
    let page = parts[1];
    if (!NAV[role]) {
      role = localStorage.getItem(ROLE_KEY) || "principal";
      if (!NAV[role]) role = "principal";
    }
    const allowed = NAV[role].reduce(function (arr, group) { return arr.concat(group.items.map(function (i) { return i[0]; })); }, []);
    if (!page || allowed.indexOf(page) === -1) page = "overview";
    return { role: role, page: page };
  }

  function go(page, role) {
    const nextRole = role || app.state.role;
    location.hash = "#/" + nextRole + "/" + page;
  }
  app.go = go;
  app.refresh = function () { render(); };

  function renderNav(role, page) {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;
    nav.innerHTML = NAV[role].map(function (group) {
      return '<div class="nav-group"><div class="nav-group-label">' + ES.ui.esc(group.group) + "</div>" +
        group.items.map(function (item) {
          return '<button class="side-link' + (item[0] === page ? " active" : "") + '" data-nav="' + item[0] + '" title="' + ES.ui.esc(item[1]) + '">' +
            '<i class="fa-solid ' + item[2] + '"></i><span>' + ES.ui.esc(item[1]) + "</span></button>";
        }).join("") + "</div>";
    }).join("");
  }

  function context(role) {
    const state = ES.store.state;
    if (role === "teacher") {
      const teacher = ES.data.teacher(state.demo.teacherId) || state.teachers[0];
      return { role: role, user: teacher, userId: teacher ? teacher.id : "", label: teacher ? teacher.name : "Teacher" };
    }
    if (role === "student") {
      const student = ES.data.student(state.demo.studentId) || ES.data.activeStudents()[0];
      return { role: role, user: student, userId: student ? student.id : "", label: student ? student.name : "Student" };
    }
    return { role: role, user: null, userId: "principal", label: "Principal Office" };
  }
  app.context = context;

  function setChrome(role, page, ctx) {
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) roleSelect.value = role;
    const institution = document.getElementById("institutionLabel");
    if (institution) institution.textContent = ES.data.settings().institution.name;
    const term = document.getElementById("termLabel");
    if (term) term.textContent = ES.data.settings().institution.currentTerm;
    const chip = document.getElementById("profileChip");
    if (chip) {
      chip.innerHTML = ES.ui.avatar(ctx.label, ctx.user && ctx.user.photo) +
        "<span><strong>" + ES.ui.esc(ctx.label) + "</strong><span>" + ROLE_LABELS[role] + "</span></span>";
    }
    const bell = document.querySelector('[data-action="open-notifications"] .dot');
    if (bell) bell.style.display = ES.data.unreadCount(role, ctx.userId) ? "block" : "none";
    document.title = (page === "overview" ? ROLE_LABELS[role] + " Dashboard" : titleFor(role, page)) + " | EduSphere LMS";
    renderNav(role, page);
  }

  function titleFor(role, page) {
    const groups = NAV[role];
    for (let i = 0; i < groups.length; i++) {
      const item = groups[i].items.find(function (x) { return x[0] === page; });
      if (item) return item[1];
    }
    return "Workspace";
  }

  function render() {
    const route = readHash();
    app.state = route;
    localStorage.setItem(ROLE_KEY, route.role);
    ES.store.update(function (state) { state.demo.role = route.role; });
    const ctx = context(route.role);
    setChrome(route.role, route.page, ctx);
    const content = document.getElementById("appContent");
    if (!content) return;
    const view = ES.views && ES.views[route.role] && ES.views[route.role][route.page];
    try {
      content.innerHTML = view ? view(ctx) : ES.ui.empty("This page is not available.");
      const mount = ES.mounts && ES.mounts[route.role] && ES.mounts[route.role][route.page];
      if (mount) mount(content, ctx);
    } catch (err) {
      content.innerHTML = ES.ui.card({ title: "Unable to load this page", body: ES.ui.empty("An unexpected error occurred while rendering this view.") });
      console.error("EduSphere view error", err, err && err.stack);
    }
    closeMobileNav();
    window.scrollTo(0, 0);
  }

  function closeMobileNav() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    localStorage.setItem(THEME_KEY, theme);
  }
  app.applyTheme = applyTheme;

  function showNotifications() {
    const ctx = context(app.state.role);
    const items = ES.data.notificationsFor(ctx.role, ctx.userId);
    const body = items.length ? '<div class="notice-list">' + items.map(function (n) {
      return '<button class="notice-item' + (n.read ? "" : " unread") + '" data-notif="' + ES.ui.esc(n.id) + '">' +
        '<i class="fa-solid ' + (n.read ? "fa-envelope-open" : "fa-envelope") + '"></i><span><strong>' + ES.ui.esc(n.title) + "</strong>" +
        "<small>" + ES.ui.esc(n.message) + "</small><small>" + ES.ui.esc(n.createdAt) + " · " + ES.ui.esc(n.type) + "</small></span></button>";
    }).join("") + "</div>" : ES.ui.empty("No notifications yet.");
    ES.ui.openModal({
      title: "Notifications", size: "modal-lg", saveLabel: null,
      buttons: [
        { label: "Mark all as read", class: "btn-ghost", onClick: function (form, close) {
          ES.store.update(function (state) {
            state.notifications.forEach(function (n) { if (n.role === ctx.role && (!n.userId || n.userId === ctx.userId)) n.read = true; });
          });
          close(); render(); ES.ui.toast("All notifications marked as read.");
        } },
        { label: "Close", class: "btn-ghost", onClick: function (form, close) { close(); } }
      ],
      body: body
    });
    ES.ui.on(document.getElementById("modalRoot"), "[data-notif]", "click", function (e, el) {
      ES.store.update(function (state) {
        const item = state.notifications.find(function (n) { return n.id === el.getAttribute("data-notif"); });
        if (item) item.read = true;
      });
      ES.ui.closeModal();
      render();
    });
  }

  function showProfile() {
    const ctx = context(app.state.role);
    const user = ctx.user;
    const rows = user ? [
      ["Name", ctx.label], ["Role", ROLE_LABELS[ctx.role]],
      ["Email", user.email || "registrar@edusphere.edu"],
      ["Contact", user.phone || ES.data.settings().institution.phone],
      ["Identifier", user.rollNo || user.employeeId || "Principal Office"],
      ["Status", user.status || "Active"]
    ] : [["Name", "Principal Office"], ["Role", "Institution administrator"], ["Email", ES.data.settings().institution.email]];
    ES.ui.openModal({
      title: "Signed-in profile", saveLabel: null,
      buttons: [{ label: "Close", onClick: function (form, close) { close(); } }],
      body: '<div class="profile-modal">' + ES.ui.avatar(ctx.label, user && user.photo, 56) +
        '<div class="detail-grid">' + rows.map(function (r) {
          return '<div class="detail-item"><span>' + ES.ui.esc(r[0]) + "</span><strong>" + ES.ui.esc(r[1]) + "</strong></div>";
        }).join("") + "</div><p class=\"modal-note\">Demo role switching is available in the top bar. No real authentication is used.</p></div>"
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(localStorage.getItem(THEME_KEY) || ES.data.settings().theme || "light");
    document.getElementById("menuBtn").addEventListener("click", function () {
      document.getElementById("sidebar").classList.add("open");
      document.getElementById("sidebarOverlay").classList.add("open");
    });
    document.getElementById("sidebarClose").addEventListener("click", closeMobileNav);
    document.getElementById("sidebarOverlay").addEventListener("click", closeMobileNav);
    document.getElementById("roleSelect").addEventListener("change", function (e) {
      go("overview", e.target.value);
    });
    document.addEventListener("click", function (e) {
      const nav = e.target.closest("[data-nav]");
      if (nav) { go(nav.getAttribute("data-nav")); return; }
      const action = e.target.closest("[data-action]");
      if (!action) return;
      const name = action.getAttribute("data-action");
      if (name === "open-notifications") showNotifications();
      if (name === "open-profile") showProfile();
      if (name === "open-settings") go("settings");
      if (name === "go-home") { location.href = "index.html"; }
    });
    window.addEventListener("hashchange", render);
    render();
  });

  ES.app = app;
})();
