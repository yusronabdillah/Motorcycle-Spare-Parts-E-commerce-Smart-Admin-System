// ============================================
// MotoSpare — Utility Functions
// ============================================

const Utils = {
  formatPrice(price) {
    if (!price || price === 0) return 'Hubungi Toko';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(price);
  },

  formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'rb';
    return String(num);
  },

  getDiscount(original, current) {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  },

  renderStars(rating) {
    let stars = '';
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.3 && (rating - full) < 0.8;
    for (let i = 0; i < full; i++) stars += '<em class="star">★</em>';
    if (half) stars += '<em class="star half">★</em>';
    const remaining = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < remaining; i++) stars += '<em class="star empty">☆</em>';
    return stars;
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  truncate(text, maxLen = 50) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  },

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  getCountdown(targetTime) {
    const diff = targetTime - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false
    };
  },

  copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Berhasil disalin!', 'success');
    }).catch(() => {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.showToast('Berhasil disalin!', 'success');
    });
  },

  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  storage: {
    get(key, fallback = null) {
      try {
        const data = localStorage.getItem('motospare_' + key);
        return data ? JSON.parse(data) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('motospare_' + key, JSON.stringify(value)); } catch (e) {}
    },
    remove(key) {
      try { localStorage.removeItem('motospare_' + key); } catch (e) {}
    }
  },

  getProductImage(product) {
    if (!product) return '';
    const img = product.images && product.images[0] ? product.images[0] : '';
    // If it's a real image, return it directly
    if (img && !img.includes('placehold.co') && !img.includes('placeholder')) {
      return img;
    }

    // Dynamic SVG generation for missing product images
    const name = (product.name || '').toUpperCase();
    
    // Default Box Icon
    let svgIcon = `<path d="M12 2L2 7l10 5 10-5-10-5zm0 13l-10-5v5l10 5 10-5v-5l-10 5z"/>`;
    let color = '#475569';
    let bgColor = '#f1f5f9';

    if (name.includes('BATOK') || name.includes('COVER') || name.includes('SPAKBOR') || name.includes('BODY')) {
      svgIcon = `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`;
      color = '#0284c7'; bgColor = '#e0f2fe';
    } else if (name.includes('PISTON') || name.includes('SEHER') || name.includes('CYLINDER') || name.includes('KLEP')) {
      svgIcon = `<path d="M7 4v2h10V4H7zm1 4v12h8V8H8zm2 2h4v8h-4v-8zm-5 4v2h2v-2H5zm14 0v2h2v-2h-2z"/>`;
      color = '#ea580c'; bgColor = '#ffedd5';
    } else if (name.includes('CDI') || name.includes('SPULL') || name.includes('SAKLAR') || name.includes('KABEL') || name.includes('LAMPU')) {
      svgIcon = `<path d="M13 3L4 14h7v7l9-11h-7z"/>`;
      color = '#d97706'; bgColor = '#fef3c7';
    } else if (name.includes('GEAR') || name.includes('RANTAI') || name.includes('GIR') || name.includes('KOPLING')) {
      svgIcon = `<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`;
      color = '#4f46e5'; bgColor = '#e0e7ff';
    } else if (name.includes('SHOCK') || name.includes('SOK') || name.includes('PER')) {
      svgIcon = `<path d="M12 2c-1.1 0-2 .9-2 2v2H7v2h3v2H7v2h3v2H7v2h3v2c0 1.1.9 2 2 2s2-.9 2-2v-2h3v-2h-3v-2h3v-2h-3V8h3V6h-3V4c0-1.1-.9-2-2-2z"/>`;
      color = '#dc2626'; bgColor = '#fee2e2';
    } else if (name.includes('AKI') || name.includes('ACCU') || name.includes('BATTERY') || name.includes('BATERAI')) {
      svgIcon = `<path d="M16 4h-2V2h-4v2H8c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-6 10H8v-2h2v2zm4 0h-2v-2h2v2zm0-4H8V8h6v2z"/>`;
      color = '#059669'; bgColor = '#d1fae5';
    } else if (name.includes('OLI') || name.includes('CAIRAN') || name.includes('WATER')) {
      svgIcon = `<path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/><path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>`;
      color = '#b45309'; bgColor = '#fef3c7';
    } else if (name.includes('BAN') || name.includes('TYRE') || name.includes('VELG') || name.includes('PELEK')) {
      svgIcon = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>`;
      color = '#0f172a'; bgColor = '#f1f5f9';
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${bgColor}"/>
      <g transform="scale(8) translate(13, 13)" fill="${color}">
        ${svgIcon}
      </g>
    </svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  }
};
