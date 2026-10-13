// ============================================
// MotoSpare — Auth System (localStorage)
// Role: guest | customer | mitra
// ============================================

const Auth = {
  currentUser: null,

  init() {
    this.currentUser = Utils.storage.get('currentUser', null);
    this.updateUI();
  },

  // ========== ROLE HELPERS ==========
  getRole() {
    return this.currentUser?.role || 'guest';
  },

  isMitra() {
    return this.getRole() === 'mitra';
  },

  isLoggedIn() {
    return this.currentUser !== null;
  },

  // ========== GET PRICE BASED ON ROLE ==========
  getPrice(product) {
    if (this.isMitra() && product.price_mitra) {
      return product.price_mitra;
    }
    return product.price;
  },

  // ========== REGISTER (default = customer) ==========
  register(name, email, phone, password) {
    const users = Utils.storage.get('users', []);
    if (users.find(u => u.email === email)) { Utils.showToast('Email sudah terdaftar!', 'error'); return false; }
    const user = {
      id: 'USR' + Date.now(),
      name, email, phone, password,
      role: 'customer',
      avatar: name.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      addresses: []
    };
    users.push(user);
    Utils.storage.set('users', users);
    this.currentUser = user;
    Utils.storage.set('currentUser', user);
    this.updateUI();
    Utils.showToast(`Selamat datang, ${name}! 🎉`, 'success');
    return true;
  },

  // ========== LOGIN (email + password) ==========
  login(email, password) {
    const users = Utils.storage.get('users', []);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) { Utils.showToast('Email atau password salah!', 'error'); return false; }
    this.currentUser = user;
    Utils.storage.set('currentUser', user);
    this.updateUI();
    const roleLabel = user.role === 'mitra' ? '🏷️ Mitra' : '👤 Customer';
    Utils.showToast(`Halo, ${user.name}! (${roleLabel}) 👋`, 'success');
    return true;
  },

  // ========== LOGIN MITRA (via kode mitra) ==========
  loginMitra(code) {
    const mitraData = MITRA_CODES.find(m => m.code === code.trim().toUpperCase());
    if (!mitraData) {
      Utils.showToast('Kode mitra tidak valid!', 'error');
      return false;
    }
    // Create or find mitra user
    const users = Utils.storage.get('users', []);
    let user = users.find(u => u.mitraCode === mitraData.code);
    if (!user) {
      user = {
        id: 'MITRA' + Date.now(),
        name: mitraData.name,
        email: mitraData.code.toLowerCase() + '@mitra.motospare.id',
        phone: '-',
        password: mitraData.code,
        role: 'mitra',
        mitraCode: mitraData.code,
        avatar: 'M',
        createdAt: new Date().toISOString(),
        addresses: []
      };
      users.push(user);
      Utils.storage.set('users', users);
    }
    this.currentUser = user;
    Utils.storage.set('currentUser', user);
    this.updateUI();
    Utils.showToast(`🏷️ Login Mitra Berhasil! Harga mitra aktif.`, 'success');
    return true;
  },

  // ========== LOGOUT ==========
  logout() {
    this.currentUser = null;
    Utils.storage.remove('currentUser');
    this.updateUI();
    Utils.showToast('Berhasil logout', 'info');
    App.navigate('home');
  },

  // ========== UPDATE NAVBAR UI ==========
  updateUI() {
    const userArea = document.getElementById('user-area');
    const userAreaMobile = document.getElementById('user-area-mobile');
    if (!userArea) return;

    if (this.isLoggedIn()) {
      const mitraBadge = this.isMitra() ? '<span class="mitra-nav-badge">🏷️ Harga Mitra</span>' : '';
      userArea.innerHTML = `
        ${mitraBadge}
        <div class="user-menu" id="user-menu-toggle">
          <div class="user-avatar ${this.isMitra() ? 'avatar-mitra' : ''}">${this.currentUser.avatar}</div>
          <span class="user-name">${Utils.truncate(this.currentUser.name, 12)}</span>
          <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-role-info">${this.isMitra() ? '🏷️ Mitra Resmi' : '👤 Customer'}</div>
            <a href="#profile" class="dropdown-item" onclick="App.navigate('profile')"><span>👤</span> Profil Saya</a>
            <a href="#orders" class="dropdown-item" onclick="App.navigate('orders')"><span>📦</span> Pesanan Saya</a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" onclick="Auth.logout(); return false;"><span>🚪</span> Keluar</a>
          </div>
        </div>`;
      if (userAreaMobile) {
        userAreaMobile.innerHTML = `
          ${this.isMitra() ? '<span class="mitra-mobile-badge">🏷️ Harga Mitra Aktif</span>' : ''}
          <a href="#profile" onclick="App.navigate('profile'); App.closeMobileMenu();">👤 ${this.currentUser.name}</a>
          <a href="#orders" onclick="App.navigate('orders'); App.closeMobileMenu();">📦 Pesanan Saya</a>
          <a href="#" onclick="Auth.logout(); App.closeMobileMenu(); return false;">🚪 Keluar</a>`;
      }
      setTimeout(() => {
        const toggle = document.getElementById('user-menu-toggle');
        if (toggle) toggle.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('user-dropdown')?.classList.toggle('show'); });
      }, 50);
    } else {
      userArea.innerHTML = `<button class="btn-auth" onclick="App.navigate('login')"><span>🏷️</span> Masuk sebagai Mitra</button>`;
      if (userAreaMobile) {
        userAreaMobile.innerHTML = `<a href="#login" onclick="App.navigate('login'); App.closeMobileMenu();">🏷️ Masuk sebagai Mitra</a>`;
      }
    }
  },

  getOrders() { return Utils.storage.get('orders_' + (this.currentUser?.id || 'guest'), []); },

  addOrder(order) {
    const userId = this.currentUser?.id || 'guest';
    const orders = Utils.storage.get('orders_' + userId, []);
    orders.unshift(order);
    Utils.storage.set('orders_' + userId, orders);
  },

  // ========== LOGIN PAGE (with tabs: Customer / Mitra) ==========
  renderLogin() {
    return `
      <div class="auth-page"><div class="auth-card">
        <div class="auth-header"><h2>Masuk</h2><p>Masuk ke akun MotoSpare kamu</p></div>
        <div id="login-mitra-form">
          <form onsubmit="return Auth.handleMitraLogin(event)">
            <div class="form-group"><label>Kode Mitra</label><input type="text" id="mitra-code" placeholder="Masukkan kode mitra (contoh: MITRA123)" required></div>
            <div class="mitra-info-box">
              <p>💡 Masukkan kode mitra yang diberikan oleh admin MotoSpare untuk mendapatkan <strong>harga khusus mitra</strong>.</p>
            </div>
            <button type="submit" class="btn-primary btn-full btn-mitra">🏷️ Login sebagai Mitra</button>
          </form>
        </div>

        <div class="auth-footer">
          <p class="guest-note"><a href="#home" onclick="App.navigate('home'); return false;">Belanja tanpa login</a> sebagai Guest</p>
        </div>
      </div></div>`;
  },

  switchLoginTab(tab) {
    document.getElementById('tab-customer').classList.toggle('active', tab === 'customer');
    document.getElementById('tab-mitra').classList.toggle('active', tab === 'mitra');
    document.getElementById('login-customer-form').style.display = tab === 'customer' ? 'block' : 'none';
    document.getElementById('login-mitra-form').style.display = tab === 'mitra' ? 'block' : 'none';
  },

  renderRegister() {
    return `
      <div class="auth-page"><div class="auth-card">
        <div class="auth-header"><h2>Daftar</h2><p>Buat akun MotoSpare baru</p></div>
        <form id="register-form" onsubmit="return Auth.handleRegister(event)">
          <div class="form-group"><label>Nama Lengkap</label><input type="text" id="reg-name" placeholder="Nama lengkap" required></div>
          <div class="form-group"><label>Email</label><input type="email" id="reg-email" placeholder="contoh@email.com" required></div>
          <div class="form-group"><label>No. HP / WhatsApp</label><input type="tel" id="reg-phone" placeholder="08xxxxxxxxxx" required></div>
          <div class="form-group"><label>Password</label><div class="password-wrapper"><input type="password" id="reg-password" placeholder="Min. 6 karakter" required minlength="6"><button type="button" class="password-toggle" onclick="Auth.togglePassword('reg-password', this)">👁️</button></div></div>
          <button type="submit" class="btn-primary btn-full">Daftar</button>
        </form>
        <div class="auth-footer"><p>Sudah punya akun? <a href="#login" onclick="App.navigate('login'); return false;">Masuk di sini</a></p></div>
      </div></div>`;
  },

  handleLogin(e) {
    e.preventDefault();
    if (this.login(document.getElementById('login-email').value.trim(), document.getElementById('login-password').value)) App.navigate('home');
    return false;
  },

  handleMitraLogin(e) {
    e.preventDefault();
    if (this.loginMitra(document.getElementById('mitra-code').value.trim())) App.navigate('home');
    return false;
  },

  handleRegister(e) {
    e.preventDefault();
    if (this.register(document.getElementById('reg-name').value.trim(), document.getElementById('reg-email').value.trim(), document.getElementById('reg-phone').value.trim(), document.getElementById('reg-password').value)) App.navigate('home');
    return false;
  },

  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
  },

  renderProfile() {
    if (!this.isLoggedIn()) { App.navigate('login'); return '<p>Redirecting...</p>'; }
    const u = this.currentUser;
    const roleLabel = this.isMitra() ? '🏷️ Mitra Resmi' : '👤 Customer';
    return `
      <div class="profile-page">
        <div class="profile-header-card">
          <div class="profile-avatar-large ${this.isMitra() ? 'avatar-mitra' : ''}">${u.avatar}</div>
          <div class="profile-info">
            <h2>${Utils.escapeHtml(u.name)} <span class="profile-role-badge ${this.isMitra() ? 'badge-mitra' : 'badge-customer'}">${roleLabel}</span></h2>
            <p>📧 ${Utils.escapeHtml(u.email)}</p>
            <p>📱 ${Utils.escapeHtml(u.phone || '-')}</p>
            <p class="profile-since">Member sejak ${new Date(u.createdAt).toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
        </div>
        <div class="profile-menu-grid">
          <div class="profile-menu-item" onclick="App.navigate('orders')"><span class="profile-menu-icon">📦</span><span>Pesanan Saya</span></div>
          <div class="profile-menu-item" onclick="App.navigate('cart')"><span class="profile-menu-icon">🛒</span><span>Keranjang</span></div>
          <div class="profile-menu-item" onclick="App.toggleChat()"><span class="profile-menu-icon">💬</span><span>Chat Toko</span></div>
          <div class="profile-menu-item" onclick="Auth.logout()"><span class="profile-menu-icon">🚪</span><span>Keluar</span></div>
        </div>
      </div>`;
  },

  renderOrders() {
    const orders = this.getOrders();
    if (orders.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📦</div><h3>Belum Ada Pesanan</h3><p>Yuk mulai belanja spare part motor!</p><button class="btn-primary" onclick="App.navigate('home')">Mulai Belanja</button></div>`;
    }

    return `
      <div class="orders-page">
        <h2 class="page-title">📦 Pesanan Saya</h2>
        <div class="orders-list">
          ${orders.map(order => `
            <div class="order-card">
              <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status status-${order.status}">${order.statusText}</span>
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
                ${order.status === 'awaiting_payment' ? `<button class="btn-primary" style="padding:8px 16px;font-size:13px;" onclick="App.navigate('payment', '${order.id}')">💳 Bayar Sekarang</button>` : ''}
                ${order.status === 'paid' || order.status === 'confirmed' ? `<button class="btn-secondary" style="padding:8px 16px;font-size:13px;" onclick="App.navigate('payment', '${order.id}')">📋 Lihat Detail</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
};
