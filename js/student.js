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

  const data    = await apiGetMyData();
  const notices = await apiGetNotices();
  renderStudentSections(user, data, notices);
}

// ── File viewer overlay ──
function openFileViewer(fileData, fileName) {
  let viewer = document.getElementById('ss-file-viewer');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'ss-file-viewer';
    viewer.className = 'file-viewer-overlay';
    viewer.innerHTML = `
      <div class="file-viewer-box">
        <div class="file-viewer-header">
          <span class="file-viewer-name" id="fv-name"></span>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn-outline btn-sm" id="fv-download">⬇ Download</button>
            <button class="btn btn-ghost btn-sm" id="fv-close">✕ Close</button>
          </div>
        </div>
        <div class="file-viewer-body">
          <iframe id="fv-frame" class="file-viewer-frame" src=""></iframe>
        </div>
      </div>`;
    document.body.appendChild(viewer);
    document.getElementById('fv-close').onclick = () => {
      viewer.classList.remove('show');
      document.getElementById('fv-frame').src = '';
    };
    viewer.addEventListener('click', e => {
      if (e.target === viewer) {
        viewer.classList.remove('show');
        document.getElementById('fv-frame').src = '';
      }
    });
  }
  document.getElementById('fv-name').textContent = fileName || 'File Viewer';
  document.getElementById('fv-frame').src = fileData;
  document.getElementById('fv-download').onclick = () => downloadFile(fileData, fileName);
  viewer.classList.add('show');
}

function downloadFile(fileData, fileName) {
  const a = document.createElement('a');
  a.href = fileData;
  a.download = fileName || 'download';
  a.click();
}

// ── Submission status helper ──
function submissionStatus(asgn, submissions) {
  if (!asgn._id) return { label: 'Pending', cls: 'badge-amber' };
  const sub = (submissions || []).find(s => s.assignmentId === String(asgn._id));
  if (!sub) {
    if (asgn.dueDate && new Date() > new Date(asgn.dueDate) && !asgn.allowLate)
      return { label: 'Closed', cls: 'badge-rose' };
    return { label: 'Pending', cls: 'badge-amber' };
  }
  return sub.status === 'late'
    ? { label: 'Submitted (Late)', cls: 'badge-amber' }
    : { label: 'Submitted ✓', cls: 'badge-green' };
}

function renderStudentSections(user, data, notices) {
  const sem   = user.semester || 'N/A';
  const att   = data.attendance ?? null;
  const mark  = data.marks ?? null;
  const notes = data.notes || [];
  const asgn  = data.assignments || [];
  const lab   = data.lab || [];
  const subs  = data.submissions || [];

  const hasAtt  = att !== null && att !== undefined;
  const hasMark = mark !== null && mark !== undefined;

  // ── Overview ──
  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Welcome back, ${esc(user.name.split(' ')[0])} 👋</div>
      <div class="page-sub">Academic snapshot &nbsp;·&nbsp;
        <span style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</span></div>
    </div>
    ${notices.length ? `
    <div class="notice-ticker">
      <span class="notice-ticker-label">📢 Notice</span>
      <span class="notice-ticker-text">${esc(notices[0].title)} — ${esc(notices[0].body.substring(0,80))}${notices[0].body.length>80?'…':''}</span>
    </div>` : ''}
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
          </p>`
        : `<div class="empty"><span class="empty-ico">📅</span>No data yet.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📊 Marks</div>
        ${hasMark ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(mark)}">${mark}%</div>
            <div class="score-label">Grade ${mark>=75?'A':mark>=60?'B':mark>=50?'C':mark>=40?'D':'F'}</div>
          </div>
          ${progBar(mark)}`
        : `<div class="empty"><span class="empty-ico">📊</span>No data yet.</div>`}
      </div>
    </div>
    <div class="grid-2" style="margin-top:1.25rem">
      <div class="card">
        <div class="card-title">📓 Recent Notes
          <span class="badge badge-blue" style="margin-left:auto">${notes.length}</span>
        </div>
        ${notes.length
          ? `<div class="item-list">${notes.slice(-3).reverse().map(n=>itemRow('📄',n)).join('')}</div>`
          : `<div class="empty" style="padding:1rem">No notes yet.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📢 Notices
          <span class="badge badge-violet" style="margin-left:auto">${notices.length}</span>
        </div>
        ${notices.length
          ? notices.slice(0,3).map(n=>`
            <div class="notice-card-mini">
              <div class="notice-mini-title">${esc(n.title)}</div>
              <div class="notice-mini-meta">${esc(n.author)} · ${fmtDate(n.createdAt)}</div>
            </div>`).join('')
          : `<div class="empty" style="padding:1rem">No notices yet.</div>`}
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
        <div class="detail-item"><div class="detail-label">Semester</div>
          <div class="detail-val" style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</div></div>
      </div>
    </div>`;

  // ── Attendance ──
  document.getElementById('sec-attendance').innerHTML = `
    <div class="page-head"><div class="page-title">Attendance</div>
      <div class="page-sub">Semester: <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📅 Overview</div>
        ${hasAtt ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(att)}">${att}%</div>
            <div class="score-label">Overall Attendance</div>
            ${valBadge(att)}
          </div>${progBar(att)}`
        : `<div class="empty"><span class="empty-ico">📅</span>No attendance recorded yet.</div>`}
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
      <div class="page-sub">Semester: <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📊 Score</div>
        ${hasMark ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(mark)}">${mark}%</div>
            <div class="score-label">Overall Marks</div>
            ${valBadge(mark)}
          </div>${progBar(mark)}`
        : `<div class="empty"><span class="empty-ico">📊</span>No marks recorded yet.</div>`}
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
        ? `<div class="item-list">${notes.map(n=>itemRowWithViewer('📄',n)).join('')}</div>`
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
        ? `<div class="item-list">${asgn.map(a => asgnRowStudent(a, subs)).join('')}</div>`
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
        ? `<div class="item-list">${lab.map(l=>itemRowWithViewer('🧪',l)).join('')}</div>`
        : `<div class="empty"><span class="empty-ico">🔬</span>No lab reports yet.</div>`}
    </div>`;

  // ── Notices ──
  document.getElementById('sec-notices').innerHTML = `
    <div class="page-head"><div class="page-title">📢 Notice Board</div>
      <div class="page-sub">Announcements from faculty & admin</div></div>
    <div class="card">
      <div class="card-title">Notices
        <span class="badge badge-violet" style="margin-left:auto">${notices.length}</span>
      </div>
      ${notices.length
        ? notices.map(n => `
          <div class="notice-card">
            <div class="notice-card-top">
              <div class="notice-card-title">${esc(n.title)}</div>
              ${n.semester && n.semester !== 'All'
                ? `<span class="badge badge-blue">${esc(n.semester)}</span>`
                : `<span class="badge badge-gray">All Semesters</span>`}
            </div>
            <div class="notice-card-body">${esc(n.body)}</div>
            <div class="notice-card-meta">
              👤 ${esc(n.author)} &nbsp;·&nbsp; 🗓 ${fmtDate(n.createdAt)}
            </div>
          </div>`).join('')
        : `<div class="empty"><span class="empty-ico">📢</span>No notices posted yet.</div>`}
    </div>`;
}

// ── Item row helpers ──
function itemRow(icon, item) {
  return `<div class="item-row">
    <div class="item-row-left">
      <span class="item-row-icon">${icon}</span>
      <span class="item-row-text">${esc(item.text||item)}</span>
    </div>
    <span class="item-row-date">${item.date?fmtDate(item.date):''}</span>
  </div>`;
}

function itemRowWithViewer(icon, item) {
  const hasFile = !!(item.fileData);
  return `<div class="item-row">
    <div class="item-row-left">
      <span class="item-row-icon">${hasFile ? '📎' : icon}</span>
      <div style="min-width:0">
        <div class="item-row-text">${esc(item.text || item)}</div>
        ${hasFile ? `<div style="font-size:.72rem;color:var(--muted)">${esc(item.fileName||'')} · ${fmtSize(item.fileSize||0)}</div>` : ''}
      </div>
    </div>
    <div class="item-row-right" style="gap:.4rem">
      ${hasFile ? `
        <button class="btn btn-outline btn-sm"
          onclick="openFileViewer('${item.fileData.replace(/'/g,"\\'")}','${esc(item.fileName||'file')}')">
          👁 View
        </button>
        <button class="btn btn-ghost btn-sm"
          onclick="downloadFile('${item.fileData.replace(/'/g,"\\'")}','${esc(item.fileName||'file')}')">
          ⬇
        </button>` : ''}
    </div>
  </div>`;
}

function asgnRowStudent(item, subs) {
  const hasFile = !!(item.fileData);
  const status  = submissionStatus(item, subs);
  const alreadySubmitted = status.label.startsWith('Submitted');
  const isClosed = status.label === 'Closed';
  const canSubmit = !alreadySubmitted && !isClosed;
  const dueStr = item.dueDate ? `Due: ${fmtDate(item.dueDate)}` : 'No due date';

  return `<div class="item-row asgn-row" style="flex-direction:column;align-items:stretch;gap:.65rem">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
      <div class="item-row-left" style="flex:1">
        <span class="item-row-icon">📝</span>
        <div style="min-width:0">
          <div class="item-row-text">${esc(item.text||'')}</div>
          <div style="font-size:.75rem;color:var(--muted);margin-top:2px">
            ${dueStr}
            ${item.allowLate ? ' · <span style="color:var(--green)">Late submissions allowed</span>' : ''}
          </div>
        </div>
      </div>
      <span class="badge ${status.cls}">${status.label}</span>
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      ${hasFile ? `
        <button class="btn btn-outline btn-sm"
          onclick="openFileViewer('${item.fileData.replace(/'/g,"\\'")}','${esc(item.fileName||'assignment')}')">
          👁 View
        </button>
        <button class="btn btn-ghost btn-sm"
          onclick="downloadFile('${item.fileData.replace(/'/g,"\\'")}','${esc(item.fileName||'assignment')}')">
          ⬇ Download
        </button>` : ''}
      ${canSubmit ? `
        <label class="btn btn-primary btn-sm" style="cursor:pointer;margin:0">
          📤 Submit Work
          <input type="file" style="display:none"
            onchange="submitAssignment(this,'${String(item._id)}','${esc(item.text||'')}','${item.dueDate||''}')">
        </label>` : ''}
    </div>
  </div>`;
}

async function submitAssignment(input, assignmentId, title, dueDate) {
  const file = input.files[0];
  if (!file) return;
  const label = input.closest('label');
  label.textContent = 'Uploading…';

  const fileData = await fileToBase64(file);
  const result = await apiSubmitAssignment({
    assignmentId,
    assignmentTitle: title,
    fileName: file.name,
    fileData,
    fileSize: file.size,
    dueDate
  });

  if (result.msg === 'Submitted successfully') {
    toast(`✅ Submitted! Status: ${result.status}`, 'success');
    // Refresh data
    const data    = await apiGetMyData();
    const notices = await apiGetNotices();
    const user    = SS.get('ss_current_user');
    renderStudentSections(user, data, notices);
    switchSec('assignments');
  } else {
    toast(result.msg || 'Submission failed', 'error');
    label.textContent = '📤 Submit Work';
  }
}
