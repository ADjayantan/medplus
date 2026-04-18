/* =====================================================
   js/api.js — MedPlus Frontend API Helper
===================================================== */

// ── SET YOUR RENDER BACKEND URL HERE ─────────────────────────
// After deploying backend to Render, paste your URL below:
const PRODUCTION_API = 'https://medplus-lkr7.onrender.com/api';
// ─────────────────────────────────────────────────────────────

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:3000/api' : PRODUCTION_API;

// ── Wake-up helper: shows a live countdown banner during Render cold-start ────
// Render free tier spins down after ~15 min of inactivity. The first request
// after sleep fails immediately. We retry once with a visible 30s countdown
// so users see progress instead of a confusing error screen.
function _notifyWakeUp(secondsLeft) {
  const el = document.getElementById('server-wake-banner');
  if (!el) return;
  if (secondsLeft > 0) {
    el.style.display = 'flex';
    el.innerHTML = '<i class="fas fa-power-off" style="color:#f59e0b;font-size:16px"></i>'
      + '<span>Server is starting up &mdash; ready in about <strong>' + secondsLeft + 's</strong>\u2026</span>';
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

async function apiFetch(path, options = {}, _retried = false) {
  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (networkErr) {
    // On first network failure on the live site, show countdown and retry once.
    if (!_retried && !isLocal) {
      let t = 30;
      _notifyWakeUp(t);
      await new Promise(r => {
        const iv = setInterval(() => {
          t--;
          _notifyWakeUp(t);
          if (t <= 0) { clearInterval(iv); r(); }
        }, 1000);
      });
      _notifyWakeUp(0);
      return apiFetch(path, options, true);
    }
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'HTTP ' + res.status);
  return data;
}

/* ── Auth ── */
const AuthAPI = {
  login:    body => apiFetch('/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: body => apiFetch('/register', { method: 'POST', body: JSON.stringify(body) }),
};

/* ── Products ── */
const ProductAPI = {
  list:         (params = {}) => apiFetch('/products?' + new URLSearchParams(params)),
  categories:   ()            => apiFetch('/products/categories'),
  get:          id            => apiFetch('/products/' + id),
  autocomplete: q             => apiFetch('/products?search=' + encodeURIComponent(q) + '&autocomplete=true&limit=8'),
  create:       body          => apiFetch('/products',       { method: 'POST',   body: JSON.stringify(body) }),
  update:       (id, body)    => apiFetch('/products/' + id, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:       id            => apiFetch('/products/' + id, { method: 'DELETE' }),
};

/* ── Orders ── */
const OrderAPI = {
  create:       body          => apiFetch('/orders',                   { method: 'POST', body: JSON.stringify(body) }),
  my:           ()            => apiFetch('/orders/my'),
  get:          id            => apiFetch('/orders/' + id),
  all:          (params = {}) => apiFetch('/orders?' + new URLSearchParams(params)),
  updateStatus: (id, status)  => apiFetch('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) }),
};

/* ── Prescriptions ── */
const PrescriptionAPI = {
  upload: formData => {
    const token = localStorage.getItem('token');
    return fetch(API_BASE + '/prescriptions/upload', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body:    formData,
    }).then(r => r.json());
  },
  my:     ()            => apiFetch('/prescriptions/my'),
  all:    (params = {}) => apiFetch('/prescriptions?' + new URLSearchParams(params)),
  review: (id, body)    => apiFetch('/prescriptions/' + id + '/review', { method: 'PUT', body: JSON.stringify(body) }),
  // Authenticated URL for viewing a prescription file (replaces bare /uploads/... path)
  fileUrl: filename => API_BASE + '/prescriptions/file/' + encodeURIComponent(filename),
};

/* ── Admin ── */
const AdminAPI = {
  stats: () => apiFetch('/admin/stats'),
  users: () => apiFetch('/admin/users'),
};

/* ── Shared auth helpers — used by every page ── */
function isLoggedIn()  { return !!localStorage.getItem('token'); }
function currentUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function isAdmin()     { const u = currentUser(); return u && u.isAdmin; }

/* ── Logout helper ── */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
