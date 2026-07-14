/*
 * search.js — client-side docs search over /index.json (built by layouts/index.json).
 * No dependencies. Scoped to the version the current page lives in; token-AND matching
 * with field weighting; keyboard driven (⌘K / Ctrl-K to focus, ↑/↓/Enter/Esc in the box).
 */
(function () {
  var input = document.querySelector('.site-search');
  var box = document.querySelector('.site-search-results');
  if (!input || !box) return;

  var version = input.getAttribute('data-version') || '';
  var docs = null;   // index filtered to this version (lazy-loaded)
  var results = [];
  var sel = -1;

  function load() {
    if (docs) return Promise.resolve(docs);
    return fetch('/index.json')
      .then(function (r) { return r.json(); })
      .then(function (all) {
        docs = all.filter(function (d) { return !version || d.version === version; });
        return docs;
      })
      .catch(function () { docs = []; return docs; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function tokens(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function score(d, toks) {
    var title = (d.title || '').toLowerCase();
    var section = (d.section || '').toLowerCase();
    var lede = (d.lede || '').toLowerCase();
    var text = (d.text || '').toLowerCase();
    var hay = title + ' ' + section + ' ' + lede + ' ' + text;
    // AND: every token must appear somewhere.
    for (var i = 0; i < toks.length; i++) {
      if (hay.indexOf(toks[i]) === -1) return 0;
    }
    var s = 0;
    toks.forEach(function (t) {
      if (title.indexOf(t) !== -1) s += 10;
      if (section.indexOf(t) !== -1) s += 4;
      if (lede.indexOf(t) !== -1) s += 3;
      if (text.indexOf(t) !== -1) s += 1;
    });
    return s;
  }

  function snippet(d, toks) {
    var text = d.text || d.lede || '';
    var lc = text.toLowerCase();
    var at = -1;
    for (var i = 0; i < toks.length; i++) {
      var p = lc.indexOf(toks[i]);
      if (p !== -1) { at = p; break; }
    }
    var frag;
    if (at === -1) {
      frag = text.slice(0, 120) + (text.length > 120 ? '…' : '');
    } else {
      var start = Math.max(0, at - 40), end = Math.min(text.length, at + 90);
      frag = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    }
    var out = esc(frag);
    toks.forEach(function (t) {
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function open() { box.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function close() { box.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; }

  function render(q) {
    var toks = tokens(q);
    sel = -1;
    if (!results.length) {
      box.innerHTML = '<div class="r-empty">No results for &ldquo;' + esc(q) + '&rdquo;</div>';
    } else {
      box.innerHTML = results.map(function (d) {
        return '<a href="' + esc(d.url) + '" role="option">' +
          '<div class="r-title">' + esc(d.title) + '</div>' +
          (d.section ? '<div class="r-sec">' + esc(d.section) + '</div>' : '') +
          '<div class="r-snip">' + snippet(d, toks) + '</div>' +
        '</a>';
      }).join('');
    }
    open();
  }

  function move(delta) {
    var items = box.querySelectorAll('a');
    if (!items.length) return;
    if (sel >= 0) items[sel].classList.remove('sel');
    sel = (sel + delta + items.length) % items.length;
    items[sel].classList.add('sel');
    items[sel].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', function () {
    var q = input.value.trim();
    if (!q) { close(); return; }
    load().then(function () {
      var toks = tokens(q);
      results = docs
        .map(function (d) { return { d: d, s: score(d, toks) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 8)
        .map(function (x) { return x.d; });
      render(q);
    });
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      var items = box.querySelectorAll('a');
      var t = sel >= 0 ? items[sel] : items[0];
      if (t) window.location.href = t.getAttribute('href');
    } else if (e.key === 'Escape') { close(); input.blur(); }
  });

  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input) close();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); input.focus(); input.select();
    }
  });
})();
