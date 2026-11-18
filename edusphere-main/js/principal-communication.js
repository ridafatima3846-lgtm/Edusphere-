(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.principal = ES.views.principal || {};
  const mounts = ES.mounts.principal = ES.mounts.principal || {};
  const uiState = { announcementSearch: "", conversationId: "", activitySearch: "", activityAction: "All", importRows: [], importErrors: [], report: {} };

  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({ title: title, subtitle: subtitle, actions: actions || "", breadcrumb: ["Principal", "System"].concat(crumbs || [title]) }) + body;
  }
  function commit(fn, message, audit) {
    store.update(function (state) {
      fn(state);
      if (audit) data.audit(audit.action, "Principal Office", audit.related || "", audit.description || audit.action, audit.icon);
    });
    if (message) ui.toast(message);
  }
  function stamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }

  function audienceLabel(a) {
    if (!a || a.type === "all") return "Entire institution";
    if (a.type === "department") return (data.department(a.value) || {}).name || a.type;
    if (a.type === "program") return (data.program(a.value) || {}).name || a.type;
    if (a.type === "semester") return data.semesterLabel(a.value);
    if (a.type === "section") return data.sectionLabel(a.value, true);
    return a.type;
  }

  views.announcements = function () {
    const rows = store.state.announcements.filter(function (a) {
      return !uiState.announcementSearch || (a.title + a.message + a.author).toLowerCase().indexOf(uiState.announcementSearch.toLowerCase()) !== -1;
    });
    const body = ui.card({
      title: "Announcements", subtitle: "Publish notices to the institution or a specific academic audience",
      actions: '<button class="btn btn-primary" data-an-action="add"><i class="fa-solid fa-plus"></i> New announcement</button>',
      body: '<div class="toolbar">' + ui.searchBox(uiState.announcementSearch, "Search announcements…", "an-search") + "</div>" +
        ui.table([
          { label: "Title", render: function (a) { return "<strong>" + ui.esc(a.title) + "</strong><small class=\"cell-note\">" + ui.esc(a.message) + "</small>"; } },
          { label: "Audience", render: function (a) { return ui.esc(audienceLabel(a.audience)); } },
          { label: "Author", key: "author" },
          { label: "Published", key: "createdAt" },
          { label: "Actions", render: function (a) { return ES.common.actions([
            { icon: "fa-pen", title: "Edit", attrs: 'data-an-action="edit" data-id="' + a.id + '"' },
            { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-an-action="delete" data-id="' + a.id + '"' }
          ]); } }
        ], rows, { compact: true, empty: "No announcements found." })
    });
    return page("Announcements", "Institution, department, program, semester and section notices", body, "", ["Announcements"]);
  };

  mounts.announcements = function (root) {
    ui.on(root, "[data-an-search]", "input", function (e, el) { uiState.announcementSearch = el.value; ES.app.refresh(); });
    function audienceControl(value) {
      const type = value && value.type ? value.type : "all";
      let items = [];
      if (type === "department") items = store.state.departments;
      if (type === "program") items = store.state.programs;
      if (type === "semester") items = store.state.semesters;
      if (type === "section") items = store.state.sections.map(function (s) { return { id: s.id, name: data.sectionLabel(s.id, true) }; });
      return ES.common.select("audienceValue", "Audience detail", items, value && value.value, { labelKey: "name", placeholder: type === "all" ? "Not required" : "Select " + type });
    }
    ui.on(root, "[data-an-action]", "click", function (e, el) {
      const action = el.getAttribute("data-an-action");
      const a = store.state.announcements.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (action === "delete" && a) {
        ui.confirm({ title: "Remove announcement", message: "Remove " + a.title + "?", onConfirm: function () {
          commit(function (state) { state.announcements = state.announcements.filter(function (x) { return x.id !== a.id; }); }, "Announcement removed.", { action: "Announcement Removed", related: a.title });
          ES.app.refresh();
        } });
        return;
      }
      const v = a || {};
      ui.openModal({
        title: a ? "Edit announcement" : "New announcement", size: "modal-lg",
        body: '<div class="form-grid">' + ui.textInput("title", "Title", v.title, { required: true }) +
          ES.common.select("audienceType", "Audience", [
            { value: "all", label: "Entire institution" }, { value: "department", label: "Specific department" },
            { value: "program", label: "Specific program" }, { value: "semester", label: "Specific semester" },
            { value: "section", label: "Specific section" }
          ], (v.audience || {}).type || "all") +
          '<div id="audienceHost">' + audienceControl(v.audience) + "</div>" +
          ui.textInput("createdAt", "Published at", v.createdAt || stamp()) + "</div>" +
          ui.textarea("message", "Message", v.message, { rows: 4, required: true }),
        saveLabel: a ? "Save changes" : "Publish",
        onSave: function (values, form, close) {
          if (values.audienceType !== "all" && !values.audienceValue) { ui.toast("Select the audience detail.", "error"); return; }
          const audience = { type: values.audienceType, value: values.audienceType === "all" ? "" : values.audienceValue };
          commit(function (state) {
            const payload = { title: values.title, message: values.message, audience: audience, createdAt: values.createdAt, author: (a && a.author) || "Principal Office" };
            if (a) Object.assign(state.announcements.find(function (x) { return x.id === a.id; }), payload);
            else state.announcements.push(Object.assign({ id: ES.uid("an") }, payload));
            data.notify({ title: values.title, message: values.message, type: "Announcement", role: "student" });
            data.notify({ title: values.title, message: values.message, type: "Announcement", role: "teacher" });
          }, a ? "Announcement updated." : "Announcement published.", { action: "Announcement Published", related: values.title });
          close(); ES.app.refresh();
        }
      });
      const form = document.getElementById("esModalForm");
      const type = form.querySelector('[name="audienceType"]');
      const host = form.querySelector("#audienceHost");
      type.addEventListener("change", function () { host.innerHTML = audienceControl({ type: type.value, value: "" }); });
    });
  };

  views.messages = function () {
    const messages = data.messagesFor("principal", "principal");
    const threads = [];
    messages.forEach(function (m) {
      const otherRole = m.fromRole === "principal" ? m.toRole : m.fromRole;
      const otherId = m.fromRole === "principal" ? m.toId : m.fromId;
      const key = otherRole + ":" + otherId;
      if (!threads.some(function (t) { return t.key === key; })) threads.push({ key: key, role: otherRole, id: otherId, last: m });
    });
    if (!uiState.conversationId && threads.length) uiState.conversationId = threads[0].key;
    const current = threads.find(function (t) { return t.key === uiState.conversationId; });
    const thread = current ? messages.filter(function (m) {
      return (m.fromRole === "principal" && m.toRole === current.role && m.toId === current.id) ||
        (m.toRole === "principal" && m.fromRole === current.role && m.fromId === current.id);
    }).sort(function (a, b) { return a.sentAt.localeCompare(b.sentAt); }) : [];
    function otherName(t) {
      if (t.role === "teacher") { const x = data.teacher(t.id); return x ? x.name : "Teacher"; }
      if (t.role === "student") { const x = data.student(t.id); return x ? x.name : "Student"; }
      return "Principal Office";
    }
    const body = '<div class="grid grid-1-2">' +
      ui.card({ title: "Conversations", body: threads.length ? '<div class="conversation-list">' + threads.map(function (t) {
        return '<button class="conversation-item' + (t.key === uiState.conversationId ? " active" : "") + '" data-msg-thread="' + t.key + '">' +
          ES.ui.avatar(otherName(t)) + '<span><strong>' + ui.esc(otherName(t)) + "</strong><small>" + ui.esc(t.last.subject) + "</small></span></button>";
      }).join("") + "</div>" : ui.empty("No conversations yet.") }) +
      ui.card({ title: current ? "Conversation with " + otherName(current) : "Select a conversation", actions: '<button class="btn btn-primary" data-msg-compose><i class="fa-solid fa-pen"></i> New message</button>',
        body: current ? '<div class="thread">' + thread.map(function (m) {
          return '<div class="bubble ' + (m.fromRole === "principal" ? "out" : "in") + '"><strong>' + ui.esc(m.subject) + "</strong><p>" + ui.esc(m.body) + "</p><small>" + ui.esc(m.sentAt) + "</small></div>";
        }).join("") + "</div>" + '<form class="reply-form" data-msg-reply><input class="control" name="subject" placeholder="Subject" value="' + ui.esc(current.last.subject) + '" required>' +
          '<textarea class="control" name="body" rows="3" placeholder="Write a reply…" required></textarea><button class="btn btn-primary" type="submit">Send demo message</button></form>' : ui.empty("Choose a conversation to view its history.") }) +
      "</div>";
    return page("Messages", "Demo messaging between principal, teachers and students", body, "", ["Messages"]);
  };

  mounts.messages = function (root) {
    ui.on(root, "[data-msg-thread]", "click", function (e, el) { uiState.conversationId = el.getAttribute("data-msg-thread"); ES.app.refresh(); });
    ui.on(root, "[data-msg-compose]", "click", function () {
      ui.openModal({
        title: "New demo message",
        body: '<div class="form-grid">' + ES.common.select("toRole", "Recipient role", [{ value: "teacher", label: "Teacher" }, { value: "student", label: "Student" }], "teacher") +
          ES.common.select("toId", "Recipient", store.state.teachers, store.state.teachers[0].id, { labelKey: "name" }) +
          ui.textInput("subject", "Subject", "", { required: true }) + "</div>" + ui.textarea("body", "Message", "", { rows: 4, required: true }),
        saveLabel: "Send demo message",
        onSave: function (values, form, close) {
          commit(function (state) {
            const recipient = values.toRole === "teacher" ? data.teacher(values.toId) : data.student(values.toId);
            state.messages.push({ id: ES.uid("m"), fromRole: "principal", fromId: "principal", toRole: values.toRole, toId: values.toId, subject: values.subject, body: values.body, sentAt: stamp(), read: false });
            uiState.conversationId = values.toRole + ":" + values.toId;
            data.notify({ title: "New message", message: values.subject + " from Principal Office", type: "Message", role: values.toRole, userId: recipient ? recipient.id : "" });
          }, "Demo message added to conversation history.");
          close(); ES.app.refresh();
        }
      });
      const form = document.getElementById("esModalForm");
      const role = form.querySelector('[name="toRole"]');
      const target = form.querySelector('[name="toId"]');
      role.addEventListener("change", function () {
        const list = role.value === "teacher" ? store.state.teachers : data.activeStudents();
        target.innerHTML = ES.common.options(list, "name", "id").map(function (o) { return '<option value="' + o.value + '">' + ui.esc(o.label) + "</option>"; }).join("");
      });
      role.dispatchEvent(new Event("change"));
    });
    ui.on(root, "[data-msg-reply]", "submit", function (e, form) {
      e.preventDefault();
      if (!uiState.conversationId) return;
      const parts = uiState.conversationId.split(":");
      const values = ui.formValues(form);
      commit(function (state) {
        state.messages.push({ id: ES.uid("m"), fromRole: "principal", fromId: "principal", toRole: parts[0], toId: parts[1], subject: values.subject, body: values.body, sentAt: stamp(), read: false });
      }, "Demo reply added.");
      ES.app.refresh();
    });
  };

  views.notifications = function () {
    const rows = data.notificationsFor("principal", "");
    const body = ui.card({
      title: "Notification center", subtitle: "System and academic alerts for the principal workspace",
      actions: '<button class="btn" data-n-readall><i class="fa-solid fa-envelope-open"></i> Mark all as read</button>',
      body: rows.length ? '<div class="notice-list">' + rows.map(function (n) {
        return '<div class="notice-item' + (n.read ? "" : " unread") + '"><i class="fa-solid ' + (n.read ? "fa-envelope-open" : "fa-envelope") + '"></i>' +
          '<span><strong>' + ui.esc(n.title) + "</strong><small>" + ui.esc(n.message) + "</small><small>" + ui.esc(n.createdAt) + " · " + ui.esc(n.type) + "</small></span>" +
          (n.read ? "" : '<button class="link-btn" data-n-read="' + n.id + '">Mark read</button>') + "</div>";
      }).join("") + "</div>" : ui.empty("No notifications yet.")
    });
    return page("Notifications", "Read and manage workspace notifications", body, "", ["Notifications"]);
  };

  mounts.notifications = function (root) {
    ui.on(root, "[data-n-read]", "click", function (e, el) {
      commit(function (state) { const n = state.notifications.find(function (x) { return x.id === el.getAttribute("data-n-read"); }); if (n) n.read = true; }, "Notification marked as read.");
      ES.app.refresh();
    });
    ui.on(root, "[data-n-readall]", "click", function () {
      commit(function (state) { state.notifications.forEach(function (n) { if (n.role === "principal") n.read = true; }); }, "All notifications marked as read.");
      ES.app.refresh();
    });
  };

  function reportState() {
    if (!uiState.report.departmentId) uiState.report = { departmentId: "", programId: "", academicYearId: "", semesterId: "", sectionId: "", courseId: "", from: "", to: "" };
    return uiState.report;
  }

  views.reports = function () {
    const f = reportState();
    const students = data.activeStudents().filter(function (s) {
      return (!f.departmentId || s.departmentId === f.departmentId) && (!f.programId || s.programId === f.programId) &&
        (!f.academicYearId || s.academicYearId === f.academicYearId) && (!f.semesterId || s.semesterId === f.semesterId) &&
        (!f.sectionId || s.sectionId === f.sectionId);
    });
    const ids = students.map(function (s) { return s.id; });
    const attendance = store.state.attendance.filter(function (a) {
      return (!f.sectionId || a.sectionId === f.sectionId) && (!f.courseId || a.courseId === f.courseId) &&
        (!f.from || a.date >= f.from) && (!f.to || a.date <= f.to);
    });
    const tally = { present: 0, absent: 0, late: 0, leave: 0 };
    attendance.forEach(function (a) { (a.records || []).forEach(function (r) {
      if (ids.indexOf(r.studentId) !== -1 && tally[r.status] !== undefined) tally[r.status]++;
    }); });
    const totalMarks = tally.present + tally.absent + tally.late + tally.leave;
    const countBy = function (collection, key, labelFn) {
      return collection.map(function (item) {
        return { label: labelFn(item), value: students.filter(function (s) { return s[key] === item.id; }).length };
      }).filter(function (x) { return x.value > 0; });
    };
    const byDepartment = countBy(store.state.departments, "departmentId", function (d) { return d.code; });
    const byProgram = countBy(store.state.programs, "programId", function (p) { return p.code; });
    const bySemester = countBy(store.state.semesters, "semesterId", function (s) { return s.number + ""; });
    const bySection = countBy(store.state.sections, "sectionId", function (s) { return s.name; });
    const published = store.state.results.filter(function (r) { return r.status === "Published" && (!f.sectionId || r.sectionId === f.sectionId) && (!f.courseId || r.courseId === f.courseId); });
    const subjectRows = published.map(function (r) {
      const entries = r.entries || [];
      const avg = entries.length ? Math.round(entries.reduce(function (sum, e) { return sum + data.evaluate(e).percentage; }, 0) / entries.length) : 0;
      return { course: (data.course(r.courseId) || {}).code || "—", section: data.sectionLabel(r.sectionId), students: entries.length, average: avg, grade: data.gradeForPercentage(avg).grade };
    });
    const workload = store.state.teachers.map(function (t) {
      return { teacher: t.name, department: (data.department(t.departmentId) || {}).code || "—",
        courses: store.state.teacherAssignments.filter(function (a) { return a.teacherId === t.id; }).length,
        lectures: store.state.timetable.filter(function (x) { return x.teacherId === t.id; }).length };
    }).sort(function (a, b) { return b.courses - a.courses; });
    const body = ui.card({ title: "Reports and analytics", subtitle: "Filters apply to all tables and charts on this page",
      body: '<div class="filter-strip">' +
        ES.common.select("rpDep", "Department", store.state.departments, f.departmentId, { labelKey: "name", placeholder: "All departments" }) +
        ES.common.select("rpProg", "Program", store.state.programs, f.programId, { labelKey: "name", placeholder: "All programs" }) +
        ES.common.select("rpYear", "Academic year", store.state.academicYears, f.academicYearId, { labelKey: "label", placeholder: "All years" }) +
        ES.common.select("rpSem", "Semester", store.state.semesters, f.semesterId, { labelKey: "name", placeholder: "All semesters" }) +
        ES.common.select("rpSec", "Section", store.state.sections, f.sectionId, { labelKey: "name", placeholder: "All sections" }) +
        ES.common.select("rpCourse", "Course", store.state.courses, f.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "All courses" }) +
        ui.textInput("rpFrom", "From date", f.from, { type: "date" }) +
        ui.textInput("rpTo", "To date", f.to, { type: "date" }) +
        "</div>",
    }) +
      '<div class="stats-grid compact-stats">' +
        ui.statCard({ label: "Students in scope", value: students.length, icon: "fa-user-graduate", tone: "blue" }) +
        ui.statCard({ label: "Attendance records", value: attendance.length, icon: "fa-calendar-check", tone: "green" }) +
        ui.statCard({ label: "Present", value: totalMarks ? Math.round((tally.present / totalMarks) * 100) + "%" : "—", icon: "fa-check", tone: "green" }) +
        ui.statCard({ label: "Published results", value: published.length, icon: "fa-file-circle-check", tone: "amber" }) +
      "</div>" +
      '<div class="grid grid-2">' +
        ui.card({ title: "Department-wise students", body: ui.barChart(byDepartment) }) +
        ui.card({ title: "Program-wise students", body: ui.barChart(byProgram) }) +
        ui.card({ title: "Semester-wise students", body: ui.barChart(bySemester) }) +
        ui.card({ title: "Section-wise students", body: ui.barChart(bySection) }) +
      "</div>" +
      '<div class="grid grid-2">' +
        ui.card({ title: "Attendance summary", body: ui.table([
          { label: "Present", render: function () { return tally.present; } }, { label: "Absent", render: function () { return tally.absent; } },
          { label: "Late", render: function () { return tally.late; } }, { label: "Leave", render: function () { return tally.leave; } }
        ], [{}], { compact: true }) }) +
        ui.card({ title: "Subject-wise published results", body: ui.table([
          { label: "Course", key: "course" }, { label: "Section", key: "section" }, { label: "Students", key: "students" },
          { label: "Average", render: function (r) { return r.average + "%"; } }, { label: "Grade", render: function (r) { return ui.badge(r.grade); } }
        ], subjectRows, { compact: true, empty: "No published results in scope." }) }) +
      "</div>" +
      ui.card({ title: "Teacher workload", body: ui.table([
        { label: "Teacher", key: "teacher" }, { label: "Department", key: "department" },
        { label: "Assigned courses", key: "courses" }, { label: "Weekly lectures", key: "lectures" }
      ], workload, { compact: true }) });
    return page("Reports & analytics", "Enrollment, attendance, performance and workload reporting", body, "", ["Reports"]);
  };

  mounts.reports = function (root) {
    [["rpDep", "departmentId"], ["rpProg", "programId"], ["rpYear", "academicYearId"], ["rpSem", "semesterId"], ["rpSec", "sectionId"], ["rpCourse", "courseId"], ["rpFrom", "from"], ["rpTo", "to"]].forEach(function (pair) {
      ui.on(root, "[data-" + pair[0] + "]", "change", function (e, el) { reportState()[pair[1]] = el.value; ES.app.refresh(); });
    });
  };

  views.activity = function () {
    const rows = store.state.activities.filter(function (a) {
      const text = [a.action, a.user, a.related, a.description].join(" ").toLowerCase();
      return (!uiState.activityAction || uiState.activityAction === "All" || a.action === uiState.activityAction) &&
        (!uiState.activitySearch || text.indexOf(uiState.activitySearch.toLowerCase()) !== -1);
    });
    const actions = ["All"].concat(store.state.activities.map(function (a) { return a.action; }).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; }));
    const body = ui.card({
      title: "Activity history", subtitle: "Frontend demo record of actions performed in this workspace",
      body: '<div class="toolbar">' + ui.searchBox(uiState.activitySearch, "Search activity…", "ac-search") +
        ES.common.select("ac-action", "Activity", actions, uiState.activityAction) +
        '<button class="btn" data-ac-export><i class="fa-solid fa-download"></i> Export CSV</button></div>' +
        ui.table([
          { label: "Date", render: function (a) { return ui.esc(a.date || (a.at || "").slice(0, 10)); } },
          { label: "Time", render: function (a) { return ui.esc(a.time || (a.at || "").slice(11)); } },
          { label: "Activity", render: function (a) { return "<strong>" + ui.esc(a.action || a.text) + "</strong>"; } },
          { label: "User", render: function (a) { return ui.esc(a.user || "Demo user"); } },
          { label: "Related record", render: function (a) { return ui.esc(a.related || "—"); } },
          { label: "Description", key: "description" }
        ], rows, { compact: true, empty: "No activity records found." })
    });
    return page("Activity history", "Demo audit interface · not a secure production audit log", body, "", ["Activity"]);
  };

  mounts.activity = function (root) {
    ui.on(root, "[data-ac-search]", "input", function (e, el) { uiState.activitySearch = el.value; ES.app.refresh(); });
    ui.on(root, "[data-ac-action]", "change", function (e, el) { uiState.activityAction = el.value; ES.app.refresh(); });
    ui.on(root, "[data-ac-export]", "click", function () {
      const rows = [["Date", "Time", "Activity", "User", "Related record", "Description"]].concat(store.state.activities.map(function (a) {
        return [a.date, a.time, a.action || a.text, a.user, a.related, a.description];
      }));
      ui.download("edusphere-activity.csv", ui.toCSV(rows));
      ui.toast("Activity history exported.");
    });
  };

  views["import-export"] = function () {
    const preview = uiState.importRows.length ? ui.table([
      { label: "Name", key: "name" }, { label: "Roll number", key: "rollNo" }, { label: "Email", key: "email" },
      { label: "Department", key: "department" }, { label: "Program", key: "program" }, { label: "Semester", key: "semester" }, { label: "Section", key: "section" }
    ], uiState.importRows, { compact: true }) : ui.empty("Choose a CSV file to preview student records.");
    const errors = uiState.importErrors.length ? '<div class="notice notice-warn"><strong>' + uiState.importErrors.length + " issue(s) found</strong><ul>" +
      uiState.importErrors.map(function (err) { return "<li>" + ui.esc(err) + "</li>"; }).join("") + "</ul></div>" : "";
    const body =
      ui.card({ title: "Import students", subtitle: "CSV import with validation, duplicate detection and confirmation",
        body: '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Required columns: name, rollNo, email, department, program, semester, section. Department and program should use codes such as CS and BSCS; semester should be a number such as 3.</div>' +
          '<div class="form-actions"><input type="file" class="control" id="importFile" accept=".csv,text/csv"><button class="btn btn-primary" data-imp-parse><i class="fa-solid fa-eye"></i> Preview file</button></div>' +
          errors + "<h3 class=\"section-subhead\">Preview</h3>" + preview +
          (uiState.importRows.length ? '<div class="form-actions"><button class="btn btn-primary" data-imp-confirm>Confirm import (' + uiState.importRows.length + ")</button>" +
            '<button class="btn" data-imp-clear>Clear preview</button></div>' : "") }) +
      ui.card({ title: "Export academic data", subtitle: "Frontend file exports generated in the browser",
        body: '<div class="export-grid">' +
          [["students", "Student lists", "fa-user-graduate"], ["teachers", "Teacher lists", "fa-chalkboard-user"],
            ["attendance", "Attendance reports", "fa-clipboard-check"], ["results", "Result sheets", "fa-square-poll-vertical"],
            ["courses", "Academic reports", "fa-book-open"]].map(function (x) {
            return '<button class="export-tile" data-exp="' + x[0] + '"><i class="fa-solid ' + x[2] + '"></i><strong>' + x[1] + "</strong><small>Download CSV</small></button>";
          }).join("") + "</div><p class=\"modal-note\">PDF and print documents open in a new window and use the browser print dialog.</p>" });
    return page("Import & export", "Academic data exchange for the frontend demo", body, "", ["Import & Export"]);
  };

  mounts["import-export"] = function (root) {
    ui.on(root, "[data-imp-parse]", "click", function () {
      const input = document.getElementById("importFile");
      const file = input.files[0];
      if (!file) { ui.toast("Choose a CSV file first.", "error"); return; }
      const reader = new FileReader();
      reader.onload = function () {
        const rows = ui.parseCSV(reader.result);
        if (rows.length < 2) { ui.toast("The file has no data rows.", "error"); return; }
        const headers = rows[0].map(function (h) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); });
        const required = ["name", "rollno", "email", "department", "program", "semester", "section"];
        const missing = required.filter(function (r) { return headers.indexOf(r) === -1; });
        if (missing.length) { uiState.importRows = []; uiState.importErrors = ["Missing required column(s): " + missing.join(", ")]; ES.app.refresh(); return; }
        const errors = [];
        const parsed = [];
        const seen = {};
        rows.slice(1).forEach(function (row, index) {
          const obj = {};
          headers.forEach(function (h, i) { obj[h] = row[i] || ""; });
          const line = "Row " + (index + 2);
          if (!obj.name || !obj.rollno || !obj.email) errors.push(line + ": name, rollNo and email are required.");
          if (seen[obj.rollno] || (!data.uniqueRoll(obj.rollno) && !data.student(obj.rollno))) errors.push(line + ": duplicate roll number " + obj.rollno + ".");
          seen[obj.rollno] = true;
          const department = store.state.departments.find(function (d) { return d.code.toLowerCase() === obj.department.toLowerCase() || d.name.toLowerCase() === obj.department.toLowerCase(); });
          const program = store.state.programs.find(function (p) { return p.code.toLowerCase() === obj.program.toLowerCase() || p.name.toLowerCase() === obj.program.toLowerCase(); });
          const semester = store.state.semesters.find(function (s) { return Number(s.number) === Number(obj.semester); });
          const section = store.state.sections.find(function (s) { return s.name.toLowerCase() === obj.section.toLowerCase() && (!program || s.programId === program.id) && (!semester || s.semesterId === semester.id); });
          if (!department) errors.push(line + ": unknown department " + obj.department + ".");
          if (!program) errors.push(line + ": unknown program " + obj.program + ".");
          if (!semester) errors.push(line + ": unknown semester " + obj.semester + ".");
          if (!section) errors.push(line + ": section not found for this program and semester.");
          parsed.push({ name: obj.name, rollNo: obj.rollno, email: obj.email, phone: obj.phone || "", fatherName: obj.fathername || "—",
            department: department ? department.name : obj.department, program: program ? program.code : obj.program,
            semester: semester ? semester.name : obj.semester, section: section ? section.name : obj.section,
            _refs: { departmentId: department && department.id, programId: program && program.id, semesterId: semester && semester.id, sectionId: section && section.id } });
        });
        uiState.importRows = parsed;
        uiState.importErrors = errors;
        ES.app.refresh();
      };
      reader.readAsText(file);
    });
    ui.on(root, "[data-imp-clear]", "click", function () { uiState.importRows = []; uiState.importErrors = []; ES.app.refresh(); });
    ui.on(root, "[data-imp-confirm]", "click", function () {
      if (uiState.importErrors.length) { ui.toast("Resolve validation issues before importing.", "error"); return; }
      ui.confirm({ title: "Confirm student import", message: "Import " + uiState.importRows.length + " student(s) into the demo registry?", onConfirm: function () {
        commit(function (state) {
          uiState.importRows.forEach(function (row) {
            const refs = row._refs;
            state.students.push({
              id: ES.uid("s"), rollNo: row.rollNo, name: row.name, email: row.email, phone: row.phone,
              fatherName: row.fatherName, gender: "", dob: "", photo: "", address: "",
              departmentId: refs.departmentId, programId: refs.programId, semesterId: refs.semesterId,
              sectionId: refs.sectionId, academicYearId: (store.state.academicYears[0] || {}).id || "",
              admissionDate: new Date().toISOString().slice(0, 10), status: "Active", deleted: false, history: []
            });
          });
        }, uiState.importRows.length + " student(s) imported.", { action: "Students Imported", related: uiState.importRows.length + " records" });
        uiState.importRows = []; ES.app.refresh();
      } });
    });
    ui.on(root, "[data-exp]", "click", function (e, el) {
      const type = el.getAttribute("data-exp");
      let rows = [];
      if (type === "students") {
        rows = [["Roll No", "Name", "Father Name", "Email", "Phone", "Department", "Program", "Semester", "Section", "Status"]].concat(data.activeStudents().map(function (s) {
          return [s.rollNo, s.name, s.fatherName, s.email, s.phone, (data.department(s.departmentId) || {}).code, data.programLabel(s.programId), data.semesterLabel(s.semesterId), data.sectionLabel(s.sectionId), s.status];
        }));
      }
      if (type === "teachers") {
        rows = [["Employee ID", "Name", "Email", "Phone", "Department", "Designation"]].concat(store.state.teachers.map(function (t) {
          return [t.employeeId, t.name, t.email, t.phone, (data.department(t.departmentId) || {}).code, t.designation];
        }));
      }
      if (type === "attendance") {
        rows = [["Date", "Lecture", "Section", "Course", "Student Roll", "Student", "Status"]];
        store.state.attendance.forEach(function (a) {
          (a.records || []).forEach(function (r) {
            const s = data.student(r.studentId);
            rows.push([a.date, a.lecture, data.sectionLabel(a.sectionId), (data.course(a.courseId) || {}).code, s ? s.rollNo : "", s ? s.name : "", r.status]);
          });
        });
      }
      if (type === "results") {
        rows = [["Section", "Course", "Roll No", "Student", "Assignment", "Quiz", "Midterm", "Final", "Total", "Percentage", "Grade", "GPA", "Status"]];
        store.state.results.forEach(function (r) {
          const calcEntry = r.entries || [];
          calcEntry.forEach(function (entry) {
            const s = data.student(entry.studentId);
            const calc = data.evaluate(entry);
            rows.push([data.sectionLabel(r.sectionId, true), (data.course(r.courseId) || {}).code, s ? s.rollNo : "", s ? s.name : "", entry.assignment, entry.quiz, entry.midterm, entry.final, calc.total, calc.percentage, calc.grade, calc.gpa.toFixed(2), r.status]);
          });
        });
      }
      if (type === "courses") {
        rows = [["Code", "Title", "Department", "Program", "Semester", "Credits"]].concat(store.state.courses.map(function (c) {
          return [c.code, c.name, (data.department(c.departmentId) || {}).code, data.programLabel(c.programId), data.semesterLabel(c.semesterId), c.credits];
        }));
      }
      ui.download("edusphere-" + type + ".csv", ui.toCSV(rows));
      ui.toast("Export downloaded.");
    });
  };

  views.settings = function () {
    const s = data.settings();
    const theme = localStorage.getItem("edusphere.theme") || s.theme || "light";
    const body =
      ui.card({ title: "Institution profile", subtitle: "Displayed on the workspace and printed documents",
        body: '<form data-set-form="institution"><div class="form-grid">' +
          ui.textInput("name", "Institution name", s.institution.name, { required: true }) +
          ui.textInput("shortName", "Short name", s.institution.shortName) +
          '<div class="span-2">' + ui.textInput("address", "Address", s.institution.address) + "</div>" +
          ui.textInput("email", "Email", s.institution.email, { type: "email" }) +
          ui.textInput("phone", "Phone", s.institution.phone) +
          ui.textInput("currentTerm", "Current term", s.institution.currentTerm) +
          "</div><div class=\"form-actions\"><button class=\"btn btn-primary\" type=\"submit\">Save institution profile</button></div></form>" }) +
      ui.card({ title: "Academic settings", subtitle: "Academic year and attendance rules",
        body: '<form data-set-form="academic"><div class="form-grid">' +
          ui.textInput("academicYearLabel", "Academic year label", s.academicYearLabel) +
          ui.textInput("attendanceThreshold", "Low attendance threshold (%)", s.attendanceThreshold, { type: "number", min: 1, max: 100, required: true }) +
          ui.textInput("maxSemester", "Maximum semesters", s.maxSemester, { type: "number", min: 1, max: 20 }) +
          "</div><p class=\"field-hint\">Students below the configured percentage are flagged in attendance reports.</p>" +
          '<div class="form-actions"><button class="btn btn-primary" type="submit">Save academic settings</button></div></form>' }) +
      ui.card({ title: "Grading criteria", subtitle: "Maximum marks and grade boundaries used for automatic calculations",
        body: '<form data-set-form="grading"><div class="form-grid">' +
          ui.textInput("assignment", "Assignment maximum", s.grading.maximumMarks.assignment, { type: "number", min: 1, required: true }) +
          ui.textInput("quiz", "Quiz maximum", s.grading.maximumMarks.quiz, { type: "number", min: 1, required: true }) +
          ui.textInput("midterm", "Midterm maximum", s.grading.maximumMarks.midterm, { type: "number", min: 1, required: true }) +
          ui.textInput("final", "Final maximum", s.grading.maximumMarks.final, { type: "number", min: 1, required: true }) +
          "</div><h3 class=\"section-subhead\">Grade boundaries</h3><div class=\"grade-table\">" +
          '<div class="grade-row grade-head"><span>Minimum %</span><span>Grade</span><span>GPA</span></div>' +
          s.grading.thresholds.map(function (t, i) {
            return '<div class="grade-row">' + ui.textInput("min" + i, "Minimum %", t.min, { type: "number", min: 0, max: 100 }) +
              ui.textInput("grade" + i, "Grade", t.grade) + ui.textInput("gpa" + i, "GPA", t.gpa, { type: "number", min: 0, max: 4, step: "0.1" }) + "</div>";
          }).join("") + '</div><div class="form-actions"><button class="btn btn-primary" type="submit">Save grading criteria</button></div></form>' }) +
      ui.card({ title: "Appearance and notifications", subtitle: "Theme and notification preferences for the demo workspace",
        body: '<div class="form-grid">' +
          ES.common.select("themeSelect", "Theme", [{ value: "light", label: "Light mode" }, { value: "dark", label: "Dark mode" }], theme) +
          "</div><h3 class=\"section-subhead\">Notification preferences</h3><div class=\"preference-grid\">" +
          Object.keys(s.notificationPreferences).map(function (key) {
            return '<label class="check-row"><input type="checkbox" data-pref="' + key + '"' + (s.notificationPreferences[key] ? " checked" : "") + "><span>" + ui.esc(key.charAt(0).toUpperCase() + key.slice(1)) + "</span></label>";
          }).join("") + '</div><div class="form-actions"><button class="btn btn-primary" data-save-prefs>Save preferences</button></div>' }) +
      ui.card({ title: "Demo data controls", subtitle: "Frontend state is stored in browser local storage only",
        body: '<div class="notice notice-warn"><i class="fa-solid fa-triangle-exclamation"></i>Resetting will restore the seeded demo dataset and discard changes made in this browser.</div>' +
          '<button class="btn btn-danger" data-reset-demo><i class="fa-solid fa-rotate-left"></i> Reset demo data</button>' });
    return page("Settings", "Institution profile, academic rules, grading and personalization", body, "", ["Settings"]);
  };

  mounts.settings = function (root) {
    ui.on(root, '[data-set-form="institution"]', "submit", function (e, form) {
      e.preventDefault();
      const values = ui.formValues(form);
      commit(function (state) { Object.assign(state.settings.institution, values); }, "Institution profile saved.", { action: "Settings Updated", related: "Institution profile" });
      ES.app.refresh();
    });
    ui.on(root, '[data-set-form="academic"]', "submit", function (e, form) {
      e.preventDefault();
      const values = ui.formValues(form);
      commit(function (state) {
        state.settings.academicYearLabel = values.academicYearLabel;
        state.settings.attendanceThreshold = Number(values.attendanceThreshold);
        state.settings.maxSemester = Number(values.maxSemester);
      }, "Academic settings saved.", { action: "Settings Updated", related: "Academic settings" });
      ES.app.refresh();
    });
    ui.on(root, '[data-set-form="grading"]', "submit", function (e, form) {
      e.preventDefault();
      const values = ui.formValues(form);
      const thresholds = data.settings().grading.thresholds.map(function (t, i) {
        return { min: Number(values["min" + i]), grade: values["grade" + i], gpa: Number(values["gpa" + i]) };
      }).sort(function (a, b) { return b.min - a.min; });
      commit(function (state) {
        state.settings.grading.maximumMarks = {
          assignment: Number(values.assignment), quiz: Number(values.quiz), midterm: Number(values.midterm), final: Number(values.final)
        };
        state.settings.grading.thresholds = thresholds;
      }, "Grading criteria saved.", { action: "Grading Criteria Updated", related: "Result settings" });
      ES.app.refresh();
    });
    ui.on(root, "[data-themeSelect]", "change", function (e, el) { ES.app.applyTheme(el.value); ui.toast("Theme updated."); });
    ui.on(root, "[data-save-prefs]", "click", function () {
      commit(function (state) {
        root.querySelectorAll("[data-pref]").forEach(function (box) { state.settings.notificationPreferences[box.getAttribute("data-pref")] = box.checked; });
      }, "Notification preferences saved.", { action: "Settings Updated", related: "Notification preferences" });
    });
    ui.on(root, "[data-reset-demo]", "click", function () {
      ui.confirm({ title: "Reset demo data", saveLabel: "Reset data", message: "Restore the original seeded demo dataset? Your local changes will be lost.", onConfirm: function () {
        ES.store.reset(); localStorage.removeItem("edusphere.demo.role"); ui.toast("Demo data reset."); location.hash = "#/principal/overview"; ES.app.refresh();
      } });
    });
  };
})();
