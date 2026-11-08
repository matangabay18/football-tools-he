// Fetches league tables from football-data.org and writes docs/data/<CODE>.json.
// Needs the FOOTBALL_DATA_KEY environment variable (a free API key). Without it the script exits quietly.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const COMPETITIONS = ['PL', 'PD', 'CL'];
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'data');

export function transform(code, json) {
  const all = json.standings || [];
  const block = all.find(s => s.type === 'TOTAL') || all[0];
  if (!block || !Array.isArray(block.table) || block.table.length === 0) return null;
  return {
    code,
    season: json.season ? { start: json.season.startDate, end: json.season.endDate, matchday: json.season.currentMatchday } : null,
    updated: new Date().toISOString(),
    table: block.table.map(r => ({
      position: r.position,
      team: r.team && (r.team.shortName || r.team.name),
      played: r.playedGames, won: r.won, draw: r.draw, lost: r.lost,
      gf: r.goalsFor, ga: r.goalsAgainst, gd: r.goalDifference, points: r.points,
    })),
  };
}

async function main() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) { console.log('FOOTBALL_DATA_KEY is not set; skipping.'); return; }
  await mkdir(OUT, { recursive: true });
  let ok = 0;
  for (const code of COMPETITIONS) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${code}/standings`, { headers: { 'X-Auth-Token': key } });
      if (!res.ok) { console.log(`${code}: HTTP ${res.status}`); continue; }
      const data = transform(code, await res.json());
      if (!data) { console.log(`${code}: no table in response`); continue; }
      await writeFile(path.join(OUT, `${code}.json`), JSON.stringify(data) + '\n');
      console.log(`${code}: ${data.table.length} rows`);
      ok++;
    } catch (e) { console.log(`${code}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 7000)); // stay well under 10 requests/minute
  }
  if (ok === 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
