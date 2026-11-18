import { costPerPoint, pointsDifference } from './waiver-metrics';

const reportKey = 'guillotina:87354:reports:v1';
export const reportColumns = 'Jugador agregado\tPromedio agregado\tPuja FAAB\tJugador soltado\tPromedio soltado';

export interface WaiverMove {
  added: string;
  addedAverage: number;
  bid: number;
  dropped: string | null;
  droppedAverage: number | null;
}

export interface WaiverReport {
  season: number;
  week: number;
  publishedAt: string;
  moves: WaiverMove[];
}

export function reportMetrics(moves: WaiverMove[]) {
  const rows = moves.map((move) => {
    const gain = move.droppedAverage === null ? null : pointsDifference(move.addedAverage, move.droppedAverage);
    return { ...move, gain, grossCost: costPerPoint(move.bid, move.addedAverage), netCost: costPerPoint(move.bid, gain) };
  });
  const positive = rows.filter((row) => row.gain !== null && row.gain > 0);
  const positiveGain = positive.reduce((total, row) => total + (row.gain ?? 0), 0);
  const totalBid = rows.reduce((total, row) => total + row.bid, 0);
  return {
    rows, totalBid,
    positiveCount: positive.length,
    weightedCost: costPerPoint(positive.reduce((total, row) => total + row.bid, 0), positiveGain),
  };
}

function parseNumber(raw: string, message: string) {
  const text = raw.trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) throw new Error(message);
  const value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value) || Math.abs(value) > 1000) throw new Error(message);
  return value;
}

export function parseReport(season: number, week: number, text: string): WaiverReport {
  if (!Number.isInteger(season) || season < 2000 || season > 2100 ||
      !Number.isInteger(week) || week < 1 || week > 30) {
    throw new Error('Indica el año de inicio de la temporada y una semana de Yahoo entre 1 y 30.');
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines[0]?.trim() === reportColumns) lines.shift();
  if (!lines.length || lines.length > 250) throw new Error('Pega entre 1 y 250 movimientos completados.');
  const moves = lines.map((line, index): WaiverMove => {
    const columns = line.split('\t').map((cell) => cell.trim());
    const [added, avg, offer, dropped = '', dropAvg = ''] = columns;
    const label = 'Fila ' + (index + 1);
    if (columns.length < 3 || columns.length > 5 || !added || added.length > 100 || dropped.length > 100) {
      throw new Error(label + ' · revisa las columnas y los nombres.');
    }
    const addedAverage = parseNumber(avg, label + ' · falta el promedio válido del jugador agregado.');
    const bid = parseNumber(offer.replace(/^\$\s*/, ''), label + ' · puja inválida.');
    if (!Number.isInteger(bid) || bid < 0 || bid > 100) throw new Error(label + ' · el FAAB debe ser un entero entre 0 y 100.');
    if (dropAvg && !dropped) throw new Error(label + ' · escribe el nombre del jugador soltado.');
    const droppedAverage = dropAvg ? parseNumber(dropAvg, label + ' · promedio inválido del jugador soltado.') : null;
    return { added, addedAverage, bid, dropped: dropped || null, droppedAverage };
  });
  return { season, week, moves, publishedAt: new Date().toISOString() };
}

function storageConfig() {
  const url = process.env.NBAFANTASY_REDIS_URL;
  const token = process.env.NBAFANTASY_REDIS_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(command: string[]) {
  const config = storageConfig();
  if (!config) throw new Error('Report storage is not configured');
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + config.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Report storage is unavailable');
  const payload = await response.json();
  if (payload.error) throw new Error('Report storage rejected the command');
  return payload.result;
}

export async function readReports(): Promise<WaiverReport[]> {
  if (!storageConfig()) return [];
  const values = await redis(['HVALS', reportKey]) as string[];
  return values.map((value) => JSON.parse(value) as WaiverReport)
    .sort((a, b) => b.season - a.season || b.week - a.week);
}

export async function publishReport(report: WaiverReport) {
  await redis(['HSET', reportKey, report.season + ':' + report.week, JSON.stringify(report)]);
}
