/* cart.js — cart helpers (single source of truth) */
function getCart()      { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

function renderCart() {
  const cart  = getCart();
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const el    = document.getElementById('cart-count');
  const totEl = document.getElementById('cart-total-nav');
  if (el)    { el.textContent = count; el.style.display = count > 0 ? '' : 'none'; }
  if (totEl) totEl.textContent = '\u20b9' + total.toLocaleString('en-IN');
}
