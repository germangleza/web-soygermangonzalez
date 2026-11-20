import { describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn() }));
import { managerRanking, seasonMoves, weeklyTrend } from '../src/lib/waiver-analysis';
import { parseReport, parseSnapshot } from '../src/lib/waiver-reports';

const week3 = parseReport(2026, 3, 'Jalen Suggs\t30\t10\tOld Guy\t25\tAna\nCheap Star\t28\t0\tBench\t20\tLuis');
const week5 = parseReport(2026, 5, 'Hot Start\t40\t30\tSolid\t30\tAna');
const later = parseSnapshot(2026, 8, 'jalen suggs\t36\nOld Guy\t25\nHot Start\t29\nSolid\t31');

describe('waiver analysis', () => {
  it('keeps backwards-compatible 5-column rows and reads the optional manager', () => {
    expect(parseReport(2026, 1, 'A\t30\t5\tB\t20').moves[0].manager).toBeNull();
    expect(week3.moves[0].manager).toBe('Ana');
  });

  it('compares each pickup with the latest later snapshot, ignoring accents and case', () => {
    const moves = seasonMoves([week5, week3], [later], 2026);
    const suggs = moves.find((move) => move.added === 'Jalen Suggs')!;
    expect(suggs).toMatchObject({ gain: 5, gainNow: 11, change: 6, verdict: 'up', snapshotWeek: 8 });
    const hot = moves.find((move) => move.added === 'Hot Start')!;
    expect(hot).toMatchObject({ gain: 10, gainNow: -2, verdict: 'down' });
    expect(moves.find((move) => move.added === 'Cheap Star')!.verdict).toBe('pending');
  });

  it('ignores snapshots taken before the pickup', () => {
    const early = parseSnapshot(2026, 4, 'Hot Start\t10\nSolid\t40');
    const hot = seasonMoves([week5], [early], 2026)[0];
    expect(hot.verdict).toBe('pending');
  });

  it('ranks managers by fantasy points gained, using follow-up data when available', () => {
    const ranking = managerRanking(seasonMoves([week5, week3], [later], 2026));
    expect(ranking.map(({ manager, gain }) => [manager, gain])).toEqual([['Ana', 9], ['Luis', 8]]);
    expect(ranking[0]).toMatchObject({ spent: 40, hits: 1, misses: 1 });
  });

  it('summarizes the FAAB market week by week in order', () => {
    expect(weeklyTrend([week5, week3], 2026).map(({ week, spent, topBid }) => [week, spent, topBid]))
      .toEqual([[3, 10, 10], [5, 30, 30]]);
  });
});
