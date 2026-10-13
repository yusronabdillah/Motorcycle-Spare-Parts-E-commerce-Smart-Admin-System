const fs = require('fs');

const raw = fs.readFileSync('js/mock_db.js', 'utf8');

const targetStr = `const SHIPPING_OPTIONS = [
  { id: 'ojol', name: 'Ojek Online', desc: 'Estimasi 1-2 jam (area kota)', price: 15000, icon: '🛵' },
  { id: 'jnt-jne', name: 'J&T / JNE', desc: 'Estimasi 2-4 hari kerja', price: 12000, icon: '📦' },
  { id: 'pickup', name: 'Ambil di Toko', desc: 'Gratis – ambil langsung di toko', price: 0, icon: '🏪' },
];`;

const replacementStr = `const SHIPPING_OPTIONS = [
  { id: 'ojol', name: 'Ojek Online', desc: 'Estimasi 1-2 jam (area kota)', price: 15000, icon: '🛵' },
  { id: 'jnt-jne', name: 'J&T / JNE', desc: 'Estimasi 2-4 hari kerja', price: 12000, icon: '📦' },
  { id: 'pickup', name: 'Ambil di Toko', desc: 'Gratis – ambil langsung di toko', price: 0, icon: '🏪' },
];

const ACTIVE_PAYMENTS = [
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

if (raw.includes("const ACTIVE_PAYMENTS")) {
    console.log("ACTIVE_PAYMENTS already exists.");
} else {
    // We will use regex to replace to avoid encoding or line ending issues
    const regex = /const SHIPPING_OPTIONS = \[\s*\{ id: 'ojol',[^\]]+\];/;
    const newRaw = raw.replace(regex, replacementStr);
    if(newRaw !== raw) {
        fs.writeFileSync('js/mock_db.js', newRaw, 'utf8');
        console.log('ACTIVE_PAYMENTS added to mock_db.js');
    } else {
        console.log('Failed to find SHIPPING_OPTIONS to replace.');
    }
}
