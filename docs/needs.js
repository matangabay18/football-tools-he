// "How many points do I still need?" calculator.
function needed(pts, played, total, target) {
  var left = total - played;
  if ([pts, played, total, target].some(function (v) { return !isFinite(v) || v < 0; }) || left < 0 || total === 0) {
    return { status: 'invalid' };
  }
  var need = Math.max(0, target - pts);
  var max = pts + 3 * left;
  if (need === 0) return { status: 'reached', left: left, max: max };
  if (need > 3 * left) return { status: 'impossible', left: left, need: need, max: max };
  var combos = [];
  for (var w = Math.ceil(need / 3); w >= 0; w--) {
    var d = Math.max(0, need - 3 * w);
    if (w + d <= left) combos.push({ w: w, d: d, l: left - w - d, pts: 3 * w + d });
  }
  return { status: 'possible', left: left, need: need, max: max, ppg: need / left, combos: combos };
}

if (typeof module !== 'undefined') module.exports = { needed: needed };

(function () {
  if (typeof document === 'undefined') return;
  var box = document.getElementById('need');
  if (!box) return;
  var presets = [];
  try { presets = JSON.parse(box.dataset.presets || '[]'); } catch (e) {}
  var d = { pts: box.dataset.pts, played: box.dataset.played, total: box.dataset.total, target: box.dataset.target };

  function field(id, label) {
    return '<label class="field" for="' + id + '">' + label +
      '<input type="number" id="' + id + '" min="0" max="200" inputmode="numeric" value="' + d[id.replace('n-', '')] + '"></label>';
  }
  box.innerHTML =
    '<div class="teamgrid">' + field('n-pts', 'נקודות עכשיו') + field('n-played', 'משחקים ששוחקו') +
    field('n-total', 'סך כל המשחקים בעונה') + field('n-target', 'יעד נקודות') + '</div>' +
    (presets.length ? '<div class="chips2" role="group" aria-label="יעדים מוכנים">' + presets.map(function (p, i) {
      return '<button type="button" class="chip" data-v="' + p.v + '">' + p.l + '</button>';
    }).join('') + '</div>' : '') +
    '<div class="result" id="n-out" aria-live="polite"></div>';

  function val(id) { var v = document.getElementById(id).value; return v === '' ? NaN : +v; }

  function render() {
    var pts = val('n-pts'), played = val('n-played'), total = val('n-total'), target = val('n-target');
    var r = needed(pts, played, total, target);
    var out = document.getElementById('n-out');
    if (r.status === 'invalid') {
      out.innerHTML = '<p class="verdict">בדקו את המספרים: מספר המשחקים ששוחקו לא יכול לעלות על סך המשחקים בעונה.</p>';
    } else if (r.status === 'reached') {
      out.innerHTML = '<p class="verdict ok">היעד כבר הושג. יש ' + pts + ' נקודות מול יעד של ' + target + '.</p>';
    } else if (r.status === 'impossible') {
      out.innerHTML = '<p class="verdict bad">היעד לא ניתן להשגה. גם ניצחון בכל ' + r.left + ' המשחקים הנותרים יביא רק ל-' + r.max + ' נקודות.</p>';
    } else {
      var rows = r.combos.slice(0, 6).map(function (c) {
        return '<tr><td>' + c.w + '</td><td>' + c.d + '</td><td>' + c.l + '</td><td>' + c.pts + '</td></tr>';
      }).join('');
      out.innerHTML =
        '<p class="verdict"><span class="big">' + r.need + '</span> נקודות חסרות ב-' + r.left + ' משחקים. ממוצע נדרש: <b>' + r.ppg.toFixed(2) + '</b> נקודות למשחק.</p>' +
        '<div class="tablewrap"><table><thead><tr><th>ניצחונות</th><th>תיקו</th><th>הפסדים</th><th>נקודות שנצברות</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="note">כל שורה היא דרך אחת להגיע ליעד או לעבור אותו במשחקים הנותרים.</p>';
    }
  }

  box.addEventListener('input', render);
  box.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.chip') : null;
    if (!b) return;
    document.getElementById('n-target').value = b.dataset.v;
    render();
  });
  render();
})();
