// ─────────────────────────────────────────
// auth.js — Authentication for Student Sphere
// Connects to real backend API
// ─────────────────────────────────────────

const API = 'https://studentsphere-backend-g4wj.onrender.com/api';

const ADMIN_EMAIL = 'admin@studentsphere.com';
const ADMIN_PASS  = 'admin123';

// kept for compatibility — backend seeds admin automatically
function seedAdmin() {}

// ── Login page ──
function initLogin() {
  const u = SS.get('ss_current_user');
  if (u) { goDash(u.role); return; }

  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert('auth-alert', data.msg || 'Login failed.', 'error');
        return;
      }

      // Store token and user info
      sessionStorage.setItem('ss_token', data.token);
      SS.set('ss_current_user', data.user);

      showAlert('auth-alert', `Welcome, ${data.user.name}! Redirecting…`, 'success');
      setTimeout(() => goDash(data.user.role), 900);

    } catch (err) {
      showAlert('auth-alert', 'Cannot reach server. Make sure backend is running.', 'error');
    }
  });
}

// ── Register page ──
function initRegister() {
  const u = SS.get('ss_current_user');
  if (u) { goDash(u.role); return; }

  document.getElementById('reg-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name     = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const pass     = document.getElementById('r-pass').value;
    const conf     = document.getElementById('r-conf').value;
    const role     = document.getElementById('r-role').value;
    const semester = document.getElementById('r-semester')?.value || null;

    if (pass !== conf) {
      showAlert('auth-alert', 'Passwords do not match.', 'error');
      return;
    }

    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password: pass, role, semester })
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert('auth-alert', data.msg || 'Registration failed.', 'error');
        return;
      }

      showAlert('auth-alert', 'Account created! Redirecting to login…', 'success');
      document.getElementById('reg-form').reset();
      setTimeout(() => window.location.href = 'login.html', 1500);

    } catch (err) {
      showAlert('auth-alert', 'Cannot reach server. Make sure backend is running.', 'error');
    }
  });
}

// ── Get current token for API calls ──
function getToken() {
  return sessionStorage.getItem('ss_token');
}