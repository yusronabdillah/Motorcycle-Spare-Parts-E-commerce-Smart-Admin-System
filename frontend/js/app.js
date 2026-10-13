// ============================================
// MotoSpare — Main App Controller & Router
// UPGRADED: Full functional e-commerce
// ============================================

const App = {
  currentPage: 'home',
  searchQuery: '',
  currentCategory: 'semua',
  sortBy: 'terlaris',
  filterColors: [],
  filterSizes: [],
  filterStock: [],
  productsPerPage: 24,
  currentProductPage: 1,

  async init() {
    await API.loadInitialData();
    Cart.init();
    Auth.init();
    this.setupRouter();
    this.setupSearch();
    this.setupMobileMenu();
    this.setupScrollEffects();
    await this.handleRoute();

    // Render Navbar categories
    const navInner = document.getElementById('category-nav-inner');
    if (navInner) navInner.innerHTML = CATEGORIES.map(cat => `<div class="cat-nav-item" onclick="App.navigate('category', '${cat.id}')">${cat.icon} ${cat.name}</div>`).join('');
    const mobileCats = document.getElementById('mobile-categories');
    if (mobileCats) mobileCats.innerHTML = CATEGORIES.filter(c => c.id !== 'semua').map(cat => `<a href="#category/${cat.id}" class="mobile-cat-card" onclick="App.navigate('category','${cat.id}'); App.closeMobileMenu();"><span class="mcat-icon">${cat.icon}</span><span class="mcat-name">${cat.name}</span><span class="mcat-count">${cat.count} produk</span></a>`).join('');

    const footerCats = document.getElementById('footer-categories');
    if (footerCats) footerCats.innerHTML = CATEGORIES.filter(c => c.id !== 'semua').map(cat => `<a href="#category/${cat.id}" onclick="App.navigate('category','${cat.id}'); window.scrollTo({top:0, behavior:'smooth'})" style="cursor: pointer;">${cat.name}</a>`).join('');

    // Request geolocation (silent)
    LocationService.requestLocation();

    // Render dynamic payment footer
    const footerPayment = document.getElementById('footer-payment-section');
    if (footerPayment && typeof ACTIVE_PAYMENTS !== 'undefined') {
      footerPayment.innerHTML = ACTIVE_PAYMENTS.map(p => `
        <div style="margin-bottom: 12px;">
          <p style="margin: 0; font-weight: 600; color: #fff;">${p.icon} ${p.shortName || p.name}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #aaa; line-height: 1.4;">${p.footerDesc || p.desc}</p>
        </div>
      `).join('');
    }
  },

  // ==================
  // ROUTING
  // ==================
  setupRouter() { window.addEventListener('hashchange', () => this.handleRoute()); },

  navigate(page, param = '') {
    const target = param ? `${page}/${param}` : page;
    if (window.location.hash === '#' + target) {
      this.handleRoute();
    } else {
      window.location.hash = target;
    }
  },

  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];
    const param = parts.slice(1).join('/');
    this.currentPage = page;
    const content = document.getElementById('main-content');
    if (!content) return;
    Utils.scrollToTop();

    if (page !== 'payment' && typeof Cart !== 'undefined' && Cart.stopPaymentTimers) {
      Cart.stopPaymentTimers();
    }

    switch (page) {
      case 'home': content.innerHTML = this.renderHome(); this.startBannerSlider(); this.startFlashSaleTimer(); break;
      case 'category': this.currentCategory = param || 'semua'; content.innerHTML = this.renderCategory(); break;
      case 'all-categories': content.innerHTML = this.renderAllCategories(); break;
      case 'search': 
        this.searchQuery = decodeURIComponent(param || ''); 
        if (!param) this.currentProductPage = 1; 
        content.innerHTML = this.renderSearchResults(); 
        break;
      case 'product': content.innerHTML = await this.renderProductDetail(param); break;
      case 'cart': content.innerHTML = Cart.render(); break;
      case 'checkout': content.innerHTML = Cart.renderCheckout(); break;
      case 'payment': content.innerHTML = await Cart.renderPaymentPage(param); break;
      case 'order-success': content.innerHTML = Cart.renderOrderSuccess(param); break;
      case 'orders': content.innerHTML = Cart.renderOrders(); break;
      case 'login': content.innerHTML = Auth.renderLogin(); break;
      case 'register': content.innerHTML = Auth.renderRegister(); break;
      case 'profile': content.innerHTML = Auth.renderProfile(); break;
      case 'app-feedback': content.innerHTML = this.renderAppFeedback(); break;
      case 'admin-feedback': content.innerHTML = this.renderAdminFeedback(); break;
      case 'admin-orders': content.innerHTML = this.renderAdminOrders(); break;
      default: content.innerHTML = this.renderHome(); break;
    }
  },

  // ==================
  // ADMIN ORDERS
  // ==================
  renderAdminOrders() {
    const orders = Utils.storage.get('orders', []);
    const bniOrders = orders.filter(o => o.paymentType === 'bni');
    
    if (bniOrders.length === 0) {
      return `
        <div style="padding: 40px 20px; max-width: 800px; margin: 0 auto; text-align: center;">
          <h2 style="margin-bottom: 20px;">🛡️ Panel Admin - Verifikasi Pembayaran BNI</h2>
          <div style="background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size: 40px; margin-bottom: 16px;">📂</div>
            <h3 style="color: #666;">Belum ada pesanan BNI</h3>
          </div>
        </div>
      `;
    }

    return `
      <div style="padding: 20px; max-width: 1000px; margin: 0 auto;">
        <h2 style="margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          🛡️ Panel Admin - Verifikasi Pembayaran BNI
        </h2>
        
        <div style="display: grid; gap: 20px;">
          ${bniOrders.map(order => `
            <div style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 4px solid ${order.status === 'waiting_verification' ? '#F57F17' : (order.status === 'confirmed' || order.status === 'paid' || order.status === 'verified' ? '#2E7D32' : '#C62828')}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
                <div>
                  <h3 style="margin-bottom: 4px; font-size: 16px;">Order ID: ${order.id}</h3>
                  <p style="color: #666; font-size: 13px;">Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
                  <div style="margin-top: 8px;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${order.status === 'waiting_verification' ? '#FFF9C4' : (order.status === 'confirmed' || order.status === 'paid' || order.status === 'verified' ? '#E8F5E9' : '#FFEBEE')}; color: ${order.status === 'waiting_verification' ? '#F57F17' : (order.status === 'confirmed' || order.status === 'paid' || order.status === 'verified' ? '#2E7D32' : '#C62828')}">
                      Status: ${order.statusText}
                    </span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: bold; color: #E65100;">${Utils.formatPrice(order.total)}</div>
                  <p style="font-size: 13px; color: #666;">${order.shipping.name} (${order.shipping.phone})</p>
                </div>
              </div>
              
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="font-weight: bold; margin-bottom: 8px;">Bukti Pembayaran:</p>
                ${order.paymentProof ? `
                  <a href="${order.paymentProof}" target="_blank" style="display: inline-block; text-decoration: none;">
                    <div style="width: 150px; height: 150px; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; background: #fff; display: flex; align-items: center; justify-content: center;">
                      ${order.paymentProof.startsWith('data:image') ? 
                        `<img src="${order.paymentProof}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<span style="font-size: 32px;">📄</span>`
                      }
                    </div>
                  </a>
                  <p style="font-size: 12px; margin-top: 8px; color: #2563eb;"><a href="${order.paymentProof}" target="_blank" style="color: inherit;">Buka Bukti (Tab Baru)</a></p>
                ` : '<p style="color: #ee4d2d; font-size: 13px;">Tidak ada bukti pembayaran</p>'}
              </div>
              
              ${order.status === 'rejected' && order.rejectReason ? `
                <div style="background: #FFEBEE; padding: 12px; border-radius: 8px; margin-top: 16px; border: 1px solid #FFCDD2;">
                  <p style="font-weight: bold; color: #C62828; margin-bottom: 4px;">Alasan Penolakan:</p>
                  <p style="color: #333;">${Utils.escapeHtml(order.rejectReason)}</p>
                </div>
              ` : ''}

              ${order.status === 'waiting_verification' ? `
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                  <button onclick="App.verifyPayment('${order.id}')" style="flex: 1; padding: 10px; border-radius: 6px; border: none; background: #2E7D32; color: white; font-weight: bold; cursor: pointer;">✅ Terima & Konfirmasi</button>
                  <button onclick="App.rejectPayment('${order.id}')" style="flex: 1; padding: 10px; border-radius: 6px; border: none; background: #C62828; color: white; font-weight: bold; cursor: pointer;">❌ Tolak</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  verifyPayment(orderId) {
    if (!confirm('Anda yakin ingin menerima pembayaran ini dan mengonfirmasi pesanan?')) return;
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'verified';
      order.statusText = 'Pembayaran Terverifikasi';
      order.verifiedAt = new Date().toISOString();
      Utils.storage.set('orders', orders);
      Utils.showToast('Pembayaran Diterima & Pesanan Dikonfirmasi!', 'success');
      const content = document.getElementById('main-content');
      if (content && this.currentPage === 'admin-orders') {
        content.innerHTML = this.renderAdminOrders();
      }
    }
  },

  rejectPayment(orderId) {
    const reason = prompt('Masukkan alasan penolakan (misal: Bukti transfer tidak jelas / Nominal tidak sesuai):');
    if (reason === null) return; // User cancelled
    
    const orders = Utils.storage.get('orders', []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'rejected';
      order.statusText = 'Pembayaran Ditolak';
      order.rejectReason = reason.trim() || 'Tidak ada alasan yang diberikan';
      order.rejectedAt = new Date().toISOString();
      Utils.storage.set('orders', orders);
      Utils.showToast('Pembayaran Ditolak.', 'error');
      const content = document.getElementById('main-content');
      if (content && this.currentPage === 'admin-orders') {
        content.innerHTML = this.renderAdminOrders();
      }
    }
  },

  // ==================
  // SEARCH
  // ==================
  setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsBox = document.getElementById('search-suggestions');
    if (!searchInput) return;

    searchInput.addEventListener('input', Utils.debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) { suggestionsBox.style.display = 'none'; return; }

      // Search categories
      const catMatches = CATEGORIES.filter(c => c.id !== 'semua' && c.name.toLowerCase().includes(q)).slice(0, 3);
      // Search products
      const prodMatches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) || p.compatibility.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))
      ).slice(0, 5);

      let html = '';
      if (catMatches.length > 0) {
        html += '<div class="suggestion-section-label">📂 Kategori</div>';
        html += catMatches.map(c => `
          <div class="suggestion-item suggestion-category" onclick="App.navigate('category', '${c.id}'); document.getElementById('search-suggestions').style.display='none';">
            <span class="suggestion-cat-icon">${c.icon}</span>
            <span class="suggestion-name">${Utils.escapeHtml(c.name)}</span>
          </div>
        `).join('');
      }
      if (prodMatches.length > 0) {
        html += '<div class="suggestion-section-label">🏍️ Produk</div>';
        html += prodMatches.map(p => {
          const identifier = p.sku || p.id;
          return `
          <div class="suggestion-item" onclick="App.navigate('product', '${identifier}'); document.getElementById('search-suggestions').style.display='none';">
            <img src="${Utils.getProductImage(p)}" alt="" class="suggestion-img">
            <div class="suggestion-info">
              <span class="suggestion-name">${Utils.escapeHtml(p.name)}</span>
              <span class="suggestion-price">${Utils.formatPrice(Auth.getPrice(p))}</span>
            </div>
          </div>
          `;
        }).join('');
      }
      if (!html) html = '<div class="suggestion-empty">Tidak ditemukan</div>';
      suggestionsBox.innerHTML = html;
      suggestionsBox.style.display = 'block';
    }, 200));

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); const q = searchInput.value.trim(); if (q) { suggestionsBox.style.display = 'none'; this.navigate('search', encodeURIComponent(q)); } }
    });
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim(); if (q) { suggestionsBox.style.display = 'none'; this.navigate('search', encodeURIComponent(q)); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrapper')) suggestionsBox.style.display = 'none'; });
  },

  // ==================
  // MOBILE MENU
  // ==================
  setupMobileMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => { mobileMenu.classList.toggle('show'); hamburger.classList.toggle('active'); });
    }
  },
  closeMobileMenu() {
    document.getElementById('mobile-menu')?.classList.remove('show');
    document.getElementById('hamburger-btn')?.classList.remove('active');
  },

  // ==================
  // SCROLL
  // ==================
  setupScrollEffects() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => { if (header) header.classList.toggle('scrolled', window.scrollY > 50); });
  },

  findProduct(productId) {
    if (!productId) return null;
    let queryId = '';
    try {
      queryId = decodeURIComponent(productId).toLowerCase();
    } catch(e) {
      queryId = String(productId).toLowerCase();
    }

    return PRODUCTS.find(p => 
      String(p.id).toLowerCase() === queryId ||
      (p.product_id && String(p.product_id).toLowerCase() === queryId) ||
      (p.sku && String(p.sku).toLowerCase() === queryId) ||
      (p.kode_produk && String(p.kode_produk).toLowerCase() === queryId) ||
      (p.kode_part && String(p.kode_part).toLowerCase() === queryId) ||
      (p.partNumber && String(p.partNumber).toLowerCase() === queryId)
    );
  },

  // ==================
  // HOME PAGE
  // ==================
  renderHome() {
    const availableProducts = PRODUCTS.filter(p => p.stock > 0 && p.price > 0);
    const flashSaleProducts = availableProducts.slice(0, 8);
    const recProducts = availableProducts.slice(8, 20);
    const newProducts = availableProducts.slice(20, 44);
    return `
      <div class="banner-slider" id="banner-slider">
        <div class="banner-track" id="banner-track">
          ${BANNERS.map((b, i) => `
            <div class="banner-slide ${i === 0 ? 'active' : ''}" style="background: ${b.bgColor}; color: ${b.textColor};">
              <div class="banner-content"><h2>${b.title}</h2><p>${b.subtitle}</p><button class="btn-banner" onclick="App.navigate('category', 'semua')">Belanja Sekarang →</button></div>
            </div>
          `).join('')}
        </div>
        <button class="banner-nav banner-prev" onclick="App.slideBanner(-1)">‹</button>
        <button class="banner-nav banner-next" onclick="App.slideBanner(1)">›</button>
        <div class="banner-dots" id="banner-dots">${BANNERS.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="App.goToBanner(${i})"></span>`).join('')}</div>
      </div>
      <div id="location-indicator" class="location-indicator"></div>
      <section class="section">
        <div class="section-header"><h2 class="section-title">📂 Kategori</h2><span class="result-count">${CATEGORIES.length - 1} kategori</span></div>
        <div class="category-grid-home">
          ${CATEGORIES.filter(c => c.id !== 'semua').slice(0, 8).map(cat => `
            <div class="category-card" onclick="App.navigate('category', '${cat.id}')"><span class="category-icon">${cat.icon}</span><span class="category-name">${cat.name}</span></div>
          `).join('')}
        </div>
        <div class="category-more-btn-wrap"><button class="btn-show-more" onclick="App.navigate('all-categories')">Tampilkan Lebih Banyak (${CATEGORIES.length - 1} kategori) →</button></div>
      </section>
      <section class="section flash-sale-section">
        <div class="section-header">
          <div class="flash-sale-header"><h2 class="section-title">⚡ Flash Sale</h2><div class="flash-timer" id="flash-timer"><span class="timer-box" id="timer-h">08</span>:<span class="timer-box" id="timer-m">45</span>:<span class="timer-box" id="timer-s">12</span></div></div>
          <a href="#category/semua" class="see-all">Lihat Semua ›</a>
        </div>
        <div class="product-scroll">${flashSaleProducts.map(p => this.renderProductCard({...p, isFlashSale: true})).join('')}</div>
      </section>
      <section class="section">
        <div class="section-header"><h2 class="section-title">🔥 Rekomendasi Untukmu</h2><a href="#category/semua" class="see-all">Lihat Semua ›</a></div>
        <div class="product-grid">${recProducts.map(p => this.renderProductCard(p)).join('')}</div>
      </section>
      <section class="section">
        <div class="section-header"><h2 class="section-title">🏍️ Produk Terbaru</h2><a href="#category/semua" class="see-all">Lihat Semua (${PRODUCTS.length}) ›</a></div>
        <div class="product-grid">${newProducts.map(p => this.renderProductCard(p)).join('')}</div>
      </section>
      ${this.renderReviewSection()}
    `;
  },
  
  renderReviewSection() {
    const reviews = Utils.storage.get('customer_reviews', []);
    if (reviews.length === 0) return '';
    
    // Sort latest first
    const sorted = [...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = sorted.length;
    const avgRating = (sorted.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
    
    return `
      <section class="section" style="background: #f8fafc; padding: 24px; border-radius: 12px; margin-top: 32px;">
        <div class="section-header" style="flex-direction: column; align-items: center; margin-bottom: 24px;">
          <h2 class="section-title" style="font-size: 1.5rem;">🌟 Ulasan Pelanggan</h2>
          <div style="display: flex; gap: 16px; margin-top: 12px; align-items: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${avgRating} <span style="font-size: 1.2rem;">/ 5.0</span></div>
            <div style="font-size: 1rem; color: #64748b;">(${total} Ulasan)</div>
          </div>
        </div>
        
        <div class="product-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${sorted.slice(0, 6).map(r => `
            <div class="product-card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 1rem;">${Utils.escapeHtml(r.customerName)}</strong>
                <span style="color: #f59e0b;">${'⭐'.repeat(r.rating)}</span>
              </div>
              <div style="font-size: 0.85rem; color: #94a3b8;">${new Date(r.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
              <p style="font-size: 0.95rem; color: #334155; margin-top: 4px; line-height: 1.5; font-style: italic;">"${Utils.escapeHtml(r.review)}"</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  bannerIndex: 0, bannerInterval: null,
  startBannerSlider() { this.bannerIndex = 0; clearInterval(this.bannerInterval); this.bannerInterval = setInterval(() => this.slideBanner(1), 4000); },
  slideBanner(dir) {
    const slides = document.querySelectorAll('.banner-slide'); const dots = document.querySelectorAll('.banner-dots .dot');
    if (!slides.length) return;
    slides[this.bannerIndex]?.classList.remove('active'); dots[this.bannerIndex]?.classList.remove('active');
    this.bannerIndex = (this.bannerIndex + dir + slides.length) % slides.length;
    slides[this.bannerIndex]?.classList.add('active'); dots[this.bannerIndex]?.classList.add('active');
    clearInterval(this.bannerInterval); this.bannerInterval = setInterval(() => this.slideBanner(1), 4000);
  },
  goToBanner(i) {
    const slides = document.querySelectorAll('.banner-slide'); const dots = document.querySelectorAll('.banner-dots .dot');
    slides[this.bannerIndex]?.classList.remove('active'); dots[this.bannerIndex]?.classList.remove('active');
    this.bannerIndex = i;
    slides[this.bannerIndex]?.classList.add('active'); dots[this.bannerIndex]?.classList.add('active');
    clearInterval(this.bannerInterval); this.bannerInterval = setInterval(() => this.slideBanner(1), 4000);
  },

  flashSaleEnd: null,
  startFlashSaleTimer() {
    if (!this.flashSaleEnd) { const now = new Date(); this.flashSaleEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime(); }
    const update = () => {
      const cd = Utils.getCountdown(this.flashSaleEnd);
      const hEl = document.getElementById('timer-h'), mEl = document.getElementById('timer-m'), sEl = document.getElementById('timer-s');
      if (hEl) hEl.textContent = String(cd.h).padStart(2, '0');
      if (mEl) mEl.textContent = String(cd.m).padStart(2, '0');
      if (sEl) sEl.textContent = String(cd.s).padStart(2, '0');
      if (cd.expired) this.flashSaleEnd = new Date().getTime() + 24 * 60 * 60 * 1000;
    };
    update(); setInterval(update, 1000);
  },

  // ==================
  // PRODUCT CARD
  // ==================
  renderProductCard(product) {
    const displayPrice = Auth.getPrice(product);
    const discount = Utils.getDiscount(product.originalPrice, displayPrice);
    const isMitra = Auth.isMitra();
    const stockClass = product.stockStatus === 'ready' ? 'stock-ready' : product.stockStatus === 'preorder' ? 'stock-preorder' : 'stock-habis';
    const stockLabel = product.stockStatus === 'ready' ? '✓ Ready' : product.stockStatus === 'preorder' ? '⏳ PO' : '✕ Habis';
    const identifier = product.sku || product.id;
    return `
      <div class="product-card ${product.stockStatus === 'habis' ? 'card-soldout' : ''}" onclick="App.navigate('product', '${identifier}')">
        <div class="card-img-wrapper">
          <img src="${Utils.getProductImage(product)}" alt="${Utils.escapeHtml(product.name)}" class="card-img" loading="lazy">
          ${discount > 0 ? `<span class="card-discount">-${discount}%</span>` : ''}
          <span class="card-stock ${stockClass}">${stockLabel}</span>
          ${isMitra ? '<span class="card-mitra-badge">🏷️ Harga Mitra</span>' : ''}
          ${product.stockStatus === 'habis' ? '<div class="card-soldout-overlay"><span>HABIS</span></div>' : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title">${Utils.escapeHtml(product.name)}</h3>
          <div class="card-price-row"><span class="card-price">${Utils.formatPrice(displayPrice)}</span>${product.originalPrice > displayPrice ? `<span class="card-original-price">${Utils.formatPrice(product.originalPrice)}</span>` : ''}${isMitra ? `<span class="card-normal-price-label">Normal: ${Utils.formatPrice(product.price)}</span>` : ''}</div>
          <div class="card-meta"><span class="card-rating">${Utils.renderStars(product.rating)} ${product.rating}</span><span class="card-sold">${Utils.formatNumber(product.sold)} terjual</span></div>
          ${product.compatibility ? `<p class="card-compat">🔗 ${Utils.truncate(product.compatibility, 35)}</p>` : ''}
        </div>
      </div>
    `;
  },

  // ==================
  // CATEGORY PAGE with filters
  // ==================
  renderCategory() {
    const cat = CATEGORIES.find(c => c.id === this.currentCategory) || CATEGORIES[0];
    let products = this.currentCategory === 'semua' ? [...PRODUCTS] : PRODUCTS.filter(p => p.category === this.currentCategory);

    // Apply filters
    if (this.filterColors.length > 0) {
      products = products.filter(p => p.colors && p.colors.some(c => this.filterColors.includes(c)));
    }
    if (this.filterSizes.length > 0) {
      products = products.filter(p => p.sizes && p.sizes.some(s => this.filterSizes.includes(s)));
    }
    if (this.filterStock.length > 0) {
      products = products.filter(p => this.filterStock.includes(p.stockStatus));
    }
    products = this.sortProducts(products, this.sortBy);

    // Get available colors/sizes for current category
    const catProducts = this.currentCategory === 'semua' ? PRODUCTS : PRODUCTS.filter(p => p.category === this.currentCategory);
    const availColors = [...new Set(catProducts.flatMap(p => p.colors || []))].filter(Boolean);
    const availSizes = [...new Set(catProducts.flatMap(p => p.sizes || []))].filter(Boolean);

    const colorMap = { 'Hitam':'#222', 'Merah':'#e74c3c', 'Putih':'#f5f5f5', 'Biru':'#3498db', 'Gold':'#d4a017', 'Silver':'#bdc3c7', 'Kuning':'#f1c40f', 'Clear':'#ecf0f1', 'Smoke':'#7f8c8d' };

    return `
      <div class="category-page">
        <div class="category-breadcrumb"><a href="#home" onclick="App.navigate('home')">Beranda</a> › <span>${cat.icon} ${cat.name}</span></div>
        <div class="category-layout">
          <aside class="category-sidebar">
            <h3>Kategori</h3>
            <ul class="sidebar-categories">
              ${CATEGORIES.map(c => `<li class="${c.id === this.currentCategory ? 'active' : ''}" onclick="App.resetFilters(); App.navigate('category', '${c.id}')"><span>${c.icon}</span> ${c.name}<span class="cat-count">${c.id === 'semua' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === c.id).length}</span></li>`).join('')}
            </ul>

            <h3>Stok</h3>
            <div class="sidebar-filters">
              <label class="filter-option"><input type="checkbox" ${this.filterStock.includes('ready') ? 'checked' : ''} onchange="App.toggleFilter('stock','ready')"> 🟢 Ready</label>
              <label class="filter-option"><input type="checkbox" ${this.filterStock.includes('preorder') ? 'checked' : ''} onchange="App.toggleFilter('stock','preorder')"> 🟡 Pre-Order</label>
            </div>

            ${availColors.length > 0 ? `
              <h3>Warna</h3>
              <div class="color-filter-grid">
                ${availColors.map(c => `
                  <button class="color-filter-btn ${this.filterColors.includes(c) ? 'active' : ''}" onclick="App.toggleFilter('color','${c}')" title="${c}">
                    <span class="color-swatch" style="background:${colorMap[c] || '#999'}; ${c === 'Putih' ? 'border:1px solid #ddd;' : ''}"></span>
                    <span class="color-label">${c}</span>
                  </button>
                `).join('')}
              </div>
            ` : ''}

            ${availSizes.length > 0 ? `
              <h3>Ukuran</h3>
              <div class="size-filter-grid">
                ${availSizes.slice(0, 10).map(s => `
                  <button class="size-filter-btn ${this.filterSizes.includes(s) ? 'active' : ''}" onclick="App.toggleFilter('size','${s}')">${s}</button>
                `).join('')}
              </div>
            ` : ''}

            ${(this.filterColors.length + this.filterSizes.length + this.filterStock.length) > 0 ? `
              <button class="btn-reset-filter" onclick="App.resetFilters(); App.handleRoute();">✕ Reset Filter</button>
            ` : ''}
          </aside>

          <div class="category-main">
            <div class="category-topbar">
              <span class="result-count">${products.length} produk ditemukan</span>
              <div class="sort-options"><span>Urutkan:</span>
                <select id="sort-select" onchange="App.changeSort(this.value)">
                  <option value="terlaris" ${this.sortBy === 'terlaris' ? 'selected' : ''}>Terlaris</option>
                  <option value="terbaru" ${this.sortBy === 'terbaru' ? 'selected' : ''}>Terbaru</option>
                  <option value="termurah" ${this.sortBy === 'termurah' ? 'selected' : ''}>Harga Terendah</option>
                  <option value="termahal" ${this.sortBy === 'termahal' ? 'selected' : ''}>Harga Tertinggi</option>
                  <option value="rating" ${this.sortBy === 'rating' ? 'selected' : ''}>Rating Tertinggi</option>
                </select>
              </div>
            </div>
            ${products.length > 0 ? (() => {
              const totalPages = Math.ceil(products.length / this.productsPerPage);
              const page = Math.min(this.currentProductPage, totalPages);
              const start = (page - 1) * this.productsPerPage;
              const paged = products.slice(start, start + this.productsPerPage);
              let paginationHtml = '';
              if (totalPages > 1) {
                paginationHtml = '<div class="pagination">';
                if (page > 1) paginationHtml += `<button class="page-btn" onclick="App.goToPage(${page-1})">← Prev</button>`;
                for (let i = Math.max(1, page-2); i <= Math.min(totalPages, page+2); i++) {
                  paginationHtml += `<button class="page-btn ${i===page?'active':''}" onclick="App.goToPage(${i})">${i}</button>`;
                }
                if (page < totalPages) paginationHtml += `<button class="page-btn" onclick="App.goToPage(${page+1})">Next →</button>`;
                paginationHtml += `<span class="page-info">Hal ${page}/${totalPages} (${products.length} produk)</span></div>`;
              }
              return `<div class="product-grid">${paged.map(p => this.renderProductCard(p)).join('')}</div>${paginationHtml}`;
            })() : `<div class="empty-state"><div class="empty-icon">😕</div><h3>Produk tidak ditemukan</h3><p>Coba ubah filter atau pilih kategori lain</p></div>`}
          </div>
        </div>
      </div>
    `;
  },

  // ==================
  // ALL CATEGORIES PAGE
  // ==================
  renderAllCategories() {
    return `
      <div class="category-page">
        <div class="category-breadcrumb"><a href="#home" onclick="App.navigate('home')">Beranda</a> › <span>Semua Kategori</span></div>
        <div class="section-header">
          <h2 class="section-title">Semua Kategori (${CATEGORIES.length - 1})</h2>
          <button class="btn-secondary" onclick="App.navigate('home')">← Kembali ke Beranda</button>
        </div>
        <div class="category-grid-all">
          ${CATEGORIES.filter(c => c.id !== 'semua').map(cat => `
            <div class="category-card" onclick="App.navigate('category', '${cat.id}')">
              <span class="category-icon">${cat.icon}</span>
              <span class="category-name">${cat.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  toggleFilter(type, value) {
    if (type === 'color') {
      const idx = this.filterColors.indexOf(value);
      idx === -1 ? this.filterColors.push(value) : this.filterColors.splice(idx, 1);
    } else if (type === 'size') {
      const idx = this.filterSizes.indexOf(value);
      idx === -1 ? this.filterSizes.push(value) : this.filterSizes.splice(idx, 1);
    } else if (type === 'stock') {
      const idx = this.filterStock.indexOf(value);
      idx === -1 ? this.filterStock.push(value) : this.filterStock.splice(idx, 1);
    }
    this.handleRoute();
  },

  resetFilters() { this.filterColors = []; this.filterSizes = []; this.filterStock = []; },

  sortProducts(products, sortBy) {
    switch (sortBy) {
      case 'termurah': return products.sort((a, b) => a.price - b.price);
      case 'termahal': return products.sort((a, b) => b.price - a.price);
      case 'rating': return products.sort((a, b) => b.rating - a.rating);
      case 'terbaru': return products.sort((a, b) => b.id.localeCompare(a.id));
      default: return products.sort((a, b) => b.sold - a.sold);
    }
  },
  changeSort(val) { this.sortBy = val; this.currentProductPage = 1; this.handleRoute(); },
  goToPage(page) { this.currentProductPage = page; this.handleRoute(); Utils.scrollToTop(); },

  // ==================
  // SEARCH RESULTS
  // ==================
  renderSearchResults() {
    const q = this.searchQuery.toLowerCase();
    // Search categories
    const catResults = CATEGORIES.filter(c => c.id !== 'semua' && c.name.toLowerCase().includes(q));
    // Search products
    const prodResultsAll = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || (p.compatibility && p.compatibility.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) || p.id.toLowerCase().includes(q)
    );
    const totalResults = catResults.length + prodResultsAll.length;
    
    // Pagination
    this.currentProductPage = this.currentProductPage || 1;
    const start = (this.currentProductPage - 1) * this.productsPerPage;
    const paged = prodResultsAll.slice(start, start + this.productsPerPage);
    const totalPages = Math.ceil(prodResultsAll.length / this.productsPerPage);

    return `
      <div class="search-page">
        <div class="search-results-header"><h2>Hasil pencarian untuk "<span class="search-highlight">${Utils.escapeHtml(this.searchQuery)}</span>"</h2><span class="result-count">${totalResults} hasil ditemukan</span></div>
        ${catResults.length > 0 ? `
          <div class="search-section">
            <h3 class="search-section-title">📂 Kategori (${catResults.length})</h3>
            <div class="category-grid-home">
              ${catResults.map(c => `<div class="category-card" onclick="App.navigate('category', '${c.id}')"><span class="category-icon">${c.icon}</span><span class="category-name">${c.name}</span></div>`).join('')}
            </div>
          </div>
        ` : ''}
        ${prodResultsAll.length > 0 ? `
          <div class="search-section">
            <h3 class="search-section-title">🏍️ Produk (${prodResultsAll.length})</h3>
            <div class="product-grid">${paged.map(p => this.renderProductCard(p)).join('')}</div>
            ${totalPages > 1 ? `
              <div class="pagination">
                <button class="btn-icon" onclick="App.goToPage(${this.currentProductPage - 1})" ${this.currentProductPage === 1 ? 'disabled' : ''}>←</button>
                <span class="page-info">Halaman ${this.currentProductPage} dari ${totalPages}</span>
                <button class="btn-icon" onclick="App.goToPage(${this.currentProductPage + 1})" ${this.currentProductPage === totalPages ? 'disabled' : ''}>→</button>
              </div>
            ` : ''}
          </div>
        ` : ''}
        ${totalResults === 0 ? `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Tidak ditemukan</h3><p>Coba kata kunci lain atau cari berdasarkan nama motor</p><button class="btn-primary" onclick="App.navigate('home')">Kembali ke Beranda</button></div>` : ''}
      </div>
    `;
  },

  // ==================
  // PRODUCT DETAIL with reviews — NO shipping info, WITH WhatsApp contact
  // ==================
  selectedVariants: {},
  selectedQty: 1,

  async renderProductDetail(productId) {
    if (!productId) return `<div class="empty-state"><div class="empty-icon">😕</div><h3>Produk tidak ditemukan</h3><button class="btn-primary" onclick="App.navigate('home')">Kembali ke Beranda</button></div>`;

    const product = App.findProduct(productId);

    if (!product) {
      console.error('Product Not Found', {
        requestedId: productId,
        sampleProducts: PRODUCTS.slice(0, 10)
      });
      return `<div class="empty-state"><div class="empty-icon">😕</div><h3>Produk tidak ditemukan</h3><p>Kami tidak dapat menemukan produk "${Utils.escapeHtml(productId)}".</p><button class="btn-primary" onclick="App.navigate('home')">Kembali ke Beranda</button></div>`;
    }

    this.selectedVariants = {};
    this.selectedQty = 1;
    const displayPrice = Auth.getPrice(product);
    const discount = Utils.getDiscount(product.originalPrice, displayPrice);
    const catInfo = CATEGORIES.find(c => c.id === product.category);
    const related = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 6);
    const reviews = await API.getReviews(product.id);
    const avgRating = reviews.length > 0 ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    
    // WhatsApp pre-fill message for this product
    const waMsg = encodeURIComponent(`Halo MotoSpare, saya mau tanya tentang produk:\n\n*${product.name}*\nHarga: ${Utils.formatPrice(product.price)}\nKode: ${product.id}\n\nApakah tersedia?`);

    return `
      <div class="product-detail-page">
        <div class="detail-breadcrumb">
          <a href="#home" onclick="App.navigate('home')">Beranda</a> › <a href="#category/${product.category}" onclick="App.navigate('category', '${product.category}')">${catInfo ? catInfo.name : product.category}</a> › <span>${Utils.truncate(product.name, 30)}</span>
        </div>

        <div class="detail-layout">
          <div class="detail-image-section">
            <div class="detail-main-image">
              <img src="${Utils.getProductImage(product)}" alt="${Utils.escapeHtml(product.name)}" id="detail-main-img">
              ${discount > 0 ? `<span class="detail-discount-badge">-${discount}%</span>` : ''}
            </div>
          </div>
          <div class="detail-info-section">
            <h1 class="detail-title">${Utils.escapeHtml(product.name)}</h1>
            <div class="detail-meta-row"><span class="detail-rating">${Utils.renderStars(product.rating)} ${product.rating} (${product.reviewCount} ulasan)</span><span class="detail-sold">${Utils.formatNumber(product.sold)} terjual</span></div>
            <div class="detail-price-box"><span class="detail-price" id="detail-price">${Utils.formatPrice(displayPrice)}</span>${product.originalPrice > displayPrice ? `<span class="detail-original-price">${Utils.formatPrice(product.originalPrice)}</span><span class="detail-discount-pct">${discount}% OFF</span>` : ''}${Auth.isMitra() ? `<span class="detail-mitra-badge">🏷️ Harga Mitra</span><span class="detail-normal-price">Normal: ${Utils.formatPrice(product.price)}</span>` : ''}</div>

            <div class="detail-stock">
              ${product.stockStatus === 'ready' ? `<span class="stock-badge stock-ready">✓ Stok Ready</span><span class="stock-qty">Tersisa ${product.stock} buah</span>${product.stock <= 5 ? '<span class="stock-warning">⚠️ Stok hampir habis!</span>' : ''}` : product.stockStatus === 'preorder' ? `<span class="stock-badge stock-preorder">⏳ Pre-Order</span><span class="stock-info">Estimasi ${product.preorderDays || 7} hari kerja</span>` : `<span class="stock-badge stock-habis">✕ Stok Habis</span>`}
            </div>

            ${product.variants && product.variants.length > 0 ? `<div class="detail-variants">${product.variants.map(v => `
              <div class="variant-group"><label class="variant-label">${v.name}: <span class="variant-selected-label" id="selected-${v.name.replace(/\s/g,'')}">Pilih ${v.name}</span></label><div class="variant-options">${v.options.map((opt, i) => `
                <button class="variant-btn" data-variant="${v.name}" data-option="${opt}" data-price-add="${v.priceAdd[i] || 0}" onclick="App.selectVariant('${v.name}', '${opt}', ${v.priceAdd[i] || 0}, this, '${product.id}')">${opt}${v.priceAdd[i] > 0 ? `<small>+${Utils.formatPrice(v.priceAdd[i])}</small>` : ''}</button>
              `).join('')}</div></div>
            `).join('')}</div>` : ''}

            <div class="detail-quantity"><label>Jumlah:</label><div class="qty-selector"><button class="qty-btn" onclick="App.changeDetailQty(-1)">−</button><input type="number" id="detail-qty" value="1" min="1" max="${product.stock || 99}" onchange="App.validateDetailQty(${product.stock || 99})"><button class="qty-btn" onclick="App.changeDetailQty(1)">+</button></div><span class="qty-stock">Stok: ${product.stock}</span></div>

            <div class="detail-actions">
              ${product.stockStatus === 'habis' ? 
                `<button class="btn-soldout" disabled>Stok Habis</button>` : 
                (displayPrice <= 0 ? 
                  `<button class="btn-soldout" style="background:#64748b; cursor:not-allowed;" disabled>Harga Hubungi Toko</button>` : 
                  `<button class="btn-add-cart" onclick="App.addToCartFromDetail('${product.sku || product.id}')">🛒 Masukkan Keranjang</button><button class="btn-buy-now" onclick="App.buyNow('${product.sku || product.id}')">Beli Sekarang</button>`
                )
              }
              <a href="https://wa.me/6285134167308?text=${waMsg}" target="_blank" class="btn-wa-contact">💬 Hubungi Toko</a>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="detail-tabs">
          <div class="tabs-header">
            <button class="tab-btn active" onclick="App.switchTab(this, 'tab-desc')">Deskripsi</button>
            <button class="tab-btn" onclick="App.switchTab(this, 'tab-compat')">Persamaan Motor</button>
            <button class="tab-btn" onclick="App.switchTab(this, 'tab-spec')">Spesifikasi</button>
          </div>
          <div class="tabs-content">
            <div class="tab-panel active" id="tab-desc"><p>${product.description}</p></div>
            <div class="tab-panel" id="tab-compat">
              <div class="compat-section"><h4>🔗 Persamaan Sparepart — Cocok untuk motor:</h4><div class="compat-tags">${product.compatibility.split(',').map(m => `<span class="compat-tag">${m.trim()}</span>`).join('')}</div><p class="compat-note">* Pastikan kembali kecocokan dengan motor Anda sebelum membeli</p></div>
            </div>
            <div class="tab-panel" id="tab-spec">
              <table class="spec-table"><tr><td>Brand</td><td>${product.brand || '-'}</td></tr><tr><td>Berat</td><td>${product.weight || '-'}</td></tr><tr><td>Kategori</td><td>${catInfo ? catInfo.name : product.category}</td></tr><tr><td>Stok</td><td>${product.stock} pcs</td></tr>${product.variants && product.variants.length > 0 ? product.variants.map(v => `<tr><td>Varian ${v.name}</td><td>${v.options.join(', ')}</td></tr>`).join('') : ''}</table>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="reviews-section">
          <div class="reviews-header">
            <h2>⭐ Ulasan Pembeli</h2>
            <div class="reviews-summary">
              <div class="reviews-avg">
                <span class="avg-number">${avgRating}</span>
                <span class="avg-stars">${Utils.renderStars(parseFloat(avgRating))}</span>
                <span class="avg-count">${reviews.length} ulasan</span>
              </div>
            </div>
          </div>
          <div class="reviews-list">
            ${reviews.map(r => `
              <div class="review-card">
                <div class="review-top">
                  <div class="review-user">
                    <div class="review-avatar">${r.avatar}</div>
                    <div class="review-user-info">
                      <strong>${r.user}</strong>
                      <div class="review-stars">${Utils.renderStars(r.rating)}</div>
                    </div>
                  </div>
                  <span class="review-date">${new Date(r.date).toLocaleDateString('id-ID', {year:'numeric',month:'short',day:'numeric'})}</span>
                </div>
                ${r.variant ? `<p class="review-variant">Varian: ${r.variant}</p>` : ''}
                <p class="review-text">${r.text}</p>
                <div class="review-bottom">
                  <button class="review-helpful-btn" onclick="this.classList.toggle('liked'); this.querySelector('.helpful-count').textContent = parseInt(this.querySelector('.helpful-count').textContent) + (this.classList.contains('liked') ? 1 : -1)">
                    👍 Membantu (<span class="helpful-count">${r.helpful}</span>)
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${related.length > 0 ? `<section class="section"><div class="section-header"><h2 class="section-title">Produk Serupa</h2></div><div class="product-grid">${related.map(p => this.renderProductCard(p)).join('')}</div></section>` : ''}
      </div>
    `;
  },

  selectVariant(variantName, option, priceAdd, btn, productId) {
    const group = btn.closest('.variant-options');
    group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedVariants[variantName] = option;
    // Update label
    const labelEl = document.getElementById('selected-' + variantName.replace(/\s/g,''));
    if (labelEl) labelEl.textContent = option;
    const product = App.findProduct(productId);
    if (product) {
      let totalPrice = product.price;
      document.querySelectorAll('.variant-btn.selected').forEach(b => { totalPrice += parseInt(b.dataset.priceAdd) || 0; });
      const priceEl = document.getElementById('detail-price');
      if (priceEl) priceEl.textContent = Utils.formatPrice(totalPrice);
    }
  },

  changeDetailQty(delta) {
    const input = document.getElementById('detail-qty'); if (!input) return;
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1; if (val > parseInt(input.max)) val = parseInt(input.max);
    input.value = val; this.selectedQty = val;
  },
  validateDetailQty(max) {
    const input = document.getElementById('detail-qty');
    let val = parseInt(input.value); if (isNaN(val) || val < 1) val = 1; if (val > max) val = max;
    input.value = val; this.selectedQty = val;
  },

  addToCartFromDetail(productId) {
    const product = App.findProduct(productId);
    // Enforce variant selection
    if (product && product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (!this.selectedVariants[v.name]) {
          Utils.showToast(`Pilih ${v.name} terlebih dahulu!`, 'warning');
          return;
        }
      }
    }
    const qty = parseInt(document.getElementById('detail-qty')?.value) || 1;
    Cart.addItem(productId, this.selectedVariants, qty);
  },
  buyNow(productId) {
    const product = App.findProduct(productId);
    if (product && product.variants && product.variants.length > 0) {
      for (const v of product.variants) { if (!this.selectedVariants[v.name]) { Utils.showToast(`Pilih ${v.name} terlebih dahulu!`, 'warning'); return; } }
    }
    const qty = parseInt(document.getElementById('detail-qty')?.value) || 1;
    Cart.addItem(productId, this.selectedVariants, qty);
    this.navigate('cart');
  },

  switchTab(btn, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');
  },

  // ==================
  // APP FEEDBACK SYSTEM
  // ==================
  feedbackRating: 5,
  setFeedbackRating(val) {
    this.feedbackRating = val;
    const stars = document.querySelectorAll('.feedback-star');
    stars.forEach((s, i) => {
      if (i < val) {
        s.classList.add('active');
        s.style.color = '#fbbf24';
      } else {
        s.classList.remove('active');
        s.style.color = '#cbd5e1';
      }
    });
  },

  renderAppFeedback() {
    this.feedbackRating = 5;
    return `
      <div class="checkout-page" style="max-width: 600px; margin: 0 auto;">
        <h2 class="page-title">📝 Kritik & Saran</h2>
        <div class="checkout-section">
          <p style="margin-bottom: 16px; color: #64748b; font-size: 0.95rem;">Bantu kami menjadi lebih baik! Bagikan pengalaman Anda menggunakan aplikasi MotoSpare. Kritik, saran, atau temuan bug sangat berarti bagi kami.</p>
          
          <form id="form-feedback" onsubmit="App.submitAppFeedback(event)">
            <div class="form-group" style="text-align: center; margin-bottom: 24px;">
              <label>Seberapa puas Anda?</label>
              <div class="rating-selector" style="font-size: 2rem; cursor: pointer; display: flex; justify-content: center; gap: 8px; margin-top: 8px;">
                <span class="feedback-star active" style="color: #fbbf24;" onclick="App.setFeedbackRating(1)">★</span>
                <span class="feedback-star active" style="color: #fbbf24;" onclick="App.setFeedbackRating(2)">★</span>
                <span class="feedback-star active" style="color: #fbbf24;" onclick="App.setFeedbackRating(3)">★</span>
                <span class="feedback-star active" style="color: #fbbf24;" onclick="App.setFeedbackRating(4)">★</span>
                <span class="feedback-star active" style="color: #fbbf24;" onclick="App.setFeedbackRating(5)">★</span>
              </div>
            </div>

            <div class="form-group">
              <label>Kritik</label>
              <textarea id="fb-kritik" rows="3" class="search-input" style="width:100%; border-radius:8px;" placeholder="Apa yang kurang dari aplikasi kami?"></textarea>
            </div>

            <div class="form-group">
              <label>Saran</label>
              <textarea id="fb-saran" rows="3" class="search-input" style="width:100%; border-radius:8px;" placeholder="Ide atau masukan untuk pengembangan..."></textarea>
            </div>

            <div class="form-group">
              <label>Bug Report (Opsional)</label>
              <textarea id="fb-bug" rows="2" class="search-input" style="width:100%; border-radius:8px;" placeholder="Apakah Anda menemukan error/rusak? Ceritakan di sini..."></textarea>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; padding: 12px; margin-top: 8px; font-size: 1rem;">Kirim Feedback</button>
          </form>
        </div>
      </div>
    `;
  },

  submitAppFeedback(e) {
    e.preventDefault();
    const kritik = document.getElementById('fb-kritik').value.trim();
    const saran = document.getElementById('fb-saran').value.trim();
    const bug = document.getElementById('fb-bug').value.trim();

    if (!kritik && !saran && !bug) {
      Utils.showToast('Harap isi setidaknya satu kolom (Kritik/Saran/Bug)', 'warning');
      return;
    }

    // Prepare User ID (Auth User OR distinct Guest ID via tracking)
    let userId = Auth.user?.id || Utils.storage.get('guest_id', null);
    if (!userId) {
      userId = 'GUEST-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      Utils.storage.set('guest_id', userId);
    }

    // Anti-Spam: 1 feedback per 24 hours per UserID
    const allFeedback = Utils.storage.get('app_feedback_db', []);
    const lastFb = allFeedback.filter(f => f.userId === userId).sort((a,b) => b.timestamp - a.timestamp)[0];
    if (lastFb) {
      const diffMs = Date.now() - lastFb.timestamp;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        Utils.showToast('Anda sudah mengirim feedback hari ini. Terima kasih!', 'warning');
        App.navigate('home');
        return;
      }
    }

    const newFeedback = {
      id: 'FB-' + Date.now(),
      userId: userId,
      userName: Auth.currentUser?.name || 'Guest User',
      timestamp: Date.now(),
      rating: this.feedbackRating,
      kritik: kritik,
      saran: saran,
      bug: bug
    };

    allFeedback.push(newFeedback);
    Utils.storage.set('app_feedback_db', allFeedback);

    // === KIRIM NOTIFIKASI KE TELEGRAM ADMIN ===
    try {
      const botToken = "8665953439:AAFgwJjbFXLRFoBv4nMsNCvRjgfa5OpNeOs";
      const chatId = "-5118620817";
      const stars = '⭐'.repeat(newFeedback.rating);
      
      const message = `📝 FEEDBACK & SARAN BARU\n\n` +
        `👤 Pengirim: ${newFeedback.userName}\n` +
        `🆔 User ID: ${newFeedback.userId}\n` +
        `🌟 Rating: ${stars} (${newFeedback.rating}/5)\n` +
        `━━━━━━━━━━━━━━\n\n` +
        `💬 Kritik:\n${newFeedback.kritik || '-'}\n\n` +
        `💡 Saran:\n${newFeedback.saran || '-'}\n\n` +
        `🐛 Laporan Bug:\n${newFeedback.bug || '-'}`;

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
    } catch (e) {
      console.warn('[Feedback] Gagal mengirim ke Telegram:', e.message);
    }

    Utils.showToast('Terima kasih atas masukannya!', 'success');
    App.navigate('home');
  },

  renderAdminFeedback() {
    const allFeedback = Utils.storage.get('app_feedback_db', []);
    // Sort newest first
    allFeedback.sort((a, b) => b.timestamp - a.timestamp);

    return `
      <div class="checkout-page" style="max-width: 800px; margin: 0 auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <h2 class="page-title" style="margin:0;">🛡️ Admin: Feedback Laporan</h2>
          <span class="stock-badge stock-ready">${allFeedback.length} Laporan</span>
        </div>
        
        ${allFeedback.length === 0 ? `
          <div class="empty-state"><div class="empty-icon">📁</div><h3>Belum ada masukan</h3></div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${allFeedback.map(f => `
              <div class="checkout-section" style="padding: 16px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                  <div>
                    <strong>${Utils.escapeHtml(f.userName)}</strong> <span style="color:#94a3b8; font-size:0.85rem;">(${f.userId})</span>
                  </div>
                  <div style="text-align:right;">
                    <div style="color:#fbbf24; font-size:1.1rem;">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</div>
                    <small style="color:#94a3b8;">${new Date(f.timestamp).toLocaleString('id-ID')}</small>
                  </div>
                </div>
                
                ${f.kritik ? `<div style="margin-bottom:8px;"><strong>Kritik:</strong><p style="margin:4px 0 0; color:#475569; font-size:0.95rem;">${Utils.escapeHtml(f.kritik)}</p></div>` : ''}
                ${f.saran ? `<div style="margin-bottom:8px;"><strong>Saran:</strong><p style="margin:4px 0 0; color:#475569; font-size:0.95rem;">${Utils.escapeHtml(f.saran)}</p></div>` : ''}
                ${f.bug ? `<div style="margin-bottom:0; background:#fee2e2; padding:8px; border-radius:6px; color:#991b1b; font-size:0.9rem;"><strong>🐛 Bug Report:</strong><br/>${Utils.escapeHtml(f.bug)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
