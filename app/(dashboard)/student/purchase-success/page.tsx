'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    CheckCircle2, Sparkles, Heart, 
    ArrowRight, BookOpen, Users, 
    Star, Calendar, ShoppingBag,
    ChevronRight, Download, Share2
} from 'lucide-react';

function PurchaseSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const planId = searchParams.get('planId') || 'group_session';
    const tierId = searchParams.get('tierId') || '1_month_12d';
    const totalAmount = searchParams.get('amount') || '0';
    const includesBumps = searchParams.get('bumps')?.split(',') || [];

    const getPlanIcon = (id: string) => {
        if (id === 'one_on_one') return <Star className="w-6 h-6" />;
        if (id === 'lms') return <BookOpen className="w-6 h-6" />;
        return <Users className="w-6 h-6" />;
    };

    return (
        <div className="min-h-screen bg-[#FFFAF7]/40 flex items-center justify-center p-6 font-sans selection:bg-[#FF8A75]/20">
            <div className="max-w-xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[3rem] bg-[#FF8A75] text-white shadow-xl shadow-[#FF8A75]/20 mb-4 animate-bounce">
                        <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a]">Transformation Awaits!</h1>
                    <p className="text-[#6B7280] font-medium max-w-sm mx-auto">Your journey to a natural facelift and glowing skin has officially begun.</p>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-[3rem] border border-[#FF8A75]/20 overflow-hidden shadow-sm">
                    <div className="bg-[#FFFAF7] p-8 border-b border-[#FF8A75]/10">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">Your Selection</span>
                                <h2 className="text-2xl font-bold text-[#1a1a1a]">Order Summary</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Total Paid</span>
                                <div className="text-2xl font-bold text-[#1a1a1a]">₹{totalAmount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Base Plan */}
                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-[#FFFAF7]/50 border border-[#FF8A75]/5">
                            <div className="p-3 bg-white border border-[#FF8A75]/10 rounded-2xl text-[#FF8A75]">
                                {getPlanIcon(planId)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]">{planId.replace(/_/g, ' ')}</h4>
                                <p className="text-[10px] font-medium text-[#6B7280]">{tierId.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="p-2 rounded-full bg-emerald-50 text-emerald-500">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Bumps */}
                        {includesBumps.length > 0 && (
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Added Upgrades</h5>
                                <div className="space-y-3">
                                    {includesBumps.map((bump, idx) => (
                                        <div key={idx} className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-dashed border-[#FF8A75]/20">
                                            <Sparkles className="w-4 h-4 text-[#FF8A75]" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#374151]">{bump.replace(/_/g, ' ')}</span>
                                            <div className="ml-auto p-1.5 rounded-full bg-[#FF8A75]/5 text-[#FF8A75]">
                                                <Heart className="w-3 h-3 fill-current" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 space-y-4">
                            <button 
                                onClick={() => router.push('/student/dashboard')}
                                className="w-full py-5 bg-[#FF8A75] hover:bg-[#ff705a] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                            >
                                Go to Student Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-[#6B7280] text-center font-bold px-6 leading-relaxed">
                                Welcome to the Faceyoguez community! You can access all your content instantly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="grid grid-cols-2 gap-6">
                    <button className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 transition-all group">
                        <Calendar className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a]">Track Schedule</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 transition-all group">
                        <ShoppingBag className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a]">View Invoice</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PurchaseSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FFFAF7]/40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF8A75]" />
            </div>
        }>
            <PurchaseSuccessContent />
        </Suspense>
    );
}

function Loader2(props: any) {
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
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
        </svg>
    )
}
