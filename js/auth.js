/* =====================================================
   AUTH.JS — MedPlus auth state helpers
===================================================== */

function isLoggedIn() {
  const token = localStorage.getItem('medplus_token');
  const user  = getCurrentUser();
  return !!(token && user);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('medplus_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem('medplus_token', token);
  localStorage.setItem('medplus_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('medplus_token');
  localStorage.removeItem('medplus_user');
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

/* Redirect to login if not authenticated, preserving return URL */
function requireAuth(redirectTo) {
  if (!isLoggedIn()) {
    const ret = redirectTo || window.location.pathname.split('/').pop();
    window.location.href = 'login.html?redirect=' + encodeURIComponent(ret);
    return false;
  }
  return true;
}

/* ── Global alias used by main.js, Home.js, checkout.html, upload.js ── */
function currentUser() {
  return getCurrentUser();
}
