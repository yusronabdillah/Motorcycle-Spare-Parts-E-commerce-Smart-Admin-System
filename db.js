// ============================================
// MotoSpare — Product Database + Reviews + Shipping
// ============================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let CATEGORIES = [];
let PRODUCTS = [];

function loadDatabase() {
  const mockDbPath = path.join(__dirname, '..', 'frontend', 'js', 'mock_db.js');
  let code = fs.readFileSync(mockDbPath, 'utf-8');
  code = code.replace(/^const /gm, 'var ');
  code = code.replace(/^let /gm, 'var ');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  PRODUCTS = sandbox.PRODUCTS || [];
  CATEGORIES = sandbox.CATEGORIES || [];
}

loadDatabase();




// Shipping options — UPDATED per requirement
const SHIPPING_OPTIONS = [
  { id: 'ojol', name: 'Ojek Online', desc: 'Estimasi 1-3 jam (area kota)', price: 15000, icon: '🏍️' },
  { id: 'jnt-jne', name: 'J&T / JNE', desc: 'Estimasi 2-4 hari kerja', price: 12000, icon: '📦' },
  { id: 'pickup', name: 'Ambil di Toko', desc: 'Gratis — ambil langsung di toko', price: 0, icon: '🏪' },
];

// E-Wallet options
const EWALLET_OPTIONS = [
  { id: 'gopay', name: 'GoPay', icon: '💚', number: '0812-3456-7890', instructions: [
    'Buka aplikasi Gojek atau GoPay',
    'Pilih menu "Bayar" atau scan QR Code',
    'Masukkan nomor tujuan: <strong>0812-3456-7890</strong> (a.n. MotoSpare)',
    'Masukkan jumlah pembayaran sesuai total pesanan',
    'Periksa kembali detail pembayaran',
    'Masukkan PIN GoPay Anda',
    'Pembayaran akan otomatis terverifikasi'
  ]},
  { id: 'ovo', name: 'OVO', icon: '💜', number: '0812-3456-7890', instructions: [
    'Buka aplikasi OVO',
    'Pilih menu "Transfer" → "Ke Sesama OVO"',
    'Masukkan nomor tujuan: <strong>0812-3456-7890</strong> (a.n. MotoSpare)',
    'Masukkan jumlah pembayaran sesuai total pesanan',
    'Periksa kembali detail pembayaran',
    'Masukkan PIN OVO Anda untuk konfirmasi',
    'Pembayaran akan otomatis terverifikasi'
  ]},
  { id: 'dana', name: 'DANA', icon: '💙', number: '0812-3456-7890', instructions: [
    'Buka aplikasi DANA',
    'Pilih menu "Kirim" di halaman utama',
    'Masukkan nomor tujuan: <strong>0812-3456-7890</strong> (a.n. MotoSpare)',
    'Masukkan jumlah pembayaran sesuai total pesanan',
    'Tambahkan catatan: Nomor pesanan Anda',
    'Klik "Kirim" dan masukkan PIN DANA',
    'Pembayaran akan otomatis terverifikasi'
  ]},
  { id: 'shopeepay', name: 'ShopeePay', icon: '🧡', number: '0812-3456-7890', instructions: [
    'Buka aplikasi Shopee',
    'Pilih "ShopeePay" → "Transfer"',
    'Masukkan nomor tujuan: <strong>0812-3456-7890</strong> (a.n. MotoSpare)',
    'Masukkan jumlah sesuai total pesanan',
    'Periksa kembali detail pembayaran',
    'Klik "Transfer" dan masukkan PIN ShopeePay',
    'Pembayaran akan otomatis terverifikasi'
  ]},
  { id: 'qris', name: 'QRIS', icon: '📱', number: '-', instructions: [
    'Buka aplikasi E-Wallet atau M-Banking Anda yang support QRIS',
    'Pilih menu "Scan QR" atau "Bayar dengan QR"',
    'Scan QR Code yang ditampilkan di halaman pembayaran',
    'Jumlah pembayaran akan otomatis terisi sesuai total pesanan',
    'Periksa kembali nama merchant: <strong>MotoSpare</strong>',
    'Konfirmasi pembayaran dengan PIN/Biometrik',
    'Pembayaran akan otomatis terverifikasi'
  ]}
];

// Bank Transfer / VA options
const BANK_OPTIONS = [
  { id: 'bca', name: 'Bank BCA', icon: '🏦', color: '#003399', va: '8800 1234 5678 901', holder: 'MotoSpare Official', instructions: [
    'Login ke KlikBCA / m-BCA / ATM BCA',
    'Pilih menu <strong>"Transfer"</strong> → <strong>"Virtual Account"</strong>',
    'Masukkan nomor Virtual Account: <strong>8800 1234 5678 901</strong>',
    'Layar akan menampilkan detail: Nama = <strong>MotoSpare</strong>, Jumlah = sesuai total pesanan',
    'Pastikan nama dan jumlah sudah benar',
    'Masukkan PIN m-BCA / PIN ATM untuk konfirmasi',
    'Transaksi berhasil — pembayaran otomatis terverifikasi'
  ]},
  { id: 'bni', name: 'Bank BNI', icon: '🏦', color: '#F05A22', va: '8810 9876 5432 101', holder: 'MotoSpare Official', instructions: [
    'Login ke BNI Mobile Banking / Internet Banking / ATM BNI',
    'Pilih menu <strong>"Transfer"</strong> → <strong>"Virtual Account Billing"</strong>',
    'Masukkan nomor Virtual Account: <strong>8810 9876 5432 101</strong>',
    'Layar akan menampilkan detail pembayaran, pastikan nama = <strong>MotoSpare</strong>',
    'Pastikan jumlah pembayaran sesuai total pesanan Anda',
    'Masukkan password transaksi / PIN ATM',
    'Transaksi berhasil — pembayaran otomatis terverifikasi'
  ]},
  { id: 'bri', name: 'Bank BRI', icon: '🏦', color: '#00529C', va: '8820 5555 7777 201', holder: 'MotoSpare Official', instructions: [
    'Login ke BRImo / Internet Banking BRI / ATM BRI',
    'Pilih menu <strong>"Pembayaran"</strong> → <strong>"BRIVA"</strong>',
    'Masukkan nomor BRIVA: <strong>8820 5555 7777 201</strong>',
    'Detail pembayaran akan muncul: Nama = <strong>MotoSpare</strong>',
    'Pastikan jumlah yang tertera sesuai total pesanan',
    'Masukkan PIN BRImo / PIN ATM untuk proses',
    'Pembayaran berhasil — otomatis terverifikasi'
  ]},
  { id: 'mandiri', name: 'Bank Mandiri', icon: '🏦', color: '#003066', va: '8830 2222 8888 301', holder: 'MotoSpare Official', instructions: [
    'Login ke Livin\' by Mandiri / Internet Banking / ATM Mandiri',
    'Pilih menu <strong>"Bayar"</strong> → <strong>"Multipayment"</strong>',
    'Pilih penyedia jasa: <strong>MotoSpare</strong>',
    'Masukkan nomor Virtual Account: <strong>8830 2222 8888 301</strong>',
    'Detail tagihan akan muncul beserta jumlah pembayaran',
    'Pastikan nama dan jumlah sesuai pesanan Anda',
    'Masukkan PIN / MPIN untuk konfirmasi pembayaran'
  ]},
  { id: 'bjb', name: 'Bank BJB', icon: '🏦', color: '#1B3A6B', va: '8840 3333 6666 401', holder: 'MotoSpare Official', instructions: [
    'Login ke BJB DIGI / ATM BJB',
    'Pilih menu <strong>"Transfer"</strong> → <strong>"Virtual Account"</strong>',
    'Masukkan nomor Virtual Account: <strong>8840 3333 6666 401</strong>',
    'Detail pembayaran akan ditampilkan: Nama = <strong>MotoSpare</strong>',
    'Periksa jumlah pembayaran sesuai total pesanan',
    'Masukkan PIN untuk konfirmasi',
    'Transaksi berhasil — pembayaran otomatis terverifikasi'
  ]}
];

// Sample reviews per product
function generateReviews(productId) {
  const reviewPool = [
    { user: 'Budi S.', avatar: 'B', rating: 5, date: '2026-03-28', text: 'Barang sesuai deskripsi, packing rapi dan aman. Pengiriman cepat. Recommended seller!', helpful: 12 },
    { user: 'Andi P.', avatar: 'A', rating: 5, date: '2026-03-25', text: 'Kualitas bagus banget, pas dipasang langsung cocok. Harga juga lebih murah dari toko offline.', helpful: 8 },
    { user: 'Rina W.', avatar: 'R', rating: 4, date: '2026-03-20', text: 'Barang bagus, tapi pengiriman agak lama 4 hari. Overall puas sama kualitasnya.', helpful: 5 },
    { user: 'Dimas K.', avatar: 'D', rating: 5, date: '2026-03-15', text: 'Sudah 3x order di sini, selalu puas. Barangnya ori dan harga bersaing. Mantap!', helpful: 15 },
    { user: 'Sari M.', avatar: 'S', rating: 4, date: '2026-03-12', text: 'Beliin buat suami, katanya pas dan kualitas oke. Bakal order lagi.', helpful: 3 },
    { user: 'Fajar R.', avatar: 'F', rating: 5, date: '2026-03-10', text: 'Fast respon, barang dikemas dengan bubble wrap tebal. Part langsung dipasang, perfect fit!', helpful: 20 },
    { user: 'Hendra L.', avatar: 'H', rating: 3, date: '2026-03-08', text: 'Barangnya sih oke, cuma warna agak beda sedikit dari foto. Tapi fungsinya bagus.', helpful: 2 },
    { user: 'Yoga P.', avatar: 'Y', rating: 5, date: '2026-03-05', text: 'Top markotop! Spare part berkualitas harga terjangkau. Langsung pasang di bengkel, presisi!', helpful: 11 },
    { user: 'Agus T.', avatar: 'A', rating: 4, date: '2026-03-01', text: 'Produk sesuai ekspektasi, packaging aman. Semoga awet ya. Thanks MotoSpare!', helpful: 7 },
    { user: 'Rizki A.', avatar: 'R', rating: 5, date: '2026-02-28', text: 'Baru pertama kali beli online, ternyata mudah dan barangnya beneran bagus. Pasti balik lagi!', helpful: 9 },
    { user: 'Wawan H.', avatar: 'W', rating: 4, date: '2026-02-25', text: 'Sudah dipasang di motor, hasilnya oke. Cuma sarannya tambah variasi warna lagi.', helpful: 4 },
    { user: 'Toni B.', avatar: 'T', rating: 5, date: '2026-02-20', text: 'Seller ramah, bisa tanya-tanya dulu sebelum beli. Barang sampai dengan selamat, kualitas mantap.', helpful: 14 },
  ];

  // Use product ID to deterministically pick reviews
  const seed = parseInt(productId.replace(/\D/g, '')) || 0;
  const count = 3 + (seed % 4); // 3-6 reviews
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 3) % reviewPool.length;
    reviews.push({
      ...reviewPool[idx],
      id: `REV${productId}_${i}`,
      variant: i % 2 === 0 ? 'Standard' : null
    });
  }
  return reviews;
}



// Banner/Promo Data
const BANNERS = [
  { id: 1, title: 'FLASH SALE Spare Part Motor!', subtitle: 'Diskon hingga 50% untuk semua kategori', bgColor: 'linear-gradient(135deg, #EE4D2D 0%, #FF6633 100%)', textColor: '#fff' },
  { id: 2, title: 'Gratis Ongkir Min. Belanja 200rb', subtitle: 'Berlaku untuk pengiriman Standard ke semua area', bgColor: 'linear-gradient(135deg, #00BFA5 0%, #00E676 100%)', textColor: '#fff' },
  { id: 3, title: 'Part Racing Terbaru!', subtitle: 'CDI, Knalpot, Roller — langsung pasang!', bgColor: 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)', textColor: '#fff' },
];

const FLASH_SALE_IDS = ['SP00001', 'SP00004', 'SP00009', 'SP00023', 'SP00035', 'SP00047'];

// Collect all unique colors/sizes for filters
const ALL_COLORS = [...new Set(PRODUCTS.flatMap(p => p.colors || []))].filter(Boolean);
const ALL_SIZES = [...new Set(PRODUCTS.flatMap(p => p.sizes || []))].filter(Boolean);

module.exports = { CATEGORIES, SHIPPING_OPTIONS, EWALLET_OPTIONS, BANK_OPTIONS, generateReviews, PRODUCTS, BANNERS, FLASH_SALE_IDS };
