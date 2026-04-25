/* =====================================================
   NAVBAR.JS — Genezenz Pharmacy shared navbar injector
   + Rich product autocomplete on desktop & mobile search
===================================================== */

const MedNavbar = (() => {
  function cartCount() {
    try { const cart = JSON.parse(localStorage.getItem('cart')) || []; return cart.reduce((s, i) => s + (i.qty || 1), 0); } catch { return 0; }
  }
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('genezenz-pharmacy_user')); } catch { return null; }
  }

  function buildHTML(activePage) {
    const user  = currentUser();
    const count = cartCount();
    const badge = count > 0 ? `<span class="cart-badge">${count}</span>` : '';
    const authBtns = user
      ? `${user.isAdmin ? `<a href="admin-dashboard.html" class="nav-btn nav-btn-admin"><i class="fas fa-shield-alt"></i> Admin</a>` : ''}
         <a href="profile.html" class="nav-btn nav-btn-ghost"><i class="fas fa-user"></i> ${user.name?.split(' ')[0] || 'Account'}</a>
         <button onclick="MedNavbar.logout()" class="nav-btn nav-btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>`
      : `<a href="login.html" class="nav-btn nav-btn-ghost"><i class="fas fa-sign-in-alt"></i> Login</a>
         <a href="register.html" class="nav-btn" style="background:var(--teal-400);color:#fff;"><i class="fas fa-user-plus"></i> Register</a>`;
    const mobAuthLinks = user
      ? `${user.isAdmin ? `<a href="admin-dashboard.html" class="mob-admin"><i class="fas fa-shield-alt"></i> Admin Panel</a>` : ''}
         <a href="profile.html"><i class="fas fa-user"></i> My Account</a>
         <button class="mob-link mob-logout" onclick="MedNavbar.logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>`
      : `<a href="login.html" class="mob-login"><i class="fas fa-sign-in-alt"></i> Login</a>
         <a href="register.html"><i class="fas fa-user-plus"></i> Register</a>`;
    const isActive = (page) => activePage === page ? 'mob-active' : '';
    return `
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <div class="navbar-top">
    <div class="container">
      <div class="top-links">
        <a href="tel:1800-123-456"><i class="fas fa-phone-alt"></i> 1800-123-456</a>
        <a href="mailto:support@genezenz-pharmacy.com"><i class="fas fa-envelope"></i> support@genezenz-pharmacy.com</a>
      </div>
      <div class="top-links">
        <a href="upload-prescription.html"><i class="fas fa-file-prescription"></i> Upload Rx</a>
        <a href="insurance.html"><i class="fas fa-shield-alt"></i> Insurance</a>
      </div>
    </div>
  </div>
  <div class="navbar-main">
    <div class="container">
      <a href="index.html" class="nav-logo" aria-label="Genezenz Pharmacy home">
        <div class="nav-logo-icon">
          <img src="logo.png" alt="GZ" class="nav-logo-img" onerror="this.style.display='none';this.parentElement.textContent='GZ';this.parentElement.style.background='linear-gradient(135deg,var(--teal-400),var(--teal-600))';this.parentElement.style.color='#fff';">
        </div>
        <span class="nav-logo-text">Genezenz<span> Pharmacy</span></span>
      </a>
      <!-- Desktop search with rich autocomplete -->
      <div class="nav-search">
        <div class="nav-search-inner" style="position:relative">
          <input type="search" id="nav-search-input" placeholder="Search medicines, brands…" autocomplete="off" aria-label="Search medicines">
          <button onclick="MedNavbar.doSearch()" aria-label="Search"><i class="fas fa-search"></i> Search</button>
        </div>
        <div class="nav-ac-dropdown" id="nav-autocomplete"></div>
      </div>
      <div class="nav-actions">
        <a href="products.html" class="nav-btn nav-btn-ghost"><i class="fas fa-pills"></i> Products</a>
        <div class="nav-more-wrap">
          <button class="nav-btn nav-btn-ghost nav-more-btn" onclick="MedNavbar.toggleMore(event)">More <i class="fas fa-chevron-down" style="font-size:.7rem;margin-left:2px"></i></button>
          <div class="nav-more-dropdown" id="nav-more-dropdown">
            <a href="about.html"><i class="fas fa-info-circle"></i> About Us</a>
            <a href="contact.html"><i class="fas fa-envelope"></i> Contact</a>
            <a href="insurance.html"><i class="fas fa-shield-alt"></i> Insurance</a>
            <a href="upload-prescription.html"><i class="fas fa-file-prescription"></i> Upload Rx</a>
          </div>
        </div>
        <a href="cart.html" class="nav-btn nav-btn-cart" aria-label="Cart"><i class="fas fa-shopping-cart"></i> Cart ${badge}</a>
        ${authBtns}
      </div>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false"><i class="fas fa-bars"></i></button>
    </div>
  </div>
  <!-- Mobile drawer -->
  <div class="nav-mobile-drawer" id="nav-mobile-drawer" aria-hidden="true">
    <div class="mob-drawer-inner">
      <div class="mob-search" style="position:relative">
        <input type="search" id="mob-search-input" placeholder="Search medicines…" aria-label="Search" autocomplete="off">
        <button onclick="MedNavbar.doMobSearch()" aria-label="Search"><i class="fas fa-search"></i></button>
        <div class="nav-ac-dropdown" id="mob-autocomplete" style="left:0;right:44px;border-radius:10px"></div>
      </div>
      <a href="index.html" class="${isActive('home')}"><i class="fas fa-home"></i> Home</a>
      <a href="products.html" class="${isActive('products')}"><i class="fas fa-pills"></i> Products</a>
      <a href="about.html" class="${isActive('about')}"><i class="fas fa-info-circle"></i> About</a>
      <a href="contact.html" class="${isActive('contact')}"><i class="fas fa-envelope"></i> Contact</a>
      <a href="cart.html" class="mob-cart ${isActive('cart')}"><i class="fas fa-shopping-cart"></i> Cart ${badge}</a>
      <a href="upload-prescription.html" class="${isActive('rx')}"><i class="fas fa-file-prescription"></i> Upload Rx</a>
      <a href="insurance.html" class="${isActive('insurance')}"><i class="fas fa-shield-alt"></i> Insurance</a>
      ${mobAuthLinks}
    </div>
  </div>
</nav>
<div class="nav-overlay" id="nav-overlay"></div>`;
  }

  /* ── Inject autocomplete styles ── */
  function injectAcStyles() {
    if (document.getElementById('nav-ac-style')) return;
    const s = document.createElement('style');
    s.id = 'nav-ac-style';
    s.textContent = `
      .nav-ac-dropdown { display:none; position:absolute; top:calc(100% + 8px); left:0; right:0; background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; box-shadow:0 16px 48px rgba(0,0,0,.14); z-index:99999; max-height:440px; overflow-y:auto; overflow-x:hidden; }
      .nav-ac-dropdown.open { display:block; }
      .nac-header { padding:8px 14px 6px; font-size:10px; text-transform:uppercase; letter-spacing:.6px; font-weight:700; color:#94a3b8; border-bottom:1px solid #f1f5f9; }
      .nac-item { display:flex; align-items:center; gap:11px; padding:9px 14px; cursor:pointer; transition:background .12s; border-bottom:1px solid #f8fafc; }
      .nac-item:last-child { border-bottom:none; }
      .nac-item:hover, .nac-item.nac-active { background:#f0f9ff; }
      .nac-img { width:40px; height:40px; object-fit:contain; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; flex-shrink:0; }
      .nac-img-ph { width:40px; height:40px; border-radius:8px; border:1px solid #e2e8f0; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:16px; flex-shrink:0; }
      .nac-info { flex:1; min-width:0; }
      .nac-name { font-size:13px; font-weight:600; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .nac-name mark { background:#fef08a; color:#92400e; border-radius:2px; padding:0 1px; }
      .nac-meta { font-size:11px; color:#64748b; margin-top:1px; }
      .nac-right { text-align:right; flex-shrink:0; }
      .nac-price { font-size:13px; font-weight:700; color:#0f172a; }
      .nac-stock { font-size:10px; font-weight:700; padding:1px 6px; border-radius:20px; display:inline-block; margin-top:3px; }
      .nac-stock.in  { background:#dcfce7; color:#15803d; }
      .nac-stock.low { background:#fee2e2; color:#b91c1c; }
      .nac-stock.out { background:#f1f5f9; color:#94a3b8; }
      .nac-empty { padding:20px 14px; text-align:center; color:#94a3b8; font-size:13px; }
      .nac-footer { padding:8px 14px; border-top:1px solid #f1f5f9; font-size:12px; color:#2563eb; font-weight:600; text-align:center; cursor:pointer; transition:background .12s; }
      .nac-footer:hover { background:#f8fafc; }
    `;
    document.head.appendChild(s);
  }

  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hlMatch(text, q) {
    const words = (q||'').trim().split(/\s+/).filter(Boolean);
    let out = escH(text);
    words.forEach(w => { const re = new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'); out = out.replace(re,'<mark>$1</mark>'); });
    return out;
  }

  function buildNacDropdown(products, q, dropEl, selectFnName) {
    if (!products.length) {
      dropEl.innerHTML = `<div class="nac-empty"><i class="fas fa-search" style="display:block;font-size:20px;margin-bottom:6px;color:#cbd5e1"></i>No results for "<strong>${escH(q)}</strong>"</div>`;
      dropEl.classList.add('open'); return;
    }
    let html = `<div class="nac-header"><i class="fas fa-fire" style="color:#f59e0b;margin-right:4px"></i>${products.length} result${products.length!==1?'s':''} — press Enter to see all</div>`;
    products.forEach((p, i) => {
      const stock = Number(p.stock);
      const sClass = stock <= 0 ? 'out' : stock <= 10 ? 'low' : 'in';
      const sLabel = stock <= 0 ? 'Out of Stock' : stock <= 10 ? stock + ' left' : 'In Stock';
      const imgHtml = p.image
        ? `<img class="nac-img" src="${escH(p.image)}" alt="" onerror="this.outerHTML='<div class=nac-img-ph><i class=fas\\ fa-pills></i></div>'">`
        : `<div class="nac-img-ph"><i class="fas fa-pills"></i></div>`;
      html += `<div class="nac-item" data-idx="${i}" onmousedown="${selectFnName}('${escH(p._id)}','${escH(p.name).replace(/'/g,"\\'")}')">
        ${imgHtml}
        <div class="nac-info">
          <div class="nac-name">${hlMatch(p.name, q)}</div>
          <div class="nac-meta">${escH(p.category)}${p.manufacturer?' &middot; '+escH(p.manufacturer):''}</div>
        </div>
        <div class="nac-right">
          <div class="nac-price">&#8377;${p.price}</div>
          <span class="nac-stock ${sClass}">${sLabel}</span>
        </div>
      </div>`;
    });
    html += `<div class="nac-footer" onmousedown="${selectFnName}('','${escH(q)}')"><i class="fas fa-search"></i> See all results for "${escH(q)}"</div>`;
    dropEl.innerHTML = html;
    dropEl.classList.add('open');
  }

  /* ── Desktop autocomplete ── */
  let desktopTimer = null, desktopItems = [], desktopIdx = -1;

  function initDesktopSearch() {
    const input  = document.getElementById('nav-search-input');
    const dropEl = document.getElementById('nav-autocomplete');
    if (!input || !dropEl) return;
    input.addEventListener('input', () => {
      clearTimeout(desktopTimer);
      const q = input.value.trim();
      if (q.length < 2) { dropEl.classList.remove('open'); desktopItems = []; return; }
      desktopTimer = setTimeout(() => fetchAndBuild(q, dropEl, 'MedNavbar._navSelect', 'desktop'), 250);
    });
    input.addEventListener('keydown', e => {
      if (!dropEl.classList.contains('open')) return;
      const items = dropEl.querySelectorAll('.nac-item');
      if (e.key === 'ArrowDown')  { e.preventDefault(); desktopIdx = Math.min(desktopIdx+1, items.length-1); highlightNac(items, desktopIdx); }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); desktopIdx = Math.max(desktopIdx-1, 0); highlightNac(items, desktopIdx); }
      else if (e.key === 'Enter') { e.preventDefault(); dropEl.classList.remove('open'); MedNavbar.doSearch(); }
      else if (e.key === 'Escape') { dropEl.classList.remove('open'); }
    });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2 && desktopItems.length) dropEl.classList.add('open'); });
    document.addEventListener('mousedown', e => { if (!input.contains(e.target) && !dropEl.contains(e.target)) dropEl.classList.remove('open'); });
  }

  /* ── Mobile autocomplete ── */
  let mobTimer = null, mobItems = [], mobIdx = -1;

  function initMobSearch() {
    const input  = document.getElementById('mob-search-input');
    const dropEl = document.getElementById('mob-autocomplete');
    if (!input || !dropEl) return;
    input.addEventListener('input', () => {
      clearTimeout(mobTimer);
      const q = input.value.trim();
      if (q.length < 2) { dropEl.classList.remove('open'); mobItems = []; return; }
      mobTimer = setTimeout(() => fetchAndBuild(q, dropEl, 'MedNavbar._mobSelect', 'mob'), 250);
    });
    input.addEventListener('keydown', e => {
      if (!dropEl.classList.contains('open')) return;
      const items = dropEl.querySelectorAll('.nac-item');
      if (e.key === 'ArrowDown')  { e.preventDefault(); mobIdx = Math.min(mobIdx+1, items.length-1); highlightNac(items, mobIdx); }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); mobIdx = Math.max(mobIdx-1, 0); highlightNac(items, mobIdx); }
      else if (e.key === 'Enter') { e.preventDefault(); dropEl.classList.remove('open'); MedNavbar.doMobSearch(); }
      else if (e.key === 'Escape') { dropEl.classList.remove('open'); }
    });
    document.addEventListener('mousedown', e => { if (!input.contains(e.target) && !dropEl.contains(e.target)) dropEl.classList.remove('open'); });
  }

  function highlightNac(items, idx) {
    items.forEach((el, i) => el.classList.toggle('nac-active', i === idx));
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  async function fetchAndBuild(q, dropEl, selectFn, mode) {
    try {
      const base = window.API_BASE || 'https://medplus-lkr7.onrender.com';
      const res  = await fetch(`${base}/api/products?q=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) return;
      const data  = await res.json();
      const items = data.products || [];
      if (mode === 'desktop') { desktopItems = items; desktopIdx = -1; }
      else                    { mobItems = items; mobIdx = -1; }
      buildNacDropdown(items, q, dropEl, selectFn);
    } catch { dropEl.classList.remove('open'); }
  }

  function _navSelect(id, nameOrQuery) {
    const input  = document.getElementById('nav-search-input');
    const dropEl = document.getElementById('nav-autocomplete');
    dropEl.classList.remove('open');
    if (id) window.location.href = `products.html?id=${encodeURIComponent(id)}`;
    else { if (input) input.value = nameOrQuery; MedNavbar.doSearch(); }
  }

  function _mobSelect(id, nameOrQuery) {
    const input  = document.getElementById('mob-search-input');
    const dropEl = document.getElementById('mob-autocomplete');
    dropEl.classList.remove('open');
    if (id) window.location.href = `products.html?id=${encodeURIComponent(id)}`;
    else { if (input) input.value = nameOrQuery; MedNavbar.doMobSearch(); }
  }

  function init(activePage) {
    const ph = document.getElementById('navbar-placeholder');
    if (!ph) return;
    ph.innerHTML = buildHTML(activePage);
    injectAcStyles();

    const navbar = ph.querySelector('.navbar');
    if (navbar) {
      const setH = () => document.documentElement.style.setProperty('--navbar-height', navbar.offsetHeight + 'px');
      setH(); window.addEventListener('resize', setH);
    }

    const ham     = document.getElementById('nav-hamburger');
    const drawer  = document.getElementById('nav-mobile-drawer');
    const overlay = document.getElementById('nav-overlay');

    function openDrawer()  { drawer.classList.add('open'); overlay.classList.add('visible'); ham.setAttribute('aria-expanded','true'); drawer.setAttribute('aria-hidden','false'); }
    function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('visible'); ham.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); }

    if (ham)     ham.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('click', () => { const dd = document.getElementById('nav-more-dropdown'); if (dd) dd.classList.remove('open'); });
    window.addEventListener('scroll', () => { ph.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });

    initDesktopSearch();
    initMobSearch();

    // ── Back to top button ──
    if (!document.getElementById('back-to-top')) {
      const btn = document.createElement('button');
      btn.id = 'back-to-top';
      btn.title = 'Back to top';
      btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      document.body.appendChild(btn);
      window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
      }, { passive: true });
    }
  }

  function doSearch() {
    const q = document.getElementById('nav-search-input')?.value?.trim();
    if (q) window.location.href = `products.html?q=${encodeURIComponent(q)}`;
  }
  function doMobSearch() {
    const q = document.getElementById('mob-search-input')?.value?.trim();
    if (q) window.location.href = `products.html?q=${encodeURIComponent(q)}`;
  }
  function toggleMore(e) { e.stopPropagation(); const dd = document.getElementById('nav-more-dropdown'); if (dd) dd.classList.toggle('open'); }
  function logout() { localStorage.removeItem('genezenz-pharmacy_token'); localStorage.removeItem('genezenz-pharmacy_user'); window.location.href = 'index.html'; }

  return { init, doSearch, doMobSearch, logout, toggleMore, _navSelect, _mobSelect };
})();
