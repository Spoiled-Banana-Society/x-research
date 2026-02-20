export default function RankingsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-44 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="flex gap-3 mb-6">
          {['QB', 'RB', 'WR', 'TE', 'DST'].map((pos) => (
            <div key={pos} className="h-9 w-16 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-white/5 rounded-xl overflow-x-auto">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-white/5">
              <div className="h-4 w-6 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse ml-auto" />
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
