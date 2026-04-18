/* =====================================================
   API.JS — MedPlus shared API config & helpers
===================================================== */

/* Backend URL — set window.API_BASE before loading this
   script if you need to override (e.g. in dev).
   Falls back to the deployed Render instance.           */
window.API_BASE = window.API_BASE || 'https://medplus-lkr7.onrender.com';

/* ── Generic fetch wrapper ── */
async function apiFetch(path, options = {}) {
  const url = window.API_BASE + path;
  const token = localStorage.getItem('medplus_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const body = await res.json(); msg = body.message || msg; } catch {}
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.json();
}

/* ── Products ── */
async function fetchProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.category)   qs.set('category',   params.category);
  if (params.search)     qs.set('search',      params.search);
  if (params.inStock)    qs.set('inStock',     'true');
  if (params.limit)      qs.set('limit',       params.limit);
  if (params.autocomplete) qs.set('autocomplete', 'true');
  const query = qs.toString() ? '?' + qs.toString() : '';
  return apiFetch('/api/products' + query);
}

async function fetchProductById(id) {
  return apiFetch('/api/products/' + id);
}

async function fetchCategories() {
  return apiFetch('/api/products/categories');
}

/* ── Auth ── */
async function apiLogin(email, password) {
  return apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function apiRegister(data) {
  return apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ── Orders ── */
async function apiPlaceOrder(orderData) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

async function apiGetOrders() {
  return apiFetch('/api/orders');
}

/* ── Toast helper (used across pages) ── */
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
  toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
