'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS_DATA } from '@/lib/constants/plans';
import { toast } from 'sonner';
import { 
    Check, Loader2, Sparkles, 
    ShieldCheck, MoveRight, Star, Heart, Zap, 
    Calendar, Image as ImageIcon, BookOpen, Clock, Activity, Users, CreditCard,
    XCircle, CheckCircle2, Tag
} from 'lucide-react';
import { activateTrial } from '@/app/actions/plans';
import type { Profile } from '@/types/database';
import { toast as sonnerToast } from 'sonner';
import { consumeCouponAction } from '@/lib/actions/coupons';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function durationFromTierId(tierId: string): number {
  if (tierId.startsWith('12')) return 12;
  if (tierId.startsWith('6')) return 6;
  if (tierId.startsWith('3')) return 3;
  if (tierId === 'level_1' || tierId === 'level_1_2') return 360; // Long-term lifetime
  return 1;
}

interface Props {
  currentSubscription: any[] | null;
  userId: string;
  currentUser?: Profile | null;
  hasUsedTrial?: boolean;
  hasActiveSubscription?: boolean;
}

export default function PlansClient({ currentSubscription, userId, currentUser, hasUsedTrial: initialHasUsedTrial, hasActiveSubscription = false }: Props) {
    const [isStartingTrial, setIsStartingTrial] = useState(false);
    const [hasUsedTrial, setHasUsedTrial] = useState(initialHasUsedTrial);
    const router = useRouter();
    const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS_DATA[0].id);
    const [selectedTierId, setSelectedTierId] = useState<string>(PLANS_DATA[0].tiers[0].id);
    const [loading, setLoading] = useState(false);
    const [mobileTab, setMobileTab] = useState<'data' | 'pricing'>('data');

    const currentPlan = PLANS_DATA.find(p => p.id === selectedPlanId)!;
    const currentTier = currentPlan.tiers.find(t => t.id === selectedTierId) || currentPlan.tiers[0];

    useEffect(() => {
        const popular = currentPlan.tiers.find((t: any) => t.badge === 'MOST POPULAR') || currentPlan.tiers[0];
        setSelectedTierId(popular.id);
    }, [selectedPlanId]);

    const handleStartTrial = async () => {
        setIsStartingTrial(true);
        try {
            const res = await activateTrial(userId);
            if (res.success) {
                sonnerToast.success('Trial activated! You have 3 days of full access. 🧘‍♂️');
                setHasUsedTrial(true);
                router.push('/student/dashboard');
            } else {
                sonnerToast.error(res.error || 'Failed to start trial');
            }
        } catch (err) {
            sonnerToast.error('Something went wrong');
        } finally {
            setIsStartingTrial(false);
        }
    };

    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);
    const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const bumps = {
        group_session: [
            { id: 'bump_recorded', title: 'Recorded Plan (Level 1+2)', desc: 'Get 32 lifetime recorded sessions to practise between live sessions.', originalPrice: 3999, discountedPrice: 2799, icon: BookOpen },
            { id: 'bump_1_1', title: '1-1 Personal Plan', desc: 'Get a fully customised face yoga plan built around your face.', originalPrice: 5499, discountedPrice: 4399, icon: Star }
        ],
        lms: [
            selectedTierId === 'level_1' ? { id: 'bump_upgrade_l12', title: 'Complete Plan (Level 1 + Level 2)', desc: 'Level 2 is where the real transformation happens.', originalPrice: 3999, discountedPrice: 2999, icon: Sparkles } : 
            { id: 'bump_group', title: '21-Day Live Group Transformation', desc: 'Pair your recorded plan with live group energy.', originalPrice: 3499, discountedPrice: 2799, icon: Users }
        ],
        one_on_one: [
            { id: 'bump_recorded_1_1', title: 'Recorded Plan (Level 1+2)', desc: 'Extra practice and deeper technique on days between consultations.', originalPrice: 3999, discountedPrice: 2999, icon: BookOpen },
            { id: 'bump_group_1_1', title: '21-Day Live Group Sessions', desc: 'Stay motivated and accountable with the energy of a live group.', originalPrice: 1499, discountedPrice: 999, icon: Users }
        ]
    };

    const currentBumps = bumps[selectedPlanId as keyof typeof bumps] || [];

    const calculateTotal = () => {
        let total = currentTier.discountedPrice;
        selectedBumps.forEach(bumpId => {
            const bump = currentBumps.find(b => b.id === bumpId);
            if (bump) total += bump.discountedPrice;
        });

        if (appliedCoupon) {
            total = total * (1 - appliedCoupon.discount_percentage / 100);
        }
        return Math.round(total);
    };

    const applyCoupon = async () => {
        if (!couponCode) return;
        setVerifyingCoupon(true);
        setCouponStatus(null);
        try {
            const res = await fetch(`/api/coupons/verify?code=${couponCode.toUpperCase()}&planType=${selectedPlanId}`);
            const result = await res.json();
            
            if (!res.ok || result.error) {
                const errMsg = result.error || 'Invalid coupon code';
                setCouponStatus({ type: 'error', message: errMsg });
                setAppliedCoupon(null);
            } else if (result.data) {
                setAppliedCoupon(result.data);
                setCouponStatus({
                    type: 'success',
                    message: `"${result.data.code}" applied! You save ${result.data.discount_percentage}% on your order.`
                });
            }
        } catch (error) {
            setCouponStatus({ type: 'error', message: 'Connection error. Please try again.' });
            setAppliedCoupon(null);
        } finally {
            setVerifyingCoupon(false);
        }
    };

    const handleProceed = async () => {
        setLoading(true);
        try {
            if (appliedCoupon) {
                // Consume the coupon securely on the server
                const res = await consumeCouponAction(appliedCoupon.code, selectedPlanId);
                if (!res.success) {
                    toast.error(res.error || 'Failed to apply coupon. Please try again.');
                    setLoading(false);
                    return;
                }
            }
            
            // Simulate purchase for now as requested
            setTimeout(() => {
                const params = new URLSearchParams({
                    planId: selectedPlanId,
                    tierId: selectedTierId,
                    amount: calculateTotal().toString(),
                    bumps: selectedBumps.join(',')
                });
                router.push(`/student/purchase-success?${params.toString()}`);
                setLoading(false);
            }, 1500);
        } catch (error) {
            toast.error('Something went wrong during checkout.');
            setLoading(false);
        }
    };

    const handlePay = async (isTrial: boolean = false) => {
        if (isTrial) {
            toast.info('Free trial is coming soon!');
            return;
        }
        setShowCheckout(true);
    };

    const planContent = {
        one_on_one: {
            hook: "A Face Yoga Plan Made Just for You",
            problem: "Group programs can't address your unique facial structure and skin concerns.",
            solution: "A personalised routine designed around your face, your goals, and your schedule.",
            workOn: ["Sagging & Firmness", "Jawline Definition", "Double Chin", "Deep Wrinkles", "Eye Area"],
            journey: [
                { icon: Star, title: "Enrol", desc: "Instant Access" },
                { icon: ImageIcon, title: "Photo Assessment", desc: "Expert skin assessment" },
                { icon: Video, title: "1-on-1 Call", desc: "Private video call" },
                { icon: BookOpen, title: "Your Routine", desc: "Your custom videos" }
            ],
            dashboard: ["Progress Tracker", "Chat with Instructor", "Quick Session Link", "Daily Practice Log"]
        },
        group_session: {
            hook: "21 Days to a Visibly Lifted, Glowing Face",
            problem: "Surface treatments alone can't give you lasting results.",
            solution: "21 days of guided group classes to help you look and feel your best.",
            workOn: ["Facial Sculpting", "Natural Facelift", "Neck Toning", "Complexion Glow"],
            journey: [
                { icon: Calendar, title: "Batch Starts", desc: "Starting soon" },
                { icon: Clock, title: "Daily Class", desc: "Live class every evening" },
                { icon: Users, title: "Your Batch", desc: "Practise with your group" },
                { icon: Zap, title: "Recordings", desc: "Access recordings anytime" }
            ],
            dashboard: ["Join Live Class", "Class Recordings", "Batch Progress", "Get Help"]
        },
        lms: {
            hook: "Learn Face Yoga at Your Own Pace",
            problem: "Busy schedule? No problem — learn whenever it suits you.",
            solution: "Expert-designed video modules with lifetime access. Learn once, practise forever.",
            workOn: ["Foundation Basics", "L-Systems Practice", "Advanced Sculpts", "Daily Integration"],
            journey: [
                { icon: Star, title: "Start Now", desc: "Instant lifetime access" },
                { icon: Activity, title: "Track Progress", desc: "Photo progress tracker" },
                { icon: Check, title: "Learn Step-by-Step", desc: "Step-by-step modules" },
                { icon: Heart, title: "See Results", desc: "Focus on your results" }
            ],
            dashboard: ["Photo Progress", "Course Modules", "Quick Support", "Bonus Resources"]
        }
    };

    const currentMeta = planContent[selectedPlanId as keyof typeof planContent];
    const cardBg = "bg-white border border-[#FF8A75]/10";

    return (
        <div className="min-h-screen relative font-sans text-[#374151] selection:bg-[#FF8A75]/20 overflow-hidden bg-[#FFFAF7]/40">
            {/* Desktop Professional Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-5 p-8 h-screen max-w-[1500px] mx-auto overflow-hidden">
                {/* Panel 1: Ritual Selector */}
                <div className="col-span-3 flex flex-col gap-5 h-full overflow-hidden">
                    <div className="flex-shrink-0">
                         <h1 className="text-3xl font-bold leading-none tracking-tight text-[#1a1a1a]">Choose Your Plan</h1>
                         <p className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Face yoga plans for every goal</p>
                    </div>

                    {/* Active sub banner - NOW DYNAMIC */}
                    <div className="p-4 rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 flex-shrink-0">
                        <div className="flex gap-2.5">
                            <CreditCard className="w-5 h-5 text-[#FF8A75] mt-0.5" />
                            <div>
                                <h4 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-widest">Plan Selection</h4>
                                <p className="text-[10px] font-bold text-[#1a1a1a] mt-1 leading-tight">
                                    You are viewing the {selectedPlanId.replace(/_/g, ' ')} plan.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-2.5 overflow-y-auto pr-2 scrollbar-hide py-1">
                        {PLANS_DATA.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`
                                    w-full p-4 rounded-2xl text-left transition-all relative group border
                                    ${selectedPlanId === plan.id 
                                        ? 'bg-white border-[#FF8A75] ring-1 ring-[#FF8A75]/20 shadow-sm' 
                                        : 'bg-white/50 border-[#FF8A75]/10 hover:border-[#FF8A75]/30'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${selectedPlanId === plan.id ? 'bg-[#FF8A75] text-white' : 'bg-[#FF8A75]/8 text-[#FF8A75]'}`}>
                                        {plan.id === 'one_on_one' ? <Star className="w-4.5 h-4.5" /> : plan.id === 'lms' ? <BookOpen className="w-4.5 h-4.5" /> : <Users className="w-4.5 h-4.5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold tracking-tight text-[#1a1a1a]">{plan.title.split(' ')[0]}</h2>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]">{plan.id.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                {selectedPlanId === plan.id && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF8A75] rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={`p-3 rounded-xl flex items-center gap-2.5 ${cardBg} flex-shrink-0`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                             <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="text-[8px] font-bold leading-tight">Secure & Verified Checkout</div>
                    </div>
                </div>

                {/* Panel 2: Deep Dive */}
                <div className="col-span-6 flex flex-col gap-4 h-full overflow-hidden pb-6">
                    <div className={`flex-1 p-7 rounded-[2rem] flex flex-col gap-5 relative overflow-hidden ${cardBg}`}>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.3em]">Details</span>
                            <h2 className="text-2xl font-bold text-[#1a1a1a] leading-tight">{currentMeta?.hook}</h2>
                            <p className="text-xs font-medium leading-relaxed max-w-lg opacity-80">{currentMeta?.problem}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <h4 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.2em]">Focus Areas</h4>
                                 <div className="space-y-1.5">
                                     {currentMeta?.workOn.map((f, i) => (
                                         <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-[#374151] uppercase tracking-wider">
                                              <div className="w-1 h-1 rounded-full bg-[#FF8A75]" />
                                              {f}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                             <div className="space-y-2">
                                 <h4 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.2em]">Methodology</h4>
                                 <p className="text-[11px] font-medium leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-3">
                             {currentMeta?.journey.map((step: any, i: number) => (
                                 <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[#FFFAF7]/40 border border-[#FF8A75]/10">
                                     <div className="p-2 rounded-lg bg-[#FF8A75] text-white flex-shrink-0">
                                         <step.icon className="w-3 h-3" />
                                     </div>
                                     <div>
                                         <div className="text-[10px] font-bold leading-none mb-0.5">{step.title}</div>
                                         <div className="text-[8px] text-[#1a1a1a]/70 font-medium">{step.desc}</div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl flex flex-col gap-3 ${cardBg} bg-[#FFFAF7]/60 flex-shrink-0`}>
                         <h4 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.2em]">Dashboard Experience</h4>
                         <div className="flex items-center justify-between gap-3">
                             {currentMeta?.dashboard.map((d: string, i: number) => (
                                 <div key={i} className="flex flex-col items-center gap-2 text-center p-3 rounded-xl bg-white border border-[#FF8A75]/10 flex-1">
                                     <div className="w-1 h-1 rounded-full bg-[#FF8A75]" />
                                     <span className="text-[8px] font-black leading-tight uppercase text-[#6B7280] tracking-widest">{d}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Panel 3: Membership & Checkout */}
                <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide py-1">
                         <h3 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.2em] px-2 mb-1">Memberships</h3>
                         {currentPlan.tiers.map((tier) => (
                             <button
                                 key={tier.id}
                                 onClick={() => setSelectedTierId(tier.id)}
                                 className={`
                                     w-full p-4 rounded-xl text-left transition-all border-2 relative
                                     ${selectedTierId === tier.id 
                                         ? 'border-[#FF8A75] bg-white ring-2 ring-[#FF8A75]/5' 
                                         : 'bg-white border-[#FF8A75]/10 hover:border-[#FF8A75]/30'}
                                 `}
                             >
                                 <div className="flex justify-between items-center gap-2">
                                     <div className="min-w-0">
                                         <h5 className="font-bold text-xs tracking-tight text-[#1a1a1a] truncate">{tier.label}</h5>
                                         {tier.badge && (
                                            <span className="text-[7px] font-black text-[#FF8A75] uppercase tracking-widest">{tier.badge}</span>
                                         )}
                                     </div>
                                     <div className="text-right flex-shrink-0">
                                         {tier.originalPrice && (
                                             <span className="text-[8px] text-[#FF8A75]/40 line-through font-bold block mb-0.5">₹{tier.originalPrice}</span>
                                         )}
                                         <span className={`text-lg font-bold ${selectedTierId === tier.id ? 'text-[#FF8A75]' : 'text-[#1a1a1a]'}`}>₹{tier.discountedPrice}</span>
                                     </div>
                                 </div>
                             </button>
                         ))}
                    </div>

                    <div className={`p-6 rounded-2xl border border-[#FF8A75]/20 bg-white space-y-4 flex-shrink-0`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[7px] font-black text-[#FF8A75] uppercase tracking-[0.2em] mb-0.5">Total Price</div>
                                <div className="text-2xl font-bold text-[#1a1a1a]">₹{currentTier.discountedPrice}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FF8A75]/5 text-[#FF8A75] border border-[#FF8A75]/10">
                                <Heart className="w-4 h-4 fill-current" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => handlePay(false)}
                                disabled={loading}
                                className="w-full py-3.5 bg-[#FF8A75] hover:bg-[#ff4081] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#FF8A75]/20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>Subscribe Now <MoveRight className="w-4 h-4" /></>
                                )}
                            </button>

                            {!hasUsedTrial && (
                                hasActiveSubscription ? (
                                    // Student has active paid plan — trial not available
                                    <div className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-100 text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                                        <ShieldCheck className="w-3 h-3" />
                                        Active plan — trial not available
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartTrial}
                                        disabled={loading || isStartingTrial}
                                        className="w-full py-3 bg-white border-2 border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30 text-[#1a1a1a] rounded-xl font-black text-[9px] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isStartingTrial ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <>Try it for free <Sparkles className="w-3 h-3 text-[#FF8A75] group-hover:scale-125 transition-transform" /></>
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Professional Layout */}
            <div className="lg:hidden flex flex-col h-screen overflow-hidden bg-white">
                <header className={`p-5 pt-12 flex-shrink-0 border-b bg-white`}>
                     <h1 className="text-2xl font-bold leading-none tracking-tight text-[#1a1a1a]">Choose Your Plan</h1>
                     <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                         {PLANS_DATA.map((plan) => (
                             <button
                                 key={plan.id}
                                 onClick={() => setSelectedPlanId(plan.id)}
                                 className={`
                                     px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border
                                     ${selectedPlanId === plan.id 
                                        ? 'bg-[#FF8A75] text-white border-transparent' 
                                        : 'bg-[#FFFAF7] text-[#6B7280] border-[#FF8A75]/10'}
                                 `}
                             >
                                 {plan.title.split(' ')[0]}
                             </button>
                         ))}
                     </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFAF7]/60">
                     <div className={`flex rounded-lg p-0.5 bg-white border border-[#FF8A75]/10`}>
                         <button 
                            onClick={() => setMobileTab('data')}
                            className={`flex-1 py-2.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mobileTab === 'data' ? 'bg-[#FF8A75]/5 text-[#FF8A75]' : 'text-[#6B7280]'}`}
                         >
                             Details
                         </button>
                         <button 
                            onClick={() => setMobileTab('pricing')}
                            className={`flex-1 py-2.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mobileTab === 'pricing' ? 'bg-[#FF8A75]/5 text-[#FF8A75]' : 'text-[#6B7280]'}`}
                         >
                             Plans
                         </button>
                     </div>

                     {mobileTab === 'data' ? (
                         <div className="space-y-3">
                             <div className={`p-6 rounded-2xl space-y-3 bg-white border border-[#FF8A75]/10`}>
                                 <h3 className="text-lg font-bold leading-none tracking-tight text-[#1a1a1a]">{currentPlan.title}</h3>
                                 <p className="text-[#FF8A75] text-[9px] font-black uppercase tracking-widest">{currentPlan.subtitle}</p>
                                 <p className="text-[12px] font-medium text-[#6B7280] leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className={`p-5 rounded-2xl space-y-4 bg-[#FF8A75] text-white border border-[#FF8A75]/20`}>
                                     <h4 className="text-[9px] font-black uppercase tracking-widest text-white/80">How It Works</h4>
                                     <div className="space-y-3">
                                         {currentMeta?.journey.map((step: any, i: number) => (
                                             <div key={i} className="flex flex-col gap-0.5">
                                                 <div className="text-[9px] font-bold leading-none">{step.title}</div>
                                                 <div className="text-[7px] text-white/70 font-medium">{step.desc}</div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                                 <div className={`p-5 rounded-2xl space-y-3 bg-white border border-[#FF8A75]/10`}>
                                     <h4 className="text-[9px] font-black text-[#FF8A75] uppercase tracking-widest">Focus</h4>
                                     <div className="space-y-2">
                                         {currentMeta?.workOn.slice(0, 4).map((f: string, i: number) => (
                                             <div key={i} className="flex items-center gap-2 text-[7px] font-black text-[#374151] uppercase">
                                                 <div className="w-1 h-1 rounded-full bg-[#FF8A75]" />
                                                 {f}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-2 pb-20">
                             {currentPlan.tiers.map((tier) => (
                                 <button
                                     key={tier.id}
                                     onClick={() => setSelectedTierId(tier.id)}
                                     className={`
                                         w-full p-5 rounded-2xl text-left transition-all border flex items-center justify-between
                                         ${selectedTierId === tier.id ? 'border-[#FF8A75] bg-white ring-1 ring-[#FF8A75]/5' : 'bg-white border-[#FF8A75]/10'}
                                     `}
                                 >
                                     <div className="flex-1">
                                         <h5 className="font-bold text-[11px] tracking-tight text-[#1a1a1a]">{tier.label}</h5>
                                         {tier.badge && <span className="text-[7px] font-black text-[#FF8A75] uppercase tracking-widest">{tier.badge}</span>}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && <span className="text-[9px] text-[#FF8A75]/40 line-through font-bold block mb-0.5">₹{tier.originalPrice}</span>}
                                         <span className="text-lg font-bold text-[#FF8A75]">₹{tier.discountedPrice}</span>
                                     </div>
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                {/* Mobile Fixed Bottom Cart */}
                <div className="mt-auto p-4 border-t bg-white/80 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <span className="text-[7px] font-black text-[#FF8A75] uppercase tracking-widest">Selected Tier</span>
                            <p className="text-[10px] font-bold text-[#1a1a1a]">{currentTier.label}</p>
                        </div>
                        <div className="text-right">
                             <span className="text-[7px] font-black text-[#6B7280] uppercase tracking-widest">Total</span>
                             <p className="text-lg font-bold text-[#FF8A75]">₹{currentTier.discountedPrice}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <button 
                            onClick={() => handlePay(false)}
                            className="w-full bg-[#FF8A75] text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A75]/10"
                        >
                            Subscribe Now <MoveRight className="w-3 h-3" />
                        </button>

                        {!hasUsedTrial && (
                            hasActiveSubscription ? (
                                // Student has active paid plan — trial not available
                                <div className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-100 text-[8px] font-bold text-amber-600 uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" />
                                    Active plan — trial not available
                                </div>
                            ) : (
                                <button
                                    onClick={handleStartTrial}
                                    disabled={loading || isStartingTrial}
                                    className="w-full py-2.5 bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isStartingTrial ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                        <>Try it for free <Sparkles className="w-3 h-3 text-[#FF8A75]" /></>
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Checkout Overlay Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all" onClick={() => setShowCheckout(false)} />
                    <div className="relative bg-[#FFFAF7] w-full max-w-lg rounded-[3rem] border border-[#FF8A75]/30 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Your Ritual</span>
                                <h2 className="text-3xl font-bold text-[#1a1a1a]">Checkout</h2>
                            </div>
                            <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-[#FF8A75]/10 rounded-full transition-colors text-[#6B7280]">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            {/* Selected Plan Summary */}
                            <div className="p-5 rounded-3xl bg-white border border-[#FF8A75]/10 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#6B7280] tracking-widest">{currentPlan.title}</p>
                                    <p className="text-sm font-bold text-[#1a1a1a]">{currentTier.label}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[#FF8A75]">₹{currentTier.discountedPrice}</p>
                                </div>
                            </div>

                            {/* Order Bumps Section */}
                            {currentBumps.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] px-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#FF8A75]" /> Exclusive Upgrades
                                    </h4>
                                    <div className="space-y-3">
                                        {currentBumps.map((bump: any) => (
                                            <button 
                                                key={bump.id}
                                                onClick={() => {
                                                    setSelectedBumps(prev => 
                                                        prev.includes(bump.id) ? prev.filter(id => id !== bump.id) : [...prev, bump.id]
                                                    );
                                                }}
                                                className={`
                                                    w-full p-5 rounded-3xl text-left border-2 transition-all relative group
                                                    ${selectedBumps.includes(bump.id) ? 'bg-[#FF8A75]/5 border-[#FF8A75]' : 'bg-white border-[#FF8A75]/10 hover:border-[#FF8A75]/30'}
                                                `}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedBumps.includes(bump.id) ? 'bg-[#FF8A75] text-white' : 'bg-[#FF8A75]/8 text-[#FF8A75]'}`}>
                                                        <bump.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] mb-1">{bump.title}</h5>
                                                            {selectedBumps.includes(bump.id) ? <CheckCircle2 className="w-4 h-4 text-[#FF8A75]" /> : <div className="w-4 h-4 border-2 border-[#FF8A75]/30 rounded-full" />}
                                                        </div>
                                                        <p className="text-[10px] text-[#6B7280] font-medium leading-relaxed mb-2 line-clamp-2">{bump.desc}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-[#FF8A75]">Add for ₹{bump.discountedPrice}</span>
                                                            <span className="text-[9px] text-[#FF8A75]/40 line-through">₹{bump.originalPrice}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Coupon Code */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] px-2">Apply Promo Code</h4>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                                            couponStatus?.type === 'error' ? 'text-rose-400' :
                                            couponStatus?.type === 'success' ? 'text-emerald-500' :
                                            'text-[#6B7280]'
                                        }`} />
                                        <input 
                                            type="text" 
                                            placeholder="ENTER CODE" 
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase());
                                                // Reset status when user types a new code
                                                if (couponStatus) {
                                                    setCouponStatus(null);
                                                    setAppliedCoupon(null);
                                                }
                                            }}
                                            className={`w-full bg-white border rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:ring-2 transition-all ${
                                                couponStatus?.type === 'error'
                                                    ? 'border-rose-300 focus:ring-rose-200'
                                                    : couponStatus?.type === 'success'
                                                    ? 'border-emerald-300 focus:ring-emerald-200'
                                                    : 'border-[#FF8A75]/10 focus:ring-[#FF8A75]/20'
                                            }`}
                                        />
                                    </div>
                                    <button 
                                        onClick={applyCoupon}
                                        disabled={verifyingCoupon || !couponCode}
                                        className="px-6 py-4 bg-[#1a1a1a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        {verifyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                    </button>
                                </div>

                                {/* Inline coupon status message */}
                                {couponStatus && (
                                    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-[10px] font-bold leading-relaxed transition-all ${
                                        couponStatus.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                    }`}>
                                        {couponStatus.type === 'success'
                                            ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            : <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        }
                                        <span>{couponStatus.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Total */}
                        <div className="p-8 pt-6 bg-white border-t border-[#FF8A75]/10 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Final Amount</p>
                                    <h3 className="text-4xl font-bold text-[#1a1a1a]">₹{calculateTotal()}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Secure Checkout</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[8px] font-medium text-[#6B7280]">256-bit Encryption</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleProceed}
                                disabled={loading}
                                className="w-full py-5 bg-[#FF8A75] hover:bg-[#ff705a] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#FF8A75]/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>Complete Payment <MoveRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

// Custom Zen Icons
function MousePointer2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 4l11.73 11.73" />
            <path d="M21 3.23l-18.77 18.77" />
            <path d="M21 3.23L4 4" />
            <path d="M21 3.23L20 20" />
        </svg>
    )
}

function Video(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}
