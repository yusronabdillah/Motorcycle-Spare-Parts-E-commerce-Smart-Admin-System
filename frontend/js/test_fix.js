/**
 * test_fix.js — Pengujian Komprehensif setelah perbaikan
 * Menggunakan vm.runInThisContext agar const menjadi global scope
 */

const fs = require('fs');
const vm = require('vm');

// Load mock_db.js into global scope (like browser does)
const code = fs.readFileSync('./mock_db.js', 'utf-8');
vm.runInThisContext(code, { filename: 'mock_db.js' });

const results = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: '✅ PASS' });
    passed++;
  } catch (e) {
    results.push({ name, status: '❌ FAIL', error: e.message });
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

console.log('=== PENGUJIAN PASCA-PERBAIKAN ===\n');

// ============ 1. HOMEPAGE ============
console.log('📋 1. HOMEPAGE TESTS');

test('CATEGORIES terdefinisi', () => {
  assert(typeof CATEGORIES !== 'undefined', 'CATEGORIES undefined');
  assert(Array.isArray(CATEGORIES), 'CATEGORIES bukan array');
  assert(CATEGORIES.length > 0, 'CATEGORIES kosong');
});

test('PRODUCTS terdefinisi', () => {
  assert(typeof PRODUCTS !== 'undefined', 'PRODUCTS undefined');
  assert(Array.isArray(PRODUCTS), 'PRODUCTS bukan array');
  assert(PRODUCTS.length > 0, 'PRODUCTS kosong');
});

test('BANNERS terdefinisi', () => {
  assert(typeof BANNERS !== 'undefined', 'BANNERS undefined');
  assert(Array.isArray(BANNERS), 'BANNERS bukan array');
  assert(BANNERS.length > 0, 'BANNERS kosong');
});

test('Jumlah produk > 1000', () => {
  assert(PRODUCTS.length > 1000, `Hanya ${PRODUCTS.length} produk`);
});

test('Jumlah kategori > 10', () => {
  assert(CATEGORIES.length > 10, `Hanya ${CATEGORIES.length} kategori`);
});

// ============ 2. PRODUCT SCHEMA ============
console.log('\n📋 2. PRODUCT SCHEMA TESTS');

test('Semua produk punya field "images" (array)', () => {
  const broken = PRODUCTS.filter(p => !p.images || !Array.isArray(p.images));
  assert(broken.length === 0, `${broken.length} produk tanpa images array. Contoh: ${broken.slice(0,3).map(p=>p.id).join(', ')}`);
});

test('Semua produk punya field "stock"', () => {
  const broken = PRODUCTS.filter(p => p.stock === undefined || p.stock === null);
  assert(broken.length === 0, `${broken.length} produk tanpa stock`);
});

test('Semua produk punya field "stockStatus"', () => {
  const broken = PRODUCTS.filter(p => !p.stockStatus);
  assert(broken.length === 0, `${broken.length} produk tanpa stockStatus`);
});

test('Semua produk punya field "compatibility"', () => {
  const broken = PRODUCTS.filter(p => p.compatibility === undefined);
  assert(broken.length === 0, `${broken.length} produk tanpa compatibility`);
});

test('Semua produk punya field "rating"', () => {
  const broken = PRODUCTS.filter(p => p.rating === undefined);
  assert(broken.length === 0, `${broken.length} produk tanpa rating`);
});

test('Semua produk punya field "sold"', () => {
  const broken = PRODUCTS.filter(p => p.sold === undefined);
  assert(broken.length === 0, `${broken.length} produk tanpa sold`);
});

test('Semua produk punya field "reviewCount"', () => {
  const broken = PRODUCTS.filter(p => p.reviewCount === undefined);
  assert(broken.length === 0, `${broken.length} produk tanpa reviewCount`);
});

// ============ 3. SEARCH SIMULATION ============
console.log('\n📋 3. SEARCH SIMULATION');

test('Search "kampas rem" - menemukan hasil', () => {
  const q = 'kampas rem';
  const res = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.compatibility.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
  assert(res.length > 0, 'Tidak ditemukan hasil pencarian');
});

test('Search "THALLAND" - menemukan produk baru', () => {
  const q = 'thalland';
  const res = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q))
  );
  assert(res.length > 0, 'Tidak ditemukan produk THALLAND');
});

test('Filter kategori "arm"', () => {
  const filtered = PRODUCTS.filter(p => p.category === 'arm');
  assert(filtered.length > 0, 'Tidak ada produk kategori arm');
});

// ============ 4. CART / CHECKOUT ============
console.log('\n📋 4. CART / CHECKOUT TESTS');

test('SHIPPING_OPTIONS terdefinisi', () => {
  assert(typeof SHIPPING_OPTIONS !== 'undefined', 'SHIPPING_OPTIONS undefined');
  assert(Array.isArray(SHIPPING_OPTIONS), 'SHIPPING_OPTIONS bukan array');
  assert(SHIPPING_OPTIONS.length > 0, 'SHIPPING_OPTIONS kosong');
});

test('BANK_OPTIONS terdefinisi', () => {
  assert(typeof BANK_OPTIONS !== 'undefined', 'BANK_OPTIONS undefined');
  assert(Array.isArray(BANK_OPTIONS), 'BANK_OPTIONS bukan array');
});

test('EWALLET_OPTIONS terdefinisi', () => {
  assert(typeof EWALLET_OPTIONS !== 'undefined', 'EWALLET_OPTIONS undefined');
  assert(Array.isArray(EWALLET_OPTIONS), 'EWALLET_OPTIONS bukan array');
});

// ============ 5. PRODUCT DETAIL ============
console.log('\n📋 5. PRODUCT DETAIL TESTS');

test('generateReviews() berfungsi', () => {
  assert(typeof generateReviews === 'function', 'generateReviews bukan function');
  const reviews = generateReviews('SP00001');
  assert(Array.isArray(reviews), 'Hasil bukan array');
  assert(reviews.length > 0, 'Tidak ada review');
  assert(reviews[0].user, 'Review tidak punya field user');
  assert(reviews[0].rating, 'Review tidak punya field rating');
});

test('Produk SP00001 lengkap', () => {
  const p = PRODUCTS.find(p => p.id === 'SP00001');
  assert(p, 'SP00001 tidak ditemukan');
  assert(p.name, 'Tidak punya name');
  assert(p.price > 0, 'Harga 0');
  assert(p.images && p.images.length > 0, 'Tidak punya images');
});

test('Produk THALLAND skema lengkap', () => {
  const p = PRODUCTS.find(p => p.brand === 'THALLAND');
  assert(p, 'Tidak ada produk THALLAND');
  assert(p.images && Array.isArray(p.images), `ID ${p.id}: images bukan array`);
  assert(p.stock !== undefined, `ID ${p.id}: stock undefined`);
  assert(p.stockStatus, `ID ${p.id}: stockStatus undefined`);
  assert(p.compatibility !== undefined, `ID ${p.id}: compatibility undefined`);
  assert(p.rating !== undefined, `ID ${p.id}: rating undefined`);
  assert(p.sold !== undefined, `ID ${p.id}: sold undefined`);
});

// ============ 6. DATA INTEGRITY ============
console.log('\n📋 6. DATA INTEGRITY');

test('Tidak ada duplikasi ID produk', () => {
  const ids = PRODUCTS.map(p => String(p.id));
  const uniqueIds = new Set(ids);
  const dupCount = ids.length - uniqueIds.size;
  assert(dupCount === 0, `Ada ${dupCount} ID duplikat`);
});

test('FAQ_DATA terdefinisi', () => {
  assert(typeof FAQ_DATA !== 'undefined', 'FAQ_DATA undefined');
  assert(Array.isArray(FAQ_DATA), 'FAQ_DATA bukan array');
});

test('DB object terdefinisi', () => {
  assert(typeof DB !== 'undefined', 'DB undefined');
  assert(typeof DB.getProducts === 'function', 'DB.getProducts bukan function');
});

// ============ 7. RENDER SIMULATION ============
console.log('\n📋 7. RENDER SIMULATION');

test('Filter produk ready stock & harga > 0', () => {
  const available = PRODUCTS.filter(p => p.stock > 0 && p.price > 0);
  assert(available.length > 0, 'Tidak ada produk available');
  assert(available.length >= 8, `Hanya ${available.length} produk available, butuh min 8 untuk flash sale`);
});

test('Sort by terlaris', () => {
  const sorted = [...PRODUCTS].sort((a, b) => b.sold - a.sold);
  assert(sorted[0].sold >= sorted[1].sold, 'Sort gagal');
});

test('Sort by termurah', () => {
  const sorted = [...PRODUCTS].sort((a, b) => a.price - b.price);
  assert(sorted[0].price <= sorted[1].price, 'Sort gagal');
});

// ============ SUMMARY ============
console.log('\n' + '='.repeat(50));
console.log(`HASIL: ${passed} PASS / ${failed} FAIL / ${passed + failed} TOTAL`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ GAGAL:');
  results.filter(r => r.status.includes('FAIL')).forEach(r => {
    console.log(`   ${r.name}: ${r.error}`);
  });
} else {
  console.log('\n🎉 SEMUA TES LULUS!');
}

console.log(`\n📊 Statistik Data:`);
console.log(`   Total Produk: ${PRODUCTS.length}`);
console.log(`   Total Kategori: ${CATEGORIES.length}`);
console.log(`   Produk THALLAND: ${PRODUCTS.filter(p => p.brand === 'THALLAND').length}`);
console.log(`   Produk ORI: ${PRODUCTS.filter(p => p.brand === 'ORI').length}`);
console.log(`   Produk Harga > 0: ${PRODUCTS.filter(p => p.price > 0).length}`);
console.log(`   Produk Harga = 0: ${PRODUCTS.filter(p => p.price === 0).length}`);
console.log(`   Produk Stock > 0: ${PRODUCTS.filter(p => p.stock > 0).length}`);

process.exit(failed > 0 ? 1 : 0);
