// ────────────────────────────────────────────
// student.js — Student dashboard
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

  const [data, notices] = await Promise.all([apiGetMyData(), apiGetNotices()]);
  renderStudentSections(user, data, notices);
}

// ════════════════════════════════════════════
// FILE VIEWER — fullscreen, zoom, mobile-safe
// Zoom uses CSS zoom on <img> for images.
// PDFs open in iframe (no zoom clipping).
// ════════════════════════════════════════════
let _fvZoom = 1;
let _fvIsImage = false;

function openFileViewer(fileData, fileName) {
  // Detect file type from data URL or file name
  const isImage = fileData
    ? /^data:image\//i.test(fileData)
    : /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName || '');
  _fvIsImage = isImage;

  let overlay = document.getElementById('ss-file-viewer');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ss-file-viewer';
    overlay.className = 'file-viewer-overlay';
    overlay.innerHTML = `
      <div class="file-viewer-header">
        <span class="file-viewer-name" id="fv-name"></span>
        <div class="file-viewer-controls">
          <button class="fv-zoom-btn" id="fv-zoom-out" title="Zoom Out">−</button>
          <span class="fv-zoom-label" id="fv-zoom-label">100%</span>
          <button class="fv-zoom-btn" id="fv-zoom-in" title="Zoom In">+</button>
          <button class="fv-zoom-btn" id="fv-zoom-reset" title="Reset Zoom" style="font-size:.7rem;padding:0 4px;width:auto;min-width:32px">↺</button>
          <button class="btn btn-outline btn-sm" id="fv-download" style="margin-left:.25rem">⬇ Download</button>
          <button class="btn btn-ghost btn-sm" id="fv-close">✕</button>
        </div>
      </div>
      <div class="file-viewer-body" id="fv-body"></div>`;
    document.body.appendChild(overlay);
    document.getElementById('fv-close').onclick      = closeFileViewer;
    document.getElementById('fv-zoom-in').onclick    = () => fvZoom(0.25);
    document.getElementById('fv-zoom-out').onclick   = () => fvZoom(-0.25);
    document.getElementById('fv-zoom-reset').onclick = () => { _fvZoom = 1; fvApplyZoom(); };
  }

  _fvZoom = 1;
  document.getElementById('fv-name').textContent = fileName || 'File Viewer';
  document.getElementById('fv-download').onclick = () => downloadFile(fileData, fileName);

  // Build content area fresh each open
  const body = document.getElementById('fv-body');
  if (isImage) {
    // Image: use <img> with CSS zoom — no clipping, scroll works naturally
    body.innerHTML = `<div class="fv-img-wrap" id="fv-img-wrap">
      <img id="fv-img" src="${fileData}" alt="${fileName||''}"
        style="display:block;max-width:100%;height:auto;border-radius:4px;">
    </div>`;
    // Show zoom controls for images
    document.getElementById('fv-zoom-in').style.display  = '';
    document.getElementById('fv-zoom-out').style.display = '';
    document.getElementById('fv-zoom-reset').style.display = '';
    document.getElementById('fv-zoom-label').style.display = '';
  } else {
    // PDF / other: full iframe, browser handles its own zoom
    body.innerHTML = `<iframe id="fv-frame"
      src="${fileData}"
      style="width:100%;height:100%;min-height:calc(100vh - 60px);border:none;display:block;">
    </iframe>`;
    // Hide zoom controls for PDFs (browser PDF viewer has its own zoom)
    document.getElementById('fv-zoom-in').style.display  = 'none';
    document.getElementById('fv-zoom-out').style.display = 'none';
    document.getElementById('fv-zoom-reset').style.display = 'none';
    document.getElementById('fv-zoom-label').style.display = 'none';
  }

  fvApplyZoom();
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeFileViewer() {
  const overlay = document.getElementById('ss-file-viewer');
  if (!overlay) return;
  overlay.classList.remove('show');
  const body = document.getElementById('fv-body');
  if (body) body.innerHTML = ''; // clear iframe/img to stop loading
  document.body.style.overflow = '';
}

function fvZoom(delta) {
  _fvZoom = Math.min(4, Math.max(0.25, _fvZoom + delta));
  fvApplyZoom();
}

function fvApplyZoom() {
  const label = document.getElementById('fv-zoom-label');
  if (label) label.textContent = Math.round(_fvZoom * 100) + '%';

  if (!_fvIsImage) return; // PDFs: no zoom manipulation

  const img  = document.getElementById('fv-img');
  const wrap = document.getElementById('fv-img-wrap');
  if (!img || !wrap) return;

  // CSS zoom: unlike transform:scale, zoom expands the element in the layout
  // so the scrollable area grows correctly — no clipping at any zoom level
  img.style.zoom       = _fvZoom;
  img.style.maxWidth   = 'none'; // allow image to grow beyond container when zoomed in
  img.style.width      = (100 / _fvZoom) + '%'; // keep image filling width at zoom=1
  if (_fvZoom <= 1) {
    img.style.width    = '100%';
    img.style.maxWidth = '100%';
  }
}

function downloadFile(fileData, fileName) {
  const a = document.createElement('a');
  a.href = fileData;
  a.download = fileName || 'download';
  a.click();
}

// ════════════════════════════════════════════
// SUBMISSION HELPERS
// ════════════════════════════════════════════
function getSubmissionStatus(item, submissions, type) {
  if (!item._id) return { label: 'Pending', cls: 'badge-amber' };
  const sub = (submissions || []).find(
    s => s.itemId === String(item._id) && s.type === type
  );
  if (!sub) {
    const now = new Date();
    if (item.dueDate && now > new Date(item.dueDate) && !item.allowLate)
      return { label: 'Closed', cls: 'badge-rose' };
    return { label: 'Pending', cls: 'badge-amber' };
  }
  return sub.status === 'late'
    ? { label: 'Submitted (Late)', cls: 'badge-amber' }
    : { label: 'Submitted ✓',     cls: 'badge-green' };
}

function dueDateStr(item) {
  if (!item.dueDate) return '';
  const due  = new Date(item.dueDate);
  const past = new Date() > due;
  return `Due: ${fmtDate(item.dueDate)}${past ? ' <span style="color:var(--rose)">(Past)</span>' : ''}`;
}

// ════════════════════════════════════════════
// RENDER ALL SECTIONS
// ════════════════════════════════════════════
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

  // ── Notices ticker (top of overview) ──
  const noticeTickerHtml = notices.length ? `
    <div class="notice-ticker notices-highlight">
      <span class="notice-ticker-label">📢 Notice</span>
      <span class="notice-ticker-text">${esc(notices[0].title)} — ${esc(notices[0].body.substring(0,100))}${notices[0].body.length>100?'…':''}</span>
    </div>` : '';

  // ── Overview ──
  document.getElementById('sec-overview').innerHTML = `
    <div class="page-head">
      <div class="page-title">Welcome back, ${esc(user.name.split(' ')[0])} 👋</div>
      <div class="page-sub">Academic snapshot &nbsp;·&nbsp;
        <span style="color:var(--accent);font-weight:600">📚 ${esc(sem)}</span></div>
    </div>
    ${noticeTickerHtml}
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-title">📢 Latest Notices
        <span class="badge badge-violet" style="margin-left:auto">${notices.length}</span>
      </div>
      ${notices.slice(0,3).map(n=>`
        <div class="notice-card-mini">
          <div class="notice-mini-title">${esc(n.title)}</div>
          <div class="notice-mini-meta">${esc(n.author)} · ${fmtDate(n.createdAt)}</div>
        </div>`).join('') || `<div class="empty" style="padding:1rem">No notices yet.</div>`}
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
          </p>`
        : `<div class="empty"><span class="empty-ico">📅</span>No data yet — faculty will update this.</div>`}
      </div>
      <div class="card">
        <div class="card-title">📊 Marks</div>
        ${hasMark ? `
          <div class="score-big">
            <div class="score-num" style="color:${scoreColor(mark)}">${mark}%</div>
            <div class="score-label">Overall Score · Grade ${mark>=75?'A':mark>=60?'B':mark>=50?'C':mark>=40?'D':'F'}</div>
          </div>
          ${progBar(mark)}`
        : `<div class="empty"><span class="empty-ico">📊</span>No data yet — faculty will update this.</div>`}
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
        <div class="card-title">📝 Pending Assignments
          <span class="badge badge-amber" style="margin-left:auto">${asgn.filter(a=>!subs.find(s=>s.itemId===String(a._id)&&s.type==='assignment')).length}</span>
        </div>
        ${asgn.filter(a=>!subs.find(s=>s.itemId===String(a._id)&&s.type==='assignment')).slice(0,3).map(a=>`
          <div class="notice-card-mini">
            <div class="notice-mini-title">${esc(a.text||'')}</div>
            <div class="notice-mini-meta">${a.dueDate?'Due: '+fmtDate(a.dueDate):'No due date'}</div>
          </div>`).join('') || `<div class="empty" style="padding:1rem">No pending assignments.</div>`}
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
      <div class="page-sub">Your attendance — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
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
      <div class="page-sub">Academic performance — <span style="color:var(--accent)">📚 ${esc(sem)}</span></div></div>
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
        ? `<div class="item-list">${asgn.map(a=>submittableRow('📝', a, subs, 'assignment')).join('')}</div>`
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
        ? `<div class="item-list">${lab.map(l=>submittableRow('🧪', l, subs, 'lab')).join('')}</div>`
        : `<div class="empty"><span class="empty-ico">🔬</span>No lab reports yet.</div>`}
    </div>`;

  // ── Notices ──
  const noticesEl = document.getElementById('sec-notices');
  if (noticesEl) {
    noticesEl.innerHTML = `
      <div class="page-head"><div class="page-title">📢 Notice Board</div>
        <div class="page-sub">Announcements from faculty &amp; administration</div></div>
      <div class="card">
        <div class="card-title">All Notices
          <span class="badge badge-violet" style="margin-left:auto">${notices.length}</span>
        </div>
        ${notices.length
          ? notices.map(n=>`
            <div class="notice-card">
              <div class="notice-card-top">
                <div class="notice-card-title">${esc(n.title)}</div>
                <span class="badge ${n.semester==='All'?'badge-gray':'badge-blue'}">${esc(n.semester||'All')}</span>
              </div>
              <div class="notice-card-body">${esc(n.body)}</div>
              <div class="notice-card-meta">👤 ${esc(n.author)} &nbsp;·&nbsp; 🗓 ${fmtDate(n.createdAt)}</div>
            </div>`).join('')
          : `<div class="empty"><span class="empty-ico">📢</span>No notices posted yet.</div>`}
      </div>`;
  }
}

// ════════════════════════════════════════════
// ROW HELPERS
// ════════════════════════════════════════════
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
  // Escape fileData safely for attribute — store in data attr instead of inline
  const safeId = 'fd-' + Math.random().toString(36).slice(2,8);
  if (hasFile) window[safeId] = { data: item.fileData, name: item.fileName };
  return `<div class="item-row">
    <div class="item-row-left">
      <span class="item-row-icon">${hasFile?'📎':icon}</span>
      <div style="min-width:0">
        <div class="item-row-text">${esc(item.text||item)}</div>
        ${hasFile?`<div style="font-size:.72rem;color:var(--muted)">${esc(item.fileName||'')} · ${fmtSize(item.fileSize||0)}</div>`:''}
      </div>
    </div>
    <div class="item-row-right" style="gap:.4rem">
      ${hasFile?`
        <button class="btn btn-outline btn-sm" onclick="openFileViewer(window['${safeId}'].data,window['${safeId}'].name)">👁 View</button>
        <button class="btn btn-ghost btn-sm" onclick="downloadFile(window['${safeId}'].data,window['${safeId}'].name)">⬇</button>`:''}
    </div>
  </div>`;
}

function submittableRow(icon, item, subs, type) {
  const hasFile  = !!(item.fileData);
  const status   = getSubmissionStatus(item, subs, type);
  const submitted = status.label.startsWith('Submitted');
  const closed    = status.label === 'Closed';
  const canSubmit = !submitted && !closed;
  const safeId    = 'fd-' + Math.random().toString(36).slice(2,8);
  const safeItemId = String(item._id || '');
  const safeDue    = item.dueDate || '';
  const safeTitle  = (item.text || '').replace(/'/g, '&#39;');
  if (hasFile) window[safeId] = { data: item.fileData, name: item.fileName };

  return `<div class="asgn-row">
    <div class="asgn-row-top">
      <div class="item-row-left" style="flex:1">
        <span class="item-row-icon">${hasFile?'📎':icon}</span>
        <div style="min-width:0">
          <div class="item-row-text">${esc(item.text||'')}</div>
          ${item.dueDate?`<div style="font-size:.75rem;color:var(--muted);margin-top:2px">${dueDateStr(item)}
            ${item.allowLate?'<span style="color:var(--green);margin-left:.4rem">· Late allowed</span>':''}</div>`:''}
        </div>
      </div>
      <span class="badge ${status.cls}">${status.label}</span>
    </div>
    <div class="asgn-row-actions">
      ${hasFile?`
        <button class="btn btn-outline btn-sm" onclick="openFileViewer(window['${safeId}'].data,window['${safeId}'].name)">👁 View</button>
        <button class="btn btn-ghost btn-sm" onclick="downloadFile(window['${safeId}'].data,window['${safeId}'].name)">⬇ Download</button>`:''}
      ${canSubmit?`
        <label class="btn btn-primary btn-sm" style="cursor:pointer;margin:0">
          📤 Submit Work
          <input type="file" style="display:none"
            onchange="handleSubmit(this,'${safeItemId}','${safeTitle}','${safeDue}','${type}')">
        </label>`:''}
    </div>
  </div>`;
}

async function handleSubmit(input, itemId, title, dueDate, type) {
  const file = input.files[0];
  if (!file) return;
  const label = input.closest('label');
  const origText = label.textContent.trim();
  label.textContent = 'Uploading…';

  const fileData = await fileToBase64(file);
  const result = await apiSubmitWork({
    type, itemId, itemTitle: title,
    fileName: file.name, fileData, fileSize: file.size, dueDate
  });

  if (result.msg === 'Submitted successfully' || result.status) {
    toast('✅ Submitted! Status: ' + (result.status || 'submitted'), 'success');
    const user = SS.get('ss_current_user');
    const [data, notices] = await Promise.all([apiGetMyData(), apiGetNotices()]);
    renderStudentSections(user, data, notices);
    switchSec(type === 'assignment' ? 'assignments' : 'lab');
  } else {
    toast(result.msg || 'Submission failed', 'error');
    label.textContent = origText;
  }
}
