// Draft room shared constants

export type DraftType = 'jackpot' | 'hof' | 'pro';
export type RoomPhase = 'filling' | 'pre-spin' | 'spinning' | 'result' | 'countdown' | 'drafting' | 'completed' | 'loading';

// ==================== POSITION COLORS ====================
export const POSITION_COLORS: Record<string, string> = {
  QB: '#FF474C',   // red
  RB: '#3c9120',   // green
  WR: '#cb6ce6',   // purple
  TE: '#326cf8',   // blue
  DST: '#DF893E',  // orange
};

// ==================== HELPERS ====================

/** Extracts base position from playerId: "KC-QB" → "QB", "DAL-WR1" → "WR" */
export function positionFromPlayerId(id: string): string {
  const pos = id.split('-')[1] || '';
  return pos.replace(/[0-9]/g, '');
}

/** Returns hex color for a position (handles WR1/WR2 → WR, RB1/RB2 → RB) */
export function getPositionColorHex(pos: string): string {
  const base = pos.replace(/[0-9]/g, '');
  return POSITION_COLORS[base] || '#888888';
}

// ==================== BYE WEEKS ====================
const BYE_WEEKS: Record<string, number> = {
  KC: 6, SF: 9, MIA: 10, DAL: 7, PHI: 5, BUF: 12, CIN: 12, DET: 5,
  BAL: 14, JAX: 12, LAC: 5, SEA: 10, GB: 10, NYJ: 12, MIN: 6, ATL: 12,
  CLE: 10, HOU: 14, LV: 10, TB: 11, CHI: 7, PIT: 9, DEN: 14, LAR: 6,
  NO: 12, TEN: 5, IND: 14, ARI: 11, WAS: 14, NYG: 11, CAR: 11, NE: 14,
};

// ==================== 224 PLAYER DATASET ====================
// 32 NFL teams × 7 positions each (QB, RB1, RB2, WR1, WR2, TE, DST)

export interface PlayerData {
  playerId: string;
  team: string;
  position: string;
  adp: number;
  rank: number;
  byeWeek: number;
  playersFromTeam: string[];
}

const TEAMS = [
  'KC', 'SF', 'MIA', 'DAL', 'PHI', 'BUF', 'CIN', 'DET',
  'BAL', 'JAX', 'LAC', 'SEA', 'GB', 'NYJ', 'MIN', 'ATL',
  'CLE', 'HOU', 'LV', 'TB', 'CHI', 'PIT', 'DEN', 'LAR',
  'NO', 'TEN', 'IND', 'ARI', 'WAS', 'NYG', 'CAR', 'NE',
];

const POSITIONS_PER_TEAM = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'DST'];

// Players from team mapping (example rosters for "players from team" display)
const TEAM_PLAYERS: Record<string, Record<string, string[]>> = {
  KC: { QB: ['P. Mahomes'], RB1: ['I. Pacheco'], RB2: ['C. Edwards-Helaire'], WR1: ['R. Rice'], WR2: ['X. Worthy'], TE: ['T. Kelce'], DST: ['KC Defense'] },
  SF: { QB: ['B. Purdy'], RB1: ['C. McCaffrey'], RB2: ['J. Mason'], WR1: ['D. Samuel'], WR2: ['B. Aiyuk'], TE: ['G. Kittle'], DST: ['SF Defense'] },
  MIA: { QB: ['T. Tagovailoa'], RB1: ['R. Mostert'], RB2: ['D. Achane'], WR1: ['T. Hill'], WR2: ['J. Waddle'], TE: ['J. Smith'], DST: ['MIA Defense'] },
  DAL: { QB: ['D. Prescott'], RB1: ['E. Elliott'], RB2: ['R. Dowdle'], WR1: ['C. Lamb'], WR2: ['B. Cooks'], TE: ['J. Ferguson'], DST: ['DAL Defense'] },
  PHI: { QB: ['J. Hurts'], RB1: ['S. Barkley'], RB2: ['K. Gainwell'], WR1: ['A.J. Brown'], WR2: ['D. Smith'], TE: ['D. Goedert'], DST: ['PHI Defense'] },
  BUF: { QB: ['J. Allen'], RB1: ['J. Cook'], RB2: ['R. Cook'], WR1: ['K. Shakir'], WR2: ['C. Samuel'], TE: ['D. Knox'], DST: ['BUF Defense'] },
  CIN: { QB: ['J. Burrow'], RB1: ['J. Mixon'], RB2: ['Z. Moss'], WR1: ['J. Chase'], WR2: ['T. Higgins'], TE: ['M. Gesicki'], DST: ['CIN Defense'] },
  DET: { QB: ['J. Goff'], RB1: ['D. Montgomery'], RB2: ['J. Gibbs'], WR1: ['A. St. Brown'], WR2: ['J. Reynolds'], TE: ['S. LaPorta'], DST: ['DET Defense'] },
  BAL: { QB: ['L. Jackson'], RB1: ['D. Henry'], RB2: ['J. Hill'], WR1: ['Z. Flowers'], WR2: ['R. Bateman'], TE: ['M. Andrews'], DST: ['BAL Defense'] },
  JAX: { QB: ['T. Lawrence'], RB1: ['T. Etienne'], RB2: ['T. Bigsby'], WR1: ['C. Kirk'], WR2: ['G. Davis'], TE: ['E. Engram'], DST: ['JAX Defense'] },
  LAC: { QB: ['J. Herbert'], RB1: ['J.K. Dobbins'], RB2: ['G. Edwards'], WR1: ['L. McConkey'], WR2: ['Q. Johnston'], TE: ['W. Dissly'], DST: ['LAC Defense'] },
  SEA: { QB: ['G. Smith'], RB1: ['K. Walker'], RB2: ['Z. Charbonnet'], WR1: ['D.K. Metcalf'], WR2: ['J. Smith-Njigba'], TE: ['N. Fant'], DST: ['SEA Defense'] },
  GB: { QB: ['J. Love'], RB1: ['J. Williams'], RB2: ['A. Dillon'], WR1: ['J. Reed'], WR2: ['R. Duvall'], TE: ['L. Musgrave'], DST: ['GB Defense'] },
  NYJ: { QB: ['A. Rodgers'], RB1: ['B. Hall'], RB2: ['I. Davis'], WR1: ['G. Wilson'], WR2: ['A. Lazard'], TE: ['T. Conklin'], DST: ['NYJ Defense'] },
  MIN: { QB: ['S. Darnold'], RB1: ['A. Mattison'], RB2: ['T. Chandler'], WR1: ['J. Jefferson'], WR2: ['J. Addison'], TE: ['T.J. Hockenson'], DST: ['MIN Defense'] },
  ATL: { QB: ['K. Cousins'], RB1: ['B. Robinson'], RB2: ['T. Allgeier'], WR1: ['D. London'], WR2: ['D. Mooney'], TE: ['K. Pitts'], DST: ['ATL Defense'] },
  CLE: { QB: ['D. Watson'], RB1: ['N. Chubb'], RB2: ['J. Ford'], WR1: ['A. Cooper'], WR2: ['E. Moore'], TE: ['D. Njoku'], DST: ['CLE Defense'] },
  HOU: { QB: ['C.J. Stroud'], RB1: ['J. Mixon'], RB2: ['D. Pierce'], WR1: ['N. Collins'], WR2: ['S. Diggs'], TE: ['D. Schultz'], DST: ['HOU Defense'] },
  LV: { QB: ['A. O\'Connell'], RB1: ['Z. White'], RB2: ['A. Abdullah'], WR1: ['D. Adams'], WR2: ['J. Meyers'], TE: ['M. Mayer'], DST: ['LV Defense'] },
  TB: { QB: ['B. Mayfield'], RB1: ['R. White'], RB2: ['S.B. Rachaad'], WR1: ['M. Evans'], WR2: ['C. Godwin'], TE: ['C. Otton'], DST: ['TB Defense'] },
  CHI: { QB: ['C. Williams'], RB1: ['D. Swift'], RB2: ['K. Herbert'], WR1: ['D.J. Moore'], WR2: ['R. Odunze'], TE: ['C. Kmet'], DST: ['CHI Defense'] },
  PIT: { QB: ['R. Wilson'], RB1: ['N. Harris'], RB2: ['J. Warren'], WR1: ['G. Pickens'], WR2: ['V. Buren'], TE: ['P. Freiermuth'], DST: ['PIT Defense'] },
  DEN: { QB: ['B. Nix'], RB1: ['J. Williams'], RB2: ['S. Perine'], WR1: ['C. Sutton'], WR2: ['M. Jeudy'], TE: ['G. Dulcich'], DST: ['DEN Defense'] },
  LAR: { QB: ['M. Stafford'], RB1: ['K. Williams'], RB2: ['R. Williams'], WR1: ['P. Nacua'], WR2: ['C. Kupp'], TE: ['T. Higbee'], DST: ['LAR Defense'] },
  NO: { QB: ['D. Carr'], RB1: ['A. Kamara'], RB2: ['J. Kendre'], WR1: ['C. Olave'], WR2: ['R. Shaheed'], TE: ['J. Johnson'], DST: ['NO Defense'] },
  TEN: { QB: ['W. Levis'], RB1: ['T. Pollard'], RB2: ['T. Spears'], WR1: ['D. Hopkins'], WR2: ['T. Burks'], TE: ['C. McBride'], DST: ['TEN Defense'] },
  IND: { QB: ['A. Richardson'], RB1: ['J. Taylor'], RB2: ['T. Sermon'], WR1: ['M. Pittman'], WR2: ['J. Downs'], TE: ['M. Harrison'], DST: ['IND Defense'] },
  ARI: { QB: ['K. Murray'], RB1: ['J. Conner'], RB2: ['E. Murray'], WR1: ['M. Harrison Jr.'], WR2: ['M. Wilson'], TE: ['T. McBride'], DST: ['ARI Defense'] },
  WAS: { QB: ['J. Daniels'], RB1: ['B. Robinson Jr.'], RB2: ['A. Ekeler'], WR1: ['T. McLaurin'], WR2: ['J. Dotson'], TE: ['Z. Ertz'], DST: ['WAS Defense'] },
  NYG: { QB: ['D. Jones'], RB1: ['D. Singletary'], RB2: ['E. Gray'], WR1: ['M. Nabers'], WR2: ['W. Robinson'], TE: ['D. Waller'], DST: ['NYG Defense'] },
  CAR: { QB: ['B. Young'], RB1: ['C. Hubbard'], RB2: ['M. Sanders'], WR1: ['D. Thielen'], WR2: ['A. Brown'], TE: ['T. Tremble'], DST: ['CAR Defense'] },
  NE: { QB: ['D. Maye'], RB1: ['R. Stevenson'], RB2: ['A. Gibson'], WR1: ['D. Bourne'], WR2: ['K. Bourne'], TE: ['H. Henry'], DST: ['NE Defense'] },
};

function generateAllPositions(): PlayerData[] {
  const players: PlayerData[] = [];
  let adpCounter = 1;
  let rankCounter = 1;

  // Generate players in a realistic ADP order by position tiers
  // Tier 1: Top QBs, RB1s, WR1s
  const adpOrder: { team: string; pos: string }[] = [];

  // Generate all 224 player slots
  for (const team of TEAMS) {
    for (const pos of POSITIONS_PER_TEAM) {
      adpOrder.push({ team, pos });
    }
  }

  // Sort by a realistic ADP ranking: key positions first, DST last
  const positionPriority: Record<string, number> = {
    QB: 2, RB1: 1, RB2: 4, WR1: 1, WR2: 3, TE: 5, DST: 6,
  };

  // Generate a deterministic but varied ADP order
  // Top teams' key positions get low ADPs
  const teamTier: Record<string, number> = {};
  TEAMS.forEach((t, i) => { teamTier[t] = i; });

  adpOrder.sort((a, b) => {
    const aPri = (positionPriority[a.pos] || 6) * 32 + (teamTier[a.team] || 0);
    const bPri = (positionPriority[b.pos] || 6) * 32 + (teamTier[b.team] || 0);
    return aPri - bPri;
  });

  for (const entry of adpOrder) {
    const playerId = `${entry.team}-${entry.pos}`;
    const teamPlayers = TEAM_PLAYERS[entry.team];
    const posPlayers = teamPlayers?.[entry.pos] || [`${entry.team} ${entry.pos}`];

    players.push({
      playerId,
      team: entry.team,
      position: entry.pos,
      adp: adpCounter,
      rank: rankCounter,
      byeWeek: BYE_WEEKS[entry.team] || 7,
      playersFromTeam: posPlayers,
    });
    adpCounter++;
    rankCounter++;
  }

  return players;
}

export const ALL_POSITIONS: PlayerData[] = generateAllPositions();

// ==================== DRAFT PLAYERS ====================
export const DRAFT_PLAYERS = [
  { id: '1', name: 'You', displayName: 'You', isYou: true, avatar: '🍌' },
  { id: '2', name: 'GridironKing', displayName: 'GridironKing', isYou: false, avatar: '🍌' },
  { id: '3', name: 'TouchdownTitan', displayName: 'TD Titan', isYou: false, avatar: '🍌' },
  { id: '4', name: 'Diamond', displayName: 'Diamond', isYou: false, avatar: '🍌' },
  { id: '5', name: 'MoonBoi', displayName: 'MoonBoi', isYou: false, avatar: '🍌' },
  { id: '6', name: 'BlitzMaster', displayName: 'BlitzMaster', isYou: false, avatar: '🍌' },
  { id: '7', name: 'EndZoneKing', displayName: 'EndZoneKing', isYou: false, avatar: '🍌' },
  { id: '8', name: 'Holder', displayName: 'Holder', isYou: false, avatar: '🍌' },
  { id: '9', name: 'Gridiron', displayName: 'Gridiron', isYou: false, avatar: '🍌' },
  { id: '10', name: 'DraftKing', displayName: 'DraftKing', isYou: false, avatar: '🍌' },
];

export const DRAFT_TYPES = {
  jackpot: { label: 'JACKPOT', color: '#ef4444', bgClass: 'bg-red-600' },
  hof: { label: 'HALL OF FAME', color: '#D4AF37', bgClass: 'bg-yellow-600' },
  pro: { label: 'PRO', color: '#a855f7', bgClass: 'bg-purple-600' },
};

export const TOTAL_ROUNDS = 15;
export const TOTAL_PICKS = TOTAL_ROUNDS * 10; // 150

// ==================== TAILWIND-COMPATIBLE POSITION COLORS ====================
export function getPositionColor(pos: string) {
  const base = pos.replace(/[0-9]/g, '');
  switch (base) {
    case 'QB': return { bg: 'bg-[#FF474C]', text: 'text-[#FF474C]', light: 'bg-[#FF474C]/20' };
    case 'RB': return { bg: 'bg-[#3c9120]', text: 'text-[#3c9120]', light: 'bg-[#3c9120]/20' };
    case 'WR': return { bg: 'bg-[#cb6ce6]', text: 'text-[#cb6ce6]', light: 'bg-[#cb6ce6]/20' };
    case 'TE': return { bg: 'bg-[#326cf8]', text: 'text-[#326cf8]', light: 'bg-[#326cf8]/20' };
    case 'DST': return { bg: 'bg-[#DF893E]', text: 'text-[#DF893E]', light: 'bg-[#DF893E]/20' };
    default: return { bg: 'bg-gray-500', text: 'text-gray-400', light: 'bg-gray-500/20' };
  }
}

// ==================== SLOT MACHINE HELPERS ====================
export function generateReelItemsForReel(resultType: DraftType, reelIndex: number, totalItems: number = 50): DraftType[] {
  const items: DraftType[] = [];
  for (let i = 0; i < totalItems; i++) {
    const rand = Math.random();
    if (rand < 0.15) items.push('jackpot');
    else if (rand < 0.35) items.push('hof');
    else items.push('pro');
  }
  const landingIndex = totalItems - 8;
  items[landingIndex] = resultType;
  if (reelIndex === 2 && resultType === 'pro') {
    items[landingIndex - 1] = 'jackpot';
  }
  return items;
}

export function generateReelResults(): DraftType[] {
  // TEST MODE: Force jackpot for testing - change back to random later
  return ['jackpot', 'jackpot', 'jackpot'];

  /* REAL ODDS - uncomment for production:
  const results: DraftType[] = [];
  for (let i = 0; i < 3; i++) {
    const rand = Math.random();
    if (rand < 0.01) results.push('jackpot');
    else if (rand < 0.06) results.push('hof');
    else results.push('pro');
  }
  if (results.every(r => r === 'pro')) {
    const randomIndex = Math.floor(Math.random() * 3);
    (results as DraftType[])[randomIndex] = Math.random() < 0.33 ? 'jackpot' : 'hof';
  }
  return results;
  */
}

// ==================== DRAFT PICK INTERFACE ====================
export interface DraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  ownerName: string;
  ownerIndex: number;
  playerId: string;
  position: string;
  team: string;
}

// Legacy Pick interface for slot machine overlay compatibility
export interface Pick {
  round: number;
  pickInRound: number;
  overallPick: number;
  playerId: string;
  selection: { id: string; team: string; position: string; adp: number };
}

// ==================== ROSTER TYPE ====================
export interface PositionRoster {
  QB: string[];
  RB: string[];
  WR: string[];
  TE: string[];
  DST: string[];
}
