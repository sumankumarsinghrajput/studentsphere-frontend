// ────────────────────────────────────────────
// admin.js — Admin dashboard (API version)
// ────────────────────────────────────────────

async function initAdmin() {
  const user = requireRole('admin');
  if (!user) return;

  renderNavUser(user);
  buildSidebar('admin', user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();

  await renderAdminSections(user);
}

async function renderAdminSections(user) {
  // Load all users from API
  const allUsers = await apiGetUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const faculty  = allUsers.filter(u => u.role === 'faculty');

  renderAdminOverview(user, allUsers, students, faculty);
  renderAdminStudents(students);
  renderAdminFaculty(faculty);
  renderAdminAllUsers(allUsers);
  renderAdminAddUser();
}

// ── Overview ──
function renderAdminOverview(user, allUsers, students, faculty) {
  const semesters = [...new Set(students.map(s => s.semester).filter(Boolean))];

  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Welcome, ${esc(user.name.split(' ')[0])} 👋</div>
      <div class="page-sub">Admin Dashboard — Full system management & analytics</div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${allUsers.length}</div>
        <div class="stat-lbl">Total Users</div>
        <span class="stat-bg-icon">👥</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${students.length}</div>
        <div class="stat-lbl">Students</div>
        <span class="stat-bg-icon">👨‍🎓</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${faculty.length}</div>
        <div class="stat-lbl">Faculty</div>
        <span class="stat-bg-icon">👩‍🏫</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${semesters.length}</div>
        <div class="stat-lbl">Active Semesters</div>
        <span class="stat-bg-icon">📚</span>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">👥 Recent Users</div>
        <div class="item-list">
          ${allUsers.slice(0,5).map(u => `
            <div class="item-row">
              <div class="item-row-left">
                <div class="nav-avatar" style="width:32px;height:32px;font-size:.75rem;flex-shrink:0">
                  ${initials(u.name)}
                </div>
                <div>
                  <div class="item-row-text">${esc(u.name)}</div>
                  <div style="font-size:.72rem;color:var(--muted)">${esc(u.email)}</div>
                </div>
              </div>
              <span class="role-tag role-${u.role}">${u.role}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">📚 Students per Semester</div>
        <div class="info-list">
          ${['Semester 1','Semester 2','Semester 3','Semester 4',
             'Semester 5','Semester 6','Semester 7','Semester 8'].map(sem => {
            const count = students.filter(s => s.semester === sem).length;
            return `<div class="info-row">
              <span class="info-key">${sem}</span>
              <span class="badge badge-blue">${count} students</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

// ── Students ──
function renderAdminStudents(students) {
  document.getElementById('sec-students').innerHTML = `
    <div class="page-head">
      <div class="page-title">Students</div>
      <div class="page-sub">All registered students</div>
    </div>
    <div class="card">
      <div class="card-title">👨‍🎓 Student List
        <span class="badge badge-blue" style="margin-left:auto">${students.length}</span>
      </div>
      ${students.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Semester</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>${esc(s.name)}</td>
                  <td>${esc(s.email)}</td>
                  <td><span class="badge badge-violet">${esc(s.semester||'—')}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm"
                      onclick="deleteUser('${s._id}','${esc(s.name)}')">
                      🗑 Delete
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty"><span class="empty-ico">👨‍🎓</span>No students registered yet.</div>`}
    </div>`;
}

// ── Faculty ──
function renderAdminFaculty(faculty) {
  document.getElementById('sec-faculty').innerHTML = `
    <div class="page-head">
      <div class="page-title">Faculty</div>
      <div class="page-sub">All registered faculty members</div>
    </div>
    <div class="card">
      <div class="card-title">👩‍🏫 Faculty List
        <span class="badge badge-violet" style="margin-left:auto">${faculty.length}</span>
      </div>
      ${faculty.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Department/Sem</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${faculty.map(f => `
                <tr>
                  <td>${esc(f.name)}</td>
                  <td>${esc(f.email)}</td>
                  <td>${esc(f.semester||'—')}</td>
                  <td>
                    <button class="btn btn-danger btn-sm"
                      onclick="deleteUser('${f._id}','${esc(f.name)}')">
                      🗑 Delete
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty"><span class="empty-ico">👩‍🏫</span>No faculty registered yet.</div>`}
    </div>`;
}

// ── All Users ──
function renderAdminAllUsers(allUsers) {
  document.getElementById('sec-all-users').innerHTML = `
    <div class="page-head">
      <div class="page-title">All Users</div>
      <div class="page-sub">Complete user list</div>
    </div>
    <div class="card">
      <div class="card-title">👥 All Users
        <span class="badge badge-blue" style="margin-left:auto">${allUsers.length}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Semester</th><th>Action</th>
          </tr></thead>
          <tbody>
            ${allUsers.map(u => `
              <tr>
                <td>${esc(u.name)}</td>
                <td>${esc(u.email)}</td>
                <td><span class="role-tag role-${u.role}">${u.role}</span></td>
                <td>${esc(u.semester||'—')}</td>
                <td>
                  ${u.role !== 'admin' ? `
                    <button class="btn btn-danger btn-sm"
                      onclick="deleteUser('${u._id}','${esc(u.name)}')">
                      🗑 Delete
                    </button>` : '<span class="badge badge-gray">Protected</span>'}
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
      <div class="page-title">Add User</div>
      <div class="page-sub">Register a new student or faculty member</div>
    </div>
    <div class="card" style="max-width:520px">
      <div class="card-title">➕ Create Account</div>
      <div id="add-user-alert"></div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="au-name" class="form-control" placeholder="Full name">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="au-email" class="form-control" placeholder="email@example.com">
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
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="au-pass" class="form-control" placeholder="Minimum 6 characters">
      </div>
      <button class="btn btn-primary btn-block" onclick="submitAddUser()">
        ➕ Create Account
      </button>
    </div>`;
}

// ── Submit Add User ──
async function submitAddUser() {
  const name     = document.getElementById('au-name').value.trim();
  const email    = document.getElementById('au-email').value.trim();
  const role     = document.getElementById('au-role').value;
  const semester = document.getElementById('au-semester').value;
  const password = document.getElementById('au-pass').value;

  if (!name || !email || !password || !semester) {
    showAlert('add-user-alert', 'All fields are required.', 'error');
    return;
  }

  const btn = document.querySelector('#sec-add-user .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const data = await apiCreateUser({ name, email, password, role, semester });
    if (data.msg === 'Account created successfully') {
      showAlert('add-user-alert', `✅ ${role === 'faculty' ? 'Faculty' : 'Student'} account created for ${name}!`, 'success');
      // Clear form
      document.getElementById('au-name').value  = '';
      document.getElementById('au-email').value = '';
      document.getElementById('au-pass').value  = '';
      document.getElementById('au-semester').value = '';
      // Refresh user lists
      const allUsers = await apiGetUsers();
      renderAdminStudents(allUsers.filter(u => u.role === 'student'));
      renderAdminFaculty(allUsers.filter(u => u.role === 'faculty'));
      renderAdminAllUsers(allUsers);
    } else {
      showAlert('add-user-alert', data.msg || 'Failed to create account.', 'error');
    }
  } catch (err) {
    showAlert('add-user-alert', 'Server error. Please try again.', 'error');
  }

  btn.disabled = false;
  btn.textContent = '➕ Create Account';
}

// ── Delete User ──
async function deleteUser(id, name) {
  if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

  try {
    const data = await apiDeleteUser(id);
    if (data.msg === 'User deleted successfully') {
      toast(`${name} has been deleted.`, 'success');
      // Refresh all sections
      const allUsers = await apiGetUsers();
      renderAdminStudents(allUsers.filter(u => u.role === 'student'));
      renderAdminFaculty(allUsers.filter(u => u.role === 'faculty'));
      renderAdminAllUsers(allUsers);
      renderAdminOverview(
        SS.get('ss_current_user'),
        allUsers,
        allUsers.filter(u => u.role === 'student'),
        allUsers.filter(u => u.role === 'faculty')
      );
    } else {
      toast(data.msg || 'Failed to delete user.', 'error');
    }
  } catch (err) {
    toast('Server error.', 'error');
  }
}