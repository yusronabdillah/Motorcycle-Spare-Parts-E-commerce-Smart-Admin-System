const fs = require('fs');

// Simulate browser globals
const mockDOM = `
var window = global;
var document = {
  addEventListener: function(e, fn) { if (e === 'DOMContentLoaded') global._domReady = fn; },
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function() { return { textContent: '', innerHTML: '', appendChild: function(){}, className: '', style: {}, classList: { add:function(){}, remove:function(){}, toggle:function(){}, contains:function(){return false;} } }; },
  body: { appendChild: function(){} }
};
var navigator = { clipboard: { writeText: function() { return Promise.resolve(); } }, geolocation: { getCurrentPosition: function(){} } };
var localStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
var fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
var setInterval = function() { return 0; };
var clearInterval = function() {};
var requestAnimationFrame = function(fn) { fn(); };
var location = { hash: '', hostname: 'localhost' };
var alert = function(){};
`;

const files = [
  'mock_db.js',
  'shim.js',
  'api.js',
  'utils.js',
  'auth.js',
  'ongkir.js',
  'cities.js',
  'cart.js',
  'app.js',
  'loadCategories.js'
];

let combined = mockDOM + '\n';

for (const f of files) {
  try {
    combined += '\n// === ' + f + ' ===\n' + fs.readFileSync(f, 'utf8') + '\n';
    console.log('Loaded:', f);
  } catch (e) {
    console.log('ERROR loading', f + ':', e.message);
  }
}

try {
  eval(combined);
  console.log('\n=== SIMULATION RESULTS ===');
  console.log('SUCCESS: All scripts evaluated without errors!');
  console.log('PRODUCTS count:', typeof PRODUCTS !== 'undefined' ? PRODUCTS.length : 'UNDEFINED');
  console.log('CATEGORIES count:', typeof CATEGORIES !== 'undefined' ? CATEGORIES.length : 'UNDEFINED');
  console.log('BANNERS count:', typeof BANNERS !== 'undefined' ? BANNERS.length : 'UNDEFINED');
  console.log('SHIPPING_OPTIONS:', typeof SHIPPING_OPTIONS !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('BANK_OPTIONS:', typeof BANK_OPTIONS !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('EWALLET_OPTIONS:', typeof EWALLET_OPTIONS !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('generateReviews:', typeof generateReviews !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('App:', typeof App !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('Cart:', typeof Cart !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('Auth:', typeof Auth !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('API:', typeof API !== 'undefined' ? 'OK' : 'UNDEFINED');
  console.log('Utils:', typeof Utils !== 'undefined' ? 'OK' : 'UNDEFINED');
} catch (e) {
  console.log('\n=== RUNTIME ERROR ===');
  console.log('Error:', e.message);
  console.log('Stack:', e.stack.split('\n').slice(0, 8).join('\n'));
}
