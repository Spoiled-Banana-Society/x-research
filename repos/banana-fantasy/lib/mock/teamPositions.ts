import { TeamPosition } from '@/types';

// Team position rankings based on 2025 season actual fantasy points
// Format: [team, position, seasonPts, weeklyAvg, projectedPts]
const teamPositionRankings: [string, string, number, number, number][] = [
  // QBs - Ranked by 2025 season performance
  ['BUF', 'QB', 412.5, 24.3, 23.8],  // Josh Allen - MVP candidate
  ['BAL', 'QB', 398.2, 23.4, 23.1],  // Lamar Jackson
  ['PHI', 'QB', 378.6, 22.3, 21.5],  // Jalen Hurts
  ['KC', 'QB', 352.8, 20.8, 20.2],   // Patrick Mahomes
  ['CIN', 'QB', 341.5, 20.1, 19.8],  // Joe Burrow
  ['MIA', 'QB', 328.4, 19.3, 18.9],  // Tua Tagovailoa
  ['DET', 'QB', 318.2, 18.7, 18.4],  // Jared Goff
  ['HOU', 'QB', 312.6, 18.4, 18.1],  // CJ Stroud
  ['LAC', 'QB', 298.5, 17.6, 17.2],  // Justin Herbert
  ['DAL', 'QB', 285.4, 16.8, 16.5],  // Dak Prescott
  ['GB', 'QB', 278.2, 16.4, 16.1],   // Jordan Love
  ['ATL', 'QB', 272.8, 16.1, 15.8],  // Kirk Cousins
  ['SF', 'QB', 265.4, 15.6, 15.3],   // Brock Purdy
  ['MIN', 'QB', 258.6, 15.2, 14.9],  // Sam Darnold
  ['TB', 'QB', 252.4, 14.8, 14.6],   // Baker Mayfield
  ['SEA', 'QB', 245.8, 14.5, 14.2],  // Geno Smith
  ['LAR', 'QB', 238.5, 14.0, 13.8],  // Matthew Stafford
  ['ARI', 'QB', 232.4, 13.7, 13.4],  // Kyler Murray
  ['CHI', 'QB', 225.6, 13.3, 13.0],  // Caleb Williams
  ['WAS', 'QB', 218.8, 12.9, 12.6],  // Jayden Daniels
  ['JAX', 'QB', 212.5, 12.5, 12.2],  // Trevor Lawrence
  ['NO', 'QB', 205.4, 12.1, 11.8],   // Derek Carr
  ['PIT', 'QB', 198.6, 11.7, 11.4],  // Russell Wilson
  ['IND', 'QB', 192.4, 11.3, 11.0],  // Anthony Richardson
  ['NYJ', 'QB', 185.8, 10.9, 10.7],  // Aaron Rodgers
  ['DEN', 'QB', 178.5, 10.5, 10.2],  // Bo Nix
  ['CLE', 'QB', 172.4, 10.1, 9.9],   // Deshaun Watson
  ['LV', 'QB', 165.6, 9.7, 9.5],     // Gardner Minshew
  ['TEN', 'QB', 158.8, 9.3, 9.1],    // Will Levis
  ['NYG', 'QB', 152.4, 9.0, 8.7],    // Daniel Jones
  ['NE', 'QB', 145.6, 8.6, 8.3],     // Drake Maye
  ['CAR', 'QB', 138.5, 8.1, 7.9],    // Bryce Young

  // RB1s - Ranked by 2025 season performance
  ['PHI', 'RB1', 328.5, 19.3, 18.8],  // Saquon Barkley
  ['BAL', 'RB1', 312.4, 18.4, 17.9],  // Derrick Henry
  ['DET', 'RB1', 298.6, 17.6, 17.1],  // Jahmyr Gibbs
  ['LAR', 'RB1', 285.2, 16.8, 16.3],  // Kyren Williams
  ['MIA', 'RB1', 272.8, 16.1, 15.6],  // De'Von Achane
  ['SF', 'RB1', 265.4, 15.6, 15.2],   // Christian McCaffrey
  ['GB', 'RB1', 258.6, 15.2, 14.8],   // Josh Jacobs
  ['CHI', 'RB1', 248.5, 14.6, 14.2],  // D'Andre Swift
  ['DAL', 'RB1', 238.4, 14.0, 13.6],  // Rico Dowdle
  ['HOU', 'RB1', 228.6, 13.5, 13.1],  // Joe Mixon
  ['CIN', 'RB1', 218.5, 12.9, 12.5],  // Chase Brown
  ['ATL', 'RB1', 212.4, 12.5, 12.1],  // Bijan Robinson
  ['KC', 'RB1', 205.6, 12.1, 11.7],   // Isiah Pacheco
  ['MIN', 'RB1', 198.8, 11.7, 11.3],  // Aaron Jones
  ['TB', 'RB1', 192.5, 11.3, 11.0],   // Bucky Irving
  ['SEA', 'RB1', 185.4, 10.9, 10.6],  // Kenneth Walker III
  ['ARI', 'RB1', 178.6, 10.5, 10.2],  // James Conner
  ['NYG', 'RB1', 172.5, 10.1, 9.8],   // Devin Singletary
  ['BUF', 'RB1', 165.4, 9.7, 9.4],    // James Cook
  ['PIT', 'RB1', 158.6, 9.3, 9.1],    // Najee Harris
  ['DEN', 'RB1', 152.5, 9.0, 8.7],    // Javonte Williams
  ['JAX', 'RB1', 145.4, 8.6, 8.3],    // Travis Etienne
  ['IND', 'RB1', 138.6, 8.2, 7.9],    // Jonathan Taylor
  ['NO', 'RB1', 132.5, 7.8, 7.5],     // Alvin Kamara
  ['CLE', 'RB1', 125.4, 7.4, 7.1],    // Jerome Ford
  ['WAS', 'RB1', 118.6, 7.0, 6.7],    // Brian Robinson Jr
  ['NYJ', 'RB1', 112.5, 6.6, 6.4],    // Breece Hall
  ['LAC', 'RB1', 105.4, 6.2, 6.0],    // J.K. Dobbins
  ['LV', 'RB1', 98.6, 5.8, 5.6],      // Zamir White
  ['TEN', 'RB1', 92.5, 5.4, 5.2],     // Tony Pollard
  ['NE', 'RB1', 85.4, 5.0, 4.8],      // Rhamondre Stevenson
  ['CAR', 'RB1', 78.6, 4.6, 4.4],     // Chuba Hubbard

  // RB2s - Ranked by 2025 season performance
  ['DET', 'RB2', 185.4, 10.9, 10.5],  // David Montgomery
  ['KC', 'RB2', 172.6, 10.2, 9.8],    // Kareem Hunt
  ['SF', 'RB2', 165.8, 9.8, 9.4],     // Jordan Mason
  ['GB', 'RB2', 158.5, 9.3, 9.0],     // Emanuel Wilson
  ['LAR', 'RB2', 152.4, 9.0, 8.6],    // Blake Corum
  ['BAL', 'RB2', 145.6, 8.6, 8.2],    // Justice Hill
  ['PHI', 'RB2', 138.8, 8.2, 7.8],    // Kenny Gainwell
  ['MIA', 'RB2', 132.5, 7.8, 7.5],    // Raheem Mostert
  ['CHI', 'RB2', 125.4, 7.4, 7.1],    // Roschon Johnson
  ['CIN', 'RB2', 118.6, 7.0, 6.7],    // Zack Moss
  ['HOU', 'RB2', 112.5, 6.6, 6.3],    // Dameon Pierce
  ['DAL', 'RB2', 105.4, 6.2, 5.9],    // Ezekiel Elliott
  ['ATL', 'RB2', 98.6, 5.8, 5.5],     // Tyler Allgeier
  ['SEA', 'RB2', 92.5, 5.4, 5.2],     // Zach Charbonnet
  ['TB', 'RB2', 85.4, 5.0, 4.8],      // Rachaad White
  ['MIN', 'RB2', 78.6, 4.6, 4.4],     // Ty Chandler
  ['ARI', 'RB2', 72.5, 4.3, 4.1],     // Trey Benson
  ['BUF', 'RB2', 65.4, 3.8, 3.6],     // Ray Davis
  ['PIT', 'RB2', 58.6, 3.4, 3.3],     // Jaylen Warren
  ['DEN', 'RB2', 52.5, 3.1, 2.9],     // Jaleel McLaughlin
  ['JAX', 'RB2', 45.4, 2.7, 2.5],     // Tank Bigsby
  ['NYG', 'RB2', 38.6, 2.3, 2.1],     // Tyrone Tracy Jr
  ['IND', 'RB2', 32.5, 1.9, 1.8],     // Trey Sermon
  ['NO', 'RB2', 28.4, 1.7, 1.5],      // Jamaal Williams
  ['CLE', 'RB2', 25.6, 1.5, 1.4],     // Pierre Strong Jr
  ['WAS', 'RB2', 22.5, 1.3, 1.2],     // Austin Ekeler
  ['NYJ', 'RB2', 18.4, 1.1, 1.0],     // Braelon Allen
  ['LAC', 'RB2', 15.6, 0.9, 0.8],     // Gus Edwards
  ['LV', 'RB2', 12.5, 0.7, 0.7],      // Alexander Mattison
  ['TEN', 'RB2', 10.4, 0.6, 0.6],     // Tyjae Spears
  ['NE', 'RB2', 8.6, 0.5, 0.5],       // Antonio Gibson
  ['CAR', 'RB2', 6.5, 0.4, 0.4],      // Miles Sanders

  // WR1s - Ranked by 2025 season performance
  ['CIN', 'WR1', 342.5, 20.1, 19.6],  // Ja'Marr Chase
  ['DET', 'WR1', 328.4, 19.3, 18.8],  // Amon-Ra St. Brown
  ['DAL', 'WR1', 312.6, 18.4, 17.9],  // CeeDee Lamb
  ['MIA', 'WR1', 298.8, 17.6, 17.1],  // Tyreek Hill
  ['MIN', 'WR1', 285.5, 16.8, 16.3],  // Justin Jefferson
  ['PHI', 'WR1', 272.4, 16.0, 15.6],  // A.J. Brown
  ['SF', 'WR1', 258.6, 15.2, 14.8],   // Deebo Samuel
  ['SEA', 'WR1', 245.8, 14.5, 14.1],  // DK Metcalf
  ['LAR', 'WR1', 238.5, 14.0, 13.6],  // Puka Nacua
  ['HOU', 'WR1', 228.4, 13.4, 13.1],  // Nico Collins
  ['TB', 'WR1', 218.6, 12.9, 12.5],   // Mike Evans
  ['ATL', 'WR1', 212.5, 12.5, 12.1],  // Drake London
  ['GB', 'WR1', 205.4, 12.1, 11.7],   // Jayden Reed
  ['NYJ', 'WR1', 198.6, 11.7, 11.3],  // Garrett Wilson
  ['BUF', 'WR1', 192.5, 11.3, 11.0],  // Khalil Shakir
  ['ARI', 'WR1', 185.4, 10.9, 10.6],  // Marvin Harrison Jr
  ['BAL', 'WR1', 178.6, 10.5, 10.2],  // Zay Flowers
  ['KC', 'WR1', 172.5, 10.1, 9.8],    // Xavier Worthy
  ['JAX', 'WR1', 165.4, 9.7, 9.4],    // Brian Thomas Jr
  ['WAS', 'WR1', 158.6, 9.3, 9.1],    // Terry McLaurin
  ['PIT', 'WR1', 152.5, 9.0, 8.7],    // George Pickens
  ['CHI', 'WR1', 145.4, 8.6, 8.3],    // DJ Moore
  ['NO', 'WR1', 138.6, 8.2, 7.9],     // Chris Olave
  ['DEN', 'WR1', 132.5, 7.8, 7.5],    // Courtland Sutton
  ['IND', 'WR1', 125.4, 7.4, 7.1],    // Michael Pittman Jr
  ['LAC', 'WR1', 118.6, 7.0, 6.7],    // Quentin Johnston
  ['TEN', 'WR1', 112.5, 6.6, 6.4],    // DeAndre Hopkins
  ['CLE', 'WR1', 105.4, 6.2, 6.0],    // Amari Cooper
  ['LV', 'WR1', 98.6, 5.8, 5.6],      // Davante Adams
  ['NYG', 'WR1', 92.5, 5.4, 5.2],     // Malik Nabers
  ['NE', 'WR1', 85.4, 5.0, 4.8],      // Ja'Lynn Polk
  ['CAR', 'WR1', 78.6, 4.6, 4.4],     // Diontae Johnson

  // WR2s - Ranked by 2025 season performance
  ['MIA', 'WR2', 258.4, 15.2, 14.8],  // Jaylen Waddle
  ['CIN', 'WR2', 245.6, 14.5, 14.1],  // Tee Higgins
  ['DET', 'WR2', 238.5, 14.0, 13.6],  // Jameson Williams
  ['PHI', 'WR2', 228.4, 13.4, 13.1],  // DeVonta Smith
  ['SF', 'WR2', 218.6, 12.9, 12.5],   // Brandon Aiyuk
  ['DAL', 'WR2', 212.5, 12.5, 12.1],  // Brandin Cooks
  ['LAR', 'WR2', 205.4, 12.1, 11.7],  // Cooper Kupp
  ['TB', 'WR2', 198.6, 11.7, 11.3],   // Chris Godwin
  ['MIN', 'WR2', 192.5, 11.3, 11.0],  // Jordan Addison
  ['SEA', 'WR2', 185.4, 10.9, 10.6],  // Tyler Lockett
  ['HOU', 'WR2', 178.6, 10.5, 10.2],  // Stefon Diggs
  ['ATL', 'WR2', 172.5, 10.1, 9.8],   // Darnell Mooney
  ['GB', 'WR2', 165.4, 9.7, 9.4],     // Romeo Doubs
  ['ARI', 'WR2', 158.6, 9.3, 9.1],    // Michael Wilson
  ['BUF', 'WR2', 152.5, 9.0, 8.7],    // Keon Coleman
  ['BAL', 'WR2', 145.4, 8.6, 8.3],    // Rashod Bateman
  ['KC', 'WR2', 138.6, 8.2, 7.9],     // Hollywood Brown
  ['NYJ', 'WR2', 132.5, 7.8, 7.5],    // Allen Lazard
  ['JAX', 'WR2', 125.4, 7.4, 7.1],    // Gabe Davis
  ['WAS', 'WR2', 118.6, 7.0, 6.7],    // Jahan Dotson
  ['PIT', 'WR2', 112.5, 6.6, 6.4],    // Van Jefferson
  ['CHI', 'WR2', 105.4, 6.2, 6.0],    // Keenan Allen
  ['NO', 'WR2', 98.6, 5.8, 5.6],      // Rashid Shaheed
  ['DEN', 'WR2', 92.5, 5.4, 5.2],     // Josh Reynolds
  ['IND', 'WR2', 85.4, 5.0, 4.8],     // Josh Downs
  ['LAC', 'WR2', 78.6, 4.6, 4.4],     // Ladd McConkey
  ['TEN', 'WR2', 72.5, 4.3, 4.1],     // Calvin Ridley
  ['CLE', 'WR2', 65.4, 3.8, 3.6],     // Jerry Jeudy
  ['LV', 'WR2', 58.6, 3.4, 3.3],      // Jakobi Meyers
  ['NYG', 'WR2', 52.5, 3.1, 2.9],     // Darius Slayton
  ['NE', 'WR2', 45.4, 2.7, 2.5],      // DeMario Douglas
  ['CAR', 'WR2', 38.6, 2.3, 2.1],     // Adam Thielen

  // TEs - Ranked by 2025 season performance
  ['KC', 'TE', 245.6, 14.5, 14.1],    // Travis Kelce
  ['SF', 'TE', 228.4, 13.4, 13.1],    // George Kittle
  ['DET', 'TE', 218.6, 12.9, 12.5],   // Sam LaPorta
  ['BAL', 'TE', 205.5, 12.1, 11.7],   // Mark Andrews
  ['DAL', 'TE', 192.4, 11.3, 11.0],   // Jake Ferguson
  ['MIA', 'TE', 178.6, 10.5, 10.2],   // Jonnu Smith
  ['LAR', 'TE', 165.5, 9.7, 9.4],     // Tyler Higbee
  ['CIN', 'TE', 158.4, 9.3, 9.1],     // Mike Gesicki
  ['HOU', 'TE', 152.6, 9.0, 8.7],     // Dalton Schultz
  ['GB', 'TE', 145.5, 8.6, 8.3],      // Tucker Kraft
  ['PHI', 'TE', 138.4, 8.1, 7.9],     // Dallas Goedert
  ['ATL', 'TE', 132.6, 7.8, 7.5],     // Kyle Pitts
  ['MIN', 'TE', 125.5, 7.4, 7.1],     // T.J. Hockenson
  ['SEA', 'TE', 118.4, 7.0, 6.7],     // Noah Fant
  ['TB', 'TE', 112.6, 6.6, 6.4],      // Cade Otton
  ['ARI', 'TE', 105.5, 6.2, 6.0],     // Trey McBride
  ['NYJ', 'TE', 98.4, 5.8, 5.6],      // Tyler Conklin
  ['BUF', 'TE', 92.6, 5.4, 5.2],      // Dalton Kincaid
  ['JAX', 'TE', 85.5, 5.0, 4.8],      // Evan Engram
  ['WAS', 'TE', 78.4, 4.6, 4.4],      // Zach Ertz
  ['PIT', 'TE', 72.6, 4.3, 4.1],      // Pat Freiermuth
  ['CHI', 'TE', 65.5, 3.8, 3.6],      // Cole Kmet
  ['NO', 'TE', 58.4, 3.4, 3.3],       // Taysom Hill
  ['DEN', 'TE', 52.6, 3.1, 2.9],      // Adam Trautman
  ['IND', 'TE', 45.5, 2.7, 2.5],      // Mo Alie-Cox
  ['LAC', 'TE', 38.4, 2.3, 2.1],      // Will Dissly
  ['TEN', 'TE', 32.6, 1.9, 1.8],      // Chigoziem Okonkwo
  ['CLE', 'TE', 28.5, 1.7, 1.5],      // David Njoku
  ['LV', 'TE', 25.4, 1.5, 1.4],       // Brock Bowers
  ['NYG', 'TE', 22.6, 1.3, 1.2],      // Daniel Bellinger
  ['NE', 'TE', 18.5, 1.1, 1.0],       // Hunter Henry
  ['CAR', 'TE', 15.4, 0.9, 0.8],      // Tommy Tremble

  // DSTs - Ranked by 2025 season performance
  ['SF', 'DST', 168.5, 9.9, 9.5],     // 49ers
  ['DAL', 'DST', 158.4, 9.3, 9.0],    // Cowboys
  ['BAL', 'DST', 152.6, 9.0, 8.7],    // Ravens
  ['CLE', 'DST', 145.5, 8.6, 8.3],    // Browns
  ['NYJ', 'DST', 138.4, 8.1, 7.9],    // Jets
  ['BUF', 'DST', 132.6, 7.8, 7.5],    // Bills
  ['MIA', 'DST', 125.5, 7.4, 7.1],    // Dolphins
  ['KC', 'DST', 118.4, 7.0, 6.7],     // Chiefs
  ['PIT', 'DST', 112.6, 6.6, 6.4],    // Steelers
  ['DET', 'DST', 105.5, 6.2, 6.0],    // Lions
  ['PHI', 'DST', 98.4, 5.8, 5.6],     // Eagles
  ['MIN', 'DST', 92.6, 5.4, 5.2],     // Vikings
  ['HOU', 'DST', 85.5, 5.0, 4.8],     // Texans
  ['GB', 'DST', 78.4, 4.6, 4.4],      // Packers
  ['NO', 'DST', 72.6, 4.3, 4.1],      // Saints
  ['LAR', 'DST', 65.5, 3.8, 3.6],     // Rams
  ['SEA', 'DST', 58.4, 3.4, 3.3],     // Seahawks
  ['CIN', 'DST', 52.6, 3.1, 2.9],     // Bengals
  ['TB', 'DST', 45.5, 2.7, 2.5],      // Buccaneers
  ['ATL', 'DST', 38.4, 2.3, 2.1],     // Falcons
  ['DEN', 'DST', 32.6, 1.9, 1.8],     // Broncos
  ['JAX', 'DST', 28.5, 1.7, 1.5],     // Jaguars
  ['IND', 'DST', 25.4, 1.5, 1.4],     // Colts
  ['CHI', 'DST', 22.6, 1.3, 1.2],     // Bears
  ['ARI', 'DST', 18.5, 1.1, 1.0],     // Cardinals
  ['WAS', 'DST', 15.4, 0.9, 0.8],     // Commanders
  ['TEN', 'DST', 12.6, 0.7, 0.7],     // Titans
  ['LAC', 'DST', 10.5, 0.6, 0.6],     // Chargers
  ['LV', 'DST', 8.4, 0.5, 0.5],       // Raiders
  ['NYG', 'DST', 6.6, 0.4, 0.4],      // Giants
  ['NE', 'DST', 5.5, 0.3, 0.3],       // Patriots
  ['CAR', 'DST', 4.4, 0.3, 0.2],      // Panthers
];

// Depth chart data for all team positions - 3 players per position
const depthChartData: { [key: string]: { name: string; status: 'starter' | 'backup' | 'injured'; projectedPoints: number }[] } = {
  // QBs
  'BUF-QB': [{ name: 'Josh Allen', status: 'starter', projectedPoints: 24.3 }, { name: 'Mitchell Trubisky', status: 'backup', projectedPoints: 12.1 }, { name: 'Shane Buechele', status: 'backup', projectedPoints: 5.2 }],
  'BAL-QB': [{ name: 'Lamar Jackson', status: 'starter', projectedPoints: 23.4 }, { name: 'Tyler Huntley', status: 'backup', projectedPoints: 11.8 }, { name: 'Josh Johnson', status: 'backup', projectedPoints: 4.9 }],
  'PHI-QB': [{ name: 'Jalen Hurts', status: 'starter', projectedPoints: 22.3 }, { name: 'Kenny Pickett', status: 'backup', projectedPoints: 10.5 }, { name: 'Tanner McKee', status: 'backup', projectedPoints: 4.2 }],
  'KC-QB': [{ name: 'Patrick Mahomes', status: 'starter', projectedPoints: 20.8 }, { name: 'Carson Wentz', status: 'backup', projectedPoints: 11.2 }, { name: 'Chris Oladokun', status: 'backup', projectedPoints: 3.8 }],
  'CIN-QB': [{ name: 'Joe Burrow', status: 'starter', projectedPoints: 20.1 }, { name: 'Jake Browning', status: 'backup', projectedPoints: 10.8 }, { name: 'Logan Woodside', status: 'backup', projectedPoints: 4.1 }],
  'MIA-QB': [{ name: 'Tua Tagovailoa', status: 'starter', projectedPoints: 19.3 }, { name: 'Mike White', status: 'backup', projectedPoints: 9.5 }, { name: 'Skylar Thompson', status: 'backup', projectedPoints: 5.8 }],
  'DET-QB': [{ name: 'Jared Goff', status: 'starter', projectedPoints: 18.7 }, { name: 'Hendon Hooker', status: 'backup', projectedPoints: 8.9 }, { name: 'Nate Sudfeld', status: 'backup', projectedPoints: 3.5 }],
  'HOU-QB': [{ name: 'CJ Stroud', status: 'starter', projectedPoints: 18.4 }, { name: 'Davis Mills', status: 'backup', projectedPoints: 9.2 }, { name: 'Case Keenum', status: 'backup', projectedPoints: 4.5 }],
  'LAC-QB': [{ name: 'Justin Herbert', status: 'starter', projectedPoints: 17.6 }, { name: 'Easton Stick', status: 'backup', projectedPoints: 8.1 }, { name: 'Max Duggan', status: 'backup', projectedPoints: 3.2 }],
  'DAL-QB': [{ name: 'Dak Prescott', status: 'starter', projectedPoints: 16.8 }, { name: 'Cooper Rush', status: 'backup', projectedPoints: 8.5 }, { name: 'Trey Lance', status: 'backup', projectedPoints: 6.2 }],
  'GB-QB': [{ name: 'Jordan Love', status: 'starter', projectedPoints: 16.4 }, { name: 'Sean Clifford', status: 'backup', projectedPoints: 7.8 }, { name: 'Michael Pratt', status: 'backup', projectedPoints: 3.1 }],
  'ATL-QB': [{ name: 'Kirk Cousins', status: 'starter', projectedPoints: 16.1 }, { name: 'Taylor Heinicke', status: 'backup', projectedPoints: 8.2 }, { name: 'Michael Penix Jr', status: 'backup', projectedPoints: 5.5 }],
  'SF-QB': [{ name: 'Brock Purdy', status: 'starter', projectedPoints: 15.6 }, { name: 'Sam Darnold', status: 'backup', projectedPoints: 9.1 }, { name: 'Brandon Allen', status: 'backup', projectedPoints: 3.8 }],
  'MIN-QB': [{ name: 'Sam Darnold', status: 'starter', projectedPoints: 15.2 }, { name: 'Nick Mullens', status: 'backup', projectedPoints: 7.5 }, { name: 'J.J. McCarthy', status: 'injured', projectedPoints: 8.2 }],
  'TB-QB': [{ name: 'Baker Mayfield', status: 'starter', projectedPoints: 14.8 }, { name: 'Kyle Trask', status: 'backup', projectedPoints: 7.2 }, { name: 'John Wolford', status: 'backup', projectedPoints: 3.5 }],
  'SEA-QB': [{ name: 'Geno Smith', status: 'starter', projectedPoints: 14.5 }, { name: 'Sam Howell', status: 'backup', projectedPoints: 7.8 }, { name: 'P.J. Walker', status: 'backup', projectedPoints: 3.2 }],
  'LAR-QB': [{ name: 'Matthew Stafford', status: 'starter', projectedPoints: 14.0 }, { name: 'Jimmy Garoppolo', status: 'backup', projectedPoints: 8.5 }, { name: 'Stetson Bennett', status: 'backup', projectedPoints: 4.1 }],
  'ARI-QB': [{ name: 'Kyler Murray', status: 'starter', projectedPoints: 13.7 }, { name: 'Clayton Tune', status: 'backup', projectedPoints: 6.5 }, { name: 'Jeff Driskel', status: 'backup', projectedPoints: 3.8 }],
  'CHI-QB': [{ name: 'Caleb Williams', status: 'starter', projectedPoints: 13.3 }, { name: 'Tyson Bagent', status: 'backup', projectedPoints: 6.8 }, { name: 'Brett Rypien', status: 'backup', projectedPoints: 3.2 }],
  'WAS-QB': [{ name: 'Jayden Daniels', status: 'starter', projectedPoints: 12.9 }, { name: 'Marcus Mariota', status: 'backup', projectedPoints: 7.1 }, { name: 'Jeff Driskel', status: 'backup', projectedPoints: 3.5 }],
  'JAX-QB': [{ name: 'Trevor Lawrence', status: 'starter', projectedPoints: 12.5 }, { name: 'Mac Jones', status: 'backup', projectedPoints: 7.5 }, { name: 'C.J. Beathard', status: 'backup', projectedPoints: 3.8 }],
  'NO-QB': [{ name: 'Derek Carr', status: 'starter', projectedPoints: 12.1 }, { name: 'Jameis Winston', status: 'backup', projectedPoints: 8.2 }, { name: 'Jake Haener', status: 'backup', projectedPoints: 3.5 }],
  'PIT-QB': [{ name: 'Russell Wilson', status: 'starter', projectedPoints: 11.7 }, { name: 'Justin Fields', status: 'backup', projectedPoints: 9.5 }, { name: 'Kyle Allen', status: 'backup', projectedPoints: 4.2 }],
  'IND-QB': [{ name: 'Anthony Richardson', status: 'starter', projectedPoints: 11.3 }, { name: 'Joe Flacco', status: 'backup', projectedPoints: 8.1 }, { name: 'Sam Ehlinger', status: 'backup', projectedPoints: 4.5 }],
  'NYJ-QB': [{ name: 'Aaron Rodgers', status: 'starter', projectedPoints: 10.9 }, { name: 'Tyrod Taylor', status: 'backup', projectedPoints: 6.8 }, { name: 'Tim Boyle', status: 'backup', projectedPoints: 3.2 }],
  'DEN-QB': [{ name: 'Bo Nix', status: 'starter', projectedPoints: 10.5 }, { name: 'Jarrett Stidham', status: 'backup', projectedPoints: 5.8 }, { name: 'Ben DiNucci', status: 'backup', projectedPoints: 2.5 }],
  'CLE-QB': [{ name: 'Deshaun Watson', status: 'starter', projectedPoints: 10.1 }, { name: 'Jameis Winston', status: 'backup', projectedPoints: 7.5 }, { name: 'Dorian Thompson-Robinson', status: 'backup', projectedPoints: 4.2 }],
  'LV-QB': [{ name: 'Gardner Minshew', status: 'starter', projectedPoints: 9.7 }, { name: 'Aidan O\'Connell', status: 'backup', projectedPoints: 6.5 }, { name: 'Nathan Peterman', status: 'backup', projectedPoints: 2.8 }],
  'TEN-QB': [{ name: 'Will Levis', status: 'starter', projectedPoints: 9.3 }, { name: 'Mason Rudolph', status: 'backup', projectedPoints: 5.8 }, { name: 'Malik Willis', status: 'backup', projectedPoints: 4.5 }],
  'NYG-QB': [{ name: 'Daniel Jones', status: 'starter', projectedPoints: 9.0 }, { name: 'Drew Lock', status: 'backup', projectedPoints: 5.5 }, { name: 'Tommy DeVito', status: 'backup', projectedPoints: 4.2 }],
  'NE-QB': [{ name: 'Drake Maye', status: 'starter', projectedPoints: 8.6 }, { name: 'Jacoby Brissett', status: 'backup', projectedPoints: 5.2 }, { name: 'Bailey Zappe', status: 'backup', projectedPoints: 4.1 }],
  'CAR-QB': [{ name: 'Bryce Young', status: 'starter', projectedPoints: 8.1 }, { name: 'Andy Dalton', status: 'backup', projectedPoints: 6.5 }, { name: 'Matt Corral', status: 'backup', projectedPoints: 3.2 }],
  // RB1s
  'PHI-RB1': [{ name: 'Saquon Barkley', status: 'starter', projectedPoints: 19.3 }, { name: 'Kenny Gainwell', status: 'backup', projectedPoints: 8.2 }, { name: 'Boston Scott', status: 'backup', projectedPoints: 3.5 }],
  'BAL-RB1': [{ name: 'Derrick Henry', status: 'starter', projectedPoints: 18.4 }, { name: 'Justice Hill', status: 'backup', projectedPoints: 7.5 }, { name: 'Keaton Mitchell', status: 'backup', projectedPoints: 4.2 }],
  'DET-RB1': [{ name: 'Jahmyr Gibbs', status: 'starter', projectedPoints: 17.6 }, { name: 'David Montgomery', status: 'backup', projectedPoints: 12.5 }, { name: 'Craig Reynolds', status: 'backup', projectedPoints: 3.8 }],
  'LAR-RB1': [{ name: 'Kyren Williams', status: 'starter', projectedPoints: 16.8 }, { name: 'Blake Corum', status: 'backup', projectedPoints: 8.1 }, { name: 'Ronnie Rivers', status: 'backup', projectedPoints: 3.2 }],
  'MIA-RB1': [{ name: 'De\'Von Achane', status: 'starter', projectedPoints: 16.1 }, { name: 'Raheem Mostert', status: 'backup', projectedPoints: 8.8 }, { name: 'Jeff Wilson Jr', status: 'backup', projectedPoints: 4.5 }],
  'SF-RB1': [{ name: 'Christian McCaffrey', status: 'starter', projectedPoints: 15.6 }, { name: 'Jordan Mason', status: 'backup', projectedPoints: 9.2 }, { name: 'Elijah Mitchell', status: 'injured', projectedPoints: 7.5 }],
  'GB-RB1': [{ name: 'Josh Jacobs', status: 'starter', projectedPoints: 15.2 }, { name: 'Emanuel Wilson', status: 'backup', projectedPoints: 6.8 }, { name: 'AJ Dillon', status: 'backup', projectedPoints: 5.2 }],
  'CHI-RB1': [{ name: 'D\'Andre Swift', status: 'starter', projectedPoints: 14.6 }, { name: 'Roschon Johnson', status: 'backup', projectedPoints: 6.5 }, { name: 'Khalil Herbert', status: 'backup', projectedPoints: 5.8 }],
  'DAL-RB1': [{ name: 'Rico Dowdle', status: 'starter', projectedPoints: 14.0 }, { name: 'Ezekiel Elliott', status: 'backup', projectedPoints: 6.2 }, { name: 'Deuce Vaughn', status: 'backup', projectedPoints: 3.5 }],
  'HOU-RB1': [{ name: 'Joe Mixon', status: 'starter', projectedPoints: 13.5 }, { name: 'Dameon Pierce', status: 'backup', projectedPoints: 6.8 }, { name: 'Dare Ogunbowale', status: 'backup', projectedPoints: 3.2 }],
  'CIN-RB1': [{ name: 'Chase Brown', status: 'starter', projectedPoints: 12.9 }, { name: 'Zack Moss', status: 'backup', projectedPoints: 6.5 }, { name: 'Trayveon Williams', status: 'backup', projectedPoints: 2.8 }],
  'ATL-RB1': [{ name: 'Bijan Robinson', status: 'starter', projectedPoints: 12.5 }, { name: 'Tyler Allgeier', status: 'backup', projectedPoints: 6.2 }, { name: 'Avery Williams', status: 'backup', projectedPoints: 2.5 }],
  'KC-RB1': [{ name: 'Isiah Pacheco', status: 'starter', projectedPoints: 12.1 }, { name: 'Kareem Hunt', status: 'backup', projectedPoints: 8.5 }, { name: 'Clyde Edwards-Helaire', status: 'backup', projectedPoints: 4.2 }],
  'MIN-RB1': [{ name: 'Aaron Jones', status: 'starter', projectedPoints: 11.7 }, { name: 'Ty Chandler', status: 'backup', projectedPoints: 5.8 }, { name: 'Cam Akers', status: 'backup', projectedPoints: 4.5 }],
  'TB-RB1': [{ name: 'Bucky Irving', status: 'starter', projectedPoints: 11.3 }, { name: 'Rachaad White', status: 'backup', projectedPoints: 7.2 }, { name: 'Sean Tucker', status: 'backup', projectedPoints: 3.5 }],
  'SEA-RB1': [{ name: 'Kenneth Walker III', status: 'starter', projectedPoints: 10.9 }, { name: 'Zach Charbonnet', status: 'backup', projectedPoints: 6.8 }, { name: 'Kenny McIntosh', status: 'backup', projectedPoints: 2.5 }],
  'ARI-RB1': [{ name: 'James Conner', status: 'starter', projectedPoints: 10.5 }, { name: 'Trey Benson', status: 'backup', projectedPoints: 5.5 }, { name: 'Emari Demercado', status: 'backup', projectedPoints: 3.2 }],
  'NYG-RB1': [{ name: 'Devin Singletary', status: 'starter', projectedPoints: 10.1 }, { name: 'Tyrone Tracy Jr', status: 'backup', projectedPoints: 5.8 }, { name: 'Eric Gray', status: 'backup', projectedPoints: 3.5 }],
  'BUF-RB1': [{ name: 'James Cook', status: 'starter', projectedPoints: 9.7 }, { name: 'Ray Davis', status: 'backup', projectedPoints: 5.2 }, { name: 'Ty Johnson', status: 'backup', projectedPoints: 2.8 }],
  'PIT-RB1': [{ name: 'Najee Harris', status: 'starter', projectedPoints: 9.3 }, { name: 'Jaylen Warren', status: 'backup', projectedPoints: 6.5 }, { name: 'Cordarrelle Patterson', status: 'backup', projectedPoints: 3.2 }],
  'DEN-RB1': [{ name: 'Javonte Williams', status: 'starter', projectedPoints: 9.0 }, { name: 'Jaleel McLaughlin', status: 'backup', projectedPoints: 5.5 }, { name: 'Samaje Perine', status: 'backup', projectedPoints: 4.2 }],
  'JAX-RB1': [{ name: 'Travis Etienne', status: 'starter', projectedPoints: 8.6 }, { name: 'Tank Bigsby', status: 'backup', projectedPoints: 5.8 }, { name: 'D\'Ernest Johnson', status: 'backup', projectedPoints: 2.5 }],
  'IND-RB1': [{ name: 'Jonathan Taylor', status: 'starter', projectedPoints: 8.2 }, { name: 'Trey Sermon', status: 'backup', projectedPoints: 4.5 }, { name: 'Evan Hull', status: 'backup', projectedPoints: 3.2 }],
  'NO-RB1': [{ name: 'Alvin Kamara', status: 'starter', projectedPoints: 7.8 }, { name: 'Jamaal Williams', status: 'backup', projectedPoints: 4.2 }, { name: 'Kendre Miller', status: 'backup', projectedPoints: 5.5 }],
  'CLE-RB1': [{ name: 'Jerome Ford', status: 'starter', projectedPoints: 7.4 }, { name: 'Pierre Strong Jr', status: 'backup', projectedPoints: 4.8 }, { name: 'Kareem Hunt', status: 'backup', projectedPoints: 5.2 }],
  'WAS-RB1': [{ name: 'Brian Robinson Jr', status: 'starter', projectedPoints: 7.0 }, { name: 'Austin Ekeler', status: 'backup', projectedPoints: 5.8 }, { name: 'Chris Rodriguez Jr', status: 'backup', projectedPoints: 2.5 }],
  'NYJ-RB1': [{ name: 'Breece Hall', status: 'starter', projectedPoints: 6.6 }, { name: 'Braelon Allen', status: 'backup', projectedPoints: 4.2 }, { name: 'Israel Abanikanda', status: 'backup', projectedPoints: 2.8 }],
  'LAC-RB1': [{ name: 'J.K. Dobbins', status: 'starter', projectedPoints: 6.2 }, { name: 'Gus Edwards', status: 'backup', projectedPoints: 4.5 }, { name: 'Kimani Vidal', status: 'backup', projectedPoints: 3.2 }],
  'LV-RB1': [{ name: 'Zamir White', status: 'starter', projectedPoints: 5.8 }, { name: 'Alexander Mattison', status: 'backup', projectedPoints: 4.2 }, { name: 'Ameer Abdullah', status: 'backup', projectedPoints: 2.5 }],
  'TEN-RB1': [{ name: 'Tony Pollard', status: 'starter', projectedPoints: 5.4 }, { name: 'Tyjae Spears', status: 'backup', projectedPoints: 4.8 }, { name: 'Joshua Kelley', status: 'backup', projectedPoints: 2.2 }],
  'NE-RB1': [{ name: 'Rhamondre Stevenson', status: 'starter', projectedPoints: 5.0 }, { name: 'Antonio Gibson', status: 'backup', projectedPoints: 4.5 }, { name: 'Kevin Harris', status: 'backup', projectedPoints: 2.8 }],
  'CAR-RB1': [{ name: 'Chuba Hubbard', status: 'starter', projectedPoints: 4.6 }, { name: 'Miles Sanders', status: 'backup', projectedPoints: 3.5 }, { name: 'Raheem Blackshear', status: 'backup', projectedPoints: 2.2 }],
  // RB2s
  'DET-RB2': [{ name: 'David Montgomery', status: 'starter', projectedPoints: 10.9 }, { name: 'Craig Reynolds', status: 'backup', projectedPoints: 4.2 }, { name: 'Jermar Jefferson', status: 'backup', projectedPoints: 2.5 }],
  'KC-RB2': [{ name: 'Kareem Hunt', status: 'starter', projectedPoints: 10.2 }, { name: 'Clyde Edwards-Helaire', status: 'backup', projectedPoints: 5.5 }, { name: 'Deneric Prince', status: 'backup', projectedPoints: 2.2 }],
  'SF-RB2': [{ name: 'Jordan Mason', status: 'starter', projectedPoints: 9.8 }, { name: 'Elijah Mitchell', status: 'injured', projectedPoints: 6.5 }, { name: 'Patrick Taylor Jr', status: 'backup', projectedPoints: 2.8 }],
  'GB-RB2': [{ name: 'Emanuel Wilson', status: 'starter', projectedPoints: 9.3 }, { name: 'AJ Dillon', status: 'backup', projectedPoints: 5.2 }, { name: 'Chris Brooks', status: 'backup', projectedPoints: 2.5 }],
  'LAR-RB2': [{ name: 'Blake Corum', status: 'starter', projectedPoints: 9.0 }, { name: 'Ronnie Rivers', status: 'backup', projectedPoints: 3.8 }, { name: 'Boston Scott', status: 'backup', projectedPoints: 2.2 }],
  'BAL-RB2': [{ name: 'Justice Hill', status: 'starter', projectedPoints: 8.6 }, { name: 'Keaton Mitchell', status: 'injured', projectedPoints: 5.5 }, { name: 'Chris Collier', status: 'backup', projectedPoints: 2.5 }],
  'PHI-RB2': [{ name: 'Kenny Gainwell', status: 'starter', projectedPoints: 8.2 }, { name: 'Boston Scott', status: 'backup', projectedPoints: 3.5 }, { name: 'Tyrion Davis-Price', status: 'backup', projectedPoints: 2.8 }],
  'MIA-RB2': [{ name: 'Raheem Mostert', status: 'starter', projectedPoints: 7.8 }, { name: 'Jeff Wilson Jr', status: 'backup', projectedPoints: 4.5 }, { name: 'Chris Brooks', status: 'backup', projectedPoints: 2.2 }],
  'CHI-RB2': [{ name: 'Roschon Johnson', status: 'starter', projectedPoints: 7.4 }, { name: 'Khalil Herbert', status: 'backup', projectedPoints: 5.5 }, { name: 'Travis Homer', status: 'backup', projectedPoints: 2.5 }],
  'CIN-RB2': [{ name: 'Zack Moss', status: 'starter', projectedPoints: 7.0 }, { name: 'Trayveon Williams', status: 'backup', projectedPoints: 3.2 }, { name: 'Chris Evans', status: 'backup', projectedPoints: 2.8 }],
  'HOU-RB2': [{ name: 'Dameon Pierce', status: 'starter', projectedPoints: 6.6 }, { name: 'Dare Ogunbowale', status: 'backup', projectedPoints: 3.5 }, { name: 'J.J. Taylor', status: 'backup', projectedPoints: 2.2 }],
  'DAL-RB2': [{ name: 'Ezekiel Elliott', status: 'starter', projectedPoints: 6.2 }, { name: 'Deuce Vaughn', status: 'backup', projectedPoints: 3.8 }, { name: 'Snoop Conner', status: 'backup', projectedPoints: 2.5 }],
  'ATL-RB2': [{ name: 'Tyler Allgeier', status: 'starter', projectedPoints: 5.8 }, { name: 'Avery Williams', status: 'backup', projectedPoints: 2.8 }, { name: 'Carlos Washington Jr', status: 'backup', projectedPoints: 1.8 }],
  'SEA-RB2': [{ name: 'Zach Charbonnet', status: 'starter', projectedPoints: 5.4 }, { name: 'Kenny McIntosh', status: 'backup', projectedPoints: 2.8 }, { name: 'George Holani', status: 'backup', projectedPoints: 1.5 }],
  'TB-RB2': [{ name: 'Rachaad White', status: 'starter', projectedPoints: 5.0 }, { name: 'Sean Tucker', status: 'backup', projectedPoints: 3.5 }, { name: 'Chase Edmonds', status: 'backup', projectedPoints: 2.2 }],
  'MIN-RB2': [{ name: 'Ty Chandler', status: 'starter', projectedPoints: 4.6 }, { name: 'Cam Akers', status: 'backup', projectedPoints: 3.8 }, { name: 'DeWayne McBride', status: 'backup', projectedPoints: 2.5 }],
  'ARI-RB2': [{ name: 'Trey Benson', status: 'starter', projectedPoints: 4.3 }, { name: 'Emari Demercado', status: 'backup', projectedPoints: 3.2 }, { name: 'Michael Carter', status: 'backup', projectedPoints: 2.2 }],
  'BUF-RB2': [{ name: 'Ray Davis', status: 'starter', projectedPoints: 3.8 }, { name: 'Ty Johnson', status: 'backup', projectedPoints: 2.5 }, { name: 'Frank Gore Jr', status: 'backup', projectedPoints: 1.8 }],
  'PIT-RB2': [{ name: 'Jaylen Warren', status: 'starter', projectedPoints: 3.4 }, { name: 'Cordarrelle Patterson', status: 'backup', projectedPoints: 2.8 }, { name: 'Jonathan Ward', status: 'backup', projectedPoints: 1.5 }],
  'DEN-RB2': [{ name: 'Jaleel McLaughlin', status: 'starter', projectedPoints: 3.1 }, { name: 'Samaje Perine', status: 'backup', projectedPoints: 3.5 }, { name: 'Blake Watson', status: 'backup', projectedPoints: 1.2 }],
  'JAX-RB2': [{ name: 'Tank Bigsby', status: 'starter', projectedPoints: 2.7 }, { name: 'D\'Ernest Johnson', status: 'backup', projectedPoints: 2.2 }, { name: 'Snoop Conner', status: 'backup', projectedPoints: 1.5 }],
  'NYG-RB2': [{ name: 'Tyrone Tracy Jr', status: 'starter', projectedPoints: 2.3 }, { name: 'Eric Gray', status: 'backup', projectedPoints: 2.8 }, { name: 'Jashaun Corbin', status: 'backup', projectedPoints: 1.2 }],
  'IND-RB2': [{ name: 'Trey Sermon', status: 'starter', projectedPoints: 1.9 }, { name: 'Evan Hull', status: 'backup', projectedPoints: 2.5 }, { name: 'Tyler Goodson', status: 'backup', projectedPoints: 1.5 }],
  'NO-RB2': [{ name: 'Jamaal Williams', status: 'starter', projectedPoints: 1.7 }, { name: 'Kendre Miller', status: 'injured', projectedPoints: 4.5 }, { name: 'Jordan Mims', status: 'backup', projectedPoints: 1.2 }],
  'CLE-RB2': [{ name: 'Pierre Strong Jr', status: 'starter', projectedPoints: 1.5 }, { name: 'John Kelly', status: 'backup', projectedPoints: 1.8 }, { name: 'Demetric Felton', status: 'backup', projectedPoints: 1.2 }],
  'WAS-RB2': [{ name: 'Austin Ekeler', status: 'starter', projectedPoints: 1.3 }, { name: 'Chris Rodriguez Jr', status: 'backup', projectedPoints: 2.2 }, { name: 'Jeremy McNichols', status: 'backup', projectedPoints: 0.8 }],
  'NYJ-RB2': [{ name: 'Braelon Allen', status: 'starter', projectedPoints: 1.1 }, { name: 'Israel Abanikanda', status: 'backup', projectedPoints: 2.5 }, { name: 'Zonovan Knight', status: 'backup', projectedPoints: 1.2 }],
  'LAC-RB2': [{ name: 'Gus Edwards', status: 'starter', projectedPoints: 0.9 }, { name: 'Kimani Vidal', status: 'backup', projectedPoints: 2.8 }, { name: 'Hassan Haskins', status: 'backup', projectedPoints: 1.5 }],
  'LV-RB2': [{ name: 'Alexander Mattison', status: 'starter', projectedPoints: 0.7 }, { name: 'Ameer Abdullah', status: 'backup', projectedPoints: 2.2 }, { name: 'Sincere McCormick', status: 'backup', projectedPoints: 1.2 }],
  'TEN-RB2': [{ name: 'Tyjae Spears', status: 'starter', projectedPoints: 0.6 }, { name: 'Joshua Kelley', status: 'backup', projectedPoints: 1.8 }, { name: 'Julius Chestnut', status: 'backup', projectedPoints: 0.8 }],
  'NE-RB2': [{ name: 'Antonio Gibson', status: 'starter', projectedPoints: 0.5 }, { name: 'Kevin Harris', status: 'backup', projectedPoints: 2.2 }, { name: 'JaMycal Hasty', status: 'backup', projectedPoints: 1.2 }],
  'CAR-RB2': [{ name: 'Miles Sanders', status: 'starter', projectedPoints: 0.4 }, { name: 'Raheem Blackshear', status: 'backup', projectedPoints: 1.8 }, { name: 'Spencer Brown', status: 'backup', projectedPoints: 0.8 }],
  // WR1s
  'CIN-WR1': [{ name: 'Ja\'Marr Chase', status: 'starter', projectedPoints: 20.1 }, { name: 'Tee Higgins', status: 'backup', projectedPoints: 14.5 }, { name: 'Andrei Iosivas', status: 'backup', projectedPoints: 5.8 }],
  'DET-WR1': [{ name: 'Amon-Ra St. Brown', status: 'starter', projectedPoints: 19.3 }, { name: 'Jameson Williams', status: 'backup', projectedPoints: 12.8 }, { name: 'Kalif Raymond', status: 'backup', projectedPoints: 4.5 }],
  'DAL-WR1': [{ name: 'CeeDee Lamb', status: 'starter', projectedPoints: 18.4 }, { name: 'Brandin Cooks', status: 'backup', projectedPoints: 11.5 }, { name: 'Jalen Tolbert', status: 'backup', projectedPoints: 5.2 }],
  'MIA-WR1': [{ name: 'Tyreek Hill', status: 'starter', projectedPoints: 17.6 }, { name: 'Jaylen Waddle', status: 'backup', projectedPoints: 14.2 }, { name: 'River Cracraft', status: 'backup', projectedPoints: 3.5 }],
  'MIN-WR1': [{ name: 'Justin Jefferson', status: 'starter', projectedPoints: 16.8 }, { name: 'Jordan Addison', status: 'backup', projectedPoints: 10.8 }, { name: 'Jalen Nailor', status: 'backup', projectedPoints: 4.2 }],
  'PHI-WR1': [{ name: 'A.J. Brown', status: 'starter', projectedPoints: 16.0 }, { name: 'DeVonta Smith', status: 'backup', projectedPoints: 12.5 }, { name: 'Britain Covey', status: 'backup', projectedPoints: 3.8 }],
  'SF-WR1': [{ name: 'Deebo Samuel', status: 'starter', projectedPoints: 15.2 }, { name: 'Brandon Aiyuk', status: 'backup', projectedPoints: 12.2 }, { name: 'Jauan Jennings', status: 'backup', projectedPoints: 5.5 }],
  'SEA-WR1': [{ name: 'DK Metcalf', status: 'starter', projectedPoints: 14.5 }, { name: 'Tyler Lockett', status: 'backup', projectedPoints: 10.2 }, { name: 'Jaxon Smith-Njigba', status: 'backup', projectedPoints: 8.5 }],
  'LAR-WR1': [{ name: 'Puka Nacua', status: 'starter', projectedPoints: 14.0 }, { name: 'Cooper Kupp', status: 'backup', projectedPoints: 11.5 }, { name: 'Demarcus Robinson', status: 'backup', projectedPoints: 4.2 }],
  'HOU-WR1': [{ name: 'Nico Collins', status: 'starter', projectedPoints: 13.4 }, { name: 'Stefon Diggs', status: 'backup', projectedPoints: 10.2 }, { name: 'Tank Dell', status: 'injured', projectedPoints: 9.5 }],
  'TB-WR1': [{ name: 'Mike Evans', status: 'starter', projectedPoints: 12.9 }, { name: 'Chris Godwin', status: 'backup', projectedPoints: 11.2 }, { name: 'Jalen McMillan', status: 'backup', projectedPoints: 4.5 }],
  'ATL-WR1': [{ name: 'Drake London', status: 'starter', projectedPoints: 12.5 }, { name: 'Darnell Mooney', status: 'backup', projectedPoints: 9.8 }, { name: 'Ray-Ray McCloud', status: 'backup', projectedPoints: 3.2 }],
  'GB-WR1': [{ name: 'Jayden Reed', status: 'starter', projectedPoints: 12.1 }, { name: 'Romeo Doubs', status: 'backup', projectedPoints: 9.2 }, { name: 'Christian Watson', status: 'injured', projectedPoints: 8.5 }],
  'NYJ-WR1': [{ name: 'Garrett Wilson', status: 'starter', projectedPoints: 11.7 }, { name: 'Allen Lazard', status: 'backup', projectedPoints: 7.5 }, { name: 'Xavier Gipson', status: 'backup', projectedPoints: 3.8 }],
  'BUF-WR1': [{ name: 'Khalil Shakir', status: 'starter', projectedPoints: 11.3 }, { name: 'Keon Coleman', status: 'backup', projectedPoints: 8.2 }, { name: 'Curtis Samuel', status: 'backup', projectedPoints: 5.5 }],
  'ARI-WR1': [{ name: 'Marvin Harrison Jr', status: 'starter', projectedPoints: 10.9 }, { name: 'Michael Wilson', status: 'backup', projectedPoints: 8.8 }, { name: 'Greg Dortch', status: 'backup', projectedPoints: 4.2 }],
  'BAL-WR1': [{ name: 'Zay Flowers', status: 'starter', projectedPoints: 10.5 }, { name: 'Rashod Bateman', status: 'backup', projectedPoints: 7.8 }, { name: 'Nelson Agholor', status: 'backup', projectedPoints: 4.5 }],
  'KC-WR1': [{ name: 'Xavier Worthy', status: 'starter', projectedPoints: 10.1 }, { name: 'Hollywood Brown', status: 'injured', projectedPoints: 7.5 }, { name: 'JuJu Smith-Schuster', status: 'backup', projectedPoints: 5.2 }],
  'JAX-WR1': [{ name: 'Brian Thomas Jr', status: 'starter', projectedPoints: 9.7 }, { name: 'Gabe Davis', status: 'backup', projectedPoints: 6.8 }, { name: 'Tim Jones', status: 'backup', projectedPoints: 3.5 }],
  'WAS-WR1': [{ name: 'Terry McLaurin', status: 'starter', projectedPoints: 9.3 }, { name: 'Jahan Dotson', status: 'backup', projectedPoints: 6.5 }, { name: 'Olamide Zaccheaus', status: 'backup', projectedPoints: 3.8 }],
  'PIT-WR1': [{ name: 'George Pickens', status: 'starter', projectedPoints: 9.0 }, { name: 'Van Jefferson', status: 'backup', projectedPoints: 5.8 }, { name: 'Calvin Austin III', status: 'backup', projectedPoints: 4.2 }],
  'CHI-WR1': [{ name: 'DJ Moore', status: 'starter', projectedPoints: 8.6 }, { name: 'Keenan Allen', status: 'backup', projectedPoints: 6.2 }, { name: 'Rome Odunze', status: 'backup', projectedPoints: 7.5 }],
  'NO-WR1': [{ name: 'Chris Olave', status: 'starter', projectedPoints: 8.2 }, { name: 'Rashid Shaheed', status: 'backup', projectedPoints: 5.5 }, { name: 'AT Perry', status: 'backup', projectedPoints: 3.2 }],
  'DEN-WR1': [{ name: 'Courtland Sutton', status: 'starter', projectedPoints: 7.8 }, { name: 'Josh Reynolds', status: 'backup', projectedPoints: 5.2 }, { name: 'Marvin Mims Jr', status: 'backup', projectedPoints: 4.5 }],
  'IND-WR1': [{ name: 'Michael Pittman Jr', status: 'starter', projectedPoints: 7.4 }, { name: 'Josh Downs', status: 'backup', projectedPoints: 4.8 }, { name: 'Adonai Mitchell', status: 'backup', projectedPoints: 5.2 }],
  'LAC-WR1': [{ name: 'Quentin Johnston', status: 'starter', projectedPoints: 7.0 }, { name: 'Ladd McConkey', status: 'backup', projectedPoints: 4.5 }, { name: 'Joshua Palmer', status: 'backup', projectedPoints: 3.8 }],
  'TEN-WR1': [{ name: 'DeAndre Hopkins', status: 'starter', projectedPoints: 6.6 }, { name: 'Calvin Ridley', status: 'backup', projectedPoints: 4.2 }, { name: 'Tyler Boyd', status: 'backup', projectedPoints: 3.5 }],
  'CLE-WR1': [{ name: 'Amari Cooper', status: 'starter', projectedPoints: 6.2 }, { name: 'Jerry Jeudy', status: 'backup', projectedPoints: 3.8 }, { name: 'Elijah Moore', status: 'backup', projectedPoints: 3.2 }],
  'LV-WR1': [{ name: 'Davante Adams', status: 'starter', projectedPoints: 5.8 }, { name: 'Jakobi Meyers', status: 'backup', projectedPoints: 3.5 }, { name: 'Tre Tucker', status: 'backup', projectedPoints: 2.8 }],
  'NYG-WR1': [{ name: 'Malik Nabers', status: 'starter', projectedPoints: 5.4 }, { name: 'Darius Slayton', status: 'backup', projectedPoints: 3.2 }, { name: 'Wan\'Dale Robinson', status: 'backup', projectedPoints: 4.5 }],
  'NE-WR1': [{ name: 'Ja\'Lynn Polk', status: 'starter', projectedPoints: 5.0 }, { name: 'DeMario Douglas', status: 'backup', projectedPoints: 2.8 }, { name: 'Kendrick Bourne', status: 'backup', projectedPoints: 3.2 }],
  'CAR-WR1': [{ name: 'Diontae Johnson', status: 'starter', projectedPoints: 4.6 }, { name: 'Adam Thielen', status: 'backup', projectedPoints: 2.5 }, { name: 'Jonathan Mingo', status: 'backup', projectedPoints: 3.8 }],
  // WR2s
  'MIA-WR2': [{ name: 'Jaylen Waddle', status: 'starter', projectedPoints: 15.2 }, { name: 'River Cracraft', status: 'backup', projectedPoints: 3.5 }, { name: 'Braxton Berrios', status: 'backup', projectedPoints: 2.8 }],
  'CIN-WR2': [{ name: 'Tee Higgins', status: 'starter', projectedPoints: 14.5 }, { name: 'Andrei Iosivas', status: 'backup', projectedPoints: 5.8 }, { name: 'Trenton Irwin', status: 'backup', projectedPoints: 2.5 }],
  'DET-WR2': [{ name: 'Jameson Williams', status: 'starter', projectedPoints: 14.0 }, { name: 'Kalif Raymond', status: 'backup', projectedPoints: 4.5 }, { name: 'Tim Patrick', status: 'backup', projectedPoints: 3.2 }],
  'PHI-WR2': [{ name: 'DeVonta Smith', status: 'starter', projectedPoints: 13.4 }, { name: 'Britain Covey', status: 'backup', projectedPoints: 3.8 }, { name: 'Parris Campbell', status: 'backup', projectedPoints: 2.5 }],
  'SF-WR2': [{ name: 'Brandon Aiyuk', status: 'starter', projectedPoints: 12.9 }, { name: 'Jauan Jennings', status: 'backup', projectedPoints: 5.5 }, { name: 'Ricky Pearsall', status: 'backup', projectedPoints: 4.8 }],
  'DAL-WR2': [{ name: 'Brandin Cooks', status: 'starter', projectedPoints: 12.5 }, { name: 'Jalen Tolbert', status: 'backup', projectedPoints: 5.2 }, { name: 'KaVontae Turpin', status: 'backup', projectedPoints: 3.5 }],
  'LAR-WR2': [{ name: 'Cooper Kupp', status: 'starter', projectedPoints: 12.1 }, { name: 'Demarcus Robinson', status: 'backup', projectedPoints: 4.2 }, { name: 'Tyler Johnson', status: 'backup', projectedPoints: 2.8 }],
  'TB-WR2': [{ name: 'Chris Godwin', status: 'starter', projectedPoints: 11.7 }, { name: 'Jalen McMillan', status: 'backup', projectedPoints: 4.5 }, { name: 'Rakim Jarrett', status: 'backup', projectedPoints: 2.2 }],
  'MIN-WR2': [{ name: 'Jordan Addison', status: 'starter', projectedPoints: 11.3 }, { name: 'Jalen Nailor', status: 'backup', projectedPoints: 4.2 }, { name: 'Brandon Powell', status: 'backup', projectedPoints: 2.5 }],
  'SEA-WR2': [{ name: 'Tyler Lockett', status: 'starter', projectedPoints: 10.9 }, { name: 'Jaxon Smith-Njigba', status: 'backup', projectedPoints: 8.5 }, { name: 'Jake Bobo', status: 'backup', projectedPoints: 3.2 }],
  'HOU-WR2': [{ name: 'Stefon Diggs', status: 'starter', projectedPoints: 10.5 }, { name: 'Tank Dell', status: 'injured', projectedPoints: 8.8 }, { name: 'Robert Woods', status: 'backup', projectedPoints: 3.5 }],
  'ATL-WR2': [{ name: 'Darnell Mooney', status: 'starter', projectedPoints: 10.1 }, { name: 'Ray-Ray McCloud', status: 'backup', projectedPoints: 3.2 }, { name: 'KhaDarel Hodge', status: 'backup', projectedPoints: 2.2 }],
  'GB-WR2': [{ name: 'Romeo Doubs', status: 'starter', projectedPoints: 9.7 }, { name: 'Christian Watson', status: 'injured', projectedPoints: 7.5 }, { name: 'Dontayvion Wicks', status: 'backup', projectedPoints: 5.2 }],
  'ARI-WR2': [{ name: 'Michael Wilson', status: 'starter', projectedPoints: 9.3 }, { name: 'Greg Dortch', status: 'backup', projectedPoints: 4.2 }, { name: 'Zay Jones', status: 'backup', projectedPoints: 3.5 }],
  'BUF-WR2': [{ name: 'Keon Coleman', status: 'starter', projectedPoints: 9.0 }, { name: 'Curtis Samuel', status: 'backup', projectedPoints: 5.5 }, { name: 'Mack Hollins', status: 'backup', projectedPoints: 3.8 }],
  'BAL-WR2': [{ name: 'Rashod Bateman', status: 'starter', projectedPoints: 8.6 }, { name: 'Nelson Agholor', status: 'backup', projectedPoints: 4.5 }, { name: 'Tylan Wallace', status: 'backup', projectedPoints: 2.8 }],
  'KC-WR2': [{ name: 'Hollywood Brown', status: 'injured', projectedPoints: 8.2 }, { name: 'JuJu Smith-Schuster', status: 'backup', projectedPoints: 5.2 }, { name: 'Skyy Moore', status: 'backup', projectedPoints: 3.5 }],
  'NYJ-WR2': [{ name: 'Allen Lazard', status: 'starter', projectedPoints: 7.8 }, { name: 'Xavier Gipson', status: 'backup', projectedPoints: 3.8 }, { name: 'Malik Taylor', status: 'backup', projectedPoints: 2.2 }],
  'JAX-WR2': [{ name: 'Gabe Davis', status: 'starter', projectedPoints: 7.4 }, { name: 'Tim Jones', status: 'backup', projectedPoints: 3.5 }, { name: 'Parker Washington', status: 'backup', projectedPoints: 2.8 }],
  'WAS-WR2': [{ name: 'Jahan Dotson', status: 'starter', projectedPoints: 7.0 }, { name: 'Olamide Zaccheaus', status: 'backup', projectedPoints: 3.8 }, { name: 'Dyami Brown', status: 'backup', projectedPoints: 2.5 }],
  'PIT-WR2': [{ name: 'Van Jefferson', status: 'starter', projectedPoints: 6.6 }, { name: 'Calvin Austin III', status: 'backup', projectedPoints: 4.2 }, { name: 'Roman Wilson', status: 'backup', projectedPoints: 3.5 }],
  'CHI-WR2': [{ name: 'Keenan Allen', status: 'starter', projectedPoints: 6.2 }, { name: 'Rome Odunze', status: 'backup', projectedPoints: 7.5 }, { name: 'Velus Jones Jr', status: 'backup', projectedPoints: 2.2 }],
  'NO-WR2': [{ name: 'Rashid Shaheed', status: 'starter', projectedPoints: 5.8 }, { name: 'AT Perry', status: 'backup', projectedPoints: 3.2 }, { name: 'Cedrick Wilson Jr', status: 'backup', projectedPoints: 2.5 }],
  'DEN-WR2': [{ name: 'Josh Reynolds', status: 'starter', projectedPoints: 5.4 }, { name: 'Marvin Mims Jr', status: 'backup', projectedPoints: 4.5 }, { name: 'Tim Patrick', status: 'backup', projectedPoints: 3.2 }],
  'IND-WR2': [{ name: 'Josh Downs', status: 'starter', projectedPoints: 5.0 }, { name: 'Adonai Mitchell', status: 'backup', projectedPoints: 5.2 }, { name: 'Ashton Dulin', status: 'backup', projectedPoints: 2.2 }],
  'LAC-WR2': [{ name: 'Ladd McConkey', status: 'starter', projectedPoints: 4.6 }, { name: 'Joshua Palmer', status: 'backup', projectedPoints: 3.8 }, { name: 'DJ Chark Jr', status: 'backup', projectedPoints: 2.5 }],
  'TEN-WR2': [{ name: 'Calvin Ridley', status: 'starter', projectedPoints: 4.3 }, { name: 'Tyler Boyd', status: 'backup', projectedPoints: 3.5 }, { name: 'Treylon Burks', status: 'injured', projectedPoints: 4.8 }],
  'CLE-WR2': [{ name: 'Jerry Jeudy', status: 'starter', projectedPoints: 3.8 }, { name: 'Elijah Moore', status: 'backup', projectedPoints: 3.2 }, { name: 'Cedric Tillman', status: 'backup', projectedPoints: 2.8 }],
  'LV-WR2': [{ name: 'Jakobi Meyers', status: 'starter', projectedPoints: 3.4 }, { name: 'Tre Tucker', status: 'backup', projectedPoints: 2.8 }, { name: 'Michael Gallup', status: 'backup', projectedPoints: 2.2 }],
  'NYG-WR2': [{ name: 'Darius Slayton', status: 'starter', projectedPoints: 3.1 }, { name: 'Wan\'Dale Robinson', status: 'backup', projectedPoints: 4.5 }, { name: 'Jalin Hyatt', status: 'backup', projectedPoints: 2.8 }],
  'NE-WR2': [{ name: 'DeMario Douglas', status: 'starter', projectedPoints: 2.7 }, { name: 'Kendrick Bourne', status: 'backup', projectedPoints: 3.2 }, { name: 'K.J. Osborn', status: 'backup', projectedPoints: 2.5 }],
  'CAR-WR2': [{ name: 'Adam Thielen', status: 'starter', projectedPoints: 2.3 }, { name: 'Jonathan Mingo', status: 'backup', projectedPoints: 3.8 }, { name: 'Xavier Legette', status: 'backup', projectedPoints: 4.2 }],
  // TEs
  'KC-TE': [{ name: 'Travis Kelce', status: 'starter', projectedPoints: 14.5 }, { name: 'Noah Gray', status: 'backup', projectedPoints: 4.2 }, { name: 'Jared Wiley', status: 'backup', projectedPoints: 1.8 }],
  'SF-TE': [{ name: 'George Kittle', status: 'starter', projectedPoints: 13.4 }, { name: 'Eric Saubert', status: 'backup', projectedPoints: 3.5 }, { name: 'Cameron Latu', status: 'backup', projectedPoints: 2.2 }],
  'DET-TE': [{ name: 'Sam LaPorta', status: 'starter', projectedPoints: 12.9 }, { name: 'Brock Wright', status: 'backup', projectedPoints: 3.8 }, { name: 'James Mitchell', status: 'backup', projectedPoints: 2.5 }],
  'BAL-TE': [{ name: 'Mark Andrews', status: 'starter', projectedPoints: 12.1 }, { name: 'Isaiah Likely', status: 'backup', projectedPoints: 6.8 }, { name: 'Charlie Kolar', status: 'backup', projectedPoints: 2.8 }],
  'DAL-TE': [{ name: 'Jake Ferguson', status: 'starter', projectedPoints: 11.3 }, { name: 'Luke Schoonmaker', status: 'backup', projectedPoints: 4.2 }, { name: 'Peyton Hendershot', status: 'backup', projectedPoints: 2.2 }],
  'MIA-TE': [{ name: 'Jonnu Smith', status: 'starter', projectedPoints: 10.5 }, { name: 'Durham Smythe', status: 'backup', projectedPoints: 3.2 }, { name: 'Julian Hill', status: 'backup', projectedPoints: 1.8 }],
  'LAR-TE': [{ name: 'Tyler Higbee', status: 'starter', projectedPoints: 9.7 }, { name: 'Colby Parkinson', status: 'backup', projectedPoints: 4.5 }, { name: 'Hunter Long', status: 'backup', projectedPoints: 2.2 }],
  'CIN-TE': [{ name: 'Mike Gesicki', status: 'starter', projectedPoints: 9.3 }, { name: 'Drew Sample', status: 'backup', projectedPoints: 3.5 }, { name: 'Erick All Jr', status: 'backup', projectedPoints: 2.8 }],
  'HOU-TE': [{ name: 'Dalton Schultz', status: 'starter', projectedPoints: 9.0 }, { name: 'Brevin Jordan', status: 'backup', projectedPoints: 3.8 }, { name: 'Cade Stover', status: 'backup', projectedPoints: 2.2 }],
  'GB-TE': [{ name: 'Tucker Kraft', status: 'starter', projectedPoints: 8.6 }, { name: 'Luke Musgrave', status: 'backup', projectedPoints: 4.2 }, { name: 'Ben Sims', status: 'backup', projectedPoints: 1.8 }],
  'PHI-TE': [{ name: 'Dallas Goedert', status: 'starter', projectedPoints: 8.1 }, { name: 'Grant Calcaterra', status: 'backup', projectedPoints: 3.5 }, { name: 'Albert Okwuegbunam', status: 'backup', projectedPoints: 2.2 }],
  'ATL-TE': [{ name: 'Kyle Pitts', status: 'starter', projectedPoints: 7.8 }, { name: 'Charlie Woerner', status: 'backup', projectedPoints: 2.5 }, { name: 'Ross Dwelley', status: 'backup', projectedPoints: 1.8 }],
  'MIN-TE': [{ name: 'T.J. Hockenson', status: 'injured', projectedPoints: 7.4 }, { name: 'Josh Oliver', status: 'backup', projectedPoints: 4.5 }, { name: 'Johnny Mundt', status: 'backup', projectedPoints: 2.2 }],
  'SEA-TE': [{ name: 'Noah Fant', status: 'starter', projectedPoints: 7.0 }, { name: 'Pharaoh Brown', status: 'backup', projectedPoints: 2.8 }, { name: 'Brady Russell', status: 'backup', projectedPoints: 1.5 }],
  'TB-TE': [{ name: 'Cade Otton', status: 'starter', projectedPoints: 6.6 }, { name: 'Ko Kieft', status: 'backup', projectedPoints: 2.2 }, { name: 'Payne Durham', status: 'backup', projectedPoints: 1.8 }],
  'ARI-TE': [{ name: 'Trey McBride', status: 'starter', projectedPoints: 6.2 }, { name: 'Elijah Higgins', status: 'backup', projectedPoints: 2.5 }, { name: 'Geoff Swaim', status: 'backup', projectedPoints: 1.5 }],
  'NYJ-TE': [{ name: 'Tyler Conklin', status: 'starter', projectedPoints: 5.8 }, { name: 'Jeremy Ruckert', status: 'backup', projectedPoints: 2.8 }, { name: 'C.J. Uzomah', status: 'backup', projectedPoints: 2.2 }],
  'BUF-TE': [{ name: 'Dalton Kincaid', status: 'starter', projectedPoints: 5.4 }, { name: 'Dawson Knox', status: 'backup', projectedPoints: 4.5 }, { name: 'Quintin Morris', status: 'backup', projectedPoints: 1.8 }],
  'JAX-TE': [{ name: 'Evan Engram', status: 'starter', projectedPoints: 5.0 }, { name: 'Luke Farrell', status: 'backup', projectedPoints: 2.2 }, { name: 'Brenton Strange', status: 'backup', projectedPoints: 2.8 }],
  'WAS-TE': [{ name: 'Zach Ertz', status: 'starter', projectedPoints: 4.6 }, { name: 'John Bates', status: 'backup', projectedPoints: 2.5 }, { name: 'Ben Sinnott', status: 'backup', projectedPoints: 3.2 }],
  'PIT-TE': [{ name: 'Pat Freiermuth', status: 'starter', projectedPoints: 4.3 }, { name: 'Darnell Washington', status: 'backup', projectedPoints: 2.8 }, { name: 'MyCole Pruitt', status: 'backup', projectedPoints: 1.5 }],
  'CHI-TE': [{ name: 'Cole Kmet', status: 'starter', projectedPoints: 3.8 }, { name: 'Gerald Everett', status: 'backup', projectedPoints: 2.5 }, { name: 'Tommy Sweeney', status: 'backup', projectedPoints: 1.2 }],
  'NO-TE': [{ name: 'Taysom Hill', status: 'starter', projectedPoints: 3.4 }, { name: 'Juwan Johnson', status: 'backup', projectedPoints: 3.8 }, { name: 'Foster Moreau', status: 'backup', projectedPoints: 2.2 }],
  'DEN-TE': [{ name: 'Adam Trautman', status: 'starter', projectedPoints: 3.1 }, { name: 'Greg Dulcich', status: 'injured', projectedPoints: 4.2 }, { name: 'Lucas Krull', status: 'backup', projectedPoints: 1.5 }],
  'IND-TE': [{ name: 'Mo Alie-Cox', status: 'starter', projectedPoints: 2.7 }, { name: 'Kylen Granson', status: 'backup', projectedPoints: 2.5 }, { name: 'Jelani Woods', status: 'injured', projectedPoints: 3.5 }],
  'LAC-TE': [{ name: 'Will Dissly', status: 'starter', projectedPoints: 2.3 }, { name: 'Hayden Hurst', status: 'backup', projectedPoints: 2.8 }, { name: 'Stone Smartt', status: 'backup', projectedPoints: 1.2 }],
  'TEN-TE': [{ name: 'Chigoziem Okonkwo', status: 'starter', projectedPoints: 1.9 }, { name: 'Josh Whyle', status: 'backup', projectedPoints: 2.2 }, { name: 'Nick Vannett', status: 'backup', projectedPoints: 1.5 }],
  'CLE-TE': [{ name: 'David Njoku', status: 'starter', projectedPoints: 1.7 }, { name: 'Harrison Bryant', status: 'backup', projectedPoints: 2.5 }, { name: 'Jordan Akins', status: 'backup', projectedPoints: 1.2 }],
  'LV-TE': [{ name: 'Brock Bowers', status: 'starter', projectedPoints: 1.5 }, { name: 'Michael Mayer', status: 'backup', projectedPoints: 3.2 }, { name: 'Harrison Bryant', status: 'backup', projectedPoints: 1.8 }],
  'NYG-TE': [{ name: 'Daniel Bellinger', status: 'starter', projectedPoints: 1.3 }, { name: 'Theo Johnson', status: 'backup', projectedPoints: 2.5 }, { name: 'Chris Manhertz', status: 'backup', projectedPoints: 0.8 }],
  'NE-TE': [{ name: 'Hunter Henry', status: 'starter', projectedPoints: 1.1 }, { name: 'Austin Hooper', status: 'backup', projectedPoints: 2.2 }, { name: 'Jaheim Bell', status: 'backup', projectedPoints: 1.5 }],
  'CAR-TE': [{ name: 'Tommy Tremble', status: 'starter', projectedPoints: 0.9 }, { name: 'Ian Thomas', status: 'backup', projectedPoints: 1.8 }, { name: 'Ja\'Tavion Sanders', status: 'backup', projectedPoints: 2.2 }],
  // DSTs
  'SF-DST': [{ name: '49ers Defense', status: 'starter', projectedPoints: 9.9 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 4.5 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 2.2 }],
  'DAL-DST': [{ name: 'Cowboys Defense', status: 'starter', projectedPoints: 9.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 4.2 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 2.0 }],
  'BAL-DST': [{ name: 'Ravens Defense', status: 'starter', projectedPoints: 9.0 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 4.0 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.8 }],
  'CLE-DST': [{ name: 'Browns Defense', status: 'starter', projectedPoints: 8.6 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 3.8 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.6 }],
  'NYJ-DST': [{ name: 'Jets Defense', status: 'starter', projectedPoints: 8.1 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 3.5 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.5 }],
  'BUF-DST': [{ name: 'Bills Defense', status: 'starter', projectedPoints: 7.8 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 3.5 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.5 }],
  'MIA-DST': [{ name: 'Dolphins Defense', status: 'starter', projectedPoints: 7.4 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 3.2 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.4 }],
  'KC-DST': [{ name: 'Chiefs Defense', status: 'starter', projectedPoints: 7.0 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 3.0 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.3 }],
  'PIT-DST': [{ name: 'Steelers Defense', status: 'starter', projectedPoints: 6.6 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 2.8 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.2 }],
  'DET-DST': [{ name: 'Lions Defense', status: 'starter', projectedPoints: 6.2 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 2.6 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.1 }],
  'PHI-DST': [{ name: 'Eagles Defense', status: 'starter', projectedPoints: 5.8 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 2.5 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 1.0 }],
  'MIN-DST': [{ name: 'Vikings Defense', status: 'starter', projectedPoints: 5.4 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 2.3 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.9 }],
  'HOU-DST': [{ name: 'Texans Defense', status: 'starter', projectedPoints: 5.0 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 2.1 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.8 }],
  'GB-DST': [{ name: 'Packers Defense', status: 'starter', projectedPoints: 4.6 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.9 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.7 }],
  'NO-DST': [{ name: 'Saints Defense', status: 'starter', projectedPoints: 4.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.8 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.6 }],
  'LAR-DST': [{ name: 'Rams Defense', status: 'starter', projectedPoints: 3.8 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.6 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.5 }],
  'SEA-DST': [{ name: 'Seahawks Defense', status: 'starter', projectedPoints: 3.4 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.4 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.5 }],
  'CIN-DST': [{ name: 'Bengals Defense', status: 'starter', projectedPoints: 3.1 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.3 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.4 }],
  'TB-DST': [{ name: 'Buccaneers Defense', status: 'starter', projectedPoints: 2.7 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.1 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.4 }],
  'ATL-DST': [{ name: 'Falcons Defense', status: 'starter', projectedPoints: 2.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 1.0 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.3 }],
  'DEN-DST': [{ name: 'Broncos Defense', status: 'starter', projectedPoints: 1.9 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.8 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.3 }],
  'JAX-DST': [{ name: 'Jaguars Defense', status: 'starter', projectedPoints: 1.7 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.7 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.2 }],
  'IND-DST': [{ name: 'Colts Defense', status: 'starter', projectedPoints: 1.5 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.6 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.2 }],
  'CHI-DST': [{ name: 'Bears Defense', status: 'starter', projectedPoints: 1.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.5 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.2 }],
  'ARI-DST': [{ name: 'Cardinals Defense', status: 'starter', projectedPoints: 1.1 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.4 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'WAS-DST': [{ name: 'Commanders Defense', status: 'starter', projectedPoints: 0.9 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.4 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'TEN-DST': [{ name: 'Titans Defense', status: 'starter', projectedPoints: 0.7 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.3 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'LAC-DST': [{ name: 'Chargers Defense', status: 'starter', projectedPoints: 0.6 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.2 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'LV-DST': [{ name: 'Raiders Defense', status: 'starter', projectedPoints: 0.5 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.2 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'NYG-DST': [{ name: 'Giants Defense', status: 'starter', projectedPoints: 0.4 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.2 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'NE-DST': [{ name: 'Patriots Defense', status: 'starter', projectedPoints: 0.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.1 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.1 }],
  'CAR-DST': [{ name: 'Panthers Defense', status: 'starter', projectedPoints: 0.3 }, { name: 'Backup Unit', status: 'backup', projectedPoints: 0.1 }, { name: 'Practice Squad', status: 'backup', projectedPoints: 0.0 }],
};

// NFL Team Bye Weeks for 2025 season
const teamByeWeeks: { [team: string]: number } = {
  ARI: 11, ATL: 12, BAL: 14, BUF: 7, CAR: 11, CHI: 7, CIN: 12, CLE: 10,
  DAL: 7, DEN: 14, DET: 5, GB: 10, HOU: 14, IND: 14, JAX: 12, KC: 6,
  LAC: 5, LAR: 6, LV: 10, MIA: 6, MIN: 6, NE: 14, NO: 12, NYG: 11,
  NYJ: 12, PHI: 5, PIT: 9, SEA: 10, SF: 9, TB: 11, TEN: 5, WAS: 14,
};

// Mock team positions (rankings) - sorted by season points by default
export const mockTeamPositions: TeamPosition[] = teamPositionRankings.map(([team, position, seasonPoints, weeklyPoints, projectedPoints], index) => ({
  id: String(index + 1),
  team,
  position,
  currentPlayer: '',
  seasonPoints,
  weeklyPoints,
  projectedPoints,
  byeWeek: teamByeWeeks[team] || 7,
  adp: Math.round((index + 1) * 0.9 + (index % 7)), // ADP roughly correlates with ranking
  adpChange: ((index * 17) % 11) - 5, // Simulated weekly change between -5 and +5
  depthChart: depthChartData[`${team}-${position}`] || [],
}));
