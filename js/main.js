/* =====================================================
   MAIN.JS — MedPlus (Stage Final — 100+ Products)
===================================================== */

let allProducts   = [];
let allCategories = [];
let activeCategory = 'all';

/* ── XSS sanitizer ── */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  updateNavAuth();
  initSearchAutocomplete('search-bar', 'autocomplete-list');
  await loadCategories();
  await loadProducts();
  renderCart();

  // Create toast container once on page load
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(tc);
  }
});

/* ── Auth UI ── */
function updateNavAuth() {
  const user       = currentUser();
  const loginBtn   = document.getElementById('nav-login');
  const profileBtn = document.getElementById('nav-profile');
  const adminBtn   = document.getElementById('nav-admin');
  if (user) {
    if (loginBtn)   loginBtn.style.display = 'none';
    if (profileBtn) {
      profileBtn.style.display = '';
      profileBtn.innerHTML = '<i class="fas fa-user"></i> ' + user.name.split(' ')[0];
    }
    if (adminBtn) adminBtn.style.display = user.isAdmin ? '' : 'none';
  } else {
    if (loginBtn)   loginBtn.style.display = '';
    if (profileBtn) profileBtn.style.display = 'none';
    if (adminBtn)   adminBtn.style.display = 'none';
  }
}

/* ── Categories ── */
const CATEGORY_META = {
  'Pain Relief':            { icon: 'fa-head-side-mask',    color: '#7c3aed', bg: '#ede9fe' },
  'Antibiotics':            { icon: 'fa-bacterium',          color: '#059669', bg: '#d1fae5' },
  'Allergy & Cold':         { icon: 'fa-wind',               color: '#0284c7', bg: '#e0f2fe' },
  'Diabetes':               { icon: 'fa-syringe',            color: '#dc2626', bg: '#fee2e2' },
  'Heart & BP':             { icon: 'fa-heartbeat',          color: '#db2777', bg: '#fce7f3' },
  'Vitamins & Supplements': { icon: 'fa-leaf',               color: '#d97706', bg: '#fef3c7' },
  'Stomach & Digestion':    { icon: 'fa-stethoscope',        color: '#ca8a04', bg: '#fef9c3' },
  'Respiratory':            { icon: 'fa-lungs',              color: '#2563eb', bg: '#dbeafe' },
  'Skin Care':              { icon: 'fa-hand-sparkles',      color: '#059669', bg: '#d1fae5' },
  'Eye Care':               { icon: 'fa-eye',                color: '#16a34a', bg: '#f0fdf4' },
  'Baby Care':              { icon: 'fa-baby',               color: '#3b82f6', bg: '#eff6ff' },
  "Women's Health":         { icon: 'fa-venus',              color: '#a21caf', bg: '#fdf2f8' },
  'Neurology':              { icon: 'fa-brain',              color: '#7c3aed', bg: '#f5f3ff' },
  'Liver Care':             { icon: 'fa-flask',              color: '#ea580c', bg: '#fff7ed' },
  'First Aid':              { icon: 'fa-first-aid',          color: '#16a34a', bg: '#f0fdf4' },
};

async function loadCategories() {
  try {
    const data    = await ProductAPI.categories();
    allCategories = data.categories || [];
    renderCategoryTabs(allCategories);
    renderCategoryCards(allCategories);
  } catch (err) {
    console.error('Categories error:', err);
    // Fallback: use known categories
    allCategories = Object.keys(CATEGORY_META);
    renderCategoryTabs(allCategories);
    renderCategoryCards(allCategories);
  }
}

function renderCategoryTabs(cats) {
  const container = document.getElementById('category-tabs');
  if (!container) return;
  container.innerHTML = `
    <button class="cat-tab active" data-cat="all" onclick="setCategory('all', this)">
      <span class="cat-tab-icon"><i class="fas fa-store"></i></span><span>All</span>
    </button>
    ${cats.map(c => {
      const meta = CATEGORY_META[c] || { icon: 'fa-pills', color: '#2ea89a', bg: '#ebfaf8' };
      return `
        <button class="cat-tab" data-cat="${c}" onclick="setCategory('${c.replace(/'/g, "\\'")}', this)" style="--cat-color:${meta.color}">
          <span class="cat-tab-icon"><i class="fas ${meta.icon}"></i></span>
          <span>${c}</span>
        </button>`;
    }).join('')}
  `;
}

function renderCategoryCards(cats) {
  const container = document.getElementById('category-cards');
  if (!container) return;
  container.innerHTML = cats.map(c => {
    const meta = CATEGORY_META[c] || { icon: 'fa-pills', color: '#2ea89a', bg: '#ebfaf8' };
    const count = allProducts.filter(p => p.category === c).length;
    return `
      <div class="cat-card" onclick="setCategory('${c.replace(/'/g, "\\'")}', null)"
           style="background:${meta.bg};border-color:${meta.color}22">
        <div class="cat-card-icon" style="color:${meta.color};background:${meta.color}18">
          <i class="fas ${meta.icon}"></i>
        </div>
        <div class="cat-card-name">${c}</div>
        <div class="cat-card-count" style="color:${meta.color}">${count || ''} medicines</div>
      </div>`;
  }).join('');
}

function setCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    const tabBtn = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    // Scroll to products grid
    const grid = document.getElementById('products-section');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  filterAndRender();
}

/* ── Products ── */
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <p>Loading medicines...</p>
    </div>`;
  try {
    const data  = await ProductAPI.list();
    allProducts = data.products || [];
    filterAndRender();
    // Re-render category cards with counts
    renderCategoryCards(allCategories);
    // Update stats
    const statEl = document.getElementById('product-stat');
    if (statEl) statEl.textContent = allProducts.length + '+ medicines';
  } catch (err) {
    if (grid) grid.innerHTML = `
      <div class="api-error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Could not connect to server</h3>
        <p>${err.message}</p>
        <p style="font-size:13px;margin-top:8px;opacity:.7">Make sure the backend is running on port 3000</p>
        <button onclick="loadProducts()" class="btn-retry">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>`;
  }
}

function filterAndRender() {
  const q           = (document.getElementById('search-bar')?.value || '').toLowerCase().trim();
  const sortBy      = document.getElementById('sort-select')?.value || 'name';
  const inStockOnly = document.getElementById('in-stock-toggle')?.checked;
  const rxFilter    = document.getElementById('rx-filter')?.value || '';
  const priceMax    = parseInt(document.getElementById('price-filter')?.value || '9999');

  let filtered = allProducts.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (q && !p.name.toLowerCase().includes(q)
          && !p.category.toLowerCase().includes(q)
          && !(p.description||'').toLowerCase().includes(q)
          && !(p.tags || []).some(t => t.toLowerCase().includes(q))) return false;
    if (inStockOnly && !p.stock) return false;
    if (rxFilter === 'otc' && p.requiresPrescription) return false;
    if (rxFilter === 'rx'  && !p.requiresPrescription) return false;
    if (p.price > priceMax) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating')     return b.rating - a.rating;
    if (sortBy === 'discount')   return discountPct(b) - discountPct(a);
    return a.name.localeCompare(b.name);
  });

  renderProductGrid(filtered);

  const countEl = document.getElementById('results-count');
  if (countEl) {
    const catLabel = activeCategory === 'all' ? 'All Categories' : activeCategory;
    countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} in ${catLabel}`;
  }
}

function discountPct(p) {
  return Math.round((p.mrp - p.price) / p.mrp * 100);
}

function renderProductGrid(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search" style="font-size:48px;color:#cbd5e1;margin-bottom:16px;display:block"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
        <button onclick="clearFilters()" class="btn-clear">
          <i class="fas fa-times"></i> Clear Filters
        </button>
      </div>`;
    return;
  }
  grid.innerHTML = products.map(p => productCardHtml(p)).join('');
}

function productCardHtml(p) {
  const discount = discountPct(p);
  const stars    = renderStars(p.rating);
  const user     = currentUser();
  const id       = p._id;
  const meta     = CATEGORY_META[p.category] || { color: '#2ea89a', bg: '#ebfaf8' };

  return `
    <div class="product-card" id="card-${id}">
      ${discount >= 5 ? `<div class="discount-badge">-${discount}%</div>` : ''}
      ${p.requiresPrescription ? `<div class="rx-badge"><i class="fas fa-file-prescription"></i> Rx</div>` : ''}
      ${!p.stock ? `<div class="out-badge">Out of Stock</div>` : ''}

      <div class="product-img-wrap" onclick="openProductModal('${id}')" style="background:${meta.bg}">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="product-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="product-img-placeholder" style="${p.image ? 'display:none' : ''};color:${meta.color}">
          <i class="fas ${meta.icon || 'fa-pills'}"></i>
        </div>
      </div>

      <div class="product-info">
        <div class="product-category" style="color:${meta.color};background:${meta.bg}">${sanitize(p.category)}</div>
        <h3 class="product-name" onclick="openProductModal('${id}')">${sanitize(p.name)}</h3>
        <div class="product-mfr"><i class="fas fa-industry" style="opacity:.5;font-size:11px;margin-right:3px"></i>${sanitize(p.manufacturer || '')}</div>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${p.rating.toFixed(1)}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-price-row">
          <div>
            <span class="product-price">₹${p.price}</span>
            <span class="product-mrp">₹${p.mrp}</span>
          </div>
          ${discount >= 5 ? `<span class="discount-tag">${discount}% off</span>` : ''}
        </div>
        <div class="product-actions">
          ${p.stock
            ? (p.requiresPrescription && !user
              ? `<a href="login.html" class="btn-add-cart rx-btn"
                   style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px">
                   <i class="fas fa-lock"></i> Login to Order</a>`
              : `<button class="btn-add-cart" onclick="addToCart('${id}')">
                   <i class="fas fa-cart-plus"></i> Add to Cart</button>`)
            : `<button class="btn-add-cart disabled" disabled>Out of Stock</button>`
          }
          <button class="btn-quick-view" onclick="openProductModal('${id}')" title="Quick View">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '<span style="color:#f59e0b">'
    + '<i class="fas fa-star"></i>'.repeat(full)
    + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
    + '</span>'
    + '<i class="far fa-star" style="color:#e2e8f0"></i>'.repeat(empty);
}

function clearFilters() {
  const s = document.getElementById('search-bar');    if (s) s.value = '';
  const r = document.getElementById('sort-select');   if (r) r.value = 'name';
  const t = document.getElementById('in-stock-toggle'); if (t) t.checked = false;
  const x = document.getElementById('rx-filter');    if (x) x.value = '';
  const pf = document.getElementById('price-filter'); if (pf) { pf.value = pf.max; updatePriceLabel(); }
  setCategory('all', document.querySelector('.cat-tab[data-cat="all"]'));
}

function updatePriceLabel() {
  const pf = document.getElementById('price-filter');
  const pl = document.getElementById('price-label');
  if (pf && pl) pl.textContent = pf.value >= pf.max ? 'Any price' : '₹' + pf.value;
}

/* ── Product Modal ── */
function openProductModal(id) {
  const p = allProducts.find(x => x._id === id);
  if (!p) return;
  const discount = discountPct(p);
  const meta     = CATEGORY_META[p.category] || { color: '#2ea89a', bg: '#ebfaf8', icon: 'fa-pills' };
  const modal    = document.getElementById('product-modal');
  if (!modal) return;

  const descWords = p.description || '';

  modal.innerHTML = `
    <div class="pmodal-overlay" onclick="closeProductModal()">
      <div class="pmodal-content" onclick="event.stopPropagation()">
        <button class="pmodal-close" onclick="closeProductModal()"><i class="fas fa-times"></i></button>
        <div class="pmodal-body">
          <div class="pmodal-img" style="background:${meta.bg}">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`
              : `<div class="pmodal-img-ph" style="color:${meta.color}"><i class="fas ${meta.icon}"></i></div>`}
          </div>
          <div class="pmodal-info">
            <div class="product-category" style="color:${meta.color};background:${meta.bg};display:inline-flex;margin-bottom:8px">
              <i class="fas ${meta.icon}" style="margin-right:5px"></i>${sanitize(p.category)}
            </div>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;line-height:1.3">${sanitize(p.name)}</h2>
            <div style="font-size:13px;color:#64748b;margin-bottom:12px">
              <i class="fas fa-industry" style="margin-right:4px;opacity:.5"></i>${sanitize(p.manufacturer || 'MedPlus')}
            </div>
            <div class="product-rating" style="margin-bottom:14px">
              <span class="stars">${renderStars(p.rating)}</span>
              <span class="rating-num">${p.rating.toFixed(1)}</span>
              <span class="rating-count">(${p.reviews.toLocaleString()} verified reviews)</span>
            </div>
            <div class="pmodal-price-row">
              <span class="product-price" style="font-size:26px;font-weight:900">₹${p.price}</span>
              <span class="product-mrp" style="font-size:16px">₹${p.mrp}</span>
              ${discount >= 5 ? `<span class="discount-tag" style="font-size:14px">${discount}% off</span>` : ''}
            </div>
            ${p.description ? `
            <div class="pmodal-description">
              <h4><i class="fas fa-info-circle"></i> About this medicine</h4>
              <p>${sanitize(p.description)}</p>
            </div>` : ''}
            ${p.requiresPrescription ? `
            <div class="rx-info-banner">
              <i class="fas fa-file-prescription"></i>
              <div>
                <strong>Prescription Required</strong>
                <p style="margin:2px 0 0;font-size:12px;opacity:.8">Upload your doctor's prescription to order this medicine</p>
              </div>
            </div>` : ''}
            <div style="display:flex;align-items:center;gap:12px;margin:14px 0">
              <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;${p.stock ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b'}">
                <i class="fas ${p.stock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${p.stock ? 'In Stock' : 'Out of Stock'}
              </span>
              ${p.requiresPrescription
                ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;background:#fef3c7;color:#92400e"><i class="fas fa-prescription"></i> Rx Only</span>`
                : `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;background:#e0f2fe;color:#0369a1"><i class="fas fa-store"></i> OTC</span>`}
            </div>
            ${p.tags?.length ? `
            <div class="pmodal-tags" style="margin-bottom:16px">
              ${p.tags.slice(0,6).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>` : ''}
            <div style="display:flex;gap:10px;margin-top:16px">
              ${p.stock
                ? `<button class="btn-add-cart" style="flex:1;padding:14px;font-size:15px" onclick="addToCart('${id}');closeProductModal()">
                     <i class="fas fa-cart-plus"></i> Add to Cart
                   </button>
                   <a href="upload-prescription.html" class="btn-quick-view" style="padding:14px;font-size:14px;white-space:nowrap" title="Upload Prescription">
                     <i class="fas fa-file-medical"></i>
                   </a>`
                : `<button class="btn-add-cart disabled" style="flex:1;padding:14px" disabled>
                     Out of Stock
                   </button>`}
            </div>
            <div style="margin-top:12px;display:flex;align-items:center;gap:8px;font-size:12px;color:#64748b">
              <i class="fas fa-truck" style="color:#2ea89a"></i> Free delivery on orders above ₹499
              <span style="margin:0 8px">·</span>
              <i class="fas fa-shield-alt" style="color:#2ea89a"></i> 100% Genuine medicines
            </div>
          </div>
        </div>
      </div>
    </div>`;

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) { modal.style.display = 'none'; modal.innerHTML = ''; }
  document.body.style.overflow = '';
}

/* ── Cart ── */
function addToCart(productId) {
  const p = allProducts.find(x => x._id === productId);
  if (!p) return;
  const cart     = getCart();
  const existing = cart.find(i => i._id === productId);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ _id: p._id, name: p.name, price: p.price, image: p.image || '', qty: 1 });
  saveCart(cart);
  renderCart();
  showToast(`<i class="fas fa-check-circle"></i> ${sanitize(p.name)} added to cart`);
}

/* ── Toast ── */
function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg    = type === 'error' ? '#ef4444' : '#1e6b6b';
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;max-width:320px`;
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeProductModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('search-bar');
    if (s) { s.focus(); s.select(); }
  }
});
