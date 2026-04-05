 /* =====================================================
   MAIN.JS — MedPlus Pharmacy  (Enhanced)
   Features:
     • Real image loading with icon fallback
     • Lazy-loading images (IntersectionObserver)
     • Wishlist / favourite toggle (localStorage)
     • Debounced search with clear button
     • Quantity selector inside product modal
     • Category card counts synced after load
     • Back-to-top button
     • Keyboard shortcut: Ctrl/Cmd+K → focus search
     • Escape → close modal
===================================================== */

let allProducts    = [];
let allCategories  = [];
let activeCategory = 'all';
let searchDebounce = null;

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  updateNavAuth();
  initSearchAutocomplete('search-bar', 'autocomplete-list');
  setupSearchClearBtn();
  setupBackToTop();
  await loadCategories();
  await loadProducts();
  renderCart();
});

/* ─────────────────────────────────────────────────
   AUTH UI
───────────────────────────────────────────────── */
function updateNavAuth() {
  const user       = currentUser();
  const loginBtn   = document.getElementById('nav-login');
  const profileBtn = document.getElementById('nav-profile');
  const adminBtn   = document.getElementById('nav-admin');
  if (user) {
    if (loginBtn)   loginBtn.style.display = 'none';
    if (profileBtn) {
      profileBtn.style.display = '';
      profileBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name.split(' ')[0]}`;
    }
    if (adminBtn) adminBtn.style.display = user.isAdmin ? '' : 'none';
  } else {
    if (loginBtn)   loginBtn.style.display = '';
    if (profileBtn) profileBtn.style.display = 'none';
    if (adminBtn)   adminBtn.style.display = 'none';
  }
}

/* ─────────────────────────────────────────────────
   CATEGORY META  (icon + colour per category)
───────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────
   CATEGORIES
───────────────────────────────────────────────── */
async function loadCategories() {
  try {
    const data    = await ProductAPI.categories();
    allCategories = data.categories || [];
  } catch {
    allCategories = Object.keys(CATEGORY_META);
  }
  renderCategoryTabs(allCategories);
  renderCategoryCards(allCategories);
}

function renderCategoryTabs(cats) {
  const container = document.getElementById('category-tabs');
  if (!container) return;
  container.innerHTML = `
    <button class="cat-tab active" data-cat="all" onclick="setCategory('all', this)">
      <span class="cat-tab-icon"><i class="fas fa-store"></i></span>
      <span>All</span>
    </button>
    ${cats.map(c => {
      const meta = CATEGORY_META[c] || { icon: 'fa-pills', color: '#2ea89a', bg: '#ebfaf8' };
      return `
        <button class="cat-tab" data-cat="${c}"
          onclick="setCategory('${c.replace(/'/g, "\\'")}', this)"
          style="--cat-color:${meta.color}">
          <span class="cat-tab-icon"><i class="fas ${meta.icon}"></i></span>
          <span>${c}</span>
        </button>`;
    }).join('')}`;
}

function renderCategoryCards(cats) {
  const container = document.getElementById('category-cards');
  if (!container) return;
  container.innerHTML = cats.map(c => {
    const meta  = CATEGORY_META[c] || { icon: 'fa-pills', color: '#2ea89a', bg: '#ebfaf8' };
    const count = allProducts.filter(p => p.category === c).length;
    return `
      <div class="cat-card"
           onclick="setCategory('${c.replace(/'/g, "\\'")}', null)"
           style="background:${meta.bg};border-color:${meta.color}33">
        <div class="cat-card-icon" style="color:${meta.color};background:${meta.color}18">
          <i class="fas ${meta.icon}"></i>
        </div>
        <div class="cat-card-name">${c}</div>
        <div class="cat-card-count" style="color:${meta.color}">
          ${count ? count + ' medicines' : 'Browse'}
        </div>
      </div>`;
  }).join('');
}

function setCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const tabBtn = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    // Smooth-scroll to products grid when clicking a category card
    const section = document.getElementById('products-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  filterAndRender();
}

/* ─────────────────────────────────────────────────
   PRODUCTS — load + filter + render
───────────────────────────────────────────────── */
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
    renderCategoryCards(allCategories);         // update counts
    const statEl = document.getElementById('product-stat');
    if (statEl) statEl.textContent = allProducts.length + '+ medicines';
  } catch (err) {
    if (grid) grid.innerHTML = `
      <div class="api-error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Could not connect to server</h3>
        <p>${err.message}</p>
        <p style="font-size:13px;margin-top:8px;opacity:.7">
          Make sure the backend is running on port 5000
        </p>
        <button onclick="loadProducts()" class="btn-retry">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>`;
  }
}

function filterAndRender() {
  const q           = (document.getElementById('search-bar')?.value || '').toLowerCase().trim();
  const sortBy      = document.getElementById('sort-select')?.value  || 'name';
  const inStockOnly = document.getElementById('in-stock-toggle')?.checked;
  const rxFilter    = document.getElementById('rx-filter')?.value    || '';
  const priceMax    = parseInt(document.getElementById('price-filter')?.value || '9999');

  let filtered = allProducts.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (q && !p.name.toLowerCase().includes(q)
          && !p.category.toLowerCase().includes(q)
          && !(p.description || '').toLowerCase().includes(q)
          && !(p.tags || []).some(t => t.toLowerCase().includes(q))) return false;
    if (inStockOnly && !p.stock) return false;
    if (rxFilter === 'otc' && p.requiresPrescription)  return false;
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
    countEl.textContent =
      `${filtered.length} product${filtered.length !== 1 ? 's' : ''} in ${catLabel}`;
  }
}

function discountPct(p) {
  return Math.round((p.mrp - p.price) / p.mrp * 100);
}

/* ─────────────────────────────────────────────────
   PRODUCT GRID
───────────────────────────────────────────────── */
function renderProductGrid(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"
           style="font-size:48px;color:#cbd5e1;margin-bottom:16px;display:block"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
        <button onclick="clearFilters()" class="btn-clear">
          <i class="fas fa-times"></i> Clear Filters
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p => productCardHtml(p)).join('');
  setupLazyImages(grid);   // attach IntersectionObserver for images
}

/* ─────────────────────────────────────────────────
   PRODUCT CARD HTML
───────────────────────────────────────────────── */
function productCardHtml(p) {
  const discount  = discountPct(p);
  const stars     = renderStars(p.rating);
  const user      = currentUser();
  const id        = p._id;
  const meta      = CATEGORY_META[p.category] || { color: '#2ea89a', bg: '#ebfaf8', icon: 'fa-pills' };
  const wished    = isWished(id);

  return `
    <div class="product-card" id="card-${id}">
      ${discount >= 5 ? `<div class="discount-badge">-${discount}%</div>` : ''}
      ${p.requiresPrescription ? `<div class="rx-badge"><i class="fas fa-file-prescription"></i> Rx</div>` : ''}
      ${!p.stock ? `<div class="out-badge">Out of Stock</div>` : ''}

      <!-- Wishlist button -->
      <button class="btn-wish${wished ? ' wished' : ''}"
              onclick="toggleWish('${id}', this)"
              title="${wished ? 'Remove from wishlist' : 'Add to wishlist'}"
              aria-label="Wishlist">
        <i class="fa${wished ? 's' : 'r'} fa-heart"></i>
      </button>

      <!-- Image -->
      <div class="product-img-wrap" onclick="openProductModal('${id}')"
           style="background:${meta.bg}">
        ${p.image ? `
          <img data-src="${p.image}"
               src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"
               alt="${p.name}" class="product-img lazy"
               onerror="imgError(this, '${meta.color}', '${meta.icon}')">` : ''}
        <div class="product-img-placeholder"
             style="display:${p.image ? 'none' : 'flex'};color:${meta.color}">
          <i class="fas ${meta.icon}"></i>
        </div>
      </div>

      <!-- Info -->
      <div class="product-info">
        <div class="product-category"
             style="color:${meta.color};background:${meta.bg}">
          ${p.category}
        </div>
        <h3 class="product-name" onclick="openProductModal('${id}')">${p.name}</h3>
        <div class="product-mfr">
          <i class="fas fa-industry"
             style="opacity:.5;font-size:11px;margin-right:3px"></i>${p.manufacturer || ''}
        </div>
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
                    style="text-decoration:none;display:flex;align-items:center;
                           justify-content:center;gap:6px">
                   <i class="fas fa-lock"></i> Login to Order
                 </a>`
              : `<button class="btn-add-cart" onclick="addToCart('${id}')">
                   <i class="fas fa-cart-plus"></i> Add to Cart
                 </button>`)
            : `<button class="btn-add-cart disabled" disabled>Out of Stock</button>`
          }
          <button class="btn-quick-view"
                  onclick="openProductModal('${id}')"
                  title="Quick View">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────
   LAZY IMAGE LOADING  (IntersectionObserver)
───────────────────────────────────────────────── */
function setupLazyImages(root) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all immediately
    root.querySelectorAll('img.lazy').forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy');
    });
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      observer.unobserve(img);
    });
  }, { rootMargin: '200px' });

  root.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
}

/* ─────────────────────────────────────────────────
   IMAGE ERROR FALLBACK
   When a medicine image fails to load, replace it
   with the category icon placeholder cleanly.
───────────────────────────────────────────────── */
function imgError(img, color, icon) {
  img.style.display = 'none';
  const placeholder = img.nextElementSibling;
  if (placeholder) {
    placeholder.style.display = 'flex';
    placeholder.style.color   = color;
    placeholder.innerHTML     = `<i class="fas ${icon}"></i>`;
  }
}

/* ─────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────── */
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    '<span style="color:#f59e0b">' +
      '<i class="fas fa-star"></i>'.repeat(full) +
      (half ? '<i class="fas fa-star-half-alt"></i>' : '') +
    '</span>' +
    '<i class="far fa-star" style="color:#e2e8f0"></i>'.repeat(empty)
  );
}

/* ─────────────────────────────────────────────────
   FILTER HELPERS
───────────────────────────────────────────────── */
function clearFilters() {
  const s  = document.getElementById('search-bar');       if (s)  s.value = '';
  const r  = document.getElementById('sort-select');      if (r)  r.value = 'name';
  const t  = document.getElementById('in-stock-toggle');  if (t)  t.checked = false;
  const x  = document.getElementById('rx-filter');        if (x)  x.value = '';
  const pf = document.getElementById('price-filter');
  if (pf) { pf.value = pf.max; updatePriceLabel(); }
  toggleSearchClearBtn('');
  setCategory('all', document.querySelector('.cat-tab[data-cat="all"]'));
}

function updatePriceLabel() {
  const pf = document.getElementById('price-filter');
  const pl = document.getElementById('price-label');
  if (pf && pl) pl.textContent = pf.value >= pf.max ? 'Any price' : '₹' + pf.value;
}

/* ─────────────────────────────────────────────────
   SEARCH — debounce + clear button
───────────────────────────────────────────────── */
function setupSearchClearBtn() {
  const searchBar = document.getElementById('search-bar');
  if (!searchBar) return;

  // Inject clear × button next to search input
  const wrap = searchBar.closest('.nav-search-inner') || searchBar.parentElement;
  const clearBtn = document.createElement('button');
  clearBtn.id = 'search-clear-btn';
  clearBtn.type = 'button';
  clearBtn.innerHTML = '<i class="fas fa-times"></i>';
  clearBtn.style.cssText =
    'display:none;position:absolute;right:52px;top:50%;transform:translateY(-50%);' +
    'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;' +
    'padding:4px 8px;z-index:10;line-height:1';
  clearBtn.onclick = () => {
    searchBar.value = '';
    clearBtn.style.display = 'none';
    filterAndRender();
    searchBar.focus();
  };
  if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(clearBtn); }

  // Debounced input
  searchBar.addEventListener('input', () => {
    const val = searchBar.value;
    toggleSearchClearBtn(val);
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => filterAndRender(), 280);
  });
}

function toggleSearchClearBtn(val) {
  const btn = document.getElementById('search-clear-btn');
  if (btn) btn.style.display = val ? 'block' : 'none';
}

/* ─────────────────────────────────────────────────
   WISHLIST  (localStorage)
───────────────────────────────────────────────── */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('medplus_wish') || '[]'); }
  catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('medplus_wish', JSON.stringify(list));
}
function isWished(id) {
  return getWishlist().includes(id);
}
function toggleWish(id, btn) {
  let list = getWishlist();
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
    if (btn) {
      btn.classList.remove('wished');
      btn.querySelector('i').className = 'far fa-heart';
      btn.title = 'Add to wishlist';
    }
    showToast('<i class="fas fa-heart-broken"></i> Removed from wishlist', 'info');
  } else {
    list.push(id);
    if (btn) {
      btn.classList.add('wished');
      btn.querySelector('i').className = 'fas fa-heart';
      btn.title = 'Remove from wishlist';
    }
    showToast('<i class="fas fa-heart"></i> Added to wishlist');
  }
  saveWishlist(list);
}

/* ─────────────────────────────────────────────────
   PRODUCT MODAL  (with qty selector)
───────────────────────────────────────────────── */
function openProductModal(id) {
  const p = allProducts.find(x => x._id === id);
  if (!p) return;

  const discount = discountPct(p);
  const meta     = CATEGORY_META[p.category] || { color: '#2ea89a', bg: '#ebfaf8', icon: 'fa-pills' };
  const modal    = document.getElementById('product-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="pmodal-overlay" onclick="closeProductModal()">
      <div class="pmodal-content" onclick="event.stopPropagation()">
        <button class="pmodal-close" onclick="closeProductModal()">
          <i class="fas fa-times"></i>
        </button>

        <div class="pmodal-body">
          <!-- Left: image -->
          <div class="pmodal-img" style="background:${meta.bg}">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name}"
                      style="max-width:100%;max-height:260px;object-fit:contain"
                      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
              : ''}
            <div class="pmodal-img-ph"
                 style="display:${p.image ? 'none' : 'flex'};color:${meta.color};
                        font-size:80px;opacity:.25">
              <i class="fas ${meta.icon}"></i>
            </div>
          </div>

          <!-- Right: info -->
          <div class="pmodal-info">
            <div class="product-category"
                 style="color:${meta.color};background:${meta.bg};
                        display:inline-flex;align-items:center;gap:5px;margin-bottom:8px">
              <i class="fas ${meta.icon}"></i>${p.category}
            </div>

            <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;line-height:1.3">
              ${p.name}
            </h2>
            <div style="font-size:13px;color:#64748b;margin-bottom:12px">
              <i class="fas fa-industry" style="margin-right:4px;opacity:.5"></i>
              ${p.manufacturer || 'MedPlus'}
            </div>

            <!-- Rating -->
            <div class="product-rating" style="margin-bottom:14px">
              ${renderStars(p.rating)}
              <span class="rating-num">${p.rating.toFixed(1)}</span>
              <span class="rating-count">(${p.reviews.toLocaleString()} verified reviews)</span>
            </div>

            <!-- Price -->
            <div class="pmodal-price-row">
              <span class="product-price" style="font-size:26px;font-weight:900">
                ₹${p.price}
              </span>
              <span class="product-mrp" style="font-size:16px">₹${p.mrp}</span>
              ${discount >= 5
                ? `<span class="discount-tag" style="font-size:14px">${discount}% off</span>`
                : ''}
            </div>
            <div style="font-size:12px;color:#64748b;margin-bottom:12px">
              Inclusive of all taxes
            </div>

            <!-- Description -->
            ${p.description ? `
            <div class="pmodal-description">
              <h4><i class="fas fa-info-circle"></i> About this medicine</h4>
              <p>${p.description}</p>
            </div>` : ''}

            <!-- Rx banner -->
            ${p.requiresPrescription ? `
            <div class="rx-info-banner">
              <i class="fas fa-file-prescription"></i>
              <div>
                <strong>Prescription Required</strong>
                <p style="margin:2px 0 0;font-size:12px;opacity:.8">
                  Upload your doctor's prescription to order this medicine
                </p>
              </div>
            </div>` : ''}

            <!-- Stock + OTC/Rx badges -->
            <div style="display:flex;align-items:center;gap:10px;margin:14px 0 10px">
              <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
                     border-radius:20px;font-size:12px;font-weight:700;
                     ${p.stock
                       ? 'background:#dcfce7;color:#166534'
                       : 'background:#fee2e2;color:#991b1b'}">
                <i class="fas ${p.stock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${p.stock ? 'In Stock' : 'Out of Stock'}
              </span>
              ${p.requiresPrescription
                ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;
                          border-radius:20px;font-size:12px;font-weight:700;
                          background:#fef3c7;color:#92400e">
                     <i class="fas fa-prescription"></i> Rx Only
                   </span>`
                : `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;
                          border-radius:20px;font-size:12px;font-weight:700;
                          background:#e0f2fe;color:#0369a1">
                     <i class="fas fa-store"></i> OTC
                   </span>`}
            </div>

            <!-- Tags -->
            ${p.tags?.length ? `
            <div class="pmodal-tags" style="margin-bottom:16px">
              ${p.tags.slice(0, 6).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>` : ''}

            <!-- Qty selector + Add to cart -->
            ${p.stock ? `
            <div style="display:flex;align-items:center;gap:10px;margin-top:16px">
              <!-- Quantity picker -->
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;
                          border-radius:10px;overflow:hidden;flex-shrink:0">
                <button onclick="modalQty(-1)"
                        style="width:36px;height:44px;background:#f8fafc;border:none;
                               cursor:pointer;font-size:18px;color:#475569;font-weight:700">
                  −
                </button>
                <span id="modal-qty"
                      style="min-width:36px;text-align:center;font-size:16px;
                             font-weight:700;color:#1e293b">
                  1
                </span>
                <button onclick="modalQty(1)"
                        style="width:36px;height:44px;background:#f8fafc;border:none;
                               cursor:pointer;font-size:18px;color:#475569;font-weight:700">
                  +
                </button>
              </div>

              <!-- Add to cart -->
              <button class="btn-add-cart"
                      style="flex:1;padding:14px;font-size:15px"
                      onclick="addToCartQty('${id}')">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>

              <!-- Wishlist -->
              <button class="btn-quick-view btn-wish-modal${isWished(id) ? ' wished' : ''}"
                      onclick="toggleWish('${id}', this)"
                      style="padding:12px 14px;flex-shrink:0"
                      title="Wishlist">
                <i class="fa${isWished(id) ? 's' : 'r'} fa-heart"
                   style="color:${isWished(id) ? '#ef4444' : '#94a3b8'}"></i>
              </button>
            </div>` : `
            <button class="btn-add-cart disabled"
                    style="flex:1;padding:14px;margin-top:16px" disabled>
              Out of Stock
            </button>`}

            <!-- Trust badges -->
            <div style="margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;
                        gap:12px;font-size:12px;color:#64748b;border-top:1px solid #f1f5f9;
                        padding-top:12px">
              <span><i class="fas fa-truck" style="color:#2ea89a;margin-right:4px"></i>
                Free delivery over ₹499</span>
              <span><i class="fas fa-shield-alt" style="color:#2ea89a;margin-right:4px"></i>
                100% Genuine</span>
              <span><i class="fas fa-undo" style="color:#2ea89a;margin-right:4px"></i>
                Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

/* Modal quantity stepper */
let _modalQty = 1;
function modalQty(delta) {
  const el = document.getElementById('modal-qty');
  if (!el) return;
  _modalQty = Math.max(1, Math.min(10, (_modalQty || 1) + delta));
  el.textContent = _modalQty;
}

function addToCartQty(productId) {
  const qty = _modalQty || 1;
  for (let i = 0; i < qty; i++) addToCart(productId, true);
  closeProductModal();
  _modalQty = 1;
  const p = allProducts.find(x => x._id === productId);
  if (p) showToast(
    `<i class="fas fa-check-circle"></i> ${qty > 1 ? qty + '× ' : ''}${p.name} added to cart`
  );
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) { modal.style.display = 'none'; modal.innerHTML = ''; }
  document.body.style.overflow = '';
  _modalQty = 1;
}

/* ─────────────────────────────────────────────────
   CART
───────────────────────────────────────────────── */
function addToCart(productId, silent = false) {
  const p = allProducts.find(x => x._id === productId);
  if (!p) return;
  const cart     = getCart();
  const existing = cart.find(i => i._id === productId);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ _id: p._id, name: p.name, price: p.price, image: p.image || '', qty: 1 });
  saveCart(cart);
  renderCart();
  if (!silent) {
    showToast(`<i class="fas fa-check-circle"></i> ${p.name} added to cart`);
  }
}

/* ─────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:9999;' +
      'display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'error' ? '#ef4444'
           : type === 'info'  ? '#475569'
           : '#1e6b6b';
  toast.style.cssText =
    `background:${bg};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;` +
    `font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);display:flex;align-items:center;` +
    `gap:8px;max-width:320px;pointer-events:all;animation:slideInRight .25s ease`;
  toast.innerHTML = msg;
  container.appendChild(toast);

  // Add animation keyframes once
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent =
      `@keyframes slideInRight{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.transition = 'opacity .3s,transform .3s';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateX(110%)';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

/* ─────────────────────────────────────────────────
   BACK TO TOP BUTTON
───────────────────────────────────────────────── */
function setupBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.title = 'Back to top';
  btn.style.cssText =
    'position:fixed;bottom:84px;right:24px;z-index:800;width:44px;height:44px;' +
    'border-radius:50%;background:#1e6b6b;color:#fff;border:none;cursor:pointer;' +
    'font-size:16px;display:none;align-items:center;justify-content:center;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.2);transition:opacity .25s,background .2s';
  btn.onmouseenter = () => btn.style.background = '#155555';
  btn.onmouseleave = () => btn.style.background = '#1e6b6b';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });
}

/* ─────────────────────────────────────────────────
   WISHLIST BUTTON CSS  (injected once)
───────────────────────────────────────────────── */
(function injectWishStyles() {
  if (document.getElementById('wish-styles')) return;
  const s = document.createElement('style');
  s.id = 'wish-styles';
  s.textContent = `
    .btn-wish {
      position:absolute; top:10px; right:${0}px; z-index:6;
      width:34px; height:34px; border-radius:50%;
      background:rgba(255,255,255,.9); border:1.5px solid #e2e8f0;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      font-size:15px; color:#94a3b8; transition:all .2s;
      /* push left of Rx badge */
    }
    .rx-badge ~ .btn-wish { right:10px; }
    .btn-wish:not(.rx-badge ~ .btn-wish) { right:10px; }
    .btn-wish:hover  { border-color:#ef4444; color:#ef4444; background:#fff; }
    .btn-wish.wished { border-color:#ef4444; color:#ef4444; background:#fff5f5; }
  `;
  document.head.appendChild(s);
})();

/* ─────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeProductModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('search-bar');
    if (s) { s.focus(); s.select(); }
  }
});
