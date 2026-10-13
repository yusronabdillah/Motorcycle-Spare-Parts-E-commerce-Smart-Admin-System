const fs = require('fs');
const path = require('path');
const vm = require('vm');

const newJsonPath = path.join(__dirname, '..', 'JSON', 'PL_VR_002_Juli_2026.json');
const mockDbPath = path.join(__dirname, '..', 'MotoSpare_Revisi', 'frontend', 'js', 'mock_db.js');

// Fix path issue because I might be running in a different dir context
const actualMockDbPath = 'c:\\\\Users\\\\Windows\\\\Videos\\\\sparepart motor update\\\\Q ACIANG UPDATE 23 05 2026\\\\Q_aciang\\\\Q_aciang\\\\Q_aciang\\\\MotoSpare_Revisi\\\\frontend\\\\js\\\\mock_db.js';
const actualJsonPath = 'c:\\\\Users\\\\Windows\\\\Videos\\\\sparepart motor update\\\\Q ACIANG UPDATE 23 05 2026\\\\Q_aciang\\\\Q_aciang\\\\Q_aciang\\\\JSON\\\\PL_VR_002_Juli_2026.json';

// SVG Generation Function (Copied/adapted from utils.js)
function generateSvgDataUri(name, category) {
    const text = (name + ' ' + category).toUpperCase();
    let svgIcon = `<path d="M12 2L2 7l10 5 10-5-10-5zm0 13l-10-5v5l10 5 10-5v-5l-10 5z"/>`; // Box default
    let color = '#475569';
    let bgColor = '#f1f5f9';

    if (text.includes('BATOK') || text.includes('COVER') || text.includes('SPAKBOR') || text.includes('BODY') || text.includes('SAYAP') || text.includes('KANCING')) {
        svgIcon = `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`;
        color = '#0284c7'; bgColor = '#e0f2fe';
    } else if (text.includes('PISTON') || text.includes('SEHER') || text.includes('CYLINDER') || text.includes('KLEP') || text.includes('MESIN') || text.includes('KREK')) {
        svgIcon = `<path d="M7 4v2h10V4H7zm1 4v12h8V8H8zm2 2h4v8h-4v-8zm-5 4v2h2v-2H5zm14 0v2h2v-2h-2z"/>`;
        color = '#ea580c'; bgColor = '#ffedd5';
    } else if (text.includes('CDI') || text.includes('SPULL') || text.includes('SAKLAR') || text.includes('KABEL') || text.includes('LAMPU') || text.includes('MIKA') || text.includes('STOP') || text.includes('KELISTRIKAN') || text.includes('BOHLAM')) {
        svgIcon = `<path d="M13 3L4 14h7v7l9-11h-7z"/>`;
        color = '#d97706'; bgColor = '#fef3c7';
    } else if (text.includes('GEAR') || text.includes('RANTAI') || text.includes('GIR') || text.includes('KOPLING') || text.includes('VANBELT') || text.includes('ROLLER')) {
        svgIcon = `<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`;
        color = '#4f46e5'; bgColor = '#e0e7ff';
    } else if (text.includes('SHOCK') || text.includes('SOK') || text.includes('PER') || text.includes('SUSPENSI')) {
        svgIcon = `<path d="M12 2c-1.1 0-2 .9-2 2v2H7v2h3v2H7v2h3v2H7v2h3v2c0 1.1.9 2 2 2s2-.9 2-2v-2h3v-2h-3v-2h3v-2h-3V8h3V6h-3V4c0-1.1-.9-2-2-2z"/>`;
        color = '#dc2626'; bgColor = '#fee2e2';
    } else if (text.includes('AKI') || text.includes('ACCU') || text.includes('BATTERY') || text.includes('BATERAI')) {
        svgIcon = `<path d="M16 4h-2V2h-4v2H8c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-6 10H8v-2h2v2zm4 0h-2v-2h2v2zm0-4H8V8h6v2z"/>`;
        color = '#059669'; bgColor = '#d1fae5';
    } else if (text.includes('OLI') || text.includes('CAIRAN') || text.includes('WATER') || text.includes('AEROSOL') || text.includes('CAT') || text.includes('SPRAY')) {
        svgIcon = `<path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/><path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>`;
        color = '#b45309'; bgColor = '#fef3c7';
    } else if (text.includes('BAN') || text.includes('TYRE') || text.includes('VELG') || text.includes('PELEK') || text.includes('RODA')) {
        svgIcon = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>`;
        color = '#0f172a'; bgColor = '#f1f5f9';
    } else if (text.includes('KAMPAS') || text.includes('REM') || text.includes('BRAKE') || text.includes('CAKRAM') || text.includes('DISC')) {
        // Brake icon (generic brake disc)
        svgIcon = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`;
        color = '#be123c'; bgColor = '#ffe4e6';
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bgColor}"/><g transform="scale(8) translate(13, 13)" fill="${color}">${svgIcon}</g></svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

function slugify(text) {
    if (!text) return 'uncategorized';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Generate realistic dummy rating averaging around 4.8
// Most items will be 4.8, 4.9, 5.0, some 4.6, 4.7, rarely 4.5
function generateRating() {
    const rand = Math.random();
    if (rand < 0.10) return 4.5 + (Math.random() * 0.1); // 4.5 - 4.6 (10%)
    if (rand < 0.25) return 4.6 + (Math.random() * 0.2); // 4.6 - 4.8 (15%)
    if (rand < 0.65) return 4.8 + (Math.random() * 0.1); // 4.8 - 4.9 (40%)
    return 4.9 + (Math.random() * 0.1); // 4.9 - 5.0 (35%)
}

console.log('Loading JSON...');
const jsonStr = fs.readFileSync(actualJsonPath, 'utf-8');
const newItems = JSON.parse(jsonStr);

console.log('Creating new PRODUCTS array...');
let newProducts = [];
let catCounts = {};
let totalRating = 0;

newItems.forEach((item, index) => {
    // Generate ID
    const idNum = (index + 1).toString().padStart(5, '0');
    const newId = 'SP' + idNum;
    
    // Generate Icon
    const svgUri = generateSvgDataUri(item.nama_barang || '', item.kategori || '');
    
    // Slugify Category
    const catSlug = slugify(item.kategori);
    if (!catCounts[catSlug]) {
        catCounts[catSlug] = { name: (item.kategori || 'Uncategorized').toUpperCase(), count: 0 };
    }
    catCounts[catSlug].count++;
    
    // Generate Rating
    let rating = generateRating();
    // Cap at 5.0 just in case
    rating = Math.min(5.0, Math.max(4.5, parseFloat(rating.toFixed(1))));
    totalRating += rating;
    
    // Random reviews count 10-100
    const reviewCount = Math.floor(Math.random() * 91) + 10;
    // Random sold count > review count
    const sold = reviewCount + Math.floor(Math.random() * 200) + 10;
    
    const prod = {
        id: newId,
        name: item.nama_barang || 'Unknown Product',
        category: catSlug,
        price: item.harga || 0,
        stock: item.qty || 0,
        stockStatus: (item.qty || 0) > 0 ? 'ready' : 'empty',
        images: [svgUri],
        description: "Produk " + (item.merk || 'Baru') + " - " + (item.nama_barang || ''),
        compatibility: item.aplikasi || "Universal",
        weight: 0.5,
        brand: item.merk || "No Brand",
        sku: "SKU-" + newId,
        partNumber: item.part_number,
        rating: rating,
        reviewCount: reviewCount,
        sold: sold,
        satuan: item.satuan,
        min_order: item.min_order,
        aplikasi: item.aplikasi
    };
    if (item.deskripsi) {
        prod.descriptionList = item.deskripsi;
    }
    
    newProducts.push(prod);
});

// Tuning average rating to exactly 4.80 if it strays too far (target ~ 4.8)
let currentAvg = totalRating / newProducts.length;
console.log('Initial average rating:', currentAvg.toFixed(3));
if (Math.abs(currentAvg - 4.8) > 0.05) {
    console.log('Tuning ratings to approach 4.8...');
    const diff = 4.8 - currentAvg;
    newProducts.forEach(p => {
        p.rating = parseFloat((p.rating + diff).toFixed(1));
        p.rating = Math.min(5.0, Math.max(4.5, p.rating));
    });
    let newTotal = 0;
    newProducts.forEach(p => newTotal += p.rating);
    currentAvg = newTotal / newProducts.length;
    console.log('Tuned average rating:', currentAvg.toFixed(3));
}

// Generate new CATEGORIES array
let newCategories = [
    { id: 'semua', name: 'SEMUA KATEGORI', icon: '🏍️', count: newProducts.length }
];
Object.keys(catCounts).forEach(slug => {
    newCategories.push({
        id: slug,
        name: catCounts[slug].name,
        icon: '🔧',
        count: catCounts[slug].count
    });
});

console.log('Reading mock_db.js to replace structure...');
let mockDbCode = fs.readFileSync(actualMockDbPath, 'utf-8');

// The original file starts with comments, then CATEGORIES, then PRODUCTS, then functions.
const prefixRegex = /^([\s\S]*?)const CATEGORIES = \[/m;
const prefixMatch = mockDbCode.match(prefixRegex);
let prefix = prefixMatch ? prefixMatch[1] : '// Generated mock_db.js\n\n';

const suffixRegex = /(function generateReviews[\s\S]*)$/;
const suffixMatch = mockDbCode.match(suffixRegex);
let suffix = suffixMatch ? suffixMatch[1] : '';

console.log('Writing back to mock_db.js...');
const newCode = prefix + 
    'const CATEGORIES = ' + JSON.stringify(newCategories, null, 2) + ';\n\n' +
    'const PRODUCTS = ' + JSON.stringify(newProducts, null, 2) + ';\n\n' +
    suffix;

fs.writeFileSync(actualMockDbPath, newCode, 'utf-8');

console.log('====================================');
console.log('Full Replace Summary:');
console.log('Total new items: ' + newProducts.length);
console.log('Average Rating: ' + (newProducts.reduce((sum, p) => sum + p.rating, 0) / newProducts.length).toFixed(3));
console.log('====================================');
