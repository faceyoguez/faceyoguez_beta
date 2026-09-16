'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Radio, X, Calendar, Clock, Tag, AlertTriangle, Users2, UserRound } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { getExpiringSoonStudents } from '@/app/actions/admin';
import { toast } from 'sonner';
import { MessageComposerModal } from '@/components/staff/MessageComposerModal';

interface ExpiringStudent {
  id: string;
  studentId: string;
  name: string;
  email: string | null;
  phone: string | null;
  joinDate: string | null;
  endDate: string;
  planType: string;
  durationMonths: number | null;
  isTrial: boolean;
  couponCode: string | null;
  daysLeft: number;
}

interface Stat {
  label: string;
  monthly: number;
  daily: number;
  monthlyLabel?: string;
  dailyLabel?: string;
  trend: string;
  trendLabel: string;
  trendNeutral?: boolean;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

const planLabel = (durationMonths: number | null, planType: string) => {
  if (durationMonths === 1) return '1 Month Plan';
  if (durationMonths === 3) return '3 Month Plan';
  if (durationMonths) return `${durationMonths} Month Plan`;
  return planType?.replace(/_/g, ' ') || 'Plan';
};

type PlanFilter = 'all' | 'group_session' | 'one_on_one';

const PLAN_FILTERS: { id: PlanFilter; label: string; icon: typeof Users2 }[] = [
  { id: 'all', label: 'All', icon: Radio },
  { id: 'group_session', label: 'Group', icon: Users2 },
  { id: 'one_on_one', label: '1-on-1', icon: UserRound },
];

export function ExpiringStudentsCard({ stat }: { stat: Stat }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<ExpiringStudent[]>([]);
  const [mounted, setMounted] = useState(false);
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [composer, setComposer] = useState<{ channel: 'email' | 'whatsapp'; student: ExpiringStudent } | null>(null);

  const renewalMessage = (s: ExpiringStudent) =>
    `Hi ${s.name?.split(' ')[0] || ''}! This is the Faceyoguez team. Your plan ends on ${formatDate(s.endDate)} — would you like to renew and keep your streak going?`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadExpiringStudents() {
      setLoading(true);
      try {
        const data = await getExpiringSoonStudents(5);
        if (!cancelled) setStudents(data as ExpiringStudent[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Failed to load expiring students: ' + message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadExpiringStudents();
    return () => { cancelled = true; };
  }, [open]);

  // Reset the plan filter each time the modal is (re)opened
  useEffect(() => {
    if (open) setPlanFilter('all');
  }, [open]);

  const filterCounts = useMemo(() => ({
    all: students.length,
    group_session: students.filter((s) => s.planType === 'group_session').length,
    one_on_one: students.filter((s) => s.planType === 'one_on_one').length,
  }), [students]);

  const filteredStudents = useMemo(() => {
    if (planFilter === 'all') return students;
    return students.filter((s) => s.planType === planFilter);
  }, [students, planFilter]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left p-5 lg:p-6 rounded-[2rem] bg-white border border-[#FF8A75]/10 flex flex-col gap-4 sm:gap-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF8A75]/5 group relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/30"
      >
        <div className="flex justify-between items-start w-full">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:rotate-12 transition-all duration-700 flex-shrink-0">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider ${stat.trendNeutral ? 'bg-slate-100 text-slate-600 group-hover:bg-[#FF8A75]/10 group-hover:text-[#FF8A75]' : (stat.trend?.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')} transition-colors`}>
            {stat.trend} <span className="opacity-70 font-medium ml-0.5">{stat.trendLabel}</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold flex items-center gap-1.5">
            {stat.label}
            <span className="text-[8px] font-bold text-[#FF8A75] normal-case tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">— view expiring</span>
          </p>
          <div className="grid grid-cols-2 gap-2 divide-x divide-slate-100">
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-none mb-1">{stat.daily}</span>
              <span className="text-[9px] font-bold text-[#FF8A75] uppercase tracking-wider">{stat.dailyLabel || 'Today'}</span>
            </div>
            <div className="flex flex-col pl-2">
              <span className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-none mb-1">{stat.monthly}</span>
              <span className="text-[9px] font-bold text-[#FF8A75] uppercase tracking-wider">{stat.monthlyLabel || 'This Month'}</span>
            </div>
          </div>
        </div>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-[1.75rem] border border-[#FF8A75]/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold font-aktiv text-slate-900 truncate">Expiring Plans</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Within the next 5 days</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Type Toggle */}
            <div className="flex items-center gap-1.5 px-5 sm:px-6 py-3 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
              {PLAN_FILTERS.map((f) => {
                const FilterIcon = f.icon;
                const active = planFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPlanFilter(f.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                      active
                        ? "bg-[#1a1a1a] text-white shadow-sm"
                        : "bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <FilterIcon className="w-3 h-3" />
                    {f.label}
                    <span className={cn("text-[9px] font-bold", active ? "opacity-70" : "opacity-40")}>
                      {filterCounts[f.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="min-h-[240px] flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-4 border-[#FF8A75] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Loading...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="min-h-[240px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {students.length === 0 ? 'No plans expiring soon' : 'No matching students'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                    {students.length === 0
                      ? 'No active students have a plan ending in the next 5 days.'
                      : 'No expiring students match this plan type.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <table className="hidden sm:table w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-5 py-3">Student</th>
                        <th className="px-5 py-3">Join Date</th>
                        <th className="px-5 py-3">Plan</th>
                        <th className="px-5 py-3">End Date</th>
                        <th className="px-5 py-3 text-center">Coupon</th>
                        <th className="px-5 py-3 text-center">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center text-[10px] font-bold font-aktiv flex-shrink-0">
                                {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold text-slate-900 truncate leading-snug">{s.name}</span>
                                <span className="text-[10px] font-medium text-slate-400 truncate leading-none mt-0.5">{s.email || 'No email'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(s.joinDate)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                              <Tag className="w-2.5 h-2.5 text-[#FF8A75]" />
                              {s.isTrial ? 'Trial · ' : ''}{planLabel(s.durationMonths, s.planType)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn(
                              "text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap",
                              s.daysLeft <= 2 ? "text-red-600" : "text-amber-600"
                            )}>
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(s.endDate)}
                              <span className="text-[9px] font-bold opacity-70">({s.daysLeft}d)</span>
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {s.couponCode ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-widest uppercase whitespace-nowrap">
                                <Tag className="w-2.5 h-2.5" />
                                {s.couponCode}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest italic">Direct</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {s.email && (
                                <button
                                  type="button"
                                  onClick={() => setComposer({ channel: 'email', student: s })}
                                  title={`Email ${s.name}`}
                                  className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                                >
                                  <img src="/assets/gmail_icon.png" alt="Gmail" className="w-6 h-6 object-contain" />
                                </button>
                              )}
                              {s.phone ? (
                                <button
                                  type="button"
                                  onClick={() => setComposer({ channel: 'whatsapp', student: s })}
                                  title={`WhatsApp ${s.name}`}
                                  className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                                >
                                  <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
                                </button>
                              ) : (
                                <div
                                  title="Number not provided"
                                  className="flex flex-col items-center gap-0.5 cursor-not-allowed"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm relative overflow-hidden">
                                    <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain opacity-25 grayscale" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-[150%] h-[1.5px] bg-red-400/70 rotate-45" />
                                    </div>
                                  </div>
                                  <span className="text-[7px] font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap leading-none">
                                    No number
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile card list */}
                  <div className="sm:hidden divide-y divide-slate-50">
                    {filteredStudents.map((s) => (
                      <div key={s.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center text-xs font-bold font-aktiv flex-shrink-0">
                              {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-extrabold text-slate-900 truncate">{s.name}</span>
                              <span className="text-[10px] font-medium text-slate-400 truncate">{s.email || 'No email'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {s.email && (
                              <button
                                type="button"
                                onClick={() => setComposer({ channel: 'email', student: s })}
                                title={`Email ${s.name}`}
                                className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                              >
                                <img src="/assets/gmail_icon.png" alt="Gmail" className="w-6 h-6 object-contain" />
                              </button>
                            )}
                            {s.phone ? (
                              <button
                                type="button"
                                onClick={() => setComposer({ channel: 'whatsapp', student: s })}
                                title={`WhatsApp ${s.name}`}
                                className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                              >
                                <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
                              </button>
                            ) : (
                              <div
                                title="Number not provided"
                                className="flex flex-col items-center gap-0.5 cursor-not-allowed"
                              >
                                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm relative overflow-hidden">
                                  <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain opacity-25 grayscale" />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[150%] h-[1.5px] bg-red-400/70 rotate-45" />
                                  </div>
                                </div>
                                <span className="text-[7px] font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap leading-none">
                                  No number
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Joined</span>
                            <span className="font-bold text-slate-700">{formatDate(s.joinDate)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ends</span>
                            <span className={cn("font-bold", s.daysLeft <= 2 ? "text-red-600" : "text-amber-600")}>
                              {formatDate(s.endDate)} ({s.daysLeft}d)
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plan</span>
                            <span className="font-bold text-slate-700">{planLabel(s.durationMonths, s.planType)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Coupon</span>
                            {s.couponCode ? (
                              <span className="font-bold text-slate-700 uppercase">{s.couponCode}</span>
                            ) : (
                              <span className="text-slate-300 font-bold uppercase italic">Direct</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {composer && (
        <MessageComposerModal
          open={!!composer}
          onClose={() => setComposer(null)}
          channel={composer.channel}
          recipientName={composer.student.name}
          recipientEmail={composer.student.email}
          recipientPhone={composer.student.phone}
          defaultSubject={composer.channel === 'email' ? 'Your Faceyoguez plan is expiring soon' : undefined}
          defaultMessage={renewalMessage(composer.student)}
        />
      )}
    </>
  );
}
