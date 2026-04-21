// ────────────────────────────────────────────
// faculty.js — Faculty dashboard (matches original UI)
// ────────────────────────────────────────────

let _facultyStudents = [];
let _currentSem = '';

async function initFaculty() {
  const user = requireRole('faculty');
  if (!user) return;

  renderNavUser(user);
  buildSidebar('faculty', user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();

  _facultyStudents = await apiGetUsersByRole('student');
  _currentSem = user.semester || '';

  renderFacultyOverview(user);
  renderFacultyStudents();
  renderFacultyAttendance();
  renderFacultyMarks();
  renderFacultyNotes();
  renderFacultyAssignments();
  renderFacultyLab();
}

// ── Semester selector bar (shared across sections) ──
function semBar(id, onchange, selected) {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const val = selected || _currentSem || (sems[0] || '');
  return `
    <div class="card" style="margin-bottom:1.25rem;padding:1rem 1.25rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-weight:600;font-size:.875rem;color:var(--muted);white-space:nowrap">📚 CLASS / SEMESTER:</span>
        <select class="form-control" id="${id}" onchange="${onchange}"
          style="max-width:200px;padding:6px 10px;font-size:.875rem">
          ${sems.length ? sems.map(s =>
            `<option value="${esc(s)}"${s===val?' selected':''}>${esc(s)}</option>`
          ).join('') : '<option value="">No semesters yet</option>'}
        </select>
      </div>
    </div>`;
}

function getSelSem(id) {
  const el = document.getElementById(id);
  return el ? el.value : _currentSem;
}

function semStudents(sem) {
  return _facultyStudents.filter(s => s.semester === sem);
}

// ── Overview ──
function renderFacultyOverview(user) {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const totalAtt = _facultyStudents.filter(s => s._attSet).length;

  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Faculty Dashboard</div>
      <div class="page-sub">Manage student academic records by semester</div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${_facultyStudents.length}</div>
        <div class="stat-lbl">Total Students</div>
        <span class="stat-bg-icon">👨‍🎓</span>
      </div>
      <div class="stat-box" id="ov-att-box">
        <div class="stat-val" id="ov-att">—</div>
        <div class="stat-lbl">Attendance Updated</div>
        <span class="stat-bg-icon">📅</span>
      </div>
      <div class="stat-box" id="ov-marks-box">
        <div class="stat-val" id="ov-marks">—</div>
        <div class="stat-lbl">Marks Updated</div>
        <span class="stat-bg-icon">📊</span>
      </div>
      <div class="stat-box" id="ov-notes-box">
        <div class="stat-val" id="ov-notes">—</div>
        <div class="stat-lbl">Notes Uploaded</div>
        <span class="stat-bg-icon">📓</span>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📚 Students by Semester</div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Semester</th><th>Students</th><th>Attendance Set</th><th>Action</th>
          </tr></thead>
          <tbody id="sem-overview-body">
            ${sems.map(sem => {
              const sts = semStudents(sem);
              return `<tr>
                <td><strong>${esc(sem)}</strong></td>
                <td><span class="badge badge-blue">${sts.length}</span></td>
                <td id="att-set-${sem.replace(' ','-')}">Loading…</td>
                <td><button class="btn btn-primary btn-sm"
                  onclick="switchSec('students');document.getElementById('fac-sem-students').value='${esc(sem)}';loadFacStudents()">
                  Manage →</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Load stats async
  loadOverviewStats(sems);
}

async function loadOverviewStats(sems) {
  let attCount = 0, marksCount = 0, notesCount = 0;
  const dataArr = await Promise.all(_facultyStudents.map(s => apiGetStudentData(s.email)));
  _facultyStudents.forEach((s, i) => {
    const d = dataArr[i];
    if (d.attendance !== null && d.attendance !== undefined) attCount++;
    if (d.marks !== null && d.marks !== undefined) marksCount++;
    notesCount += (d.notes||[]).length;
  });

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ov-att',   attCount);
  set('ov-marks', marksCount);
  set('ov-notes', notesCount);

  // Update semester attendance set counts
  sems.forEach(sem => {
    const sts = semStudents(sem);
    const setCount = sts.filter((s, i) => {
      const idx = _facultyStudents.indexOf(s);
      return dataArr[idx] && dataArr[idx].attendance !== null && dataArr[idx].attendance !== undefined;
    }).length;
    const el = document.getElementById('att-set-' + sem.replace(' ','-'));
    if (el) el.innerHTML = `<span style="color:var(--muted)">${setCount}/${sts.length}</span>`;
  });
}

// ── Students ──
function renderFacultyStudents() {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const initSem = _currentSem || sems[0] || '';

  document.getElementById('sec-students').innerHTML = `
    <div class="page-head">
      <div class="page-title">Students</div>
      <div class="page-sub">View and manage student records</div>
    </div>
    ${semBar('fac-sem-students', 'loadFacStudents()', initSem)}
    <div id="fac-students-table"><div class="empty">Select a semester above.</div></div>`;

  if (initSem) loadFacStudents();
}

async function loadFacStudents() {
  const sem = getSelSem('fac-sem-students');
  const sts = semStudents(sem);
  const el  = document.getElementById('fac-students-table');
  if (!sts.length) { el.innerHTML = '<div class="empty">No students in this semester.</div>'; return; }

  el.innerHTML = '<div class="empty">Loading…</div>';
  const dataArr = await Promise.all(sts.map(s => apiGetStudentData(s.email)));

  const attBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=50?'var(--amber)':'var(--rose)'};color:#fff">${v}%</span>`
    : `<span class="badge badge-gray">—</span>`;
  const mksBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=60?'var(--amber)':v>=75?'var(--green)':'var(--rose)'};color:#fff">${v}%</span>`
    : `<span class="badge badge-gray">—</span>`;

  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Attendance</th><th>Marks</th><th>Joined</th></tr></thead>
          <tbody>
            ${sts.map((s, i) => {
              const d = dataArr[i];
              return `<tr style="cursor:pointer" onclick="quickEditStudent('${esc(s.email)}','${esc(s.name)}',${d.attendance??'null'},${d.marks??'null'})">
                <td>${i+1}</td>
                <td><strong>${esc(s.name)}</strong></td>
                <td style="color:var(--muted);font-size:.82rem">${esc(s.email)}</td>
                <td>${attBadge(d.attendance)}</td>
                <td>${mksBadge(d.marks)}</td>
                <td style="font-size:.82rem;color:var(--muted)">${s.createdAt?fmtDate(s.createdAt):'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:.78rem;color:var(--muted);margin-top:.75rem">💡 Click a student row to edit their attendance &amp; marks.</p>
    </div>`;
}

function quickEditStudent(email, name, att, marks) {
  const newAtt   = prompt(`Edit attendance for ${name} (current: ${att??'not set'})\nEnter 0-100:`, att??'');
  if (newAtt === null) return;
  const newMarks = prompt(`Edit marks for ${name} (current: ${marks??'not set'})\nEnter 0-100:`, marks??'');
  if (newMarks === null) return;
  const a = parseInt(newAtt), m = parseInt(newMarks);
  const promises = [];
  if (!isNaN(a) && a >= 0 && a <= 100) promises.push(apiUpdateAttendance(email, a));
  if (!isNaN(m) && m >= 0 && m <= 100) promises.push(apiUpdateMarks(email, m));
  Promise.all(promises).then(() => { toast(`${name} updated!`, 'success'); loadFacStudents(); });
}

// ── Attendance ──
function renderFacultyAttendance() {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const initSem = _currentSem || sems[0] || '';

  document.getElementById('sec-attendance').innerHTML = `
    <div class="page-head">
      <div class="page-title">📅 Attendance</div>
      <div class="page-sub">Update attendance for a whole semester at once</div>
    </div>
    ${semBar('att-sem', 'loadBulkAttendance()', initSem)}
    <div class="bulk-grid" id="att-grid">
      <div class="card">
        <div class="card-title" id="att-bulk-title">📅 Bulk Update</div>
        <div id="att-bulk-alert"></div>
        <div id="att-bulk-body"><div class="empty">Select a semester above.</div></div>
        <div id="att-save-btn" style="display:none;margin-top:1rem">
          <button class="btn btn-primary" onclick="saveAllAttendance()">💾 Save All</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Current Records</div>
        <div id="att-current-records"><div class="empty">Select a semester to view records.</div></div>
      </div>
    </div>`;

  if (initSem) loadBulkAttendance();
}

async function loadBulkAttendance() {
  const sem = getSelSem('att-sem');
  const sts = semStudents(sem);
  const titleEl = document.getElementById('att-bulk-title');
  if (titleEl) titleEl.textContent = `📅 Bulk Update — ${sem}`;

  if (!sts.length) {
    document.getElementById('att-bulk-body').innerHTML = '<div class="empty">No students.</div>';
    document.getElementById('att-current-records').innerHTML = '<div class="empty">No students.</div>';
    return;
  }

  document.getElementById('att-bulk-body').innerHTML = '<div class="empty">Loading…</div>';
  document.getElementById('att-current-records').innerHTML = '<div class="empty">Loading…</div>';

  const dataArr = await Promise.all(sts.map(s => apiGetStudentData(s.email)));

  // Left: editable inputs
  document.getElementById('att-bulk-body').innerHTML = sts.map((s, i) => {
    const cur = dataArr[i].attendance ?? '';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600;font-size:.875rem">${esc(s.name)}</div>
        <div style="font-size:.72rem;color:var(--muted)">${esc(s.email)}</div>
      </div>
      <input type="number" class="form-control bulk-att-inp" data-email="${esc(s.email)}"
        min="0" max="100" value="${cur}" placeholder="0–100"
        style="width:80px;padding:5px 8px;font-size:.875rem;flex-shrink:0">
    </div>`;
  }).join('');
  document.getElementById('att-save-btn').style.display = 'block';

  // Right: current records table
  const attBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=50?'var(--amber)':'var(--rose)'};color:#fff;min-width:44px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:44px">—</span>`;

  document.getElementById('att-current-records').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th><th>Email</th><th>Attendance %</th><th>Action</th></tr></thead>
        <tbody>
          ${sts.map((s,i) => `<tr>
            <td><strong>${esc(s.name)}</strong></td>
            <td style="font-size:.78rem;color:var(--muted)">${esc(s.email)}</td>
            <td>${attBadge(dataArr[i].attendance)}</td>
            <td><button class="btn btn-outline btn-sm" onclick="inlineEditAtt('${esc(s.email)}','${esc(s.name)}',${dataArr[i].attendance??'null'})">Edit</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function saveAllAttendance() {
  const inputs = document.querySelectorAll('.bulk-att-inp');
  const btn = document.querySelector('#att-save-btn .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving…';
  let saved = 0, skipped = 0;
  await Promise.all(Array.from(inputs).map(async inp => {
    const email = inp.dataset.email;
    const val   = parseInt(inp.value);
    if (!email || isNaN(val) || val < 0 || val > 100) { skipped++; return; }
    const res = await apiUpdateAttendance(email, val);
    if (res.msg === 'Attendance updated') saved++;
    else skipped++;
  }));
  showAlert('att-bulk-alert', `✅ Saved ${saved}${skipped?` · ⚠️ ${skipped} skipped`:''}`, 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
  // Refresh right panel
  await loadBulkAttendance();
}

async function inlineEditAtt(email, name, cur) {
  const val = prompt(`Edit attendance for ${name} (current: ${cur??'not set'})\nEnter 0–100:`, cur??'');
  if (val === null) return;
  const v = parseInt(val);
  if (isNaN(v) || v < 0 || v > 100) { toast('Invalid value.', 'error'); return; }
  await apiUpdateAttendance(email, v);
  toast(`${name} attendance updated!`, 'success');
  await loadBulkAttendance();
}

// ── Marks ──
function renderFacultyMarks() {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const initSem = _currentSem || sems[0] || '';

  document.getElementById('sec-marks').innerHTML = `
    <div class="page-head">
      <div class="page-title">📊 Marks</div>
      <div class="page-sub">Update marks for a whole semester at once</div>
    </div>
    ${semBar('marks-sem', 'loadBulkMarks()', initSem)}
    <div class="bulk-grid">
      <div class="card">
        <div class="card-title" id="marks-bulk-title">📊 Bulk Update</div>
        <div id="marks-bulk-alert"></div>
        <div id="marks-bulk-body"><div class="empty">Select a semester above.</div></div>
        <div id="marks-save-btn" style="display:none;margin-top:1rem">
          <button class="btn btn-primary" onclick="saveAllMarks()">💾 Save All</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Current Records</div>
        <div id="marks-current-records"><div class="empty">Select a semester to view records.</div></div>
      </div>
    </div>`;

  if (initSem) loadBulkMarks();
}

async function loadBulkMarks() {
  const sem = getSelSem('marks-sem');
  const sts = semStudents(sem);
  const titleEl = document.getElementById('marks-bulk-title');
  if (titleEl) titleEl.textContent = `📊 Bulk Update — ${sem}`;

  if (!sts.length) {
    document.getElementById('marks-bulk-body').innerHTML = '<div class="empty">No students.</div>';
    document.getElementById('marks-current-records').innerHTML = '<div class="empty">No students.</div>';
    return;
  }

  document.getElementById('marks-bulk-body').innerHTML = '<div class="empty">Loading…</div>';
  document.getElementById('marks-current-records').innerHTML = '<div class="empty">Loading…</div>';

  const dataArr = await Promise.all(sts.map(s => apiGetStudentData(s.email)));

  document.getElementById('marks-bulk-body').innerHTML = sts.map((s, i) => {
    const cur = dataArr[i].marks ?? '';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600;font-size:.875rem">${esc(s.name)}</div>
        <div style="font-size:.72rem;color:var(--muted)">${esc(s.email)}</div>
      </div>
      <input type="number" class="form-control bulk-marks-inp" data-email="${esc(s.email)}"
        min="0" max="100" value="${cur}" placeholder="0–100"
        style="width:80px;padding:5px 8px;font-size:.875rem;flex-shrink:0">
    </div>`;
  }).join('');
  document.getElementById('marks-save-btn').style.display = 'block';

  const mksBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=60?'var(--amber)':'var(--rose)'};color:#fff;min-width:44px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:44px">—</span>`;

  document.getElementById('marks-current-records').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th><th>Email</th><th>Marks %</th><th>Action</th></tr></thead>
        <tbody>
          ${sts.map((s,i) => `<tr>
            <td><strong>${esc(s.name)}</strong></td>
            <td style="font-size:.78rem;color:var(--muted)">${esc(s.email)}</td>
            <td>${mksBadge(dataArr[i].marks)}</td>
            <td><button class="btn btn-outline btn-sm" onclick="inlineEditMarks('${esc(s.email)}','${esc(s.name)}',${dataArr[i].marks??'null'})">Edit</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function saveAllMarks() {
  const inputs = document.querySelectorAll('.bulk-marks-inp');
  const btn = document.querySelector('#marks-save-btn .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving…';
  let saved = 0, skipped = 0;
  await Promise.all(Array.from(inputs).map(async inp => {
    const email = inp.dataset.email;
    const val   = parseInt(inp.value);
    if (!email || isNaN(val) || val < 0 || val > 100) { skipped++; return; }
    const res = await apiUpdateMarks(email, val);
    if (res.msg === 'Marks updated') saved++;
    else skipped++;
  }));
  showAlert('marks-bulk-alert', `✅ Saved ${saved}${skipped?` · ⚠️ ${skipped} skipped`:''}`, 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
  await loadBulkMarks();
}

async function inlineEditMarks(email, name, cur) {
  const val = prompt(`Edit marks for ${name} (current: ${cur??'not set'})\nEnter 0–100:`, cur??'');
  if (val === null) return;
  const v = parseInt(val);
  if (isNaN(v) || v < 0 || v > 100) { toast('Invalid value.', 'error'); return; }
  await apiUpdateMarks(email, v);
  toast(`${name} marks updated!`, 'success');
  await loadBulkMarks();
}

// ── Shared content upload (Notes / Assignments / Lab) ──
function contentUploadSection(type, icon, label) {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const initSem = _currentSem || sems[0] || '';
  const id = type;

  return `
    <div class="page-head">
      <div class="page-title">${icon} ${label}</div>
      <div class="page-sub">Upload ${label.toLowerCase()} to an entire semester class or to individual students</div>
    </div>
    ${semBar(`${id}-sem`, `render${cap(type)}Section()`, initSem)}
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-title">${icon} Upload ${label}</div>
      <div id="${id}-alert"></div>
      <div class="upload-row-2">
        <div class="form-group" style="margin:0">
          <label>Upload To</label>
          <select id="${id}-target" class="form-control">
            <option value="__all__">— All students in semester —</option>
            ${_facultyStudents.filter(s => s.semester === initSem).map(s =>
              `<option value="${esc(s.email)}">${esc(s.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label>${label} Title / Description</label>
          <input type="text" id="${id}-text" class="form-control" placeholder="Enter ${label.toLowerCase()} title…">
        </div>
      </div>
      <div class="form-group">
        <label>Attach File <span style="color:var(--muted)">(optional)</span></label>
        <div class="file-upload-area" id="${id}-drop" onclick="document.getElementById('${id}-file').click()"
          ondragover="event.preventDefault();this.classList.add('dragover')"
          ondragleave="this.classList.remove('dragover')"
          ondrop="handleDrop(event,'${id}-file','${id}-drop')">
          <span class="file-upload-icon">📁</span>
          <span id="${id}-file-lbl">Click to select file, or drag &amp; drop here</span>
        </div>
        <input type="file" id="${id}-file" style="display:none" onchange="showFileName('${id}-file','${id}-file-lbl','${id}-drop')">
      </div>
      <button class="btn btn-primary" onclick="uploadContent('${type}')">
        ${icon} Upload ${label}
      </button>
    </div>`;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function handleDrop(e, fileId, dropId) {
  e.preventDefault();
  document.getElementById(dropId).classList.remove('dragover');
  const dt = e.dataTransfer;
  if (dt.files.length) {
    const inp = document.getElementById(fileId);
    // Create a DataTransfer to assign files
    const transfer = new DataTransfer();
    transfer.items.add(dt.files[0]);
    inp.files = transfer.files;
    showFileName(fileId, fileId.replace('-file','-file-lbl'), dropId);
  }
}

function showFileName(fileId, lblId, dropId) {
  const inp = document.getElementById(fileId);
  const lbl = document.getElementById(lblId);
  if (inp && inp.files.length && lbl) {
    lbl.textContent = '📎 ' + inp.files[0].name + ' (' + fmtSize(inp.files[0].size) + ')';
    document.getElementById(dropId)?.classList.add('dragover');
  }
}

async function uploadContent(type) {
  const sem    = getSelSem(`${type}-sem`);
  const target = document.getElementById(`${type}-target`).value;
  const text   = document.getElementById(`${type}-text`).value.trim();
  const file   = document.getElementById(`${type}-file`).files[0];

  if (!text) { showAlert(`${type}-alert`, 'Enter a title / description.', 'error'); return; }

  let fileData = null, fileName = null, fileSize = null;
  if (file) { fileData = await fileToBase64(file); fileName = file.name; fileSize = file.size; }

  const btn = document.querySelector(`#${type}-alert ~ div button, #sec-${type} .btn-primary`);
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }

  const targets = target === '__all__' ? semStudents(sem).map(s => s.email) : [target];

  let ok = 0;
  await Promise.all(targets.map(async email => {
    let res;
    if      (type === 'notes')       res = await apiAddNote(email, text, fileData, fileName, fileSize);
    else if (type === 'assignments') res = await apiAddAssignment(email, text, fileData, fileName, fileSize);
    else if (type === 'lab')         res = await apiAddLab(email, text, fileData, fileName, fileSize);
    if (res && (res.msg === 'Note added' || res.msg === 'Assignment added' || res.msg === 'Lab report added')) ok++;
  }));

  showAlert(`${type}-alert`, `✅ Uploaded to ${ok} student${ok!==1?'s':''}!`, 'success');
  document.getElementById(`${type}-text`).value = '';
  document.getElementById(`${type}-file`).value = '';
  const lbl = document.getElementById(`${type}-file-lbl`);
  if (lbl) lbl.textContent = 'Click to select file, or drag & drop here';
  document.getElementById(`${type}-drop`)?.classList.remove('dragover');
  if (btn) { btn.disabled = false; btn.textContent = `Upload`; }
  // Reload the records list after upload
  await loadContentRecords(type);
}

// Update target dropdown when semester changes
function updateTargetDropdown(type) {
  const sem = getSelSem(`${type}-sem`);
  const sel = document.getElementById(`${type}-target`);
  if (!sel) return;
  const sts = semStudents(sem);
  sel.innerHTML = `<option value="__all__">— All students in semester —</option>` +
    sts.map(s => `<option value="${esc(s.email)}">${esc(s.name)}</option>`).join('');
}

// ── Notes ──
function renderFacultyNotes() {
  document.getElementById('sec-notes').innerHTML =
    contentUploadSection('notes', '📓', 'Notes') +
    `<div class="card" id="notes-records-card">
      <div class="card-title">📋 Uploaded Notes <span class="badge badge-blue" id="notes-count" style="margin-left:.5rem">—</span></div>
      <div id="notes-records"><div class="empty">Select a semester to view uploaded notes.</div></div>
    </div>`;
}
function renderNotesSection() { updateTargetDropdown('notes'); loadContentRecords('notes'); }

// ── Assignments ──
function renderFacultyAssignments() {
  document.getElementById('sec-assignments').innerHTML =
    contentUploadSection('assignments', '📝', 'Assignments') +
    `<div class="card" id="assignments-records-card">
      <div class="card-title">📋 Uploaded Assignments <span class="badge badge-violet" id="assignments-count" style="margin-left:.5rem">—</span></div>
      <div id="assignments-records"><div class="empty">Select a semester to view uploaded assignments.</div></div>
    </div>`;
}
function renderAssignmentsSection() { updateTargetDropdown('assignments'); loadContentRecords('assignments'); }

// ── Lab Reports ──
function renderFacultyLab() {
  document.getElementById('sec-lab').innerHTML =
    contentUploadSection('lab', '🔬', 'Lab Reports') +
    `<div class="card" id="lab-records-card">
      <div class="card-title">📋 Uploaded Lab Reports <span class="badge badge-green" id="lab-count" style="margin-left:.5rem">—</span></div>
      <div id="lab-records"><div class="empty">Select a semester to view uploaded lab reports.</div></div>
    </div>`;
}
function renderLabSection() { updateTargetDropdown('lab'); loadContentRecords('lab'); }

// ── Load content records for a semester ──
async function loadContentRecords(type) {
  const sem  = getSelSem(`${type}-sem`);
  const sts  = semStudents(sem);
  const recEl = document.getElementById(`${type}-records`);
  const cntEl = document.getElementById(`${type}-count`);
  if (!recEl) return;
  if (!sts.length) { recEl.innerHTML = '<div class="empty">No students in this semester.</div>'; return; }

  recEl.innerHTML = '<div class="empty">Loading…</div>';
  const dataArr = await Promise.all(sts.map(s => apiGetStudentData(s.email)));

  // Build flat list: { studentName, studentEmail, item, index }
  const rows = [];
  sts.forEach((s, si) => {
    const d = dataArr[si];
    const items = type === 'notes' ? (d.notes||[]) : type === 'assignments' ? (d.assignments||[]) : (d.lab||[]);
    items.forEach((item, idx) => {
      rows.push({ s, item, idx });
    });
  });

  if (cntEl) cntEl.textContent = rows.length;

  if (!rows.length) {
    recEl.innerHTML = `<div class="empty">No ${type} uploaded yet for ${sem}.</div>`;
    return;
  }

  const icon = type === 'notes' ? '📄' : type === 'assignments' ? '📋' : '🧪';
  recEl.innerHTML = `<div class="item-list">
    ${rows.map(({s, item, idx}) => `
      <div class="item-row">
        <div class="item-row-left">
          <span class="item-row-icon">${item.fileData ? '📎' : icon}</span>
          <div style="min-width:0">
            <div class="item-row-text">${esc(item.text||'')}</div>
            <div style="font-size:.72rem;color:var(--muted)">
              ${esc(s.name)}
              ${item.fileName ? ` · ${esc(item.fileName)} (${fmtSize(item.fileSize||0)})` : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${item.fileData ? `<a href="${item.fileData}" download="${esc(item.fileName||'file')}" class="btn btn-outline btn-sm">⬇</a>` : ''}
          <span class="item-row-date">${item.date ? fmtDate(item.date) : ''}</span>
          <button class="btn btn-danger btn-sm" onclick="deleteContentItem('${type}','${esc(s.email)}',${idx})">🗑</button>
        </div>
      </div>`).join('')}
  </div>`;
}

async function deleteContentItem(type, email, index) {
  if (!confirm('Delete this item?')) return;
  let res;
  if      (type === 'notes')       res = await apiDeleteNote(email, index);
  else if (type === 'assignments') res = await apiDeleteAssignment(email, index);
  else if (type === 'lab')         res = await apiDeleteLab(email, index);
  toast('Deleted!', 'success');
  await loadContentRecords(type);
}

// ── Add Student ──
function renderFacultyStudentAdd() {
  // Not a separate section — handled inline in students section
}
