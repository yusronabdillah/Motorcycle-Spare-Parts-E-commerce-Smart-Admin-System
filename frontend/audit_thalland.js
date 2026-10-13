const fs = require('fs');
const vm = require('vm');

let dbCode = fs.readFileSync('frontend/js/mock_db.js', 'utf8').replace(/^const /gm, 'var ');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(dbCode, sandbox);

const PRODUCTS = sandbox.PRODUCTS;

const totalDb = PRODUCTS.length;
const totalThalland = PRODUCTS.filter(p => p.name.toUpperCase().includes('THALLAND') || p.brand?.toUpperCase().includes('THALLAND')).length;

console.log(`TOTAL PRODUK DATABASE: ${totalDb}`);
console.log(`TOTAL PRODUK THALLAND DI DATABASE: ${totalThalland}`);

console.log('\n--- Kategori yang dicari User ---');
const cats = [
  'CARBURATOR ASSY',
  'CDI UNIT',
  'COIL IGNITION',
  'CYLINDER KIT ASSY',
  'DINAMO STARTER ASSY',
  'DISC PAD',
  'ECU',
  'FILTER POMPA',
  'FOROK BELAKANG'
];

cats.forEach(c => {
  const count = PRODUCTS.filter(p => p.name.toUpperCase().includes(c)).length;
  console.log(`${c} = ${count}`);
});
