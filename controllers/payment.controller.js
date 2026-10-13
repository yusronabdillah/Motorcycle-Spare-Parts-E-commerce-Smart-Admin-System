const orderController = require('./order.controller');

exports.handleWebhook = (req, res) => {
  const payload = req.body;
  
  // Basic validation of Midtrans webhook
  const orderId = payload.order_id;
  const transactionStatus = payload.transaction_status;
  const fraudStatus = payload.fraud_status;

  if (!orderId) {
    return res.status(400).json({ error: 'order_id missing' });
  }

  let newStatus = 'pending_payment';

  if (transactionStatus == 'capture'){
      if (fraudStatus == 'challenge'){
          // TODO set transaction status on your databaase to 'challenge'
          newStatus = 'challenge';
      } else if (fraudStatus == 'accept'){
          // TODO set transaction status on your databaase to 'success'
          newStatus = 'paid';
      }
  } else if (transactionStatus == 'settlement'){
      // TODO set transaction status on your databaase to 'success'
      newStatus = 'paid';
  } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
      // TODO set transaction status on your databaase to 'failure'
      newStatus = 'expired';
  } else if (transactionStatus == 'pending'){
      // TODO set transaction status on your databaase to 'pending' / waiting payment
      newStatus = 'pending_payment';
  }

  const updated = orderController.updateOrderStatus(orderId, newStatus);
  if (updated) {
    console.log(`Webhook received: Order ${orderId} updated to ${newStatus}`);
    res.status(200).json({ message: 'OK' });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
};
