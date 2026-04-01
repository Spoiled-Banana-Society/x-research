export const COLORS = {
  primary: '#F3E216',
  qb: '#FF474C',
  rb: '#3c9120',
  wr: '#cb6ce6',
  te: '#326cf8',
  dst: '#DF893E',
} as const;

export const POSITION_COLORS = {
  ...COLORS,
  background: '#000000',
} as const;

export function positionColor(playerId: string): string {
  const pos = playerId.substring(playerId.indexOf('-') + 1).replace(/[0-9]/g, '');
  switch (pos) {
    case 'QB':
      return COLORS.qb;
    case 'RB':
      return COLORS.rb;
    case 'WR':
      return COLORS.wr;
    case 'TE':
      return COLORS.te;
    case 'DST':
      return COLORS.dst;
    default:
      return '#555';
  }
}
