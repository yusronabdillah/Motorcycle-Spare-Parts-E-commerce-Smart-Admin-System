const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const mockDbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8').replace(/^const /gm, 'var ');
const appCode = fs.readFileSync('js/app.js', 'utf8').replace(/^const /gm, 'var ');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app-content"></div></body></html>`, {
  url: "http://localhost/#category/dinamo-starter",
  runScripts: "outside-only"
});

const window = dom.window;
const document = window.document;

// Mock window objects needed
window.scrollTo = () => {};

const sandbox = {
  window,
  document,
  console: {
    log: console.log,
    error: console.error,
    warn: console.warn
  },
  navigator: { userAgent: 'node' },
  location: window.location,
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  Math: Math,
  Set: Set,
  Object: Object,
  Array: Array,
  Date: Date,
  String: String,
  Number: Number,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN
};

const vm = require('vm');
vm.createContext(sandbox);

try {
  vm.runInContext(mockDbCode, sandbox);
  vm.runInContext(utilsCode, sandbox);
  
  // Create dummy Auth and Cart
  vm.runInContext(`
    var Auth = { getPrice: (p) => p.price };
    var Cart = { getCartCount: () => 0 };
    var API = {};
  `, sandbox);

  vm.runInContext(appCode, sandbox);
  
  console.log("Setting up App...");
  vm.runInContext(`
    App.currentCategory = 'dinamo-starter';
    const html = App.renderCategory();
    console.log("Length of generated HTML: " + html.length);
  `, sandbox);
  
  console.log("Test OK!");
} catch (e) {
  console.error("DOM Error:", e);
}
