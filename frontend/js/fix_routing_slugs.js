const fs = require('fs');
const vm = require('vm');
const path = require('path');

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

function runFix() {
  console.log('=== FIXING ROUTING & SLUGS ===');
  
  // 1. Read mock_db.js
  const code = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
  
  // Create a wrapper to capture constants globally
  const wrapper = code.replace(/const /g, 'var ');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(wrapper, sandbox);
  
  let { CATEGORIES, PRODUCTS } = sandbox;
  let fixedCategoriesCount = 0;
  let newCategoriesCount = 0;
  let fixedProductsCount = 0;
  
  const oldToNewSlug = new Map();
  
  // 3. Fix Categories (Invalid Slugs)
  CATEGORIES = CATEGORIES.map(c => {
    if (c.id === 'semua') return c;
    const cleanId = toCleanSlug(c.id);
    if (c.id !== cleanId) {
      oldToNewSlug.set(c.id, cleanId);
      c.id = cleanId;
      fixedCategoriesCount++;
    }
    return c;
  });
  
  // Create a fast lookup for existing categories
  const catSet = new Set(CATEGORIES.map(c => c.id));
  
  // 4. Fix Products & Orphan References
  PRODUCTS = PRODUCTS.map(p => {
    let modified = false;
    
    // Fix missing description or ID
    if (!p.id || String(p.id) === 'null') {
      p.id = 'SP-UNKNOWN-' + Math.floor(Math.random() * 10000);
      modified = true;
    }
    if (typeof p.description !== 'string') {
      p.description = `Produk ${p.name || ''}`;
      modified = true;
    }
    
    // Fix mapped old slug
    if (oldToNewSlug.has(p.category)) {
      p.category = oldToNewSlug.get(p.category);
      modified = true;
    }
    
    // Fix general slug format for product category string
    const cleanCat = toCleanSlug(p.category);
    if (p.category !== cleanCat) {
      p.category = cleanCat;
      modified = true;
    }
    
    // Handle Orphan Categories
    if (p.category && !catSet.has(p.category)) {
      // Auto-generate missing category
      const catName = p.category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      const newCat = {
        id: p.category,
        name: catName.toUpperCase(),
        icon: '🔧'
      };
      
      CATEGORIES.push(newCat);
      catSet.add(p.category);
      newCategoriesCount++;
    }
    
    if (modified) fixedProductsCount++;
    return p;
  });
  
  // 5. Rewrite file carefully to preserve structure
  const lines = code.split('\n');
  
  let catStart = -1, catEnd = -1;
  let prodStart = -1, prodEnd = -1;
  let braceDepth = 0;
  let inCat = false;
  let inProd = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === 'const CATEGORIES = [') {
      catStart = i;
      inCat = true;
      braceDepth = 0;
      continue;
    }
    
    if (line.trim() === 'const PRODUCTS = [') {
      prodStart = i;
      inProd = true;
      braceDepth = 0;
      continue;
    }
    
    if (inCat) {
      if (line.trim() === '];' && braceDepth === 0) {
        catEnd = i;
        inCat = false;
        continue;
      }
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
    }
    
    if (inProd) {
      if (line.trim() === '];' && braceDepth === 0) {
        prodEnd = i;
        inProd = false;
        continue;
      }
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
    }
  }
  
  // Generate string versions
  const catString = 'const CATEGORIES = ' + JSON.stringify(CATEGORIES, null, 2) + ';';
  const prodString = 'const PRODUCTS = ' + JSON.stringify(PRODUCTS, null, 2) + ';';
  
  // Replace pieces (start from bottom up so indices don't shift)
  let newLines = [...lines];
  
  // Replace PRODUCTS first
  newLines.splice(prodStart, prodEnd - prodStart + 1, prodString);
  
  // Replace CATEGORIES
  newLines.splice(catStart, catEnd - catStart + 1, catString);
  
  fs.writeFileSync(MOCK_DB_PATH, newLines.join('\n'), 'utf-8');
  
  console.log('✅ Fix Completed!');
  console.log(`- Categories standardized: ${fixedCategoriesCount}`);
  console.log(`- New orphan categories generated: ${newCategoriesCount}`);
  console.log(`- Products fixed/remapped: ${fixedProductsCount}`);
}

runFix();
