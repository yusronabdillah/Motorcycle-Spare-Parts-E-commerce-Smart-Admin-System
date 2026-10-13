const db = require('../db');
const paymentService = require('../services/payment.service');
const orders = require('../services/orderStore');

exports.getShippingOptions = (req, res) => {
  res.json(db.SHIPPING_OPTIONS);
};

exports.getPaymentOptions = (req, res) => {
  res.json({
    ewallet: db.EWALLET_OPTIONS,
    bank: db.BANK_OPTIONS
  });
};

// Generate 6 digit unique COD code
function generateCODCode() {
  return 'COD-' + Math.floor(100000 + Math.random() * 900000);
}

exports.createOrder = async (req, res) => {
  console.log('\n========================================');
  console.log('[CHECKOUT START] Request received at', new Date().toLocaleString('id-ID'));
  console.log('[CHECKOUT START] Body keys:', Object.keys(req.body));
  console.log('[CHECKOUT START] Payment method:', req.body.paymentMethod);
  console.log('[CHECKOUT START] Items count:', req.body.items?.length);
  console.log('[CHECKOUT START] Has paymentProof:', !!req.body.paymentProof);
  console.log('========================================\n');

  const { customer, items, shippingId, paymentMethod, subtotal, totalAmount, paymentProof } = req.body;

  // Basic validation
  if (!items || items.length === 0) {
    console.log('[VALIDATION FAILED] Cart is empty');
    return res.status(400).json({ error: 'Cart is empty' });
  }
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    console.log('[VALIDATION FAILED] Data pengiriman tidak lengkap. Customer:', JSON.stringify(customer));
    return res.status(400).json({ error: 'Data pengiriman tidak lengkap' });
  }

  // Phone validation: only digits, 10-15 length
  const cleanPhone = customer.phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    console.log('[VALIDATION FAILED] Nomor HP invalid:', customer.phone, '-> cleaned:', cleanPhone);
    return res.status(400).json({ error: 'Nomor HP harus 10-15 digit' });
  }

  const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  console.log('[ORDER CREATED]', orderId);
  
  // Stock validation inside DB
  for (let item of items) {
    const product = db.PRODUCTS.find(p => p.id === item.id || p.sku === item.id);
    if (!product || product.stock < item.qty) {
      console.log('[VALIDATION FAILED] Stok tidak cukup untuk', item.name, '| item.id:', item.id, '| product found:', !!product, '| stock:', product?.stock, '| qty requested:', item.qty);
      return res.status(400).json({ error: `Stok tidak cukup untuk ${item.name}` });
    }
  }

  // Deduct stock temporarily
  items.forEach(item => {
    const product = db.PRODUCTS.find(p => p.id === item.id || p.sku === item.id);
    product.stock -= item.qty;
    if (product.stock <= 0) product.stockStatus = 'habis';
  });

  // 15 minute payment deadline
  const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

  const newOrder = {
    orderId,
    customer,
    items,
    shippingId,
    paymentMethod,
    subtotal,
    totalAmount,
    notes: req.body.notes || customer.notes || '',
    status: paymentMethod === 'cod' ? 'confirmed' : (paymentMethod === 'bni' ? 'waiting_verification' : 'pending_payment'),
    codCode: paymentMethod === 'cod' ? generateCODCode() : null,
    createdAt: new Date(),
    expiresAt: (paymentMethod === 'cod' || paymentMethod === 'bni') ? null : new Date(Date.now() + PAYMENT_TIMEOUT_MS)
  };

  orders.push(newOrder);
  console.log('[SAVE SUCCESS] Order', orderId, 'saved. Total orders in memory:', orders.length);

  // Generate Payment Gateway Link / Token
  let paymentDetails = null;
  if (paymentMethod !== 'cod') {
    try {
      paymentDetails = await paymentService.generatePayment(newOrder);
    } catch (err) {
      console.error('[PAYMENT ERROR]', err);
    }
  }

  // Set timeout for expiration (15 minutes) — only for non-COD
  if (paymentMethod !== 'cod') {
    setTimeout(() => {
      const order = orders.find(o => o.orderId === orderId);
      if (order && order.status === 'pending_payment') {
        order.status = 'expired';
        // Restore stock
        items.forEach(item => {
          const product = db.PRODUCTS.find(p => p.id === item.id || p.sku === item.id);
          if (product) {
            product.stock += item.qty;
            if (product.stock > 0) product.stockStatus = 'ready';
          }
        });
        console.log(`Order ${orderId} automatically expired after 15 minutes.`);
      }
    }, PAYMENT_TIMEOUT_MS);
  }

  // Kirim Notifikasi Telegram (lazy require to avoid circular dep)
  console.log('[TELEGRAM SEND START] Triggering sendOrderNotification for', orderId);
  const telegramBot = require('../services/telegram.bot');
  telegramBot.sendOrderNotification(newOrder, paymentProof).then(() => {
    console.log('[TELEGRAM SEND COMPLETE] Notification process finished for', orderId);
  }).catch(err => {
    console.error('[TELEGRAM ERROR] Failed for', orderId, ':', err.message);
  });

  const responseData = {
    message: 'Order created',
    orderId,
    totalAmount,
    payment: paymentDetails,
    codCode: newOrder.codCode,
    expiresAt: newOrder.expiresAt,
    status: newOrder.status
  };
  console.log('[RESPONSE SENT] Sending 201 response:', JSON.stringify(responseData).substring(0, 200));
  res.status(201).json(responseData);
};

exports.getOrderStatus = (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({
    orderId: order.orderId,
    status: order.status,
    totalAmount: order.totalAmount,
    codCode: order.codCode,
    expiresAt: order.expiresAt,
    items: order.items,
    rejectionReason: order.rejectionReason || null
  });
};

exports.getAllOrders = (req, res) => {
  res.json(orders);
};

exports.simulatePay = (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (order && order.status === 'pending_payment') {
    order.status = 'paid';
    order.paidAt = new Date();
    return res.json({ success: true, status: 'paid' });
  }
  if (order && order.status === 'paid') {
    return res.json({ success: true, status: 'paid', message: 'Already paid' });
  }
  return res.status(404).json({ error: 'Order not found or cannot be paid' });
};

// Export to be used by webhook
exports.updateOrderStatus = (orderId, status) => {
  const order = orders.find(o => o.orderId === orderId);
  if (order) {
    order.status = status;
    if (status === 'paid') order.paidAt = new Date();
    return true;
  }
  return false;
};

exports.uploadProof = async (req, res) => {
  const { paymentProof } = req.body;
  const orderId = req.params.orderId;
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'waiting_verification';
  if (paymentProof) {
    order.paymentProof = paymentProof;
  }

  // Send Telegram Notification with proof
  const telegramBot = require('../services/telegram.bot');
  telegramBot.sendOrderNotification(order, paymentProof).then(() => {
    console.log('[TELEGRAM PROOF SENT] Proof notification finished for', orderId);
  }).catch(err => {
    console.error('[TELEGRAM PROOF ERROR]', err.message);
  });

  res.json({ success: true, status: 'waiting_verification' });
};
