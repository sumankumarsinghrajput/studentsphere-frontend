// ─────────────────────────────────────────────────
// utils.js  —  Student Sphere shared utilities
// ─────────────────────────────────────────────────

/* ── Apply saved theme immediately to prevent flash ── */
(function () {
  const t = localStorage.getItem('ss_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

/* Storage */
const SS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: k => localStorage.removeItem(k),
};

/* Initials */
const initials = name => name
  ? name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
  : '?';

/* Date format */
const fmtDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* Email validate */
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* Now ISO */
const nowISO = () => new Date().toISOString();

/* HTML escape */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str || '');
  return d.innerHTML;
}

/* Progress bar */
function progBar(val) {
  const cls = val >= 75 ? 'prog-green' : val >= 50 ? 'prog-amber' : 'prog-rose';
  return `<div class="prog-track"><div class="prog-bar ${cls}" style="width:${val}%"></div></div>`;
}

/* Badge colour by value */
function valBadge(val) {
  const cls = val >= 75 ? 'badge-green' : val >= 50 ? 'badge-amber' : 'badge-rose';
  return `<span class="badge ${cls}">${val}%</span>`;
}

/* Score colour */
function scoreColor(val) {
  return val >= 75 ? 'var(--green)' : val >= 50 ? 'var(--amber)' : 'var(--rose)';
}

/* ── File download helper (used in student.js itemRowWithDownload) ── */
function downloadFile(dataUrl, fileName) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── Semester / Class list ── */
const SEMESTERS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
];
const semesterOpts = (selected = '') =>
  SEMESTERS.map(s => `<option value="${s}"${s === selected ? ' selected' : ''}>${s}</option>`).join('');

/* ── File size formatter ── */
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ── File to base64 ── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Toast ── */
function createToastWrap() {
  if (document.getElementById('toast-wrap')) return;
  const w = document.createElement('div');
  w.id = 'toast-wrap';
  w.className = 'toast-wrap';
  document.body.appendChild(w);
}
function toast(msg, type = 'info') {
  createToastWrap();
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-wrap').appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(14px)';
    t.style.transition = 'all .3s';
    setTimeout(() => t.remove(), 320);
  }, 3200);
}

/* ── Alert inside element ── */
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { if (el) el.innerHTML = ''; }, 4500);
}

/* ── Auth guard ── */
function requireRole(role) {
  const u = SS.get('ss_current_user');
  const token = sessionStorage.getItem('ss_token');
  if (!u || !token) { window.location.href = 'login.html'; return null; }
  if (role && u.role !== role) { window.location.href = 'login.html'; return null; }
  return u;
}

/* ── Logout ── */
function logout() {
  SS.remove('ss_current_user');
  sessionStorage.removeItem('ss_token');
  window.location.href = 'login.html';
}

/* ── Redirect by role ── */
function goDash(role) {
  const m = { student: 'student.html', faculty: 'faculty.html', admin: 'admin.html' };
  window.location.href = m[role] || 'login.html';
}

/* ── Get students/faculty from local cache (legacy helpers) ── */
function getStudents() { return (SS.get('ss_users') || []).filter(u => u.role === 'student'); }
function getFaculty()  { return (SS.get('ss_users') || []).filter(u => u.role === 'faculty'); }
function getStudentsBySemester(sem) { return getStudents().filter(s => s.semester === sem); }
function studentOpts(semester) {
  const list = semester ? getStudentsBySemester(semester) : getStudents();
  return list.map(s => `<option value="${esc(s.email)}">${esc(s.name)} (${esc(s.email)})</option>`).join('');
}

/* ══════════════════════════════════════════════
   THEME SYSTEM
══════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('ss_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  _updateToggleBtns(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('ss_theme', next);
  document.documentElement.setAttribute('data-theme', next);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.classList.add('spinning');
    setTimeout(() => {
      _updateToggleBtns(next);
      btn.classList.remove('spinning');
    }, 200);
  });
}

function _updateToggleBtns(theme) {
  document.querySelectorAll('.theme-toggle .t-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}

function _themeToggleHTML() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const icon  = theme === 'dark' ? '☀️' : '🌙';
  const label = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  return `<button class="theme-toggle" onclick="toggleTheme()" title="${label}" aria-label="${label}"><span class="t-icon">${icon}</span></button>`;
}

/* ── Render navbar user info (dashboard pages) ── */
function renderNavUser(user) {
  const el = document.getElementById('nav-right');
  if (!el || !user) return;
  el.innerHTML = `
    <div class="nav-user-info">
      <div class="nav-avatar">${initials(user.name)}</div>
      <span class="nav-username">${esc(user.name.split(' ')[0])}</span>
      <span class="role-tag role-${user.role}">${user.role}</span>
    </div>
    ${_themeToggleHTML()}
    <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`;
}

/* ── Sidebar menus ── */
const MENUS = {
  student: [
    { id: 'overview',    ico: '🏠', lbl: 'Overview'    },
    { id: 'notices',     ico: '📢', lbl: 'Notices'     },
    { id: 'profile',     ico: '👤', lbl: 'Profile'     },
    { id: 'attendance',  ico: '📅', lbl: 'Attendance'  },
    { id: 'marks',       ico: '📊', lbl: 'Marks'       },
    { id: 'notes',       ico: '📓', lbl: 'Notes'       },
    { id: 'assignments', ico: '📝', lbl: 'Assignments' },
    { id: 'lab',         ico: '🔬', lbl: 'Lab Reports' },
  ],
  faculty: [
    { id: 'overview',    ico: '🏠', lbl: 'Overview'    },
    { id: 'notices',     ico: '📢', lbl: 'Notices'     },
    { id: 'students',    ico: '👥', lbl: 'Students'    },
    { id: 'attendance',  ico: '📅', lbl: 'Attendance'  },
    { id: 'marks',       ico: '📊', lbl: 'Marks'       },
    { id: 'notes',       ico: '📓', lbl: 'Notes'       },
    { id: 'assignments', ico: '📝', lbl: 'Assignments' },
    { id: 'lab',         ico: '🔬', lbl: 'Lab Reports' },
  ],
  admin: [
    { id: 'overview',   ico: '🏠', lbl: 'Overview'                       },
    { id: 'notices',    ico: '📢', lbl: 'Notices'                        },
    { id: 'pending',    ico: '⏳', lbl: 'Pending Approvals', badge: true },
    { id: 'students',   ico: '👨‍🎓', lbl: 'Students'              },
    { id: 'faculty',    ico: '👩‍🏫', lbl: 'Faculty'               },
    { id: 'all-users',  ico: '👥', lbl: 'All Users'                      },
    { id: 'add-user',   ico: '➕', lbl: 'Add User'                       },
  ],
};

function buildSidebar(role, user) {
  const sbName  = document.getElementById('sb-name');
  const sbEmail = document.getElementById('sb-email');
  const sbAv    = document.getElementById('sb-avatar');
  const sbBadge = document.getElementById('sb-badge');
  const sbNav   = document.getElementById('sb-nav');
  if (sbName)  sbName.textContent  = user.name;
  if (sbEmail) sbEmail.textContent = user.email;
  if (sbAv)    sbAv.textContent    = initials(user.name);
  if (sbBadge) { sbBadge.className = `role-tag role-${role}`; sbBadge.textContent = role; }
  if (sbNav) {
    sbNav.innerHTML = (MENUS[role] || []).map(m =>
      `<button class="sb-item" data-sec="${m.id}">
        <span class="sb-ico">${m.ico}</span>
        ${m.lbl}
        ${m.badge ? `<span class="sb-badge" id="sb-badge-${m.id}" style="display:none">0</span>` : ''}
      </button>`
    ).join('');
  }
}

/* ── Section switching ── */
function switchSec(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  const p = document.getElementById('sec-' + id);
  if (p) p.classList.add('active');
  document.querySelectorAll(`[data-sec="${id}"]`).forEach(b => b.classList.add('active'));
}

function initSbNav() {
  document.querySelectorAll('.sb-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.sec) switchSec(btn.dataset.sec);
      if (window._closeSidebar) window._closeSidebar();
      else document.querySelector('.sidebar')?.classList.remove('open');
    });
  });
}

/* ════════════════════════════════════════════════
   HAMBURGER + THEME TOGGLE INIT
   Called on every page (public + dashboard).
════════════════════════════════════════════════ */
function initHam() {
  // Always sync theme first
  initTheme();

  /* ── PUBLIC pages: inject theme toggle into nav-right ──
     Condition: page has #ham-btn (public hamburger), not #sb-toggle (dashboard).
     main.js may rebuild nav-right for logged-in users, so we inject AFTER
     DOMContentLoaded completes — this function is called from DOMContentLoaded. */
  const isDashboard = !!document.getElementById('sb-toggle');

  if (!isDashboard) {
    const pubNavRight = document.querySelector('.nav > .nav-right');
    if (pubNavRight && !pubNavRight.querySelector('.theme-toggle')) {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const tt = document.createElement('button');
      tt.className   = 'theme-toggle';
      tt.onclick     = toggleTheme;
      tt.title       = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      tt.setAttribute('aria-label', tt.title);
      tt.innerHTML   = `<span class="t-icon">${theme === 'dark' ? '☀️' : '🌙'}</span>`;
      // Insert as first child so it appears before Sign In / Get Started
      pubNavRight.insertBefore(tt, pubNavRight.firstChild);
    }
  }

  /* ── PUBLIC nav hamburger (#ham-btn → .nav-drawer) ── */
  const btn    = document.getElementById('ham-btn');
  const drawer = document.getElementById('nav-drawer');
  if (btn && drawer) {
    btn.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      btn.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        btn.classList.remove('active');
      });
    });
    document.addEventListener('click', e => {
      if (
        drawer.classList.contains('open') &&
        !drawer.contains(e.target) &&
        e.target !== btn &&
        !btn.contains(e.target)
      ) {
        drawer.classList.remove('open');
        btn.classList.remove('active');
      }
    });
  }

  /* ── DASHBOARD sidebar hamburger (#sb-toggle → .sidebar) ── */
  const sbBtn = document.getElementById('sb-toggle');
  const sb    = document.querySelector('.sidebar');
  if (sbBtn && sb) {
    let backdrop = document.getElementById('sb-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id        = 'sb-backdrop';
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    function openSidebar() {
      sb.classList.add('open');
      backdrop.classList.add('show');
      sbBtn.classList.add('active');
      sbBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sb.classList.remove('open');
      backdrop.classList.remove('show');
      sbBtn.classList.remove('active');
      sbBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    sbBtn.addEventListener('click', () => {
      sb.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);

    // Swipe left to close
    let touchStartX = 0;
    sb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    sb.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientX - touchStartX < -50) closeSidebar();
    }, { passive: true });

    window._closeSidebar = closeSidebar;
  }
}

/* ════════════════════════════════════════════════
   EASTER EGG
   5 rapid clicks on nav-brand (< 1s each) → popup.
   Any pause ≥ 1s → navigate to index.html.
════════════════════════════════════════════════ */
function initEasterEgg() {
  const logo = document.querySelector('.nav-brand');
  if (!logo) return;

  let clicks   = 0;
  let navTimer = null;

  logo.addEventListener('click', function (e) {
    e.preventDefault();
    clearTimeout(navTimer);
    clicks++;

    if (clicks >= 5) {
      clicks = 0;
      document.getElementById('egg-overlay')?.classList.add('show');
      return;
    }

    navTimer = setTimeout(function () {
      clicks = 0;
      window.location.href = 'index.html';
    }, 1000);
  });

  document.getElementById('egg-close')?.addEventListener('click', function () {
    document.getElementById('egg-overlay')?.classList.remove('show');
  });
}
