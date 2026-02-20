export default function DraftLobbyLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-9 w-24 bg-yellow-500/20 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
