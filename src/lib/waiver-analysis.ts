import { costPerPoint, pointsDifference } from './waiver-metrics';
import { reportMetrics, type AverageSnapshot, type WaiverReport } from './waiver-reports';

/** Diferencia (pts/partido) a partir de la cual un pickup se considera mejor o peor que al ficharlo. */
export const progressionThreshold = 2;

export type Verdict = 'up' | 'steady' | 'down' | 'pending';
export const verdictLabels: Record<Verdict, string> = {
  up: 'Mejoró', steady: 'Se sostiene', down: 'Se cayó', pending: 'Sin seguimiento',
};

const normalize = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();

/** Todos los movimientos de una temporada, con métricas al fichar y, si existe, el seguimiento más reciente. */
export function seasonMoves(reports: WaiverReport[], snapshots: AverageSnapshot[], season: number) {
  const later = snapshots
    .filter((snapshot) => snapshot.season === season)
    .sort((a, b) => b.week - a.week)
    .map((snapshot) => ({
      week: snapshot.week,
      averages: new Map(snapshot.averages.map(({ player, average }) => [normalize(player), average])),
    }));

  return reports
    .filter((report) => report.season === season)
    .flatMap((report) => reportMetrics(report.moves).rows.map((row) => {
      const snapshot = later.find(({ week, averages }) => week > report.week && averages.has(normalize(row.added)));
      const addedNow = snapshot?.averages.get(normalize(row.added)) ?? null;
      const droppedNow = row.dropped ? snapshot?.averages.get(normalize(row.dropped)) ?? null : null;
      const gainNow = addedNow !== null && droppedNow !== null ? pointsDifference(addedNow, droppedNow) : null;
      // Sin baja comparable, la progresión se mide con el promedio del jugador agregado.
      const change = gainNow !== null && row.gain !== null
        ? pointsDifference(gainNow, row.gain)
        : addedNow !== null ? pointsDifference(addedNow, row.addedAverage) : null;
      const verdict: Verdict = change === null ? 'pending'
        : change >= progressionThreshold ? 'up'
        : change <= -progressionThreshold ? 'down' : 'steady';
      return {
        ...row,
        week: report.week,
        manager: row.manager ?? null,
        snapshotWeek: snapshot?.week ?? null,
        addedNow, droppedNow, gainNow, change, verdict,
        netCostNow: costPerPoint(row.bid, gainNow),
        /** Mejor dato disponible: el de seguimiento si existe, si no el del momento del pickup. */
        bestGain: gainNow ?? row.gain,
      };
    }));
}

export type SeasonMove = ReturnType<typeof seasonMoves>[number];

export function managerRanking(moves: SeasonMove[]) {
  const byManager = new Map<string, SeasonMove[]>();
  for (const move of moves) {
    if (!move.manager) continue;
    byManager.set(move.manager, [...(byManager.get(move.manager) ?? []), move]);
  }
  return [...byManager].map(([manager, list]) => {
    const measured = list.filter((move) => move.bestGain !== null);
    const gain = measured.reduce((total, move) => total + (move.bestGain ?? 0), 0);
    const spent = list.reduce((total, move) => total + move.bid, 0);
    const measuredSpent = measured.reduce((total, move) => total + move.bid, 0);
    return {
      manager,
      moves: list.length,
      spent,
      gain: pointsDifference(gain, 0),
      costPerPoint: costPerPoint(measuredSpent, gain),
      hits: list.filter((move) => move.verdict === 'up').length,
      misses: list.filter((move) => move.verdict === 'down').length,
    };
  }).sort((a, b) => b.gain - a.gain || a.spent - b.spent);
}

/** Precio del mercado de waivers semana a semana. */
export function weeklyTrend(reports: WaiverReport[], season: number) {
  return reports
    .filter((report) => report.season === season)
    .sort((a, b) => a.week - b.week)
    .map((report) => {
      const metrics = reportMetrics(report.moves);
      const bids = report.moves.map((move) => move.bid);
      return {
        week: report.week,
        moves: report.moves.length,
        spent: metrics.totalBid,
        averageBid: bids.length ? metrics.totalBid / bids.length : 0,
        topBid: bids.length ? Math.max(...bids) : 0,
        weightedCost: metrics.weightedCost,
      };
    });
}
