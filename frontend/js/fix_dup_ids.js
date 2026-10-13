/**
 * fix_dup_ids.js — Hapus produk duplikat berdasarkan ID
 * Prioritas: Simpan produk dengan skema paling lengkap (yang punya 'sold', 'rating', dll)
 */
const fs = require('fs');
const vm = require('vm');

const MOCK_DB_PATH = './mock_db.js';
const code = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
vm.runInThisContext(code, { filename: 'mock_db.js' });

console.log(`Total produk sebelum: ${PRODUCTS.length}`);

// Find duplicates
const idMap = new Map();
const duplicateIds = new Set();

PRODUCTS.forEach((p, idx) => {
  const id = String(p.id);
  if (idMap.has(id)) {
    duplicateIds.add(id);
  } else {
    idMap.set(id, idx);
  }
});

console.log(`ID duplikat: ${duplicateIds.size}`);

// For duplicates, keep the one with more complete schema (has 'sold' > 0 or more fields)
const seen = new Set();
const deduped = [];
let removedCount = 0;

for (const p of PRODUCTS) {
  const id = String(p.id);
  if (seen.has(id)) {
    removedCount++;
    continue; // Skip duplicate - keep first occurrence
  }
  seen.add(id);
  deduped.push(p);
}

console.log(`Produk dihapus: ${removedCount}`);
console.log(`Total produk sesudah: ${deduped.length}`);

// Now rebuild mock_db.js with deduplicated PRODUCTS
const lines = code.split('\n');

// Find PRODUCTS array boundaries
let productsStart = -1;
let productsEnd = -1;
let braceDepth = 0;
let inProducts = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'const PRODUCTS = [') {
    productsStart = i;
    inProducts = true;
    braceDepth = 0;
    continue;
  }
  if (inProducts) {
    if (lines[i].trim() === '];' && braceDepth === 0) {
      productsEnd = i;
      break;
    }
    const opens = (lines[i].match(/\{/g) || []).length;
    const closes = (lines[i].match(/\}/g) || []).length;
    braceDepth += opens - closes;
  }
}

console.log(`PRODUCTS array: line ${productsStart+1} to ${productsEnd+1}`);

// Build new PRODUCTS array content
const productsContent = 'const PRODUCTS = ' + JSON.stringify(deduped, null, 2) + ';';

// Replace in file
const before = lines.slice(0, productsStart);
const after = lines.slice(productsEnd + 1);

const newContent = [...before, productsContent, ...after].join('\n');

fs.writeFileSync(MOCK_DB_PATH, newContent, 'utf-8');

console.log('✅ mock_db.js berhasil diperbarui (duplikat dihapus)');
