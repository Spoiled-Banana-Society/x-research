export default function BuyDraftsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse mb-2 mx-auto" />
        <div className="h-4 w-72 bg-white/5 rounded animate-pulse mb-8 mx-auto" />
        {/* Price card */}
        <div className="bg-white/5 rounded-2xl p-8 mb-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-12 w-12 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-12 w-12 bg-white/10 rounded-lg animate-pulse" />
          </div>
          {/* Total */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between">
              <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          {/* Payment buttons */}
          <div className="space-y-3 pt-2">
            <div className="h-12 w-full bg-yellow-500/20 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
