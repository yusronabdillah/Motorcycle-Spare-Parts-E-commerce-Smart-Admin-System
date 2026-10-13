const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = TelegramBotModule.default || TelegramBotModule;
const orders = require('./orderStore');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID || '-5118620817';

let bot = null;

function formatRupiah(num) {
  if (num === undefined || num === null || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

if (token) {
  bot = new TelegramBot(token, { polling: true });

  console.log('[Telegram Bot] ✅ Initialized and polling started.');
  console.log('[Telegram Bot] Chat ID:', chatId);

  // Listen for callback queries from inline keyboards
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const msg = query.message;

    if (!data) return;

    try {
      const adminName = (query.from.first_name || 'Admin') + (query.from.last_name ? ' ' + query.from.last_name : '');

      if (data.startsWith('approve:')) {
        const orderId = data.substring(8);
        let order = orders.find(o => o.orderId === orderId);
        
        if (!order) {
          order = { orderId, status: 'paid', paidAt: new Date() };
          orders.push(order);
        } else {
          order.status = 'paid';
          order.paidAt = new Date();
        }
        
        await bot.answerCallbackQuery(query.id, { text: '✅ Pembayaran Diterima!' });
        
        const originalText = msg.caption || msg.text || '';
        const newText = originalText.replace(/🟡 MENUNGGU VERIFIKASI ADMIN|🟡 MENUNGGU PEMBAYARAN QRIS|🟡 MENUNGGU PEMBAYARAN/g, '🟢 PEMBAYARAN DITERIMA') + 
          '\n\n✅ PEMBAYARAN DITERIMA' +
          '\nAdmin: ' + adminName +
          '\nWaktu: ' + new Date().toLocaleString('id-ID') +
          '\nStatus: SEDANG DIPROSES';
        
        if (msg.photo || msg.document) {
          await bot.editMessageCaption(newText, {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] }
          });
        } else {
          await bot.editMessageText(newText, {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] }
          });
        }
      }

      if (data.startsWith('reject:')) {
        const orderId = data.substring(7);
        
        const reasonKeyboard = {
          inline_keyboard: [
            [{ text: '❌ Bukti tidak jelas', callback_data: 'r1:' + orderId }],
            [{ text: '❌ Nominal tidak sesuai', callback_data: 'r2:' + orderId }],
            [{ text: '❌ Bukti tidak valid', callback_data: 'r3:' + orderId }],
            [{ text: '❌ Transfer tidak ditemukan', callback_data: 'r4:' + orderId }]
          ]
        };

        await bot.editMessageReplyMarkup(reasonKeyboard, {
          chat_id: msg.chat.id,
          message_id: msg.message_id
        });
        await bot.answerCallbackQuery(query.id, { text: 'Pilih alasan penolakan:' });
      }

      const reasonMap = {
        'r1': 'Bukti tidak jelas',
        'r2': 'Nominal tidak sesuai',
        'r3': 'Bukti tidak valid',
        'r4': 'Transfer tidak ditemukan'
      };

      for (const [prefix, reasonText] of Object.entries(reasonMap)) {
        if (data.startsWith(prefix + ':')) {
          const orderId = data.substring(prefix.length + 1);
          let order = orders.find(o => o.orderId === orderId);
          
          if (!order) {
            order = { orderId, status: 'rejected', rejectedAt: new Date(), rejectionReason: reasonText };
            orders.push(order);
          } else {
            order.status = 'rejected';
            order.rejectedAt = new Date();
            order.rejectionReason = reasonText;

            // Restore stock if items exist
            if (order.items && Array.isArray(order.items)) {
              try {
                const db = require('../db');
                order.items.forEach(item => {
                  const product = db.PRODUCTS.find(p => p.id === item.id || p.sku === item.id);
                  if (product) {
                    product.stock += item.qty;
                    if (product.stock > 0) product.stockStatus = 'ready';
                  }
                });
              } catch (e) {
                console.error('Error restoring stock on rejection:', e);
              }
            }
          }
          
          await bot.answerCallbackQuery(query.id, { text: '❌ Ditolak: ' + reasonText });

          const originalText = msg.caption || msg.text || '';
          const newText = originalText.replace(/🟡 MENUNGGU VERIFIKASI ADMIN|🟡 MENUNGGU PEMBAYARAN QRIS|🟡 MENUNGGU PEMBAYARAN/g, '🔴 PEMBAYARAN DITOLAK') + 
            '\n\n❌ PEMBAYARAN DITOLAK' +
            '\nAlasan: ' + reasonText +
            '\nAdmin: ' + adminName +
            '\nWaktu: ' + new Date().toLocaleString('id-ID');
          
          if (msg.photo || msg.document) {
            await bot.editMessageCaption(newText, {
              chat_id: msg.chat.id,
              message_id: msg.message_id,
              reply_markup: { inline_keyboard: [] }
            });
          } else {
            await bot.editMessageText(newText, {
              chat_id: msg.chat.id,
              message_id: msg.message_id,
              reply_markup: { inline_keyboard: [] }
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Telegram Bot] Callback error:', err.message);
      try {
        await bot.answerCallbackQuery(query.id, { text: 'Terjadi error, coba lagi.', show_alert: true });
      } catch(e) {}
    }
  });

  bot.on('polling_error', (error) => {
    console.error('[Telegram Polling Error]', error.code, error.response?.body || error.message);
  });
} else {
  console.warn('[Telegram Bot] ⚠️ TELEGRAM_BOT_TOKEN is not set in .env. Bot is DISABLED.');
}

// Function to send order notification
async function sendOrderNotification(order, base64Proof = null) {
  console.log('[Telegram Bot] CHECKOUT_RECEIVED. Data order:', order.orderId);
  if (!bot) {
    console.warn('[Telegram Bot] Bot not initialized, skipping notification.');
    return;
  }
  if (!chatId) {
    console.warn('[Telegram Bot] No chat ID, skipping notification.');
    return;
  }

  const isBNI = order.paymentMethod === 'bni';
  const isQRIS = order.paymentMethod === 'qris';
  const isCOD = order.paymentMethod === 'cod';

  let statusText = '';
  if (isBNI) statusText = '🟡 MENUNGGU VERIFIKASI ADMIN';
  else if (isQRIS && base64Proof) statusText = '🟡 MENUNGGU VERIFIKASI ADMIN (BUKTI QRIS TERLAMPIR)';
  else if (isQRIS) statusText = '🟡 MENUNGGU PEMBAYARAN QRIS';
  else if (isCOD) statusText = '✅ COD - Bayar di Tempat';
  else statusText = '🟡 MENUNGGU PEMBAYARAN';

  // Format the item list with safe price formatting
  const itemsText = order.items.map((it, i) => {
    const price = Number(it.unitPrice) || 0;
    const qty = Number(it.qty) || 0;
    const lineTotal = price * qty;
    return `${i + 1}. ${it.name}\n   Qty: ${qty} x ${formatRupiah(price)} = ${formatRupiah(lineTotal)}`;
  }).join('\n');

  const paymentDetail = isBNI 
    ? '🏦 Transfer Bank BNI\nRekening: 0888888685\nBank Negara Indonesia\nAtas Nama: Erson' 
    : (isQRIS ? '📱 QRIS (Semua Payment)' : '💵 Cash on Delivery (COD)');

  const headerText = base64Proof ? '🧾 BUKTI PEMBAYARAN DITERIMA' : '🛒 ORDER BARU MASUK';

  const message = headerText + '\n\n' +
    '📄 No Order:\n' + order.orderId + '\n\n' +
    '👤 Nama Customer:\n' + order.customer.name + '\n\n' +
    '📱 Nomor HP:\n' + order.customer.phone + '\n\n' +
    '📍 Alamat:\n' + order.customer.address + '\n\n' +
    '📝 Catatan Penjual:\n' + (order.notes || order.customer.notes || '-') + '\n\n' +
    '━━━━━━━━━━━━━━\n\n' +
    '📦 Produk:\n' + itemsText + '\n\n' +
    '━━━━━━━━━━━━━━\n\n' +
    '💳 Metode Pembayaran:\n' + paymentDetail + '\n\n' +
    '━━━━━━━━━━━━━━\n\n' +
    '💰 Total Pembayaran:\n' + formatRupiah(order.totalAmount) + '\n\n' +
    '━━━━━━━━━━━━━━\n\n' +
    'Status:\n' + statusText;

  // Inline keyboard — only for BNI and QRIS
  // callback_data format: "approve:ORD-xxx" or "reject:ORD-xxx"
  const replyMarkup = (isBNI || isQRIS) ? {
    inline_keyboard: [
      [{ text: '✅ TERIMA PEMBAYARAN', callback_data: 'approve:' + order.orderId }],
      [{ text: '❌ TOLAK PEMBAYARAN', callback_data: 'reject:' + order.orderId }]
    ]
  } : undefined;

  try {
    if ((isBNI || isQRIS) && base64Proof) {
      console.log('[Telegram Bot] PAYMENT_PROOF_UPLOADED');
      // Decode Base64 proof
      const matches = base64Proof.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        
        if (mimeType === 'application/pdf') {
          console.log('[Telegram Bot] TELEGRAM_DOCUMENT_SENT initializing...');
          await bot.sendDocument(chatId, buffer, {
            caption: message,
            reply_markup: replyMarkup
          }, { filename: 'Bukti_' + order.orderId + '.pdf', contentType: mimeType });
        } else {
          console.log('[Telegram Bot] TELEGRAM_PHOTO_SENT initializing...');
          await bot.sendPhoto(chatId, buffer, {
            caption: message,
            reply_markup: replyMarkup
          }, { filename: 'Bukti_' + order.orderId + '.jpg', contentType: mimeType });
        }
        console.log('[Telegram Bot] TELEGRAM_SUCCESS');
        return;
      }
    }
    
    // Send text-only message (QRIS, COD, or BNI without proof)
    console.log('[Telegram Bot] TELEGRAM_MESSAGE_SENT initializing...');
    await bot.sendMessage(chatId, message, {
      reply_markup: replyMarkup
    });
    console.log('[Telegram Bot] TELEGRAM_SUCCESS');
  } catch (err) {
    console.error('[Telegram Bot] TELEGRAM_FAILED:', err.message);
  }
}

module.exports = {
  sendOrderNotification
};
