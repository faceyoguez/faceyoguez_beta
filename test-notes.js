require('dotenv').config({ path: '.env.local' });
const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

rzp.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: 'test_receipt',
  notes: {
    userId: '123',
    userEmail: '',
    userName: '',
    userPhone: '',
    bumps: '',
    couponCode: ''
  }
}).then(order => {
  console.log("Order Created with empty notes:", order.id);
}).catch(err => {
  console.error("Razorpay Error:", err);
});
