// ────────────────────────────────────────────
// admin.js — Admin dashboard (matches original UI)
// ────────────────────────────────────────────

let _adminAllUsers = [];
let _adminStudents = [];
let _adminFaculty  = [];

async function initAdmin() {
  const user = requireRole('admin');
  if (!user) return;

  renderNavUser(user);
  buildSidebar('admin', user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();

  await refreshAdminData(user);
}

async function refreshAdminData(user) {
  _adminAllUsers = await apiGetUsers();
  _adminStudents = _adminAllUsers.filter(u => u.role === 'student');
  _adminFaculty  = _adminAllUsers.filter(u => u.role === 'faculty');

  const u = user || SS.get('ss_current_user');
  renderAdminOverview(u);
  await renderAdminStudents();
  renderAdminFaculty();
  renderAdminAllUsers();
  renderAdminAddUser();
}

// ── Overview ──
function renderAdminOverview(user) {
  // Count content stats from student data (approximate from user count)
  const sems = [...new Set(_adminStudents.map(s => s.semester).filter(Boolean))];

  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Admin Dashboard</div>
      <div class="page-sub">Full system management &amp; analytics</div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${_adminAllUsers.length}</div>
        <div class="stat-lbl">Total Users</div>
        <span class="stat-bg-icon">👥</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${_adminStudents.length}</div>
        <div class="stat-lbl">Students</div>
        <span class="stat-bg-icon">👨‍🎓</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${_adminFaculty.length}</div>
        <div class="stat-lbl">Faculty</div>
        <span class="stat-bg-icon">👩‍🏫</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${sems.length}</div>
        <div class="stat-lbl">Active Semesters</div>
        <span class="stat-bg-icon">📚</span>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">🗓️ Content Summary</div>
        <div class="info-list">
          <div class="info-row"><span class="info-key">Notes Uploaded</span>
            <span class="info-val" id="stat-notes">—</span></div>
          <div class="info-row"><span class="info-key">Assignments</span>
            <span class="info-val" id="stat-asgn">—</span></div>
          <div class="info-row"><span class="info-key">Lab Reports</span>
            <span class="info-val" id="stat-lab">—</span></div>
          <div class="info-row"><span class="info-key">Marks Updated</span>
            <span class="info-val" id="stat-marks">—</span></div>
          <div class="info-row"><span class="info-key">Attendance Updated</span>
            <span class="info-val" id="stat-att">—</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📚 Students per Semester</div>
        <div class="info-list">
          ${['Semester 1','Semester 2','Semester 3','Semester 4',
             'Semester 5','Semester 6','Semester 7','Semester 8'].map(sem => {
            const count = _adminStudents.filter(s => s.semester === sem).length;
            return `<div class="info-row">
              <span class="info-key">${sem}</span>
              <span class="badge badge-blue">${count} students</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // Load content stats async
  loadAdminContentStats();
}

async function loadAdminContentStats() {
  let notes = 0, asgn = 0, lab = 0, marks = 0, att = 0;
  const dataArr = await Promise.all(_adminStudents.map(s => apiGetStudentData(s.email)));
  dataArr.forEach(d => {
    notes += (d.notes||[]).length;
    asgn  += (d.assignments||[]).length;
    lab   += (d.lab||[]).length;
    if (d.marks     !== null && d.marks     !== undefined) marks++;
    if (d.attendance !== null && d.attendance !== undefined) att++;
  });
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-notes', notes);
  set('stat-asgn',  asgn);
  set('stat-lab',   lab);
  set('stat-marks', marks);
  set('stat-att',   att);
}

// ── Students — grouped by semester with attendance/marks badges ──
async function renderAdminStudents() {
  // Fetch all student data for badges
  const dataMap = {};
  const dataArr = await Promise.all(_adminStudents.map(s => apiGetStudentData(s.email)));
  _adminStudents.forEach((s, i) => { dataMap[s.email] = dataArr[i]; });

  const sems = ['Semester 1','Semester 2','Semester 3','Semester 4',
                'Semester 5','Semester 6','Semester 7','Semester 8'];

  const grouped = sems.map(sem => {
    const sts = _adminStudents.filter(s => s.semester === sem);
    return { sem, sts };
  }).filter(g => g.sts.length > 0);

  const attBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=50?'var(--amber)':'var(--rose)'};color:#fff;min-width:48px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:48px;text-align:center">—</span>`;

  const mksBadge = v => v !== null && v !== undefined
    ? `<span class="badge" style="background:${v>=75?'var(--green)':v>=60?'var(--amber)':'var(--rose)'};color:#fff;min-width:48px;text-align:center">${v}%</span>`
    : `<span class="badge badge-gray" style="min-width:48px;text-align:center">—</span>`;

  document.getElementById('sec-students').innerHTML = `
    <div class="page-head">
      <div class="page-title">👨‍🎓 Students</div>
      <div class="page-sub">All registered students grouped by semester</div>
    </div>
    ${grouped.length ? grouped.map(g => `
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-title">
          📚 ${g.sem}
          <span class="badge badge-blue" style="margin-left:.5rem">${g.sts.length} students</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Name</th><th>Email</th>
              <th>Attendance</th><th>Marks</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${g.sts.map((s, idx) => {
                const d = dataMap[s.email] || {};
                return `<tr>
                  <td>${idx+1}</td>
                  <td><strong>${esc(s.name)}</strong></td>
                  <td style="color:var(--muted);font-size:.82rem">${esc(s.email)}</td>
                  <td>${attBadge(d.attendance)}</td>
                  <td>${mksBadge(d.marks)}</td>
                  <td style="font-size:.82rem;color:var(--muted)">${s.createdAt ? fmtDate(s.createdAt) : '—'}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="adminEditSem('${s._id}','${esc(s.name)}','${esc(s.semester||'')}')">✏️ Sem</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${s._id}','${esc(s.name)}')">Delete</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`).join('') : `<div class="card"><div class="empty"><span class="empty-ico">👨‍🎓</span>No students registered yet.</div></div>`}`;
}

// ── Faculty ──
function renderAdminFaculty() {
  document.getElementById('sec-faculty').innerHTML = `
    <div class="page-head">
      <div class="page-title">👩‍🏫 Faculty</div>
      <div class="page-sub">All registered faculty members</div>
    </div>
    <div class="card">
      ${_adminFaculty.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Name</th><th>Email</th><th>Semester</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${_adminFaculty.map((f, idx) => `
                <tr>
                  <td>${idx+1}</td>
                  <td><strong>${esc(f.name)}</strong></td>
                  <td style="color:var(--muted);font-size:.82rem">${esc(f.email)}</td>
                  <td><span class="badge badge-violet">${esc(f.semester||'—')}</span></td>
                  <td style="font-size:.82rem;color:var(--muted)">${f.createdAt ? fmtDate(f.createdAt) : '—'}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="adminEditSem('${f._id}','${esc(f.name)}','${esc(f.semester||'')}')">✏️ Sem</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${f._id}','${esc(f.name)}')">Delete</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty"><span class="empty-ico">👩‍🏫</span>No faculty registered yet.</div>`}
    </div>`;
}

// ── All Users ──
function renderAdminAllUsers() {
  document.getElementById('sec-all-users').innerHTML = `
    <div class="page-head">
      <div class="page-title">👥 All Users</div>
      <div class="page-sub">Every account in the system</div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Semester</th><th>Joined</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${_adminAllUsers.map((u, idx) => `
              <tr>
                <td>${idx+1}</td>
                <td><strong>${esc(u.name)}</strong></td>
                <td style="color:var(--muted);font-size:.82rem">${esc(u.email)}</td>
                <td><span class="role-tag role-${u.role}">${u.role}</span></td>
                <td>${esc(u.semester||'—')}</td>
                <td style="font-size:.82rem;color:var(--muted)">${u.createdAt ? fmtDate(u.createdAt) : '—'}</td>
                <td>
                  ${u.role !== 'admin'
                    ? `<button class="btn btn-outline btn-sm" onclick="adminEditSem('${u._id}','${esc(u.name)}','${esc(u.semester||'')}')">✏️ Sem</button>
                       <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}','${esc(u.name)}')">Delete</button>`
                    : `<span class="badge badge-gray">Protected</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── Add User ──
function renderAdminAddUser() {
  document.getElementById('sec-add-user').innerHTML = `
    <div class="page-head">
      <div class="page-title">➕ Add User</div>
      <div class="page-sub">Create a new student or faculty account</div>
    </div>
    <div class="card" style="max-width:540px">
      <div class="card-title">New Account</div>
      <div id="add-user-alert"></div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="au-name" class="form-control" placeholder="Enter full name">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="au-email" class="form-control" placeholder="email@example.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="au-pass" class="form-control" placeholder="Minimum 6 characters">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="au-role" class="form-control">
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </div>
      <div class="form-group">
        <label>Class / Semester</label>
        <select id="au-semester" class="form-control">
          <option value="">— Select semester —</option>
          <option>Semester 1</option><option>Semester 2</option>
          <option>Semester 3</option><option>Semester 4</option>
          <option>Semester 5</option><option>Semester 6</option>
          <option>Semester 7</option><option>Semester 8</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" onclick="submitAddUser()">➕ Create Account</button>
    </div>`;
}

async function submitAddUser() {
  const name     = document.getElementById('au-name').value.trim();
  const email    = document.getElementById('au-email').value.trim();
  const role     = document.getElementById('au-role').value;
  const semester = document.getElementById('au-semester').value;
  const password = document.getElementById('au-pass').value;

  if (!name || !email || !password || !semester) {
    showAlert('add-user-alert', 'All fields are required.', 'error'); return;
  }

  const btn = document.querySelector('#sec-add-user .btn-primary');
  btn.disabled = true; btn.textContent = 'Creating…';

  try {
    const data = await apiCreateUser({ name, email, password, role, semester });
    if (data.msg === 'Account created successfully') {
      showAlert('add-user-alert', `✅ ${role === 'faculty' ? 'Faculty' : 'Student'} account created for ${name}!`, 'success');
      document.getElementById('au-name').value = '';
      document.getElementById('au-email').value = '';
      document.getElementById('au-pass').value = '';
      document.getElementById('au-semester').value = '';
      await refreshAdminData();
    } else {
      showAlert('add-user-alert', data.msg || 'Failed to create account.', 'error');
    }
  } catch (err) {
    showAlert('add-user-alert', 'Server error. Please try again.', 'error');
  }

  btn.disabled = false; btn.textContent = '➕ Create Account';
}

// ── Edit Semester ──
async function adminEditSem(id, name, currentSem) {
  const sems = ['Semester 1','Semester 2','Semester 3','Semester 4',
                'Semester 5','Semester 6','Semester 7','Semester 8'];
  const newSem = prompt(
    `Change semester for ${name}:\n\n${sems.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nCurrent: ${currentSem||'None'}\nType the semester name exactly:`,
    currentSem || ''
  );
  if (!newSem || !sems.includes(newSem)) {
    if (newSem !== null) alert('Invalid semester. Please type exactly e.g. "Semester 3"');
    return;
  }
  // Use update endpoint
  try {
    const res = await fetch('https://studentsphere-backend-g4wj.onrender.com/api/users/' + id + '/semester', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('ss_token') },
      body: JSON.stringify({ semester: newSem })
    });
    const data = await res.json();
    toast(`${name} moved to ${newSem}`, 'success');
    await refreshAdminData();
  } catch (e) {
    toast('Failed to update semester.', 'error');
  }
}

// ── Delete User ──
async function deleteUser(id, name) {
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
  try {
    const data = await apiDeleteUser(id);
    if (data.msg === 'User deleted successfully') {
      toast(`${name} deleted.`, 'success');
      await refreshAdminData();
    } else {
      toast(data.msg || 'Failed to delete.', 'error');
    }
  } catch (err) {
    toast('Server error.', 'error');
  }
}
