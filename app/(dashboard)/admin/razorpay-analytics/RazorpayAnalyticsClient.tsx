'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertCircle, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Search, Filter, Download, 
  ChevronDown, ChevronUp, Clock, Calendar, CheckCircle, Mail, ExternalLink,
  ShieldCheck, Percent, PieChart as PieChartIcon, BarChart3, Receipt,
  Activity, Wallet, Landmark, Info, FilterX, HelpCircle, UserX, UserCheck
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

// --- Constants & Types ---
const PRIMARY_BLUE = '#1e293b'; 
const SECONDARY_GRAY = '#64748b';
const BACKGROUND_GRAY = '#f8fafc';
const CHART_COLORS = ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

const SECTIONS = [
  { id: 'intelligence', label: 'Overview', icon: <Activity className="size-3.5" /> },
  { id: 'funnel', label: 'Funnel', icon: <Filter className="size-3.5" /> },
  { id: 'revenue', label: 'Revenue', icon: <DollarSign className="size-3.5" /> },
  { id: 'methods', label: 'Payments', icon: <CreditCard className="size-3.5" /> },
  { id: 'plans', label: 'Plans', icon: <PieChartIcon className="size-3.5" /> },
  { id: 'subscriptions', label: 'Subs', icon: <Users className="size-3.5" /> },
  { id: 'transactions', label: 'Ledger', icon: <Receipt className="size-3.5" /> },
];

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'all', label: 'All Time' },
];

// --- Utilities ---
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- Components ---
const GlassCard = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <div 
    id={id}
    className={`bg-white border border-slate-200 shadow-sm rounded-lg p-5 ${className}`}
  >
    {children}
  </div>
);


const MetricCard = ({ label, value, trend, trendValue, subtext, icon, loading }: any) => (
  <GlassCard className="flex flex-col justify-between py-4 group font-jakarta">
    <div className="flex justify-between items-center mb-3">
      <p className="text-[11px] uppercase tracking-tight text-slate-400 font-aktiv font-bold">{label}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-aktiv font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {trendValue}%
        </div>
      )}
    </div>
    <div className="flex items-end justify-between gap-2">
      <div>
        {loading ? (
          <div className="h-7 w-24 bg-slate-100 animate-pulse rounded" />
        ) : (
          <h3 className="text-xl font-aktiv font-bold text-slate-900">{value}</h3>
        )}
        {subtext && <p className="text-[10px] text-slate-400 mt-1 font-jakarta font-medium">{subtext}</p>}
      </div>
      <div className="text-slate-300">
        {icon}
      </div>
    </div>
  </GlassCard>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur border border-white/60 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase() === 'amount' || entry.name.toLowerCase() === 'value') ? formatINR(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
export default function RazorpayAnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/razorpay-analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Could not refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Demo Data as requested by user
  const demoData = {
    funnel: [
      { stage: 'Visited Pricing', count: 2400, percentage: 100, drop: 0 },
      { stage: 'Clicked Buy', count: 450, percentage: 19, drop: 81 },
      { stage: 'Completed Payment', count: 145, percentage: 6, drop: 68 },
    ],
    highValueActions: [
      { label: 'Buy Plan Clicked', count: 450, icon: <ArrowUpRight className="size-5" />, color: 'bg-orange-50 text-[#a33d23]' },
      { label: 'Subscription Purchased', count: 145, icon: <CheckCircle className="size-5" />, color: 'bg-rose-50 text-[#e76f51]' },
      { label: 'Contact Form Filled', count: 82, icon: <Mail className="size-5" />, color: 'bg-stone-50 text-stone-500' },
    ],
    overallConversion: '6%'
  };

  const activeConversion = isDemoMode ? demoData : {
    funnel: data?.conversion?.funnel || [],
    highValueActions: data?.conversion?.highValueActions?.filter((a: any) => a.icon !== 'whatsapp').map((a: any) => ({
      ...a,
      icon: a.icon === 'buy' ? <ArrowUpRight className="size-5" /> : 
            a.icon === 'success' ? <CheckCircle className="size-5" /> :
            a.icon === 'mail' ? <Mail className="size-5" /> : <Activity className="size-5" />,
      color: a.icon === 'buy' ? 'bg-orange-50 text-[#a33d23]' :
             a.icon === 'success' ? 'bg-rose-50 text-[#e76f51]' :
             a.icon === 'mail' ? 'bg-stone-50 text-stone-500' : 'bg-orange-50 text-[#a33d23]'
    })) || [],
    overallConversion: `${data?.conversion?.conversionRate || 0}%`
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', method: 'all', plan: 'all' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const toggleRow = (id: string) => {
    const newRows = new Set(expandedRows);
    if (newRows.has(id)) newRows.delete(id);
    else newRows.add(id);
    setExpandedRows(newRows);
  };

  const filteredTransactions = useMemo(() => {
    if (!data?.recent) return [];
    return data.recent.filter((t: any) => {
      const matchesSearch = t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.paymentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || t.status === filters.status;
      const matchesMethod = filters.method === 'all' || t.method === filters.method;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [data?.recent, searchTerm, filters]);

  const exportToCSV = (tableData: any[], filename: string) => {
    if (!tableData || tableData.length === 0) return;
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendReminder = async (email: string) => {
    try {
      const res = await fetch('/api/admin/send-renewal-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        toast.success(`Reminder sent to ${email}`);
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (e) {
      toast.error('Error sending reminder');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="size-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-slate-900">Synchronizing Analytics...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-red-100 shadow-xl">
        <AlertCircle className="size-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Something went wrong</h2>
        <p className="text-gray-500 mb-6 font-medium">{error}</p>
        <button onClick={fetchData} className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-600 transition-all flex items-center gap-2">
          <RefreshCw className="size-4" /> Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 lg:p-8 font-jakarta selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header id="intelligence" className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-aktiv font-bold text-slate-900 mb-2">
              Business Intelligence <span className="text-slate-400 font-jakarta font-medium">v2.0</span>
            </h1>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-[10px] font-aktiv font-bold text-slate-500 uppercase tracking-tight">
                  <div className="size-1.5 bg-emerald-500 rounded-full" />
                  Live System Connected
               </div>
               <button onClick={fetchData} className="flex items-center gap-1.5 text-[10px] font-aktiv font-bold text-slate-400 uppercase tracking-tight hover:text-slate-900 transition-colors">
                  <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
               </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
            {DATE_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all ${
                  dateRange === range.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Sticky Navigation */}
      <nav className="sticky top-4 z-50 mb-12 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-1 flex overflow-x-auto no-scrollbar items-center justify-center">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-tight ${
                activeTab === section.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto space-y-24 pb-32">
        {/* Funnel Section */}
        <section id="funnel" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-aktiv font-bold text-slate-900 uppercase tracking-tight">Checkout Funnel</h2>
              <p className="text-[10px] font-jakarta font-medium text-slate-400">Conversion velocity metrics</p>
            </div>
            {isDemoMode && (
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded text-[9px] font-bold uppercase tracking-tight border border-amber-100">
                Demo Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             <div className="lg:col-span-8 flex flex-col gap-2">
                {activeConversion.funnel.map((item: any, idx: number) => (
                  <div key={idx} className="relative">
                    <GlassCard className="py-4 hover:bg-slate-50 transition-colors">
                       <div className="flex flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                             <div className="flex items-center justify-center size-8 bg-slate-100 rounded-md font-bold text-slate-900 text-sm">
                               {idx + 1}
                             </div>
                             <div>
                                <h3 className="text-sm font-bold text-slate-800">{item.stage}</h3>
                                <div className="flex items-center gap-3">
                                   <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-800" style={{ width: `${item.percentage}%` }} />
                                   </div>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.percentage}% conversion</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-bold text-slate-900">{item.count.toLocaleString()}</p>
                             {idx > 0 && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">-{item.drop}% drop</p>}
                          </div>
                       </div>
                    </GlassCard>
                  </div>
                ))}
             </div>

             <div className="lg:col-span-4 flex flex-col gap-4">
                <GlassCard className="bg-slate-900 text-white p-6">
                   <div className="flex flex-col h-full">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-4">Platform Accuracy</p>
                      <h4 className="text-4xl font-bold tracking-tight mb-2">{activeConversion.overallConversion}</h4>
                      <p className="text-[11px] font-medium text-slate-300">Net Conversion Velocity</p>
                   </div>
                </GlassCard>

                <div className="space-y-2">
                   {activeConversion.highValueActions.map((action: any, idx: number) => (
                      <GlassCard key={idx} className="flex items-center justify-between py-3 px-4">
                         <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${action.color}`}>
                               {action.icon}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{action.label}</span>
                         </div>
                         <span className="text-sm font-bold text-slate-900">{action.count.toLocaleString()}</span>
                      </GlassCard>
                   ))}
                </div>
                
                <button 
                  onClick={() => toast.success('Telemetry pipelines synchronized.')}
                  className="w-full py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                   Config Webhooks
                </button>
             </div>
          </div>
        </section>

        {/* Revenue Section */}
        <section id="revenue" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Revenue Matrix</h2>
              <p className="text-[10px] font-medium text-slate-400">Financial liquidity metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard label="Rev Today" value={formatINR(data?.summary?.today?.revenue || 0)} trend={data?.summary?.today?.growth >= 0 ? 'up' : 'down'} trendValue={Math.abs(Math.round(data?.summary?.today?.growth || 0))} icon={<DollarSign className="size-4" />} loading={loading} />
            <MetricCard label="Rev Month" value={formatINR(data?.summary?.thisMonth?.revenue || 0)} trend={data?.summary?.thisMonth?.growth >= 0 ? 'up' : 'down'} trendValue={Math.abs(Math.round(data?.summary?.monthOverMonthGrowth || 0))} icon={<TrendingUp className="size-4" />} loading={loading} />
            <MetricCard label="Success" value={`${data?.summary?.successRate || 0}%`} trend={data?.summary?.successRate >= 85 ? 'up' : 'down'} trendValue={data?.summary?.successRate || 0} icon={<CheckCircle className="size-4" />} loading={loading} />
            <MetricCard label="AOV" value={formatINR(data?.summary?.averageTransactionValue || 0)} icon={<Percent className="size-4" />} loading={loading} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <MetricCard label="Monthly Recurring (MRR)" value={formatINR(data?.subscriptions?.mrr || 0)} icon={<RefreshCw className="size-5" />} loading={loading} subtext={`Projected ARR: ${formatINR(data?.subscriptions?.arr || 0)}`} />
            <MetricCard label="Market Penetration" value={data?.subscriptions?.totalActive || 0} icon={<Users className="size-5" />} loading={loading} subtext={`${data?.subscriptions?.newThisMonth || 0} net gain this cycle`} />
            <MetricCard label="Platform Attempts" value={data?.paymentCounts?.attempted || 0} icon={<Activity className="size-5" />} loading={loading} subtext={`${data?.paymentCounts?.successful || 0} captured / ${data?.paymentCounts?.failed || 0} leakage`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <GlassCard className="p-0 overflow-hidden">
               <div className="p-4 border-b border-slate-100">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Daily Revenue Stream</h3>
               </div>
               <div className="h-[300px] w-full p-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data?.daily || []}>
                     <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} hide />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                     <Tooltip content={<CustomTooltip />} />
                     <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden">
               <div className="p-4 border-b border-slate-100">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Monthly Growth</h3>
               </div>
               <div className="h-[300px] w-full p-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data?.monthly || []}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                       {(data?.monthly || []).map((entry: any, idx: number) => (
                         <Cell key={idx} fill={idx === (data.monthly?.length - 1) ? '#0f172a' : '#e2e8f0'} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </GlassCard>
          </div>
        </section>

        {/* Methods Section */}
        <section id="methods" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Payment Methods</h2>
              <p className="text-[10px] font-medium text-slate-400">Topology of transaction capture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <GlassCard className="col-span-1">
                <h3 className="text-[10px] font-aktiv font-bold text-slate-400 uppercase tracking-tight mb-8">Share Analysis</h3>
                <div className="h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={data?.methods?.breakdown || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="revenue" stroke="none">
                         {(data?.methods?.breakdown || []).map((entry: any, idx: number) => (
                           <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                         ))}
                       </Pie>
                       <Tooltip formatter={(val: any) => formatINR(val || 0)} />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
             </GlassCard>

             <GlassCard className="col-span-2 p-0 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">Mode</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">Revenue</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight text-right">Success Rate</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {(data?.methods?.breakdown || []).map((m: any, i: number) => (
                         <tr key={i} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                               <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{m.method.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-700">{formatINR(m.revenue)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600">
                                  {m.successRate}%
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </GlassCard>
          </div>
        </section>

        {/* Plan Section */}
        <section id="plans" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Plan Analytics</h2>
              <p className="text-[10px] font-medium text-slate-400">Revenue by product tier</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <MetricCard label="Best Seller" value={data?.plans?.bestSellingThisMonth || 'N/A'} icon={<TrendingUp className="size-4" />} />
             <MetricCard label="Top Revenue Plan" value={data?.plans?.highestRevenueThisMonth || 'N/A'} icon={<DollarSign className="size-4" />} />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {(data?.plans?.plans || []).map((plan: any, i: number) => (
                <GlassCard key={i} className="p-6">
                   <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-bold text-slate-800 capitalize">{plan.planType.replace('_', ' ')}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{plan.percentage}%</span>
                   </div>
                   <div className="space-y-4">
                      <div>
                         <p className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">Revenue Pool</p>
                         <p className="text-xl font-bold text-slate-900">{formatINR(plan.revenue)}</p>
                      </div>
                      <div className="flex justify-between pt-4 border-t border-slate-50">
                         <div>
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">Avg Transaction</p>
                            <p className="text-xs font-bold text-slate-700">{formatINR(plan.averageValue)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">Failed</p>
                            <p className="text-xs font-bold text-rose-500">{plan.failedAttempts}</p>
                         </div>
                      </div>
                   </div>
                </GlassCard>
             ))}
          </div>
        </section>

        {/* Subscriptions Section */}
        <section id="subscriptions" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Subscription Health</h2>
              <p className="text-[10px] font-medium text-slate-400">Retention and churn metrics</p>
            </div>
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <GlassCard className="p-6">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-6">Retention Metrics</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">Churn Rate</p>
                     <span className="text-2xl font-bold text-rose-500">{data?.subscriptions?.churnRate || 0}%</span>
                  </div>
                  <div>
                     <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">Avg. Lifetime</p>
                     <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold text-slate-900">{data?.subscriptions?.averageLifetimeMonths || 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-1">mo</span>
                     </div>
                  </div>
               </div>
            </GlassCard>
            
            <GlassCard className="p-0 overflow-hidden">
               <div className="p-4 border-b border-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-900">Expiring Stream</h3>
               </div>
               <div className="max-h-[200px] overflow-y-auto">
                 {(data?.subscriptions?.expiringStudents || []).length > 0 ? (
                   <ul className="divide-y divide-slate-50">
                     {data?.subscriptions?.expiringStudents.map((s: any, idx: number) => (
                       <li key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                         <div>
                           <p className="text-[11px] font-bold text-slate-900">{s.name}</p>
                           <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{s.plan}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-bold text-slate-400 mb-1">Expires: {s.expiry}</p>
                           <button onClick={() => sendReminder(s.email)} className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight hover:bg-slate-800 transition-colors">
                              Remind
                           </button>
                         </div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <div className="p-6 text-center text-slate-400 text-[10px] font-bold">No imminent expirations</div>
                 )}
               </div>
            </GlassCard>
          </div>
        </section>

        {/* Transactions Section */}
        <section id="transactions" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Financial Ledger</h2>
              <p className="text-[10px] font-medium text-slate-400">Real-time settlement stream</p>
            </div>
            <button onClick={() => exportToCSV(data?.recent || [], 'transactions')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-tight">
              <Download className="size-3" /> Export CSV
            </button>
          </div>
 
          <GlassCard className="mb-4">
             <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                   <input type="text" placeholder="Search entity..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-slate-200" />
                </div>
                <div className="flex gap-2">
                   <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none">
                      <option value="all">All Status</option>
                      <option value="captured">Success</option>
                      <option value="failed">Failed</option>
                   </select>
                   <select value={filters.method} onChange={(e) => setFilters(f => ({ ...f, method: e.target.value }))} className="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none">
                      <option value="all">All Methods</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                   </select>
                </div>
             </div>
          </GlassCard>
 
          <GlassCard className="p-0 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4 text-[10px] uppercase tracking-tight text-slate-400 font-bold">Beneficiary</th>
                     <th className="px-6 py-4 text-[10px] uppercase tracking-tight text-slate-400 font-bold">Capture</th>
                     <th className="px-6 py-4 text-[10px] uppercase tracking-tight text-slate-400 font-bold">Stability</th>
                     <th className="px-6 py-4 text-[10px] uppercase tracking-tight text-slate-400 font-bold">Timeline</th>
                     <th className="px-6 py-4"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredTransactions.map((tx: any) => (
                     <React.Fragment key={tx.paymentId}>
                       <tr onClick={() => toggleRow(tx.paymentId)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                         <td className="px-6 py-4">
                           <p className="text-[11px] font-bold text-slate-900">{tx.studentName}</p>
                           <p className="text-[9px] text-slate-400 font-medium">{tx.studentEmail}</p>
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-[11px] font-bold text-slate-900">{formatINR(tx.amount)}</p>
                           <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">{tx.planType}</p>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${
                             tx.status === 'captured' ? 'bg-slate-900 text-white' :
                             tx.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'
                           }`}>
                             {tx.status}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-[10px] font-medium text-slate-400">{tx.createdAt}</td>
                         <td className="px-6 py-4 text-right">
                            <ChevronDown className={`size-3 text-slate-300 transition-transform ${expandedRows.has(tx.paymentId) ? 'rotate-180' : ''}`} />
                         </td>
                       </tr>
                       {expandedRows.has(tx.paymentId) && (
                         <tr className="bg-slate-50">
                           <td colSpan={5} className="px-6 py-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded bg-white border border-slate-100 shadow-sm">
                               <div className="space-y-2">
                                 <div className="flex justify-between text-[10px] border-b border-slate-50 pb-2">
                                   <span className="text-slate-400 font-bold uppercase">Gross</span>
                                   <span className="font-bold text-slate-900">{formatINR(tx.amount)}</span>
                                 </div>
                                 <div className="flex justify-between text-[10px] border-b border-slate-50 pb-2">
                                   <span className="text-slate-400 font-bold uppercase">Fees + Tax</span>
                                   <span className="font-bold text-rose-500">-{formatINR(tx.fee + tx.tax)}</span>
                                 </div>
                                 <div className="flex justify-between text-[10px]">
                                   <span className="text-slate-900 font-bold uppercase">Settled Net</span>
                                   <span className="font-bold text-slate-900">{formatINR(tx.netAmount)}</span>
                                 </div>
                               </div>
                               <div className="flex flex-col items-end justify-between">
                                  <div className="text-right">
                                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mb-1">TXID</p>
                                     <p className="font-mono text-[10px] text-slate-500">{tx.paymentId}</p>
                                  </div>
                                  <a href={`https://dashboard.razorpay.com/app/payments/${tx.paymentId}`} target="_blank" className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:underline">
                                     View Core <ExternalLink className="size-3" />
                                  </a>
                               </div>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))}
                 </tbody>
               </table>
             </div>
          </GlassCard>
        </section>
 
        {/* Customers Section */}
        <section id="customers" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-lg font-aktiv font-bold text-slate-900 uppercase tracking-tight">Customer Analytics</h2>
              <p className="text-[10px] font-jakarta font-medium text-slate-400">High-LTV profile streaming</p>
            </div>
          </div>
          
          <GlassCard className="p-0 overflow-hidden">
             <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-[10px] font-aktiv font-bold text-slate-900">Top Strategic Partners</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">Entity</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">LTV</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">System Ratio</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-tight">Activity Log</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {(data?.customers?.customers || []).slice(0, 10).map((c: any, i: number) => (
                         <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                               <p className="text-[11px] font-bold text-slate-900">{c.name}</p>
                               <p className="text-[9px] font-medium text-slate-400">{c.email}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[11px] font-bold text-slate-900">{formatINR(c.totalSpent)}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{c.preferredMethod}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[10px] font-bold text-slate-700">{c.paymentCount} / {c.failedCount} <span className="text-slate-300">ratio</span></p>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                               <p>1st: {c.firstPayment}</p>
                               <p>Recent: {c.lastPayment}</p>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </GlassCard>
        </section>

        {/* --- SECTION 8: FAILURES AND REFUNDS --- */}
        <section id="failures" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-aktiv font-bold text-slate-900 mb-0.5">Failure & Refund Analysis</h2>
              <p className="text-[10px] text-slate-400 font-jakarta font-bold uppercase tracking-widest">Pain points and recovery opportunities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard label="Value at Risk (Failures)" value={formatINR(data?.failed?.totalValueLost || 0)} icon={<AlertCircle className="size-5" />} loading={loading} subtext="Total failed amount" />
            <MetricCard label="Total Refunds" value={data?.refunds?.totalRefunds || 0} icon={<ArrowDownRight className="size-5" />} loading={loading} subtext={`${formatINR(data?.refunds?.totalAmountRefunded || 0)} total value`} />
            <MetricCard label="Never Completed" value={data?.failed?.neverCompleted || 0} icon={<UserX className="size-5" />} loading={loading} subtext="Students who failed and never succeeded" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
               <h3 className="font-aktiv font-extrabold text-gray-800 text-sm mb-6">Failure Reasons</h3>
               <div className="space-y-4">
                  {Object.entries(data?.failed?.byReason || {}).map(([reason, count]: any, idx) => {
                     const percentage = (count / (data?.failed?.total || 1)) * 100;
                     return (
                       <div key={idx} className="group">
                          <div className="flex justify-between text-xs font-bold mb-1">
                             <span className="text-gray-600 capitalize">{reason.replace(/_/g, ' ')}</span>
                             <span className="text-gray-400">{count} occurrences</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-400 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                             </div>
                             <span className="text-[10px] font-extrabold text-gray-400 w-8">{Math.round(percentage)}%</span>
                          </div>
                       </div>
                     );
                  })}
               </div>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden">
               <div className="p-6 border-b border-white/60">
                 <h3 className="font-aktiv font-bold text-slate-900 text-sm">Abandoned (Never Completed)</h3>
               </div>
               <div className="max-h-[300px] overflow-y-auto p-2">
                 {(data?.failed?.abandonedStudents || []).length > 0 ? (
                   <ul className="divide-y divide-white/60">
                     {data?.failed?.abandonedStudents.map((s: any, idx: number) => (
                       <li key={idx} className="flex justify-between items-center p-4 hover:bg-white/40 rounded-xl transition-all">
                         <div>
                           <p className="text-sm font-extrabold text-gray-800 mb-0.5">{s.name || 'Unknown Student'}</p>
                           <p className="text-[10px] font-bold text-gray-400">{s.email}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-extrabold text-red-500 mb-1">{s.failedCount} Attempts</p>
                           <button onClick={() => sendReminder(s.email)} className="bg-pink-100 text-pink-600 px-3 py-1 rounded-lg text-xs font-extrabold hover:bg-pink-200 transition-all flex items-center gap-1">
                             <Mail className="size-3" /> Recover
                           </button>
                         </div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <div className="p-8 text-center text-gray-400 text-sm font-bold">No students in the abandoned list</div>
                 )}
               </div>
            </GlassCard>
          </div>
        </section>

        {/* --- SECTION 9: SETTLEMENTS --- */}
        <section id="settlements" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-aktiv font-bold text-slate-900 mb-0.5">Settlement Cycles</h2>
              <p className="text-[10px] text-slate-400 font-jakarta font-bold uppercase tracking-widest">Bank transfers and payout history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard label="Settled This Week" value={formatINR(data?.settlements?.settledThisWeek || 0)} icon={<Landmark className="size-5" />} loading={loading} />
            <MetricCard label="Settled This Month" value={formatINR(data?.settlements?.settledThisMonth || 0)} icon={<Landmark className="size-5" />} loading={loading} />
            <MetricCard label="Pending for Bank" value={formatINR(data?.settlements?.pendingSettlement || 0)} icon={<Clock className="size-5" />} loading={loading} subtext="Exp. Arrival T+2" />
            <MetricCard label="Total All Time" value={formatINR(data?.settlements?.totalSettled || 0)} icon={<DollarSign className="size-5" />} loading={loading} />
          </div>
        </section>

        {/* --- SECTION 10: TAX --- */}
        <section id="tax" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-aktiv font-bold text-slate-900 mb-0.5">Tax & Compliance</h2>
              <p className="text-[10px] text-slate-400 font-jakarta font-bold uppercase tracking-widest">Financial year summary and fees</p>
            </div>
          </div>
          
          <GlassCard className="p-0 overflow-hidden">
             <div className="p-6 border-b border-white/60">
                <h3 className="font-aktiv font-bold text-slate-900 text-sm">Monthly Breakdown</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50/50">
                      <tr>
                         <th className="px-6 py-4 text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">Month</th>
                         <th className="px-6 py-4 text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">Gross Revenue</th>
                         <th className="px-6 py-4 text-[10px] font-extrabold uppercase text-gray-400 tracking-widest text-red-500">Fees Paid</th>
                         <th className="px-6 py-4 text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">GST on Fees</th>
                         <th className="px-6 py-4 text-[10px] font-extrabold uppercase text-gray-400 tracking-widest text-green-600">Net Received</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/60">
                      {(data?.tax?.monthlyBreakdown || []).map((m: any, i: number) => (
                         <tr key={i} className="hover:bg-white/40">
                            <td className="px-6 py-4 font-extrabold text-xs text-gray-800">{m.month}</td>
                            <td className="px-6 py-4 font-bold text-xs text-gray-600">{formatINR(m.totalGross)}</td>
                            <td className="px-6 py-4 font-bold text-xs text-red-500">{formatINR(m.totalFeesPaid)}</td>
                            <td className="px-6 py-4 font-bold text-xs text-gray-500">{formatINR(m.totalGSTOnFees)}</td>
                            <td className="px-6 py-4 font-extrabold text-xs text-green-600">{formatINR(m.totalNetReceived)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </GlassCard>
        </section>



        {/* --- SECTION 12: DISPUTES --- */}
        <section id="disputes" className="scroll-mt-24">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-aktiv font-bold text-slate-900 mb-0.5">Disputes & Chargebacks</h2>
              <p className="text-[10px] text-slate-400 font-jakarta font-bold uppercase tracking-widest">Customer payment disputes</p>
            </div>
          </div>
          
          <GlassCard>
             {!data?.disputes?.available ? (
                <div className="text-center py-12">
                   <ShieldCheck className="size-12 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-lg font-aktiv font-bold text-slate-900 mb-2">No Dispute Data</h3>
                   <p className="text-sm text-gray-500 font-jakarta font-medium max-w-md mx-auto">
                      Disputes API is either not enabled for your Razorpay merchant account, or you have zero historical disputes. Good job!
                   </p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <MetricCard label="Total Disputes" value={data.disputes.total} icon={<AlertCircle className="size-5" />} />
                   <MetricCard label="Amount Under Dispute" value={formatINR(data.disputes.amountUnderDispute)} icon={<DollarSign className="size-5" />} />
                   <MetricCard label="Win Rate" value={`${data.disputes.winRate}%`} icon={<TrendingUp className="size-5" />} />
                </div>
             )}
          </GlassCard>
        </section>
        
        {/* Export Center */}
        <section id="export" className="scroll-mt-24">
           <GlassCard className="bg-slate-900 text-white p-8">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-2.5 bg-slate-800 rounded-md text-slate-400">
                    <Download className="size-5" />
                 </div>
                 <div>
                    <h3 className="text-sm font-aktiv font-bold uppercase tracking-tight">Intelligence Archive</h3>
                    <p className="text-[10px] font-jakarta font-medium text-slate-400">Download system data snapshots</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 <button onClick={() => exportToCSV(data?.recent || [], 'transactions')} className="px-4 py-2 bg-slate-800 rounded text-[10px] font-bold text-slate-100 hover:bg-slate-700 transition-colors uppercase tracking-tight">TX Ledger</button>
                 <button onClick={() => exportToCSV(data?.tax?.monthlyBreakdown || [], 'tax')} className="px-4 py-2 bg-slate-800 rounded text-[10px] font-bold text-slate-100 hover:bg-slate-700 transition-colors uppercase tracking-tight">Compliance</button>
                 <button onClick={() => exportToCSV(data?.settlements?.settlements || [], 'settlements')} className="px-4 py-2 bg-slate-800 rounded text-[10px] font-bold text-slate-100 hover:bg-slate-700 transition-colors uppercase tracking-tight">Settlements</button>
                 <button onClick={() => exportToCSV(data?.customers?.customers || [], 'customers')} className="px-4 py-2 bg-slate-800 rounded text-[10px] font-bold text-slate-100 hover:bg-slate-700 transition-colors uppercase tracking-tight">LTV Profiles</button>
              </div>
           </GlassCard>
        </section>
      </div>
    </div>
  );
}
