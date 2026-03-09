'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flower2,
  Loader2,
  User,
  Users,
  BookOpen,
  Check,
  ArrowRight,
} from 'lucide-react';

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

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('one_on_one');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function handleContinue() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleComplete() {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || undefined,
          role: 'student',
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/signup-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        planType: selectedPlan,
        fullName,
        phone,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create subscription');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4">
      <div
        className={`w-full rounded-2xl bg-white/80 shadow-xl ring-1 ring-pink-100/50 backdrop-blur-xl transition-all duration-300 ${
          step === 2 ? 'max-w-3xl p-6 lg:p-8' : 'max-w-sm p-8'
        }`}
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50">
            <Flower2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Faceyoguez</h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1 ? 'Create your account' : 'Choose your plan'}
          </p>
        </div>

        {step === 1 && (
          <>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={handleContinue}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition-all hover:shadow-lg"
              >
                Continue to Plan Selection <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-pink-500 hover:text-pink-600">
                Sign In
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const Icon = plan.icon;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/50 shadow-lg shadow-pink-100/50'
                        : 'border-gray-100 bg-white/50 hover:border-pink-200 hover:shadow-md'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Most Popular
                      </span>
                    )}
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isSelected
                            ? 'bg-pink-500 text-white shadow-md shadow-pink-200/50'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-xs text-gray-500">/ {plan.duration}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{plan.description}</p>
                    <div className="mt-4 flex flex-col gap-1.5">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check
                            className={`h-3 w-3 shrink-0 ${isSelected ? 'text-pink-500' : 'text-gray-400'}`}
                          />
                          <span className="text-[11px] text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition-all hover:shadow-lg disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account & Subscribe
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              You can change your plan later from settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
