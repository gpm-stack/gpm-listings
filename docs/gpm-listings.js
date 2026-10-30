/* GPM homes for rent: renders the listings grid and each home's page on goodpropertymanager.com/houses-for-rent/.
   Data comes from listings.json (kept current from AppFolio by the scheduled sync). */
(function () {
  var script = document.currentScript;
  var BASE = script && /^https?:/.test(script.src) ? script.src.replace(/[?#].*$/, '').replace(/[^/]+$/, '') : 'https://gpm-stack.github.io/gpm-listings/';
  var PHONE = '(601) 300-2050', TEL = 'tel:+16013002050';
  var APPFOLIO = 'https://goodpm.appfolio.com/listings';

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
    '@media (max-width: 980px) { .gh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }',
    '@media (max-width: 900px) { .gh-body { grid-template-columns: minmax(0, 1fr); } .gh-side { position: static; } }',
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

  function grid(data) {
    var n = data.homes.length;
    var body = n ? '<div class="gh-grid">' + data.homes.map(card).join('') + '</div>' :
      '<div class="gh-box"><h2>No homes are available right now</h2><p>New homes are listed as soon as they&rsquo;re ready. Call <a href="' + TEL + '">' + PHONE + '</a> and we&rsquo;ll tell you what&rsquo;s coming up.</p></div>';
    return '<div class="gh-intro"><h1>Homes for rent in Jackson, MS</h1><p>Every home is managed by our local team. Tap a home to see photos, the video tour, and the details. When you&rsquo;re ready, apply online. Questions? Call <a href="' + TEL + '">' + PHONE + '</a>.</p></div>' +
      '<div class="gh-meta"><b>' + n + ' home' + (n === 1 ? '' : 's') + ' available now</b><span>Updated ' + esc(updated(data.updated_at)) + '</span></div>' + body + REQS;
  }

  function detail(h, data) {
    var rows = [['Rent', h.rent + ' /month'], ['Security deposit', h.deposit], ['Application fee', h.application_fee], ['Availability', (function (a) { return a.charAt(0).toUpperCase() + a.slice(1); })(availability(h).replace('Available ', ''))]]
      .filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    var gallery = h.photos.map(function (p, i) { return '<img src="' + esc(p) + '" alt="' + esc(h.address) + ' photo ' + (i + 1) + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '">'; }).join('');
    var video = h.youtube ? '<section><h2>Video tour</h2><div class="gh-video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(h.youtube) + '" title="Video tour of ' + esc(h.address) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div></section>' : '';
    var desc = h.description.map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
    return '<a class="gh-back" href="' + location.pathname + '">&larr; All homes for rent</a>' +
      '<div class="gh-head"><h1>' + esc(h.street) + '</h1><p class="sub">' + esc(h.address) + '</p>' +
      '<div class="gh-facts"><span class="gh-rent">' + esc(h.rent) + '<small> /month</small></span><span>' + esc(specs(h)) + '</span></div></div>' +
      '<div class="gh-gallery">' + gallery + '</div><p class="gh-hint">' + h.photos.length + ' photos. Swipe or scroll to see them all.</p>' +
      '<div class="gh-body"><div class="gh-main">' + video +
      '<section class="gh-desc"><h2>About this home</h2>' + desc + '</section>' +
      '<section><h2>What you need to rent</h2><ul class="gh-list-ul"><li>Household income of at least 3x the monthly rent for one occupant, or 4x for two or more occupants</li><li>Credit and background check</li><li>Smoke-free home; pets considered case by case</li><li>Housing Choice Vouchers welcome</li><li>Renters insurance highly recommended</li></ul></section></div>' +
      '<aside class="gh-side"><dl>' + rows + '</dl>' +
      '<a class="gh-btn gh-btn-gold" href="' + esc(h.apply_url) + '" target="_blank" rel="noopener">Apply now</a>' +
      '<a class="gh-btn gh-btn-ghost" href="/contact-us/">Ask about this home</a>' +
      '<a class="gh-btn gh-btn-ghost" href="' + TEL + '">Call ' + PHONE + '</a>' +
      '<p class="small">Applications are completed securely on our AppFolio portal. Listing details updated ' + esc(updated(data.updated_at)) + '.</p></aside></div>';
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
        if (!want) { root.innerHTML = grid(data); return; }
        var h = data.homes.filter(function (x) { return x.slug === want; })[0];
        root.innerHTML = h ? detail(h, data) : gone();
        if (h) document.title = h.street + ', Jackson MS | ' + h.rent + '/mo Home for Rent | GPM';
        window.scrollTo(0, 0);
      })
      .catch(function () { root.innerHTML = fallback(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
