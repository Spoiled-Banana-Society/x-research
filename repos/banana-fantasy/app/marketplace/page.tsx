'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock BBB teams for marketplace - these are drafted teams as tradeable digital assets
const mockListedTeams = [
  {
    id: '0021',
    name: 'BBB #0021',
    draftType: 'jackpot' as const,
    isHof: true,
    isJackpot: true,
    rank: 1,
    points: 1847.5,
    weeklyAvg: 142.1,
    playoffOdds: 98.2,
    price: 21000,
    owner: '0x7a3...f9e2',
    roster: ['KC QB', 'DAL WR1', 'MIA WR1', 'SF RB1', 'PHI TE1'],
    color: 'from-error to-red-700',
  },
  {
    id: '0847',
    name: 'BBB #0847',
    draftType: 'hof' as const,
    isHof: true,
    isJackpot: false,
    rank: 3,
    points: 1723.2,
    weeklyAvg: 132.6,
    playoffOdds: 89.4,
    price: 5900,
    owner: '0x3b2...a8c1',
    roster: ['BUF QB', 'CIN WR1', 'SEA WR2', 'DET RB1', 'LV TE1'],
    color: 'from-jackpot to-purple-700',
  },
  {
    id: '1203',
    name: 'BBB #1203',
    draftType: 'jackpot' as const,
    isHof: false,
    isJackpot: true,
    rank: 7,
    points: 1654.8,
    weeklyAvg: 127.3,
    playoffOdds: 76.1,
    price: 4400,
    owner: '0x9f1...c4d7',
    roster: ['LAC QB', 'GB WR1', 'ARI WR1', 'BAL RB1', 'KC TE1'],
    color: 'from-success to-emerald-600',
  },
  {
    id: '0562',
    name: 'BBB #0562',
    draftType: 'pro' as const,
    isHof: false,
    isJackpot: false,
    rank: 12,
    points: 1589.3,
    weeklyAvg: 122.3,
    playoffOdds: 61.8,
    price: 2300,
    owner: '0x2e5...b3f8',
    roster: ['NYJ QB', 'MIN WR1', 'TB WR1', 'NYG RB1', 'DAL TE1'],
    color: 'from-pro to-blue-600',
  },
  {
    id: '0934',
    name: 'BBB #0934',
    draftType: 'pro' as const,
    isHof: false,
    isJackpot: false,
    rank: 24,
    points: 1498.7,
    weeklyAvg: 115.3,
    playoffOdds: 42.5,
    price: 1600,
    owner: '0x5c8...e2a9',
    roster: ['IND QB', 'DEN WR1', 'JAX WR2', 'CLE RB1', 'CHI TE1'],
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    id: '1547',
    name: 'BBB #1547',
    draftType: 'pro' as const,
    isHof: false,
    isJackpot: false,
    rank: 31,
    points: 1421.2,
    weeklyAvg: 109.3,
    playoffOdds: 28.3,
    price: 1000,
    owner: '0x8d4...f1c6',
    roster: ['TEN QB', 'NE WR1', 'CAR WR1', 'ATL RB1', 'HOU TE1'],
    color: 'from-purple-500 to-purple-600',
  },
];

// Mock user's teams (for selling)
const mockMyTeams = [
  {
    id: '2341',
    name: 'BBB #2341',
    draftType: 'pro' as const,
    isHof: false,
    isJackpot: false,
    rank: 45,
    points: 1324.6,
    weeklyAvg: 101.9,
    playoffOdds: 18.2,
    price: null as number | null, // Not listed
    owner: 'You',
    roster: ['WAS QB', 'HOU WR1', 'LV WR1', 'PIT RB1', 'NYJ TE1'],
    color: 'from-slate-500 to-slate-600',
  },
  {
    id: '1892',
    name: 'BBB #1892',
    draftType: 'hof' as const,
    isHof: true,
    isJackpot: false,
    rank: 28,
    points: 1456.8,
    weeklyAvg: 112.1,
    playoffOdds: 34.7,
    price: null as number | null, // Not listed
    owner: 'You',
    roster: ['DET QB', 'KC WR1', 'BUF WR1', 'CHI RB1', 'SF TE1'],
    color: 'from-hof to-pink-600',
  },
];

const leaderboardTeams = [
  { ...mockListedTeams[0], volume: 847 },
  {
    id: '0156',
    name: 'BBB #0156',
    draftType: 'hof' as const,
    isHof: true,
    isJackpot: false,
    rank: 2,
    points: 1798.4,
    weeklyAvg: 138.3,
    playoffOdds: 94.7,
    price: 12500,
    owner: '0x1a7...d5e3',
    roster: ['PHI QB', 'LAR WR1', 'PIT WR1', 'GB RB1', 'MIA TE1'],
    color: 'from-hof to-pink-600',
    volume: 612,
  },
  { ...mockListedTeams[1], volume: 423 },
  {
    id: '0412',
    name: 'BBB #0412',
    draftType: 'pro' as const,
    isHof: false,
    isJackpot: false,
    rank: 4,
    points: 1698.9,
    weeklyAvg: 130.7,
    playoffOdds: 85.2,
    price: 4700,
    owner: '0x6f2...g8h4',
    roster: ['CIN QB', 'CHI WR1', 'NYJ WR1', 'DAL RB1', 'CLE TE1'],
    color: 'from-orange-500 to-orange-600',
    volume: 287,
  },
  {
    id: '0789',
    name: 'BBB #0789',
    draftType: 'jackpot' as const,
    isHof: false,
    isJackpot: true,
    rank: 5,
    points: 1678.3,
    weeklyAvg: 129.1,
    playoffOdds: 81.6,
    price: 4000,
    owner: '0x4k9...m2n7',
    roster: ['SF QB', 'ATL WR1', 'NO WR1', 'MIA RB1', 'BUF TE1'],
    color: 'from-teal-500 to-teal-600',
    volume: 198,
  },
];

type Team = typeof mockListedTeams[0] | typeof mockMyTeams[0];

export default function MarketplacePage() {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [hofFilter, setHofFilter] = useState(false);
  const [jackpotFilter, setJackpotFilter] = useState(false);
  const [sortBy, setSortBy] = useState('price-low');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successType, setSuccessType] = useState<'buy' | 'sell' | 'list'>('buy');
  const [listPrice, setListPrice] = useState('');
  const [buyStep, setBuyStep] = useState<'confirm' | 'processing' | 'complete'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'usdc'>('card');

  const filteredTeams = mockListedTeams.filter(team => {
    if (hofFilter && !team.isHof) return false;
    if (jackpotFilter && !team.isJackpot) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (a.price || 0) - (b.price || 0);
      case 'price-high': return (b.price || 0) - (a.price || 0);
      case 'rank': return a.rank - b.rank;
      case 'points': return b.points - a.points;
      case 'playoffs': return b.playoffOdds - a.playoffOdds;
      default: return 0;
    }
  });

  const openBuyModal = (team: Team) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setSelectedTeam(team);
    setBuyStep('confirm');
    setShowBuyModal(true);
  };

  const openSellModal = (team: Team) => {
    setSelectedTeam(team);
    setListPrice('');
    setShowSellModal(true);
  };

  const handleBuy = async () => {
    setBuyStep('processing');
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2500));
    setBuyStep('complete');
    // Auto close after showing success
    setTimeout(() => {
      setShowBuyModal(false);
      setSuccessType('buy');
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleList = async () => {
    // Simulate listing
    setShowSellModal(false);
    setSuccessType('list');
    setShowSuccessModal(true);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Team Marketplace</h1>
          <p className="text-text-secondary text-sm">Buy and sell BBB teams instantly. No external accounts needed.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-bg-secondary p-1 rounded-xl border border-bg-tertiary">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'buy'
                  ? 'bg-banana text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Buy Teams
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginModal(true);
                  return;
                }
                setActiveTab('sell');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sell'
                  ? 'bg-banana text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sell My Teams
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'buy' ? (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-banana/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-banana" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-text-muted text-xs uppercase tracking-wider">Total Volume</span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-mono">$6.9M</div>
              <div className="text-success text-xs flex items-center gap-1 mt-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>
                +12.5% this week
              </div>
            </div>

            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span className="text-text-muted text-xs uppercase tracking-wider">Teams Listed</span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-mono">1,284</div>
              <div className="text-text-secondary text-xs mt-1">of 12,847 total teams</div>
            </div>

            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center">
                  <span className="text-error font-bold text-sm">JP</span>
                </div>
                <span className="text-text-muted text-xs uppercase tracking-wider">Jackpots Listed</span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-mono">
                <span className="text-error">2</span>
                <span className="text-text-muted text-lg font-normal"> / 128</span>
              </div>
              <div className="text-text-secondary text-xs mt-1">BBB #0021, #1203</div>
            </div>

            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-hof/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-hof" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <span className="text-text-muted text-xs uppercase tracking-wider">HOF Listed</span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-mono">
                <span className="text-hof">3</span>
                <span className="text-text-muted text-lg font-normal"> / 642</span>
              </div>
              <div className="text-text-secondary text-xs mt-1">BBB #0021, #0847, #0156</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Badge Filters */}
              <button
                onClick={() => setHofFilter(!hofFilter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 ${
                  hofFilter
                    ? 'bg-hof/20 border-hof text-hof'
                    : 'border-hof/50 text-hof hover:bg-hof/10'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                HOF Only
              </button>
              <button
                onClick={() => setJackpotFilter(!jackpotFilter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 ${
                  jackpotFilter
                    ? 'bg-error/20 border-error text-error'
                    : 'border-error/50 text-error hover:bg-error/10'
                }`}
              >
                <span className="font-bold">JP</span>
                Jackpot Only
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl px-4 py-2 text-sm text-text-primary appearance-none cursor-pointer pr-10 focus:outline-none focus:border-banana"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rank">Best Rank</option>
              <option value="points">Most Points</option>
              <option value="playoffs">Playoff Odds</option>
            </select>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className={`bg-bg-secondary border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${
                  team.isJackpot
                    ? 'border-error/30 hover:shadow-error/20'
                    : team.isHof
                    ? 'border-hof/30 hover:shadow-hof/20'
                    : 'border-bg-tertiary hover:border-bg-elevated'
                }`}
              >
                {/* Team Header */}
                <div className="relative h-32 bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${team.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl">🍌</span>
                  </div>

                  {/* Draft Type Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {team.isJackpot && (
                      <span className="px-3 py-1 bg-error text-white text-[10px] font-bold uppercase rounded-full">
                        JACKPOT
                      </span>
                    )}
                    {team.isHof && (
                      <span className="px-3 py-1 bg-gradient-to-r from-hof to-pink-600 text-white text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        HOF
                      </span>
                    )}
                  </div>

                  {/* Rank Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                      <span className="text-banana text-xs font-bold font-mono">#{team.rank}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary font-mono">{team.name}</h3>
                      <p className="text-text-muted text-xs">Owner: {team.owner}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-bg-primary rounded-xl mb-4">
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Points</p>
                      <p className="font-mono text-sm font-semibold text-text-primary">
                        {team.points.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Wk Avg</p>
                      <p className="font-mono text-sm font-semibold text-success">
                        {team.weeklyAvg}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Playoffs</p>
                      <p className={`font-mono text-sm font-semibold ${team.playoffOdds >= 50 ? 'text-success' : 'text-warning'}`}>
                        {team.playoffOdds}%
                      </p>
                    </div>
                  </div>

                  {/* Key Roster Spots */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {team.roster.slice(0, 3).map((pos, i) => (
                      <span key={i} className="px-2 py-1 bg-bg-primary text-text-secondary text-[10px] font-mono rounded">
                        {pos}
                      </span>
                    ))}
                    {team.roster.length > 3 && (
                      <span className="px-2 py-1 bg-bg-primary text-text-muted text-[10px] rounded">
                        +{team.roster.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-[10px] mb-0.5">Price</p>
                      <p className="text-text-primary font-mono text-lg font-bold">
                        ${team.price?.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openBuyModal(team)}
                      className="px-6 py-2.5 bg-banana text-black text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                Top Performing Teams for Sale
              </h2>
              <Link href="/standings" className="text-banana hover:underline text-sm font-medium transition-colors">
                View Full Standings
              </Link>
            </div>

            <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl overflow-x-auto">
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-bg-primary text-text-muted text-xs uppercase tracking-wider font-medium min-w-[600px]">
                <span>Rank</span>
                <span className="col-span-2">Team</span>
                <span>Points</span>
                <span>Playoff %</span>
                <span>Price</span>
                <span>Action</span>
              </div>

              {/* Rows */}
              {leaderboardTeams.slice(0, 5).map((team, index) => (
                <div
                  key={team.id}
                  className="grid grid-cols-7 gap-4 px-6 py-4 items-center border-t border-bg-tertiary hover:bg-bg-tertiary/50 transition-colors min-w-[600px]"
                >
                  <span className={`font-mono font-bold ${index < 3 ? 'text-banana' : 'text-text-primary'}`}>
                    #{team.rank}
                  </span>
                  <div className="col-span-2 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center`}>
                      <span className="text-lg">🍌</span>
                    </div>
                    <div>
                      <h4 className="text-text-primary font-medium text-sm font-mono">{team.name}</h4>
                      <span className="text-text-muted text-xs">{team.owner}</span>
                    </div>
                    {(team.isHof || team.isJackpot) && (
                      <div className="flex gap-1">
                        {team.isJackpot && (
                          <span className="px-2 py-0.5 bg-error/20 text-error text-[9px] font-bold rounded">JP</span>
                        )}
                        {team.isHof && (
                          <span className="px-2 py-0.5 bg-hof/20 text-hof text-[9px] font-bold rounded">HOF</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-text-primary font-mono text-sm">{team.points.toLocaleString()}</span>
                  <span className={`font-mono text-sm ${team.playoffOdds >= 50 ? 'text-success' : 'text-warning'}`}>
                    {team.playoffOdds}%
                  </span>
                  <span className="text-text-primary font-mono text-sm">${team.price?.toLocaleString()}</span>
                  <div>
                    <button
                      onClick={() => openBuyModal(team)}
                      className="px-4 py-1.5 bg-banana text-black text-xs font-semibold rounded-lg hover:brightness-110 transition-all"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Why Trade Teams?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-banana/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-banana" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="text-text-primary font-medium mb-2">Recoup Your Investment</h4>
                <p className="text-text-secondary text-sm">Bad draft? Sell your team and get back some of your entry fee.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <h4 className="text-text-primary font-medium mb-2">Buy Contenders</h4>
                <p className="text-text-secondary text-sm">Skip the draft and buy a team already performing well mid-season.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center mb-3">
                  <span className="text-error font-bold text-sm">JP</span>
                </div>
                <h4 className="text-text-primary font-medium mb-2">Get Jackpot Access</h4>
                <p className="text-text-secondary text-sm">Missed the 1% Jackpot draw? Buy one here and skip straight to finals.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Sell Tab */
        <div>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Sell Your Teams</h3>
            <p className="text-text-secondary text-sm mb-6">List any of your BBB teams for sale. Set your price and buyers can purchase instantly.</p>

            <div className="grid gap-4">
              {mockMyTeams.map((team) => (
                <div
                  key={team.id}
                  className={`bg-bg-primary border rounded-xl p-4 flex items-center justify-between ${
                    team.isHof ? 'border-hof/30' : 'border-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center`}>
                      <span className="text-xl">🍌</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-text-primary font-semibold font-mono">{team.name}</h4>
                        {team.isHof && (
                          <span className="px-2 py-0.5 bg-hof/20 text-hof text-[9px] font-bold rounded">HOF</span>
                        )}
                        {team.isJackpot && (
                          <span className="px-2 py-0.5 bg-error/20 text-error text-[9px] font-bold rounded">JP</span>
                        )}
                      </div>
                      <p className="text-text-muted text-xs">Rank #{team.rank} • {team.points.toLocaleString()} pts • {team.playoffOdds}% playoffs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {team.price ? (
                      <div className="text-right">
                        <p className="text-text-muted text-[10px]">Listed for</p>
                        <p className="text-text-primary font-mono font-semibold">${team.price?.toLocaleString()}</p>
                      </div>
                    ) : null}
                    <button
                      onClick={() => openSellModal(team)}
                      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        team.price
                          ? 'bg-bg-secondary border border-bg-tertiary text-text-secondary hover:text-text-primary'
                          : 'bg-banana text-black hover:brightness-110'
                      }`}
                    >
                      {team.price ? 'Edit Listing' : 'List for Sale'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {mockMyTeams.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍌</div>
                <h4 className="text-text-primary font-semibold mb-2">No Teams Yet</h4>
                <p className="text-text-secondary text-sm mb-4">Draft some teams to start selling!</p>
                <Link href="/" className="inline-block px-6 py-2 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all">
                  Enter a Draft
                </Link>
              </div>
            )}
          </div>

          {/* Selling Tips */}
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Selling Tips</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-banana/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-banana text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="text-text-primary font-medium text-sm">Price competitively</h4>
                  <p className="text-text-secondary text-xs">Check similar teams to set a fair price. Jackpot and HOF teams command premiums.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-banana/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-banana text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="text-text-primary font-medium text-sm">Highlight your perks</h4>
                  <p className="text-text-secondary text-xs">Jackpot teams skip to finals. HOF teams compete for bonus prizes. Buyers pay more for these.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-banana/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-banana text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="text-text-primary font-medium text-sm">0% platform fees</h4>
                  <p className="text-text-secondary text-xs">We don&apos;t take any cut. You keep 100% of your sale price.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedTeam && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => buyStep === 'confirm' && setShowBuyModal(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {buyStep === 'confirm' && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
                  <h2 className="text-lg font-semibold text-text-primary">Buy Team</h2>
                  <button
                    onClick={() => setShowBuyModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {/* Team Preview */}
                  <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedTeam.color} flex items-center justify-center`}>
                      <span className="text-2xl">🍌</span>
                    </div>
                    <div>
                      <h3 className="text-text-primary font-semibold font-mono">{selectedTeam.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {selectedTeam.isJackpot && (
                          <span className="px-2 py-0.5 bg-error/20 text-error text-[10px] font-bold rounded">JACKPOT</span>
                        )}
                        {selectedTeam.isHof && (
                          <span className="px-2 py-0.5 bg-hof/20 text-hof text-[10px] font-bold rounded">HOF</span>
                        )}
                        <span className="text-text-muted text-xs">Rank #{selectedTeam.rank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-bg-primary rounded-xl mb-4">
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase mb-1">Points</p>
                      <p className="font-mono text-sm font-semibold text-text-primary">{selectedTeam.points.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase mb-1">Wk Avg</p>
                      <p className="font-mono text-sm font-semibold text-success">{selectedTeam.weeklyAvg}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-text-muted text-[10px] uppercase mb-1">Playoffs</p>
                      <p className="font-mono text-sm font-semibold text-success">{selectedTeam.playoffOdds}%</p>
                    </div>
                  </div>

                  {/* Jackpot/HOF Perks */}
                  {(selectedTeam.isJackpot || selectedTeam.isHof) && (
                    <div className={`p-4 rounded-xl mb-4 ${selectedTeam.isJackpot ? 'bg-error/10 border border-error/30' : 'bg-hof/10 border border-hof/30'}`}>
                      <p className={`text-sm font-medium ${selectedTeam.isJackpot ? 'text-error' : 'text-hof'}`}>
                        {selectedTeam.isJackpot
                          ? '🎰 Jackpot Perk: Win your league and skip straight to the finals!'
                          : '⭐ HOF Perk: Compete for bonus prizes on top of regular rewards!'
                        }
                      </p>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="mb-4">
                    <label className="block text-text-secondary text-sm mb-3">Payment Method</label>
                    <div className="grid gap-3 grid-cols-2">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === 'card'
                            ? 'border-banana bg-banana/10'
                            : 'border-bg-tertiary hover:border-bg-elevated'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none">
                            <rect width="24" height="16" rx="2" fill="#1A1F71"/>
                            <path d="M9.5 10.5L10.5 5.5H12L11 10.5H9.5Z" fill="white"/>
                            <path d="M15.5 5.5C15 5.5 14.5 5.7 14.3 6L12 10.5H13.7L14 9.7H16L16.2 10.5H17.7L16.5 5.5H15.5ZM14.5 8.5L15.2 6.7L15.6 8.5H14.5Z" fill="white"/>
                            <path d="M8 5.5L6 10.5H7.5L7.8 9.5H9.5L9.8 10.5H11.3L9.3 5.5H8ZM8 8.3L8.5 6.7L9 8.3H8Z" fill="white"/>
                          </svg>
                          <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none">
                            <rect width="32" height="20" rx="2" fill="#EB001B"/>
                            <circle cx="12" cy="10" r="6" fill="#EB001B"/>
                            <circle cx="20" cy="10" r="6" fill="#F79E1B"/>
                            <path d="M16 5.5C17.5 6.7 18.5 8.2 18.5 10C18.5 11.8 17.5 13.3 16 14.5C14.5 13.3 13.5 11.8 13.5 10C13.5 8.2 14.5 6.7 16 5.5Z" fill="#FF5F00"/>
                          </svg>
                        </div>
                        <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-text-primary' : 'text-text-secondary'}`}>
                          Card
                        </span>
                        <p className="text-text-muted text-[10px] mt-1">Powered by Coinbase</p>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('usdc')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === 'usdc'
                            ? 'border-banana bg-banana/10'
                            : 'border-bg-tertiary hover:border-bg-elevated'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-lg font-bold text-text-primary">$</span>
                        </div>
                        <span className={`text-sm font-medium ${paymentMethod === 'usdc' ? 'text-text-primary' : 'text-text-secondary'}`}>
                          USDC
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="p-4 bg-bg-primary rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Price</span>
                      <span className="text-text-primary font-mono">
                        ${(selectedTeam.price || 0).toLocaleString()}
                      </span>
                    </div>
                    {paymentMethod === 'card' ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Processing Fee (3%)</span>
                        <span className="text-text-primary font-mono">
                          ${((selectedTeam.price || 0) * 0.03).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Network Fee (est.)</span>
                        <span className="text-text-primary font-mono">~$0.01</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-3 border-t border-bg-tertiary font-semibold">
                      <span className="text-text-primary">Total</span>
                      <span className="text-text-primary font-mono">
                        {paymentMethod === 'card'
                          ? `$${((selectedTeam.price || 0) * 1.03).toFixed(2)}`
                          : `$${((selectedTeam.price || 0) + 0.01).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={handleBuy}
                    className="w-full py-4 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {paymentMethod === 'card' ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                        </svg>
                        Pay ${((selectedTeam.price || 0) * 1.03).toFixed(2)}
                      </>
                    ) : (
                      <>
                        Pay ${((selectedTeam.price || 0) + 0.01).toFixed(2)} USDC
                      </>
                    )}
                  </button>
                  <p className="text-center text-text-muted text-xs mt-3">
                    {paymentMethod === 'card'
                      ? 'Secure payment powered by Coinbase'
                      : 'USDC payment on Base network'
                    }
                  </p>
                </div>
              </>
            )}

            {buyStep === 'processing' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-bg-tertiary rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-banana rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">
                  Processing Payment
                </h3>
                <p className="text-text-secondary text-sm">
                  Completing your purchase...
                </p>
              </div>
            )}

            {buyStep === 'complete' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">Purchase Complete!</h3>
                <p className="text-text-secondary text-sm">{selectedTeam.name} is now yours</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sell/List Modal */}
      {showSellModal && selectedTeam && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSellModal(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
              <h2 className="text-lg font-semibold text-text-primary">List for Sale</h2>
              <button
                onClick={() => setShowSellModal(false)}
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
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedTeam.color} flex items-center justify-center`}>
                  <span className="text-2xl">🍌</span>
                </div>
                <div>
                  <h3 className="text-text-primary font-semibold font-mono">{selectedTeam.name}</h3>
                  <p className="text-text-muted text-xs">Rank #{selectedTeam.rank} • {selectedTeam.playoffOdds}% playoffs</p>
                </div>
              </div>

              {/* Price Input */}
              <div className="mb-6">
                <label className="block text-text-secondary text-sm mb-2">Set your price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">$</span>
                  <input
                    type="number"
                    step="1"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-bg-primary border border-bg-tertiary rounded-xl pl-8 pr-4 py-3 text-text-primary font-mono text-lg focus:outline-none focus:border-banana"
                  />
                </div>
              </div>

              {/* Fee Info */}
              <div className="p-4 bg-success/10 border border-success/30 rounded-xl mb-6">
                <p className="text-success text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  0% platform fees — you keep everything
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={handleList}
                disabled={!listPrice || parseFloat(listPrice) <= 0}
                className="w-full py-4 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                List for ${listPrice ? parseFloat(listPrice).toLocaleString() : '0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl w-full max-w-sm p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 className="text-text-primary font-semibold text-lg mb-2">
              {successType === 'buy' ? 'Purchase Complete!' : 'Team Listed!'}
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {successType === 'buy'
                ? 'The team has been transferred to your account.'
                : 'Your team is now visible to buyers in the marketplace.'
              }
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-10 border-t border-bg-tertiary">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/sbs-logo.png"
              alt="SBS"
              width={32}
              height={32}
            />
            <span className="text-text-secondary text-sm">© 2026 Spoiled Banana Society. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Terms</a>
            <a href="#" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Privacy</a>
            <a href="#" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Support</a>
            <a href="#" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
