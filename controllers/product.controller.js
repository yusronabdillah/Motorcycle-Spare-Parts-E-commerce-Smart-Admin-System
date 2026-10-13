const db = require('../db');

exports.getProducts = (req, res) => {
  let products = [...db.PRODUCTS];
  const { category, color, size, stock, sort, search } = req.query;

  if (category && category !== 'semua') {
    products = products.filter(p => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.compatibility.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (color) {
    const colors = color.split(',');
    products = products.filter(p => p.colors && p.colors.some(c => colors.includes(c)));
  }

  if (size) {
    const sizes = size.split(',');
    products = products.filter(p => p.sizes && p.sizes.some(s => sizes.includes(s)));
  }

  if (stock) {
    const stocks = stock.split(',');
    products = products.filter(p => stocks.includes(p.stockStatus));
  }

  if (sort) {
    switch (sort) {
      case 'termurah': products.sort((a, b) => a.price - b.price); break;
      case 'termahal': products.sort((a, b) => b.price - a.price); break;
      case 'rating': products.sort((a, b) => b.rating - a.rating); break;
      case 'terbaru': products.sort((a, b) => b.id.localeCompare(a.id)); break;
      default: products.sort((a, b) => b.sold - a.sold); break; // terlaris
    }
  }

  res.json(products);
};

exports.getProductById = (req, res) => {
  const product = db.PRODUCTS.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

exports.getCategories = (req, res) => {
  res.json(db.CATEGORIES);
};

// FAQ removed — chat replaced with WhatsApp direct

exports.getReviews = (req, res) => {
  const reviews = db.generateReviews(req.params.id);
  res.json(reviews);
};
