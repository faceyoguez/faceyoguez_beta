import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { redirect } from 'next/navigation';
import { StudentGroupHub } from './StudentGroupHub';
import { getBatchResources } from '@/lib/actions/resources';
import { getStudentWaitingStatus } from '@/lib/actions/batches';
import type { Profile, Batch } from '@/types/database';
import { Clock, Bell, Sparkles, ChevronRight } from 'lucide-react';

export default async function StudentGroupPage() {
    const user = await getServerUser();
    if (!user) redirect('/auth/login');

    const profile = await getServerProfile(user.id);
    if (profile?.role !== 'student') redirect('/auth/login');

    const admin = createAdminClient();

    const today = new Date().toISOString().split('T')[0];

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
        .or(`effective_end_date.is.null,effective_end_date.gte.${today}`)
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
        .or(`end_date.is.null,end_date.gte.${today}`)
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
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-100 bg-white shadow-sm p-12 text-center space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                        <Clock className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {waitingStatus ? "Waiting for Batch" : "Your Batch is Active"}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                            {waitingStatus
                                ? "A batch is currently running. You'll be added to the next one automatically."
                                : "You're enrolled! We're assigning you to a batch. You'll be notified as soon as it's ready."
                            }
                            <br /><br />
                            Your plan starts from the first day of your batch.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black uppercase tracking-widest border border-[#FF8A75]/5">
                        <Bell className="h-3.5 w-3.5 animate-pulse" />
                        Batch Starting Soon
                    </div>
                </div>
            </div>
        );
    }

    // No enrollment and not in queue — no group subscription
    return (
        <div className="flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-100 bg-white shadow-sm p-12 text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <Sparkles className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Group Classes</h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                        You haven&apos;t joined a group class yet. Pick a plan to start practising with a batch.
                    </p>
                </div>

                <a
                    href="/student/plans"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-[#FF8A75] transition-all"
                >
                    View Plans
                    <ChevronRight className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
