const fs = require('fs');

// Extract array safely using bracket depth
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
      else if(c===']'){d--;if(d===0) return raw.substring(ai,j+1);}
    }
  }
  return null;
}

const raw = fs.readFileSync('js/mock_db.js','utf8');
const PRODUCTS = JSON.parse(extractArray(raw,'PRODUCTS'));
const CATEGORIES = JSON.parse(extractArray(raw,'CATEGORIES'));

console.log('=== AUDIT DISTRIBUSI KATEGORI ===');
console.log('Total produk:', PRODUCTS.length);
console.log('Total kategori di CATEGORIES:', CATEGORIES.length);

// 1. Hitung empty category
const emptycat = PRODUCTS.filter(p => !p.category || p.category.trim()==='' || p.category==='null' || p.category==='undefined' || p.category==='semua');
console.log('Produk tanpa kategori valid:', emptycat.length);

// 2. Hitung per kategori slug
const catCount = {};
PRODUCTS.forEach(p => {
  const c = p.category || '__EMPTY__';
  catCount[c] = (catCount[c]||0)+1;
});

// 3. Cek kategori yang TIDAK ada di CATEGORIES list
const validCatIds = new Set(CATEGORIES.map(c => c.id));
const unknownCats = Object.keys(catCount).filter(c => c !== '__EMPTY__' && !validCatIds.has(c));
console.log('\nKategori di produk yang TIDAK ADA di CATEGORIES:', unknownCats.length);
unknownCats.slice(0,30).forEach(c => console.log(`  [${c}] : ${catCount[c]} produk`));

// 4. Top 20 kategori
console.log('\nTop 20 kategori terbesar:');
Object.entries(catCount).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([c,n]) => {
  const mark = validCatIds.has(c) ? '✓' : '⚠️ TIDAK ADA DI CATEGORIES';
  console.log(`  ${c}: ${n} ${mark}`);
});

// 5. Sample produk tanpa kategori
console.log('\nContoh produk tanpa kategori (10 pertama):');
emptycat.slice(0,10).forEach(p => console.log(`  [${p.id}] ${p.name} | brand:${p.brand}`));

// 6. Tampilkan semua CATEGORIES yang ada
console.log('\nSemua CATEGORIES yang terdaftar:');
CATEGORIES.forEach(c => {
  const cnt = catCount[c.id] || 0;
  console.log(`  [${c.id}] ${c.name}: ${cnt} produk`);
});

// ==========================================
// FASE 2: BACKFILL KATEGORI
// ==========================================

// Keyword mapping untuk backfill otomatis
const KEYWORD_TO_CATEGORY = {
  // THALLAND categories
  'aki': 'aki', 'accu': 'aki', 'battery': 'aki',
  'as forok': 'as-forok', 'as fork': 'as-forok',
  'as gear': 'as-gear',
  'as roda belakang': 'as-roda-belakang',
  'as roda depan': 'as-roda-depan',
  'as puly': 'as-puly', 'as puli': 'as-puly',
  'as shock': 'as-shock-depan',
  'bearing': 'bearing',
  'plat kopling': 'plat-kopling', 'besi plat': 'plat-kopling',
  'bohlam': 'bohlam', 'lampu': 'bohlam',
  'cage bosh': 'cage-bosh', 'cage + bosh': 'cage-bosh',
  'carburator': 'carburator', 'karburator': 'carburator',
  'cdi': 'cdi',
  'coil': 'coil', 'koil': 'coil',
  'comstir': 'comstir',
  'cool starter': 'cool-starter',
  'cylinder': 'cylinder', 'silinder': 'cylinder',
  'dinamo starter': 'dinamo', 'dinamo': 'dinamo',
  'dudukan footstep': 'dudukan-footstep',
  'dudukan gear': 'dudukan-gear',
  'filter pompa': 'filter-pompa', 'filter': 'filter-pompa',
  'forok belakang': 'forok-belakang',
  'gear set': 'gear-set', 'gear + rantai': 'gear-set',
  'gigi pompa': 'gigi-pompa',
  'gear speedometer': 'gear-speedometer',
  'injector': 'injector', 'injektor': 'injector',
  'kabel gas': 'kabel-gas',
  'kabel speedometer': 'kabel-speedometer', 'kabel spedo': 'kabel-speedometer',
  'kabel rem': 'kabel-rem',
  'karet kopling': 'karet-kopling', 'karet rumah': 'karet-kopling',
  'kunci kontak': 'kunci-kontak', 'konci kontak': 'kunci-kontak',
  'noken as': 'noken-as', 'nokken as': 'noken-as',
  'oil seal': 'oil-seal', 'seal': 'oil-seal',
  'otomatis kopling': 'otomatis-kopling', 'kopling': 'otomatis-kopling',
  'paking': 'paking', 'gasket': 'paking',
  'pedal operan': 'pedal-operan', 'pedal gigi': 'pedal-operan',
  'pedal kick': 'pedal-kick', 'kick starter': 'pedal-kick',
  'piringan rem': 'piringan-rem', 'disc rem': 'piringan-rem', 'cakram': 'piringan-rem',
  'piston ring': 'piston', 'piston': 'piston', 'ring piston': 'piston',
  'platuk klep': 'platuk-klep', 'klep': 'platuk-klep',
  'pompa injeksi': 'pompa-injeksi', 'fuel pump': 'pompa-injeksi',
  'puly': 'puly', 'puli': 'puly', 'pulley': 'puly',
  'rantai keteng': 'rantai-keteng', 'cam chain': 'rantai-keteng',
  'regulator': 'regulator',
  'repairkit': 'repairkit', 'repair kit': 'repairkit',
  'rumah injector': 'rumah-injector', 'joint injector': 'rumah-injector',
  'rumah pelor': 'rumah-pelor',
  'selang injek': 'selang-injektor', 'selang injector': 'selang-injektor',
  'sensor fuel': 'sensor', 'sensor spull': 'sensor', 'sensor': 'sensor',
  'shock belakang': 'shock-breker', 'shock breker': 'shock-breker', 'shockbreaker': 'shock-breker',
  'spull': 'spull', 'spool': 'spull',
  'stang seher': 'stang-seher', 'conrod': 'stang-seher',
  'tali dalam': 'tali-dalam',
  'tutup tanki': 'tutup-tanki', 'tutup tank': 'tutup-tanki',
  'van belt': 'van-belt', 'v belt': 'van-belt', 'vanbelt': 'van-belt',
  // Non-Thalland general categories
  'kampas rem': 'kampas-rem', 'brake pad': 'kampas-rem',
  'rantai': 'rantai', 'chain': 'rantai',
  'oli': 'oli', 'pelumas': 'oli',
  'busi': 'busi', 'spark plug': 'busi',
  'ban': 'ban', 'tyre': 'ban', 'tire': 'ban',
  'aki': 'aki',
  'helm': 'helm',
  'knalpot': 'knalpot', 'exhaust': 'knalpot',
  'spion': 'spion', 'kaca spion': 'spion',
  'handle': 'handle', 'stang': 'stang',
  'velg': 'velg', 'pelek': 'velg',
  'cat': 'cat', 'pilox': 'cat',
  'cover': 'body-cover', 'fairing': 'body-cover', 'body': 'body-cover',
  'lampu': 'lampu', 'headlamp': 'lampu', 'stop lamp': 'lampu',
  'rantai keteng': 'rantai-keteng',
};

// Fungsi backfill
function guessCategory(product) {
  if (!product) return null;
  const nameUpper = (product.name || '').toLowerCase();
  const motorUpper = (product.motor || '').toLowerCase();
  const combined = nameUpper + ' ' + motorUpper;

  // Sort keywords by length (terpanjang dulu = lebih spesifik)
  const sortedKeys = Object.keys(KEYWORD_TO_CATEGORY).sort((a,b) => b.length - a.length);
  
  for (const kw of sortedKeys) {
    if (combined.includes(kw)) {
      return KEYWORD_TO_CATEGORY[kw];
    }
  }
  return null;
}

// Lakukan backfill
let backfilled = 0;
let stillEmpty = 0;
const guessCatCount = {};

const updatedProducts = PRODUCTS.map(p => {
  const needsBackfill = !p.category || p.category.trim()==='' || p.category==='null' || 
                        p.category==='undefined' || p.category==='semua' || !validCatIds.has(p.category);
  
  if (needsBackfill) {
    const guess = guessCategory(p);
    if (guess) {
      guessCatCount[guess] = (guessCatCount[guess]||0)+1;
      backfilled++;
      return { ...p, category: guess };
    } else {
      stillEmpty++;
      return { ...p, category: 'semua' }; // fallback ke semua
    }
  }
  return p;
});

console.log('\n=== HASIL BACKFILL ===');
console.log(`Produk berhasil di-backfill: ${backfilled}`);
console.log(`Produk yang tidak bisa ditebak: ${stillEmpty} (ditempatkan di semua)`);
console.log('Distribusi backfill per kategori:');
Object.entries(guessCatCount).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));

// Hitung distribusi akhir
const finalCatCount = {};
updatedProducts.forEach(p => {
  const c = p.category || '__EMPTY__';
  finalCatCount[c] = (finalCatCount[c]||0)+1;
});

console.log('\n=== LAPORAN AKHIR ===');
console.log('Total produk:', updatedProducts.length);
console.log('Total kategori aktif:', Object.keys(finalCatCount).filter(c=>c!=='__EMPTY__').length);
console.log('Produk tanpa kategori:', finalCatCount['__EMPTY__'] || 0);
console.log('\nTop 20 kategori:');
Object.entries(finalCatCount).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([c,n]) => {
  console.log(`  ${c}: ${n} produk`);
});

// Simpan ke mock_db.js dengan bracket-depth replacement
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
console.log('\nmock_db.js berhasil diperbarui!');
