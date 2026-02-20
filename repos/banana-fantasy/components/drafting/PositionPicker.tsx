'use client';

import React, { useState } from 'react';
import { getPositionColor } from '@/lib/draftRoomConstants';
import type { Pick } from '@/lib/draftRoomConstants';

interface PositionPickerProps {
  availablePositions: { id: string; team: string; position: string; adp: number }[];
  currentOverallPick: number;
  currentRound: number;
  pickTimer: number;
  formatTime: (seconds: number) => string;
  onPick: (position: { id: string; team: string; position: string; adp: number }) => void;
  onClose: () => void;
}

export function PositionPicker({
  availablePositions,
  currentOverallPick,
  currentRound,
  pickTimer,
  formatTime,
  onPick,
  onClose,
}: PositionPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Select Position</h2>
            <p className="text-white/50 text-sm">Pick {currentOverallPick} • Round {currentRound}</p>
          </div>
          <div className={`text-2xl font-bold ${pickTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
            {formatTime(pickTimer)}
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {availablePositions.map(pos => {
              const color = getPositionColor(pos.position);
              const isSelected = selectedPosition === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => setSelectedPosition(isSelected ? null : pos.id)}
                  className={`p-3 rounded-xl text-left transition-all relative ${
                    isSelected ? 'bg-yellow-500/20 ring-2 ring-yellow-500' : `${color.light} hover:ring-1 hover:ring-white/20`
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${color.bg}`} />
                  <div className="pl-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xl">{pos.team}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color.light} ${color.text}`}>{pos.position}</span>
                    </div>
                    <div className="text-white/40 text-xs mt-1">ADP: {pos.adp}</div>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              const pos = availablePositions.find(p => p.id === selectedPosition);
              if (pos) onPick(pos);
            }}
            disabled={!selectedPosition}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              selectedPosition ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {selectedPosition
              ? `Draft ${availablePositions.find(p => p.id === selectedPosition)?.team} ${availablePositions.find(p => p.id === selectedPosition)?.position}`
              : 'Select a Position'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Suppress unused import warning - Pick type is exported for consumers
void (undefined as unknown as Pick);
