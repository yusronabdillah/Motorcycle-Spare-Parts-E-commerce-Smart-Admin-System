const fs = require('fs');

const raw = fs.readFileSync('js/mock_db.js', 'utf8');

const oldBanners = `const BANNERS = [
  { id: 1, title: 'FLASH SALE Spare Part Motor!', subtitle: 'Diskon hingga 50% untuk semua kategori', bgColor: 'linear-gradient(135deg, #EE4D2D 0%, #FF6633 100%)', textColor: '#fff' },
  { id: 2, title: 'Gratis Ongkir Min. Belanja 200rb', subtitle: 'Berlaku untuk pengiriman Standard ke semua area', bgColor: 'linear-gradient(135deg, #00BFA5 0%, #00E676 100%)', textColor: '#fff' },
  { id: 3, title: 'Part Racing Terbaru!', subtitle: 'CDI, Knalpot, Roller - langsung pasang!', bgColor: 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)', textColor: '#fff' },
];`;

const newBanners = `const BANNERS = [
  { id: 1, title: 'Sparepart Original THALLAND', subtitle: 'Kualitas terjamin untuk segala jenis motor!', bgColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', textColor: '#fff' },
  { id: 2, title: 'Diskon Khusus Mitra', subtitle: 'Daftar sebagai mitra dan nikmati harga grosir', bgColor: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', textColor: '#fff' },
  { id: 3, title: 'Produk Pilihan & Promo Aktif', subtitle: 'Belanja mudah, sparepart lengkap, pengiriman cepat!', bgColor: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)', textColor: '#fff' },
];`;

const newRaw = raw.replace(oldBanners, newBanners);
fs.writeFileSync('js/mock_db.js', newRaw, 'utf8');

console.log('BANNERS updated successfully.');
