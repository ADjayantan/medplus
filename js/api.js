/* =====================================================
   API.JS — Genezenz Pharmacy shared API config & helpers
===================================================== */

/* Backend URL — set window.API_BASE before loading this
   script if you need to override (e.g. in dev).
   Falls back to the deployed Render instance.           */
window.API_BASE = window.API_BASE || 'https://medplus-lkr7.onrender.com';

/* ── Generic fetch wrapper with 35s timeout ── */
async function apiFetch(path, options = {}) {
  const url = window.API_BASE + path;
  const token = localStorage.getItem('genezenz-pharmacy_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 35000); // 35s timeout

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let msg = 'Request failed';
      try { const body = await res.json(); msg = body.message || msg; } catch {}
      throw Object.assign(new Error(msg), { status: res.status });
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond — please retry');
    }
    throw err;
  }
}

/* ── Products ── */
async function fetchProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.category)     qs.set('category',     params.category);
  if (params.search)       qs.set('search',        params.search);
  if (params.inStock)      qs.set('inStock',       'true');
  if (params.limit)        qs.set('limit',         params.limit);
  if (params.sort)         qs.set('sort',          params.sort);
  if (params.autocomplete) qs.set('autocomplete',  'true');
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

/* ── AuthAPI namespace (used by login.html, register.html, admin-login.html) ── */
const AuthAPI = {
  login:    ({ email, password }) => apiLogin(email, password),
  register: (data)               => apiRegister(data),
};

/* ── ProductAPI namespace (used by Home.js, main.js, search.js, admin-products.html) ── */
const ProductAPI = {
  list: (params = {}) => fetchProducts(params),
  categories: () => fetchCategories(),
  autocomplete: async (q) => {
    const data = await fetchProducts({ search: q, autocomplete: true, limit: 8 });
    return data.products || [];
  },
  create: (body) => apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),
};

/* ── OrderAPI namespace (used by profile.js, checkout.html, admin-orders.html) ── */
const OrderAPI = {
  create:       (orderData)      => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  my:           ()               => apiFetch('/api/orders'),
  all:          (params = {})    => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.limit)  qs.set('limit',  params.limit);
    const q = qs.toString() ? '?' + qs.toString() : '';
    return apiFetch('/api/orders/admin/all' + q);
  },
  updateStatus: (id, status)     => apiFetch(`/api/orders/admin/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

/* ── PrescriptionAPI namespace (used by upload.js, profile.js, checkout.html, admin-prescriptions.html) ── */
const PrescriptionAPI = {
  upload: (formData) => {
    const token = localStorage.getItem('genezenz-pharmacy_token');
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(window.API_BASE + '/api/prescriptions/upload', {
      method: 'POST', headers, body: formData,
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Upload failed';
        try { const b = await res.json(); msg = b.message || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    });
  },
  my:     ()                        => apiFetch('/api/prescriptions/my'),
  all:    (params = {})             => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.limit)  qs.set('limit',  params.limit);
    const q = qs.toString() ? '?' + qs.toString() : '';
    return apiFetch('/api/prescriptions/admin/all' + q);
  },
  review: (id, { status, adminNote }) => apiFetch(`/api/prescriptions/admin/${id}`, {
    method: 'PUT', body: JSON.stringify({ status, adminNote }),
  }),
};

/* ── AdminAPI namespace (used by admin-dashboard.html) ── */
const AdminAPI = {
  stats: () => apiFetch('/api/admin/stats'),
};

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
