// Client-side search for the tins archive. index.json rows: [title, path, date, terms, text].
(function () {
  'use strict';
  var PAGE = 30;
  var docs = null, results = [], shown = 0, terms = [];
  var $q = document.getElementById('q'), $sort = document.getElementById('sort'),
      $status = document.getElementById('status'), $results = document.getElementById('results'),
      $more = document.getElementById('more');

  // Lowercase and strip accents so "cafe" matches "café".
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function parse(q) {
    var out = [], m, re = /"([^"]+)"|(\S+)/g;
    while ((m = re.exec(q))) {
      var t = norm((m[1] || m[2]).trim());
      if (t) out.push(t);
    }
    return out;
  }

  function search() {
    var q = $q.value.trim();
    var url = new URL(location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    $results.innerHTML = '';
    $more.hidden = true;
    terms = parse(q);
    if (!terms.length) { $status.textContent = docs.length.toLocaleString() + ' posts indexed. Type to search.'; return; }
    // Match at the start of a word, so "art" finds "artist" but not "start".
    var res = terms.map(function (t) { return new RegExp('(^|[^a-z0-9])' + reEsc(t), 'g'); });
    results = [];
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i], score = 0, ok = true;
      for (var j = 0; j < res.length; j++) {
        var re = res[j], inTitle = (re.lastIndex = 0, re.test(d.nt)), inTerms = (re.lastIndex = 0, re.test(d.nm));
        re.lastIndex = 0;
        var hits = (d.nx.match(re) || []).length;
        if (!inTitle && !inTerms && !hits) { ok = false; break; }
        score += (inTitle ? 20 : 0) + (inTerms ? 8 : 0) + Math.min(hits, 10);
      }
      if (ok) results.push({ d: d, score: score });
    }
    var s = $sort.value;
    results.sort(s === 'newest' ? function (a, b) { return a.d[2] < b.d[2] ? 1 : -1; }
      : s === 'oldest' ? function (a, b) { return a.d[2] > b.d[2] ? 1 : -1; }
      : function (a, b) { return b.score - a.score || (a.d[2] < b.d[2] ? 1 : -1); });
    shown = 0;
    $status.textContent = results.length ? results.length.toLocaleString() + ' result' + (results.length === 1 ? '' : 's')
      : 'No posts match. Try fewer or different words.';
    render();
  }

  function highlight(text) {
    var pat = terms.map(function (t) { return reEsc(t); }).join('|');
    if (!pat) return esc(text);
    var re = new RegExp('(' + pat + ')', 'gi'), out = '', last = 0, m;
    // Accent-insensitive matching is done on a normalized copy of the same length when possible.
    var n = norm(text), src = n.length === text.length ? n : text;
    while ((m = re.exec(src))) {
      out += esc(text.slice(last, m.index)) + '<mark>' + esc(text.slice(m.index, m.index + m[0].length)) + '</mark>';
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    return out + esc(text.slice(last));
  }

  function snippet(d) {
    var text = d[4], n = d.nx, at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = n.indexOf(terms[i]);
    if (n.length !== text.length) at = text.toLowerCase().indexOf(terms[0]);
    var start = Math.max(0, at - 90), end = Math.min(text.length, (at < 0 ? 0 : at) + 210);
    if (at < 0) { start = 0; end = 220; }
    // Start and end on word boundaries.
    if (start > 0) { var sp = text.indexOf(' ', start); if (sp > -1 && sp < (at < 0 ? end : at)) start = sp + 1; }
    if (end < text.length) { var ep = text.lastIndexOf(' ', end); if (ep > start) end = ep; }
    return (start > 0 ? '… ' : '') + highlight(text.slice(start, end)) + (end < text.length ? ' …' : '');
  }

  function fmtDate(s) {
    if (!s) return 'Page';
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function render() {
    var frag = document.createDocumentFragment();
    results.slice(shown, shown + PAGE).forEach(function (r) {
      var d = r.d, li = document.createElement('li');
      li.innerHTML = '<a href="../' + esc(d[1]) + '">' + highlight(d[0]) + '</a>' +
        '<p class="archive-search-meta">' + fmtDate(d[2]) + (d[3] ? ' · ' + esc(d[3]) : '') + '</p>' +
        '<p class="archive-search-snippet">' + snippet(d) + '</p>';
      frag.appendChild(li);
    });
    $results.appendChild(frag);
    shown += PAGE;
    $more.hidden = shown >= results.length;
  }

  var timer;
  $q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(search, 150); });
  $sort.addEventListener('change', search);
  $more.addEventListener('click', render);
  document.getElementById('archive-search').addEventListener('submit', function (e) { e.preventDefault(); search(); });

  fetch('index.json').then(function (r) { return r.json(); }).then(function (data) {
    data.forEach(function (d) { d.nt = norm(d[0]); d.nm = norm(d[3]); d.nx = norm(d[4]); });
    docs = data;
    var q = new URLSearchParams(location.search).get('q');
    if (q) $q.value = q;
    search();
  }).catch(function () { $status.textContent = 'Sorry — the search index failed to load.'; });
})();
