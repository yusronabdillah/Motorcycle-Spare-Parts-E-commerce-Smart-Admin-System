const fs = require('fs');
const vm = require('vm');

let utilsCode = fs.readFileSync('js/utils.js', 'utf8').replace(/^const /gm, 'var ');
let dbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
let apiCode = fs.readFileSync('js/api.js', 'utf8').replace(/^const /gm, 'var ');
let appCode = fs.readFileSync('js/app.js', 'utf8').replace(/^const /gm, 'var ');
let cartCode = fs.readFileSync('js/cart.js', 'utf8').replace(/^const /gm, 'var ');

const authCode = `var Auth = { getPrice: (p) => p.price, isMitra: () => false, init: () => {} };`;
const shimCode = `var MITRA_CODES = []; var LocationService = { requestLocation: () => {} };`;

const sandbox = {
  window: { addEventListener: () => {}, location: { hash: '' }, scrollY: 0, open: () => {} },
  document: {
    addEventListener: () => {},
    getElementById: (id) => ({
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      value: '1', style: {}, innerHTML: '', max: '99',
      querySelectorAll: () => [], closest: () => ({ querySelectorAll: () => [] })
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ className:'', innerHTML:'', style:{}, classList:{add:()=>{},remove:()=>{}}, appendChild:()=>{}, remove:()=>{}, textContent:'' })
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: () => {},
  clearInterval: () => {},
  setInterval: () => 0,
  decodeURIComponent: decodeURIComponent,
  encodeURIComponent: encodeURIComponent,
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() }, geolocation: null },
  requestAnimationFrame: (cb) => cb(),
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}) })
};

vm.createContext(sandbox);
vm.runInContext(utilsCode, sandbox);
vm.runInContext(authCode, sandbox);
vm.runInContext(shimCode, sandbox);
vm.runInContext(dbCode, sandbox);
vm.runInContext(apiCode, sandbox);
// API is assigned to window.API in api.js, so alias it
vm.runInContext('var API = window.API || { getReviews: async () => [], loadInitialData: async () => {} };', sandbox);
vm.runInContext(cartCode, sandbox);
vm.runInContext(appCode, sandbox);

const App = sandbox.App;
const PRODUCTS = sandbox.PRODUCTS;
const Cart = sandbox.Cart;

console.log(`Total Products: ${PRODUCTS.length}`);
console.log(`App.findProduct exists: ${typeof App.findProduct}`);

const runTests = async () => {
  let totalPass = 0, totalFail = 0;
  const failures = [];

  // ====== TEST 1: renderProductDetail by SKU (this is what browser does now) ======
  console.log('\n===== TEST 1: renderProductDetail via SKU (2380 THALLAND) =====');
  const thl = PRODUCTS.filter(p => p.name && p.name.includes('THALLAND'));
  let pass1 = 0, fail1 = 0;
  for (const p of thl) {
    const res = await App.renderProductDetail(p.sku);
    if (res.includes('Produk tidak ditemukan')) {
      fail1++;
      if (failures.length < 5) failures.push(`TEST1 SKU=${p.sku} name=${p.name.substring(0,50)}`);
    } else pass1++;
  }
  console.log(`  SKU lookup: ${pass1} pass, ${fail1} fail`);
  totalPass += pass1; totalFail += fail1;

  // ====== TEST 2: renderProductDetail by numeric ID string ======
  console.log('\n===== TEST 2: renderProductDetail via numeric ID string (2380 THALLAND) =====');
  let pass2 = 0, fail2 = 0;
  for (const p of thl) {
    const res = await App.renderProductDetail(String(p.id));
    if (res.includes('Produk tidak ditemukan')) {
      fail2++;
      if (failures.length < 10) failures.push(`TEST2 ID=${p.id} name=${p.name.substring(0,50)}`);
    } else pass2++;
  }
  console.log(`  Numeric ID lookup: ${pass2} pass, ${fail2} fail`);
  totalPass += pass2; totalFail += fail2;

  // ====== TEST 3: All ORI products (string IDs like SP00001) ======
  console.log('\n===== TEST 3: renderProductDetail for ORI products =====');
  const ori = PRODUCTS.filter(p => typeof p.id === 'string');
  let pass3 = 0, fail3 = 0;
  for (const p of ori) {
    const res = await App.renderProductDetail(p.id);
    if (res.includes('Produk tidak ditemukan')) {
      fail3++;
      if (failures.length < 15) failures.push(`TEST3 ID=${p.id} name=${p.name.substring(0,50)}`);
    } else pass3++;
  }
  console.log(`  ORI product lookup: ${pass3} pass, ${fail3} fail`);
  totalPass += pass3; totalFail += fail3;

  // ====== TEST 4: addToCartFromDetail (does it find the product?) ======
  console.log('\n===== TEST 4: addToCartFromDetail simulation =====');
  let pass4 = 0, fail4 = 0;
  // Test with 20 THALLAND products using their SKU
  for (const p of thl.slice(0, 20)) {
    const found = App.findProduct(p.sku);
    if (found) pass4++; else { fail4++; failures.push(`TEST4 addToCart SKU=${p.sku}`); }
  }
  // Test with 20 ORI products using their ID
  for (const p of ori.slice(0, 20)) {
    const found = App.findProduct(p.id);
    if (found) pass4++; else { fail4++; failures.push(`TEST4 addToCart ID=${p.id}`); }
  }
  console.log(`  addToCart findProduct: ${pass4} pass, ${fail4} fail`);
  totalPass += pass4; totalFail += fail4;

  // ====== TEST 5: Detail page contains working buttons ======
  console.log('\n===== TEST 5: Detail page has Cart/Buy buttons =====');
  let pass5 = 0, fail5 = 0;
  const testProducts = [...thl.slice(0, 50), ...ori.slice(0, 50)];
  for (const p of testProducts) {
    const identifier = p.sku || p.id;
    const res = await App.renderProductDetail(identifier);
    const hasCart = res.includes('addToCartFromDetail');
    const hasBuy = res.includes('buyNow');
    const hasPrice = res.includes('detail-price');
    if (hasCart && hasBuy && hasPrice) pass5++;
    else { fail5++; failures.push(`TEST5 buttons missing: ${identifier}`); }
  }
  console.log(`  Buttons present: ${pass5} pass, ${fail5} fail`);
  totalPass += pass5; totalFail += fail5;

  // ====== TEST 6: ApiService.fetchProductDetail ======
  console.log('\n===== TEST 6: ApiService.fetchProductDetail =====');
  let pass6 = 0, fail6 = 0;
  for (const p of thl.slice(0, 50)) {
    try {
      const result = await sandbox.ApiService.fetchProductDetail(p.sku);
      if (result && result.name) pass6++; else fail6++;
    } catch(e) {
      fail6++;
      if (failures.length < 20) failures.push(`TEST6 API fetch SKU=${p.sku}: ${e.message}`);
    }
  }
  for (const p of ori.slice(0, 50)) {
    try {
      const result = await sandbox.ApiService.fetchProductDetail(p.id);
      if (result && result.name) pass6++; else fail6++;
    } catch(e) {
      fail6++;
      if (failures.length < 25) failures.push(`TEST6 API fetch ID=${p.id}: ${e.message}`);
    }
  }
  console.log(`  API fetchProductDetail: ${pass6} pass, ${fail6} fail`);
  totalPass += pass6; totalFail += fail6;

  // ====== FINAL RESULTS ======
  console.log('\n============================================');
  console.log('         FINAL COMPREHENSIVE RESULTS');
  console.log('============================================');
  console.log(`  TOTAL PASS: ${totalPass}`);
  console.log(`  TOTAL FAIL: ${totalFail}`);
  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach(f => console.log(`    ❌ ${f}`));
  }
  if (totalFail === 0) {
    console.log('\n  🎉🎉🎉 ALL TESTS PASSED! ZERO FAILURES! 🎉🎉🎉');
  }
};

runTests();
