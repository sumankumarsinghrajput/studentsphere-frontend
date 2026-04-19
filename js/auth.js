// ─────────────────────────────────────────
// auth.js — Authentication for Student Sphere
// ─────────────────────────────────────────

const API = 'https://studentsphere-backend-g4wj.onrender.com/api';

function seedAdmin() {}

function getToken() {
  return sessionStorage.getItem('ss_token');
}

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

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

      sessionStorage.setItem('ss_token', data.token);
      SS.set('ss_current_user', data.user);

      showAlert('auth-alert', `Welcome, ${data.user.name}! Redirecting…`, 'success');
      setTimeout(() => goDash(data.user.role), 900);

    } catch (err) {
      showAlert('auth-alert', 'Cannot reach server. Please try again.', 'error');
    }
  });
}

// ── Register page — now disabled for public ──
function initRegister() {
  // Redirect to login — registration is done by admin/faculty only
  window.location.href = 'login.html';
}