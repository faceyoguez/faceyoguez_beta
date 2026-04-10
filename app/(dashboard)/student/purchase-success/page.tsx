'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    CheckCircle2, Sparkles, Heart, 
    ArrowRight, BookOpen, Users, 
    Star, Calendar, ShoppingBag,
    Loader2, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

function PurchaseSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const planId = searchParams.get('planId') || 'group_session';
    const tierId = searchParams.get('tierId') || '';
    const totalAmount = searchParams.get('amount') || '0';
    const includesBumps = searchParams.get('bumps')?.split(',').filter(Boolean) || [];
    const subscriptionId = searchParams.get('subscriptionId') || '';
    const paymentId = searchParams.get('paymentId') || '';

    const [copied, setCopied] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'fallback'>('checking');

    // Verify subscription actually exists in DB (guards against direct URL access)
    useEffect(() => {
        async function verifySubscription() {
            if (!subscriptionId) {
                // No subscriptionId = likely direct URL access without payment
                // Show content anyway since we can't re-verify without the ID
                setVerificationStatus('fallback');
                return;
            }
            try {
                const res = await fetch(`/api/razorpay/subscription-status?id=${subscriptionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setVerificationStatus(data.exists ? 'verified' : 'fallback');
                } else {
                    setVerificationStatus('fallback');
                }
            } catch {
                setVerificationStatus('fallback');
            }
        }
        verifySubscription();
    }, [subscriptionId]);

    // Track purchase completion
    useEffect(() => {
        if (!paymentId) return; // Only track real purchases
        import('@/lib/conversionTracking').then(({ trackConversionEvent }) => {
            trackConversionEvent({
                event_type: 'payment_complete',
                plan_type: planId,
                amount: parseFloat(totalAmount),
                page_path: window.location.pathname,
                metadata: { tierId, bumps: includesBumps, subscriptionId, paymentId }
            });
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentId]);

    const copyPaymentId = async () => {
        if (!paymentId) return;
        await navigator.clipboard.writeText(paymentId);
        setCopied(true);
        toast.success('Payment ID copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const getPlanIcon = (id: string) => {
        if (id === 'one_on_one') return <Star className="w-6 h-6" />;
        if (id === 'lms') return <BookOpen className="w-6 h-6" />;
        return <Users className="w-6 h-6" />;
    };

    const getPlanLabel = (id: string) => {
        if (id === 'one_on_one') return '1-on-1 Personal Plan';
        if (id === 'lms') return 'Self-Paced Video Course';
        return '21-Day Group Transformation';
    };

    if (verificationStatus === 'checking') {
        return (
            <div className="min-h-screen bg-[#FFFAF7]/40 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#FF8A75] mx-auto" />
                    <p className="text-sm font-semibold text-[#6B7280]">Confirming your purchase…</p>
                </div>
            </div>
        );
    }

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
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]">{getPlanLabel(planId)}</h4>
                                <p className="text-[10px] font-medium text-[#6B7280]">{tierId.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="p-2 rounded-full bg-emerald-50 text-emerald-500">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Bumps */}
                        {includesBumps.length > 0 && includesBumps[0] !== '' && (
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

                        {/* Payment ID (for support reference) */}
                        {paymentId && (
                            <div className="p-4 rounded-2xl bg-[#f8f8f8] border border-[#FF8A75]/10 space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]">Payment Reference</p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold text-[#374151] break-all">{paymentId}</span>
                                    <button
                                        onClick={copyPaymentId}
                                        className="p-1.5 rounded-lg hover:bg-[#FF8A75]/10 transition-colors text-[#FF8A75] flex-shrink-0"
                                        title="Copy Payment ID"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <p className="text-[8px] text-[#6B7280]">Keep this for support queries</p>
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
                    <button
                        onClick={() => router.push('/student/group-session')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 transition-all group"
                    >
                        <Calendar className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a]">Track Schedule</span>
                    </button>
                    <button
                        onClick={copyPaymentId}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 transition-all group"
                    >
                        <ShoppingBag className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a]">Copy Receipt ID</span>
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
