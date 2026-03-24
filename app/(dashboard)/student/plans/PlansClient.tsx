'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS_DATA } from '@/lib/constants/plans';
import { toast } from 'sonner';
import { 
    Check, Loader2, Sparkles, 
    ShieldCheck, MoveRight, Star, Heart, Zap, 
    Calendar, Image as ImageIcon, BookOpen, Clock, Activity, Users, CreditCard
} from 'lucide-react';
import type { Profile } from '@/types/database';

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
}

export default function PlansClient({ currentSubscription, userId, currentUser }: Props) {
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

    const handlePay = async (isTrial: boolean = false) => {
        if (isTrial) {
            toast.info('Zen Experience Trial is coming soon! Please confirm your ritual with a full plan for now.');
            return;
        }

        setLoading(true);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load payment gateway. Please check your connection.');

            const orderRes = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: selectedPlanId,
                    planVariant: selectedTierId,
                    amount: currentTier.discountedPrice,
                }),
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

            const { orderId, amount, currency, keyId } = orderData;

            await new Promise<void>((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: keyId,
                    amount,
                    currency,
                    order_id: orderId,
                    name: 'FaceYoguez',
                    description: `${currentPlan.title} — ${currentTier.label}`,
                    prefill: {
                        name: currentUser?.full_name ?? '',
                        email: currentUser?.email ?? '',
                        contact: currentUser?.phone ?? '',
                    },
                    theme: { color: '#FF8A75' },
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await fetch('/api/razorpay/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    planType: selectedPlanId,
                                    planVariant: selectedTierId,
                                    amount: currentTier.discountedPrice,
                                    durationMonths: durationFromTierId(selectedTierId),
                                }),
                            });

                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

                            toast.success('🎉 Ritual confirmed! Your transformation begins.');
                            resolve();
                            router.push('/student/dashboard');
                        } catch (e: any) {
                            reject(e);
                        }
                    },
                    modal: { ondismiss: () => reject(new Error('dismissed')) },
                });

                rzp.on('payment.failed', (resp: any) => {
                    reject(new Error(resp.error?.description || 'Payment failed'));
                });

                rzp.open();
            });

        } catch (err: any) {
            if (err.message !== 'dismissed') {
                toast.error(err.message || 'Ritual confirmation failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const planContent = {
        one_on_one: {
            hook: "Because Your Face Deserves a Plan Made Only for You",
            problem: "Group programs often ignore your unique facial architecture and bone density.",
            solution: "A bespoke ritual that adjusts to fit you—your structure, your lifestyle, your goals.",
            workOn: ["Sagging & Firmness", "Jawline Definition", "Double Chin", "Deep Wrinkles", "Asymmetry", "Eye Area"],
            journey: [
                { icon: Star, title: "Enrol", desc: "Instant Ritual Access" },
                { icon: ImageIcon, title: "Photo", desc: "Expert assessment" },
                { icon: Video, title: "1-1 Call", desc: "Private consultation" },
                { icon: BookOpen, title: "Ritual Path", desc: "Custom videos ready" }
            ],
            dashboard: ["Journey Progress Hub", "Direct Instructor Chat", "1-Click Ritual Link", "Daily Reflections"]
        },
        group_session: {
            hook: "The Glow-Up Your Skin Has Been Waiting For",
            problem: "Surface treatments aren't enough for structural renewal and lasting lift.",
            solution: "21 Days to a version of yourself that radiates health and confidence.",
            workOn: ["Facial Sculpting", "Natural Facelift", "Neck Toning", "Complexion Radiance"],
            journey: [
                { icon: Calendar, title: "New Batch", desc: "Starting very soon" },
                { icon: Clock, title: "7:30 PM", desc: "Daily live rituals" },
                { icon: Users, title: "Sacred Tribe", desc: "Stay accountable" },
                { icon: Zap, title: "Recordings", desc: "12-day or Lifetime" }
            ],
            dashboard: ["Live Portal Access", "Sacred Recording Vault", "Tribe Progress", "Zen Support"]
        },
        lms: {
            hook: "Your Transformation. Your Pace. Your Time.",
            problem: "Busy schedules shouldn't prevent you from honoring your face and spirit.",
            solution: "Expert-designed modules that live in your Zen Dashboard. Forever.",
            workOn: ["Foundation Basics", "L-Systems Practice", "Advanced Sculpts", "Daily Integration"],
            journey: [
                { icon: Star, title: "Instant", desc: "Lifetime access" },
                { icon: Activity, title: "Growth", desc: "Visual tracking" },
                { icon: Check, title: "Unfold", desc: "Linear modules" },
                { icon: Heart, title: "Glow", desc: "Result focus" }
            ],
            dashboard: ["Photo Progress Vault", "Module Unlock Path", "Quick Support box", "Glow Resources"]
        }
    };

    const currentMeta = planContent[selectedPlanId as keyof typeof planContent];
    const cardBg = "bg-white border border-[#FF8A75]/10";
    const cardBgActive = "bg-white border-2 border-[#FF8A75]";

    return (
        <div className="min-h-screen relative font-sans text-[#374151] selection:bg-[#FF8A75]/20 overflow-hidden bg-[#FFFAF7]/40">
            {/* Desktop Professional Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-8 p-12 h-screen max-w-[1600px] mx-auto overflow-hidden">
                {/* Panel 1: Ritual Selector */}
                <div className="col-span-3 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex-shrink-0">
                         <h1 className="text-4xl font-semibold italic font-serif leading-none tracking-tight text-[#1a1a1a]">Ritual Selection</h1>
                         <p className="mt-3 text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Modern Wisdom · Ancient Flow</p>
                    </div>

                    {/* Active sub banner */}
                    {currentSubscription && currentSubscription.length > 0 && (
                        <div className="p-5 rounded-3xl bg-[#FF8A75]/5 border border-[#FF8A75]/10">
                            <div className="flex gap-3">
                                <CreditCard className="w-5 h-5 text-[#FF8A75] mt-0.5" />
                                <div>
                                    <h4 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-widest">Active Path</h4>
                                    <p className="text-[11px] font-bold text-[#1a1a1a] mt-1 leading-tight">
                                        You are currently on the {currentSubscription[0].plan_type.replace(/_/g, ' ')} ritual.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide py-2">
                        {PLANS_DATA.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`
                                    w-full p-6 py-7 rounded-3xl text-left transition-all relative group border
                                    ${selectedPlanId === plan.id 
                                        ? 'bg-white border-[#FF8A75] ring-1 ring-[#FF8A75]/20' 
                                        : 'bg-white/50 border-[#FF8A75]/10 hover:border-[#FF8A75]/30'}
                                `}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedPlanId === plan.id ? 'bg-[#FF8A75] text-white' : 'bg-[#FF8A75]/8 text-[#FF8A75]'}`}>
                                        {plan.id === 'one_on_one' ? <Star className="w-5 h-5" /> : plan.id === 'lms' ? <BookOpen className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#1a1a1a]">{plan.title.split(' ')[0]}</h2>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FF8A75] mt-1">{plan.id.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                {selectedPlanId === plan.id && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#FF8A75] rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={`p-6 rounded-3xl flex items-center gap-4 ${cardBg}`}>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                             <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-bold leading-tight">Secure Ritual Enrollment</div>
                    </div>
                </div>

                {/* Panel 2: Deep Dive */}
                <div className="col-span-6 grid grid-cols-2 gap-6 h-full overflow-hidden pb-10">
                    <div className={`col-span-2 p-10 rounded-[3rem] flex flex-col gap-8 relative overflow-hidden ${cardBg}`}>
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.4em]">The Sacred Routine</span>
                            <h2 className="text-4xl font-serif italic text-[#1a1a1a] leading-tight">{currentMeta?.hook}</h2>
                            <p className="text-sm font-medium leading-relaxed max-w-lg opacity-80">{currentMeta?.problem}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                             <div className="space-y-6">
                                 <h4 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em]">Ritual Focus</h4>
                                 <div className="space-y-3">
                                     {currentMeta?.workOn.map((f, i) => (
                                         <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-[#374151] uppercase tracking-wider">
                                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75]" />
                                              {f}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                             <div className="space-y-6">
                                 <h4 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em]">Transformation</h4>
                                 <p className="text-xs font-medium italic leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-4">
                             {currentMeta?.journey.map((step: any, i: number) => (
                                 <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-[#FFFAF7]/40 border border-[#FF8A75]/10">
                                     <div className="p-2.5 rounded-xl bg-[#FF8A75] text-white">
                                         <step.icon className="w-3.5 h-3.5" />
                                     </div>
                                     <div>
                                         <div className="text-[11px] font-bold leading-none mb-1">{step.title}</div>
                                         <div className="text-[8px] text-[#1a1a1a]/70 font-medium italic">{step.desc}</div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className={`col-span-2 p-7 rounded-3xl flex flex-col gap-5 ${cardBg} bg-[#FFFAF7]/60`}>
                         <h4 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em]">Dashboard Rituals</h4>
                         <div className="flex items-center justify-between gap-4">
                             {currentMeta?.dashboard.map((d: string, i: number) => (
                                 <div key={i} className="flex flex-col items-center gap-3 text-center p-4 rounded-3xl bg-white border border-[#FF8A75]/10 flex-1">
                                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75]" />
                                     <span className="text-[8px] font-black leading-tight uppercase text-[#6B7280] tracking-widest">{d}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Panel 3: Membership & Checkout */}
                <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide py-2">
                         <h3 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em] px-4 mb-2">Memberships</h3>
                         {currentPlan.tiers.map((tier) => (
                             <button
                                 key={tier.id}
                                 onClick={() => setSelectedTierId(tier.id)}
                                 className={`
                                     w-full p-6 rounded-[2rem] text-left transition-all border-2 relative
                                     ${selectedTierId === tier.id 
                                         ? 'border-[#FF8A75] bg-white ring-4 ring-[#FF8A75]/5' 
                                         : 'bg-white border-[#FF8A75]/10 hover:border-[#FF8A75]/30'}
                                 `}
                             >
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <h5 className="font-bold text-sm tracking-tight text-[#1a1a1a]">{tier.label}</h5>
                                         {tier.badge && (
                                            <span className="text-[8px] font-black text-[#FF8A75] uppercase italic tracking-widest">{tier.badge}</span>
                                         )}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && (
                                             <span className="text-[9px] text-[#FF8A75]/40 line-through font-bold block mb-1">₹{tier.originalPrice}</span>
                                         )}
                                         <span className={`text-xl font-serif italic font-bold ${selectedTierId === tier.id ? 'text-[#FF8A75]' : 'text-[#1a1a1a]'}`}>₹{tier.discountedPrice}</span>
                                     </div>
                                 </div>
                                 {selectedTierId === tier.id && (
                                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FF8A75] rounded-full flex items-center justify-center text-white">
                                         <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                     </div>
                                 )}
                             </button>
                         ))}
                    </div>

                    <div className={`p-8 rounded-[2.5rem] border border-[#FF8A75]/20 bg-white space-y-6`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[8px] font-black text-[#FF8A75] uppercase tracking-[0.3em] mb-1">Ritual Value</div>
                                <div className="text-4xl font-serif italic font-bold text-[#1a1a1a]">₹{currentTier.discountedPrice}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#FF8A75]/5 text-[#FF8A75] border border-[#FF8A75]/10">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                        </div>
                        <button
                            onClick={() => handlePay(false)}
                            disabled={loading}
                            className="w-full py-5 bg-[#FF8A75] hover:bg-[#ff4081] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Confirm Ritual <MoveRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <p className="text-[9px] text-[#6B7280] text-center font-bold px-6 italic leading-relaxed">
                            Natural transformation, lasting peace. No needles. Just the glow of wisdom.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Professional Layout */}
            <div className="lg:hidden flex flex-col h-screen overflow-hidden bg-white">
                <header className={`p-6 pt-14 flex-shrink-0 border-b bg-white`}>
                     <h1 className="text-3xl font-semibold italic font-serif leading-none tracking-tight text-[#1a1a1a]">Ritual Selection</h1>
                     <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide">
                         {PLANS_DATA.map((plan) => (
                             <button
                                 key={plan.id}
                                 onClick={() => setSelectedPlanId(plan.id)}
                                 className={`
                                     px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border
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

                <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#FFFAF7]/60">
                     <div className={`flex rounded-xl p-1 bg-white border border-[#FF8A75]/10`}>
                         <button 
                            onClick={() => setMobileTab('data')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'data' ? 'bg-[#FF8A75]/5 text-[#FF8A75]' : 'text-[#6B7280]'}`}
                         >
                             Deep Dive
                         </button>
                         <button 
                            onClick={() => setMobileTab('pricing')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'pricing' ? 'bg-[#FF8A75]/5 text-[#FF8A75]' : 'text-[#6B7280]'}`}
                         >
                             Membership
                         </button>
                     </div>

                     {mobileTab === 'data' ? (
                         <div className="space-y-4">
                             <div className={`p-7 rounded-[2rem] space-y-4 bg-white border border-[#FF8A75]/10`}>
                                 <h3 className="text-xl font-bold italic leading-none tracking-tight text-[#1a1a1a]">{currentPlan.title}</h3>
                                 <p className="text-[#FF8A75] text-[10px] font-black uppercase tracking-widest">{currentPlan.subtitle}</p>
                                 <p className="text-[13px] font-medium text-[#6B7280] italic leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className={`p-6 rounded-[2rem] space-y-5 bg-[#FF8A75] text-white border border-[#FF8A75]/20`}>
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Journey</h4>
                                     <div className="space-y-4">
                                         {currentMeta?.journey.map((step: any, i: number) => (
                                             <div key={i} className="flex flex-col gap-1">
                                                 <div className="text-[10px] font-bold leading-none">{step.title}</div>
                                                 <div className="text-[8px] text-white/70 font-medium italic">{step.desc}</div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                                 <div className={`p-6 rounded-[2rem] space-y-5 bg-white border border-[#FF8A75]/10`}>
                                     <h4 className="text-[10px] font-black text-[#FF8A75] uppercase tracking-widest">Focus</h4>
                                     <div className="space-y-3">
                                         {currentMeta?.workOn.slice(0, 4).map((f: string, i: number) => (
                                             <div key={i} className="flex items-center gap-2 text-[8px] font-black text-[#374151] uppercase">
                                                 <div className="w-1 h-1 rounded-full bg-[#FF8A75]" />
                                                 {f}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-3 pb-10">
                             {currentPlan.tiers.map((tier) => (
                                 <button
                                     key={tier.id}
                                     onClick={() => setSelectedTierId(tier.id)}
                                     className={`
                                         w-full p-6 rounded-[2rem] text-left transition-all border flex items-center justify-between
                                         ${selectedTierId === tier.id ? 'border-[#FF8A75] bg-white ring-2 ring-[#FF8A75]/5' : 'bg-white border-[#FF8A75]/10'}
                                     `}
                                 >
                                     <div className="flex-1">
                                         <h5 className="font-bold text-xs tracking-tight text-[#1a1a1a]">{tier.label}</h5>
                                         {tier.badge && <span className="text-[8px] font-black text-[#FF8A75] uppercase italic tracking-widest">{tier.badge}</span>}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && <span className="text-[10px] text-[#FF8A75]/40 line-through font-bold block mb-0.5">₹{tier.originalPrice}</span>}
                                         <span className="text-xl font-serif italic font-bold text-[#FF8A75]">₹{tier.discountedPrice}</span>
                                     </div>
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                <div className={`p-6 pb-10 flex-shrink-0 bg-white border-t flex flex-col gap-4`}>
                    <button
                        onClick={() => handlePay(false)}
                        disabled={loading}
                        className="w-full py-5 bg-[#FF8A75] text-white rounded-2xl flex items-center justify-between px-8 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <div className="text-left">
                            <span className="text-[9px] font-black text-white/70 uppercase block leading-none mb-1 tracking-widest">Confirm Ritual</span>
                            <span className="text-2xl font-serif italic font-bold">₹{currentTier.discountedPrice}</span>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-full">
                            <MoveRight className="w-6 h-6" />
                        </div>
                    </button>
                    <button 
                        onClick={() => handlePay(true)}
                        className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em] text-center italic"
                    >
                        Experience Zen (2-Day Free) →
                    </button>
                </div>
            </div>
            
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
