const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/shipping', orderController.getShippingOptions);
router.get('/payment-options', orderController.getPaymentOptions);
router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrderStatus);
router.post('/:orderId/proof', orderController.uploadProof);
router.post('/:orderId/simulate-pay', orderController.simulatePay);

module.exports = router;
