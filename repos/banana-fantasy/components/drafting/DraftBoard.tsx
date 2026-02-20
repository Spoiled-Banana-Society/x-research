'use client';

import React from 'react';
import { getPositionColor, DRAFT_PLAYERS, TOTAL_ROUNDS } from '@/lib/draftRoomConstants';
import type { DraftType, RoomPhase, Pick } from '@/lib/draftRoomConstants';

interface DraftBoardProps {
  displayOrder: typeof DRAFT_PLAYERS;
  activeDraftOrder: typeof DRAFT_PLAYERS;
  phase: RoomPhase;
  playerCount: number;
  currentOverallPick: number;
  currentRound: number;
  picks: Pick[];
  isYourTurn: boolean;
  draftType: DraftType | null;
  getCurrentDrafterIndex: () => number;
  getPositionCounts: (playerId: string) => { QB: number; RB: number; WR: number; TE: number };
  onShowPicker: () => void;
  user?: { profilePicture?: string; username?: string } | null;
}

export function DraftBoard({
  displayOrder,
  activeDraftOrder,
  phase,
  playerCount,
  currentOverallPick,
  currentRound,
  picks,
  isYourTurn,
  getCurrentDrafterIndex,
  getPositionCounts,
  onShowPicker,
  user,
}: DraftBoardProps) {
  const getPickForCell = (round: number, drafterIdx: number) => {
    const pickPos = round % 2 === 1 ? drafterIdx : 9 - drafterIdx;
    return picks.find(p => p.round === round && p.playerId === activeDraftOrder[pickPos]?.id);
  };

  const isCurrentCell = (round: number, drafterIdx: number) => {
    if (phase !== 'drafting') return false;
    if (round !== currentRound) return false;
    return drafterIdx === getCurrentDrafterIndex();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        {/* Header row with players */}
        <div className="flex sticky top-0 z-20 bg-black/40 backdrop-blur-sm">
          <div className="w-12 flex-shrink-0" />
          {displayOrder.map((player, idx) => {
            const counts = getPositionCounts(player.id);
            const isCurrentDrafter = phase === 'drafting' && idx === getCurrentDrafterIndex() && currentOverallPick <= 110;
            const isJoined = idx < playerCount;
            const showAllNames = phase !== 'filling';
            return (
              <div
                key={player.id}
                className={`w-32 flex-shrink-0 p-1.5 text-center border-b border-r border-white/5 transition-all duration-300 ${
                  isCurrentDrafter ? 'bg-yellow-500/20' : ''
                } ${player.isYou ? 'bg-yellow-500/10 ring-2 ring-yellow-500/30 ring-inset border-t-2 border-t-banana' : ''} ${!isJoined ? 'opacity-30' : ''}`}
              >
                {phase === 'filling' ? (
                  <div className="flex flex-col items-center justify-center h-14">
                    {isJoined ? (
                      <>
                        {player.isYou && user?.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.profilePicture} alt={user?.username || 'You'} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="text-3xl leading-none">{player.avatar}</div>
                        )}
                        <div className={`text-[10px] font-bold mt-1 truncate max-w-[90%] ${player.isYou ? 'text-yellow-400' : 'text-white/40'}`}>
                          {player.isYou ? (user?.username || 'You') : ''}
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl text-white/20">🍌</div>
                    )}
                  </div>
                ) : (
                  <>
                    {player.isYou && user?.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profilePicture} alt="You" className="w-7 h-7 rounded-full object-cover mx-auto mb-1" />
                    ) : (
                      <div className="text-2xl mb-1">{isJoined ? player.avatar : ''}</div>
                    )}
                    <div className={`text-xs font-bold truncate ${player.isYou ? 'text-yellow-400' : 'text-white/60'}`}>
                      {player.isYou && isJoined ? 'You' : showAllNames && isJoined ? player.name : ''}
                    </div>
                    {phase === 'drafting' && (
                      <div className="flex justify-center gap-1 mt-1">
                        <span className="text-[10px] text-rose-400">{counts.QB}</span>
                        <span className="text-[10px] text-sky-400">{counts.RB}</span>
                        <span className="text-[10px] text-emerald-400">{counts.WR}</span>
                        <span className="text-[10px] text-orange-400">{counts.TE}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Draft board rows */}
        {Array.from({ length: TOTAL_ROUNDS }, (_, roundIdx) => {
          const round = roundIdx + 1;
          return (
            <div key={round} className="flex">
              <div className="w-12 flex-shrink-0 flex items-center justify-center text-white/30 text-xs font-medium bg-black/20 border-r border-white/5">
                {round}
              </div>
              {displayOrder.map((player, drafterIdx) => {
                const pick = getPickForCell(round, drafterIdx);
                const isCurrent = isCurrentCell(round, drafterIdx);
                const posColor = pick ? getPositionColor(pick.selection.position) : null;
                const isJoined = drafterIdx < playerCount;
                return (
                  <div
                    key={`${round}-${drafterIdx}`}
                    className={`w-32 h-20 flex-shrink-0 p-1 border-b border-r border-white/5 transition-all ${
                      isCurrent ? 'bg-yellow-500/20 ring-2 ring-yellow-500 ring-inset' : ''
                    } ${player.isYou ? 'bg-yellow-500/5' : ''} ${!isJoined ? 'opacity-30' : ''}`}
                  >
                    {pick ? (
                      <div className={`h-full rounded-lg p-2 ${posColor?.light} relative overflow-hidden`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${posColor?.bg}`} />
                        <div className="pl-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-lg">{pick.selection.team}</span>
                            <span className="text-xs text-white/40">{pick.overallPick}</span>
                          </div>
                          <div className={`text-xs font-medium ${posColor?.text}`}>{pick.selection.position}</div>
                          <div className="text-[10px] text-white/40 mt-1">ADP {pick.selection.adp}</div>
                        </div>
                      </div>
                    ) : isCurrent ? (
                      <button
                        onClick={() => isYourTurn && onShowPicker()}
                        className={`h-full w-full rounded-lg border-2 border-dashed flex items-center justify-center ${
                          isYourTurn ? 'border-yellow-500/50 hover:bg-yellow-500/10 cursor-pointer' : 'border-white/20'
                        }`}
                      >
                        {isYourTurn ? (
                          <span className="text-yellow-400 text-xs font-medium">PICK</span>
                        ) : (
                          <span className="text-white/30 text-xs">...</span>
                        )}
                      </button>
                    ) : (
                      <div className="h-full rounded-lg bg-white/[0.02]" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
