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

console.log('=== AUDIT KATEGORI KOSONG ===');
// Cari kategori 0
const catCount = {};
PRODUCTS.forEach(p => {
  const c = p.category || '__EMPTY__';
  catCount[c] = (catCount[c]||0)+1;
});

const emptyCats = CATEGORIES.filter(c => !catCount[c.id]);
console.log(`Total kategori kosong (count = 0) : ${emptyCats.length}`);

// Mari kita ambil contoh kategori yang dikeluhkan user:
const targets = [
  'SPULL LAMPU', 'SENSOR STEPPING', 'SAKLAR LAMPU', 'RUMAH PELOR PLAT STARTER ASSY'
];

targets.forEach(t => {
  console.log(`\nCari produk dengan string: "${t}"`);
  const matches = PRODUCTS.filter(p => 
    (p.name && p.name.toUpperCase().includes(t)) || 
    (p.motor && p.motor.toUpperCase().includes(t)) ||
    (p.category && p.category.toUpperCase().includes(t))
  );
  console.log(`Ditemukan ${matches.length} produk.`);
  
  if (matches.length > 0) {
    console.log(`Sample Category mereka saat ini:`);
    matches.slice(0, 3).forEach(p => {
      console.log(` - ID: ${p.id}, Name: ${p.name}`);
      console.log(`   Category Slug: "${p.category}"`);
    });
  }
  
  // Cari slug untuk kategori ini di daftar CATEGORIES
  const catObj = CATEGORIES.find(c => c.name.toUpperCase().includes(t));
  if (catObj) {
    console.log(`Kategori di sidebar (CATEGORIES):`);
    console.log(` - ID/Slug : "${catObj.id}"`);
    console.log(` - Name    : "${catObj.name}"`);
    console.log(` - Count in DB (catCount[${catObj.id}]): ${catCount[catObj.id] || 0}`);
  }
});
