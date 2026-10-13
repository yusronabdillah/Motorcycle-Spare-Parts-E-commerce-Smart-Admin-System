const fs = require('fs');

const raw = fs.readFileSync('js/mock_db.js', 'utf8');

// Use regex to match the broken part regardless of whitespace/newlines
const regex = /const DB = \{[\s\n\r]*async getProducts\(\) \{[\s\n\r]*await mockDelay\(300\);[\s\n\r]*return PRODUCTS;[\s\n\r]*\},[\s\n\r]*const ALL_SIZES/;

const replacementStr = `const DB = {
  async getProducts() {
    await mockDelay(300);
    return PRODUCTS;
  },
  async getBanners() {
    await mockDelay(100);
    return BANNERS;
  }
};

const BANNERS = [
  { id: 1, title: 'Sparepart Original THALLAND', subtitle: 'Kualitas terjamin untuk segala jenis motor!', bgColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', textColor: '#fff' },
  { id: 2, title: 'Diskon Khusus Mitra', subtitle: 'Daftar sebagai mitra dan nikmati harga grosir', bgColor: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', textColor: '#fff' },
  { id: 3, title: 'Produk Pilihan & Promo Aktif', subtitle: 'Belanja mudah, sparepart lengkap, pengiriman cepat!', bgColor: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)', textColor: '#fff' },
];

const FLASH_SALE_IDS = ['SP00001', 'SP00011', 'SP00013', 'SP00017', 'SP00021', 'SP00026'];

// Collect all unique colors/sizes for filters
const ALL_COLORS = [...new Set(PRODUCTS.flatMap(p => p.colors || []))].filter(Boolean);
const ALL_SIZES`;

if (regex.test(raw)) {
  const newRaw = raw.replace(regex, replacementStr);
  fs.writeFileSync('js/mock_db.js', newRaw, 'utf8');
  console.log('Fixed syntax error in mock_db.js');
} else {
  console.log('Regex did not match!');
}
