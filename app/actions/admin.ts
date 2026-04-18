'use server';

import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import Razorpay from 'razorpay';

/**
 * Validates whether the current user has admin access.
 */
export async function requireAdminAccess() {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Unauthorized Access: Please log in.');
  }

  const profile = await getServerProfile(user.id);
  if (!profile || !['admin', 'staff', 'client_management'].includes(profile.role)) {
    throw new Error('Unauthorized Access: Admin role required.');
  }

  return true;
}

/**
 * Fetches all student data enriched with subscription history for the management board.
 */
export async function getAdminStudentData() {
  await requireAdminAccess();
  const admin = createAdminClient();

  // 1. Fetch data in parallel for performance
  const [profilesRes, subsRes, queueRes] = await Promise.all([
    admin.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*').order('created_at', { ascending: false }),
    admin.from('waiting_queue').select('student_id, status').eq('status', 'waiting')
  ]);

  if (profilesRes.error) throw new Error('Failed to fetch student profiles');
  if (subsRes.error) throw new Error('Failed to fetch subscription records');

  const profiles = profilesRes.data || [];
  const subscriptions = subsRes.data || [];
  const queueEntries = queueRes.data || [];

  const today = new Date().toISOString().split('T')[0];
  const queueSet = new Set(queueEntries.map((q: any) => q.student_id));

  // 2. Transform and enrich data
  const students = profiles.map((profile: any) => {
    const userSubs = subscriptions.filter((s: any) => s.student_id === profile.id);
    const activeSub = userSubs.find((s: any) => s.status === 'active' && s.end_date && s.end_date >= today);
    const pendingSub = userSubs.find((s: any) => s.status === 'pending');
    
    // Logic for "Renewed": More than 1 paid (non-trial) subscription
    const paidSubs = userSubs.filter((s: any) => !s.is_trial);
    const isRenewed = paidSubs.length > 1;

    // Latest subscription info
    const latestSub = userSubs[0] || null;
    const couponUsed = latestSub?.metadata?.couponCode || null;
    const totalPaid = paidSubs.reduce((acc: number, s: any) => acc + (s.amount || 0), 0);

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      joinDate: profile.created_at,
      subscriptionEnd: activeSub?.end_date || latestSub?.end_date || null,
      plan: activeSub?.plan_type || latestSub?.plan_type || 'unsubscribed',
      planVariant: activeSub?.plan_variant || latestSub?.plan_variant || null,
      amountPaid: totalPaid,
      couponCode: couponUsed,
      isRenewed,
      isTrial: activeSub?.is_trial || latestSub?.is_trial || false,
      status: activeSub ? 'active' : (queueSet.has(profile.id) || pendingSub ? 'queue' : 'inactive')
    };
  });

  return students;
}

/**
 * Admin action to fetch detailed Razorpay metrics.
 */
export async function getRazorpayMetrics() {
  await requireAdminAccess();
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    const today = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = today - (30 * 24 * 60 * 60);

    // Fetch payments
    const payments = await razorpay.payments.all({
      from: thirtyDaysAgo,
      to: today,
      count: 100
    });

    // Simple aggregation for the dashboard
    const totalRevenue = payments.items
      .filter(p => p.status === 'captured')
      .reduce((acc, p) => acc + (Number(p.amount) / 100), 0);

    return {
      totalRevenue,
      paymentCount: payments.items.length,
      recentPayments: payments.items.slice(0, 5).map(p => ({
        id: p.id,
        amount: Number(p.amount) / 100,
        currency: p.currency,
        status: p.status,
        email: p.email,
        method: p.method,
        created: p.created_at
      }))
    };
  } catch (error) {
    console.error('Razorpay fetch error:', error);
    return {
      totalRevenue: 0,
      paymentCount: 0,
      recentPayments: []
    };
  }
}
