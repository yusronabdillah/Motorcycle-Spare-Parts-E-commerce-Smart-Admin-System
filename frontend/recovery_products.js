const fs = require('fs');

console.log('=== RECOVERY SCRIPT DIMULAI ===\n');

// Step 1: Baca mock_db_clean.js (backup terbesar: 6211 produk)
const cleanRaw = fs.readFileSync('js/mock_db_clean.js', 'utf8');
const cleanMatch = cleanRaw.match(/const PRODUCTS = (\[[\s\S]*?\]);\n/);
const cleanAll = eval(cleanMatch[1]);
console.log(`Backup mock_db_clean.js       : ${cleanAll.length} produk`);

// Step 2: Baca mock_db_before_fix.js (backup kedua)
const beforeRaw = fs.readFileSync('js/mock_db_before_fix.js', 'utf8');
const beforeMatch = beforeRaw.match(/const PRODUCTS = (\[[\s\S]*?\]);\n/);
const beforeAll = eval(beforeMatch[1]);
console.log(`Backup mock_db_before_fix.js  : ${beforeAll.length} produk`);

// Step 3: Ambil produk non-Thalland dari backup terbesar (mock_db_clean)
const nonThallandClean = cleanAll.filter(p => {
  const brand = (p.brand || '').toUpperCase();
  return brand !== 'THALLAND' && !p.name?.toUpperCase().includes('THALLAND');
});
console.log(`Non-Thalland dari clean        : ${nonThallandClean.length} produk`);

// Step 4: Ambil produk non-Thalland dari before_fix (mungkin punya data yang tidak ada di clean)
const nonThallandBefore = beforeAll.filter(p => {
  const brand = (p.brand || '').toUpperCase();
  return brand !== 'THALLAND' && !p.name?.toUpperCase().includes('THALLAND');
});
console.log(`Non-Thalland dari before_fix   : ${nonThallandBefore.length} produk`);

// Step 5: Gabungkan non-Thalland, deduplikasi by ID
const seenIds = new Set();
const mergedNonThalland = [];

// Prioritaskan clean, lalu sebelum fix
for (const p of [...nonThallandClean, ...nonThallandBefore]) {
  const key = String(p.id).toLowerCase();
  if (!seenIds.has(key)) {
    seenIds.add(key);
    mergedNonThalland.push(p);
  }
}
console.log(`Non-Thalland setelah deduplikasi: ${mergedNonThalland.length} produk`);

// Step 6: Baca Thalland baru yang sudah bersih dari mock_db.js saat ini
const currentRaw = fs.readFileSync('js/mock_db.js', 'utf8');

// Gunakan bracket-depth finder untuk ekstrak array (karena regex bisa gagal pada file besar)
function extractArray(raw, varName) {
  const marker = `const ${varName} = [`;
  const startIdx = raw.indexOf(marker);
  if (startIdx === -1) return null;
  const arrayStart = startIdx + marker.length - 1; // posisi '['
  let depth = 0, inStr = false, esc = false;
  for (let j = arrayStart; j < raw.length; j++) {
    const c = raw[j];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) return raw.substring(arrayStart, j+1); }
    }
  }
  return null;
}

const currentArrayStr = extractArray(currentRaw, 'PRODUCTS');
if (!currentArrayStr) { console.error('ERROR: Tidak bisa extract PRODUCTS dari mock_db.js!'); process.exit(1); }
const currentAll = JSON.parse(currentArrayStr);
const newThalland = currentAll.filter(p => (p.brand || '').toUpperCase() === 'THALLAND');
console.log(`Thalland baru (current)        : ${newThalland.length} produk`);

// Step 7: Merge semua
const finalProducts = [...mergedNonThalland, ...newThalland];
console.log(`\nTotal final setelah merge      : ${finalProducts.length} produk`);

// Step 8: Hitung per brand
const brands = {};
finalProducts.forEach(p => {
  const b = p.brand || 'undefined';
  brands[b] = (brands[b] || 0) + 1;
});
console.log('\nProduk per brand (top 20):');
Object.entries(brands)
  .sort((a,b) => b[1]-a[1])
  .slice(0, 20)
  .forEach(([b, c]) => console.log(`  ${b}: ${c}`));

// Step 9: Pastikan semua field wajib ada
const cleaned = finalProducts.map(p => {
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    p.images = ['assets/images/placeholder.jpg'];
  }
  if (!p.stockStatus) p.stockStatus = 'ready';
  if (p.stock === undefined) p.stock = 10;
  if (!p.description) p.description = `Produk ${p.brand || ''} - ${p.name || ''}`.trim();
  if (!p.compatibility) p.compatibility = p.motor || p.name || '';
  return p;
});

// Step 10: Tulis ke mock_db.js dengan safe injection (tanpa re.sub)
const newArrayStr = JSON.stringify(cleaned, null, 2);

// Cari bracket PRODUCTS dan ganti dengan bracket tracker manual
const markerStart = 'const PRODUCTS = ';
const startIdx = currentRaw.indexOf(markerStart);
const arrayStart = currentRaw.indexOf('[', startIdx);

// Bracket depth tracking
let bracketDepth = 0;
let inString = false;
let escapeNext = false;
let i = arrayStart;
let endIdx = -1;

while (i < currentRaw.length) {
  const c = currentRaw[i];
  if (escapeNext) { escapeNext = false; }
  else if (c === '\\') { escapeNext = true; }
  else if (c === '"' && !escapeNext) { inString = !inString; }
  else if (!inString) {
    if (c === '[') bracketDepth++;
    else if (c === ']') {
      bracketDepth--;
      if (bracketDepth === 0) { endIdx = i + 1; break; }
    }
  }
  i++;
}

if (endIdx === -1) {
  console.error('ERROR: Tidak bisa menemukan akhir array PRODUCTS!');
  process.exit(1);
}

const newDbContent = currentRaw.substring(0, arrayStart) + newArrayStr + currentRaw.substring(endIdx);

fs.writeFileSync('js/mock_db.js', newDbContent, 'utf8');
console.log('\n=== RECOVERY SELESAI ===');
console.log(`mock_db.js berhasil ditulis dengan ${cleaned.length} produk.`);

// Validasi syntax via JSON.parse pada array
try {
  JSON.parse(newArrayStr);
  console.log('Validasi JSON: VALID ✓');
} catch(e) {
  console.error('Validasi JSON: ERROR!', e.message);
  process.exit(1);
}

// Laporan akhir
const before = currentAll.length;
const after = cleaned.length;
const nonThl = mergedNonThalland.length;
console.log(`\n=== LAPORAN RECOVERY ===`);
console.log(`Produk sebelum perbaikan: ${before}`);
console.log(`Produk sesudah perbaikan: ${after}`);
console.log(`Produk yang dipulihkan  : ${nonThl} (non-Thalland)`);
console.log(`Thalland tetap ada      : ${newThalland.length}`);
