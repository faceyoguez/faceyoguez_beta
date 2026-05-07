require('dotenv').config({ path: '.env.local' });
const Razorpay = require('razorpay');

console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Key Secret:", process.env.RAZORPAY_KEY_SECRET);

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  rzp.orders.create({
    amount: 100,
    currency: 'INR',
    receipt: 'test_receipt'
  }).then(order => {
    console.log("Order Created:", order);
  }).catch(err => {
    console.error("Razorpay Error:", err);
  });
}
