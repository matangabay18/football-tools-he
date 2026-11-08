(function () {
  var DEFAULT = ['נבחרת א', 'נבחרת ב', 'נבחרת ג', 'נבחרת ד'];
  var PAIRS = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
  var KEY = 'group-calc-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function fresh() { return { teams: DEFAULT.slice(), goals: PAIRS.map(function () { return ['', '']; }) }; }
  var state = load() || fresh();
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function uniq(names) {
    var seen = {};
    return names.map(function (n, i) {
      n = (n || '').trim() || DEFAULT[i];
      var base = n, k = 2;
      while (seen[n]) n = base + ' ' + (k++);
      seen[n] = 1;
      return n;
    });
  }

  function renderTeams() {
    document.getElementById('teams').innerHTML = state.teams.map(function (t, i) {
      return '<label class="field" for="t' + i + '">נבחרת ' + (i + 1) + '<input type="text" id="t' + i + '" data-t="' + i + '" value="' + esc(t) + '"></label>';
    }).join('');
    document.querySelectorAll('[data-t]').forEach(function (el) {
      el.addEventListener('input', function () { state.teams[+el.dataset.t] = el.value; save(); updateNames(); renderTable(); });
    });
  }

  function renderMatches() {
    var html = '';
    PAIRS.forEach(function (p, i) {
      if (i % 2 === 0) html += '<h3 class="md">מחזור ' + (i / 2 + 1) + '</h3>';
      html += '<div class="fx"><span class="t" data-n="' + p[0] + '"></span>' +
        '<input type="number" min="0" max="99" inputmode="numeric" placeholder="–" data-g="' + i + ',0" value="' + esc(state.goals[i][0]) + '">' +
        '<span class="sep">:</span>' +
        '<input type="number" min="0" max="99" inputmode="numeric" placeholder="–" data-g="' + i + ',1" value="' + esc(state.goals[i][1]) + '">' +
        '<span class="t" data-n="' + p[1] + '"></span></div>';
    });
    var box = document.getElementById('matches');
    box.innerHTML = html;
    box.querySelectorAll('[data-g]').forEach(function (el) {
      el.addEventListener('input', function () {
        var ij = el.dataset.g.split(',');
        state.goals[+ij[0]][+ij[1]] = el.value; save(); renderTable();
      });
    });
    updateNames();
  }

  function updateNames() {
    var names = uniq(state.teams);
    document.querySelectorAll('[data-n]').forEach(function (s) { s.textContent = names[+s.dataset.n]; });
    document.querySelectorAll('[data-g]').forEach(function (el) {
      var ij = el.dataset.g.split(',');
      el.setAttribute('aria-label', 'שערי ' + names[PAIRS[+ij[0]][+ij[1]]]);
    });
  }

  function renderTable() {
    var names = uniq(state.teams);
    var matches = PAIRS.map(function (p, i) {
      var a = state.goals[i][0], b = state.goals[i][1];
      var ok = a !== '' && b !== '' && +a >= 0 && +b >= 0;
      return { home: names[p[0]], away: names[p[1]], hg: ok ? +a : null, ag: ok ? +b : null };
    });
    var rows = standings(names, matches);
    document.getElementById('table').innerHTML = rows.map(function (r, i) {
      return '<tr class="' + (i < 2 ? 'q' : '') + '"><td><span class="rank">' + (i + 1) + '</span></td><td class="n">' + esc(r.name) + '</td>' +
        '<td>' + r.p + '</td><td class="hide-s">' + r.w + '</td><td class="hide-s">' + r.d + '</td><td class="hide-s">' + r.l + '</td>' +
        '<td>' + r.gf + '–' + r.ga + '</td><td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td><td class="pts">' + r.pts + '</td></tr>';
    }).join('');
  }

  document.getElementById('reset').addEventListener('click', function () {
    state = fresh(); save(); renderTeams(); renderMatches(); renderTable();
  });
  renderTeams(); renderMatches(); renderTable();
})();
