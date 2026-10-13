const fs = require('fs');
const vm = require('vm');

let utilsCode = fs.readFileSync('js/utils.js', 'utf8').replace(/^const /gm, 'var ');
let dbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
let appCode = fs.readFileSync('js/app.js', 'utf8').replace(/^const /gm, 'var ');

const apiCode = 'var API = { getReviews: async () => [], loadInitialData: async () => {} };';
const cartCode = 'var Cart = { initOngkir: () => {}, init: () => {}, addItem: () => {}, items: [], save: () => {} };';
const authCode = 'var Auth = { getPrice: (p) => p.price, isMitra: () => false, init: () => {} };';
const locCode = 'var LocationService = { requestLocation: () => {} };';

const sandbox = {
  window: { addEventListener: () => {}, location: { hash: '' }, scrollY: 0, open: () => {} },
  document: {
    addEventListener: () => {},
    getElementById: (id) => ({ 
      classList: { toggle: () => {}, add: () => {}, remove: () => {} }, 
      value: '', 
      style: {},
      innerHTML: '',
      querySelectorAll: () => []
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (t) => ({ className: '', innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, remove: () => {}, textContent: '' })
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: () => {},
  clearInterval: clearInterval,
  setInterval: () => 0,
  decodeURIComponent: decodeURIComponent,
  encodeURIComponent: encodeURIComponent,
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  requestAnimationFrame: (cb) => cb()
};

vm.createContext(sandbox);
vm.runInContext(utilsCode, sandbox);
vm.runInContext(authCode, sandbox);
vm.runInContext(dbCode, sandbox);
vm.runInContext(apiCode, sandbox);
vm.runInContext(locCode, sandbox);
vm.runInContext(cartCode, sandbox);
vm.runInContext(appCode, sandbox);

const App = sandbox.App;
const PRODUCTS = sandbox.PRODUCTS;

// Simulate exactly what happens from the URL
const testCases = [
  // From the screenshot: URL was #product/THL-02156
  'THL-02156',
  // The numeric ID for the same product
  '2131112416',
  // Working product from screenshot
  'SP00021',
  'SKU-SP00021',
  // First THALLAND
  'THL-00001',
  '2131110126',
  // Some more
  'THL-02155',
  'THL-02157',
];

const runTests = async () => {
  console.log('=== SIMULATING EXACT BROWSER BEHAVIOR ===\n');
  
  for (const testId of testCases) {
    // Simulate: window.location.hash = '#product/THL-02156'
    // Router does: hash.split('/') → ['product', 'THL-02156']
    // param = parts.slice(1).join('/') → 'THL-02156'
    // Then calls: renderProductDetail('THL-02156')
    
    const result = await App.renderProductDetail(testId);
    const found = !result.includes('Produk tidak ditemukan');
    const hasDetail = result.includes('detail-layout') || result.includes('product-detail');
    
    if (found) {
      console.log(`✅ "${testId}" → FOUND (renders detail page: ${hasDetail})`);
      // Check if it contains key elements
      const hasPrice = result.includes('formatPrice') || result.includes('Rp') || result.includes('detail-price');
      const hasCart = result.includes('Masukkan Keranjang') || result.includes('addToCartFromDetail');
      const hasBuy = result.includes('Beli Sekarang') || result.includes('buyNow');
      console.log(`   Has price section: ${hasPrice}`);
      console.log(`   Has add to cart: ${hasCart}`);
      console.log(`   Has buy now: ${hasBuy}`);
    } else {
      console.log(`❌ "${testId}" → NOT FOUND`);
      // Debug: Try to find it manually
      const manual = PRODUCTS.find(p => 
        String(p.id) === testId || 
        p.sku === testId
      );
      if (manual) {
        console.log(`   BUT product exists in DB: id=${manual.id}, sku=${manual.sku}, name=${manual.name.substring(0,50)}`);
      }
    }
  }
  
  // Mass test all THALLAND by SKU (this is what the browser sends now)
  console.log('\n=== MASS TEST: ALL THALLAND BY SKU ===');
  const thl = PRODUCTS.filter(p => p.name && p.name.includes('THALLAND'));
  let pass = 0, fail = 0;
  const failures = [];
  for (const p of thl) {
    const sku = p.sku;
    const result = await App.renderProductDetail(sku);
    if (result.includes('Produk tidak ditemukan')) {
      fail++;
      if (failures.length < 5) failures.push({ sku, id: p.id, name: p.name.substring(0,50) });
    } else {
      pass++;
    }
  }
  console.log(`Pass: ${pass}, Fail: ${fail}`);
  if (failures.length > 0) {
    console.log('Sample failures:');
    failures.forEach(f => console.log(`  ❌ SKU=${f.sku} ID=${f.id} Name=${f.name}`));
  }
  
  // Also test by numeric ID (as string, which is what URL gives)
  console.log('\n=== MASS TEST: ALL THALLAND BY NUMERIC ID (as string) ===');
  pass = 0; fail = 0;
  const failures2 = [];
  for (const p of thl) {
    const result = await App.renderProductDetail(String(p.id));
    if (result.includes('Produk tidak ditemukan')) {
      fail++;
      if (failures2.length < 5) failures2.push({ id: p.id, sku: p.sku, name: p.name.substring(0,50) });
    } else {
      pass++;
    }
  }
  console.log(`Pass: ${pass}, Fail: ${fail}`);
  if (failures2.length > 0) {
    console.log('Sample failures:');
    failures2.forEach(f => console.log(`  ❌ ID=${f.id} SKU=${f.sku} Name=${f.name}`));
  }
};

runTests();
