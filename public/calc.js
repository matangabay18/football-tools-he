// Group standings with head-to-head tiebreakers (UEFA/FIFA style, one level).
// teams: string[]; matches: {home, away, hg, ag}[]  (hg/ag are numbers, or null if unplayed)
function emptyRow(name) {
  return { name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
}

function tally(names, matches) {
  const rows = {};
  names.forEach(n => (rows[n] = emptyRow(n)));
  matches.forEach(m => {
    if (m.hg == null || m.ag == null || isNaN(m.hg) || isNaN(m.ag)) return;
    if (!rows[m.home] || !rows[m.away]) return;
    const h = rows[m.home], a = rows[m.away];
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag;
    a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; a.l++; h.pts += 3; }
    else if (m.hg < m.ag) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });
  Object.values(rows).forEach(r => (r.gd = r.gf - r.ga));
  return rows;
}

function standings(teams, matches) {
  const overall = tally(teams, matches);
  const list = Object.values(overall);
  // group by points, then break ties with head-to-head among tied teams
  const byPts = {};
  list.forEach(r => (byPts[r.pts] = byPts[r.pts] || []).push(r));
  const result = [];
  Object.keys(byPts).map(Number).sort((a, b) => b - a).forEach(pts => {
    const tied = byPts[pts];
    if (tied.length > 1) {
      const names = tied.map(r => r.name);
      const h2hMatches = matches.filter(m => names.includes(m.home) && names.includes(m.away));
      const h2h = tally(names, h2hMatches);
      tied.forEach(r => (r._h = h2h[r.name]));
      tied.sort((x, y) =>
        y._h.pts - x._h.pts || y._h.gd - x._h.gd || y._h.gf - x._h.gf ||
        y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name, 'he'));
      tied.forEach(r => delete r._h);
    }
    result.push(...tied);
  });
  return result;
}

if (typeof module !== 'undefined') module.exports = { standings, tally };
