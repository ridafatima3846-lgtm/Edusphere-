(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.student = ES.views.student || {};
  const mounts = ES.mounts.student = ES.mounts.student || {};
  const uiState = { attendanceCourse: "", quizAttemptFlash: false };

  function student() {
    const ctx = ES.app.context("student");
    return ctx.user || data.activeStudents()[0];
  }
  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({ title: title, subtitle: subtitle, actions: actions || "", breadcrumb: ["Student", "My Workspace"].concat(crumbs || [title]) }) + body;
  }
  function commit(fn, message) {
    store.update(fn);
    if (message) ui.toast(message);
  }
  function stamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }

  function myAssignments() {
    const s = student();
    return store.state.assignments.filter(function (a) { return a.sectionId === s.sectionId; });
  }
  function myQuizzes() {
    const s = student();
    return store.state.quizzes.filter(function (q) { return q.sectionId === s.sectionId; });
  }
  function myResults(publishedOnly) {
    const s = student();
    return data.resultEntriesForStudent(s.id, publishedOnly !== false);
  }
  function myAnnouncements() {
    const s = student();
    return store.state.announcements.filter(function (a) {
      const audience = a.audience || { type: "all" };
      if (audience.type === "all") return true;
      if (audience.type === "department") return audience.value === s.departmentId;
      if (audience.type === "program") return audience.value === s.programId;
      if (audience.type === "semester") return audience.value === s.semesterId;
      if (audience.type === "section") return audience.value === s.sectionId;
      return false;
    }).sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
  }

  views.overview = function () {
    const s = student();
    const attendance = data.attendanceStats(s.id);
    const timetable = data.timetableFor(s.sectionId);
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const upcoming = timetable.filter(function (t) { return t.day === day; }).slice(0, 4);
    const pending = myAssignments().filter(function (a) {
      return !(a.submissions || []).some(function (sub) { return sub.studentId === s.id; });
    });
    const results = myResults();
    const recentQuizzes = myQuizzes().map(function (q) {
      const attempt = (q.attempts || []).find(function (a) { return a.studentId === s.id; });
      return { quiz: q, attempt: attempt };
    }).filter(function (x) { return x.attempt; }).slice(0, 4);
    const body = '<div class="stats-grid">' +
      ui.statCard({ label: "Current semester", value: data.semesterLabel(s.semesterId).replace(" Semester", ""), icon: "fa-layer-group", tone: "blue", note: data.semesterLabel(s.semesterId) }) +
      ui.statCard({ label: "Section", value: data.sectionLabel(s.sectionId), icon: "fa-chalkboard", tone: "teal", note: data.programLabel(s.programId) }) +
      ui.statCard({ label: "Attendance", value: attendance.percentage + "%", icon: "fa-clipboard-check", tone: attendance.percentage >= data.threshold() ? "green" : "amber", note: "Threshold " + data.threshold() + "%" }) +
      ui.statCard({ label: "Published results", value: results.length, icon: "fa-file-circle-check", tone: "slate", note: "Your results only" }) +
      "</div><div class=\"grid grid-2-1\">" +
      ui.card({ title: "Today's lectures", subtitle: day, body: ui.table([
        { label: "Time", render: function (t) { return t.start + "–" + t.end; } },
        { label: "Course", render: function (t) { return ui.esc((data.course(t.courseId) || {}).code || "—"); } },
        { label: "Teacher", render: function (t) { return ui.esc((data.teacher(t.teacherId) || {}).name || "—"); } },
        { label: "Room", key: "room" }
      ], upcoming, { compact: true, empty: "No lectures scheduled for today." }) }) +
      ui.card({ title: "Pending assignments", subtitle: "Not yet submitted", body: pending.length ? '<ul class="list-plain">' + pending.map(function (a) {
        return '<li><i class="fa-solid fa-file-lines"></i><div><strong>' + ui.esc(a.title) + "</strong><small>Due " + ui.esc(ui.fmtDate(a.dueDate)) + " · " + ui.esc((data.course(a.courseId) || {}).code || "") + "</small></div></li>";
      }).join("") + "</ul>" : ui.empty("No pending assignments.") }) +
      "</div><div class=\"grid grid-2\">" +
      ui.card({ title: "Recent quiz results", body: ui.table([
        { label: "Quiz", render: function (r) { return ui.esc(r.quiz.title); } },
        { label: "Score", render: function (r) { return r.attempt.score + " / " + r.quiz.marks; } },
        { label: "Attempted", render: function (r) { return ui.esc(r.attempt.submittedAt); } }
      ], recentQuizzes, { compact: true, empty: "No quiz attempts yet." }) }) +
      ui.card({ title: "Published results", body: ui.table([
        { label: "Course", render: function (r) { return ui.esc((r.course || {}).code || "—"); } },
        { label: "Marks", render: function (r) { return r.entry.total + " / " + r.calc.total; } },
        { label: "Grade", render: function (r) { return ui.badge(r.calc.grade); } },
        { label: "Status", render: function () { return ui.badge("Published"); } }
      ], results.map(function (r) { return Object.assign({}, r, { calc: data.evaluate(r.entry) }); }), { compact: true, empty: "No published results yet." }) }) +
      "</div>" + ui.card({ title: "Important announcements", body: '<ul class="list-plain">' + myAnnouncements().slice(0, 5).map(function (a) {
        return '<li><i class="fa-solid fa-bullhorn"></i><div><strong>' + ui.esc(a.title) + "</strong><small>" + ui.esc(a.message) + "</small></div></li>";
      }).join("") + "</ul>" });
    return page("Student overview", "Welcome, " + s.name + " · " + data.programLabel(s.programId) + " · " + data.semesterLabel(s.semesterId), body,
      '<button class="btn btn-primary" data-nav="attendance"><i class="fa-solid fa-chart-pie"></i> My attendance</button>', ["Overview"]);
  };

  views.profile = function () {
    const s = student();
    const rows = [
      ["Roll number", s.rollNo], ["Father name", s.fatherName], ["Email", s.email], ["Phone", s.phone],
      ["Date of birth", ui.fmtDate(s.dob)], ["Gender", s.gender], ["Department", (data.department(s.departmentId) || {}).name],
      ["Program", (data.program(s.programId) || {}).name], ["Academic year", (data.year(s.academicYearId) || {}).label],
      ["Semester", data.semesterLabel(s.semesterId)], ["Section", data.sectionLabel(s.sectionId)], ["Admission date", ui.fmtDate(s.admissionDate)], ["Address", s.address], ["Status", s.status]
    ];
    const body = ui.card({ title: "Student profile", subtitle: "Your academic and contact information",
      actions: '<button class="btn" data-profile-print><i class="fa-solid fa-print"></i> Print profile</button>',
      body: '<div class="profile-modal">' + ES.common.person(s.name, s.rollNo + " · " + data.programLabel(s.programId), s.photo) +
        '<div class="detail-grid">' + rows.map(function (r) { return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1] || "—") + "</strong></div>"; }).join("") + "</div></div>" });
    return page("My profile", "Personal and enrollment details", body, "", ["Profile"]);
  };
  mounts.profile = function (root) {
    ui.on(root, "[data-profile-print]", "click", function () {
      const s = student();
      const rows = [["Roll number", s.rollNo], ["Father name", s.fatherName], ["Email", s.email], ["Department", (data.department(s.departmentId) || {}).name],
        ["Program", (data.program(s.programId) || {}).name], ["Semester", data.semesterLabel(s.semesterId)], ["Section", data.sectionLabel(s.sectionId)]];
      ui.printDocument("Student Profile", '<div class="meta">' + rows.map(function (r) { return "<div><span>" + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1]) + "</strong></div>"; }).join("") + "</div>" +
        "<h2>Enrollment details</h2><p>Admission date: " + ui.fmtDate(s.admissionDate) + " · Status: " + ui.esc(s.status) + "</p>", "Frontend demo profile");
    });
  };

  views.courses = function () {
    const s = student();
    const courses = data.coursesForSection(s.sectionId);
    const body = ui.card({ title: "My courses", subtitle: data.sectionLabel(s.sectionId, true),
      body: ui.table([
        { label: "Course", render: function (c) { return "<strong>" + ui.esc(c.code) + "</strong><small class=\"cell-note\">" + ui.esc(c.name) + "</small>"; } },
        { label: "Credits", key: "credits" },
        { label: "Teacher", render: function (c) {
          const a = store.state.teacherAssignments.find(function (x) { return x.courseId === c.id && x.sectionId === s.sectionId; });
          return ui.esc(a ? ((data.teacher(a.teacherId) || {}).name || "—") : "—");
        } },
        { label: "Description", render: function (c) { return ui.esc(c.description || "—"); } }
      ], courses, { compact: true, empty: "No courses assigned to your section." }) });
    return page("My courses", "Courses for your current semester and section", body, "", ["Courses"]);
  };

  views.timetable = function () {
    const s = student();
    const rows = data.timetableFor(s.sectionId);
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const body = ui.card({ title: "My timetable", subtitle: data.sectionLabel(s.sectionId, true),
      body: '<div class="timetable-grid">' + days.map(function (day) {
        const list = rows.filter(function (r) { return r.day === day; });
        return '<div class="timetable-day"><h3>' + day + "</h3>" + (list.length ? list.map(function (r) {
          return '<div class="timetable-entry"><div class="tt-time">' + r.start + "–" + r.end + "</div><strong>" + ui.esc((data.course(r.courseId) || {}).code || "—") + "</strong>" +
            "<span>" + ui.esc((data.course(r.courseId) || {}).name || "") + "</span><small>" + ui.esc((data.teacher(r.teacherId) || {}).name || "—") + " · " + ui.esc(r.room || "") + "</small></div>";
        }).join("") : '<div class="tt-empty">No lectures</div>') + "</div>";
      }).join("") + "</div>" });
    return page("My timetable", "Weekly class schedule", body, "", ["Timetable"]);
  };

  views.attendance = function () {
    const s = student();
    const overall = data.attendanceStats(s.id);
    const courses = data.coursesForSection(s.sectionId);
    if (!uiState.attendanceCourse && courses.length) uiState.attendanceCourse = courses[0].id;
    const courseStats = courses.map(function (c) {
      return { course: c, stats: data.attendanceStats(s.id, c.id) };
    });
    const lectures = data.attendanceFor(s.sectionId, uiState.attendanceCourse);
    const rows = lectures.map(function (a) {
      const entry = (a.records || []).find(function (r) { return r.studentId === s.id; });
      return { date: a.date, lecture: a.lecture, course: (data.course(a.courseId) || {}).code, status: entry ? entry.status : "—" };
    });
    const monthly = lectures.reduce(function (acc, a) {
      const key = a.date.slice(0, 7);
      const entry = (a.records || []).find(function (r) { return r.studentId === s.id; });
      acc[key] = acc[key] || { total: 0, attended: 0 };
      acc[key].total++;
      if (entry && (entry.status === "Present" || entry.status === "Late")) acc[key].attended++;
      return acc;
    }, {});
    const body =
      (overall.percentage < data.threshold() ? '<div class="notice notice-warn"><i class="fa-solid fa-triangle-exclamation"></i>Your attendance is below the institutional threshold of ' + data.threshold() + "%. Please contact your class teacher.</div>" : "") +
      '<div class="stats-grid compact-stats">' +
        ui.statCard({ label: "Overall attendance", value: overall.percentage + "%", icon: "fa-chart-pie", tone: overall.percentage >= data.threshold() ? "green" : "amber" }) +
        ui.statCard({ label: "Lectures", value: overall.total, icon: "fa-calendar-check", tone: "blue" }) +
        ui.statCard({ label: "Present", value: overall.present, icon: "fa-check", tone: "green" }) +
        ui.statCard({ label: "Absent / Late / Leave", value: overall.absent + " / " + overall.late + " / " + overall.leave, icon: "fa-calendar-minus", tone: "slate" }) +
        "</div>" +
      ui.card({ title: "Subject-wise attendance", body: ui.table([
        { label: "Course", render: function (r) { return ui.esc(r.course.code + " · " + r.course.name); } },
        { label: "Attendance", render: function (r) { return ui.progress(r.stats.percentage, r.stats.percentage >= data.threshold() ? "good" : "warn"); } },
        { label: "Lectures", render: function (r) { return r.stats.total; } }
      ], courseStats, { compact: true, empty: "No course attendance available." }) }) +
      ui.card({ title: "Lecture-wise history", subtitle: "Read-only attendance records",
        body: '<div class="toolbar">' + ES.common.select("saCourse", "Course", courses.map(function (c) { return { id: c.id, name: c.code + " · " + c.name }; }), uiState.attendanceCourse, { labelKey: "name" }) + "</div>" +
          ui.table([{ label: "Date", render: function (r) { return ui.esc(ui.fmtDate(r.date)); } }, { label: "Lecture", key: "lecture" },
            { label: "Course", key: "course" }, { label: "Status", render: function (r) { return ui.badge(r.status); } }], rows, { compact: true, empty: "No lecture history for this course." }) }) +
      ui.card({ title: "Monthly attendance", body: ui.table([
        { label: "Month", key: "month" }, { label: "Lectures", key: "total" }, { label: "Attended", key: "attended" },
        { label: "Percentage", render: function (r) { return r.total ? Math.round((r.attended / r.total) * 100) + "%" : "—"; } }
      ], Object.keys(monthly).map(function (key) { return Object.assign({ month: key }, monthly[key]); }), { compact: true, empty: "No monthly data yet." }) });
    return page("My attendance", "Your own lecture, subject and monthly attendance only", body, "", ["Attendance"]);
  };
  mounts.attendance = function (root) {
    ui.on(root, "[data-saCourse]", "change", function (e, el) { uiState.attendanceCourse = el.value; ES.app.refresh(); });
  };

  views.assignments = function () {
    const s = student();
    const rows = myAssignments().map(function (a) {
      const sub = (a.submissions || []).find(function (x) { return x.studentId === s.id; });
      return { assignment: a, submission: sub || null };
    });
    const body = ui.card({ title: "My assignments", subtitle: "Deadlines, submissions and teacher feedback",
      body: ui.table([
        { label: "Assignment", render: function (r) { return "<strong>" + ui.esc(r.assignment.title) + "</strong><small class=\"cell-note\">" + ui.esc(r.assignment.description || "") + "</small>"; } },
        { label: "Course", render: function (r) { return ui.esc((data.course(r.assignment.courseId) || {}).code || "—"); } },
        { label: "Deadline", render: function (r) { return ui.esc(ui.fmtDate(r.assignment.dueDate)); } },
        { label: "Marks", render: function (r) { return r.assignment.marks; } },
        { label: "Status", render: function (r) { return ui.badge(r.submission ? (r.submission.status || "Submitted") : "Pending"); } },
        { label: "Feedback", render: function (r) { return ui.esc(r.submission && r.submission.feedback ? r.submission.feedback : "—"); } },
        { label: "Action", render: function (r) { return '<button class="link-btn" data-submit-assignment="' + r.assignment.id + '">' + (r.submission ? "View submission" : "Submit") + "</button>"; } }
      ], rows, { compact: true, empty: "No assignments for your section." }) });
    return page("My assignments", "Assignments assigned to your section", body, "", ["Assignments"]);
  };
  mounts.assignments = function (root) {
    ui.on(root, "[data-submit-assignment]", "click", function (e, el) {
      const a = store.state.assignments.find(function (x) { return x.id === el.getAttribute("data-submit-assignment"); });
      const s = student();
      const sub = (a.submissions || []).find(function (x) { return x.studentId === s.id; });
      if (sub) {
        ui.openModal({ title: "Submission · " + a.title, saveLabel: null,
          buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
          body: '<div class="detail-grid">' + [["Submitted", sub.submittedAt], ["Response", sub.response], ["Marks", sub.marks !== undefined ? sub.marks : "Not graded"], ["Feedback", sub.feedback || "—"]].map(function (r) {
            return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1] || "—") + "</strong></div>";
          }).join("") + "</div>" });
        return;
      }
      ui.openModal({ title: "Submit assignment · " + a.title, body: ui.textarea("response", "Your demo response", "", { rows: 5, required: true, placeholder: "Write a short response or describe your submitted work" }),
        saveLabel: "Submit demo response",
        onSave: function (values, form, close) {
          commit(function (state) {
            const record = state.assignments.find(function (x) { return x.id === a.id; });
            record.submissions = record.submissions || [];
            record.submissions.push({ studentId: s.id, response: values.response, submittedAt: stamp(), status: "Submitted", marks: undefined, feedback: "" });
            data.notify({ title: "Assignment submitted", message: a.title + " · " + stamp(), type: "New Assignment", role: "teacher", userId: a.teacherId });
          }, "Demo response submitted.");
          close(); ES.app.refresh();
        }
      });
    });
  };

  views.quizzes = function () {
    const s = student();
    const rows = myQuizzes().map(function (q) {
      const attempt = (q.attempts || []).find(function (a) { return a.studentId === s.id; });
      return { quiz: q, attempt: attempt };
    });
    const body = ui.card({ title: "My quizzes", subtitle: "Attempt sample quizzes and view your scores",
      body: ui.table([
        { label: "Quiz", render: function (r) { return "<strong>" + ui.esc(r.quiz.title) + "</strong><small class=\"cell-note\">" + r.quiz.questions.length + " questions · " + r.quiz.duration + " min</small>"; } },
        { label: "Course", render: function (r) { return ui.esc((data.course(r.quiz.courseId) || {}).code || "—"); } },
        { label: "Marks", render: function (r) { return r.quiz.marks; } },
        { label: "Status", render: function (r) { return ui.badge(r.attempt ? "Attempted" : "Not attempted"); } },
        { label: "Score", render: function (r) { return r.attempt ? r.attempt.score + " / " + r.quiz.marks : "—"; } },
        { label: "Action", render: function (r) { return '<button class="link-btn" data-quiz-open="' + r.quiz.id + '">' + (r.attempt ? "View attempt" : "Attempt quiz") + "</button>"; } }
      ], rows, { compact: true, empty: "No quizzes assigned to your section." }) });
    return page("My quizzes", "Quizzes for your section", body, "", ["Quizzes"]);
  };
  mounts.quizzes = function (root) {
    ui.on(root, "[data-quiz-open]", "click", function (e, el) {
      const q = store.state.quizzes.find(function (x) { return x.id === el.getAttribute("data-quiz-open"); });
      const s = student();
      const attempt = (q.attempts || []).find(function (a) { return a.studentId === s.id; });
      if (attempt) {
        ui.openModal({ title: "Quiz result · " + q.title, saveLabel: null, buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
          body: '<div class="result-hero"><strong>' + attempt.score + " / " + q.marks + "</strong><span>" + Math.round((attempt.score / q.marks) * 100) + "%</span></div>" +
            '<p class="modal-note">Attempted ' + ui.esc(attempt.submittedAt) + ". Demo quizzes intentionally show the result immediately.</p>" });
        return;
      }
      const body = '<div class="notice notice-info"><i class="fa-solid fa-clock"></i>Time limit: ' + q.duration + " minutes. This is a demo attempt with instant scoring.</div>" +
        q.questions.map(function (question, i) {
          return '<div class="question-preview"><strong>' + (i + 1) + ". " + ui.esc(question.text) + "</strong>" +
            '<div class="quiz-options">' + question.options.map(function (option, oi) {
              return '<label><input type="radio" name="answer' + i + '" value="' + oi + '"> ' + ui.esc(option) + "</label>";
            }).join("") + "</div></div>";
        }).join("");
      ui.openModal({ title: "Attempt quiz · " + q.title, size: "modal-lg", body: body, saveLabel: "Submit quiz",
        onSave: function (values, form, close) {
          let score = 0;
          q.questions.forEach(function (question, i) {
            const chosen = form.querySelector('input[name="answer' + i + '"]:checked');
            if (chosen && Number(chosen.value) === question.answer) score += 1;
          });
          const scaled = q.questions.length ? Math.round((score / q.questions.length) * q.marks) : 0;
          commit(function (state) {
            const record = state.quizzes.find(function (x) { return x.id === q.id; });
            record.attempts = record.attempts || [];
            record.attempts.push({ studentId: s.id, score: scaled, submittedAt: stamp() });
          }, "Quiz submitted. Score: " + scaled + " / " + q.marks);
          close(); ES.app.refresh();
        }
      });
    });
  };

  function resultCard(result, entry, current) {
    const s = student();
    const calc = data.evaluate(entry);
    const section = data.section(result.sectionId) || s;
    const body = '<div class="meta">' +
      [["Student", s.name], ["Roll number", s.rollNo], ["Department", (data.department(s.departmentId) || {}).name], ["Program", (data.program(s.programId) || {}).name],
        ["Semester", data.semesterLabel(section.semesterId)], ["Section", section.name], ["Course", (data.course(result.courseId) || {}).name]].map(function (m) {
        return "<div><span>" + ui.esc(m[0]) + "</span><strong>" + ui.esc(m[1]) + "</strong></div>";
      }).join("") + "</div><h2>Subject-wise marks</h2><table><thead><tr><th>Assessment</th><th>Marks</th><th>Maximum</th></tr></thead><tbody>" +
      [["Assignment", entry.assignment, data.grading().maximumMarks.assignment], ["Quiz", entry.quiz, data.grading().maximumMarks.quiz],
        ["Midterm", entry.midterm, data.grading().maximumMarks.midterm], ["Final", entry.final, data.grading().maximumMarks.final]].map(function (m) {
        return "<tr><td>" + m[0] + "</td><td class='num'>" + ui.esc(m[1]) + "</td><td class='num'>" + m[2] + "</td></tr>";
      }).join("") + "</tbody></table><div class='meta'><div><span>Total</span><strong>" + calc.total + " / " + calc.maximum + "</strong></div>" +
      "<div><span>Percentage</span><strong>" + calc.percentage + "%</strong></div><div><span>Grade</span><strong>" + calc.grade + "</strong></div>" +
      "<div><span>GPA</span><strong>" + calc.gpa.toFixed(2) + "</strong></div><div><span>Result status</span><strong>" + result.status + "</strong></div></div>" +
      "<div class='notice'>Frontend demo result card. Not an official university transcript.</div>";
    ui.printDocument("Student Result Card", body, (current ? "Current semester" : "Previous semester") + " · " + result.status);
  }

  function resultsView(previous) {
    const s = student();
    const rows = myResults().filter(function (r) {
      const isCurrent = r.result.semesterId === s.semesterId;
      return previous ? !isCurrent : isCurrent;
    }).map(function (r) { return Object.assign({}, r, { calc: data.evaluate(r.entry) }); });
    const body = ui.card({ title: previous ? "Previous semester results" : "My published results", subtitle: "Only results published by the principal are visible",
      body: ui.table([
        { label: "Semester", render: function (r) { return ui.esc(data.semesterLabel(r.result.semesterId)); } },
        { label: "Course", render: function (r) { return ui.esc((r.course || {}).code + " · " + ((r.course || {}).name || "")); } },
        { label: "Section", render: function (r) { return ui.esc(data.sectionLabel(r.result.sectionId)); } },
        { label: "Total", render: function (r) { return r.entry.total; } },
        { label: "Percentage", render: function (r) { return r.calc.percentage + "%"; } },
        { label: "Grade", render: function (r) { return ui.badge(r.calc.grade); } },
        { label: "GPA", render: function (r) { return r.calc.gpa.toFixed(2); } },
        { label: "Action", render: function (r) { return '<button class="link-btn" data-card="' + r.result.id + '">Result card</button>'; } }
      ], rows, { compact: true, empty: previous ? "No previous semester results published." : "No published results for your current semester." }) });
    return page(previous ? "Previous results" : "My results", previous ? "Historical published results" : "Published results for the current semester", body, "", [previous ? "Previous Results" : "Results"]);
  }
  views.results = function () { return resultsView(false); };
  views["previous-results"] = function () { return resultsView(true); };
  function bindResultCards(root) {
    ui.on(root, "[data-card]", "click", function (e, el) {
      const result = store.state.results.find(function (r) { return r.id === el.getAttribute("data-card"); });
      const s = student();
      const entry = (result.entries || []).find(function (x) { return x.studentId === s.id; });
      if (entry) resultCard(result, entry, result.semesterId === s.semesterId);
    });
  }
  mounts.results = bindResultCards;
  mounts["previous-results"] = bindResultCards;

  views.announcements = function () {
    const rows = myAnnouncements();
    const body = ui.card({ title: "Announcements", subtitle: "Notices relevant to your department, program, semester or section",
      body: rows.length ? '<div class="notice-list">' + rows.map(function (a) {
        return '<div class="notice-item"><i class="fa-solid fa-bullhorn"></i><span><strong>' + ui.esc(a.title) + "</strong><small>" + ui.esc(a.message) + "</small><small>" + ui.esc(a.createdAt) + " · " + ui.esc(a.author) + "</small></span></div>";
      }).join("") + "</div>" : ui.empty("No announcements for you yet.") });
    return page("Announcements", "Relevant institutional notices", body, "", ["Announcements"]);
  };

  views.messages = function () {
    const s = student();
    const messages = data.messagesFor("student", s.id);
    const teachers = store.state.teachers;
    const body = '<div class="grid grid-1-2">' +
      ui.card({ title: "Conversation", body: messages.length ? '<div class="thread">' + messages.map(function (m) {
        return '<div class="bubble ' + (m.toRole === "student" ? "in" : "out") + '"><strong>' + ui.esc(m.subject) + "</strong><p>" + ui.esc(m.body) + "</p><small>" + ui.esc(m.sentAt) + "</small></div>";
      }).join("") + "</div>" : ui.empty("No messages yet.") }) +
      ui.card({ title: "Message a teacher", subtitle: "Demo messages are stored locally",
        body: '<form data-student-message><div class="form-grid">' + ES.common.select("toId", "Teacher", teachers, teachers[0] && teachers[0].id, { labelKey: "name" }) +
          '<div class="span-2">' + ui.textInput("subject", "Subject", "", { required: true }) + "</div>" +
          '<div class="span-2">' + ui.textarea("body", "Message", "", { rows: 4, required: true }) + "</div></div>" +
          '<div class="form-actions"><button class="btn btn-primary" type="submit">Send demo message</button></div></form>' }) + "</div>";
    return page("Messages", "Student–teacher demo messages", body, "", ["Messages"]);
  };
  mounts.messages = function (root) {
    ui.on(root, "[data-student-message]", "submit", function (e, form) {
      e.preventDefault();
      const s = student();
      const values = ui.formValues(form);
      commit(function (state) {
        state.messages.push({ id: ES.uid("m"), fromRole: "student", fromId: s.id, toRole: "teacher", toId: values.toId,
          subject: values.subject, body: values.body, sentAt: stamp(), read: false });
      }, "Demo message sent.");
      ES.app.refresh();
    });
  };

  views.notifications = function () {
    const s = student();
    const rows = data.notificationsFor("student", s.id);
    const body = ui.card({ title: "Notifications", subtitle: "Assignments, quizzes, results and attendance alerts",
      actions: '<button class="btn" data-sn-readall>Mark all as read</button>',
      body: rows.length ? '<div class="notice-list">' + rows.map(function (n) {
        return '<div class="notice-item' + (n.read ? "" : " unread") + '"><i class="fa-solid ' + (n.read ? "fa-envelope-open" : "fa-envelope") + '"></i>' +
          "<span><strong>" + ui.esc(n.title) + "</strong><small>" + ui.esc(n.message) + "</small><small>" + ui.esc(n.createdAt) + " · " + ui.esc(n.type) + "</small></span></div>";
      }).join("") + "</div>" : ui.empty("No notifications yet.") });
    return page("Notifications", "Your personal notification center", body, "", ["Notifications"]);
  };
  mounts.notifications = function (root) {
    ui.on(root, "[data-sn-readall]", "click", function () {
      const s = student();
      commit(function (state) { state.notifications.forEach(function (n) { if (n.role === "student" && n.userId === s.id) n.read = true; }); }, "All notifications marked as read.");
      ES.app.refresh();
    });
  };

  views.settings = function () {
    const s = student();
    const theme = localStorage.getItem("edusphere.theme") || "light";
    const body = ui.card({ title: "Settings", subtitle: "Demo personalization",
      body: '<div class="form-grid">' + ES.common.select("themeSelect", "Theme", [{ value: "light", label: "Light mode" }, { value: "dark", label: "Dark mode" }], theme) + "</div>" +
        '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Signed in as ' + ui.esc(s.name) + " (" + ui.esc(s.rollNo) + "). Use the top bar to switch demo roles.</div>" });
    return page("Settings", "Student workspace settings", body, "", ["Settings"]);
  };
  mounts.settings = function (root) {
    ui.on(root, "[data-themeSelect]", "change", function (e, el) { ES.app.applyTheme(el.value); ui.toast("Theme updated."); });
  };
})();
