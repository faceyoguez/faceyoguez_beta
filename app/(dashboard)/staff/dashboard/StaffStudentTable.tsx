'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Tag, 
  CreditCard,
  RefreshCw,
  Clock,
  User,
  Mail,
  Image
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAdminStudentData } from '@/app/actions/admin';
import { toast } from 'sonner';

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
  const itemsPerPage = 8;

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

  // ── Search Filtering ──
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = s.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const planMatch = s.plan?.toLowerCase().includes(searchTerm.toLowerCase());
      const couponMatch = s.couponCode?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch || planMatch || couponMatch;
    });
  }, [students, searchTerm]);

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

        <div className="flex gap-2 w-full md:w-auto md:max-w-md flex-1">
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
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">We couldn't find any student matching your search term.</p>
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
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Email ${student.name}`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all text-[9px] font-black uppercase tracking-wider"
                          >
                            <Mail className="w-3 h-3" />
                            Gmail
                          </a>
                          <a
                            href={`https://photos.google.com/search/${encodeURIComponent(student.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Photos of ${student.name}`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-wider"
                          >
                            <Image className="w-3 h-3" />
                            Photos
                          </a>
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
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Email ${student.name}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 active:bg-blue-100 transition-all text-[9px] font-black uppercase tracking-wider"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Gmail
                    </a>
                    <a
                      href={`https://photos.google.com/search/${encodeURIComponent(student.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Photos of ${student.name}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 active:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-wider"
                    >
                      <Image className="w-3.5 h-3.5" />
                      Photos
                    </a>
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
    </div>
  );
}
