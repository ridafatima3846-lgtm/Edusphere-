(function () {
  const ui = ES.ui;
  const data = ES.data;
  const store = ES.store;
  const views = ES.views.principal = ES.views.principal || {};
  const mounts = ES.mounts.principal = ES.mounts.principal || {};
  const uiState = {};

  function page(title, subtitle, body, actions, crumbs) {
    return ui.pageHeader({ title: title, subtitle: subtitle, actions: actions || "", breadcrumb: ["Principal", "Academic Structure"].concat(crumbs || [title]) }) + body;
  }
  function commit(fn, message, audit) {
    store.update(function (state) {
      fn(state);
      if (audit) data.audit(audit.action, "Principal Office", audit.related || "", audit.description || audit.action, audit.icon);
    });
    if (message) ui.toast(message);
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function manager(config) {
    const key = config.key;
    uiState[key] = { search: "" };
    views[key] = function () {
      const rows = store.state[config.collection].filter(function (item) {
        const term = uiState[key].search.trim().toLowerCase();
        return !term || config.searchText(item).toLowerCase().indexOf(term) !== -1;
      });
      const body = ui.card({
        title: config.cardTitle || config.title,
        subtitle: config.subtitle,
        actions: '<button class="btn btn-primary" data-mg-action="add"><i class="fa-solid fa-plus"></i> ' + (config.addLabel || "Add") + "</button>",
        body: '<div class="toolbar">' + ui.searchBox(uiState[key].search, config.searchPlaceholder || "Search records…", "mg-search") + (config.toolbar || "") + "</div>" +
          ui.table(config.columns, rows, { compact: true, empty: config.empty || "No records yet." })
      });
      return page(config.title, config.subtitle, body, "", [config.title]);
    };
    mounts[key] = function (root) {
      ui.on(root, "[data-mg-search]", "input", function (e, el) { uiState[key].search = el.value; ES.app.refresh(); });
      if (config.bindToolbar) config.bindToolbar(root);
      ui.on(root, "[data-mg-action]", "click", function (e, el) {
        const action = el.getAttribute("data-mg-action");
        if (action === "add") { openEditor(null); return; }
        const record = store.state[config.collection].find(function (x) { return x.id === el.getAttribute("data-id"); });
        if (!record) return;
        if (action === "view") { config.onView ? config.onView(record) : defaultView(record); return; }
        if (action === "edit") { openEditor(record); return; }
        if (action === "delete") {
          ui.confirm({
            title: "Remove " + config.singular.toLowerCase(), saveLabel: "Remove",
            message: "Remove " + config.recordLabel(record) + "? Related historical records are retained in this demo.",
            onConfirm: function () {
              commit(function (state) {
                state[config.collection] = state[config.collection].filter(function (x) { return x.id !== record.id; });
                if (config.onDelete) config.onDelete(state, record);
              }, config.singular + " removed.", { action: config.singular + " Removed", related: config.recordLabel(record), description: "Removed " + config.recordLabel(record) });
              ES.app.refresh();
            }
          });
        }
      });
    };
    function defaultView(record) {
      const rows = config.detailRows(record);
      ui.openModal({
        title: config.singular + " details", size: "modal-sm", saveLabel: null,
        buttons: [{ label: "Close", onClick: function (f, close) { close(); } }],
        body: '<div class="detail-grid">' + rows.map(function (r) {
          return '<div class="detail-item"><span>' + ui.esc(r[0]) + "</span><strong>" + ui.esc(r[1] || "—") + "</strong></div>";
        }).join("") + "</div>"
      });
    }
    function openEditor(record) {
      ui.openModal({
        title: (record ? "Edit " : "Add ") + config.singular.toLowerCase(),
        size: config.modalSize || "modal-lg",
        body: config.fields(record),
        saveLabel: record ? "Save changes" : "Create",
        onSave: function (values, form, close) {
          const error = config.validate ? config.validate(values, record) : "";
          if (error) { ui.toast(error, "error"); return; }
          commit(function (state) {
            if (record) Object.assign(state[config.collection].find(function (x) { return x.id === record.id; }), values);
            else state[config.collection].push(Object.assign({ id: ES.uid(config.prefix || "rec") }, values));
            if (config.onSave) config.onSave(state, values, record);
          }, record ? config.singular + " updated." : config.singular + " created.", {
            action: record ? config.singular + " Updated" : config.singular + " Added",
            related: config.recordLabel(Object.assign({}, record || {}, values)),
            description: (record ? "Updated " : "Added ") + config.singular + " " + config.recordLabel(Object.assign({}, record || {}, values))
          });
          close(); ES.app.refresh();
        }
      });
      if (config.afterOpen) config.afterOpen(document.getElementById("esModalForm"), record);
    }
  }

  manager({
    key: "departments", collection: "departments", singular: "Department", prefix: "d",
    title: "Departments", cardTitle: "Academic departments", subtitle: "Manage departments and the programs offered under them",
    searchText: function (d) { return [d.name, d.code, d.head].join(" "); },
    recordLabel: function (d) { return d.name || "Department"; },
    columns: [
      { label: "Department", render: function (d) { return "<strong>" + ui.esc(d.name) + "</strong><small class=\"cell-note\">" + ui.esc(d.head || "") + "</small>"; } },
      { label: "Code", key: "code" },
      { label: "Programs", render: function (d) { return store.state.programs.filter(function (p) { return p.departmentId === d.id; }).length; } },
      { label: "Sections", render: function (d) { return store.state.sections.filter(function (s) { return s.departmentId === d.id; }).length; } },
      { label: "Actions", render: function (d) { return ES.common.actions([
        { icon: "fa-eye", title: "View details", attrs: 'data-mg-action="view" data-id="' + d.id + '"' },
        { icon: "fa-pen", title: "Edit", attrs: 'data-mg-action="edit" data-id="' + d.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + d.id + '"' }
      ]); } }
    ],
    detailRows: function (d) { return [["Name", d.name], ["Code", d.code], ["Head", d.head], ["Programs", store.state.programs.filter(function (p) { return p.departmentId === d.id; }).map(function (p) { return p.code; }).join(", ")]]; },
    fields: function (d) {
      d = d || {};
      return '<div class="form-grid">' + ui.textInput("name", "Department name", d.name, { required: true }) +
        ui.textInput("code", "Short code", d.code, { required: true, placeholder: "CS" }) +
        ui.textInput("head", "Department head", d.head) +
        "</div>";
    },
    validate: function (v, record) {
      if (store.state.departments.some(function (d) { return d.code.toLowerCase() === String(v.code || "").toLowerCase() && (!record || d.id !== record.id); })) return "Department code must be unique.";
      return "";
    }
  });

  manager({
    key: "programs", collection: "programs", singular: "Program", prefix: "p",
    title: "Programs", subtitle: "Degree programs offered by each department",
    searchText: function (p) { return [p.name, p.code, (data.department(p.departmentId) || {}).name].join(" "); },
    recordLabel: function (p) { return p.code || p.name; },
    columns: [
      { label: "Program", render: function (p) { return "<strong>" + ui.esc(p.name) + "</strong><small class=\"cell-note\">" + ui.esc(p.code) + "</small>"; } },
      { label: "Department", render: function (p) { return ui.esc((data.department(p.departmentId) || {}).name || "—"); } },
      { label: "Duration", key: "duration" },
      { label: "Sections", render: function (p) { return store.state.sections.filter(function (s) { return s.programId === p.id; }).length; } },
      { label: "Actions", render: function (p) { return ES.common.actions([
        { icon: "fa-eye", title: "View details", attrs: 'data-mg-action="view" data-id="' + p.id + '"' },
        { icon: "fa-pen", title: "Edit", attrs: 'data-mg-action="edit" data-id="' + p.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + p.id + '"' }
      ]); } }
    ],
    detailRows: function (p) { return [["Name", p.name], ["Code", p.code], ["Department", (data.department(p.departmentId) || {}).name], ["Duration", p.duration], ["Sections", store.state.sections.filter(function (s) { return s.programId === p.id; }).length]]; },
    fields: function (p) {
      p = p || {};
      return '<div class="form-grid">' + ui.textInput("name", "Program name", p.name, { required: true, placeholder: "BS Computer Science" }) +
        ui.textInput("code", "Program code", p.code, { required: true, placeholder: "BSCS" }) +
        ES.common.select("departmentId", "Department", store.state.departments, p.departmentId, { labelKey: "name", placeholder: "Select department", required: true }) +
        ES.common.select("duration", "Duration", ["2 years", "3 years", "4 years", "5 years"], p.duration || "4 years") + "</div>";
    },
    validate: function (v, record) {
      if (store.state.programs.some(function (p) { return p.code.toLowerCase() === String(v.code || "").toLowerCase() && (!record || p.id !== record.id); })) return "Program code must be unique.";
      return "";
    }
  });

  manager({
    key: "academic-years", collection: "academicYears", singular: "Academic year", prefix: "ay",
    title: "Academic Years", subtitle: "Academic sessions used across student and section records",
    searchText: function (y) { return [y.label, y.status].join(" "); },
    recordLabel: function (y) { return y.label; },
    columns: [
      { label: "Academic year", key: "label" },
      { label: "Status", render: function (y) { return ui.badge(y.status); } },
      { label: "Sections", render: function (y) { return store.state.sections.filter(function (s) { return s.academicYearId === y.id; }).length; } },
      { label: "Actions", render: function (y) { return ES.common.actions([
        { icon: "fa-pen", title: "Edit", attrs: 'data-mg-action="edit" data-id="' + y.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + y.id + '"' }
      ]); } }
    ],
    detailRows: function (y) { return [["Label", y.label], ["Status", y.status]]; },
    fields: function (y) {
      y = y || {};
      return '<div class="form-grid">' + ui.textInput("label", "Year label", y.label, { required: true, placeholder: "2026–2027" }) +
        ES.common.select("status", "Status", ["Active", "Archived"], y.status || "Active") + "</div>";
    }
  });

  manager({
    key: "semesters", collection: "semesters", singular: "Semester", prefix: "sem",
    title: "Semesters", subtitle: "Configure semester numbering and labels used by programs and sections",
    searchText: function (s) { return [s.name, s.number].join(" "); },
    recordLabel: function (s) { return s.name; },
    columns: [
      { label: "Order", render: function (s) { return "<strong>" + ui.esc(s.number) + "</strong>"; } },
      { label: "Semester", key: "name" },
      { label: "Sections", render: function (s) { return store.state.sections.filter(function (x) { return x.semesterId === s.id; }).length; } },
      { label: "Courses", render: function (s) { return store.state.courses.filter(function (c) { return c.semesterId === s.id; }).length; } },
      { label: "Actions", render: function (s) { return ES.common.actions([
        { icon: "fa-pen", title: "Edit", attrs: 'data-mg-action="edit" data-id="' + s.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + s.id + '"' }
      ]); } }
    ],
    detailRows: function (s) { return [["Name", s.name], ["Order", s.number]]; },
    fields: function (s) {
      s = s || {};
      return '<div class="form-grid">' + ui.textInput("number", "Semester number", s.number, { type: "number", min: 1, required: true }) +
        ui.textInput("name", "Display name", s.name, { required: true, placeholder: "3rd Semester" }) + "</div>";
    },
    validate: function (v, record) {
      if (store.state.semesters.some(function (s) { return Number(s.number) === Number(v.number) && (!record || s.id !== record.id); })) return "Semester number already exists.";
      return "";
    }
  });

  manager({
    key: "sections", collection: "sections", singular: "Section", prefix: "sec",
    title: "Classes & Sections", subtitle: "Each section keeps separate students, courses, timetable, attendance and results",
    searchText: function (s) { return [s.name, data.sectionLabel(s.id, true), s.room].join(" "); },
    recordLabel: function (s) { return data.sectionLabel(s.id, true); },
    columns: [
      { label: "Section", render: function (s) { return "<strong>" + ui.esc(s.name) + "</strong><small class=\"cell-note\">" + ui.esc(s.room || "") + "</small>"; } },
      { label: "Academic placement", render: function (s) { return ui.esc(data.sectionLabel(s.id, true)); } },
      { label: "Students", render: function (s) { return data.studentsInSection(s.id).length + " / " + (s.capacity || 40); } },
      { label: "Courses", render: function (s) { return data.coursesForSection(s.id).length; } },
      { label: "Class teacher", render: function (s) { return ui.esc((data.teacher(s.classTeacherId) || {}).name || "Not assigned"); } },
      { label: "Actions", render: function (s) { return ES.common.actions([
        { icon: "fa-eye", title: "View section", attrs: 'data-mg-action="view" data-id="' + s.id + '"' },
        { icon: "fa-pen", title: "Edit / rename", attrs: 'data-mg-action="edit" data-id="' + s.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + s.id + '"' }
      ]); } }
    ],
    detailRows: function (s) {
      const summary = data.sectionSummary(s.id);
      return [["Name", s.name], ["Placement", data.sectionLabel(s.id, true)], ["Room", s.room], ["Capacity", s.capacity], ["Students", summary.students], ["Courses", summary.courses], ["Low attendance", summary.lowAttendance], ["Class teacher", (data.teacher(s.classTeacherId) || {}).name]];
    },
    fields: function (s) {
      s = s || {};
      return '<div class="form-grid">' +
        ui.textInput("name", "Section name", s.name, { required: true, placeholder: "E1" }) +
        ES.common.select("departmentId", "Department", store.state.departments, s.departmentId, { labelKey: "name", placeholder: "Select department", required: true }) +
        ES.common.select("programId", "Program", store.state.programs, s.programId, { labelKey: "name", placeholder: "Select program", required: true }) +
        ES.common.select("semesterId", "Semester", store.state.semesters, s.semesterId, { labelKey: "name", placeholder: "Select semester", required: true }) +
        ES.common.select("academicYearId", "Academic year", store.state.academicYears, s.academicYearId || (store.state.academicYears[0] || {}).id, { labelKey: "label" }) +
        ui.textInput("room", "Room / lab", s.room) +
        ui.textInput("capacity", "Capacity", s.capacity || 40, { type: "number", min: 1 }) +
        ES.common.select("classTeacherId", "Class teacher", store.state.teachers, s.classTeacherId, { labelKey: "name", placeholder: "Not assigned" }) +
        "</div>";
    },
    validate: function (v, record) {
      if (store.state.sections.some(function (s) {
        return s.name.toLowerCase() === String(v.name || "").toLowerCase() && s.programId === v.programId && s.semesterId === v.semesterId && (!record || s.id !== record.id);
      })) return "A section with this name already exists in the selected program and semester.";
      const program = data.program(v.programId);
      if (program && v.departmentId && program.departmentId !== v.departmentId) return "Selected program does not belong to the chosen department.";
      return "";
    }
  });

  manager({
    key: "courses", collection: "courses", singular: "Course", prefix: "cs",
    title: "Courses & Subjects", subtitle: "Course catalog mapped to programs and semesters",
    searchText: function (c) { return [c.code, c.name, (data.program(c.programId) || {}).code].join(" "); },
    recordLabel: function (c) { return c.code + " · " + c.name; },
    columns: [
      { label: "Course", render: function (c) { return "<strong>" + ui.esc(c.code) + "</strong><small class=\"cell-note\">" + ui.esc(c.name) + "</small>"; } },
      { label: "Program", render: function (c) { return ui.esc(data.programLabel(c.programId)); } },
      { label: "Semester", render: function (c) { return ui.esc(data.semesterLabel(c.semesterId)); } },
      { label: "Credits", render: function (c) { return ui.esc(c.credits); } },
      { label: "Sections", render: function (c) { return store.state.sections.filter(function (x) { return x.programId === c.programId && x.semesterId === c.semesterId; }).length; } },
      { label: "Actions", render: function (c) { return ES.common.actions([
        { icon: "fa-eye", title: "View course", attrs: 'data-mg-action="view" data-id="' + c.id + '"' },
        { icon: "fa-pen", title: "Edit", attrs: 'data-mg-action="edit" data-id="' + c.id + '"' },
        { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-mg-action="delete" data-id="' + c.id + '"' }
      ]); } }
    ],
    detailRows: function (c) { return [["Code", c.code], ["Name", c.name], ["Department", (data.department(c.departmentId) || {}).name], ["Program", (data.program(c.programId) || {}).name], ["Semester", data.semesterLabel(c.semesterId)], ["Credit hours", c.credits], ["Description", c.description]]; },
    fields: function (c) {
      c = c || {};
      return '<div class="form-grid">' +
        ui.textInput("code", "Course code", c.code, { required: true, placeholder: "CS-301" }) +
        ui.textInput("name", "Course title", c.name, { required: true }) +
        ES.common.select("departmentId", "Department", store.state.departments, c.departmentId, { labelKey: "name", placeholder: "Select department", required: true }) +
        ES.common.select("programId", "Program", store.state.programs, c.programId, { labelKey: "name", placeholder: "Select program", required: true }) +
        ES.common.select("semesterId", "Semester", store.state.semesters, c.semesterId, { labelKey: "name", placeholder: "Select semester", required: true }) +
        ui.textInput("credits", "Credit hours", c.credits || 3, { type: "number", min: 1, max: 6, required: true }) +
        '<div class="span-2">' + ui.textarea("description", "Course description", c.description, { rows: 3 }) + "</div></div>";
    },
    validate: function (v, record) {
      if (store.state.courses.some(function (c) { return c.code.toLowerCase() === String(v.code || "").toLowerCase() && (!record || c.id !== record.id); })) return "Course code must be unique.";
      const program = data.program(v.programId);
      if (program && program.departmentId !== v.departmentId) return "Selected program does not belong to the chosen department.";
      return "";
    },
    onDelete: function (state, record) {
      state.teacherAssignments = state.teacherAssignments.filter(function (a) { return a.courseId !== record.id; });
    }
  });

  views["teacher-assignments"] = function () {
    const rows = store.state.teacherAssignments.map(function (a) {
      return Object.assign({}, a, { teacherName: (data.teacher(a.teacherId) || {}).name || "—", courseName: (data.course(a.courseId) || {}).code || "—" });
    });
    const body = ui.card({
      title: "Teacher assignments", subtitle: "Assign faculty to courses and specific sections",
      actions: '<button class="btn btn-primary" data-ta-action="add"><i class="fa-solid fa-plus"></i> Assign teacher</button>',
      body: ui.table([
        { label: "Teacher", render: function (a) { return ES.common.person(a.teacherName, (data.teacher(a.teacherId) || {}).designation); } },
        { label: "Course", render: function (a) { return "<strong>" + ui.esc(a.courseName) + "</strong><small class=\"cell-note\">" + ui.esc((data.course(a.courseId) || {}).name || "") + "</small>"; } },
        { label: "Section", render: function (a) { return ui.esc(data.sectionLabel(a.sectionId, true)); } },
        { label: "Semester", render: function (a) { return ui.esc(data.semesterLabel(a.semesterId)); } },
        { label: "Actions", render: function (a) { return ES.common.actions([
          { icon: "fa-pen", title: "Edit assignment", attrs: 'data-ta-action="edit" data-id="' + a.id + '"' },
          { icon: "fa-trash", title: "Remove", danger: true, attrs: 'data-ta-action="delete" data-id="' + a.id + '"' }
        ]); } }
      ], rows, { compact: true, empty: "No teacher assignments yet." })
    });
    return page("Teacher assignments", "Teachers only see courses and sections assigned here", body, "", ["Teacher Assignments"]);
  };

  function assignmentFields(a) {
    a = a || {};
    return '<div class="form-grid">' +
      ES.common.select("teacherId", "Teacher", store.state.teachers, a.teacherId, { labelKey: "name", placeholder: "Select teacher", required: true }) +
      ES.common.select("departmentId", "Department", store.state.departments, a.departmentId || ((data.section(a.sectionId) || {}).departmentId), { labelKey: "name", placeholder: "Select department" }) +
      ES.common.select("programId", "Program", store.state.programs, a.programId || ((data.section(a.sectionId) || {}).programId), { labelKey: "name", placeholder: "Select program" }) +
      ES.common.select("semesterId", "Semester", store.state.semesters, a.semesterId, { labelKey: "name", placeholder: "Select semester", required: true }) +
      ES.common.select("courseId", "Course", store.state.courses, a.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
      ES.common.select("sectionId", "Section", store.state.sections, a.sectionId, { labelKey: "name", placeholder: "Select section", required: true }) +
      "</div>";
  }

  mounts["teacher-assignments"] = function (root) {
    function open(a) {
      ui.openModal({
        title: a ? "Edit teacher assignment" : "Assign teacher to course", size: "modal-lg",
        body: assignmentFields(a), saveLabel: a ? "Save changes" : "Assign",
        onSave: function (values, form, close) {
          const course = data.course(values.courseId);
          const section = data.section(values.sectionId);
          if (!course || !section || course.programId !== section.programId || course.semesterId !== section.semesterId) {
            ui.toast("Course must match the selected section's program and semester.", "error"); return;
          }
          if (store.state.teacherAssignments.some(function (x) {
            return x.teacherId === values.teacherId && x.courseId === values.courseId && x.sectionId === values.sectionId && (!a || x.id !== a.id);
          })) { ui.toast("This assignment already exists.", "error"); return; }
          commit(function (state) {
            const record = a ? state.teacherAssignments.find(function (x) { return x.id === a.id; }) : null;
            const payload = Object.assign({}, values, {
              programId: section.programId, departmentId: section.departmentId,
              academicYearId: section.academicYearId, semesterId: section.semesterId
            });
            if (record) Object.assign(record, payload); else state.teacherAssignments.push(Object.assign({ id: ES.uid("ta") }, payload));
          }, a ? "Assignment updated." : "Teacher assigned.", { action: "Teacher Assigned", related: data.sectionLabel(values.sectionId), description: (data.teacher(values.teacherId) || {}).name + " assigned to " + (data.course(values.courseId) || {}).code + " · " + data.sectionLabel(values.sectionId) });
          close(); ES.app.refresh();
        }
      });
      const form = document.getElementById("esModalForm");
      const sec = form.querySelector('[name="sectionId"]');
      const sem = form.querySelector('[name="semesterId"]');
      const prog = form.querySelector('[name="programId"]');
      const course = form.querySelector('[name="courseId"]');
      function refreshCourses() {
        const list = store.state.courses.filter(function (c) {
          return (!prog.value || c.programId === prog.value) && (!sem.value || c.semesterId === sem.value);
        });
        course.innerHTML = ES.common.options(list, "code", "id", "Select course").map(function (o) {
          return '<option value="' + o.value + '">' + ui.esc(o.label) + " — " + ui.esc((data.course(o.value) || {}).name || "") + "</option>";
        }).join("");
        if (a) course.value = a.courseId;
      }
      function refreshSections() {
        const list = store.state.sections.filter(function (s) { return (!prog.value || s.programId === prog.value) && (!sem.value || s.semesterId === sem.value); });
        sec.innerHTML = ES.common.options(list, "name", "id", "Select section").map(function (o) { return '<option value="' + o.value + '">' + ui.esc(o.label) + "</option>"; }).join("");
        if (a) sec.value = a.sectionId;
      }
      [prog, sem].forEach(function (el) { el.addEventListener("change", function () { refreshCourses(); refreshSections(); }); });
      refreshCourses(); refreshSections();
    }
    ui.on(root, "[data-ta-action]", "click", function (e, el) {
      const action = el.getAttribute("data-ta-action");
      if (action === "add") { open(null); return; }
      const record = store.state.teacherAssignments.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (!record) return;
      if (action === "edit") { open(record); return; }
      ui.confirm({ title: "Remove assignment", message: "Remove this teacher assignment?", onConfirm: function () {
        commit(function (state) { state.teacherAssignments = state.teacherAssignments.filter(function (x) { return x.id !== record.id; }); }, "Assignment removed.", { action: "Teacher Assignment Removed", related: data.sectionLabel(record.sectionId) });
        ES.app.refresh();
      } });
    });
  };

  const ttUI = { departmentId: "d-cs", programId: "p-bscs", semesterId: "sem-3", sectionId: "sec-cs3-e1" };

  views.timetable = function () {
    const entries = data.timetableFor(ttUI.sectionId);
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const body = ui.card({
      title: "Timetable management", subtitle: "Create and edit section timetables with conflict checks",
      actions: '<button class="btn btn-primary" data-tt-action="add"><i class="fa-solid fa-plus"></i> Add lecture</button>',
      body: ES.common.pickerHTML("tt", ttUI) +
        (ttUI.sectionId ? '<div class="notice notice-info"><i class="fa-solid fa-circle-info"></i>Showing timetable for <strong>' + ui.esc(data.sectionLabel(ttUI.sectionId, true)) + "</strong>. Teachers and students see the same entries in their own workspaces.</div>" : "") +
        '<div class="timetable-grid">' + days.map(function (day) {
          const list = entries.filter(function (e) { return e.day === day; });
          return '<div class="timetable-day"><h3>' + day + "</h3>" +
            (list.length ? list.map(function (e) {
              const course = data.course(e.courseId) || {};
              return '<div class="timetable-entry"><div class="tt-time">' + ui.esc(e.start) + "–" + ui.esc(e.end) + "</div>" +
                "<strong>" + ui.esc(course.code || "Course") + "</strong><span>" + ui.esc(course.name || "") + "</span>" +
                '<small>' + ui.esc((data.teacher(e.teacherId) || {}).name || "Teacher not assigned") + " · " + ui.esc(e.room || "") + "</small>" +
                '<div class="row-actions"><button class="icon-action" data-tt-action="edit" data-id="' + e.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="icon-action danger" data-tt-action="delete" data-id="' + e.id + '" title="Remove"><i class="fa-solid fa-trash"></i></button></div></div>';
            }).join("") : '<div class="tt-empty">No lectures</div>') + "</div>";
        }).join("") + "</div>"
    });
    return page("Timetable management", "Section-wise lecture schedule", body, "", ["Timetable"]);
  };

  mounts.timetable = function (root) {
    ES.common.bindPicker(root, "tt", ttUI, function () { ES.app.refresh(); });
    function open(entry) {
      const courses = data.coursesForSection(ttUI.sectionId);
      const body = '<div class="form-grid">' +
        ES.common.select("courseId", "Course", courses, entry && entry.courseId, { labelKey: function (c) { return c.code + " · " + c.name; }, placeholder: "Select course", required: true }) +
        ES.common.select("teacherId", "Teacher", store.state.teachers, entry && entry.teacherId, { labelKey: "name", placeholder: "Select teacher", required: true }) +
        ES.common.select("day", "Day", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], entry && entry.day, { required: true }) +
        ui.textInput("start", "Start time", entry && entry.start, { type: "time", required: true }) +
        ui.textInput("end", "End time", entry && entry.end, { type: "time", required: true }) +
        ui.textInput("room", "Room", (entry && entry.room) || (data.section(ttUI.sectionId) || {}).room) +
        "</div><div id=\"ttConflicts\"></div>";
      ui.openModal({
        title: entry ? "Edit timetable entry" : "Add timetable entry", body: body, size: "modal-lg",
        saveLabel: entry ? "Save changes" : "Add lecture",
        onSave: function (values, form, close) {
          if (values.end <= values.start) { ui.toast("End time must be after start time.", "error"); return; }
          const payload = Object.assign({}, values, { sectionId: ttUI.sectionId });
          const conflicts = data.timetableConflicts(payload, entry && entry.id);
          const box = document.getElementById("ttConflicts");
          if (conflicts.length) {
            box.innerHTML = '<div class="notice notice-warn"><strong>Timetable conflict</strong><ul>' + conflicts.map(function (c) { return "<li>" + ui.esc(c) + "</li>"; }).join("") + "</ul></div>";
            return;
          }
          const eligible = store.state.teacherAssignments.some(function (a) {
            return a.teacherId === values.teacherId && a.courseId === values.courseId && a.sectionId === ttUI.sectionId;
          });
          if (!eligible) { ui.toast("This teacher is not assigned to the selected course and section.", "error"); return; }
          commit(function (state) {
            if (entry) Object.assign(state.timetable.find(function (t) { return t.id === entry.id; }), payload);
            else state.timetable.push(Object.assign({ id: ES.uid("tt") }, payload));
          }, entry ? "Timetable updated." : "Lecture added.", { action: "Timetable Updated", related: data.sectionLabel(ttUI.sectionId), description: (entry ? "Updated" : "Added") + " lecture for " + data.sectionLabel(ttUI.sectionId) });
          close(); ES.app.refresh();
        }
      });
      const courseSelect = document.querySelector('#esModalForm [name="courseId"]');
      courseSelect.innerHTML = ES.common.options(courses, "code", "id", "Select course").map(function (o) {
        return '<option value="' + o.value + '">' + ui.esc(o.label) + " · " + ui.esc((data.course(o.value) || {}).name || "") + "</option>";
      }).join("");
      if (entry) courseSelect.value = entry.courseId;
    }
    ui.on(root, "[data-tt-action]", "click", function (e, el) {
      const action = el.getAttribute("data-tt-action");
      if (!ttUI.sectionId) { ui.toast("Select a section first.", "error"); return; }
      if (action === "add") { open(null); return; }
      const entry = store.state.timetable.find(function (t) { return t.id === el.getAttribute("data-id"); });
      if (action === "edit") { open(entry); return; }
      ui.confirm({ title: "Remove lecture", message: "Remove this timetable entry?", onConfirm: function () {
        commit(function (state) { state.timetable = state.timetable.filter(function (t) { return t.id !== entry.id; }); }, "Timetable entry removed.", { action: "Timetable Updated", related: data.sectionLabel(ttUI.sectionId) });
        ES.app.refresh();
      } });
    });
  };
})();
