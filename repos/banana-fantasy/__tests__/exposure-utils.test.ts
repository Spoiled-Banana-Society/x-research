import { describe, it, expect } from 'vitest';
import {
  computeStacks,
  computeByeWeekRisk,
  positions,
  nflTeams,
  type ExposureEntry,
} from '@/lib/exposureUtils';

describe('Exposure Utils', () => {
  describe('constants', () => {
    it('has standard fantasy positions', () => {
      expect(positions).toContain('QB');
      expect(positions).toContain('WR1');
      expect(positions).toContain('RB1');
      expect(positions).toContain('TE');
      expect(positions).toContain('DST');
    });

    it('has all 32 NFL teams', () => {
      expect(nflTeams.length).toBe(32);
    });
  });

  describe('computeStacks', () => {
    it('detects same-team stacks', () => {
      const exposures: ExposureEntry[] = [
        { team: 'KC', position: 'QB', exposure: 80, drafts: 8, totalDrafts: 10, displayName: 'KC-QB', bye: 6, adp: 5, projectedPoints: 20 },
        { team: 'KC', position: 'TE', exposure: 60, drafts: 6, totalDrafts: 10, displayName: 'KC-TE', bye: 6, adp: 50, projectedPoints: 14 },
      ];
      const stacks = computeStacks(exposures);
      expect(stacks.length).toBeGreaterThan(0);
      expect(stacks[0].team).toBe('KC');
    });

    it('returns empty for no same-team pairs', () => {
      const exposures: ExposureEntry[] = [
        { team: 'KC', position: 'QB', exposure: 80, drafts: 8, totalDrafts: 10, displayName: 'KC-QB', bye: 6, adp: 5, projectedPoints: 20 },
        { team: 'BUF', position: 'QB', exposure: 60, drafts: 6, totalDrafts: 10, displayName: 'BUF-QB', bye: 7, adp: 1, projectedPoints: 24 },
      ];
      const stacks = computeStacks(exposures);
      expect(stacks.length).toBe(0);
    });
  });

  describe('computeByeWeekRisk', () => {
    it('groups exposure by bye week', () => {
      const exposures: ExposureEntry[] = [
        { team: 'KC', position: 'QB', exposure: 50, drafts: 5, totalDrafts: 10, displayName: 'KC-QB', bye: 6, adp: 5, projectedPoints: 20 },
        { team: 'MIA', position: 'WR1', exposure: 30, drafts: 3, totalDrafts: 10, displayName: 'MIA-WR1', bye: 6, adp: 10, projectedPoints: 17 },
      ];
      const risk = computeByeWeekRisk(exposures);
      expect(risk.length).toBeGreaterThan(0);
      const week6 = risk.find(r => r.week === 6);
      expect(week6).toBeDefined();
    });

    it('returns empty for no exposures', () => {
      const risk = computeByeWeekRisk([]);
      expect(risk.length).toBe(0);
    });
  });
});
