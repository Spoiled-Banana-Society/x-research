'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useWallets } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/useAuth';
import type { DraftType } from '@/lib/opensea';

interface NftTrait {
  trait_type: string;
  value: string | number;
}

interface NftDetail {
  identifier: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  display_image_url: string | null;
  traits: NftTrait[];
  listing: {
    order_hash: string;
    price: { current: { value: string; decimals: number } };
    protocol_data: { parameters: { offerer: string } };
  } | null;
}

const ROSTER_KEYS = [
  'QB1', 'QB2', 'RB1', 'RB2', 'RB3',
  'WR1', 'WR2', 'WR3',
  'TE1', 'TE2', 'TE3', 'TE4',
  'DST1', 'DST2', 'DST3',
];

const POS_COLORS: Record<string, string> = {
  QB: 'bg-red-500/20 text-red-400 border-red-500/30',
  RB: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  WR: 'bg-green-500/20 text-green-400 border-green-500/30',
  TE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DST: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function getPositionColor(slot: string): string {
  const pos = slot.replace(/[0-9]/g, '');
  return POS_COLORS[pos] || 'bg-bg-tertiary text-text-secondary border-bg-tertiary';
}

function parseTrait(traits: NftTrait[], key: string): string {
  const t = traits.find(t => t.trait_type === key);
  return t ? String(t.value) : '';
}

export default function NftDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tokenId = params.tokenId as string;
  const autoBuy = searchParams.get('buy') === 'true';
  const { isLoggedIn, walletAddress, setShowLoginModal } = useAuth();
  const { wallets, ready: walletsReady } = useWallets();

  const selectedWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    if (walletAddress) {
      return wallets.find(w => w.address.toLowerCase() === walletAddress.toLowerCase()) || wallets[0];
    }
    return wallets[0];
  }, [walletAddress, wallets]);

  const [nft, setNft] = useState<NftDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyStep, setBuyStep] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenId) return;
    setIsLoading(true);
    fetch(`/api/marketplace/nft/${tokenId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        return res.json();
      })
      .then(data => { setNft(data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [tokenId]);

  // Auto-trigger buy flow when navigated with ?buy=true
  const buyTriggered = React.useRef(false);
  useEffect(() => {
    if (autoBuy && nft?.listing && isLoggedIn && !buyTriggered.current && buyStep === 'idle') {
      buyTriggered.current = true;
      // Small delay so user can see the page before the flow starts
      const timer = setTimeout(() => handleBuy(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoBuy, nft, isLoggedIn, buyStep]);

  const handleBuy = useCallback(async () => {
    if (!nft?.listing?.order_hash || !walletAddress) return;
    setBuyStep('processing');
    setTxError(null);
    try {
      const { fulfillListing } = await import('@/lib/marketplace/buy');
      const { ethers } = await import('ethers');
      if (!selectedWallet) throw new Error('No wallet connected');
      const ethereum = await selectedWallet.getEthereumProvider();
      const currentChainHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
      if (parseInt(currentChainHex, 16) !== 8453) {
        await selectedWallet.switchChain(8453);
      }
      const provider = new ethers.BrowserProvider(ethereum);
      await fulfillListing(nft.listing.order_hash, walletAddress, provider);
      setBuyStep('complete');
    } catch (err) {
      console.error('[NFT Detail] Buy failed:', err);
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
      setBuyStep('idle');
    }
  }, [nft, walletAddress, selectedWallet]);

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-bg-tertiary rounded w-40 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-[3/4] bg-bg-tertiary rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-bg-tertiary rounded w-3/4" />
              <div className="h-4 bg-bg-tertiary rounded w-1/2" />
              <div className="h-40 bg-bg-tertiary rounded-2xl" />
              <div className="h-12 bg-bg-tertiary rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🍌</div>
        <h2 className="text-text-primary text-xl font-semibold mb-2">Team Not Found</h2>
        <p className="text-text-secondary text-sm mb-6">{error || 'This team could not be loaded.'}</p>
        <Link href="/marketplace" className="text-banana hover:underline text-sm">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  // Parse traits
  const traits = nft.traits || [];
  const roster = ROSTER_KEYS.map(key => ({
    slot: key,
    value: parseTrait(traits, key),
  })).filter(r => r.value);

  const rank = parseTrait(traits, 'RANK');
  const seasonScore = parseTrait(traits, 'SEASON-SC0RE') || parseTrait(traits, 'SEASON-SCORE');
  const weekScore = parseTrait(traits, 'WEEK-SCORE');
  const leagueName = parseTrait(traits, 'LEAGUE-NAME');
  const level = parseTrait(traits, 'LEVEL');

  const draftType: DraftType = level === 'Jackpot' ? 'jackpot' : level === 'Hall of Fame' ? 'hof' : 'pro';

  // Price from listing
  const listing = nft.listing;
  let price: number | null = null;
  if (listing?.price?.current) {
    const decimals = listing.price.current.decimals ?? 18;
    price = Number(listing.price.current.value) / Math.pow(10, decimals);
  }
  const seller = listing?.protocol_data?.parameters?.offerer;

  const imageUrl = nft.display_image_url || nft.image_url;
  const teamName = leagueName || nft.name || `BBB #${tokenId}`;

  // Group roster by position type
  const qbs = roster.filter(r => r.slot.startsWith('QB'));
  const rbs = roster.filter(r => r.slot.startsWith('RB'));
  const wrs = roster.filter(r => r.slot.startsWith('WR'));
  const tes = roster.filter(r => r.slot.startsWith('TE'));
  const dsts = roster.filter(r => r.slot.startsWith('DST'));

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Card Image */}
        <div>
          <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden border ${
            draftType === 'jackpot' ? 'border-error/40' : draftType === 'hof' ? 'border-hof/40' : 'border-bg-tertiary'
          }`}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={teamName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${
                draftType === 'jackpot' ? 'from-error/20 to-bg-secondary'
                : draftType === 'hof' ? 'from-hof/20 to-bg-secondary'
                : 'from-pro/20 to-bg-secondary'
              } flex items-center justify-center`}>
                <span className="text-8xl">🍌</span>
              </div>
            )}

            {/* Type Badge */}
            {draftType !== 'pro' && (
              <div className="absolute top-4 left-4">
                {draftType === 'jackpot' && (
                  <span className="px-4 py-1.5 bg-error text-white text-xs font-bold uppercase rounded-full shadow-lg">
                    JACKPOT
                  </span>
                )}
                {draftType === 'hof' && (
                  <span className="px-4 py-1.5 bg-gradient-to-r from-hof to-pink-600 text-white text-xs font-bold uppercase rounded-full shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    HALL OF FAME
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div>
          {/* Title */}
          <h1 className="text-2xl font-bold text-text-primary font-mono mb-1">{teamName}</h1>
          <p className="text-text-muted text-sm mb-6">
            Token #{tokenId}
            {seller && (
              <> &middot; Owner: {seller.slice(0, 6)}...{seller.slice(-4)}</>
            )}
          </p>

          {/* Stats Row */}
          {(rank || seasonScore || weekScore) && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {rank && rank !== 'N/A' && (
                <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 text-center">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Rank</p>
                  <p className="font-mono text-xl font-bold text-banana">#{rank}</p>
                </div>
              )}
              {seasonScore && (
                <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 text-center">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Season Pts</p>
                  <p className="font-mono text-xl font-bold text-text-primary">
                    {parseFloat(seasonScore).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                </div>
              )}
              {weekScore && (
                <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 text-center">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Week Score</p>
                  <p className="font-mono text-xl font-bold text-success">
                    {parseFloat(weekScore).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Full Roster */}
          {roster.length > 0 && (
            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 mb-6">
              <h3 className="text-text-primary font-semibold text-sm mb-4">Full Roster</h3>
              <div className="space-y-4">
                {[
                  { label: 'Quarterbacks', items: qbs },
                  { label: 'Running Backs', items: rbs },
                  { label: 'Wide Receivers', items: wrs },
                  { label: 'Tight Ends', items: tes },
                  { label: 'Defense', items: dsts },
                ].filter(g => g.items.length > 0).map(group => (
                  <div key={group.label}>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider mb-2">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(r => (
                        <div
                          key={r.slot}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${getPositionColor(r.slot)}`}
                        >
                          {r.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Buy */}
          {price !== null ? (
            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs mb-1">Current Price</p>
                  <p className="text-text-primary font-mono text-3xl font-bold">
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {buyStep === 'complete' ? (
                  <div className="flex items-center gap-2 text-success font-semibold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Purchased!
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { setShowLoginModal(true); return; }
                      handleBuy();
                    }}
                    disabled={buyStep === 'processing' || !walletsReady || !selectedWallet}
                    className="px-8 py-3 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyStep === 'processing' ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Buy Now'}
                  </button>
                )}
              </div>

              {txError && (
                <p className="text-error text-xs mt-3">{txError}</p>
              )}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 text-center">
              <p className="text-text-muted text-sm">This team is not currently listed for sale.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
