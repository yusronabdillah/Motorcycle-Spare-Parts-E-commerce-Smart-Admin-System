/**
 * fix_duplicate.js — Perbaikan Bug Loading Stuck
 * 
 * Masalah: mock_db.js memiliki duplikasi const CATEGORIES dan const PRODUCTS
 * Solusi:
 *   1. Hapus blok duplikat (baris 52873 s/d 79496)
 *   2. Perbaiki skema produk baru agar kompatibel dengan app.js
 *   3. Backup file asli sebelum perubahan
 */

const fs = require('fs');
const path = require('path');

const MOCK_DB_PATH = path.join(__dirname, 'mock_db.js');
const BACKUP_PATH = path.join(__dirname, 'mock_db_before_fix.js');

console.log('=== FIX DUPLICATE DECLARATIONS ===\n');

// Step 1: Backup
console.log('1. Membuat backup...');
fs.copyFileSync(MOCK_DB_PATH, BACKUP_PATH);
console.log(`   ✅ Backup disimpan: mock_db_before_fix.js`);

// Step 2: Read file as lines
console.log('2. Membaca mock_db.js...');
const content = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
const lines = content.split('\n');
console.log(`   Total baris: ${lines.length}`);

// Step 3: Find boundaries
// First block: lines 0-based index 0 to 52871 (1-based: 1-52872)
// Duplicate block to remove: 1-based 52873 to 79496
// Tail to keep: 1-based 79497 to end

const FIRST_BLOCK_END = 52872;    // 1-based, inclusive ("];")
const DUPLICATE_START = 52873;    // 1-based (empty line before 2nd const CATEGORIES)
const TAIL_START = 79497;         // 1-based (const mockDelay...)

console.log(`3. Menghapus blok duplikat...`);
console.log(`   Baris yang dihapus: ${DUPLICATE_START} - ${TAIL_START - 1} (${TAIL_START - DUPLICATE_START} baris)`);

// Build new file: keep lines 1..FIRST_BLOCK_END, then lines TAIL_START..end
const keptLines = [
  ...lines.slice(0, FIRST_BLOCK_END),          // 0-based: 0..52871
  '',                                            // empty separator
  ...lines.slice(TAIL_START - 1)                 // 0-based: 79496..end
];

console.log(`   Baris setelah penghapusan: ${keptLines.length}`);

// Step 4: Fix product schema for new products (from Sesi 4)
// New products have numeric IDs and use "image" instead of "images"
console.log('4. Memperbaiki skema produk baru...');

let fixedContent = keptLines.join('\n');

// Parse the file to find and fix products
// We'll use a regex-based approach on the joined content
// Strategy: Find each product object in PRODUCTS array and check for missing fields

// Actually, let's do a smarter approach - read the content as JS and fix programmatically
// Since the file is valid JS (after removing duplicates), we can eval it carefully

// Better approach: line-by-line scan to fix product objects
// Products from Sesi 4 have "image": instead of "images": and lack other fields

let fixCount = 0;
const fixedLines = fixedContent.split('\n');
const result = [];
let inProduct = false;
let productLines = [];
let braceDepth = 0;
let inProductsArray = false;

for (let i = 0; i < fixedLines.length; i++) {
  const line = fixedLines[i];
  
  // Detect start of PRODUCTS array
  if (line.trim() === 'const PRODUCTS = [') {
    inProductsArray = true;
    result.push(line);
    continue;
  }
  
  // Detect end of PRODUCTS array
  if (inProductsArray && line.trim() === '];' && braceDepth === 0) {
    // Process any remaining product
    if (productLines.length > 0) {
      const fixed = fixProductObject(productLines);
      if (fixed.wasFixed) fixCount++;
      result.push(...fixed.lines);
      productLines = [];
    }
    inProductsArray = false;
    result.push(line);
    continue;
  }
  
  if (!inProductsArray) {
    result.push(line);
    continue;
  }
  
  // Inside PRODUCTS array - track brace depth
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  
  if (braceDepth === 0 && openBraces > 0) {
    // Start of a new product object
    inProduct = true;
    productLines = [line];
    braceDepth += openBraces - closeBraces;
  } else if (inProduct) {
    productLines.push(line);
    braceDepth += openBraces - closeBraces;
    
    if (braceDepth === 0) {
      // End of product object
      inProduct = false;
      const fixed = fixProductObject(productLines);
      if (fixed.wasFixed) fixCount++;
      result.push(...fixed.lines);
      productLines = [];
    }
  } else {
    result.push(line);
  }
}

console.log(`   ✅ Produk yang diperbaiki skemanya: ${fixCount}`);

// Step 5: Write fixed file
console.log('5. Menyimpan mock_db.js yang sudah diperbaiki...');
fs.writeFileSync(MOCK_DB_PATH, result.join('\n'), 'utf-8');

const newSize = fs.statSync(MOCK_DB_PATH).size;
const oldSize = fs.statSync(BACKUP_PATH).size;
console.log(`   Ukuran sebelum: ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Ukuran sesudah: ${(newSize / 1024 / 1024).toFixed(2)} MB`);

console.log('\n=== SELESAI ===\n');

// ============ HELPER ============

function fixProductObject(lines) {
  const text = lines.join('\n');
  let wasFixed = false;
  
  // Check if this product needs fixing (missing "images": array)
  const hasImages = text.includes('"images"');
  const hasStock = text.includes('"stock"');
  const hasStockStatus = text.includes('"stockStatus"');
  const hasCompatibility = text.includes('"compatibility"');
  const hasRating = text.includes('"rating"');
  const hasReviewCount = text.includes('"reviewCount"');
  const hasSold = text.includes('"sold"');
  const hasWeight = text.includes('"weight"');
  const hasImage = text.includes('"image"');
  
  // If it already has all required fields, return as-is
  if (hasImages && hasStock && hasStockStatus && hasCompatibility && hasRating && hasReviewCount && hasSold) {
    return { lines, wasFixed: false };
  }
  
  // This product needs fixing - find the closing brace line
  const newLines = [...lines];
  
  // Find the line with the closing "}" or "},"
  let closingIdx = newLines.length - 1;
  while (closingIdx >= 0 && !newLines[closingIdx].trim().startsWith('}')) {
    closingIdx--;
  }
  
  if (closingIdx < 0) return { lines, wasFixed: false };
  
  // Build additions
  const additions = [];
  const indent = '    '; // 4 spaces
  
  // Convert "image" to "images" if needed
  if (!hasImages && hasImage) {
    // Find the "image" line and replace it
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].includes('"image"')) {
        const match = newLines[i].match(/"image"\s*:\s*"([^"]*)"/);
        if (match) {
          const imageUrl = match[1] || 'https://placehold.co/400x400/2c3e50/fff?text=PRODUCT';
          newLines[i] = newLines[i].replace(
            /"image"\s*:\s*"[^"]*"/,
            `"images": ["${imageUrl}"]`
          );
        }
      }
    }
  } else if (!hasImages) {
    additions.push(`${indent}"images": ["https://placehold.co/400x400/2c3e50/fff?text=PRODUCT"]`);
  }
  
  if (!hasStock) additions.push(`${indent}"stock": 10`);
  if (!hasStockStatus) additions.push(`${indent}"stockStatus": "ready"`);
  if (!hasCompatibility) additions.push(`${indent}"compatibility": "Universal"`);
  if (!hasWeight) additions.push(`${indent}"weight": "500g"`);
  if (!hasRating) additions.push(`${indent}"rating": 4.0`);
  if (!hasReviewCount) additions.push(`${indent}"reviewCount": 0`);
  if (!hasSold) additions.push(`${indent}"sold": 0`);
  
  if (additions.length > 0) {
    wasFixed = true;
    
    // Make sure the line before closing brace has a comma
    const lineBeforeClose = newLines[closingIdx - 1];
    if (lineBeforeClose && !lineBeforeClose.trim().endsWith(',')) {
      newLines[closingIdx - 1] = lineBeforeClose.replace(/(\S)\s*$/, '$1,');
    }
    
    // Add new fields before closing brace, with commas
    const additionsWithCommas = additions.map((a, i) => 
      i < additions.length - 1 ? a + ',' : a
    );
    
    newLines.splice(closingIdx, 0, ...additionsWithCommas);
  }
  
  return { lines: newLines, wasFixed };
}
