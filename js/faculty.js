// ────────────────────────────────────────────
// faculty.js — Faculty dashboard
// ────────────────────────────────────────────

function initFaculty() {
  const user = requireRole('faculty');
  if (!user) return;
  renderNavUser(user);
  buildSidebar('faculty', user);
  renderFacultySections(user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();
}

/* ── Which semester is currently selected in faculty view ── */
let _facSem = SEMESTERS[0];

function renderFacultySections(user) {
  // build overview
  renderFacultyOverview(user);
  // build section stubs — actual content rendered when semester selected
  renderFacultyStudentList(user);
  renderAttendanceSection(user);
  renderMarksSection(user);
  renderUploadSection('sec-notes',       'notes',       'ss_notes',       '📓', 'Note',       '📄', user);
  renderUploadSection('sec-assignments', 'assignments', 'ss_assignments', '📝', 'Assignment', '📋', user);
  renderUploadSection('sec-lab',         'lab',         'ss_lab',         '🔬', 'Lab Report', '🧪', user);
}

/* ── Semester selector widget ── */
function semSelector(currentSem, onChangeFn) {
  const id = 'sem-sel-' + Math.random().toString(36).substr(2,5);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', e => { _facSem = e.target.value; onChangeFn(_facSem); });
  }, 0);
  return `<div class="sem-selector-wrap">
    <span class="sem-label">📚 Class / Semester:</span>
    <select id="${id}" class="form-control sem-select">
      ${SEMESTERS.map(s=>`<option value="${s}"${s===currentSem?' selected':''}>${s}</option>`).join('')}
    </select>
  </div>`;
}

/* ── Overview ── */
function renderFacultyOverview(user) {
  const allStudents = getStudents();
  const att   = SS.get('ss_attendance')  || {};
  const marks = SS.get('ss_marks')       || {};
  const notes = SS.get('ss_notes')       || {};
  const asgn  = SS.get('ss_assignments') || {};

  let totalNotes = 0;
  let totalAsgn  = 0;
  let totalAttendance = 0;
  let totalMarks = 0;

  allStudents.forEach(s => {
    if (att[s.email] !== undefined) totalAttendance++;
    if (marks[s.email] !== undefined) totalMarks++;
    totalNotes += (notes[s.email] || []).length;
    totalAsgn  += (asgn[s.email]  || []).length;
  });

  // Group students by semester
  const semGroups = {};
  SEMESTERS.forEach(s=>{
    semGroups[s] = allStudents.filter(u=>u.semester===s);
  });

  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Faculty Dashboard</div>
      <div class="page-sub">Manage student academic records by semester</div>
    </div>

    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${allStudents.length}</div>
        <div class="stat-lbl">Total Students</div>
      </div>

      <div class="stat-box">
        <div class="stat-val">${totalAttendance}</div>
        <div class="stat-lbl">Attendance Updated</div>
      </div>

      <div class="stat-box">
        <div class="stat-val">${totalMarks}</div>
        <div class="stat-lbl">Marks Updated</div>
      </div>

      <div class="stat-box">
        <div class="stat-val">${totalNotes}</div>
        <div class="stat-lbl">Notes Uploaded</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📚 Students by Semester</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>Students</th>
              <th>Attendance Set</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${SEMESTERS.map(sem => {
              const studs = semGroups[sem] || [];

              const withAtt = studs.filter(s => att[s.email] !== undefined).length;

              return `<tr>
                <td><strong style="color:var(--white)">${sem}</strong></td>
                <td><span class="badge badge-blue">${studs.length}</span></td>
                <td>${studs.length ? `${withAtt}/${studs.length}` : '—'}</td>
                <td>
                  ${studs.length 
                    ? `<button class="btn btn-primary btn-sm" onclick="_goSemester('${sem}')">Manage →</button>`
                    : `<span style="color:var(--muted)">No students</span>`
                  }
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* jump to Students tab with a semester pre-selected */
window._goSemester = function(sem) {
  _facSem = sem;
  switchSec('students');
  renderFacultyStudentList(null, sem);
};

/* ── Students list (with semester filter) ── */
function renderFacultyStudentList(user, forceSem) {
  if (forceSem) _facSem = forceSem;
  const sem      = _facSem;
  const students = getStudentsBySemester(sem);
  const att      = SS.get('ss_attendance') || {};
  const marks    = SS.get('ss_marks')      || {};

  document.getElementById('sec-students').innerHTML = `
    <div class="page-head"><div class="page-title">Students</div><div class="page-sub">View and manage student records</div></div>
    ${semSelector(sem, newSem => renderFacultyStudentList(null, newSem))}
    ${students.length ? `
    <div class="table-wrap" style="margin-top:1rem"><table>
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Attendance</th><th>Marks</th><th>Joined</th></tr></thead>
      <tbody>${students.map((s,i)=>`<tr style="cursor:pointer" onclick="_openStudentPanel('${esc(s.email)}','${sem}')">
        <td style="color:var(--muted)">${i+1}</td>
        <td><strong style="color:var(--white)">${esc(s.name)}</strong></td>
        <td style="color:var(--muted)">${esc(s.email)}</td>
        <td>${att[s.email]!==undefined?valBadge(att[s.email]):'<span class="badge badge-gray">N/A</span>'}</td>
        <td>${marks[s.email]!==undefined?valBadge(marks[s.email]):'<span class="badge badge-gray">N/A</span>'}</td>
        <td style="color:var(--muted)">${fmtDate(s.createdAt)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <p style="font-size:.78rem;color:var(--muted);margin-top:.6rem">💡 Click a student row to edit their attendance &amp; marks.</p>`
    : `<div class="card" style="margin-top:1rem"><div class="empty"><span class="empty-ico">👥</span>No students in ${sem} yet.</div></div>`}
    <div id="student-panel"></div>`;
}

/* ── Inline student panel for editing ── */
window._openStudentPanel = function(email, sem) {
  const users = SS.get('ss_users') || [];
  const s     = users.find(u => u.email === email);
  if (!s) return;
  const att   = SS.get('ss_attendance') || {};
  const marks = SS.get('ss_marks')      || {};
  const panel = document.getElementById('student-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="card" style="margin-top:1.25rem;border-color:var(--blue)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="sb-avatar" style="width:44px;height:44px;font-size:1rem">${initials(s.name)}</div>
          <div>
            <div style="font-weight:700;color:var(--white)">${esc(s.name)}</div>
            <div style="font-size:.8rem;color:var(--muted)">${esc(s.email)} · ${sem}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('student-panel').innerHTML=''">✕ Close</button>
      </div>
      <div id="sp-alert"></div>
      <div class="grid-2">
        <div>
          <div class="form-group">
            <label>Attendance % (0 – 100)</label>
            <input type="number" id="sp-att" class="form-control" min="0" max="100"
              value="${att[email] !== undefined ? att[email] : ''}" placeholder="e.g. 85">
          </div>
          <div class="form-group">
            <label>Marks % (0 – 100)</label>
            <input type="number" id="sp-marks" class="form-control" min="0" max="100"
              value="${marks[email] !== undefined ? marks[email] : ''}" placeholder="e.g. 78">
          </div>
          <button class="btn btn-primary" onclick="_saveStudentPanel('${email}','${sem}')">💾 Save Changes</button>
        </div>
        <div>
          <div style="font-size:.8rem;color:var(--muted);margin-bottom:.5rem;font-weight:600">CURRENT STATUS</div>
          <div class="info-list">
            <div class="info-row"><span class="info-key">Attendance</span><span class="info-val">${att[email]!==undefined?valBadge(att[email]):'<span class="badge badge-gray">Not set</span>'}</span></div>
            <div class="info-row"><span class="info-key">Marks</span><span class="info-val">${marks[email]!==undefined?valBadge(marks[email]):'<span class="badge badge-gray">Not set</span>'}</span></div>
            <div class="info-row"><span class="info-key">Exam Eligible</span><span class="info-val">${att[email]!==undefined?(att[email]>=75?'✅ Yes':'❌ No'):'—'}</span></div>
            <div class="info-row"><span class="info-key">Grade</span><span class="info-val">${marks[email]!==undefined?(marks[email]>=75?'A':marks[email]>=60?'B':marks[email]>=50?'C':marks[email]>=40?'D':'F'):'—'}</span></div>
          </div>
        </div>
      </div>
    </div>`;

  panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
};

window._saveStudentPanel = function(email, sem) {
  const attVal   = document.getElementById('sp-att')?.value;
  const marksVal = document.getElementById('sp-marks')?.value;
  let changed    = false;

  if (attVal !== '') {
    const v = parseInt(attVal);
    if (isNaN(v) || v < 0 || v > 100) { showAlert('sp-alert','Attendance must be 0–100.'); return; }
    const store = SS.get('ss_attendance') || {};
    store[email] = v; SS.set('ss_attendance', store);
    changed = true;
  }
  if (marksVal !== '') {
    const v = parseInt(marksVal);
    if (isNaN(v) || v < 0 || v > 100) { showAlert('sp-alert','Marks must be 0–100.'); return; }
    const store = SS.get('ss_marks') || {};
    store[email] = v; SS.set('ss_marks', store);
    changed = true;
  }
  if (!changed) { showAlert('sp-alert','No values entered.'); return; }
  toast('Saved successfully!','success');
  renderFacultyStudentList(null, sem);
  // re-open panel with refreshed data
  setTimeout(() => _openStudentPanel(email, sem), 50);
};

/* ── Attendance Section (semester view + bulk) ── */
function renderAttendanceSection(user) {
  renderNumericSection('sec-attendance','attendance','ss_attendance','📅','Attendance', user);
}
function renderMarksSection(user) {
  renderNumericSection('sec-marks','marks','ss_marks','📊','Marks', user);
}

function renderNumericSection(secId, id, key, icon, label, user) {
  const sem      = _facSem;
  const students = getStudentsBySemester(sem);
  const store    = SS.get(key) || {};

  const renderTable = (currentSem) => {
    const studs = getStudentsBySemester(currentSem);
    const st    = SS.get(key) || {};
    if (!studs.length) return `<div class="empty" style="padding:.75rem">No students in ${currentSem}.</div>`;
    return `<div class="table-wrap"><table>
      <thead><tr><th>Student</th><th>Email</th><th>${label} %</th><th>Action</th></tr></thead>
      <tbody>${studs.map(s=>`<tr>
        <td><strong style="color:var(--white)">${esc(s.name)}</strong></td>
        <td style="color:var(--muted)">${esc(s.email)}</td>
        <td>${st[s.email]!==undefined?valBadge(st[s.email]):'<span class="badge badge-gray">Not set</span>'}</td>
        <td><button class="btn btn-outline btn-sm" onclick="_inlineEdit('${id}','${key}','${esc(s.email)}','${label}')">Edit</button></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  };

  document.getElementById(secId).innerHTML = `
    <div class="page-head"><div class="page-title">${icon} ${label}</div><div class="page-sub">Update ${label.toLowerCase()} for a whole semester at once</div></div>
    ${semSelector(sem, newSem => {
      document.getElementById(`${id}-table`).innerHTML = renderTable(newSem);
      document.getElementById(`${id}-bulk-body`).innerHTML = bulkInputRows(newSem, key, label);
    })}
    <div class="grid-2" style="margin-top:1rem;align-items:start">
      <div class="card">
        <div class="card-title">${icon} Bulk Update — <span id="${id}-sem-lbl">${sem}</span></div>
        <div id="${id}-alert"></div>
        <div id="${id}-bulk-body">${bulkInputRows(sem, key, label)}</div>
        <button class="btn btn-primary" style="margin-top:1rem" onclick="_saveBulk('${id}','${key}','${label}')">💾 Save All</button>
      </div>
      <div class="card">
        <div class="card-title">📋 Current Records</div>
        <div id="${id}-table">${renderTable(sem)}</div>
      </div>
    </div>
    <div id="${id}-inline-panel"></div>`;

  // wire up semester selector to update label text too
  setTimeout(() => {
    const sel = document.querySelector(`#${secId} .sem-select`);
    if (sel) sel.addEventListener('change', e => {
      const lbl = document.getElementById(`${id}-sem-lbl`);
      if (lbl) lbl.textContent = e.target.value;
    });
  }, 0);
}

function bulkInputRows(sem, key, label) {
  const students = getStudentsBySemester(sem);
  const store    = SS.get(key) || {};
  if (!students.length) return `<div class="empty" style="padding:.5rem">No students in ${sem}.</div>`;
  return `<div style="display:flex;flex-direction:column;gap:.6rem">
    ${students.map(s=>`
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1;font-size:.85rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          <span style="color:var(--white);font-weight:600">${esc(s.name)}</span>
          <span style="color:var(--muted);font-size:.75rem;display:block">${esc(s.email)}</span>
        </div>
        <input type="number" class="form-control bulk-inp" data-email="${esc(s.email)}"
          min="0" max="100" style="width:90px"
          value="${store[s.email]!==undefined?store[s.email]:''}" placeholder="0–100">
      </div>`).join('')}
  </div>`;
}

window._saveBulk = function(id, key, label) {
  const inputs = document.querySelectorAll(`#${id}-bulk-body .bulk-inp`);
  const store  = SS.get(key) || {};
  let errors   = 0, saved = 0;
  inputs.forEach(inp => {
    if (inp.value === '') return;
    const v = parseInt(inp.value);
    if (isNaN(v) || v < 0 || v > 100) { errors++; return; }
    store[inp.dataset.email] = v;
    saved++;
  });
  SS.set(key, store);
  if (errors) showAlert(`${id}-alert`, `${errors} invalid value(s) skipped (must be 0–100).`, 'error');
  else if (!saved) showAlert(`${id}-alert`, 'No values entered.', 'error');
  else {
    toast(`${label} saved for ${saved} student(s)!`, 'success');
    // refresh table
    const sel = document.querySelector(`#sec-${id} .sem-select`) || document.querySelector(`#sec-marks .sem-select`) || document.querySelector(`#sec-attendance .sem-select`);
    const currentSem = sel ? sel.value : _facSem;
    const tableEl = document.getElementById(`${id}-table`);
    if (tableEl) tableEl.innerHTML = bulkRefreshTable(id, key, label, currentSem);
  }
};

function bulkRefreshTable(id, key, label, sem) {
  const studs = getStudentsBySemester(sem);
  const store = SS.get(key) || {};
  if (!studs.length) return `<div class="empty" style="padding:.75rem">No students in ${sem}.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Student</th><th>Email</th><th>${label} %</th><th>Action</th></tr></thead>
    <tbody>${studs.map(s=>`<tr>
      <td><strong style="color:var(--white)">${esc(s.name)}</strong></td>
      <td style="color:var(--muted)">${esc(s.email)}</td>
      <td>${store[s.email]!==undefined?valBadge(store[s.email]):'<span class="badge badge-gray">Not set</span>'}</td>
      <td><button class="btn btn-outline btn-sm" onclick="_inlineEdit('${id}','${key}','${esc(s.email)}','${label}')">Edit</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ── Inline single-student edit (for attendance/marks table) ── */
window._inlineEdit = function(id, key, email, label) {
  const store = SS.get(key) || {};
  const panel = document.getElementById(`${id}-inline-panel`);
  if (!panel) return;
  const users = SS.get('ss_users') || [];
  const s     = users.find(u => u.email === email) || { name: email };
  panel.innerHTML = `
    <div class="card" style="margin-top:1rem;border-color:var(--blue)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
        <div style="font-weight:700;color:var(--white)">Edit ${label}: ${esc(s.name)}</div>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('${id}-inline-panel').innerHTML=''">✕</button>
      </div>
      <div id="${id}-ie-alert"></div>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="number" id="${id}-ie-val" class="form-control" min="0" max="100"
          value="${store[email]!==undefined?store[email]:''}" placeholder="0–100" style="max-width:140px">
        <button class="btn btn-primary" onclick="_saveInlineEdit('${id}','${key}','${email}','${label}')">Save</button>
      </div>
    </div>`;
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
};

window._saveInlineEdit = function(id, key, email, label) {
  const v = parseInt(document.getElementById(`${id}-ie-val`)?.value);
  if (isNaN(v) || v < 0 || v > 100) { showAlert(`${id}-ie-alert`, 'Enter a value between 0 and 100.'); return; }
  const store = SS.get(key) || {};
  store[email] = v;
  SS.set(key, store);
  toast(`${label} updated!`, 'success');
  document.getElementById(`${id}-inline-panel`).innerHTML = '';
  // refresh table
  const sel = document.querySelector(`#sec-${id} .sem-select`);
  const currentSem = sel ? sel.value : _facSem;
  const tableEl = document.getElementById(`${id}-table`);
  if (tableEl) tableEl.innerHTML = bulkRefreshTable(id, key, label, currentSem);
  const bulkBody = document.getElementById(`${id}-bulk-body`);
  if (bulkBody) bulkBody.innerHTML = bulkInputRows(currentSem, key, label);
};

/* ── Upload section (notes / assignments / lab) with FILE support ── */
function renderUploadSection(secId, id, key, icon, label, itemIcon, user) {

  const renderList = (sem) => {
    const store    = SS.get(key) || {};
    const students = getStudentsBySemester(sem);
    if (!students.length) return `<div class="empty"><span class="empty-ico">${icon}</span>No students in ${sem}.</div>`;
    return students.map(s => {
      const items = store[s.email] || [];
      return `<div style="margin-bottom:1.1rem">
        <div style="font-weight:600;color:var(--white);font-size:.875rem;margin-bottom:.4rem">
          👤 ${esc(s.name)} <span style="color:var(--muted);font-weight:400;font-size:.8rem">${esc(s.email)}</span>
          <span class="badge badge-blue" style="margin-left:6px">${items.length}</span>
        </div>
        ${items.length ? items.map((it,idx)=>`
          <div class="item-row">
            <div class="item-row-left">
              <span class="item-row-icon">${it.fileData ? '📎' : itemIcon}</span>
              <div style="min-width:0">
                <div class="item-row-text">${esc(it.text)}</div>
                ${it.fileData ? `<div style="font-size:.72rem;color:var(--muted)">${esc(it.fileName||'')} · ${fmtSize(it.fileSize||0)}</div>` : ''}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              ${it.fileData ? `<a href="${it.fileData}" download="${esc(it.fileName||'file')}" class="btn btn-outline btn-sm">⬇ Download</a>` : ''}
              <span class="item-row-date">${it.date?fmtDate(it.date):''}</span>
              <button class="btn btn-danger btn-sm" onclick="_delUpload('${key}','${esc(s.email)}',${idx},'${secId}','${id}')">✕</button>
            </div>
          </div>`).join('')
          : `<div style="color:var(--muted);font-size:.8rem;padding:4px 0">No ${label.toLowerCase()}s uploaded.</div>`}
      </div>`;
    }).join('');
  };

  document.getElementById(secId).innerHTML = `
    <div class="page-head"><div class="page-title">${icon} ${label}s</div><div class="page-sub">Upload ${label.toLowerCase()}s to an entire semester class or to individual students</div></div>
    ${semSelector(_facSem, newSem => {
      document.getElementById(`${id}-list`).innerHTML = renderList(newSem);
      const studentSel = document.getElementById(`${id}-student`);
      if (studentSel) {
        studentSel.innerHTML = `<option value="__all__">— All students in semester —</option>${studentOpts(newSem)}`;
      }
    })}
    <div class="card" style="margin-top:1rem;margin-bottom:1.25rem">
      <div class="card-title">${icon} Upload ${label}</div>
      <div id="${id}-alert"></div>
      <div class="grid-2" style="align-items:end">
        <div class="form-group" style="margin-bottom:0">
          <label>Upload To</label>
          <select class="form-control" id="${id}-student">
            <option value="__all__">— All students in semester —</option>
            ${studentOpts(_facSem)}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>${label} Title / Description</label>
          <input type="text" class="form-control" id="${id}-text" placeholder="Enter ${label.toLowerCase()} title…">
        </div>
      </div>
      <div class="form-group" style="margin-top:.9rem;margin-bottom:0">
        <label>Attach File <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <div class="file-upload-area" id="${id}-dropzone" onclick="document.getElementById('${id}-file').click()">
          <span class="file-upload-icon">📁</span>
          <span id="${id}-file-lbl">Click to select file, or drag &amp; drop here</span>
          <input type="file" id="${id}-file" style="display:none" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.zip">
        </div>
      </div>
      <button class="btn btn-primary" id="${id}-submit" style="margin-top:1rem">${icon} Upload ${label}</button>
    </div>
    <div class="card">
      <div class="card-title">${icon} Uploaded ${label}s</div>
      <div id="${id}-list">${renderList(_facSem)}</div>
    </div>`;

  // File picker label update
  const fileInput = document.getElementById(`${id}-file`);
  const fileLbl   = document.getElementById(`${id}-file-lbl`);
  const dropzone  = document.getElementById(`${id}-dropzone`);

  fileInput?.addEventListener('change', e => {
    if (e.target.files[0]) fileLbl.textContent = `📎 ${e.target.files[0].name} (${fmtSize(e.target.files[0].size)})`;
  });

  // Drag & drop
  dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      fileInput.files = dt.files;
      fileLbl.textContent = `📎 ${e.dataTransfer.files[0].name} (${fmtSize(e.dataTransfer.files[0].size)})`;
    }
  });

  document.getElementById(`${id}-submit`)?.addEventListener('click', async () => {
    const selEl   = document.getElementById(`${id}-student`);
    const textEl  = document.getElementById(`${id}-text`);
    const selSem  = document.querySelector(`#${secId} .sem-select`)?.value || _facSem;
    const target  = selEl?.value;
    const text    = textEl?.value.trim();
    const file    = fileInput?.files?.[0];

    if (!text) { showAlert(`${id}-alert`, `Enter a ${label.toLowerCase()} title.`); return; }

    const btn = document.getElementById(`${id}-submit`);
    btn.disabled = true; btn.textContent = 'Uploading…';

    let fileData = null, fileName = null, fileSize = null;
    if (file) {
      try {
        fileData = await fileToBase64(file);
        fileName = file.name;
        fileSize = file.size;
      } catch(e) {
        showAlert(`${id}-alert`, 'Failed to read file.', 'error');
        btn.disabled = false; btn.textContent = `${icon} Upload ${label}`;
        return;
      }
    }

    const store    = SS.get(key) || {};
    const item     = { text, date: nowISO(), ...(fileData ? {fileData, fileName, fileSize} : {}) };
    const students = getStudentsBySemester(selSem);

    if (target === '__all__') {
      if (!students.length) { showAlert(`${id}-alert`, 'No students in this semester.', 'error'); btn.disabled=false; btn.textContent=`${icon} Upload ${label}`; return; }
      students.forEach(s => { if (!store[s.email]) store[s.email]=[]; store[s.email].push({...item}); });
      SS.set(key, store);
      toast(`${label} uploaded to all ${students.length} students in ${selSem}!`, 'success');
    } else {
      if (!store[target]) store[target] = [];
      store[target].push(item);
      SS.set(key, store);
      toast(`${label} uploaded!`, 'success');
    }

    textEl.value = '';
    fileInput.value = '';
    fileLbl.textContent = 'Click to select file, or drag & drop here';
    document.getElementById(`${id}-list`).innerHTML = renderList(selSem);
    btn.disabled = false; btn.textContent = `${icon} Upload ${label}`;
  });
}

window._delUpload = function(key, email, idx, secId, id) {
  const store = SS.get(key) || {};
  if (store[email]) { store[email].splice(parseInt(idx),1); SS.set(key, store); }
  // re-render current list
  const selSem = document.querySelector(`#${secId} .sem-select`)?.value || _facSem;
  const listEl = document.getElementById(`${id}-list`);
  if (listEl) {
    // rebuild just the list portion inline
    const students = getStudentsBySemester(selSem);
    const st = SS.get(key) || {};
    const icon = id==='notes'?'📓':id==='assignments'?'📝':'🔬';
    const itemIcon = id==='notes'?'📄':id==='assignments'?'📋':'🧪';
    const label = id==='notes'?'Note':id==='assignments'?'Assignment':'Lab Report';
    listEl.innerHTML = students.length ? students.map(s => {
      const items = st[s.email] || [];
      return `<div style="margin-bottom:1.1rem">
        <div style="font-weight:600;color:var(--white);font-size:.875rem;margin-bottom:.4rem">
          👤 ${esc(s.name)} <span style="color:var(--muted);font-weight:400;font-size:.8rem">${esc(s.email)}</span>
          <span class="badge badge-blue" style="margin-left:6px">${items.length}</span>
        </div>
        ${items.length ? items.map((it,i)=>`
          <div class="item-row">
            <div class="item-row-left">
              <span class="item-row-icon">${it.fileData?'📎':itemIcon}</span>
              <div style="min-width:0">
                <div class="item-row-text">${esc(it.text)}</div>
                ${it.fileData?`<div style="font-size:.72rem;color:var(--muted)">${esc(it.fileName||'')} · ${fmtSize(it.fileSize||0)}</div>`:''}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              ${it.fileData?`<a href="${it.fileData}" download="${esc(it.fileName||'file')}" class="btn btn-outline btn-sm">⬇ Download</a>`:''}
              <span class="item-row-date">${it.date?fmtDate(it.date):''}</span>
              <button class="btn btn-danger btn-sm" onclick="_delUpload('${key}','${esc(s.email)}',${i},'${secId}','${id}')">✕</button>
            </div>
          </div>`).join('')
          : `<div style="color:var(--muted);font-size:.8rem;padding:4px 0">No ${label.toLowerCase()}s uploaded.</div>`}
      </div>`;
    }).join('') : `<div class="empty"><span class="empty-ico">${icon}</span>No students in semester.</div>`;
  }
  toast('Item removed.','info');
};
