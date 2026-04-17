/* =============================================================
   navbar.js — MedPlus  |  Shared navbar controller
   Depends on: api.js (currentUser, logout)
   Load AFTER api.js, BEFORE page-specific scripts.
   Inject navbar HTML via MedNavbar.init() or call it from
   each page if you prefer to keep static HTML in place.
   ============================================================= */

const MedNavbar = (() => {
  /* ── Cached DOM refs (populated once in _cacheEls) ── */
  let _el = {};

  /* ─────────────────────────────────────────────────────────
     PUBLIC: call once per page.
     If `rootPath` is omitted the navbar assumes it is already
     in the document (static HTML). Pass rootPath = ''  for
     root pages, '../' for pages one level deep (Admin/).
  ───────────────────────────────────────────────────────── */
  function init(rootPath) {
    if (rootPath !== undefined) {
      _inject(rootPath);
    }
    _cacheEls();
    _bindEvents();
    _syncAuth();
    _syncCartBadge();
    _observeCartBadge();
    _highlightCurrentPage();
  }

  /* ─────────────────────────────────────────────────────────
     INJECT shared navbar HTML into #navbar-placeholder
     (for pages that opt-in to JS injection instead of static)
  ───────────────────────────────────────────────────────── */
  function _inject(r) {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    placeholder.outerHTML = _template(r);
  }

  function _template(r) {
    return `
<div id="toast-container" class="toast-container" role="status" aria-live="polite" aria-atomic="true"></div>

<nav class="navbar" id="main-navbar" aria-label="Main navigation">
  <div class="navbar-top" role="complementary">
    <div class="container">
      <div class="top-links">
        <a href="tel:1800-123-456"><i class="fas fa-phone-alt" aria-hidden="true"></i> 1800-123-456</a>
        <a href="mailto:support@medplus.com"><i class="fas fa-envelope" aria-hidden="true"></i> support@medplus.com</a>
      </div>
      <div class="top-links">
        <a href="${r}upload-prescription.html"><i class="fas fa-file-prescription" aria-hidden="true"></i> Upload Rx</a>
        <a href="${r}insurance.html"><i class="fas fa-shield-alt" aria-hidden="true"></i> Insurance</a>
      </div>
    </div>
  </div>

  <div class="navbar-main">
    <div class="container">
      <a class="nav-logo" href="${r}index.html" aria-label="MedPlus home">
        <div class="nav-logo-icon" aria-hidden="true">M+</div>
        <span class="nav-logo-text">Med<span>Plus</span></span>
      </a>

      <div class="nav-search" role="search">
        <div class="nav-search-inner">
          <input type="text" id="search-bar"
            placeholder="Search medicines, brands…"
            autocomplete="off"
            aria-label="Search medicines"
            oninput="typeof filterAndRender==='function'&&filterAndRender()"
            onkeydown="if(event.key==='Enter'){window.location.href='${r}products.html?q='+encodeURIComponent(this.value.trim())}">
          <button aria-label="Search"
            onclick="window.location.href='${r}products.html?q='+encodeURIComponent(document.getElementById('search-bar').value.trim())">
            <i class="fas fa-search" aria-hidden="true"></i>
            <span class="btn-label">Search</span>
          </button>
        </div>
        <div id="autocomplete-list" class="autocomplete-dropdown" role="listbox" aria-label="Search suggestions"></div>
      </div>

      <div class="nav-actions" role="list">
        <a href="${r}products.html" class="nav-btn nav-btn-ghost" role="listitem">
          <i class="fas fa-pills" aria-hidden="true"></i><span>Products</span>
        </a>
        <a href="${r}insurance.html" class="nav-btn nav-btn-ghost hide-mobile" role="listitem">
          <i class="fas fa-shield-alt" aria-hidden="true"></i><span>Insurance</span>
        </a>

        <!-- Auth: Login (guest) -->
        <a href="${r}login.html" class="nav-btn nav-btn-ghost" id="nav-login" role="listitem">
          <i class="fas fa-sign-in-alt" aria-hidden="true"></i><span>Login</span>
        </a>

        <!-- Auth: Profile (logged in) -->
        <a href="${r}profile.html" class="nav-btn nav-btn-ghost" id="nav-profile"
           style="display:none" role="listitem">
          <i class="fas fa-user" aria-hidden="true"></i>
          <span id="nav-profile-name">Profile</span>
        </a>

        <!-- Auth: Admin -->
        <a href="${r}admin-dashboard.html" class="nav-btn nav-btn-admin" id="nav-admin"
           style="display:none" role="listitem">
          <i class="fas fa-cog" aria-hidden="true"></i>
          <span class="hide-mobile">Admin</span>
        </a>

        <!-- Auth: Logout -->
        <button class="nav-btn nav-btn-logout" id="nav-logout"
          style="display:none" onclick="logout()" role="listitem">
          <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
          <span class="hide-mobile">Logout</span>
        </button>

        <!-- Cart -->
        <a href="${r}cart.html" class="nav-btn nav-btn-cart" id="nav-cart"
           aria-label="Shopping cart" role="listitem">
          <i class="fas fa-shopping-cart" aria-hidden="true"></i>
          <span class="hide-mobile">Cart</span>
          <span class="cart-badge" id="cart-count" style="display:none" aria-label="items in cart">0</span>
        </a>
      </div>

      <!-- Hamburger (mobile only) -->
      <button class="nav-hamburger" id="nav-hamburger"
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="nav-mobile-drawer"
        onclick="MedNavbar.toggleDrawer()">
        <i class="fas fa-bars" id="hamburger-icon" aria-hidden="true"></i>
      </button>
    </div>
  </div>

  <!-- Mobile drawer -->
  <div class="nav-mobile-drawer" id="nav-mobile-drawer"
    role="dialog" aria-label="Mobile navigation" aria-modal="false">

    <div class="mob-search" role="search">
      <input type="text" id="mob-search-bar"
        placeholder="Search medicines…"
        aria-label="Search medicines (mobile)"
        onkeydown="if(event.key==='Enter'){window.location.href='${r}products.html?q='+encodeURIComponent(this.value.trim())}">
      <button aria-label="Search"
        onclick="window.location.href='${r}products.html?q='+encodeURIComponent(document.getElementById('mob-search-bar').value.trim())">
        <i class="fas fa-search" aria-hidden="true"></i>
      </button>
    </div>

    <a href="${r}products.html"><i class="fas fa-pills" aria-hidden="true"></i> Products</a>
    <a href="${r}insurance.html"><i class="fas fa-shield-alt" aria-hidden="true"></i> Insurance</a>
    <a href="${r}upload-prescription.html"><i class="fas fa-file-prescription" aria-hidden="true"></i> Upload Rx</a>

    <a href="${r}login.html" class="mob-login" id="mob-nav-login">
      <i class="fas fa-sign-in-alt" aria-hidden="true"></i> Login
    </a>
    <a href="${r}profile.html" id="mob-nav-profile" style="display:none">
      <i class="fas fa-user" aria-hidden="true"></i>
      <span id="mob-profile-name">Profile</span>
    </a>
    <a href="${r}admin-dashboard.html" id="mob-nav-admin"
       style="display:none" class="mob-admin">
      <i class="fas fa-cog" aria-hidden="true"></i> Admin
    </a>
    <button class="mob-link mob-logout" id="mob-nav-logout"
      style="display:none" onclick="logout()">
      <i class="fas fa-sign-out-alt" aria-hidden="true"></i> Logout
    </button>

    <a href="${r}cart.html" class="mob-cart" id="mob-nav-cart" aria-label="Cart">
      <i class="fas fa-shopping-cart" aria-hidden="true"></i> Cart
      <span class="cart-badge" id="mob-cart-count"
        style="display:none;margin-left:4px" aria-hidden="true">0</span>
    </a>
  </div>
</nav>

<!-- Mobile overlay backdrop -->
<div class="nav-overlay" id="nav-overlay" aria-hidden="true"
     onclick="MedNavbar.closeDrawer()"></div>`;
  }

  /* ─────────────────────────────────────────────────────────
     DOM cache — query once, reuse everywhere
  ───────────────────────────────────────────────────────── */
  function _cacheEls() {
    const ids = [
      'main-navbar', 'nav-hamburger', 'hamburger-icon',
      'nav-mobile-drawer', 'nav-overlay',
      'nav-login', 'nav-profile', 'nav-profile-name',
      'nav-admin', 'nav-logout', 'nav-cart', 'cart-count',
      'mob-nav-login', 'mob-nav-profile', 'mob-profile-name',
      'mob-nav-admin', 'mob-nav-logout', 'mob-nav-cart', 'mob-cart-count',
    ];
    ids.forEach(id => { _el[id] = document.getElementById(id); });
  }

  /* ─────────────────────────────────────────────────────────
     Event bindings
  ───────────────────────────────────────────────────────── */
  function _bindEvents() {
    /* Close on outside click */
    document.addEventListener('click', e => {
      if (_el['main-navbar'] && !_el['main-navbar'].contains(e.target)) {
        closeDrawer();
      }
    });

    /* Close on Escape; focus back to hamburger */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDrawer();
        _el['nav-hamburger']?.focus();
      }
    });

    /* Close on resize to desktop */
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeDrawer();
    });

    /* Sticky offset CSS vars on scroll/resize */
    const updateOffsets = () => {
      const nav = _el['main-navbar'];
      if (!nav) return;
      const h = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--navbar-height', h + 'px');
    };
    window.addEventListener('scroll', updateOffsets, { passive: true });
    window.addEventListener('resize', updateOffsets);
    updateOffsets();

    /* Scroll-shadow */
    window.addEventListener('scroll', () => {
      _el['main-navbar']?.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────
     Drawer open / close
  ───────────────────────────────────────────────────────── */
  function toggleDrawer() {
    const isOpen = _el['nav-mobile-drawer']?.classList.contains('open');
    isOpen ? closeDrawer() : openDrawer();
  }

  function openDrawer() {
    const drawer = _el['nav-mobile-drawer'];
    const btn    = _el['nav-hamburger'];
    const icon   = _el['hamburger-icon'];
    const overlay = _el['nav-overlay'];
    if (!drawer) return;
    drawer.classList.add('open');
    overlay?.classList.add('visible');
    if (btn)  { btn.setAttribute('aria-expanded', 'true'); btn.classList.add('is-open'); }
    if (icon) icon.className = 'fas fa-times';
    /* Move focus into drawer for accessibility */
    const firstLink = drawer.querySelector('a, button, input');
    firstLink?.focus();
  }

  function closeDrawer() {
    const drawer = _el['nav-mobile-drawer'];
    const btn    = _el['nav-hamburger'];
    const icon   = _el['hamburger-icon'];
    const overlay = _el['nav-overlay'];
    if (!drawer?.classList.contains('open')) return;
    drawer.classList.remove('open');
    overlay?.classList.remove('visible');
    if (btn)  { btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('is-open'); }
    if (icon) icon.className = 'fas fa-bars';
  }

  /* ─────────────────────────────────────────────────────────
     Auth sync — desktop + mobile in one pass
  ───────────────────────────────────────────────────────── */
  function _syncAuth() {
    if (typeof currentUser !== 'function') return;
    const user = currentUser();

    const show = (el, display) => { if (el) el.style.display = display; };
    const text = (el, t)       => { if (el) el.textContent = t; };

    if (user) {
      const first = user.name ? user.name.split(' ')[0] : 'Profile';
      // Desktop
      show(_el['nav-login'],   'none');
      show(_el['nav-profile'], 'flex');
      show(_el['nav-logout'],  'flex');
      show(_el['nav-admin'],   user.isAdmin ? 'flex' : 'none');
      text(_el['nav-profile-name'], first);
      // Mobile
      show(_el['mob-nav-login'],   'none');
      show(_el['mob-nav-profile'], 'flex');
      show(_el['mob-nav-logout'],  'flex');
      show(_el['mob-nav-admin'],   user.isAdmin ? 'flex' : 'none');
      text(_el['mob-profile-name'], first);
    } else {
      // Desktop
      show(_el['nav-login'],   'flex');
      show(_el['nav-profile'], 'none');
      show(_el['nav-logout'],  'none');
      show(_el['nav-admin'],   'none');
      // Mobile
      show(_el['mob-nav-login'],   'flex');
      show(_el['mob-nav-profile'], 'none');
      show(_el['mob-nav-logout'],  'none');
      show(_el['mob-nav-admin'],   'none');
    }
  }

  /* ─────────────────────────────────────────────────────────
     Cart badge sync desktop → mobile
  ───────────────────────────────────────────────────────── */
  function _syncCartBadge() {
    const src = _el['cart-count'];
    const dst = _el['mob-cart-count'];
    if (!src || !dst) return;
    dst.textContent  = src.textContent;
    dst.style.display = src.style.display;
  }

  function _observeCartBadge() {
    const badge = _el['cart-count'];
    if (!badge) return;
    new MutationObserver(_syncCartBadge)
      .observe(badge, { childList: true, attributes: true, attributeFilter: ['style'] });
  }

  /* ─────────────────────────────────────────────────────────
     Highlight the current page link in the mobile drawer
  ───────────────────────────────────────────────────────── */
  function _highlightCurrentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const drawer = _el['nav-mobile-drawer'];
    if (!drawer) return;
    drawer.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.endsWith(page)) a.classList.add('mob-active');
    });
  }

  /* ─────────────────────────────────────────────────────────
     Public API — also exposed on window for inline onclick
  ───────────────────────────────────────────────────────── */
  return { init, toggleDrawer, openDrawer, closeDrawer, syncAuth: _syncAuth };
})();

/* Global shim so existing onclick="toggleMobileNav()" still works */
function toggleMobileNav() { MedNavbar.toggleDrawer(); }

/* Global shim so updateNavAuth() calls in page scripts still work */
function updateNavAuth() { MedNavbar.syncAuth(); }

/* ── Auto-init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => MedNavbar.init());
