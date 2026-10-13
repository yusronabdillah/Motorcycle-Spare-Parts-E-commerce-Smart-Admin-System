const fs = require('fs');
const vm = require('vm');

const MOCK_DB_PATH = './mock_db.js';

function toCleanSlug(text) {
  if (!text) return 'unknown';
  return text.toLowerCase()
    .replace(/\+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const code = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
const wrapper = code.replace(/const /g, 'var ');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(wrapper, sandbox);

let { CATEGORIES, PRODUCTS } = sandbox;
const oldIdToNewSlug = new Map();

// 1. Re-map CATEGORIES IDs to slug of their names (so loadCategories.js will match)
CATEGORIES.forEach(c => {
  if (c.id === 'semua') return;
  const nameSlug = toCleanSlug(c.name);
  if (c.id !== nameSlug) {
    oldIdToNewSlug.set(c.id, nameSlug);
    c.id = nameSlug;
  }
});

// 2. Re-map PRODUCTS categories
PRODUCTS.forEach(p => {
  if (oldIdToNewSlug.has(p.category)) {
    p.category = oldIdToNewSlug.get(p.category);
  }
});

// 3. Rewrite file
const lines = code.split('\n');
let catStart = -1, catEnd = -1;
let prodStart = -1, prodEnd = -1;
let braceDepth = 0;
let inCat = false;
let inProd = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === 'const CATEGORIES = [') { catStart = i; inCat = true; braceDepth = 0; continue; }
  if (line.trim() === 'const PRODUCTS = [') { prodStart = i; inProd = true; braceDepth = 0; continue; }
  
  if (inCat) {
    if (line.trim() === '];' && braceDepth === 0) { catEnd = i; inCat = false; continue; }
    braceDepth += (line.match(/\{/g) || []).length; braceDepth -= (line.match(/\}/g) || []).length;
  }
  if (inProd) {
    if (line.trim() === '];' && braceDepth === 0) { prodEnd = i; inProd = false; continue; }
    braceDepth += (line.match(/\{/g) || []).length; braceDepth -= (line.match(/\}/g) || []).length;
  }
}

const catString = 'const CATEGORIES = ' + JSON.stringify(CATEGORIES, null, 2) + ';';
const prodString = 'const PRODUCTS = ' + JSON.stringify(PRODUCTS, null, 2) + ';';

let newLines = [...lines];
newLines.splice(prodStart, prodEnd - prodStart + 1, prodString);
newLines.splice(catStart, catEnd - catStart + 1, catString);

fs.writeFileSync(MOCK_DB_PATH, newLines.join('\n'), 'utf-8');
console.log(`✅ Fixed ${oldIdToNewSlug.size} mismatches between category.id and slugified category.name`);
