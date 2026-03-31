import { describe, it, expect } from 'vitest';
import { wheelSegments } from '@/lib/wheelConfig';

describe('Wheel Configuration', () => {
  it('has segments defined', () => {
    expect(wheelSegments.length).toBeGreaterThan(0);
  });

  it('probabilities sum to approximately 1.0', () => {
    const sum = wheelSegments.reduce((s, seg) => s + seg.probability, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.001);
  });

  it('every segment has required fields', () => {
    for (const seg of wheelSegments) {
      expect(seg.id).toBeTruthy();
      expect(seg.label).toBeTruthy();
      expect(typeof seg.probability).toBe('number');
      expect(seg.probability).toBeGreaterThan(0);
      expect(seg.probability).toBeLessThanOrEqual(1);
    }
  });

  it('no duplicate segment IDs', () => {
    const ids = wheelSegments.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('contains draft prize segments', () => {
    const ids = wheelSegments.map(s => s.id);
    expect(ids.some(id => id.startsWith('draft-'))).toBe(true);
  });
});
