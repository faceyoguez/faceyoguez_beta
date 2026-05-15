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
import ThankYouOverlay from '@/components/marketing/ThankYouOverlay';


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
    const [showThankYou, setShowThankYou] = useState(true);


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
        if (id === 'one_on_one') return '1 to 1 PERSONALISED TRANSFORMATION PLAN';
        if (id === 'lms') return 'Self-Paced Video Course';
        return '21-Day Group Transformation';
    };

    if (verificationStatus === 'checking') {
        return (
            <div className="min-h-screen bg-[#FFFAF7] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#FF8A75] mx-auto" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Confirming your purchase…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF7] flex items-center justify-center p-6 font-jakarta selection:bg-[#FF8A75]/20">
            {showThankYou && (
                <ThankYouOverlay
                    onClose={() => setShowThankYou(false)}
                    planId={planId}
                    amount={parseFloat(totalAmount)}
                    paymentId={paymentId}
                />
            )}

            
            <div className="max-w-xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">

                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-[#FF8A75] text-white shadow-xl shadow-[#FF8A75]/20 mb-4 animate-bounce">
                        <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-aktiv font-bold text-slate-900 tracking-tight">Transformation Awaits!</h1>
                    <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">Your journey to a natural facelift and glowing skin has officially begun.</p>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-[1.75rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="bg-slate-50/50 p-8 border-b border-slate-50">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">Your Selection</span>
                                <h2 className="text-2xl font-aktiv font-bold text-slate-900 tracking-tight">Order Summary</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid</span>
                                <div className="text-2xl font-aktiv font-bold text-slate-900 tracking-tight">₹{totalAmount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Base Plan */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="p-3 bg-white border border-slate-100 rounded-xl text-[#FF8A75]">
                                {getPlanIcon(planId)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 leading-none">{getPlanLabel(planId)}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{tierId.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="p-2 rounded-full bg-emerald-50 text-emerald-500">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Bumps */}
                        {includesBumps.length > 0 && includesBumps[0] !== '' && (
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Added Upgrades</h5>
                                <div className="space-y-3">
                                    {includesBumps.map((bump, idx) => (
                                        <div key={idx} className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-dashed border-slate-200">
                                            <Sparkles className="w-4 h-4 text-[#FF8A75]" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{bump.replace(/_/g, ' ')}</span>
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
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payment Reference</p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold text-slate-900 break-all">{paymentId}</span>
                                    <button
                                        onClick={copyPaymentId}
                                        className="p-1.5 rounded-lg hover:bg-[#FF8A75]/10 transition-colors text-[#FF8A75] flex-shrink-0"
                                        title="Copy Payment ID"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <p className="text-[8px] text-slate-400 font-medium">Keep this for support queries</p>
                            </div>
                        )}

                        <div className="pt-4 space-y-4">
                            <button 
                                onClick={() => router.push('/student/dashboard')}
                                className="w-full h-14 bg-slate-900 hover:bg-[#FF8A75] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                            >
                                Go to Student Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-slate-400 text-center font-bold px-6 leading-relaxed uppercase tracking-widest">
                                Welcome to the Faceyoguez community!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="grid grid-cols-2 gap-6">
                    <button
                        onClick={() => router.push('/student/group-session')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[1.75rem] bg-white border border-slate-100 hover:border-[#FF8A75]/30 transition-all group shadow-sm"
                    >
                        <Calendar className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Track Schedule</span>
                    </button>
                    <button
                        onClick={copyPaymentId}
                        className="flex flex-col items-center gap-3 p-6 rounded-[1.75rem] bg-white border border-slate-100 hover:border-[#FF8A75]/30 transition-all group shadow-sm"
                    >
                        <ShoppingBag className="w-5 h-5 text-[#FF8A75] group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Copy Receipt ID</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PurchaseSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FFFAF7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF8A75]" />
            </div>
        }>
            <PurchaseSuccessContent />
        </Suspense>
    );
}
