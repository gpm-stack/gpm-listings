/* GPM free rental evaluation: after a visitor sends Carrot form 16 (name, email, phone, address, beds, baths),
   shows an estimated market rent and compares owner take-home with a typical 10% manager vs GPM's 8%.
   The estimate comes from our Apps Script endpoint (tools/rent-estimate.gs), which keeps the RentCast key private.
   Works whether the form submits by AJAX or by full page reload: the answers are kept in sessionStorage until the
   confirmation appears. */
(function () {
  var script = document.currentScript;
  var FORM_ID = 16;
  var ESTIMATE_URL = (script && script.getAttribute('data-estimate-url')) || '';
  var PHONE = '(601) 300-2050', TEL = 'tel:+16013002050';
  var GPM_RATE = 0.08, GPM_MIN = 89, OTHERS_RATE = 0.10;
  var KEY = 'gpm-rent-request';

  var CSS = [
    '.gr { --navy: #1e2a44; --gold: #c49a45; --gold-deep: #85621f; --ink: #1f2430; --muted: #5c6475; --line: #e1e4ea; --mist: #f4f5f8; --ok: #1d7a46; color: var(--ink); font-family: Figtree, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: left; }',
    '.gr *, .gr *::before, .gr *::after { box-sizing: border-box; }',
    '.gr h2 { font-family: "Source Serif 4", Georgia, serif; color: var(--navy); margin: 0; font-size: clamp(24px, 3vw, 30px); line-height: 1.2; text-wrap: balance; }',
    '.gr p { margin: 0; line-height: 1.55; }',
    '.gr-card { border: 1px solid var(--line); border-radius: 10px; padding: 24px; display: grid; gap: 14px; background: #fff; margin-top: 20px; }',
    '.gr-est { background: var(--mist); }',
    '.gr-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--gold-deep); }',
    '.gr-rent { font-family: "Source Serif 4", Georgia, serif; font-size: clamp(38px, 6vw, 52px); font-weight: 700; color: var(--navy); line-height: 1; }',
    '.gr-rent small { font-family: Figtree, sans-serif; font-size: 17px; font-weight: 500; color: var(--muted); }',
    '.gr-muted { color: var(--muted); font-size: 15px; }',
    '.gr-field { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }',
    '.gr-field label { font-weight: 600; }',
    '.gr-field input { width: 150px; max-width: 100%; font: inherit; font-size: 17px; padding: 10px 12px; border: 1px solid #c9ced8; border-radius: 6px; }',
    '.gr-table-wrap { overflow-x: auto; }',
    '.gr-table { width: 100%; border-collapse: collapse; font-size: 16px; min-width: 420px; }',
    '.gr-table th, .gr-table td { text-align: right; padding: 11px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; }',
    '.gr-table th:first-child, .gr-table td:first-child { text-align: left; white-space: normal; }',
    '.gr-table thead th { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }',
    '.gr-table .gpm td { font-weight: 700; color: var(--navy); background: #fbf7ee; }',
    '.gr-save { display: grid; gap: 4px; padding: 16px 18px; border-radius: 8px; background: #e9f6ee; border: 1px solid #b7dfc6; }',
    '.gr-save b { font-size: 20px; color: var(--ok); }',
    '.gr-acts { display: flex; gap: 10px; flex-wrap: wrap; }',
    '.gr-btn { display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: 600; font-size: 16px; padding: 12px 20px; border-radius: 6px; border: 1px solid var(--line); text-decoration: none !important; }',
    '.gr-btn-navy { background: var(--navy); color: #fff !important; border-color: var(--navy); } .gr-btn-ghost { background: #fff; color: var(--navy) !important; }'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function val(id) { var el = document.getElementById('input_' + FORM_ID + '_' + id); return el ? el.value.trim() : ''; }
  function store(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function stored() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }

  function fees(rent) {
    var others = rent * OTHERS_RATE, gpm = rent > 0 ? Math.max(rent * GPM_RATE, GPM_MIN) : 0;
    return { others: others, gpm: gpm, keepOthers: rent - others, keepGpm: rent - gpm, diff: others - gpm };
  }

  function table(rent) {
    var f = fees(rent);
    var save = f.diff > 0
      ? '<div class="gr-save"><b>You keep ' + money(f.diff) + ' more a month with GPM</b><span>That&rsquo;s ' + money(f.diff * 12) + ' more a year.</span></div>'
      : '<p class="gr-muted">At this rent, GPM&rsquo;s $89 monthly minimum applies, so the fee is about the same as a 10% manager.</p>';
    return '<div class="gr-table-wrap"><table class="gr-table"><thead><tr><th></th><th>Monthly fee</th><th>You keep / month</th><th>You keep / year</th></tr></thead><tbody>' +
      '<tr><td>Typical manager (10%)</td><td>' + money(f.others) + '</td><td>' + money(f.keepOthers) + '</td><td>' + money(f.keepOthers * 12) + '</td></tr>' +
      '<tr class="gpm"><td>GPM (8%)</td><td>' + money(f.gpm) + '</td><td>' + money(f.keepGpm) + '</td><td>' + money(f.keepGpm * 12) + '</td></tr>' +
      '</tbody></table></div>' + save +
      '<p class="gr-muted">GPM charges 8% of the rent we actually collect, with an $89 monthly minimum, and nothing in a month when no rent comes in.</p>';
  }

  function render(root, req, est) {
    var rent = est && est.rent ? est.rent : 0;
    var head = est && est.rent
      ? '<div class="gr-eyebrow">Estimated market rent</div><div class="gr-rent">' + money(est.rent) + '<small> /month</small></div>' +
        (est.low && est.high ? '<p class="gr-muted">Likely range ' + money(est.low) + ' to ' + money(est.high) + ' for ' + esc(req.address) + '.</p>' : '<p class="gr-muted">' + esc(req.address) + '</p>')
      : '<div class="gr-eyebrow">Your rent evaluation</div><h2>We&rsquo;ll send your rent estimate within 48 hours.</h2>' +
        '<p class="gr-muted">We couldn&rsquo;t pull an instant estimate for ' + esc(req.address) + '. A member of our team will review it and get back to you. Meanwhile, enter a rent below to compare.</p>';
    root.innerHTML =
      '<div class="gr-card gr-est">' + head + '</div>' +
      '<div class="gr-card"><h2>What you&rsquo;d keep each month</h2>' +
      '<div class="gr-field"><label for="gr-rent">Monthly rent</label><input id="gr-rent" type="number" inputmode="numeric" min="0" step="25" value="' + (rent || '') + '" placeholder="1200"></div>' +
      '<div class="gr-out">' + (rent ? table(rent) : '') + '</div></div>' +
      '<div class="gr-card"><p><b>Want the full picture?</b> We&rsquo;ll walk through rent, repairs, and how we&rsquo;d lease your home.</p>' +
      '<div class="gr-acts"><a class="gr-btn gr-btn-navy" href="' + TEL + '">Call ' + PHONE + '</a><a class="gr-btn gr-btn-ghost" href="/pricing/">See our pricing</a></div></div>';
    var input = root.querySelector('#gr-rent'), out = root.querySelector('.gr-out');
    input.addEventListener('input', function () { var r = parseFloat(input.value); out.innerHTML = r > 0 ? table(r) : ''; });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function show(root) {
    var req = stored();
    if (!req || !req.address) return;
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    root.innerHTML = '<div class="gr-card gr-est"><p>Pulling your rent estimate&hellip;</p></div>';
    if (!ESTIMATE_URL) { render(root, req, null); return; }
    var q = ['address', 'beds', 'baths', 'type'].map(function (k) { return k + '=' + encodeURIComponent(req[k] || ''); }).join('&');
    fetch(ESTIMATE_URL + (ESTIMATE_URL.indexOf('?') === -1 ? '?' : '&') + q)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(root, req, d && d.ok ? d : null); })
      .catch(function () { render(root, req, null); });
  }

  function mount() {
    var root = document.getElementById('gpm-rent');
    if (!root) { root = document.createElement('div'); root.id = 'gpm-rent'; (script && script.parentNode ? script.parentNode : document.body).insertBefore(root, script || null); }
    root.className = 'gr';
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

    document.addEventListener('submit', function (e) {
      if (!e.target || e.target.id !== 'gform_' + FORM_ID) return;
      store({ address: val(1), beds: val(2), baths: val(3), type: val(4) });
    }, true);

    var confirmed = function () { return document.getElementById('gform_confirmation_message_' + FORM_ID) || document.getElementById('gforms_confirmation_message_' + FORM_ID); };
    if (window.jQuery) window.jQuery(document).on('gform_confirmation_loaded', function (e, id) { if (+id === FORM_ID) show(root); });
    if (confirmed()) show(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
