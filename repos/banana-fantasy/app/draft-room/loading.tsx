export default function DraftRoomLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-4">
      {/* Top bar: timer + round info */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-yellow-500/20 rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
      </div>
      {/* Main draft area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Player list */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          {/* Tab bar */}
          <div className="flex gap-2 mb-4">
            {['Draft', 'Queue', 'Board', 'Roster'].map((tab) => (
              <div key={tab} className="h-9 w-20 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
          {/* Player rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Sidebar: pick history */}
        <div className="hidden lg:block bg-white/5 rounded-xl p-4 space-y-3">
          <div className="h-5 w-24 bg-white/10 rounded animate-pulse mb-4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <div className="h-4 w-6 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-12 bg-white/10 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
