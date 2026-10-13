const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = '8665953439:AAFgwJjbFXLRFoBv4nMsNCvRjgfa5OpNeOs';
const API_JS_PATH = path.join(__dirname, '..', 'frontend', 'js', 'api.js');

console.log('Menunggu pesan dari grup SpareMotorGrup...');

let attempts = 0;
const MAX_ATTEMPTS = 600; // 10 minutes (2s interval)

function poll() {
  https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.ok && json.result.length > 0) {
          // Find a group message
          const msg = json.result.find(r => r.message && (r.message.chat.type === 'group' || r.message.chat.type === 'supergroup'));
          if (msg) {
            const chatId = msg.message.chat.id;
            console.log(`Berhasil mendapatkan Chat ID: ${chatId}`);
            
            // Edit frontend/js/api.js to include telegram logic
            let apiJs = fs.readFileSync(API_JS_PATH, 'utf8');
            
            // Check if telegram logic is already there
            if (!apiJs.includes('// === NOTIFIKASI TELEGRAM ===')) {
              const replacement = `
    const expiresAt = isCod ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // === NOTIFIKASI TELEGRAM ===
    try {
      const botToken = "${TOKEN}";
      const chatId = "${chatId}";
      const customer = orderData.customer || {};
      const itemsText = orderData.items ? orderData.items.map((i, idx) => \`\${idx+1}. \${i.name} (x\${i.qty}) = Rp \${(i.price * i.qty).toLocaleString('id-ID')}\`).join('\\n') : '';
      const totalStr = orderData.totalAmount ? orderData.totalAmount.toLocaleString('id-ID') : '0';
      const shippingStr = orderData.shipping ? \`\${orderData.shipping.name} (Rp \${orderData.shipping.cost.toLocaleString('id-ID')})\` : '-';
      
      const message = \`🛒 *ORDER BARU MASUK!*\\n\\n📋 *No. Pesanan:*\\n\${orderId}\\n👤 *Nama:* \${customer.name || '-'}\\n📱 *HP:* \${customer.phone || '-'}\\n📍 *Alamat:* \${customer.address || '-'}\\n\\n📦 *Detail Produk:*\\n\${itemsText}\\n\\n🚚 *Pengiriman:* \${shippingStr}\\n💳 *Pembayaran:* \${pType.toUpperCase()}\\n💰 *TOTAL: Rp \${totalStr}*\\n⏳ *Status:* Menunggu Pembayaran\\n⏰ *Waktu:* \${new Date().toLocaleString('id-ID')}\`;

      fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
      }).catch(err => console.error("Telegram send error:", err));
    } catch (e) {
      console.error("Failed to send telegram", e);
    }
`;
              apiJs = apiJs.replace("const expiresAt = isCod ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString();", replacement);
              fs.writeFileSync(API_JS_PATH, apiJs);
              console.log('Berhasil menyisipkan kode Telegram ke frontend/js/api.js!');
            }
            process.exit(0);
          }
        }
      } catch (e) {
        console.error('Error parsing:', e);
      }
      
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      } else {
        console.log('Timeout menunggu pesan.');
        process.exit(1);
      }
    });
  }).on('error', (e) => {
    console.error('Network error:', e);
    setTimeout(poll, 2000);
  });
}

poll();
