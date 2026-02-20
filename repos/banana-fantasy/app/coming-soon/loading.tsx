export default function ComingSoonLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-8">
        {/* Logo placeholder */}
        <div className="h-16 w-16 bg-white/5 rounded-full animate-pulse mx-auto" />
        {/* Title */}
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse mx-auto" />
        {/* Countdown boxes */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 w-20">
              <div className="h-8 w-12 bg-white/10 rounded animate-pulse mx-auto mb-2" />
              <div className="h-3 w-10 bg-white/10 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
