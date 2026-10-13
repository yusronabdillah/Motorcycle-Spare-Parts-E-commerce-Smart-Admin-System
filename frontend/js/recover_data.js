const fs = require('fs');
const vm = require('vm');

console.log('=== DATA RECOVERY ===');

// Utility to create clean slugs
function toCleanSlug(text) {
  if (!text) return 'unknown';
  return text.toLowerCase()
    .replace(/\+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 1. Load OLD DB (from mock_db_before_fix.js)
const oldCode = fs.readFileSync('mock_db_before_fix.js', 'utf8');
let oldProducts = [];
try {
  const prodMatch = oldCode.match(/const PRODUCTS = (\[[\s\S]*?^\];)/m);
  if (prodMatch) {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(`var PRODUCTS = ${prodMatch[1]}`, sandbox);
    oldProducts = sandbox.PRODUCTS;
  }
} catch(e) {
  console.error("Error parsing old products:", e.message);
  process.exit(1);
}

// 2. Load NEW DB
const MOCK_DB_PATH = 'mock_db.js';
const newCode = fs.readFileSync(MOCK_DB_PATH, 'utf8');
const wrapper = newCode.replace(/const /g, 'var ');
const newSandbox = {};
vm.createContext(newSandbox);
vm.runInContext(wrapper, newSandbox);

let { CATEGORIES, PRODUCTS } = newSandbox;

// Build set of existing product IDs to prevent double insertion
const existingIds = new Set(PRODUCTS.map(p => String(p.id)));

// Extract missing products (from the old db where id was null)
const nullProducts = oldProducts.filter(p => p.id === null);

// Wait, is it possible that ONE of the null products was saved in the new DB?
// Yes, the dedup script kept the first one and assigned it 'SP-UNKNOWN-X' or left it as null.
// Let's filter out the ones already saved by checking name and SKU combination.
const existingFingerprints = new Set(PRODUCTS.map(p => `${p.name}|${p.sku}`));

const recoveredProducts = [];
let newCategoryCount = 0;
const catSet = new Set(CATEGORIES.map(c => c.id));

nullProducts.forEach((p, index) => {
  const fingerprint = `${p.name}|${p.sku}`;
  if (existingFingerprints.has(fingerprint)) {
    return; // Already exists in new DB
  }
  
  // Create a unique valid ID
  const skuPart = p.sku ? String(p.sku).replace(/[^a-zA-Z0-9]/g, '') : `REC${index}`;
  p.id = `SP-REC-${skuPart}-${Date.now().toString().slice(-4)}${index}`;
  
  // Standardize schema
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    p.images = ["https://placehold.co/400x400/2c3e50/fff?text=PRODUCT"];
  }
  if (typeof p.description !== 'string') {
    p.description = `Produk ${p.name || ''}`;
  }
  if (typeof p.stock !== 'number') p.stock = 10;
  if (!p.stockStatus) p.stockStatus = "ready";
  if (!p.compatibility) p.compatibility = "Universal";
  if (typeof p.rating !== 'number') p.rating = 4.0;
  if (typeof p.reviewCount !== 'number') p.reviewCount = 0;
  if (typeof p.sold !== 'number') p.sold = 0;
  if (!p.weight) p.weight = "500g";

  // Standardize Category
  const rawCat = p.category;
  const cleanCatSlug = toCleanSlug(rawCat);
  p.category = cleanCatSlug;
  
  // Handle Orphan Category mapping
  if (!catSet.has(cleanCatSlug)) {
    const catName = rawCat
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/_/g, ' ')
      .replace(/\+/g, ' ')
      .toUpperCase();

    CATEGORIES.push({
      id: cleanCatSlug,
      name: catName || 'UNKNOWN',
      icon: '🔧'
    });
    catSet.add(cleanCatSlug);
    newCategoryCount++;
  }
  
  recoveredProducts.push(p);
});

console.log(`Products to recover: ${recoveredProducts.length}`);
console.log(`New categories created: ${newCategoryCount}`);

if (recoveredProducts.length === 0) {
  console.log("No missing products found. Already recovered.");
} else {
  // Append to PRODUCTS
  PRODUCTS.push(...recoveredProducts);

  // Re-write mock_db.js
  const lines = newCode.split('\n');
  let catStart = -1, catEnd = -1;
  let prodStart = -1, prodEnd = -1;
  let braceDepth = 0;
  let inCat = false;
  let inProd = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === 'const CATEGORIES = [') { catStart = i; inCat = true; braceDepth = 0; continue; }
    if (line.trim() === 'const PRODUCTS = [') { prodStart = i; inProd = true; braceDepth = 0; continue; }
    
    if (inCat) {
      if (line.trim() === '];' && braceDepth === 0) { catEnd = i; inCat = false; continue; }
      braceDepth += (line.match(/\{/g) || []).length; braceDepth -= (line.match(/\}/g) || []).length;
    }
    if (inProd) {
      if (line.trim() === '];' && braceDepth === 0) { prodEnd = i; inProd = false; continue; }
      braceDepth += (line.match(/\{/g) || []).length; braceDepth -= (line.match(/\}/g) || []).length;
    }
  }

  const catString = 'const CATEGORIES = ' + JSON.stringify(CATEGORIES, null, 2) + ';';
  const prodString = 'const PRODUCTS = ' + JSON.stringify(PRODUCTS, null, 2) + ';';

  let newLines = [...lines];
  newLines.splice(prodStart, prodEnd - prodStart + 1, prodString);
  newLines.splice(catStart, catEnd - catStart + 1, catString);

  fs.writeFileSync(MOCK_DB_PATH, newLines.join('\n'), 'utf-8');
  console.log('✅ Recovery Completed!');
  console.log(`Total Products Now: ${PRODUCTS.length}`);
}
