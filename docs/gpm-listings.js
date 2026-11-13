/* GPM homes for rent: renders the listings grid and each home's page on goodpropertymanager.com/houses-for-rent/.
   Data comes from listings.json (kept current from AppFolio by the scheduled sync). */
(function () {
  var script = document.currentScript;
  var BASE = script && /^https?:/.test(script.src) ? script.src.replace(/[?#].*$/, '').replace(/[^/]+$/, '') : 'https://gpm-stack.github.io/gpm-listings/';
  var PHONE = '(601) 300-2050', TEL = 'tel:+16013002050';
  var APPFOLIO = 'https://goodpm.appfolio.com/listings';
  // AppFolio adds a 100px logo as every home's last photo; show the website's sharp logo in its place.
  var APPFOLIO_LOGO = 'aa1d309c-8405-422d-9ac7-722cd43f0128';
  var SHARP_LOGO = 'https://image-cdn.carrot.com/uploads/sites/79289/2026/10/gpm-logo-transparent.png';
  // Carrot form "Question About This Property". When the page includes it, "Ask about this home" opens it with the address filled in.
  var ASK_FORM_ID = 14;
  var FILTER_KEY = 'gpmHomeFilters';

  var CSS = [
    'body:has(.gh) .page-header, body:has(.gh) .entry-share { display: none !important; }',
    '.gh { --navy: #1e2a44; --navy-deep: #151e33; --gold: #c49a45; --gold-deep: #85621f; --ink: #1f2430; --muted: #5c6475; --line: #e1e4ea; --mist: #f4f5f8; color: var(--ink); font-family: Figtree, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: left; }',
    '.gh *, .gh *::before, .gh *::after { box-sizing: border-box; }',
    '.gh h1, .gh h2 { font-family: "Source Serif 4", Georgia, serif !important; color: var(--navy) !important; letter-spacing: -0.01em; text-wrap: balance; margin: 0; }',
    '.gh p { margin: 0; } .gh a { text-decoration: none; }',
    '.gh-btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15.5px; padding: 11px 18px; border-radius: 6px; border: 2px solid transparent; white-space: nowrap; cursor: pointer; }',
    '.gh-btn-navy { background: var(--navy); color: #fff !important; } .gh-btn-navy:hover { background: var(--navy-deep); }',
    '.gh-btn-gold { background: var(--gold); color: var(--navy-deep) !important; } .gh-btn-gold:hover { filter: brightness(1.06); }',
    '.gh-btn-ghost { background: #fff; color: var(--navy) !important; border-color: var(--line); } .gh-btn-ghost:hover { border-color: var(--gold); }',
    '.gh-tag { display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 99px; background: #e7f4ec; color: #1f5b37; }',
    '.gh-tag.video { background: #fbefcf; color: #6b4f12; }',
    '.gh-intro { display: grid; gap: 12px; max-width: 760px; margin-bottom: 26px; }',
    '.gh-intro h1 { font-size: clamp(30px, 4vw, 40px); } .gh-intro p { color: var(--muted); font-size: 17px; line-height: 1.6; }',
    '.gh-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; align-items: baseline; margin-bottom: 18px; color: var(--muted); font-size: 14.5px; }',
    '.gh-meta b { color: var(--ink); font-size: 16px; }',
    '.gh-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }',
    '.gh-card { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: #fff; display: grid; grid-template-rows: auto 1fr; }',
    '.gh-card .ph { position: relative; display: block; aspect-ratio: 4 / 3; background: var(--mist); max-width: 100%; }',
    '.gh-card .ph img { width: 100%; height: 100%; object-fit: cover; display: block; }',
    '.gh-card .tags { position: absolute; left: 10px; top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }',
    '.gh-card .info { padding: 16px 18px 18px; display: grid; gap: 6px; align-content: start; }',
    '.gh-rent { font-family: "Source Serif 4", Georgia, serif; font-size: 26px; font-weight: 700; color: var(--navy); }',
    '.gh-rent small { font-family: Figtree, sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); }',
    '.gh-card .specs { font-weight: 600; font-size: 15px; } .gh-card .addr { color: var(--muted); font-size: 14.5px; }',
    '.gh-card .acts { display: flex; gap: 8px; margin-top: 10px; } .gh-card .acts .gh-btn { flex: 1; padding: 10px 12px; font-size: 14.5px; }',
    '.gh-box { border: 1px solid var(--line); border-radius: 10px; padding: 24px 26px; background: var(--mist); display: grid; gap: 8px; }',
    '.gh-box h2 { font-size: 24px; } .gh-box p { color: var(--muted); line-height: 1.6; }',
    '.gh-reqs { margin-top: 40px; }',
    '.gh-back { display: inline-block; margin-bottom: 14px; font-weight: 600; color: var(--gold-deep) !important; }',
    '.gh-head { display: grid; gap: 8px; margin-bottom: 20px; } .gh-head h1 { font-size: clamp(28px, 3.6vw, 38px); } .gh-head .sub { color: var(--muted); font-size: 16px; }',
    '.gh-facts { display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: baseline; font-size: 16px; }',
    '.gh-gallery { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; margin-bottom: 6px; }',
    '.gh-gallery img { flex: 0 0 auto; width: min(720px, 86%); aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; scroll-snap-align: start; max-width: 100%; }',
    '.gh-gallery .gh-logo-slide { flex: 0 0 auto; width: min(720px, 86%); aspect-ratio: 4 / 3; border-radius: 8px; scroll-snap-align: start; max-width: 100%; background: #fbf7ee; display: flex; align-items: center; justify-content: center; }',
    '.gh-gallery .gh-logo-slide img { flex: none; width: 62%; height: auto; aspect-ratio: auto; object-fit: contain; border-radius: 0; }',
    '.gh-hint { font-size: 13.5px; color: var(--muted); margin-bottom: 26px !important; }',
    '.gh-body { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 36px; align-items: start; }',
    '.gh-main { display: grid; gap: 26px; min-width: 0; } .gh-main h2 { font-size: 24px; margin-bottom: 10px; }',
    '.gh-desc p + p { margin-top: 12px; } .gh-desc { line-height: 1.65; }',
    '.gh-video { position: relative; aspect-ratio: 16 / 9; max-width: 100%; border-radius: 8px; overflow: hidden; background: #000; }',
    '.gh-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }',
    '.gh-side { border: 1px solid var(--line); border-radius: 10px; padding: 22px; display: grid; gap: 14px; background: #fff; position: sticky; top: 16px; }',
    '.gh-side dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; } .gh-side dt { color: var(--muted); } .gh-side dd { margin: 0; font-weight: 600; text-align: right; }',
    '.gh-side .gh-btn { width: 100%; } .gh-side .small { font-size: 14px; color: var(--muted); }',
    '.gh-list-ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }',
    '.gh-loading { color: var(--muted); padding: 24px 0; }',
    '.gh-filters { display: flex; flex-wrap: wrap; gap: 10px 12px; align-items: end; margin-bottom: 18px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px; background: var(--mist); }',
    '.gh-filters label { display: grid; gap: 4px; flex: 1 1 130px; min-width: 0; margin: 0; font-size: 13px; font-weight: 600; color: var(--muted); }',
    '.gh-filters select { width: 100%; min-height: 44px; margin: 0; padding: 9px 10px; font: inherit; font-size: 16px; font-weight: 500; color: var(--ink); background-color: #fff; border: 1px solid #c9ced9; border-radius: 6px; }',
    '.gh-filters select:focus-visible, .gh-clear:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }',
    '.gh-clear { min-height: 44px; padding: 0 6px; background: none; border: 0; font: inherit; font-size: 15px; font-weight: 600; color: var(--gold-deep); text-decoration: underline; cursor: pointer; }',
    '.gh-ask { border: 1px solid var(--line); border-radius: 10px; padding: 22px; background: var(--mist); scroll-margin-top: 16px; }',
    '.gh-ask > p { color: var(--muted); line-height: 1.6; margin-bottom: 14px; }',
    'body:has(.gh) #gform_wrapper_' + ASK_FORM_ID + ', body:has(.gh) #gform_confirmation_wrapper_' + ASK_FORM_ID + ' { display: none; }',
    '.gh .gh-ask #gform_wrapper_' + ASK_FORM_ID + ', .gh .gh-ask #gform_confirmation_wrapper_' + ASK_FORM_ID + ' { display: block; }',
    '.gh-bar { display: none; }',
    '@media (max-width: 980px) { .gh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }',
    '@media (max-width: 900px) { .gh-body { grid-template-columns: minmax(0, 1fr); } .gh-side { position: static; }',
    '  .gh-bar { display: flex; align-items: center; gap: 8px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 9990; padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)); background: #fff; border-top: 1px solid var(--line); box-shadow: 0 -4px 16px rgba(21, 30, 51, 0.12); }',
    '  .gh-bar .gh-rent { flex: 1; min-width: 0; font-size: 21px; white-space: nowrap; } .gh-bar .gh-rent small { font-size: 13px; }',
    '  .gh-bar .gh-btn { padding: 11px 16px; }',
    '  body:has(.gh-bar) { padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)); } }',
    '@media (max-width: 600px) { .gh-grid { grid-template-columns: minmax(0, 1fr); } }'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function specs(h) { return [h.bed_bath ? h.bed_bath.replace(' / ', ' · ') : '', h.sqft ? h.sqft + ' sq ft' : ''].filter(Boolean).join(' · '); }
  function availability(h) { var a = (h.available || '').trim(); return !a || /^now$/i.test(a) ? 'Available now' : 'Available ' + a; }
  function homeUrl(h) { return location.pathname + '?home=' + encodeURIComponent(h.slug); }
  function updated(iso) {
    try { return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  var REQS = '<div class="gh-box gh-reqs"><h2>What you need to rent</h2><p>Household income of at least 3x the monthly rent for one occupant, or 4x for two or more occupants, plus a credit and background check. The $50 application fee is only charged when we&rsquo;re ready to run your background check. Housing Choice Vouchers are welcome. Pets are considered case by case, and our homes are smoke-free. <a href="/faq/">Read the renter FAQ</a>.</p></div>';

  function card(h, i) {
    var tags = '<span class="gh-tag">' + esc(availability(h)) + '</span>' + (h.youtube ? '<span class="gh-tag video">Video tour</span>' : '');
    return '<article class="gh-card">' +
      '<a class="ph" href="' + homeUrl(h) + '"><img src="' + esc(h.photos[0] || '') + '" alt="' + esc(h.address) + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '"><span class="tags">' + tags + '</span></a>' +
      '<div class="info"><div class="gh-rent">' + esc(h.rent) + '<small> /month</small></div>' +
      '<div class="specs">' + esc(specs(h)) + '</div><div class="addr">' + esc(h.address) + '</div>' +
      '<div class="acts"><a class="gh-btn gh-btn-navy" href="' + homeUrl(h) + '">View home</a><a class="gh-btn gh-btn-ghost" href="' + esc(h.apply_url) + '" target="_blank" rel="noopener">Apply</a></div></div>' +
      '</article>';
  }

  function beds(h) { var m = /([\d.]+)\s*bd/i.exec(h.bed_bath || ''); return m ? parseFloat(m[1]) : 0; }
  function rentNum(h) { return parseInt(String(h.rent || '').replace(/[^\d]/g, ''), 10) || 0; }
  function area(h) { var p = (h.address || '').split(','); return ((p[p.length - 2] || '').trim() + ' ' + ((/(\d{5})\s*$/.exec(h.address || '') || [])[1] || '')).trim(); }
  function money(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function savedFilters() { try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) || {}; } catch (e) { return {}; } }

  // Choices come from the homes on the market right now, so a filter never offers something no home can match.
  function filterBar(homes) {
    var f = savedFilters();
    var bedOpts = uniq(homes.map(beds)).sort(function (a, b) { return a - b; }).slice(1);
    var rentOpts = uniq(homes.map(function (h) { return Math.ceil(rentNum(h) / 100) * 100; })).sort(function (a, b) { return a - b; }).slice(0, -1);
    var areas = uniq(homes.map(area)).sort();
    function select(name, label, opts) {
      return '<label>' + label + '<select data-f="' + name + '">' + opts.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (String(f[name] || '') === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      }).join('') + '</select></label>';
    }
    return '<div class="gh-filters">' +
      (bedOpts.length ? select('beds', 'Bedrooms', [['', 'Any']].concat(bedOpts.map(function (b) { return [b, b + ' or more']; }))) : '') +
      (rentOpts.length ? select('max', 'Rent up to', [['', 'Any rent']].concat(rentOpts.map(function (r) { return [r, money(r)]; }))) : '') +
      (areas.length > 1 ? select('area', 'Area', [['', 'All areas']].concat(areas.map(function (a) { return [a, a + ' (' + homes.filter(function (h) { return area(h) === a; }).length + ')']; }))) : '') +
      select('sort', 'Sort by rent', [['', 'High to low'], ['low', 'Low to high']]) +
      '<button type="button" class="gh-clear" style="display:none">Clear filters</button></div>';
  }

  function grid(data) {
    var n = data.homes.length;
    var intro = '<div class="gh-intro"><h1>Homes for rent in Jackson, MS</h1><p>Every home is managed by our local team. Tap a home to see photos, the video tour, and the details. When you&rsquo;re ready, apply online. Questions? Call <a href="' + TEL + '">' + PHONE + '</a>.</p></div>';
    if (!n) return intro + '<div class="gh-meta"><b>0 homes available now</b><span>Updated ' + esc(updated(data.updated_at)) + '</span></div>' +
      '<div class="gh-box"><h2>No homes are available right now</h2><p>New homes are listed as soon as they&rsquo;re ready. Call <a href="' + TEL + '">' + PHONE + '</a> and we&rsquo;ll tell you what&rsquo;s coming up.</p></div>' + REQS;
    return intro + filterBar(data.homes) +
      '<div class="gh-meta"><b class="gh-count" aria-live="polite"></b><span>Updated ' + esc(updated(data.updated_at)) + '</span></div><div class="gh-results"></div>' + REQS;
  }

  function wireGrid(root, data) {
    var bar = root.querySelector('.gh-filters');
    if (!bar) return;
    var n = data.homes.length, clear = bar.querySelector('.gh-clear');
    function apply() {
      var f = {};
      [].forEach.call(bar.querySelectorAll('select'), function (s) { f[s.getAttribute('data-f')] = s.value; });
      try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch (e) {}
      var active = f.beds || f.max || f.area;
      var list = data.homes.filter(function (h) {
        return (!f.beds || beds(h) >= parseFloat(f.beds)) && (!f.max || rentNum(h) <= parseInt(f.max, 10)) && (!f.area || area(h) === f.area);
      }).sort(function (a, b) { return f.sort === 'low' ? rentNum(a) - rentNum(b) : rentNum(b) - rentNum(a); });
      root.querySelector('.gh-count').textContent = active ? 'Showing ' + list.length + ' of ' + n + ' homes' : n + ' home' + (n === 1 ? '' : 's') + ' available now';
      root.querySelector('.gh-results').innerHTML = list.length ? '<div class="gh-grid">' + list.map(card).join('') + '</div>' :
        '<div class="gh-box"><h2>No homes match those filters</h2><p>Try a wider search, or call <a href="' + TEL + '">' + PHONE + '</a> and we&rsquo;ll tell you what&rsquo;s coming up.</p><p><button type="button" class="gh-btn gh-btn-navy gh-clear">Show all homes</button></p></div>';
      clear.style.display = active ? '' : 'none';
    }
    bar.addEventListener('change', apply);
    root.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.gh-clear')) return;
      [].forEach.call(bar.querySelectorAll('select'), function (s) { if (s.getAttribute('data-f') !== 'sort') s.value = ''; });
      apply();
    });
    apply();
  }

  function detail(h, data) {
    var rows = [['Rent', h.rent + ' /month'], ['Security deposit', h.deposit], ['Application fee', h.application_fee], ['Availability', (function (a) { return a.charAt(0).toUpperCase() + a.slice(1); })(availability(h).replace('Available ', ''))]]
      .filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    var gallery = h.photos.map(function (p, i) {
      if (p.indexOf(APPFOLIO_LOGO) !== -1) return '<div class="gh-logo-slide"><img src="' + SHARP_LOGO + '" alt="GPM Sales and Management, LLC" loading="lazy"></div>';
      return '<img src="' + esc(p) + '" alt="' + esc(h.address) + ' photo ' + (i + 1) + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '">';
    }).join('');
    var video = h.youtube ? '<section><h2>Video tour</h2><div class="gh-video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(h.youtube) + '" title="Video tour of ' + esc(h.address) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div></section>' : '';
    var desc = h.description.map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
    return '<a class="gh-back" href="' + location.pathname + '">&larr; All homes for rent</a>' +
      '<div class="gh-head"><h1>' + esc(h.street) + '</h1><p class="sub">' + esc(h.address) + '</p>' +
      '<div class="gh-facts"><span class="gh-rent">' + esc(h.rent) + '<small> /month</small></span><span>' + esc(specs(h)) + '</span></div></div>' +
      '<div class="gh-gallery">' + gallery + '</div><p class="gh-hint">' + h.photos.length + ' photos. Swipe or scroll to see them all.</p>' +
      '<div class="gh-body"><div class="gh-main">' + video +
      '<section class="gh-desc"><h2>About this home</h2>' + desc + '</section>' +
      '<section><h2>What you need to rent</h2><ul class="gh-list-ul"><li>Household income of at least 3x the monthly rent for one occupant, or 4x for two or more occupants</li><li>Credit and background check</li><li>Smoke-free home; pets considered case by case</li><li>Housing Choice Vouchers welcome</li><li>Renters insurance highly recommended</li></ul></section>' +
      '<section class="gh-ask" id="gh-ask" style="display:none"><h2>Ask about this home</h2><p>Send us your question about ' + esc(h.address) + '. We reply within 48 hours. For a faster answer, call <a href="' + TEL + '">' + PHONE + '</a>.</p></section></div>' +
      '<aside class="gh-side"><dl>' + rows + '</dl>' +
      '<a class="gh-btn gh-btn-gold" href="' + esc(h.apply_url) + '" target="_blank" rel="noopener">Apply now</a>' +
      '<a class="gh-btn gh-btn-ghost gh-ask-btn" href="/contact-us/">Ask about this home</a>' +
      '<a class="gh-btn gh-btn-ghost" href="' + TEL + '">Call ' + PHONE + '</a>' +
      '<p class="small">Applications are completed securely on our AppFolio portal. Listing details updated ' + esc(updated(data.updated_at)) + '.</p></aside></div>' +
      '<div class="gh-bar"><span class="gh-rent">' + esc(h.rent) + '<small> /month</small></span>' +
      '<a class="gh-btn gh-btn-ghost" href="' + TEL + '">Call</a><a class="gh-btn gh-btn-gold" href="' + esc(h.apply_url) + '" target="_blank" rel="noopener">Apply now</a></div>';
  }

  // Moves the page's question form into this home's page. Returns true when the form has just been sent or needs a fix, so the page can stay on it.
  function wireAsk(root, h) {
    var wrap = document.getElementById('gform_wrapper_' + ASK_FORM_ID) || document.getElementById('gform_confirmation_wrapper_' + ASK_FORM_ID);
    var box = root.querySelector('#gh-ask');
    if (!wrap || !box) return false;
    box.appendChild(wrap);
    function open(focus) {
      box.style.display = '';
      var q = wrap.querySelector('textarea');
      if (q && !q.value) q.value = 'I have a question about ' + h.address + ':\n';
      box.scrollIntoView({ block: 'start' });
      var first = wrap.querySelector('input[type="text"], input[type="tel"], input[type="email"]');
      if (focus && first) first.focus({ preventScroll: true });
    }
    root.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.gh-ask-btn')) return;
      e.preventDefault(); open(true);
    });
    if (/confirmation/.test(wrap.id) || wrap.querySelector('.gform_confirmation_message, .validation_error, .gform_validation_errors, .gfield_error')) {
      box.style.display = '';
      setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 60);
      return true;
    }
    return false;
  }

  function gone() {
    return '<a class="gh-back" href="' + location.pathname + '">&larr; All homes for rent</a><div class="gh-box"><h2>This home is no longer available</h2><p>It may have been rented. See the homes available now, or call <a href="' + TEL + '">' + PHONE + '</a>.</p><p><a class="gh-btn gh-btn-navy" href="' + location.pathname + '">See available homes</a></p></div>';
  }

  function fallback() {
    return '<div class="gh-intro"><h1>Homes for rent in Jackson, MS</h1><p>We couldn&rsquo;t load our listings just now.</p></div><p><a class="gh-btn gh-btn-navy" href="' + APPFOLIO + '" target="_blank" rel="noopener">See available homes</a></p>';
  }

  function mount() {
    var root = document.getElementById('gpm-listings');
    if (!root) { root = document.createElement('div'); root.id = 'gpm-listings'; (script && script.parentNode ? script.parentNode : document.body).insertBefore(root, script || null); }
    root.className = 'gh';
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    root.innerHTML = '<p class="gh-loading">Loading homes&hellip;</p>';
    fetch(BASE + 'listings.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var want = new URLSearchParams(location.search).get('home');
        if (!want) { root.innerHTML = grid(data); wireGrid(root, data); return; }
        var h = data.homes.filter(function (x) { return x.slug === want; })[0];
        root.innerHTML = h ? detail(h, data) : gone();
        if (h) document.title = h.street + ', ' + ((h.address || '').split(',').slice(-2, -1)[0] || 'Jackson').trim() + ' MS | ' + h.rent + '/mo Home for Rent | GPM';
        if (h && wireAsk(root, h)) return;
        window.scrollTo(0, 0);
      })
      .catch(function () { root.innerHTML = fallback(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
