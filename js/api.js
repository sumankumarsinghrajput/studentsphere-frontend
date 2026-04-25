// ─────────────────────────────────────────
// api.js — Shared API calls for Student Sphere
// ─────────────────────────────────────────

const API = 'https://studentsphere-backend-g4wj.onrender.com/api';

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + sessionStorage.getItem('ss_token')
  };
}

// ══════════════════════════════════
// USERS
// ══════════════════════════════════
async function apiGetUsers() {
  try {
    const res = await fetch(API + '/users', { headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch (e) { console.error('apiGetUsers:', e); return []; }
}

async function apiGetUsersByRole(role) {
  try {
    const res = await fetch(API + '/users/role/' + role, { headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch (e) { console.error('apiGetUsersByRole:', e); return []; }
}

async function apiCreateUser(data) {
  try {
    const res = await fetch(API + '/users/create', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify(data)
    });
    return res.json();
  } catch (e) { return { msg: 'Network error. Please try again.' }; }
}

async function apiDeleteUser(id) {
  try {
    const res = await fetch(API + '/users/' + id, {
      method: 'DELETE', headers: apiHeaders()
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

// ══════════════════════════════════
// STUDENT DATA
// ══════════════════════════════════
async function apiGetMyData() {
  try {
    const res = await fetch(API + '/data/my', { headers: apiHeaders() });
    if (!res.ok) return {};
    return res.json();
  } catch (e) { console.error('apiGetMyData:', e); return {}; }
}

async function apiGetStudentData(email) {
  try {
    const res = await fetch(API + '/data/student/' + encodeURIComponent(email), {
      headers: apiHeaders()
    });
    if (!res.ok) return {};
    return res.json();
  } catch (e) { console.error('apiGetStudentData:', e); return {}; }
}

async function apiUpdateAttendance(email, value) {
  try {
    const res = await fetch(API + '/data/attendance', {
      method: 'PUT', headers: apiHeaders(),
      body: JSON.stringify({ email, value })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiUpdateMarks(email, value) {
  try {
    const res = await fetch(API + '/data/marks', {
      method: 'PUT', headers: apiHeaders(),
      body: JSON.stringify({ email, value })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiAddNote(email, text, fileData, fileName, fileSize) {
  try {
    const res = await fetch(API + '/data/notes', {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ email, text, fileData, fileName, fileSize })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiDeleteNote(email, index) {
  try {
    const res = await fetch(
      API + '/data/notes/' + encodeURIComponent(email) + '/' + index,
      { method: 'DELETE', headers: apiHeaders() }
    );
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiAddAssignment(email, text, fileData, fileName, fileSize, dueDate, allowLate) {
  try {
    const res = await fetch(API + '/data/assignments', {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ email, text, fileData, fileName, fileSize, dueDate, allowLate })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiUpdateAssignment(email, index, dueDate, allowLate) {
  try {
    const res = await fetch(
      API + '/data/assignments/' + encodeURIComponent(email) + '/' + index,
      {
        method: 'PUT', headers: apiHeaders(),
        body: JSON.stringify({ dueDate, allowLate })
      }
    );
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiDeleteAssignment(email, index) {
  try {
    const res = await fetch(
      API + '/data/assignments/' + encodeURIComponent(email) + '/' + index,
      { method: 'DELETE', headers: apiHeaders() }
    );
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiAddLab(email, text, fileData, fileName, fileSize) {
  try {
    const res = await fetch(API + '/data/lab', {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ email, text, fileData, fileName, fileSize })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiDeleteLab(email, index) {
  try {
    const res = await fetch(
      API + '/data/lab/' + encodeURIComponent(email) + '/' + index,
      { method: 'DELETE', headers: apiHeaders() }
    );
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

// ══════════════════════════════════
// SUBMISSIONS
// ══════════════════════════════════
async function apiSubmitAssignment(payload) {
  try {
    const res = await fetch(API + '/data/submit', {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiGetSubmissions(studentEmail) {
  try {
    const res = await fetch(
      API + '/data/submissions/' + encodeURIComponent(studentEmail),
      { headers: apiHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) { return []; }
}

// ══════════════════════════════════
// NOTICES
// ══════════════════════════════════
async function apiGetNotices() {
  try {
    const res = await fetch(API + '/notices', { headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch (e) { return []; }
}

async function apiCreateNotice(title, body, semester) {
  try {
    const res = await fetch(API + '/notices', {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ title, body, semester })
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}

async function apiDeleteNotice(id) {
  try {
    const res = await fetch(API + '/notices/' + id, {
      method: 'DELETE', headers: apiHeaders()
    });
    return res.json();
  } catch (e) { return { msg: 'Network error.' }; }
}
