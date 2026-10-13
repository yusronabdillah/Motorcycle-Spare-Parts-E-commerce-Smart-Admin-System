const dotenv = require('dotenv');
dotenv.config();

// Midtrans integration placeholder
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const IS_DUMMY_MODE = !MIDTRANS_SERVER_KEY;

// Reference to order controller for auto-pay simulation
let orderController = null;
function setOrderController(ctrl) { orderController = ctrl; }

exports.setOrderController = setOrderController;

exports.generatePayment = async (order) => {
  if (IS_DUMMY_MODE) {
    console.log(`[DUMMY MODE] Generating payment for order ${order.orderId}`);
    
    return {
      type: 'dummy',
      token: 'dummy-token-' + order.orderId,
      qrStr: `00020101021126670016ID.CO.MOTO.SPARE0118936009153000000000215000000000000000303UMI51440014ID.CO.QRIS.WWW02150000000000000000303UMI5204549953033605405${order.totalAmount}5802ID5910MotoSpare6010Jakarta6105123456304CDA1`,
      autoConfirm: false
    };
  }

  // Real Midtrans Logic goes here via Midtrans Node client
  /*
  const midtransClient = require('midtrans-client');
  let snap = new midtransClient.Snap({
    isProduction : false,
    serverKey : MIDTRANS_SERVER_KEY
  });
  
  let parameter = {
      "transaction_details": {
          "order_id": order.orderId,
          "gross_amount": order.totalAmount
      },
      "customer_details": {
          "first_name": order.customer.name,
          "email": order.customer.email || 'customer@motospare.id',
          "phone": order.customer.phone
      }
  };
  const transaction = await snap.createTransaction(parameter);
  return { type: 'midtrans', token: transaction.token, redirect_url: transaction.redirect_url };
  */
};
