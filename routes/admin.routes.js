const express = require('express');
const router = express.Router();
const db = require('../db');
const orderController = require('../controllers/order.controller');

// GET all orders
router.get('/orders', orderController.getAllOrders);

// Update order status explicitly via admin
router.put('/orders/:orderId', (req, res) => {
  const status = req.body.status;
  const updated = orderController.updateOrderStatus(req.params.orderId, status);
  if (updated) {
    res.json({ message: 'Status updated' });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Update Stock
router.put('/products/:productId', (req, res) => {
  const stock = req.body.stock;
  const product = db.PRODUCTS.find(p => p.id === req.params.productId);
  if (product) {
    product.stock = parseInt(stock);
    if(product.stock > 0) product.stockStatus = 'ready';
    else product.stockStatus = 'habis';
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

module.exports = router;
