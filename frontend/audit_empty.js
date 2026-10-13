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

const catCount = {};
PRODUCTS.forEach(p => catCount[p.category] = (catCount[p.category]||0)+1);

const emptyCats = CATEGORIES.filter(c => !catCount[c.id]);

console.log(`Kategori Kosong: ${emptyCats.length}`);
emptyCats.slice(0, 20).forEach(c => console.log(` - ${c.name} (${c.id})`));

console.log('\n=== SOLUSI PERMANEN: MENGHITUNG COUNT SAAT LOAD DI API.JS ===');
console.log('Karena CATEGORIES di database masih memiliki count:0 atau tidak sinkron dengan data.');
console.log('Kita harus update CATEGORIES list di mock_db.js ATAU update logika render di app.js.');
