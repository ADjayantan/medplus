/* =====================================================
   UPLOAD.JS — Genezenz Pharmacy Prescription Upload
===================================================== */

let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  initDropZone();

  if (isLoggedIn()) {
    const histCard = document.getElementById('history-card');
    if (histCard) histCard.style.display = 'block';
    loadRxHistory();
  } else {
    const notice = document.getElementById('login-notice');
    if (notice) notice.style.display = 'flex';
  }
});

function initNavAuth() {
  const user    = currentUser();
  const loginBtn = document.getElementById('nav-login');
  const profBtn  = document.getElementById('nav-profile');
  const cc       = document.getElementById('cart-count');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (profBtn)  { profBtn.style.display = ''; profBtn.innerHTML = '<i class="fas fa-user"></i> ' + user.name.split(' ')[0]; }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (profBtn)  profBtn.style.display = 'none';
  }

  if (cc) {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const qty  = cart.reduce((s, i) => s + (i.qty || 1), 0);
      cc.textContent = qty;
      cc.style.display = qty > 0 ? '' : 'none';
    } catch(e) {}
  }
}

function initDropZone() {
  const zone = document.getElementById('drop-zone');
  if (!zone) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) validateAndPreview(file);
  });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) validateAndPreview(file);
}

function validateAndPreview(file) {
  const status = document.getElementById('upload-status');
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowed.includes(file.type)) {
    showStatus('Only JPG, PNG, and PDF files are accepted.', 'error');
    return;
  }
  if (file.size > maxSize) {
    showStatus('File size must be under 5 MB.', 'error');
    return;
  }

  selectedFile = file;
  if (status) status.style.display = 'none';

  const previewEl = document.getElementById('file-preview');
  const nameEl    = document.getElementById('preview-name');
  const sizeEl    = document.getElementById('preview-size');
  const iconEl    = document.getElementById('preview-icon');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatBytes(file.size);
  if (iconEl) {
    const isPDF = file.type === 'application/pdf';
    iconEl.innerHTML = `<i class="fas ${isPDF ? 'fa-file-pdf' : 'fa-file-image'}" style="color:${isPDF ? '#ef4444' : 'var(--teal-600)'}"></i>`;
  }
  if (previewEl) previewEl.style.display = 'flex';
}

function clearFile() {
  selectedFile = null;
  const fileInput = document.getElementById('file-input');
  const previewEl = document.getElementById('file-preview');
  const status    = document.getElementById('upload-status');
  if (fileInput) fileInput.value = '';
  if (previewEl) previewEl.style.display = 'none';
  if (status)    status.style.display = 'none';
}

async function doUpload() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=upload-prescription.html';
    return;
  }
  if (!selectedFile) {
    showStatus('Please select a file first.', 'error');
    return;
  }

  const btn   = document.getElementById('upload-btn');
  const notes = document.getElementById('rx-notes')?.value.trim() || '';

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Uploading…';

  try {
    const formData = new FormData();
    formData.append('prescription', selectedFile);
    if (notes) formData.append('notes', notes);

    const result = await PrescriptionAPI.upload(formData);

    localStorage.setItem('genezenz-pharmacy_prescription_uploaded', 'true');

    showStatus(
      '<i class="fas fa-check-circle"></i> Prescription uploaded successfully! Our pharmacist will review it within 2 hours.' +
      '<br><br><a href="checkout.html" style="display:inline-block;margin-top:.25rem;padding:.5rem 1.25rem;background:var(--teal-600);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:.875rem"><i class="fas fa-shopping-bag"></i> Continue to Checkout</a>',
      'success'
    );
    clearFile();
    if (document.getElementById('rx-notes')) document.getElementById('rx-notes').value = '';
    loadRxHistory();
  } catch (err) {
    showStatus((err.message || 'Upload failed. Please try again.'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Submit Prescription';
  }
}

async function loadRxHistory() {
  const list = document.getElementById('rx-history-list');
  if (!list) return;

  try {
    const data  = await PrescriptionAPI.my();
    const items = data.prescriptions || [];

    if (!items.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--text-secondary);font-size:.875rem">
          <i class="fas fa-file-prescription" style="font-size:2rem;margin-bottom:.75rem;display:block;opacity:.3"></i>
          No prescriptions uploaded yet.
        </div>`;
      return;
    }

    list.innerHTML = items.slice(0, 5).map(rx => `
      <div class="rx-history-item">
        <div class="rx-history-icon" style="background:${statusBg(rx.status)}">
          <i class="fas fa-file-prescription" style="color:${statusColor(rx.status)}"></i>
        </div>
        <div class="rx-history-info">
          <div class="rx-history-name">${rx.filename || 'Prescription'}</div>
          <div class="rx-history-date">${formatDate(rx.uploadedAt || rx.createdAt)}</div>
        </div>
        <span class="rx-status ${rx.status || 'pending'}">${capitalize(rx.status || 'pending')}</span>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div style="color:var(--text-secondary);font-size:.875rem;padding:.5rem 0">Could not load history.</div>`;
  }
}

/* ── Helpers ── */
function showStatus(msg, type) {
  const el = document.getElementById('upload-status');
  if (!el) return;
  el.style.display = 'block';
  if (type === 'success') {
    el.style.background = 'var(--green-50)';
    el.style.border     = '1.5px solid var(--green-200)';
    el.style.color      = 'var(--green-700)';
  } else {
    el.style.background = '#fef2f2';
    el.style.border     = '1.5px solid #fca5a5';
    el.style.color      = '#dc2626';
  }
  el.innerHTML = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024*1024)  return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024*1024)).toFixed(2) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function statusBg(s) {
  return s === 'approved' ? 'var(--green-100)' : s === 'rejected' ? '#fee2e2' : '#fef3c7';
}
function statusColor(s) {
  return s === 'approved' ? 'var(--green-600)' : s === 'rejected' ? '#dc2626' : '#d97706';
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
