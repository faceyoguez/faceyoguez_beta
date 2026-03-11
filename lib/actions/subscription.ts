'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSubscription(planType: string) {
    const supabase = await createServerSupabaseClient();
    const adminAuth = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const validPlans = ['one_on_one', 'group_session', 'lms'];
    if (!validPlans.includes(planType)) {
        throw new Error('Invalid plan type provided.');
    }

    // Define logic based on plan type
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month logic for now

    const pricing: Record<string, number> = {
        one_on_one: 4999,
        group_session: 1999,
        lms: 999,
    };

    const amount = pricing[planType] || 0;

    // NOTE: For now, if someone subscribes to a group_session via dashboard
    // it behaves exactly as the waitlist logic requires. It drops into 'active' 
    // or 'waiting' depending on whether there's an active batch.
    // The trigger handles this logic automatically upon insertion!

    // Insert Subscription using the Admin Client to securely bypass RLS
    const { data: subscription, error } = await adminAuth
        .from('subscriptions')
        .insert({
            student_id: user.id,
            plan_type: planType,
            status: 'active',
            duration_months: 1,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            amount: amount,
            currency: 'INR',
            payment_id: 'dashboard',   // Mark that this was created via the Dashboard portal
            batches_remaining: 1,
            batches_used: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create subscription', error);
        throw new Error('Database Error: ' + error.message);
    }

    // Refresh user dashboard views
    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');

    return subscription;
}
