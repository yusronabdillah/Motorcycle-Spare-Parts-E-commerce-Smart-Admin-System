const fs = require('fs');
const path = require('path');
const vm = require('vm');

const newJsonPath = 'c:\\\\Users\\\\Windows\\\\Videos\\\\sparepart motor update\\\\Q ACIANG UPDATE 23 05 2026\\\\Q_aciang\\\\Q_aciang\\\\Q_aciang\\\\JSON\\\\PL_VR_002_Juli_2026.json';
const mockDbPath = 'c:\\\\Users\\\\Windows\\\\Videos\\\\sparepart motor update\\\\Q ACIANG UPDATE 23 05 2026\\\\Q_aciang\\\\Q_aciang\\\\Q_aciang\\\\MotoSpare_Revisi\\\\frontend\\\\js\\\\mock_db.js';

// 1. Read New JSON
console.log('Loading new JSON...');
const newJsonStr = fs.readFileSync(newJsonPath, 'utf-8');
const newItems = JSON.parse(newJsonStr);

// 2. Read current mock_db.js
console.log('Loading current mock_db.js...');
let mockDbCode = fs.readFileSync(mockDbPath, 'utf-8');

// Use regex to extract CATEGORIES, PRODUCTS and the rest of the file
// This is safer than eval for rewriting later, but let's parse via vm first to get the objects.
let codeForVm = mockDbCode.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(codeForVm, sandbox);

let CATEGORIES = sandbox.CATEGORIES || [];
let PRODUCTS = sandbox.PRODUCTS || [];

// Create indexes
const prodByPartNumber = new Map();
const prodByName = new Map();
PRODUCTS.forEach(p => {
  if (p.partNumber) prodByPartNumber.set(p.partNumber.toLowerCase().trim(), p);
  if (p.name) prodByName.set(p.name.toLowerCase().trim(), p);
});

let updatedCount = 0;
let addedCount = 0;
let notFoundInNewCount = 0;

const updatedProducts = new Set();
const newProductsList = [];

// Helper to generate new ID
let maxId = 0;
PRODUCTS.forEach(p => {
    if (p && p.id && typeof p.id === 'string') {
        const idNum = parseInt(p.id.replace('SP', '')) || 0;
        if (idNum > maxId) maxId = idNum;
    }
});
function getNextId() {
    maxId++;
    return 'SP' + maxId.toString().padStart(5, '0');
}

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// 3. Process new JSON
console.log('Processing items...');
newItems.forEach(item => {
    let match = null;
    let pn = item.part_number ? item.part_number.toLowerCase().trim() : null;
    let nm = item.nama_barang ? item.nama_barang.toLowerCase().trim() : null;

    if (pn && prodByPartNumber.has(pn)) {
        match = prodByPartNumber.get(pn);
    } else if (nm && prodByName.has(nm)) {
        match = prodByName.get(nm);
    }

    let catSlug = slugify(item.kategori) || 'uncategorized';

    if (match) {
        // Update existing
        match.price = item.harga || match.price;
        match.stock = item.qty || match.stock;
        match.stockStatus = match.stock > 0 ? "ready" : "empty";
        match.name = item.nama_barang || match.name;
        match.partNumber = item.part_number || match.partNumber;
        match.category = catSlug;
        match.brand = item.merk || match.brand;
        
        // Preserve extra info
        match.satuan = item.satuan || match.satuan;
        match.min_order = item.min_order || match.min_order;
        match.aplikasi = item.aplikasi || match.aplikasi;
        
        if (item.deskripsi) {
             match.descriptionList = item.deskripsi;
        }

        updatedCount++;
        updatedProducts.add(match.id);
    } else {
        // Add new
        const newId = getNextId();
        const newProd = {
            id: newId,
            name: item.nama_barang || 'Unknown Product',
            category: catSlug,
            price: item.harga || 0,
            stock: item.qty || 0,
            stockStatus: (item.qty || 0) > 0 ? "ready" : "empty",
            images: ["https://placehold.co/400x400/2c3e50/fff?text=" + encodeURIComponent((item.nama_barang || '').substring(0, 10))],
            description: "Produk " + (item.merk || 'Baru') + " - " + item.nama_barang,
            compatibility: item.aplikasi || "Universal",
            weight: 0.5,
            brand: item.merk || "No Brand",
            sku: "SKU-" + newId,
            partNumber: item.part_number,
            rating: 0,
            reviewCount: 0,
            sold: 0,
            satuan: item.satuan,
            min_order: item.min_order,
            aplikasi: item.aplikasi
        };
        if (item.deskripsi) {
             newProd.descriptionList = item.deskripsi;
        }
        PRODUCTS.push(newProd);
        addedCount++;
        updatedProducts.add(newId);
    }
});

// 4. Mark discontinued
PRODUCTS.forEach(p => {
    if (!updatedProducts.has(p.id)) {
        p.discontinued = true;
        notFoundInNewCount++;
    }
});

// Update CATEGORIES counts
const catCounts = {};
PRODUCTS.forEach(p => {
    if (!catCounts[p.category]) catCounts[p.category] = 0;
    catCounts[p.category]++;
});

// We should merge categories if there are new ones
const existingCats = new Map();
CATEGORIES.forEach(c => existingCats.set(c.id, c));

Object.keys(catCounts).forEach(catId => {
    if (!existingCats.has(catId) && catId !== 'semua') {
        let originalName = catId;
        // Try to find the original category name from the JSON
        const example = newItems.find(item => slugify(item.kategori) === catId);
        if (example && example.kategori) {
            originalName = example.kategori.toUpperCase();
        }
        CATEGORIES.push({
            id: catId,
            name: originalName,
            icon: "🔧",
            count: catCounts[catId]
        });
    }
});

// Update counts in CATEGORIES array
CATEGORIES.forEach(c => {
    if (c.id === 'semua') {
        c.count = PRODUCTS.length;
    } else {
        c.count = catCounts[c.id] || 0;
    }
});

console.log('Writing back to mock_db.js...');

// Reconstruct file: we need to replace CATEGORIES and PRODUCTS in the original file
// but keep the comments and the bottom functions (generateReviews)
const prefixRegex = /^([\s\S]*?)const CATEGORIES = \[/m;
const prefixMatch = mockDbCode.match(prefixRegex);
let prefix = prefixMatch ? prefixMatch[1] : '// Generated mock_db.js\n\n';

const suffixRegex = /(function generateReviews[\s\S]*)$/;
const suffixMatch = mockDbCode.match(suffixRegex);
let suffix = suffixMatch ? suffixMatch[1] : '';

const newCode = prefix + 
    'const CATEGORIES = ' + JSON.stringify(CATEGORIES, null, 2) + ';\n\n' +
    'const PRODUCTS = ' + JSON.stringify(PRODUCTS, null, 2) + ';\n\n' +
    suffix;

fs.writeFileSync(mockDbPath, newCode, 'utf-8');

console.log('====================================');
console.log('Migration Summary:');
console.log('Items updated: ' + updatedCount);
console.log('Items added: ' + addedCount);
console.log('Old items not found in new JSON (marked discontinued): ' + notFoundInNewCount);
console.log('====================================');
