'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Tag,
  CreditCard,
  RefreshCw,
  Clock,
  User,
  Camera,
  X
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAdminStudentData } from '@/app/actions/admin';
import { toast } from 'sonner';
import { MessageComposerModal } from '@/components/staff/MessageComposerModal';
import { StudentPhotosModal } from '@/components/staff/StudentPhotosModal';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  joinDate: string;
  subscriptionEnd: string | null;
  plan: string;
  planVariant: string | null;
  amountPaid: number;
  couponCode: string | null;
  isRenewed: boolean;
  isTrial: boolean;
  status: 'active' | 'queue' | 'inactive';
}

export function StaffStudentTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [composer, setComposer] = useState<{ channel: 'email' | 'whatsapp'; student: Student } | null>(null);
  const [photosStudent, setPhotosStudent] = useState<Student | null>(null);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 8;

  // Close the join-date filter popover on outside click
  useEffect(() => {
    if (!dateFilterOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) {
        setDateFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateFilterOpen]);

  const DATE_PRESETS = [
    { label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last Month', range: () => { const d = subMonths(new Date(), 1); return { from: startOfMonth(d), to: endOfMonth(d) }; } },
    { label: 'Last 3 Months', range: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
    { label: 'This Year', range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  ];

  const applyPreset = (range: { from: Date; to: Date }) => {
    setDateFrom(format(range.from, 'yyyy-MM-dd'));
    setDateTo(format(range.to, 'yyyy-MM-dd'));
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasDateFilter = !!(dateFrom || dateTo);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getAdminStudentData();
      setStudents(data as Student[]);
    } catch (error: any) {
      toast.error('Failed to load student data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Search + Join-Date Filtering ──
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = s.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const planMatch = s.plan?.toLowerCase().includes(searchTerm.toLowerCase());
      const couponMatch = s.couponCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const searchOk = nameMatch || emailMatch || planMatch || couponMatch;

      if (!searchOk) return false;

      if (dateFrom || dateTo) {
        if (!s.joinDate) return false;
        const joinDay = s.joinDate.slice(0, 10); // yyyy-MM-dd, safe for lexical comparison
        if (dateFrom && joinDay < dateFrom) return false;
        if (dateTo && joinDay > dateTo) return false;
      }

      return true;
    });
  }, [students, searchTerm, dateFrom, dateTo]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredStudents, currentPage]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-3xl border border-[#FF8A75]/10 rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 shadow-sm">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-aktiv text-slate-900">Student Directory</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">
            Active student roster and plan telemetry
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto md:max-w-lg flex-1">
          {/* Join-Date Filter */}
          <div className="relative" ref={dateFilterRef}>
            <button
              onClick={() => setDateFilterOpen((v) => !v)}
              className={cn(
                "h-full px-3 rounded-2xl border transition-all shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide",
                hasDateFilter
                  ? "bg-[#FF8A75]/10 border-[#FF8A75]/30 text-[#FF8A75]"
                  : "bg-white border-slate-200 text-slate-400 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5"
              )}
              title="Filter by join date"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">
                {hasDateFilter
                  ? `${dateFrom ? format(parseISO(dateFrom), 'dd MMM') : '…'} – ${dateTo ? format(parseISO(dateTo), 'dd MMM') : '…'}`
                  : 'Calendar'}
              </span>
            </button>

            {dateFilterOpen && (
              <div className="absolute right-0 sm:left-0 top-[calc(100%+8px)] z-30 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Ranges</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset.range())}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 hover:bg-[#FF8A75]/10 hover:border-[#FF8A75]/20 hover:text-[#FF8A75] transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custom Range</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/10 focus:border-[#FF8A75]/30"
                    />
                    <span className="text-slate-300 text-[10px] font-bold">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/10 focus:border-[#FF8A75]/30"
                    />
                  </div>
                </div>

                {hasDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
                  >
                    <X className="w-3 h-3" />
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#FF8A75] transition-colors" />
            <input
              type="text"
              placeholder="Search name, email, plan..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/10 focus:border-[#FF8A75]/30 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="bg-white border border-slate-200 p-2.5 rounded-2xl text-slate-400 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5 transition-all shadow-sm flex items-center justify-center disabled:opacity-55"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="relative min-h-[200px] flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#FF8A75] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <User className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No students found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              {hasDateFilter
                ? 'No students joined in the selected date range.'
                : "We couldn't find any student matching your search term."}
            </p>
            {hasDateFilter && (
              <button
                onClick={clearDateFilter}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#FF8A75] hover:underline"
              >
                Clear join-date filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {/* Desktop Table View (hidden on mobile, shown on md+) */}
            <div className="hidden md:block overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <th className="px-5 py-4 w-[26%]">Student</th>
                    <th className="px-5 py-4">Joined Date</th>
                    <th className="px-5 py-4">Joined Plan</th>
                    <th className="px-5 py-4">Plan End Date</th>
                    <th className="px-5 py-4 text-right">Amount Paid</th>
                    <th className="px-5 py-4 text-center">Coupon</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center text-xs font-bold font-aktiv">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-900 truncate leading-snug">{student.name || 'Anonymous'}</span>
                            <span className="text-[10px] font-medium text-slate-400 truncate leading-none mt-0.5">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(student.joinDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {student.plan.split(' + ').map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-500">
                              <Tag className="w-2.5 h-2.5 text-[#FF8A75]" />
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "text-[11px] font-semibold flex items-center gap-1.5",
                          student.status === 'active' ? "text-emerald-600" : "text-slate-400"
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(student.subscriptionEnd)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[12px] font-black text-slate-900 flex items-center justify-end gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          ₹{student.amountPaid.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {student.couponCode ? (
                           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-widest uppercase">
                              <Tag className="w-2.5 h-2.5" />
                              {student.couponCode}
                           </div>
                        ) : (
                           <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest italic">Direct</span>
                        )}
                      </td>
                      {/* Student Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setComposer({ channel: 'email', student })}
                            title={`Email ${student.name}`}
                            className="h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                          >
                            <img src="/assets/gmail_icon.png" alt="Gmail" className="w-7 h-7 object-contain" />
                          </button>
                          {student.phone && (
                            <button
                              type="button"
                              onClick={() => setComposer({ channel: 'whatsapp', student })}
                              title={`WhatsApp ${student.name}`}
                              className="h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                            >
                              <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-7 h-7 object-contain" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPhotosStudent(student)}
                            title={`Photos of ${student.name}`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-wider"
                          >
                            <Camera className="w-3 h-3" />
                            Photos
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (optimized for mobile / iPhone 13, hidden on md+) */}
            <div className="block md:hidden space-y-3">
              {paginatedStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3.5 transition-all active:scale-[0.99]"
                >
                  {/* Student Actions — top of card */}
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                    <button
                      type="button"
                      onClick={() => setComposer({ channel: 'email', student })}
                      title={`Email ${student.name}`}
                      className="h-9 w-9 flex-shrink-0 rounded-xl bg-white border border-slate-200 active:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                    >
                      <img src="/assets/gmail_icon.png" alt="Gmail" className="w-7 h-7 object-contain" />
                    </button>
                    {student.phone && (
                      <button
                        type="button"
                        onClick={() => setComposer({ channel: 'whatsapp', student })}
                        title={`WhatsApp ${student.name}`}
                        className="h-9 w-9 flex-shrink-0 rounded-xl bg-white border border-slate-200 active:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                      >
                        <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-7 h-7 object-contain" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotosStudent(student)}
                      title={`Photos of ${student.name}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 active:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-wider"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Photos
                    </button>
                  </div>

                  {/* Student Identity Row */}
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center text-sm font-bold font-aktiv">
                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 truncate">{student.name || 'Anonymous'}</span>
                      <span className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{student.email}</span>
                    </div>
                  </div>

                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Joined</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#FF8A75]" />
                        {formatDate(student.joinDate)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Amount Paid</span>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-500" />
                        ₹{student.amountPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Coupon</span>
                      {student.couponCode ? (
                         <span className="font-bold text-slate-700 flex items-center gap-1 uppercase">
                            <Tag className="w-3 h-3 text-[#FF8A75]" />
                            {student.couponCode}
                         </span>
                      ) : (
                         <span className="text-slate-300 font-bold uppercase tracking-wide text-[10px] italic">Direct</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plan Name</span>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {student.plan.split(' + ').map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-600">
                            <Tag className="w-2.5 h-2.5 text-[#FF8A75]" />
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plan End Date</span>
                      <span className={cn(
                        "font-bold flex items-center gap-1",
                        student.status === 'active' ? "text-emerald-600" : "text-slate-500"
                      )}>
                        <Clock className="w-3 h-3" />
                        {formatDate(student.subscriptionEnd)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 border-t border-slate-50 pt-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Showing {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filteredStudents.length, currentPage * itemsPerPage)} of {filteredStudents.length} Students
          </p>

          <div className="flex items-center gap-2">
            {/* Prev arrow */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current page / total */}
            <div className="px-4 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-1 shadow-sm min-w-[72px]">
              <span className="text-[13px] font-black">{currentPage}</span>
              <span className="text-slate-500 text-[11px] font-semibold">/</span>
              <span className="text-slate-400 text-[11px] font-semibold">{totalPages}</span>
            </div>

            {/* Next arrow */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {composer && (
        <MessageComposerModal
          open={!!composer}
          onClose={() => setComposer(null)}
          channel={composer.channel}
          recipientName={composer.student.name}
          recipientEmail={composer.student.email}
          recipientPhone={composer.student.phone}
          defaultSubject={composer.channel === 'email' ? 'A message from Faceyoguez' : undefined}
          defaultMessage={`Hi ${composer.student.name?.split(' ')[0] || ''},\n\n`}
        />
      )}

      {photosStudent && (
        <StudentPhotosModal
          open={!!photosStudent}
          onClose={() => setPhotosStudent(null)}
          studentId={photosStudent.id}
          studentName={photosStudent.name}
        />
      )}
    </div>
  );
}
