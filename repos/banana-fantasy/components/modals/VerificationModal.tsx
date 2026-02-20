'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: 'draft-type' | 'draft-order' | 'full-draft';
  draftId?: string;
  draftType?: 'jackpot' | 'hof' | 'pro';
}

export function VerificationModal({
  isOpen,
  onClose,
  verificationType,
  draftId = '#4523',
  draftType = 'pro',
}: VerificationModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'technical'>('summary');

  // Mock verification data
  const mockData = {
    txHash: '0x8a3f92b4c1d7e6f8a9b0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3', // DEMO_DATA
    blockNumber: 19847523,
    chainId: 8453,
    timestamp: Date.now() - 180000,
    vrfRequestId: '0x1234...5678',
    vrfProof: '0xabcd...ef01',
    seed: '0x3d8f7a2b1c0e9d8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3', // DEMO_DATA
    randomWords: ['47892134', '19283746', '58371649'],
    draftPosition: 7,
    draftTypeResult: draftType,
  };

  const typeColors = {
    jackpot: 'text-red-400',
    hof: 'text-yellow-400',
    pro: 'text-purple-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Verification Proof</h2>
            <p className="text-white/50 text-sm">Draft {draftId} • Chainlink VRF</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="flex-1">
            <p className="text-green-400 font-semibold text-sm">Cryptographically Verified</p>
            <p className="text-white/50 text-xs">This result was generated using verifiable randomness</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'summary' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'technical' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Technical
          </button>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            {verificationType === 'draft-type' && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Draft Type Result</p>
                <p className={`text-2xl font-bold ${typeColors[draftType]}`}>
                  {draftType === 'jackpot' ? 'JACKPOT' : draftType === 'hof' ? 'HALL OF FAME' : 'PRO'}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Assigned via VRF from guaranteed distribution pool
                </p>
              </div>
            )}

            {verificationType === 'draft-order' && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Your Pick Position</p>
                <p className="text-2xl font-bold text-yellow-400">#{mockData.draftPosition}</p>
                <p className="text-white/40 text-xs mt-1">
                  Randomly assigned when draft filled 10/10
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/50 text-xs mb-1">Chain</p>
                <p className="text-white font-medium text-sm">Base</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/50 text-xs mb-1">Block</p>
                <p className="text-white font-medium text-sm font-mono">{mockData.blockNumber.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">Transaction Hash</p>
              <p className="text-white font-mono text-xs break-all">{mockData.txHash}</p>
            </div>

            <a
              href={`https://basescan.org/tx/${mockData.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-sm"
            >
              View on Basescan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* Technical Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">VRF Request ID</p>
              <p className="text-white font-mono text-xs break-all">{mockData.vrfRequestId}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">Random Seed</p>
              <p className="text-white font-mono text-xs break-all">{mockData.seed}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">VRF Proof</p>
              <p className="text-white font-mono text-xs break-all">{mockData.vrfProof}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-2">Random Words (Raw Output)</p>
              <div className="flex flex-wrap gap-2">
                {mockData.randomWords.map((word, i) => (
                  <span key={i} className="px-2 py-1 bg-white/10 rounded text-white font-mono text-xs">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-400 font-medium text-xs mb-1">How to Verify</p>
              <p className="text-white/60 text-xs">
                The VRF proof can be cryptographically verified using Chainlink&apos;s VRF coordinator contract.
                The random words, combined with the seed, deterministically produce the result shown above.
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://basescan.org/tx/${mockData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-xs"
              >
                View TX
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <a
                href="https://docs.chain.link/vrf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-xs"
              >
                Learn VRF
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
