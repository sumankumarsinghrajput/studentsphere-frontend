// main.js — Landing page init
document.addEventListener('DOMContentLoaded', () => {
  // seedAdmin is a no-op; initHam applies theme + wires hamburger
  seedAdmin();
  initHam();       // sets theme, injects toggle into public nav-right, wires #ham-btn
  initEasterEgg();

  const user    = SS.get('ss_current_user');
  const token   = sessionStorage.getItem('ss_token');
  const dashBtn  = document.getElementById('dash-btn');
  const loginBtn = document.getElementById('nav-login');
  const regBtn   = document.getElementById('nav-reg');
  const navRight = document.getElementById('nav-right');

  if (user && token) {
    // User is logged in — rebuild nav-right with user info + theme toggle
    if (dashBtn) {
      dashBtn.style.display = 'inline-flex';
      dashBtn.href = {
        student: 'student.html',
        faculty: 'faculty.html',
        admin:   'admin.html'
      }[user.role] || 'login.html';
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn)   regBtn.style.display   = 'none';

    if (navRight) {
      // _themeToggleHTML() from utils.js ensures the toggle is always present
      navRight.innerHTML = `
        <div class="nav-user-info">
          <div class="nav-avatar">${initials(user.name)}</div>
          <span class="nav-username">${esc(user.name.split(' ')[0])}</span>
          <span class="role-tag role-${user.role}">${user.role}</span>
        </div>
        ${_themeToggleHTML()}
        <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`;
    }
  }
  // If user is NOT logged in, nav-right already has Sign In / Get Started from HTML.
  // initHam() has already injected the theme toggle button into it — nothing else to do.
});
