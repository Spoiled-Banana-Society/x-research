export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="h-4 w-80 bg-white/5 rounded animate-pulse mb-8" />
        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 space-y-4">
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded-lg animate-pulse mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
