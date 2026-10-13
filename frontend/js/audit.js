const fs = require('fs');
const vm = require('vm');

const MOCK_DB_PATH = './mock_db.js';
const code = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
vm.runInThisContext(code, { filename: 'mock_db.js' });

const report = {
  products: PRODUCTS.length,
  categories: CATEGORIES.length,
  emptyCategoryProducts: [],
  orphanProducts: [], // category does not exist in CATEGORIES
  orphanCategories: [], // no products in this category
  invalidSlugs: [], // Category IDs that don't match slugified names or contain invalid URL chars
  invalidRoutes: [], // Product IDs that contain invalid URL chars
  brokenIcons: [], // Categories without valid icons
  duplicateProducts: [],
  duplicateCategories: [],
  thallandAnalysis: {
    total: 0,
    missingCategoryRelation: 0, // category ID in product doesn't exist in CATEGORIES array
    categoryDeleted: 0, // category doesn't exist at all
    slugMismatch: 0, // product category ID doesn't match the standard slug format
  }
};

// 1. Check Duplicate Categories
const catIdMap = new Map();
CATEGORIES.forEach(c => {
  if (catIdMap.has(c.id)) {
    report.duplicateCategories.push(c.id);
  } else {
    catIdMap.set(c.id, 1);
  }
  
  // 6. Broken icons
  if (!c.icon || c.icon.trim() === '' || c.icon === 'undefined') {
    report.brokenIcons.push(c.id);
  }

  // 7. Invalid Slugs (Category IDs)
  // Check if category ID contains spaces or uppercase
  if (c.id !== 'semua' && !/^[a-z0-9\-_]+$/.test(c.id)) {
    report.invalidSlugs.push({ id: c.id, reason: 'Contains invalid characters' });
  }

  // Check mismatch between loadCategories.js slug logic and actual ID
  const expectedSlug = c.name ? c.name.toLowerCase()
    .replace(/\+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') : '';
    
  if (c.id !== 'semua' && c.id !== expectedSlug && c.id.replace(/_/g, '-') !== expectedSlug) {
    report.invalidSlugs.push({ id: c.id, name: c.name, expectedSlug });
  }
});

// 2. Check Duplicate Products
const prodIdMap = new Map();
const prodCategoryCount = new Map();

PRODUCTS.forEach(p => {
  const pId = String(p.id);
  
  if (prodIdMap.has(pId)) {
    report.duplicateProducts.push(pId);
  } else {
    prodIdMap.set(pId, 1);
  }

  // 8. Invalid routes (Product IDs)
  if (pId.includes('/') || pId.includes('#') || pId.includes('?') || pId.includes(' ')) {
    report.invalidRoutes.push(pId);
  }

  // 2. Empty Category
  if (!p.category || String(p.category).trim() === '') {
    report.emptyCategoryProducts.push(pId);
  } else {
    prodCategoryCount.set(p.category, (prodCategoryCount.get(p.category) || 0) + 1);
    
    // 9. Orphan Products
    if (!catIdMap.has(p.category)) {
      report.orphanProducts.push({ id: pId, category: p.category });
    }
  }

  // Thalland specific
  if (p.brand === 'THALLAND' || (p.sku && p.sku.startsWith('THL-'))) {
    report.thallandAnalysis.total++;
    if (!catIdMap.has(p.category)) {
      report.thallandAnalysis.missingCategoryRelation++;
    }
  }
});

// 10. Orphan Categories
CATEGORIES.forEach(c => {
  if (c.id !== 'semua' && !prodCategoryCount.has(c.id)) {
    report.orphanCategories.push(c.id);
  }
});

fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
console.log('Audit completed. Result written to audit_report.json');
