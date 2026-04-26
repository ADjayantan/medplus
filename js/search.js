/* =====================================================
   search.js — Rich autocomplete for desktop + mobile
===================================================== */

function initSearchAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;

  /* ── Inject styles once ── */
  if (!document.getElementById('search-ac-style')) {
    const s = document.createElement('style');
    s.id = 'search-ac-style';
    s.textContent = `
      .ac-dropdown-wrap {
        display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0;
        background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,.22); z-index: 999999;
        max-height: 460px; overflow-y: auto; overflow-x: hidden;
        pointer-events: all;
      }
      .ac-dropdown-wrap.open { display: block; }
      .ac-header { padding: 8px 14px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; }
      .ac-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; transition: background .12s; border-bottom: 1px solid #f8fafc; }
      .ac-item:last-child { border-bottom: none; }
      .ac-item.ac-active, .ac-item:hover { background: #f0f9ff; }
      .ac-thumb { width: 42px; height: 42px; object-fit: contain; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
      .ac-thumb-ph { width: 42px; height: 42px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 17px; flex-shrink: 0; }
      .ac-body { flex: 1; min-width: 0; }
      .ac-name { font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ac-name mark { background: #fef08a; color: #92400e; border-radius: 2px; padding: 0 1px; }
      .ac-sub { font-size: 11px; color: #64748b; margin-top: 2px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .ac-right { text-align: right; flex-shrink: 0; }
      .ac-price { font-size: 13px; font-weight: 700; color: #0f172a; }
      .ac-mrp { font-size: 11px; color: #94a3b8; text-decoration: line-through; }
      .ac-disc { font-size: 10px; font-weight: 700; color: #16a34a; }
      .ac-stock-pill { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; white-space: nowrap; }
      .ac-stock-pill.in  { background: #dcfce7; color: #15803d; }
      .ac-stock-pill.low { background: #fee2e2; color: #b91c1c; }
      .ac-stock-pill.out { background: #f1f5f9; color: #94a3b8; }
      .ac-rx-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 20px; background: #ede9fe; color: #6d28d9; }
      .ac-empty { padding: 22px 16px; text-align: center; color: #94a3b8; font-size: 13px; }
      .ac-empty i { font-size: 22px; display: block; margin-bottom: 8px; color: #cbd5e1; }
      .ac-footer { padding: 9px 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #2563eb; font-weight: 600; text-align: center; cursor: pointer; }
      .ac-footer:hover { background: #eff6ff; }
      .ac-overlay {
        display: none; position: fixed; inset: 0;
        z-index: 999998; background: transparent;
      }
      .ac-overlay.open { display: block; }
    `;
    document.head.appendChild(s);
  }

  /* ensure parent is relative for dropdown positioning */
  const parent = input.parentElement;
  if (parent && getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  /* Style the list element as a proper dropdown */
  list.className = 'ac-dropdown-wrap';
  list.style.cssText = '';

  /* Transparent overlay to catch outside taps on mobile */
  let overlay = document.getElementById('ac-tap-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ac-tap-overlay';
    overlay.className = 'ac-overlay';
    document.body.appendChild(overlay);
  }

  let timer = null, idx = -1;

  function open()  { list.classList.add('open'); overlay.classList.add('open'); }
  function close() { list.classList.remove('open'); overlay.classList.remove('open'); idx = -1; }

  overlay.addEventListener('mousedown', close);
  overlay.addEventListener('touchstart', close, { passive: true });

  function setActive(items, i) {
    idx = i;
    items.forEach((el, j) => el.classList.toggle('ac-active', j === i));
    if (items[i]) items[i].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { close(); return; }
    timer = setTimeout(() => fetchAndShow(q), 240);
  });

  input.addEventListener('keydown', e => {
    const items = [...list.querySelectorAll('.ac-item')];
    if (!list.classList.contains('open')) {
      if (e.key === 'Enter') { e.preventDefault(); close(); if (typeof filterAndRender === 'function') filterAndRender(); }
      return;
    }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActive(items, Math.min(idx + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(items, Math.max(idx - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (idx >= 0 && items[idx]) items[idx].dispatchEvent(new MouseEvent('mousedown', { bubbles: false }));
      else { close(); if (typeof filterAndRender === 'function') filterAndRender(); }
    }
    else if (e.key === 'Escape') close();
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && list.innerHTML) open();
  });

  async function fetchAndShow(q) {
    try {
      const base = window.API_BASE || 'https://medplus-lkr7.onrender.com';
      const res  = await fetch(`${base}/api/products?q=${encodeURIComponent(q)}&limit=8`);
      if (!res.ok) return;
      const data    = await res.json();
      const results = data.products || [];
      idx = -1;

      if (!results.length) {
        list.innerHTML = `<div class="ac-empty"><i class="fas fa-search"></i>No products match "<strong>${escH(q)}</strong>"</div>`;
        open(); return;
      }

      let html = `<div class="ac-header"><i class="fas fa-fire" style="color:#f59e0b;margin-right:4px"></i>${results.length} suggestion${results.length !== 1 ? 's' : ''}</div>`;
      results.forEach((p, i) => {
        const stock  = Number(p.stock);
        const sClass = stock <= 0 ? 'out' : stock <= 10 ? 'low' : 'in';
        const sLabel = stock <= 0 ? 'Out of Stock' : stock <= 10 ? `${stock} left` : 'In Stock';
        const disc   = p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : 0;
        const imgHtml = p.image
          ? `<img class="ac-thumb" src="${escH(p.image)}" alt="" onerror="this.outerHTML='<div class=ac-thumb-ph><i class=fas\\ fa-pills></i></div>'">`
          : `<div class="ac-thumb-ph"><i class="fas fa-pills"></i></div>`;

        html += `<div class="ac-item" data-name="${escH(p.name)}"
          onmousedown="event.preventDefault();event.stopPropagation();selectSuggestion('${escH(p.name).replace(/'/g,"\\'")}','${p._id}','${inputId}','${listId}')"
          ontouchend="event.preventDefault();event.stopPropagation();selectSuggestion('${escH(p.name).replace(/'/g,"\\'")}','${p._id}','${inputId}','${listId}')">
          ${imgHtml}
          <div class="ac-body">
            <div class="ac-name">${hlMatch(p.name, q)}</div>
            <div class="ac-sub">
              <span>${escH(p.category)}</span>
              ${p.requiresPrescription ? '<span class="ac-rx-badge">Rx</span>' : ''}
              <span class="ac-stock-pill ${sClass}">${sLabel}</span>
            </div>
          </div>
          <div class="ac-right">
            <div class="ac-price">&#8377;${p.price}</div>
            ${p.mrp > p.price ? `<div class="ac-mrp">&#8377;${p.mrp}</div><div class="ac-disc">${disc}% off</div>` : ''}
          </div>
        </div>`;
      });

      html += `<div class="ac-footer"
        onmousedown="event.preventDefault();event.stopPropagation();selectSuggestion('${escH(q).replace(/'/g,"\\'")}','','${inputId}','${listId}')"
        ontouchend="event.preventDefault();event.stopPropagation();selectSuggestion('${escH(q).replace(/'/g,"\\'")}','','${inputId}','${listId}')">
        <i class="fas fa-search"></i> See all results for "${escH(q)}"
      </div>`;

      list.innerHTML = html;
      open();
    } catch { close(); }
  }
}

/* ── Helpers ── */
function escH(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function hlMatch(text, q) {
  let out = escH(text);
  (q || '').trim().split(/\s+/).filter(Boolean).forEach(w => {
    out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
  });
  return out;
}

/* ── Called when user picks a suggestion ── */
function selectSuggestion(name, id, inputId, listId) {
  const input = document.getElementById(inputId || 'search-bar');
  const list  = document.getElementById(listId  || 'autocomplete-list');
  const overlay = document.getElementById('ac-tap-overlay');

  if (input) input.value = name;
  if (list)  list.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  /* sync both bars */
  const desktop = document.getElementById('search-bar');
  const mob     = document.getElementById('mob-search-bar');
  if (desktop) desktop.value = name;
  if (mob)     mob.value     = name;

  if (typeof filterAndRender === 'function') filterAndRender();
}
