// ─────────────────────────────────────────
// auth.js — Authentication for Student Sphere
// NOTE: Uses AUTH_API (not API) to avoid duplicate-const conflict with api.js
// ─────────────────────────────────────────

const AUTH_API = 'https://studentsphere-backend-g4wj.onrender.com/api';

// No-op kept for backward compatibility (previously seeded admin client-side)
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
    btn.disabled    = true;
    btn.textContent = 'Signing in…';

    try {
      const res  = await fetch(AUTH_API + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'PENDING_APPROVAL' || res.status === 403) {
          showAlert('auth-alert',
            '⏳ Your account is awaiting admin approval. You will be able to log in once an administrator reviews and approves your registration.',
            'warning');
        } else {
          showAlert('auth-alert', data.msg || 'Login failed.', 'error');
        }
        btn.disabled    = false;
        btn.textContent = 'Sign In';
        return;
      }

      sessionStorage.setItem('ss_token', data.token);
      SS.set('ss_current_user', data.user);

      showAlert('auth-alert', 'Welcome, ' + data.user.name + '! Redirecting…', 'success');
      setTimeout(() => goDash(data.user.role), 900);

    } catch (err) {
      showAlert('auth-alert', 'Cannot reach server. The server may be waking up — please wait 30 seconds and try again.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Sign In';
    }
  });
}

// ── Register page ──
function initRegister() {
  const form = document.getElementById('reg-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name     = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-pass').value;
    const confirm  = document.getElementById('r-conf').value;
    const role     = document.getElementById('r-role').value;
    const semester = document.getElementById('r-semester').value;

    if (password !== confirm) {
      showAlert('auth-alert', 'Passwords do not match', 'error');
      return;
    }

    const btn       = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Creating account...';

    try {
      const res = await fetch(AUTH_API + '/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, role, semester })
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert('auth-alert', data.msg || 'Registration failed', 'error');
        btn.disabled    = false;
        btn.textContent = 'Create Account →';
        return;
      }

      showAlert('auth-alert',
        '✅ Account created! Your registration is pending admin approval. You will be able to log in once approved.',
        'success');

      setTimeout(() => { window.location.href = 'login.html'; }, 3000);

    } catch (err) {
      showAlert('auth-alert', 'Server error. Try again later.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Create Account →';
    }
  });
}
