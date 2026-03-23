'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS_DATA } from '@/lib/constants/plans';
import { toast } from 'sonner';
import { 
    Check, Loader2, Sparkles, 
    ShieldCheck, MoveRight, Star, Heart, Zap, 
    Calendar, Image as ImageIcon, BookOpen, Clock, Activity, Users, CreditCard,
    Video, ArrowUpRight
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
  if (tierId.startsWith('12') || tierId.includes('12')) return 12;
  if (tierId.startsWith('6') || tierId.includes('6')) return 6;
  if (tierId.startsWith('3') || tierId.includes('3')) return 3;
  if (tierId === 'level_1' || tierId === 'level_1_2') return 360; 
  return 1;
}

interface Props {
  currentSubscription: any[] | null;
  userId: string;
  currentUser?: Profile | null;
}

export function PlansClient({ currentSubscription, userId, currentUser }: Props) {
    const router = useRouter();
    const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS_DATA[2].id); 
    const [selectedTierId, setSelectedTierId] = useState<string>(PLANS_DATA[2].tiers[0].id);
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
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: `test_order_${Date.now()}`,
                    razorpay_payment_id: `test_payment_${Date.now()}`,
                    razorpay_signature: 'test_bypass',
                    planType: selectedPlanId,
                    planVariant: selectedTierId,
                    amount: currentTier.discountedPrice,
                    durationMonths: durationFromTierId(selectedTierId),
                }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Activation failed');

            toast.success('🎉 Ritual confirmed! (Test Mode Success)');
            setTimeout(() => {
                router.push('/student/dashboard');
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            toast.error(err.message || 'Ritual confirmation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const planContent = {
        one_on_one: {
            hook: "Your face deserves a plan made only for you",
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
            hook: "The glow-up your skin has been waiting for",
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
            hook: "Your transformation. Your pace. Your time.",
            problem: "Busy schedules shouldn't prevent you from honoring your face and spirit.",
            solution: "Expert-designed modules that live in your Zen Dashboard. Forever.",
            workOn: ["Foundation Basics", "L-Systems Practice", "Advanced Sculpts", "Daily Integration"],
            journey: [
                { icon: Check, title: "Unfold", desc: "Linear modules" },
                { icon: Heart, title: "Glow", desc: "Result focus" }
            ],
            dashboard: ["Photo Progress Vault", "Module Unlock Path", "Quick Support box", "Glow Resources"]
        }
    };

    const currentMeta = planContent[selectedPlanId as keyof typeof planContent];

    return (
        <div className="min-h-screen relative font-sans text-foreground selection:bg-primary/20 bg-background overflow-hidden animate-in fade-in duration-1000">
            
            {/* Desktop Elite Layout - Minimal & Focused */}
            <div className="hidden lg:flex flex-col min-h-screen bg-background">
                {/* Fixed Header: Plan Selection */}
                <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-primary/10 transition-all duration-500">
                    <div className="max-w-7xl mx-auto px-12 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-[0.2em] uppercase border border-primary/10 shadow-sm">
                                <Zap className="w-3.5 h-3.5" />
                                Select Ritual
                             </div>
                             {currentSubscription && currentSubscription.length > 0 && (
                                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm border border-black/5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                    Active: {currentSubscription[0].plan_type.replace(/_/g, ' ')}
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-foreground/5 shadow-inner">
                            {PLANS_DATA.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`
                                        px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300
                                        ${selectedPlanId === plan.id 
                                            ? 'bg-primary text-white shadow-md transform scale-100' 
                                            : 'text-foreground/40 hover:text-foreground/80 scale-95 hover:scale-100'}
                                    `}
                                >
                                    {plan.title.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 py-10 pb-28 flex flex-col justify-center">
                    <div className="max-w-7xl mx-auto px-8 lg:px-12 space-y-12 w-full">
                        {/* Section 1: The Hook (Minimalist) */}
                        <section className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <h2 className="text-4xl lg:text-5xl font-serif font-black text-foreground leading-tight tracking-tight max-w-4xl mx-auto">{currentMeta?.hook}</h2>
                            <p className="text-sm lg:text-base font-medium leading-relaxed max-w-2xl mx-auto text-foreground/50 italic px-4">"{currentMeta?.solution}"</p>
                        </section>

                        {/* Section 2: Membership Cards in a SINGLE ROW */}
                        <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
                            <div className="flex flex-row justify-center gap-4 lg:gap-6">
                                 {currentPlan.tiers.map((tier) => (
                                     <button
                                         key={tier.id}
                                         onClick={() => setSelectedTierId(tier.id)}
                                         className={`
                                             relative flex-1 p-6 lg:p-8 rounded-[2rem] text-left transition-all duration-500 overflow-hidden group border-2 max-w-[280px]
                                             ${selectedTierId === tier.id 
                                                 ? 'bg-white border-primary shadow-[0_20px_50px_rgba(255,138,117,0.15)] scale-105 z-10' 
                                                 : 'bg-white/80 border-foreground/5 hover:border-primary/20 hover:bg-white hover:-translate-y-1 shadow-sm'}
                                         `}
                                     >
                                         <div className="relative z-10 flex flex-col h-full min-h-[16rem]">
                                             <div className="space-y-4 mb-auto">
                                                 <div className="flex items-center justify-between gap-2">
                                                     {/* Radio-style indicator */}
                                                     <div className={`w-5 h-5 rounded-full border-2 flex shrink-0 items-center justify-center transition-colors ${selectedTierId === tier.id ? 'border-primary bg-primary' : 'border-foreground/10 bg-white'}`}>
                                                         {selectedTierId === tier.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                     </div>
                                                     {tier.badge && (
                                                        <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${selectedTierId === tier.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary border border-primary/10'}`}>{tier.badge}</span>
                                                     )}
                                                 </div>
                                                 <h5 className={`font-bold tracking-tight leading-none mt-4 ${selectedTierId === tier.id ? 'text-2xl text-foreground' : 'text-xl text-foreground/80'}`}>{tier.label}</h5>
                                             </div>
                                             
                                             <div className="mt-6 pt-6 space-y-2 border-t border-primary/10">
                                                 <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedTierId === tier.id ? 'text-primary/80' : 'text-foreground/30'}`}>Investment</p>
                                                 <div className="flex items-end gap-2 flex-wrap">
                                                    <span className={`text-[2.5rem] leading-none font-serif tracking-tighter italic font-black transition-colors ${selectedTierId === tier.id ? 'text-primary' : 'text-primary/70'}`}>₹{tier.discountedPrice}</span>
                                                    {tier.originalPrice && (
                                                         <span className={`text-sm line-through font-bold pb-1.5 transition-colors ${selectedTierId === tier.id ? 'text-primary/40' : 'text-foreground/30'}`}>₹{tier.originalPrice}</span>
                                                    )}
                                                 </div>
                                             </div>
                                         </div>
                                     </button>
                                 ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Section 3: Floating Glass Action Bar (Centered) */}
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 p-3 pl-8 bg-white/60 backdrop-blur-3xl border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-full animate-in slide-in-from-bottom-12 fade-in duration-700 delay-700 fill-mode-both">
                    <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-[0.1em]">{currentPlan.tiers.find(t => t.id === selectedTierId)?.label || 'Select Tier'}</h4>
                        <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-[0.2em] mt-0.5">₹{currentPlan.tiers.find(t => t.id === selectedTierId)?.discountedPrice} <span className="text-foreground/20 mx-1">•</span> Secure Checkout</p>
                    </div>
                    <button
                        onClick={() => handlePay(false)}
                        disabled={loading}
                        className="px-10 py-4 bg-primary text-white hover:bg-primary/90 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_10px_30px_rgba(255,138,117,0.3)] flex items-center gap-3 disabled:opacity-50 group hover:scale-105"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                Enroll Now <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Elite Layout */}
            <div className="lg:hidden flex flex-col h-[100dvh] overflow-hidden bg-background">
                <header className="p-8 pb-8 pt-16 flex-shrink-0">
                     <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Selection</h1>
                     <div className="flex gap-3 mt-8 overflow-x-auto pb-4 custom-scrollbar">
                         {PLANS_DATA.map((plan) => (
                             <button
                                 key={plan.id}
                                 onClick={() => setSelectedPlanId(plan.id)}
                                 className={`
                                     px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border
                                     ${selectedPlanId === plan.id 
                                        ? 'bg-primary text-white border-transparent shadow-md' 
                                        : 'bg-white text-foreground/40 border-primary/10'}
                                 `}
                             >
                                 {plan.title.split(' ')[0]}
                             </button>
                         ))}
                     </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-28">
                     <div className="flex p-1 bg-primary/5 rounded-2xl border border-primary/10">
                         <button 
                            onClick={() => setMobileTab('data')}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mobileTab === 'data' ? 'bg-white text-primary shadow-sm' : 'text-primary/40'}`}
                         >
                             Deep Dive
                         </button>
                         <button 
                            onClick={() => setMobileTab('pricing')}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mobileTab === 'pricing' ? 'bg-white text-primary shadow-sm' : 'text-primary/40'}`}
                         >
                             Pricing
                         </button>
                     </div>

                     {mobileTab === 'data' ? (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <div className="rounded-3xl p-10 space-y-4 border border-primary/10 shadow-sm bg-white/60 backdrop-blur-xl">
                                 <h3 className="text-3xl font-serif font-bold text-foreground leading-none tracking-tight">{currentPlan.title}</h3>
                                 <p className="text-primary text-[10px] font-bold uppercase tracking-widest opacity-80 italic">{currentPlan.subtitle}</p>
                                 <p className="text-sm font-medium text-foreground/50 italic leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                             
                             <div className="space-y-3">
                                 {currentMeta?.journey.map((step: any, i: number) => (
                                     <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-white border border-primary/5 shadow-sm">
                                         <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
                                             <step.icon className="w-4 w-4" />
                                         </div>
                                         <div className="min-w-0">
                                             <div className="text-xs font-bold uppercase tracking-widest text-foreground">{step.title}</div>
                                             <div className="text-[10px] text-foreground/40 font-bold italic truncate">{step.desc}</div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             {currentPlan.tiers.map((tier) => (
                                 <button
                                     key={tier.id}
                                     onClick={() => setSelectedTierId(tier.id)}
                                     className={`
                                         w-full p-8 rounded-[2.5rem] text-left transition-all border flex items-center justify-between
                                         ${selectedTierId === tier.id ? 'border-primary bg-white shadow-lg ring-4 ring-primary/5' : 'bg-white border-primary/5'}
                                     `}
                                 >
                                     <div className="flex-1">
                                         <h5 className="font-bold text-sm tracking-tight text-foreground">{tier.label}</h5>
                                         {tier.badge && <span className="inline-block px-3 py-0.5 bg-primary text-white text-[8px] font-bold uppercase italic tracking-widest rounded-full mt-1 border border-primary/10 shadow-sm">{tier.badge}</span>}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && <span className="text-[10px] text-primary/40 line-through font-bold block mb-0.5">₹{tier.originalPrice}</span>}
                                         <span className="text-2xl font-serif font-bold text-primary italic">₹{tier.discountedPrice}</span>
                                     </div>
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                {/* Mobile Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-2xl border-t border-primary/10 z-50">
                    <button
                        onClick={() => handlePay(false)}
                        disabled={loading}
                        className="w-full h-18 bg-foreground text-background rounded-2xl flex items-center justify-between px-8 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        <div className="text-left">
                            <span className="text-[9px] font-bold text-background/40 uppercase block leading-none mb-1 tracking-widest">Confirm Ritual</span>
                            <span className="text-2xl font-serif italic font-bold text-white tracking-tighter">₹{currentTier.discountedPrice}</span>
                        </div>
                        <div className="bg-primary/20 p-2.5 rounded-full text-white border border-white/10 shadow-sm">
                            <MoveRight className="w-5 h-5 text-primary" />
                        </div>
                    </button>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 138, 117, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
