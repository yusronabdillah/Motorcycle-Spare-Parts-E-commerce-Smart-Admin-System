const fs = require('fs');

function extractArray(raw, varName) {
  const marker = `const ${varName} = [`;
  const si = raw.indexOf(marker);
  if (si === -1) return null;
  const ai = si + marker.length - 1;
  let d=0, ins=false, esc=false;
  for (let j=ai; j<raw.length; j++) {
    const c = raw[j];
    if (esc){esc=false;continue;}
    if (c==='\\'){esc=true;continue;}
    if (c==='"'){ins=!ins;continue;}
    if (!ins){
      if(c==='[') d++;
      else if(c===']'){d--;if(d===0)return raw.substring(ai,j+1);}
    }
  }
  return null;
}

const raw = fs.readFileSync('js/mock_db.js','utf8');
const PRODUCTS = JSON.parse(extractArray(raw,'PRODUCTS'));
const CATEGORIES = JSON.parse(extractArray(raw,'CATEGORIES'));

console.log('=== FIX KATEGORI BERDASARKAN NAMA KATEGORI ===');

// Sort categories by name length descending (so "SPULL LAMPU" is matched before "SPULL")
const sortedCats = [...CATEGORIES].sort((a, b) => b.name.length - a.name.length);

let remapped = 0;
const updatedProducts = PRODUCTS.map(p => {
  const nameUpper = (p.name || '').toUpperCase();
  const motorUpper = (p.motor || '').toUpperCase();
  const combined = nameUpper + ' ' + motorUpper;
  
  // Find the most specific category match
  for (const cat of sortedCats) {
    if (cat.id === 'semua' || cat.id === 'lainnya' || cat.id === 'lain-lain') continue;
    if (combined.includes(cat.name.toUpperCase())) {
      if (p.category !== cat.id) {
        p.category = cat.id;
        remapped++;
      }
      return p;
    }
  }
  return p; // Keep current if no specific match
});

console.log(`Berhasil memetakan ulang (remapped): ${remapped} produk.`);

// Re-evaluate empty categories
const catCount = {};
updatedProducts.forEach(p => {
  catCount[p.category] = (catCount[p.category] || 0) + 1;
});

let emptyCount = 0;
CATEGORIES.forEach(c => {
  if (!catCount[c.id] || catCount[c.id] === 0) {
    emptyCount++;
  }
});
console.log(`Total kategori kosong sekarang: ${emptyCount} (turun dari 64)`);

// Tulis kembali PRODUCTS ke mock_db.js
const newArrayStr = JSON.stringify(updatedProducts, null, 2);

const markerStart = 'const PRODUCTS = [';
const si = raw.indexOf(markerStart);
const ai = si + markerStart.length - 1;
let d2=0, ins2=false, esc2=false, endIdx=-1;
for (let j=ai; j<raw.length; j++) {
  const c = raw[j];
  if (esc2){esc2=false;continue;}
  if (c==='\\'){esc2=true;continue;}
  if (c==='"'){ins2=!ins2;continue;}
  if (!ins2){
    if(c==='[') d2++;
    else if(c===']'){d2--;if(d2===0){endIdx=j+1;break;}}
  }
}

if (endIdx === -1) { console.error('ERROR: Tidak bisa menemukan akhir array!'); process.exit(1); }

const newContent = raw.substring(0, ai) + newArrayStr + raw.substring(endIdx);
fs.writeFileSync('js/mock_db.js', newContent, 'utf8');
console.log('mock_db.js berhasil diperbarui dengan kategori yang konsisten!');
