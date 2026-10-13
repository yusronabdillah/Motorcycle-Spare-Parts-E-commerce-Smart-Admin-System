const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Midtrans webhook URL: /api/payment/webhook
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
