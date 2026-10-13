const fs = require('fs');
const vm = require('vm');

const MOCK_DB_PATH = './mock_db.js';
const code = fs.readFileSync(MOCK_DB_PATH, 'utf-8');

const wrapper = code.replace(/const /g, 'var ');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(wrapper, sandbox);

let { CATEGORIES, PRODUCTS } = sandbox;

const seen = new Set();
const dedupedCategories = [];

for (const c of CATEGORIES) {
  if (seen.has(c.id)) continue;
  seen.add(c.id);
  dedupedCategories.push(c);
}

const lines = code.split('\n');
let catStart = -1, catEnd = -1;
let braceDepth = 0;
let inCat = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === 'const CATEGORIES = [') { catStart = i; inCat = true; braceDepth = 0; continue; }
  
  if (inCat) {
    if (line.trim() === '];' && braceDepth === 0) { catEnd = i; inCat = false; continue; }
    braceDepth += (line.match(/\{/g) || []).length; braceDepth -= (line.match(/\}/g) || []).length;
  }
}

const catString = 'const CATEGORIES = ' + JSON.stringify(dedupedCategories, null, 2) + ';';

let newLines = [...lines];
newLines.splice(catStart, catEnd - catStart + 1, catString);

fs.writeFileSync(MOCK_DB_PATH, newLines.join('\n'), 'utf-8');
console.log('✅ Removed duplicate categories.');
