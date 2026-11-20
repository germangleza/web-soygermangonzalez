import { get, list, put } from '@vercel/blob';
import { costPerPoint, pointsDifference } from './waiver-metrics';

const reportPrefix = 'guillotina/87354/reports/';
const reportKey = 'guillotina:87354:reports:v1';
const snapshotPrefix = 'guillotina/87354/averages/';
const snapshotKey = 'guillotina:87354:averages:v1';
const legacyColumns = 'Jugador agregado\tPromedio agregado\tPuja FAAB\tJugador soltado\tPromedio soltado';
const managerColumns = legacyColumns + '\tManager';
export const reportColumns = managerColumns + '\tSegunda puja';
export const snapshotColumns = 'Jugador\tPromedio actual';

export interface WaiverMove {
  added: string;
  addedAverage: number;
  bid: number;
  dropped: string | null;
  droppedAverage: number | null;
  manager?: string | null;
  /** Segunda puja más alta, si se conoce (Yahoo la avisa por correo a quien pujó). */
  secondBid?: number | null;
}

/** Promedios de una fecha posterior, para medir si los pickups se sostuvieron. */
export interface AverageSnapshot {
  season: number;
  week: number;
  publishedAt: string;
  averages: { player: string; average: number }[];
}

export interface WaiverReport {
  season: number;
  week: number;
  publishedAt: string;
  moves: WaiverMove[];
  /** Manager eliminado por la guillotina esa semana. */
  eliminated?: string | null;
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

function checkWeek(season: number, week: number) {
  if (!Number.isInteger(season) || season < 2000 || season > 2100 ||
      !Number.isInteger(week) || week < 1 || week > 30) {
    throw new Error('Indica el año de inicio de la temporada y una semana de Yahoo entre 1 y 30.');
  }
}

export function parseReport(season: number, week: number, text: string, eliminated = ''): WaiverReport {
  checkWeek(season, week);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if ([reportColumns, managerColumns, legacyColumns].includes(lines[0]?.trim())) lines.shift();
  const eliminatedName = eliminated.trim();
  if (eliminatedName.length > 60) throw new Error('El nombre del manager eliminado es demasiado largo.');
  if (!lines.length || lines.length > 250) throw new Error('Pega entre 1 y 250 movimientos completados.');
  const moves = lines.map((line, index): WaiverMove => {
    const columns = line.split('\t').map((cell) => cell.trim());
    const [added, avg, offer, dropped = '', dropAvg = '', manager = '', second = ''] = columns;
    const label = 'Fila ' + (index + 1);
    if (columns.length < 3 || columns.length > 7 || !added || added.length > 100 || dropped.length > 100 || manager.length > 60) {
      throw new Error(label + ' · revisa las columnas y los nombres.');
    }
    const addedAverage = parseNumber(avg, label + ' · falta el promedio válido del jugador agregado.');
    const bid = parseNumber(offer.replace(/^\$\s*/, ''), label + ' · puja inválida.');
    if (!Number.isInteger(bid) || bid < 0 || bid > 100) throw new Error(label + ' · el FAAB debe ser un entero entre 0 y 100.');
    if (dropAvg && !dropped) throw new Error(label + ' · escribe el nombre del jugador soltado.');
    const droppedAverage = dropAvg ? parseNumber(dropAvg, label + ' · promedio inválido del jugador soltado.') : null;
    const secondBid = second ? parseNumber(second.replace(/^\$\s*/, ''), label + ' · segunda puja inválida.') : null;
    if (secondBid !== null && (!Number.isInteger(secondBid) || secondBid < 0 || secondBid > bid)) {
      throw new Error(label + ' · la segunda puja debe ser un entero entre 0 y la puja ganadora.');
    }
    return { added, addedAverage, bid, dropped: dropped || null, droppedAverage, manager: manager || null, secondBid };
  });
  return { season, week, moves, publishedAt: new Date().toISOString(), eliminated: eliminatedName || null };
}

export function parseSnapshot(season: number, week: number, text: string): AverageSnapshot {
  checkWeek(season, week);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines[0]?.trim() === snapshotColumns) lines.shift();
  if (!lines.length || lines.length > 500) throw new Error('Pega entre 1 y 500 jugadores con su promedio actual.');
  const averages = lines.map((line, index) => {
    const [player = '', avg = '', ...rest] = line.split('\t').map((cell) => cell.trim());
    const label = 'Fila ' + (index + 1);
    if (rest.length || !player || player.length > 100) throw new Error(label + ' · usa dos columnas: jugador y promedio.');
    return { player, average: parseNumber(avg, label + ' · promedio inválido.') };
  });
  return { season, week, averages, publishedAt: new Date().toISOString() };
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

async function readAll<T>(key: string, prefix: string): Promise<T[]> {
  if (storageConfig()) {
    const values = await redis(['HVALS', key]) as string[];
    return values.map((value) => JSON.parse(value) as T);
  }
  const items: T[] = [];
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor });
      const pageItems = await Promise.all(page.blobs.map(async ({ pathname }) => {
        const file = await get(pathname, { access: 'private', useCache: false });
        if (!file || file.statusCode !== 200) throw new Error('Report is unavailable');
        return await new Response(file.stream).json() as T;
      }));
      items.push(...pageItems);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  return items;
}

async function writeOne(key: string, prefix: string, item: { season: number; week: number }) {
  if (storageConfig()) {
    await redis(['HSET', key, item.season + ':' + item.week, JSON.stringify(item)]);
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Report storage is not configured');
  await put(prefix + item.season + '/' + item.week + '.json', JSON.stringify(item), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

const newestFirst = (a: { season: number; week: number }, b: { season: number; week: number }) =>
  b.season - a.season || b.week - a.week;

export async function readReports(): Promise<WaiverReport[]> {
  return (await readAll<WaiverReport>(reportKey, reportPrefix)).sort(newestFirst);
}

export async function publishReport(report: WaiverReport) {
  await writeOne(reportKey, reportPrefix, report);
}

export async function readSnapshots(): Promise<AverageSnapshot[]> {
  return (await readAll<AverageSnapshot>(snapshotKey, snapshotPrefix)).sort(newestFirst);
}

export async function publishSnapshot(snapshot: AverageSnapshot) {
  await writeOne(snapshotKey, snapshotPrefix, snapshot);
}
