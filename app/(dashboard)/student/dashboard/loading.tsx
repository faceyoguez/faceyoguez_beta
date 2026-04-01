export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="h-5 w-32 rounded-full bg-primary/10" />
          <div className="h-10 w-64 rounded-2xl bg-foreground/5" />
          <div className="h-4 w-48 rounded-full bg-foreground/5" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-foreground/5" />
          <div className="h-12 w-12 rounded-full bg-foreground/5" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-3xl p-8 bg-white/60 border border-primary/5 h-32" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-3xl p-8 bg-white/60 border border-primary/5 h-64" />
          <div className="rounded-3xl p-8 bg-white/40 border border-primary/5 h-40" />
        </div>
        <div className="lg:col-span-4">
          <div className="rounded-3xl p-8 bg-white/60 border border-primary/5 h-full min-h-[400px]" />
        </div>
      </div>
    </div>
  );
}
