import { describe, it, expect } from 'vitest';
import { getPositionColor, generateReelResults, ALL_POSITIONS } from '@/lib/draftRoomConstants';

describe('Draft Room Constants', () => {
  describe('getPositionColor', () => {
    it('returns colors for standard positions', () => {
      expect(getPositionColor('QB')).toBeTruthy();
      expect(getPositionColor('RB1')).toBeTruthy();
      expect(getPositionColor('WR1')).toBeTruthy();
      expect(getPositionColor('TE')).toBeTruthy();
      expect(getPositionColor('DST')).toBeTruthy();
    });
  });

  describe('generateReelResults', () => {
    it('returns an array of 3 results', () => {
      const results = generateReelResults();
      expect(results.length).toBe(3);
    });

    it('each result is a valid draft type', () => {
      for (let i = 0; i < 50; i++) {
        const results = generateReelResults();
        for (const r of results) {
          expect(['pro', 'hof', 'jackpot']).toContain(r);
        }
      }
    });

    it('produces roughly correct distribution over many runs', () => {
      let jackpots = 0;
      const runs = 10000;
      for (let i = 0; i < runs; i++) {
        const results = generateReelResults();
        if (results[0] === 'jackpot' && results[1] === 'jackpot' && results[2] === 'jackpot') {
          jackpots++;
        }
      }
      // Jackpot should be ~1% = ~100 out of 10000
      expect(jackpots).toBeLessThan(500);
    });
  });

  describe('ALL_POSITIONS', () => {
    it('re-exports from data/nfl-players', () => {
      expect(ALL_POSITIONS.length).toBe(224);
    });
  });
});
