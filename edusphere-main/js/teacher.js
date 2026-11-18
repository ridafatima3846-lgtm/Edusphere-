(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.teacher = ES.views.teacher || {};
  const mounts = ES.mounts.teacher = ES.mounts.teacher || {};
  const state = { attendance: { marks: {} }, results: { entries: {} }, assignmentSearch: "" };

  function teacherId() {
    const ctx = ES.app.context("teacher");
    return ctx.user ? ctx.user.id : (store.state.teachers[0] || {}).id;
  }
  function sections() { return data.teacherSectionIds(teacherId()); }
  function assignments(sectionId) {
    return data.teacherAssignmentsFor(teacherId(), sectionId);
  }
  function assignedCourses(sectionId) {
    const ids = assignments(sectionId).map(function (a) { return a.courseId; });
    return store.state.courses.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }
  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({ title: title, subtitle: subtitle, actions: actions || "", breadcrumb: ["Teacher", "Workspace"].concat(crumbs || [title]) }) + body;
  }
  function commit(fn, message, audit) {
    store.update(function (s) {
      fn(s);
      if (audit) data.audit(audit.action, data.demoRoleName(), audit.related || "", audit.description || audit.action, audit.icon);
    });
    if (message) ui.toast(message);
  }
  function stamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }
  function today() { return new Date().toISOString().slice(0, 10); }

  views.overview = function () {
    const t = data.teacher(teacherId()) || {};
    const secs = sections();
    const courses = assignments().filter(function (a, i, arr) { return arr.findIndex(function (x) { return x.courseId === a.courseId; }) === i; });
    const timetable = data.timetableFor(null, teacherId()).filter(function (x) {
      const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
      return x.day === day;
    }).slice(0, 5);
    const pending = store.state.assignments.filter(function (a) { return a.teacherId === teacherId() && (a.submissions || []).length < data.studentsInSection(a.sectionId).length; });
    const attendance = data.attendanceFor(null).filter(function (a) { return a.teacherId === teacherId(); });
    const sectionChart = secs.map(function (id) {
      const s = data.section(id);
      return { label: s ? s.name : "—", value: data.studentsInSection(id).length };
    });
    const body = '<div class="stats-grid">' +
      ui.statCard({ label: "Assigned sections", value: secs.length, icon: "fa-chalkboard", tone: "blue" }) +
      ui.statCard({ label: "Assigned courses", value: courses.length, icon: "fa-book-open", tone: "teal" }) +
      ui.statCard({ label: "Lectures today", value: timetable.length, icon: "fa-clock", tone: "slate" }) +
      ui.statCard({ label: "Pending submissions", value: pending.length, icon: "fa-file-lines", tone: "amber" }) +
      "</div><div class=\"grid grid-2-1\">" +
      ui.card({ title: "Today's timetable", subtitle: new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
        body: ui.table([
          { label: "Time", render: function (x) { return x.start + "–" + x.end; } },
          { label: "Course", render: function (x) { return ui.esc((data.course(x.courseId) || {}).code || "—"); } },
          { label: "Section", render: function (x) { return ui.esc(data.sectionLabel(x.sectionId)); } },
          { label: "Room", key: "room" }
        ], timetable, { compact: true, empty: "No lectures scheduled for today." }) }) +
      ui.card({ title: "Students by section", body: ui.barChart(sectionChart) }) +
      "</div><div class=\"grid grid-2\">" +
      ui.card({ title: "Assigned classes", subtitle: "Open a section to mark attendance or prepare results",
        body: secs.length ? '<div class="class-list">' + secs.map(function (id) {
          const summary = data.sectionSummary(id);
          return '<div class="class-list-item"><div><strong>' + ui.esc(data.sectionLabel(id, true)) + "</strong><small>" + summary.students + " students · " + summary.courses + " courses</small></div>" +
            '<div class="row-actions"><button class="btn btn-sm btn-primary" data-go-att="' + id + '">Attendance</button>' +
            '<button class="btn btn-sm" data-go-res="' + id + '">Results</button></div></div>';
        }).join("") + "</div>" : ui.empty("No sections assigned to you yet.") }) +
      ui.card({ title: "Recent attendance submitted", body: ui.table([
        { label: "Date", render: function (a) { return ui.esc(ui.fmtDate(a.date)); } },
        { label: "Course", render: function (a) { return ui.esc((data.course(a.courseId) || {}).code || "—"); } },
        { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId)); } },
        { label: "Lecture", key: "lecture" }
      ], attendance.slice(0, 6), { compact: true, empty: "No attendance submitted yet." }) }) +
      "</div>" + ui.card({ title: "Important announcements", body: '<ul class="list-plain">' +
        store.state.announcements.slice(0, 4).map(function (a) { return '<li><i class="fa-solid fa-bullhorn"></i><div><strong>' + ui.esc(a.title) + "</strong><small>" + ui.esc(a.message) + "</small></div></li>"; }).join("") + "</ul>" });
    return page("Teacher overview", "Welcome back, " + (t.name || "Teacher") + " · " + data.settings().institution.currentTerm, body,
      '<button class="btn btn-primary" data-nav="attendance"><i class="fa-solid fa-clipboard-check"></i> Mark attendance</button>', ["Overview"]);
  };
  mounts.overview = function (root) {
    ui.on(root, "[data-go-att]", "click", function (e, el) {
      state.attendance.sectionId = el.getAttribute("data-go-att"); ES.app.go("attendance");
    });
    ui.on(root, "[data-go-res]", "click", function (e, el) {
      state.results.sectionId = el.getAttribute("data-go-res"); ES.app.go("results");
    });
  };

  views.courses = function () {
    const rows = assignments().map(function (a) {
      const c = data.course(a.courseId) || {};
      return { assignment: a, course: c, students: data.studentsInSection(a.sectionId).length };
    });
    const body = ui.card({ title: "My assigned courses", subtitle: "Only courses and sections assigned to you are shown",
      body: ui.table([
        { label: "Course", render: function (r) { return "<strong>" + ui.esc(r.course.code || "—") + "</strong><small class=\"cell-note\">" + ui.esc(r.course.name || "") + "</small>"; } },
        { label: "Section", render: function (r) { return ui.esc(data.sectionLabel(r.assignment.sectionId, true)); } },
        { label: "Semester", render: function (r) { return ui.esc(data.semesterLabel(r.assignment.semesterId)); } },
        { label: "Credits", render: function (r) { return ui.esc(r.course.credits || "—"); } },
        { label: "Students", render: function (r) { return r.students; } },
        { label: "Actions", render: function (r) { return '<button class="link-btn" data-course-view="' + r.course.id + '" data-section="' + r.assignment.sectionId + '">View class</button>'; } }
      ], rows, { compact: true, empty: "No courses are assigned to you." }) });
    return page("My courses", "Assigned courses and sections", body, "", ["Courses"]);
  };
  mounts.courses = function (root) {
    ui.on(root, "[data-course-view]", "click", function (e, el) {
      const course = data.course(el.getAttribute("data-course-view"));
      const sectionId = el.getAttribute("data-section");
      const students = data.studentsInSection(sectionId);
      ui.openModal({ title: (course ? course.code + " · " + course.name : "Course") + " — " + data.sectionLabel(sectionId), size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: (course ? '<p class="modal-note">' + ui.esc(course.description || "No description provided.") + "</p>" : "") +
          ui.table([{ label: "Roll number", render: function (s) { return ui.esc(s.rollNo); } }, { label: "Student", render: function (s) { return ui.esc(s.name); } },
            { label: "Email", render: function (s) { return ui.esc(s.email); } }], students, { compact: true }) });
    });
  };

  views.students = function () {
    const secs = sections();
    if (!state.studentSection || secs.indexOf(state.studentSection) === -1) state.studentSection = secs[0] || "";
    const rows = data.studentsInSection(state.studentSection);
    const body = ui.card({ title: "My students", subtitle: "Rosters are limited to your assigned sections",
      body: '<div class="toolbar">' + ES.common.select("tsSection", "Section", secs.map(function (id) { return { id: id, name: data.sectionLabel(id, true) }; }), state.studentSection, { labelKey: "name", placeholder: "All assigned sections" }) + "</div>" +
        ui.table(ES.common.studentColumns(function (s) {
          return ES.common.actions([{ icon: "fa-eye", title: "View profile", attrs: 'data-student-view="' + s.id + '"' }]);
        }), state.studentSection ? rows : secs.reduce(function (arr, id) { return arr.concat(data.studentsInSection(id)); }, []), { compact: true, empty: "No students in assigned sections." }) });
    return page("My students", "Student rosters for assigned classes", body, "", ["Students"]);
  };
  mounts.students = function (root) {
    ui.on(root, "[data-tsSection]", "change", function (e, el) { state.studentSection = el.value; ES.app.refresh(); });
    ui.on(root, "[data-student-view]", "click", function (e, el) {
      const s = data.student(el.getAttribute("data-student-view"));
      if (!s) return;
      const attendance = data.attendanceStats(s.id);
      ui.openModal({ title: "Student profile · " + s.name, size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: '<div class="profile-modal">' + ES.common.person(s.name, s.rollNo, s.photo) +
          '<div class="detail-grid">' + [["Roll number", s.rollNo], ["Email", s.email], ["Phone", s.phone || "—"], ["Section", data.sectionLabel(s.sectionId, true)], ["Semester", data.semesterLabel(s.semesterId)], ["Attendance", attendance.percentage + "%"]].map(function (r) {
            return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1]) + "</strong></div>";
          }).join("") + "</div></div>" });
    });
  };

  views.timetable = function () {
    const rows = data.timetableFor(null, teacherId());
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const body = ui.card({ title: "My timetable", subtitle: "Lectures assigned to you",
      body: '<div class="timetable-grid">' + days.map(function (day) {
        const list = rows.filter(function (r) { return r.day === day; });
        return '<div class="timetable-day"><h3>' + day + "</h3>" + (list.length ? list.map(function (r) {
          return '<div class="timetable-entry"><div class="tt-time">' + r.start + "–" + r.end + "</div><strong>" + ui.esc((data.course(r.courseId) || {}).code || "—") + "</strong>" +
            "<span>" + ui.esc((data.course(r.courseId) || {}).name || "") + "</span><small>" + ui.esc(data.sectionLabel(r.sectionId)) + " · " + ui.esc(r.room || "") + "</small></div>";
        }).join("") : '<div class="tt-empty">No lectures</div>') + "</div>";
      }).join("") + "</div>" });
    return page("My timetable", "Weekly teaching schedule", body, "", ["Timetable"]);
  };

  const att = state.attendance;
  function attCourses() { return assignedCourses(att.sectionId); }
  function duplicateAttendance() {
    return store.state.attendance.find(function (a) {
      return a.sectionId === att.sectionId && a.courseId === att.courseId && a.date === att.date && a.lecture === att.lecture;
    });
  }
  function attendanceRowHTML() {
    const students = data.studentsInSection(att.sectionId);
    const rows = students.map(function (s) {
      const status = att.marks[s.id] || "Present";
      return { student: s, status: status };
    });
    return ui.table([
      { label: "Roll number", render: function (r) { return "<strong>" + ui.esc(r.student.rollNo) + "</strong>"; } },
      { label: "Student", render: function (r) { return ES.common.person(r.student.name, r.student.email, r.student.photo); } },
      { label: "Attendance status", render: function (r) {
        return '<div class="status-picker">' + ["Present", "Absent", "Late", "Leave"].map(function (status) {
          const cls = status.toLowerCase();
          return '<button type="button" class="' + (r.status === status ? "active " + cls : "") + '" data-att-mark="' + r.student.id + '" data-status="' + status + '">' + status + "</button>";
        }).join("") + "</div>";
      } }
    ], rows, { compact: true, empty: "No students in this section." });
  }

  views.attendance = function () {
    const secs = sections();
    if (!att.sectionId || secs.indexOf(att.sectionId) === -1) att.sectionId = secs[0] || "";
    const courses = attCourses();
    if (!courses.some(function (c) { return c.id === att.courseId; })) att.courseId = courses[0] ? courses[0].id : "";
    att.date = att.date || today();
    att.lecture = att.lecture || "Lecture 1";
    const duplicate = duplicateAttendance();
    const body = ui.card({ title: "Mark lecture attendance", subtitle: "Select class, section, course, date and lecture before recording attendance",
      body: '<div class="filter-strip">' +
        ES.common.select("atSection", "Assigned section", secs.map(function (id) { return { id: id, name: data.sectionLabel(id, true) }; }), att.sectionId, { labelKey: "name" }) +
        ES.common.select("atCourse", "Course", courses.map(function (c) { return { id: c.id, name: c.code + " · " + c.name }; }), att.courseId, { labelKey: "name" }) +
        ui.textInput("atDate", "Date", att.date, { type: "date" }) +
        ui.textInput("atLecture", "Lecture", att.lecture, { placeholder: "Lecture 1", required: true }) +
        '<div class="field"><span class="field-label">&nbsp;</span><button class="btn btn-primary" data-att-submit><i class="fa-solid fa-check"></i> Submit attendance</button></div>' +
        "</div>" +
        (duplicate ? '<div class="notice notice-lock"><i class="fa-solid fa-lock"></i>Attendance for this section, course, date and lecture was already submitted on ' + ui.esc(duplicate.submittedAt) + '. Open <button class="link-btn" data-nav="attendance-history">Attendance History</button> to view it.</div>' : "") +
        '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Students not marked explicitly remain Present. Submitted records become read-only.</div>' +
        '<div id="attendanceTableHost">' + attendanceRowHTML() + "</div>" });
    return page("Mark attendance", "Lecture-wise attendance for your assigned classes", body, "", ["Attendance"]);
  };
  mounts.attendance = function (root) {
    ui.on(root, "[data-atSection]", "change", function (e, el) { att.sectionId = el.value; att.courseId = ""; att.marks = {}; ES.app.refresh(); });
    ui.on(root, "[data-atCourse]", "change", function (e, el) { att.courseId = el.value; att.marks = {}; ES.app.refresh(); });
    ui.on(root, "[data-atDate]", "change", function (e, el) { att.date = el.value; ES.app.refresh(); });
    ui.on(root, "[data-atLecture]", "input", function (e, el) { att.lecture = el.value; });
    ui.on(root, "[data-att-mark]", "click", function (e, el) {
      const sid = el.getAttribute("data-att-mark");
      att.marks[sid] = el.getAttribute("data-status");
      const host = document.getElementById("attendanceTableHost");
      if (host) host.innerHTML = attendanceRowHTML();
    });
    ui.on(root, "[data-att-submit]", "click", function () {
      if (!att.sectionId || !att.courseId || !att.date || !att.lecture.trim()) { ui.toast("Complete the lecture selection first.", "error"); return; }
      if (duplicateAttendance()) { ui.toast("Duplicate attendance is not allowed for this lecture.", "error"); return; }
      const students = data.studentsInSection(att.sectionId);
      if (!students.length) { ui.toast("This section has no students.", "error"); return; }
      ui.confirm({ title: "Submit attendance", saveLabel: "Submit attendance", size: "modal-lg",
        body: '<p class="confirm-text">Submit attendance for <strong>' + ui.esc(data.sectionLabel(att.sectionId, true)) + "</strong> · " + ui.esc((data.course(att.courseId) || {}).code) + " · " + ui.esc(ui.fmtDate(att.date)) + " · " + ui.esc(att.lecture) + "?</p>" +
          '<div class="summary-row"><span>Present</span><strong>' + students.filter(function (s) { return (att.marks[s.id] || "Present") === "Present"; }).length + "</strong>" +
          "<span>Absent</span><strong>" + students.filter(function (s) { return att.marks[s.id] === "Absent"; }).length + "</strong>" +
          "<span>Late</span><strong>" + students.filter(function (s) { return att.marks[s.id] === "Late"; }).length + "</strong>" +
          "<span>Leave</span><strong>" + students.filter(function (s) { return att.marks[s.id] === "Leave"; }).length + "</strong></div>",
        onConfirm: function () {
          commit(function (s) {
            s.attendance.push({
              id: ES.uid("att"), sectionId: att.sectionId, courseId: att.courseId, date: att.date,
              lecture: att.lecture.trim(), teacherId: teacherId(), submittedAt: stamp(), locked: true,
              records: students.map(function (student) { return { studentId: student.id, status: att.marks[student.id] || "Present" }; })
            });
            const absent = students.filter(function (student) { return att.marks[student.id] === "Absent"; });
            absent.forEach(function (student) {
              data.notify({ title: "Attendance marked absent", message: att.lecture + " · " + ui.fmtDate(att.date), type: "Attendance Warning", role: "student", userId: student.id });
            });
          }, "Attendance submitted.", { action: "Attendance Submitted", related: data.sectionLabel(att.sectionId), description: att.lecture + " · " + ui.fmtDate(att.date) });
          att.marks = {}; ES.app.refresh();
        } });
    });
  };

  views["attendance-history"] = function () {
    const secs = sections();
    const rows = data.attendanceFor(null).filter(function (a) { return a.teacherId === teacherId() && secs.indexOf(a.sectionId) !== -1; });
    const body = ui.card({ title: "Attendance history", subtitle: "Previously submitted lectures are read-only",
      body: ui.table([
        { label: "Date", render: function (a) { return ui.esc(ui.fmtDate(a.date)); } },
        { label: "Lecture", key: "lecture" },
        { label: "Course", render: function (a) { return ui.esc((data.course(a.courseId) || {}).code || "—"); } },
        { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId)); } },
        { label: "Students", render: function (a) { return (a.records || []).length; } },
        { label: "Submitted", key: "submittedAt" },
        { label: "Actions", render: function (a) { return ES.common.actions([
          { icon: "fa-eye", title: "View sheet", attrs: 'data-hist-view="' + a.id + '"' },
          { icon: "fa-file-circle-question", title: "Request correction", attrs: 'data-hist-correct="' + a.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No attendance history available." }) });
    return page("Attendance history", "Submitted lecture records and correction requests", body, "", ["Attendance"]);
  };

  mounts["attendance-history"] = function (root) {
    ui.on(root, "[data-hist-view]", "click", function (e, el) {
      const record = store.state.attendance.find(function (a) { return a.id === el.getAttribute("data-hist-view"); });
      const rows = (record.records || []).map(function (r) {
        const s = data.student(r.studentId);
        return { roll: s ? s.rollNo : "—", name: s ? s.name : "—", status: r.status };
      });
      ui.openModal({ title: "Attendance sheet · " + ui.fmtDate(record.date), size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: '<div class="notice notice-lock"><i class="fa-solid fa-lock"></i>This record is locked and cannot be edited. Submit a correction request instead.</div>' +
          ui.table([{ label: "Roll number", key: "roll" }, { label: "Student", key: "name" }, { label: "Status", render: function (r) { return ui.badge(r.status); } }], rows, { compact: true }) });
    });
    ui.on(root, "[data-hist-correct]", "click", function (e, el) {
      const record = store.state.attendance.find(function (a) { return a.id === el.getAttribute("data-hist-correct"); });
      const students = data.studentsInSection(record.sectionId);
      ui.openModal({ title: "Request attendance correction", size: "modal-lg",
        body: '<div class="form-grid">' + ES.common.select("studentId", "Student", students, students[0] && students[0].id, { labelKey: function (s) { return s.rollNo + " · " + s.name; } }) +
          ES.common.select("proposedStatus", "Correct status", ["Present", "Absent", "Late", "Leave"], "Present") +
          '<div class="span-2">' + ui.textarea("reason", "Reason for correction", "", { rows: 3, required: true }) + "</div></div>",
        saveLabel: "Send request",
        onSave: function (values, form, close) {
          commit(function (s) {
            s.correctionRequests.push({ id: ES.uid("cr"), attendanceId: record.id, studentId: values.studentId,
              requestedBy: teacherId(), reason: values.reason, status: "Pending", requestedAt: stamp(),
              reviewedBy: "", reviewRemarks: "", reviewedAt: "", proposedStatus: values.proposedStatus });
          }, "Correction request sent to principal.", { action: "Correction Request Submitted", related: data.sectionLabel(record.sectionId) });
          close(); ES.app.refresh();
        }
      });
    });
  };

  views.corrections = function () {
    const rows = store.state.correctionRequests.filter(function (r) { return r.requestedBy === teacherId(); });
    const body = ui.card({ title: "Correction requests", subtitle: "Status of attendance correction requests sent to the principal",
      body: ui.table([
        { label: "Student", render: function (r) { const s = data.student(r.studentId); return s ? s.name + " (" + s.rollNo + ")" : "—"; } },
        { label: "Lecture", render: function (r) { const a = store.state.attendance.find(function (x) { return x.id === r.attendanceId; }); return a ? a.lecture + " · " + ui.fmtDate(a.date) : "—"; } },
        { label: "Requested status", key: "proposedStatus" },
        { label: "Reason", key: "reason" },
        { label: "Status", render: function (r) { return ui.badge(r.status); } },
        { label: "Review remarks", render: function (r) { return ui.esc(r.reviewRemarks || "—"); } }
      ], rows, { compact: true, empty: "No correction requests submitted." }) });
    return page("Correction requests", "Review outcomes for locked attendance records", body, "", ["Attendance"]);
  };

  views.assignments = function () {
    const rows = store.state.assignments.filter(function (a) { return a.teacherId === teacherId(); });
    const body = ui.card({ title: "My assignments", subtitle: "Create assignments and grade student submissions",
      actions: '<button class="btn btn-primary" data-ta-action="add"><i class="fa-solid fa-plus"></i> Create assignment</button>',
      body: ui.table([
        { label: "Title", render: function (a) { return "<strong>" + ui.esc(a.title) + "</strong><small class=\"cell-note\">" + ui.esc(a.description || "") + "</small>"; } },
        { label: "Course", render: function (a) { return ui.esc((data.course(a.courseId) || {}).code || "—"); } },
        { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId)); } },
        { label: "Deadline", render: function (a) { return ui.esc(ui.fmtDate(a.dueDate)); } },
        { label: "Submissions", render: function (a) { return (a.submissions || []).length + " / " + data.studentsInSection(a.sectionId).length; } },
        { label: "Actions", render: function (a) { return ES.common.actions([
          { icon: "fa-eye", title: "View submissions", attrs: 'data-ta-action="view" data-id="' + a.id + '"' },
          { icon: "fa-pen", title: "Edit", attrs: 'data-ta-action="edit" data-id="' + a.id + '"' },
          { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-ta-action="delete" data-id="' + a.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No assignments created yet." }) });
    return page("Assignments", "Assignment management for assigned sections", body, "", ["Assignments"]);
  };
  mounts.assignments = function (root) {
    function open(a) {
      ui.openModal({ title: a ? "Edit assignment" : "Create assignment", size: "modal-lg",
        body: '<div class="form-grid">' + ui.textInput("title", "Title", a && a.title, { required: true }) +
          ES.common.select("courseId", "Assigned course", assignedCourses(), a && a.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
          ES.common.select("sectionId", "Assigned section", sections().map(function (id) { return { id: id, name: data.sectionLabel(id, true) }; }), a && a.sectionId, { labelKey: "name", placeholder: "Select section", required: true }) +
          ui.textInput("dueDate", "Deadline", a && a.dueDate, { type: "date", required: true }) +
          ui.textInput("marks", "Total marks", a && a.marks || 10, { type: "number", min: 1, required: true }) +
          '<div class="span-2">' + ui.textarea("description", "Description", a && a.description, { rows: 3 }) + "</div></div>",
        saveLabel: a ? "Save changes" : "Create",
        onSave: function (values, form, close) {
          if (!assignments(values.sectionId).some(function (x) { return x.courseId === values.courseId; })) { ui.toast("You are not assigned to this course and section.", "error"); return; }
          commit(function (s) {
            if (a) Object.assign(s.assignments.find(function (x) { return x.id === a.id; }), values);
            else s.assignments.push(Object.assign({ id: ES.uid("as"), teacherId: teacherId(), submissions: [] }, values));
            data.notify({ title: "New assignment", message: values.title + " · due " + ui.fmtDate(values.dueDate), type: "New Assignment", role: "student" });
          }, a ? "Assignment updated." : "Assignment created.", { action: a ? "Assignment Updated" : "Assignment Created", related: values.title });
          close(); ES.app.refresh();
        }
      });
    }
    ui.on(root, "[data-ta-action]", "click", function (e, el) {
      const action = el.getAttribute("data-ta-action");
      if (action === "add") { open(null); return; }
      const a = store.state.assignments.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (!a) return;
      if (action === "edit") { open(a); return; }
      if (action === "delete") {
        ui.confirm({ title: "Remove assignment", message: "Remove " + a.title + "?", onConfirm: function () {
          commit(function (s) { s.assignments = s.assignments.filter(function (x) { return x.id !== a.id; }); }, "Assignment removed.", { action: "Assignment Removed", related: a.title });
          ES.app.refresh();
        } });
        return;
      }
      const rows = data.studentsInSection(a.sectionId).map(function (s) {
        return { student: s, sub: (a.submissions || []).find(function (x) { return x.studentId === s.id; }) || {} };
      });
      ui.openModal({ title: "Submissions · " + a.title, size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: ui.table([{ label: "Roll number", render: function (r) { return ui.esc(r.student.rollNo); } }, { label: "Student", render: function (r) { return ui.esc(r.student.name); } },
          { label: "Submitted", render: function (r) { return r.sub.submittedAt ? ui.esc(r.sub.submittedAt) : ui.badge("Pending"); } },
          { label: "Marks", render: function (r) { return r.sub.marks !== undefined ? r.sub.marks : "—"; } },
          { label: "Feedback", render: function (r) { return ui.esc(r.sub.feedback || "—"); } },
          { label: "Action", render: function (r) { return '<button class="link-btn" data-grade="' + r.student.id + '">Grade</button>'; } }], rows, { compact: true }) });
      ui.on(document.getElementById("modalRoot"), "[data-grade]", "click", function (ev, btn) {
        const sid = btn.getAttribute("data-grade");
        const sub = (a.submissions || []).find(function (x) { return x.studentId === sid; }) || { studentId: sid };
        ui.openModal({ title: "Grade submission", body: '<div class="form-grid">' + ui.textInput("marks", "Marks /" + a.marks, sub.marks, { type: "number", min: 0, max: a.marks, required: true }) +
          ui.textInput("submittedAt", "Submitted at", sub.submittedAt || stamp()) + '<div class="span-2">' + ui.textarea("feedback", "Feedback", sub.feedback, { rows: 3 }) + "</div></div>",
          onSave: function (values, form, close) {
            commit(function (s) {
              const record = s.assignments.find(function (x) { return x.id === a.id; });
              record.submissions = record.submissions || [];
              const existing = record.submissions.find(function (x) { return x.studentId === sid; });
              if (existing) Object.assign(existing, values, { status: "Graded" });
              else record.submissions.push(Object.assign({ studentId: sid, response: "Demo submission" }, values, { status: "Graded" }));
            }, "Submission graded.", { action: "Assignment Graded", related: a.title });
            close(); ui.closeModal(); ES.app.refresh();
          }
        });
      });
    });
  };

  views.quizzes = function () {
    const rows = store.state.quizzes.filter(function (q) { return q.teacherId === teacherId(); });
    const body = ui.card({ title: "My quizzes", subtitle: "Create quizzes and review attempts",
      actions: '<button class="btn btn-primary" data-quiz-add><i class="fa-solid fa-plus"></i> Create quiz</button>',
      body: ui.table([{ label: "Quiz", key: "title" }, { label: "Course", render: function (q) { return ui.esc((data.course(q.courseId) || {}).code || "—"); } },
        { label: "Section", render: function (q) { return ui.esc(data.sectionLabel(q.sectionId)); } },
        { label: "Questions", render: function (q) { return q.questions.length; } },
        { label: "Attempts", render: function (q) { return (q.attempts || []).length; } }], rows, { compact: true, empty: "No quizzes created yet." }) });
    return page("Quizzes", "Quizzes for your assigned classes", body, "", ["Quizzes"]);
  };
  mounts.quizzes = function (root) {
    ui.on(root, "[data-quiz-add]", "click", function () {
      ui.openModal({ title: "Create quiz", size: "modal-lg",
        body: '<div class="form-grid">' + ui.textInput("title", "Quiz title", "", { required: true }) +
          ES.common.select("courseId", "Assigned course", assignedCourses(), "", { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
          ES.common.select("sectionId", "Section", sections().map(function (id) { return { id: id, name: data.sectionLabel(id, true) }; }), "", { labelKey: "name", placeholder: "Select section", required: true }) +
          ui.textInput("marks", "Total marks", 10, { type: "number", min: 1, required: true }) +
          ui.textInput("duration", "Time limit (minutes)", 15, { type: "number", min: 1, required: true }) +
          "</div><h3 class=\"section-subhead\">Questions</h3>" +
          '<div class="form-grid">' + ui.textInput("q1", "Question 1", "", { required: true }) + ui.textInput("a1", "Option A", "", { required: true }) +
          ui.textInput("b1", "Option B", "", { required: true }) + ui.textInput("c1", "Option C", "", { required: true }) +
          ui.textInput("d1", "Option D", "", { required: true }) + ES.common.select("answer1", "Correct answer", ["A", "B", "C", "D"], "A") + "</div>",
        saveLabel: "Create quiz",
        onSave: function (values, form, close) {
          commit(function (s) {
            s.quizzes.push({ id: ES.uid("qz"), teacherId: teacherId(), courseId: values.courseId, sectionId: values.sectionId,
              title: values.title, marks: Number(values.marks), duration: Number(values.duration), attempts: [],
              questions: [{ id: ES.uid("q"), text: values.q1, options: [values.a1, values.b1, values.c1, values.d1], answer: "ABCD".indexOf(values.answer1) }] });
            data.notify({ title: "Quiz announced", message: values.title + " · " + data.sectionLabel(values.sectionId), type: "Quiz Announcement", role: "student" });
          }, "Quiz created.", { action: "Quiz Created", related: values.title });
          close(); ES.app.refresh();
        } });
    });
  };

  function resultForSelection() {
    return store.state.results.find(function (r) { return r.sectionId === state.results.sectionId && r.courseId === state.results.courseId; }) || null;
  }
  function ensureDraftEntries() {
    const students = data.studentsInSection(state.results.sectionId);
    students.forEach(function (s) {
      state.results.entries[s.id] = state.results.entries[s.id] || { studentId: s.id, assignment: "", quiz: "", midterm: "", final: "" };
    });
    Object.keys(state.results.entries).forEach(function (id) {
      if (!students.some(function (s) { return s.id === id; })) delete state.results.entries[id];
    });
  }
  function resultTableHTML() {
    ensureDraftEntries();
    const students = data.studentsInSection(state.results.sectionId);
    const result = resultForSelection();
    const editable = !result || ["Draft", "Returned"].indexOf(result.status) !== -1;
    const rows = students.map(function (s) { return { student: s, entry: state.results.entries[s.id], calc: data.evaluate(state.results.entries[s.id]) }; });
    const limits = data.grading().maximumMarks;
    const columns = [
      { label: "Roll number", render: function (r) { return "<strong>" + ui.esc(r.student.rollNo) + "</strong>"; } },
      { label: "Student", render: function (r) { return ui.esc(r.student.name); } }
    ];
    [["assignment", "Assignment"], ["quiz", "Quiz"], ["midterm", "Midterm"], ["final", "Final"]].forEach(function (key) {
      columns.push({ label: key[1] + " /" + limits[key[0]], render: function (r) {
        return editable ? '<input class="mark-input" type="number" min="0" max="' + limits[key[0]] + '" value="' + ui.esc(r.entry[key[0]]) + '" data-mark="' + key[0] + '" data-student="' + r.student.id + '">' : ui.esc(r.entry[key[0]]);
      } });
    });
    columns.push(
      { label: "Total", render: function (r) { return '<span data-cell="total" data-student="' + r.student.id + '">' + r.calc.total + "</span>"; } },
      { label: "Percentage", render: function (r) { return '<span data-cell="percentage" data-student="' + r.student.id + '">' + r.calc.percentage + "%</span>"; } },
      { label: "Grade", render: function (r) { return '<span data-cell="grade" data-student="' + r.student.id + '">' + ui.badge(r.calc.grade) + "</span>"; } },
      { label: "GPA", render: function (r) { return '<span data-cell="gpa" data-student="' + r.student.id + '">' + r.calc.gpa.toFixed(2) + "</span>"; } },
      { label: "Remarks", render: function (r) { return ui.esc(r.calc.complete ? (r.calc.percentage >= 70 ? "Satisfactory" : "Needs improvement") : "Incomplete marks"); } }
    );
    const complete = rows.filter(function (r) { return r.calc.complete; }).length;
    const avg = rows.length ? Math.round(rows.reduce(function (sum, r) { return sum + r.calc.percentage; }, 0) / rows.length) : 0;
    return '<div class="result-summary"><span>Students: <strong>' + rows.length + "</strong></span><span>Complete: <strong data-summary=\"complete\">" + complete + "</strong></span>" +
      "<span>Average: <strong data-summary=\"average\">" + avg + "%</strong></span><span>Status: <strong>" + (result ? ui.badge(result.status) : ui.badge("Not started", "slate")) + "</strong></span></div>" +
      ui.table(columns, rows, { compact: true, empty: "No students in this section." });
  }

  views.results = function () {
    const secs = sections();
    if (secs.indexOf(state.results.sectionId) === -1) state.results.sectionId = secs[0] || "";
    const courses = assignedCourses(state.results.sectionId);
    if (!courses.some(function (c) { return c.id === state.results.courseId; })) state.results.courseId = courses[0] ? courses[0].id : "";
    const result = resultForSelection();
    if (result) {
      state.results.entries = {};
      (result.entries || []).forEach(function (entry) { state.results.entries[entry.studentId] = Object.assign({}, entry); });
    }
    const editable = !result || ["Draft", "Returned"].indexOf(result.status) !== -1;
    const body = ui.card({ title: "Class result preparation", subtitle: "Select an assigned course, then choose the section and enter marks for the whole class",
      body: '<div class="filter-strip">' +
        ES.common.select("rsCourse", "Assigned course", courses.map(function (c) { return { id: c.id, name: c.code + " · " + c.name }; }), state.results.courseId, { labelKey: "name" }) +
        ES.common.select("rsSemester", "Semester", store.state.semesters, (data.section(state.results.sectionId) || {}).semesterId, { labelKey: "name" }) +
        "</div>" +
        '<div class="segment"><span class="segment-label">Assigned section</span>' + (secs.length ? secs.map(function (id) {
          return '<button type="button" class="segment-btn' + (state.results.sectionId === id ? " active" : "") + '" data-res-section="' + id + '">' + ui.esc(data.sectionLabel(id)) + "</button>";
        }).join("") : '<span class="muted-text">No assigned sections</span>') + "</div>" +
        (result && result.status === "Published" ? '<div class="notice notice-lock"><i class="fa-solid fa-lock"></i>This result is published and read-only.</div>' : "") +
        (result && result.status === "Submitted" ? '<div class="notice notice-info"><i class="fa-solid fa-hourglass-half"></i>This result is submitted to the principal and cannot be edited until returned.</div>' : "") +
        (result && result.remarks ? '<div class="notice notice-warn"><strong>Principal remarks:</strong> ' + ui.esc(result.remarks) + "</div>" : "") +
        '<div id="resultTableHost">' + resultTableHTML() + "</div>" +
        (editable ? '<div class="form-actions"><button class="btn" data-result-save><i class="fa-solid fa-floppy-disk"></i> Save draft</button>' +
          '<button class="btn btn-primary" data-result-submit><i class="fa-solid fa-paper-plane"></i> Review &amp; submit class result</button></div>' : "")
    });
    return page("Result management", "Prepare a complete class result on one page", body, "", ["Results"]);
  };
  mounts.results = function (root) {
    ui.on(root, "[data-rsCourse]", "change", function (e, el) { state.results.courseId = el.value; state.results.entries = {}; ES.app.refresh(); });
    ui.on(root, "[data-res-section]", "click", function (e, el) { state.results.sectionId = el.getAttribute("data-res-section"); state.results.entries = {}; ES.app.refresh(); });
    ui.on(root, "[data-mark]", "input", function (e, el) {
      const sid = el.getAttribute("data-student");
      const key = el.getAttribute("data-mark");
      const max = Number(el.max || 100);
      let value = Number(el.value);
      if (el.value === "" || value < 0 || value > max || !isFinite(value)) {
        el.classList.add("invalid");
        state.results.entries[sid][key] = el.value;
      } else {
        el.classList.remove("invalid");
        state.results.entries[sid][key] = value;
      }
      const calc = data.evaluate(state.results.entries[sid]);
      const student = data.student(sid);
      [["total", calc.total], ["percentage", calc.percentage + "%"], ["grade", ui.badge(calc.grade)], ["gpa", calc.gpa.toFixed(2)]].forEach(function (pair) {
        const cell = document.querySelector('[data-cell="' + pair[0] + '"][data-student="' + sid + '"]');
        if (cell) cell.innerHTML = pair[1];
      });
      const rows = data.studentsInSection(state.results.sectionId).map(function (s) { return data.evaluate(state.results.entries[s.id]); });
      const complete = document.querySelector('[data-summary="complete"]');
      const average = document.querySelector('[data-summary="average"]');
      if (complete) complete.textContent = rows.filter(function (r) { return r.complete; }).length;
      if (average) average.textContent = (rows.length ? Math.round(rows.reduce(function (sum, r) { return sum + r.percentage; }, 0) / rows.length) : 0) + "%";
    });
    function persist(status) {
      const students = data.studentsInSection(state.results.sectionId);
      const entries = students.map(function (s) {
        const entry = Object.assign({}, state.results.entries[s.id]);
        const calc = data.evaluate(entry);
        entry.total = calc.total; entry.percentage = calc.percentage; entry.grade = calc.grade; entry.gpa = calc.gpa;
        entry.remarks = calc.complete ? (calc.percentage >= 70 ? "Satisfactory" : "Needs improvement") : "Incomplete";
        return entry;
      });
      if (status === "Submitted" && entries.some(function (e) { return !data.evaluate(e).complete; })) {
        ui.toast("Complete all required marks before submitting.", "error"); return;
      }
      commit(function (s) {
        let result = s.results.find(function (r) { return r.sectionId === state.results.sectionId && r.courseId === state.results.courseId; });
        if (!result) {
          result = { id: ES.uid("res"), sectionId: state.results.sectionId, courseId: state.results.courseId,
            semesterId: (data.section(state.results.sectionId) || {}).semesterId, teacherId: teacherId(),
            status: "Draft", submittedAt: "", reviewedBy: "", approvedAt: "", publishedAt: "", remarks: "", entries: [] };
          s.results.push(result);
        }
        result.entries = entries;
        if (status === "Submitted") {
          result.status = "Submitted"; result.submittedAt = stamp(); result.remarks = "";
          data.notify({ title: "Class result submitted", message: data.sectionLabel(result.sectionId, true) + " · " + (data.course(result.courseId) || {}).code, type: "Result Approval", role: "principal" });
        }
      }, status === "Draft" ? "Draft saved in this browser." : "Class result submitted to the principal.", {
        action: status === "Draft" ? "Result Draft Saved" : "Result Submitted", related: data.sectionLabel(state.results.sectionId),
        description: (data.course(state.results.courseId) || {}).code + " · " + data.sectionLabel(state.results.sectionId)
      });
      ES.app.refresh();
    }
    ui.on(root, "[data-result-save]", "click", function () { persist("Draft"); });
    ui.on(root, "[data-result-submit]", "click", function () {
      const entries = data.studentsInSection(state.results.sectionId).map(function (s) { return data.evaluate(state.results.entries[s.id]); });
      const incomplete = entries.filter(function (e) { return !e.complete; }).length;
      ui.confirm({ title: "Review class result before submission", size: "modal-lg", saveLabel: "Submit to principal",
        body: '<div class="notice ' + (incomplete ? "notice-warn" : "notice-info") + '"><i class="fa-solid ' + (incomplete ? "fa-triangle-exclamation" : "fa-circle-info") + '"></i>' +
          (incomplete ? incomplete + " student(s) have incomplete marks. Submission will be blocked." : "All marks are complete.") + "</div>" +
          '<div class="summary-row"><span>Students</span><strong>' + entries.length + "</strong><span>Average</span><strong>" +
          (entries.length ? Math.round(entries.reduce(function (sum, e) { return sum + e.percentage; }, 0) / entries.length) : 0) + "%</strong></div>" +
          '<p class="modal-note">Submitting sends the complete class result to the principal for review. You will not be able to edit it until it is returned.</p>',
        onConfirm: function () { persist("Submitted"); } });
    });
  };

  views.calendar = function () {
    const events = data.eventsUpcoming();
    const body = ui.card({ title: "Academic calendar", subtitle: "Upcoming institutional events relevant to teaching",
      body: ui.table([{ label: "Date", render: function (e) { return ui.esc(ui.fmtDate(e.date)); } }, { label: "Event", key: "title" }, { label: "Type", render: function (e) { return ui.badge(e.type); } },
        { label: "Details", render: function (e) { return ui.esc(e.description || "—"); } }], events, { compact: true, empty: "No upcoming events." }) });
    return page("Academic calendar", "Upcoming academic dates", body, "", ["Calendar"]);
  };

  views.announcements = function () {
    const rows = store.state.announcements;
    const body = ui.card({ title: "Announcements", subtitle: "Institutional and section notices",
      body: ui.table([{ label: "Title", key: "title" }, { label: "Message", render: function (a) { return ui.esc(a.message); } },
        { label: "Audience", render: function (a) { return a.audience.type === "all" ? "Entire institution" : ui.esc(data.sectionLabel(a.audience.value, true) || a.audience.type); } },
        { label: "Author", key: "author" }, { label: "Published", key: "createdAt" }], rows, { compact: true }) });
    return page("Announcements", "Notices from the principal office and faculty", body, "", ["Announcements"]);
  };

  views.messages = function () {
    const messages = data.messagesFor("teacher", teacherId());
    const body = ui.card({ title: "Messages", subtitle: "Demo conversation history",
      body: messages.length ? '<div class="thread">' + messages.map(function (m) {
        const incoming = m.toRole === "teacher" && m.toId === teacherId();
        return '<div class="bubble ' + (incoming ? "in" : "out") + '"><strong>' + ui.esc(m.subject) + "</strong><p>" + ui.esc(m.body) + "</p><small>" + ui.esc(m.sentAt) + "</small></div>";
      }).join("") + "</div>" : ui.empty("No messages yet.") });
    return page("Messages", "Teacher message history", body, "", ["Messages"]);
  };

  views.notifications = function () {
    const ctx = ES.app.context("teacher");
    const rows = data.notificationsFor("teacher", teacherId());
    const body = ui.card({ title: "Notifications", subtitle: "Alerts for your teaching workspace", actions: '<button class="btn" data-tn-readall>Mark all as read</button>',
      body: rows.length ? '<div class="notice-list">' + rows.map(function (n) {
        return '<div class="notice-item' + (n.read ? "" : " unread") + '"><i class="fa-solid ' + (n.read ? "fa-envelope-open" : "fa-envelope") + '"></i><span><strong>' + ui.esc(n.title) + "</strong><small>" + ui.esc(n.message) + "</small><small>" + ui.esc(n.createdAt) + "</small></span></div>";
      }).join("") + "</div>" : ui.empty("No notifications yet.") });
    return page("Notifications", ctx.label, body, "", ["Notifications"]);
  };
  mounts.notifications = function (root) {
    ui.on(root, "[data-tn-readall]", "click", function () {
      commit(function (s) { s.notifications.forEach(function (n) { if (n.role === "teacher" && (!n.userId || n.userId === teacherId())) n.read = true; }); }, "All notifications marked as read.");
      ES.app.refresh();
    });
  };

  views.profile = function () {
    const t = data.teacher(teacherId()) || {};
    const theme = localStorage.getItem("edusphere.theme") || "light";
    const body = ui.card({ title: "Profile and settings", subtitle: "Frontend demo preferences",
      body: '<div class="profile-modal">' + ES.common.person(t.name, t.designation, t.photo) +
        '<div class="detail-grid">' + [["Employee ID", t.employeeId], ["Email", t.email], ["Phone", t.phone], ["Department", (data.department(t.departmentId) || {}).name], ["Joining date", ui.fmtDate(t.joinDate)]].map(function (r) {
          return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1] || "—") + "</strong></div>";
        }).join("") + "</div></div>" }) +
      ui.card({ title: "Appearance", body: '<div class="form-grid">' + ES.common.select("themeSelect", "Theme", [{ value: "light", label: "Light mode" }, { value: "dark", label: "Dark mode" }], theme) + "</div>" });
    return page("Profile & settings", "Your demo teacher profile", body, "", ["Profile"]);
  };
  mounts.profile = function (root) {
    ui.on(root, "[data-themeSelect]", "change", function (e, el) { ES.app.applyTheme(el.value); ui.toast("Theme updated."); });
  };
})();
