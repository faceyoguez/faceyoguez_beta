import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getRevenueSummary,
  getPaymentCounts,
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getPaymentMethodBreakdown,
  getPlanRevenue,
  getSubscriptionMetrics,
  getRecentTransactions,
  getFailedPayments,
  getRefundSummary,
  getSettlementSummary,
  getTimeAnalytics,
  getCustomerPaymentProfiles,
  getLivePayments,
  getTaxAndCompliance,
  getConversionMetrics,
  getDisputeMetrics,
  resetPaymentCache,
} from '@/lib/razorpayAnalytics';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for heavy analytics

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'instructor', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all analytics data in parallel
    // The single-fetch cache means these don't duplicate API calls
    const [
      summary,
      paymentCounts,
      daily,
      weekly,
      monthly,
      methods,
      plans,
      subscriptions,
      recent,
      failed,
      refunds,
      settlements,
      timeAnalytics,
      customers,
      live,
      tax,
      conversion,
      disputes,
    ] = await Promise.all([
      getRevenueSummary(),
      getPaymentCounts(),
      getDailyRevenue(30),
      getWeeklyRevenue(12),
      getMonthlyRevenue(12),
      getPaymentMethodBreakdown(),
      getPlanRevenue(),
      getSubscriptionMetrics(),
      getRecentTransactions(50),
      getFailedPayments(),
      getRefundSummary(),
      getSettlementSummary(),
      getTimeAnalytics(),
      getCustomerPaymentProfiles(),
      getLivePayments(),
      getTaxAndCompliance(),
      getConversionMetrics(),
      getDisputeMetrics(),
    ]);

    // Clean up cache after the request
    resetPaymentCache();

    return NextResponse.json({
      summary,
      paymentCounts,
      daily,
      weekly,
      monthly,
      methods,
      plans,
      subscriptions,
      recent,
      failed,
      refunds,
      settlements,
      timeAnalytics,
      customers,
      live,
      tax,
      conversion,
      disputes,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Razorpay Analytics API error:', error);
    resetPaymentCache();
    return NextResponse.json(
      { error: 'Failed to fetch analytics', detail: error.message },
      { status: 500 }
    );
  }
}
