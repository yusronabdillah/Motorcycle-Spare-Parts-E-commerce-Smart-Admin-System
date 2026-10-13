// ============================================
// MotoSpare — API Service (MOCK STANDALONE)
// ============================================

// Memanfaatkan data dari mock_db.js (window.PRODUCTS, dll)
// Simulasi delay jaringan (latency)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ApiService = {
  async fetchProducts(params = {}) {
    await delay(300); // simulate latency
    let raw = [...PRODUCTS];
    if (params.category && params.category !== 'semua') raw = raw.filter(p => p.category === params.category);
    if (params.search) {
      const q = params.search.toLowerCase();
      raw = raw.filter(p => p.name.toLowerCase().includes(q) || p.compatibility.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (params.sort) {
      switch (params.sort) {
        case 'termurah': raw.sort((a,b)=>a.price-b.price); break;
        case 'termahal': raw.sort((a,b)=>b.price-a.price); break;
        case 'rating': raw.sort((a,b)=>b.rating-a.rating); break;
        case 'terbaru': raw.sort((a,b)=>String(b.id).localeCompare(String(a.id))); break;
        default: raw.sort((a,b)=>b.sold-a.sold);
      }
    }
    return raw;
  },

  async fetchCategories() {
    await delay(100);
    return CATEGORIES;
  },

  async fetchProductDetail(id) {
    await delay(200);
    const queryId = String(id).toLowerCase();
    const prod = PRODUCTS.find(p => 
      String(p.id).toLowerCase() === queryId ||
      (p.sku && String(p.sku).toLowerCase() === queryId)
    );
    if (!prod) throw new Error("Product not found: " + id);
    return prod;
  },

  async fetchProductReviews(id) {
    await delay(300);
    return generateReviews(id);
  },

  async fetchShippingOptions() {
    await delay(100);
    return SHIPPING_OPTIONS;
  },

  async fetchPaymentOptions() {
    await delay(100);
    return {
      banks: BANK_OPTIONS,
      ewallets: EWALLET_OPTIONS
    };
  },

  async createOrder(orderData) {
    // Generate order ID
    const pType = orderData.paymentMethod || 'cod';
    const isCod = pType === 'cod';
    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const expiresAt = isCod ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let notificationSent = false;

    // === TIER 2: NOTIFIKASI TELEGRAM (Fallback Netlify Function) ===
    try {
      console.log('[API] Mencoba Netlify Function...');
      const r = await fetch('/.netlify/functions/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderPayload: { ...orderData, orderId } })
      });
      if (r.ok) {
        notificationSent = true;
        console.log('[API] Netlify Function Berhasil.');
      } else {
        throw new Error('Netlify function returned ' + r.status);
      }
    } catch (e) {
      console.warn("[API] Netlify function gagal atau tidak tersedia:", e.message);
    }

    // === TIER 3: NOTIFIKASI TELEGRAM (Direct Browser Fallback) ===
    if (!notificationSent) {
      try {
        console.log('[API] Menggunakan Direct Browser Telegram API (Local Fallback)...');
        const botToken = "8665953439:AAFgwJjbFXLRFoBv4nMsNCvRjgfa5OpNeOs";
        const chatId = "-5118620817";
        const customer = orderData.customer || {};
        
        const formatRupiah = (n) => isNaN(n) ? 'Rp 0' : 'Rp ' + Number(n).toLocaleString('id-ID');
        const itemsText = orderData.items ? orderData.items.map((i, idx) => {
          const price = Number(i.unitPrice) || 0;
          const qty = Number(i.qty) || 0;
          return `${idx+1}. ${i.name}\n   Qty: ${qty} x ${formatRupiah(price)} = ${formatRupiah(price * qty)}`;
        }).join('\n') : '';
        
        const totalStr = formatRupiah(orderData.totalAmount);
        let statusText = '🟡 MENUNGGU PEMBAYARAN';
        if (pType === 'bni') statusText = '🟡 MENUNGGU VERIFIKASI ADMIN';
        else if (pType === 'qris') statusText = '🟡 MENUNGGU PEMBAYARAN QRIS';
        else if (isCod) statusText = '✅ COD - Bayar di Tempat';

        const paymentDetail = pType === 'bni' 
          ? '🏦 Transfer Bank BNI\nRekening: 0888888685\nAtas Nama: Erson' 
          : (pType === 'qris' ? '📱 QRIS' : '💵 COD');
        
        const message = `🛒 ORDER BARU MASUK (Local)\n\n📄 No Order:\n${orderId}\n\n👤 Nama Customer:\n${customer.name || '-'}\n\n📱 Nomor HP:\n${customer.phone || '-'}\n\n📍 Alamat:\n${customer.address || '-'}\n\n📝 Catatan Penjual:\n${orderData.notes || customer.notes || '-'}\n\n━━━━━━━━━━━━━━\n\n📦 Produk:\n${itemsText}\n\n━━━━━━━━━━━━━━\n\n💳 Metode Pembayaran:\n${paymentDetail}\n\n━━━━━━━━━━━━━━\n\n💰 Total Pembayaran:\n${totalStr}\n\n━━━━━━━━━━━━━━\n\nStatus:\n${statusText}`;

        if (pType === 'bni' && orderData.paymentProof) {
          // Convert base64 to Blob and send via FormData
          const base64Data = orderData.paymentProof.split(',')[1];
          const mimeType = orderData.paymentProof.split(';')[0].split(':')[1];
          const isPdf = mimeType === 'application/pdf';
          
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          const blob = new Blob(byteArrays, {type: mimeType});
          
          const fd = new FormData();
          fd.append('chat_id', chatId);
          fd.append('caption', message);
          fd.append(isPdf ? 'document' : 'photo', blob, isPdf ? 'Bukti.pdf' : 'Bukti.jpg');
          fd.append('reply_markup', JSON.stringify({
            inline_keyboard: [
              [
                { text: '✅ Terima Pembayaran', callback_data: `approve:${orderId}` },
                { text: '❌ Tolak', callback_data: `reject:${orderId}` }
              ]
            ]
          }));

          await fetch(`https://api.telegram.org/bot${botToken}/${isPdf ? 'sendDocument' : 'sendPhoto'}`, {
            method: 'POST',
            body: fd
          });
        } else {
          // Send text
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: message,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Terima Pembayaran', callback_data: `approve:${orderId}` },
                    { text: '❌ Tolak', callback_data: `reject:${orderId}` }
                  ]
                ]
              }
            })
          });
        }
        console.log('[API] Direct Browser Telegram Berhasil.');
      } catch (e) {
        console.error("[API] Direct Telegram gagal:", e);
      }
    }

    // Return the shape that cart.js placeOrder() expects
    return {
      orderId,
      status: isCod ? 'confirmed' : 'pending_payment',
      codCode: isCod ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
      payment: isCod ? null : {
        type: pType,
        token: `dummy-token-${orderId}`,
        autoConfirm: false
      },
      expiresAt
    };
  },

  async getOrder(orderId) {
    await delay(200);
    const orders = Utils.storage.get('orders', []);
    return orders.find(o => o.id === orderId) || null;
  },

  async getMyOrders() {
    await delay(300);
    return Utils.storage.get('orders', []);
  },

  // Simulating dummy pay 
  async simulatePayment(orderId) {
    await delay(800);
    const orders = Utils.storage.get('orders', []);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      orders[idx].status = 'paid';
      Utils.storage.set('orders', orders);
      return true;
    }
    return false;
  }
};

window.API = {
  loadInitialData: async () => {},
  getReviews: (id) => ApiService.fetchProductReviews(id),
  createOrder: async (payload) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create order on backend');
      }
      return await res.json();
    } catch (err) {
      console.error('API Error:', err);
      // Fallback to mock if backend is down
      return ApiService.createOrder(payload);
    }
  },
  getOrderStatus: async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // ignore fallback
    }
    const order = await ApiService.getOrder(id);
    return { status: order ? order.status : 'unknown' };
  }
};


