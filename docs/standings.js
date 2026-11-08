// Renders docs/data/<CODE>.json (written by the standings workflow) into the live table section.
(function () {
  var sec = document.getElementById('live-section');
  if (!sec) return;
  var code = sec.dataset.comp;
  var zones = {};
  try { zones = JSON.parse(sec.dataset.zones || '{}'); } catch (e) {}
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var HE = {
    'Arsenal': 'ארסנל', 'Brighton Hove': 'ברייטון', 'Man City': 'מנצ\'סטר סיטי', 'Liverpool': 'ליברפול', 'Chelsea': 'צ\'לסי',
    'Everton': 'אברטון', 'Bournemouth': 'בורנמות\'', 'Brentford': 'ברנטפורד', 'Leeds United': 'לידס יונייטד', 'Aston Villa': 'אסטון וילה',
    'Tottenham': 'טוטנהאם', 'Newcastle': 'ניוקאסל', 'Hull City': 'האל סיטי', 'Ipswich Town': 'איפסוויץ\'', 'Fulham': 'פולהאם',
    'Nottingham': 'נוטינגהאם פורסט', 'Coventry City': 'קובנטרי', 'Man United': 'מנצ\'סטר יונייטד', 'Sunderland': 'סנדרלנד', 'Crystal Palace': 'קריסטל פאלאס',
    'Barça': 'ברצלונה', 'Real Madrid': 'ריאל מדריד', 'Atleti': 'אתלטיקו מדריד', 'Real Betis': 'ריאל בטיס', 'Real Sociedad': 'ריאל סוסיאדד',
    'Sevilla FC': 'סביליה', 'Athletic': 'אתלטיק בילבאו', 'Villarreal': 'ויאריאל', 'Deportivo': 'דפורטיבו לה קורוניה', 'Santander': 'ראסינג סנטנדר',
    'Celta': 'סלטה ויגו', 'Alavés': 'אלאבס', 'Espanyol': 'אספניול', 'Rayo Vallecano': 'ראיו וייקאנו', 'Getafe': 'חטאפה', 'Osasuna': 'אוסאסונה',
    'Levante': 'לבאנטה', 'Elche': 'אלצ\'ה', 'Valencia': 'ולנסיה', 'Málaga': 'מלאגה',
    'PSG': 'פריז סן ז\'רמן', 'Como 1907': 'קומו', 'Club Brugge': 'קלאב ברוז\'', 'Sporting CP': 'ספורטינג ליסבון', 'Dortmund': 'בורוסיה דורטמונד',
    'Bayern': 'באיירן מינכן', 'Stuttgart': 'שטוטגרט', 'Inter': 'אינטר', 'LASK': 'לאסק לינץ', 'Galatasaray': 'גלאטסראי', 'Fenerbahçe': 'פנרבחצ\'ה',
    'Roma': 'רומא', 'Shaktar': 'שחטאר דונייצק', 'Viking': 'ויקינג', 'PSV': 'איינדהובן', 'Bodø/Glimt': 'בודו גלימט', 'Porto': 'פורטו',
    'Napoli': 'נאפולי', 'PAE AEK': 'איי.אי.קיי אתונה', 'RB Leipzig': 'לייפציג', 'Sabah FK': 'סבאח', 'Feyenoord': 'פיינורד', 'RC Lens': 'לנס',
    'Slavia Praha': 'סלאביה פראג', 'Lille': 'ליל', 'Sl. Bratislava': 'סלובן ברטיסלבה'
  };
  function he(name) { return HE[name] || name; }
  function zone(pos, n) {
    if (zones.top && pos <= zones.top) return 'z-top';
    if (zones.mid && pos <= zones.mid) return 'z-mid';
    if (zones.bottom && pos > n - zones.bottom) return 'z-bot';
    if (zones.mid && pos > zones.mid) return 'z-bot';
    return '';
  }

  function render(d) {
    if (!d || !d.table || !d.table.length) return;
    var n = d.table.length;
    document.getElementById('live-body').innerHTML = d.table.map(function (r) {
      return '<tr class="' + zone(r.position, n) + '" data-pts="' + r.points + '" data-played="' + r.played + '">' +
        '<td><span class="rank">' + r.position + '</span></td>' +
        '<td class="n"><button type="button" class="rowbtn">' + esc(he(r.team)) + '</button></td>' +
        '<td>' + r.played + '</td><td class="hide-s">' + r.won + '</td><td class="hide-s">' + r.draw + '</td><td class="hide-s">' + r.lost + '</td>' +
        '<td class="hide-s">' + '<bdi dir="ltr">' + r.gf + '–' + r.ga + '</bdi>' + '</td><td><bdi dir="ltr">' + (r.gd > 0 ? '+' : '') + r.gd + '</bdi></td><td class="pts">' + r.points + '</td></tr>';
    }).join('');
    var note = document.getElementById('live-note');
    try {
      note.textContent = 'עודכן לאחרונה: ' + new Date(d.updated).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' }) + '. הטבלה מתעדכנת כמה פעמים ביום, ולכן ייתכן עיכוב.';
    } catch (e) {}
    sec.hidden = false;
  }

  sec.addEventListener('click', function (e) {
    var tr = e.target.closest ? e.target.closest('tr[data-pts]') : null;
    var pts = document.getElementById('n-pts');
    if (!tr || !pts) return;
    pts.value = tr.dataset.pts;
    document.getElementById('n-played').value = tr.dataset.played;
    pts.dispatchEvent(new Event('input', { bubbles: true }));
    var tool = document.getElementById('need');
    if (tool && tool.scrollIntoView) tool.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  fetch('data/' + code + '.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(render)
    .catch(function () {});
})();
