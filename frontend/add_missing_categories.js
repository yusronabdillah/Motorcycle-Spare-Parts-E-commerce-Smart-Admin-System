const fs = require('fs');

function extractArray(raw, varName) {
  const marker = `const ${varName} = [`;
  const si = raw.indexOf(marker);
  if (si === -1) return { str: null, start: -1, end: -1 };
  const ai = si + marker.length - 1;
  let d=0, ins=false, esc=false;
  for (let j=ai; j<raw.length; j++) {
    const c=raw[j];
    if(esc){esc=false;continue;}
    if(c==='\\'){esc=true;continue;}
    if(c==='"'){ins=!ins;continue;}
    if(!ins){if(c==='[')d++;else if(c===']'){d--;if(d===0)return{str:raw.substring(ai,j+1),start:ai,end:j+1};}}
  }
  return {str:null,start:-1,end:-1};
}

const raw = fs.readFileSync('js/mock_db.js','utf8');
const {str: prodStr} = extractArray(raw,'PRODUCTS');
const {str: catStr, start: catStart, end: catEnd} = extractArray(raw,'CATEGORIES');

const PRODUCTS = JSON.parse(prodStr);
const CATEGORIES = JSON.parse(catStr);

// Kumpulkan semua slug kategori yang dipakai produk
const usedSlugs = {};
PRODUCTS.forEach(p => {
  if (p.category && p.category !== 'semua') {
    usedSlugs[p.category] = (usedSlugs[p.category]||0)+1;
  }
});

const existingSlugs = new Set(CATEGORIES.map(c => c.id));

// Temukan slug yang hilang dari CATEGORIES
const missingSlugs = Object.entries(usedSlugs)
  .filter(([slug]) => !existingSlugs.has(slug))
  .sort((a,b) => b[1]-a[1]);

console.log(`Missing slugs yang perlu ditambahkan: ${missingSlugs.length}`);
missingSlugs.forEach(([s,n]) => console.log(`  [${s}] : ${n} produk`));

// Definisi kategori-kategori yang hilang beserta nama dan icon
const MISSING_CATEGORY_DEFS = {
  'carburator': { name: 'KARBURATOR ASSY', icon: '⚙️' },
  'otomatis-kopling': { name: 'OTOMATIS KOPLING', icon: '🔧' },
  'van-belt': { name: 'VAN BELT', icon: '🔄' },
  'paking': { name: 'PAKING SET', icon: '📦' },
  'spull': { name: 'SPULL ASSY', icon: '⚡' },
  'dinamo': { name: 'DINAMO STARTER', icon: '🔋' },
  'rumah-pelor': { name: 'RUMAH PELOR', icon: '🔩' },
  'lampu': { name: 'LAMPU', icon: '💡' },
  'handle': { name: 'HANDLE GRIP', icon: '🏍️' },
  'oli': { name: 'OLI MESIN', icon: '🛢️' },
  'shock-breker': { name: 'SHOCK BREKER', icon: '🔧' },
  'piston': { name: 'PISTON RING', icon: '🔩' },
  'gear-set': { name: 'GEAR SET', icon: '⚙️' },
  'cylinder': { name: 'CYLINDER KIT', icon: '🔧' },
  'rantai': { name: 'RANTAI RODA', icon: '🔗' },
  'rantai-keteng': { name: 'RANTAI KETENG', icon: '🔗' },
  'regulator': { name: 'REGULATOR ASSY', icon: '⚡' },
  'cage-bosh': { name: 'CAGE BOSH MIMIS', icon: '🔩' },
  'repairkit': { name: 'REPAIRKIT', icon: '🛠️' },
  'as-gear': { name: 'AS GEAR DEPAN', icon: '⚙️' },
  'coil': { name: 'COIL IGNITION', icon: '⚡' },
  'busi': { name: 'BUSI', icon: '🔥' },
  'body-cover': { name: 'BODY COVER', icon: '🏍️' },
  'platuk-klep': { name: 'PLATUK KLEP', icon: '🔩' },
  'filter-pompa': { name: 'FILTER POMPA', icon: '🔧' },
  'pompa-injeksi': { name: 'POMPA INJEKSI', icon: '💉' },
  'pedal-operan': { name: 'PEDAL OPERAN GIGI', icon: '🦶' },
  'pedal-kick': { name: 'PEDAL KICK STARTER', icon: '🦶' },
  'knalpot': { name: 'KNALPOT', icon: '💨' },
  'bohlam': { name: 'BOHLAM', icon: '💡' },
  'velg': { name: 'VELG/PELEK', icon: '⭕' },
  'stang': { name: 'STANG', icon: '🏍️' },
  'as-puly': { name: 'AS PULY', icon: '⚙️' },
  'spion': { name: 'SPION', icon: '🔭' },
  'cat': { name: 'CAT/PYLOX', icon: '🎨' },
  'ban': { name: 'BAN', icon: '⭕' },
  'helm': { name: 'HELM', icon: '⛑️' },
  'dudukan-gear': { name: 'DUDUKAN GEAR', icon: '⚙️' },
  'gigi-pompa': { name: 'GIGI POMPA OLI', icon: '⚙️' },
  'plat-kopling': { name: 'PLAT KOPLING', icon: '🔧' },
  'karet-kopling': { name: 'KARET KOPLING', icon: '🔩' },
  'comstir': { name: 'COMSTIR', icon: '⚙️' },
  'as-forok': { name: 'AS FOROK TENGAH', icon: '🔩' },
  'oil-seal': { name: 'OIL SEAL', icon: '🔧' },
  'cool-starter': { name: 'COOL STARTER', icon: '❄️' },
  'forok-belakang': { name: 'FOROK BELAKANG', icon: '🔧' },
  'puly': { name: 'PULY', icon: '⚙️' },
  'gear-speedometer': { name: 'GEAR SPEEDOMETER', icon: '🔢' },
  'tali-dalam': { name: 'TALI DALAM', icon: '🔗' },
  'tutup-tanki': { name: 'TUTUP TANKI', icon: '⛽' },
  'injector': { name: 'INJECTOR', icon: '💉' },
  'sensor': { name: 'SENSOR', icon: '📡' },
  'as-roda-depan': { name: 'AS RODA DEPAN', icon: '🔩' },
  'selang-injektor': { name: 'SELANG INJEKTOR', icon: '🔧' },
  'rumah-injector': { name: 'RUMAH INJECTOR', icon: '🔧' },
  'as-shock-depan': { name: 'AS SHOCK DEPAN', icon: '🔩' },
  'kabel-rem': { name: 'KABEL REM', icon: '🔗' },
  'dudukan-footstep': { name: 'DUDUKAN FOOTSTEP', icon: '🦶' },
  'stang-seher': { name: 'STANG SEHER', icon: '🔩' },
  'cover-tangki': { name: 'COVER TANGKI', icon: '⛽' },
  'piringan-rem': { name: 'PIRINGAN REM DISC', icon: '🔵' },
  'lain-lain': { name: 'LAIN-LAIN', icon: '📦' },
};

// Tambahkan kategori yang hilang ke CATEGORIES
let added = 0;
for (const [slug, count] of missingSlugs) {
  if (!existingSlugs.has(slug) && MISSING_CATEGORY_DEFS[slug]) {
    const def = MISSING_CATEGORY_DEFS[slug];
    CATEGORIES.push({
      id: slug,
      name: def.name,
      icon: def.icon,
      count: count
    });
    existingSlugs.add(slug);
    added++;
    console.log(`  ✓ Ditambahkan: [${slug}] ${def.name} (${count} produk)`);
  } else if (!existingSlugs.has(slug)) {
    console.log(`  ⚠️  Tidak ada definisi untuk: [${slug}] (${count} produk)`);
  }
}

console.log(`\nTotal kategori ditambahkan: ${added}`);
console.log(`Total CATEGORIES sekarang: ${CATEGORIES.length}`);

// Tulis CATEGORIES yang sudah diperbarui ke mock_db.js
const newCatStr = JSON.stringify(CATEGORIES, null, 2);
const newContent = raw.substring(0, catStart) + newCatStr + raw.substring(catEnd);
fs.writeFileSync('js/mock_db.js', newContent, 'utf8');
console.log('\nmock_db.js diperbarui dengan CATEGORIES baru!');

// Verifikasi akhir
const finalRaw = fs.readFileSync('js/mock_db.js','utf8');
const finalCatStr = extractArray(finalRaw,'CATEGORIES').str;
const finalCats = JSON.parse(finalCatStr);
const finalProdStr = extractArray(finalRaw,'PRODUCTS').str;
const finalProds = JSON.parse(finalProdStr);

const finalValidSlugs = new Set(finalCats.map(c => c.id));
const orphans = finalProds.filter(p => p.category && p.category !== 'semua' && !finalValidSlugs.has(p.category));
console.log(`\n=== VERIFIKASI AKHIR ===`);
console.log(`Total produk        : ${finalProds.length}`);
console.log(`Total kategori      : ${finalCats.length}`);
console.log(`Produk yatim (orphan): ${orphans.length}`);
if (orphans.length > 0) {
  const orphanCats = {};
  orphans.forEach(p => orphanCats[p.category] = (orphanCats[p.category]||0)+1);
  console.log('Kategori orphan:');
  Object.entries(orphanCats).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([c,n]) => console.log(`  [${c}]: ${n}`));
}
