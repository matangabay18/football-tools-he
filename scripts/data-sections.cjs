// Sections built from the standings data: insights, points ladders, the Champions League "on track" table,
// the team pages and the home-page leaders. Called from build.cjs with the shared helpers.
module.exports = function build(ctx) {
  const { pages, tool, tw, he, slug, readData, readHistory, TEAM_SLUGS } = ctx;
  const hasPage = new Set(TEAM_SLUGS);
  const LEAGUES = {
    PL: { name: 'פרמייר ליג', in: 'בפרמייר ליג', file: 'premier-league.html', nav: 'pl' },
    PD: { name: 'לה ליגה', in: 'בלה ליגה', file: 'la-liga.html', nav: 'll' },
  };

  // ---- small helpers -----------------------------------------------------------------------------
  const npts = n => (n === 0 ? 'אפס נקודות' : n === 1 ? 'נקודה אחת' : n === 2 ? 'שתי נקודות' : n + ' נקודות');
  const bpts = n => (n === 1 ? 'בנקודה אחת' : n === 2 ? 'בשתי נקודות' : 'ב-' + n + ' נקודות');
  const winsText = g => { const w = Math.ceil(g / 3); return w === 1 ? 'כניצחון אחד' : w === 2 ? 'כשני ניצחונות' : 'כ-' + w + ' ניצחונות'; };
  const r2 = x => String(Math.round(x * 100) / 100);
  const ltr = s => '<bdi dir="ltr">' + s + '</bdi>';
  const signed = x => (x > 0 ? '+' : x < 0 ? '−' : '') + (x < 0 ? -x : x);
  const zoneOf = (code, pos, n) => {
    if (code === 'CL') return pos <= 8 ? 'z-top' : pos <= 24 ? 'z-mid' : 'z-bot';
    return pos <= 4 ? 'z-top' : pos > n - 3 ? 'z-bot' : '';
  };
  const teamLink = name => (hasPage.has(slug(name)) ? '<a href="' + slug(name) + '">' + he(name) + '</a>' : he(name));
  const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString('he-IL', Object.assign({ timeZone: 'Asia/Jerusalem' }, opts));
  const sourceNote = d => '<p class="note">נתונים: football-data.org. עודכן ב-' + fmtDate(d.updated, { day: 'numeric', month: 'long', year: 'numeric' }) + '.</p>';
  const valid = d => d && Array.isArray(d.table) && d.table.length >= 18;

  // ---- points ladder (static, so crawlers see real content) ---------------------------------------
  function ladder(code, d) {
    const t = d.table, n = t.length, max = Math.max(1, t[0].points);
    return '<ol class="ladder">' + t.map(r =>
      '<li class="' + zoneOf(code, r.position, n) + '" style="--w:' + (r.points / max * 100).toFixed(1) + '%"><span class="lr">' + r.position +
      '</span><span class="ln">' + teamLink(r.team) + '</span><span class="bar"><i></i></span><b>' + r.points + '</b></li>').join('') + '</ol>';
  }

  // ---- league insights ----------------------------------------------------------------------------
  function insights(code, d) {
    const T = d.table, n = T.length, P = T.filter(r => r.played > 0);
    if (P.length < 10) return '';
    const per = (r, k) => r[k] / r.played;
    const pick = (f, dir) => P.slice().sort((a, b) => dir * (f(a) - f(b)))[0];
    const att = pick(r => per(r, 'gf'), -1), def = pick(r => per(r, 'ga'), 1);
    const dr = pick(r => r.draw, -1), pp = pick(r => r.points / r.played, -1);
    const gap = (a, b) => (a.points === b.points ? 'שוות נקודות' : npts(a.points - b.points));
    const cards = [
      ['ההתקפה החזקה', he(att.team), r2(per(att, 'gf')) + ' שערים למשחק'],
      ['ההגנה הטובה', he(def.team), r2(per(def, 'ga')) + ' שערים שנספגו למשחק'],
      ['הכי הרבה תיקו', he(dr.team), dr.draw + ' תיקו ב-' + dr.played + ' משחקים'],
      ['ממוצע נקודות מוביל', he(pp.team), r2(pp.points / pp.played) + ' נקודות למשחק'],
    ];
    if (code === 'CL') {
      if (n >= 25) {
        cards.push(['הקו לשמינית הגמר', gap(T[7], T[8]), he(T[7].team) + ' (מקום 8) מול ' + he(T[8].team) + ' (מקום 9)']);
        cards.push(['הקו לפלייאוף', gap(T[23], T[24]), he(T[23].team) + ' (מקום 24) מול ' + he(T[24].team) + ' (מקום 25)']);
      }
    } else {
      cards.push(['הפער בצמרת', gap(T[0], T[1]), he(T[0].team) + ' מול ' + he(T[1].team)]);
      cards.push(['המאבק על ליגת האלופות', gap(T[3], T[4]), he(T[3].team) + ' (מקום 4) מול ' + he(T[4].team) + ' (מקום 5)']);
      cards.push(['קו הירידה', gap(T[n - 4], T[n - 3]), he(T[n - 4].team) + ' (מקום ' + (n - 3) + ') מול ' + he(T[n - 3].team) + ' (מקום ' + (n - 2) + ')']);
    }
    return '<ul class="insights">' + cards.map(c => '<li><small>' + c[0] + '</small><b>' + c[1] + '</b><span>' + c[2] + '</span></li>').join('') + '</ul>';
  }

  // ---- Champions League: who is on pace for which stage -------------------------------------------
  function onTrack(d) {
    const t = d.table, TOT = Math.max(8, ...t.map(r => r.played));
    const rows = t.map(r => {
      const left = TOT - r.played, pace = r.played ? Math.round(r.points / r.played * TOT) : 0, max = r.points + 3 * left;
      const z = zoneOf('CL', r.position, t.length);
      const status = left <= 0
        ? (z === 'z-top' ? 'עלתה ישירות לשמינית הגמר' : z === 'z-mid' ? 'בפלייאוף' : 'הודחה')
        : (pace >= 16 ? 'בקצב לשמינית הגמר' : pace >= 9 ? 'בקצב לפלייאוף' : 'בקצב להדחה');
      return '<tr class="' + z + '"><td><span class="rank">' + r.position + '</span></td><td class="n">' + teamLink(r.team) + '</td><td>' + r.points +
        '</td><td>' + r.played + '</td><td>' + left + '</td><td class="hide-s">' + max + '</td><td><b>' + pace + '</b></td><td class="n">' + status + '</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table><thead><tr><th>#</th><th class="n">קבוצה</th><th>נק׳</th><th>שוחקו</th><th>נותרו</th><th class="hide-s">מקסימום</th><th>קצב</th><th class="n">מצב</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">הקצב הוא ממוצע הנקודות למשחק של הקבוצה כפול ' + TOT + ' משחקים. הסף לשמינית הגמר (16 נקודות) ולפלייאוף (9 נקודות) לקוח מעונת 2025/26 והוא משתנה בכל עונה, כך שזו הערכה ולא תחזית.</p>';
  }

  // ---- team page parts ----------------------------------------------------------------------------
  function profile(d, i) {
    const P = d.table.filter(r => r.played > 0), me = d.table[i];
    if (me.played === 0 || P.length < 10) return '';
    const metrics = [
      ['נקודות למשחק', r => r.points / r.played, true, r2],
      ['שערים למשחק', r => r.gf / r.played, true, r2],
      ['שערים שנספגו למשחק', r => r.ga / r.played, false, r2],
      ['אחוז ניצחונות', r => r.won / r.played * 100, true, x => Math.round(x) + '%'],
      ['הפרש שערים למשחק', r => r.gd / r.played, true, x => signed(Math.round(x * 100) / 100)],
    ];
    const rows = metrics.map(([label, f, hi, fmt]) => {
      const vals = P.map(f), mine = f(me), mn = Math.min(...vals), mx = Math.max(...vals);
      const rank = 1 + vals.filter(v => (hi ? v > mine : v < mine)).length;
      const pct = mx === mn ? 50 : Math.round(((hi ? mine - mn : mx - mine) / (mx - mn)) * 100);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return '<tr><td>' + label + '</td><td>' + ltr(fmt(mine)) + '</td><td><span class="meter" aria-hidden="true"><i style="width:' + Math.max(4, pct) + '%"></i></span> <span class="rk">מקום ' + rank + ' מתוך ' + P.length +
        '</span></td><td class="hide-s">' + ltr(fmt(avg)) + '</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table><thead><tr><th>מדד</th><th>הקבוצה</th><th>דירוג בליגה</th><th class="hide-s">ממוצע הליגה</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">המדדים מחושבים לפי ממוצע למשחק, כדי להשוות בין קבוצות ששיחקו מספר שונה של משחקים. הפס מראה היכן הקבוצה ממוקמת בין הטובה לחלשה בליגה במדד הזה.</p>';
  }

  function neighbors(code, d, i) {
    const t = d.table, n = t.length, from = Math.max(0, i - 3), to = Math.min(n - 1, i + 3);
    const win = t.slice(from, to + 1), max = Math.max(1, ...win.map(r => r.points));
    return '<ol class="ladder">' + win.map((r, k) => {
      const diff = r.points - t[i].points, j = from + k;
      const gap = j === i ? 'הקבוצה' : diff === 0 ? 'שווה' : ltr(signed(diff));
      return '<li class="' + zoneOf(code, r.position, n) + (j === i ? ' me' : '') + '" style="--w:' + (r.points / max * 100).toFixed(1) + '%"><span class="lr">' + r.position +
        '</span><span class="ln">' + teamLink(r.team) + ' <em>' + gap + '</em></span><span class="bar"><i></i></span><b>' + r.points + '</b></li>';
    }).join('') + '</ol>';
  }

  function chart(code, d, team) {
    const hist = readHistory(code).filter(h => h.t && h.t[team]);
    if (hist.length < 3) {
      const saved = hist.length === 0 ? 'עדיין לא נשמרו מדידות' : hist.length === 1 ? 'נשמרה עד כה מדידה אחת' : 'נשמרו עד כה ' + hist.length + ' מדידות';
      return '<p class="note">גרף המסלול ייבנה ככל שהעונה מתקדמת. ' + saved + ', ומדידה נוספת מתווספת בכל יום שבו נערכים משחקים.</p>';
    }
    const n = d.table.length, W = 640, H = 200, L = 34, R = 14, T = 16, B = 30;
    const x = k => L + (hist.length === 1 ? 0 : k * (W - L - R) / (hist.length - 1));
    const y = pos => T + (pos - 1) * (H - T - B) / (n - 1);
    const pts = hist.map((h, k) => x(k).toFixed(1) + ',' + y(h.t[team][0]).toFixed(1));
    const last = hist[hist.length - 1], lx = x(hist.length - 1), ly = y(last.t[team][0]);
    const ticks = [1, 4, n - 3, n].filter((v, k, a) => a.indexOf(v) === k && v >= 1 && v <= n);
    const first = hist[0], desc = 'מקום ' + he(team) + ' בטבלה לאורך העונה, מ-' + fmtDate(first.d, { day: 'numeric', month: 'long' }) + ' עד ' + fmtDate(last.d, { day: 'numeric', month: 'long' }) + '. כרגע במקום ' + last.t[team][0] + '.';
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + desc + '">' +
      ticks.map(v => '<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="t" x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>').join('') +
      '<polyline class="l" points="' + pts.join(' ') + '"/><circle class="p" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4.5"/>' +
      '<text class="t" x="' + L + '" y="' + (H - 8) + '">' + fmtDate(first.d, { day: 'numeric', month: 'short' }) + '</text>' +
      '<text class="t" x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end">' + fmtDate(last.d, { day: 'numeric', month: 'short' }) + '</text></svg>' +
      '<p class="note">המקום בטבלה לאחר כל יום משחקים. מקום 1 למעלה.</p>';
  }

  function teamPage(code, d, i) {
    const L = LEAGUES[code], t = d.table, n = t.length, total = (n - 1) * 2;
    const r = t[i], name = he(r.team), pos = r.position;
    const leader = t[0], second = t[1], fourth = t[3], fifth = t[4], safe = t[n - 4], drop = t[n - 3];
    const left = Math.max(0, total - r.played), max = r.points + 3 * left;
    const pace = x => Math.round(x.points / Math.max(1, x.played) * total);
    const date = fmtDate(d.updated, { day: 'numeric', month: 'long', year: 'numeric' });
    const ppg = r.played ? r.points / r.played : 0, proj = Math.round(ppg * total);

    // projected finishing position at the current points-per-game pace
    const projAll = t.map(x => ({ team: x.team, p: pace(x), pts: x.points, pos: x.position }))
      .sort((a, b) => b.p - a.p || b.pts - a.pts || a.pos - b.pos);
    const projPos = projAll.findIndex(x => x.team === r.team) + 1;

    const title = pos === 1
      ? name + ' מובילה ' + L.in + ', יתרון של ' + npts(r.points - second.points)
      : name + ': כמה נקודות חסרות בעונה? ' + L.name;

    let champ, cl, rel;
    if (pos === 1) champ = 'הקבוצה מובילה, עם יתרון של ' + npts(r.points - second.points) + ' על ' + he(second.team) + '.';
    else if (r.points === leader.points) champ = 'הקבוצה שווה נקודות למובילה ' + he(leader.team) + ', והפער ביניהן בהפרש שערים.';
    else champ = 'הקבוצה מפגרת ' + bpts(leader.points - r.points) + ' (' + winsText(leader.points - r.points) + ') אחרי ' + he(leader.team) + ', המובילה.';

    if (pos <= 4) cl = 'הקבוצה נמצאת באזור ליגת האלופות, עם יתרון של ' + (r.points === fifth.points ? 'אפס נקודות (שוות נקודות)' : npts(r.points - fifth.points)) + ' על המקום החמישי (' + he(fifth.team) + ').';
    else cl = r.points === fourth.points
      ? 'הקבוצה שווה נקודות למקום הרביעי (' + he(fourth.team) + '), והפער ביניהן בהפרש שערים.'
      : 'הקבוצה מפגרת ' + bpts(fourth.points - r.points) + ' (' + winsText(fourth.points - r.points) + ') אחרי המקום הרביעי (' + he(fourth.team) + ').';

    if (pos >= n - 2) rel = 'הקבוצה נמצאת באזור הירידה, ' + (r.points === safe.points ? 'שווה נקודות' : npts(safe.points - r.points) + ' מתחת') + ' למקום ה-' + (n - 3) + ' (' + he(safe.team) + ') שבטוח כרגע.';
    else rel = 'הקבוצה מעל אזור הירידה, עם יתרון של ' + (r.points === drop.points ? 'אפס נקודות (שוות נקודות)' : npts(r.points - drop.points)) + ' על המקום ה-' + (n - 2) + ' (' + he(drop.team) + ').';

    const target = pace(fourth), safeTarget = pace(safe);
    const projBlock = r.played === 0 ? '' : '<div class="box"><p><strong>בקצב הנוכחי:</strong> ' + r2(ppg) + ' נקודות למשחק מובילות לכ-' + proj + ' נקודות בסוף העונה, ולמקום ' + projPos + ' בטבלה.' +
      ' לשם השוואה, בקצב הנוכחי המקום הרביעי יסיים עם כ-' + target + ' נקודות והמקום ה-' + (n - 3) + ' עם כ-' + safeTarget + '.</p>' +
      '<p class="note">החישוב מניח שכל קבוצה תמשיך באותו ממוצע למשחק עד סוף העונה. זו הערכה פשוטה ולא תחזית.</p></div>';

    const prof = profile(d, i);
    const body = '<ul class="facts">' +
      '<li><small>מקום בטבלה</small><b>' + pos + '</b></li><li><small>נקודות</small><b>' + r.points + '</b></li>' +
      '<li><small>משחקים</small><b>' + r.played + ' מתוך ' + total + '</b></li><li><small>הפרש שערים</small><b>' + ltr(signed(r.gd)) + '</b></li></ul>' +
      '<div class="prose"><h2>המצב נכון ל-' + date + '</h2><ul>' +
      '<li><strong>אליפות:</strong> ' + champ + '</li><li><strong>ליגת האלופות:</strong> ' + cl + '</li><li><strong>הישארות בליגה:</strong> ' + rel + '</li></ul>' +
      '<p>נותרו ' + left + ' משחקים, ולכן המקסימום האפשרי הוא ' + max + ' נקודות.</p>' + projBlock +
      (prof ? '<h2>פרופיל הקבוצה</h2>' : '') + '</div>' + (prof ? tw(prof) : '') +
      '<div class="prose"><h2>הסביבה בטבלה</h2></div><section class="card">' + neighbors(code, d, i) + '<p class="note">ההפרש הוא בנקודות ביחס ל' + name + '.</p></section>' +
      '<div class="prose"><h2>המסלול בעונה</h2></div><section class="card">' + chart(code, d, r.team) + '</section>' +
      tool({
        h: 'כמה נקודות חסרות ל' + name + '?',
        note: 'היעד ההתחלתי הוא קצב המקום הרביעי כיום. אפשר לשנות אותו בשדה או בכפתורים.',
        pts: r.points, played: r.played, total, target,
        presets: [{ l: 'קצב המקום הרביעי: ' + target, v: target }, { l: 'קצב קו ההישארות: ' + safeTarget, v: safeTarget }, { l: 'הישארות (אומדן נפוץ): 40', v: 40 }],
      }) +
      '<div class="prose"><p class="note">הקצבים מחושבים מהנקודות הנוכחיות של הקבוצות במקומות האלה ומניחים שימשיכו באותו ממוצע למשחק עד סוף העונה. הנתונים מתעדכנים כמה פעמים ביום ועלולים להתעכב.</p>' +
      '<p><a href="' + L.file + '">לטבלה המלאה של ' + L.name + '</a></p></div>';
    return {
      file: slug(r.team), nav: L.nav, small: true, title: title + ' | כדורגל בכלים',
      desc: 'מקום ' + pos + ' ' + L.in + ' עם ' + r.points + ' נקודות אחרי ' + r.played + ' משחקים' + (r.played ? '. בקצב הנוכחי ' + name + ' תסיים עם כ-' + proj + ' נקודות' : '') + '. כמה נקודות חסרות לאליפות, לליגת האלופות ולהישארות.',
      h1: name + ': כמה נקודות חסרות?', sub: 'מקום ' + pos + ' ' + L.in + ' אחרי ' + r.played + ' משחקים, עם ' + r.points + ' נקודות.',
      scripts: ['needs.js'], body,
    };
  }

  // ---- inject into pages --------------------------------------------------------------------------
  const afterLive = (page, html) => {
    const i = page.body.indexOf('id="live-section"');
    if (i < 0) return;
    const j = page.body.indexOf('</section>', i) + '</section>'.length;
    page.body = page.body.slice(0, j) + '\n' + html + page.body.slice(j);
  };
  const stage = (title, inner) => '<div class="prose"><h2>' + title + '</h2></div>' + inner;

  const data = {};
  for (const code of ['PL', 'PD', 'CL']) data[code] = readData(code);

  for (const code of ['PL', 'PD']) {
    const d = data[code], page = pages.find(p => p.file === LEAGUES[code].file);
    if (!valid(d) || !page) continue;
    const ins = insights(code, d);
    afterLive(page, (ins ? stage('תמונת מצב', ins) : '') + stage('מדרגות הנקודות', '<section class="card">' + ladder(code, d) + sourceNote(d) + '</section>'));
    pages.push(...d.table.map((_, i) => teamPage(code, d, i)));
    page.body += '\n<div class="prose"><h2>דפי הקבוצות</h2></div><ul class="teams-grid">' + d.table.map(r => '<li><a href="' + slug(r.team) + '">' + he(r.team) + '</a></li>').join('') + '</ul>';
  }

  const cl = data.CL, clPage = pages.find(p => p.file === 'champions-league.html');
  if (cl && Array.isArray(cl.table) && cl.table.length >= 24 && clPage) {
    const ins = insights('CL', cl);
    afterLive(clPage, stage('מי בדרך לאן', onTrack(cl)) + (ins ? stage('תמונת מצב', ins) : '') + stage('מדרגות הנקודות', '<section class="card">' + ladder('CL', cl) + sourceNote(cl) + '</section>'));
  }

  // ---- home page: current leaders -----------------------------------------------------------------
  const home = pages.find(p => p.file === 'index.html');
  const cards = [['PL', 'פרמייר ליג', 'premier-league.html'], ['PD', 'לה ליגה', 'la-liga.html'], ['CL', 'ליגת האלופות', 'champions-league.html']]
    .filter(([c]) => data[c] && Array.isArray(data[c].table) && data[c].table.length >= 3)
    .map(([c, label, file]) => '<li><h3>' + label + '</h3><ol>' + data[c].table.slice(0, 3).map(r => '<li><span>' + teamLink(r.team) + '</span><b>' + r.points + '</b></li>').join('') + '</ol><a href="' + file + '">לטבלה ולמחשבון</a></li>');
  if (home && cards.length) {
    const upd = data.PL || data.PD || data.CL;
    const html = '<h2>מי מובילה עכשיו</h2><ul class="leaders">' + cards.join('') + '</ul><p class="note">שלוש הראשונות בכל טבלה, נכון ל-' + fmtDate(upd.updated, { day: 'numeric', month: 'long' }) + '. נתונים: football-data.org.</p>';
    home.body = home.body.replace('<ul class="facts">', html + '\n<ul class="facts">');
  }
};
