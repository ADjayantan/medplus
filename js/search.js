/* search.js — autocomplete search with debounce */
let autocompleteTimer = null;
let currentFocus = -1;

function initSearchAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;

  input.addEventListener('input', () => {
    clearTimeout(autocompleteTimer);
    const q = input.value.trim();
    if (q.length < 2) { closeList(list); return; }
    autocompleteTimer = setTimeout(() => fetchSuggestions(q, input, list), 280);
  });

  input.addEventListener('keydown', e => {
    const items = list.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown')  { currentFocus++; setActive(items, currentFocus); e.preventDefault(); }
    else if (e.key === 'ArrowUp')   { currentFocus--; setActive(items, currentFocus); e.preventDefault(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) items[currentFocus].click();
      else { closeList(list); if (typeof filterAndRender === 'function') filterAndRender(); }
    }
    else if (e.key === 'Escape') closeList(list);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) closeList(list);
  });
}

function setActive(items, idx) {
  items.forEach(i => i.classList.remove('ac-active'));
  if (idx >= items.length) currentFocus = 0;
  if (idx < 0) currentFocus = items.length - 1;
  if (items[currentFocus]) {
    items[currentFocus].classList.add('ac-active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }
}

async function fetchSuggestions(q, input, list) {
  try {
    const results = await ProductAPI.autocomplete(q);
    if (!results.length) { closeList(list); return; }
    currentFocus = -1;
    list.innerHTML = results.map(p => `
      <div class="ac-item" onclick="selectSuggestion('${p.name.replace(/'/g, "\\'")}', '${p._id}')">
        <span class="ac-icon"><i class="fas fa-pills"></i></span>
        <span class="ac-name">${highlight(p.name, q)}</span>
        <span class="ac-cat">${p.category}</span>
      </div>
    `).join('');
    list.style.display = 'block';
  } catch { closeList(list); }
}

function highlight(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return text.slice(0, idx) + '<strong>' + text.slice(idx, idx + q.length) + '</strong>' + text.slice(idx + q.length);
}

function closeList(list) {
  if (list) { list.style.display = 'none'; list.innerHTML = ''; }
  currentFocus = -1;
}

function selectSuggestion(name, id) {
  const input = document.getElementById('search-bar');
  const list  = document.getElementById('autocomplete-list');
  if (input) input.value = name;
  closeList(list);
  if (typeof filterAndRender === 'function') filterAndRender();
}
