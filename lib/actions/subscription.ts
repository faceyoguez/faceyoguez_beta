'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const PRICING: Record<string, Record<string, number>> = {
    one_on_one: {
        '1_month': 5499,
        '3_months': 11000,
        '6_months': 18000,
        '12_months': 30000,
    },
    group_session: {
        '1_month_12d': 1499,
        '1_month_lifetime': 1998,
        '3_months_12d': 3499,
        '3_months_lifetime': 4348,
    },
    lms: {
        'level_1': 999,
        'level_1_2': 1499,
    },
};

export async function createSubscription(
    planType: string,
    isTrial: boolean = false,
    options?: {
        variant?: string;
        customAmount?: number;
        customDuration?: number;
        metadata?: Record<string, any>;
    }
) {
    const supabase = await createServerSupabaseClient();
    const adminAuth = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const validPlanTypes = ['one_on_one', 'group_session', 'lms'];
    if (!validPlanTypes.includes(planType)) {
        throw new Error('Invalid plan type provided.');
    }

    // For trials, check if user already had a trial for this plan type
    if (isTrial) {
        const { data: existingTrials } = await adminAuth
            .from('subscriptions')
            .select('id')
            .eq('student_id', user.id)
            .eq('plan_type', planType)
            .eq('is_trial', true)
            .limit(1);

        if (existingTrials && existingTrials.length > 0) {
            throw new Error('You have already used your free trial for this plan.');
        }
    }

    const startDate = new Date();
    const endDate = new Date();

    let amount = 0;
    let durationMonths = options?.customDuration || 1;

    if (isTrial) {
        endDate.setDate(endDate.getDate() + 2); // 2-day trial
        durationMonths = 0;
        amount = 0;
    } else {
        // Determine amount from variant or customAmount
        if (options?.customAmount !== undefined) {
            amount = options.customAmount;
        } else if (options?.variant && PRICING[planType]?.[options.variant]) {
            amount = PRICING[planType][options.variant];
            // Infer duration if variant matches month count
            if (options.variant.includes('1_month')) durationMonths = 1;
            if (options.variant.includes('3_months')) durationMonths = 3;
            if (options.variant.includes('6_months')) durationMonths = 6;
            if (options.variant.includes('12_months')) durationMonths = 12;
            if (planType === 'lms') durationMonths = 999; // Lifetime
        } else {
            // Fallback to basic 1-month if exists
            amount = PRICING[planType]?.['1_month'] || 0;
        }

        if (durationMonths === 999) {
            endDate.setFullYear(endDate.getFullYear() + 50); // Effectively lifetime
        } else {
            endDate.setMonth(endDate.getMonth() + durationMonths);
        }
    }

    // Group sessions: start as 'pending' — activated when batch is created
    const isGroupSession = planType === 'group_session' && !isTrial;

    const { data: subscription, error } = await adminAuth
        .from('subscriptions')
        .insert({
            student_id: user.id,
            plan_type: planType,
            status: isGroupSession ? 'pending' : 'active',
            duration_months: durationMonths,
            start_date: isGroupSession ? null : startDate.toISOString().split('T')[0],
            end_date: isGroupSession ? null : endDate.toISOString().split('T')[0],
            amount: amount,
            currency: 'INR',
            payment_id: isTrial ? 'trial' : 'dashboard',
            batches_remaining: planType === 'group_session' ? (durationMonths || 1) : 1,
            batches_used: 0,
            is_trial: isTrial,
            metadata: {
                variant: options?.variant,
                ...options?.metadata
            }
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create subscription', error);
        throw new Error('Database Error: ' + error.message);
    }

    // For group sessions, add to waiting queue (may also grant trial access to current batch)
    if (planType === 'group_session') {
        const { enrollInWaitingQueue } = await import('./batches');
        await enrollInWaitingQueue(user.id, subscription.id);
    }

    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/one-on-one');
    revalidatePath('/student/group-session');

    return subscription;
}

// Get all active subscriptions for a student (supports multiple)
export async function getStudentSubscriptions(studentId?: string) {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    let userId = studentId;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        userId = user.id;
    }

    const { data, error } = await admin
        .from('subscriptions')
        .select('*')
        .eq('student_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }

    return data || [];
}

// Assign an instructor to a subscription
export async function assignInstructor(subscriptionId: string, instructorId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const admin = createAdminClient();

    // Verify the assigner is staff/admin/client_management
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'staff', 'client_management'].includes(profile.role)) {
        throw new Error('Only staff can assign instructors');
    }

    // Verify the target is an instructor
    const { data: instructor } = await admin
        .from('profiles')
        .select('id, role')
        .eq('id', instructorId)
        .single();

    if (!instructor || instructor.role !== 'instructor') {
        throw new Error('Target user is not an instructor');
    }

    // Update subscription
    const { error } = await admin
        .from('subscriptions')
        .update({ assigned_instructor_id: instructorId, updated_by: user.id })
        .eq('id', subscriptionId);

    if (error) throw new Error('Failed to assign instructor: ' + error.message);

    // Get subscription details to find student
    const { data: sub } = await admin
        .from('subscriptions')
        .select('student_id')
        .eq('id', subscriptionId)
        .single();

    if (sub) {
        // Create or ensure a direct conversation exists between student and instructor
        const { getOrCreateDirectChatBetween } = await import('./chat');
        await getOrCreateDirectChatBetween(sub.student_id, instructorId);
    }

    revalidatePath('/instructor/one-on-one');
    return { success: true };
}

// Get all instructors (for assignment dropdown)
export async function getInstructors() {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_master_instructor')
        .eq('role', 'instructor')
        .order('is_master_instructor', { ascending: false });

    if (error) {
        console.error('Error fetching instructors:', error);
        return [];
    }
    return data || [];
}

// Live growth metrics
export async function getLiveGrowthMetrics() {
    const admin = createAdminClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // New joinees this month (subscriptions created this month, not trial)
    const { count: newJoinees } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)
        .eq('is_trial', false)
        .eq('status', 'active');

    // Renewals this month (subscriptions where start_date is this month but created_at is before this month)
    const { count: renewals } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', startOfMonth.split('T')[0])
        .lt('created_at', startOfMonth)
        .eq('status', 'active');

    // Total active students
    const { count: totalActive } = await admin
        .from('subscriptions')
        .select('student_id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_trial', false);

    // Expiring this week
    const { count: expiringThisWeek } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .lte('end_date', endOfWeek)
        .gte('end_date', now.toISOString().split('T')[0])
        .eq('status', 'active');

    return {
        newJoineesThisMonth: newJoinees || 0,
        renewalsThisMonth: renewals || 0,
        totalActiveStudents: totalActive || 0,
        expiringThisWeek: expiringThisWeek || 0,
    };
}
