'use server';

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
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized Access: Admin role required.');
  }

  return true;
}

/**
 * Pull Financial Data from Razorpay.
 */
export async function getRazorpayStats() {
  await requireAdminAccess();

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are missing.');
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    // Fetch recent payments. limit: 100
    const paymentsResponse = await razorpay.payments.all({ count: 100 });
    const payments = paymentsResponse.items;

    let totalRevenue = 0;
    let newRevenueThisMonth = 0;
    const recentTransactions: any[] = [];
    const uniqueEmails = new Set<string>();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Setup chart data map for the last 6 months
    const chartDataMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      chartDataMap.set(monthName, 0);
    }

    for (const p of payments) {
      if (p.status === 'captured' || p.status === 'authorized') {
        const amountInINR = Number(p.amount) / 100; // amount is in paise
        totalRevenue += amountInINR;

        // Razorpay created_at is a unix timestamp in seconds
        const pDate = new Date(Number(p.created_at) * 1000);
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
          newRevenueThisMonth += amountInINR;
        }

        const pMonthName = pDate.toLocaleString('default', { month: 'short' });
        if (chartDataMap.has(pMonthName)) {
          chartDataMap.set(pMonthName, chartDataMap.get(pMonthName)! + amountInINR);
        }

        if (p.email) {
          uniqueEmails.add(p.email);
        }
      }

      // Add to recent transactions (top 5)
      if (recentTransactions.length < 5) {
        recentTransactions.push({
          id: p.id,
          amount: `₹ ${(Number(p.amount) / 100).toLocaleString('en-IN')}`,
          email: p.email || 'guest@example.com',
          date: new Date(Number(p.created_at) * 1000).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          }),
          status: p.status
        });
      }
    }

    const chartData = Array.from(chartDataMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    return {
      totalRevenue: `₹ ${totalRevenue.toLocaleString('en-IN')}`,
      newRevenueThisMonth: `₹ ${newRevenueThisMonth.toLocaleString('en-IN')}`,
      activeSubscriptions: uniqueEmails.size,
      newStudentsThisMonth: Math.floor(uniqueEmails.size * 0.15), // Approximation
      renewalRate: 'N/A', // Subscription tracking requires Razorpay Subscriptions API
      chartData,
      recentTransactions,
    };
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error('Failed to fetch data from Razorpay.');
  }
}

/**
 * Placeholder logic for pulling Google Analytics Data
 */
export async function getAnalyticsStats() {
  await requireAdminAccess();

  // Fake Network Delay
  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    totalVisitors30d: 4890,
    activeUsersNow: 15,
    avgSessionDuration: '3m 12s',
    bounceRate: '42%',
    trafficSources: [
      { name: 'Direct', value: 1200 },
      { name: 'Organic Search', value: 2400 },
      { name: 'Social (IG)', value: 900 },
      { name: 'Referral', value: 390 },
    ]
  };
}

/**
 * Placeholder logic for pulling Instagram / Meta Data
 */
export async function getSocialStats() {
  await requireAdminAccess();

  // Fake Network Delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    followersCount: '12.4K',
    followerGrowth30d: '+420',
    totalReach30d: '45,000',
    profileViews30d: '1,200',
    pixelData: {
      checkoutsInitiated: 89,
      purchasesConverted: 12,
    }
  };
}
