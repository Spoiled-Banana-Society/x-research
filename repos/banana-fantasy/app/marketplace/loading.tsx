export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded animate-pulse mb-8" />
        {/* Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
              <div className="h-48 bg-white/10 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-28 bg-white/10 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
