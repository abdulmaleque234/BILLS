/* ============================================
   BILLS - Invoice JS
   ============================================ */

'use strict';

/* ============================================
   INVOICE CREATE / EDIT
   ============================================ */
const InvoiceBuilder = {
  itemCount: 0,

  init() {
    this.bindEvents();
    this.addItem(); // Start with one row
  },

  bindEvents() {
    const addBtn = document.getElementById('addItemBtn');
    addBtn && addBtn.addEventListener('click', () => this.addItem());

    const form = document.getElementById('invoiceForm');
    form && form.addEventListener('submit', (e) => this.handleSubmit(e));

    const discountInput = document.getElementById('discountVal');
    const discountType = document.getElementById('discountType');
    discountInput && discountInput.addEventListener('input', () => this.recalculate());
    discountType && discountType.addEventListener('change', () => this.recalculate());

    // Customer change — auto-populate if needed
    const custSel = document.getElementById('customerId');
    custSel && custSel.addEventListener('change', function () {
      const customers = Store.get('customers', []);
      const cust = customers.find(c => c.id === this.value);
      const custName = document.getElementById('customerName');
      const custPhone = document.getElementById('customerPhone');
      if (cust) {
        custName && (custName.value = cust.name);
        custPhone && (custPhone.value = cust.phone);
      }
    });
  },

  addItem(data = {}) {
    this.itemCount++;
    const idx = this.itemCount;
    const products = Store.get('products', []);

    const productOptions = products.map(p =>
      `<option value="${p.name}" data-price="${p.price}" ${data.product === p.name ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const row = document.createElement('tr');
    row.className = 'invoice-item-row';
    row.dataset.idx = idx;
    row.innerHTML = `
      <td>
        <select class="form-control-custom item-product" onchange="InvoiceBuilder.onProductChange(this)">
          <option value="">-- Select Product --</option>
          ${productOptions}
        </select>
      </td>
      <td>
        <input type="number" class="form-control-custom item-qty" min="1" value="${data.qty || 1}" oninput="InvoiceBuilder.recalculate()">
      </td>
      <td>
        <input type="number" class="form-control-custom item-price" min="0" step="0.01" value="${data.price || ''}" oninput="InvoiceBuilder.recalculate()">
      </td>
      <td>
        <input type="text" class="form-control-custom item-total" readonly value="${data.total || '0.00'}">
      </td>
      <td>
        <button type="button" class="btn-icon btn-del" onclick="InvoiceBuilder.removeItem(this)" title="Remove">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;

    const tbody = document.getElementById('itemsTableBody');
    tbody && tbody.appendChild(row);

    if (data.product) this.recalculate();
  },

  onProductChange(select) {
    const opt = select.options[select.selectedIndex];
    const price = opt.dataset.price || '';
    const row = select.closest('tr');
    if (row) {
      const priceInput = row.querySelector('.item-price');
      priceInput && (priceInput.value = price);
    }
    this.recalculate();
  },

  removeItem(btn) {
    const row = btn.closest('tr');
    if (!row) return;
    const tbody = document.getElementById('itemsTableBody');
    if (tbody && tbody.querySelectorAll('tr').length <= 1) {
      Utils.toast('At least one item is required.', 'warning');
      return;
    }
    row.remove();
    this.recalculate();
  },

  recalculate() {
    let subtotal = 0;
    const rows = document.querySelectorAll('.invoice-item-row');

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
      const total = qty * price;
      const totalInput = row.querySelector('.item-total');
      totalInput && (totalInput.value = total.toFixed(2));
      subtotal += total;
    });

    const discountVal = parseFloat(document.getElementById('discountVal')?.value) || 0;
    const discountType = document.getElementById('discountType')?.value || 'fixed';

    let discountAmt = 0;
    if (discountType === 'percent') {
      discountAmt = (subtotal * discountVal) / 100;
    } else {
      discountAmt = discountVal;
    }
    discountAmt = Math.min(discountAmt, subtotal);

    const finalTotal = subtotal - discountAmt;

    const el = (id) => document.getElementById(id);
    el('summarySubtotal') && (el('summarySubtotal').textContent = Utils.currency(subtotal));
    el('summaryDiscount') && (el('summaryDiscount').textContent = '- ' + Utils.currency(discountAmt));
    el('summaryTotal') && (el('summaryTotal').textContent = Utils.currency(finalTotal));

    // Hidden fields for form submission
    el('hiddenSubtotal') && (el('hiddenSubtotal').value = subtotal.toFixed(2));
    el('hiddenDiscount') && (el('hiddenDiscount').value = discountAmt.toFixed(2));
    el('hiddenTotal') && (el('hiddenTotal').value = finalTotal.toFixed(2));
  },

  getItems() {
    const rows = document.querySelectorAll('.invoice-item-row');
    const items = [];
    rows.forEach(row => {
      const product = row.querySelector('.item-product')?.value;
      const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
      const total = qty * price;
      if (product && qty > 0 && price > 0) {
        items.push({ product, qty, price, total });
      }
    });
    return items;
  },

  handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const customerId = document.getElementById('customerId')?.value;
    const customers = Store.get('customers', []);
    const customer = customers.find(c => c.id === customerId) || {};

    const items = this.getItems();
    if (items.length === 0) {
      Utils.toast('Please add at least one valid item.', 'danger');
      return;
    }

    const invoices = Store.get('invoices', []);
    const editId = form.dataset.editId;
    const isEdit = !!editId;

    const invoice = {
      id: isEdit ? editId : Utils.generateId('INV-', invoices),
      customerId: customerId,
      customerName: customer.name || document.getElementById('customerName')?.value || 'Walk-in',
      date: document.getElementById('invoiceDate')?.value || new Date().toISOString().split('T')[0],
      dueDate: document.getElementById('dueDate')?.value || '',
      notes: document.getElementById('notes')?.value || '',
      items,
      subtotal: parseFloat(document.getElementById('hiddenSubtotal')?.value) || 0,
      discount: parseFloat(document.getElementById('discountVal')?.value) || 0,
      discountType: document.getElementById('discountType')?.value || 'fixed',
      discountAmt: parseFloat(document.getElementById('hiddenDiscount')?.value) || 0,
      total: parseFloat(document.getElementById('hiddenTotal')?.value) || 0,
      paid: 0,
      status: 'Unpaid'
    };

    if (isEdit) {
      const idx = invoices.findIndex(i => i.id === editId);
      if (idx > -1) {
        invoice.paid = invoices[idx].paid;
        invoice.status = invoices[idx].status;
        invoices[idx] = invoice;
      }
    } else {
      invoices.push(invoice);
    }

    Store.set('invoices', invoices);

    // Log activity
    const activity = Store.get('activity', []);
    activity.unshift({ user: 'Admin', action: `${isEdit ? 'Updated' : 'Created'} Invoice ${invoice.id}`, date: new Date().toLocaleString('en-IN') });
    Store.set('activity', activity);

    Utils.toast(`Invoice ${invoice.id} ${isEdit ? 'updated' : 'created'} successfully!`);
    setTimeout(() => { window.location.href = '../invoices/view.html?id=' + invoice.id; }, 1000);
  }
};

/* ============================================
   INVOICE VIEW (print, share, download, QR)
   ============================================ */
const InvoiceViewer = {
  invoiceId: null,
  invoice: null,

  init() {
    const params = new URLSearchParams(window.location.search);
    this.invoiceId = params.get('id');

    if (!this.invoiceId) {
      document.querySelector('.print-invoice') && (document.querySelector('.print-invoice').innerHTML = '<p class="text-danger">No invoice ID specified.</p>');
      return;
    }

    const invoices = Store.get('invoices', []);
    this.invoice = invoices.find(i => i.id === this.invoiceId);

    if (!this.invoice) {
      document.querySelector('.print-invoice') && (document.querySelector('.print-invoice').innerHTML = '<p class="text-danger">Invoice not found.</p>');
      return;
    }

    this.render();
    this.bindButtons();
  },

  render() {
    const inv = this.invoice;
    const settings = Store.get('settings', {});

    const itemsHtml = inv.items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.product}</td>
        <td>${item.qty}</td>
        <td>${Utils.currency(item.price)}</td>
        <td>${Utils.currency(item.total)}</td>
      </tr>`).join('');

    const el = (id) => document.getElementById(id);

    el('invShopName') && (el('invShopName').textContent = settings.shopName || 'BHAI BHAI COMMUNICATION');
    el('invShopAddress') && (el('invShopAddress').textContent = settings.address || '');
    el('invShopPhone') && (el('invShopPhone').textContent = settings.phone || '');
    el('invShopUpi') && (el('invShopUpi').textContent = settings.upiId || '');

    el('invNumber') && (el('invNumber').textContent = inv.id);
    el('invDate') && (el('invDate').textContent = Utils.formatDate(inv.date));
    el('invDueDate') && (el('invDueDate').textContent = Utils.formatDate(inv.dueDate));
    el('invStatus') && (el('invStatus').innerHTML = Utils.statusBadge(inv.status));

    el('invCustomerName') && (el('invCustomerName').textContent = inv.customerName);

    el('invItemsBody') && (el('invItemsBody').innerHTML = itemsHtml);

    el('invSubtotal') && (el('invSubtotal').textContent = Utils.currency(inv.subtotal));
    el('invDiscount') && (el('invDiscount').textContent = '- ' + Utils.currency(inv.discountAmt || 0));
    el('invTotal') && (el('invTotal').textContent = Utils.currency(inv.total));
    el('invPaid') && (el('invPaid').textContent = Utils.currency(inv.paid));
    el('invDue') && (el('invDue').textContent = Utils.currency(inv.total - inv.paid));
  },

  bindButtons() {
    const inv = this.invoice;

    // Print
    const printBtn = document.getElementById('printBtn');
    printBtn && printBtn.addEventListener('click', () => window.print());

    // WhatsApp Share
    const waBtn = document.getElementById('whatsappBtn');
    waBtn && waBtn.addEventListener('click', () => {
      const text = `*Invoice ${inv.id}*\nCustomer: ${inv.customerName}\nDate: ${Utils.formatDate(inv.date)}\nTotal: ${Utils.currency(inv.total)}\nStatus: ${inv.status}\n\nBHAI BHAI COMMUNICATION\nUPI: bhai-bhai@paytm`;
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    });

    // QR Code (lazy load)
    const qrBtn = document.getElementById('qrBtn');
    qrBtn && qrBtn.addEventListener('click', () => this.showQR());

    // Download as Image (lazy load html2canvas)
    const dlBtn = document.getElementById('downloadBtn');
    dlBtn && dlBtn.addEventListener('click', () => this.downloadImage());
  },

  showQR() {
    const qrContainer = document.getElementById('qrContainer');
    if (!qrContainer) return;

    if (qrContainer.innerHTML.trim() !== '') {
      qrContainer.innerHTML = '';
      return;
    }

    const inv = this.invoice;
    const settings = Store.get('settings', {});
    const upiUrl = `upi://pay?pa=${settings.upiId || 'bhai-bhai@paytm'}&pn=${encodeURIComponent(settings.shopName || 'BHAI BHAI')}&am=${inv.total - inv.paid}&tn=${inv.id}`;

    // Lazy load QR library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    script.onload = function () {
      const qr = qrcode(0, 'M');
      qr.addData(upiUrl);
      qr.make();
      qrContainer.innerHTML = '<p style="font-size:12px;color:#64748b;margin-bottom:8px;">Scan to Pay via UPI</p>' + qr.createImgTag(4, 8);
    };
    document.head.appendChild(script);
  },

  downloadImage() {
    const target = document.querySelector('.print-invoice');
    if (!target) return;

    if (typeof html2canvas !== 'undefined') {
      this._captureAndDownload(target);
      return;
    }

    Utils.toast('Loading image library...', 'info');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = () => this._captureAndDownload(target);
    document.head.appendChild(script);
  },

  _captureAndDownload(target) {
    html2canvas(target, { scale: 2, useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${this.invoiceId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Utils.toast('Invoice downloaded as image!');
    });
  }
};

/* ---- Auto-init based on page ---- */
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('invoiceForm')) InvoiceBuilder.init();
  if (document.getElementById('invNumber')) InvoiceViewer.init();
});
