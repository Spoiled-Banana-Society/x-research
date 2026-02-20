'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { getPositionColorHex, positionFromPlayerId } from '@/lib/draftRoomConstants';
import type { PlayerData } from '@/lib/draftRoomConstants';

interface DraftQueueProps {
  queuedPlayers: PlayerData[];
  availablePlayers: PlayerData[];
  isUserTurn: boolean;
  onDraft: (playerId: string) => void;
  onRemoveFromQueue: (playerId: string) => void;
  onReorderQueue: (newOrder: PlayerData[]) => void;
}

export function DraftQueue({
  queuedPlayers,
  availablePlayers,
  isUserTurn,
  onDraft,
  onRemoveFromQueue,
  onReorderQueue,
}: DraftQueueProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...queuedPlayers];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    onReorderQueue(items);
  };

  // Filter out players that have already been drafted
  const activeQueue = queuedPlayers.filter(p =>
    availablePlayers.some(a => a.playerId === p.playerId)
  );

  if (activeQueue.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">&#x1F34C;</div>
          <p className="font-primary text-white/40 text-sm">Nothing here but us apes!</p>
          <p className="text-white/20 text-xs mt-1">Queue players from the Draft section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {activeQueue.map((player, index) => {
                const hexColor = getPositionColorHex(player.position);
                const basePos = positionFromPlayerId(player.playerId);
                const expanded = expandedPlayer === player.playerId;

                return (
                  <Draggable key={player.playerId} draggableId={player.playerId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="w-[900px] max-w-full mx-auto"
                      >
                        {/* Player row */}
                        <div
                          onClick={() => setExpandedPlayer(expanded ? null : player.playerId)}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/5 ${
                            snapshot.isDragging ? 'bg-white/10 shadow-lg' : 'bg-black'
                          }`}
                          style={{
                            borderLeft: `2px solid ${hexColor}`,
                            borderRight: `2px solid ${hexColor}`,
                            borderTop: '1px solid #222',
                            borderBottom: '1px solid #222',
                          }}
                        >
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="flex-shrink-0 text-white/30 cursor-grab active:cursor-grabbing select-none"
                            style={{ fontSize: '14px', lineHeight: 1 }}
                          >
                            &#x2807;
                          </div>

                          {/* Queue number */}
                          <span className="text-banana text-xs font-bold w-5 flex-shrink-0 text-center">
                            {index + 1}
                          </span>

                          {/* Banana icon - filled when queued */}
                          <span className="text-lg flex-shrink-0">&#x1F34C;</span>

                          {/* Player ID with full position color background + BYE below */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-bold px-2 py-0.5 flex-shrink-0"
                                style={{ backgroundColor: hexColor, color: '#000' }}
                              >
                                {basePos}
                              </span>
                              <span className="font-primary font-bold text-white text-sm truncate">
                                {player.playerId}
                              </span>
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5 ml-0.5">
                              BYE {player.byeWeek}
                            </div>
                          </div>

                          {/* ADP + RANK right-aligned */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-[11px] text-white/30 uppercase leading-none">ADP</div>
                              <div className="text-[13px] font-bold text-white">{player.adp || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] text-white/30 uppercase leading-none">RANK</div>
                              <div className="text-[13px] font-bold text-white">{player.rank || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {expanded && (
                          <div
                            className="bg-black/80 px-4 py-3"
                            style={{
                              borderLeft: `2px solid ${hexColor}`,
                              borderRight: `2px solid ${hexColor}`,
                              borderBottom: '1px solid #222',
                            }}
                          >
                            {/* Players from team */}
                            <div className="mb-3 text-center">
                              <span className="text-[11px] uppercase text-white/40 tracking-wider font-bold">
                                Players from team
                              </span>
                              <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                                {player.playersFromTeam.map((name, i) => (
                                  <span key={i} className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Draft / Unqueue buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  if (isUserTurn) {
                                    onDraft(player.playerId);
                                    setExpandedPlayer(null);
                                  }
                                }}
                                disabled={!isUserTurn}
                                className={`font-primary flex-1 py-2 text-sm font-bold uppercase transition-all ${
                                  isUserTurn
                                    ? 'bg-[#F3E216] text-black hover:bg-banana-light'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                              >
                                Draft
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onRemoveFromQueue(player.playerId);
                                  setExpandedPlayer(null);
                                }}
                                className="font-primary flex-1 py-2 text-sm font-bold uppercase bg-[#F3E216] text-black hover:bg-banana-light transition-all"
                              >
                                Unqueue
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
