(function () {
  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    return String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  function avatar(name, photo, size) {
    const s = size || 34;
    if (photo) {
      return '<span class="avatar" style="width:' + s + 'px;height:' + s + 'px"><img src="' + esc(photo) + '" alt="' + esc(name) + '"></span>';
    }
    return '<span class="avatar" style="width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s / 2.7) + 'px">' + esc(initials(name)) + "</span>";
  }

  function toneFor(status) {
    const s = String(status || "").toLowerCase();
    if (["active", "present", "approved", "published", "submitted", "completed"].indexOf(s) !== -1) return "green";
    if (["draft", "late", "under review", "pending"].indexOf(s) !== -1) return "amber";
    if (["absent", "returned", "deleted", "rejected", "leave"].indexOf(s) !== -1) return "red";
    if (["archived", "inactive", "locked"].indexOf(s) !== -1) return "slate";
    return "blue";
  }

  function badge(text, tone) {
    return '<span class="badge badge-' + (tone || toneFor(text)) + '">' + esc(text) + "</span>";
  }

  function pageHeader(config) {
    const crumbs = (config.breadcrumb || []).map(function (c, i, arr) {
      return '<span class="' + (i === arr.length - 1 ? "current" : "") + '">' + esc(c) + "</span>" +
        (i === arr.length - 1 ? "" : '<span class="crumb-sep">/</span>');
    }).join("");
    return "" +
      '<div class="page-head">' +
        '<div class="page-head-top">' +
          '<nav class="breadcrumbs">' + crumbs + "</nav>" +
          '<div class="page-actions">' + (config.actions || "") + "</div>" +
        "</div>" +
        '<div class="page-title-row">' +
          "<div>" +
            "<h1>" + esc(config.title) + "</h1>" +
            (config.subtitle ? "<p>" + esc(config.subtitle) + "</p>" : "") +
          "</div>" +
        "</div>" +
      "</div>";
  }

  function card(config) {
    return "" +
      '<section class="card ' + (config.class || "") + '">' +
        (config.title || config.actions ?
          '<div class="card-head">' +
            "<div><h2>" + esc(config.title || "") + "</h2>" +
            (config.subtitle ? '<p class="card-sub">' + esc(config.subtitle) + "</p>" : "") +
            "</div>" +
            (config.actions ? '<div class="card-actions">' + config.actions + "</div>" : "") +
          "</div>" : "") +
        '<div class="card-body">' + (config.body || "") + "</div>" +
      "</section>";
  }

  function statCard(config) {
    return "" +
      '<div class="stat-card">' +
        '<div class="stat-icon tone-' + (config.tone || "blue") + '"><i class="fa-solid ' + esc(config.icon || "fa-chart-simple") + '"></i></div>' +
        '<div class="stat-copy"><span class="stat-label">' + esc(config.label) + "</span>" +
        '<strong class="stat-value">' + esc(config.value) + "</strong>" +
        (config.note ? '<span class="stat-note">' + esc(config.note) + "</span>" : "") +
        "</div>" +
      "</div>";
  }

  function table(columns, rows, options) {
    const opts = options || {};
    const head = columns.map(function (c) {
      return "<th" + (c.width ? ' style="width:' + c.width + '"' : "") + ">" + esc(c.label) + "</th>";
    }).join("");
    const body = rows.length
      ? rows.map(function (row) {
          return "<tr" + (row._attrs || "") + ">" + columns.map(function (c) {
            const value = c.render ? c.render(row) : esc(row[c.key] !== undefined && row[c.key] !== null && row[c.key] !== "" ? row[c.key] : "—");
            return "<td" + (c.className ? ' class="' + c.className + '"' : "") + ">" + value + "</td>";
          }).join("") + "</tr>";
        }).join("")
      : '<tr><td colspan="' + columns.length + '">' + empty(opts.empty || "No records found.") + "</td></tr>";
    return '<div class="table-wrap' + (opts.compact ? " compact" : "") + '"><table class="data-table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function empty(message, icon) {
    return '<div class="empty-state"><i class="fa-solid ' + esc(icon || "fa-inbox") + '"></i><p>' + esc(message) + "</p></div>";
  }

  function dataAttr(name) {
    return " data-" + String(name).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function textInput(name, label, value, config) {
    const c = config || {};
    return field(label, '<input class="control" type="' + (c.type || "text") + '" name="' + esc(name) + '"' + dataAttr(name) + ' value="' + esc(value || "") + '"' +
      (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") +
      (c.required ? " required" : "") +
      (c.min !== undefined ? ' min="' + esc(c.min) + '"' : "") +
      (c.max !== undefined ? ' max="' + esc(c.max) + '"' : "") +
      (c.step ? ' step="' + esc(c.step) + '"' : "") +
      (c.accept ? ' accept="' + esc(c.accept) + '"' : "") + ">", c.hint);
  }

  function textarea(name, label, value, config) {
    const c = config || {};
    return field(label, '<textarea class="control" name="' + esc(name) + '"' + dataAttr(name) + ' rows="' + (c.rows || 4) + '"' +
      (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") +
      (c.required ? " required" : "") + ">" + esc(value || "") + "</textarea>", c.hint);
  }

  function select(name, label, options, value, config) {
    const c = config || {};
    const opts = options.map(function (o) {
      const val = typeof o === "object" ? o.value : o;
      const text = typeof o === "object" ? o.label : o;
      return '<option value="' + esc(val) + '"' + (String(val) === String(value || "") ? " selected" : "") + ">" + esc(text) + "</option>";
    }).join("");
    return field(label, '<select class="control" name="' + esc(name) + '"' + dataAttr(name) + (c.required ? " required" : "") +
      (c.multiple ? " multiple" : "") + (c.id ? ' id="' + esc(c.id) + '"' : "") + ">" +
      (c.placeholder ? '<option value="">' + esc(c.placeholder) + "</option>" : "") + opts + "</select>", c.hint);
  }

  function field(label, control, hint) {
    return '<label class="field">' + (label ? '<span class="field-label">' + esc(label) + "</span>" : "") + control +
      (hint ? '<span class="field-hint">' + esc(hint) + "</span>" : "") + "</label>";
  }

  function toolbar(inner) {
    return '<div class="toolbar">' + inner + "</div>";
  }

  function searchBox(value, placeholder, action) {
    return '<div class="search-control"><i class="fa-solid fa-magnifying-glass"></i>' +
      '<input type="search" class="control" value="' + esc(value || "") + '" placeholder="' + esc(placeholder || "Search") + '" data-input="' + esc(action) + '"' + dataAttr(action) + '></div>';
  }

  function optionList(items, labelKey, valueKey) {
    return items.map(function (item) {
      return { value: item[valueKey || "id"], label: item[labelKey || "name"] };
    });
  }

  function fmtDate(value) {
    if (!value) return "—";
    const parts = String(value).split("-");
    if (parts.length !== 3) return esc(value);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return parts[2] + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formValues(form) {
    const values = {};
    Array.prototype.forEach.call(new FormData(form).entries(), function (entry) {
      const key = entry[0];
      const val = entry[1];
      if (values[key] === undefined) values[key] = val;
      else if (Array.isArray(values[key])) values[key].push(val);
      else values[key] = [values[key], val];
    });
    return values;
  }

  const modalRoot = function () { return document.getElementById("modalRoot"); };

  function openModal(config) {
    const root = modalRoot();
    if (!root) return;
    const buttons = (config.buttons || []).map(function (b, i) {
      return '<button type="button" class="btn ' + (b.class || "btn-ghost") + '" data-modal-btn="' + i + '">' + esc(b.label) + "</button>";
    }).join("");
    root.innerHTML = "" +
      '<div class="modal-backdrop" data-modal-close>' +
        '<div class="modal-dialog ' + (config.size || "") + '" role="dialog" aria-modal="true">' +
          '<div class="modal-head"><h2>' + esc(config.title || "") + "</h2>" +
          '<button type="button" class="icon-btn" data-modal-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>' +
          '<form id="esModalForm" novalidate>' +
            '<div class="modal-body">' + (config.body || "") + "</div>" +
            '<div class="modal-foot">' + buttons +
              (config.saveLabel === null ? "" : '<button type="submit" class="btn btn-primary">' + esc(config.saveLabel || "Save changes") + "</button>") +
            "</div>" +
          "</form>" +
        "</div>" +
      "</div>";
    root.classList.add("open");
    const form = document.getElementById("esModalForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const values = formValues(form);
      if (config.onSave) config.onSave(values, form, closeModal);
    });
    root.querySelectorAll("[data-modal-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const b = config.buttons[parseInt(btn.getAttribute("data-modal-btn"), 10)];
        if (b && b.onClick) b.onClick(form, closeModal);
      });
    });
    root.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target === el || el.tagName === "BUTTON") closeModal();
      });
    });
    const first = form.querySelector("input:not([type=hidden]), select, textarea");
    if (first) setTimeout(function () { first.focus(); }, 40);
  }

  function closeModal() {
    const root = modalRoot();
    if (!root) return;
    root.classList.remove("open");
    root.innerHTML = "";
  }

  function confirm(config) {
    openModal({
      title: config.title || "Please confirm",
      size: "modal-sm",
      saveLabel: config.confirmLabel || "Confirm",
      body: '<p class="confirm-text">' + esc(config.message || "Are you sure?") + "</p>",
      onSave: function (values, form, close) {
        close();
        if (config.onConfirm) config.onConfirm();
      }
    });
  }

  function toast(message, type) {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast toast-" + (type || "success");
    el.innerHTML = '<i class="fa-solid ' + (type === "error" ? "fa-circle-exclamation" : "fa-circle-check") + '"></i><span>' + esc(message) + "</span>";
    root.appendChild(el);
    setTimeout(function () { el.classList.add("show"); }, 20);
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, 3200);
  }

  function barChart(items, options) {
    const opts = options || {};
    const max = opts.max || Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    return '<div class="chart-bars">' + items.map(function (i) {
      const h = Math.max(4, Math.round((i.value / max) * 100));
      return '<div class="chart-bar-item">' +
        '<div class="bar-track"><div class="bar-fill" style="height:' + h + '%" title="' + esc(i.label + ": " + i.value) + '"></div></div>' +
        '<span class="bar-value">' + esc(i.value) + "</span>" +
        '<span class="bar-label">' + esc(i.label) + "</span>" +
        "</div>";
    }).join("") + "</div>";
  }

  function lineChart(points, options) {
    const opts = options || {};
    const w = 640, h = 190, pad = 28;
    if (!points.length) return empty("No trend data available.");
    const values = points.map(function (p) { return p.value; });
    const max = opts.max || Math.max.apply(null, values.concat([1]));
    const min = opts.min || 0;
    const span = Math.max(1, max - min);
    const coords = points.map(function (p, i) {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const line = coords.map(function (c) { return c[0].toFixed(1) + "," + c[1].toFixed(1); }).join(" ");
    const area = "M" + coords[0][0].toFixed(1) + "," + (h - pad) + " L" + line.replace(/ /g, " L") + " L" + coords[coords.length - 1][0].toFixed(1) + "," + (h - pad) + " Z";
    return '<div class="line-chart"><svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img" aria-label="Trend chart">' +
      '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" class="axis"/>' +
      '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (h - pad) + '" class="axis"/>' +
      '<path d="' + area + '" class="chart-area"/>' +
      '<polyline points="' + line + '" class="chart-line"/>' +
      coords.map(function (c, i) { return '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="4" class="chart-dot"><title>' + esc(points[i].label + ": " + points[i].value) + "</title></circle>"; }).join("") +
      "</svg>" +
      '<div class="line-labels">' + points.map(function (p) { return "<span>" + esc(p.label) + "</span>"; }).join("") + "</div>" +
      "</div>";
  }

  function progress(value, tone) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="progress-wrap"><div class="progress-track"><div class="progress-fill ' + (tone || "") + '" style="width:' + v + '%"></div></div><span>' + v + "%</span></div>";
  }

  function on(root, selector, event, handler) {
    if (!root) return;
    const normalized = String(selector).replace(/\[data-([A-Za-z0-9_-]+)/g, function (_, name) {
      return "[data-" + name.toLowerCase();
    });
    root.addEventListener(event, function (e) {
      const target = e.target.closest(normalized);
      if (target && root.contains(target)) handler.call(target, e, target);
    });
  }

  function paginate(items, page, perPage) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page || 1), pages);
    return { rows: items.slice((current - 1) * perPage, current * perPage), page: current, pages: pages, total: total, from: total ? (current - 1) * perPage + 1 : 0, to: Math.min(current * perPage, total) };
  }

  function pagination(result, action) {
    if (result.pages <= 1) return '<div class="pagination"><span>' + result.total + " record" + (result.total === 1 ? "" : "s") + '</span><span></span></div>';
    const buttons = [];
    buttons.push('<button type="button" data-' + action + '="' + (result.page - 1) + '"' + (result.page === 1 ? " disabled" : "") + '><i class="fa-solid fa-chevron-left"></i></button>');
    for (let i = 1; i <= result.pages; i++) {
      buttons.push('<button type="button" data-' + action + '="' + i + '" class="' + (i === result.page ? "active" : "") + '">' + i + "</button>");
    }
    buttons.push('<button type="button" data-' + action + '="' + (result.page + 1) + '"' + (result.page === result.pages ? " disabled" : "") + '><i class="fa-solid fa-chevron-right"></i></button>');
    return '<div class="pagination"><span>Showing ' + result.from + "–" + result.to + " of " + result.total + '</span><div class="pagination-controls">' + buttons.join("") + "</div></div>";
  }

  function toCSV(rows) {
    return rows.map(function (row) {
      return row.map(function (cell) {
        const value = cell === null || cell === undefined ? "" : String(cell);
        return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
      }).join(",");
    }).join("\r\n");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    const source = String(text || "").replace(/\r\n/g, "\n");
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell.trim()); cell = ""; }
      else if (ch === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    row.push(cell.trim());
    if (row.some(function (c) { return c !== ""; })) rows.push(row);
    return rows.filter(function (r) { return r.some(function (c) { return c !== ""; }); });
  }

  function download(filename, content, mime) {
    const blob = new Blob(["\ufeff" + content], { type: mime || "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function printDocument(title, body, meta) {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { toast("Allow pop-ups to open the print view.", "error"); return; }
    const institution = (window.ES && ES.data && ES.data.settings().institution.name) || "EduSphere University";
    win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + esc(title) + "</title>" +
      "<style>body{font-family:'Segoe UI',Arial,sans-serif;color:#172b3d;margin:0;padding:32px;font-size:13px}" +
      "h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #dfe6ec;padding-bottom:6px}" +
      "p{margin:4px 0;color:#4d6175}.masthead{text-align:center;border-bottom:3px double #172b3d;padding-bottom:14px;margin-bottom:20px}" +
      ".masthead small{letter-spacing:2px;text-transform:uppercase;color:#73889b}table{width:100%;border-collapse:collapse;margin-top:10px}" +
      "th,td{border:1px solid #c9d4dd;padding:7px 9px;text-align:left;font-size:12px}th{background:#f3f6f8;font-size:10px;text-transform:uppercase;letter-spacing:.5px}" +
      ".num{text-align:right}.meta{display:flex;flex-wrap:wrap;gap:18px;margin:14px 0}.meta div{min-width:150px}.meta span{display:block;font-size:10px;text-transform:uppercase;color:#73889b}" +
      ".footer{margin-top:36px;display:flex;justify-content:space-between;border-top:1px solid #dfe6ec;padding-top:10px;font-size:11px;color:#73889b}" +
      ".notice{background:#f3f6f8;border:1px solid #dfe6ec;padding:9px;font-size:11px;margin-top:12px}@media print{body{padding:12mm}}</style></head><body>" +
      "<div class='masthead'><small>" + esc(institution) + "</small><h1>" + esc(title) + "</h1><p>" + esc(meta || "Academic document · Frontend demo") + "</p></div>" +
      body + "<div class='footer'><span>Generated from EduSphere LMS demo</span><span>" + esc(new Date().toLocaleString()) + "</span></div>" +
      "<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>");
    win.document.close();
  }

  function timeline(items) {
    if (!items.length) return empty("No records yet.");
    return '<ol class="timeline">' + items.map(function (item) {
      return '<li><span class="timeline-marker"><i class="fa-solid ' + esc(item.icon || "fa-circle-info") + '"></i></span>' +
        '<div class="timeline-body"><strong>' + esc(item.title || item.text || "") + "</strong>" +
        (item.description ? "<p>" + esc(item.description) + "</p>" : "") +
        '<small>' + esc(item.when || item.time || "") + (item.related ? " · " + esc(item.related) : "") + "</small></div></li>";
    }).join("") + "</ol>";
  }

  window.ES = window.ES || {};
  ES.ui = {
    esc: esc, initials: initials, avatar: avatar, badge: badge, toneFor: toneFor,
    pageHeader: pageHeader, card: card, statCard: statCard, table: table, empty: empty,
    textInput: textInput, textarea: textarea, select: select, field: field,
    toolbar: toolbar, searchBox: searchBox, optionList: optionList,
    fmtDate: fmtDate, today: today, formValues: formValues,
    openModal: openModal, closeModal: closeModal, confirm: confirm, toast: toast,
    barChart: barChart, lineChart: lineChart, progress: progress,
    on: on, paginate: paginate, pagination: pagination, toCSV: toCSV, parseCSV: parseCSV,
    download: download, printDocument: printDocument, timeline: timeline
  };
})();
