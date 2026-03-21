import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentGroupHub } from './StudentGroupHub';
import { getBatchResources } from '@/lib/actions/resources';
import { getStudentWaitingStatus } from '@/lib/actions/batches';
import type { Profile, Batch } from '@/types/database';
import { Clock, Bell, Sparkles } from 'lucide-react';

export default async function StudentGroupPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'student') {
        redirect('/auth/login');
    }

    const admin = createAdminClient();

    // Find the student's active batch enrollments (including trial access)
    const { data: enrollments } = await admin
        .from('batch_enrollments')
        .select(`
            *,
            batches (*),
            subscriptions (*)
        `)
        .eq('student_id', user.id)
        .in('status', ['active', 'extended'])
        .order('created_at', { ascending: false });

    // Prioritize an 'active' batch over 'upcoming' or others
    const enrollment = enrollments?.find(e => e.batches?.status === 'active') || enrollments?.[0] || null;

    let activeBatch = enrollment?.batches || null;
    // Only show "Trial" mode if the enrollment IS trial access AND the subscription itself IS a trial.
    // This hides the trial banner for paid users who are just getting a 2-day preview of a running batch.
    let isTrialAccess = (enrollment?.is_trial_access && enrollment?.subscriptions?.is_trial) || false;

    // Also check if they have an active subscription (fallback for manual DB changes)
    const { data: activeSub } = await admin
        .from('subscriptions')
        .select('id, is_trial, start_date')
        .eq('student_id', user.id)
        .eq('plan_type', 'group_session')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    // Smart Fallback: If student is active but not enrolled, show them the latest active batch
    if (!activeBatch && activeSub) {
        const { data: latestBatches } = await admin
            .from('batches')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (latestBatches?.[0]) {
            activeBatch = latestBatches[0];
            // When falling back, we treat it as trial access ONLY if the sub itself is a trial.
            isTrialAccess = activeSub.is_trial || false; 
        }
    }

    // If student has an active enrollment (or active sub + fallback batch), show the hub
    if (activeBatch) {
        let resources: any[] = [];
        resources = await getBatchResources(activeBatch.id);

        return (
            <StudentGroupHub
                currentUser={profile as Profile}
                activeBatch={activeBatch as Batch | null}
                initialResources={resources}
                isTrialAccess={isTrialAccess}
                trialEndDate={enrollment?.effective_end_date || null}
                subscriptionStartDate={enrollment?.subscriptions?.start_date || activeSub?.start_date || null}
            />
        );
    }

    // Check if student is in the waiting queue
    const waitingStatus = await getStudentWaitingStatus(user.id);

    if (waitingStatus || activeSub) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-2xl border border-pink-100 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-500">
                        <Clock className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">
                        {waitingStatus ? "You're in the Queue!" : "Subscription Active!"}
                    </h2>
                    <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                        {waitingStatus 
                            ? "A batch is currently in progress. You'll be automatically enrolled when the next batch starts."
                            : "Your subscription is active! We're currently assigning you to a batch. You'll be notified as soon as you can join."
                        }
                        {" "}Your subscription will begin on the first day of your batch.
                    </p>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-pink-50 border border-pink-100 px-4 py-3">
                        <Bell className="h-4 w-4 text-pink-500" />
                        <p className="text-xs font-medium text-pink-600">
                            You&apos;ll be notified via the platform once your batch assignment is complete.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // No enrollment and not in queue — no group subscription
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">No Active Group Session</h2>
                <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                    You don&apos;t have an active group session subscription. Purchase a plan to join the next batch!
                </p>
                <a
                    href="/student/plans"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-pink-600 hover:shadow-lg"
                >
                    <Sparkles className="h-4 w-4" />
                    View Plans
                </a>
            </div>
        </div>
    );
}
