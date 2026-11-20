/** Juegos por equipo NBA para la ventana de waivers y las dos semanas siguientes. */
const scheduleUrl = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const cacheMs = 6 * 60 * 60 * 1000;

export interface ScheduleGame { date: string; home: string; away: string }
export interface ScheduleWindow { label: string; start: string; end: string }

interface RawTeam { teamTricode?: string }
interface RawGame { gameId?: string; gameDateEst?: string; homeTeam?: RawTeam; awayTeam?: RawTeam }
interface RawSchedule { leagueSchedule?: { gameDates?: { games?: RawGame[] }[] } }

/** Solo temporada regular (002) y finales de la NBA Cup (006); fuera pretemporada, All-Star y playoffs. */
export function parseSchedule(raw: RawSchedule): ScheduleGame[] {
  return (raw.leagueSchedule?.gameDates ?? [])
    .flatMap((day) => day.games ?? [])
    .filter((game) => /^00[26]/.test(game.gameId ?? '') && game.homeTeam?.teamTricode && game.awayTeam?.teamTricode)
    .map((game) => ({
      date: (game.gameDateEst ?? '').slice(0, 10),
      home: game.homeTeam!.teamTricode!,
      away: game.awayTeam!.teamTricode!,
    }))
    .filter((game) => /^\d{4}-\d{2}-\d{2}$/.test(game.date));
}

const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/**
 * Semana de Yahoo = lunes a domingo (hora del Este). Los waivers corren el miércoles,
 * así que la semana actual cuenta de miércoles a domingo; las dos siguientes, completas.
 */
export function scheduleWindows(now: Date): ScheduleWindow[] {
  const today = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now) + 'T00:00:00Z');
  const monday = addDays(today, -((today.getUTCDay() + 6) % 7));
  return [
    { label: 'Esta semana (mié–dom)', start: iso(addDays(monday, 2)), end: iso(addDays(monday, 6)) },
    { label: 'Próxima semana', start: iso(addDays(monday, 7)), end: iso(addDays(monday, 13)) },
    { label: 'En dos semanas', start: iso(addDays(monday, 14)), end: iso(addDays(monday, 20)) },
  ];
}

export function gamesByTeam(games: ScheduleGame[], windows: ScheduleWindow[]) {
  const teams = [...new Set(games.flatMap((game) => [game.home, game.away]))].sort();
  return teams.map((team) => {
    const counts = windows.map(({ start, end }) =>
      games.filter((game) => game.date >= start && game.date <= end && (game.home === team || game.away === team)).length);
    return { team, counts, total: counts.reduce((sum, count) => sum + count, 0) };
  }).sort((a, b) => b.total - a.total || b.counts[0] - a.counts[0] || a.team.localeCompare(b.team));
}

let cache: { at: number; games: ScheduleGame[] } | null = null;

export async function readSchedule(): Promise<ScheduleGame[]> {
  if (cache && Date.now() - cache.at < cacheMs) return cache.games;
  const response = await fetch(scheduleUrl, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('NBA schedule is unavailable');
  const games = parseSchedule(await response.json());
  if (!games.length) throw new Error('NBA schedule is empty');
  cache = { at: Date.now(), games };
  return games;
}
