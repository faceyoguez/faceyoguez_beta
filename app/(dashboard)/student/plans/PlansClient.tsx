'use client';

import React, { useState } from 'react';
import { User, Users, BookOpen, Check, ArrowRight, Loader2, Sparkles, CreditCard, Gift } from 'lucide-react';
import { createSubscription } from '@/lib/actions/subscription';
import { toast } from 'sonner';
import type { Subscription } from '@/types/database';

const plans = [
    {
        id: 'one_on_one' as const,
        name: '1-on-1 Plan',
        icon: User,
        price: '₹4,999',
        duration: '1 month',
        description: 'Personal instructor, custom plan, direct chat & video sessions',
        features: [
            'Dedicated instructor',
            'Personalized face yoga plan',
            'Direct chat anytime',
            'Weekly video sessions',
            'Progress tracking',
        ],
        popular: true,
        trialAvailable: true,
    },
    {
        id: 'group_session' as const,
        name: 'Group Session',
        icon: Users,
        price: '₹1,999',
        duration: '1 month',
        description: 'Join group batches with live sessions and community support',
        features: [
            'Live group sessions',
            'Batch-based learning',
            'Group chat access',
            'Guided routines',
        ],
        popular: false,
        trialAvailable: true,
    },
    {
        id: 'lms' as const,
        name: 'LMS Access',
        icon: BookOpen,
        price: '₹999',
        duration: '1 month',
        description: 'Self-paced video courses and learning modules',
        features: [
            'Full video library',
            'Self-paced learning',
            'Module tracking',
            'Downloadable resources',
        ],
        popular: false,
        trialAvailable: false,
    },
];

interface Props {
    activeSubscriptions: Subscription[];
    userId: string;
}

export function PlansClient({ activeSubscriptions, userId }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<string>('one_on_one');
    const [loading, setLoading] = useState(false);
    const [trialLoading, setTrialLoading] = useState<string | null>(null);

    // Check which plans the student already has active
    const activePlanTypes = activeSubscriptions.map(s => s.plan_type);
    const trialPlanTypes = activeSubscriptions.filter(s => s.is_trial).map(s => s.plan_type);
    const usedTrials = activeSubscriptions.filter(s => s.is_trial).map(s => s.plan_type);

    const handleSubscribe = async () => {
        if (activePlanTypes.includes(selectedPlan as any) && !trialPlanTypes.includes(selectedPlan as any)) {
            toast.error('You already have an active subscription for this plan.');
            return;
        }
        setLoading(true);
        try {
            await createSubscription(selectedPlan, false);
            toast.success('Successfully subscribed to plan!');
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to subscribe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrial = async (planId: string) => {
        setTrialLoading(planId);
        try {
            await createSubscription(planId, true);
            toast.success('Free trial started! You have 2 days to explore.');
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to start trial.');
        } finally {
            setTrialLoading(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Sparkles className="h-32 w-32" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Choose Your Journey</h1>
                        <p className="mt-2 text-pink-100 max-w-2xl">
                            Select the perfect Faceyoguez subscription plan to unlock your transformation. You can subscribe to multiple plans simultaneously.
                        </p>
                    </div>
                </div>

                {/* Active subscriptions summary */}
                {activeSubscriptions.length > 0 && (
                    <div className="mb-8 space-y-3">
                        {activeSubscriptions.map((sub) => (
                            <div key={sub.id} className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm ${sub.is_trial ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${sub.is_trial ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'}`}>
                                    {sub.is_trial ? <Gift className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className={`text-sm font-bold ${sub.is_trial ? 'text-amber-900' : 'text-blue-900'}`}>
                                            {sub.plan_type.replace(/_/g, ' ')}
                                        </h2>
                                        {sub.is_trial && (
                                            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                                                Trial
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${sub.is_trial ? 'text-amber-700' : 'text-blue-700'}`}>
                                        {sub.is_trial ? '2-day free trial' : `₹${sub.amount}`} &middot; Expires {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        const Icon = plan.icon;
                        const hasActivePlan = activePlanTypes.includes(plan.id);
                        const hasActiveTrial = trialPlanTypes.includes(plan.id);
                        const hasUsedTrial = usedTrials.includes(plan.id);
                        const canTrial = plan.trialAvailable && !hasUsedTrial;

                        return (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all duration-300 ${isSelected
                                        ? 'border-pink-500 bg-white shadow-xl shadow-pink-100/50 scale-[1.02]'
                                        : 'border-white/60 bg-white/60 hover:border-pink-200 hover:bg-white shadow-sm'
                                    }`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                                        Most Popular
                                    </span>
                                )}

                                {hasActivePlan && (
                                    <span className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded uppercase ${hasActiveTrial ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {hasActiveTrial ? 'Trial Active' : 'Active'}
                                    </span>
                                )}

                                <div className="mb-4 flex items-center justify-between mt-2">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isSelected
                                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/50'
                                            : 'bg-pink-50 text-pink-500'
                                        }`}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    {isSelected && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm">
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

                                <div className="mt-2 flex items-baseline gap-1 border-b border-gray-100 pb-4">
                                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                                    <span className="text-sm text-gray-500 font-medium">/ {plan.duration}</span>
                                </div>

                                <p className="mt-4 text-sm leading-relaxed text-gray-600">{plan.description}</p>

                                <div className="mt-6 flex flex-col gap-3 flex-1 mb-4">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400'}`}>
                                                <Check className="h-2.5 w-2.5" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Trial button */}
                                {canTrial && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartTrial(plan.id);
                                        }}
                                        className="mt-auto flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-400 cursor-pointer"
                                    >
                                        {trialLoading === plan.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Gift className="h-4 w-4" />
                                        )}
                                        Start 2-Day Free Trial
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm border border-pink-100 shadow-xl rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl w-full">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Selected Plan</p>
                            <h3 className="text-2xl font-bold text-gray-900">{plans.find(p => p.id === selectedPlan)?.name}</h3>
                        </div>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-4 text-white shadow-md shadow-pink-200/50 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 w-full sm:w-auto font-bold text-lg min-w-[200px]"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Subscribe Now'}
                            {!loading && <ArrowRight className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
