// main.js — Landing page init
document.addEventListener('DOMContentLoaded', () => {
  seedAdmin();
  initHam();       // also calls initTheme() and injects theme toggle
  initEasterEgg();

  const user = SS.get('ss_current_user');
  const dashBtn  = document.getElementById('dash-btn');
  const loginBtn = document.getElementById('nav-login');
  const regBtn   = document.getElementById('nav-reg');
  const navRight = document.getElementById('nav-right');

  if (user) {
    if (dashBtn)  { dashBtn.style.display='inline-flex'; dashBtn.href = {student:'student.html',faculty:'faculty.html',admin:'admin.html'}[user.role]||'login.html'; }
    if (loginBtn) loginBtn.style.display='none';
    if (regBtn)   regBtn.style.display='none';
    if (navRight) {
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
});
