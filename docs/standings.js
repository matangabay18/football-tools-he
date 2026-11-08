// Renders docs/data/<CODE>.json (written by the standings workflow) into the live table section.
(function () {
  var sec = document.getElementById('live-section');
  if (!sec) return;
  var code = sec.dataset.comp;
  var zones = {};
  try { zones = JSON.parse(sec.dataset.zones || '{}'); } catch (e) {}
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function he(name) { return (typeof HE !== 'undefined' && HE[name]) || name; }
  function slug(n) { return 'team-' + String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html'; }
  var teamLinks = sec.dataset.teams === '1';
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
        '<td class="n"><button type="button" class="rowbtn">' + esc(he(r.team)) + '</button>' + (teamLinks ? ' <a class="tl" href="' + slug(r.team) + '" aria-label="דף הקבוצה">&lsaquo;</a>' : '') + '</td>' +
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
