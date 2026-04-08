'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Users, Instagram, CreditCard, Activity, DollarSign, LogOut, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#1a1a1a', '#FF8A75', '#94a3b8', '#e2e8f0'];

const DUMMY_FIN_DATA = {
  totalRevenue: '₹ 4,52,000',
  newRevenueThisMonth: '₹ 68,000',
  activeSubscriptions: 145,
  newStudentsThisMonth: 12,
  renewalRate: '88%',
  chartData: [
    { name: 'Jan', revenue: 42000 },
    { name: 'Feb', revenue: 38000 },
    { name: 'Mar', revenue: 52000 },
    { name: 'Apr', revenue: 68000 },
    { name: 'May', revenue: 49000 },
    { name: 'Jun', revenue: 60000 },
  ],
  recentTransactions: [
    { id: 'pay_ABC1', amount: '₹ 4,000', email: 'student1@example.com', date: '2 hrs ago', status: 'captured' },
    { id: 'pay_ABC2', amount: '₹ 15,000', email: 'user99@face.com', date: '5 hrs ago', status: 'captured' },
    { id: 'pay_ABC3', amount: '₹ 4,000', email: 'hello@yoga.com', date: '1 day ago', status: 'failed' },
    { id: 'pay_ABC4', amount: '₹ 8,500', email: 'zenith@beauty.com', date: '1 day ago', status: 'captured' },
  ]
};

const DUMMY_TRAFFIC_DATA = {
  totalVisitors30d: 4890,
  activeUsersNow: 15,
  avgSessionDuration: '3m 12s',
  bounceRate: '42%',
  trafficSources: [
    { name: 'Direct', value: 1200 },
    { name: 'Organic Search', value: 2400 },
    { name: 'Social (IG)', value: 900 },
    { name: 'Referral', value: 390 },
  ]
};

const DUMMY_SOCIAL_DATA = {
  followersCount: '12.4K',
  followerGrowth30d: '+420',
  totalReach30d: '45,000',
  profileViews30d: '1,200',
  pixelData: {
    checkoutsInitiated: 89,
    purchasesConverted: 12,
  }
};

export default function AdminDashboard() {
  const [finData] = useState(DUMMY_FIN_DATA);
  const [trafficData] = useState(DUMMY_TRAFFIC_DATA);
  const [socialData] = useState(DUMMY_SOCIAL_DATA);

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-[#FF8A75]/20 selection:text-[#FF8A75] font-sans antialiased text-slate-900">
      {/* ultra-compact Professional Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 h-11 flex items-center justify-between">
         <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 flex items-center justify-center rounded bg-[#1a1a1a] text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7.5a4.5 4.5 0 1 1 3.183-7.682"/><path d="M12 7.5a4.5 4.5 0 1 0-3.183-7.682"/><path d="M12 7.5V22"/><path d="m12 11.5 5.5-2.5"/><path d="m12 11.5-5.5-2.5"/><path d="m12 16.5 5.5-2.5"/><path d="m12 16.5-5.5-2.5"/></svg>
            </div>
            <span className="text-[11px] font-bold tracking-tight text-slate-800">
               Faceyoguez <span className="text-slate-400 font-normal ml-1">Admin</span>
            </span>
         </div>
         <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100/50">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Live</span>
           </div>
           <form action="/auth/logout" method="post">
             <button type="submit" className="text-slate-400 hover:text-slate-900 transition-colors">
                <LogOut className="h-4 w-4" />
             </button>
           </form>
         </div>
      </header>

      {/* Main Content Area - High Density Professional Data Layout */}
      <div className="p-4 md:p-5 max-w-[1280px] mx-auto space-y-4">
        
        {/* Compact Dashboard Toolbar */}
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Activity className="h-3 w-3" />
              Intelligence Dashboard
           </div>
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 border border-slate-200 rounded hover:bg-white transition-colors">
                 <RefreshCw className="h-3 w-3" /> Sync Data
              </button>
              <button className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-white bg-slate-900 rounded hover:bg-black transition-colors">
                 Generate Report
              </button>
           </div>
        </div>

        {/* High-Density Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
           <StatCard title="Total Revenue" value={finData.totalRevenue} trend="+12.4%" icon={<DollarSign className="text-slate-400" />} />
           <StatCard title="Active Students" value={finData.activeSubscriptions.toString()} trend="+8.1%" icon={<Users className="text-slate-400" />} />
           <StatCard title="Total Visitors" value={trafficData.totalVisitors30d.toLocaleString()} trend="+4.2%" icon={<Activity className="text-slate-400" />} />
           <StatCard title="IG Audience" value={socialData.followersCount} trend="+22%" icon={<Instagram className="text-slate-400" />} />
        </div>

        {/* Charts & Analytical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Revenue Performance Chart */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue Forecast</h3>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Growth Curve</span>
                </div>
             </div>
             <div className="h-52 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={finData.chartData}>
                   <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.05}/>
                       <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} dy={8} />
                   <YAxis axisLine={false} tickLine={false} hide />
                   <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', padding: '6px', fontSize: '10px', boxShadow: 'none' }} />
                   <Area type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Acquisition Breakdown */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-md p-4 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">User Acquisition</h3>
             <div className="flex-1 min-h-[140px] mb-2">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trafficData.trafficSources} innerRadius={42} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '9px' }} />
                  </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-auto border-t border-slate-50 pt-3">
                {trafficData.trafficSources.map((source, i) => (
                  <div key={source.name} className="flex items-center gap-1.5 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-medium text-slate-500 truncate">{source.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Dense Data Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Detailed Activity Log Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
             <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</p>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 group cursor-pointer hover:text-slate-900 transition-colors">
                  Full History <ChevronRight className="h-2.5 w-2.5" />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                         <th className="px-4 py-2 font-black">Transaction ID</th>
                         <th className="px-4 py-2 font-black">Account Email</th>
                         <th className="px-4 py-2 font-black">Timestamp</th>
                         <th className="px-4 py-2 font-black text-right">Amount</th>
                         <th className="px-4 py-2 font-black text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {finData.recentTransactions.map((tx) => (
                         <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group text-[11px]">
                            <td className="px-4 py-2 font-mono text-slate-400 group-hover:text-slate-600 transition-colors">{tx.id.replace('pay_', '#')}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{tx.email}</td>
                            <td className="px-4 py-2 text-slate-400 font-medium">{tx.date}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-900">{tx.amount}</td>
                            <td className="px-4 py-2 text-center">
                               <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${tx.status === 'captured' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                  {tx.status}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Social Influence Card */}
          <div className="lg:col-span-4 bg-[#1a1a1a] rounded-md p-4 text-white flex flex-col justify-between shadow-sm">
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Social Context</p>
                <div className="space-y-4">
                   <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
                      <span className="text-[9px] uppercase tracking-widest text-slate-500">Reach Efficiency</span>
                      <span className="text-lg font-bold">{socialData.totalReach30d}</span>
                   </div>
                   <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
                      <span className="text-[9px] uppercase tracking-widest text-slate-500">Organic Growth</span>
                      <span className="text-lg font-bold text-emerald-400">{socialData.followerGrowth30d}</span>
                   </div>
                   <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[9px] uppercase tracking-widest text-slate-500">Pixel Conversions</span>
                      <span className="text-lg font-bold text-[#FF8A75]">{socialData.pixelData.purchasesConverted}</span>
                   </div>
                </div>
             </div>
             <button className="mt-8 w-full py-1.5 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                Open Meta Controller
             </button>
          </div>

        </div>

      </div>

      <footer className="py-4 border-t border-slate-200 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
         Operational Infrastructure Alpha v1.4 • Faceyoguez Intellectual Prop.
      </footer>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-3 rounded-md border border-slate-200 hover:border-slate-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-1.5 mb-1.5 grayscale opacity-50">
         {icon}
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className="flex items-baseline justify-between gap-1">
         <p className="text-lg font-bold text-slate-900 tracking-tight">{value}</p>
         <span className="text-[9px] font-bold text-emerald-600">{trend}</span>
      </div>
    </div>
  );
}
