const fs = require('fs');
let content = fs.readFileSync('js/mock_db.js', 'utf8');

// Find the ACTIVE_PAYMENTS block
const startIndex = content.indexOf('const ACTIVE_PAYMENTS = [');
const endIndex = content.indexOf('];', startIndex) + 2;

if (startIndex > -1 && endIndex > -1) {
  const replacement = `const ACTIVE_PAYMENTS = [
  {
    id: 'qris',
    shortName: 'QRIS (Semua Payment)',
    name: 'QRIS (Semua E-Wallet & M-Banking)',
    icon: '📱',
    desc: 'Bisa bayar menggunakan GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, dan lainnya. QR Code akan muncul setelah Anda klik Buat Pesanan.',
    footerDesc: 'Mendukung GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin Mandiri, BRImo, dan aplikasi QRIS lainnya.'
  },
  {
    id: 'cod',
    shortName: 'COD (Bayar di Tempat)',
    name: 'Cash on Delivery (COD)',
    icon: '💵',
    desc: 'Bayar tunai langsung ke kurir saat barang diterima. Anda akan menerima kode unik pembayaran.',
    footerDesc: 'Bayar tunai langsung saat pesanan tiba.'
  }
];`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('js/mock_db.js', content, 'utf8');
  console.log("Successfully fixed ACTIVE_PAYMENTS in mock_db.js");
} else {
  console.log("Could not find ACTIVE_PAYMENTS block.");
}
