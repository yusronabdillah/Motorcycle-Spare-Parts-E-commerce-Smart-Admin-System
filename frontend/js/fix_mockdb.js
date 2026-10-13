const fs = require('fs');

const dataJs = fs.readFileSync('c:/Users/Windows/Videos/Q ACIANG UPDATE 23 05 2026/Q_aciang/Q_aciang/Q_aciang/MotoSpare_Revisi/frontend/js/data.js', 'utf8');

const constants = ['BANNERS', 'SHIPPING_OPTIONS', 'BANK_OPTIONS', 'EWALLET_OPTIONS'];
let extracted = '';

for (const c of constants) {
  // Regex to match "const NAME = [...];" or "const NAME = {...};"
  // Needs to be careful with multi-line
  const regex = new RegExp(`const ${c} = ([\\s\\S]*?);\\n(?!\\s*\\/\\/|\\s*const|\\s*let|\\s*var)`);
  const match = dataJs.match(regex);
  if (match) {
    extracted += `\nconst ${c} = ${match[1]};\n`;
  } else {
    // If exact regex fails, try a simpler approach or just hardcode some defaults if not found
    console.log(`Failed to extract ${c}, using fallback.`);
    if (c === 'BANNERS') {
      extracted += `\nconst BANNERS = [\n  { title: "Promo", subtitle: "Diskon", bgColor: "#EE4D2D", textColor: "#fff" }\n];\n`;
    } else if (c === 'SHIPPING_OPTIONS') {
      extracted += `\nconst SHIPPING_OPTIONS = [{id:'reg', name:'Reguler', cost:15000, est:'2-3 hari'}];\n`;
    } else if (c === 'BANK_OPTIONS') {
      extracted += `\nconst BANK_OPTIONS = [{id:'bca', name:'BCA', logo:'🏦', account:'12345678', owner:'MotoSpare'}];\n`;
    } else if (c === 'EWALLET_OPTIONS') {
      extracted += `\nconst EWALLET_OPTIONS = [{id:'gopay', name:'GoPay', logo:'📱', phone:'0812345678'}];\n`;
    }
  }
}

const mockDbPath = 'c:/Users/Windows/Videos/Q ACIANG UPDATE 23 05 2026/Q_aciang/Q_aciang/Q_aciang/MotoSpare_Revisi/frontend/js/mock_db.js';
fs.appendFileSync(mockDbPath, extracted);

console.log('Appended missing constants to mock_db.js');
