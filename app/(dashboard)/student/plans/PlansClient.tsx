'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Users, BookOpen, Check, ArrowRight, Loader2, Sparkles,
  CreditCard, Star, Clock, Infinity, Video, Shield, Gift, Zap, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '@/types/database';

// ─────────────────────────────────────────────────────────────────────────────
// PLAN CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_PLANS = [
  {
    id: 'monthly_limited',
    label: '1 Month — Limited Recordings',
    sublabel: '12-day recording access',
    originalPrice: 4400,
    price: 1499,
    durationMonths: 1,
    badge: '🏷️ Best to Try',
    features: ['Daily 7:30 PM live sessions', '21-Day Transformation programme', 'Recordings for 12 days after each session', 'Small group setting', 'Progress tracking dashboard'],
  },
  {
    id: 'monthly_lifetime',
    label: '1 Month — Lifetime Recordings',
    sublabel: 'Keep recordings forever',
    originalPrice: 4400,
    price: 1998,
    durationMonths: 1,
    badge: '⭐ Popular',
    popular: true,
    features: ['Daily 7:30 PM live sessions', '21-Day Transformation programme', 'Lifetime access to all recordings', 'Small group setting', 'Progress tracking dashboard'],
  },
  {
    id: '3month_limited',
    label: '3 Months — Limited Recordings',
    sublabel: '12-day recording access',
    originalPrice: 12999,
    price: 3499,
    durationMonths: 3,
    badge: '💰 Best Value',
    features: ['3 months of live sessions', 'Multiple 21-Day cycles', 'Recordings for 12 days per session', 'Community group access', 'Long-term transformation'],
  },
  {
    id: '3month_lifetime',
    label: '3 Months — Lifetime Recordings',
    sublabel: 'Keep recordings forever',
    originalPrice: 12999,
    price: 4348,
    durationMonths: 3,
    badge: '👑 Premium',
    features: ['3 months of live sessions', 'Multiple 21-Day cycles', 'Lifetime access to all recordings', 'Community group access', 'Maximum transformation results'],
  },
];

const ONE_ON_ONE_PLANS = [
  {
    id: 'monthly',
    label: 'Plan 1 — 1 Month',
    sublabel: 'Begin your transformation',
    originalPrice: 8000,
    price: 5499,
    durationMonths: 1,
    badge: '🌱 Starter',
    features: ['1-on-1 consultation call', 'Personalised face yoga plan', 'Direct chat with Harsimrat', 'Daily reflection check-in', 'Progress milestone tracking'],
  },
  {
    id: 'quarterly',
    label: 'Plan 2 — 3 Months',
    sublabel: 'Real, lasting results',
    originalPrice: 24000,
    price: 11000,
    durationMonths: 3,
    badge: '⭐ Popular',
    popular: true,
    features: ['All Plan 1 benefits', 'Multiple re-consultation calls', 'Plan updated every 15 days', 'Photo progress comparison', 'Priority chat support'],
  },
  {
    id: 'biannual',
    label: 'Plan 3 — 6 Months',
    sublabel: '60% OFF — Membership',
    originalPrice: 48000,
    price: 18000,
    durationMonths: 6,
    badge: '🌟 Membership 60% OFF',
    membership: true,
    features: ['All Plan 2 benefits', '15 bonus days included', 'Free Lifetime Group Recordings', 'FACEYOGUEZ Manual (₹3,000 value)', '50% off Maintenance Plan', '10% referral discount'],
  },
  {
    id: 'annual',
    label: 'Plan 4 — 12 Months',
    sublabel: '70% OFF — Pay in 2 instalments',
    originalPrice: 96000,
    price: 30000,
    durationMonths: 12,
    badge: '👑 Best Deal 70% OFF',
    membership: true,
    instalments: true,
    features: ['All Plan 3 benefits', '1 extra month free', 'Free Lifetime Group Recordings', 'FACEYOGUEZ Manual (₹3,000 value)', '50% off Maintenance Plan', '2 easy instalments available'],
  },
];

const LMS_PLANS = [
  {
    id: 'level1',
    label: 'Level 1 Only',
    sublabel: '16 Sessions — Foundation & Basics',
    originalPrice: 1999,
    price: 999,
    durationMonths: 12, // Lifetime — set long duration
    badge: '🌱 Beginner',
    features: ['16 recorded sessions', 'Introduction to Face Yoga', 'Posture & entry-level techniques', 'Skincare basics & lymphatic drainage', 'Lifetime dashboard access'],
  },
  {
    id: 'level1_2',
    label: 'Level 1 + Level 2',
    sublabel: '32 Sessions — Complete Transformation',
    originalPrice: 3999,
    price: 1499,
    durationMonths: 12,
    badge: '🔥 Complete Package 62% OFF',
    popular: true,
    features: ['32 recorded sessions (both levels)', 'Foundation + Advanced techniques', 'Deep facial sculpting & symmetry', 'Progress tracker with photo milestones', 'Lifetime dashboard access'],
  },
];

const CATEGORIES = [
  { id: 'group_session', label: '21-Day Group', icon: Users, color: 'pink', plans: GROUP_PLANS },
  { id: 'one_on_one', label: '1-on-1 Personal', icon: User, color: 'rose', plans: ONE_ON_ONE_PLANS },
  { id: 'lms', label: 'Recorded LMS', icon: BookOpen, color: 'purple', plans: LMS_PLANS },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS 
// ─────────────────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function discountPct(original: number, price: number) {
  return Math.round(((original - price) / original) * 100);
}

declare global {
  interface Window {
    Razorpay: any;
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentSubscription: any;
  userId: string;
  currentUser?: Profile;
}

export function PlansClient({ currentSubscription, userId, currentUser }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('group_session');
  const [selectedVariant, setSelectedVariant] = useState<string>('monthly_limited');
  const [loading, setLoading] = useState(false);

  // Reset selected variant when category changes
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (cat && cat.plans.length > 0) {
      const popular = cat.plans.find(p => p.popular) || cat.plans[0];
      setSelectedVariant(popular.id);
    }
  }, [activeCategory]);

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory)!;
  const activePlans = activeCategoryData.plans;
  const selectedPlan = activePlans.find(p => p.id === selectedVariant) || activePlans[0];

  const handlePay = async () => {
    if (!selectedPlan) return;
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Create order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: activeCategory,
          planVariant: selectedPlan.id,
          amount: selectedPlan.price,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: 'FaceYoguez',
          description: selectedPlan.label,
          image: '/logo.png',
          prefill: {
            name: currentUser?.full_name || '',
            email: currentUser?.email || '',
            contact: currentUser?.phone || '',
          },
          theme: { color: '#ec4899' },
          handler: async function (response: any) {
            try {
              // 4. Verify payment on server
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planType: activeCategory,
                  planVariant: selectedPlan.id,
                  amount: selectedPlan.price,
                  durationMonths: selectedPlan.durationMonths,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

              toast.success('🎉 Payment successful! Your subscription is now active.');
              resolve();
              setTimeout(() => window.location.reload(), 1500);
            } catch (verifyErr: any) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error('dismissed'));
            },
          },
        });

        rzp.on('payment.failed', function (resp: any) {
          reject(new Error(resp.error?.description || 'Payment failed'));
        });

        rzp.open();
      });

    } catch (error: any) {
      if (error.message !== 'dismissed') {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, { tab: string; selected: string; badge: string; btn: string; shadow: string }> = {
    pink: {
      tab: 'bg-pink-500 text-white',
      selected: 'border-pink-500 shadow-xl shadow-pink-100/50 scale-[1.02]',
      badge: 'bg-gradient-to-r from-pink-500 to-rose-500',
      btn: 'from-pink-500 to-rose-500 shadow-pink-200/50',
      shadow: 'shadow-pink-100/50',
    },
    rose: {
      tab: 'bg-rose-500 text-white',
      selected: 'border-rose-500 shadow-xl shadow-rose-100/50 scale-[1.02]',
      badge: 'bg-gradient-to-r from-rose-500 to-pink-600',
      btn: 'from-rose-500 to-pink-600 shadow-rose-200/50',
      shadow: 'shadow-rose-100/50',
    },
    purple: {
      tab: 'bg-purple-500 text-white',
      selected: 'border-purple-500 shadow-xl shadow-purple-100/50 scale-[1.02]',
      badge: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      btn: 'from-purple-500 to-indigo-500 shadow-purple-200/50',
      shadow: 'shadow-purple-100/50',
    },
  };

  const colors = colorMap[activeCategoryData.color];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-pink-50/30 via-white to-rose-50/20">
      <div className="mx-auto max-w-6xl">

        {/* Hero Banner */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-8 text-white shadow-2xl shadow-pink-200/40 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="h-48 w-48" />
          </div>
          <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-pink-200 mb-2">✨ Begin Your Transformation</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Face Yoga Plans</h1>
            <p className="mt-2 text-pink-100 max-w-2xl text-sm leading-relaxed">
              Choose your plan and start your natural, expert-guided facial transformation. No needles. No filters. Just your face doing what it was always capable of.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-pink-100">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Secure Payments via Razorpay</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Instant Activation</span>
              <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Early Bird Prices</span>
            </div>
          </div>
        </div>

        {/* Active subscription notice */}
        {currentSubscription && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="h-10 w-10 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-900">Active Subscription</h2>
              <p className="text-xs text-blue-700 mt-0.5">
                You have an active <strong>{currentSubscription.plan_type?.replace(/_/g, ' ')}</strong> plan
                {currentSubscription.end_date && <> until <strong>{new Date(currentSubscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}.
                Subscribing again will stack or replace your current plan.
              </p>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex-1 ${isActive ? colorMap[cat.color].tab + ' shadow-lg scale-[1.02]' : 'bg-white/80 text-gray-600 border border-white/60 hover:border-pink-200 hover:bg-white shadow-sm'}`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Plan Cards Grid */}
        <div className={`grid gap-5 ${activePlans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
          {activePlans.map((plan) => {
            const isSelected = selectedVariant === plan.id;
            const pct = discountPct(plan.originalPrice, plan.price);

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedVariant(plan.id)}
                className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all duration-300 ${isSelected ? colors.selected : 'border-gray-100 bg-white/70 hover:border-pink-200 hover:bg-white shadow-sm'}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <span className={`absolute -top-3 left-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md ${colors.badge}`}>
                    {plan.badge}
                  </span>
                )}

                {/* Discount pill */}
                <div className="flex items-start justify-between mb-3 mt-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{plan.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.sublabel}</p>
                  </div>
                  {isSelected && (
                    <div className={`ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${colors.badge}`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-gray-900">{formatINR(plan.price)}</span>
                    <span className="text-xs text-gray-400 line-through">{formatINR(plan.originalPrice)}</span>
                  </div>
                  <span className="inline-block mt-1 rounded-full bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 text-[10px] font-bold">{pct}% OFF</span>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 leading-snug">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Membership tag */}
                {(plan as any).membership && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs font-bold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Membership — Loaded with Perks
                  </div>
                )}
                {(plan as any).instalments && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700">
                    <CreditCard className="h-3.5 w-3.5" /> Pay in 2 Easy Instalments
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Checkout Footer */}
        <div className="mt-10 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm border border-pink-100 shadow-2xl rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl w-full ring-1 ring-pink-100/50">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Selected Plan</p>
              <h3 className="text-xl font-extrabold text-gray-900">{selectedPlan?.label}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{selectedPlan?.sublabel}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{selectedPlan ? formatINR(selectedPlan.price) : ''}</span>
                {selectedPlan && (
                  <span className="text-sm text-gray-400 line-through">{formatINR(selectedPlan.originalPrice)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={handlePay}
                disabled={loading}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${colors.btn} px-10 py-4 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 font-bold text-base min-w-[220px] active:scale-[0.98]`}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {loading ? 'Processing...' : 'Proceed to Pay'}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                100% secure · Powered by Razorpay
              </p>
            </div>
          </div>
        </div>

        {/* Membership Perks callout (for 1-on-1 category) */}
        {activeCategory === 'one_on_one' && (
          <div className="mt-8 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900">Membership Perks (6M & 12M Plans)</h3>
                <p className="text-xs text-gray-500">Everything included when you commit to your transformation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {['15 bonus days (6M) / 1 extra month (12M)', 'Free Lifetime Group Recordings', 'FACEYOGUEZ Complete Manual (₹3,000)', '50% off on Maintenance Plan', '10% discount on renewal when you refer', '2 easy instalments for 12-month plan'].map(perk => (
                <div key={perk} className="flex items-start gap-2 bg-white/60 rounded-xl p-3">
                  <Star className="h-3.5 w-3.5 shrink-0 mt-0.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-medium text-gray-700">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
