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

let partialMatchesFound = 0;

emptyCats.forEach(cat => {
  const words = cat.name.split(' ');
  const firstWord = words[0]; // Coba cari dengan kata pertama saja
  
  const matches = PRODUCTS.filter(p => 
    (p.name && p.name.toUpperCase().includes(firstWord.toUpperCase())) ||
    (p.motor && p.motor.toUpperCase().includes(firstWord.toUpperCase()))
  );
  
  if (matches.length > 0) {
    console.log(`[${cat.name}] -> Tidak ada yang sama persis, tapi ada ${matches.length} produk mengandung kata "${firstWord}"`);
    partialMatchesFound++;
  } else {
    console.log(`[${cat.name}] -> BENAR-BENAR KOSONG. Tidak ada produk yang mengandung "${firstWord}"`);
  }
});

console.log(`\nDari ${emptyCats.length} kategori kosong, ${partialMatchesFound} mungkin bisa diisi jika nama dipendekkan.`);
