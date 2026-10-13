// ============================================
// MotoSpare — Shopping Cart + Checkout + Payment
// UPGRADED: Full validation, 15min timer, auto-pay
// ============================================

const Cart = {
  items: [],
  checkoutDraft: {},

  init() {
    this.items = Utils.storage.get('cart', []);
    this.updateBadge();
  },

  addItem(productId, selectedVariants = {}, qty = 1) {
    const product = typeof App !== 'undefined' ? App.findProduct(productId) : PRODUCTS.find(p => p.id === productId || p.sku === productId);
    if (!product) return;
    if (product.stockStatus === 'habis') {
      Utils.showToast('Maaf, stok barang habis!', 'error');
      return;
    }
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (!selectedVariants[v.name]) {
          Utils.showToast(`Pilih ${v.name} terlebih dahulu!`, 'warning');
          return;
        }
      }
    }
    let variantPriceAdd = 0;
    const variantParts = [];
    if (product.variants) {
      for (const v of product.variants) {
        const selected = selectedVariants[v.name];
        if (selected) {
          const optIdx = v.options.indexOf(selected);
          if (optIdx !== -1 && v.priceAdd && v.priceAdd[optIdx]) {
            variantPriceAdd += v.priceAdd[optIdx];
          }
          variantParts.push(`${v.name}: ${selected}`);
        }
      }
    }
    const variantText = variantParts.join(', ');
    const cartKey = productId + '|' + variantText;
    const existing = this.items.find(item => item.cartKey === cartKey);
    if (existing) {
      existing.qty += qty;
      existing.subtotal = existing.qty * existing.unitPrice;
    } else {
      const displayPrice = Auth.getPrice(product);
      const unitPrice = displayPrice + variantPriceAdd;
      this.items.push({
        cartKey, productId,
        name: product.name,
        image: Utils.getProductImage(product),
        unitPrice, qty,
        subtotal: unitPrice * qty,
        selectedVariants: { ...selectedVariants },
        variantText,
        stockStatus: product.stockStatus,
        checked: true,
        weightGram: this.parseWeight(product.weight)
      });
    }
    this.save();
    this.updateBadge();
    Utils.showToast(`${product.name} ditambahkan ke keranjang! 🛒`, 'success');
  },

  removeItem(cartKey) {
    this.items = this.items.filter(item => item.cartKey !== cartKey);
    this.save(); this.updateBadge();
  },

  updateQty(cartKey, newQty) {
    const item = this.items.find(i => i.cartKey === cartKey);
    if (!item) return;
    if (newQty <= 0) { this.removeItem(cartKey); return; }
    item.qty = newQty;
    item.subtotal = item.unitPrice * newQty;
    this.save();
  },

  toggleCheck(cartKey) {
    const item = this.items.find(i => i.cartKey === cartKey);
    if (item) { item.checked = !item.checked; this.save(); }
  },

  toggleCheckAll() {
    const allChecked = this.items.every(i => i.checked);
    this.items.forEach(i => i.checked = !allChecked);
    this.save();
  },

  getCheckedItems() { return this.items.filter(i => i.checked); },
  getCheckedTotal() { return this.getCheckedItems().reduce((sum, item) => sum + item.subtotal, 0); },
  getCheckedCount() { return this.getCheckedItems().reduce((sum, item) => sum + item.qty, 0); },
  getCheckedWeightKg() {
    return this.getCheckedItems().reduce((sum, item) => {
      let gramPerUnit = item.weightGram;
      if (!gramPerUnit) {
        console.warn('Product weight missing:', item.name, '— using default 1kg');
        gramPerUnit = 1000;
      }
      return sum + (gramPerUnit * item.qty);
    }, 0) / 1000; // convert to kg
  },

  parseWeight(weightInput) {
    // Handles both legacy string ("500g", "1.5kg") and new numeric kg (0.5, 3.0)
    if (weightInput === undefined || weightInput === null) return 1000; // default 1kg in grams
    
    // If it's already a number (new format: kg), convert to grams
    if (typeof weightInput === 'number') {
      if (weightInput <= 0) return 1000; // invalid, default 1kg
      // Numbers <= 50 are assumed to be kg, otherwise grams
      return weightInput <= 50 ? weightInput * 1000 : weightInput;
    }
    
    // Legacy string format
    const str = String(weightInput).toLowerCase().trim();
    const num = parseFloat(str);
    if (isNaN(num)) return 1000; // default 1kg in grams
    if (str.includes('kg')) return num * 1000;
    if (str.includes('g')) return num;
    return num > 100 ? num : num * 1000; // assume kg if small number
  },
  getTotalItems() { return this.items.reduce((sum, item) => sum + item.qty, 0); },

  clear() { this.items = []; this.save(); this.updateBadge(); },
  clearChecked() { this.items = this.items.filter(i => !i.checked); this.save(); this.updateBadge(); },

  save() { Utils.storage.set('cart', this.items); },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const total = this.getTotalItems();
    badges.forEach(badge => {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    });
  },

  // ==========================================
  // CART PAGE
  // ==========================================
  render() {
    if (this.items.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">🛒</div><h3>Keranjang Kosong</h3><p>Belum ada barang di keranjang. Yuk belanja!</p><button class="btn-primary" onclick="App.navigate('home')">Mulai Belanja</button></div>`;
    }
    const allChecked = this.items.every(i => i.checked);
    return `
      <div class="cart-page">
        <h2 class="page-title">🛒 Keranjang Belanja</h2>
        <div class="cart-layout">
          <div class="cart-items-section">
            <div class="cart-select-all">
              <label class="checkbox-wrapper">
                <input type="checkbox" ${allChecked ? 'checked' : ''} onchange="Cart.toggleCheckAll(); Cart.refreshCartPage();">
                <span>Pilih Semua (${this.items.length})</span>
              </label>
              <button class="btn-text-danger" onclick="Cart.deleteChecked()">Hapus yang dipilih</button>
            </div>
            ${this.items.map(item => {
              const product = typeof App !== 'undefined' ? App.findProduct(item.productId) : null;
              const identifier = product && product.sku ? product.sku : item.productId;
              return `
              <div class="cart-item-card">
                <label class="checkbox-wrapper"><input type="checkbox" ${item.checked ? 'checked' : ''} onchange="Cart.toggleCheck('${item.cartKey}'); Cart.refreshCartPage();"></label>
                <img src="${item.image}" alt="" class="cart-item-img" onclick="App.navigate('product', '${identifier}')">
                <div class="cart-item-details">
                  <h4 class="cart-item-name" onclick="App.navigate('product', '${identifier}')">${Utils.escapeHtml(item.name)}</h4>
                  ${item.variantText ? `<p class="cart-item-variant">${Utils.escapeHtml(item.variantText)}</p>` : ''}
                  <p class="cart-item-price">${Utils.formatPrice(item.unitPrice)}</p>
                  <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="Cart.changeQty('${item.cartKey}', -1)">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn" onclick="Cart.changeQty('${item.cartKey}', 1)">+</button>
                    <button class="cart-delete-btn" onclick="Cart.removeAndRefresh('${item.cartKey}')">🗑️</button>
                  </div>
                </div>
                <div class="cart-item-subtotal">${Utils.formatPrice(item.subtotal)}</div>
              </div>
              `;
            }).join('')}
          </div>
          <div class="cart-summary-section">
            <div class="cart-summary-card">
              <h3>Ringkasan Belanja</h3>
              <div class="summary-row"><span>Total Harga (${this.getCheckedCount()} barang)</span><span>${Utils.formatPrice(this.getCheckedTotal())}</span></div>
              <div class="summary-divider"></div>
              <div class="summary-row summary-total"><span>Total</span><span class="total-price">${Utils.formatPrice(this.getCheckedTotal())}</span></div>
              <button class="btn-primary btn-full btn-checkout" onclick="Cart.goCheckout()" ${this.getCheckedItems().length === 0 ? 'disabled' : ''}>Checkout (${this.getCheckedCount()})</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  changeQty(cartKey, delta) {
    const item = this.items.find(i => i.cartKey === cartKey);
    if (!item) return;
    if (item.qty + delta <= 0) { this.removeAndRefresh(cartKey); return; }
    this.updateQty(cartKey, item.qty + delta);
    this.refreshCartPage();
  },

  removeAndRefresh(cartKey) {
    this.removeItem(cartKey);
    this.refreshCartPage();
    Utils.showToast('Barang dihapus dari keranjang', 'info');
  },

  deleteChecked() {
    if (this.getCheckedItems().length === 0) { Utils.showToast('Pilih barang yang ingin dihapus', 'warning'); return; }
    this.clearChecked();
    this.refreshCartPage();
    Utils.showToast('Barang terpilih dihapus', 'info');
  },

  refreshCartPage() {
    const content = document.getElementById('main-content');
    if (content && window.location.hash.includes('cart')) {
      content.innerHTML = this.render();
    }
    this.updateBadge();
  },

  goCheckout() {
    if (this.getCheckedItems().length === 0) { Utils.showToast('Pilih barang untuk checkout!', 'warning'); return; }
    App.navigate('checkout');
  },

  // ==========================================
  // CHECKOUT PAGE — Full flow with strict validation
  // ==========================================
  shippingOptions: [],
  isCalculatingOngkir: false,
  selectedShipping: '',
  selectedPaymentType: 'qris',
  selectedPaymentSub: '',
  bniProofBase64: null,

  initOngkir() {
    if (window.OngkirSystem) {
      window.OngkirSystem.onCalculateStart = () => {
        this.isCalculatingOngkir = true;
        this.refreshShippingUI();
      };
      window.OngkirSystem.onCalculateSuccess = (opts, isFallback) => {
        this.isCalculatingOngkir = false;
        this.shippingOptions = opts || [];
        if (this.shippingOptions.length > 0 && !this.shippingOptions.find(o => o.id === this.selectedShipping)) {
          this.selectedShipping = this.shippingOptions[0].id;
        } else if (this.shippingOptions.length === 0) {
          this.selectedShipping = '';
        }
        
        // Allow COD payment for Kurir Nunukan

        this.refreshShippingUI();
      };
    }
  },

  triggerOngkir() {
    const address = document.getElementById('checkout-address')?.value || '';
    const city = document.getElementById('checkout-city')?.value || '';
    const zip = document.getElementById('checkout-zip')?.value || '';
    if (window.OngkirSystem) {
      // Pass total weight to ongkir engine
      window.OngkirSystem.setTotalWeight(this.getCheckedWeightKg());
      window.OngkirSystem.currentAddressQuery = ''; // force recalculate
      window.OngkirSystem.debounceCalculation(address, city, zip);
    }
  },

  refreshShippingUI() {
    const container = document.getElementById('shipping-options-container');
    const summaryContainer = document.getElementById('checkout-summary-container');
    if (container) {
      container.innerHTML = this.renderShippingOptionsHtml();
    }
    if (summaryContainer) {
      summaryContainer.innerHTML = this.renderCheckoutSummaryHtml();
    }
  },

  renderShippingOptionsHtml() {
    if (this.isCalculatingOngkir) {
      return `<div style="padding: 20px; text-align: center; color: var(--text-secondary);">
        <span style="font-size: 24px; display: inline-block; animation: spin 1s linear infinite;">⏳</span>
        <p style="margin-top: 10px;">Menghitung ongkos kirim...</p>
      </div>`;
    }
    if (this.shippingOptions.length === 0) {
      return `<div style="padding: 20px; text-align: center; background: var(--bg-main); border-radius: var(--border-radius); color: var(--text-muted);">
        <p>Silakan lengkapi Alamat Lengkap dan Kota/Kabupaten untuk melihat opsi pengiriman.</p>
      </div>`;
    }
    let html = `<div class="shipping-options">` + this.shippingOptions.map(s => `
      <label class="shipping-option">
        <input type="radio" name="shipping" value="${s.id}" ${this.selectedShipping === s.id ? 'checked' : ''} onchange="Cart.changeShipping('${s.id}')">
        <div class="shipping-card ${this.selectedShipping === s.id ? 'selected' : ''}">
          <span class="shipping-icon">${s.icon}</span>
          <div class="shipping-info">
             <strong>${s.name}</strong>
             <p>${s.desc}</p>
          </div>
          <span class="shipping-price">${s.price === 0 ? 'Gratis' : Utils.formatPrice(s.price)}</span>
        </div>
      </label>
    `).join('') + `</div>`;
    return html;
  },
  
  renderCheckoutSummaryHtml() {
    const items = this.getCheckedItems();
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);
    const shippingPrice = shipping?.price || 0;
    const total = subtotal + shippingPrice;
    
    return `
      <div class="summary-row"><span>Total Harga (${items.length} Barang)</span><span>${Utils.formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Total Ongkos Kirim</span><span class="${shippingPrice === 0 ? 'free-shipping' : ''}">${shippingPrice === 0 ? 'Gratis' : Utils.formatPrice(shippingPrice)}</span></div>
      <div class="summary-divider"></div>
      <div class="summary-row summary-total"><span>Total Belanja</span><span class="total-price">${Utils.formatPrice(total)}</span></div>
      <button class="btn-primary btn-full btn-checkout" onclick="Cart.placeOrder()" ${!shipping ? 'disabled' : ''}>Buat Pesanan</button>
    `;
  },

  refreshCheckout() {
    const content = document.getElementById('main-content');
    if (content && window.location.hash.includes('checkout')) {
      content.innerHTML = this.renderCheckout();
    }
  },

  renderCheckout() {
    const items = this.getCheckedItems();
    if (items.length === 0) { App.navigate('cart'); return '<p>Redirecting...</p>'; }
    
    // Shipping options handled asynchronously
    
    const d = this.checkoutDraft;

    return `
      <div class="checkout-page">
        <h2 class="page-title">📋 Checkout</h2>
        <div class="checkout-layout">
          <div class="checkout-main">
            <!-- Address -->
            <div class="checkout-section">
              <h3>📍 Alamat Pengiriman</h3>
              <div class="address-form">
                <div class="form-group"><label>Nama Penerima *</label><input type="text" id="checkout-name" value="${Utils.escapeHtml(d.name || '')}" oninput="Cart.saveCheckoutDraft()" placeholder="Nama lengkap penerima" required></div>
                <div class="form-group">
                  <label>No. HP / WhatsApp *</label>
                  <div class="phone-input-group">
                    <select id="checkout-phone-region" class="phone-region" onchange="Cart.saveCheckoutDraft()">
                      <option value="+62" ${(d.phoneRegion || '+62') === '+62' ? 'selected' : ''}>🇮🇩 +62</option>
                      <option value="+60" ${d.phoneRegion === '+60' ? 'selected' : ''}>🇲🇾 +60</option>
                      <option value="+65" ${d.phoneRegion === '+65' ? 'selected' : ''}>🇸🇬 +65</option>
                      <option value="+1" ${d.phoneRegion === '+1' ? 'selected' : ''}>🇺🇸 +1</option>
                    </select>
                    <input type="tel" id="checkout-phone" value="${Utils.escapeHtml(d.phone || '')}" oninput="this.value=this.value.replace(/[^0-9]/g,''); Cart.saveCheckoutDraft();" placeholder="8123456789" required maxlength="13">
                  </div>
                  <small class="form-hint">Hanya angka, 10-13 digit</small>
                </div>
                  <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                      <label style="margin-bottom:0;">Alamat Lengkap *</label>
                      <div style="display:flex; gap:8px;">
                        <button type="button" onclick="Cart.useCurrentLocation()" id="btn-use-location" style="background:#2563eb; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:0.2s;">
                          <span style="font-size:14px;">📍</span> <span>Gunakan Lokasi Saat Ini</span>
                        </button>
                        <button type="button" onclick="Cart.openMapPicker()" id="btn-map-location" style="background:#059669; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:0.2s;">
                          <span style="font-size:14px;">🗺️</span> <span>Pilih Lokasi di Peta</span>
                        </button>
                      </div>
                    </div>
                    <textarea id="checkout-address" rows="3" oninput="Cart.saveCheckoutDraft(); Cart.triggerOngkir()" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" required>${Utils.escapeHtml(d.address || '')}</textarea>
                  </div>
                  <div class="form-group" style="margin-top: 12px;">
                    <label>Detail Alamat / Patokan (Opsional)</label>
                    <input type="text" id="checkout-address-detail" value="${Utils.escapeHtml(d.addressDetail || '')}" oninput="Cart.saveCheckoutDraft()" placeholder="Contoh: No. 12, Gang Sepakat, Samping Toko Merah">
                    <small class="form-hint">Tambahkan detail manual seperti No. Rumah, Nama Gang, atau Patokan jika lokasi peta belum detail.</small>
                  </div>
                <div class="form-row">
                  <div class="form-group" style="position: relative;">
                    <label>Kota/Kabupaten *</label>
                    <input type="text" id="checkout-city" name="checkout_city_random_4920" autocomplete="new-password" value="${Utils.escapeHtml(d.city || '')}" onfocus="Cart.showCityDropdown()" oninput="Cart.handleCityInput(this.value)" placeholder="Cari kota atau kabupaten..." required>
                    <div id="city-dropdown" class="city-dropdown-list" style="display:none; position:absolute; top:100%; left:0; width:100%; background:#fff; border:1px solid #ddd; border-radius:8px; z-index:9999; max-height:250px; overflow-y:auto; box-shadow:0 4px 12px rgba(0,0,0,0.15); margin-top:4px;"></div>
                  </div>
                  <div class="form-group"><label>Kode Pos *</label><input type="text" id="checkout-zip" name="checkout_zip_random_4920" autocomplete="new-password" oninput="this.value=this.value.replace(/[^0-9]/g,''); Cart.saveCheckoutDraft(); Cart.triggerOngkir();" value="${Utils.escapeHtml(d.zip || '')}" placeholder="12345" maxlength="5" required><small class="form-hint">5 digit angka</small></div>
                </div>
              </div>
            </div>

            <!-- Items -->
            <div class="checkout-section">
              <h3>📦 Pesanan (${items.length} produk)</h3>
              ${items.map(item => `
                <div class="checkout-item">
                  <img src="${item.image}" alt="" class="checkout-item-img">
                  <div class="checkout-item-info">
                    <p class="checkout-item-name">${Utils.escapeHtml(item.name)}</p>
                    ${item.variantText ? `<p class="checkout-item-variant">${Utils.escapeHtml(item.variantText)}</p>` : ''}
                    <p class="checkout-item-meta">${Utils.formatPrice(item.unitPrice)} × ${item.qty}</p>
                  </div>
                  <div class="checkout-item-subtotal">${Utils.formatPrice(item.subtotal)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Shipping -->
            <div class="checkout-section">
              <h3>🚚 Metode Pengiriman</h3>
              
              
              <div id="shipping-options-container">
                ${this.renderShippingOptionsHtml()}
              </div>
            </div>

            <!-- Payment Method -->
            <div class="checkout-section">
              <h3>💳 Metode Pembayaran</h3>
              <div class="payment-type-tabs">
                ${(() => {
                  const availablePayments = (typeof ACTIVE_PAYMENTS !== 'undefined' ? ACTIVE_PAYMENTS : []);
                  return availablePayments.map(p => `
                    <button class="pay-tab ${this.selectedPaymentType === p.id ? 'active' : ''}" onclick="Cart.switchPaymentType('${p.id}')">${p.icon} ${p.shortName || p.name}</button>
                  `).join('');
                })()}
              </div>

              <div class="payment-sub-options" id="payment-sub-options">
                ${(() => {
                  const availablePayments = (typeof ACTIVE_PAYMENTS !== 'undefined' ? ACTIVE_PAYMENTS : []);
                  return availablePayments.filter(p => this.selectedPaymentType === p.id).map(p => `
                  <div class="payment-info-box">
                    <span class="pay-info-icon">${p.icon}</span>
                    <div style="width: 100%;">
                      <strong>${p.name}</strong>
                      <p>${p.id === 'bni' ? 'No. Rek: <strong>0888888685</strong> a.n. <strong>ERSON</strong> (BNI)' : (p.desc || 'Metode pembayaran ini tersedia')}</p>
                      ${p.id === 'bni' ? `
                        <div style="margin-top: 12px; background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%); padding: 16px; border-radius: 10px; border: 1px solid #c7d2fe;">
                          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 22px;">🏦</span>
                            <span style="font-weight: 700; font-size: 15px; color: #1e3a5f;">Bank BNI</span>
                          </div>
                          <div style="background: #fff; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; border: 1px dashed #a5b4fc;">
                            <small style="color: #64748b; display: block; margin-bottom: 4px;">Nomor Rekening</small>
                            <span style="font-size: 20px; font-weight: 700; letter-spacing: 1.5px; color: #1e293b;">0888888685</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                            <small style="color: #64748b;">Atas Nama:</small>
                            <strong style="color: #1e293b; font-size: 14px;">ERSON</strong>
                          </div>
                          <button type="button" class="btn-secondary" style="padding: 8px 16px; font-size: 14px; width: 100%; border-radius: 8px;" onclick="Cart.copyBniRekening()">📋 Salin Nomor Rekening</button>
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                          <label style="display:block; margin-bottom: 8px; font-weight: bold;">Upload Bukti Pembayaran *</label>
                          <input type="file" id="payment-proof" accept=".jpg, .jpeg, .png, .pdf" onchange="Cart.handlePaymentProof(event)" style="display:block; width:100%; border:1px solid #ddd; padding: 8px; border-radius: 6px;">
                          <small class="form-hint" style="display:block; margin-top: 4px;">Format: JPG, JPEG, PNG, PDF (Maks. 5MB)</small>
                        </div>
                      ` : ''}
                      ${p.id === 'qris' ? `
                        <div style="margin-top: 12px; text-align: center; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
                          <p style="font-weight: 600; margin-bottom: 10px; color: #334155;">Scan QR Code di bawah ini:</p>
                          <div style="background: #fff; padding: 12px; border-radius: 10px; display: inline-block; border: 1px solid #e2e8f0;">
                            <img src="img/qris.png" alt="QRIS Payment" style="max-width: 250px; width: 100%; height: auto; border-radius: 6px;">
                          </div>

                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                          <label style="display:block; margin-bottom: 8px; font-weight: bold;">Upload Bukti Pembayaran *</label>
                          <input type="file" id="payment-proof" accept=".jpg, .jpeg, .png, .pdf" onchange="Cart.handlePaymentProof(event)" style="display:block; width:100%; border:1px solid #ddd; padding: 8px; border-radius: 6px;">
                          <small class="form-hint" style="display:block; margin-top: 4px;">Format: JPG, JPEG, PNG, PDF (Maks. 5MB)</small>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('');
                })()}
              </div>
            </div>

            <!-- Notes -->
            <div class="checkout-section">
              <h3>📝 Catatan untuk Penjual (Opsional)</h3>
              <textarea id="checkout-notes" rows="2" placeholder="Catatan tambahan...">${Utils.escapeHtml(d.notes || '')}</textarea>
            </div>
          </div>

          <!-- Sidebar Summary -->
          <div class="checkout-sidebar">
            <div class="checkout-summary-card">
              <h3>Ringkasan Belanja</h3>
              <div id="checkout-summary-container">
                ${this.renderCheckoutSummaryHtml()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  saveCheckoutDraft() {
    this.checkoutDraft.name = document.getElementById('checkout-name')?.value || '';
    this.checkoutDraft.phone = document.getElementById('checkout-phone')?.value || '';
    this.checkoutDraft.phoneRegion = document.getElementById('checkout-phone-region')?.value || '+62';
    this.checkoutDraft.address = document.getElementById('checkout-address')?.value || '';
    this.checkoutDraft.addressDetail = document.getElementById('checkout-address-detail')?.value || '';
    this.checkoutDraft.city = document.getElementById('checkout-city')?.value || '';
    this.checkoutDraft.zip = document.getElementById('checkout-zip')?.value || '';
    this.checkoutDraft.notes = document.getElementById('checkout-notes')?.value || '';
  },

  async useCurrentLocation() {
    const btn = document.getElementById('btn-use-location');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="font-size:14px;">⏳</span> <span>Mendeteksi...</span>`;
      btn.style.opacity = '0.7';
    }

    if (!navigator.geolocation) {
      Utils.showToast('Browser Anda tidak mendukung deteksi lokasi.', 'error');
      this.resetLocationBtn();
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (window.OngkirSystem && window.OngkirSystem.reverseGeocode) {
          const geoData = await window.OngkirSystem.reverseGeocode(lat, lng);
          if (geoData && geoData.address) {
            const addr = geoData.address;
            const city = addr.city || addr.town || addr.county || '';
            const zip = addr.postcode || '';

            let fullAddress = geoData.display_name || '';

            const cityInput = document.getElementById('checkout-city');
            const addressInput = document.getElementById('checkout-address');
            const zipInput = document.getElementById('checkout-zip');

            if (cityInput && city) {
              cityInput.value = city.replace(/(Kota|Kabupaten)/gi, '').trim();
            }
            if (addressInput && fullAddress) {
              addressInput.value = fullAddress;
            }
            if (zipInput && zip) {
              zipInput.value = zip;
            }

            this.checkoutDraft.lat = lat;
            this.checkoutDraft.lng = lng;

            this.saveCheckoutDraft();
            Utils.showToast('Lokasi berhasil dideteksi!', 'success');
            
            // Trigger ongkir calculation
            if (this.triggerOngkir) this.triggerOngkir();
          } else {
            Utils.showToast('Gagal mengubah titik koordinat menjadi alamat.', 'error');
          }
        } else {
          Utils.showToast('Sistem Geocoding tidak tersedia.', 'error');
        }
      } catch (err) {
        console.error(err);
        Utils.showToast('Terjadi kesalahan saat memproses lokasi.', 'error');
      } finally {
        this.resetLocationBtn();
      }
    }, async (error) => {
      let msg = 'Gagal mendapatkan lokasi GPS. Mencoba via IP...';
      console.warn(msg, error);
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        if (ipData && ipData.city) {
          const cityInput = document.getElementById('checkout-city');
          const addressInput = document.getElementById('checkout-address');
          const zipInput = document.getElementById('checkout-zip');
          if (cityInput) cityInput.value = ipData.city;
          if (addressInput) addressInput.value = `${ipData.city}, ${ipData.region}, ${ipData.country_name}`;
          if (zipInput) zipInput.value = ipData.postal || '';
          this.checkoutDraft.city = ipData.city;
          this.saveCheckoutDraft();
          Utils.showToast('Lokasi perkiraan didapat via IP. Silakan edit manual jika kota tidak sesuai (cth: meleset ke kota server ISP).', 'warning');
        } else {
          Utils.showToast('Gagal otomatis mendapat lokasi.', 'error');
        }
      } catch (ipErr) {
        Utils.showToast('Browser memblokir lokasi (Akses via HTTP).', 'error');
      }
      this.resetLocationBtn();
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  },

  resetLocationBtn() {
    const btn = document.getElementById('btn-use-location');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `<span style="font-size:14px;">📍</span> <span>Gunakan Lokasi Saat Ini</span>`;
    }
  },

  openMapPicker() {
    if (document.getElementById('map-picker-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'map-picker-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:100%;max-width:600px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <div style="padding:15px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:16px;">🗺️ Pilih Lokasi Pengiriman</h3>
          <button onclick="Cart.closeMapPicker()" style="background:none;border:none;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
        </div>
        <div id="map-container" style="height:400px;width:100%;position:relative;"></div>
        <div style="padding:15px 20px;background:#f8fafc;display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #eee;">
          <button onclick="Cart.closeMapPicker()" class="btn-secondary" style="padding:8px 16px;">Batal</button>
          <button onclick="Cart.confirmMapLocation()" class="btn-primary" style="padding:8px 16px;">Konfirmasi Lokasi</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Initialize Leaflet
    setTimeout(() => {
      const lat = this.checkoutDraft.lat || -7.983908; // Default Malang
      const lng = this.checkoutDraft.lng || 112.621391;
      
      this.mapInstance = L.map('map-container').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.mapInstance);

      this.mapMarker = L.marker([lat, lng], { draggable: true }).addTo(this.mapInstance);
      
      this.mapInstance.on('click', (e) => {
        this.mapMarker.setLatLng(e.latlng);
      });
    }, 100);
  },

  closeMapPicker() {
    const modal = document.getElementById('map-picker-modal');
    if (modal) {
      if (this.mapInstance) {
        this.mapInstance.remove();
        this.mapInstance = null;
        this.mapMarker = null;
      }
      modal.remove();
    }
  },

  async confirmMapLocation() {
    if (!this.mapMarker) return;
    const position = this.mapMarker.getLatLng();
    const lat = position.lat;
    const lng = position.lng;
    
    this.closeMapPicker();
    
    // Reverse Geocode
    if (window.OngkirSystem && window.OngkirSystem.reverseGeocode) {
      try {
        const geoData = await window.OngkirSystem.reverseGeocode(lat, lng);
        if (geoData && geoData.address) {
          const addr = geoData.address;
          const city = addr.city || addr.town || addr.county || '';
          const zip = addr.postcode || '';

          let fullAddress = geoData.display_name || '';

          const cityInput = document.getElementById('checkout-city');
          const addressInput = document.getElementById('checkout-address');
          const zipInput = document.getElementById('checkout-zip');

          if (cityInput && city) cityInput.value = city.replace(/(Kota|Kabupaten)/gi, '').trim();
          if (addressInput && fullAddress) addressInput.value = fullAddress;
          if (zipInput && zip) zipInput.value = zip;

          this.checkoutDraft.lat = lat;
          this.checkoutDraft.lng = lng;

          this.saveCheckoutDraft();
          Utils.showToast('Lokasi berhasil dipilih dari peta!', 'success');
          
          if (this.triggerOngkir) this.triggerOngkir();
        } else {
          Utils.showToast('Gagal mengubah titik koordinat menjadi alamat.', 'error');
        }
      } catch (err) {
        console.error(err);
        Utils.showToast('Terjadi kesalahan saat memproses lokasi peta.', 'error');
      }
    } else {
      Utils.showToast('Sistem Geocoding tidak tersedia.', 'error');
    }
  },

  changeShipping(id) {
    this.saveCheckoutDraft();
    this.selectedShipping = id;
    this.refreshShippingUI();
  },

  switchPaymentType(type) {
    this.saveCheckoutDraft();
    this.selectedPaymentType = type;
    this.selectedPaymentSub = '';
    this.bniProofBase64 = null;
    const content = document.getElementById('main-content');
    if (content) content.innerHTML = this.renderCheckout();
  },

  selectPaymentSub(subId) {
    this.saveCheckoutDraft();
    this.selectedPaymentSub = subId;
    const content = document.getElementById('main-content');
    if (content) content.innerHTML = this.renderCheckout();
  },

  copyBniRekening() {
    const text = '0888888685';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        Utils.showToast('Nomor Rekening berhasil disalin!', 'success');
      }).catch(() => {
        this._fallbackCopy(text);
      });
    } else {
      this._fallbackCopy(text);
    }
  },

  _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      Utils.showToast('Nomor Rekening berhasil disalin!', 'success');
    } catch (e) {
      Utils.showToast('Salin manual: ' + text, 'info');
    }
    document.body.removeChild(ta);
  },

  handlePaymentProof(e) {
    const file = e.target.files[0];
    if (!file) {
      this.bniProofBase64 = null;
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      Utils.showToast('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.', 'error');
      e.target.value = '';
      this.bniProofBase64 = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Ukuran file maksimal 5MB.', 'error');
      e.target.value = '';
      this.bniProofBase64 = null;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      this.bniProofBase64 = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  // ==========================================
  // CITY AUTOCOMPLETE
  // ==========================================
  showCityDropdown() {
    this.setupCityDropdownListener();
    const val = document.getElementById('checkout-city')?.value || '';
    this.renderCityList(val);
  },
  
  handleCityInput(val) {
    const input = document.getElementById('checkout-city');
    if (input) input.value = input.value.replace(/[0-9]/g, '');
    this.saveCheckoutDraft();
    this.renderCityList(input.value);
  },
  
  renderCityList(query) {
    const dropdown = document.getElementById('city-dropdown');
    if (!dropdown) return;
    
    if (typeof INDONESIA_CITIES === 'undefined') {
      dropdown.style.display = 'block';
      dropdown.innerHTML = `<div style="padding:15px; text-align:center; color:#666; font-size:14px;"><span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> Memuat data wilayah...</div>`;
      return;
    }
    
    const q = (query || '').toLowerCase().trim();
    let filtered = INDONESIA_CITIES;
    if (q) {
      filtered = INDONESIA_CITIES.filter(c => c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q));
    }
    
    if (filtered.length === 0) {
      dropdown.style.display = 'block';
      dropdown.innerHTML = `<div style="padding:15px; text-align:center; color:#ee4d2d; font-size:14px;">❌ Kota tidak ditemukan</div>`;
      return;
    }
    
    const grouped = {};
    filtered.slice(0, 50).forEach(c => {
      if (!grouped[c.province]) grouped[c.province] = [];
      grouped[c.province].push(c);
    });
    
    let html = '';
    for (const prov in grouped) {
      html += `<div style="padding:8px 12px; background:#f4f6f8; font-size:12px; font-weight:700; color:#555; text-transform:uppercase; position:sticky; top:0; z-index:2;">${prov}</div>`;
      grouped[prov].forEach(c => {
        html += `<div class="city-dropdown-item" style="padding:12px 12px; cursor:pointer; display:flex; justify-content:space-between; border-bottom:1px solid #f0f0f0; color:#333; font-size:14px; background:#fff; transition: background 0.1s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='#fff'" onclick="Cart.selectCity('${c.name.replace(/'/g, "\\'")}', '${c.zip}')">
          <span style="font-weight:500;">${c.name}</span>
          <span style="color:#007bff; font-size:13px; font-family:monospace; background:#e6f2ff; padding:2px 6px; border-radius:4px;">${c.zip}</span>
        </div>`;
      });
    }
    
    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  },
  
  setupCityDropdownListener() {
    if(!window.cityDropdownListener) {
      window.cityDropdownListener = (e) => {
        const input = document.getElementById('checkout-city');
        const dropdown = document.getElementById('city-dropdown');
        if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      };
      document.addEventListener('click', window.cityDropdownListener);
    }
  },
  
  selectCity(cityName, zipCode) {
    const input = document.getElementById('checkout-city');
    const zipInput = document.getElementById('checkout-zip');
    if (input) input.value = cityName;
    if (zipInput) zipInput.value = zipCode;
    
    const dropdown = document.getElementById('city-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    this.saveCheckoutDraft();
    this.triggerOngkir();
  },

  // ==========================================
  // FORM VALIDATION — Strict
  // ==========================================
  validateCheckoutForm() {
    const name = document.getElementById('checkout-name')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const address = document.getElementById('checkout-address')?.value.trim();
    const addressDetail = document.getElementById('checkout-address-detail')?.value.trim();
    const city = document.getElementById('checkout-city')?.value.trim();
    const zip = document.getElementById('checkout-zip')?.value.trim();

    if (!name || name.length < 2) {
      Utils.showToast('Nama penerima minimal 2 karakter!', 'error');
      return null;
    }

    // Phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      Utils.showToast('Nomor HP harus 10-13 digit!', 'error');
      return null;
    }
    // Check invalid patterns
    if (/^(.)\1+$/.test(cleanPhone)) {
      Utils.showToast('Nomor HP tidak valid (angka berulang)!', 'error');
      return null;
    }
    if (cleanPhone.length < 10) {
      Utils.showToast('Nomor HP terlalu pendek!', 'error');
      return null;
    }
    // Check sequential like 1234567890
    const isSequential = '01234567890'.includes(cleanPhone) || '09876543210'.includes(cleanPhone);
    if (isSequential && cleanPhone.length <= 10) {
      Utils.showToast('Nomor HP tidak valid!', 'error');
      return null;
    }

    if (!address || address.length < 10) {
      Utils.showToast('Alamat terlalu pendek, minimal 10 karakter!', 'error');
      return null;
    }

    // City: only letters and spaces
    if (!city || /[0-9]/.test(city)) {
      Utils.showToast('Kota/Kabupaten hanya boleh huruf, tidak boleh angka!', 'error');
      return null;
    }
    if (city.length < 3) {
      Utils.showToast('Nama kota minimal 3 karakter!', 'error');
      return null;
    }

    // Zip: only numbers, 5 digits
    if (!zip || !/^\d{5}$/.test(zip)) {
      Utils.showToast('Kode pos harus 5 digit angka!', 'error');
      return null;
    }

    if (!ACTIVE_PAYMENTS.some(p => p.id === this.selectedPaymentType)) {
      Utils.showToast('Pilih metode pembayaran terlebih dahulu!', 'error');
      return null;
    }

    if (this.selectedPaymentType === 'bni' && !this.bniProofBase64) {
      Utils.showToast('Harap upload bukti pembayaran terlebih dahulu!', 'error');
      return null;
    }

    const phoneRegion = document.getElementById('checkout-phone-region')?.value || '+62';
    if (!this.selectedShipping) {
      Utils.showToast('Pilih metode pengiriman terlebih dahulu!', 'error');
      return null;
    }
    let fullAddr = address;
    if (addressDetail) {
      fullAddr += `\n(Detail/Patokan: ${addressDetail})`;
    }
    return { name, phone: phoneRegion + cleanPhone, address: fullAddr, addressDetail, city, zip };
  },

  // ==========================================
  // PLACE ORDER → API
  // ==========================================
  async placeOrder() {
    const customer = this.validateCheckoutForm();
    if (!customer) return;

    const items = this.getCheckedItems();
    const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);
    const notes = document.getElementById('checkout-notes')?.value.trim() || '';
    customer.notes = notes;

    const activePay = ACTIVE_PAYMENTS.find(p => p.id === this.selectedPaymentType);
    let paymentLabel = activePay ? (activePay.shortName || activePay.name) : 'Metode Pembayaran';
    let paymentDetail = null;
    if (this.selectedPaymentType !== 'cod') {
      paymentDetail = { id: this.selectedPaymentType, name: activePay?.name || this.selectedPaymentType };
    }

    const orderPayload = {
      customer,
      items: items.map(i => ({ id: i.productId, name: i.name, variantText: i.variantText, qty: i.qty, unitPrice: i.unitPrice, subtotal: i.subtotal, image: i.image })),
      shippingId: shipping.id,
      paymentMethod: this.selectedPaymentType,
      subtotal: this.getCheckedTotal(),
      totalAmount: this.getCheckedTotal() + shipping.price,
      paymentProof: this.selectedPaymentType === 'bni' ? this.bniProofBase64 : null
    };

    try {
      Utils.showToast('Memproses pesanan...', 'info');
      const btn = document.querySelector('.btn-place-order');
      if (btn) btn.disabled = true;

      const res = await API.createOrder(orderPayload);
      
      const order = {
        id: res.orderId,
        payment: res.payment,
        codCode: res.codCode,
        items: items,
        subtotal: this.getCheckedTotal(),
        shippingMethod: shipping.name,
        shippingPrice: shipping.price,
        total: orderPayload.totalAmount,
        shipping: customer,
        paymentType: this.selectedPaymentType,
        paymentLabel,
        paymentDetail,
        paymentProof: this.selectedPaymentType === 'bni' ? this.bniProofBase64 : null,
        notes,
        status: res.status || (this.selectedPaymentType === 'bni' ? 'waiting_verification' : (this.selectedPaymentType === 'cod' ? 'confirmed' : 'pending_payment')),
        statusText: this.selectedPaymentType === 'bni' ? 'Menunggu Verifikasi Pembayaran' : (this.selectedPaymentType === 'cod' ? 'Pesanan Dikonfirmasi' : 'Menunggu Pembayaran'),
        createdAt: new Date().toISOString(),
        expiresAt: res.expiresAt,
        paidAt: null
      };

      // Save order locally
      const orders = Utils.storage.get('orders', []);
      orders.unshift(order);
      Utils.storage.set('orders', orders);

      this.clearChecked();
      this.checkoutDraft = {};

      if (this.selectedPaymentType === 'cod' || this.selectedPaymentType === 'bni') {
        this.bniProofBase64 = null;
        App.navigate('order-success', res.orderId);
      } else {
        App.navigate('payment', res.orderId);
      }
    } catch (err) {
      Utils.showToast(err.message, 'error');
      const btn = document.querySelector('.btn-place-order');
      if (btn) btn.disabled = false;
    }
  },

  // ==========================================
  // ORDERS LIST
  // ==========================================
  renderOrders() {
    const orders = Utils.storage.get('orders', []);
    if (orders.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📦</div><h3>Belum Ada Pesanan</h3><p>Yuk mulai belanja spare part motor!</p><button class="btn-primary" onclick="App.navigate('home')">Mulai Belanja</button></div>`;
    }

    const statusMap = {
      'waiting_verification': { text: 'Menunggu Verifikasi', class: 'status-warning' },
      'pending_payment': { text: 'Menunggu Pembayaran', class: 'status-pending' },
      'paid': { text: 'Dibayar', class: 'status-paid' },
      'confirmed': { text: 'Dikonfirmasi', class: 'status-confirmed' },
      'verified': { text: 'Pembayaran Terverifikasi', class: 'status-verified' },
      'shipping': { text: 'Sedang Dikirim', class: 'status-shipping' },
      'delivered': { text: 'Sampai Tujuan', class: 'status-delivered' },
      'expired': { text: 'Expired', class: 'status-expired' },
      'failed': { text: 'Gagal', class: 'status-failed' },
      'rejected': { text: 'Pembayaran Ditolak', class: 'status-rejected' },
    };

    return `
      <div class="orders-page">
        <h2 class="page-title">📦 Pesanan Saya</h2>
        <div class="orders-list">
          ${orders.map(order => {
            const st = statusMap[order.status] || { text: order.statusText || order.status, class: '' };
            return `
            <div class="order-card">
              <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status ${st.class}">${st.text}</span>
              </div>
              <div class="order-items">
                ${order.items.map(item => `
                  <div class="order-item-row">
                    <img src="${item.image}" alt="" class="order-item-img">
                    <div class="order-item-info">
                      <p class="order-item-name">${Utils.escapeHtml(item.name)}</p>
                      ${item.variantText ? `<p class="order-item-variant">${item.variantText}</p>` : ''}
                      <p class="order-item-qty">x${item.qty}</p>
                    </div>
                    <div class="order-item-price">${Utils.formatPrice(item.subtotal)}</div>
                  </div>
                `).join('')}
              </div>
              <div class="order-footer">
                <span class="order-date">${new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <div class="order-total"><span>Total:</span> <strong>${Utils.formatPrice(order.total)}</strong></div>
              </div>
              <div class="order-actions">
                ${order.status === 'pending_payment' ? `<button class="btn-primary" style="padding:8px 16px;font-size:13px;" onclick="App.navigate('payment', '${order.id}')">💳 Bayar Sekarang</button>` : ''}
                ${order.status === 'waiting_verification' ? `<button class="btn-secondary" style="padding:8px 16px;font-size:13px;" onclick="App.navigate('payment', '${order.id}')">🔍 Lihat Detail</button>` : ''}
                ${order.status === 'paid' || order.status === 'confirmed' || order.status === 'verified' ? `<button class="btn-secondary" style="padding:8px 16px;font-size:13px;" onclick="App.navigate('payment', '${order.id}')">📋 Lihat Detail</button>` : ''}
                ${order.status === 'expired' || order.status === 'rejected' ? `<button class="btn-secondary" style="padding:8px 16px;font-size:13px;" onclick="Cart.reorderExpired('${order.id}')">🔄 Pesan Ulang</button>` : ''}
                ${order.status === 'rejected' ? `<button class="btn-primary" style="padding:8px 16px;font-size:13px;background:#C62828;" onclick="App.navigate('payment', '${order.id}')">⚠️ Alasan Penolakan</button>` : ''}
              </div>
            </div>
          `;}).join('')}
        </div>
      </div>`;
  },

  reorderExpired(orderId) {
    this.stopPaymentTimers();
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(item => {
      this.items.push({
        cartKey: item.productId + '|' + (item.variantText || ''),
        productId: item.productId,
        name: item.name,
        image: item.image,
        unitPrice: item.unitPrice,
        qty: item.qty,
        subtotal: item.subtotal,
        selectedVariants: {},
        variantText: item.variantText || '',
        checked: true
      });
    });
    this.save();
    this.updateBadge();
    Utils.showToast('Produk ditambahkan kembali ke keranjang!', 'success');
    App.navigate('cart');
  },

  // ==========================================
  // PAYMENT PAGE — 15min countdown, auto-confirm
  // ==========================================
  pollingTimer: null,
  countdownTimer: null,

  stopPaymentTimers() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  async renderPaymentPage(orderId) {
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    if (!order) return `<div class="empty-state"><div class="empty-icon">😕</div><h3>Pesanan tidak ditemukan</h3><button class="btn-primary" onclick="App.navigate('orders')">Lihat Pesanan</button></div>`;

    const isPaid = order.status === 'paid' || order.status === 'confirmed' || order.status === 'verified';
    const isExpired = order.status === 'expired';
    const isRejected = order.status === 'rejected';
    const isWaitingVerification = order.status === 'waiting_verification';
    const detail = order.paymentDetail;
    const instructions = detail?.instructions || [];

    // Start polling API for payment status
    this.stopPaymentTimers();

    const isPending = order.status === 'pending_payment' || order.status === 'waiting_verification';
    if (isPending) {
      this.pollingTimer = setInterval(async () => {
        try {
          const res = await API.getOrderStatus(orderId);
          if (res && (res.status === 'paid' || res.status === 'confirmed')) {
            clearInterval(this.pollingTimer);
            if (this.countdownTimer) clearInterval(this.countdownTimer);
            order.status = 'paid';
            order.paidAt = new Date().toISOString();
            Utils.storage.set('orders', orders);
            Cart.showOrderNotification(order);
            App.navigate('order-success', orderId);
          } else if (res && res.status === 'rejected') {
            clearInterval(this.pollingTimer);
            if (this.countdownTimer) clearInterval(this.countdownTimer);
            order.status = 'rejected';
            order.rejectReason = res.rejectionReason || 'Ditolak oleh admin.';
            Utils.storage.set('orders', orders);
            Utils.showToast('Pembayaran ditolak oleh admin.', 'error');
            App.navigate('payment', orderId);
          } else if (res && res.status === 'expired') {
            clearInterval(this.pollingTimer);
            if (this.countdownTimer) clearInterval(this.countdownTimer);
            order.status = 'expired';
            Utils.storage.set('orders', orders);
            Cart.returnItemsToCart(order);
            Utils.showToast('Batas waktu pembayaran habis. Produk dikembalikan ke keranjang.', 'error');
            App.navigate('cart');
          }
        } catch (e) {}
      }, 3000);

      // Start countdown timer if pending payment
      if (order.status === 'pending_payment') {
        setTimeout(() => {
          this.startPaymentCountdown(order);
        }, 100);
      }
    }

    return `
      <div class="payment-page">
        <div class="payment-page-card">
          <div class="payment-page-header">
            <div class="payment-page-icon">${isPaid ? '✅' : isRejected ? '❌' : isWaitingVerification ? '🔍' : isExpired ? '⏰' : '⏳'}</div>
            <h2>${isPaid ? 'Pembayaran Berhasil!' : isRejected ? 'Pembayaran Ditolak' : isWaitingVerification ? 'Menunggu Verifikasi Pembayaran' : isExpired ? 'Pembayaran Expired' : 'Menunggu Pembayaran'}</h2>
            <p class="payment-order-id">No. Pesanan: <strong>${order.id}</strong></p>
          </div>

          ${isWaitingVerification ? `
            <!-- Waiting Verification -->
            <div style="background: #FFF9C4; border: 1px solid #F57F17; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
              <p style="font-size: 16px; font-weight: bold; color: #F57F17; margin-bottom: 8px;">🔍 Pembayaran Sedang Diverifikasi</p>
              <p style="color: #666; font-size: 14px;">Admin akan mengecek pembayaran Anda. Pesanan akan dikonfirmasi setelah verifikasi.</p>
            </div>

            <div class="payment-total-box">
              <span>Total Pembayaran</span>
              <div class="payment-total-amount">
                <strong>${Utils.formatPrice(order.total)}</strong>
              </div>
            </div>

            ${(order.paymentType === 'qris' || order.paymentMethod === 'qris') ? `
              <div class="payment-method-box">
                <h3>📱 QRIS (Bengkel Sahabat Motor)</h3>
                <div class="qris-display" style="text-align: center;">
                  <div style="max-width: 240px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff; padding: 8px;">
                    <img src="assets/images/qris-sahabat-motor-new.jpg" alt="QRIS BENGKEL SAHABAT MOTOR" style="width: 100%; height: auto; display: block;">
                  </div>
                </div>
              </div>
            ` : `
              <div class="payment-method-box">
                <h3>🏦 Transfer Bank BNI</h3>
                <div class="payment-account-box">
                  <div class="account-row"><span class="account-label">BANK NEGARA INDONESIA (BNI)</span></div>
                  <div class="account-number-row">
                    <span class="account-number">0888888685</span>
                    <button class="btn-copy" onclick="Cart.copyBniRekening()">📋 Salin</button>
                  </div>
                  <p class="account-holder">a.n. <strong>Erson</strong></p>
                </div>
              </div>
            `}

            ${order.paymentProof ? `
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="font-weight: bold; margin-bottom: 8px;">📎 Bukti Pembayaran Anda:</p>
                <div style="width: 200px; height: 200px; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; background: #fff; margin: 8px auto; display: flex; align-items: center; justify-content: center;">
                  ${order.paymentProof.startsWith('data:image') ?
                    `<img src="${order.paymentProof}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                    `<span style="font-size: 48px;">📄</span>`
                  }
                </div>
              </div>
            ` : ''}

            <div class="payment-action-buttons">
              <a href="https://wa.me/6285134167308?text=${encodeURIComponent('Halo MotoSpare, saya sudah melakukan pembayaran untuk pesanan ' + orderId + '. Mohon segera diverifikasi. Terima kasih.')}" target="_blank" class="btn-whatsapp btn-full">💬 Hubungi Admin untuk Verifikasi</a>
            </div>
          ` : isPaid ? `
            <!-- Already paid -->
            <div class="payment-success-info">
              <div class="success-check-anim">✅</div>
              <h3>Pembayaran Diterima</h3>
              <p>Pembayaran telah terverifikasi dan pesanan sedang diproses.</p>
              <div class="payment-details-summary">
                <div class="summary-row"><span>Metode</span><span>${order.paymentLabel}</span></div>
                <div class="summary-row"><span>Total</span><span><strong>${Utils.formatPrice(order.total)}</strong></span></div>
                <div class="summary-row"><span>Status</span><span class="status-badge ${order.status === 'verified' ? 'status-verified' : 'status-confirmed'}">${order.status === 'verified' ? 'Terverifikasi ✓' : 'Dikonfirmasi ✓'}</span></div>
              </div>
            </div>
          ` : isRejected ? `
            <!-- Rejected -->
            <div class="payment-expired-info" style="background: #FFEBEE; border: 1px solid #EF9A9A;">
              <div class="expired-icon" style="color: #C62828;">❌</div>
              <h3 style="color: #C62828;">Pembayaran Ditolak</h3>
              <p style="color: #D32F2F;">Mohon maaf, bukti pembayaran Anda ditolak oleh admin.</p>
              <div style="background: #fff; padding: 12px; border-radius: 8px; margin-top: 12px; margin-bottom: 12px; border: 1px solid #FFCDD2; text-align: left;">
                <p style="font-weight: bold; margin-bottom: 4px; color: #C62828;">Alasan Penolakan:</p>
                <p style="color: #333;">${Utils.escapeHtml(order.rejectReason || 'Tidak ada alasan yang diberikan.')}</p>
              </div>
              <a href="https://wa.me/6285134167308?text=${encodeURIComponent('Halo MotoSpare, saya ingin bertanya tentang pesanan saya ' + orderId + ' yang ditolak.')}" target="_blank" class="btn-whatsapp btn-full" style="margin-bottom: 8px;">💬 Chat Admin untuk Klarifikasi</a>
              <button class="btn-primary" style="width: 100%;" onclick="Cart.reorderExpired('${orderId}'); ">🔄 Pesan Ulang</button>
            </div>
          ` : isExpired ? `
            <!-- Expired -->
            <div class="payment-expired-info">
              <div class="expired-icon">⏰</div>
              <h3>Waktu Pembayaran Habis</h3>
              <p>Pesanan ini sudah kedaluwarsa. Produk dikembalikan ke keranjang Anda.</p>
              <button class="btn-primary" onclick="Cart.reorderExpired('${orderId}'); ">🔄 Pesan Ulang</button>
            </div>
          ` : `
            <!-- Countdown Timer & Pending Payment -->
            <div class="payment-timer-box">
              <p>Selesaikan pembayaran dalam:</p>
              <div class="payment-countdown" id="payment-countdown">
                <span class="cd-box" id="cd-min">15</span>
                <span class="cd-sep">:</span>
                <span class="cd-box" id="cd-sec">00</span>
              </div>
              <p class="payment-deadline-text">Batas: ${new Date(order.expiresAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>

            <!-- Total -->
            <div class="payment-total-box">
              <span>Total Pembayaran</span>
              <div class="payment-total-amount">
                <strong>${Utils.formatPrice(order.total)}</strong>
                <button class="btn-copy-sm" onclick="Utils.copyText('${order.total}')">Salin</button>
              </div>
            </div>

            <!-- Payment Method & Account -->
            <div class="payment-method-box">
              <h3>${order.paymentLabel}</h3>
              ${order.paymentType === 'transfer' && detail ? `
                <div class="payment-account-box">
                  <div class="account-row"><span class="account-label">${detail.name} Virtual Account</span></div>
                  <div class="account-number-row">
                    <span class="account-number">${detail.va}</span>
                    <button class="btn-copy" onclick="Utils.copyText('${detail.va.replace(/\s/g, '')}')">📋 Salin</button>
                  </div>
                  <p class="account-holder">a.n. <strong>${detail.holder}</strong></p>
                </div>
              ` : ''}
              ${(order.paymentType === 'ewallet' || order.paymentType === 'qris') && detail ? `
                <div class="payment-account-box">
                  ${detail.id === 'qris' ? `
                    <div class="qris-display">
                      <div class="qris-code-box" style="text-align: center;">
                        <p style="margin-bottom: 8px; font-size: 16px;"><strong>BENGKEL SAHABAT MOTOR</strong></p>
                        <div style="max-width: 280px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                          <img src="assets/images/qris-sahabat-motor-new.jpg" alt="QRIS BENGKEL SAHABAT MOTOR" style="width: 100%; height: auto; display: block; border-radius: 4px;">
                        </div>
                        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
                          <a href="assets/images/qris-sahabat-motor-new.jpg" target="_blank" class="btn-secondary" style="padding: 8px 16px; font-size: 13px; text-decoration: none; border-radius: 6px;">🔍 Perbesar</a>
                          <a href="assets/images/qris-sahabat-motor-new.jpg" download="QRIS_Sahabat_Motor.jpg" class="btn-primary" style="padding: 8px 16px; font-size: 13px; text-decoration: none; border-radius: 6px;">⬇️ Download QRIS</a>
                        </div>
                        <div style="margin-top: 20px; text-align: left; background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; border: 1px solid #e2e8f0;">
                          <p style="font-weight: bold; margin-bottom: 8px; color: #1e293b;">📝 Cara Pembayaran:</p>
                          <ol style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.6;">
                            <li>Scan QRIS menggunakan aplikasi pembayaran (Gopay, OVO, Dana, M-Banking, dll).</li>
                            <li>Pastikan nama penerima adalah <strong>BENGKEL SAHABAT MOTOR</strong>.</li>
                            <li>Selesaikan pembayaran sesuai <strong>Total Pembayaran</strong>.</li>
                            <li>Simpan bukti pembayaran jika diperlukan.</li>
                            <li>Klik tombol <strong>Saya Sudah Bayar</strong> di bawah.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  ` : `
                    <div class="account-row"><span class="account-label">Nomor ${detail.name}</span></div>
                    <div class="account-number-row">
                      <span class="account-number">${detail.number}</span>
                      <button class="btn-copy" onclick="Utils.copyText('${detail.number.replace(/[^0-9]/g, '')}')">📋 Salin</button>
                    </div>
                    <p class="account-holder">a.n. <strong>MotoSpare Official</strong></p>
                  `}
                </div>
              ` : ''}
            </div>

            <!-- Instructions -->
            ${instructions.length > 0 ? `
            <div class="payment-instructions">
              <h3>📖 Cara Pembayaran:</h3>
              <ol class="instruction-steps">
                ${instructions.map((step, i) => `
                  <li class="instruction-step">
                    <span class="step-number">${i+1}</span>
                    <span class="step-text">${step}</span>
                  </li>
                `).join('')}
              </ol>
            </div>
            ` : ''}

            <div class="payment-auto-info">
              <p>⏳ Pembayaran akan segera diterima oleh toko, harap menunggu</p>
              <p class="payment-auto-sub">Status pesanan otomatis diperbarui saat dana masuk</p>
            </div>

            ${(order.paymentType === 'qris' || order.paymentMethod === 'qris') ? `
              <!-- Verification options for QRIS -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  🛡️ Metode Verifikasi Pembayaran
                </h4>
                <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0; line-height: 1.4;">Silakan pilih salah satu metode di bawah ini untuk mengirimkan bukti transfer Anda:</p>

                <!-- Option 1: File Upload (Telegram) -->
                <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                  <label style="display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #334155; cursor: pointer;">
                    📁 Opsi A: Upload Bukti Transfer (Verifikasi Telegram)
                  </label>
                  <input type="file" id="qris-proof-file" accept="image/*, application/pdf" onchange="Cart.handleQrisProof(event, '${orderId}')" style="display: block; width: 100%; font-size: 12px; border: 1px solid #cbd5e1; padding: 6px; border-radius: 6px; background: #f8fafc; cursor: pointer;">
                  <small style="display: block; margin-top: 4px; font-size: 10px; color: #94a3b8;">Format: JPG, PNG, PDF (Maks. 5MB). File akan dikirim ke Telegram admin toko.</small>
                </div>

                <!-- Option 2: WhatsApp Confirm -->
                <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <label style="display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #334155;">
                    💬 Opsi B: Kirim Bukti via WhatsApp Toko
                  </label>
                  <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; line-height: 1.4;">Kirim bukti ke WhatsApp Admin. AI bot akan mendeteksi pengiriman bukti transfer Anda dan otomatis mengalihkan obrolan ke Admin Manusia.</p>
                  <button type="button" class="btn-whatsapp btn-full" style="padding: 10px; font-size: 13px; border-radius: 6px; font-weight: 600; justify-content: center; gap: 6px;" onclick="Cart.confirmQrisViaWhatsApp('${orderId}')">
                    💬 Hubungi Admin via WhatsApp
                  </button>
                </div>
              </div>
            ` : `
              <div class="payment-action-buttons">
                <button id="btn-confirm-payment" class="btn-primary btn-full" style="margin-bottom: 8px; font-size: 16px; padding: 14px;" onclick="Cart.simulatePaymentConfirm('${orderId}')">Saya Sudah Bayar</button>
                <a href="https://wa.me/6285134167308?text=${encodeURIComponent('Halo MotoSpare, saya butuh bantuan pembayaran untuk pesanan ' + orderId)}" target="_blank" class="btn-whatsapp btn-full">💬 Kendala Pembayaran? Hubungi CS</a>
              </div>
            `}
          `}

          <!-- Order Items Summary -->
          <div class="payment-order-items">
            <h3>📦 Detail Pesanan</h3>
            ${order.items.map(item => `
              <div class="checkout-item">
                <img src="${item.image}" alt="" class="checkout-item-img">
                <div class="checkout-item-info">
                  <p class="checkout-item-name">${Utils.escapeHtml(item.name)}</p>
                  ${item.variantText ? `<p class="checkout-item-variant">${Utils.escapeHtml(item.variantText)}</p>` : ''}
                  <p class="checkout-item-meta">${Utils.formatPrice(item.unitPrice)} × ${item.qty}</p>
                </div>
                <div class="checkout-item-subtotal">${Utils.formatPrice(item.subtotal)}</div>
              </div>
            `).join('')}
            <div class="summary-divider"></div>
            <div class="summary-row"><span>Subtotal</span><span>${Utils.formatPrice(order.subtotal)}</span></div>
            <div class="summary-row"><span>Ongkir (${order.shippingMethod})</span><span>${order.shippingPrice === 0 ? 'Gratis' : Utils.formatPrice(order.shippingPrice)}</span></div>
            <div class="summary-row summary-total"><span>Total</span><span class="total-price">${Utils.formatPrice(order.total)}</span></div>
            
            <!-- Shipping Address -->
            <div class="payment-address-summary">
              <h4>📍 Alamat Pengiriman</h4>
              <p><strong>${Utils.escapeHtml(order.shipping?.name || '-')}</strong></p>
              <p>${Utils.escapeHtml(order.shipping?.phone || '-')}</p>
              <p>${Utils.escapeHtml(order.shipping?.address || '-')}</p>
              <p>${Utils.escapeHtml(order.shipping?.city || '')} ${Utils.escapeHtml(order.shipping?.zip || '')}</p>
            </div>
          </div>

          <div class="payment-page-footer">
            <button class="btn-secondary" onclick="App.navigate('orders')">📋 Lihat Semua Pesanan</button>
            <button class="btn-primary" onclick="App.navigate('home')">🏠 Lanjut Belanja</button>
          </div>
        </div>
      </div>
    `;
  },

  startPaymentCountdown(order) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    const expiresAt = new Date(order.expiresAt).getTime();
    
    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      const minEl = document.getElementById('cd-min');
      const secEl = document.getElementById('cd-sec');

      if (diff <= 0) {
        if (minEl) minEl.textContent = '00';
        if (secEl) secEl.textContent = '00';
        clearInterval(this.countdownTimer);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (minEl) minEl.textContent = String(mins).padStart(2, '0');
      if (secEl) secEl.textContent = String(secs).padStart(2, '0');

      // Flash red when under 2 minutes
      if (mins < 2) {
        minEl?.classList.add('cd-urgent');
        secEl?.classList.add('cd-urgent');
      }
    };
    update();
    this.countdownTimer = setInterval(update, 1000);
  },

  async simulatePaymentConfirm(orderId) {
    const btn = document.getElementById('btn-confirm-payment');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Menghubungi Admin...';
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'waiting_verification';
      Utils.storage.set('orders', orders);
      
      Utils.showToast('Menunggu verifikasi admin via Telegram!', 'info');
      App.navigate('payment', orderId);
    } else {
      Utils.showToast('Gagal: Pesanan tidak ditemukan', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Saya Sudah Bayar';
      }
    }
  },

  async handleQrisProof(e, orderId) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      Utils.showToast('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Ukuran file maksimal 5MB.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Proof = event.target.result;
      
      try {
        Utils.showToast('Mengirim bukti pembayaran...', 'info');
        
        const res = await fetch(`/api/orders/${orderId}/proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentProof: base64Proof })
        });
        
        if (!res.ok) {
          throw new Error('Gagal mengirim ke server');
        }
        
        const orders = Utils.storage.get('orders', []);
        const order = orders.find(o => o.id === orderId);
        if (order) {
          order.status = 'waiting_verification';
          order.paymentProof = base64Proof;
          Utils.storage.set('orders', orders);
        }
        
        Utils.showToast('Bukti pembayaran berhasil dikirim!', 'success');
        this.stopPaymentTimers();
        App.navigate('payment', orderId);
        
      } catch (err) {
        console.error('Error sending proof:', err);
        Utils.showToast('Gagal mengirim bukti pembayaran.', 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  async confirmQrisViaWhatsApp(orderId) {
    try {
      await fetch(`/api/orders/${orderId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProof: null })
      });
      
      const orders = Utils.storage.get('orders', []);
      const order = orders.find(o => o.id === orderId);
      if (order) {
        order.status = 'waiting_verification';
        Utils.storage.set('orders', orders);
      }
      
      this.stopPaymentTimers();
      
      const text = `Halo Admin, saya sudah membayar pesanan ${orderId} via QRIS. Berikut bukti transfernya:`;
      const waUrl = `https://wa.me/6285134167308?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      
      App.navigate('payment', orderId);
    } catch (err) {
      console.error(err);
      Utils.showToast('Gagal memproses konfirmasi.', 'error');
    }
  },

  returnItemsToCart(order) {
    if (!order || !order.items) return;
    order.items.forEach(item => {
      const exists = this.items.find(i => i.productId === item.productId);
      if (!exists) {
        this.items.push({
          cartKey: item.productId + '|' + (item.variantText || ''),
          productId: item.productId,
          name: item.name,
          image: item.image,
          unitPrice: item.unitPrice,
          qty: item.qty,
          subtotal: item.subtotal,
          selectedVariants: {},
          variantText: item.variantText || '',
          checked: true
        });
      }
    });
    this.save();
    this.updateBadge();
  },

  showOrderNotification(order) {
    if (!order) return;
    const notifHtml = `
      <div class="order-notification">
        <div class="notif-header">
          <span class="notif-icon">🔔</span>
          <strong>Pembayaran Berhasil!</strong>
          <button class="notif-close" onclick="this.closest('.order-notification').remove()">✕</button>
        </div>
        <div class="notif-body">
          <p><strong>No. Pesanan:</strong> ${order.id}</p>
          <p><strong>Total:</strong> ${Utils.formatPrice(order.total)}</p>
          <p><strong>Status:</strong> <span class="status-badge status-confirmed">Dikonfirmasi ✓</span></p>
        </div>
      </div>
    `;
    const container = document.createElement('div');
    container.innerHTML = notifHtml;
    document.body.appendChild(container.firstElementChild);
    setTimeout(() => {
      const notif = document.querySelector('.order-notification');
      if (notif) notif.classList.add('notif-show');
    }, 100);
    setTimeout(() => {
      const notif = document.querySelector('.order-notification');
      if (notif) { notif.classList.remove('notif-show'); setTimeout(() => notif.remove(), 500); }
    }, 8000);
  },

  orderViaWhatsApp() {
    const name = document.getElementById('checkout-name')?.value.trim() || 'Customer';
    const phone = document.getElementById('checkout-phone')?.value.trim() || '';
    const address = document.getElementById('checkout-address')?.value.trim() || '';
    const notes = document.getElementById('checkout-notes')?.value.trim() || '';
    const items = this.getCheckedItems();
    const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);
    const shippingPrice = shipping?.price || 0;

    let message = `🛒 *PESANAN BARU - MotoSpare*\n\n`;
    message += `👤 *Nama:* ${name}\n📱 *HP:* ${phone}\n📍 *Alamat:* ${address}\n\n`;
    message += `📦 *Detail Pesanan:*\n━━━━━━━━━━━━━━━━\n`;
    items.forEach((item, i) => {
      message += `${i+1}. ${item.name}\n`;
      if (item.variantText) message += `   Varian: ${item.variantText}\n`;
      message += `   ${item.qty}x ${Utils.formatPrice(item.unitPrice)} = ${Utils.formatPrice(item.subtotal)}\n`;
    });
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `🚚 Ongkir (${shipping?.name || 'Standard'}): ${shippingPrice === 0 ? 'Gratis' : Utils.formatPrice(shippingPrice)}\n`;
    message += `💰 *TOTAL: ${Utils.formatPrice(this.getCheckedTotal() + shippingPrice)}*\n`;
    if (notes) message += `\n📝 Catatan: ${notes}`;

    const waNumber = '6285134167308';
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  },

  renderOrderSuccess(orderId) {
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    
    // Mengecek apakah sudah direview
    const reviews = Utils.storage.get('customer_reviews', []);
    const hasReviewed = reviews.some(r => r.orderId === orderId);
    return `
      <div class="success-page">
        <div class="success-card">
          <div class="success-icon">✅</div>
          <h2>Pesanan Berhasil Dibuat!</h2>
          <p class="success-order-id">No. Pesanan: <strong>${orderId}</strong></p>
          ${order ? `
            <div class="success-details">
              <p>Total: <strong>${Utils.formatPrice(order.total)}</strong></p>
              <p>Pembayaran: ${order.paymentLabel}</p>
              <p>Pengiriman: ${order.shippingMethod}</p>
              ${order.codCode ? `
                <div class="cod-code-box">
                  <p class="cod-label">Kode Unik COD:</p>
                  <div class="cod-code">${order.codCode}</div>
                  <p class="cod-hint">Tunjukkan kode ini ke kurir saat menerima barang</p>
                </div>
              ` : ''}
              <p>Status: <span class="status-badge status-confirmed">${order.statusText}</span></p>
            </div>
            <div class="success-address">
              <h4>📍 Dikirim ke:</h4>
              <p><strong>${Utils.escapeHtml(order.shipping?.name || '')}</strong></p>
              <p>${Utils.escapeHtml(order.shipping?.phone || '')}</p>
              <p>${Utils.escapeHtml(order.shipping?.address || '')}</p>
              <p>${Utils.escapeHtml(order.shipping?.city || '')} ${Utils.escapeHtml(order.shipping?.zip || '')}</p>
            </div>
          ` : ''}
          <div class="success-actions">
            <button class="btn-primary" onclick="App.navigate('orders')">Lihat Pesanan</button>
            <button class="btn-secondary" onclick="App.navigate('home')">Lanjut Belanja</button>
          </div>
          
          ${order && !hasReviewed ? `
            <div class="review-section" style="margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
              <h3 style="margin-bottom: 12px; font-size: 1.1rem;">Beri Ulasan Pesanan Ini</h3>
              
              <div class="form-group" style="margin-bottom: 12px;">
                <label>Rating (1-5 Bintang)</label>
                <select id="review-rating" class="search-input" style="width: 100%; margin-top: 4px;">
                  <option value="5">⭐⭐⭐⭐⭐ (5/5) Sangat Puas</option>
                  <option value="4">⭐⭐⭐⭐ (4/5) Puas</option>
                  <option value="3">⭐⭐⭐ (3/5) Cukup</option>
                  <option value="2">⭐⭐ (2/5) Kurang</option>
                  <option value="1">⭐ (1/5) Sangat Kurang</option>
                </select>
              </div>
              
              <div class="form-group" style="margin-bottom: 12px;">
                <label>Kritik & Saran</label>
                <textarea id="review-text" class="search-input" placeholder="Tulis kritik dan saran Anda di sini..." style="width: 100%; min-height: 80px; margin-top: 4px; resize: vertical;"></textarea>
              </div>
              
              <button class="btn-primary" style="width: 100%" onclick="Cart.submitReview('${orderId}')">Kirim Ulasan</button>
            </div>
          ` : order && hasReviewed ? `
            <div style="margin-top: 24px; padding: 16px; border-radius: 8px; background: #dcfce7; color: #166534; text-align: center;">
              <strong>Terima kasih atas ulasan Anda! ❤️</strong>
            </div>
          ` : ''}
          
        </div>
      </div>
    `;
  },

  submitReview(orderId) {
    const rating = parseInt(document.getElementById('review-rating').value);
    const text = document.getElementById('review-text').value.trim();
    
    if (!text) {
      Utils.showToast('Harap isi kritik & saran', 'error');
      return;
    }
    
    const reviews = Utils.storage.get('customer_reviews', []);
    
    // Validasi tambahan untuk mencegah review ganda
    if (reviews.some(r => r.orderId === orderId)) {
      Utils.showToast('Pesanan ini sudah diulas', 'error');
      return;
    }
    
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    
    reviews.push({
      id: 'REV-' + Date.now(),
      orderId: orderId,
      rating: rating,
      review: text,
      customerName: order ? (order.shipping?.name || 'Pelanggan') : 'Pelanggan',
      created_at: new Date().toISOString()
    });
    
    Utils.storage.set('customer_reviews', reviews);
    Utils.showToast('Ulasan berhasil dikirim!', 'success');
    
    // Refresh page to show success message
    App.navigate('order-success', orderId);
  }
};

Cart.initOngkir();
