const fs = require('fs');
const vm = require('vm');

let dbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(dbCode, sandbox);

const PRODUCTS = sandbox.PRODUCTS;
const CATEGORIES = sandbox.CATEGORIES;

console.log('--- AUDIT 1: Kategori "undefine" ---');

// Temukan kategori yang icon atau namanya terkait dengan "undefine"
const undefineCats = CATEGORIES.filter(c => c.icon === 'undefine' || c.name.toLowerCase().includes('undefine') || c.id.toLowerCase().includes('undefine'));
console.log('Kategori terkait undefine:', undefineCats.length);

// Berapa banyak produk di kategori-kategori ini?
const undefineCatIds = undefineCats.map(c => c.id);
const undefineProducts = PRODUCTS.filter(p => undefineCatIds.includes(p.category) || p.category.toLowerCase().includes('undefine'));
console.log('Jumlah produk di kategori undefine:', undefineProducts.length);

// Kelompokkan produk undefine berdasarkan kategori asalnya
const undefineGroups = {};
undefineProducts.forEach(p => {
  const catInfo = undefineCats.find(c => c.id === p.category) || { name: p.category };
  undefineGroups[catInfo.name] = (undefineGroups[catInfo.name] || 0) + 1;
});

console.log('\n--- 50 Kategori Terbesar di Undefine ---');
const sortedGroups = Object.entries(undefineGroups)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50);

sortedGroups.forEach(([name, count]) => {
  console.log(`${name} = ${count} produk`);
});

// Cek dari array CATEGORIES, seperti apa bentuk master kategorinya?
console.log('\n--- Struktur 5 Kategori Undefine Terbesar ---');
sortedGroups.slice(0, 5).forEach(([name, count]) => {
  const catInfo = CATEGORIES.find(c => c.name === name);
  console.log(catInfo);
});

// Cek sumber import/kategorisasi. Apakah ada fungsi yang mengubah icon menjadi "undefine" jika tidak ada di mapping?
const fsCode = fs.readFileSync('js/loadCategories.js', 'utf8');
const undefineInCode = fsCode.includes('undefine');
console.log('\nApakah kata "undefine" ada di loadCategories.js?', undefineInCode);
