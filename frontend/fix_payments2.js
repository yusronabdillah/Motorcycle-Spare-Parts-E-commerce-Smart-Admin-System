const fs = require('fs');

let content = fs.readFileSync('js/mock_db.js', 'utf8');

const startIndex = content.indexOf('const ACTIVE_PAYMENTS = [');
const endIndex = content.indexOf('];', startIndex) + 2;

if (startIndex > -1 && endIndex > -1) {
  const replacement = `const ACTIVE_PAYMENTS = [
  {
    id: 'qris',
    shortName: 'QRIS (Semua Payment)',
    name: 'QRIS (Semua E-Wallet & M-Banking)',
    icon: '\\uD83D\\uDCF1',
    desc: 'Bisa bayar menggunakan GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, dan lainnya. QR Code akan muncul setelah Anda klik Buat Pesanan.',
    footerDesc: 'Mendukung GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin Mandiri, BRImo, dan aplikasi QRIS lainnya.'
  },
  {
    id: 'cod',
    shortName: 'COD (Bayar di Tempat)',
    name: 'Cash on Delivery (COD)',
    icon: '\\uD83D\\uDCB5',
    desc: 'Bayar tunai langsung ke kurir saat barang diterima. Anda akan menerima kode unik pembayaran.',
    footerDesc: 'Bayar tunai langsung saat pesanan tiba.'
  }
];`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('js/mock_db.js', content, 'utf8');
  console.log("Successfully fixed ACTIVE_PAYMENTS encoding in mock_db.js");
} else {
  console.log("Could not find ACTIVE_PAYMENTS block.");
}

// BUMP CACHE IN index.html
let indexContent = fs.readFileSync('index.html', 'utf8');
indexContent = indexContent.replace(/v=45/g, 'v=46');
fs.writeFileSync('index.html', indexContent, 'utf8');
console.log("Successfully bumped cache to v=46");
