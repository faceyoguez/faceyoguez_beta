require('dotenv').config({ path: '.env.local' });
const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay config!");
  process.exit(1);
}

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function main() {
  console.log("Searching Razorpay customers and orders...");
  
  try {
    const orders = await rzp.orders.all({ count: 100 });
    console.log(`Fetched ${orders.items.length} orders.`);
    
    orders.items.forEach(order => {
      const str = JSON.stringify(order).toLowerCase();
      if (str.includes('82535923') || str.includes('8253') || str.includes('5923')) {
        console.log('Match in order:', order);
      }
    });

    // Try customers if API allows
    try {
      const customers = await rzp.customers.all({ count: 100 });
      console.log(`Fetched ${customers.items.length} customers.`);
      customers.items.forEach(cust => {
        const str = JSON.stringify(cust).toLowerCase();
        if (str.includes('82535923') || str.includes('8253') || str.includes('5923')) {
          console.log('Match in customer:', cust);
        }
      });
    } catch (custError) {
      console.log('Customer fetch error (some keys do not have access):', custError.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
