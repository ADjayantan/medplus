/* =====================================================
   search.js — Rich product autocomplete for products page
===================================================== */
let autocompleteTimer = null;
let acItems  = [];
let acIdx    = -1;

function initSearchAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;

  if (!document.getElementById('search-ac-style')) {
    const s = document.createElement('style');
    s.id = 'search-ac-style';
    s.textContent = `
      #${listId} {
        display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0;
        background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
        box-shadow: 0 14px 44px rgba(0,0,0,.13); z-index: 9999;
        max-height: 440px; overflow-y: auto; overflow-x: hidden;
      }
      .ac-header { padding: 8px 14px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; }
      .ac-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; transition: background .12s; border-bottom: 1px solid #f8fafc; }
      .ac-item:last-child { border-bottom: none; }
      .ac-item.ac-active, .ac-item:hover { background: #f0f9ff; }
      .ac-thumb { width: 42px; height: 42px; object-fit: contain; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
      .ac-thumb-ph { width: 42px; height: 42px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 17px; flex-shrink: 0; }
      .ac-body { flex: 1; min-width: 0; }
      .ac-name { font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ac-name mark { background: #fef08a; color: #92400e; border-radius: 2px; padding: 0 1px; }
      .ac-sub { font-size: 11px; color: #64748b; margin-top: 2px; display: flex; gap: 6px; align-items: center; }
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
      .ac-footer { padding: 9px 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #2563eb; font-weight: 600; text-align: center; cursor: pointer; transition: background .12s; }
      .ac-footer:hover { background: #eff6ff; }
    `;
    document.head.appendChild(s);
  }

  /* make parent relative for dropdown positioning */
  const parent = input.closest('.search-box, .search-container, [class*="search"]') || input.parentElement;
  if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

  input.addEventListener('input', () => {
    clearTimeout(autocompleteTimer);
    const q = input.value.trim();
    if (q.length < 2) { closeList(list); return; }
    autocompleteTimer = setTimeout(() => fetchSuggestions(q, input, list), 260);
  });

  input.addEventListener('keydown', e => {
    const items = list.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown')  { e.preventDefault(); acIdx = Math.min(acIdx+1, items.length-1); setActive(items, acIdx); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); acIdx = Math.max(acIdx-1, 0); setActive(items, acIdx); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (acIdx > -1 && items[acIdx]) items[acIdx].dispatchEvent(new MouseEvent('mousedown'));
      else { closeList(list); if (typeof filterAndRender === 'function') filterAndRender(); }
    }
    else if (e.key === 'Escape') closeList(list);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && list.innerHTML) list.style.display = 'block';
  });

  document.addEventListener('mousedown', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) closeList(list);
  });
}

function setActive(items, idx) {
  items.forEach(el => el.classList.remove('ac-active'));
  if (items[idx]) { items[idx].classList.add('ac-active'); items[idx].scrollIntoView({ block: 'nearest' }); }
}

function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function hlMatch(text, q) {
  const words = (q||'').trim().split(/\s+/).filter(Boolean);
  let out = escH(text);
  words.forEach(w => {
    const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
    out = out.replace(re, '<mark>$1</mark>');
  });
  return out;
}

async function fetchSuggestions(q, input, list) {
  try {
    const base = window.API_BASE || 'https://medplus-lkr7.onrender.com';
    const res  = await fetch(`${base}/api/products?q=${encodeURIComponent(q)}&limit=8`);
    if (!res.ok) return;
    const data    = await res.json();
    const results = data.products || [];
    acIdx = -1;

    if (!results.length) {
      list.innerHTML = `<div class="ac-empty"><i class="fas fa-search"></i>No products match "<strong>${escH(q)}</strong>"</div>`;
      list.style.display = 'block';
      return;
    }

    let html = `<div class="ac-header"><i class="fas fa-fire" style="color:#f59e0b;margin-right:4px"></i>${results.length} suggestion${results.length!==1?'s':''}</div>`;

    results.forEach((p, i) => {
      const stock  = Number(p.stock);
      const sClass = stock <= 0 ? 'out' : stock <= 10 ? 'low' : 'in';
      const sLabel = stock <= 0 ? 'Out of Stock' : stock <= 10 ? stock + ' left' : 'In Stock';
      const disc   = p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : 0;
      const imgHtml = p.image
        ? `<img class="ac-thumb" src="${escH(p.image)}" alt="" onerror="this.outerHTML='<div class=ac-thumb-ph><i class=fas\\ fa-pills></i></div>'">`
        : `<div class="ac-thumb-ph"><i class="fas fa-pills"></i></div>`;

      html += `
        <div class="ac-item" data-idx="${i}"
             onmousedown="selectSuggestion('${escH(p.name).replace(/'/g,"\\'")}','${p._id}')"
             onmouseenter="setActive(document.querySelectorAll('#autocomplete-list .ac-item'),${i})">
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

    html += `<div class="ac-footer" onmousedown="selectSuggestion('${escH(q).replace(/'/g,"\\'")}','')">
      <i class="fas fa-search"></i> See all results for "${escH(q)}"
    </div>`;

    list.innerHTML     = html;
    list.style.display = 'block';
    acItems = results;
  } catch { closeList(list); }
}

function closeList(list) {
  if (list) list.style.display = 'none';
  acIdx = -1;
}

function selectSuggestion(name, id) {
  const input    = document.getElementById('search-bar');
  const mobInput = document.getElementById('mob-search-bar');
  const list     = document.getElementById('autocomplete-list');
  const mobList  = document.getElementById('mob-autocomplete-list');
  if (input)    input.value    = name;
  if (mobInput) mobInput.value = name;
  closeList(list);
  closeList(mobList);
  if (typeof filterAndRender === 'function') filterAndRender();
  else if (typeof applyFilters === 'function') applyFilters();
}
