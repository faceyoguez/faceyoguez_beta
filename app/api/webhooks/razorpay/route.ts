import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not defined');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Invalid Razorpay Webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = body.event;
    const payload = body.payload;

    console.log(`Razorpay Webhook received: ${event}`);

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment.entity;
        // Logic to link payment to conversion_events if metadata contains session_id
        if (payment.notes?.session_id) {
          await supabase.from('conversion_events').insert({
            session_id: payment.notes.session_id,
            event_type: 'payment_complete',
            amount: payment.amount / 100,
            metadata: { 
              razorpay_payment_id: payment.id,
              method: payment.method
            }
          });
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment.entity;
        if (payment.notes?.session_id) {
          await supabase.from('conversion_events').insert({
            session_id: payment.notes.session_id,
            event_type: 'payment_failed',
            metadata: { 
              razorpay_payment_id: payment.id,
              error_code: payment.error_code,
              error_description: payment.error_description
            }
          });
        }
        break;
      }

      case 'subscription.activated':
      case 'subscription.resumed': {
        const sub = payload.subscription.entity;
        const razorpaySubId = sub.id;
        
        // Update subscription status in our DB
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('metadata->razorpay_subscription_id', razorpaySubId);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        const sub = payload.subscription.entity;
        const razorpaySubId = sub.id;

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('metadata->razorpay_subscription_id', razorpaySubId);
        break;
      }

      case 'subscription.expired': {
        const sub = payload.subscription.entity;
        const razorpaySubId = sub.id;

        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('metadata->razorpay_subscription_id', razorpaySubId);
        break;
      }

      case 'refund.created': {
        const refund = payload.refund.entity;
        // You could track this in a separate refunds table if you had one
        console.log('Refund created:', refund.id, 'for payment:', refund.payment_id);
        break;
      }

      case 'dispute.created': {
        const dispute = payload.dispute.entity;
        console.log('Dispute created:', dispute.id, 'for payment:', dispute.payment_id);
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
