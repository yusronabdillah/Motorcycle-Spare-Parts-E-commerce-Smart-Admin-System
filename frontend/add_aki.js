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
      else if(c===']'){d--;if(d===0) return {str:raw.substring(ai,j+1),start:ai,end:j+1};}
    }
  }
  return {str:null,start:-1,end:-1};
}

const raw = fs.readFileSync('js/mock_db.js', 'utf8');
const {str: catStr, start: catA, end: catE} = extractArray(raw, 'CATEGORIES');
const cats = JSON.parse(catStr);

// Add missing aki category
const hasAki = cats.find(c => c.id === 'aki');
if (!hasAki) {
  cats.push({id: 'aki', name: 'AKI / ACCU', icon: '🔋'});
  console.log('Aki category added!');
}

const newCatStr = JSON.stringify(cats, null, 2);
const newContent = raw.substring(0, catA) + newCatStr + raw.substring(catE);
fs.writeFileSync('js/mock_db.js', newContent, 'utf8');
console.log('Total categories now:', cats.length);

// Final validation
try {
  require('./js/mock_db.js');
  console.log('mock_db.js SYNTAX: VALID');
} catch(e) {
  console.error('SYNTAX ERROR:', e.message);
}
