'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { Activity, DollarSign, Users, RefreshCw, ChevronRight, LogOut, Search, MapPin, Smartphone, Chrome, PlayCircle, Eye, MousePointerClick, DownloadCloud, Globe, Instagram, Mail, TrendingUp, Layers, CheckCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const MetaAnalyticsWidget = dynamic(() => import('@/components/dashboard/admin/MetaAnalyticsWidget'), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-[#E1306C] border-t-transparent rounded-full animate-spin" /></div>,
  ssr: false,
});

const StudentManagement = dynamic(() => import('@/components/dashboard/admin/students/StudentManagement'), {
  loading: () => <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-[#FF8A75] border-t-transparent rounded-full animate-spin" /></div>,
  ssr: false,
});

const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#e2e8f0'];

const GA_MOCK_DATA = {
  overview: {
    realtime: 18,
    visitorsToday: 245,
    visitorsWeek: 1890,
    visitorsMonth: 7450,
    newVsReturning: [ { name: 'New', value: 65 }, { name: 'Returning', value: 35 } ]
  },
  location: [
    { city: 'Mumbai', users: 1240 },
    { city: 'Delhi', users: 980 },
    { city: 'Bangalore', users: 850 },
    { city: 'Pune', users: 430 }
  ],
  tech: {
    device: [ { name: 'Mobile', value: 72 }, { name: 'Desktop', value: 25 }, { name: 'Tablet', value: 3 } ],
    browser: [ { name: 'Chrome', value: 68 }, { name: 'Safari', value: 24 }, { name: 'Firefox', value: 8 } ],
    os: [ { name: 'Android', value: 45 }, { name: 'iOS', value: 30 }, { name: 'Windows', value: 20 }, { name: 'Mac', value: 5 } ]
  },
  acquisition: [
    { name: 'Organic Search', value: 3400, trend: '+12%' },
    { name: 'Direct', value: 1800, trend: '+5%' },
    { name: 'Social (IG/FB)', value: 1200, trend: '+24%' },
    { name: 'Email', value: 650, trend: '-2%' },
    { name: 'Referral', value: 400, trend: '+8%' }
  ],
  behavior: {
    avgSessionDuration: '4m 12s',
    pagesPerVisit: 3.2,
    bounceRate: '38%',
    topPages: [
      { path: '/plans/premium', views: 4200, avgTime: '2m 15s' },
      { path: '/about', views: 3100, avgTime: '1m 45s' },
      { path: '/dashboard/student', views: 8900, avgTime: '12m 30s' }
    ]
  },
  events: {
    scrolls: { '25%': 8500, '50%': 6200, '75%': 4100, '100%': 2800 },
    outboundClicks: 1450,
    downloads: 840,
    videoPlays: 3200,
    siteSearches: [ { query: 'glowing skin', count: 145 }, { query: 'double chin', count: 98 }, { query: 'wrinkles', count: 87 } ]
  },
  events_raw: [
    { name: 'page_view', count: 12450 },
    { name: 'session_start', count: 3200 },
    { name: 'user_engagement', count: 2800 },
    { name: 'scroll', count: 8500 },
    { name: 'purchase', count: 145 },
  ],
  customConversions: [
    { name: 'Buy Plan Clicked', count: 450 },
    { name: 'Subscription Purchased', count: 145 },
    { name: 'Contact Form Filled', count: 82 },
  ],
  funnel: [
    { step: 'Visited Pricing', users: 2400 },
    { step: 'Clicked Buy', users: 450 },
    { step: 'Completed Payment', users: 145 }
  ]
};

export default function AdminDashboard() {
  const [data] = useState(GA_MOCK_DATA);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab === 'meta' ? 'meta' : (rawTab === 'students' ? 'students' : 'ecosystem')) as 'ecosystem' | 'meta' | 'students';

  const renderContent = () => {
    switch (activeTab) {
      case 'ecosystem':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Trace */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-8">
               <div className="space-y-1.5">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Traffic Control</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Core ecosystem domain telemetry</p>
               </div>
               <div className="px-5 py-2.5 bg-slate-950 text-white rounded-lg flex items-center gap-4 border border-slate-800 shadow-2xl">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{data.overview.realtime} Active Now</span>
               </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
               <StatCard title="Total Visitors" value={data.overview.visitorsToday.toString()} icon={<Users className="w-4 h-4" />} />
               <StatCard title="Weekly Velocity" value={data.overview.visitorsWeek.toString()} icon={<TrendingUp className="w-4 h-4" />} />
               <StatCard title="Bounce Rate" value={data.behavior.bounceRate} icon={<RefreshCw className="w-4 h-4" />} />
               <StatCard title="Avg Session" value={data.behavior.avgSessionDuration} icon={<Clock className="w-4 h-4" />} />
            </div>

            {/* Channels & Geos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Channel Attribution</h3>
                  <div className="space-y-6">
                     {data.acquisition.map(src => (
                        <div key={src.name} className="space-y-2.5">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-700">
                              <span>{src.name}</span>
                              <span className="text-slate-900">{src.value}</span>
                           </div>
                           <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-900" style={{ width: `${(src.value / 3400) * 100}%` }} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm lg:col-span-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Regional Pulse</h3>
                  <div className="flex h-[220px] items-end justify-between px-6">
                     {data.location.map((loc) => (
                       <div key={loc.city} className="flex-1 flex flex-col items-center justify-end px-3">
                         <div className="w-full bg-slate-900 rounded-t-sm transition-all hover:bg-[#FF8A75] opacity-90" style={{ height: `${(loc.users / 1240) * 100}%` }} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 truncate w-full text-center">{loc.city}</span>
                       </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        );
      case 'meta':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-end justify-between border-b border-slate-100 pb-8">
                <div className="space-y-1.5">
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Social Intelligence</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Meta advertising Performance & Spend Tracking</p>
                </div>
             </div>
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <MetaAnalyticsWidget />
             </div>
          </div>
        );
      case 'students':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-end justify-between border-b border-slate-100 pb-8">
                <div className="space-y-1.5">
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Student Directory</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Comprehensive scannable student ledger</p>
                </div>
             </div>
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <StudentManagement />
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
       {renderContent()}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 flex flex-col gap-10 group hover:bg-slate-50/50 transition-colors cursor-default border-slate-100">
      <div className="flex items-center justify-between">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 group-hover:text-slate-500 transition-colors">{title}</p>
         <div className="text-slate-200 group-hover:text-[#FF8A75] transition-colors">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
         <p className="text-5xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
    </div>
  );
}
