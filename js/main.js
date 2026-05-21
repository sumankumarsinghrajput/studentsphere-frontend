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

  // ── Scroll-spy: highlight nav link matching current section ──
  initScrollSpy();
});

function initScrollSpy() {
  // Map each nav href anchor to the section element it points to
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-links a[href="index.html"]');
  if (!navLinks.length) return;

  // Section order matches nav order: hero → features → how-it-works → download
  const sectionIds = ['hero-anchor', 'features', 'how-it-works', 'download'];

  // The hero section has no id — add one to the hero element
  const heroEl = document.querySelector('.hero');
  if (heroEl && !heroEl.id) heroEl.id = 'hero-anchor';

  // Build a map: sectionId → nav link element
  const linkMap = {};
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'index.html' || href === '#') {
      linkMap['hero-anchor'] = link;
    } else {
      const id = href.replace('#', '');
      linkMap[id] = link;
    }
  });

  function setActive(id) {
    navLinks.forEach(l => l.classList.remove('active'));
    const activeLink = linkMap[id];
    if (activeLink) activeLink.classList.add('active');
  }

  // Use IntersectionObserver — fires when section enters viewport
  // threshold 0.25 = section must be 25% visible to trigger
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, {
    rootMargin: '-10% 0px -60% 0px',  // trigger when section is in top 30% of viewport
    threshold: 0
  });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // Also handle smooth scroll on anchor clicks and update active immediately
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update active immediately on click without waiting for observer
        setActive(target.id);
      }
    });
  });
}
