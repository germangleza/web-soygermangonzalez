export const scoringWeights = { pts: 1, threes: 1.5, reb: 1.5, ast: 1.5, stl: 3, blk: 3, to: -2 };

export function fantasyScore(stats: Record<keyof typeof scoringWeights, number>) {
  return Object.entries(scoringWeights).reduce(
    (total, [stat, weight]) => total + stats[stat as keyof typeof stats] * weight, 0,
  );
}

export function pointsDifference(next: number, previous: number) {
  return Number((next - previous).toFixed(8)) || 0;
}

export function costPerPoint(bid: number, points: number | null) {
  return points !== null && points > 0 ? bid / points : null;
}

export const points = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const faab = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function faabLabel(value: number | null) {
  return value === null ? '—' : '$' + faab.format(value);
}
