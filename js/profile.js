/* =====================================================
   profile.js — user profile: orders + prescriptions
   FIX: Replaced calls to showPage() and openAuthModal()
   which don't exist in profile.html — caused ReferenceError
   for any logged-out user landing on the page.
===================================================== */

function initProfile() {
  const user  = currentUser();
  const token = localStorage.getItem('genezenz-pharmacy_token');

  /* FIX: Was showPage('home') + openAuthModal('login') — both undefined.
     Now redirects to login with a return URL so user lands back here. */
  if (!user || !token) {
    window.location.href = 'login.html?redirect=profile.html';
    return;
  }

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  setEl('profile-name',  user.name);
  setEl('profile-email', user.email);
  setEl('profile-phone', user.phone || 'Not set');

  const avatar = document.getElementById('profile-avatar');
  if (avatar) avatar.textContent = (user.name || 'U')[0].toUpperCase();

  const adminLink = document.getElementById('admin-panel-link');
  if (adminLink) adminLink.style.display = user.isAdmin ? '' : 'none';

  loadOrderHistory();
  loadPrescriptionHistory();
}

async function loadOrderHistory() {
  const container = document.getElementById('order-history');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b"><div class="spinner" style="width:28px;height:28px;border-width:3px;margin:0 auto 12px"></div>Loading orders...</div>';
  try {
    const data   = await OrderAPI.my();
    const orders = data.orders || [];
    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:#94a3b8">
          <i class="fas fa-box-open" style="font-size:48px;margin-bottom:16px;display:block"></i>
          <div style="font-size:18px;font-weight:600;color:#475569;margin-bottom:8px">No orders yet</div>
          <p style="font-size:14px">Your order history will appear here</p>
          <a href="products.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;text-decoration:none">
            <i class="fas fa-store"></i> Shop Now
          </a>
        </div>`;
      return;
    }

    const statusColor = { pending:'#f59e0b', confirmed:'#3b82f6', shipped:'#8b5cf6', delivered:'#22c55e', cancelled:'#ef4444' };
    const statusBg    = { pending:'#fffbeb', confirmed:'#eff6ff', shipped:'#f5f3ff', delivered:'#f0fdf4', cancelled:'#fef2f2' };

    container.innerHTML = orders.map(order => {
      const col  = statusColor[order.status] || '#64748b';
      const bg   = statusBg[order.status]  || '#f8fafc';
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      return `
        <div style="border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:16px;overflow:hidden;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
              <div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Order ID</div>
                <div style="font-family:monospace;font-weight:700;color:#1e293b">#${order._id.slice(-8).toUpperCase()}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Date</div>
                <div style="font-size:14px;color:#475569">${date}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Payment</div>
                <div style="font-size:14px;color:#475569">${order.paymentMethod}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="background:${bg};color:${col};padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:capitalize;border:1.5px solid ${col}22">${order.status}</span>
              <span style="font-size:16px;font-weight:800;color:#1e293b">\u20b9${order.total.toLocaleString('en-IN')}</span>
              ${order.status === 'pending' ? `<button onclick="cancelOrder('${order._id}', this)" style="padding:5px 12px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fecaca;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'"><i class="fas fa-times-circle"></i> Cancel</button>` : ''}
            </div>
          </div>
          <div style="padding:14px 18px">
            ${order.items.slice(0, 3).map(item => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9">
                <div style="width:36px;height:36px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#2563eb">
                  <i class="fas fa-pills"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
                  <div style="font-size:12px;color:#94a3b8">Qty: ${item.qty} x \u20b9${item.price}</div>
                </div>
                <div style="font-weight:700;color:#1e293b;white-space:nowrap">\u20b9${(item.price * item.qty).toLocaleString('en-IN')}</div>
              </div>
            `).join('')}
            ${order.items.length > 3 ? `<div style="font-size:13px;color:#64748b;padding:8px 0">+${order.items.length - 3} more item${order.items.length - 3 > 1 ? 's' : ''}</div>` : ''}
            <div style="margin-top:10px;font-size:13px;color:#64748b">
              <i class="fas fa-map-marker-alt" style="margin-right:6px"></i>${order.address}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444;padding:16px"><i class="fas fa-exclamation-circle"></i> Failed to load orders: ${err.message}</div>`;
  }
}

async function cancelOrder(id, btn) {
  if (!confirm('Cancel this order? This cannot be undone.')) return;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
  try {
    await OrderAPI.cancel(id);
    showToast('Order cancelled successfully', 'success');
    loadOrderHistory();
  } catch (err) {
    showToast(err.message || 'Failed to cancel order', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel';
  }
}

async function loadPrescriptionHistory() {
  const container = document.getElementById('prescription-history');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b">Loading prescriptions...</div>';
  try {
    const data   = await PrescriptionAPI.my();
    const rxList = data.prescriptions || [];
    if (!rxList.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:#94a3b8">
          <i class="fas fa-file-medical" style="font-size:48px;margin-bottom:16px;display:block"></i>
          <div style="font-size:16px;font-weight:600;color:#475569;margin-bottom:8px">No prescriptions uploaded</div>
          <p style="font-size:14px">Upload a prescription to order prescription-only medicines</p>
        </div>`;
      return;
    }

    const statusColor = { pending:'#f59e0b', approved:'#22c55e', rejected:'#ef4444' };
    const statusBg    = { pending:'#fffbeb', approved:'#f0fdf4', rejected:'#fef2f2' };
    const statusIcon  = { pending:'fa-clock', approved:'fa-check-circle', rejected:'fa-times-circle' };

    container.innerHTML = rxList.map(rx => {
      const date  = new Date(rx.uploadedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      const isImg = /\.(jpg|jpeg|png)$/i.test(rx.url);
      const col   = statusColor[rx.status] || '#64748b';
      const bg    = statusBg[rx.status]  || '#f8fafc';
      const ico   = statusIcon[rx.status] || 'fa-question-circle';
      return `
        <div style="border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:12px;background:#fff;display:flex;align-items:center;gap:16px;padding:14px 18px">
          <div style="width:48px;height:48px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:#2563eb">
            <i class="fas ${isImg ? 'fa-image' : 'fa-file-pdf'}"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${rx.filename}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px"><i class="fas fa-calendar-alt"></i> Uploaded: ${date}</div>
            ${rx.adminNote ? `<div style="font-size:12px;color:#475569;margin-top:4px;font-style:italic">"${rx.adminNote}"</div>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            <span style="background:${bg};color:${col};padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:capitalize;display:inline-flex;align-items:center;gap:6px">
              <i class="fas ${ico}"></i> ${rx.status}
            </span>
            ${rx.url ? `<br><a href="${rx.url}" target="_blank" rel="noopener" style="font-size:11px;color:#2563eb;margin-top:4px;display:inline-block">View file</a>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444;font-size:14px;padding:16px"><i class="fas fa-exclamation-circle"></i> Failed to load prescriptions: ${err.message}</div>`;
  }
}
