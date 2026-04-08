import Razorpay from 'razorpay';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  startOfDay, startOfWeek, startOfMonth, subDays, subMonths, subWeeks,
  format, fromUnixTime, getHours, getDay, getDate, differenceInDays
} from 'date-fns';

// ─── Razorpay Client ─────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ─── IST Helpers ─────────────────────────────────────────────
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function toIST(date: Date | number): Date {
  const d = typeof date === 'number' ? fromUnixTime(date) : date;
  return new Date(d.getTime() + IST_OFFSET);
}

function formatIST(date: Date | number, formatStr: string): string {
  return format(toIST(date), formatStr);
}

// ─── Request-Scoped Payment Cache ────────────────────────────
// Eliminates 15+ redundant API calls per dashboard load
let _cachedPayments: any[] | null = null;
let _cacheTimestamp: number = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getMasterPaymentData(count: number = 5000): Promise<any[]> {
  const now = Date.now();
  if (_cachedPayments && (now - _cacheTimestamp) < CACHE_TTL) {
    return _cachedPayments;
  }
  _cachedPayments = await fetchAllPayments(undefined, undefined, count);
  _cacheTimestamp = now;
  return _cachedPayments;
}

export function resetPaymentCache() {
  _cachedPayments = null;
  _cacheTimestamp = 0;
}

// ─── Core Fetch ──────────────────────────────────────────────
async function fetchAllPayments(from?: number, to?: number, count: number = 100) {
  let allPayments: any[] = [];
  let skip = 0;
  const limitPerRequest = 100;

  while (allPayments.length < count) {
    const currentCount = Math.min(limitPerRequest, count - allPayments.length);
    const params: any = { count: currentCount, skip };
    if (from) params.from = from;
    if (to) params.to = to;

    const payments = await razorpay.payments.all(params);
    if (!payments.items || payments.items.length === 0) break;

    allPayments = [...allPayments, ...payments.items];
    if (payments.items.length < currentCount) break;
    skip += payments.items.length;
  }

  return allPayments;
}

// ─── Helpers ─────────────────────────────────────────────────
function sumAmount(items: any[]): number {
  return items.reduce((sum: number, p: any) => sum + Number(p.amount) / 100, 0);
}

function getGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ═══════════════════════════════════════════════════════════════
// 1. REVENUE SUMMARY
// ═══════════════════════════════════════════════════════════════
export async function getRevenueSummary() {
  const allPayments = await getMasterPaymentData();
  const now = Math.floor(Date.now() / 1000);
  const startOfToday = Math.floor(startOfDay(new Date()).getTime() / 1000);
  const sevenDaysAgo = Math.floor(subDays(new Date(), 7).getTime() / 1000);
  const fourteenDaysAgo = Math.floor(subDays(new Date(), 14).getTime() / 1000);
  const thirtyDaysAgo = Math.floor(subDays(new Date(), 30).getTime() / 1000);
  const sixtyDaysAgo = Math.floor(subDays(new Date(), 60).getTime() / 1000);
  const yesterdayStart = Math.floor(subDays(startOfDay(new Date()), 1).getTime() / 1000);
  const oneYearAgo = Math.floor(subDays(new Date(), 365).getTime() / 1000);
  const twoYearsAgo = Math.floor(subDays(new Date(), 730).getTime() / 1000);

  // Segment payments
  const today = allPayments.filter((p: any) => p.created_at >= startOfToday);
  const yesterday = allPayments.filter((p: any) => p.created_at >= yesterdayStart && p.created_at < startOfToday);
  const thisWeek = allPayments.filter((p: any) => p.created_at >= sevenDaysAgo);
  const lastWeek = allPayments.filter((p: any) => p.created_at >= fourteenDaysAgo && p.created_at < sevenDaysAgo);
  const thisMonth = allPayments.filter((p: any) => p.created_at >= thirtyDaysAgo);
  const lastMonth = allPayments.filter((p: any) => p.created_at >= sixtyDaysAgo && p.created_at < thirtyDaysAgo);
  const thisYear = allPayments.filter((p: any) => p.created_at >= oneYearAgo);
  const lastYear = allPayments.filter((p: any) => p.created_at >= twoYearsAgo && p.created_at < oneYearAgo);

  const calcRevenue = (items: any[]) => sumAmount(items.filter((p: any) => p.status === 'captured'));

  const todayRev = calcRevenue(today);
  const yesterdayRev = calcRevenue(yesterday);
  const weekRev = calcRevenue(thisWeek);
  const lastWeekRev = calcRevenue(lastWeek);
  const monthRev = calcRevenue(thisMonth);
  const lastMonthRev = calcRevenue(lastMonth);
  const allTimeRev = calcRevenue(allPayments);
  const thisYearRev = calcRevenue(thisYear);
  const lastYearRev = calcRevenue(lastYear);

  const successful = allPayments.filter((p: any) => p.status === 'captured');
  const avgTransaction = successful.length > 0 ? allTimeRev / successful.length : 0;
  const highest = successful.length > 0
    ? successful.reduce((max: any, p: any) => (Number(p.amount) > Number(max.amount) ? p : max), successful[0])
    : null;

  const successRate = allPayments.length > 0
    ? Math.round((successful.length / allPayments.length) * 100)
    : 0;

  return {
    today: { revenue: todayRev, growth: getGrowth(todayRev, yesterdayRev) },
    thisWeek: { revenue: weekRev, growth: getGrowth(weekRev, lastWeekRev) },
    thisMonth: { revenue: monthRev, growth: getGrowth(monthRev, lastMonthRev) },
    allTime: { revenue: allTimeRev },
    weekOverWeekGrowth: getGrowth(weekRev, lastWeekRev),
    monthOverMonthGrowth: getGrowth(monthRev, lastMonthRev),
    yearOverYearGrowth: getGrowth(thisYearRev, lastYearRev),
    averageTransactionValue: avgTransaction,
    highestTransaction: highest ? {
      amount: Number(highest.amount) / 100,
      id: highest.id,
      email: highest.email,
      date: formatIST(highest.created_at, 'dd MMM yyyy'),
    } : null,
    successRate,
    totalPayments: allPayments.length,
    successfulPayments: successful.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. PAYMENT COUNTS
// ═══════════════════════════════════════════════════════════════
export async function getPaymentCounts() {
  const allPayments = await getMasterPaymentData();

  const attempted = allPayments.length;
  const successful = allPayments.filter((p: any) => p.status === 'captured').length;
  const failed = allPayments.filter((p: any) => p.status === 'failed').length;
  const refunded = allPayments.filter((p: any) => p.status === 'refunded').length;
  const pending = allPayments.filter((p: any) => ['created', 'authorized'].includes(p.status)).length;

  return {
    attempted,
    successful,
    failed,
    refunded,
    pending,
    successRate: attempted > 0 ? Math.round((successful / attempted) * 100) : 0,
    failureRate: attempted > 0 ? Math.round((failed / attempted) * 100) : 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. DAILY REVENUE (30 days) + 7-day moving average
// ═══════════════════════════════════════════════════════════════
export async function getDailyRevenue(days: number = 30) {
  const allPayments = await getMasterPaymentData();
  const cutoff = Math.floor(subDays(new Date(), days).getTime() / 1000);
  const payments = allPayments.filter((p: any) => p.created_at >= cutoff);

  const dailyData: Record<string, any> = {};
  for (let i = 0; i <= days; i++) {
    const dateStr = formatIST(subDays(new Date(), i), 'dd MMM');
    dailyData[dateStr] = { date: dateStr, revenue: 0, count: 0, failed: 0 };
  }

  payments.forEach((p: any) => {
    const dateStr = formatIST(p.created_at, 'dd MMM');
    if (dailyData[dateStr]) {
      if (p.status === 'captured') {
        dailyData[dateStr].revenue += Number(p.amount) / 100;
        dailyData[dateStr].count += 1;
      } else if (p.status === 'failed') {
        dailyData[dateStr].failed += 1;
      }
    }
  });

  const result = Object.values(dailyData).reverse();

  // 7-day moving average
  result.forEach((day: any, index: number) => {
    const slice = result.slice(Math.max(0, index - 6), index + 1);
    const sum = slice.reduce((a: number, b: any) => a + b.revenue, 0);
    day.movingAverage = Math.round(sum / slice.length);
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 4. WEEKLY REVENUE (12 weeks)
// ═══════════════════════════════════════════════════════════════
export async function getWeeklyRevenue(weeks: number = 12) {
  const allPayments = await getMasterPaymentData();
  const cutoff = Math.floor(subWeeks(new Date(), weeks).getTime() / 1000);
  const payments = allPayments.filter((p: any) => p.created_at >= cutoff);

  const weeklyData: Record<string, any> = {};
  for (let i = 0; i < weeks; i++) {
    const weekStart = subWeeks(new Date(), i);
    const label = formatIST(weekStart, "'W'w, dd MMM");
    weeklyData[i.toString()] = { week: label, revenue: 0, count: 0, index: i };
  }

  payments.forEach((p: any) => {
    if (p.status !== 'captured') return;
    const paymentDate = fromUnixTime(p.created_at);
    const weeksAgo = Math.floor(differenceInDays(new Date(), paymentDate) / 7);
    if (weeksAgo >= 0 && weeksAgo < weeks && weeklyData[weeksAgo.toString()]) {
      weeklyData[weeksAgo.toString()].revenue += Number(p.amount) / 100;
      weeklyData[weeksAgo.toString()].count += 1;
    }
  });

  const result = Object.values(weeklyData).sort((a: any, b: any) => b.index - a.index);

  // Week-over-week growth
  result.forEach((week: any, index: number) => {
    if (index > 0) {
      const prev = result[index - 1];
      week.growth = getGrowth(week.revenue, prev.revenue);
    } else {
      week.growth = 0;
    }
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 5. MONTHLY REVENUE (12 months) + MoM growth
// ═══════════════════════════════════════════════════════════════
export async function getMonthlyRevenue(months: number = 12) {
  const allPayments = await getMasterPaymentData();
  const cutoff = Math.floor(subMonths(new Date(), months).getTime() / 1000);
  const payments = allPayments.filter((p: any) => p.created_at >= cutoff);

  const monthlyData: Record<string, any> = {};
  for (let i = 0; i < months; i++) {
    const dateStr = formatIST(subMonths(new Date(), i), 'MMM yyyy');
    monthlyData[dateStr] = { month: dateStr, revenue: 0, count: 0 };
  }

  payments.forEach((p: any) => {
    const dateStr = formatIST(p.created_at, 'MMM yyyy');
    if (monthlyData[dateStr] && p.status === 'captured') {
      monthlyData[dateStr].revenue += Number(p.amount) / 100;
      monthlyData[dateStr].count += 1;
    }
  });

  const result = Object.values(monthlyData).reverse();

  result.forEach((month: any, index: number) => {
    if (index > 0) {
      month.growth = getGrowth(month.revenue, result[index - 1].revenue);
    } else {
      month.growth = 0;
    }
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 6. PAYMENT METHOD BREAKDOWN
// ═══════════════════════════════════════════════════════════════
export async function getPaymentMethodBreakdown() {
  const allPayments = await getMasterPaymentData();
  const thirtyDaysAgo = Math.floor(subDays(new Date(), 30).getTime() / 1000);
  const payments = allPayments.filter((p: any) => p.created_at >= thirtyDaysAgo);

  const methods: Record<string, any> = {};
  const banks: Record<string, number> = {};
  const wallets: Record<string, number> = {};

  payments.forEach((p: any) => {
    let method = p.method || 'other';
    // Split card into credit and debit
    if (method === 'card' && p.card) {
      method = p.card.type === 'credit' ? 'credit_card' : 'debit_card';
    }

    if (!methods[method]) {
      methods[method] = { method, count: 0, revenue: 0, attempts: 0, successful: 0, failed: 0 };
    }
    methods[method].attempts++;

    if (p.status === 'captured') {
      methods[method].count++;
      methods[method].successful++;
      methods[method].revenue += Number(p.amount) / 100;
    } else if (p.status === 'failed') {
      methods[method].failed++;
    }

    // Track most popular bank/wallet
    if (method === 'netbanking' && p.bank) {
      banks[p.bank] = (banks[p.bank] || 0) + 1;
    }
    if (method === 'wallet' && p.wallet) {
      wallets[p.wallet] = (wallets[p.wallet] || 0) + 1;
    }
  });

  const totalRevenue = Object.values(methods).reduce((sum: number, m: any) => sum + m.revenue, 0);

  const breakdown = Object.values(methods).map((m: any) => ({
    ...m,
    revenuePercentage: totalRevenue > 0 ? Math.round((m.revenue / totalRevenue) * 100) : 0,
    successRate: m.attempts > 0 ? Math.round((m.successful / m.attempts) * 100) : 0,
    averageValue: m.count > 0 ? Math.round(m.revenue / m.count) : 0,
  })).sort((a: any, b: any) => b.revenue - a.revenue);

  const mostPopularBank = Object.entries(banks).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const mostPopularWallet = Object.entries(wallets).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return { breakdown, mostPopularBank, mostPopularWallet, totalRevenue };
}

// ═══════════════════════════════════════════════════════════════
// 7. PLAN / PRODUCT ANALYTICS
// ═══════════════════════════════════════════════════════════════
export async function getPlanRevenue() {
  const allPayments = await getMasterPaymentData();
  const supabase = await createServerSupabaseClient();
  const { data: subscriptions } = await supabase.from('subscriptions').select('*');

  const thirtyDaysAgo = Math.floor(subDays(new Date(), 30).getTime() / 1000);

  const subMap = new Map();
  subscriptions?.forEach((s: any) => {
    if (s.payment_id) subMap.set(s.payment_id, s);
  });

  const planTypes = ['one_on_one', 'group_session', 'lms'];
  const result: Record<string, any> = {};

  planTypes.forEach(p => {
    result[p] = {
      planType: p, count: 0, revenue: 0, failedAttempts: 0, refundCount: 0,
      thisMonthCount: 0, thisMonthRevenue: 0
    };
  });

  allPayments.forEach((p: any) => {
    let planType = p.notes?.plan_type || p.notes?.type;
    if (!planType) {
      const sub = subMap.get(p.id);
      if (sub) planType = sub.plan_type;
    }

    if (planType && result[planType]) {
      if (p.status === 'captured') {
        result[planType].count++;
        result[planType].revenue += Number(p.amount) / 100;
        if (p.created_at >= thirtyDaysAgo) {
          result[planType].thisMonthCount++;
          result[planType].thisMonthRevenue += Number(p.amount) / 100;
        }
      } else if (p.status === 'failed') {
        result[planType].failedAttempts++;
      } else if (p.status === 'refunded') {
        result[planType].refundCount++;
      }
    }
  });

  const totalRevenue = Object.values(result).reduce((sum: number, r: any) => sum + r.revenue, 0);

  const plans = Object.values(result).map((r: any) => ({
    ...r,
    percentage: totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0,
    averageValue: r.count > 0 ? Math.round(r.revenue / r.count) : 0,
  }));

  // Best selling and highest revenue this month
  const bestSellingThisMonth = plans.reduce((best: any, p: any) =>
    p.thisMonthCount > (best?.thisMonthCount || 0) ? p : best, null);
  const highestRevenueThisMonth = plans.reduce((best: any, p: any) =>
    p.thisMonthRevenue > (best?.thisMonthRevenue || 0) ? p : best, null);

  return {
    plans,
    bestSellingThisMonth: bestSellingThisMonth?.planType || 'N/A',
    highestRevenueThisMonth: highestRevenueThisMonth?.planType || 'N/A',
  };
}

// ═══════════════════════════════════════════════════════════════
// 8. SUBSCRIPTION METRICS
// ═══════════════════════════════════════════════════════════════
export async function getSubscriptionMetrics() {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysFromNow = subDays(now, -7);

  const [
    { count: totalActive },
    { data: newSubs },
    { data: expiredSubs },
    { data: cancelledSubs },
    { data: expiringSoon },
    { data: allSubs }
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*').gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('subscriptions').select('*').eq('status', 'expired').gte('updated_at', thirtyDaysAgo.toISOString()),
    supabase.from('subscriptions').select('*').eq('status', 'cancelled').gte('updated_at', thirtyDaysAgo.toISOString()),
    supabase.from('subscriptions').select('*, profiles:student_id(full_name, email)').eq('status', 'active').lte('end_date', sevenDaysFromNow.toISOString()).gte('end_date', now.toISOString()),
    supabase.from('subscriptions').select('*')
  ]);

  const activeSubs = allSubs?.filter((s: any) => s.status === 'active') || [];
  const mrr = activeSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0) / (s.duration_months || 1), 0);
  const arr = mrr * 12;

  const churned = (cancelledSubs?.length || 0) + (expiredSubs?.length || 0);
  const renewed = activeSubs.filter((s: any) => s.created_at !== s.updated_at).length;
  const churnRate = allSubs && allSubs.length > 0 ? (churned / allSubs.length) * 100 : 0;
  const renewalRate = (renewed + churned) > 0 ? (renewed / (renewed + churned)) * 100 : 100;

  const totalDuration = allSubs?.reduce((sum: number, s: any) => sum + (s.duration_months || 0), 0) || 0;
  const averageLifetimeMonths = allSubs && allSubs.length > 0 ? totalDuration / allSubs.length : 0;

  const revenueAtRisk = expiringSoon?.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0) || 0;

  return {
    totalActive: totalActive || 0,
    newThisMonth: newSubs?.length || 0,
    expiredThisMonth: expiredSubs?.length || 0,
    cancelledThisMonth: cancelledSubs?.length || 0,
    renewalRate: Math.round(renewalRate),
    churnRate: Math.round(churnRate * 10) / 10,
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    averageLifetimeMonths: Math.round(averageLifetimeMonths * 10) / 10,
    revenueAtRisk,
    expiringStudents: expiringSoon?.map((s: any) => ({
      name: s.profiles?.full_name || 'Unknown',
      email: s.profiles?.email || '',
      plan: s.plan_type,
      expiry: formatIST(new Date(s.end_date), 'dd MMM yyyy'),
      amount: Number(s.amount)
    })) || []
  };
}

// ═══════════════════════════════════════════════════════════════
// 9. RECENT TRANSACTIONS
// ═══════════════════════════════════════════════════════════════
export async function getRecentTransactions(count: number = 50) {
  const allPayments = await getMasterPaymentData();
  const payments = allPayments.slice(0, count);
  const supabase = await createServerSupabaseClient();

  const emails = Array.from(new Set(payments.map((p: any) => p.email).filter(Boolean)));
  const { data: profiles } = await supabase.from('profiles').select('full_name, email').in('email', emails);
  const profileMap = new Map();
  profiles?.forEach((p: any) => profileMap.set(p.email, p.full_name));

  return payments.map((p: any) => {
    const fee = (Number(p.fee) || 0) / 100;
    const tax = (Number(p.tax) || 0) / 100;
    const amount = Number(p.amount) / 100;
    return {
      paymentId: p.id,
      studentName: profileMap.get(p.email) || 'Unknown Student',
      studentEmail: p.email || '',
      planType: p.notes?.plan_type || 'Package',
      amount,
      method: p.method,
      status: p.status,
      failureReason: p.error_description || null,
      createdAt: formatIST(p.created_at, 'dd MMM yyyy HH:mm'),
      fee,
      tax,
      netAmount: amount - fee - tax,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// 10. FAILED PAYMENT ANALYTICS
// ═══════════════════════════════════════════════════════════════
export async function getFailedPayments() {
  const allPayments = await getMasterPaymentData();
  const supabase = await createServerSupabaseClient();

  const thirtyDaysAgo = Math.floor(subDays(new Date(), 30).getTime() / 1000);
  const allFailed = allPayments.filter((p: any) => p.status === 'failed');
  const monthFailed = allFailed.filter((p: any) => p.created_at >= thirtyDaysAgo);

  // Emails of failed payment holders
  const emails = Array.from(new Set(allFailed.map((p: any) => p.email).filter(Boolean)));
  const { data: profiles } = await supabase.from('profiles').select('full_name, email').in('email', emails.length > 0 ? emails : ['none']);
  const profileMap = new Map();
  profiles?.forEach((p: any) => profileMap.set(p.email, p.full_name));

  // By reason
  const byReason: Record<string, number> = {};
  let totalValueLost = 0;

  allFailed.forEach((p: any) => {
    const reason = p.error_description || 'Unknown Reason';
    byReason[reason] = (byReason[reason] || 0) + 1;
    totalValueLost += Number(p.amount) / 100;
  });

  // By plan
  const byPlan: Record<string, number> = {};
  allFailed.forEach((p: any) => {
    const plan = p.notes?.plan_type || 'unknown';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  // By method
  const byMethod: Record<string, number> = {};
  allFailed.forEach((p: any) => {
    const method = p.method || 'unknown';
    byMethod[method] = (byMethod[method] || 0) + 1;
  });

  // Students who failed and retried successfully
  const failedEmails = new Set(allFailed.map((p: any) => p.email).filter(Boolean));
  const successfulAfterFail: string[] = [];
  const neverCompleted: string[] = [];

  failedEmails.forEach(email => {
    const studentPayments = allPayments.filter((p: any) => p.email === email);
    const hasSuccess = studentPayments.some((p: any) => p.status === 'captured');
    if (hasSuccess) successfulAfterFail.push(email as string);
    else neverCompleted.push(email as string);
  });

  // Most failed plan
  const mostFailedPlan = Object.entries(byPlan).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  // Most failed method
  const mostFailedMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    total: allFailed.length,
    thisMonth: monthFailed.length,
    totalValueLost,
    byReason,
    byPlan,
    byMethod,
    mostFailedPlan,
    mostFailedMethod,
    retriedSuccessfully: successfulAfterFail.length,
    neverCompleted: neverCompleted.length,
    payments: allFailed.slice(0, 20).map((p: any) => ({
      paymentId: p.id,
      studentName: profileMap.get(p.email) || 'Unknown Student',
      studentEmail: p.email || '',
      amount: Number(p.amount) / 100,
      method: p.method,
      failureReason: p.error_description || 'Declined',
      createdAt: formatIST(p.created_at, 'dd MMM yyyy HH:mm'),
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// 11. REFUND ANALYTICS
// ═══════════════════════════════════════════════════════════════
export async function getRefundSummary() {
  const allPayments = await getMasterPaymentData();
  const supabase = await createServerSupabaseClient();

  // Fetch refunds from Razorpay
  const result = (await razorpay.refunds.all({ count: 100 })) as any;
  const items = result.items || [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const totalAmountRefunded = items.reduce((sum: number, r: any) => sum + (Number(r.amount) / 100), 0);
  const thisMonthRefunds = items.filter((r: any) => fromUnixTime(r.created_at) >= thirtyDaysAgo);
  const lastMonthRefunds = items.filter((r: any) => {
    const d = fromUnixTime(r.created_at);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  // Enrich refund data with student names
  const paymentIds = items.map((r: any) => r.payment_id).filter(Boolean);
  const refundPayments = allPayments.filter((p: any) => paymentIds.includes(p.id));
  const refundEmails = Array.from(new Set(refundPayments.map((p: any) => p.email).filter(Boolean)));
  const { data: refundProfiles } = await supabase.from('profiles').select('full_name, email').in('email', refundEmails.length > 0 ? refundEmails : ['none']);
  const refundProfileMap = new Map();
  refundProfiles?.forEach((p: any) => refundProfileMap.set(p.email, p.full_name));
  const paymentEmailMap = new Map();
  refundPayments.forEach((p: any) => paymentEmailMap.set(p.id, p.email));

  // By plan type
  const byPlan: Record<string, number> = {};
  refundPayments.forEach((p: any) => {
    const plan = p.notes?.plan_type || 'unknown';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  const totalCaptured = allPayments.filter((p: any) => p.status === 'captured').length;

  return {
    totalRefunds: items.length,
    totalAmountRefunded,
    refundRate: totalCaptured > 0 ? Math.round((items.length / totalCaptured) * 100 * 10) / 10 : 0,
    averageRefundAmount: items.length > 0 ? Math.round(totalAmountRefunded / items.length) : 0,
    refundsByPlan: byPlan,
    thisMonthCount: thisMonthRefunds.length,
    lastMonthCount: lastMonthRefunds.length,
    thisMonthAmount: thisMonthRefunds.reduce((s: number, r: any) => s + Number(r.amount) / 100, 0),
    lastMonthAmount: lastMonthRefunds.reduce((s: number, r: any) => s + Number(r.amount) / 100, 0),
    recentRefunds: items.slice(0, 10).map((r: any) => {
      const email = paymentEmailMap.get(r.payment_id) || '';
      return {
        paymentId: r.payment_id,
        amount: Number(r.amount) / 100,
        date: formatIST(r.created_at, 'dd MMM yyyy'),
        reason: r.notes?.reason || 'Customer Request',
        studentName: refundProfileMap.get(email) || 'Student',
        studentEmail: email,
      };
    })
  };
}

// ═══════════════════════════════════════════════════════════════
// 12. SETTLEMENT ANALYTICS
// ═══════════════════════════════════════════════════════════════
export async function getSettlementSummary() {
  const settlements = await razorpay.settlements.all({ count: 50 });
  const items = settlements.items || [];

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  let settledThisWeek = 0;
  let settledThisMonth = 0;
  let totalSettled = 0;
  let pendingSettlement = 0;
  let totalTurnaroundDays = 0;
  let turnaroundCount = 0;

  items.forEach((s: any) => {
    const amount = Number(s.amount) / 100;
    const date = fromUnixTime(s.created_at);

    if (s.status === 'processed' || s.status === 'settled') {
      if (date >= weekAgo) settledThisWeek += amount;
      if (date >= monthAgo) settledThisMonth += amount;
      totalSettled += amount;
    } else if (s.status === 'created') {
      pendingSettlement += amount;
    }

    // Estimate turnaround (created to settled typically T+2)
    if (s.utr) {
      turnaroundCount++;
      totalTurnaroundDays += 2; // Razorpay standard T+2
    }
  });

  const avgTurnaround = turnaroundCount > 0 ? Math.round(totalTurnaroundDays / turnaroundCount * 10) / 10 : 2;

  return {
    settledThisWeek: Math.round(settledThisWeek),
    settledThisMonth: Math.round(settledThisMonth),
    pendingSettlement: Math.round(pendingSettlement),
    totalSettled: Math.round(totalSettled),
    averageTurnaroundDays: avgTurnaround,
    nextSettlementDate: 'Next Business Day',
    settlements: items.slice(0, 15).map((s: any) => ({
      id: s.id,
      amount: Number(s.amount) / 100,
      fee: Number(s.fees || 0) / 100,
      tax: Number(s.tax || 0) / 100,
      date: formatIST(s.created_at, 'dd MMM yyyy'),
      utr: s.utr || '-',
      status: s.status,
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// 13. TIME-BASED ANALYTICS
// ═══════════════════════════════════════════════════════════════
export async function getTimeAnalytics() {
  const allPayments = await getMasterPaymentData();
  const thirtyDaysAgo = Math.floor(subDays(new Date(), 30).getTime() / 1000);
  const payments = allPayments.filter((p: any) => p.created_at >= thirtyDaysAgo && p.status === 'captured');

  // By hour
  const hourData: Record<number, any> = {};
  for (let i = 0; i < 24; i++) {
    const label = i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`;
    hourData[i] = { hour: i, label, revenue: 0, count: 0 };
  }

  // By day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData: Record<number, any> = {};
  days.forEach((label, i) => { dayData[i] = { day: i, label, revenue: 0, count: 0 }; });

  // By date of month  
  const dateData: Record<number, any> = {};
  for (let i = 1; i <= 31; i++) {
    dateData[i] = { date: i, revenue: 0, count: 0 };
  }

  payments.forEach((p: any) => {
    const date = toIST(p.created_at);
    const amount = Number(p.amount) / 100;
    const hour = getHours(date);
    const day = getDay(date);
    const dateOfMonth = getDate(date);

    hourData[hour].revenue += amount;
    hourData[hour].count += 1;
    dayData[day].revenue += amount;
    dayData[day].count += 1;
    dateData[dateOfMonth].revenue += amount;
    dateData[dateOfMonth].count += 1;
  });

  const hourly = Object.values(hourData);
  const daily = Object.values(dayData);
  const monthly = Object.values(dateData).filter((d: any) => d.count > 0);

  const peakHour = hourly.reduce((max: any, h: any) => h.count > max.count ? h : max, hourly[0]);
  const peakDay = daily.reduce((max: any, d: any) => d.count > max.count ? d : max, daily[0]);
  const busiestDate = monthly.reduce((max: any, d: any) => d.count > max.count ? d : max, monthly[0] || { date: 1, count: 0 });

  return {
    hourly,
    daily,
    monthlyDates: monthly,
    peakHour: peakHour?.label || 'N/A',
    peakDay: peakDay?.label || 'N/A',
    busiestDateOfMonth: busiestDate?.date || 1,
  };
}

// ═══════════════════════════════════════════════════════════════
// 14. CUSTOMER PAYMENT PROFILES (profiles-only)
// ═══════════════════════════════════════════════════════════════
export async function getCustomerPaymentProfiles() {
  const allPayments = await getMasterPaymentData();
  const supabase = await createServerSupabaseClient();

  // Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role').in('role', ['student', 'trial']);

  if (!profiles || profiles.length === 0) return { customers: [] };

  // Group payments by email
  const paymentsByEmail: Record<string, any[]> = {};
  allPayments.forEach((p: any) => {
    if (!p.email) return;
    if (!paymentsByEmail[p.email]) paymentsByEmail[p.email] = [];
    paymentsByEmail[p.email].push(p);
  });

  const customers = profiles
    .filter((prof: any) => paymentsByEmail[prof.email])
    .map((prof: any) => {
      const payments = paymentsByEmail[prof.email] || [];
      const successful = payments.filter((p: any) => p.status === 'captured');
      const failed = payments.filter((p: any) => p.status === 'failed');
      const refunded = payments.filter((p: any) => p.status === 'refunded');

      const totalSpent = sumAmount(successful);

      // Most used method
      const methodCounts: Record<string, number> = {};
      successful.forEach((p: any) => {
        methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
      });
      const preferredMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        name: prof.full_name || 'Unknown',
        email: prof.email,
        totalSpent: Math.round(totalSpent),
        paymentCount: successful.length,
        failedCount: failed.length,
        refundCount: refunded.length,
        firstPayment: successful.length > 0 ? formatIST(successful[successful.length - 1].created_at, 'dd MMM yyyy') : 'N/A',
        lastPayment: successful.length > 0 ? formatIST(successful[0].created_at, 'dd MMM yyyy') : 'N/A',
        preferredMethod,
        neverFailed: failed.length === 0,
        hasRefund: refunded.length > 0,
      };
    })
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent);

  return {
    customers,
    neverFailedCount: customers.filter((c: any) => c.neverFailed).length,
    hasFailedCount: customers.filter((c: any) => !c.neverFailed).length,
    hasRefundCount: customers.filter((c: any) => c.hasRefund).length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 15. LIVE PAYMENTS
// ═══════════════════════════════════════════════════════════════
export async function getLivePayments() {
  const result = (await razorpay.payments.all({ count: 10 })) as any;
  const items = result.items || [];

  const sixtyMinAgo = Math.floor(subDays(new Date(), 0).getTime() / 1000) - 3600;
  const recentItems = items.filter((p: any) => p.created_at >= sixtyMinAgo);

  const revenueLast60Min = sumAmount(recentItems.filter((p: any) => p.status === 'captured'));
  const failedLast60Min = recentItems.filter((p: any) => p.status === 'failed').length;

  return {
    payments: items.map((p: any) => ({
      id: p.id,
      amount: Number(p.amount) / 100,
      email: p.email,
      method: p.method,
      status: p.status,
      createdAt: p.created_at,
      timeAgo: formatIST(p.created_at, 'HH:mm'),
    })),
    revenueLast60Min: Math.round(revenueLast60Min),
    failedLast60Min,
  };
}

// ═══════════════════════════════════════════════════════════════
// 16. TAX AND COMPLIANCE
// ═══════════════════════════════════════════════════════════════
export async function getTaxAndCompliance() {
  const allPayments = await getMasterPaymentData();

  const now = new Date();
  const startOfMonthDate = startOfMonth(now);
  const currentMonth = now.getMonth();
  const fyYear = currentMonth < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const fyStart = new Date(fyYear, 3, 1);

  const calcMetrics = (items: any[]) => {
    const successful = items.filter((p: any) => p.status === 'captured');
    const revenue = successful.reduce((sum: number, p: any) => sum + (Number(p.amount) / 100), 0);
    const fees = items.reduce((sum: number, p: any) => sum + ((Number(p.fee) || 0) / 100), 0);
    const gst = items.reduce((sum: number, p: any) => sum + ((Number(p.tax) || 0) / 100), 0);
    return {
      totalGross: Math.round(revenue),
      totalFeesPaid: Math.round(fees),
      totalGSTOnFees: Math.round(gst),
      totalNetReceived: Math.round(revenue - fees),
    };
  };

  const allMetrics = calcMetrics(allPayments);
  const thisMonthPayments = allPayments.filter((p: any) =>
    fromUnixTime(p.created_at).getTime() >= startOfMonthDate.getTime()
  );
  const thisMonthMetrics = calcMetrics(thisMonthPayments);
  const fyPayments = allPayments.filter((p: any) =>
    fromUnixTime(p.created_at).getTime() >= fyStart.getTime()
  );
  const fyMetrics = calcMetrics(fyPayments);

  // Monthly breakdown for last 6 months
  const monthlyBreakdown: any[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = subMonths(startOfMonth(now), i);
    const monthEnd = i === 0 ? now : subMonths(startOfMonth(now), i - 1);
    const monthPayments = allPayments.filter((p: any) => {
      const d = fromUnixTime(p.created_at);
      return d >= monthStart && d < monthEnd;
    });
    const m = calcMetrics(monthPayments);
    monthlyBreakdown.push({
      month: format(monthStart, 'MMM yyyy'),
      ...m,
    });
  }

  return {
    ...allMetrics,
    thisMonth: thisMonthMetrics,
    thisFinancialYear: fyMetrics,
    monthlyBreakdown: monthlyBreakdown.reverse(),
    feePercentage: allMetrics.totalGross > 0
      ? Math.round((allMetrics.totalFeesPaid / allMetrics.totalGross) * 10000) / 100
      : 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// 17. CONVERSION ANALYTICS (from Supabase conversion_events)
// ═══════════════════════════════════════════════════════════════
export async function getConversionMetrics() {
  const supabase = await createServerSupabaseClient();
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: events, error } = await supabase
    .from('conversion_events')
    .select('*')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false });

  if (error || !events || events.length === 0) {
    return {
      configured: events !== null && !error,
      pricingViews: 0,
      buyClicks: 0,
      paymentScreens: 0,
      paymentCompleted: 0,
      paymentFailed: 0,
      paymentRetried: 0,
      conversionRate: 0,
      funnel: [],
    };
  }

  const pricingViews = events.filter((e: any) => e.event_type === 'pricing_view').length;
  const buyClicks = events.filter((e: any) => e.event_type === 'buy_click').length;
  const paymentScreens = events.filter((e: any) => e.event_type === 'payment_screen').length;
  const paymentCompleted = events.filter((e: any) => e.event_type === 'payment_complete').length;
  const paymentFailed = events.filter((e: any) => e.event_type === 'payment_failed').length;
  const paymentRetried = events.filter((e: any) => e.event_type === 'payment_retry').length;
  const contactFormFills = events.filter((e: any) => e.event_type === 'contact_form_fill').length;
  const whatsappClicks = events.filter((e: any) => e.event_type === 'whatsapp_click').length;

  const conversionRate = pricingViews > 0 ? Math.round((paymentCompleted / pricingViews) * 10000) / 100 : 0;

  const funnel = [
    { stage: 'Visited Pricing', count: pricingViews, percentage: 100 },
    { stage: 'Clicked Buy', count: buyClicks, percentage: pricingViews > 0 ? Math.round((buyClicks / pricingViews) * 100) : 0 },
    { stage: 'Completed Payment', count: paymentCompleted, percentage: pricingViews > 0 ? Math.round((paymentCompleted / pricingViews) * 100) : 0 },
  ];

  return {
    configured: true,
    pricingViews,
    buyClicks,
    paymentScreens,
    paymentCompleted,
    paymentFailed,
    paymentRetried,
    contactFormFills,
    whatsappClicks,
    conversionRate,
    funnel,
    highValueActions: [
      { label: 'Buy Plan Clicked', count: buyClicks, icon: 'buy' },
      { label: 'Subscription Purchased', count: paymentCompleted, icon: 'success' },
      { label: 'Contact Form Filled', count: contactFormFills, icon: 'mail' },
      { label: 'WhatsApp Clicked', count: whatsappClicks, icon: 'whatsapp' }
    ]
  };
}

// ═══════════════════════════════════════════════════════════════
// 18. DISPUTE AND CHARGEBACK
// ═══════════════════════════════════════════════════════════════
export async function getDisputeMetrics() {
  try {
    // Razorpay Disputes API — may not be enabled for all merchants
    const response = await fetch('https://api.razorpay.com/v1/disputes?count=50', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64'),
      },
    });

    if (!response.ok) {
      return { available: false, total: 0, chargebacks: 0, amountUnderDispute: 0, resolutionRate: 0, winRate: 0, disputes: [] };
    }

    const data = await response.json();
    const items = data.items || [];

    const chargebacks = items.filter((d: any) => d.reason_code?.includes('chargeback')).length;
    const resolved = items.filter((d: any) => ['won', 'lost', 'closed'].includes(d.status)).length;
    const won = items.filter((d: any) => d.status === 'won').length;
    const amountUnderDispute = items
      .filter((d: any) => d.status === 'open' || d.status === 'under_review')
      .reduce((sum: number, d: any) => sum + (Number(d.amount) / 100), 0);

    return {
      available: true,
      total: items.length,
      chargebacks,
      amountUnderDispute: Math.round(amountUnderDispute),
      resolutionRate: items.length > 0 ? Math.round((resolved / items.length) * 100) : 0,
      winRate: resolved > 0 ? Math.round((won / resolved) * 100) : 0,
      disputes: items.slice(0, 10).map((d: any) => ({
        id: d.id,
        paymentId: d.payment_id,
        amount: Number(d.amount) / 100,
        reason: d.reason_code || 'N/A',
        status: d.status,
        createdAt: d.created_at ? formatIST(d.created_at, 'dd MMM yyyy') : 'N/A',
      })),
    };
  } catch (error) {
    console.error('Dispute API error:', error);
    return { available: false, total: 0, chargebacks: 0, amountUnderDispute: 0, resolutionRate: 0, winRate: 0, disputes: [] };
  }
}
