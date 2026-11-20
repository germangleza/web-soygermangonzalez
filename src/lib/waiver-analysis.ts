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
        secondBid: row.secondBid ?? null,
        /** FAAB pagado de más sobre la segunda puja (con $1 bastaba para ganar). */
        overpay: row.secondBid === null || row.secondBid === undefined ? null : Math.max(row.bid - row.secondBid - 1, 0),
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
      overpay: list.some((move) => move.overpay !== null)
        ? list.reduce((total, move) => total + (move.overpay ?? 0), 0) : null,
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

const sameName = (a: string, b: string) => normalize(a) === normalize(b);

/** ¿Gastar salva? Cruza el FAAB de cada manager con las eliminaciones de la guillotina. */
export function survival(reports: WaiverReport[], season: number) {
  const seasonReports = reports.filter((report) => report.season === season);
  const lastWeek = Math.max(0, ...seasonReports.map((report) => report.week));
  const eliminations = seasonReports
    .filter((report) => report.eliminated)
    .map((report) => ({ manager: report.eliminated!, week: report.week }));
  const managers = new Map<string, { manager: string; spent: number; moves: number }>();
  for (const move of seasonReports.flatMap((report) => report.moves)) {
    if (!move.manager) continue;
    const key = normalize(move.manager);
    const entry = managers.get(key) ?? { manager: move.manager, spent: 0, moves: 0 };
    entry.spent += move.bid;
    entry.moves += 1;
    managers.set(key, entry);
  }
  for (const { manager } of eliminations) {
    if (!managers.has(normalize(manager))) managers.set(normalize(manager), { manager, spent: 0, moves: 0 });
  }
  const rows = [...managers.values()].map((entry) => {
    const out = eliminations.find((elimination) => sameName(elimination.manager, entry.manager));
    const weeksActive = out ? out.week : lastWeek;
    return {
      ...entry,
      eliminatedWeek: out?.week ?? null,
      perWeek: weeksActive > 0 ? entry.spent / weeksActive : null,
    };
  }).sort((a, b) => b.spent - a.spent);
  const average = (list: typeof rows, pick: (row: (typeof rows)[number]) => number | null) => {
    const values = list.map(pick).filter((value): value is number => value !== null);
    return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
  };
  const alive = rows.filter((row) => row.eliminatedWeek === null);
  const out = rows.filter((row) => row.eliminatedWeek !== null);
  return {
    rows,
    hasEliminations: eliminations.length > 0,
    alive: { count: alive.length, spent: average(alive, (row) => row.spent), perWeek: average(alive, (row) => row.perWeek) },
    out: { count: out.length, spent: average(out, (row) => row.spent), perWeek: average(out, (row) => row.perWeek) },
  };
}

export const priceTierEdges = [20, 25, 30, 35];

/** Precio de referencia: cuánto costó, en promedio, un jugador según su promedio fantasy al ficharlo. */
export function priceTiers(reports: WaiverReport[], season: number) {
  const moves = reports.filter((report) => report.season === season).flatMap((report) => report.moves);
  const bounds = [-Infinity, ...priceTierEdges, Infinity];
  return bounds.slice(0, -1).map((low, index) => {
    const high = bounds[index + 1];
    const label = low === -Infinity ? 'Menos de ' + high : high === Infinity ? low + ' o más' : low + ' a ' + (high - 0.1).toFixed(1);
    const bids = moves.filter((move) => move.addedAverage >= low && move.addedAverage < high)
      .map((move) => move.bid).sort((a, b) => a - b);
    const middle = Math.floor(bids.length / 2);
    return {
      label,
      count: bids.length,
      average: bids.length ? bids.reduce((total, bid) => total + bid, 0) / bids.length : null,
      median: bids.length ? (bids.length % 2 ? bids[middle] : (bids[middle - 1] + bids[middle]) / 2) : null,
      min: bids.length ? bids[0] : null,
      max: bids.length ? bids[bids.length - 1] : null,
    };
  });
}
