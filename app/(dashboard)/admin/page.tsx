'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { Activity, DollarSign, Users, RefreshCw, ChevronRight, LogOut, Search, MapPin, Smartphone, Chrome, PlayCircle, Eye, MousePointerClick, DownloadCloud, Globe, Instagram, Mail, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

const MetaAnalyticsWidget = dynamic(() => import('@/components/dashboard/admin/MetaAnalyticsWidget'), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-[#E1306C] border-t-transparent rounded-full animate-spin" /></div>,
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab === 'meta' ? 'meta' : (rawTab === 'razorpay' ? 'razorpay' : 'google')) as 'google' | 'razorpay' | 'meta';

  // Redirect to dedicated razorpay page if tab is set to razorpay
  useEffect(() => {
    if (rawTab === 'razorpay') {
      router.push('/admin/razorpay-analytics');
    }
  }, [rawTab, router]);

  const renderContent = () => {
    switch (activeTab) {
      case 'google':
        return (
          <div className="space-y-6">
            {/* Global Overview Row */}
            <section>
              <div className="flex items-end justify-between mb-4">
                 <div>
                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Traffic Control</h2>
                    <p className="text-[10px] font-medium text-slate-400">Core ecosystem dynamics</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard title="Realtime Active" value={data.overview.realtime.toString()} icon={<Activity className="text-emerald-500" />} trend="Live" highlight />
                <StatCard title="Visitors Today" value={data.overview.visitorsToday.toString()} icon={<Users />} />
                <StatCard title="Weekly Velocity" value={data.overview.visitorsWeek.toString()} icon={<TrendingUp />} />
                <StatCard title="Bounce Rate" value={data.behavior.bounceRate} icon={<RefreshCw />} />
                <StatCard title="Avg Session" value={data.behavior.avgSessionDuration} icon={<Search />} />
              </div>
            </section>

            {/* User Context & Tech Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Acquisition */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe className="w-3 h-3"/> Traffic Sources</h3>
                 <div className="space-y-3">
                    {data.acquisition.map(src => (
                       <div key={src.name} className="flex flex-col gap-1">
                         <div className="flex justify-between items-center">
                            <span className="text-[11px] font-semibold text-slate-700">{src.name}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1 rounded">{src.trend}</span>
                               <span className="text-xs font-bold text-slate-900">{src.value}</span>
                            </div>
                         </div>
                         <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-300" style={{ width: `${(src.value / 3400) * 100}%` }} />
                         </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Geography */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-3 h-3"/> Top Cities</h3>
                 <div className="flex h-[180px] w-full items-end gap-2">
                    {data.location.map((loc, i) => (
                      <div key={loc.city} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                        <span className="text-xs font-bold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">{loc.users}</span>
                        <div className="w-full bg-slate-900 rounded-t-sm transition-all opacity-80 group-hover:opacity-100" style={{ height: `${(loc.users / 1240) * 100}%` }}></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest rotate-[-45deg] origin-top-left mt-2">{loc.city}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Device & Browser */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Smartphone className="w-3 h-3"/> Tech Stack</h3>
                 
                 <div className="space-y-4">
                   <div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                         <span>Mobile / Desktop</span>
                         <span>{data.tech.device[0].value}% / {data.tech.device[1].value}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                         <div className="h-full bg-slate-900" style={{ width: `${data.tech.device[0].value}%` }} />
                         <div className="h-full bg-slate-300" style={{ width: `${data.tech.device[1].value}%` }} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Browser</span>
                        {data.tech.browser.map(b => (
                          <div key={b.name} className="flex justify-between text-[11px] font-semibold text-slate-700 py-0.5">
                            <span>{b.name}</span><span>{b.value}%</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">OS</span>
                        {data.tech.os.slice(0,3).map(o => (
                          <div key={o.name} className="flex justify-between text-[11px] font-semibold text-slate-700 py-0.5">
                            <span>{o.name}</span><span>{o.value}%</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 </div>
              </div>

            </div>

            {/* Deep Engagement Metrics */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
               <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  
                  <div className="p-5">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers className="w-3 h-3"/> Scroll Depth</h3>
                     <div className="space-y-2">
                       {Object.entries(data.events.scrolls).map(([depth, count]) => (
                         <div key={depth} className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{depth} Down</span>
                            <span className="text-xs font-semibold text-slate-500">{count} views</span>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="p-5">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><PlayCircle className="w-3 h-3"/> Engagement</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-slate-700">
                           <span className="flex items-center gap-2 text-xs"><PlayCircle className="w-3.5 h-3.5 text-slate-400"/> Video Plays</span>
                           <span className="font-bold">{data.events.videoPlays}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                           <span className="flex items-center gap-2 text-xs"><DownloadCloud className="w-3.5 h-3.5 text-slate-400"/> PDF Downloads</span>
                           <span className="font-bold">{data.events.downloads}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                           <span className="flex items-center gap-2 text-xs"><MousePointerClick className="w-3.5 h-3.5 text-slate-400"/> Outbound Clicks</span>
                           <span className="font-bold">{data.events.outboundClicks}</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-5 md:col-span-2">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Search className="w-3 h-3"/> Top Site Searches</h3>
                     <div className="flex flex-wrap gap-2">
                        {data.events.siteSearches.map(s => (
                           <div key={s.query} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-2">
                              <span className="text-xs text-slate-700 font-medium">"{s.query}"</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-full">{s.count}</span>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>
            </section>
          </div>
        );
      case 'razorpay':
        return null; // Redirected via useEffect
      case 'meta':
        return <MetaAnalyticsWidget />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden min-w-0 pb-20">
         {/* Top bar */}
         <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-12 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2">
               <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Telemetry Connected
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold text-slate-600 bg-white border border-slate-200 rounded uppercase tracking-tight hover:bg-slate-50 transition-colors shadow-sm">
               <RefreshCw className="h-3 w-3" /> Re-Sync
            </button>
         </header>

         {/* Extracted Component Render */}
         <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
            {renderContent()}
         </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend, highlight = false }: { title: string, value: string, icon: React.ReactNode, trend?: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border transition-colors shadow-sm ${highlight ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
         <div className="scale-75 origin-left">{icon}</div>
         <p className={`text-[9px] font-bold uppercase tracking-widest ${highlight ? 'text-slate-300' : 'text-slate-400'}`}>{title}</p>
      </div>
      <div className="flex items-baseline justify-between gap-1">
         <p className="text-2xl font-black tracking-tight">{value}</p>
         {trend && <span className={`text-[10px] font-black uppercase tracking-wider ${highlight ? 'text-emerald-400' : 'text-emerald-500'}`}>{trend}</span>}
      </div>
    </div>
  );
}
