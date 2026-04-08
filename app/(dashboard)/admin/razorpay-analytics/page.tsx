import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import RazorpayAnalyticsClient from '@/app/(dashboard)/admin/razorpay-analytics/RazorpayAnalyticsClient';
 
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Razorpay Analytics | Faceyoguez Admin',
  description: 'Manage and track payments, revenue, and subscriptions.',
};

export default async function RazorpayAnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin or instructor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'instructor'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RazorpayAnalyticsClient />
    </div>
  );
}
