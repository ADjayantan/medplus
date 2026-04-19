/* =====================================================
   NAVBAR.JS — Genezenz Pharmacy shared navbar injector
===================================================== */

const MedNavbar = (() => {
  function cartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((s, i) => s + (i.qty || 1), 0);
    } catch { return 0; }
  }

  function currentUser() {
    try { return JSON.parse(localStorage.getItem('genezenz-pharmacy_user')); } catch { return null; }
  }

  function buildHTML(activePage) {
    const user  = currentUser();
    const count = cartCount();
    const badge = count > 0 ? `<span class="cart-badge">${count}</span>` : '';

    const authBtns = user
      ? `
        ${user.isAdmin ? `<a href="admin-dashboard.html" class="nav-btn nav-btn-admin"><i class="fas fa-shield-alt"></i> Admin</a>` : ''}
        <a href="profile.html" class="nav-btn nav-btn-ghost"><i class="fas fa-user"></i> ${user.name?.split(' ')[0] || 'Account'}</a>
        <button onclick="MedNavbar.logout()" class="nav-btn nav-btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
      `
      : `
        <a href="login.html" class="nav-btn nav-btn-ghost"><i class="fas fa-sign-in-alt"></i> Login</a>
        <a href="register.html" class="nav-btn" style="background:var(--teal-400);color:#fff;"><i class="fas fa-user-plus"></i> Register</a>
      `;

    const mobAuthLinks = user
      ? `
        ${user.isAdmin ? `<a href="admin-dashboard.html" class="mob-admin"><i class="fas fa-shield-alt"></i> Admin Panel</a>` : ''}
        <a href="profile.html"><i class="fas fa-user"></i> My Account</a>
        <button class="mob-link mob-logout" onclick="MedNavbar.logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
      `
      : `
        <a href="login.html" class="mob-login"><i class="fas fa-sign-in-alt"></i> Login</a>
        <a href="register.html"><i class="fas fa-user-plus"></i> Register</a>
      `;

    const isActive = (page) => activePage === page ? 'mob-active' : '';

    return `
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <!-- Top utility bar -->
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

  <!-- Main bar -->
  <div class="navbar-main">
    <div class="container">
      <a href="index.html" class="nav-logo" aria-label="Genezenz Pharmacy home">
        <div class="nav-logo-icon">GZ</div>
        <span class="nav-logo-text">Genezenz<span> Pharmacy</span></span>
      </a>

      <!-- Desktop search -->
      <div class="nav-search">
        <div class="nav-search-inner">
          <input
            type="search"
            id="nav-search-input"
            placeholder="Search medicines, brands…"
            autocomplete="off"
            aria-label="Search medicines"
          >
          <button onclick="MedNavbar.doSearch()" aria-label="Search">
            <i class="fas fa-search"></i> Search
          </button>
        </div>
        <div class="autocomplete-dropdown" id="nav-autocomplete"></div>
      </div>

      <!-- Desktop actions -->
      <div class="nav-actions">
        <a href="products.html" class="nav-btn nav-btn-ghost"><i class="fas fa-pills"></i> Products</a>
        <a href="about.html" class="nav-btn nav-btn-ghost"><i class="fas fa-info-circle"></i> About</a>
        <a href="contact.html" class="nav-btn nav-btn-ghost"><i class="fas fa-envelope"></i> Contact</a>
        <a href="insurance.html" class="nav-btn nav-btn-ghost"><i class="fas fa-shield-alt"></i> Insurance</a>
        <a href="cart.html" class="nav-btn nav-btn-cart" aria-label="Cart">
          <i class="fas fa-shopping-cart"></i> Cart ${badge}
        </a>
        ${authBtns}
      </div>

      <!-- Hamburger -->
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </div>

  <!-- Mobile drawer -->
  <div class="nav-mobile-drawer" id="nav-mobile-drawer" aria-hidden="true">
    <div class="mob-drawer-inner">
      <div class="mob-search">
        <input type="search" id="mob-search-input" placeholder="Search medicines…" aria-label="Search">
        <button onclick="MedNavbar.doMobSearch()" aria-label="Search"><i class="fas fa-search"></i></button>
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
<div class="nav-overlay" id="nav-overlay"></div>
    `;
  }

  function init(activePage) {
    const ph = document.getElementById('navbar-placeholder');
    if (!ph) return;
    ph.innerHTML = buildHTML(activePage);

    // Measure navbar height for sticky offset CSS var
    const navbar = ph.querySelector('.navbar');
    if (navbar) {
      const setH = () => document.documentElement.style.setProperty('--navbar-height', navbar.offsetHeight + 'px');
      setH();
      window.addEventListener('resize', setH);
    }

    // Hamburger toggle
    const ham     = document.getElementById('nav-hamburger');
    const drawer  = document.getElementById('nav-mobile-drawer');
    const overlay = document.getElementById('nav-overlay');

    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('visible');
      ham.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('visible');
      ham.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    }

    if (ham)     ham.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
      ph.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Desktop search autocomplete
    const input = document.getElementById('nav-search-input');
    const acDrop = document.getElementById('nav-autocomplete');
    if (input && acDrop) {
      let acTimer;
      input.addEventListener('input', () => {
        clearTimeout(acTimer);
        const q = input.value.trim();
        if (q.length < 2) { acDrop.style.display = 'none'; return; }
        acTimer = setTimeout(() => runAutocomplete(q, acDrop), 280);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { acDrop.style.display = 'none'; MedNavbar.doSearch(); }
        if (e.key === 'Escape') acDrop.style.display = 'none';
      });
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !acDrop.contains(e.target)) acDrop.style.display = 'none';
      });
    }
  }

  async function runAutocomplete(q, drop) {
    try {
      const base = window.API_BASE || 'https://medplus-lkr7.onrender.com';
      const res  = await fetch(`${base}/api/products?search=${encodeURIComponent(q)}&autocomplete=true&limit=6`);
      if (!res.ok) return;
      const items = await res.json();
      if (!items.length) { drop.style.display = 'none'; return; }
      drop.innerHTML = items.map(p => `
        <div class="ac-item" onclick="window.location.href='products.html?q=${encodeURIComponent(p.name)}'">
          <i class="fas fa-pills ac-icon"></i>
          <span class="ac-name">${p.name}</span>
          <span class="ac-cat">${p.category || ''}</span>
        </div>
      `).join('');
      drop.style.display = 'block';
    } catch { /* silent */ }
  }

  function doSearch() {
    const q = document.getElementById('nav-search-input')?.value?.trim();
    if (q) window.location.href = `products.html?q=${encodeURIComponent(q)}`;
  }

  function doMobSearch() {
    const q = document.getElementById('mob-search-input')?.value?.trim();
    if (q) window.location.href = `products.html?q=${encodeURIComponent(q)}`;
  }

  function logout() {
    localStorage.removeItem('genezenz-pharmacy_token');
    localStorage.removeItem('genezenz-pharmacy_user');
    window.location.href = 'index.html';
  }

  return { init, doSearch, doMobSearch, logout };
})();
