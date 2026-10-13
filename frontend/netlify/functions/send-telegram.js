let fetchUrl;
try {
  fetchUrl = require('node-fetch');
} catch (e) {
  fetchUrl = fetch; // Use global fetch in Node 18+
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const orderData = body.orderPayload || body; // Support both wrapped and unwrapped payloads
    
    console.log('[Telegram] CHECKOUT_RECEIVED. Data:', JSON.stringify(orderData).substring(0, 100) + '...');
    
    // BOT TOKEN & CHAT ID DETECTION
    // Gunakan environment variable Netlify. Jika tidak ada, gunakan token hardcoded untuk fallback sementara.
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8665953439:AAFgwJjbFXLRFoBv4nMsNCvRjgfa5OpNeOs';
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5118620817';

    if (!BOT_TOKEN) {
      console.error('[Telegram] BOT TOKEN TELEGRAM BELUM DIKONFIGURASI');
      return { statusCode: 500, body: JSON.stringify({ error: 'BOT TOKEN TELEGRAM BELUM DIKONFIGURASI' }) };
    }
    if (!CHAT_ID) {
      console.error('[Telegram] CHAT ID TELEGRAM TIDAK VALID');
      return { statusCode: 500, body: JSON.stringify({ error: 'CHAT ID TELEGRAM TIDAK VALID' }) };
    }

    // Parse Data
    const customer = orderData.customer || {};
    const items = orderData.items || [];
    const isBNI = orderData.paymentMethod === 'bni';
    const isQRIS = orderData.paymentMethod === 'qris';
    const isCOD = orderData.paymentMethod === 'cod';

    let statusText = '';
    if (isBNI) statusText = '🟡 MENUNGGU VERIFIKASI ADMIN';
    else if (isQRIS) statusText = '🟡 MENUNGGU PEMBAYARAN QRIS';
    else if (isCOD) statusText = '✅ COD - Bayar di Tempat';
    else statusText = '🟡 MENUNGGU PEMBAYARAN';

    const formatRupiah = (num) => {
      if (isNaN(num)) return 'Rp 0';
      return 'Rp ' + Number(num).toLocaleString('id-ID');
    };

    const itemsText = items.map((it, i) => {
      const price = Number(it.unitPrice) || 0;
      const qty = Number(it.qty) || 0;
      return `${i + 1}. ${it.name}\n   Qty: ${qty} x ${formatRupiah(price)} = ${formatRupiah(price * qty)}`;
    }).join('\n');

    const paymentDetail = isBNI 
      ? '🏦 Transfer Bank BNI\nRekening: 0888888685\nBank Negara Indonesia\nAtas Nama: Erson' 
      : (isQRIS ? '📱 QRIS (Semua Payment)' : '💵 Cash on Delivery (COD)');

    // Generate Order ID if not provided
    const orderId = orderData.orderId || 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    console.log('[Telegram] ORDER_CREATED:', orderId);

    const message = '🛒 ORDER BARU MASUK\n\n' +
      '📄 No Order:\n' + orderId + '\n\n' +
      '👤 Nama Customer:\n' + (customer.name || '-') + '\n\n' +
      '📱 Nomor HP:\n' + (customer.phone || '-') + '\n\n' +
      '📍 Alamat:\n' + (customer.address || '-') + '\n\n' +
      '📝 Catatan Penjual:\n' + (orderData.notes || customer.notes || '-') + '\n\n' +
      '━━━━━━━━━━━━━━\n\n' +
      '📦 Produk:\n' + itemsText + '\n\n' +
      '━━━━━━━━━━━━━━\n\n' +
      '💳 Metode Pembayaran:\n' + paymentDetail + '\n\n' +
      '━━━━━━━━━━━━━━\n\n' +
      '💰 Total Pembayaran:\n' + formatRupiah(orderData.totalAmount) + '\n\n' +
      '━━━━━━━━━━━━━━\n\n' +
      'Status:\n' + statusText + '\n\n' +
      'Waktu: ' + new Date().toLocaleString('id-ID');

    // Handle Image/PDF Upload (paymentProof)
    if (isBNI && orderData.paymentProof) {
      console.log('[Telegram] PAYMENT_PROOF_UPLOADED detected.');
      const base64Proof = orderData.paymentProof;
      const matches = base64Proof.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const isPdf = mimeType === 'application/pdf';

        // Prepare FormData for Telegram API
        // For Netlify Functions, constructing multipart/form-data manually or using node-fetch can be tricky.
        // We will send the file to Telegram by sending it as a URL or a direct buffer via form-data.
        // Wait, Node.js 18+ fetch supports Blob/FormData.
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        let requestBody = '';
        
        requestBody += `--${boundary}\r\n`;
        requestBody += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`;
        
        requestBody += `--${boundary}\r\n`;
        requestBody += `Content-Disposition: form-data; name="caption"\r\n\r\n${message}\r\n`;
        
        requestBody += `--${boundary}\r\n`;
        const filename = isPdf ? 'Bukti_Pembayaran.pdf' : 'Bukti_Pembayaran.jpg';
        requestBody += `Content-Disposition: form-data; name="${isPdf ? 'document' : 'photo'}"; filename="${filename}"\r\n`;
        requestBody += `Content-Type: ${mimeType}\r\n\r\n`;
        
        const payloadBuffer = Buffer.concat([
          Buffer.from(requestBody, 'utf-8'),
          Buffer.from(base64Data, 'base64'),
          Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
        ]);

        const endpoint = isPdf ? 'sendDocument' : 'sendPhoto';
        console.log(`[Telegram] TELEGRAM_${isPdf ? 'DOCUMENT' : 'PHOTO'}_SENT initializing...`);
        
        // global fetch
        const response = await fetchUrl(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': payloadBuffer.length
          },
          body: payloadBuffer
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          console.error('[Telegram] TELEGRAM_FAILED:', result.description);
          return { statusCode: 500, body: JSON.stringify({ error: 'TELEGRAM_FAILED', detail: result.description }) };
        }
        console.log('[Telegram] TELEGRAM_SUCCESS');
        return { statusCode: 200, body: JSON.stringify({ message: 'Notifikasi & Bukti terkirim', orderId }) };
      }
    }

    // Fallback or No Proof: Send as Text
    console.log('[Telegram] TELEGRAM_MESSAGE_SENT initializing...');
    const textResponse = await fetchUrl(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    const textResult = await textResponse.json();
    if (!textResponse.ok || !textResult.ok) {
       console.error('[Telegram] TELEGRAM_FAILED:', textResult.description);
       return { statusCode: 500, body: JSON.stringify({ error: 'TELEGRAM_FAILED', detail: textResult.description }) };
    }
    
    console.log('[Telegram] TELEGRAM_SUCCESS');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notifikasi terkirim', orderId })
    };
    
  } catch (error) {
    console.error('[Telegram] Error Fatal:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Gagal kirim notifikasi', detail: error.message })
    };
  }
};
