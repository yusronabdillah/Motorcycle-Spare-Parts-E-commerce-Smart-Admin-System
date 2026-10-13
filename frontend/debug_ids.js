const fs = require('fs');
const vm = require('vm');

let dbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(dbCode, sandbox);

const PRODUCTS = sandbox.PRODUCTS;
const CATEGORIES = sandbox.CATEGORIES;

console.log('Total products:', PRODUCTS.length);

// Find THALLAND products and check their IDs
const thl = PRODUCTS.filter(p => p.name && p.name.includes('THALLAND'));
console.log('THALLAND products:', thl.length);

// Show first 10 THALLAND products with all identifiers
console.log('\n--- First 20 THALLAND products ---');
thl.slice(0, 20).forEach(p => {
  console.log({
    id: p.id,
    idType: typeof p.id,
    sku: p.sku,
    kode_produk: p.kode_produk,
    kode_part: p.kode_part,
    partNumber: p.partNumber,
    product_id: p.product_id,
    name: p.name.substring(0, 60),
    category: p.category
  });
});

// Check for the specific product from the screenshot: TALI DALAM GLPRO BLACK (DISC) - THALLAND
const taliDalam = PRODUCTS.filter(p => p.name && p.name.includes('TALI DALAM'));
console.log('\n--- TALI DALAM products ---');
taliDalam.forEach(p => {
  console.log({
    id: p.id,
    idType: typeof p.id,
    sku: p.sku,
    name: p.name.substring(0, 80)
  });
});

// Check: what does the URL "THL-02156" map to?
const byTHL = PRODUCTS.find(p => String(p.id) === 'THL-02156' || p.sku === 'THL-02156');
console.log('\nProduct with THL-02156:', byTHL ? byTHL.name : 'NOT FOUND');

// Check what ID the "TALI DALAM GLPRO BLACK (DISC) - THALLAND" has
const glpro = PRODUCTS.find(p => p.name && p.name.includes('TALI DALAM GLPRO BLACK'));
console.log('TALI DALAM GLPRO BLACK ID:', glpro ? { id: glpro.id, sku: glpro.sku, type: typeof glpro.id } : 'NOT FOUND');

// Check an AS GARDAN product (working one) for comparison
const gardan = PRODUCTS.find(p => p.name && p.name.includes('AS GARDAN MIO SPORTY'));
console.log('\nAS GARDAN MIO SPORTY:', gardan ? { id: gardan.id, sku: gardan.sku, idType: typeof gardan.id } : 'NOT FOUND');

// From the screenshot URL: SKU_SP00021
const bySKU = PRODUCTS.find(p => String(p.id) === 'SKU_SP00021' || p.sku === 'SKU_SP00021');
console.log('SKU_SP00021:', bySKU ? { id: bySKU.id, name: bySKU.name.substring(0, 60) } : 'NOT FOUND');

// Try SP00021
const bySP = PRODUCTS.find(p => String(p.id) === 'SP00021' || p.sku === 'SP00021');
console.log('SP00021:', bySP ? { id: bySP.id, name: bySP.name.substring(0, 60) } : 'NOT FOUND');

// Check how many products have numeric IDs vs string IDs
const numericIds = PRODUCTS.filter(p => typeof p.id === 'number');
const stringIds = PRODUCTS.filter(p => typeof p.id === 'string');
console.log('\nNumeric IDs:', numericIds.length);
console.log('String IDs:', stringIds.length);

// Check if all products have sku field
const withSku = PRODUCTS.filter(p => p.sku);
const withoutSku = PRODUCTS.filter(p => !p.sku);
console.log('With SKU:', withSku.length);
console.log('Without SKU:', withoutSku.length);
if (withoutSku.length > 0) {
  console.log('Products WITHOUT SKU (first 10):');
  withoutSku.slice(0, 10).forEach(p => console.log('  ', { id: p.id, name: (p.name || '').substring(0, 60) }));
}
