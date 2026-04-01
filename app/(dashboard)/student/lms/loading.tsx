export default function LmsLoading() {
  return (
    <div className="p-6 lg:p-10 space-y-10 min-h-screen animate-pulse">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 py-12">
        <div className="h-6 w-28 rounded-full bg-primary/10" />
        <div className="h-14 w-64 rounded-2xl bg-foreground/5" />
        <div className="h-4 w-80 rounded-full bg-foreground/5" />
      </div>
      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:px-12">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-[2.5rem] bg-white/60 border border-primary/5 h-80" />
        ))}
      </div>
    </div>
  );
}
