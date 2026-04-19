// ────────────────────────────────────────────
// student.js — Student dashboard (API version)
// ────────────────────────────────────────────

async function initStudent() {
  const user = requireRole('student');
  if (!user) return;

  renderNavUser(user);
  buildSidebar('student', user);
  switchSec('overview');
  initSbNav();
  initHam();
  initEasterEgg();

  // Load data from API
  const data = await apiGetMyData();
  renderStudentSections(user, data);
}

function renderStudentSections(user, data) {
  const sem   = user.semester || 'N/A';
  const att   = data.attendance ?? null;
  const mark  = data.marks ?? null;
  const notes = data.notes || [];
  const asgn  = data.assignments || [];
  const lab   = data.lab || [];

  const hasAtt  = att !== null && att !== undefined;
  const hasMark = mark !== null && mark !== undefined;

  // ── Overview ──
  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Welcome back, ${esc(user.name.split(' ')[0])} 👋</div>
      <div class="page-sub">Here's your academic snapshot &nbsp;·&nbsp;
        <span style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</span></div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${hasAtt ? att+'%' : '—'}</div>
        <div class="stat-lbl">Attendance</div>
        <span class="stat-bg-icon">📅</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${hasMark ? mark+'%' : '—'}</div>
        <div class="stat-lbl">Marks Score</div>
        <span class="stat-bg-icon">📊</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${notes.length}</div>
        <div class="stat-lbl">Notes</div>
        <span class="stat-bg-icon">📓</span>
      </div>
      <div class="stat-box">
        <div class="stat-val">${asgn.length}</div>
        <div class="stat-lbl">Assignments</div>
        <span class="stat-bg-icon">📝</span>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📅 Attendance</div>
        ${hasAtt ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(att)}">${att}%</div>
            <div class="score-label">Overall Attendance</div>
          </div>
          ${progBar(att)}
          <p style="font-size:.8rem;color:var(--muted);margin-top:.6rem">
            ${att>=75?'✅ Eligible for exams':att>=50?'⚠️ Below recommended (75%)':'❌ Critically low'}
          </p>` : `<div class="empty"><span class="empty-ico">📅</span>No data yet — faculty will update this.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📊 Marks</div>
        ${hasMark ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(mark)}">${mark}%</div>
            <div class="score-label">Overall Score · Grade ${mark>=75?'A':mark>=60?'B':mark>=50?'C':mark>=40?'D':'F'}</div>
          </div>
          ${progBar(mark)}` : `<div class="empty"><span class="empty-ico">📊</span>No data yet — faculty will update this.</div>`}
      </div>
    </div>
    <div class="grid-2" style="margin-top:1.25rem">
      <div class="card">
        <div class="card-title">📓 Recent Notes
          <span class="badge badge-blue" style="margin-left:auto">${notes.length}</span>
        </div>
        ${notes.length ? `<div class="item-list">${notes.slice(-3).reverse().map(n=>itemRow('📄',n)).join('')}</div>`
          : `<div class="empty" style="padding:1rem">No notes yet.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📝 Recent Assignments
          <span class="badge badge-violet" style="margin-left:auto">${asgn.length}</span>
        </div>
        ${asgn.length ? `<div class="item-list">${asgn.slice(-3).reverse().map(a=>itemRow('📋',a)).join('')}</div>`
          : `<div class="empty" style="padding:1rem">No assignments yet.</div>`}
      </div>
    </div>`;

  // ── Profile ──
  document.getElementById('sec-profile').innerHTML = `
    <div class="page-head"><div class="page-title">My Profile</div>
      <div class="page-sub">Your account details</div></div>
    <div class="profile-banner">
      <div class="profile-av">${initials(user.name)}</div>
      <div>
        <div class="profile-name">${esc(user.name)}</div>
        <div class="profile-email">${esc(user.email)}</div>
        <div style="display:flex;gap:.5rem;margin-top:6px;flex-wrap:wrap">
          <span class="badge badge-blue">Student</span>
          <span class="badge badge-violet">📚 ${esc(sem)}</span>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📋 Details</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Full Name</div>
          <div class="detail-val">${esc(user.name)}</div></div>
        <div class="detail-item"><div class="detail-label">Email</div>
          <div class="detail-val">${esc(user.email)}</div></div>
        <div class="detail-item"><div class="detail-label">Role</div>
          <div class="detail-val">Student</div></div>
        <div class="detail-item"><div class="detail-label">Class / Semester</div>
          <div class="detail-val" style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</div></div>
      </div>
    </div>`;

  // ── Attendance ──
  document.getElementById('sec-attendance').innerHTML = `
    <div class="page-head"><div class="page-title">Attendance</div>
      <div class="page-sub">Your attendance — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📅 Overview</div>
        ${hasAtt ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(att)}">${att}%</div>
            <div class="score-label">Overall Attendance</div>
            ${valBadge(att)}
          </div>${progBar(att)}` : `<div class="empty"><span class="empty-ico">📅</span>No attendance recorded yet.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📈 Summary</div>
        <div class="info-list">
          <div class="info-row"><span class="info-key">Percentage</span>
            <span class="info-val">${hasAtt?att+'%':'—'}</span></div>
          <div class="info-row"><span class="info-key">Required Min.</span>
            <span class="info-val">75%</span></div>
          <div class="info-row"><span class="info-key">Exam Eligibility</span>
            <span class="info-val">${hasAtt?(att>=75?'✅ Eligible':'❌ Not Eligible'):'—'}</span></div>
          <div class="info-row"><span class="info-key">Status</span>
            <span class="info-val">${hasAtt?(att>=75?'Good':att>=50?'Warning':'Critical'):'Pending'}</span></div>
        </div>
      </div>
    </div>`;

  // ── Marks ──
  document.getElementById('sec-marks').innerHTML = `
    <div class="page-head"><div class="page-title">Marks</div>
      <div class="page-sub">Academic performance — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📊 Score</div>
        ${hasMark ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(mark)}">${mark}%</div>
            <div class="score-label">Overall Marks</div>
            ${valBadge(mark)}
          </div>${progBar(mark)}` : `<div class="empty"><span class="empty-ico">📊</span>No marks recorded yet.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📋 Grade Card</div>
        <div class="info-list">
          <div class="info-row"><span class="info-key">Score</span>
            <span class="info-val">${hasMark?mark+'%':'—'}</span></div>
          <div class="info-row"><span class="info-key">Grade</span>
            <span class="info-val">${hasMark?(mark>=75?'A':mark>=60?'B':mark>=50?'C':mark>=40?'D':'F'):'—'}</span></div>
          <div class="info-row"><span class="info-key">Performance</span>
            <span class="info-val">${hasMark?(mark>=75?'Excellent':mark>=60?'Good':mark>=50?'Satisfactory':'Needs Improvement'):'—'}</span></div>
          <div class="info-row"><span class="info-key">Pass/Fail</span>
            <span class="info-val">${hasMark?(mark>=40?'✅ Pass':'❌ Fail'):'—'}</span></div>
        </div>
      </div>
    </div>`;

  // ── Notes ──
  document.getElementById('sec-notes').innerHTML = `
    <div class="page-head"><div class="page-title">Notes</div>
      <div class="page-sub">Study materials from faculty — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="card">
      <div class="card-title">📓 My Notes
        <span class="badge badge-blue" style="margin-left:auto">${notes.length}</span>
      </div>
      ${notes.length
        ? `<div class="item-list">${notes.map(n=>itemRowWithDownload('📄',n)).join('')}</div>`
        : `<div class="empty"><span class="empty-ico">📓</span>No notes uploaded yet.</div>`}
    </div>`;

  // ── Assignments ──
  document.getElementById('sec-assignments').innerHTML = `
    <div class="page-head"><div class="page-title">Assignments</div>
      <div class="page-sub">Assignments from faculty — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="card">
      <div class="card-title">📝 My Assignments
        <span class="badge badge-violet" style="margin-left:auto">${asgn.length}</span>
      </div>
      ${asgn.length
        ? `<div class="item-list">${asgn.map(a=>itemRowWithDownload('📋',a)).join('')}</div>`
        : `<div class="empty"><span class="empty-ico">📝</span>No assignments yet.</div>`}
    </div>`;

  // ── Lab Reports ──
  document.getElementById('sec-lab').innerHTML = `
    <div class="page-head"><div class="page-title">Lab Reports</div>
      <div class="page-sub">Lab work from faculty — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="card">
      <div class="card-title">🔬 My Lab Reports
        <span class="badge badge-green" style="margin-left:auto">${lab.length}</span>
      </div>
      ${lab.length
        ? `<div class="item-list">${lab.map(l=>itemRowWithDownload('🧪',l)).join('')}</div>`
        : `<div class="empty"><span class="empty-ico">🔬</span>No lab reports yet.</div>`}
    </div>`;
}

function itemRow(icon, item) {
  return `<div class="item-row">
    <div class="item-row-left">
      <span class="item-row-icon">${icon}</span>
      <span class="item-row-text">${esc(item.text||item)}</span>
    </div>
    <span class="item-row-date">${item.date?fmtDate(item.date):''}</span>
  </div>`;
}

function itemRowWithDownload(icon, item) {
  const hasFile = !!(item.fileData);
  return `<div class="item-row">
    <div class="item-row-left">
      <span class="item-row-icon">${hasFile?'📎':icon}</span>
      <div style="min-width:0">
        <div class="item-row-text">${esc(item.text||item)}</div>
        ${hasFile?`<div style="font-size:.72rem;color:var(--muted)">${esc(item.fileName||'')} · ${fmtSize(item.fileSize||0)}</div>`:''}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      ${hasFile?`<a href="${item.fileData}" download="${esc(item.fileName||'file')}" class="btn btn-outline btn-sm">⬇ Download</a>`:''}
      <span class="item-row-date">${item.date?fmtDate(item.date):''}</span>
    </div>
  </div>`;
}