'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSendTransaction, useWallets, useFundWallet } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/useAuth';
import { useNftOffers, logActivity, notifySeller, notifyOwnerOfOffer } from '@/hooks/useMarketplace';
import { useNotifications } from '@/components/NotificationCenter';
import { BASE_SEPOLIA, getUsdcBalance } from '@/lib/contracts/bbb4';
import type { Address } from 'viem';
import type { DraftType, OfferData } from '@/lib/opensea';

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
  owner: string | null;
  ownerName: string | null;
  ownerPfp: string | null;
  listing: {
    order_hash: string;
    protocol_address: string;
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

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NftDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tokenId = params.tokenId as string;
  const autoBuy = searchParams.get('buy') === 'true';
  const autoOffer = searchParams.get('offer') === 'true';
  const { isLoggedIn, walletAddress, setShowLoginModal } = useAuth();
  const { wallets, ready: walletsReady } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const { fundWallet } = useFundWallet();
  const { addNotification } = useNotifications();

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

  // Offer state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerExpiration, setOfferExpiration] = useState(7);
  const [offerStep, setOfferStep] = useState<'input' | 'processing' | 'complete'>('input');
  const [offerError, setOfferError] = useState<string | null>(null);

  // Accept offer state
  const [acceptingOfferHash, setAcceptingOfferHash] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Cancel offer state
  const [cancellingOfferHash, setCancellingOfferHash] = useState<string | null>(null);

  // Offers data
  const { offers, isLoading: offersLoading, refetch: refetchOffers, bestOffer } = useNftOffers(tokenId);

  const fetchNft = useCallback(() => {
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

  useEffect(() => {
    fetchNft();
  }, [fetchNft]);

  // Auto-trigger buy flow when navigated with ?buy=true
  const buyTriggered = React.useRef(false);
  useEffect(() => {
    if (autoBuy && nft?.listing && isLoggedIn && !buyTriggered.current && buyStep === 'idle') {
      buyTriggered.current = true;
      const timer = setTimeout(() => handleBuy(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoBuy, nft, isLoggedIn, buyStep]);

  // Auto-open offer modal when navigated with ?offer=true
  const offerTriggered = React.useRef(false);
  useEffect(() => {
    if (autoOffer && nft && isLoggedIn && !offerTriggered.current) {
      offerTriggered.current = true;
      setShowOfferModal(true);
    }
  }, [autoOffer, nft, isLoggedIn]);

  const handleBuy = useCallback(async () => {
    if (!nft?.listing?.order_hash || !nft?.listing?.protocol_address || !walletAddress) return;
    setBuyStep('processing');
    setTxError(null);

    const buyPrice = nft.listing?.price?.current
      ? Number(nft.listing.price.current.value) / Math.pow(10, nft.listing.price.current.decimals ?? 18)
      : null;

    try {
      // Check balance first
      if (buyPrice && buyPrice > 0) {
        const { checkUsdcBalance } = await import('@/lib/marketplace/buy');
        const { sufficient, balance } = await checkUsdcBalance(walletAddress, buyPrice);
        if (!sufficient) {
          setTxError(`Insufficient balance. You have $${balance.toFixed(2)} but need $${buyPrice.toFixed(2)}.`);
          setBuyStep('idle');
          return;
        }
      }

      const { getFulfillmentTx } = await import('@/lib/marketplace/buy');
      const tx = await getFulfillmentTx(
        nft.listing.order_hash,
        walletAddress,
        nft.listing.protocol_address,
      );
      const receipt = await sendTransaction(
        { to: tx.to, value: BigInt(tx.value), data: tx.data as `0x${string}`, chainId: 8453 },
        { sponsor: true },
      );
      const txHashResult = (receipt as Record<string, unknown>).transactionHash ?? (receipt as Record<string, unknown>).hash;
      setBuyStep('complete');

      const sellerAddr = nft.listing?.protocol_data?.parameters?.offerer || nft.owner;
      if (sellerAddr) {
        notifySeller({
          sellerWallet: sellerAddr,
          tokenId,
          teamName: nft.name || `BBB #${tokenId}`,
          price: buyPrice || 0,
          buyerWallet: walletAddress,
        });
      }

      logActivity({
        type: 'buy',
        walletAddress,
        tokenId,
        teamName: nft.name || `BBB #${tokenId}`,
        price: buyPrice,
        counterparty: nft.listing?.protocol_data?.parameters?.offerer || null,
        orderHash: nft.listing?.order_hash || null,
        txHash: txHashResult ? String(txHashResult) : null,
      });

      // Log seller-side activity
      if (sellerAddr) {
        logActivity({
          type: 'sell',
          walletAddress: sellerAddr,
          tokenId,
          teamName: nft.name || `BBB #${tokenId}`,
          price: buyPrice,
          counterparty: walletAddress,
          orderHash: nft.listing?.order_hash || null,
          txHash: txHashResult ? String(txHashResult) : null,
        });
      }

      addNotification({
        type: 'purchase_complete',
        title: 'Purchase Complete',
        message: `You bought ${nft.name || `BBB #${tokenId}`} for $${(buyPrice || 0).toFixed(2)}`,
        link: `/marketplace/${tokenId}`,
      });

      setTimeout(() => fetchNft(), 2000);
    } catch (err) {
      console.error('[NFT Detail] Buy failed:', err);
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
      setBuyStep('idle');
    }
  }, [nft, walletAddress, sendTransaction, tokenId, fetchNft]);

  const handleMakeOffer = useCallback(async () => {
    if (!walletAddress || !selectedWallet || !offerAmount) return;
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      setOfferError('Enter a valid offer amount');
      return;
    }

    setOfferStep('processing');
    setOfferError(null);

    try {
      const { createOffer } = await import('@/lib/marketplace/offer');
      const { ethers } = await import('ethers');

      const ethereum = await selectedWallet.getEthereumProvider();
      const currentChainHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
      if (parseInt(currentChainHex, 16) !== 8453) {
        await selectedWallet.switchChain(8453);
      }

      // Sponsor USDC approval for the conduit if needed
      const OPENSEA_CONDUIT = '0x1e0049783f008a0085193e00003d00cd54003c71';
      const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const iface = new ethers.Interface([
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
      ]);

      // Check current allowance
      const checkData = iface.encodeFunctionData('allowance', [walletAddress, OPENSEA_CONDUIT]);
      const checkRes = await fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_call',
          params: [{ to: USDC_BASE, data: checkData }, 'latest'],
        }),
      });
      const checkResult = await checkRes.json();
      const currentAllowance = BigInt(checkResult?.result || '0x0');
      const requiredAmount = ethers.parseUnits(amount.toString(), 6);

      if (currentAllowance < requiredAmount) {
        // Approve max USDC for the conduit (sponsored)
        const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        const approvalData = iface.encodeFunctionData('approve', [OPENSEA_CONDUIT, maxApproval]);
        await sendTransaction(
          { to: USDC_BASE as `0x${string}`, data: approvalData as `0x${string}`, chainId: 8453 },
          { sponsor: true, uiOptions: { description: 'Approve USDC for offers — no cost to you' } },
        );
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const result = await createOffer(
        tokenId,
        amount,
        walletAddress,
        provider,
        offerExpiration,
      );

      console.log('[NFT Detail] Offer created:', result.orderHash);

      // Notify the NFT owner that they received an offer
      const ownerAddr = nft?.owner || nft?.listing?.protocol_data?.parameters?.offerer;
      if (ownerAddr && walletAddress) {
        notifyOwnerOfOffer({
          ownerWallet: ownerAddr,
          tokenId,
          teamName: nft?.name || `BBB #${tokenId}`,
          offerAmount: amount,
          offererWallet: walletAddress,
        });
      }

      logActivity({
        type: 'offer_made',
        walletAddress,
        tokenId,
        teamName: nft?.name || `BBB #${tokenId}`,
        price: amount,
        counterparty: ownerAddr || null,
      });

      setOfferStep('complete');
      refetchOffers();
    } catch (err) {
      console.error('[NFT Detail] Offer failed:', err);
      setOfferError(err instanceof Error ? err.message : 'Failed to create offer');
      setOfferStep('input');
    }
  }, [walletAddress, selectedWallet, offerAmount, offerExpiration, tokenId, sendTransaction, refetchOffers, nft]);

  const handleAcceptOffer = useCallback(async (offer: OfferData) => {
    if (!walletAddress || !selectedWallet) return;
    setAcceptingOfferHash(offer.orderHash);
    setAcceptError(null);

    try {
      const { getOfferFulfillmentTx } = await import('@/lib/marketplace/offer');
      const { ethers } = await import('ethers');
      const { BBB4_CONTRACT } = await import('@/lib/opensea');

      const ethereum = await selectedWallet.getEthereumProvider();
      const currentChainHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
      if (parseInt(currentChainHex, 16) !== 8453) {
        await selectedWallet.switchChain(8453);
      }

      // Check NFT approval for conduit
      const OPENSEA_CONDUIT = '0x1e0049783f008a0085193e00003d00cd54003c71';
      const iface = new ethers.Interface([
        'function isApprovedForAll(address owner, address operator) view returns (bool)',
        'function setApprovalForAll(address operator, bool approved)',
      ]);

      const checkData = iface.encodeFunctionData('isApprovedForAll', [walletAddress, OPENSEA_CONDUIT]);
      const checkRes = await fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_call',
          params: [{ to: BBB4_CONTRACT, data: checkData }, 'latest'],
        }),
      });
      const checkResult = await checkRes.json();
      const isApproved = checkResult?.result && parseInt(checkResult.result, 16) === 1;

      if (!isApproved) {
        const approvalData = iface.encodeFunctionData('setApprovalForAll', [OPENSEA_CONDUIT, true]);
        await sendTransaction(
          { to: BBB4_CONTRACT as `0x${string}`, data: approvalData as `0x${string}`, chainId: 8453 },
          { sponsor: true, uiOptions: { description: 'Approve marketplace — no cost to you' } },
        );
      }

      const tx = await getOfferFulfillmentTx(
        offer.orderHash,
        walletAddress,
        offer.protocolAddress,
        tokenId,
      );

      await sendTransaction(
        { to: tx.to, value: BigInt(tx.value), data: tx.data as `0x${string}`, chainId: 8453 },
        { sponsor: true, uiOptions: { description: 'Accept offer — gas fees covered by SBS' } },
      );

      console.log('[NFT Detail] Offer accepted:', offer.orderHash);

      logActivity({
        type: 'offer_accepted',
        walletAddress,
        tokenId,
        teamName: nft?.name || `BBB #${tokenId}`,
        price: offer.amount,
        counterparty: offer.offererAddress || null,
        orderHash: offer.orderHash || null,
      });

      refetchOffers();
      setTimeout(() => fetchNft(), 2000);
    } catch (err) {
      console.error('[NFT Detail] Accept offer failed:', err);
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setAcceptingOfferHash(null);
    }
  }, [walletAddress, selectedWallet, tokenId, sendTransaction, refetchOffers, nft, fetchNft]);

  const handleCancelOffer = useCallback(async (offer: OfferData) => {
    if (!walletAddress) return;
    setCancellingOfferHash(offer.orderHash);
    setAcceptError(null);

    try {
      const res = await fetch('/api/marketplace/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderHash: offer.orderHash, type: 'offer' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to cancel offer' }));
        throw new Error(errData.error || `Cancel failed: ${res.status}`);
      }

      const tx = await res.json();

      await sendTransaction(
        { to: tx.to as `0x${string}`, data: tx.data as `0x${string}`, chainId: 8453 },
        { sponsor: true, uiOptions: { description: 'Cancel your offer — fees covered by SBS' } },
      );

      console.log('[NFT Detail] Cancelled offer:', offer.orderHash);

      logActivity({
        type: 'cancel',
        walletAddress,
        tokenId,
        teamName: nft?.name || `BBB #${tokenId}`,
        price: offer.amount,
        orderHash: offer.orderHash || null,
      });

      refetchOffers();
    } catch (err) {
      console.error('[NFT Detail] Cancel offer failed:', err);
      setAcceptError(err instanceof Error ? err.message : 'Failed to cancel offer');
    } finally {
      setCancellingOfferHash(null);
    }
  }, [walletAddress, sendTransaction, refetchOffers, tokenId, nft]);

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
  const nftOwner = nft.owner || seller;
  const isOwner = walletAddress && nftOwner && walletAddress.toLowerCase() === nftOwner.toLowerCase();

  const imageUrl = nft.display_image_url || nft.image_url;
  const teamName = leagueName || nft.name || `BBB #${tokenId}`;

  // Group roster by position type
  const qbs = roster.filter(r => r.slot.startsWith('QB'));
  const rbs = roster.filter(r => r.slot.startsWith('RB'));
  const wrs = roster.filter(r => r.slot.startsWith('WR'));
  const tes = roster.filter(r => r.slot.startsWith('TE'));
  const dsts = roster.filter(r => r.slot.startsWith('DST'));

  const offerAmountNum = parseFloat(offerAmount) || 0;
  const offerFee = offerAmountNum * 0.01;

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
          <div className="flex items-center gap-2 text-text-muted text-sm mb-6">
            <span>Token #{tokenId}</span>
            {nftOwner && (
              <>
                <span>&middot;</span>
                {nft.ownerPfp ? (
                  <Image src={nft.ownerPfp} alt="" width={20} height={20} className="rounded-full" />
                ) : null}
                <span>
                  Owner: {nft.ownerName || `${nftOwner.slice(0, 6)}...${nftOwner.slice(-4)}`}
                </span>
              </>
            )}
          </div>

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

          {/* Price & Buy / Make Offer */}
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 mb-6">
            {price !== null ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-xs mb-1">Current Price</p>
                    <p className="text-text-primary font-mono text-3xl font-bold">
                      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {buyStep === 'complete' ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-success font-semibold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Yours!
                      </div>
                      <Link href="/marketplace?tab=sell" className="text-banana text-xs hover:underline">
                        View My Teams
                      </Link>
                    </div>
                  ) : !isOwner ? (
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
                  ) : null}
                </div>

                {txError && (
                  <p className="text-error text-xs mt-3">{txError}</p>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-text-muted text-sm">This team is not currently listed for sale.</p>
                {bestOffer && (
                  <p className="text-text-secondary text-xs mt-1">
                    Best offer: <span className="text-banana font-mono font-semibold">${bestOffer.amount.toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Make Offer button — shown to non-owners */}
            {!isOwner && buyStep !== 'complete' && (
              <button
                onClick={() => {
                  if (!isLoggedIn) { setShowLoginModal(true); return; }
                  setShowOfferModal(true);
                  setOfferStep('input');
                  setOfferAmount('');
                  setOfferError(null);
                }}
                className="w-full mt-3 py-3 border border-banana text-banana font-semibold rounded-xl hover:bg-banana/10 transition-all text-sm"
              >
                Make Offer
              </button>
            )}
          </div>

          {/* Offers Section */}
          {(offers.length > 0 || offersLoading) && (
            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-semibold text-sm">
                  Offers {offers.length > 0 && <span className="text-text-muted font-normal">({offers.length})</span>}
                </h3>
                {bestOffer && (
                  <span className="text-xs text-text-muted">
                    Best: <span className="text-banana font-mono font-semibold">${bestOffer.amount.toFixed(2)}</span>
                  </span>
                )}
              </div>

              {offersLoading && offers.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-12 bg-bg-tertiary rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {offers.map((offer, i) => {
                    const isMyOffer = walletAddress && offer.offererAddress?.toLowerCase() === walletAddress.toLowerCase();
                    return (
                      <div
                        key={offer.orderHash}
                        className={`flex items-center justify-between p-3 rounded-xl ${
                          isMyOffer ? 'bg-pro/5 border border-pro/20'
                          : i === 0 ? 'bg-banana/5 border border-banana/20'
                          : 'bg-bg-primary border border-bg-tertiary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {offer.offererPfp ? (
                            <Image src={offer.offererPfp} alt="" width={28} height={28} className="rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center">
                              <span className="text-[10px]">🍌</span>
                            </div>
                          )}
                          <div>
                            <p className="text-text-primary text-sm font-medium font-mono">
                              ${offer.amount.toFixed(2)}
                              {isMyOffer && <span className="text-pro text-[10px] ml-1.5 font-semibold">YOUR OFFER</span>}
                              {!isMyOffer && i === 0 && <span className="text-banana text-[10px] ml-1.5 font-semibold">BEST</span>}
                            </p>
                            <p className="text-text-muted text-[11px]">
                              by {offer.offererName} &middot; {timeUntil(offer.expiresAt)} left
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMyOffer && (
                            <button
                              onClick={() => handleCancelOffer(offer)}
                              disabled={cancellingOfferHash === offer.orderHash}
                              className="px-3 py-1.5 border border-red-500/40 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                            >
                              {cancellingOfferHash === offer.orderHash ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                          {isOwner && !isMyOffer && (
                            <button
                              onClick={() => handleAcceptOffer(offer)}
                              disabled={acceptingOfferHash === offer.orderHash}
                              className="px-4 py-1.5 bg-success text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                            >
                              {acceptingOfferHash === offer.orderHash ? 'Accepting...' : 'Accept'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {acceptError && (
                <p className="text-error text-xs mt-3">{acceptError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => offerStep === 'input' && setShowOfferModal(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {offerStep === 'input' && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
                  <h2 className="text-lg font-semibold text-text-primary">Make Offer</h2>
                  <button
                    onClick={() => setShowOfferModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {/* Team Preview */}
                  <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl mb-6">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={teamName} width={56} height={56} className="rounded-xl object-cover" />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                        draftType === 'jackpot' ? 'from-error/40 to-error/20'
                        : draftType === 'hof' ? 'from-hof/40 to-hof/20'
                        : 'from-pro/40 to-pro/20'
                      } flex items-center justify-center`}>
                        <span className="text-2xl">🍌</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-text-primary font-semibold font-mono">{teamName}</h3>
                      <p className="text-text-muted text-xs">Token #{tokenId}</p>
                    </div>
                  </div>

                  {/* Offer Amount */}
                  <div className="mb-4">
                    <label className="block text-text-secondary text-sm mb-2">Your Offer (USDC)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg font-mono">$</span>
                      <input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full bg-bg-primary border border-bg-tertiary rounded-xl pl-8 pr-4 py-3 text-text-primary font-mono text-lg placeholder:text-text-muted/50 focus:outline-none focus:border-banana"
                      />
                    </div>
                    {price && offerAmountNum > 0 && offerAmountNum >= price && (
                      <p className="text-warning text-xs mt-1.5">Your offer is at or above the listing price. Consider using Buy Now instead.</p>
                    )}
                  </div>

                  {/* Expiration */}
                  <div className="mb-4">
                    <label className="block text-text-secondary text-sm mb-2">Offer Expires In</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '1 day', value: 1 },
                        { label: '3 days', value: 3 },
                        { label: '7 days', value: 7 },
                        { label: '30 days', value: 30 },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setOfferExpiration(opt.value)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                            offerExpiration === opt.value
                              ? 'border-banana bg-banana/10 text-banana'
                              : 'border-bg-tertiary text-text-secondary hover:border-bg-elevated'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {offerAmountNum > 0 && (
                    <div className="p-4 bg-bg-primary rounded-xl space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Offer Amount</span>
                        <span className="text-text-primary font-mono">${offerAmountNum.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">OpenSea Fee (1%)</span>
                        <span className="text-text-primary font-mono">${offerFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-bg-tertiary font-semibold">
                        <span className="text-text-primary">Total USDC Required</span>
                        <span className="text-text-primary font-mono">${offerAmountNum.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {offerError && (
                    <div className="p-3 bg-error/10 border border-error/30 rounded-xl mb-4">
                      <p className="text-error text-sm">{offerError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleMakeOffer}
                    disabled={!offerAmount || offerAmountNum <= 0}
                    className="w-full py-4 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Offer
                  </button>
                  <p className="text-center text-text-muted text-xs mt-3">
                    Your USDC will be held in escrow until the offer is accepted or expires.
                  </p>
                </div>
              </>
            )}

            {offerStep === 'processing' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-bg-tertiary rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-banana rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">
                  Creating Offer
                </h3>
                <p className="text-text-secondary text-sm">
                  Signing your offer on Base...
                </p>
              </div>
            )}

            {offerStep === 'complete' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">Offer Submitted!</h3>
                <p className="text-text-secondary text-sm mb-6">
                  Your ${offerAmountNum.toFixed(2)} offer on {teamName} is live.
                </p>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="px-8 py-3 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
