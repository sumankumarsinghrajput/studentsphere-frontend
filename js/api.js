// ─────────────────────────────────────────
// api.js — Shared API calls for Student Sphere
// ─────────────────────────────────────────

const API = 'https://studentsphere-backend-g4wj.onrender.com/api';

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('ss_token')}`
  };
}

// ── Users ──
async function apiGetUsers() {
  const res = await fetch(`${API}/users`, { headers: apiHeaders() });
  return res.json();
}

async function apiGetUsersByRole(role) {
  const res = await fetch(`${API}/users/role/${role}`, { headers: apiHeaders() });
  return res.json();
}

async function apiCreateUser(data) {
  const res = await fetch(`${API}/users/create`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiDeleteUser(id) {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'DELETE',
    headers: apiHeaders()
  });
  return res.json();
}

// ── Student Data ──
async function apiGetMyData() {
  const res = await fetch(`${API}/data/my`, { headers: apiHeaders() });
  return res.json();
}

async function apiGetStudentData(email) {
  const res = await fetch(`${API}/data/${encodeURIComponent(email)}`, { headers: apiHeaders() });
  return res.json();
}

async function apiUpdateAttendance(email, value) {
  const res = await fetch(`${API}/data/attendance`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ email, value })
  });
  return res.json();
}

async function apiUpdateMarks(email, value) {
  const res = await fetch(`${API}/data/marks`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ email, value })
  });
  return res.json();
}

async function apiAddNote(email, text, fileData, fileName, fileSize) {
  const res = await fetch(`${API}/data/notes`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, text, fileData, fileName, fileSize })
  });
  return res.json();
}

async function apiDeleteNote(email, index) {
  const res = await fetch(`${API}/data/notes/${encodeURIComponent(email)}/${index}`, {
    method: 'DELETE',
    headers: apiHeaders()
  });
  return res.json();
}

async function apiAddAssignment(email, text, fileData, fileName, fileSize) {
  const res = await fetch(`${API}/data/assignments`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, text, fileData, fileName, fileSize })
  });
  return res.json();
}

async function apiDeleteAssignment(email, index) {
  const res = await fetch(`${API}/data/assignments/${encodeURIComponent(email)}/${index}`, {
    method: 'DELETE',
    headers: apiHeaders()
  });
  return res.json();
}

async function apiAddLab(email, text, fileData, fileName, fileSize) {
  const res = await fetch(`${API}/data/lab`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, text, fileData, fileName, fileSize })
  });
  return res.json();
}

async function apiDeleteLab(email, index) {
  const res = await fetch(`${API}/data/lab/${encodeURIComponent(email)}/${index}`, {
    method: 'DELETE',
    headers: apiHeaders()
  });
  return res.json();
}