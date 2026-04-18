'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Tag, 
  User, 
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Phone,
  ArrowUpRight
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

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'queue'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getAdminStudentData();
      setStudents(data as Student[]);
    } catch (error: any) {
      toast.error('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Filters ──
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesTab = s.status === activeTab;
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.couponCode?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.plan.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMonth = monthFilter === 'all' || 
        format(parseISO(s.joinDate), 'MMM') === monthFilter;

      return matchesTab && matchesSearch && matchesMonth;
    });
  }, [students, activeTab, searchTerm, monthFilter]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const months = ['all', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* ── Header & Primary Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Student Management</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mt-1">
            Student Intelligence & Lifecycle Hub
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'active' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Active Students
          </button>
          <button 
            onClick={() => { setActiveTab('queue'); setCurrentPage(1); }}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'queue' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            In Queue ({students.filter(s => s.status === 'queue').length})
          </button>
        </div>
      </div>

      {/* ── Global Filter Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, email, plan, or coupon..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-6 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-[#FF8A75]/5 focus:border-[#FF8A75]/30 transition-all shadow-sm"
          />
        </div>
        <div className="md:col-span-4 flex gap-2">
           <select 
             value={monthFilter}
             onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
             className="flex-1 bg-white border border-slate-200 rounded-3xl px-6 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[#FF8A75]/30 shadow-sm appearance-none cursor-pointer"
           >
             {months.map(m => <option key={m} value={m}>{m === 'all' ? 'All Months' : m}</option>)}
           </select>
           <button 
             onClick={loadData}
             className="bg-white border border-slate-200 p-4 rounded-3xl text-slate-400 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5 transition-all shadow-sm"
           >
             <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
           </button>
        </div>
      </div>

      {/* ── THE EDITORIAL TABLE ── */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-[#FF8A75]/5 overflow-hidden">
        {loading ? (
           <div className="p-40 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#FF8A75] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Intelligence...</p>
           </div>
        ) : filteredStudents.length === 0 ? (
           <div className="p-40 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                 <Search className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-xl font-serif font-bold text-slate-900">No students found</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refine your search parameters</p>
           </div>
        ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="bg-slate-50/80 border-b border-slate-100 divide-x divide-slate-100">
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 w-[25%]">Student Information</th>
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Join Date</th>
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Subscription End</th>
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Plan Tier</th>
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Revenue</th>
                     <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Coupon</th>
                     <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 w-[80px]">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {paginatedStudents.map((student) => (
                     <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors divide-x divide-slate-100">
                       {/* Identity */}
                       <td className="px-4 py-2.5">
                         <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                              {student.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="text-[11px] font-bold text-slate-900 truncate leading-tight">{student.name}</span>
                               <span className="text-[9px] font-medium text-slate-400 truncate leading-none">{student.email}</span>
                            </div>
                         </div>
                       </td>

                       {/* Time Trace */}
                       <td className="px-4 py-2.5">
                          <span className="text-[10px] font-bold text-slate-600">
                             {format(parseISO(student.joinDate), 'dd MMM yyyy')}
                          </span>
                       </td>

                       <td className="px-4 py-2.5">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-tight",
                            student.status === 'active' ? "text-emerald-600" : student.status === 'queue' ? "text-amber-500" : "text-slate-300"
                          )}>
                             {student.subscriptionEnd ? format(parseISO(student.subscriptionEnd), 'dd MMM yyyy') : 'N/A'}
                          </span>
                       </td>

                       {/* Product Info */}
                       <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {student.plan.replace('_', ' ')}
                             </span>
                             {student.planVariant && <span className="text-[8px] font-bold text-slate-300">{student.planVariant}</span>}
                          </div>
                       </td>

                       {/* Financials */}
                       <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-black text-slate-900">₹{student.amountPaid.toLocaleString()}</span>
                             {student.isRenewed && (
                                <div className="text-[8px] font-black text-emerald-500 bg-emerald-50/50 px-1 rounded uppercase tracking-tighter">RD</div>
                             )}
                          </div>
                       </td>

                       <td className="px-4 py-2.5">
                          {student.couponCode ? (
                             <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-widest uppercase">
                                <Tag className="w-2.5 h-2.5" />
                                {student.couponCode}
                             </div>
                          ) : (
                             <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest italic">Direct</span>
                          )}
                       </td>

                       {/* Signal */}
                       <td className="px-4 py-2.5 text-right">
                          <div className={cn(
                             "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                             student.status === 'active' ? "bg-emerald-50 text-emerald-600" : student.status === 'queue' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", student.status === 'active' ? "bg-emerald-500" : student.status === 'queue' ? "bg-amber-500" : "bg-slate-300")} />
                             {student.status}
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {!loading && filteredStudents.length > 0 && (
         <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               Showing {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredStudents.length, currentPage * itemsPerPage)} of {filteredStudents.length} Students
            </p>
            <div className="flex items-center gap-3">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(prev => prev - 1)}
                 className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                 <button 
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={cn(
                     "w-12 h-12 rounded-2xl text-[10px] font-black transition-all shadow-sm",
                     currentPage === page 
                      ? "bg-slate-900 text-white" 
                      : "bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300"
                   )}
                 >
                   {page}
                 </button>
               ))}
               <button 
                 disabled={currentPage === totalPages}
                 onClick={() => setCurrentPage(prev => prev + 1)}
                 className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>
         </div>
      )}

    </div>
  );
}
