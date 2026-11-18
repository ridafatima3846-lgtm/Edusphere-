(function () {
  window.ES = window.ES || {};
  ES.views = ES.views || {};
  ES.mounts = ES.mounts || {};

  const ui = function () { return ES.ui; };
  const data = function () { return ES.data; };

  function options(items, labelKey, valueKey, placeholder) {
    const list = (items || []).map(function (item) {
      if (typeof item !== "object" || item === null) return { value: item, label: item };
      const value = typeof valueKey === "function" ? valueKey(item) : (valueKey ? item[valueKey] : (item.value !== undefined ? item.value : item.id));
      const label = typeof labelKey === "function" ? labelKey(item) : (labelKey ? item[labelKey] : (item.label !== undefined ? item.label : item.name));
      return { value: value, label: label };
    });
    return (placeholder ? [{ value: "", label: placeholder }] : []).concat(list);
  }

  function select(name, label, items, value, config) {
    const c = config || {};
    return ES.ui.select(name, label, options(items, c.labelKey, c.valueKey, c.placeholder), value, c);
  }

  function person(name, subtitle, photo, id) {
    return '<div class="cell-person">' + ES.ui.avatar(name, photo) + "<div><strong>" + ES.ui.esc(name) + "</strong>" +
      (subtitle ? "<small>" + ES.ui.esc(subtitle) + "</small>" : "") + "</div></div>";
  }

  function actions(items) {
    return '<div class="row-actions">' + items.map(function (a) {
      return '<button type="button" class="icon-action' + (a.danger ? " danger" : "") + '" ' + a.attrs + ' title="' + ES.ui.esc(a.title) + '" aria-label="' + ES.ui.esc(a.title) + '"><i class="fa-solid ' + a.icon + '"></i></button>';
    }).join("") + "</div>";
  }

  function pickerHTML(prefix, cfg, config) {
    const c = config || {};
    const storeState = ES.store.state;
    const departments = storeState.departments;
    const programs = storeState.programs.filter(function (p) { return !cfg.departmentId || p.departmentId === cfg.departmentId; });
    const semesters = storeState.semesters;
    const sections = data().sectionsFor(cfg.departmentId, cfg.programId, cfg.semesterId);
    let html = '<div class="filter-strip">' +
      select(prefix + "Department", "Department", departments, cfg.departmentId, { labelKey: "name", placeholder: c.allDepartments ? "All departments" : "Select department" }) +
      select(prefix + "Program", "Program", programs, cfg.programId, { labelKey: "name", placeholder: c.allPrograms ? "All programs" : "Select program" }) +
      select(prefix + "Semester", "Semester", semesters, cfg.semesterId, { labelKey: "name", placeholder: c.allSemesters ? "All semesters" : "Select semester" }) +
      (c.extra || "") + "</div>";
    if (c.sections !== false) {
      html += '<div class="segment"><span class="segment-label">Section</span>' +
        (sections.length ? sections.map(function (s) {
          return '<button type="button" class="segment-btn' + (cfg.sectionId === s.id ? " active" : "") + '" data-' + prefix + 'section="' + ES.ui.esc(s.id) + '">' + ES.ui.esc(s.name) + "</button>";
        }).join("") : '<span class="muted-text">No sections for this selection</span>') + "</div>";
    }
    return html;
  }

  function bindPicker(root, prefix, cfg, onChange) {
    ui().on(root, "[data-" + prefix + "department]", "change", function (e, el) {
      cfg.departmentId = el.value; cfg.programId = ""; cfg.semesterId = ""; cfg.sectionId = ""; onChange();
    });
    ui().on(root, "[data-" + prefix + "program]", "change", function (e, el) {
      cfg.programId = el.value; cfg.semesterId = ""; cfg.sectionId = ""; onChange();
    });
    ui().on(root, "[data-" + prefix + "semester]", "change", function (e, el) {
      cfg.semesterId = el.value; cfg.sectionId = ""; onChange();
    });
    ui().on(root, "[data-" + prefix + "section]", "click", function (e, el) {
      cfg.sectionId = el.getAttribute("data-" + prefix + "section"); onChange();
    });
  }

  function sectionInfo(section) {
    if (!section) return "—";
    return data().sectionLabel(section.id, true);
  }

  function studentColumns(withActions) {
    const cols = [
      { label: "Student", render: function (s) { return person(s.name, s.email, s.photo); } },
      { label: "Roll no.", render: function (s) { return "<strong>" + ES.ui.esc(s.rollNo) + "</strong>"; } },
      { label: "Program", render: function (s) { return ES.ui.esc(data().programLabel(s.programId)); } },
      { label: "Semester", render: function (s) { return ES.ui.esc(data().semesterLabel(s.semesterId)); } },
      { label: "Section", render: function (s) { return ES.ui.esc(data().sectionLabel(s.sectionId)); } },
      { label: "Status", render: function (s) { return ES.ui.badge(s.deleted ? "Deleted" : s.status || "Active"); } }
    ];
    if (withActions) cols.push({ label: "Actions", render: function (s) { return (typeof withActions === "function" ? withActions(s) : ""); } });
    return cols;
  }

  function statusSummary() {
    const state = ES.store.state;
    return {
      active: state.students.filter(function (s) { return !s.deleted; }).length,
      deleted: state.students.filter(function (s) { return s.deleted; }).length
    };
  }

  ES.common = {
    options: options, select: select, person: person, actions: actions,
    pickerHTML: pickerHTML, bindPicker: bindPicker, sectionInfo: sectionInfo,
    studentColumns: studentColumns, statusSummary: statusSummary
  };
})();
