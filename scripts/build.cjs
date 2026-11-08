const fs = require('fs');
const path = require('path');
// Generates every HTML page in docs/ (plus teams-he.js and sitemap.xml). Run: node scripts/build.cjs
const crypto = require('crypto');
const DOCS = path.join(__dirname, '..', 'docs');
const SRC = path.join(__dirname, 'src');
const BASE = 'https://matangabay18.github.io/football-tools-he/';
const legacy = ['tiebreakers', 'titles', 'faq', 'about', 'privacy'];

// Hebrew club names (shared by the browser script and the team pages)
const HE = JSON.parse(fs.readFileSync(path.join(__dirname, 'teams-he.json'), 'utf8'));
fs.writeFileSync(path.join(DOCS, 'teams-he.js'), 'var HE = ' + JSON.stringify(HE) + ';\n');
const he = n => HE[n] || n;
const slug = n => 'team-' + String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';

// Version string for cache-busting, derived from the asset contents
const VER = crypto.createHash('md5').update(
  ['style.css', 'needs.js', 'standings.js', 'group.js', 'calc.js', 'teams-he.js'].map(f => fs.readFileSync(path.join(DOCS, f), 'utf8')).join('')
).digest('hex').slice(0, 8);

function readData(code) {
  try { return JSON.parse(fs.readFileSync(path.join(DOCS, 'data', code + '.json'), 'utf8')); } catch (e) { return null; }
}

// ---- shared pieces -------------------------------------------------------------------------------
const ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0C5A35"/><circle cx="16" cy="16" r="6" fill="none" stroke="#F4F7EF" stroke-width="1.6"/><path d="M16 4v24" stroke="#F4F7EF" stroke-width="1.6"/></svg>';
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0C5A35"/><circle cx="16" cy="16" r="6" fill="none" stroke="#F4F7EF" stroke-width="1.6"/><path d="M16 4v24" stroke="#F4F7EF" stroke-width="1.6"/></svg>');
const LINES = '<svg class="lines" viewBox="0 0 200 200" fill="none" stroke="#F4F7EF" stroke-width="1" aria-hidden="true"><circle cx="100" cy="100" r="46" opacity=".5"/><circle cx="100" cy="100" r="92" opacity=".22"/><circle cx="100" cy="100" r="2.4" fill="#F4F7EF" stroke="none" opacity=".6"/><path d="M100 0v200" opacity=".5"/></svg>';
const NAV = [
  ['index.html', 'ראשי', 'home'],
  ['champions-league.html', 'ליגת האלופות', 'cl'],
  ['premier-league.html', 'פרמייר ליג', 'pl'],
  ['la-liga.html', 'לה ליגה', 'll'],
  ['group-calculator.html', 'טורנירי נבחרות', 't'],
];
const FOOT = [
  ['tiebreakers.html', 'הכרעת שוויון'], ['titles.html', 'מי זכתה הכי הרבה'], ['faq.html', 'שאלות נפוצות'],
  ['about.html', 'אודות'], ['privacy.html', 'מדיניות פרטיות'],
];
const href = f => (f === 'index.html' ? './' : f);

function page(p) {
  const nav = NAV.map(([f, l, k]) => `<a href="${href(f)}"${k === p.nav ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  const foot = FOOT.map(([f, l]) => `<a href="${f}">${l}</a>`).join('');
  const chips = p.chips ? `<ul class="chips">${p.chips.map(c => `<li>${c}</li>`).join('')}</ul>` : '';
  const scripts = (p.scripts || []).map(s => `<script src="${s}?v=${VER}"></script>`).join('');
  const url = BASE + (p.file === 'index.html' ? '' : p.file);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="he_IL">
<meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.desc}"><meta property="og:url" content="${url}">
<meta name="theme-color" content="#0C5A35">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600&family=Secular+One&display=swap">
<link rel="stylesheet" href="style.css?v=${VER}">
</head>
<body>
<header class="site"><div class="wrap"><a class="brand" href="./">${ICON}<span>כדורגל בכלים</span></a><nav aria-label="ניווט ראשי">${nav}</nav></div></header>
<section class="hero${p.small ? ' hero--sm' : ''}">${LINES}<div class="wrap"><h1>${p.h1}</h1>${p.sub ? `<p class="sub">${p.sub}</p>` : ''}${chips}</div></section>
<main class="wrap">
${p.body}
</main>
<footer class="site-foot"><div class="wrap"><span>האתר אינו קשור ל-FIFA, ל-UEFA או לליגות. הנתונים למידע כללי.</span><span>${foot}</span></div></footer>
${scripts}
</body>
</html>
`;
}

const tw = h => h.replace(/<table/g, '<div class="tablewrap"><table').replace(/<\/table>/g, '</table></div>');
const tool = (cfg) => `<section class="card toolcard"><h2>${cfg.h}</h2><p class="note">${cfg.note}</p><div id="need" data-pts="${cfg.pts}" data-played="${cfg.played}" data-total="${cfg.total}" data-target="${cfg.target}" data-presets='${JSON.stringify(cfg.presets)}'></div></section>`;

const live = (code, zones, key, teams) => `<section class="card toolcard" id="live-section" data-comp="${code}" data-zones='${JSON.stringify(zones)}'${teams ? ' data-teams="1"' : ''} hidden><h2>הטבלה העדכנית</h2><p class="note" id="live-note"></p>
<div class="tablewrap"><table><thead><tr><th>#</th><th class="n">קבוצה</th><th>מש׳</th><th class="hide-s">נצ׳</th><th class="hide-s">תק׳</th><th class="hide-s">הפ׳</th><th class="hide-s">שערים</th><th>הפרש</th><th>נק׳</th></tr></thead><tbody id="live-body"></tbody></table></div>
<ul class="key">${key}</ul>
<p class="note">לחיצה על שם קבוצה ממלאת את המחשבון בנתוני הקבוצה.${teams ? ' החץ שליד השם פותח את דף הקבוצה.' : ''} נתונים: football-data.org.</p></section>`;
const KEY_CL = '<li><i style="background:var(--qual)"></i>שמינית הגמר (1 עד 8)</li><li><i style="background:var(--warn)"></i>פלייאוף (9 עד 24)</li><li><i style="background:var(--bad)"></i>מודחות</li>';
const KEY_LG = '<li><i style="background:var(--qual)"></i>ליגת האלופות (4 ראשונות, לפעמים 5)</li><li><i style="background:var(--bad)"></i>ירידה (3 אחרונות)</li>';

const pages = [];

// ---- Home ----------------------------------------------------------------------------------------
pages.push({
  file: 'index.html', nav: 'home',
  title: 'כדורגל בכלים – מחשבונים לליגת האלופות ולליגות אירופה',
  desc: 'מחשבונים והסברים בעברית: כמה נקודות צריך בליגת האלופות, בפרמייר ליג ובלה ליגה, ומחשבון טבלת בתים לטורנירי נבחרות.',
  h1: 'כמה נקודות באמת צריך?', small: false,
  sub: 'מחשבונים והסברים בעברית לליגת האלופות, לפרמייר ליג, ללה ליגה ולטורנירי הנבחרות.',
  chips: ['שלב הליגה ב-UEFA', 'פרמייר ליג', 'לה ליגה', 'מונדיאל ויורו'],
  body: `
<ul class="cardgrid">
<li><a href="champions-league.html"><strong>ליגת האלופות</strong><span>שלב הליגה של 36 קבוצות, קווי החיתוך למקומות 8 ו-24, ומחשבון נקודות.</span><em>למחשבון</em></a></li>
<li><a href="premier-league.html"><strong>פרמייר ליג</strong><span>כמה נקודות חסרות לאירופה, לאליפות או להישארות.</span><em>למחשבון</em></a></li>
<li><a href="la-liga.html"><strong>לה ליגה</strong><span>אותו מחשבון לליגה הספרדית, עם כללי ההכרעה שלה.</span><em>למחשבון</em></a></li>
<li><a href="group-calculator.html"><strong>טורנירי נבחרות</strong><span>טבלת בית של ארבע נבחרות, עם הכרעת שוויון לפי תוצאות ישירות.</span><em>למחשבון</em></a></li>
</ul>
<ul class="facts">
<li><small>אלופת העולם 2026</small><b>ספרד</b></li>
<li><small>אלופת אירופה (נבחרות) 2024</small><b>ספרד</b></li>
<li><small>קבוצות בשלב הליגה של ליגת האלופות</small><b>36, בטבלה אחת</b></li>
</ul>
<h2>מדריכים</h2>
<ul class="links">
<li><a href="tiebreakers.html"><strong>הכרעת שוויון בנקודות</strong><span>מה קורה כששתי קבוצות מסיימות עם אותן נקודות, עם דוגמה מחושבת.</span></a></li>
<li><a href="titles.html"><strong>מי זכתה הכי הרבה</strong><span>הנבחרות עם הכי הרבה תארים במונדיאל וביורו.</span></a></li>
<li><a href="faq.html"><strong>שאלות נפוצות</strong><span>תשובות קצרות על נקודות, שלבי בתים ופורמט.</span></a></li>
</ul>`,
});

// ---- Champions League ----------------------------------------------------------------------------
pages.push({
  file: 'champions-league.html', nav: 'cl', small: true,
  title: 'ליגת האלופות: כמה נקודות צריך בשלב הליגה?',
  desc: 'בליגת האלופות אין יותר בתים. הסבר על שלב הליגה של 36 קבוצות, קווי החיתוך למקומות 8 ו-24 ומחשבון נקודות.',
  h1: 'ליגת האלופות: כמה נקודות צריך בשלב הליגה?',
  sub: 'מעונת 2024/25 אין בתים. 36 קבוצות, טבלה אחת, ושמונה משחקים לכל קבוצה.',
  scripts: ['teams-he.js', 'needs.js', 'standings.js'],
  body: `<div class="prose">
<h2>איך זה עובד</h2>
<p>כל קבוצה משחקת שמונה משחקים מול שמונה יריבות שונות, ארבעה בבית וארבעה בחוץ. אחרי שמונת המחזורים מדרגים את כל 36 הקבוצות בטבלה אחת.</p>
${tw(`<table><thead><tr><th>מקום בטבלה</th><th>מה קורה</th></tr></thead><tbody>
<tr><td>1 עד 8</td><td>עולות ישירות לשמינית הגמר</td></tr>
<tr><td>9 עד 24</td><td>משחקות פלייאוף בשני משחקים על מקום בשמינית הגמר</td></tr>
<tr><td>25 עד 36</td><td>מודחות מהמפעל</td></tr>
</tbody></table>`)}
<p>בפלייאוף הקבוצות ממקומות 9 עד 16 מדורגות, ופוגשות קבוצות ממקומות 17 עד 24.</p>
<h2>כמה נקודות היו צריכות בפועל</h2>
<p>בעונת 2025/26, לפי הטבלאות שפורסמו, המקום השמיני הסתיים עם 16 נקודות והמקום ה-24 עם 9 נקודות. הקווים האלה משתנים בכל עונה, ולכן המחשבון משתמש בהם רק כנקודת פתיחה שאפשר לשנות.</p>
</div>
${live('CL', {top:8,mid:24}, KEY_CL)}
${tool({
    h: 'כמה נקודות חסרות לי?', note: 'המספרים בטופס הם דוגמה: 7 נקודות אחרי 5 משחקים. החליפו אותם בנתוני הקבוצה שלכם.',
    pts: 7, played: 5, total: 8, target: 16,
    presets: [{ l: 'ישר לשמינית (מקום 8): 16', v: 16 }, { l: 'פלייאוף (מקום 24): 9', v: 9 }],
  })}
<div class="prose">
<h2>ובמקרה של שוויון?</h2>
<p>לפי תקנון UEFA, כששתי קבוצות או יותר מסיימות עם אותן נקודות, ההפרש הכללי בין השערים שהובקעו לשערים שהוכנסו הוא הקריטריון הראשון להכרעה. כדאי לבדוק את התקנון המעודכן של העונה.</p>
<p>רוצים לחשב טבלה של בית עם ארבע נבחרות, כמו במונדיאל וביורו? <a href="group-calculator.html">למחשבון טבלת בתים</a>.</p>
</div>`,
});

// ---- Premier League ------------------------------------------------------------------------------
pages.push({
  file: 'premier-league.html', nav: 'pl', small: true,
  title: 'פרמייר ליג: כמה נקודות צריך כדי לעלות או להישאר?',
  desc: 'מחשבון נקודות לפרמייר ליג: כמה נקודות חסרות לאירופה, לאליפות או להישארות, ומה כללי ההכרעה בשוויון.',
  h1: 'פרמייר ליג: כמה נקודות צריך כדי לעלות או להישאר?',
  sub: '20 קבוצות, 38 מחזורים, ושלוש קבוצות שיורדות.',
  scripts: ['teams-he.js', 'needs.js', 'standings.js'],
  body: `<div class="prose">
<h2>מה מקבלים לפי המקום</h2>
${tw(`<table><thead><tr><th>מקום</th><th>המשמעות</th></tr></thead><tbody>
<tr><td>1</td><td>אלופת אנגליה</td></tr>
<tr><td>4 הראשונות</td><td>ליגת האלופות. בעונות שבהן ההתאחדות מקבלת מקום נוסף בזכות ביצועים באירופה, גם החמישית עולה</td></tr>
<tr><td>המקומות הבאים</td><td>הליגה האירופית וליגת הקונפרנס, בהתאם גם לזוכות הגביעים</td></tr>
<tr><td>3 האחרונות</td><td>יורדות לליגה השנייה</td></tr>
</tbody></table>`)}
<p>בעונת 2025/26 חמש קבוצות מהפרמייר ליג העפילו לליגת האלופות של 2026/27, כולל מקום נוסף שהתקבל בזכות ביצועים באירופה.</p>
</div>
${live('PL', {top:4,bottom:3}, KEY_LG, true)}
${tool({
    h: 'כמה נקודות חסרות לי?', note: 'המספרים בטופס הם דוגמה: 28 נקודות אחרי 28 משחקים. החליפו אותם בנתוני הקבוצה שלכם.',
    pts: 28, played: 28, total: 38, target: 40,
    presets: [{ l: 'הישארות (אומדן נפוץ): 40', v: 40 }, { l: '1.5 נק׳ למשחק: 57', v: 57 }, { l: '2 נק׳ למשחק: 76', v: 76 }],
  })}
<div class="prose">
<p class="note">40 נקודות הוא אומדן נפוץ להישארות בליגה, אבל הקו משתנה בין עונות וקבוצות. הממוצעים של 1.5 ו-2 נקודות למשחק הם חישוב נוח ולא קו רשמי.</p>
<h2>ובמקרה של שוויון?</h2>
<p>בפרמייר ליג, כששתי קבוצות מסיימות עם אותן נקודות, מכריע קודם כל הפרש השערים הכללי, ואחריו מספר השערים שהובקעו.</p>
</div>`,
});

// ---- La Liga -------------------------------------------------------------------------------------
pages.push({
  file: 'la-liga.html', nav: 'll', small: true,
  title: 'לה ליגה: כמה נקודות צריך כדי לעלות או להישאר?',
  desc: 'מחשבון נקודות ללה ליגה הספרדית: כמה נקודות חסרות לאירופה, לאליפות או להישארות, ואיך מכריעים בשוויון נקודות.',
  h1: 'לה ליגה: כמה נקודות צריך כדי לעלות או להישאר?',
  sub: '20 קבוצות, 38 מחזורים, ושלוש קבוצות שיורדות.',
  scripts: ['teams-he.js', 'needs.js', 'standings.js'],
  body: `<div class="prose">
<h2>מה מקבלים לפי המקום</h2>
${tw(`<table><thead><tr><th>מקום</th><th>המשמעות</th></tr></thead><tbody>
<tr><td>1</td><td>אלופת ספרד</td></tr>
<tr><td>4 הראשונות</td><td>ליגת האלופות. בעונות עם מקום נוסף בזכות ביצועים באירופה גם החמישית עולה</td></tr>
<tr><td>המקומות הבאים</td><td>הליגה האירופית וליגת הקונפרנס</td></tr>
<tr><td>3 האחרונות</td><td>יורדות לליגה השנייה</td></tr>
</tbody></table>`)}
<p>בעונת 2025/26 גם ספרד קיבלה מקום חמישי בליגת האלופות של 2026/27, וריאל בטיס עלתה דרכו.</p>
</div>
${live('PD', {top:4,bottom:3}, KEY_LG, true)}
${tool({
    h: 'כמה נקודות חסרות לי?', note: 'המספרים בטופס הם דוגמה: 28 נקודות אחרי 28 משחקים. החליפו אותם בנתוני הקבוצה שלכם.',
    pts: 28, played: 28, total: 38, target: 40,
    presets: [{ l: 'הישארות (אומדן נפוץ): 40', v: 40 }, { l: '1.5 נק׳ למשחק: 57', v: 57 }, { l: '2 נק׳ למשחק: 76', v: 76 }],
  })}
<div class="prose">
<p class="note">40 נקודות הוא אומדן נפוץ להישארות בליגה, אבל הקו משתנה בין עונות. הממוצעים של 1.5 ו-2 נקודות למשחק הם חישוב נוח ולא קו רשמי.</p>
<h2>ובמקרה של שוויון?</h2>
<p>בניגוד לפרמייר ליג, בלה ליגה בדרך כלל מכריעים קודם כל לפי התוצאות הישירות בין הקבוצות השוות, ורק אחר כך לפי הפרש שערים כללי. פרטים נוספים בדף <a href="tiebreakers.html">הכרעת שוויון</a>.</p>
</div>`,
});

// ---- Group calculator (tournaments) --------------------------------------------------------------
pages.push({
  file: 'group-calculator.html', nav: 't', small: true,
  title: 'מחשבון טבלת בתים למונדיאל וליורו',
  desc: 'מחשבון טבלת בתים חינמי למונדיאל וליורו: הזינו תוצאות וקבלו טבלה מדורגת עם הכרעת שוויון לפי תוצאות ישירות.',
  h1: 'מחשבון טבלת בתים', sub: 'מתאים למונדיאל, ליורו ולכל טורניר עם בתים של ארבע נבחרות.',
  scripts: ['calc.js', 'group.js'],
  body: `<div class="calc">
<div class="stack">
<section class="card"><h2>נבחרות</h2><div class="teamgrid" id="teams"></div></section>
<section class="card"><h2>תוצאות המשחקים</h2><div id="matches"></div><div class="actions"><button class="btn btn--ghost" id="reset" type="button">איפוס</button></div></section>
</div>
<section class="card tbl" aria-live="polite"><h2>הטבלה</h2>
<div class="tablewrap"><table><thead><tr><th>#</th><th class="n">נבחרת</th><th>מש׳</th><th class="hide-s">נצ׳</th><th class="hide-s">תק׳</th><th class="hide-s">הפ׳</th><th>שערים</th><th>הפרש</th><th>נק׳</th></tr></thead><tbody id="table"></tbody></table></div>
<p class="legend"><i></i><span class="note">שני המקומות הראשונים מסומנים להמחשה. מי עולה בפועל נקבע בתקנון הטורניר.</span></p>
<p class="note">הכרעה בשוויון: תוצאות ישירות בין הקבוצות השוות, ואז הפרש שערים כללי ושערים שהובקעו. נקודות משמעת והגרלה אינן כלולות. פרטים ב<a href="tiebreakers.html">הכרעת שוויון</a>.</p>
</section>
</div>`,
});

// ---- Legacy article pages ------------------------------------------------------------------------
for (const n of legacy) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, n + '.json'), 'utf8'));
  let body = j.body;
  if (n === 'faq') {
    body = body.replace('<details><summary>האם האתר רשמי?</summary>',
      '<details><summary>האם יש בתים בליגת האלופות?</summary><p>לא. מעונת 2024/25 ליגת האלופות משחקת בשלב ליגה של 36 קבוצות בטבלה אחת. פרטים בדף <a href="champions-league.html">ליגת האלופות</a>.</p></details>\n\n<details><summary>האם האתר רשמי?</summary>');
  }
  if (n === 'privacy') {
    body = body.replace('<h2>מודעות ושירותים של צד שלישי</h2>',
      '<h2>גופנים</h2>\n<p>האתר טוען גופנים מ-Google Fonts. בטעינה הדפדפן שלכם פונה לשרתי Google, ולכן Google עשויה לקבל את כתובת ה-IP שלכם וסוג הדפדפן, בהתאם למדיניות הפרטיות שלה.</p>\n\n<h2>מודעות ושירותים של צד שלישי</h2>');
  }
  body = body.split('href="./"').join('href="group-calculator.html"');
  if (n === 'about') {
    const i = body.indexOf('<p>'), k = body.indexOf('</p>') + 4;
    body = body.slice(0, i) + '<p>"כדורגל בכלים" הוא אתר קטן בעברית עם מחשבונים והסברים על כדורגל: שלב הליגה של ליגת האלופות, הפרמייר ליג, לה ליגה וטורנירי הנבחרות כמו המונדיאל והיורו.</p>' + body.slice(k);
  }
  body = `<div class="prose">${tw(body)}</div>`;
  pages.push({
    file: n + '.html', nav: (n === 'tiebreakers' || n === 'titles') ? 't' : '', small: true,
    title: j.title, desc: j.desc, h1: j.h1, sub: j.sub, body,
  });
}

// ---- Team pages (generated from docs/data/*.json) -------------------------------------------------
const LEAGUES = {
  PL: { name: 'פרמייר ליג', file: 'premier-league.html', nav: 'pl' },
  PD: { name: 'לה ליגה', file: 'la-liga.html', nav: 'll' },
};
const bpts = n => (n === 1 ? 'בנקודה אחת' : n === 2 ? 'בשתי נקודות' : 'ב-' + n + ' נקודות');
const npts = n => (n === 1 ? 'נקודה אחת' : n === 2 ? 'שתי נקודות' : n + ' נקודות');

function teamPage(code, d, i) {
  const L = LEAGUES[code], t = d.table, n = t.length, total = (n - 1) * 2;
  const r = t[i], name = he(r.team), pos = r.position;
  const leader = t[0], second = t[1], fourth = t[3], fifth = t[4], safe = t[n - 4], drop = t[n - 3];
  const left = Math.max(0, total - r.played), max = r.points + 3 * left;
  const pace = x => Math.round(x.points / Math.max(1, x.played) * total);
  const date = new Date(d.updated).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });

  const title = pos === 1
    ? `${name} מובילה ב${L.name}, יתרון של ${npts(r.points - second.points)}`
    : `${name}: כמה נקודות חסרות בעונה? ${L.name}`;

  let champ, cl, rel;
  if (pos === 1) champ = `הקבוצה מובילה, עם יתרון של ${npts(r.points - second.points)} על ${he(second.team)}.`;
  else if (r.points === leader.points) champ = `הקבוצה שווה נקודות למובילה ${he(leader.team)}, והפער ביניהן בהפרש שערים.`;
  else champ = `הקבוצה מפגרת ${bpts(leader.points - r.points)} אחרי ${he(leader.team)}, המובילה.`;

  if (pos <= 4) cl = `הקבוצה נמצאת באזור ליגת האלופות, עם יתרון של ${r.points - fifth.points === 0 ? 'אפס נקודות (שוות נקודות)' : npts(r.points - fifth.points)} על המקום החמישי (${he(fifth.team)}).`;
  else cl = r.points === fourth.points
    ? `הקבוצה שווה נקודות למקום הרביעי (${he(fourth.team)}), והפער ביניהן בהפרש שערים.`
    : `הקבוצה מפגרת ${bpts(fourth.points - r.points)} אחרי המקום הרביעי (${he(fourth.team)}).`;

  if (pos >= n - 2) rel = `הקבוצה נמצאת באזור הירידה, ${r.points === safe.points ? 'שווה נקודות' : npts(safe.points - r.points) + ' מתחת'} למקום ה-${n - 3} (${he(safe.team)}) שבטוח כרגע.`;
  else rel = `הקבוצה מעל אזור הירידה, עם יתרון של ${r.points === drop.points ? 'אפס נקודות (שוות נקודות)' : npts(r.points - drop.points)} על המקום ה-${n - 2} (${he(drop.team)}).`;

  const target = pace(fourth), safeTarget = pace(safe);
  const sign = r.gd > 0 ? '+' + r.gd : String(r.gd);
  const body = `<ul class="facts">
<li><small>מקום בטבלה</small><b>${pos}</b></li>
<li><small>נקודות</small><b>${r.points}</b></li>
<li><small>משחקים</small><b>${r.played} מתוך ${total}</b></li>
<li><small>הפרש שערים</small><b><bdi dir="ltr">${sign}</bdi></b></li></ul>
<div class="prose">
<h2>המצב נכון ל-${date}</h2>
<ul>
<li><strong>אליפות:</strong> ${champ}</li>
<li><strong>ליגת האלופות:</strong> ${cl}</li>
<li><strong>הישארות בליגה:</strong> ${rel}</li>
</ul>
<p>נותרו ${left} משחקים, ולכן המקסימום האפשרי הוא ${max} נקודות.</p>
</div>
${tool({
    h: `כמה נקודות חסרות ל${name}?`,
    note: 'היעד ההתחלתי הוא קצב המקום הרביעי כיום. אפשר לשנות אותו בשדה או בכפתורים.',
    pts: r.points, played: r.played, total, target,
    presets: [{ l: 'קצב המקום הרביעי: ' + target, v: target }, { l: 'קצב קו ההישארות: ' + safeTarget, v: safeTarget }, { l: 'הישארות (אומדן נפוץ): 40', v: 40 }],
  })}
<div class="prose">
<p class="note">הקצבים מחושבים מהנקודות הנוכחיות של הקבוצות במקומות האלה ומניחים שימשיכו באותו ממוצע למשחק עד סוף העונה. זו הערכה פשוטה ולא תחזית. הנתונים מתעדכנים כמה פעמים ביום ועלולים להתעכב.</p>
<p><a href="${L.file}">לטבלה המלאה של ${L.name}</a></p>
</div>`;
  return {
    file: slug(r.team), nav: L.nav, small: true, title: title + ' | כדורגל בכלים',
    desc: `מקום ${pos} ב${L.name} עם ${r.points} נקודות אחרי ${r.played} משחקים. כמה נקודות חסרות ל${name} לאליפות, לליגת האלופות ולהישארות.`,
    h1: `${name}: כמה נקודות חסרות?`, sub: `מקום ${pos} ב${L.name} אחרי ${r.played} משחקים, עם ${r.points} נקודות.`,
    scripts: ['needs.js'], body,
  };
}

for (const code of Object.keys(LEAGUES)) {
  const d = readData(code);
  const lp = pages.find(p => p.file === LEAGUES[code].file);
  if (!d || !Array.isArray(d.table) || d.table.length < 18) continue;
  const teamPages = d.table.map((_, i) => teamPage(code, d, i));
  pages.push(...teamPages);
  lp.body += `\n<div class="prose"><h2>דפי הקבוצות</h2></div><ul class="teams-grid">${d.table.map(r => `<li><a href="${slug(r.team)}">${he(r.team)}</a></li>`).join('')}</ul>`;
}

for (const p of pages) fs.writeFileSync(path.join(DOCS, p.file), page(p), 'utf8');

const urls = pages.map(p => BASE + (p.file === 'index.html' ? '' : p.file));
fs.writeFileSync(path.join(DOCS, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n', 'utf8');
console.log('built', pages.length, 'pages');
