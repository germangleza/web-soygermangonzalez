import { describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn() }));
import { managerRanking, priceTiers, seasonMoves, survival, weeklyTrend } from '../src/lib/waiver-analysis';
import { gamesByTeam, parseSchedule, scheduleWindows } from '../src/lib/nba-schedule';
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

describe('bids, survival and price reference', () => {
  it('reads the optional second bid and computes what was paid above the minimum to win', () => {
    const report = parseReport(2026, 2, 'A\t30\t20\tB\t25\tAna\t12\nC\t20\t5\t\t\tLuis');
    const [a, c] = seasonMoves([report], [], 2026);
    expect(a).toMatchObject({ secondBid: 12, overpay: 7 });
    expect(c.overpay).toBeNull();
    expect(() => parseReport(2026, 2, 'A\t30\t5\tB\t25\tAna\t9')).toThrow('segunda puja');
  });

  it('compares spending per active week between survivors and eliminated managers', () => {
    const w1 = parseReport(2026, 1, 'A\t30\t40\t\t\tAna\nB\t30\t10\t\t\tLuis', 'luis');
    const w2 = parseReport(2026, 2, 'C\t30\t20\t\t\tAna\nD\t30\t0\t\t\tPepe', 'Sin Moves');
    const result = survival([w2, w1], 2026);
    expect(result.rows.map(({ manager, eliminatedWeek, perWeek }) => [manager, eliminatedWeek, perWeek])).toEqual([
      ['Ana', null, 30], ['Luis', 1, 10], ['Pepe', null, 0], ['Sin Moves', 2, 0],
    ]);
    expect(result.alive).toMatchObject({ count: 2, perWeek: 15 });
    expect(result.out).toMatchObject({ count: 2, perWeek: 5 });
  });

  it('groups winning bids by fantasy average tier', () => {
    const report = parseReport(2026, 1, 'A\t31\t10\nB\t33\t30\nC\t34.9\t20\nD\t18\t0\nE\t36\t50');
    const tiers = priceTiers([report], 2026);
    expect(tiers.map(({ label, count }) => [label, count])).toEqual([
      ['Menos de 20', 1], ['20 a 24.9', 0], ['25 a 29.9', 0], ['30 a 34.9', 3], ['35 o más', 1],
    ]);
    expect(tiers[3]).toMatchObject({ average: 20, median: 20, min: 10, max: 30 });
  });
});

describe('NBA schedule', () => {
  it('uses Wednesday–Sunday for the waiver week and full Monday–Sunday weeks after it', () => {
    // Viernes 20 de noviembre de 2026, 23:30 en Ciudad de México = sábado 21 en UTC, viernes en Nueva York.
    expect(scheduleWindows(new Date('2026-11-21T05:30:00Z')).map(({ start, end }) => [start, end])).toEqual([
      ['2026-11-18', '2026-11-22'], ['2026-11-23', '2026-11-29'], ['2026-11-30', '2026-12-06'],
    ]);
  });

  it('counts regular-season games per team inside each window', () => {
    const game = (gameId: string, date: string, home: string, away: string) =>
      ({ gameId, gameDateEst: date + 'T00:00:00Z', homeTeam: { teamTricode: home }, awayTeam: { teamTricode: away } });
    const games = parseSchedule({ leagueSchedule: { gameDates: [{ games: [
      game('0012600001', '2026-11-18', 'LAL', 'BOS'),
      game('0022600100', '2026-11-17', 'LAL', 'BOS'),
      game('0022600101', '2026-11-18', 'LAL', 'BOS'),
      game('0022600102', '2026-11-22', 'MIA', 'LAL'),
      game('0022600103', '2026-11-24', 'BOS', 'MIA'),
    ] }] } });
    const windows = scheduleWindows(new Date('2026-11-20T12:00:00Z'));
    expect(gamesByTeam(games, windows).map(({ team, counts }) => [team, counts])).toEqual([
      ['LAL', [2, 0, 0]], ['BOS', [1, 1, 0]], ['MIA', [1, 1, 0]],
    ]);
  });
});
