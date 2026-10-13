const fs = require('fs');
const vm = require('vm');

const dbPath = 'js/mock_db.js';
let dbCode = fs.readFileSync(dbPath, 'utf8');

// Load data into sandbox
const sandbox = { console };
let varCode = dbCode.replace(/^const /gm, 'var ');
vm.createContext(sandbox);
vm.runInContext(varCode, sandbox);

let PRODUCTS = sandbox.PRODUCTS;
let CATEGORIES = sandbox.CATEGORIES;

const totalBefore = PRODUCTS.length;
console.log(`Products before: ${totalBefore}`);

// Definisi Master Kategori (Kata kunci -> [ID, Nama, Icon])
const masterMap = [
  { keyword: 'COMPLETE SET', id: 'complete-set', name: 'COMPLETE SET', icon: '📦' },
  { keyword: 'REAR HANDLE COVER', id: 'rear-handle-cover', name: 'REAR HANDLE COVER', icon: '🛡️' },
  { keyword: 'COVER STOP', id: 'cover-stop', name: 'COVER STOP', icon: '🛑' },
  { keyword: 'FOOTREST', id: 'footrest', name: 'FOOTREST', icon: '👣' },
  { keyword: 'TUTUP KNALPOT', id: 'tutup-knalpot', name: 'TUTUP KNALPOT', icon: '🔥' },
  { keyword: 'COVER TANGKI', id: 'cover-tangki', name: 'COVER TANGKI', icon: '⛽' },
  { keyword: 'PANEL DEPAN', id: 'panel-depan', name: 'PANEL DEPAN', icon: '🔰' },
  { keyword: 'REAR FENDER', id: 'rear-fender', name: 'REAR FENDER', icon: '🏍️' },
  { keyword: 'BOX SAMPING', id: 'box-samping', name: 'BOX SAMPING', icon: '🧰' },
  { keyword: 'FILTER UDARA', id: 'filter-udara', name: 'FILTER UDARA', icon: '🌬️' },
  { keyword: 'BOX FILTER', id: 'filter-udara', name: 'FILTER UDARA', icon: '🌬️' }, // Alias
  { keyword: 'HELM IN', id: 'helm-in', name: 'HELM IN', icon: '🪖' },
  { keyword: 'HELMIN', id: 'helm-in', name: 'HELM IN', icon: '🪖' }, // Alias
  { keyword: 'PEDAL REM', id: 'pedal-rem', name: 'PEDAL REM', icon: '🦶' },
  { keyword: 'LEGSHIELD', id: 'legshield', name: 'LEGSHIELD', icon: '🧩' },
  { keyword: 'COVER BODY', id: 'cover-body', name: 'COVER BODY', icon: '🧥' },
  { keyword: 'COVER RADIATOR', id: 'cover-radiator', name: 'COVER RADIATOR', icon: '❄️' },
  { keyword: 'FRONT FENDER', id: 'front-fender', name: 'FRONT FENDER', icon: '🛡️' },
  { keyword: 'FRONT HANDLE COVER', id: 'front-handle-cover', name: 'FRONT HANDLE COVER', icon: '🛡️' },
  { keyword: 'GARNIS', id: 'garnis', name: 'GARNIS', icon: '✨' },
  { keyword: 'PANEL', id: 'panel', name: 'PANEL', icon: '🔰' },
  { keyword: 'LAMPU DEPAN', id: 'lampu-depan', name: 'LAMPU DEPAN', icon: '💡' },
  { keyword: 'STOP LAMP', id: 'stop-lamp', name: 'STOP LAMP', icon: '🛑' },
  { keyword: 'KAMPAS REM', id: 'kampas-rem', name: 'KAMPAS REM', icon: '🛑' },
  { keyword: 'KABEL SPEEDOMETER', id: 'kabel-speedometer', name: 'KABEL SPEEDOMETER', icon: '🎛️' },
  { keyword: 'AS KICK STARTER', id: 'as-kick-starter', name: 'AS KICK STARTER', icon: '🦵' },
  { keyword: 'AS FOROK', id: 'as-forok', name: 'AS FOROK', icon: '🔧' },
  { keyword: 'VAMBEL', id: 'vambel', name: 'VAMBEL', icon: '⚙️' },
  { keyword: 'SOK BELAKANG', id: 'sok-belakang', name: 'SOK BELAKANG', icon: '🏍️' },
  { keyword: 'TROMOL', id: 'tromol', name: 'TROMOL', icon: '💿' },
  { keyword: 'TENSIONER', id: 'tensioner', name: 'TENSIONER', icon: '⚙️' },
  { keyword: 'BLOK KIT', id: 'blok-kit', name: 'BLOK KIT', icon: '📦' },
  { keyword: 'PISTON KIT', id: 'piston-kit', name: 'PISTON KIT', icon: '⚙️' },
  { keyword: 'HANDFAT', id: 'handfat', name: 'HANDFAT', icon: '🤲' },
  { keyword: 'PRODUK BARU', id: 'produk-baru', name: 'PRODUK BARU', icon: '🆕' },
  { keyword: 'KURSI ANAK', id: 'kursi-anak', name: 'KURSI ANAK', icon: '🪑' },
];

let movedCount = 0;
let deletedCats = 0;
let newMastersAdded = [];

// 1. Perbarui Produk ke Master Kategori
PRODUCTS.forEach(p => {
  let matched = false;
  const pName = p.name ? p.name.toUpperCase() : '';
  const cId = p.category ? p.category.toUpperCase() : '';
  
  // Cek apakah produk ini cocok dengan kata kunci master kategori
  for (const master of masterMap) {
    if (pName.includes(master.keyword) || cId.includes(master.keyword)) {
      if (p.category !== master.id) {
        p.category = master.id;
        movedCount++;
      }
      matched = true;
      break;
    }
  }
  
  // Jika masih belum ada icon atau masuk ke kategori ganjil
  if (!matched && (!p.category || p.category === 'unknown')) {
     p.category = 'lainnya'; // Fallback aman
  }
});

// 2. Bangun Ulang Daftar Kategori yang valid
const usedCatIds = new Set(PRODUCTS.map(p => p.category));
usedCatIds.add('semua'); // Pastikan "semua" ada

let newCategories = [];

// Masukkan kategori lama yang masih digunakan
CATEGORIES.forEach(c => {
  if (usedCatIds.has(c.id)) {
    // Jika tidak punya icon, beri fallback
    if (!c.icon || String(c.icon).includes('undefine') || String(c.icon) === 'undefined') {
      c.icon = '🔧';
    }
    newCategories.push(c);
  } else {
    deletedCats++;
  }
});

// Masukkan kategori master baru jika ada produk di sana tapi kategorinya belum didaftarkan
masterMap.forEach(master => {
  if (usedCatIds.has(master.id)) {
    const exists = newCategories.find(c => c.id === master.id);
    if (!exists) {
      newCategories.push({
        id: master.id,
        name: master.name,
        icon: master.icon
      });
      newMastersAdded.push(master.name);
    } else {
      // Pastikan iconnya diperbarui
      exists.icon = master.icon;
      exists.name = master.name;
    }
  }
});

// Pastikan kategori "semua" selalu ada di posisi pertama
const idxSemua = newCategories.findIndex(c => c.id === 'semua');
if (idxSemua > -1) {
  const catSemua = newCategories.splice(idxSemua, 1)[0];
  newCategories.unshift(catSemua);
}

// ==========================
// 3. Rewrite mock_db.js
// ==========================
// Kita pakai regex untuk mengganti isinya dengan aman
const catString = JSON.stringify(newCategories, null, 2);
const prodString = JSON.stringify(PRODUCTS, null, 2);

// Replace CATEGORIES
dbCode = dbCode.replace(/const CATEGORIES = \[[\s\S]*?\];/, `const CATEGORIES = ${catString};`);

// Replace PRODUCTS
// Karena produknya besar (4104), pakai method substring untuk lebih aman daripada regex replace yang bisa stack overflow
const prodRegex = /const PRODUCTS = \[[\s\S]*?\];/;
const prodMatch = prodRegex.exec(dbCode);
if (prodMatch) {
  const beforeProd = dbCode.substring(0, prodMatch.index);
  const afterProd = dbCode.substring(prodMatch.index + prodMatch[0].length);
  dbCode = beforeProd + `const PRODUCTS = ${prodString};` + afterProd;
}

fs.writeFileSync(dbPath, dbCode, 'utf8');

console.log(`\n--- HASIL AUDIT & FIX ---`);
console.log(`Total Products: ${PRODUCTS.length} (Harus ${totalBefore})`);
console.log(`Produk yang dipindahkan: ${movedCount}`);
console.log(`Kategori yang dihapus (tidak digunakan / duplikat): ${deletedCats}`);
console.log(`Kategori Master yang ditambahkan: ${newMastersAdded.length}`);
if (newMastersAdded.length > 0) {
  console.log(`   - ${newMastersAdded.join(', ')}`);
}

// Double Check undefine
const badCat = newCategories.find(c => !c.icon || String(c.icon).includes('undefine'));
console.log(`\nApakah masih ada bug undefine di kategori? ${badCat ? 'YA! ERROR!' : 'TIDAK, SEMUA AMAN ✅'}`);
