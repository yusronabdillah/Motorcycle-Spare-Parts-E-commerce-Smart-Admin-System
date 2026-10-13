const fs = require('fs');
const vm = require('vm');

// 1. Load OLD DB (before any deduplication, but after Sesi 1 where it had syntax error)
// Wait, mock_db_before_fix.js has syntax error (duplicate const). 
// I need to parse it carefully.
const oldCode = fs.readFileSync('mock_db_before_fix.js', 'utf8');

// The old file has two const PRODUCTS. The first one is the complete one containing new Thalland + old ones.
// The second one was a duplicate of old ones.
// I will extract the first PRODUCTS array.
let oldProducts = [];
try {
  // Extract block from "const PRODUCTS = [" to the first "];" after it
  const prodMatch = oldCode.match(/const PRODUCTS = (\[[\s\S]*?^\];)/m);
  if (prodMatch) {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(`var PRODUCTS = ${prodMatch[1]}`, sandbox);
    oldProducts = sandbox.PRODUCTS;
  }
} catch(e) {
  console.error("Error parsing old products:", e.message);
}

// 2. Load NEW DB
const newCode = fs.readFileSync('mock_db.js', 'utf8');
const wrapper = newCode.replace(/const /g, 'var ');
const newSandbox = {};
vm.createContext(newSandbox);
vm.runInContext(wrapper, newSandbox);
const newProducts = newSandbox.PRODUCTS;

console.log(`Old Products count (Block 1): ${oldProducts.length}`);
console.log(`New Products count: ${newProducts.length}`);

// 3. Find missing products
// Compare by name and SKU since ID might have been duplicate
// Actually, let's just find products in oldProducts that are NOT in newProducts.
const newIds = new Set(newProducts.map(p => String(p.id)));

const missingProducts = [];
const duplicateIds = new Map();

oldProducts.forEach(p => {
  const idStr = String(p.id);
  if (!newIds.has(idStr)) {
    missingProducts.push(p);
  }
  
  if (duplicateIds.has(idStr)) {
    duplicateIds.get(idStr).push(p);
  } else {
    duplicateIds.set(idStr, [p]);
  }
});

// Identify true collisions (different products sharing same ID)
const collisions = [];
duplicateIds.forEach((list, id) => {
  if (list.length > 1) {
    // Check if they are actually different products
    const names = new Set(list.map(p => p.name));
    if (names.size > 1) {
      collisions.push({
        id,
        count: list.length,
        names: Array.from(names)
      });
    }
  }
});

console.log(`Missing products (ID not in new DB): ${missingProducts.length}`);
console.log(`True collisions (Different products with same ID): ${collisions.length}`);

if (collisions.length > 0) {
  console.log("Sample collisions:", JSON.stringify(collisions.slice(0, 5), null, 2));
}

// Check how many THALLAND products are in old vs new
const oldThalland = oldProducts.filter(p => p.brand === 'THALLAND').length;
const newThalland = newProducts.filter(p => p.brand === 'THALLAND').length;

console.log(`Old THALLAND products: ${oldThalland}`);
console.log(`New THALLAND products: ${newThalland}`);
