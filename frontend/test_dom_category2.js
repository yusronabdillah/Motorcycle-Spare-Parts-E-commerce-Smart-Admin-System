const fs = require('fs');
const vm = require('vm');

const mockDbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8').replace(/^const /gm, 'var ');
const appCode = fs.readFileSync('js/app.js', 'utf8').replace(/^const /gm, 'var ');

const sandbox = {
  console: { log: console.log, error: console.error, warn: console.warn },
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math, Set: Set, Object: Object, Array: Array, Date: Date, String: String, Number: Number,
  parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN,
  window: {
    location: { hash: '#category/dinamo-starter' },
    scrollTo: () => {}
  },
  document: {
    getElementById: () => ({ innerHTML: '', addEventListener: () => {}, style: {} }),
    querySelector: () => ({}),
    addEventListener: () => {}
  }
};

vm.createContext(sandbox);

try {
  vm.runInContext(mockDbCode, sandbox);
  vm.runInContext(utilsCode, sandbox);
  vm.runInContext(`
    var Auth = { getPrice: (p) => p.price, isMitra: () => false };
    var Cart = { getCartCount: () => 0 };
    var API = {};
  `, sandbox);
  vm.runInContext(appCode, sandbox);
  
  console.log("Setting up App...");
  vm.runInContext(`
    App.currentCategory = 'dinamo-starter';
    const html = App.renderCategory();
    console.log("Length of HTML for dinamo-starter: " + html.length);
    console.log("Category renders successfully without error.");
    
    // Test a category that has THALLAND items. Thalland has over 2000 products.
    // We didn't add pagination to renderCategory!
    App.currentCategory = 'semua';
    const htmlAll = App.renderCategory();
    console.log("Length of HTML for 'semua': " + htmlAll.length);
    
  `, sandbox);
} catch (e) {
  console.error("Error:", e);
}
