const https = require('https');
const token = '8665953439:AAFgwJjbFXLRFoBv4nMsNCvRjgfa5OpNeOs';
const chatId = '-1003254032263';

const message = 'TEST: Backend Telegram Bot aktif dan siap menerima order baru!';

const data = JSON.stringify({
  chat_id: chatId,
  text: message
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '/bot' + token + '/sendMessage',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log('OK:', result.ok);
    if (!result.ok) {
      console.log('Error:', result.description);
    } else {
      console.log('Message sent to chat:', result.result.chat.title || result.result.chat.id);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
