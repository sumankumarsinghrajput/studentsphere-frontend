// ────────────────────────────────────────────
// faculty.js — Faculty dashboard (API version)
// ────────────────────────────────────────────

let _facultyStudents = [];

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

  renderFacultyOverview(user);
  renderFacultyStudents();
  renderFacultyAttendance();
  renderFacultyMarks();
  renderFacultyNotes();
  renderFacultyAssignments();
  renderFacultyLab();
}

// ── Overview ──
function renderFacultyOverview(user) {
  const sem = user.semester || 'N/A';
  const mySemStudents = _facultyStudents.filter(s => s.semester === sem);
  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Welcome, ${esc(user.name.split(' ')[0])} 👋</div>
      <div class="page-sub">Faculty Dashboard &nbsp;·&nbsp;
        <span style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</span>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${_facultyStudents.length}</div>
        <div class="stat-lbl">Total Students</div>
        <span class="stat-bg-icon">👨‍🎓</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${mySemStudents.length}</div>
        <div class="stat-lbl">My Semester</div>
        <span class="stat-bg-icon">📚</span>
      </div>
    </div>
    <div class="card">
      <div class="card-title">👥 Students in ${esc(sem)}</div>
      ${mySemStudents.length ? `
        <div class="item-list">
          ${mySemStudents.map(s => `
            <div class="item-row">
              <div class="item-row-left">
                <div class="nav-avatar" style="width:32px;height:32px;font-size:.75rem;flex-shrink:0">
                  ${initials(s.name)}
                </div>
                <div>
                  <div class="item-row-text">${esc(s.name)}</div>
                  <div style="font-size:.72rem;color:var(--muted)">${esc(s.email)}</div>
                </div>
              </div>
              <span class="badge badge-blue">${esc(s.semester||'')}</span>
            </div>`).join('')}
        </div>` : `<div class="empty">No students in your semester yet.</div>`}
    </div>`;
}

// ── Students ──
function renderFacultyStudents() {
  document.getElementById('sec-students').innerHTML = `
    <div class="page-head">
      <div class="page-title">Students</div>
      <div class="page-sub">Add and view registered students</div>
    </div>
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-title">➕ Add New Student</div>
      <div id="add-student-alert"></div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="fs-name" class="form-control" placeholder="Student full name">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="fs-email" class="form-control" placeholder="student@example.com">
      </div>
      <div class="form-group">
        <label>Class / Semester</label>
        <select id="fs-semester" class="form-control">
          <option value="">— Select semester —</option>
          <option>Semester 1</option><option>Semester 2</option>
          <option>Semester 3</option><option>Semester 4</option>
          <option>Semester 5</option><option>Semester 6</option>
          <option>Semester 7</option><option>Semester 8</option>
        </select>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="fs-pass" class="form-control" placeholder="Minimum 6 characters">
      </div>
      <button class="btn btn-primary" onclick="facultyAddStudent()">➕ Add Student</button>
    </div>
    <div class="card">
      <div class="card-title">👨‍🎓 All Students
        <span class="badge badge-blue" style="margin-left:auto">${_facultyStudents.length}</span>
      </div>
      ${_facultyStudents.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Semester</th></tr></thead>
            <tbody>
              ${_facultyStudents.map(s => `
                <tr>
                  <td>${esc(s.name)}</td>
                  <td>${esc(s.email)}</td>
                  <td><span class="badge badge-violet">${esc(s.semester||'—')}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty"><span class="empty-ico">👨‍🎓</span>No students yet.</div>`}
    </div>`;
}

async function facultyAddStudent() {
  const name     = document.getElementById('fs-name').value.trim();
  const email    = document.getElementById('fs-email').value.trim();
  const semester = document.getElementById('fs-semester').value;
  const password = document.getElementById('fs-pass').value;
  if (!name || !email || !password || !semester) {
    showAlert('add-student-alert', 'All fields are required.', 'error'); return;
  }
  try {
    const data = await apiCreateUser({ name, email, password, role: 'student', semester });
    if (data.msg === 'Account created successfully') {
      showAlert('add-student-alert', `✅ Student ${name} added successfully!`, 'success');
      document.getElementById('fs-name').value = '';
      document.getElementById('fs-email').value = '';
      document.getElementById('fs-pass').value = '';
      document.getElementById('fs-semester').value = '';
      _facultyStudents = await apiGetUsersByRole('student');
      renderFacultyStudents();
      renderFacultyAttendance();
      renderFacultyMarks();
    } else {
      showAlert('add-student-alert', data.msg || 'Failed to add student.', 'error');
    }
  } catch (err) {
    showAlert('add-student-alert', 'Server error.', 'error');
  }
}

// ── Semester filter for bulk views ──
function semesterFilter(id, onchange) {
  const sems = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  return `
    <div class="sem-selector-wrap" style="margin-bottom:1rem">
      <span class="sem-label">Filter by Semester</span>
      <select class="form-control sem-select" id="${id}" onchange="${onchange}">
        <option value="">— All Semesters —</option>
        ${sems.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
      </select>
    </div>`;
}

// ── Individual student selector ──
function studentSelector(id, onchange) {
  return `
    <div class="sem-selector-wrap" style="margin-bottom:1rem">
      <span class="sem-label">Select Student</span>
      <select class="form-control sem-select" id="${id}" onchange="${onchange}">
        <option value="">— Choose a student —</option>
        ${_facultyStudents.map(s =>
          `<option value="${esc(s.email)}">${esc(s.name)} (${esc(s.semester||'')})</option>`
        ).join('')}
      </select>
    </div>`;
}

// ════════════════════════════════════════
// ATTENDANCE — Bulk + Individual
// ════════════════════════════════════════
function renderFacultyAttendance() {
  document.getElementById('sec-attendance').innerHTML = `
    <div class="page-head">
      <div class="page-title">Attendance</div>
      <div class="page-sub">Update attendance individually or in bulk for a whole semester</div>
    </div>

    <!-- TAB SWITCHER -->
    <div style="display:flex;gap:.5rem;margin-bottom:1.5rem">
      <button class="btn btn-primary btn-sm" id="att-tab-bulk" onclick="attShowTab('bulk')">📋 Bulk Update</button>
      <button class="btn btn-outline btn-sm" id="att-tab-single" onclick="attShowTab('single')">👤 Individual</button>
    </div>

    <!-- BULK -->
    <div id="att-bulk-panel">
      <div class="card">
        <div class="card-title">📋 Bulk Attendance Update</div>
        <div id="att-bulk-alert"></div>
        ${semesterFilter('att-sem-filter', 'loadBulkAttendance()')}
        <div id="att-bulk-table"><div class="empty">Select a semester to load students.</div></div>
        <div id="att-bulk-actions" style="display:none;margin-top:1rem;display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-success" onclick="saveAllAttendance()">💾 Save All</button>
          <button class="btn btn-outline" onclick="fillAllAttendance()">✏️ Fill All with Same Value</button>
        </div>
      </div>
    </div>

    <!-- INDIVIDUAL -->
    <div id="att-single-panel" style="display:none">
      <div class="card" style="max-width:520px">
        <div class="card-title">👤 Individual Attendance</div>
        <div id="att-alert"></div>
        ${studentSelector('att-student', 'loadStudentAttendance()')}
        <div id="att-current" style="margin-bottom:1rem"></div>
        <div class="form-group">
          <label>Attendance Percentage (0–100)</label>
          <input type="number" id="att-val" class="form-control" min="0" max="100" placeholder="e.g. 85">
        </div>
        <button class="btn btn-primary" onclick="saveAttendance()">💾 Save</button>
      </div>
    </div>`;
}

function attShowTab(tab) {
  const isBulk = tab === 'bulk';
  document.getElementById('att-bulk-panel').style.display  = isBulk ? 'block' : 'none';
  document.getElementById('att-single-panel').style.display = isBulk ? 'none'  : 'block';
  document.getElementById('att-tab-bulk').className   = isBulk ? 'btn btn-primary btn-sm'  : 'btn btn-outline btn-sm';
  document.getElementById('att-tab-single').className = isBulk ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';
}

async function loadBulkAttendance() {
  const sem = document.getElementById('att-sem-filter').value;
  const students = sem
    ? _facultyStudents.filter(s => s.semester === sem)
    : _facultyStudents;

  if (!students.length) {
    document.getElementById('att-bulk-table').innerHTML = '<div class="empty">No students found.</div>';
    document.getElementById('att-bulk-actions').style.display = 'none';
    return;
  }

  document.getElementById('att-bulk-table').innerHTML = '<div class="empty">Loading…</div>';

  // Fetch all student data in parallel
  const dataArr = await Promise.all(students.map(s => apiGetStudentData(s.email)));

  const rows = students.map((s, i) => {
    const cur = dataArr[i].attendance ?? '';
    return `<tr>
      <td>${esc(s.name)}</td>
      <td style="font-size:.8rem;color:var(--muted)">${esc(s.email)}</td>
      <td><span class="badge badge-violet">${esc(s.semester||'—')}</span></td>
      <td style="width:130px">
        <input type="number" class="form-control bulk-att-input"
          data-email="${esc(s.email)}"
          min="0" max="100" value="${cur}"
          placeholder="0–100"
          style="padding:5px 8px;font-size:.85rem">
      </td>
    </tr>`;
  }).join('');

  document.getElementById('att-bulk-table').innerHTML = `
    <div id="att-fill-bar" style="display:none;margin-bottom:.75rem;display:flex;gap:.5rem;align-items:center">
      <input type="number" id="att-fill-val" class="form-control" min="0" max="100" placeholder="Value for all" style="max-width:130px">
      <button class="btn btn-primary btn-sm" onclick="applyFillAttendance()">Apply to All</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Semester</th><th>Attendance %</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  document.getElementById('att-bulk-actions').style.display = 'flex';
}

function fillAllAttendance() {
  const bar = document.getElementById('att-fill-bar');
  if (bar) bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
}

function applyFillAttendance() {
  const val = document.getElementById('att-fill-val').value;
  if (!val) return;
  document.querySelectorAll('.bulk-att-input').forEach(inp => inp.value = val);
}

async function saveAllAttendance() {
  const inputs = document.querySelectorAll('.bulk-att-input');
  if (!inputs.length) return;
  const btn = document.querySelector('#att-bulk-actions .btn-success');
  btn.disabled = true; btn.textContent = 'Saving…';

  let saved = 0, errors = 0;
  const promises = Array.from(inputs).map(async inp => {
    const email = inp.dataset.email;
    const val   = parseInt(inp.value);
    if (!email || isNaN(val) || val < 0 || val > 100) { errors++; return; }
    const res = await apiUpdateAttendance(email, val);
    if (res.msg === 'Attendance updated') saved++;
    else errors++;
  });
  await Promise.all(promises);

  showAlert('att-bulk-alert',
    `✅ Saved ${saved} records${errors ? ` · ⚠️ ${errors} skipped (invalid value)` : ''}`,
    errors ? 'info' : 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
}

// Individual
async function loadStudentAttendance() {
  const email = document.getElementById('att-student').value;
  if (!email) return;
  const data = await apiGetStudentData(email);
  const att  = data.attendance;
  document.getElementById('att-current').innerHTML = att !== null && att !== undefined
    ? `<div class="alert alert-info">Current: <strong>${att}%</strong></div>`
    : `<div class="alert alert-info">No attendance recorded yet.</div>`;
  if (att !== null && att !== undefined) document.getElementById('att-val').value = att;
}

async function saveAttendance() {
  const email = document.getElementById('att-student').value;
  const val   = parseInt(document.getElementById('att-val').value);
  if (!email) { showAlert('att-alert','Select a student first.','error'); return; }
  if (isNaN(val) || val < 0 || val > 100) { showAlert('att-alert','Enter 0–100.','error'); return; }
  const res = await apiUpdateAttendance(email, val);
  showAlert('att-alert', res.msg || 'Updated!', 'success');
}

// ════════════════════════════════════════
// MARKS — Bulk + Individual
// ════════════════════════════════════════
function renderFacultyMarks() {
  document.getElementById('sec-marks').innerHTML = `
    <div class="page-head">
      <div class="page-title">Marks</div>
      <div class="page-sub">Update marks individually or in bulk for a whole semester</div>
    </div>

    <div style="display:flex;gap:.5rem;margin-bottom:1.5rem">
      <button class="btn btn-primary btn-sm" id="marks-tab-bulk" onclick="marksShowTab('bulk')">📋 Bulk Update</button>
      <button class="btn btn-outline btn-sm" id="marks-tab-single" onclick="marksShowTab('single')">👤 Individual</button>
    </div>

    <!-- BULK -->
    <div id="marks-bulk-panel">
      <div class="card">
        <div class="card-title">📋 Bulk Marks Update</div>
        <div id="marks-bulk-alert"></div>
        ${semesterFilter('marks-sem-filter', 'loadBulkMarks()')}
        <div id="marks-bulk-table"><div class="empty">Select a semester to load students.</div></div>
        <div id="marks-bulk-actions" style="display:none;margin-top:1rem;display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-success" onclick="saveAllMarks()">💾 Save All</button>
          <button class="btn btn-outline" onclick="fillAllMarks()">✏️ Fill All with Same Value</button>
        </div>
      </div>
    </div>

    <!-- INDIVIDUAL -->
    <div id="marks-single-panel" style="display:none">
      <div class="card" style="max-width:520px">
        <div class="card-title">👤 Individual Marks</div>
        <div id="marks-alert"></div>
        ${studentSelector('marks-student', 'loadStudentMarks()')}
        <div id="marks-current" style="margin-bottom:1rem"></div>
        <div class="form-group">
          <label>Marks Percentage (0–100)</label>
          <input type="number" id="marks-val" class="form-control" min="0" max="100" placeholder="e.g. 72">
        </div>
        <button class="btn btn-primary" onclick="saveMarks()">💾 Save</button>
      </div>
    </div>`;
}

function marksShowTab(tab) {
  const isBulk = tab === 'bulk';
  document.getElementById('marks-bulk-panel').style.display  = isBulk ? 'block' : 'none';
  document.getElementById('marks-single-panel').style.display = isBulk ? 'none'  : 'block';
  document.getElementById('marks-tab-bulk').className   = isBulk ? 'btn btn-primary btn-sm'  : 'btn btn-outline btn-sm';
  document.getElementById('marks-tab-single').className = isBulk ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';
}

async function loadBulkMarks() {
  const sem = document.getElementById('marks-sem-filter').value;
  const students = sem
    ? _facultyStudents.filter(s => s.semester === sem)
    : _facultyStudents;

  if (!students.length) {
    document.getElementById('marks-bulk-table').innerHTML = '<div class="empty">No students found.</div>';
    document.getElementById('marks-bulk-actions').style.display = 'none';
    return;
  }

  document.getElementById('marks-bulk-table').innerHTML = '<div class="empty">Loading…</div>';
  const dataArr = await Promise.all(students.map(s => apiGetStudentData(s.email)));

  const rows = students.map((s, i) => {
    const cur = dataArr[i].marks ?? '';
    return `<tr>
      <td>${esc(s.name)}</td>
      <td style="font-size:.8rem;color:var(--muted)">${esc(s.email)}</td>
      <td><span class="badge badge-violet">${esc(s.semester||'—')}</span></td>
      <td style="width:130px">
        <input type="number" class="form-control bulk-marks-input"
          data-email="${esc(s.email)}"
          min="0" max="100" value="${cur}"
          placeholder="0–100"
          style="padding:5px 8px;font-size:.85rem">
      </td>
    </tr>`;
  }).join('');

  document.getElementById('marks-bulk-table').innerHTML = `
    <div id="marks-fill-bar" style="display:none;margin-bottom:.75rem;display:flex;gap:.5rem;align-items:center">
      <input type="number" id="marks-fill-val" class="form-control" min="0" max="100" placeholder="Value for all" style="max-width:130px">
      <button class="btn btn-primary btn-sm" onclick="applyFillMarks()">Apply to All</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Semester</th><th>Marks %</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  document.getElementById('marks-bulk-actions').style.display = 'flex';
}

function fillAllMarks() {
  const bar = document.getElementById('marks-fill-bar');
  if (bar) bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
}

function applyFillMarks() {
  const val = document.getElementById('marks-fill-val').value;
  if (!val) return;
  document.querySelectorAll('.bulk-marks-input').forEach(inp => inp.value = val);
}

async function saveAllMarks() {
  const inputs = document.querySelectorAll('.bulk-marks-input');
  if (!inputs.length) return;
  const btn = document.querySelector('#marks-bulk-actions .btn-success');
  btn.disabled = true; btn.textContent = 'Saving…';

  let saved = 0, errors = 0;
  const promises = Array.from(inputs).map(async inp => {
    const email = inp.dataset.email;
    const val   = parseInt(inp.value);
    if (!email || isNaN(val) || val < 0 || val > 100) { errors++; return; }
    const res = await apiUpdateMarks(email, val);
    if (res.msg === 'Marks updated') saved++;
    else errors++;
  });
  await Promise.all(promises);

  showAlert('marks-bulk-alert',
    `✅ Saved ${saved} records${errors ? ` · ⚠️ ${errors} skipped (invalid value)` : ''}`,
    errors ? 'info' : 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
}

async function loadStudentMarks() {
  const email = document.getElementById('marks-student').value;
  if (!email) return;
  const data  = await apiGetStudentData(email);
  const marks = data.marks;
  document.getElementById('marks-current').innerHTML = marks !== null && marks !== undefined
    ? `<div class="alert alert-info">Current: <strong>${marks}%</strong></div>`
    : `<div class="alert alert-info">No marks recorded yet.</div>`;
  if (marks !== null && marks !== undefined) document.getElementById('marks-val').value = marks;
}

async function saveMarks() {
  const email = document.getElementById('marks-student').value;
  const val   = parseInt(document.getElementById('marks-val').value);
  if (!email) { showAlert('marks-alert','Select a student first.','error'); return; }
  if (isNaN(val) || val < 0 || val > 100) { showAlert('marks-alert','Enter 0–100.','error'); return; }
  const res = await apiUpdateMarks(email, val);
  showAlert('marks-alert', res.msg || 'Updated!', 'success');
}

// ── Notes ──
function renderFacultyNotes() {
  document.getElementById('sec-notes').innerHTML = `
    <div class="page-head">
      <div class="page-title">Notes</div>
      <div class="page-sub">Upload study materials to students</div>
    </div>
    <div class="card" style="max-width:560px">
      <div class="card-title">📓 Upload Note</div>
      <div id="notes-alert"></div>
      ${studentSelector('notes-student', 'loadStudentNotes()')}
      <div class="form-group">
        <label>Note Title / Description</label>
        <input type="text" id="notes-text" class="form-control" placeholder="e.g. Chapter 5 Notes">
      </div>
      <div class="form-group">
        <label>Attach File (optional)</label>
        <input type="file" id="notes-file" class="form-control">
      </div>
      <button class="btn btn-primary" onclick="saveNote()">📤 Upload Note</button>
    </div>
    <div class="card" style="margin-top:1.25rem">
      <div class="card-title">📋 Student Notes</div>
      <div id="notes-list"><div class="empty">Select a student to view their notes.</div></div>
    </div>`;
}

async function loadStudentNotes() {
  const email = document.getElementById('notes-student').value;
  if (!email) return;
  const data  = await apiGetStudentData(email);
  const notes = data.notes || [];
  document.getElementById('notes-list').innerHTML = notes.length
    ? `<div class="item-list">${notes.map((n,i) => `
        <div class="item-row">
          <div class="item-row-left">
            <span class="item-row-icon">${n.fileData?'📎':'📄'}</span>
            <div>
              <div class="item-row-text">${esc(n.text)}</div>
              ${n.fileData?`<div style="font-size:.72rem;color:var(--muted)">${esc(n.fileName||'')} · ${fmtSize(n.fileSize||0)}</div>`:''}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            ${n.fileData?`<a href="${n.fileData}" download="${esc(n.fileName||'file')}" class="btn btn-outline btn-sm">⬇</a>`:''}
            <button class="btn btn-danger btn-sm" onclick="deleteNote('${email}',${i})">🗑</button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="empty">No notes for this student.</div>`;
}

async function saveNote() {
  const email = document.getElementById('notes-student').value;
  const text  = document.getElementById('notes-text').value.trim();
  const file  = document.getElementById('notes-file').files[0];
  if (!email) { showAlert('notes-alert','Select a student first.','error'); return; }
  if (!text)  { showAlert('notes-alert','Enter a note title.','error'); return; }
  let fileData = null, fileName = null, fileSize = null;
  if (file) { fileData = await fileToBase64(file); fileName = file.name; fileSize = file.size; }
  const res = await apiAddNote(email, text, fileData, fileName, fileSize);
  showAlert('notes-alert', res.msg || 'Note uploaded!', 'success');
  document.getElementById('notes-text').value = '';
  document.getElementById('notes-file').value = '';
  await loadStudentNotes();
}

async function deleteNote(email, index) {
  if (!confirm('Delete this note?')) return;
  await apiDeleteNote(email, index);
  await loadStudentNotes();
}

// ── Assignments ──
function renderFacultyAssignments() {
  document.getElementById('sec-assignments').innerHTML = `
    <div class="page-head">
      <div class="page-title">Assignments</div>
      <div class="page-sub">Assign work to students</div>
    </div>
    <div class="card" style="max-width:560px">
      <div class="card-title">📝 Add Assignment</div>
      <div id="asgn-alert"></div>
      ${studentSelector('asgn-student', 'loadStudentAssignments()')}
      <div class="form-group">
        <label>Assignment Title</label>
        <input type="text" id="asgn-text" class="form-control" placeholder="e.g. Unit 3 Assignment">
      </div>
      <div class="form-group">
        <label>Attach File (optional)</label>
        <input type="file" id="asgn-file" class="form-control">
      </div>
      <button class="btn btn-primary" onclick="saveAssignment()">📤 Assign</button>
    </div>
    <div class="card" style="margin-top:1.25rem">
      <div class="card-title">📋 Student Assignments</div>
      <div id="asgn-list"><div class="empty">Select a student to view assignments.</div></div>
    </div>`;
}

async function loadStudentAssignments() {
  const email = document.getElementById('asgn-student').value;
  if (!email) return;
  const data = await apiGetStudentData(email);
  const asgn = data.assignments || [];
  document.getElementById('asgn-list').innerHTML = asgn.length
    ? `<div class="item-list">${asgn.map((a,i) => `
        <div class="item-row">
          <div class="item-row-left">
            <span class="item-row-icon">${a.fileData?'📎':'📋'}</span>
            <div>
              <div class="item-row-text">${esc(a.text)}</div>
              ${a.fileData?`<div style="font-size:.72rem;color:var(--muted)">${esc(a.fileName||'')} · ${fmtSize(a.fileSize||0)}</div>`:''}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            ${a.fileData?`<a href="${a.fileData}" download="${esc(a.fileName||'file')}" class="btn btn-outline btn-sm">⬇</a>`:''}
            <button class="btn btn-danger btn-sm" onclick="deleteAssignment('${email}',${i})">🗑</button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="empty">No assignments for this student.</div>`;
}

async function saveAssignment() {
  const email = document.getElementById('asgn-student').value;
  const text  = document.getElementById('asgn-text').value.trim();
  const file  = document.getElementById('asgn-file').files[0];
  if (!email) { showAlert('asgn-alert','Select a student first.','error'); return; }
  if (!text)  { showAlert('asgn-alert','Enter an assignment title.','error'); return; }
  let fileData = null, fileName = null, fileSize = null;
  if (file) { fileData = await fileToBase64(file); fileName = file.name; fileSize = file.size; }
  const res = await apiAddAssignment(email, text, fileData, fileName, fileSize);
  showAlert('asgn-alert', res.msg || 'Assignment added!', 'success');
  document.getElementById('asgn-text').value = '';
  document.getElementById('asgn-file').value = '';
  await loadStudentAssignments();
}

async function deleteAssignment(email, index) {
  if (!confirm('Delete this assignment?')) return;
  await apiDeleteAssignment(email, index);
  await loadStudentAssignments();
}

// ── Lab Reports ──
function renderFacultyLab() {
  document.getElementById('sec-lab').innerHTML = `
    <div class="page-head">
      <div class="page-title">Lab Reports</div>
      <div class="page-sub">Manage lab work for students</div>
    </div>
    <div class="card" style="max-width:560px">
      <div class="card-title">🔬 Add Lab Report</div>
      <div id="lab-alert"></div>
      ${studentSelector('lab-student', 'loadStudentLab()')}
      <div class="form-group">
        <label>Lab Report Title</label>
        <input type="text" id="lab-text" class="form-control" placeholder="e.g. Experiment 4">
      </div>
      <div class="form-group">
        <label>Attach File (optional)</label>
        <input type="file" id="lab-file" class="form-control">
      </div>
      <button class="btn btn-primary" onclick="saveLab()">📤 Add Lab Report</button>
    </div>
    <div class="card" style="margin-top:1.25rem">
      <div class="card-title">📋 Student Lab Reports</div>
      <div id="lab-list"><div class="empty">Select a student to view lab reports.</div></div>
    </div>`;
}

async function loadStudentLab() {
  const email = document.getElementById('lab-student').value;
  if (!email) return;
  const data = await apiGetStudentData(email);
  const lab  = data.lab || [];
  document.getElementById('lab-list').innerHTML = lab.length
    ? `<div class="item-list">${lab.map((l,i) => `
        <div class="item-row">
          <div class="item-row-left">
            <span class="item-row-icon">${l.fileData?'📎':'🧪'}</span>
            <div>
              <div class="item-row-text">${esc(l.text)}</div>
              ${l.fileData?`<div style="font-size:.72rem;color:var(--muted)">${esc(l.fileName||'')} · ${fmtSize(l.fileSize||0)}</div>`:''}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            ${l.fileData?`<a href="${l.fileData}" download="${esc(l.fileName||'file')}" class="btn btn-outline btn-sm">⬇</a>`:''}
            <button class="btn btn-danger btn-sm" onclick="deleteLab('${email}',${i})">🗑</button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="empty">No lab reports for this student.</div>`;
}

async function saveLab() {
  const email = document.getElementById('lab-student').value;
  const text  = document.getElementById('lab-text').value.trim();
  const file  = document.getElementById('lab-file').files[0];
  if (!email) { showAlert('lab-alert','Select a student first.','error'); return; }
  if (!text)  { showAlert('lab-alert','Enter a lab report title.','error'); return; }
  let fileData = null, fileName = null, fileSize = null;
  if (file) { fileData = await fileToBase64(file); fileName = file.name; fileSize = file.size; }
  const res = await apiAddLab(email, text, fileData, fileName, fileSize);
  showAlert('lab-alert', res.msg || 'Lab report added!', 'success');
  document.getElementById('lab-text').value = '';
  document.getElementById('lab-file').value = '';
  await loadStudentLab();
}

async function deleteLab(email, index) {
  if (!confirm('Delete this lab report?')) return;
  await apiDeleteLab(email, index);
  await loadStudentLab();
}
