export default function GroupSessionLoading() {
  return (
    <div className="p-6 lg:p-10 space-y-8 min-h-screen animate-pulse">
      <div className="h-8 w-48 rounded-2xl bg-foreground/5" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white/60 border border-primary/5 h-80" />
        <div className="rounded-3xl bg-white/60 border border-primary/5 h-80" />
      </div>
    </div>
  );
}
