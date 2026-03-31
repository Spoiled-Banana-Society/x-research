import { describe, it, expect } from 'vitest';
import { ALL_POSITIONS } from '@/data/nfl-players';

describe('NFL Players Data', () => {
  it('generates positions for all 32 teams', () => {
    const teams = new Set(ALL_POSITIONS.map(p => p.team));
    expect(teams.size).toBe(32);
  });

  it('has 7 positions per team (224 total)', () => {
    expect(ALL_POSITIONS.length).toBe(224);
  });

  it('every position has required fields', () => {
    for (const pos of ALL_POSITIONS) {
      expect(pos.team).toBeTruthy();
      expect(pos.position).toBeTruthy();
      expect(pos.playerId).toBeTruthy();
      expect(typeof pos.byeWeek).toBe('number');
      expect(pos.byeWeek).toBeGreaterThanOrEqual(1);
      expect(pos.byeWeek).toBeLessThanOrEqual(14);
      expect(typeof pos.adp).toBe('number');
      expect(typeof pos.rank).toBe('number');
      expect(Array.isArray(pos.playersFromTeam)).toBe(true);
    }
  });

  it('playerId matches team-position format', () => {
    for (const pos of ALL_POSITIONS) {
      expect(pos.playerId).toContain(pos.team);
      expect(pos.playerId).toContain(pos.position);
    }
  });

  it('each team has QB, RB1, RB2, WR1, WR2, TE, DST', () => {
    const teams = [...new Set(ALL_POSITIONS.map(p => p.team))];
    for (const team of teams) {
      const teamPos = ALL_POSITIONS.filter(p => p.team === team).map(p => p.position);
      expect(teamPos).toContain('QB');
      expect(teamPos).toContain('RB1');
      expect(teamPos).toContain('WR1');
      expect(teamPos).toContain('TE');
      expect(teamPos).toContain('DST');
    }
  });
});
