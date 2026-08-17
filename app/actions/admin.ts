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

  // Plan priority order: lms > group_session > one_on_one > others
  // This ensures that if a user has multiple active plans, the most comprehensive one wins.
  const PLAN_PRIORITY: Record<string, number> = {
    lms: 4,
    group_session: 3,
    one_on_one: 2,
  };
  const getPlanPriority = (planType: string) => PLAN_PRIORITY[planType] ?? 1;

  // 2. Transform and enrich data
  const students = profiles.map((profile: any) => {
    const userSubs = subscriptions.filter((s: any) => s.student_id === profile.id);

    // All currently active subscriptions (not expired)
    const activeSubs = userSubs.filter((s: any) => s.status === 'active' && s.end_date && s.end_date >= today);
    // Pick the highest-priority active subscription
    const activeSub = activeSubs.sort((a: any, b: any) => getPlanPriority(b.plan_type) - getPlanPriority(a.plan_type))[0] || null;

    const pendingSub = userSubs.find((s: any) => s.status === 'pending');
    // Also look for any sub with an end_date regardless of status (covers new/recent enrolments)
    const subWithEndDate = userSubs.find((s: any) => s.end_date != null);

    // Logic for "Renewed": More than 1 paid (non-trial) subscription
    const paidSubs = userSubs.filter((s: any) => !s.is_trial);
    const isRenewed = paidSubs.length > 1;

    // Latest subscription info
    const latestSub = userSubs[0] || null;
    const couponUsed = latestSub?.metadata?.couponCode || null;
    const totalPaid = paidSubs.reduce((acc: number, s: any) => acc + (s.amount || 0), 0);

    // Resolve end date: latest end date among active subs, or fallback
    const activeEndDates = activeSubs.map((s: any) => s.end_date).filter(Boolean).sort();
    const resolvedEndDate =
      (activeEndDates.length > 0 ? activeEndDates[activeEndDates.length - 1] : null) ||
      pendingSub?.end_date ||
      subWithEndDate?.end_date ||
      latestSub?.end_date ||
      null;

    // Resolve plan: join all active or pending plans
    const activePlanTypes = activeSubs.map((s: any) => s.plan_type);
    const pendingPlanTypes = pendingSub ? [pendingSub.plan_type] : [];
    const resolvedPlansList = activePlanTypes.length > 0 
      ? activePlanTypes 
      : (pendingPlanTypes.length > 0 ? pendingPlanTypes : (latestSub ? [latestSub.plan_type] : ['unsubscribed']));
    const uniquePlans = Array.from(new Set(resolvedPlansList));
    const resolvedPlan = uniquePlans.join(' + ');

    // Resolve plan variant: join variants matching the resolved plans
    const resolvedVariantsList = activeSubs.map((s: any) => s.plan_variant).filter(Boolean);
    if (resolvedVariantsList.length === 0 && pendingSub?.plan_variant) {
      resolvedVariantsList.push(pendingSub.plan_variant);
    }
    if (resolvedVariantsList.length === 0 && latestSub?.plan_variant) {
      resolvedVariantsList.push(latestSub.plan_variant);
    }
    const resolvedPlanVariant = Array.from(new Set(resolvedVariantsList)).join(' + ') || null;

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      joinDate: profile.created_at,
      subscriptionEnd: resolvedEndDate,
      plan: resolvedPlan,
      planVariant: resolvedPlanVariant,
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
 * Fetches active students whose plan is about to expire, starting from
 * T-5 days out (i.e. subscriptions ending within the next 5 days).
 * Used by the "Expiring this week" stat card drill-down on the staff dashboard.
 */
export async function getExpiringSoonStudents(daysWindow: number = 5) {
  await requireAdminAccess();
  const admin = createAdminClient();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const windowEnd = new Date(today.getTime() + daysWindow * 24 * 60 * 60 * 1000);
  const windowEndStr = windowEnd.toISOString().split('T')[0];

  const { data: subs, error: subsError } = await admin
    .from('subscriptions')
    .select('id, student_id, plan_type, plan_variant, duration_months, start_date, end_date, metadata, is_trial')
    .eq('status', 'active')
    .gte('end_date', todayStr)
    .lte('end_date', windowEndStr)
    .order('end_date', { ascending: true });

  if (subsError) throw new Error('Failed to fetch expiring subscriptions');
  if (!subs || subs.length === 0) return [];

  const studentIds = Array.from(new Set(subs.map((s: any) => s.student_id)));
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', studentIds);

  if (profilesError) throw new Error('Failed to fetch student profiles');
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return subs.map((s: any) => {
    const profile: any = profileMap.get(s.student_id);
    const couponCode = s.metadata?.couponCode || s.metadata?.coupon_code || null;
    const daysLeft = Math.ceil(
      (new Date(s.end_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      id: s.id,
      studentId: s.student_id,
      name: profile?.full_name || 'Unknown',
      email: profile?.email || null,
      phone: profile?.phone || null,
      joinDate: s.start_date,
      endDate: s.end_date,
      planType: s.plan_type,
      durationMonths: s.duration_months || null,
      isTrial: !!s.is_trial,
      couponCode,
      daysLeft,
    };
  });
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
    const totalRevenue = (payments.items as any[])
      .filter(p => p.status === 'captured')
      .reduce((acc, p) => acc + (Number(p.amount) / 100), 0);

    return {
      totalRevenue,
      paymentCount: payments.items.length,
      recentPayments: (payments.items as any[]).slice(0, 5).map(p => ({
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
