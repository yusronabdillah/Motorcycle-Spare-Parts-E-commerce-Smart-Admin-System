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
      else if(c===']'){d--;if(d===0)return {str: raw.substring(ai,j+1), start: ai, end: j+1};}
    }
  }
  return null;
}

const raw = fs.readFileSync('js/mock_db.js','utf8');
const {str: prodStr, start: prodA, end: prodE} = extractArray(raw, 'PRODUCTS');
const {str: catStr, start: catA, end: catE} = extractArray(raw, 'CATEGORIES');

const PRODUCTS = JSON.parse(prodStr);
const OLD_CATEGORIES = JSON.parse(catStr);

console.log('=== NORMALISASI KATEGORI KE GRUP UTAMA ===');

const MAIN_CATEGORIES = [
  { id: 'semua', name: 'Semua Kategori', icon: '🏍️' },
  { id: 'mesin', name: 'MESIN', icon: '⚙️' },
  { id: 'transmisi', name: 'TRANSMISI & CVT', icon: '🔄' },
  { id: 'kelistrikan', name: 'KELISTRIKAN', icon: '⚡' },
  { id: 'kaki-kaki', name: 'KAKI-KAKI & KEMUDI', icon: '🔩' },
  { id: 'pengereman', name: 'PENGEREMAN', icon: '🛑' },
  { id: 'body', name: 'BODY & AKSESORIS', icon: '🛡️' },
  { id: 'oli', name: 'OLI & CAIRAN', icon: '🛢️' },
  { id: 'lainnya', name: 'LAINNYA', icon: '📦' }
];

// Mapping rules (Kata kunci -> ID Kategori Utama)
const MAPPING = {
  // MESIN
  'PISTON': 'mesin', 'RING': 'mesin', 'NOKEN AS': 'mesin', 'KLEP': 'mesin', 'BLOK': 'mesin', 'CYLINDER': 'mesin', 
  'KRUK AS': 'mesin', 'KARBURATOR': 'mesin', 'CARBURATOR': 'mesin', 'PAKING': 'mesin', 'GASKET': 'mesin', 
  'POMPA': 'mesin', 'INJEKTOR': 'mesin', 'INJECTOR': 'mesin', 'STANG SEHER': 'mesin', 'RADIATOR': 'mesin', 'THERMOSTAT': 'mesin', 'TENSIONER': 'mesin',
  
  // TRANSMISI & CVT
  'VAN BELT': 'transmisi', 'VAMBEL': 'transmisi', 'V-BELT': 'transmisi', 'ROLLER': 'transmisi', 'PULY': 'transmisi', 'PULLY': 'transmisi', 
  'KOPLING': 'transmisi', 'CLUTH': 'transmisi', 'GEAR': 'transmisi', 'GIR': 'transmisi', 'RANTAI': 'transmisi', 'GANDA': 'transmisi', 
  'LONCENG': 'transmisi', 'VERSENELAN': 'transmisi', 'OPERAN': 'transmisi',
  
  // KELISTRIKAN
  'AKI': 'kelistrikan', 'ACCU': 'kelistrikan', 'BATTERY': 'kelistrikan', 'SPULL': 'kelistrikan', 'SPUL': 'kelistrikan', 
  'CDI': 'kelistrikan', 'COIL': 'kelistrikan', 'KOIL': 'kelistrikan', 'BUSI': 'kelistrikan', 'DINAMO': 'kelistrikan', 'STATER': 'kelistrikan', 'STARTER': 'kelistrikan', 
  'LAMPU': 'kelistrikan', 'BOHLAM': 'kelistrikan', 'KABEL BODY': 'kelistrikan', 'SENSOR': 'kelistrikan', 'KUNCI KONTAK': 'kelistrikan', 
  'ECU': 'kelistrikan', 'REGULATOR': 'kelistrikan', 'KIPROK': 'kelistrikan', 'CIPROK': 'kelistrikan', 'SWITCH': 'kelistrikan', 'SAKLAR': 'kelistrikan', 'FLASER': 'kelistrikan', 'KLAKSON': 'kelistrikan', 'SPEEDOMETER': 'kelistrikan', 'SPIDOMETER': 'kelistrikan',
  
  // KAKI-KAKI & KEMUDI
  'SHOCK': 'kaki-kaki', 'SHOK': 'kaki-kaki', 'SOK': 'kaki-kaki', 'FOROK': 'kaki-kaki', 'FORK': 'kaki-kaki', 'VELG': 'kaki-kaki', 'PELEK': 'kaki-kaki', 
  'BAN': 'kaki-kaki', 'BEARING': 'kaki-kaki', 'LAHAR': 'kaki-kaki', 'COMSTIR': 'kaki-kaki', 'STANG': 'kaki-kaki', 'AS RODA': 'kaki-kaki', 
  'TROMOL': 'kaki-kaki', 'JARI': 'kaki-kaki', 'BOSH': 'kaki-kaki', 'CAGE': 'kaki-kaki', 'SEGITIGA': 'kaki-kaki', 'STANDART': 'kaki-kaki', 'FOOTSTEP': 'kaki-kaki', 'BARSTEP': 'kaki-kaki',
  
  // PENGEREMAN
  'REM': 'pengereman', 'PIRINGAN': 'pengereman', 'CAKRAM': 'pengereman', 'DISC': 'pengereman', 'KAMPAS': 'pengereman', 
  'MASTER': 'pengereman', 'PEDAL': 'pengereman',
  
  // BODY & AKSESORIS
  'BODY': 'body', 'COVER': 'body', 'SPION': 'body', 'KNALPOT': 'body', 'JOK': 'body', 'HELM': 'body', 
  'SPAKBOR': 'body', 'FENDER': 'body', 'LEGSHIELD': 'body', 'PANEL': 'body', 'GARNIS': 'body', 'TANGKI': 'body', 'TANKI': 'body', 'REFLEKTOR': 'body', 'BATOK': 'body', 'MIKA': 'body',
  
  // OLI & CAIRAN
  'OLI': 'oli', 'PELUMAS': 'oli', 'CAIRAN': 'oli', 'AIR': 'oli',
  
  // LAINNYA
  'CAT': 'lainnya', 'PILOX': 'lainnya', 'PYLOX': 'lainnya', 'BAUT': 'lainnya', 'MUR': 'lainnya', 'SEAL': 'lainnya', 'REPAIRKIT': 'lainnya', 'TALI': 'lainnya', 'KABEL': 'lainnya'
};

// Normalize PRODUCTS
let normalized = 0;
const catCounts = {};
MAIN_CATEGORIES.forEach(c => catCounts[c.id] = 0);

const updatedProducts = PRODUCTS.map(p => {
  const nameUpper = (p.name || '').toUpperCase();
  const motorUpper = (p.motor || '').toUpperCase();
  const oldCatUpper = (p.category || '').toUpperCase();
  const searchStr = nameUpper + ' ' + motorUpper + ' ' + oldCatUpper;
  
  let newCat = 'lainnya'; // Default
  
  // Find match
  for (const [kw, mainCat] of Object.entries(MAPPING)) {
    if (searchStr.includes(kw)) {
      newCat = mainCat;
      break;
    }
  }
  
  if (p.category !== newCat) {
    p.category = newCat;
    normalized++;
  }
  
  catCounts[newCat]++;
  return p;
});

console.log(`Produk berhasil dinormalisasi ke grup utama: ${normalized}`);

// Setup new CATEGORIES array with real counts
const finalCategories = MAIN_CATEGORIES.map(c => {
  if (c.id === 'semua') {
    return { ...c, count: PRODUCTS.length };
  } else {
    return { ...c, count: catCounts[c.id] };
  }
});

console.log('\n=== DISTRIBUSI KATEGORI BARU ===');
finalCategories.forEach(c => {
  console.log(`- ${c.name}: ${c.count} produk`);
});

// Write PRODUCTS back
const newProdStr = JSON.stringify(updatedProducts, null, 2);
const newCatStr = JSON.stringify(finalCategories, null, 2);

let newRaw = raw.substring(0, prodA) + newProdStr + raw.substring(prodE);

// Recalculate cat string indices since length changed
const {start: newCatA, end: newCatE} = extractArray(newRaw, 'CATEGORIES');
newRaw = newRaw.substring(0, newCatA) + newCatStr + newRaw.substring(newCatE);

fs.writeFileSync('js/mock_db.js', newRaw, 'utf8');
console.log('\nDatabase berhasil dinormalisasi dan disimpan ke mock_db.js!');
