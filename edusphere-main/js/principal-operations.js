(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.principal = ES.views.principal || {};
  const mounts = ES.mounts.principal = ES.mounts.principal || {};

  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({ title: title, subtitle: subtitle, actions: actions || "", breadcrumb: ["Principal", "Academic Operations"].concat(crumbs || [title]) }) + body;
  }
  function commit(fn, message, audit) {
    store.update(function (state) {
      fn(state);
      if (audit) data.audit(audit.action, "Principal Office", audit.related || "", audit.description || audit.action, audit.icon);
    });
    if (message) ui.toast(message);
  }
  function stamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }

  const attUI = { departmentId: "d-cs", programId: "p-bscs", semesterId: "sem-3", sectionId: "sec-cs3-e1", courseId: "", tab: "records" };

  function tally(record) {
    const out = { present: 0, absent: 0, late: 0, leave: 0 };
    (record.records || []).forEach(function (r) { if (out[r.status] !== undefined) out[r.status]++; });
    return out;
  }

  views.attendance = function () {
    const section = data.section(attUI.sectionId);
    const courses = data.coursesForSection(attUI.sectionId);
    const records = data.attendanceFor(attUI.sectionId, attUI.courseId);
    const requests = store.state.correctionRequests.filter(function (r) {
      if (!section) return false;
      const a = store.state.attendance.find(function (x) { return x.id === r.attendanceId; });
      return a && a.sectionId === attUI.sectionId;
    });
    const low = data.lowAttendanceStudents(attUI.sectionId);
    const summary = data.sectionSummary(attUI.sectionId);
    const body = ui.card({
      title: "Attendance overview", subtitle: "Lecture-wise attendance records by section",
      body: ES.common.pickerHTML("at", attUI, { extra: ES.common.select("atCourse", "Course", [{ id: "", name: "All courses" }].concat(courses.map(function (c) { return { id: c.id, name: c.code + " · " + c.name }; })), attUI.courseId, { labelKey: "name" }) }) +
        (section ? '<div class="stats-grid compact-stats">' +
          ui.statCard({ label: "Students", value: summary.students, icon: "fa-user-graduate", tone: "blue" }) +
          ui.statCard({ label: "Lectures recorded", value: records.length, icon: "fa-clipboard-check", tone: "green" }) +
          ui.statCard({ label: "Below threshold", value: low.length, icon: "fa-triangle-exclamation", tone: "amber", note: "Threshold " + data.threshold() + "%" }) +
          ui.statCard({ label: "Correction requests", value: requests.filter(function (r) { return r.status === "Pending"; }).length, icon: "fa-file-circle-question", tone: "slate" }) +
          "</div>" : "") +
        '<div class="tabs"><button class="tab-btn' + (attUI.tab === "records" ? " active" : "") + '" data-at-tab="records">Lecture records</button>' +
        '<button class="tab-btn' + (attUI.tab === "low" ? " active" : "") + '" data-at-tab="low">Low attendance (' + low.length + ")</button>" +
        '<button class="tab-btn' + (attUI.tab === "corrections" ? " active" : "") + '" data-at-tab="corrections">Correction requests (' + requests.filter(function (r) { return r.status === "Pending"; }).length + ")</button></div>" +
        (attUI.tab === "records" ? ui.table([
          { label: "Date", render: function (r) { return ui.esc(ui.fmtDate(r.date)); } },
          { label: "Lecture", key: "lecture" },
          { label: "Course", render: function (r) { return ui.esc((data.course(r.courseId) || {}).code || "—"); } },
          { label: "Teacher", render: function (r) { return ui.esc((data.teacher(r.teacherId) || {}).name || "—"); } },
          { label: "P / A / L / Leave", render: function (r) { const t = tally(r); return t.present + " / " + t.absent + " / " + t.late + " / " + t.leave; } },
          { label: "Status", render: function (r) { return ui.badge(r.locked ? "Locked" : "Open"); } },
          { label: "Actions", render: function (r) { return '<button class="link-btn" data-att-view="' + r.id + '">View sheet</button>'; } }
        ], records, { compact: true, empty: "No attendance recorded for this selection." }) : "") +
        (attUI.tab === "low" ? ui.table([
          { label: "Student", render: function (s) { return ES.common.person(s.name, s.rollNo, s.photo); } },
          { label: "Section", render: function (s) { return ui.esc(data.sectionLabel(s.sectionId)); } },
          { label: "Attendance", render: function (s) { return ui.progress(data.attendanceStats(s.id).percentage, "warn"); } }
        ], low, { compact: true, empty: "No students below the configured threshold." }) : "") +
        (attUI.tab === "corrections" ? ui.table([
          { label: "Student", render: function (r) { const s = data.student(r.studentId); return s ? ES.common.person(s.name, s.rollNo, s.photo) : "—"; } },
          { label: "Reason", key: "reason" },
          { label: "Requested by", render: function (r) { return ui.esc((data.teacher(r.requestedBy) || {}).name || r.requestedBy); } },
          { label: "Status", render: function (r) { return ui.badge(r.status); } },
          { label: "Actions", render: function (r) { return r.status === "Pending" ? ES.common.actions([{ icon: "fa-check", title: "Review request", attrs: 'data-att-review="' + r.id + '"' }]) : "—"; } }
        ], requests, { compact: true, empty: "No correction requests for this section." }) : "")
    });
    return page("Attendance overview", "Monitor lecture records, low attendance and correction requests", body, "", ["Attendance"]);
  };

  mounts.attendance = function (root) {
    ES.common.bindPicker(root, "at", attUI, function () { attUI.courseId = ""; ES.app.refresh(); });
    ui.on(root, "[data-atCourse]", "change", function (e, el) { attUI.courseId = el.value; ES.app.refresh(); });
    ui.on(root, "[data-at-tab]", "click", function (e, el) { attUI.tab = el.getAttribute("data-at-tab"); ES.app.refresh(); });
    ui.on(root, "[data-att-view]", "click", function (e, el) {
      const record = store.state.attendance.find(function (a) { return a.id === el.getAttribute("data-att-view"); });
      if (!record) return;
      const rows = (record.records || []).map(function (r) {
        const s = data.student(r.studentId);
        return { roll: s ? s.rollNo : "—", name: s ? s.name : "—", status: r.status };
      });
      ui.openModal({
        title: "Attendance sheet · " + ui.fmtDate(record.date), size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: '<div class="notice notice-lock"><i class="fa-solid fa-lock"></i>Submitted attendance is read-only. Corrections require a separate approved request.</div>' +
          ui.table([{ label: "Roll number", key: "roll" }, { label: "Student", key: "name" },
            { label: "Status", render: function (r) { return ui.badge(r.status); } }], rows, { compact: true })
      });
    });
    ui.on(root, "[data-att-review]", "click", function (e, el) {
      const request = store.state.correctionRequests.find(function (r) { return r.id === el.getAttribute("data-att-review"); });
      const student = data.student(request.studentId);
      const record = store.state.attendance.find(function (a) { return a.id === request.attendanceId; });
      const current = (record.records || []).find(function (r) { return r.studentId === request.studentId; });
      ui.openModal({
        title: "Review correction request", saveLabel: "Approve correction",
        body: '<div class="detail-grid">' +
          '<div class="detail-item"><span>Student</span><strong>' + ui.esc(student ? student.name + " (" + student.rollNo + ")" : "—") + "</strong></div>" +
          '<div class="detail-item"><span>Lecture</span><strong>' + ui.esc(record.lecture + " · " + ui.fmtDate(record.date)) + "</strong></div>" +
          '<div class="detail-item"><span>Current status</span><strong>' + ui.esc(current ? current.status : "—") + "</strong></div>" +
          '<div class="detail-item"><span>Requested status</span><strong>' + ui.esc(request.proposedStatus) + "</strong></div></div>" +
          '<div class="notice notice-warn">' + ui.esc(request.reason) + "</div>" +
          ui.textarea("reviewRemarks", "Review remarks", "", { rows: 3, required: true }),
        buttons: [{ label: "Return without change", class: "btn-ghost", onClick: function (form, close) {
          const remarks = form.reviewRemarks.value.trim();
          if (!remarks) { ui.toast("Add review remarks before returning.", "error"); return; }
          commit(function () {
            request.status = "Returned"; request.reviewRemarks = remarks; request.reviewedBy = "Principal Office"; request.reviewedAt = stamp();
          }, "Correction request returned.", { action: "Correction Request Reviewed", related: student ? student.rollNo : "", description: "Returned attendance correction request" });
          close(); ES.app.refresh();
        } }],
        onSave: function (values, form, close) {
          commit(function () {
            request.status = "Approved"; request.reviewRemarks = values.reviewRemarks; request.reviewedBy = "Principal Office"; request.reviewedAt = stamp();
            if (current) current.status = request.proposedStatus;
            data.notify({ title: "Attendance correction approved", message: student.name + " · " + record.lecture + " · " + ui.fmtDate(record.date), type: "Attendance Warning", role: "student", userId: student.id });
          }, "Correction approved and recorded.", { action: "Attendance Correction Approved", related: student ? student.rollNo : "", description: "Approved attendance correction for " + (student ? student.name : "") });
          close(); ES.app.refresh();
        }
      });
    });
  };

  views.assignments = function () {
    const rows = store.state.assignments.slice().sort(function (a, b) { return (b.dueDate || "").localeCompare(a.dueDate || ""); });
    const body = ui.card({
      title: "Assignments", subtitle: "Assignment setup, submission tracking and marking",
      actions: '<button class="btn btn-primary" data-as-action="add"><i class="fa-solid fa-plus"></i> Create assignment</button>',
      body: ui.table([
        { label: "Assignment", render: function (a) { return "<strong>" + ui.esc(a.title) + "</strong><small class=\"cell-note\">" + ui.esc((data.course(a.courseId) || {}).code || "") + "</small>"; } },
        { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId)); } },
        { label: "Teacher", render: function (a) { return ui.esc((data.teacher(a.teacherId) || {}).name || "—"); } },
        { label: "Due date", render: function (a) { return ui.esc(ui.fmtDate(a.dueDate)); } },
        { label: "Marks", key: "marks" },
        { label: "Submissions", render: function (a) { return (a.submissions || []).length + " / " + data.studentsInSection(a.sectionId).length; } },
        { label: "Actions", render: function (a) { return ES.common.actions([
          { icon: "fa-eye", title: "View submissions", attrs: 'data-as-action="view" data-id="' + a.id + '"' },
          { icon: "fa-pen", title: "Edit", attrs: 'data-as-action="edit" data-id="' + a.id + '"' },
          { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-as-action="delete" data-id="' + a.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No assignments created yet." })
    });
    return page("Assignments", "Monitor assignments across all courses and sections", body, "", ["Assignments"]);
  };

  mounts.assignments = function (root) {
    function open(a) {
      const body = '<div class="form-grid">' +
        ui.textInput("title", "Title", a && a.title, { required: true }) +
        ES.common.select("courseId", "Course", store.state.courses, a && a.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
        ES.common.select("sectionId", "Section", store.state.sections, a && a.sectionId, { labelKey: function (s) { return data.sectionLabel(s.id, true); }, placeholder: "Select section", required: true }) +
        ES.common.select("teacherId", "Teacher", store.state.teachers, a && a.teacherId, { labelKey: "name", placeholder: "Select teacher", required: true }) +
        ui.textInput("dueDate", "Deadline", a && a.dueDate, { type: "date", required: true }) +
        ui.textInput("marks", "Total marks", a && a.marks || 10, { type: "number", min: 1, required: true }) +
        '<div class="span-2">' + ui.textarea("description", "Description", a && a.description, { rows: 3 }) + "</div></div>";
      ui.openModal({
        title: a ? "Edit assignment" : "Create assignment", size: "modal-lg", body: body,
        saveLabel: a ? "Save changes" : "Create",
        onSave: function (values, form, close) {
          commit(function (state) {
            if (a) Object.assign(state.assignments.find(function (x) { return x.id === a.id; }), values);
            else state.assignments.push(Object.assign({ id: ES.uid("as"), submissions: [] }, values));
            data.notify({ title: "New assignment", message: values.title + " · due " + ui.fmtDate(values.dueDate), type: "New Assignment", role: "student" });
          }, a ? "Assignment updated." : "Assignment created.", { action: a ? "Assignment Updated" : "Assignment Created", related: values.title });
          close(); ES.app.refresh();
        }
      });
    }
    ui.on(root, "[data-as-action]", "click", function (e, el) {
      const action = el.getAttribute("data-as-action");
      if (action === "add") { open(null); return; }
      const a = store.state.assignments.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (!a) return;
      if (action === "edit") { open(a); return; }
      if (action === "delete") {
        ui.confirm({ title: "Remove assignment", message: "Remove " + a.title + "?", onConfirm: function () {
          commit(function (state) { state.assignments = state.assignments.filter(function (x) { return x.id !== a.id; }); }, "Assignment removed.", { action: "Assignment Removed", related: a.title });
          ES.app.refresh();
        } });
        return;
      }
      const students = data.studentsInSection(a.sectionId);
      const rows = students.map(function (s) {
        const sub = (a.submissions || []).find(function (x) { return x.studentId === s.id; });
        return { student: s, sub: sub || {} };
      });
      ui.openModal({
        title: "Submissions · " + a.title, size: "modal-lg", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: ui.table([
          { label: "Roll number", render: function (r) { return ui.esc(r.student.rollNo); } },
          { label: "Student", render: function (r) { return ui.esc(r.student.name); } },
          { label: "Submitted", render: function (r) { return r.sub.submittedAt ? ui.esc(r.sub.submittedAt) : ui.badge("Pending"); } },
          { label: "Marks", render: function (r) { return r.sub.marks !== undefined ? ui.esc(r.sub.marks) : "—"; } },
          { label: "Feedback", render: function (r) { return ui.esc(r.sub.feedback || "—"); } },
          { label: "Action", render: function (r) { return '<button class="link-btn" data-grade-sub="' + r.student.id + '">' + (r.sub.marks !== undefined ? "Update" : "Grade") + "</button>"; } }
        ], rows, { compact: true })
      });
      ui.on(document.getElementById("modalRoot"), "[data-grade-sub]", "click", function (ev, btn) {
        const sid = btn.getAttribute("data-grade-sub");
        const sub = (a.submissions || []).find(function (x) { return x.studentId === sid; }) || { studentId: sid };
        ui.openModal({
          title: "Grade submission", body: '<div class="form-grid">' +
            ui.textInput("marks", "Marks (out of " + a.marks + ")", sub.marks, { type: "number", min: 0, max: a.marks, required: true }) +
            ui.textInput("submittedAt", "Submitted at", sub.submittedAt || stamp()) +
            '<div class="span-2">' + ui.textarea("feedback", "Feedback", sub.feedback, { rows: 3 }) + "</div></div>",
          onSave: function (values, form, close) {
            commit(function (state) {
              const record = state.assignments.find(function (x) { return x.id === a.id; });
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
    const rows = store.state.quizzes.slice().sort(function (a, b) { return b.id.localeCompare(a.id); });
    const body = ui.card({
      title: "Quizzes", subtitle: "Question banks, section assignments and student attempts",
      actions: '<button class="btn btn-primary" data-qz-action="add"><i class="fa-solid fa-plus"></i> Create quiz</button>',
      body: ui.table([
        { label: "Quiz", render: function (q) { return "<strong>" + ui.esc(q.title) + "</strong><small class=\"cell-note\">" + ui.esc((data.course(q.courseId) || {}).code || "") + "</small>"; } },
        { label: "Section", render: function (q) { return ui.esc(data.sectionLabel(q.sectionId)); } },
        { label: "Questions", render: function (q) { return q.questions.length; } },
        { label: "Marks", key: "marks" },
        { label: "Duration", render: function (q) { return q.duration + " min"; } },
        { label: "Attempts", render: function (q) { return (q.attempts || []).length; } },
        { label: "Actions", render: function (q) { return ES.common.actions([
          { icon: "fa-eye", title: "View quiz", attrs: 'data-qz-action="view" data-id="' + q.id + '"' },
          { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-qz-action="delete" data-id="' + q.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No quizzes created yet." })
    });
    return page("Quizzes", "Create and monitor quizzes assigned to sections", body, "", ["Quizzes"]);
  };

  mounts.quizzes = function (root) {
    function questionRow(q) {
      return '<div class="question-editor"><div class="form-grid">' +
        ui.textInput("qtext[]", "Question", q && q.text, { required: true }) +
        ES.common.select("qanswer[]", "Correct option", ["A", "B", "C", "D"], q ? String.fromCharCode(65 + q.answer) : "A") +
        "</div>" + ["A", "B", "C", "D"].map(function (letter, i) {
          return ui.textInput("qoption" + letter + "[]", "Option " + letter, q && q.options[i], { required: true });
        }).join("") + '<button type="button" class="link-btn" data-remove-question>Remove question</button></div>';
    }
    ui.on(root, "[data-qz-action]", "click", function (e, el) {
      const action = el.getAttribute("data-qz-action");
      const quiz = store.state.quizzes.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (action === "delete" && quiz) {
        ui.confirm({ title: "Remove quiz", message: "Remove " + quiz.title + "?", onConfirm: function () {
          commit(function (state) { state.quizzes = state.quizzes.filter(function (q) { return q.id !== quiz.id; }); }, "Quiz removed.", { action: "Quiz Removed", related: quiz.title });
          ES.app.refresh();
        } });
        return;
      }
      if (action === "view" && quiz) {
        ui.openModal({
          title: quiz.title, size: "modal-lg", saveLabel: null,
          buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
          body: '<div class="detail-grid"><div class="detail-item"><span>Section</span><strong>' + ui.esc(data.sectionLabel(quiz.sectionId, true)) + "</strong></div>" +
            '<div class="detail-item"><span>Marks / duration</span><strong>' + quiz.marks + " marks · " + quiz.duration + " min</strong></div></div>" +
            "<h3 class=\"section-subhead\">Questions</h3>" + quiz.questions.map(function (q, i) {
              return '<div class="question-preview"><strong>' + (i + 1) + ". " + ui.esc(q.text) + "</strong><ul>" +
                q.options.map(function (o, oi) { return "<li" + (oi === q.answer ? " class=\"correct\"" : "") + ">" + ui.esc(o) + "</li>"; }).join("") + "</ul></div>";
            }).join("") +
            "<h3 class=\"section-subhead\">Attempts</h3>" + ui.table([
              { label: "Student", render: function (a) { return ui.esc((data.student(a.studentId) || {}).name || "—"); } },
              { label: "Score", render: function (a) { return a.score + " / " + quiz.marks; } },
              { label: "Submitted", key: "submittedAt" }
            ], quiz.attempts || [], { compact: true })
        });
        return;
      }
      const body = '<div class="form-grid">' +
        ui.textInput("title", "Quiz title", "", { required: true }) +
        ES.common.select("courseId", "Course", store.state.courses, "", { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
        ES.common.select("sectionId", "Section", store.state.sections, "", { labelKey: function (s) { return data.sectionLabel(s.id, true); }, placeholder: "Select section", required: true }) +
        ui.textInput("marks", "Total marks", 10, { type: "number", min: 1, required: true }) +
        ui.textInput("duration", "Time limit (minutes)", 15, { type: "number", min: 1, required: true }) +
        "</div><h3 class=\"section-subhead\">Questions</h3><div id=\"questionHost\">" + questionRow() + "</div>" +
        '<button type="button" class="btn" data-add-question><i class="fa-solid fa-plus"></i> Add question</button>';
      ui.openModal({ title: "Create quiz", size: "modal-lg", body: body, saveLabel: "Create quiz",
        onSave: function (values, form, close) {
          const texts = form.querySelectorAll('[name="qtext[]"]');
          const answers = form.querySelectorAll('[name="qanswer[]"]');
          const questions = [];
          for (let i = 0; i < texts.length; i++) {
            const options = ["A", "B", "C", "D"].map(function (letter) {
              const fields = form.querySelectorAll('[name="qoption' + letter + '[]"]');
              return fields[i] ? fields[i].value : "";
            });
            if (!texts[i].value.trim() || options.some(function (o) { return !o.trim(); })) { ui.toast("Complete every question and option.", "error"); return; }
            questions.push({ id: ES.uid("q"), text: texts[i].value.trim(), options: options, answer: "ABCD".indexOf(answers[i].value) });
          }
          if (!questions.length) { ui.toast("Add at least one question.", "error"); return; }
          commit(function (state) {
            state.quizzes.push({ id: ES.uid("qz"), teacherId: (ES.app.context("teacher").user || {}).id || "t-01",
              courseId: values.courseId, sectionId: values.sectionId, title: values.title,
              marks: Number(values.marks), duration: Number(values.duration), questions: questions, attempts: [] });
            data.notify({ title: "Quiz announced", message: values.title + " · " + data.sectionLabel(values.sectionId), type: "Quiz Announcement", role: "student" });
          }, "Quiz created.", { action: "Quiz Created", related: values.title });
          close(); ES.app.refresh();
        }
      });
      const form = document.getElementById("esModalForm");
      const host = form.querySelector("#questionHost");
      ui.on(form, "[data-add-question]", "click", function () { host.insertAdjacentHTML("beforeend", questionRow()); });
      ui.on(form, "[data-remove-question]", "click", function (e, btn) {
        if (host.querySelectorAll(".question-editor").length > 1) btn.closest(".question-editor").remove();
      });
    });
  };

  views.examinations = function () {
    const rows = store.state.examSchedule.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    const body = ui.card({
      title: "Examination schedule", subtitle: "Midterm, final and other assessments by section",
      actions: '<button class="btn btn-primary" data-ex-action="add"><i class="fa-solid fa-plus"></i> Schedule exam</button>',
      body: ui.table([
        { label: "Date", render: function (e) { return ui.esc(ui.fmtDate(e.date)); } },
        { label: "Type", render: function (e) { return ui.badge(e.examType); } },
        { label: "Course", render: function (e) { return ui.esc((data.course(e.courseId) || {}).code || "—"); } },
        { label: "Section", render: function (e) { return ui.esc(data.sectionLabel(e.sectionId, true)); } },
        { label: "Time", render: function (e) { return ui.esc(e.startTime + "–" + e.endTime); } },
        { label: "Room", key: "room" },
        { label: "Actions", render: function (e) { return ES.common.actions([
          { icon: "fa-pen", title: "Edit", attrs: 'data-ex-action="edit" data-id="' + e.id + '"' },
          { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-ex-action="delete" data-id="' + e.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No examinations scheduled." })
    });
    return page("Examination management", "Midterms, finals, quizzes and marks-entry schedule", body, "", ["Examinations"]);
  };

  mounts.examinations = function (root) {
    ui.on(root, "[data-ex-action]", "click", function (e, el) {
      const action = el.getAttribute("data-ex-action");
      const exam = store.state.examSchedule.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (action === "delete" && exam) {
        ui.confirm({ title: "Remove examination", message: "Remove the scheduled " + exam.examType + " exam?", onConfirm: function () {
          commit(function (state) { state.examSchedule = state.examSchedule.filter(function (x) { return x.id !== exam.id; }); }, "Examination removed.", { action: "Examination Removed", related: (data.course(exam.courseId) || {}).code });
          ES.app.refresh();
        } });
        return;
      }
      const x = exam || {};
      ui.openModal({
        title: exam ? "Edit examination" : "Schedule examination", body: '<div class="form-grid">' +
          ES.common.select("examType", "Examination type", ["Midterm", "Final", "Quiz", "Assignment", "Practical"], x.examType || "Midterm") +
          ES.common.select("courseId", "Course", store.state.courses, x.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
          ES.common.select("sectionId", "Section", store.state.sections, x.sectionId, { labelKey: function (s) { return data.sectionLabel(s.id, true); }, placeholder: "Select section", required: true }) +
          ui.textInput("date", "Date", x.date, { type: "date", required: true }) +
          ui.textInput("startTime", "Start time", x.startTime || "09:00", { type: "time", required: true }) +
          ui.textInput("endTime", "End time", x.endTime || "11:00", { type: "time", required: true }) +
          ui.textInput("room", "Room", x.room) + "</div>",
        saveLabel: exam ? "Save changes" : "Schedule",
        onSave: function (values, form, close) {
          commit(function (state) {
            if (exam) Object.assign(state.examSchedule.find(function (item) { return item.id === exam.id; }), values);
            else state.examSchedule.push(Object.assign({ id: ES.uid("ex") }, values));
          }, exam ? "Examination updated." : "Examination scheduled.", { action: "Examination Scheduled", related: (data.course(values.courseId) || {}).code });
          close(); ES.app.refresh();
        }
      });
    });
  };

  const resUI = { departmentId: "d-cs", programId: "p-bscs", semesterId: "sem-3", sectionId: "sec-cs3-e1", courseId: "" };

  function resultRows(result) {
    if (!result) return [];
    return (result.entries || []).map(function (entry) {
      const s = data.student(entry.studentId);
      const calc = data.evaluate(entry);
      return { student: s, entry: entry, calc: calc };
    }).filter(function (r) { return r.student; });
  }

  function publishClassResults(sectionId) {
    const sectionResults = store.state.results.filter(function (r) { return r.sectionId === sectionId && r.status !== "Published"; });
    if (!sectionResults.length) {
      ui.toast("This class result is already published.");
      return;
    }
    const label = data.sectionLabel(sectionId, true);
    ui.confirm({
      title: "Publish full class result",
      message: "Publish all results for " + label + " to students? Published results become read-only.",
      confirmLabel: "Publish class result",
      onConfirm: function () {
        const courseCodes = sectionResults.map(function (r) { return (data.course(r.courseId) || {}).code || ""; }).filter(Boolean).join(", ");
        commit(function () {
          sectionResults.forEach(function (r) {
            r.status = "Published";
            r.approvedAt = r.approvedAt || stamp();
            r.publishedAt = stamp();
            r.reviewedBy = "Principal Office";
            r.remarks = r.remarks || "Published by principal";
          });
          data.studentsInSection(sectionId).forEach(function (s) {
            data.notify({ title: "Result published", message: courseCodes + " · " + data.semesterLabel(sectionResults[0].semesterId), type: "Published Result", role: "student", userId: s.id });
          });
        }, "Full class result published.", { action: "Class Result Published", related: label });
        ES.app.refresh();
      }
    });
  }

  function classResultRows() {
    const grouped = store.state.results.reduce(function (acc, r) {
      acc[r.sectionId] = (acc[r.sectionId] || []).concat(r);
      return acc;
    }, {});
    return Object.keys(grouped).map(function (sectionId) {
      const rows = grouped[sectionId];
      const published = rows.every(function (r) { return r.status === "Published"; });
      const section = data.section(sectionId);
      return {
        sectionId: sectionId,
        label: data.sectionLabel(sectionId, true),
        semester: section ? data.semesterLabel(section.semesterId) : "—",
        courses: rows.map(function (r) { return (data.course(r.courseId) || {}).code || ""; }).filter(Boolean).join(", "),
        students: data.studentsInSection(sectionId).length,
        status: published ? "Published" : rows.some(function (r) { return r.status === "Draft"; }) ? "Draft" : "Pending publication",
        published: published
      };
    }).sort(function (a, b) { return a.label.localeCompare(b.label); });
  }

  function marksColumns(editable) {
    const cols = [
      { label: "Roll number", render: function (r) { return "<strong>" + ui.esc(r.student.rollNo) + "</strong>"; } },
      { label: "Student", render: function (r) { return ui.esc(r.student.name); } }
    ];
    const limits = data.grading().maximumMarks;
    [["assignment", "Assignment"], ["quiz", "Quiz"], ["midterm", "Midterm"], ["final", "Final"]].forEach(function (key) {
      cols.push({ label: key[1] + " /" + limits[key[0]], render: function (r) {
        if (!editable) return ui.esc(r.entry[key[0]] === undefined ? "—" : r.entry[key[0]]);
        return '<input class="mark-input" type="number" min="0" max="' + limits[key[0]] + '" value="' + ui.esc(r.entry[key[0]] === undefined ? "" : r.entry[key[0]]) + '" data-mark="' + key[0] + '" data-student="' + r.student.id + '">';
      } });
    });
    return cols.concat([
      { label: "Total", render: function (r) { return "<strong>" + r.calc.total + "</strong>"; } },
      { label: "Percentage", render: function (r) { return r.calc.percentage + "%"; } },
      { label: "Grade", render: function (r) { return ui.badge(r.calc.grade); } },
      { label: "GPA", render: function (r) { return r.calc.gpa.toFixed(2); } },
      { label: "Status", render: function (r) { return r.calc.complete ? ui.badge("Complete") : ui.badge("Incomplete " + r.calc.missing.length, "amber"); } }
    ]);
  }

  views.results = function () {
    const courses = data.coursesForSection(resUI.sectionId);
    const result = data.resultFor(resUI.sectionId, resUI.courseId);
    const rows = resultRows(result);
    const classRows = classResultRows();
    const overview = ui.card({
      title: "Class-wise results", subtitle: "Publish an entire class result with one click",
      body: ui.table([
        { label: "Class", render: function (r) { return "<strong>" + ui.esc(r.label) + "</strong><small class=\"cell-note\">" + ui.esc(r.courses) + "</small>"; } },
        { label: "Semester", render: function (r) { return ui.esc(r.semester); } },
        { label: "Students", key: "students" },
        { label: "Status", render: function (r) { return ui.badge(r.status === "Published" ? "Published" : r.status === "Draft" ? "Draft" : "Pending publication"); } },
        { label: "Action", render: function (r) { return r.published ? ui.badge("Published") : '<button class="btn btn-primary btn-sm" data-publish-class="' + r.sectionId + '"><i class="fa-solid fa-check-double"></i> Publish full class</button>'; } }
      ], classRows, { compact: true, empty: "No class results yet." })
    });
    const detail = ui.card({
      title: "Class result management", subtitle: "Select department → program → semester → section, then review the class result",
      body: ES.common.pickerHTML("rs", resUI, { extra: ES.common.select("rsCourse", "Course", courses, resUI.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course" }) }) +
        (resUI.sectionId ? '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Showing students belonging only to <strong>' + ui.esc(data.sectionLabel(resUI.sectionId, true)) + "</strong>. Teachers prepare marks; the principal reviews and publishes them.</div>" : "") +
        (result ? '<div class="result-meta"><div><span>Status</span><strong>' + ui.badge(result.status) + "</strong></div>" +
          '<div><span>Submitted by</span><strong>' + ui.esc((data.teacher(result.teacherId) || {}).name || "—") + "</strong></div>" +
          '<div><span>Submitted at</span><strong>' + ui.esc(result.submittedAt || "—") + "</strong></div>" +
          '<div><span>Students</span><strong>' + rows.length + "</strong></div></div>" : "") +
        (result ? ui.table(marksColumns(false), rows, { compact: true, empty: "No result entries found." }) : ui.empty("Select a section and course to view a class result.")) +
        (result ? '<div class="form-actions"><button class="btn" data-res-print="' + result.id + '"><i class="fa-solid fa-print"></i> Print class result sheet</button>' +
          (result.status !== "Published" ? '<button class="btn btn-primary" data-publish-class="' + result.sectionId + '"><i class="fa-solid fa-check-double"></i> Publish full class</button>' : "") +
          '<button class="btn" data-nav="result-approval"><i class="fa-solid fa-check-to-slot"></i> Go to approval</button></div>' : "")
    });
    return page("Result management", "Class-wise publication and section-isolated class results", overview + detail, "", ["Results"]);
  };

  mounts.results = function (root) {
    ES.common.bindPicker(root, "rs", resUI, function () { resUI.courseId = ""; ES.app.refresh(); });
    ui.on(root, "[data-rsCourse]", "change", function (e, el) { resUI.courseId = el.value; ES.app.refresh(); });
    ui.on(root, "[data-res-print]", "click", function (e, el) { printClassResult(el.getAttribute("data-res-print")); });
    ui.on(root, "[data-publish-class]", "click", function (e, el) { publishClassResults(el.getAttribute("data-publish-class")); });
  };

  function printClassResult(resultId) {
    const result = store.state.results.find(function (r) { return r.id === resultId; });
    if (!result) return;
    const rows = resultRows(result);
    const section = data.section(result.sectionId);
    const meta = [data.sectionLabel(result.sectionId, true), (data.course(result.courseId) || {}).code || "", result.status].join(" · ");
    const body = '<div class="meta">' +
      [["Department", (data.department(section.departmentId) || {}).name], ["Program", (data.program(section.programId) || {}).name],
        ["Semester", data.semesterLabel(section.semesterId)], ["Section", section.name], ["Course", (data.course(result.courseId) || {}).name]].map(function (m) {
        return "<div><span>" + ui.esc(m[0]) + "</span><strong>" + ui.esc(m[1] || "—") + "</strong></div>";
      }).join("") + "</div><h2>Class result sheet</h2><table><thead><tr><th>Roll no.</th><th>Student</th><th>Assignment</th><th>Quiz</th><th>Midterm</th><th>Final</th><th>Total</th><th>%</th><th>Grade</th><th>GPA</th></tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><td>" + ui.esc(r.student.rollNo) + "</td><td>" + ui.esc(r.student.name) + "</td><td class='num'>" + r.entry.assignment + "</td><td class='num'>" + r.entry.quiz + "</td><td class='num'>" + r.entry.midterm + "</td><td class='num'>" + r.entry.final + "</td><td class='num'>" + r.calc.total + "</td><td class='num'>" + r.calc.percentage + "</td><td>" + r.calc.grade + "</td><td class='num'>" + r.calc.gpa.toFixed(2) + "</td></tr>"; }).join("") +
      "</tbody></table><div class='notice'>Frontend demo document. Print or save as PDF using your browser's print dialog.</div>";
    ui.printDocument("Class Result Sheet", body, meta);
  }

  const approvalUI = { status: "All" };

  views["result-approval"] = function () {
    const rows = store.state.results.filter(function (r) { return approvalUI.status === "All" || r.status === approvalUI.status; })
      .sort(function (a, b) { return (b.submittedAt || "").localeCompare(a.submittedAt || ""); });
    const body = ui.card({
      title: "Result approval queue", subtitle: "Review complete class results before publication",
      body: '<div class="toolbar">' + ES.common.select("ap-status", "Status", ["All", "Submitted", "Under Review", "Returned", "Approved", "Published", "Draft"], approvalUI.status) + "</div>" +
        ui.table([
          { label: "Class", render: function (r) { return "<strong>" + ui.esc(data.sectionLabel(r.sectionId, true)) + "</strong><small class=\"cell-note\">" + ui.esc((data.course(r.courseId) || {}).code || "") + "</small>"; } },
          { label: "Teacher", render: function (r) { return ui.esc((data.teacher(r.teacherId) || {}).name || "—"); } },
          { label: "Submitted", render: function (r) { return ui.esc(r.submittedAt || "—"); } },
          { label: "Students", render: function (r) { return (r.entries || []).length; } },
          { label: "Status", render: function (r) { return ui.badge(r.status); } },
          { label: "Actions", render: function (r) { return ES.common.actions([
            { icon: "fa-eye", title: "Review result", attrs: 'data-approve="' + r.id + '"' },
            { icon: "fa-check-double", title: "Publish full class", attrs: 'data-publish-class="' + r.sectionId + '"' },
            { icon: "fa-print", title: "Print sheet", attrs: 'data-approval-print="' + r.id + '"' }
          ]); } }
        ], rows, { compact: true, empty: "No results in this status." })
    });
    return page("Result approval", "Approve, return and publish submitted class results", body, "", ["Results"]);
  };

  mounts["result-approval"] = function (root) {
    ui.on(root, "[data-ap-status]", "change", function (e, el) { approvalUI.status = el.value; ES.app.refresh(); });
    ui.on(root, "[data-approval-print]", "click", function (e, el) { printClassResult(el.getAttribute("data-approval-print")); });
    ui.on(root, "[data-publish-class]", "click", function (e, el) { publishClassResults(el.getAttribute("data-publish-class")); });
    ui.on(root, "[data-approve]", "click", function (e, el) {
      const result = store.state.results.find(function (r) { return r.id === el.getAttribute("data-approve"); });
      if (!result) return;
      const rows = resultRows(result);
      const incomplete = rows.filter(function (r) { return !r.calc.complete; });
      const body = '<div class="notice ' + (incomplete.length ? "notice-warn" : "notice-info") + '"><i class="fa-solid ' + (incomplete.length ? "fa-triangle-exclamation" : "fa-circle-info") + '"></i>' +
        (incomplete.length ? incomplete.length + " student(s) have incomplete or invalid marks." : "All " + rows.length + " students have complete marks.") + "</div>" +
        (result.remarks ? '<div class="notice">' + ui.esc(result.remarks) + "</div>" : "") +
        ui.table(marksColumns(false), rows, { compact: true }) +
        ui.textarea("remarks", "Review remarks", result.remarks, { rows: 3, placeholder: "Add remarks for the teacher or publication record" });
      const canReturn = ["Submitted", "Under Review"].indexOf(result.status) !== -1;
      const canApprove = ["Submitted", "Under Review", "Returned"].indexOf(result.status) !== -1;
      ui.openModal({
        title: "Review class result · " + data.sectionLabel(result.sectionId, true), size: "modal-lg", body: body,
        saveLabel: canApprove ? "Approve class result" : null,
        buttons: [
          canReturn ? { label: "Return for correction", class: "btn-danger", onClick: function (form, close) {
            if (!form.remarks.value.trim()) { ui.toast("Add remarks before returning.", "error"); return; }
            commit(function () {
              result.status = "Returned"; result.remarks = form.remarks.value.trim(); result.reviewedBy = "Principal Office";
              data.notify({ title: "Result returned", message: data.sectionLabel(result.sectionId, true) + " · " + form.remarks.value.trim(), type: "Result Approval", role: "teacher", userId: result.teacherId });
            }, "Result returned to teacher.", { action: "Result Returned", related: data.sectionLabel(result.sectionId, true) });
            close(); ES.app.refresh();
          } } : null,
          result.status === "Approved" ? { label: "Publish result", class: "btn-primary", onClick: function (form, close) {
            ui.confirm({ title: "Publish result", message: "Publish the complete class result to students? Published results become read-only.", onConfirm: function () {
              commit(function () {
                result.status = "Published"; result.publishedAt = stamp(); result.remarks = form.remarks.value.trim() || result.remarks;
                const students = data.studentsInSection(result.sectionId);
                students.forEach(function (s) {
                  data.notify({ title: "Result published", message: (data.course(result.courseId) || {}).code + " · " + data.semesterLabel(result.semesterId), type: "Published Result", role: "student", userId: s.id });
                });
              }, "Result published to students.", { action: "Result Published", related: data.sectionLabel(result.sectionId, true) });
              close(); ES.app.refresh();
            } });
          } } : null,
          { label: "Close", class: "btn-ghost", onClick: function (f, close) { close(); } }
        ].filter(Boolean),
        onSave: canApprove ? function (values, form, close) {
          if (incomplete.length) { ui.toast("Resolve incomplete marks before approving.", "error"); return; }
          commit(function () {
            result.status = "Approved"; result.approvedAt = stamp(); result.reviewedBy = "Principal Office"; result.remarks = values.remarks;
            data.notify({ title: "Result approved", message: data.sectionLabel(result.sectionId, true) + " is ready for publication.", type: "Result Approval", role: "teacher", userId: result.teacherId });
          }, "Class result approved.", { action: "Result Approved", related: data.sectionLabel(result.sectionId, true) });
          close(); ES.app.refresh();
        } : null
      });
    });
  };

  views.calendar = function () {
    const events = store.state.events.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    const grouped = events.reduce(function (acc, e) { (acc[e.date] = acc[e.date] || []).push(e); return acc; }, {});
    const body = ui.card({
      title: "Academic calendar", subtitle: "Semester dates, examinations, holidays and university events",
      actions: '<button class="btn btn-primary" data-cal-action="add"><i class="fa-solid fa-plus"></i> Add event</button>',
      body: Object.keys(grouped).length ? Object.keys(grouped).map(function (date) {
        return '<div class="calendar-date"><div class="calendar-date-label"><strong>' + ui.esc(ui.fmtDate(date)) + "</strong></div><div class=\"calendar-events\">" +
          grouped[date].map(function (e) {
            return '<div class="calendar-event"><span class="event-type">' + ui.esc(e.type) + "</span><strong>" + ui.esc(e.title) + "</strong>" +
              '<div class="row-actions"><button class="icon-action" data-cal-action="edit" data-id="' + e.id + '"><i class="fa-solid fa-pen"></i></button>' +
              '<button class="icon-action danger" data-cal-action="delete" data-id="' + e.id + '"><i class="fa-solid fa-trash"></i></button></div></div>';
          }).join("") + "</div></div>";
      }).join("") : ui.empty("No academic events yet.")
    });
    return page("Academic calendar", "Institution-wide academic schedule", body, "", ["Calendar"]);
  };

  mounts.calendar = function (root) {
    ui.on(root, "[data-cal-action]", "click", function (e, el) {
      const action = el.getAttribute("data-cal-action");
      const event = store.state.events.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (action === "delete" && event) {
        ui.confirm({ title: "Remove event", message: "Remove " + event.title + "?", onConfirm: function () {
          commit(function (state) { state.events = state.events.filter(function (x) { return x.id !== event.id; }); }, "Event removed.", { action: "Calendar Event Removed", related: event.title });
          ES.app.refresh();
        } });
        return;
      }
      const v = event || {};
      ui.openModal({
        title: event ? "Edit calendar event" : "Add calendar event",
        body: '<div class="form-grid">' + ui.textInput("title", "Event title", v.title, { required: true }) +
          ES.common.select("type", "Type", ["Semester Start", "Semester End", "Midterm Examination", "Final Examination", "Quiz", "Holiday", "University Event", "Assignment Deadline", "Meeting", "Academic"], v.type) +
          ui.textInput("date", "Date", v.date, { type: "date", required: true }) + "</div>" +
          ui.textarea("description", "Description", v.description, { rows: 3 }),
        saveLabel: event ? "Save changes" : "Add event",
        onSave: function (values, form, close) {
          commit(function (state) {
            if (event) Object.assign(state.events.find(function (x) { return x.id === event.id; }), values);
            else state.events.push(Object.assign({ id: ES.uid("ev") }, values));
          }, event ? "Event updated." : "Event added.", { action: "Calendar Event Updated", related: values.title });
          close(); ES.app.refresh();
        }
      });
    });
  };
})();
