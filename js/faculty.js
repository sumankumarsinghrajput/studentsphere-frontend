// ────────────────────────────────────────────
// faculty.js — Faculty dashboard
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
  renderFacultyProfile();
  renderFacultyAssignments();
  renderFacultyLab();
  renderFacultyNotices();
}

// ── Semester selector bar ──
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
      <div class="stat-box">
        <div class="stat-val" id="ov-att">—</div>
        <div class="stat-lbl">Attendance Updated</div>
        <span class="stat-bg-icon">📅</span>
      </div>
      <div class="stat-box">
        <div class="stat-val" id="ov-marks">—</div>
        <div class="stat-lbl">Marks Updated</div>
        <span class="stat-bg-icon">📊</span>
      </div>
      <div class="stat-box">
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
          <tbody>
            ${sems.map(sem => {
              const sts = semStudents(sem);
              return `<tr>
                <td><strong>${esc(sem)}</strong></td>
                <td><span class="badge badge-blue">${sts.length}</span></td>
                <td id="att-set-${sem.replace(/ /g,'-')}">—</td>
                <td><button class="btn btn-primary btn-sm"
                  onclick="switchSec('students');setTimeout(()=>{const el=document.getElementById('fac-sem-students');if(el){el.value='${esc(sem)}';loadFacStudents();}},50)">
                  Manage →</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

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
  set('ov-att', attCount);
  set('ov-marks', marksCount);
  set('ov-notes', notesCount);
  sems.forEach(sem => {
    const sts = semStudents(sem);
    const setCount = sts.filter(s => {
      const idx = _facultyStudents.indexOf(s);
      return dataArr[idx] && dataArr[idx].attendance !== null && dataArr[idx].attendance !== undefined;
    }).length;
    const el = document.getElementById('att-set-' + sem.replace(/ /g,'-'));
    if (el) el.innerHTML = `<span style="color:var(--muted)">${setCount}/${sts.length}</span>`;
  });
}

// ── Students — inline edit (no popups) ──
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

  el.innerHTML = `
    <div class="card">
      <div class="card-title">👨‍🎓 ${esc(sem)} — ${sts.length} Students</div>
      <p style="font-size:.78rem;color:var(--muted);margin-bottom:.75rem">💡 Click <strong>Edit</strong> on any row to update attendance &amp; marks inline.</p>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>#</th><th>Name</th><th>Email</th>
            <th>Att %</th><th>Marks %</th><th>Action</th>
          </tr></thead>
          <tbody>
            ${sts.map((s, i) => {
              const d = dataArr[i];
              return `
              <tr id="stu-row-${i}">
                <td>${i+1}</td>
                <td><strong>${esc(s.name)}</strong></td>
                <td style="color:var(--muted);font-size:.8rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.email)}</td>
                <td id="stu-att-${i}">${attBadge(d.attendance)}</td>
                <td id="stu-marks-${i}">${attBadge(d.marks)}</td>
                <td>
                  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
                    <button class="btn btn-outline btn-sm" onclick="facultyViewStudentProfile('${s._id}')">👤 Profile</button>
                    <button class="btn btn-outline btn-sm" id="stu-edit-btn-${i}"
                      onclick="toggleStudentEdit(${i},'${esc(s.email)}',${d.attendance??'null'},${d.marks??'null'})">
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
              <tr id="stu-edit-row-${i}" style="display:none">
                <td colspan="6" style="padding:.75rem;background:var(--card2,var(--card));border-radius:var(--r-sm)">
                  <div style="display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end">
                    <div>
                      <label style="font-size:.75rem;color:var(--muted);display:block;margin-bottom:3px">Attendance %</label>
                      <input type="number" id="stu-att-inp-${i}" class="form-control"
                        min="0" max="100" value="${d.attendance??''}" placeholder="0–100"
                        style="width:90px;padding:6px 8px">
                    </div>
                    <div>
                      <label style="font-size:.75rem;color:var(--muted);display:block;margin-bottom:3px">Marks %</label>
                      <input type="number" id="stu-marks-inp-${i}" class="form-control"
                        min="0" max="100" value="${d.marks??''}" placeholder="0–100"
                        style="width:90px;padding:6px 8px">
                    </div>
                    <button class="btn btn-primary btn-sm"
                      onclick="saveStudentEdit(${i},'${esc(s.email)}','${esc(s.name)}')">💾 Save</button>
                    <button class="btn btn-outline btn-sm"
                      onclick="closeStudentEdit(${i})">Cancel</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function toggleStudentEdit(i, email, att, marks) {
  // Close all other open rows first
  document.querySelectorAll('[id^="stu-edit-row-"]').forEach((r, idx) => {
    if (r.id !== `stu-edit-row-${i}`) {
      r.style.display = 'none';
      const num = r.id.replace('stu-edit-row-','');
      const btn = document.getElementById(`stu-edit-btn-${num}`);
      if (btn) btn.textContent = '✏️ Edit';
    }
  });
  const editRow = document.getElementById(`stu-edit-row-${i}`);
  const editBtn = document.getElementById(`stu-edit-btn-${i}`);
  if (!editRow) return;
  const isOpen = editRow.style.display !== 'none';
  editRow.style.display = isOpen ? 'none' : 'table-row';
  if (editBtn) editBtn.textContent = isOpen ? '✏️ Edit' : '✕ Close';
}

function closeStudentEdit(i) {
  const editRow = document.getElementById(`stu-edit-row-${i}`);
  const editBtn = document.getElementById(`stu-edit-btn-${i}`);
  if (editRow) editRow.style.display = 'none';
  if (editBtn) editBtn.textContent = '✏️ Edit';
}

async function saveStudentEdit(i, email, name) {
  const a = parseInt(document.getElementById(`stu-att-inp-${i}`)?.value);
  const m = parseInt(document.getElementById(`stu-marks-inp-${i}`)?.value);
  const promises = [];
  if (!isNaN(a) && a >= 0 && a <= 100) promises.push(apiUpdateAttendance(email, a));
  if (!isNaN(m) && m >= 0 && m <= 100) promises.push(apiUpdateMarks(email, m));
  if (!promises.length) { toast('Enter at least one valid value (0–100).', 'error'); return; }
  await Promise.all(promises);
  toast(`${name} updated!`, 'success');
  closeStudentEdit(i);
  await loadFacStudents();
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

  // Left: bulk editable inputs
  document.getElementById('att-bulk-body').innerHTML = sts.map((s, i) => {
    const cur = dataArr[i].attendance ?? '';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);gap:.5rem">
      <div style="min-width:0;flex:1;overflow:hidden">
        <div style="font-weight:600;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</div>
        <div style="font-size:.7rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.email)}</div>
      </div>
      <input type="number" class="form-control bulk-att-inp" data-email="${esc(s.email)}"
        min="0" max="100" value="${cur}" placeholder="0–100"
        style="width:75px;padding:5px 6px;font-size:.85rem;flex-shrink:0">
    </div>`;
  }).join('');
  document.getElementById('att-save-btn').style.display = 'block';

  // Right: current records with inline edit (no popup)
  const attBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=50?'var(--amber)':'var(--rose)'};color:#fff;min-width:42px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:42px;text-align:center">—</span>`;

  document.getElementById('att-current-records').innerHTML = sts.map((s, i) => `
    <div style="padding:.5rem 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
        <div style="min-width:0;flex:1">
          <div style="font-weight:600;font-size:.85rem">${esc(s.name)}</div>
          <div style="font-size:.7rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.email)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0" id="att-view-${i}">
          ${attBadge(dataArr[i].attendance)}
          <button class="btn btn-outline btn-sm" onclick="openAttEdit(${i})">Edit</button>
        </div>
        <div style="display:none;align-items:center;gap:.4rem;flex-shrink:0" id="att-edit-${i}">
          <input type="number" id="att-inp-${i}" class="form-control" min="0" max="100"
            value="${dataArr[i].attendance??''}" placeholder="0–100"
            style="width:75px;padding:5px 6px;font-size:.85rem">
          <button class="btn btn-primary btn-sm" onclick="saveAttRecord(${i},'${esc(s.email)}','${esc(s.name)}')">Save</button>
          <button class="btn btn-outline btn-sm" onclick="closeAttEdit(${i})">✕</button>
        </div>
      </div>
    </div>`).join('');
}

function openAttEdit(i) {
  // Close all others
  document.querySelectorAll('[id^="att-view-"]').forEach(el => el.style.display = 'flex');
  document.querySelectorAll('[id^="att-edit-"]').forEach(el => el.style.display = 'none');
  document.getElementById(`att-view-${i}`).style.display = 'none';
  document.getElementById(`att-edit-${i}`).style.display = 'flex';
}
function closeAttEdit(i) {
  document.getElementById(`att-view-${i}`).style.display = 'flex';
  document.getElementById(`att-edit-${i}`).style.display = 'none';
}
async function saveAttRecord(i, email, name) {
  const v = parseInt(document.getElementById(`att-inp-${i}`)?.value);
  if (isNaN(v) || v < 0 || v > 100) { toast('Enter 0–100.', 'error'); return; }
  await apiUpdateAttendance(email, v);
  toast(`${name} updated!`, 'success');
  await loadBulkAttendance();
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
  showAlert('att-bulk-alert', `✅ Saved ${saved}${skipped ? ` · ⚠️ ${skipped} skipped` : ''}`, 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
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
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);gap:.5rem">
      <div style="min-width:0;flex:1;overflow:hidden">
        <div style="font-weight:600;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</div>
        <div style="font-size:.7rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.email)}</div>
      </div>
      <input type="number" class="form-control bulk-marks-inp" data-email="${esc(s.email)}"
        min="0" max="100" value="${cur}" placeholder="0–100"
        style="width:75px;padding:5px 6px;font-size:.85rem;flex-shrink:0">
    </div>`;
  }).join('');
  document.getElementById('marks-save-btn').style.display = 'block';

  const mksBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=60?'var(--amber)':'var(--rose)'};color:#fff;min-width:42px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:42px;text-align:center">—</span>`;

  document.getElementById('marks-current-records').innerHTML = sts.map((s, i) => `
    <div style="padding:.5rem 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
        <div style="min-width:0;flex:1">
          <div style="font-weight:600;font-size:.85rem">${esc(s.name)}</div>
          <div style="font-size:.7rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.email)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0" id="marks-view-${i}">
          ${mksBadge(dataArr[i].marks)}
          <button class="btn btn-outline btn-sm" onclick="openMarksEdit(${i})">Edit</button>
        </div>
        <div style="display:none;align-items:center;gap:.4rem;flex-shrink:0" id="marks-edit-${i}">
          <input type="number" id="marks-inp-${i}" class="form-control" min="0" max="100"
            value="${dataArr[i].marks??''}" placeholder="0–100"
            style="width:75px;padding:5px 6px;font-size:.85rem">
          <button class="btn btn-primary btn-sm" onclick="saveMarksRecord(${i},'${esc(s.email)}','${esc(s.name)}')">Save</button>
          <button class="btn btn-outline btn-sm" onclick="closeMarksEdit(${i})">✕</button>
        </div>
      </div>
    </div>`).join('');
}

function openMarksEdit(i) {
  document.querySelectorAll('[id^="marks-view-"]').forEach(el => el.style.display = 'flex');
  document.querySelectorAll('[id^="marks-edit-"]').forEach(el => el.style.display = 'none');
  document.getElementById(`marks-view-${i}`).style.display = 'none';
  document.getElementById(`marks-edit-${i}`).style.display = 'flex';
}
function closeMarksEdit(i) {
  document.getElementById(`marks-view-${i}`).style.display = 'flex';
  document.getElementById(`marks-edit-${i}`).style.display = 'none';
}
async function saveMarksRecord(i, email, name) {
  const v = parseInt(document.getElementById(`marks-inp-${i}`)?.value);
  if (isNaN(v) || v < 0 || v > 100) { toast('Enter 0–100.', 'error'); return; }
  await apiUpdateMarks(email, v);
  toast(`${name} updated!`, 'success');
  await loadBulkMarks();
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
  showAlert('marks-bulk-alert', `✅ Saved ${saved}${skipped ? ` · ⚠️ ${skipped} skipped` : ''}`, 'success');
  btn.disabled = false; btn.textContent = '💾 Save All';
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
        <div class="file-upload-area" id="${id}-drop"
          onclick="document.getElementById('${id}-file').click()"
          ondragover="event.preventDefault();this.classList.add('dragover')"
          ondragleave="this.classList.remove('dragover')"
          ondrop="handleDrop(event,'${id}-file','${id}-drop')">
          <span class="file-upload-icon">📁</span>
          <span id="${id}-file-lbl">Click to select file, or drag &amp; drop here</span>
        </div>
        <input type="file" id="${id}-file" style="display:none"
          onchange="showFileName('${id}-file','${id}-file-lbl','${id}-drop')">
      </div>
      ${type !== 'notes' ? `
      <div class="upload-row-2" style="margin-bottom:1rem">
        <div class="form-group" style="margin:0">
          <label>Due Date <span style="color:var(--muted);font-size:.8rem">(optional)</span></label>
          <input type="datetime-local" id="${id}-due" class="form-control">
        </div>
        <div class="form-group" style="margin:0;display:flex;align-items:center;gap:.75rem;padding-top:1.6rem">
          <input type="checkbox" id="${id}-late" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
          <label for="${id}-late" style="cursor:pointer;font-size:.875rem;font-weight:600">Allow Late Submission</label>
        </div>
      </div>` : ''}
      <button class="btn btn-primary" id="${id}-upload-btn" onclick="uploadContent('${type}')">
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
    const transfer = new DataTransfer();
    transfer.items.add(dt.files[0]);
    inp.files = transfer.files;
    showFileName(fileId, fileId.replace('-file', '-file-lbl'), dropId);
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

  const uploadBtn = document.getElementById(`${type}-upload-btn`);
  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…'; }

  // Read dueDate and allowLate if present
  const dueDateEl  = document.getElementById(`${type}-due`);
  const allowLateEl = document.getElementById(`${type}-late`);
  const dueDate    = dueDateEl  ? dueDateEl.value || null : null;
  const allowLate  = allowLateEl ? allowLateEl.checked   : false;

  const targets = target === '__all__' ? semStudents(sem).map(s => s.email) : [target];
  let ok = 0;
  await Promise.all(targets.map(async email => {
    let res;
    if      (type === 'notes')       res = await apiAddNote(email, text, fileData, fileName, fileSize);
    else if (type === 'assignments') res = await apiAddAssignment(email, text, fileData, fileName, fileSize, dueDate, allowLate);
    else if (type === 'lab')         res = await apiAddLab(email, text, fileData, fileName, fileSize, dueDate, allowLate);
    if (res && (res.msg === 'Note added' || res.msg === 'Assignment added' || res.msg === 'Lab report added')) ok++;
  }));

  showAlert(`${type}-alert`, `✅ Uploaded to ${ok} student${ok !== 1 ? 's' : ''}!`, 'success');
  document.getElementById(`${type}-text`).value = '';
  document.getElementById(`${type}-file`).value = '';
  const lbl = document.getElementById(`${type}-file-lbl`);
  if (lbl) lbl.textContent = 'Click to select file, or drag & drop here';
  document.getElementById(`${type}-drop`)?.classList.remove('dragover');
  const icons = { notes: '📓', assignments: '📝', lab: '🔬' };
  const labels = { notes: 'Notes', assignments: 'Assignments', lab: 'Lab Reports' };
  if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = `${icons[type]} Upload ${labels[type]}`; }
  await loadContentRecords(type);
}

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
    `<div class="card">
      <div class="card-title">📋 Uploaded Notes <span class="badge badge-blue" id="notes-count" style="margin-left:.5rem">—</span></div>
      <div id="notes-records"><div class="empty">Select a semester to view uploaded notes.</div></div>
    </div>`;
}
function renderNotesSection() { updateTargetDropdown('notes'); loadContentRecords('notes'); }

// ── Assignments ──
function renderFacultyAssignments() {
  document.getElementById('sec-assignments').innerHTML =
    contentUploadSection('assignments', '📝', 'Assignments') +
    `<div class="card">
      <div class="card-title">📋 Uploaded Assignments <span class="badge badge-violet" id="assignments-count" style="margin-left:.5rem">—</span></div>
      <div id="assignments-records"><div class="empty">Select a semester to view uploaded assignments.</div></div>
    </div>`;
}
function renderAssignmentsSection() { updateTargetDropdown('assignments'); loadContentRecords('assignments'); }

// ── Lab Reports ──
function renderFacultyLab() {
  document.getElementById('sec-lab').innerHTML =
    contentUploadSection('lab', '🔬', 'Lab Reports') +
    `<div class="card">
      <div class="card-title">📋 Uploaded Lab Reports <span class="badge badge-green" id="lab-count" style="margin-left:.5rem">—</span></div>
      <div id="lab-records"><div class="empty">Select a semester to view uploaded lab reports.</div></div>
    </div>`;
}
function renderLabSection() { updateTargetDropdown('lab'); loadContentRecords('lab'); }

// ── Load content records — DEDUPLICATED + SUBMISSION CONTROL ──
async function loadContentRecords(type) {
  const sem   = getSelSem(`${type}-sem`);
  const sts   = semStudents(sem);
  const recEl = document.getElementById(`${type}-records`);
  const cntEl = document.getElementById(`${type}-count`);
  if (!recEl) return;
  if (!sts.length) { recEl.innerHTML = '<div class="empty">No students in this semester.</div>'; return; }

  recEl.innerHTML = '<div class="empty">Loading…</div>';
  const dataArr = await Promise.all(sts.map(s => apiGetStudentData(s.email)));

  // Deduplicate: same file uploaded to multiple students = ONE row
  const seen = new Map();
  sts.forEach((s, si) => {
    const d     = dataArr[si];
    const items = type === 'notes' ? (d.notes||[]) : type === 'assignments' ? (d.assignments||[]) : (d.lab||[]);
    items.forEach((item, idx) => {
      const key = `${item.text||''}|${item.fileName||''}|${item.fileSize||0}`;
      if (!seen.has(key)) seen.set(key, { item, recipients: [{ email: s.email, name: s.name, idx }] });
      else seen.get(key).recipients.push({ email: s.email, name: s.name, idx });
    });
  });

  const uniqueRows = Array.from(seen.values());
  if (cntEl) cntEl.textContent = uniqueRows.length;
  if (!uniqueRows.length) { recEl.innerHTML = `<div class="empty">No ${type} uploaded yet for ${sem}.</div>`; return; }

  const icon = type === 'notes' ? '📄' : type === 'assignments' ? '📋' : '🧪';
  const now  = new Date();

  recEl.innerHTML = `<div class="item-list">
    ${uniqueRows.map(({ item, recipients }, ri) => {
      const targetLabel = recipients.length === sts.length
        ? `<span class="badge badge-blue">All ${sts.length} students</span>`
        : recipients.map(r => `<span class="badge badge-gray" style="font-size:.65rem">${esc(r.name)}</span>`).join(' ');

      const delIds = JSON.stringify(recipients.map(r => ({ email: r.email, idx: r.idx }))).replace(/"/g,'&quot;');
      // Store recipients list in window for toggleLateSubmission
      const _togKey = `_tog_${type}_${ri}`;
      window[_togKey] = recipients.map(r => ({ email: r.email, idx: r.idx }));

      // ── Submission control (only for assignments/lab) ──
      let subControlHtml = '';
      if (type !== 'notes') {
        const due          = item.dueDate ? new Date(item.dueDate) : null;
        const isPastDue    = due && now > due;
        const daysPastDue  = due ? Math.floor((now - due) / 86400000) : 0;
        const canReopen    = isPastDue && daysPastDue <= 5;  // within 5 days of deadline
        const isLate       = item.allowLate;
        const subEnabled   = !isPastDue || isLate;           // open if not past due, or late allowed
        const autoDisabled = isPastDue && !isLate && daysPastDue > 5;

        // Status label
        let subStatusHtml = '';
        if (!due) {
          subStatusHtml = `<span class="badge badge-gray">No deadline set</span>`;
        } else if (autoDisabled) {
          subStatusHtml = `<span class="badge badge-rose">Submissions Closed (${daysPastDue}d past deadline)</span>`;
        } else if (isPastDue && isLate) {
          subStatusHtml = `<span class="badge badge-amber">Late Submissions Open (Day ${daysPastDue}/5)</span>`;
        } else if (isPastDue) {
          subStatusHtml = `<span class="badge badge-amber">Past Deadline</span>`;
        } else {
          subStatusHtml = `<span class="badge badge-green">Submissions Open</span>`;
        }

        subControlHtml = `
          <div class="sub-control-bar">
            <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
              ${subStatusHtml}
              ${due ? `<span style="font-size:.75rem;color:var(--muted)">Due: ${fmtDate(item.dueDate)}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
              ${canReopen || isPastDue ? `
              <button class="btn btn-sm ${isLate ? 'btn-danger' : 'btn-primary'}"
                onclick="toggleLateSubmission('${type}',${ri},window['${_togKey}'],${isLate})"
                title="${isLate ? 'Disable late submission' : 'Reopen for late submissions'}">
                ${isLate ? '🔒 Close Submissions' : '🔓 Re-open Submissions'}
              </button>` : ''}
              ${!due ? `<span style="font-size:.75rem;color:var(--muted)">Set a due date to enable submission control</span>` : ''}
            </div>
          </div>`;
      }

      return `
      <div class="item-row-wrap" id="content-row-${type}-${ri}">
        <div class="item-row">
          <div class="item-row-left">
            <span class="item-row-icon">${item.fileData ? '📎' : icon}</span>
            <div style="min-width:0">
              <div class="item-row-text">${esc(item.text||'')}</div>
              <div style="font-size:.72rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:.3rem;margin-top:2px;align-items:center">
                ${item.fileName ? `📎 ${esc(item.fileName)} (${fmtSize(item.fileSize||0)}) &nbsp;·&nbsp;` : ''}
                ${targetLabel}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            ${item.fileData ? `<a href="${item.fileData}" download="${esc(item.fileName||'file')}" class="btn btn-outline btn-sm">⬇</a>` : ''}
            <span class="item-row-date">${item.date ? fmtDate(item.date) : ''}</span>
            <button class="btn btn-danger btn-sm"
              onclick="deleteContentItemAll('${type}',this.dataset.recipients)"
              data-recipients="${delIds}">🗑</button>
          </div>
        </div>
        ${subControlHtml}
      </div>`;
    }).join('')}
  </div>`;
}

// Toggle late submission — updates ALL students who have this item
async function toggleLateSubmission(type, rowIdx, recipients, currentlyAllowed) {
  const newAllowLate = !currentlyAllowed;

  if (!recipients || !recipients.length) {
    toast('No recipients found.', 'error');
    return;
  }

  // Update allowLate on every student's copy of this item
  const results = await Promise.all(
    recipients.map(r => {
      if (type === 'assignments') return apiUpdateAssignment(r.email, r.idx, undefined, newAllowLate);
      if (type === 'lab')         return apiUpdateLab(r.email, r.idx, undefined, newAllowLate);
      return Promise.resolve({ msg: 'ok' });
    })
  );

  const allOk = results.every(r => r && r.msg);
  if (allOk) {
    toast(
      newAllowLate
        ? `🔓 Late submissions reopened for ${recipients.length} student(s)!`
        : `🔒 Submissions closed for all students.`,
      'success'
    );
    await loadContentRecords(type);
  } else {
    toast('Some updates may have failed. Please refresh and try again.', 'error');
  }
}

async function deleteContentItemAll(type, recipientsJson) {
  if (!confirm('Delete this item for all recipients?')) return;
  try {
    const recipients = JSON.parse(recipientsJson.replace(/&quot;/g,'"'));
    recipients.sort((a, b) => b.idx - a.idx);
    await Promise.all(recipients.map(r => {
      if      (type === 'notes')       return apiDeleteNote(r.email, r.idx);
      else if (type === 'assignments') return apiDeleteAssignment(r.email, r.idx);
      else if (type === 'lab')         return apiDeleteLab(r.email, r.idx);
    }));
    toast('Deleted!', 'success');
    await loadContentRecords(type);
  } catch(e) { toast('Delete failed.', 'error'); }
}

// ════════════════════════════════════════════
// NOTICES — Faculty
// ════════════════════════════════════════════
async function renderFacultyNotices() {
  const noticesEl = document.getElementById('sec-notices');
  if (!noticesEl) return;

  const sems    = [...new Set(_facultyStudents.map(s => s.semester).filter(Boolean))].sort();
  const notices = await apiGetNotices();

  noticesEl.innerHTML = `
    <div class="page-head">
      <div class="page-title">📢 Notice Board</div>
      <div class="page-sub">Post announcements to your students</div>
    </div>
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-title">✏️ Post New Notice</div>
      <div id="notice-alert"></div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="notice-title" class="form-control" placeholder="Notice title…">
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="notice-body" class="form-control" rows="3"
          style="resize:vertical;font-family:inherit" placeholder="Write your announcement here…"></textarea>
      </div>
      <div class="form-group">
        <label>Target</label>
        <select id="notice-sem" class="form-control" style="max-width:220px">
          <option value="All">All Semesters</option>
          ${sems.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="postNotice()">📢 Post Notice</button>
    </div>
    <div class="card">
      <div class="card-title">📋 Posted Notices
        <span class="badge badge-violet" style="margin-left:auto">${notices.length}</span>
      </div>
      ${notices.length ? notices.map(n=>`
        <div class="notice-card">
          <div class="notice-card-top">
            <div class="notice-card-title">${esc(n.title)}</div>
            <span class="badge ${n.semester==='All'?'badge-gray':'badge-blue'}">${esc(n.semester||'All')}</span>
          </div>
          <div class="notice-card-body">${esc(n.body)}</div>
          <div class="notice-card-meta" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
            <span>👤 ${esc(n.author)} &nbsp;·&nbsp; 🗓 ${fmtDate(n.createdAt)}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteFacultyNotice('${n._id}')">🗑 Delete</button>
          </div>
        </div>`).join('')
      : `<div class="empty"><span class="empty-ico">📢</span>No notices posted yet.</div>`}
    </div>`;
}

async function postNotice() {
  const title = document.getElementById('notice-title').value.trim();
  const body  = document.getElementById('notice-body').value.trim();
  const sem   = document.getElementById('notice-sem').value;
  if (!title || !body) { showAlert('notice-alert', 'Title and message are required.', 'error'); return; }
  const btn = document.querySelector('#sec-notices .btn-primary');
  btn.disabled = true; btn.textContent = 'Posting…';
  const res = await apiCreateNotice(title, body, sem);
  if (res.msg === 'Notice posted') {
    toast('Notice posted!', 'success');
    document.getElementById('notice-title').value = '';
    document.getElementById('notice-body').value  = '';
    await renderFacultyNotices();
  } else {
    showAlert('notice-alert', res.msg || 'Failed to post.', 'error');
    btn.disabled = false; btn.textContent = '📢 Post Notice';
  }
}

async function deleteFacultyNotice(id) {
  if (!confirm('Delete this notice?')) return;
  const res = await apiDeleteNotice(id);
  toast(res.msg === 'Notice deleted' ? 'Notice deleted.' : (res.msg||'Failed.'),
        res.msg === 'Notice deleted' ? 'success' : 'error');
  await renderFacultyNotices();
}

// ════════════════════════════════════════════
// FACULTY PROFILE SYSTEM
// ════════════════════════════════════════════

async function renderFacultyProfile() {
  const el = document.getElementById('sec-profile');
  if (!el) return;

  const freshUser = await apiGetMe() || _facultyUser;
  const joined = freshUser.createdAt ? fmtDate(freshUser.createdAt) : '—';

  el.innerHTML = `
    <div class="page-head">
      <div class="page-title">My Profile</div>
      <div class="page-sub">View and manage your faculty profile</div>
    </div>

    <div class="profile-banner">
      ${profileAvatarHTML(freshUser, 96, true)}
      <div class="profile-banner-info">
        <div class="profile-name">${esc(freshUser.name)}</div>
        <div class="profile-email">${esc(freshUser.email)}</div>
        <div style="display:flex;gap:.5rem;margin-top:6px;flex-wrap:wrap">
          <span class="badge badge-violet">Faculty</span>
          ${freshUser.department ? `<span class="badge badge-blue">${esc(freshUser.department)}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-title" style="justify-content:space-between">
        ✏️ Edit Profile
        <button class="btn btn-primary btn-sm" onclick="saveFacultyProfile()">💾 Save Changes</button>
      </div>
      <div id="profile-alert"></div>
      <div class="profile-form-grid">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" class="form-control" value="${esc(freshUser.name)}" disabled style="opacity:.6">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" value="${esc(freshUser.email)}" disabled style="opacity:.6">
        </div>
        <div class="form-group">
          <label>Faculty ID</label>
          <input type="text" id="fpf-id" class="form-control"
            placeholder="e.g. FAC001" value="${esc(freshUser.facultyId||'')}">
        </div>
        <div class="form-group">
          <label>Department</label>
          <input type="text" id="fpf-dept" class="form-control"
            placeholder="e.g. Computer Science" value="${esc(freshUser.department||'')}">
        </div>
        <div class="form-group">
          <label>Subject / Specialization</label>
          <input type="text" id="fpf-subject" class="form-control"
            placeholder="e.g. Data Structures" value="${esc(freshUser.subject||'')}">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="fpf-phone" class="form-control"
            placeholder="+91 9876543210" value="${esc(freshUser.phone||'')}">
        </div>
        <div class="form-group">
          <label>Qualification</label>
          <input type="text" id="fpf-qual" class="form-control"
            placeholder="e.g. M.Tech, PhD" value="${esc(freshUser.qualification||'')}">
        </div>
        <div class="form-group">
          <label>Experience</label>
          <input type="text" id="fpf-exp" class="form-control"
            placeholder="e.g. 5 years" value="${esc(freshUser.experience||'')}">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="fpf-gender" class="form-control">
            <option value="">Select</option>
            <option value="Male"   ${freshUser.gender==='Male'   ?'selected':''}>Male</option>
            <option value="Female" ${freshUser.gender==='Female' ?'selected':''}>Female</option>
            <option value="Other"  ${freshUser.gender==='Other'  ?'selected':''}>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="fpf-dob" class="form-control" value="${esc(freshUser.dob||'')}">
        </div>
        <div class="form-group profile-form-full">
          <label>Address</label>
          <input type="text" id="fpf-address" class="form-control"
            placeholder="Your address" value="${esc(freshUser.address||'')}">
        </div>
        <div class="form-group profile-form-full">
          <label>Bio / About</label>
          <textarea id="fpf-bio" class="form-control" rows="2"
            style="resize:vertical;font-family:inherit"
            placeholder="Brief description about yourself…">${esc(freshUser.bio||'')}</textarea>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 Account Details</div>
      <div class="profile-detail-list">
        ${facultyDetailRow('Role', 'Faculty')}
        ${facultyDetailRow('Joined', joined)}
        ${facultyDetailRow('Status', '✓ Active')}
      </div>
    </div>`;
}

function facultyDetailRow(key, val) {
  return `<div class="profile-detail-row">
    <span class="profile-detail-key">${key}</span>
    <span class="profile-detail-val">${val || '—'}</span>
  </div>`;
}

// Shared profile avatar helper (used by student.js too via global scope)
function profileAvatarHTML(user, size, editable) {
  const sz = size + 'px';
  const imgHtml = user.profileImage
    ? `<img src="${user.profileImage}" class="profile-photo" style="width:${sz};height:${sz}" alt="Profile">`
    : `<div class="profile-av-initials" style="width:${sz};height:${sz};font-size:${Math.round(size*0.35)}px">${initials(user.name)}</div>`;

  if (!editable) return `<div class="profile-avatar-wrap" style="width:${sz};height:${sz}">${imgHtml}</div>`;

  return `<div class="profile-avatar-wrap" style="width:${sz};height:${sz}">
    ${imgHtml}
    <label class="profile-photo-btn" title="Change photo">
      📷
      <input type="file" class="profile-photo-input" accept="image/*"
        onchange="handleFacultyPhotoChange(this)">
    </label>
  </div>`;
}

async function handleFacultyPhotoChange(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Image too large. Max 2MB.', 'error'); return; }
  const dataUrl = await fileToBase64(file);
  const res = await apiUpdateProfile({ profileImage: dataUrl });
  if (res.msg === 'Profile updated') {
    toast('Photo updated!', 'success');
    renderFacultyProfile();
  } else {
    toast(res.msg || 'Failed.', 'error');
  }
}

async function saveFacultyProfile() {
  const data = {
    facultyId:     document.getElementById('fpf-id')?.value.trim()      || '',
    department:    document.getElementById('fpf-dept')?.value.trim()     || '',
    subject:       document.getElementById('fpf-subject')?.value.trim()  || '',
    phone:         document.getElementById('fpf-phone')?.value.trim()    || '',
    qualification: document.getElementById('fpf-qual')?.value.trim()     || '',
    experience:    document.getElementById('fpf-exp')?.value.trim()      || '',
    gender:        document.getElementById('fpf-gender')?.value          || '',
    dob:           document.getElementById('fpf-dob')?.value             || '',
    address:       document.getElementById('fpf-address')?.value.trim()  || '',
    bio:           document.getElementById('fpf-bio')?.value.trim()      || '',
  };
  const btn = document.querySelector('#sec-profile .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  const res = await apiUpdateProfile(data);
  if (btn) { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
  if (res.msg === 'Profile updated') {
    toast('Profile saved!', 'success');
    renderFacultyProfile();
  } else {
    showAlert('profile-alert', res.msg || 'Failed.', 'error');
  }
}

// ════════════════════════════════════════════
// FACULTY — View Student Profile Modal
// ════════════════════════════════════════════

async function facultyViewStudentProfile(userId) {
  const user = await apiGetUserProfile(userId);
  if (!user) { toast('Could not load student profile.', 'error'); return; }
  showProfileModal(user);
}

function showProfileModal(user) {
  let modal = document.getElementById('fac-profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fac-profile-modal';
    modal.className = 'profile-modal-overlay';
    modal.innerHTML = `
      <div class="profile-modal-box">
        <div class="profile-modal-header">
          <span class="profile-modal-title" id="fpm-title">Profile</span>
          <button class="btn btn-ghost btn-sm" onclick="closeFacProfileModal()">✕ Close</button>
        </div>
        <div class="profile-modal-body" id="fpm-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeFacProfileModal(); });
  }

  const joined  = user.createdAt ? fmtDate(user.createdAt) : '—';
  const roleCls = { student: 'badge-blue', faculty: 'badge-violet', admin: 'badge-green' }[user.role] || 'badge-gray';

  const avatarHtml = user.profileImage
    ? `<div class="profile-modal-av"><img src="${user.profileImage}" alt="Photo"></div>`
    : `<div class="profile-modal-av">${initials(user.name)}</div>`;

  const fields = [
    ['Full Name',         user.name],
    ['Email',             user.email],
    ['Role',              user.role],
    ['Semester',          user.semester    || '—'],
    ['Roll Number',       user.rollNumber  || '—'],
    ['Department',        user.department  || '—'],
    ['Phone',             user.phone       || '—'],
    ['Gender',            user.gender      || '—'],
    ['Date of Birth',     user.dob         || '—'],
    ['Address',           user.address     || '—'],
    ['Member Since',      joined],
  ];
  if (user.bio) fields.push(['Bio', user.bio]);

  document.getElementById('fpm-title').textContent = user.name + ' — Student Profile';
  document.getElementById('fpm-body').innerHTML = `
    <div class="profile-modal-banner">
      ${avatarHtml}
      <div>
        <div class="profile-name">${esc(user.name)}</div>
        <div class="profile-email">${esc(user.email)}</div>
        <div style="display:flex;gap:.4rem;margin-top:6px;flex-wrap:wrap">
          <span class="badge ${roleCls}">${user.role}</span>
          ${user.semester ? `<span class="badge badge-violet">📚 ${esc(user.semester)}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="profile-detail-list">
      ${fields.map(([k,v]) => `
        <div class="profile-detail-row">
          <span class="profile-detail-key">${k}</span>
          <span class="profile-detail-val${(!v||v==='—')?' empty-val':''}">${esc(v||'—')}</span>
        </div>`).join('')}
    </div>`;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeFacProfileModal() {
  const modal = document.getElementById('fac-profile-modal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}
