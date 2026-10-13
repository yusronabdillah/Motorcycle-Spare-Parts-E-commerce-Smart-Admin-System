const fs = require('fs');

function extractArray(raw, varName) {
  const marker = `const ${varName} = [`;
  const si = raw.indexOf(marker);
  if (si === -1) return { str: null, start: -1, end: -1 };
  const ai = si + marker.length - 1;
  let d=0, ins=false, esc=false;
  for (let j=ai; j<raw.length; j++) {
    const c = raw[j];
    if (esc){esc=false;continue;}
    if (c==='\\'){esc=true;continue;}
    if (c==='"'){ins=!ins;continue;}
    if (!ins){
      if(c==='[') d++;
      else if(c===']'){d--;if(d===0)return{str:raw.substring(ai,j+1),start:ai,end:j+1};}
    }
  }
  return {str:null,start:-1,end:-1};
}

const raw = fs.readFileSync('js/mock_db.js','utf8');
const PRODUCTS = JSON.parse(extractArray(raw,'PRODUCTS').str);
const CATEGORIES = JSON.parse(extractArray(raw,'CATEGORIES').str);

// Hitung produk per kategori
const catCount = {};
PRODUCTS.forEach(p => {
  const c = p.category || '__EMPTY__';
  catCount[c] = (catCount[c]||0)+1;
});

// Kategorisasi
const empty = CATEGORIES.filter(c => !catCount[c.id] || catCount[c.id] === 0);
const single = CATEGORIES.filter(c => catCount[c.id] === 1);
const multi = CATEGORIES.filter(c => catCount[c.id] > 1);

console.log('=== AUDIT STRUKTUR KATEGORI ===');
console.log(`Total kategori di CATEGORIES    : ${CATEGORIES.length}`);
console.log(`Kategori dengan 0 produk        : ${empty.length}`);
console.log(`Kategori dengan 1 produk saja   : ${single.length}`);
console.log(`Kategori dengan > 1 produk      : ${multi.length}`);
console.log(`Total produk                    : ${PRODUCTS.length}`);

// Slug di produk yang tidak ada di CATEGORIES
const validSlugs = new Set(CATEGORIES.map(c=>c.id));
const unknownInProducts = {};
PRODUCTS.forEach(p => {
  if(p.category && !validSlugs.has(p.category)) {
    unknownInProducts[p.category] = (unknownInProducts[p.category]||0)+1;
  }
});
console.log(`Slug di produk yang tidak ada di CATEGORIES: ${Object.keys(unknownInProducts).length}`);

console.log('\n=== TOP 50 KATEGORI BERDASARKAN PRODUK ===');
Object.entries(catCount)
  .sort((a,b)=>b[1]-a[1])
  .slice(0,50)
  .forEach(([id,n],i) => {
    const def = CATEGORIES.find(c=>c.id===id);
    const name = def ? def.name : '⚠️ TIDAK ADA DI CATEGORIES';
    console.log(`${String(i+1).padStart(2)}. [${id}] "${name}" = ${n} produk`);
  });

console.log('\n=== KATEGORI DENGAN 0 PRODUK (KOSONG) ===');
empty.forEach(c => console.log(`  [${c.id}] ${c.name}`));
