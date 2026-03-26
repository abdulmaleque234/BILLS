/* ============================================
   BILLS — Global App JS v2.0
   50+ Features | Dark Mode | Full Data Engine
   ============================================ */
'use strict';

/* ============================================
   LOCAL STORAGE STORE
   ============================================ */
const Store = {
  get(key, def = []) {
    try {
      const val = localStorage.getItem('bills_' + key);
      return val !== null ? JSON.parse(val) : def;
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('bills_' + key, JSON.stringify(val)); }
    catch (e) { console.warn('Storage quota exceeded'); }
  },
  remove(key) { localStorage.removeItem('bills_' + key); },
  getAll() {
    const keys = ['customers','products','categories','invoices','payments',
                  'expenses','expense_categories','reminders','activity','settings',
                  'suppliers','staff','quotations','returns','taxes','purchase_orders'];
    const out = {};
    keys.forEach(k => { out[k] = Store.get(k); });
    out.settings = Store.get('settings', {});
    return out;
  },
  export() {
    const data = Store.getAll();
    data._version = '2.0';
    data._exported = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  import(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const keys = ['customers','products','categories','invoices','payments',
                    'expenses','expense_categories','reminders','activity','settings',
                    'suppliers','staff','quotations','returns','taxes','purchase_orders'];
      keys.forEach(k => { if (data[k] !== undefined) Store.set(k, data[k]); });
      return true;
    } catch (e) { return false; }
  }
};

/* ============================================
   ACTIVITY LOG HELPER
   ============================================ */
const ActivityLog = {
  push(action, user = 'Admin') {
    const log = Store.get('activity', []);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN') + ' ' +
                    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    log.unshift({ user, action, date: dateStr });
    if (log.length > 200) log.pop(); // keep last 200 entries
    Store.set('activity', log);
  }
};

/* ============================================
   DEMO DATA SEEDER v3.0 (rich sample data)
   ============================================ */
function seedDemoData() {
  if (Store.get('seeded_fresh', false)) return;

  const preserve = ['bills_theme', 'bills_loggedIn', 'bills_rememberMe'];
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('bills_') && !preserve.includes(k)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // ── Default Settings (edit in Settings page) ──
  Store.set('settings', {
    shopName: 'My Shop',
    ownerName: 'Admin',
    upiId: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    currency: '₹',
    invoicePrefix: 'INV-',
    quotePrefix: 'QT-',
    taxRate: 0, cgst: 0, sgst: 0, dueDays: 15,
    invoiceFooter: 'Thank you for your business!',
    termsConditions: '1. Goods once sold will not be taken back.\n2. Payment due within 15 days.',
    invoiceSequence: 1,
    logo: '',
    theme: 'light', language: 'en',
    whatsappNumber: '',
    monthlyTarget: 0,
    whatsappTemplate: 'Dear {name}, your invoice {invoice} of {amount} is due. Please pay via UPI: {upi}. Thank you!'
  });

  // ── Default Expense Categories ──
  Store.set('expense_categories', [
    { id:'EC001', name:'Rent',        icon:'bi-house',            color:'#6366f1' },
    { id:'EC002', name:'Electricity', icon:'bi-lightning-charge', color:'#f59e0b' },
    { id:'EC003', name:'Internet',    icon:'bi-wifi',             color:'#3b82f6' },
    { id:'EC004', name:'Supplies',    icon:'bi-box',              color:'#10b981' },
    { id:'EC005', name:'Salaries',    icon:'bi-person-badge',     color:'#8b5cf6' },
    { id:'EC006', name:'Transport',   icon:'bi-truck',            color:'#f97316' },
    { id:'EC007', name:'Marketing',   icon:'bi-megaphone',        color:'#ec4899' },
    { id:'EC008', name:'Maintenance', icon:'bi-tools',            color:'#14b8a6' },
  ]);

  // ── Default Tax Slabs ──
  Store.set('taxes', [
    { id:'TAX001', name:'GST 0%',  rate:0,  type:'GST' },
    { id:'TAX002', name:'GST 5%',  rate:5,  type:'GST' },
    { id:'TAX003', name:'GST 12%', rate:12, type:'GST' },
    { id:'TAX004', name:'GST 18%', rate:18, type:'GST' },
    { id:'TAX005', name:'GST 28%', rate:28, type:'GST' },
    { id:'TAX006', name:'No Tax',  rate:0,  type:'None' },
  ]);

  // ── Default Product Categories ──
  Store.set('categories', [
    { id:'CAT001', name:'Mobile Accessories', icon:'bi-phone',      color:'#6366f1' },
    { id:'CAT002', name:'Recharge & SIM',     icon:'bi-sim',        color:'#10b981' },
    { id:'CAT003', name:'DTH & Cable',        icon:'bi-display',    color:'#f59e0b' },
    { id:'CAT004', name:'Electronics',        icon:'bi-cpu',        color:'#8b5cf6' },
    { id:'CAT005', name:'Speakers & Audio',   icon:'bi-speaker',    color:'#ec4899' },
    { id:'CAT006', name:'Smart Watches',      icon:'bi-smartwatch', color:'#14b8a6' },
    { id:'CAT007', name:'General',            icon:'bi-grid',       color:'#64748b' },
  ]);

  // ── All transactional data starts empty ──
  Store.set('customers',       []);
  Store.set('products',        []);
  Store.set('invoices',        []);
  Store.set('payments',        []);
  Store.set('expenses',        []);
  Store.set('suppliers',       []);
  Store.set('staff',           []);
  Store.set('reminders',       []);
  Store.set('quotations',      []);
  Store.set('purchase_orders', []);
  Store.set('returns',         []);
  Store.set('activity',        []);

  Store.set('seeded_fresh', true);
}

seedDemoData();


/* ============================================
   DARK MODE
   ============================================ */
const DarkMode = {
  init() {
    const saved = localStorage.getItem('bills_theme') || 'light';
    this.apply(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem('bills_theme', next);
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('darkToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    // Update settings too
    const s = Store.get('settings', {});
    s.theme = theme;
    Store.set('settings', s);
  }
};

DarkMode.init();

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */
const Utils = {
  currency(val) {
    const s = Store.get('settings', {});
    const sym = s.currency || '₹';
    return sym + parseFloat(val || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  },
  today() {
    return new Date().toISOString().split('T')[0];
  },
  statusBadge(status) {
    const map = {
      'Paid':      'badge-success',
      'Unpaid':    'badge-danger',
      'Partial':   'badge-warning',
      'Pending':   'badge-warning',
      'Verified':  'badge-success',
      'Cancelled': 'badge-muted',
      'Converted': 'badge-primary',
      'Accepted':  'badge-teal',
      'Sent':      'badge-info',
      'Received':  'badge-success',
      'Approved':  'badge-success',
      'Rejected':  'badge-danger',
      'Draft':     'badge-muted',
      'Overdue':   'badge-danger',
      'Active':    'badge-success',
      'Inactive':  'badge-muted',
    };
    return `<span class="badge-custom ${map[status] || 'badge-muted'}">${status}</span>`;
  },
  priorityBadge(p) {
    const map = { 'High': 'badge-danger', 'Medium': 'badge-warning', 'Low': 'badge-info' };
    return `<span class="badge-custom ${map[p] || 'badge-muted'}">${p}</span>`;
  },
  generateId(prefix, list) {
    const maxNum = list.reduce((max, item) => {
      const num = parseInt((item.id || '').replace(/\D/g, '')) || 0;
      return Math.max(max, num);
    }, 0);
    return prefix + (maxNum + 1).toString().padStart(3, '0');
  },
  isOverdue(dueDate, status) {
    if (status === 'Paid') return false;
    return new Date(dueDate) < new Date();
  },
  daysAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  },
  /* Animated counter */
  animateCounter(el, target, prefix = '', suffix = '', duration = 800) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = prefix + Math.floor(current).toLocaleString('en-IN') + suffix;
    }, 16);
  },

  /* Number format short (1200 => 1.2K) */
  numShort(val) {
    if (val >= 1e7) return (val/1e7).toFixed(1)+'Cr';
    if (val >= 1e5) return (val/1e5).toFixed(1)+'L';
    if (val >= 1000) return (val/1000).toFixed(1)+'K';
    return val.toString();
  },

  /* ---- TOAST NOTIFICATIONS (with optional undo) ---- */
  toast(msg, type = 'success', duration = 3500, undoFn = null) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success:'check-circle-fill', error:'x-circle-fill', warning:'exclamation-triangle-fill', info:'info-circle-fill', danger:'x-circle-fill' };
    const t = document.createElement('div');
    t.className = `toast-item ${type}`;
    t.innerHTML = `<i class="bi bi-${icons[type]||icons.info} toast-icon"></i><span style="flex:1">${msg}</span>${undoFn ? '<button class="toast-undo">Undo</button>' : ''}`;
    if (undoFn) t.querySelector('.toast-undo').onclick = () => { undoFn(); t.remove(); };
    container.appendChild(t);
    const timer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='0.3s'; setTimeout(()=>t.remove(),300); }, duration);
  },

  /* ---- WHATSAPP SHARE ---- */
  whatsappShare(phone, msg) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  },

  /* ---- COPY TO CLIPBOARD ---- */
  copyText(text) {
    navigator.clipboard.writeText(text).then(() => Utils.toast('Copied to clipboard!', 'info'));
  }
};

/* ============================================
   CSV EXPORT UTILITY
   ============================================ */
function csvExport(headers, rows, filename) {
  const escape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv  = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  Utils.toast('CSV exported!', 'success');
}

/* ============================================
   GLOBAL SEARCH — Ctrl+K
   ============================================ */
(function() {
  function buildIndex() {
    const results = [];
    Store.get('customers',[]).forEach(c => results.push({ type:'Customer', label:c.name, sub:'📞 '+c.phone, url:`customers/view.html?id=${c.id}` }));
    Store.get('invoices', []).forEach(i => results.push({ type:'Invoice',  label:i.id+' — '+i.customerName, sub:Utils.currency(i.total)+' · '+i.status, url:`invoices/view.html?id=${i.id}` }));
    Store.get('products', []).forEach(p => results.push({ type:'Product',  label:p.name, sub:'Stock: '+p.stock+' · ₹'+p.price, url:`products/index.html` }));
    Store.get('payments', []).forEach(p => results.push({ type:'Payment',  label:p.id+' — '+p.customer, sub:Utils.currency(p.amount)+' via '+p.method, url:`payments/index.html` }));
    return results;
  }

  function openSearch() {
    let modal = document.getElementById('globalSearchModal');
    if (!modal) {
      const depth = (window.location.pathname.match(/\//g)||[]).length;
      const base  = depth <= 2 ? './' : '../';
      modal = document.createElement('div');
      modal.id = 'globalSearchModal';
      modal.innerHTML = `
        <div class="gs-backdrop" id="gsBackdrop"></div>
        <div class="gs-box">
          <div class="gs-input-row"><i class="bi bi-search gs-icon"></i><input id="gsInput" class="gs-input" placeholder="Search customers, invoices, products…" autocomplete="off"><kbd class="gs-esc">ESC</kbd></div>
          <div class="gs-results" id="gsResults"></div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('gsBackdrop').onclick = closeSearch;
      document.getElementById('gsInput').addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        const res = document.getElementById('gsResults');
        if (!q) { res.innerHTML = '<div class="gs-empty">Start typing to search…</div>'; return; }
        const hits = buildIndex().filter(r => (r.label+r.sub+r.type).toLowerCase().includes(q)).slice(0,8);
        res.innerHTML = hits.length
          ? hits.map(h => `<a href="${base+h.url}" class="gs-item"><span class="gs-badge gs-type-${h.type.toLowerCase()}">${h.type}</span><span class="gs-label">${h.label}</span><span class="gs-sub">${h.sub}</span></a>`).join('')
          : '<div class="gs-empty">No results found.</div>';
      });
      document.getElementById('gsInput').addEventListener('keydown', e => { if (e.key==='Escape') closeSearch(); });
    }
    modal.classList.add('show');
    setTimeout(() => document.getElementById('gsInput').focus(), 50);
    document.getElementById('gsInput').value = '';
    document.getElementById('gsResults').innerHTML = '<div class="gs-empty">Start typing to search…</div>';
  }

  function closeSearch() {
    const m = document.getElementById('globalSearchModal');
    if (m) m.classList.remove('show');
  }

  window.openGlobalSearch = openSearch;
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });
})();

/* ============================================
   TABLE SEARCH
   ============================================ */
function initTableSearch(inputId, tableBodyId) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tableBodyId);
  if (!input || !tbody) return;
  input.addEventListener('keyup', function () {
    const q = this.value.toLowerCase();
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ============================================
   CONFIRM DELETE
   ============================================ */
function confirmDelete(msg = 'Are you sure you want to delete this?') {
  return window.confirm(msg);
}

/* ============================================
   QUICK PAY MODAL
   ============================================ */
function openQuickPay(invoiceId) {
  const invoices = Store.get('invoices', []);
  const inv = invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const due = inv.total - inv.paid;
  const overlay = document.getElementById('quickPayModal');
  if (!overlay) return;

  document.getElementById('qpInvoiceId').textContent = inv.id;
  document.getElementById('qpCustomer').textContent = inv.customerName;
  document.getElementById('qpDue').textContent = Utils.currency(due);
  document.getElementById('qpAmount').value = due.toFixed(2);

  // Reset to Cash
  _qpSetMethod('Cash');

  const settings = Store.get('settings', {});
  const upiId = settings.upiId || 'bhai-bhai@paytm';
  const upiEl = document.getElementById('qpUpiId');
  if (upiEl) upiEl.textContent = upiId;

  function _renderQR(amount) {
    const box = document.getElementById('qpQrBox');
    if (!box) return;
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.shopName||'BHAI BHAI')}&am=${amount}&tn=${inv.id}`;
    if (typeof QRCode !== 'undefined') {
      box.innerHTML = '';
      const canvas = document.createElement('canvas');
      box.appendChild(canvas);
      QRCode.toCanvas(canvas, upiUrl, { width: 140, margin: 1, color:{dark:'#0f0c29',light:'#ffffff'} });
    } else {
      box.innerHTML = '<div style="width:140px;height:140px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#94a3b8;">Loading…</div>';
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      s.onload = () => {
        box.innerHTML = '';
        const canvas = document.createElement('canvas');
        box.appendChild(canvas);
        QRCode.toCanvas(canvas, upiUrl, { width: 140, margin: 1, color:{dark:'#0f0c29',light:'#ffffff'} });
      };
      document.head.appendChild(s);
    }
  }

  const amtInput = document.getElementById('qpAmount');
  amtInput.oninput = function () {
    if (document.getElementById('qpMethodHidden').value === 'UPI')
      _renderQR(parseFloat(this.value) || due);
  };

  overlay.querySelectorAll('.qp-method-btn').forEach(btn => {
    btn.onclick = () => {
      _qpSetMethod(btn.dataset.method);
      if (btn.dataset.method === 'UPI') _renderQR(parseFloat(amtInput.value) || due);
    };
  });

  document.getElementById('qpSubmit').onclick = function () {
    const amount = parseFloat(document.getElementById('qpAmount').value) || 0;
    const method = document.getElementById('qpMethodHidden').value;
    if (amount <= 0 || amount > due + 0.01) { Utils.toast('Invalid amount', 'error'); return; }

    const payments = Store.get('payments', []);
    payments.push({
      id: Utils.generateId('PAY-', payments),
      invoice: inv.id,
      customer: inv.customerName,
      amount, method,
      date: Utils.today(),
      status: 'Verified',
      ref: ''
    });
    Store.set('payments', payments);

    inv.paid += amount;
    inv.status = inv.paid >= inv.total ? 'Paid' : 'Partial';
    Store.set('invoices', invoices);
    ActivityLog.push(`Payment ₹${amount} received for ${inv.id} via ${method} (${inv.customerName})`);

    overlay.classList.remove('show');
    Utils.toast(`Payment of ${Utils.currency(amount)} recorded!`, 'success');
    setTimeout(() => window.location.reload(), 800);
  };
  overlay.classList.add('show');
}

function _qpSetMethod(method) {
  const hidden = document.getElementById('qpMethodHidden');
  if (hidden) hidden.value = method;
  document.querySelectorAll('.qp-method-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.method === method)
  );
  const sec = document.getElementById('qpUpiSection');
  if (sec) sec.style.display = method === 'UPI' ? 'block' : 'none';
}

/* ============================================
   SIDEBAR — DOM INJECTION
   ============================================ */
(function () {
  const sidebarEl = document.querySelector('.sidebar');
  if (!sidebarEl) return;

  // Determine depth for correct relative paths
  const depth = (window.location.pathname.match(/\//g) || []).length;
  function rel(path) {
    if (depth <= 2) return './' + path;
    return '../' + path;
  }

  const path = window.location.pathname;
  function isActive(link) {
    const norm = (href) => href.replace(/\/index\.html$/, '').replace(/\/$/, '');
    return path.endsWith(norm(link)) && norm(link) !== '';
  }

  // Collapse toggle
  const collapseBtn = sidebarEl.querySelector('.sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      sidebarEl.classList.toggle('collapsed');
      const mc = document.querySelector('.main-content');
      if (mc) mc.classList.toggle('expanded');
    });
  }

  // Show logo in brand area if available
  const brandIcon = sidebarEl.querySelector('.brand-icon');
  if (brandIcon) {
    const s = Store.get('settings', {});
    const logoPath = s.logo || rel('assets/img/logo.png');
    const img = document.createElement('img');
    img.src = logoPath;
    img.alt = 'Logo';
    img.style.cssText = 'width:36px;height:36px;object-fit:contain;border-radius:8px;';
    img.onerror = function() { this.style.display='none'; };
    brandIcon.innerHTML = '';
    brandIcon.appendChild(img);
  }

  // Active link
  const links = sidebarEl.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (isActive(href)) { link.classList.add('active'); }
  });
})();

/* ============================================
   TOPBAR — DOM INJECTION
   ============================================ */
(function () {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  // Remove any leftover duplicate elements
  ['topbar-title', 'topbar-actions'].forEach(cls => {
    const el = topbar.querySelector('.' + cls);
    if (el && !el.querySelector('[id]')) el.remove();
  });

  const depth = (window.location.pathname.match(/\//g) || []).length;
  function rel(p) { return depth <= 2 ? './' + p : '../' + p; }

  // Spacer
  const spacer = document.createElement('div');
  spacer.className = 'topbar-spacer';
  topbar.appendChild(spacer);

  // Notification bell
  const notifBtn = document.createElement('a');
  notifBtn.href = rel('reminders/index.html');
  notifBtn.className = 'topbar-icon-btn';
  notifBtn.title = 'Reminders';
  const pending = (Store.get('reminders', [])).filter(r => !r.done).length;
  notifBtn.innerHTML = `<i class="bi bi-bell"></i>${pending > 0 ? '<span class="notif-dot"></span>' : ''}`;
  topbar.appendChild(notifBtn);

  // Dark mode toggle
  const darkBtn = document.createElement('button');
  darkBtn.id = 'darkToggle';
  darkBtn.className = 'dark-toggle';
  darkBtn.setAttribute('aria-label', 'Toggle dark mode');
  const savedTheme = localStorage.getItem('bills_theme') || 'light';
  darkBtn.innerHTML = savedTheme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
  darkBtn.addEventListener('click', () => DarkMode.toggle());
  topbar.appendChild(darkBtn);

  // Backup link
  const backupBtn = document.createElement('a');
  backupBtn.href = rel('backup/index.html');
  backupBtn.className = 'topbar-icon-btn';
  backupBtn.title = 'Backup & Export';
  backupBtn.innerHTML = '<i class="bi bi-cloud-arrow-down"></i>';
  topbar.appendChild(backupBtn);

  // User avatar
  const userBtn = document.createElement('a');
  userBtn.href = rel('profile.html');
  userBtn.className = 'topbar-user';
  const s = Store.get('settings', {});
  const initials = (s.ownerName || 'Admin').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  userBtn.innerHTML = `<div class="user-avatar">${initials}</div><span class="user-name">${(s.ownerName || 'Admin').split(' ')[0]}</span>`;
  topbar.appendChild(userBtn);
})();

/* ============================================
   SIDEBAR TOGGLE (mobile)
   ============================================ */
(function () {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => { sidebar.classList.add('open'); overlay && overlay.classList.add('show'); });
  overlay && overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
})();

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */
document.addEventListener('keydown', function (e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  const depth = (window.location.pathname.match(/\//g) || []).length;
  const base = depth <= 2 ? './' : '../';
  if (e.key === 'n' || e.key === 'N') window.location.href = base + 'invoices/create.html';
  if (e.key === 'c' || e.key === 'C') window.location.href = base + 'customers/add.html';
  if (e.key === 'p' || e.key === 'P') window.location.href = base + 'products/add.html';
  if (e.key === '/' ) { const s = document.querySelector('.search-bar input'); if (s) { e.preventDefault(); s.focus(); } }
});

/* ============================================
   QUICK PAY MODAL — Auto-inject HTML (Premium)
   ============================================ */
(function () {
  if (document.getElementById('quickPayModal')) return;

  const style = document.createElement('style');
  style.textContent = `
    .qp-method-btn {
      flex:1; padding:9px 4px; border-radius:8px;
      border:1.5px solid var(--card-border);
      background:var(--card-bg2); color:var(--text-secondary);
      font-size:11px; font-weight:600; cursor:pointer;
      display:flex; flex-direction:column; align-items:center; gap:3px;
      font-family:var(--font); transition:all 0.15s;
    }
    .qp-method-btn i { font-size:18px; }
    .qp-method-btn.active {
      border-color:var(--primary); background:var(--primary-light);
      color:var(--primary); box-shadow:0 2px 8px rgba(99,102,241,0.2);
    }
    .qp-method-btn:hover:not(.active) { border-color:var(--text-muted); color:var(--text-primary); }
    .qp-upi-box {
      background:linear-gradient(135deg,#0f0c29,#302b63);
      border-radius:12px; padding:14px 16px;
      display:flex; align-items:center; gap:14px; margin-top:4px;
    }
    .qp-upi-qr { background:#fff; border-radius:8px; padding:5px; flex-shrink:0; line-height:0; }
    .qp-upi-info { color:#fff; }
    .qp-upi-label { font-size:10px; opacity:0.6; text-transform:uppercase; letter-spacing:1px; }
    .qp-upi-id { font-size:13px; font-weight:700; margin-top:3px; word-break:break-all; }
    .qp-upi-hint { font-size:11px; opacity:0.55; margin-top:5px; line-height:1.4; }
  `;
  document.head.appendChild(style);

  const html = `
  <div class="modal-overlay" id="quickPayModal">
    <div class="modal-box" style="max-width:440px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <h3 class="modal-title" style="margin:0;"><i class="bi bi-credit-card me-2" style="color:var(--primary);"></i>Quick Pay</h3>
        <button onclick="document.getElementById('quickPayModal').classList.remove('show')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Invoice <strong id="qpInvoiceId" style="color:var(--primary);"></strong> &mdash; <span id="qpCustomer"></span></p>
      <div style="background:var(--danger-light);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <i class="bi bi-wallet2" style="color:var(--danger);font-size:22px;"></i>
        <div>
          <div style="font-size:10px;color:var(--danger);font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Balance Due</div>
          <div id="qpDue" style="font-size:22px;font-weight:800;color:var(--danger);"></div>
        </div>
      </div>
      <div style="display:grid;gap:12px;">
        <div>
          <label class="form-label-custom">Amount (₹)</label>
          <input type="number" id="qpAmount" class="form-control-custom" placeholder="Enter amount" step="0.01" min="0">
        </div>
        <div>
          <label class="form-label-custom">Payment Method</label>
          <input type="hidden" id="qpMethodHidden" value="Cash">
          <div style="display:flex;gap:6px;margin-top:6px;">
            <button class="qp-method-btn active" data-method="Cash"><i class="bi bi-cash-coin"></i>Cash</button>
            <button class="qp-method-btn" data-method="UPI"><i class="bi bi-qr-code"></i>UPI</button>
            <button class="qp-method-btn" data-method="Card"><i class="bi bi-credit-card"></i>Card</button>
            <button class="qp-method-btn" data-method="NEFT"><i class="bi bi-bank"></i>NEFT</button>
            <button class="qp-method-btn" data-method="Cheque"><i class="bi bi-file-earmark-check"></i>Cheque</button>
          </div>
        </div>
        <div id="qpUpiSection" style="display:none;">
          <div class="qp-upi-box">
            <div class="qp-upi-qr" id="qpQrBox">
              <div style="width:140px;height:140px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;">Loading…</div>
            </div>
            <div class="qp-upi-info">
              <div class="qp-upi-label">UPI — Scan to Pay</div>
              <div class="qp-upi-id" id="qpUpiId">bhai-bhai@paytm</div>
              <div class="qp-upi-hint">Ask customer to scan &amp; pay the exact amount shown. QR updates on amount change.</div>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button id="qpSubmit" class="btn-custom btn-success-custom" style="flex:1;"><i class="bi bi-check-circle"></i> Confirm Payment</button>
        <button onclick="document.getElementById('quickPayModal').classList.remove('show')" class="btn-custom btn-outline-custom">Cancel</button>
      </div>
    </div>
  </div>`;

  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
})();
