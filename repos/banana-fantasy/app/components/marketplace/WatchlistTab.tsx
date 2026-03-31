'use client';

import Image from 'next/image';
import type { MarketplaceTeam } from '@/lib/opensea';

interface WatchlistItem {
  id: string;
  tokenId: string;
  lastKnownPrice: number | null;
  addedAt: string;
}

interface WatchlistTabProps {
  watchlist: WatchlistItem[];
  watchlistSet: Set<string>;
  deduplicatedTeams: MarketplaceTeam[];
  onBrowseTeams: () => void;
  onViewTeam: (tokenId: string) => void;
  onToggleWatchlist: (tokenId: string, price?: number | null) => void;
  onOpenBuyModal: (team: MarketplaceTeam) => void;
  onViewAllTeams: () => void;
}

export function WatchlistTab({
  watchlist,
  watchlistSet,
  deduplicatedTeams,
  onBrowseTeams,
  onViewTeam,
  onToggleWatchlist,
  onOpenBuyModal,
  onViewAllTeams,
}: WatchlistTabProps) {
  if (watchlist.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-6 bg-bg-secondary rounded-full flex items-center justify-center border border-bg-tertiary">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-text-primary font-semibold text-lg mb-2">No teams watchlisted yet</h3>
        <p className="text-text-secondary text-sm mb-6">Tap the heart icon on any team card to add it to your watchlist.</p>
        <button
          onClick={onBrowseTeams}
          className="px-6 py-3 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all text-sm"
        >
          Browse Teams
        </button>
      </div>
    );
  }

  const visibleWatchlistTeams = deduplicatedTeams.filter(team => watchlistSet.has(team.tokenId));
  const unloadedWatchlistCount = watchlist.filter(item => !deduplicatedTeams.some(team => team.tokenId === item.tokenId)).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {visibleWatchlistTeams.map(team => (
        <div
          key={`wl-${team.id}-${team.orderHash}`}
          onClick={() => onViewTeam(team.tokenId)}
          className={`bg-bg-secondary border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${team.isJackpot ? 'border-error/30 hover:shadow-error/20' : team.isHof ? 'border-hof/30 hover:shadow-hof/20' : 'border-bg-tertiary hover:border-bg-elevated'}`}
        >
          <div className="relative h-80 bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
            {team.imageUrl ? (
              <Image src={team.imageUrl} alt={team.name} width={230} height={300} className="rounded-2xl shadow-lg" />
            ) : (
              <div className="flex items-center justify-center">
                <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id={`wlGrad-${team.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="160" height="100" rx="12" fill={`url(#wlGrad-${team.id})`} />
                  <circle cx="0" cy="50" r="10" fill="#1a1a2e" />
                  <circle cx="160" cy="50" r="10" fill="#1a1a2e" />
                  <text x="80" y="55" textAnchor="middle" fill="#1C1C1E" fontSize="13" fontWeight="bold" fontFamily="system-ui">Banana Best Ball IV</text>
                </svg>
              </div>
            )}
            <button
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onToggleWatchlist(team.tokenId, team.price);
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-text-primary font-mono mb-1">{team.name}</h3>
            <div className="flex items-center justify-between mt-3">
              <div>
                {team.price != null ? (
                  <p className="text-text-primary font-mono text-lg font-bold">${team.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                ) : (
                  <p className="text-text-muted text-xs">Not listed</p>
                )}
              </div>
              {team.price != null && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenBuyModal(team);
                  }}
                  className="px-6 py-2.5 bg-banana text-black text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {unloadedWatchlistCount > 0 && (
        <div className="col-span-full text-center py-6">
          <p className="text-text-muted text-sm">
            {unloadedWatchlistCount} watchlisted teams not currently loaded.
            <button onClick={onViewAllTeams} className="text-banana hover:underline ml-1">View All Teams</button>
          </p>
        </div>
      )}
    </div>
  );
}
