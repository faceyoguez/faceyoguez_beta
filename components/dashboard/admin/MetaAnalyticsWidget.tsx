'use client';

import { useState, useEffect } from 'react';
import { Instagram, Users, Eye, MousePointerClick, ShoppingCart, TrendingUp, Heart, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';

interface MetaData {
  followers: {
    followers_count?: number;
    media_count?: number;
    profile_views?: number;
  } | null;
  insights: any;
  posts: {
    data?: Array<{
      id: string;
      caption?: string;
      timestamp: string;
      like_count?: number;
      comments_count?: number;
      insights?: { data?: Array<{ name: string; values: Array<{ value: number }> }> };
    }>;
  } | null;
  conversions: {
    data?: Array<{
      value: number;
      type: string;
    }>;
  } | null;
}

export default function MetaAnalyticsWidget() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/meta-analytics');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
        <Instagram className="w-12 h-12 text-slate-200 mb-4" />
        <h3 className="text-sm font-bold text-slate-700 mb-1">Telemetry Offline</h3>
        <p className="text-[10px] max-w-sm font-medium">
          Add your Meta API credentials to .env.local to activate social telemetry.
        </p>
      </div>
    );
  }

  // Safely extract data values
  const followers = data.followers?.followers_count ?? 0;
  const profileViews = data.followers?.profile_views ?? 0;
  const mediaCount = data.followers?.media_count ?? 0;

  // Sum reach from daily insights
  let reachTotal = 0;
  if (data.insights?.data) {
    const reachMetric = data.insights.data.find((m: any) => m.name === 'reach');
    if (reachMetric?.values) {
      reachTotal = reachMetric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
    }
  }

  // Extract conversion events
  const getEventCount = (eventName: string) => {
    if (!data.conversions?.data) return 0;
    const event = data.conversions.data.find((e: any) => e.type === eventName);
    return event?.value ?? 0;
  };

  const pageViews = getEventCount('PageView');
  const viewContent = getEventCount('ViewContent');
  const initiateCheckout = getEventCount('InitiateCheckout');
  const purchase = getEventCount('Purchase');

  // Recent posts
  const recentPosts = data.posts?.data?.slice(0, 5) || [];

  // Funnel steps
  const funnelSteps = [
    { label: 'Site Entry', count: pageViews, color: 'bg-slate-50 text-slate-600 border border-slate-100' },
    { label: 'Pricing Load', count: viewContent, color: 'bg-slate-100 text-slate-700 border border-slate-200' },
    { label: 'Checkout Start', count: initiateCheckout, color: 'bg-slate-200 text-slate-800 border border-slate-300' },
    { label: 'Final Purchase', count: purchase, color: 'bg-slate-900 text-white' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <Instagram className="w-6 h-6 text-slate-900" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Meta Analytics</h1>
          <p className="text-xs text-slate-400">Social reach and pixel conversion vectors.</p>
        </div>
      </div>

      {/* SECTION 1 — Instagram Overview */}
      <section>
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Instagram className="w-3 h-3" /> Instagram Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<Users />} title="Followers" value={followers.toLocaleString()} />
          <MetricCard icon={<Eye />} title="Profile Views" value={profileViews.toLocaleString()} />
          <MetricCard icon={<TrendingUp />} title="Reach (7d)" value={reachTotal.toLocaleString()} />
          <MetricCard icon={<Instagram />} title="Total Posts" value={mediaCount.toLocaleString()} />
        </div>
      </section>

      {/* SECTION 2 — Pixel Events */}
      <section>
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <MousePointerClick className="w-3 h-3" /> Website Events (Pixel)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<Eye />} title="Page Views" value={pageViews.toLocaleString()} highlight />
          <MetricCard icon={<MousePointerClick />} title="Pricing Views" value={viewContent.toLocaleString()} />
          <MetricCard icon={<ShoppingCart />} title="Checkouts Started" value={initiateCheckout.toLocaleString()} />
          <MetricCard icon={<TrendingUp />} title="Purchases" value={purchase.toLocaleString()} accent />
        </div>
      </section>

      {/* SECTION 3 — Conversion Funnel */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Conversion Funnel (7 Days)
        </h2>
        <div className="flex items-center gap-2">
          {funnelSteps.map((step, idx) => {
            const dropOff = idx > 0 && funnelSteps[idx - 1].count > 0
              ? Math.round((1 - step.count / funnelSteps[idx - 1].count) * 100)
              : 0;
            return (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className={`flex-1 rounded-lg p-3 text-center ${step.color}`}>
                  <p className="text-lg font-black">{step.count.toLocaleString()}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest mt-1">{step.label}</p>
                </div>
                {idx < funnelSteps.length - 1 && (
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    {dropOff > 0 && (
                      <span className="text-[8px] font-bold text-red-400">-{dropOff}%</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — Recent Posts */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Recent Posts Performance
        </h2>
        {recentPosts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No posts data available yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const postReach = post.insights?.data?.find((d) => d.name === 'reach')?.values?.[0]?.value ?? 0;
              const postDate = new Date(post.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Kolkata',
              });
              return (
                <div key={post.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 truncate">
                      {post.caption ? post.caption.substring(0, 60) + (post.caption.length > 60 ? '...' : '') : 'No caption'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{postDate}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <span className="font-bold">{post.like_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <MessageCircle className="w-3 h-3 text-blue-400" />
                      <span className="font-bold">{post.comments_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span className="font-bold">{postReach}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon, title, value, highlight = false, accent = false }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`p-4 rounded border transition-colors shadow-sm ${
      accent || highlight ? 'bg-slate-900 border-slate-800 text-white' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="scale-75 origin-left text-slate-400">{icon}</div>
        <p className={`text-[9px] font-bold uppercase tracking-widest ${
          accent || highlight ? 'text-slate-400' : 'text-slate-400'
        }`}>{title}</p>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
