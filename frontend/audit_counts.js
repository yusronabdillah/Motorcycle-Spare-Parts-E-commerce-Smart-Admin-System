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

console.log('=== DATABASE (mock_db.js) ===');
const dbCount = {};
PRODUCTS.forEach(p => {
  const c = p.category || '__EMPTY__';
  dbCount[c] = (dbCount[c]||0) + 1;
});
console.log('Total products:', PRODUCTS.length);
console.log('Total categories:', CATEGORIES.length);

console.log('\n=== API / MOCK_DB CATEGORIES ARRAY ===');
let zeroCountInArray = 0;
CATEGORIES.forEach(c => {
  if (c.count === 0 || c.count === undefined) {
    zeroCountInArray++;
  }
});
console.log('Categories with count=0 or undefined in CATEGORIES array:', zeroCountInArray);

console.log('\nSample comparison (DB count vs CATEGORIES array count):');
CATEGORIES.slice(0, 10).forEach(c => {
  console.log(`- ${c.name} (${c.id})`);
  console.log(`    DB Product Count : ${dbCount[c.id] || 0}`);
  console.log(`    CATEGORIES.count : ${c.count !== undefined ? c.count : 'undefined'}`);
});

console.log('\nTo fix this: We need to either dynamically calculate count in api.js, or update mock_db.js CATEGORIES array to have correct count.');
