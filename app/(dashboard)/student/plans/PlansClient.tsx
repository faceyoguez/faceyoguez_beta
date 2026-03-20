'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSubscription } from '@/lib/actions/subscription';
import { PLANS_DATA } from '@/lib/constants/plans';
import { PlansClientProps } from '@/lib/types/plans';
import { toast } from 'sonner';
import { 
    Check, Loader2, Sparkles, 
    ShieldCheck, Plus, ShoppingCart, Trash2, MoveRight, ChevronRight, Star, Heart, Zap, 
    MessageSquare, Calendar, Image as ImageIcon, BookOpen, Clock, Activity, Users, User
} from 'lucide-react';

export default function PlansClient({ user, activeSubscriptions }: PlansClientProps) {
    const router = useRouter();
    const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS_DATA[0].id);
    const [selectedTierId, setSelectedTierId] = useState<string>(PLANS_DATA[0].tiers[0].id);
    const [loading, setLoading] = useState(false);
    const [mobileTab, setMobileTab] = useState<'data' | 'pricing'>('data');

    const currentPlan = PLANS_DATA.find(p => p.id === selectedPlanId)!;
    const currentTier = currentPlan.tiers.find(t => t.id === selectedTierId) || currentPlan.tiers[0];

    useEffect(() => {
        setSelectedTierId(currentPlan.tiers[0].id);
    }, [selectedPlanId]);

    const handleSubscribe = async (isTrial: boolean = false) => {
        setLoading(true);
        try {
            await createSubscription(selectedPlanId, isTrial, {
                variant: selectedTierId,
                metadata: { source: 'zen_pink_glass_v1', is_trial: isTrial }
            });
            toast.success(isTrial ? 'Trial initiated! Enjoy your 2-day ritual.' : 'Ritual confirmed!');
            router.push('/student/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    // Compact Content Data based on User Request
    const planContent = {
        one_on_one: {
            hook: "Because Your Face Deserves a Plan Made Only for You",
            problem: "Group programs and generic routines don't work for your unique facial architecture.",
            solution: "A plan that adjusts to fit you—your structure, your goals, your bone density.",
            workOn: ["Sagging & Firmness", "Puffiness", "Double Chin", "Wrinkles", "Asymmetry", "Eye Bags"],
            journey: [
                { icon: Star, title: "Enrol", desc: "Instant Dashboard access" },
                { icon: ImageIcon, title: "Photo", desc: "Visual evaluation" },
                { icon: Video, title: "1-1 Call", desc: "Personal consultation" },
                { icon: BookOpen, title: "Custom Plan", desc: "Video demos uploaded" }
            ],
            dashboard: ["Journey Path Tracker", "Personal Chat Line", "1-Click Meeting Link", "Daily Reflection"]
        },
        group_session: {
            hook: "The Glow-Up Your Skin Has Been Waiting For",
            problem: "Moisturizers and SPF aren't enough for structural transformation.",
            solution: "21 Days to a version of yourself that turns heads. Community-powered glow.",
            workOn: ["Sculpting & Toning", "Asymmetry Balance", "Natural Facelift", "Complexion Radiance"],
            journey: [
                { icon: Calendar, title: "April 6th", desc: "Programme starts" },
                { icon: Clock, title: "7:30 PM", desc: "Daily live sessions" },
                { icon: Users, title: "Community", desc: "Stay accountable" },
                { icon: Zap, title: "Recordings", desc: "12-day or Lifetime" }
            ],
            dashboard: ["Live Session Links", "Recording Gallery", "Group Accountability", "Support Chat"]
        },
        lms: {
            hook: "Your Transformation. Your Pace. Your Time.",
            problem: "Schedules are unpredictable—your skincare shouldn't be tied to a timetable.",
            solution: "Complete expert-designed programme that lives in your dashboard. Forever.",
            workOn: ["Foundation Basics", "Posture Awareness", "Advanced Sculpting", "Skincare Integration"],
            journey: [
                { icon: MousePointer2, title: "Enrol", desc: "Instant access" },
                { icon: Activity, title: "Track", desc: "Photo progress" },
                { icon: ShieldCheck, title: "Unlock", desc: "Progressive sessions" },
                { icon: Heart, title: "Lifetime", desc: "Never expires" }
            ],
            dashboard: ["Progress Photo Tracker", "Session Unlock System", "Support Chat Box", "Lifetime Resources"]
        }
    };

    const currentMeta = planContent[selectedPlanId as keyof typeof planContent];

    // Soft Pink Zen Themes
    const pinkAccent = "#ff80ab"; // Apple Soft Pink
    const softText = "#6d4c41"; // Muted Rose-Taupe/Brown
    const glassBg = "bg-white/40 backdrop-blur-3xl border-white/60";
    const glassBgStrong = "bg-white/60 backdrop-blur-3xl border-white/80";

    return (
        <div className="min-h-screen relative font-sans text-[#6d4c41] selection:bg-[#ff80ab]/20 overflow-hidden">
            {/* Zen Background Gradient */}
            <div className="fixed inset-0 bg-[#fff5f8] -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,#ffebee_0%,transparent_50%),radial-gradient(circle_at_bottom_left,#f8bbd0_0%,transparent_50%)] -z-10 opacity-70" />
            
            {/* Desktop Zen Glass Layout */}
            <div className="hidden lg:grid grid-cols-[1fr_1.2fr_1fr] h-screen p-6 gap-6 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-1000">
                
                {/* Panel 1: Branding & Ritual Selection */}
                <div className="flex flex-col gap-6 h-full overflow-hidden">
                    <div className={`p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(255,128,171,0.1)] ${glassBgStrong}`}>
                        <div className="flex items-center gap-2 text-[#ff80ab] font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
                            <Star className="w-3 h-3 fill-current" />
                            Zen Face Rituals
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight leading-[0.9] font-serif italic mb-4 text-[#4e342e]">
                            Glow in <br />
                            <span className="text-[#ff80ab]">Peace.</span>
                        </h1>
                        <p className="text-xs text-[#8d6e63] font-medium italic leading-relaxed">
                            {currentMeta?.hook}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide py-2">
                        {PLANS_DATA.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`
                                    w-full p-6 rounded-[2.2rem] text-left transition-all relative border-2
                                    ${selectedPlanId === plan.id 
                                        ? `bg-[#ff80ab] text-white border-transparent shadow-[0_20px_40px_rgba(255,128,171,0.3)] scale-[1.02]` 
                                        : `${glassBg} text-[#8d6e63] border-white/40 hover:border-[#ff80ab]/30 hover:bg-white/60`}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${selectedPlanId === plan.id ? 'bg-white/20' : 'bg-[#ff80ab]/10'}`}>
                                            <plan.icon className={`w-5 h-5 ${selectedPlanId === plan.id ? 'text-white' : 'text-[#ff80ab]'}`} />
                                        </div>
                                        <h4 className="font-bold text-xs uppercase tracking-widest">{plan.title}</h4>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-all ${selectedPlanId === plan.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className={`p-6 rounded-[2.2rem] flex-shrink-0 border-pink-100/50 ${glassBgStrong}`}>
                        <div className="flex items-center gap-3 text-[#ff80ab]">
                            <Zap className="w-5 h-5 fill-current" />
                            <div className="text-[10px] font-black uppercase tracking-[0.2em]">Free Trial Ritual</div>
                        </div>
                        <button 
                            onClick={() => handleSubscribe(true)}
                            className="w-full mt-4 py-3 bg-white text-[#ff80ab] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-[0_10px_20px_rgba(255,128,171,0.2)] transition-all active:scale-95 border border-pink-50"
                        >
                            Start 2 Days of Calm
                        </button>
                    </div>
                </div>

                {/* Panel 2: The Zen Data Dashboard */}
                <div className="grid grid-cols-2 grid-rows-[auto_1fr_1fr] gap-4 h-full overflow-hidden">
                    <div className={`col-span-2 p-6 rounded-[2.2rem] flex items-center justify-between shadow-sm ${glassBg}`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[#ff80ab]/10 text-[#ff80ab]">
                                <currentPlan.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold italic tracking-tight text-[#4e342e]">{currentPlan.title}</h3>
                                <p className="text-[10px] font-black text-[#ff80ab] uppercase tracking-widest">{currentPlan.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-white/60">
                            <ShieldCheck className="w-4 h-4 text-[#ff80ab]" />
                            <span className="text-[9px] font-black text-[#8d6e63] uppercase tracking-widest">Peace of Mind</span>
                        </div>
                    </div>

                    <div className={`p-7 rounded-[2.5rem] space-y-4 shadow-sm overflow-hidden flex flex-col ${glassBg}`}>
                        <h4 className="text-[10px] font-black text-[#ff80ab] uppercase tracking-[0.3em]">Zen Focus</h4>
                        <p className="text-xs font-medium text-[#8d6e63] italic leading-relaxed">
                            {currentMeta?.solution}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            {currentMeta?.workOn.slice(0, 4).map((f, i) => (
                                <div key={i} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/40 text-[9px] font-black text-[#6d4c41] uppercase border border-white/60">
                                    <div className="w-1 h-1 rounded-full bg-[#ff80ab]" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pink/Zen Journey Card */}
                    <div className={`p-7 rounded-[2.5rem] text-white space-y-4 shadow-[0_20px_40px_rgba(255,128,171,0.2)] overflow-hidden flex flex-col bg-gradient-to-br from-[#ff80ab] to-[#f06292]`}>
                        <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">The Journey</h4>
                        <div className="space-y-4 mt-2">
                             {currentMeta?.journey.map((step, i) => (
                                 <div key={i} className="flex items-center gap-3">
                                     <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-md">
                                         <step.icon className="w-3.5 h-3.5" />
                                     </div>
                                     <div>
                                         <div className="text-[11px] font-bold leading-none mb-1">{step.title}</div>
                                         <div className="text-[8px] text-white/70 font-medium italic">{step.desc}</div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className={`col-span-2 p-7 rounded-[2.5rem] shadow-sm flex flex-col gap-5 ${glassBgStrong}`}>
                         <h4 className="text-[10px] font-black text-[#ff80ab] uppercase tracking-[0.3em]">Dashboard Rituals</h4>
                         <div className="flex items-center justify-between gap-4">
                             {currentMeta?.dashboard.map((d, i) => (
                                 <div key={i} className="flex flex-col items-center gap-3 text-center p-4 rounded-[2rem] bg-pink-50/30 flex-1 border border-pink-100/40">
                                     <div className="w-2 h-2 rounded-full bg-[#ff80ab] shadow-[0_0_10px_#ff80ab]" />
                                     <span className="text-[8px] font-black leading-tight uppercase text-[#8d6e63] tracking-widest">{d}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Panel 3: Membership & Zen Checkout */}
                <div className="flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide py-2">
                         <h3 className="text-[10px] font-black text-[#ff80ab] uppercase tracking-[0.3em] px-4 mb-2">Memberships</h3>
                         {currentPlan.tiers.map((tier) => (
                             <button
                                 key={tier.id}
                                 onClick={() => setSelectedTierId(tier.id)}
                                 className={`
                                     w-full p-6 rounded-[2.2rem] text-left transition-all border-2 relative
                                     ${selectedTierId === tier.id 
                                         ? 'border-[#ff80ab] bg-white ring-[12px] ring-[#ff80ab]/5 shadow-xl scale-[0.98]' 
                                         : 'bg-white/30 border-white/40 hover:border-[#ff80ab]/20'}
                                 `}
                             >
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <h5 className="font-bold text-sm tracking-tight text-[#4e342e]">{tier.label}</h5>
                                         {tier.badge && (
                                            <span className="text-[8px] font-black text-[#ff80ab] uppercase italic tracking-widest">{tier.badge}</span>
                                         )}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && (
                                             <span className="text-[9px] text-pink-200 line-through font-bold block mb-1">₹{tier.originalPrice}</span>
                                         )}
                                         <span className={`text-xl font-serif italic font-bold ${selectedTierId === tier.id ? 'text-[#ff80ab]' : 'text-[#4e342e]'}`}>₹{tier.discountedPrice}</span>
                                     </div>
                                 </div>
                                 {selectedTierId === tier.id && (
                                     <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#ff80ab] rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in-0 duration-300">
                                         <Check className="w-4 h-4" />
                                     </div>
                                 )}
                             </button>
                         ))}
                    </div>

                    <div className={`p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(255,128,171,0.2)] space-y-6 ${glassBgStrong}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[8px] font-black text-[#ff80ab] uppercase tracking-[0.3em] mb-1">Ritual Value</div>
                                <div className="text-4xl font-serif italic font-bold text-[#4e342e]">₹{currentTier.discountedPrice}</div>
                            </div>
                            <div className="p-4 rounded-3xl bg-[#ff80ab]/10 text-[#ff80ab]">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSubscribe(false)}
                            disabled={loading}
                            className="w-full py-5 bg-[#ff80ab] hover:bg-[#ff4081] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all transform hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-[#ff80ab]/30 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Confirm Ritual <MoveRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <p className="text-[9px] text-[#8d6e63] text-center font-bold px-6 italic leading-relaxed">
                            Natural transformation, lasting peace. No needles. Just the glow of wisdom.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Zen Glass Layout */}
            <div className="lg:hidden flex flex-col h-screen overflow-hidden">
                <header className={`p-6 pt-14 flex-shrink-0 ${glassBgStrong} border-b`}>
                     <h1 className="text-3xl font-semibold italic font-serif leading-none tracking-tight text-[#4e342e]">Ritual Selection</h1>
                     <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide">
                         {PLANS_DATA.map((plan) => (
                             <button
                                 key={plan.id}
                                 onClick={() => setSelectedPlanId(plan.id)}
                                 className={`
                                     px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border
                                     ${selectedPlanId === plan.id 
                                        ? 'bg-[#ff80ab] text-white border-transparent shadow-lg' 
                                        : 'bg-white/50 text-[#8d6e63] border-white/40'}
                                 `}
                             >
                                 {plan.title.split(' ')[0]}
                             </button>
                         ))}
                     </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                     <div className={`flex rounded-2xl p-1.5 ${glassBg}`}>
                         <button 
                            onClick={() => setMobileTab('data')}
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'data' ? 'bg-white shadow-sm text-[#ff80ab]' : 'text-[#8d6e63]'}`}
                         >
                             Deep Dive
                         </button>
                         <button 
                            onClick={() => setMobileTab('pricing')}
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'pricing' ? 'bg-white shadow-sm text-[#ff80ab]' : 'text-[#8d6e63]'}`}
                         >
                             Membership
                         </button>
                     </div>

                     {mobileTab === 'data' ? (
                         <div className="space-y-4 animate-in fade-in duration-500">
                             <div className={`p-7 rounded-[2.5rem] space-y-4 ${glassBg}`}>
                                 <h3 className="text-xl font-bold italic leading-none tracking-tight text-[#4e342e]">{currentPlan.title}</h3>
                                 <p className="text-[#ff80ab] text-[10px] font-black uppercase tracking-widest">{currentPlan.subtitle}</p>
                                 <p className="text-[13px] font-medium text-[#8d6e63] italic leading-relaxed">{currentMeta?.solution}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className={`p-6 rounded-[2.5rem] space-y-5 shadow-lg bg-gradient-to-br from-[#ff80ab] to-[#f06292] text-white`}>
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Journey</h4>
                                     <div className="space-y-4">
                                         {currentMeta?.journey.map((step, i) => (
                                             <div key={i} className="flex flex-col gap-1">
                                                 <div className="text-[10px] font-bold leading-none">{step.title}</div>
                                                 <div className="text-[8px] text-white/70 font-medium italic">{step.desc}</div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                                 <div className={`p-6 rounded-[2.5rem] space-y-5 shadow-sm ${glassBg}`}>
                                     <h4 className="text-[10px] font-black text-[#ff80ab] uppercase tracking-widest">Focus</h4>
                                     <div className="space-y-3">
                                         {currentMeta?.workOn.slice(0, 4).map((f, i) => (
                                             <div key={i} className="flex items-center gap-2 text-[8px] font-black text-[#6d4c41] uppercase">
                                                 <div className="w-1.5 h-1.5 rounded-full bg-[#ff80ab] shadow-[0_0_5px_#ff80ab]" />
                                                 {f}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-3 animate-in slide-in-from-right-4 duration-500 pb-10">
                             {currentPlan.tiers.map((tier) => (
                                 <button
                                     key={tier.id}
                                     onClick={() => setSelectedTierId(tier.id)}
                                     className={`
                                         w-full p-6 rounded-[2.2rem] text-left transition-all border-2 flex items-center justify-between
                                         ${selectedTierId === tier.id ? 'border-[#ff80ab] bg-white shadow-xl' : `${glassBg} border-white/40`}
                                     `}
                                 >
                                     <div className="flex-1">
                                         <h5 className="font-bold text-xs tracking-tight text-[#4e342e]">{tier.label}</h5>
                                         {tier.badge && <span className="text-[8px] font-black text-[#ff80ab] uppercase italic tracking-widest">{tier.badge}</span>}
                                     </div>
                                     <div className="text-right">
                                         {tier.originalPrice && <span className="text-[10px] text-pink-200 line-through font-bold block mb-0.5">₹{tier.originalPrice}</span>}
                                         <span className="text-xl font-serif italic font-bold text-[#ff80ab]">₹{tier.discountedPrice}</span>
                                     </div>
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                <div className={`p-6 pb-10 flex-shrink-0 ${glassBgStrong} border-t flex flex-col gap-4 shadow-[0_-10px_40px_rgba(255,128,171,0.1)]`}>
                    <button
                        onClick={() => handleSubscribe(false)}
                        disabled={loading}
                        className="w-full py-5 bg-[#ff80ab] text-white rounded-[1.8rem] flex items-center justify-between px-8 active:scale-95 transition-all shadow-xl shadow-[#ff80ab]/20 disabled:opacity-50"
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
                        onClick={() => handleSubscribe(true)}
                        className="text-[10px] font-black text-[#ff80ab] uppercase tracking-[0.3em] text-center italic hover:scale-105 transition-transform"
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
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
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
