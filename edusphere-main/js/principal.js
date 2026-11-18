(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.principal = ES.views.principal || {};
  const mounts = ES.mounts.principal = ES.mounts.principal || {};

  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({
      title: title, subtitle: subtitle, actions: actions || "",
      breadcrumb: ["Principal", "Administration"].concat(crumbs || [title])
    }) + body;
  }

  function commit(fn, message, audit) {
    store.update(function (state) {
      fn(state);
      if (audit) data.audit(audit.action, "Principal Office", audit.related || "", audit.description || audit.action, audit.icon);
    });
    if (message) ui.toast(message);
  }

  function options(items, label, value, placeholder) {
    return ES.common.options(items, label, value, placeholder);
  }

  function statusFilter(current) {
    return ES.common.select("status", "Status", ["Active", "Inactive", "Deleted"], current, { placeholder: "All statuses" });
  }

  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function nowStamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }

  views.overview = function () {
    const state = store.state;
    const students = data.activeStudents();
    const pending = state.results.filter(function (r) { return ["Submitted", "Under Review"].indexOf(r.status) !== -1; });
    const today = todayISO();
    const present = state.attendance.filter(function (a) { return a.date === today; }).reduce(function (sum, a) {
      return sum + (a.records || []).filter(function (r) { return r.status === "Present" || r.status === "Late"; }).length;
    }, 0);
    const marked = state.attendance.filter(function (a) { return a.date === today; }).reduce(function (sum, a) { return sum + (a.records || []).length; }, 0);
    const byDept = state.departments.map(function (d) {
      return { label: d.code, value: students.filter(function (s) { return s.departmentId === d.id; }).length };
    });
    const bySemester = state.semesters.map(function (s) {
      return { label: s.number + "", value: students.filter(function (st) { return st.semesterId === s.id; }).length };
    });
    const exams = state.examSchedule.filter(function (e) { return e.date >= today; }).sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 5);
    const events = data.eventsUpcoming(5);
    const low = data.lowAttendanceStudents().length;
    const stats = [
      ui.statCard({ label: "Total students", value: students.length, icon: "fa-user-graduate", tone: "blue", note: state.students.length - students.length + " in recycle bin" }),
      ui.statCard({ label: "Total teachers", value: state.teachers.length, icon: "fa-chalkboard-user", tone: "teal", note: state.teacherAssignments.length + " course assignments" }),
      ui.statCard({ label: "Departments", value: state.departments.length, icon: "fa-building-columns", tone: "slate", note: state.programs.length + " programs offered" }),
      ui.statCard({ label: "Classes / sections", value: state.sections.length, icon: "fa-chalkboard", tone: "blue", note: state.courses.length + " active courses" }),
      ui.statCard({ label: "Today's attendance", value: marked ? Math.round((present / marked) * 100) + "%" : "—", icon: "fa-clipboard-check", tone: "green", note: marked ? present + " of " + marked + " present" : "No lecture marked today" }),
      ui.statCard({ label: "Pending approvals", value: pending.length, icon: "fa-check-to-slot", tone: "amber", note: low + " low-attendance alerts" }),
      ui.statCard({ label: "Academic year", value: data.settings().academicYearLabel, icon: "fa-calendar-range", tone: "slate", note: data.settings().institution.currentTerm }),
      ui.statCard({ label: "Published results", value: state.results.filter(function (r) { return r.status === "Published"; }).length, icon: "fa-file-circle-check", tone: "green", note: "Current demo dataset" })
    ];
    const activityRows = state.activities.slice(0, 6).map(function (a) {
      return { when: a.date || (a.at || "").slice(0, 10), text: a.description || a.text, related: a.related || "—" };
    });
    const body =
      '<div class="stats-grid">' + stats.join("") + "</div>" +
      '<div class="grid grid-2-1">' +
        ui.card({ title: "Enrollment by department", subtitle: "Active students", body: ui.barChart(byDept) }) +
        ui.card({ title: "Pending result approvals", subtitle: "Awaiting principal review", actions: '<button class="link-btn" data-nav="result-approval">Open approvals →</button>',
          body: pending.length ? '<div class="notice-list">' + pending.map(function (r) {
            return '<button class="notice-item" data-review-result="' + r.id + '"><i class="fa-solid fa-file-lines"></i><span><strong>' + ui.esc(data.sectionLabel(r.sectionId, true)) + "</strong><small>" + ui.esc((data.course(r.courseId) || {}).name || "Course") + " · " + ui.esc(r.status) + "</small></span></button>";
          }).join("") + "</div>" : ui.empty("No results are waiting for review.") }) +
      "</div>" +
      '<div class="grid grid-2">' +
        ui.card({ title: "Students by semester", subtitle: "Current academic year", body: ui.barChart(bySemester) }) +
        ui.card({ title: "Recent activities", actions: '<button class="link-btn" data-nav="activity">View all →</button>',
          body: ui.table([{ label: "Date", key: "when" }, { label: "Activity", key: "text" }, { label: "Record", key: "related" }], activityRows, { compact: true, empty: "No activities recorded." }) }) +
      "</div>" +
      '<div class="grid grid-2">' +
        ui.card({ title: "Upcoming examinations", actions: '<button class="link-btn" data-nav="examinations">Manage schedule →</button>',
          body: ui.table([
            { label: "Date", render: function (e) { return ui.esc(ui.fmtDate(e.date)); } },
            { label: "Exam", key: "examType" },
            { label: "Course", render: function (e) { return ui.esc((data.course(e.courseId) || {}).code || "—"); } },
            { label: "Section", render: function (e) { return ui.esc(data.sectionLabel(e.sectionId)); } },
            { label: "Time", render: function (e) { return ui.esc(e.startTime + "–" + e.endTime); } }
          ], exams, { compact: true, empty: "No examinations scheduled." }) }) +
        ui.card({ title: "Academic calendar", actions: '<button class="link-btn" data-nav="calendar">Open calendar →</button>',
          body: '<ul class="list-plain">' + events.map(function (e) {
            return '<li><i class="fa-solid fa-calendar-day"></i><div><strong>' + ui.esc(e.title) + "</strong><small>" + ui.esc(ui.fmtDate(e.date)) + " · " + ui.esc(e.type) + "</small></div></li>";
          }).join("") + "</ul>" }) +
      "</div>" +
      ui.card({ title: "Important announcements", actions: '<button class="link-btn" data-nav="announcements">Manage announcements →</button>',
        body: ui.table([
          { label: "Title", key: "title" },
          { label: "Audience", render: function (a) { return ui.esc(a.audience.type === "all" ? "Entire institution" : a.audience.type); } },
          { label: "Published", key: "createdAt" },
          { label: "Author", key: "author" }
        ], state.announcements.slice(0, 5), { compact: true }) });
    return page("Principal overview", "Institution summary for " + data.settings().institution.name + " · " + data.settings().institution.currentTerm, body,
      '<button class="btn btn-primary" data-nav="students"><i class="fa-solid fa-user-plus"></i> Add student</button>' +
      '<button class="btn" data-nav="result-approval"><i class="fa-solid fa-check-to-slot"></i> Review results</button>');
  };
  mounts.overview = function (root) {
    ui.on(root, "[data-review-result]", "click", function (e, el) {
      location.hash = "#/principal/result-approval";
      setTimeout(function () {
        const target = document.querySelector('[data-approve="' + el.getAttribute("data-review-result") + '"]');
        if (target) target.click();
      }, 120);
    });
  };

  const studentUI = { search: "", departmentId: "", programId: "", semesterId: "", sectionId: "", status: "", sort: "name", page: 1, tab: "active" };

  function filteredStudents() {
    const term = studentUI.search.trim().toLowerCase();
    let rows = store.state.students.filter(function (s) {
      if (studentUI.tab === "deleted" ? !s.deleted : s.deleted) return false;
      if (studentUI.departmentId && s.departmentId !== studentUI.departmentId) return false;
      if (studentUI.programId && s.programId !== studentUI.programId) return false;
      if (studentUI.semesterId && s.semesterId !== studentUI.semesterId) return false;
      if (studentUI.sectionId && s.sectionId !== studentUI.sectionId) return false;
      if (studentUI.status && s.status !== studentUI.status) return false;
      if (term && [s.name, s.rollNo, s.email, s.fatherName].join(" ").toLowerCase().indexOf(term) === -1) return false;
      return true;
    });
    rows.sort(function (a, b) {
      if (studentUI.sort === "roll") return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
      if (studentUI.sort === "semester") return (data.semester(a.semesterId) || {}).number - (data.semester(b.semesterId) || {}).number;
      return a.name.localeCompare(b.name);
    });
    return rows;
  }

  function studentActions(s) {
    if (s.deleted) return ES.common.actions([
      { icon: "fa-rotate-left", title: "Restore student", attrs: 'data-st-action="restore" data-id="' + s.id + '"' },
      { icon: "fa-eye", title: "View details", attrs: 'data-st-action="view" data-id="' + s.id + '"' }
    ]);
    return ES.common.actions([
      { icon: "fa-eye", title: "View profile", attrs: 'data-st-action="view" data-id="' + s.id + '"' },
      { icon: "fa-pen", title: "Edit student", attrs: 'data-st-action="edit" data-id="' + s.id + '"' },
      { icon: "fa-trash", title: "Soft delete", danger: true, attrs: 'data-st-action="delete" data-id="' + s.id + '"' }
    ]);
  }

  function studentTableHTML() {
    const result = ui.paginate(filteredStudents(), studentUI.page, 10);
    studentUI.page = result.page;
    const columns = ES.common.studentColumns(studentActions);
    return ui.table(columns, result.rows, { compact: true, empty: studentUI.tab === "deleted" ? "Recycle bin is empty." : "No students match the current filters." }) +
      ui.pagination(result, "st-page");
  }

  views.students = function () {
    const programs = store.state.programs.filter(function (p) { return !studentUI.departmentId || p.departmentId === studentUI.departmentId; });
    const toolbar = '<div class="toolbar">' + ui.searchBox(studentUI.search, "Search name, roll number, email…", "st-search") +
      ES.common.select("st-department", "Department", store.state.departments, studentUI.departmentId, { labelKey: "name", placeholder: "All departments" }) +
      ES.common.select("st-program", "Program", programs, studentUI.programId, { labelKey: "name", placeholder: "All programs" }) +
      ES.common.select("st-semester", "Semester", store.state.semesters, studentUI.semesterId, { labelKey: "name", placeholder: "All semesters" }) +
      ES.common.select("st-section", "Section", data.sectionsFor(studentUI.departmentId, studentUI.programId, studentUI.semesterId), studentUI.sectionId, { labelKey: "name", placeholder: "All sections" }) +
      ES.common.select("st-sort", "Sort by", [{ value: "name", label: "Name" }, { value: "roll", label: "Roll number" }, { value: "semester", label: "Semester" }], studentUI.sort) +
      "</div>";
    const tabs = '<div class="tabs"><button class="tab-btn' + (studentUI.tab === "active" ? " active" : "") + '" data-st-tab="active">All students</button>' +
      '<button class="tab-btn' + (studentUI.tab === "deleted" ? " active" : "") + '" data-st-tab="deleted">Deleted students (' + store.state.students.filter(function (s) { return s.deleted; }).length + ")</button></div>";
    const notice = studentUI.tab === "deleted"
      ? '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Deleted students are preserved with all their records. Restoring returns them to the active list.</div>'
      : "";
    const body = notice + ui.card({
      title: studentUI.tab === "deleted" ? "Deleted students / recycle bin" : "Student records",
      subtitle: "Search, filter and manage the complete student registry",
      actions: studentUI.tab === "active" ? '<button class="btn btn-primary" data-st-action="add"><i class="fa-solid fa-user-plus"></i> Add student</button>' : "",
      body: toolbar + tabs + '<div id="studentsTableHost">' + studentTableHTML() + "</div>"
    });
    return page("Student management", "Create, update, soft-delete and restore student records", body, "", ["Students"]);
  };

  function studentFields(s) {
    const departments = store.state.departments;
    const programs = store.state.programs.filter(function (p) { return !s || !s.departmentId || p.departmentId === s.departmentId; });
    const sections = store.state.sections.filter(function (sec) { return !s || (!s.programId || sec.programId === s.programId) && (!s.semesterId || sec.semesterId === s.semesterId); });
    return '<div class="form-grid">' +
      ui.textInput("name", "Student name", s && s.name, { required: true, placeholder: "Full name" }) +
      ui.textInput("fatherName", "Father name", s && s.fatherName, { required: true }) +
      ui.textInput("rollNo", "Student ID / roll number", s && s.rollNo, { required: true, placeholder: "e.g. 1337" }) +
      ui.textInput("email", "Email", s && s.email, { type: "email", required: true }) +
      ui.textInput("phone", "Phone", s && s.phone) +
      ui.textInput("dob", "Date of birth", s && s.dob, { type: "date" }) +
      ES.common.select("gender", "Gender", ["M", "F", "Other"], s && s.gender, { placeholder: "Select" }) +
      ES.common.select("status", "Student status", ["Active", "Inactive"], (s && s.status) || "Active") +
      ES.common.select("departmentId", "Department", departments, s && s.departmentId, { labelKey: "name", placeholder: "Select department", required: true }) +
      ES.common.select("programId", "Program", programs, s && s.programId, { labelKey: "name", placeholder: "Select program", required: true }) +
      ES.common.select("academicYearId", "Academic year", store.state.academicYears, (s && s.academicYearId) || store.state.academicYears[0].id, { labelKey: "label" }) +
      ES.common.select("semesterId", "Semester", store.state.semesters, s && s.semesterId, { labelKey: "name", placeholder: "Select semester", required: true }) +
      ES.common.select("sectionId", "Section", sections, s && s.sectionId, { labelKey: "name", placeholder: "Select section", required: true }) +
      ui.textInput("admissionDate", "Admission date", (s && s.admissionDate) || todayISO(), { type: "date" }) +
      '<label class="field"><span class="field-label">Profile image</span><input class="control" type="file" name="photoFile" accept="image/*"></label>' +
      '<div class="span-2">' + ui.textarea("address", "Address", s && s.address, { rows: 2 }) + "</div>" +
      "</div>";
  }

  function bindStudentForm(form, s) {
    const dep = form.querySelector('[name="departmentId"]');
    const prog = form.querySelector('[name="programId"]');
    const sem = form.querySelector('[name="semesterId"]');
    const sec = form.querySelector('[name="sectionId"]');
    function refreshPrograms() {
      const list = store.state.programs.filter(function (p) { return !dep.value || p.departmentId === dep.value; });
      prog.innerHTML = ui.esc("") + ES.common.options(list, "name", "id", "Select program").map(function (o) {
        return '<option value="' + o.value + '"' + (o.value === (s && s.programId) ? " selected" : "") + ">" + ui.esc(o.label) + "</option>";
      }).join("");
      prog.value = s && s.programId && list.some(function (p) { return p.id === s.programId; }) ? s.programId : "";
      refreshSections();
    }
    function refreshSections() {
      const list = store.state.sections.filter(function (x) { return (!prog.value || x.programId === prog.value) && (!sem.value || x.semesterId === sem.value); });
      sec.innerHTML = ES.common.options(list, "name", "id", "Select section").map(function (o) {
        return '<option value="' + o.value + '"' + (o.value === (s && s.sectionId) ? " selected" : "") + ">" + ui.esc(o.label) + "</option>";
      }).join("");
      sec.value = s && s.sectionId && list.some(function (x) { return x.id === s.sectionId; }) ? s.sectionId : "";
    }
    dep.addEventListener("change", function () { s = null; refreshPrograms(); });
    prog.addEventListener("change", function () { s = null; refreshSections(); });
    sem.addEventListener("change", function () { s = null; refreshSections(); });
  }

  function openStudentModal(student) {
    const s = student || null;
    ui.openModal({
      title: s ? "Edit student · " + s.name : "Add new student",
      size: "modal-lg",
      body: studentFields(s),
      saveLabel: s ? "Save changes" : "Create student",
      onSave: function (values, form, close) {
        if (!values.rollNo || !data.uniqueRoll(values.rollNo, s && s.id)) {
          ui.toast("That roll number is already in use.", "error");
          return;
        }
        const section = data.section(values.sectionId);
        if (!section || section.programId !== values.programId || section.semesterId !== values.semesterId) {
          ui.toast("Section must belong to the selected program and semester.", "error");
          return;
        }
        const apply = function (photo) {
          commit(function (state) {
            const record = s ? state.students.find(function (x) { return x.id === s.id; }) : null;
            const base = record || { id: ES.uid("s"), history: [] };
            Object.assign(base, values, { photo: photo || (record && record.photo) || "", deleted: false });
            if (!record) state.students.push(base);
            if (photo) base.photo = photo;
          }, s ? "Student record updated." : "Student added successfully.", {
            action: s ? "Student Updated" : "Student Added", related: values.rollNo,
            description: (s ? "Updated" : "Added") + " student " + values.name + " (" + values.rollNo + ")"
          });
          close(); ES.app.refresh();
        };
        const file = form.querySelector('[name="photoFile"]').files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function () { apply(reader.result); };
          reader.readAsDataURL(file);
        } else apply("");
      }
    });
    bindStudentForm(document.getElementById("esModalForm"), s);
  }

  function viewStudent(student) {
    const section = data.section(student.sectionId);
    const stats = data.attendanceStats(student.id);
    const results = data.resultEntriesForStudent(student.id, true);
    const rows = [
      ["Roll number", student.rollNo], ["Father name", student.fatherName], ["Email", student.email],
      ["Phone", student.phone || "—"], ["Date of birth", ui.fmtDate(student.dob)], ["Gender", student.gender || "—"],
      ["Department", (data.department(student.departmentId) || {}).name || "—"], ["Program", (data.program(student.programId) || {}).name || "—"],
      ["Academic year", (data.year(student.academicYearId) || {}).label || "—"], ["Semester", data.semesterLabel(student.semesterId)],
      ["Section", section ? section.name : "—"], ["Admission date", ui.fmtDate(student.admissionDate)],
      ["Address", student.address || "—"], ["Status", student.deleted ? "Deleted" : student.status]
    ];
    ui.openModal({
      title: "Student profile · " + student.name, size: "modal-lg", saveLabel: null,
      buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
      body: '<div class="profile-modal">' + ES.common.person(student.name, student.rollNo + " · " + data.semesterLabel(student.semesterId), student.photo) +
        '<div class="alert-row"><span>Attendance</span><strong>' + stats.percentage + "%</strong>" + ui.progress(stats.percentage, stats.percentage >= data.threshold() ? "good" : "warn") + "</div>" +
        '<div class="detail-grid">' + rows.map(function (r) { return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1]) + "</strong></div>"; }).join("") + "</div>" +
        '<h3 class="section-subhead">Published results</h3>' +
        (results.length ? ui.table([{ label: "Course", render: function (r) { return ui.esc((r.course || {}).code || "—"); } },
          { label: "Percentage", render: function (r) { return r.entry.percentage + "%"; } },
          { label: "Grade", render: function (r) { return ui.badge(r.entry.grade); } }], results, { compact: true }) : ui.empty("No published results yet.")) +
        "</div>"
    });
  }

  mounts.students = function (root) {
    ui.on(root, "[data-st-search]", "input", function (e, el) {
      studentUI.search = el.value;
      studentUI.page = 1;
      const host = document.getElementById("studentsTableHost");
      if (host) host.innerHTML = studentTableHTML();
    });
    ["department", "program", "semester", "section", "status", "sort"].forEach(function (key) {
      ui.on(root, "[data-st-" + key + "]", "change", function (e, el) {
        const targetKey = key === "sort" || key === "status" ? key : key + "Id";
        studentUI[targetKey] = el.value;
        if (["departmentId", "programId", "semesterId"].indexOf(targetKey) !== -1) {
          studentUI.programId = key === "departmentId" ? "" : studentUI.programId;
          studentUI.sectionId = "";
        }
        studentUI.page = 1;
        ES.app.refresh();
      });
    });
    ui.on(root, "[data-st-tab]", "click", function (e, el) { studentUI.tab = el.getAttribute("data-st-tab"); studentUI.page = 1; ES.app.refresh(); });
    ui.on(root, "[data-st-page]", "click", function (e, el) { studentUI.page = parseInt(el.getAttribute("data-st-page"), 10); ES.app.refresh(); });
    ui.on(root, "[data-st-action]", "click", function (e, el) {
      const id = el.getAttribute("data-id");
      const action = el.getAttribute("data-st-action");
      if (action === "add") { openStudentModal(null); return; }
      const student = data.student(id);
      if (!student) return;
      if (action === "view") { viewStudent(student); return; }
      if (action === "edit") { openStudentModal(student); return; }
      if (action === "delete") {
        ui.confirm({
          title: "Soft delete student", saveLabel: "Move to recycle bin",
          message: student.name + " (" + student.rollNo + ") will be moved to Deleted Students. All records are preserved and can be restored.",
          onConfirm: function () {
            commit(function (state) {
              const record = state.students.find(function (s) { return s.id === id; });
              if (record) record.deleted = true;
            }, "Student moved to recycle bin.", { action: "Student Soft Deleted", related: student.rollNo, description: "Soft deleted " + student.name });
            ES.app.refresh();
          }
        });
      }
      if (action === "restore") {
        ui.confirm({
          title: "Restore student", saveLabel: "Restore", message: "Restore " + student.name + " to the active student list?",
          onConfirm: function () {
            commit(function (state) {
              const record = state.students.find(function (s) { return s.id === id; });
              if (record) record.deleted = false;
            }, "Student restored.", { action: "Student Restored", related: student.rollNo, description: "Restored " + student.name });
            ES.app.refresh();
          }
        });
      }
    });
  };

  const teacherUI = { search: "", departmentId: "", page: 1 };

  views.teachers = function () {
    const rows = store.state.teachers.filter(function (t) {
      return (!teacherUI.departmentId || t.departmentId === teacherUI.departmentId) &&
        (!teacherUI.search || (t.name + t.email + t.employeeId).toLowerCase().indexOf(teacherUI.search.toLowerCase()) !== -1);
    });
    const paged = ui.paginate(rows, teacherUI.page, 10);
    teacherUI.page = paged.page;
    const columns = [
      { label: "Teacher", render: function (t) { return ES.common.person(t.name, t.email, t.photo); } },
      { label: "Employee ID", key: "employeeId" },
      { label: "Department", render: function (t) { return ui.esc((data.department(t.departmentId) || {}).code || "—"); } },
      { label: "Designation", key: "designation" },
      { label: "Courses", render: function (t) { return store.state.teacherAssignments.filter(function (a) { return a.teacherId === t.id; }).length; } },
      { label: "Status", render: function (t) { return ui.badge(t.status); } },
      { label: "Actions", render: function (t) { return ES.common.actions([
        { icon: "fa-eye", title: "View profile", attrs: 'data-t-action="view" data-id="' + t.id + '"' },
        { icon: "fa-pen", title: "Edit teacher", attrs: 'data-t-action="edit" data-id="' + t.id + '"' }
      ]); } }
    ];
    const body = ui.card({
      title: "Faculty registry", subtitle: "Teacher profiles, contact details and course assignments",
      actions: '<button class="btn btn-primary" data-t-action="add"><i class="fa-solid fa-user-plus"></i> Add teacher</button>',
      body: '<div class="toolbar">' + ui.searchBox(teacherUI.search, "Search teachers…", "t-search") +
        ES.common.select("t-department", "Department", store.state.departments, teacherUI.departmentId, { labelKey: "name", placeholder: "All departments" }) + "</div>" +
        ui.table(columns, paged.rows, { compact: true, empty: "No teachers found." }) + ui.pagination(paged, "t-page")
    });
    return page("Teacher management", "Manage faculty records and their academic assignments", body, "", ["Teachers"]);
  };

  function openTeacherModal(teacher) {
    const t = teacher || {};
    const body = '<div class="form-grid">' +
      ui.textInput("name", "Teacher name", t.name, { required: true }) +
      ui.textInput("employeeId", "Employee ID", t.employeeId, { required: true }) +
      ui.textInput("email", "Email", t.email, { type: "email", required: true }) +
      ui.textInput("phone", "Phone", t.phone) +
      ES.common.select("departmentId", "Department", store.state.departments, t.departmentId, { labelKey: "name", placeholder: "Select department", required: true }) +
      ES.common.select("designation", "Designation", ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"], t.designation) +
      ui.textInput("joinDate", "Joining date", t.joinDate || todayISO(), { type: "date" }) +
      ES.common.select("status", "Status", ["Active", "Inactive"], t.status || "Active") +
      '<div class="span-2">' + ui.textarea("address", "Contact address", t.address, { rows: 2 }) + "</div></div>";
    ui.openModal({
      title: teacher ? "Edit teacher · " + t.name : "Add teacher", size: "modal-lg", body: body,
      saveLabel: teacher ? "Save changes" : "Add teacher",
      onSave: function (values, form, close) {
        commit(function (state) {
          if (teacher) Object.assign(state.teachers.find(function (x) { return x.id === teacher.id; }), values);
          else state.teachers.push(Object.assign({ id: ES.uid("t"), photo: "" }, values));
        }, teacher ? "Teacher updated." : "Teacher added.", {
          action: teacher ? "Teacher Updated" : "Teacher Added", related: values.employeeId, description: (teacher ? "Updated" : "Added") + " " + values.name
        });
        close(); ES.app.refresh();
      }
    });
  }

  function viewTeacher(t) {
    const assignments = store.state.teacherAssignments.filter(function (a) { return a.teacherId === t.id; });
    const timetable = data.timetableFor(null, t.id);
    const rows = [["Employee ID", t.employeeId], ["Email", t.email], ["Phone", t.phone || "—"], ["Department", (data.department(t.departmentId) || {}).name || "—"], ["Designation", t.designation], ["Joining date", ui.fmtDate(t.joinDate)], ["Address", t.address || "—"], ["Status", t.status]];
    ui.openModal({
      title: "Teacher profile · " + t.name, size: "modal-lg", saveLabel: null,
      buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
      body: '<div class="profile-modal">' + ES.common.person(t.name, t.designation, t.photo) +
        '<div class="detail-grid">' + rows.map(function (r) { return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1]) + "</strong></div>"; }).join("") + "</div>" +
        '<h3 class="section-subhead">Assigned courses and sections</h3>' +
        ui.table([{ label: "Course", render: function (a) { return ui.esc((data.course(a.courseId) || {}).code || "—"); } },
          { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId, true)); } }], assignments, { compact: true }) +
        '<h3 class="section-subhead">Teaching timetable</h3>' +
        ui.table([{ label: "Day", key: "day" }, { label: "Time", render: function (x) { return x.start + "–" + x.end; } },
          { label: "Section", render: function (x) { return ui.esc(data.sectionLabel(x.sectionId)); } }], timetable, { compact: true }) + "</div>"
    });
  }

  mounts.teachers = function (root) {
    ui.on(root, "[data-t-search]", "input", function (e, el) { teacherUI.search = el.value; ES.app.refresh(); });
    ui.on(root, "[data-t-department]", "change", function (e, el) { teacherUI.departmentId = el.value; ES.app.refresh(); });
    ui.on(root, "[data-t-page]", "click", function (e, el) { teacherUI.page = parseInt(el.getAttribute("data-t-page"), 10); ES.app.refresh(); });
    ui.on(root, "[data-t-action]", "click", function (e, el) {
      const action = el.getAttribute("data-t-action");
      if (action === "add") { openTeacherModal(null); return; }
      const t = data.teacher(el.getAttribute("data-id"));
      if (!t) return;
      if (action === "edit") openTeacherModal(t); else viewTeacher(t);
    });
  };

  const promoUI = { departmentId: "", programId: "", semesterId: "", sectionId: "", targetSemesterId: "", targetSectionId: "", selected: [], mode: "promotion" };

  function promotionStudents() {
    return data.studentsInSection(promoUI.sectionId).filter(function (s) {
      if (promoUI.mode === "transfer") return true;
      const current = Number((data.semester(promoUI.semesterId) || {}).number) || 0;
      const next = Number((data.semester(promoUI.targetSemesterId) || {}).number) || 0;
      return next === current + 1;
    });
  }

  views.promotion = function () {
    const state = store.state;
    const sections = data.sectionsFor(promoUI.departmentId, promoUI.programId, promoUI.semesterId);
    const targetSections = data.sectionsFor(promoUI.departmentId, promoUI.programId, promoUI.targetSemesterId);
    const rows = promotionStudents();
    const columns = [
      { label: "", render: function (s) { return '<input type="checkbox" data-promo-check="' + s.id + '"' + (promoUI.selected.indexOf(s.id) !== -1 ? " checked" : "") + ">"; } },
      { label: "Roll number", render: function (s) { return "<strong>" + ui.esc(s.rollNo) + "</strong>"; } },
      { label: "Student", render: function (s) { return ES.common.person(s.name, s.email, s.photo); } },
      { label: "Current placement", render: function (s) { return ui.esc(data.sectionLabel(s.sectionId, true)); } },
      { label: "Status", render: function (s) { return ui.badge(s.status); } }
    ];
    const body = ui.card({
      title: "Student promotion & section transfer",
      subtitle: "Academic history is retained when a student is promoted or transferred",
      body: '<div class="tabs"><button class="tab-btn' + (promoUI.mode === "promotion" ? " active" : "") + '" data-promo-mode="promotion">Semester promotion</button>' +
        '<button class="tab-btn' + (promoUI.mode === "transfer" ? " active" : "") + '" data-promo-mode="transfer">Section transfer</button></div>' +
        ES.common.pickerHTML("pr", promoUI, { allDepartments: true, allPrograms: true, allSemesters: true }) +
        '<div class="filter-strip">' +
        ES.common.select("prTargetSemester", promoUI.mode === "promotion" ? "Promote to semester" : "Semester", state.semesters, promoUI.targetSemesterId, { labelKey: "name", placeholder: "Select semester" }) +
        ES.common.select("prTargetSection", promoUI.mode === "promotion" ? "Assign next section" : "Transfer to section", targetSections, promoUI.targetSectionId, { labelKey: "name", placeholder: "Select section" }) +
        '<div class="field"><span class="field-label">&nbsp;</span><button class="btn btn-primary" data-promo-confirm><i class="fa-solid fa-check"></i> ' +
        (promoUI.mode === "promotion" ? "Promote selected" : "Transfer selected") + " (" + promoUI.selected.length + ")</button></div></div>" +
        '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>' +
        (promoUI.mode === "promotion" ? "Select students from the current section, choose the next semester and section, then confirm." : "Students keep the same semester and all previous attendance, results and assignment records stay with their original section.") + "</div>" +
        ui.table(columns, rows, { compact: true, empty: "Choose a department, program, semester and section to view students." })
    });
    return page("Promotion & transfer", "Move students between semesters and sections with confirmation", body, "", ["Students"]);
  };

  mounts.promotion = function (root) {
    ES.common.bindPicker(root, "pr", promoUI, function () { promoUI.selected = []; ES.app.refresh(); });
    ui.on(root, "[data-prTargetSemester]", "change", function (e, el) { promoUI.targetSemesterId = el.value; promoUI.targetSectionId = ""; ES.app.refresh(); });
    ui.on(root, "[data-prTargetSection]", "change", function (e, el) { promoUI.targetSectionId = el.value; ES.app.refresh(); });
    ui.on(root, "[data-promo-mode]", "click", function (e, el) { promoUI.mode = el.getAttribute("data-promo-mode"); promoUI.selected = []; ES.app.refresh(); });
    ui.on(root, "[data-promo-check]", "change", function (e, el) {
      const id = el.getAttribute("data-promo-check");
      if (el.checked && promoUI.selected.indexOf(id) === -1) promoUI.selected.push(id);
      if (!el.checked) promoUI.selected = promoUI.selected.filter(function (x) { return x !== id; });
      ES.app.refresh();
    });
    ui.on(root, "[data-promo-confirm]", "click", function () {
      if (!promoUI.selected.length) { ui.toast("Select at least one student.", "error"); return; }
      if (!promoUI.targetSectionId) { ui.toast("Select a target section.", "error"); return; }
      const target = data.section(promoUI.targetSectionId);
      const chosen = promoUI.selected.map(data.student).filter(Boolean);
      ui.confirm({
        title: promoUI.mode === "promotion" ? "Confirm student promotion" : "Confirm section transfer",
        saveLabel: "Confirm", size: "modal-lg",
        body: '<p class="confirm-text">The following ' + chosen.length + " student(s) will be moved to <strong>" + ui.esc(data.sectionLabel(target.id, true)) + "</strong>. Previous academic records will be preserved.</p>" +
          ui.table([{ label: "Roll number", key: "rollNo" }, { label: "Student", key: "name" }], chosen, { compact: true }),
        onConfirm: function () {
          commit(function (state) {
            chosen.forEach(function (s) {
              const record = state.students.find(function (x) { return x.id === s.id; });
              record.history = record.history || [];
              record.history.push({
                type: promoUI.mode === "promotion" ? "Promotion" : "Section transfer", date: todayISO(),
                from: { semesterId: record.semesterId, sectionId: record.sectionId },
                to: { semesterId: target.semesterId, sectionId: target.id }
              });
              record.semesterId = target.semesterId;
              record.sectionId = target.id;
              record.programId = target.programId;
              record.departmentId = target.departmentId;
            });
          }, promoUI.selected.length + " student(s) updated.", {
            action: promoUI.mode === "promotion" ? "Student Promoted" : "Student Transferred",
            related: data.sectionLabel(target.id, true),
            description: promoUI.selected.length + " students moved to " + data.sectionLabel(target.id, true)
          });
          promoUI.selected = []; ES.app.refresh();
        }
      });
    });
  };
})();
