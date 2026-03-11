'use client';

import React, { useState } from 'react';
import { User, Users, BookOpen, Check, ArrowRight, Loader2, Sparkles, CreditCard } from 'lucide-react';
import { createSubscription } from '@/lib/actions/subscription';
import { toast } from 'sonner';

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
    },
];

interface Props {
    currentSubscription: any;
    userId: string;
}

export function PlansClient({ currentSubscription, userId }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<string>('one_on_one');
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            await createSubscription(selectedPlan);
            toast.success('Successfully subscribed to plan!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to subscribe. Please try again.');
        } finally {
            setLoading(false);
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
                            Select the perfect Faceyoguez subscription plan to unlock your transformation. You can upgrade or switch plans at any time.
                        </p>
                    </div>
                </div>

                {currentSubscription && (
                    <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                        <div className="h-10 w-10 bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-bold text-blue-900">Current Active Plan</h2>
                            <p className="text-xs text-blue-800 mt-1">
                                You currently have an active <span className="font-bold">{currentSubscription.plan_type.replace(/_/g, ' ')}</span> subscription.
                                Subscribing to a new plan will replace or extend your current duration depending on validity.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        const Icon = plan.icon;
                        const isCurrentPlan = currentSubscription?.plan_type === plan.id;

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

                                {isCurrentPlan && (
                                    <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase">Current</span>
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

                                <div className="mt-6 flex flex-col gap-3 flex-1 mb-8">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400'}`}>
                                                <Check className="h-2.5 w-2.5" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
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
