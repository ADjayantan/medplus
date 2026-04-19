/* =================================================================
   home.js — Genezenz Pharmacy Homepage
   Responsibilities:
   - Load 8 featured/top-rated products only (NOT full catalog)
   - Render featured product cards with Add to Cart
   - Auto-complete on hero search bar
   - Cart badge sync
   - Auth UI
================================================================= */

/* shared with cart.js / api.js — reuse if already defined */
function sanitizeHome(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

/* ── Category icon/color map (matches main.js) ── */
const HOME_CAT_META = {
  'Pain Relief':            { icon: 'fa-head-side-mask',   color: '#7c3aed', bg: '#ede9fe' },
  'Antibiotics':            { icon: 'fa-bacterium',         color: '#059669', bg: '#d1fae5' },
  'Allergy & Cold':         { icon: 'fa-wind',              color: '#0284c7', bg: '#e0f2fe' },
  'Diabetes':               { icon: 'fa-syringe',           color: '#dc2626', bg: '#fee2e2' },
  'Heart & BP':             { icon: 'fa-heartbeat',         color: '#db2777', bg: '#fce7f3' },
  'Vitamins & Supplements': { icon: 'fa-leaf',              color: '#d97706', bg: '#fef3c7' },
  'Stomach & Digestion':    { icon: 'fa-stethoscope',       color: '#ca8a04', bg: '#fef9c3' },
  'Respiratory':            { icon: 'fa-lungs',             color: '#2563eb', bg: '#dbeafe' },
  'Skin Care':              { icon: 'fa-hand-sparkles',     color: '#059669', bg: '#d1fae5' },
  'Eye Care':               { icon: 'fa-eye',               color: '#16a34a', bg: '#f0fdf4' },
  'Baby Care':              { icon: 'fa-baby',              color: '#3b82f6', bg: '#eff6ff' },
  "Women's Health":         { icon: 'fa-venus',             color: '#a21caf', bg: '#fdf2f8' },
  'Neurology':              { icon: 'fa-brain',             color: '#7c3aed', bg: '#f5f3ff' },
  'Liver Care':             { icon: 'fa-flask',             color: '#ea580c', bg: '#fff7ed' },
  'First Aid':              { icon: 'fa-first-aid',         color: '#16a34a', bg: '#f0fdf4' },
};

/* Products loaded for homepage (8 max) */
let homeFeaturedProducts = [];

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  updateHomeNavAuth();
  renderHomeCartBadge();
  initHeroAutocomplete();
  await loadFeaturedProducts();
});

/* ── Auth UI ── */
function updateHomeNavAuth() {
  const user = typeof currentUser === 'function' ? currentUser() : null;
  const li   = document.getElementById('nav-login');
  const pr   = document.getElementById('nav-profile');
  const ad   = document.getElementById('nav-admin');
  if (user) {
    if (li) li.style.display = 'none';
    if (pr) { pr.style.display = ''; pr.innerHTML = '<i class="fas fa-user"></i> ' + user.name.split(' ')[0]; }
    if (ad) ad.style.display = user.isAdmin ? '' : 'none';
  } else {
    if (li) li.style.display = '';
    if (pr) pr.style.display = 'none';
    if (ad) ad.style.display = 'none';
  }
}

/* ── Cart badge ── */
function renderHomeCartBadge() {
  const cart   = typeof getCart === 'function' ? getCart() : [];
  const badge  = document.getElementById('nav-cart-count');
  const total  = cart.reduce((s, i) => s + (i.qty || 1), 0);
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? '' : 'none'; }
}

/* ── Load 8 Featured Products (with Render cold-start retry) ── */
async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;

  /* Show shimmer while loading — keep the 8 placeholders already in HTML */
  /* (they are rendered inline in index.html, so nothing to do here) */

  const TIMEOUT_MS  = 35000;  /* 35s — covers Render free-tier cold start */
  const MAX_RETRIES = 2;
  let lastError;

  /* Show a gentle "waking up" hint after 5s */
  const hintTimer = setTimeout(() => {
    const hint = document.createElement('p');
    hint.id = 'fp-hint';
    hint.style.cssText = 'grid-column:1/-1;text-align:center;font-size:.82rem;color:var(--text-secondary);padding:.5rem 0 0;margin:0';
    hint.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:.4rem;color:var(--teal-400)"></i>Server is waking up — products will appear shortly…';
    /* Insert AFTER the shimmer cards */
    grid.appendChild(hint);
  }, 5000);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      /* Race the API call against our timeout */
      const data = await Promise.race([
        ProductAPI.list({ sort: 'rating', limit: 8 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
        ),
      ]);

      clearTimeout(hintTimer);
      homeFeaturedProducts = (data.products || []).slice(0, 8);

      if (!homeFeaturedProducts.length) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-secondary)">
            <i class="fas fa-pills" style="font-size:2.25rem;margin-bottom:.875rem;display:block;color:var(--neutral-300)"></i>
            <p style="margin-bottom:1rem;font-weight:600">No products found</p>
            <a href="products.html" style="color:var(--teal-500);font-weight:700;text-decoration:none">Browse all medicines →</a>
          </div>`;
        return;
      }

      grid.innerHTML = homeFeaturedProducts.map(p => featuredCardHtml(p)).join('');
      return; /* success — exit */

    } catch (err) {
      lastError = err;
      /* If not the last attempt, wait briefly then retry */
      if (attempt < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, 4000));
      }
    }
  }

  /* All attempts exhausted */
  clearTimeout(hintTimer);
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-secondary)">
        <i class="fas fa-exclamation-circle" style="font-size:2.25rem;margin-bottom:.875rem;display:block;color:#fca5a5"></i>
        <p style="margin-bottom:.5rem;font-weight:600">Couldn't load products right now</p>
        <p style="font-size:.82rem;margin-bottom:1.25rem">The server may be starting up. Please try again in a moment.</p>
        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
          <button onclick="loadFeaturedProducts()"
            style="display:inline-flex;align-items:center;gap:.4rem;background:var(--teal-400);color:#fff;border:none;padding:.65rem 1.25rem;border-radius:8px;font-weight:700;font-size:.875rem;cursor:pointer">
            <i class="fas fa-redo"></i> Try Again
          </button>
          <a href="products.html" class="featured-cta-btn" style="display:inline-flex">
            <i class="fas fa-pills"></i> Browse All Medicines
          </a>
        </div>
      </div>`;
    /* Restore shimmer-style min-height so CLS is minimal */
  }
  console.warn('home.js: featured products failed after retries —', lastError?.message);
}

/* ── Featured Card HTML ── */
function featuredCardHtml(p) {
  const id       = sanitizeHome(p._id);
  const meta     = HOME_CAT_META[p.category] || { color: '#2ea89a', bg: '#ebfaf8', icon: 'fa-pills' };
  const discount = p.mrp && p.price < p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const stars    = renderHomeStars(p.rating || 0);

  const imgHtml = p.image
    ? `<img src="${sanitizeHome(p.image)}" alt="${sanitizeHome(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'fas ${meta.icon}\\' style=\\'font-size:3rem;color:${meta.color}\\'></i>'">`
    : `<i class="fas ${meta.icon}" style="font-size:3rem;color:${meta.color}"></i>`;

  const addBtnHtml = p.stock
    ? `<button class="fp-add-btn" onclick="homeAddToCart('${id}')">
         <i class="fas fa-cart-plus"></i> Add
       </button>`
    : `<button class="fp-add-btn out-of-stock" disabled>Out of Stock</button>`;

  return `
    <div class="fp-card" id="fp-${id}">
      <div class="fp-img" style="background:${meta.bg}">
        ${imgHtml}
        ${discount >= 5 ? `<span class="fp-discount">${discount}% off</span>` : ''}
        ${p.requiresPrescription ? `<span class="fp-rx-badge"><i class="fas fa-prescription"></i> Rx</span>` : ''}
      </div>
      <div class="fp-body">
        <div class="fp-cat">${sanitizeHome(p.category)}</div>
        <div class="fp-name">${sanitizeHome(p.name)}</div>
        <div class="fp-mfr">${sanitizeHome(p.manufacturer || 'Genezenz Pharmacy')}</div>
        <div class="fp-rating">
          <span class="fp-stars">${stars}</span>
          <span class="fp-rating-num">${(p.rating || 0).toFixed(1)}</span>
          <span class="fp-reviews">(${(p.reviews || 0).toLocaleString()})</span>
        </div>
        <div class="fp-footer">
          <div>
            <span class="fp-price">₹${p.price}</span>
            ${p.mrp ? `<span class="fp-mrp">₹${p.mrp}</span>` : ''}
          </div>
          ${addBtnHtml}
        </div>
      </div>
    </div>`;
}

function renderHomeStars(rating) {
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '<i class="fas fa-star"></i>'.repeat(full)
    + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
    + '<i class="far fa-star" style="color:#e2e8f0"></i>'.repeat(empty);
}

/* ── Add to Cart (homepage version) ── */
function homeAddToCart(productId) {
  const p = homeFeaturedProducts.find(x => x._id === productId);
  if (!p) return;

  if (p.requiresPrescription && !(typeof currentUser === 'function' && currentUser())) {
    window.location.href = 'login.html?redirect=index.html';
    return;
  }

  if (typeof getCart !== 'function' || typeof saveCart !== 'function') return;

  const cart     = getCart();
  const existing = cart.find(i => i._id === productId);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({
      _id: p._id, name: p.name, price: p.price, mrp: p.mrp,
      image: p.image || '', manufacturer: p.manufacturer || '',
      requiresPrescription: !!p.requiresPrescription, qty: 1,
    });
  }
  saveCart(cart);
  renderHomeCartBadge();

  homeShowToast(
    p.requiresPrescription
      ? `<i class="fas fa-file-prescription"></i> ${sanitizeHome(p.name)} added — prescription required`
      : `<i class="fas fa-check-circle"></i> ${sanitizeHome(p.name)} added to cart`
  );
}

/* ── Hero Search Autocomplete ── */
function initHeroAutocomplete() {
  const input  = document.getElementById('hero-search-bar');
  const list   = document.getElementById('autocomplete-list-hero');
  if (!input || !list) return;

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (q.length < 2) { list.style.display = 'none'; return; }
    debounce = setTimeout(() => fetchHeroSuggestions(q, input, list), 250);
  });

  document.addEventListener('click', e => {
    if (!list.contains(e.target) && e.target !== input) list.style.display = 'none';
  });
}

async function fetchHeroSuggestions(q, input, list) {
  try {
    const products = await ProductAPI.autocomplete(q);
    if (!products.length) { list.style.display = 'none'; return; }
    list.innerHTML = products.map(p => `
      <div onclick="window.location.href='products.html?q=${encodeURIComponent(p.name)}'"
           style="padding:.65rem 1rem;cursor:pointer;display:flex;align-items:center;gap:.6rem;border-bottom:1px solid #f1f5f9;font-size:.875rem;color:#1e293b;transition:background .12s"
           onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background=''"
           role="option">
        <i class="fas fa-pills" style="color:#2ea89a;font-size:.8rem;flex-shrink:0"></i>
        <div>
          <div style="font-weight:600">${sanitizeHome(p.name)}</div>
          <div style="font-size:.72rem;color:#64748b">${sanitizeHome(p.category)}</div>
        </div>
        <div style="margin-left:auto;font-weight:700;color:#1e293b">₹${p.price}</div>
      </div>`).join('');
    list.style.display = 'block';
  } catch { list.style.display = 'none'; }
}

/* ── Toast ── */
function homeShowToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.cssText = 'background:#1e6b6b;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;max-width:320px;animation:toastIn .25s ease';
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
