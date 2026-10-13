const fs = require('fs');
const vm = require('vm');

let dbCode = fs.readFileSync('js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(dbCode, sandbox);

const CATEGORIES = sandbox.CATEGORIES;
const PRODUCTS = sandbox.PRODUCTS;

let undefineCats = CATEGORIES.filter(c => c.icon === 'undefine' || c.name.includes('undefine') || String(c.icon).includes('undefine'));

console.log('Categories with icon="undefine" or similar:', undefineCats.length);

if (undefineCats.length === 0) {
  // Try finding any category that has "undefine" in ANY property
  const allUndef = CATEGORIES.filter(c => JSON.stringify(c).includes('undefine'));
  console.log('Categories with "undefine" anywhere:', allUndef.length);
  if(allUndef.length > 0) console.log(allUndef.slice(0, 5));
} else {
  console.log(undefineCats.slice(0, 5));
}

// Find categories starting with COMPLETE SET, REAR HANDLE COVER, etc.
const queryList = ['COMPLETE SET', 'REAR HANDLE COVER', 'COVER STOP', 'FOOTREST', 'TUTUP KNALPOT', 'COVER TANGKI', 'PANEL DEPAN', 'REAR FENDER', 'BOX SAMPING', 'FILTER UDARA', 'HELM IN', 'PEDAL REM'];

console.log('\n--- Checking missing categories ---');
queryList.forEach(q => {
  const matches = CATEGORIES.filter(c => c.name.toUpperCase().includes(q));
  console.log(`${q}: found ${matches.length} categories`);
  if (matches.length > 0) {
    console.log(`  Names: ${matches.map(c => c.name).join(', ')}`);
    console.log(`  Icons: ${matches.map(c => c.icon).join(', ')}`);
  }
});
