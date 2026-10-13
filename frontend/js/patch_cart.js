const fs = require('fs');

const cartPath = 'c:/Users/ASUS/Videos/Q_aciang/Q_aciang/MotoSpare_Revisi/frontend/js/cart.js';
let content = fs.readFileSync(cartPath, 'utf8');

// 1. Replace state & getDynamicShippingOptions
content = content.replace(
  /selectedShipping: 'ojol',[\s\S]*?return opts;\n  },/,
  `shippingOptions: [],
  isCalculatingOngkir: false,
  selectedShipping: '',
  selectedPaymentType: 'cod',
  selectedPaymentSub: '',

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
        this.refreshShippingUI();
      };
    }
  },

  triggerOngkir() {
    const address = document.getElementById('checkout-address')?.value || '';
    const city = document.getElementById('checkout-city')?.value || '';
    const zip = document.getElementById('checkout-zip')?.value || '';
    if (window.OngkirSystem) {
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
      return \`<div style="padding: 20px; text-align: center; color: var(--text-secondary);">
        <span style="font-size: 24px; display: inline-block; animation: spin 1s linear infinite;">⏳</span>
        <p style="margin-top: 10px;">Menghitung ongkos kirim...</p>
      </div>\`;
    }
    if (this.shippingOptions.length === 0) {
      return \`<div style="padding: 20px; text-align: center; background: var(--bg-main); border-radius: var(--border-radius); color: var(--text-muted);">
        <p>Silakan lengkapi Alamat Lengkap dan Kota/Kabupaten untuk melihat opsi pengiriman.</p>
      </div>\`;
    }
    return \`<div class="shipping-options">\` + this.shippingOptions.map(s => \`
      <label class="shipping-option">
        <input type="radio" name="shipping" value="\${s.id}" \${this.selectedShipping === s.id ? 'checked' : ''} onchange="Cart.changeShipping('\${s.id}')">
        <div class="shipping-card \${this.selectedShipping === s.id ? 'selected' : ''}">
          <span class="shipping-icon">\${s.icon}</span>
          <div class="shipping-info">
             <strong>\${s.name}</strong>
             <p>\${s.desc}</p>
          </div>
          <span class="shipping-price">\${s.price === 0 ? 'Gratis' : Utils.formatPrice(s.price)}</span>
        </div>
      </label>
    \`).join('') + \`</div>\`;
  },
  
  renderCheckoutSummaryHtml() {
    const items = this.getCheckedItems();
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);
    const shippingPrice = shipping?.price || 0;
    const total = subtotal + shippingPrice;
    
    return \`
      <div class="summary-row"><span>Total Harga (\${items.length} Barang)</span><span>\${Utils.formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Total Ongkos Kirim</span><span class="\${shippingPrice === 0 ? 'free-shipping' : ''}">\${shippingPrice === 0 ? 'Gratis' : Utils.formatPrice(shippingPrice)}</span></div>
      <div class="summary-divider"></div>
      <div class="summary-row summary-total"><span>Total Belanja</span><span class="total-price">\${Utils.formatPrice(total)}</span></div>
      <button class="btn-primary btn-full btn-checkout" onclick="Cart.placeOrder()" \${!shipping ? 'disabled' : ''}>Buat Pesanan</button>
    \`;
  },`
);

// 2. Update renderCheckout start (remove dynShipping const)
content = content.replace(
  /const dynShipping = this\.getDynamicShippingOptions\(\);\s*\/\/ Default select first available if selected is invalid\s*if \(\!dynShipping\.find\(s => s\.id === this\.selectedShipping\)\) \{\s*this\.selectedShipping = dynShipping\[0\]\?\.id \|\| '';\s*\}\s*const shippingPrice = dynShipping\.find\(s => s\.id === this\.selectedShipping\)\?\.price \|\| 0;/,
  `// Shipping options handled asynchronously`
);

// 3. Update inputs to trigger triggerOngkir
content = content.replace(
  /id="checkout-address" rows="3" oninput="Cart\.saveCheckoutDraft\(\)"/g,
  `id="checkout-address" rows="3" oninput="Cart.saveCheckoutDraft(); Cart.triggerOngkir()"`
);
content = content.replace(
  /id="checkout-city" value="\$\{Utils\.escapeHtml\(d\.city \|\| ''\)\}" oninput="this\.value=this\.value\.replace\(\/\[0-9\]\/g,''\); Cart\.saveCheckoutDraft\(\);"/g,
  `id="checkout-city" value="\${Utils.escapeHtml(d.city || '')}" oninput="this.value=this.value.replace(/[0-9]/g,''); Cart.saveCheckoutDraft(); Cart.triggerOngkir();"`
);
content = content.replace(
  /id="checkout-zip" oninput="this\.value=this\.value\.replace\(\/\[\^0-9\]\/g,''\); Cart\.saveCheckoutDraft\(\);"/g,
  `id="checkout-zip" oninput="this.value=this.value.replace(/[^0-9]/g,''); Cart.saveCheckoutDraft(); Cart.triggerOngkir();"`
);

// 4. Update the shipping section HTML in renderCheckout
content = content.replace(
  /\$\{OngkirService\.renderCitySelector\(\)\}[\s\S]*?<\/div>\s*<\/div>/,
  `
              <div id="shipping-options-container">
                \${this.renderShippingOptionsHtml()}
              </div>
            </div>`
);

// 5. Update the summary HTML in renderCheckout
content = content.replace(
  /<div class="checkout-summary-card">[\s\S]*?<\/div>\s*<\/div>/,
  `<div class="checkout-summary-card">
              <h3>Ringkasan Belanja</h3>
              <div id="checkout-summary-container">
                \${this.renderCheckoutSummaryHtml()}
              </div>
            </div>
          </div>`
);

// 6. Fix changeShipping to not re-render the whole page
content = content.replace(
  /changeShipping\(id\) \{\s*this\.saveCheckoutDraft\(\);\s*this\.selectedShipping = id;\s*const content = document\.getElementById\('main-content'\);\s*if \(content\) content\.innerHTML = this\.renderCheckout\(\);\s*\}/,
  `changeShipping(id) {
    this.saveCheckoutDraft();
    this.selectedShipping = id;
    this.refreshShippingUI();
  }`
);

// 7. In validateCheckoutForm, check if shipping is selected
content = content.replace(
  /return \{ name, phone: phoneRegion \+ cleanPhone, address, city, zip \};/,
  `if (!this.selectedShipping) {
      Utils.showToast('Pilih metode pengiriman terlebih dahulu!', 'error');
      return null;
    }
    return { name, phone: phoneRegion + cleanPhone, address, city, zip };`
);

// 8. In placeOrder, replace dynShipping with this.shippingOptions
content = content.replace(
  /const dynShipping = this\.getDynamicShippingOptions\(\);\s*const shipping = dynShipping\.find\(s => s\.id === this\.selectedShipping\);/,
  `const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);`
);

// 9. In placeOrder summary calculation, use this.shippingOptions
content = content.replace(
  /const dynShipping = this\.getDynamicShippingOptions\(\);\s*const shipping = dynShipping\.find\(s => s\.id === this\.selectedShipping\);/,
  `const shipping = this.shippingOptions.find(s => s.id === this.selectedShipping);`
);

fs.writeFileSync(cartPath, content);
console.log('cart.js patched successfully');
