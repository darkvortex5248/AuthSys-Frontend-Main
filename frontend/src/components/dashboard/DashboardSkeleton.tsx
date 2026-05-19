export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card rounded-xl h-28 bg-white/[0.02] border-white/5"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 glass-card rounded-xl h-[360px] bg-white/[0.02]" />
        <div className="lg:col-span-4 glass-card rounded-xl h-[360px] bg-white/[0.02]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl h-48 bg-white/[0.02]" />
        ))}
      </div>
    </div>
  );
}
