// NFL team abbreviations for logo URLs
const teamAbbreviations: Record<string, string> = {
  'Cardinals': 'ari',
  'Falcons': 'atl',
  'Ravens': 'bal',
  'Bills': 'buf',
  'Panthers': 'car',
  'Bears': 'chi',
  'Bengals': 'cin',
  'Browns': 'cle',
  'Cowboys': 'dal',
  'Broncos': 'den',
  'Lions': 'det',
  'Packers': 'gb',
  'Texans': 'hou',
  'Colts': 'ind',
  'Jaguars': 'jax',
  'Chiefs': 'kc',
  'Raiders': 'lv',
  'Chargers': 'lac',
  'Rams': 'lar',
  'Dolphins': 'mia',
  'Vikings': 'min',
  'Patriots': 'ne',
  'Saints': 'no',
  'Giants': 'nyg',
  'Jets': 'nyj',
  'Eagles': 'phi',
  'Steelers': 'pit',
  '49ers': 'sf',
  'Seahawks': 'sea',
  'Buccaneers': 'tb',
  'Titans': 'ten',
  'Commanders': 'wsh',
};

export function getNflTeamLogo(teamName: string): string | null {
  const abbr = teamAbbreviations[teamName];
  if (!abbr) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`;
}
