const fs = require('fs');
const vm = require('vm');

// Read source files
let utilsCode = fs.readFileSync('js/utils.js', 'utf8');
let dbCode = fs.readFileSync('js/mock_db.js', 'utf8');
let appCode = fs.readFileSync('js/app.js', 'utf8');

// Replace const with var so they're visible in sandbox context
utilsCode = utilsCode.replace(/^const /gm, 'var ');
dbCode = dbCode.replace(/^const /gm, 'var ');
appCode = appCode.replace(/^const /gm, 'var ');

const apiCode = 'var API = { getReviews: async () => [] };';
const cartCode = 'var Cart = { initOngkir: () => {}, addItem: () => {}, items: [], save: () => {} };';
const authCode = 'if(typeof Auth === "undefined") { var Auth = { getPrice: (p) => p.price, isMitra: () => false }; }';

const sandbox = {
  window: { addEventListener: () => {}, location: { hash: '' } },
  document: {
    addEventListener: () => {},
    getElementById: () => ({ classList: { toggle: () => {} }, value: '', style: {} }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (t) => ({ className: '', innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, remove: () => {}, textContent: '' })
  },
  console: console,
  setTimeout: setTimeout,
  clearInterval: clearInterval,
  setInterval: () => 0,
  decodeURIComponent: decodeURIComponent,
  encodeURIComponent: encodeURIComponent,
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  requestAnimationFrame: (cb) => cb()
};

vm.createContext(sandbox);

try {
  vm.runInContext(utilsCode, sandbox);
  console.log('✅ utils.js loaded');
} catch(e) { console.error('utils.js error:', e.message); }

try {
  vm.runInContext(authCode, sandbox);
  console.log('✅ Auth mock loaded');
} catch(e) { console.error('Auth mock error:', e.message); }

try {
  vm.runInContext(dbCode, sandbox);
  console.log('✅ mock_db.js loaded, PRODUCTS count:', sandbox.PRODUCTS ? sandbox.PRODUCTS.length : 'undefined');
  console.log('   CATEGORIES count:', sandbox.CATEGORIES ? sandbox.CATEGORIES.length : 'undefined');
} catch(e) { console.error('mock_db.js error:', e.message); }

try {
  vm.runInContext(apiCode, sandbox);
  vm.runInContext(cartCode, sandbox);
  console.log('✅ API & Cart mocks loaded');
} catch(e) { console.error('Mock error:', e.message); }

try {
  vm.runInContext(appCode, sandbox);
  console.log('✅ app.js loaded, App exists:', !!sandbox.App);
  console.log('   findProduct exists:', typeof sandbox.App?.findProduct);
} catch(e) { console.error('app.js error:', e.message); }

const runTests = async () => {
  const App = sandbox.App;
  const PRODUCTS = sandbox.PRODUCTS;
  const CATEGORIES = sandbox.CATEGORIES;

  if (!App || !PRODUCTS) {
    console.error('FATAL: App or PRODUCTS not loaded. Cannot test.');
    return;
  }

  let success = 0;
  let fail = 0;
  const failures = [];

  const check = async (id, title) => {
    try {
      const res = await App.renderProductDetail(String(id));
      if (res.includes('Produk tidak ditemukan')) {
        fail++;
        failures.push({ title, id: String(id) });
      } else {
        success++;
      }
    } catch(e) {
      fail++;
      failures.push({ title, id: String(id), error: e.message });
    }
  };

  // ====== TEST 1: 100 Random Products ======
  console.log('\n========== TEST 1: 100 Random Products ==========');
  for (let i = 0; i < 100; i++) {
    const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    await check(p.id, `Random[${i}] by ID`);
    if (p.sku) await check(p.sku, `Random[${i}] by SKU`);
  }
  console.log(`  Completed. Running total: ${success} pass, ${fail} fail`);

  // ====== TEST 2: ALL THALLAND products ======
  console.log('\n========== TEST 2: All THALLAND Products ==========');
  const thallandProducts = PRODUCTS.filter(p => p.name && p.name.includes('THALLAND'));
  console.log(`  Found ${thallandProducts.length} THALLAND products`);
  for (const p of thallandProducts) {
    await check(p.id, 'THALLAND ID');
    if (p.sku) await check(p.sku, 'THALLAND SKU');
  }
  console.log(`  Completed. Running total: ${success} pass, ${fail} fail`);

  // ====== TEST 3: Specific Categories ======
  console.log('\n========== TEST 3: Specific Category Products ==========');
  const targetCats = ['KUNCI KONTAK', 'AS GARDAN', 'ARM', 'AS ENGKOL', 'AS RODA BELAKANG'];
  const catIds = CATEGORIES.filter(c => targetCats.includes(c.name)).map(c => c.id);
  console.log(`  Matched category IDs: ${catIds.join(', ')}`);
  const catProds = PRODUCTS.filter(p => catIds.includes(p.category));
  console.log(`  Found ${catProds.length} products in target categories`);
  for (const p of catProds) {
    await check(p.id, `Cat[${p.category}] ID`);
  }
  console.log(`  Completed. Running total: ${success} pass, ${fail} fail`);

  // ====== TEST 4: Reload / URL Simulasi ======
  console.log('\n========== TEST 4: URL Reload Simulation ==========');
  // Pick a few numeric IDs and SKU-based IDs
  const numericIdProducts = PRODUCTS.filter(p => typeof p.id === 'number').slice(0, 5);
  const skuProducts = PRODUCTS.filter(p => typeof p.id === 'string' && p.id.startsWith('SP')).slice(0, 5);
  for (const p of numericIdProducts) {
    await check(String(p.id), `Numeric URL: ${p.id}`);
  }
  for (const p of skuProducts) {
    await check(p.id, `SKU URL: ${p.id}`);
  }
  console.log(`  Completed. Running total: ${success} pass, ${fail} fail`);

  // ====== TEST 5: Cross-lookup (use SKU to find numeric-ID product, and vice versa) ======
  console.log('\n========== TEST 5: Cross-identifier Lookup ==========');
  const crossTestProducts = PRODUCTS.filter(p => p.sku && String(p.id) !== String(p.sku)).slice(0, 20);
  for (const p of crossTestProducts) {
    await check(p.id, `Cross by ID: ${p.id}`);
    await check(p.sku, `Cross by SKU: ${p.sku}`);
  }
  console.log(`  Completed. Running total: ${success} pass, ${fail} fail`);

  // ====== TEST 6: ALL products comprehensive ======
  console.log('\n========== TEST 6: ALL Products Comprehensive ==========');
  let allSuccess = 0;
  let allFail = 0;
  for (const p of PRODUCTS) {
    try {
      const res = await App.renderProductDetail(String(p.id));
      if (res.includes('Produk tidak ditemukan')) {
        allFail++;
        if (allFail <= 10) failures.push({ title: 'ALL by ID', id: String(p.id), name: p.name });
      } else {
        allSuccess++;
      }
    } catch(e) {
      allFail++;
    }
  }
  success += allSuccess;
  fail += allFail;
  console.log(`  ${PRODUCTS.length} products tested: ${allSuccess} pass, ${allFail} fail`);

  // ====== RESULTS ======
  console.log('\n============================================');
  console.log('           FINAL TEST RESULTS');
  console.log('============================================');
  console.log(`  TOTAL PASS: ${success}`);
  console.log(`  TOTAL FAIL: ${fail}`);
  if (failures.length > 0) {
    console.log('\n  FAILURE DETAILS (first 10):');
    failures.slice(0, 10).forEach(f => console.log(`    ❌ ${f.title} | ID: ${f.id} | ${f.name || ''} | ${f.error || ''}`));
  }
  if (fail === 0) {
    console.log('\n  🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
  } else {
    console.log(`\n  ⚠️ ${fail} tests failed. Review failures above.`);
  }
};

runTests();
