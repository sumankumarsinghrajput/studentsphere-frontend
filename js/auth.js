// ─────────────────────────────────────────
// auth.js — Authentication for Student Sphere
// ─────────────────────────────────────────

const API = 'https://studentsphere-backend-g4wj.onrender.com/api';

function seedAdmin() {}

function getToken() {
  return sessionStorage.getItem('ss_token');
}

// ── Login page ──
function initLogin() {
  const u = SS.get('ss_current_user');
  if (u && sessionStorage.getItem('ss_token')) { goDash(u.role); return; }

  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;
    const btn   = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      const res  = await fetch(API + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert('auth-alert', data.msg || 'Login failed.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
        return;
      }

      sessionStorage.setItem('ss_token', data.token);
      SS.set('ss_current_user', data.user);

      showAlert('auth-alert', 'Welcome, ' + data.user.name + '! Redirecting…', 'success');
      setTimeout(() => goDash(data.user.role), 900);

    } catch (err) {
      showAlert('auth-alert', 'Cannot reach server. The server may be waking up — please wait 30 seconds and try again.', 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

// ── Register page — disabled, redirects to login ──
function initRegister() {
  window.location.replace('login.html');
}
