import { razorpay } from './lib/razorpay';

async function test() {
    try {
        const order = await razorpay.orders.create({
            amount: 100,
            currency: 'INR',
            receipt: 'test_receipt',
        });
        console.log('Order created:', order.id);
    } catch (err) {
        console.error('Error creating order:', err);
    }
}
test();
