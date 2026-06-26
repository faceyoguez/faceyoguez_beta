require('dotenv').config({ path: '.env.local' });
const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay credentials in environment!");
  process.exit(1);
}

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function inspectRazorpay() {
  const orderId = 'order_T5Xga6nYvhfyFn';
  const paymentId = 'pay_T5XglIxCO5H07M';

  console.log(`--- Fetching Razorpay Order ${orderId} ---`);
  try {
    const order = await rzp.orders.fetch(orderId);
    console.log("Order details:", JSON.stringify(order, null, 2));
  } catch (err) {
    console.error("Error fetching order:", err.message || err);
  }

  console.log(`\n--- Fetching Razorpay Payment ${paymentId} ---`);
  try {
    const payment = await rzp.payments.fetch(paymentId);
    console.log("Payment details:", JSON.stringify(payment, null, 2));
  } catch (err) {
    console.error("Error fetching payment:", err.message || err);
  }
}

inspectRazorpay();
