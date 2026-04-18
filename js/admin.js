// ────────────────────────────────────────────
// admin.js — Admin dashboard
// ────────────────────────────────────────────

function initAdmin() {
  const user = requireRole('admin');
  if (!user) return;
  renderNavUser(user);
  buildSidebar('admin', user);
  renderAdminSections(user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();
}

function renderAdminSections(user) {
  const allUsers   = SS.get('ss_users') || [];
  const students   = allUsers.filter(u=>u.role==='student');
  const faculty    = allUsers.filter(u=>u.role==='faculty');
  const att        = SS.get('ss_attendance')  || {};
  const marks      = SS.get('ss_marks')       || {};
  const notes      = SS.get('ss_notes')       || {};
  const asgn       = SS.get('ss_assignments') || {};
  const lab        = SS.get('ss_lab')         || {};
  const totalNotes = Object.values(notes).reduce((a,v)=>a+v.length,0);
  const totalAsgn  = Object.values(asgn).reduce((a,v)=>a+v.length,0);
  const totalLab   = Object.values(lab).reduce((a,v)=>a+v.length,0);

  // Group students by semester
  const semGroups = {};
  SEMESTERS.forEach(s=>{ semGroups[s] = students.filter(u=>u.semester===s); });

  // ── Overview ──
  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head"><div class="page-title">Admin Dashboard</div><div class="page-sub">Full system management &amp; analytics</div></div>
    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${allUsers.length}</div><div class="stat-lbl">Total Users</div><span class="stat-bg-icon">👥</span></div>
      <div class="stat-box"><div class="stat-val">${students.length}</div><div class="stat-lbl">Students</div><span class="stat-bg-icon">👨‍🎓</span></div>
      <div class="stat-box"><div class="stat-val">${faculty.length}</div><div class="stat-lbl">Faculty</div><span class="stat-bg-icon">👩‍🏫</span></div>
      <div class="stat-box"><div class="stat-val">${SEMESTERS.filter(s=>semGroups[s].length>0).length}</div><div class="stat-lbl">Active Semesters</div><span class="stat-bg-icon">📚</span></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📊 Content Summary</div>
        <div class="info-list">
          <div class="info-row"><span class="info-key">Notes Uploaded</span><span class="info-val">${totalNotes}</span></div>
          <div class="info-row"><span class="info-key">Assignments</span><span class="info-val">${totalAsgn}</span></div>
          <div class="info-row"><span class="info-key">Lab Reports</span><span class="info-val">${totalLab}</span></div>
          <div class="info-row"><span class="info-key">Marks Updated</span><span class="info-val">${Object.keys(marks).length}</span></div>
          <div class="info-row"><span class="info-key">Attendance Updated</span><span class="info-val">${Object.keys(att).length}</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📚 Students per Semester</div>
        <div class="info-list">
          ${SEMESTERS.map(s=>
            '<div class="info-row">' +
              '<span class="info-key">' + s + '</span>' +
              '<span class="info-val"><span class="badge ' + (semGroups[s].length ? 'badge-blue' : 'badge-gray') + '">' +
                semGroups[s].length + ' student' + (semGroups[s].length!==1?'s':'') +
              '</span></span>' +
            '</div>'
          ).join('')}
        </div>
      </div>
    </div>`;

  // ── Students ──
  buildStudentTable(user);
  // ── Faculty ──
  buildFacultyTable(user);
  // ── All Users ──
  buildAllUsersTable(user);
  // ── Add User ──
  buildAddUser(user);
}

/* ── Students table grouped by semester ── */
function buildStudentTable(user) {
  const allStudents = getStudents();
  const att         = SS.get('ss_attendance') || {};
  const marks       = SS.get('ss_marks')      || {};

  let bodyHtml = '';

  if (!allStudents.length) {
    bodyHtml = '<div class="card"><div class="empty"><span class="empty-ico">👨‍🎓</span>No students registered yet.</div></div>';
  } else {
    SEMESTERS.forEach(function(sem) {
      const studs = allStudents.filter(function(s){ return s.semester === sem; });
      if (!studs.length) return;
      let rows = '';
      studs.forEach(function(u, i) {
        const attCell   = att[u.email]   !== undefined ? valBadge(att[u.email])   : '—';
        const marksCell = marks[u.email] !== undefined ? valBadge(marks[u.email]) : '—';
        rows +=
          '<tr>' +
          '<td style="color:var(--muted)">' + (i+1) + '</td>' +
          '<td><strong style="color:var(--white)">' + esc(u.name) + '</strong></td>' +
          '<td style="color:var(--muted)">' + esc(u.email) + '</td>' +
          '<td>' + attCell + '</td>' +
          '<td>' + marksCell + '</td>' +
          '<td style="color:var(--muted)">' + fmtDate(u.createdAt) + '</td>' +
          '<td style="display:flex;gap:6px">' +
            '<button class="btn btn-outline btn-sm adm-edit-sem" data-email="' + esc(u.email) + '" data-semester="' + esc(u.semester||'') + '" data-name="' + esc(u.name) + '">✏️ Sem</button>' +
            '<button class="btn btn-danger btn-sm adm-del" data-email="' + esc(u.email) + '" data-sec="sec-students">Delete</button>' +
          '</td>' +
          '</tr>';
      });
      bodyHtml +=
        '<div class="card" style="margin-bottom:1.25rem">' +
        '<div class="card-title">📚 ' + sem +
          ' <span class="badge badge-blue" style="margin-left:8px">' + studs.length + ' student' + (studs.length!==1?'s':'') + '</span>' +
        '</div>' +
        '<div class="table-wrap"><table>' +
        '<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Attendance</th><th>Marks</th><th>Joined</th><th>Actions</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div></div>';
    });

    // Students with no semester
    const noSem = allStudents.filter(function(s){ return !s.semester; });
    if (noSem.length) {
      let rows = '';
      noSem.forEach(function(u, i) {
        rows +=
          '<tr>' +
          '<td style="color:var(--muted)">' + (i+1) + '</td>' +
          '<td><strong style="color:var(--white)">' + esc(u.name) + '</strong></td>' +
          '<td style="color:var(--muted)">' + esc(u.email) + '</td>' +
          '<td style="color:var(--muted)">' + fmtDate(u.createdAt) + '</td>' +
          '<td style="display:flex;gap:6px">' +
            '<button class="btn btn-outline btn-sm adm-edit-sem" data-email="' + esc(u.email) + '" data-semester="" data-name="' + esc(u.name) + '">✏️ Sem</button>' +
            '<button class="btn btn-danger btn-sm adm-del" data-email="' + esc(u.email) + '" data-sec="sec-students">Delete</button>' +
          '</td>' +
          '</tr>';
      });
      bodyHtml +=
        '<div class="card" style="margin-bottom:1.25rem">' +
        '<div class="card-title" style="color:var(--amber)">⚠️ No Semester Assigned</div>' +
        '<div class="table-wrap"><table>' +
        '<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Joined</th><th>Actions</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div></div>';
    }
  }

  document.getElementById('sec-students').innerHTML =
    '<div class="page-head"><div class="page-title">👨‍🎓 Students</div><div class="page-sub">All registered students grouped by semester</div></div>' +
    '<div id="sec-students-alert"></div>' +
    '<div id="sem-edit-panel"></div>' +
    bodyHtml;

  attachAdminDel('sec-students', user);
  attachSemEdit('sec-students', user);
}

/* ── Faculty table with semester column ── */
function buildFacultyTable(user) {
  const faculty = (SS.get('ss_users')||[]).filter(u=>u.role==='faculty');

  let tableHtml = '';
  if (!faculty.length) {
    tableHtml = '<div class="card"><div class="empty"><span class="empty-ico">👩‍🏫</span>No faculty registered yet.</div></div>';
  } else {
    let rows = '';
    faculty.forEach(function(u, i) {
      rows +=
        '<tr>' +
        '<td style="color:var(--muted)">' + (i+1) + '</td>' +
        '<td><strong style="color:var(--white)">' + esc(u.name) + '</strong></td>' +
        '<td style="color:var(--muted)">' + esc(u.email) + '</td>' +
        '<td>' + (u.semester ? '<span class="badge badge-violet">' + esc(u.semester) + '</span>' : '<span style="color:var(--amber)">Not set</span>') + '</td>' +
        '<td style="color:var(--muted)">' + fmtDate(u.createdAt) + '</td>' +
        '<td style="display:flex;gap:6px">' +
          '<button class="btn btn-outline btn-sm adm-edit-sem" data-email="' + esc(u.email) + '" data-semester="' + esc(u.semester||'') + '" data-name="' + esc(u.name) + '">✏️ Sem</button>' +
          '<button class="btn btn-danger btn-sm adm-del" data-email="' + esc(u.email) + '" data-sec="sec-faculty">Delete</button>' +
        '</td>' +
        '</tr>';
    });
    tableHtml =
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Semester</th><th>Joined</th><th>Actions</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }

  document.getElementById('sec-faculty').innerHTML =
    '<div class="page-head"><div class="page-title">👩‍🏫 Faculty</div><div class="page-sub">All registered faculty members</div></div>' +
    '<div id="sec-faculty-alert"></div>' +
    '<div id="sem-edit-panel-faculty"></div>' +
    tableHtml;

  attachAdminDel('sec-faculty', user);
  attachSemEdit('sec-faculty', user);
}

/* ── All Users table ── */
function buildAllUsersTable(user) {
  const allUsers = SS.get('ss_users') || [];
  const roleMap  = { student:'badge-blue', faculty:'badge-violet', admin:'badge-rose' };

  let rows = '';
  allUsers.forEach(function(u, i) {
    const semCell = u.role === 'admin'
      ? '—'
      : (u.semester ? esc(u.semester) : '<span style="color:var(--amber)">Not set</span>');
    const actionCell = u.role !== 'admin'
      ? '<div style="display:flex;gap:6px">' +
          '<button class="btn btn-outline btn-sm adm-edit-sem" data-email="' + esc(u.email) + '" data-semester="' + esc(u.semester||'') + '" data-name="' + esc(u.name) + '">✏️ Sem</button>' +
          '<button class="btn btn-danger btn-sm adm-del" data-email="' + esc(u.email) + '" data-sec="sec-all-users">Delete</button>' +
        '</div>'
      : '<span style="color:var(--muted);font-size:.78rem">Protected</span>';
    rows +=
      '<tr>' +
      '<td style="color:var(--muted)">' + (i+1) + '</td>' +
      '<td><strong style="color:var(--white)">' + esc(u.name) + '</strong></td>' +
      '<td style="color:var(--muted)">' + esc(u.email) + '</td>' +
      '<td><span class="badge ' + (roleMap[u.role]||'badge-gray') + '">' + u.role + '</span></td>' +
      '<td style="color:var(--muted)">' + semCell + '</td>' +
      '<td style="color:var(--muted)">' + fmtDate(u.createdAt) + '</td>' +
      '<td>' + actionCell + '</td>' +
      '</tr>';
  });

  document.getElementById('sec-all-users').innerHTML =
    '<div class="page-head"><div class="page-title">👥 All Users</div><div class="page-sub">Every account in the system</div></div>' +
    '<div id="sec-all-users-alert"></div>' +
    '<div id="sem-edit-panel-all"></div>' +
    (allUsers.length
      ? '<div class="table-wrap"><table>' +
        '<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Semester</th><th>Joined</th><th>Actions</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div>'
      : '<div class="card"><div class="empty">No users found.</div></div>');

  attachAdminDel('sec-all-users', user);
  attachSemEdit('sec-all-users', user);
}

/* ── Add User ── */
function buildAddUser(user) {
  document.getElementById('sec-add-user').innerHTML = `
    <div class="page-head"><div class="page-title">➕ Add User</div><div class="page-sub">Create a new student or faculty account</div></div>
    <div class="card" style="max-width:480px">
      <div class="card-title">New Account</div>
      <div id="add-user-alert"></div>
      <div class="form-group"><label>Full Name</label><input type="text" class="form-control" id="au-name" placeholder="Enter full name"></div>
      <div class="form-group"><label>Email Address</label><input type="email" class="form-control" id="au-email" placeholder="Enter email"></div>
      <div class="form-group"><label>Password</label><input type="password" class="form-control" id="au-pass" placeholder="Min 6 characters"></div>
      <div class="form-group"><label>Role</label>
        <select class="form-control" id="au-role">
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </div>
      <div class="form-group" id="au-sem-group">
        <label>Class / Semester</label>
        <select class="form-control" id="au-semester">
          <option value="">— Select semester —</option>
          ${SEMESTERS.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" id="au-submit">Create Account</button>
    </div>`;

  document.getElementById('au-submit').addEventListener('click', function() {
    const name     = document.getElementById('au-name').value.trim();
    const email    = document.getElementById('au-email').value.trim();
    const pass     = document.getElementById('au-pass').value;
    const role     = document.getElementById('au-role').value;
    const semester = document.getElementById('au-semester').value || null;
    const res      = registerUser({ name, email, password:pass, role, semester });
    if (res.ok) {
      showAlert('add-user-alert','User created successfully!','success');
      ['au-name','au-email','au-pass'].forEach(function(id){ document.getElementById(id).value=''; });
      document.getElementById('au-semester').value = '';
      renderAdminSections(user);
      switchSec('add-user');
    } else {
      showAlert('add-user-alert', res.msg, 'error');
    }
  });
}

/* ── Semester edit handler ── */
function attachSemEdit(secId, user) {
  document.querySelectorAll('#' + secId + ' .adm-edit-sem').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const email       = btn.dataset.email;
      const currentSem  = btn.dataset.semester || '';
      const name        = btn.dataset.name;

      // Determine which panel div to use based on section
      const panelId = secId === 'sec-faculty'   ? 'sem-edit-panel-faculty'
                    : secId === 'sec-all-users'  ? 'sem-edit-panel-all'
                    : 'sem-edit-panel';
      const panel = document.getElementById(panelId);
      if (!panel) return;

      const opts = SEMESTERS.map(function(s) {
        return '<option value="' + s + '"' + (s === currentSem ? ' selected' : '') + '>' + s + '</option>';
      }).join('');

      panel.innerHTML =
        '<div class="card" style="margin-bottom:1.25rem;border-color:var(--blue)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
            '<div style="font-weight:700;color:var(--white)">✏️ Edit Semester — ' + esc(name) + '</div>' +
            '<button class="btn btn-outline btn-sm" id="sem-edit-close">✕ Close</button>' +
          '</div>' +
          '<div id="sem-edit-alert"></div>' +
          '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
            '<select class="form-control sem-select" id="sem-edit-val" style="max-width:220px">' +
              '<option value="">— Select semester —</option>' +
              opts +
            '</select>' +
            '<button class="btn btn-primary" id="sem-edit-save">💾 Save</button>' +
          '</div>' +
        '</div>';

      document.getElementById('sem-edit-close').addEventListener('click', function() {
        panel.innerHTML = '';
      });

      document.getElementById('sem-edit-save').addEventListener('click', function() {
        const newSem = document.getElementById('sem-edit-val').value;
        if (!newSem) { showAlert('sem-edit-alert', 'Please select a semester.'); return; }
        const users = SS.get('ss_users') || [];
        const idx   = users.findIndex(function(u){ return u.email === email; });
        if (idx === -1) { showAlert('sem-edit-alert', 'User not found.', 'error'); return; }
        users[idx].semester = newSem;
        SS.set('ss_users', users);
        // Update current user session if editing self (unlikely for admin but safe)
        const cu = SS.get('ss_current_user');
        if (cu && cu.email === email) { cu.semester = newSem; SS.set('ss_current_user', cu); }
        toast('Semester updated to ' + newSem + '!', 'success');
        panel.innerHTML = '';
        renderAdminSections(user);
        switchSec(secId.replace('sec-',''));
      });

      panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  });
}

/* ── Delete handler ── */
function attachAdminDel(secId, user) {
  document.querySelectorAll('#' + secId + ' .adm-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const email = btn.dataset.email;
      if (!confirm('Delete user "' + email + '"?\nThis action cannot be undone.')) return;
      let users = SS.get('ss_users') || [];
      users = users.filter(function(u){ return u.email !== email; });
      SS.set('ss_users', users);
      ['ss_attendance','ss_marks','ss_notes','ss_assignments','ss_lab'].forEach(function(k){
        const d = SS.get(k) || {};
        delete d[email];
        SS.set(k, d);
      });
      toast('User deleted.', 'success');
      renderAdminSections(user);
      switchSec(secId.replace('sec-',''));
    });
  });
}
