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
  console.log("Listing Razorpay payments to search for phone number 82535923...");
  
  try {
    // List up to 100 payments
    const response = await rzp.payments.all({
      count: 100,
    });
    
    console.log(`Fetched ${response.items.length} payments.`);
    
    const target = '82535923';
    const targetSub = '8253';
    
    response.items.forEach(payment => {
      const contact = String(payment.contact || '');
      const email = String(payment.email || '');
      const cleanContact = contact.replace(/[\s\-\+\(\)]/g, '');
      
      const isMatch = cleanContact.includes(target) || cleanContact.includes(targetSub);
      
      if (isMatch) {
        console.log('\n--- MATCH FOUND ---');
        console.log('Payment ID:', payment.id);
        console.log('Amount:', payment.amount / 100, payment.currency);
        console.log('Status:', payment.status);
        console.log('Method:', payment.method);
        console.log('Email:', payment.email);
        console.log('Contact:', payment.contact);
        console.log('Created At:', new Date(payment.created_at * 1000).toLocaleString());
        console.log('Notes:', payment.notes);
      }
    });

    console.log('\nSample payments from list:');
    response.items.slice(0, 5).forEach(payment => {
      console.log(`- ID: ${payment.id} | Amt: ${payment.amount / 100} | Contact: ${payment.contact} | Email: ${payment.email} | Created: ${new Date(payment.created_at * 1000).toLocaleDateString()}`);
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
  }
}

main();
