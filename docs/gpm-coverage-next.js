/* GPM coverage checker: a visitor types an address and learns whether it is inside the area GPM manages.
   Areas come from coverage.geojson (exported from the "GPM Coverage Area Map" in Google My Maps by tools/kml2geo.py):
   green = we manage, red = we don't. Red wins where areas overlap; anywhere outside both counts as not covered.
   Anything not green needs GPM's approval, so it offers the Property Review Request form (Carrot form 17) placed
   on the same page; without that form on the page, the button goes to the contact page. */
(function () {
  var script = document.currentScript;
  var BASE = script && /^https?:/.test(script.src) ? script.src.replace(/[?#].*$/, '').replace(/[^/]+$/, '') : 'https://gpm-stack.github.io/gpm-listings/';
  var PHONE = '(601) 300-2050', TEL = 'tel:+16013002050';
  var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  var CENTER = [32.30, -90.18];
  var REVIEW_FORM_ID = 17;

  var CSS = [
    '.gc { --navy: #1e2a44; --gold: #c49a45; --gold-deep: #85621f; --ink: #1f2430; --muted: #5c6475; --line: #e1e4ea; --mist: #f4f5f8; --ok: #1d7a46; --ok-bg: #edf7f1; --no: #b3261e; --sand: #fbf6ec; color: var(--ink); font-family: Figtree, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: left; }',
    '.gc *, .gc *::before, .gc *::after { box-sizing: border-box; }',
    // One card: navy header with the search, the answer, then the map.
    '.gc-card { border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: #fff; box-shadow: 0 1px 2px rgba(30,42,68,.06), 0 14px 34px -14px rgba(30,42,68,.28); }',
    '.gc-head { background: var(--navy); padding: clamp(22px, 3.2vw, 34px) clamp(18px, 3.2vw, 36px); display: grid; gap: 20px; }',
    '#gpm-coverage .gc-head h2 { font-family: "Source Serif 4", Georgia, serif; color: #fff; margin: 0; font-size: clamp(26px, 3.2vw, 34px); line-height: 1.15; text-wrap: balance; }',
    '#gpm-coverage .gc-head p { margin: 8px 0 0; color: #c9d0de; font-size: 16.5px; line-height: 1.55; max-width: 60ch; }',
    // Carrot's theme styles every <form> (dark panel, column layout), so these rules use the id to win.
    '#gpm-coverage .gc-form { display: flex; flex-direction: row; gap: 10px; flex-wrap: wrap; margin: 0; padding: 0; width: auto; max-width: 780px; height: auto; min-height: 0; background: none; border: 0; box-shadow: none; }',
    "#gpm-coverage .gc-form input { flex: 1 1 280px; height: auto; min-height: 0; margin: 0; min-width: 0; font: inherit; font-size: 16px; padding: 14px 16px 14px 46px; border: 1px solid transparent; border-radius: 10px; color: var(--ink); background: #fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6475' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z'/%3E%3Ccircle cx='12' cy='10' r='2.5'/%3E%3C/svg%3E\") no-repeat 15px 50% / 20px 20px; }",
    '#gpm-coverage .gc-form input::placeholder { color: #8a91a0; opacity: 1; }',
    '#gpm-coverage .gc-form input:focus { outline: 3px solid var(--gold); outline-offset: 2px; }',
    '.gc-btn { display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: 600; font-size: 16px; padding: 14px 24px; border-radius: 10px; border: 1px solid transparent; cursor: pointer; text-decoration: none !important; transition: background-color .15s ease, box-shadow .15s ease; }',
    '.gc-btn-navy { background: var(--navy); color: #fff !important; } .gc-btn-gold { background: var(--gold); color: #1a1a1a !important; } .gc-btn-ghost { background: #fff; color: var(--navy) !important; border-color: var(--line); }',
    '.gc-btn-navy:hover { background: #2a3a5e; } .gc-btn-gold:hover { background: #d1a955; }',
    '.gc-btn:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }',
    '.gc-btn[disabled] { opacity: .6; cursor: wait; }',
    '#gpm-coverage .gc-form .gc-btn { flex: 0 0 auto; width: auto; margin: 0; background: var(--gold); color: #1a1a1a !important; border-color: transparent; }',
    '#gpm-coverage .gc-form .gc-btn:hover { background: #d1a955; }',
    '.gc-result { padding: 22px clamp(18px, 3.2vw, 36px) 24px; display: grid; gap: 8px; border-bottom: 1px solid var(--line); }',
    '.gc-result[hidden] { display: none; }',
    '#gpm-coverage .gc-result h2 { font-family: "Source Serif 4", Georgia, serif; margin: 0; font-size: clamp(20px, 2.4vw, 24px); line-height: 1.25; color: var(--navy); display: flex; gap: 10px; align-items: flex-start; text-wrap: balance; }',
    '.gc-result h2::before { content: ""; flex: 0 0 24px; height: 24px; margin-top: 3px; background: no-repeat 50% / contain; }',
    '.gc-result p { margin: 0; line-height: 1.55; max-width: 72ch; } .gc-result .gc-addr { font-size: 14.5px; color: var(--muted); }',
    '.gc-result.ok { background: var(--ok-bg); } #gpm-coverage .gc-result.ok h2 { color: var(--ok); }',
    ".gc-result.ok h2::before { background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%231d7a46'/%3E%3Cpath d='M7 12.5l3.2 3.2L17 9' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\"); }",
    '.gc-result.no { background: var(--sand); }',
    ".gc-result.no h2::before { background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2385621f'/%3E%3Cpath d='M12 11v6' stroke='white' stroke-width='2.2' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='7.4' r='1.4' fill='white'/%3E%3C/svg%3E\"); }",
    '.gc-result.err { background: var(--mist); }',
    '.gc-acts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }',
    // z-index keeps Leaflet's layers under the site's menus; the tiles go grey so only GPM's areas carry colour.
    '.gc-mapwrap { position: relative; }',
    '.gc-map { height: 520px; max-width: 100%; position: relative; z-index: 0; background: #eceef2; }',
    '.gc-map.leaflet-container { font-family: inherit; background: #eceef2; }',
    '.gc-map .leaflet-tile-pane { filter: grayscale(1) contrast(.9) brightness(1.06); }',
    '.gc-map .leaflet-bar { border: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(30,42,68,.2); }',
    '#gpm-coverage .gc-map .leaflet-bar a { width: 36px; height: 36px; line-height: 36px; font-size: 20px; color: var(--navy); background: #fff; border-bottom: 1px solid var(--line); text-decoration: none; }',
    '#gpm-coverage .gc-map .leaflet-bar a:last-child { border-bottom: 0; } #gpm-coverage .gc-map .leaflet-bar a:hover { background: var(--mist); }',
    '.gc-map .leaflet-control-attribution { font-size: 11px; color: var(--muted); background: rgba(255,255,255,.82); border-radius: 8px 0 0 0; padding: 2px 8px; }',
    '#gpm-coverage .gc-map .leaflet-control-attribution a { color: var(--muted); }',
    '.gc-pin { filter: drop-shadow(0 3px 4px rgba(15,23,42,.4)); }',
    '.gc-legend { position: absolute; left: 14px; bottom: 14px; z-index: 1; display: flex; gap: 6px 18px; flex-wrap: wrap; font-size: 14px; font-weight: 500; color: var(--ink); background: rgba(255,255,255,.95); padding: 9px 14px; border-radius: 10px; box-shadow: 0 2px 10px rgba(30,42,68,.18); }',
    '.gc-legend span::before { content: ""; display: inline-block; width: 13px; height: 13px; border-radius: 4px; margin-right: 8px; vertical-align: -1.5px; border: 1.5px solid; }',
    '.gc-legend .g::before { background: rgba(30,42,68,.38); border-color: #1e2a44; } .gc-legend .r::before { background: rgba(179,38,30,.24); border-color: #b3261e; }',
    '@media (max-width: 640px) { .gc-map { height: 440px; } #gpm-coverage .gc-form .gc-btn { flex: 1 1 100%; } .gc-legend { position: static; border-radius: 0; box-shadow: none; border-top: 1px solid var(--line); padding: 12px 18px; } }',
    '@media (prefers-reduced-motion: reduce) { .gc-btn { transition: none; } }'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function load(tag, attrs) {
    return new Promise(function (ok, fail) {
      var el = document.createElement(tag); Object.keys(attrs).forEach(function (k) { el[k] = attrs[k]; });
      el.onload = ok; el.onerror = fail; document.head.appendChild(el);
    });
  }

  // Ray casting; ring is [[lng, lat], ...].
  function inRing(x, y, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function inPolygon(x, y, poly) { return inRing(x, y, poly[0]) && !poly.slice(1).some(function (hole) { return inRing(x, y, hole); }); }
  function statusAt(areas, lng, lat) {
    var hits = areas.features.filter(function (f) { return f.geometry.coordinates.some(function (p) { return inPolygon(lng, lat, p); }); })
      .map(function (f) { return f.properties.status; });
    return hits.indexOf('red') !== -1 ? 'red' : hits.indexOf('green') !== -1 ? 'green' : 'outside';
  }

  function geocode(q) {
    var arcgis = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&countryCode=USA&location=' + CENTER[1] + ',' + CENTER[0] + '&SingleLine=' + encodeURIComponent(q);
    var osm = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(q);
    return fetch(arcgis).then(function (r) { return r.json(); }).then(function (d) {
      var c = d.candidates && d.candidates[0];
      if (c && c.score >= 80) return { lat: c.location.y, lng: c.location.x, label: c.address };
      throw new Error('no match');
    }).catch(function () {
      return fetch(osm).then(function (r) { return r.json(); }).then(function (d) {
        if (!d[0]) return null;
        return { lat: +d[0].lat, lng: +d[0].lon, label: d[0].display_name };
      });
    });
  }

  function message(status, label) {
    if (status === 'green') return { cls: 'ok', html:
      '<h2>Great News! We Serve Your Area.</h2><p class="gc-addr">' + esc(label) + '</p>' +
      '<p>Your property is within GPM&rsquo;s management coverage area. Let&rsquo;s see if it&rsquo;s a good fit for our services.</p>' +
      '<div class="gc-acts"><a class="gc-btn gc-btn-gold" href="/free-rental-evaluation/">Get Started</a></div>' };
    return { cls: 'no', html:
      '<h2>Your Property Is Outside Our Primary Service Area</h2><p class="gc-addr">' + esc(label) + '</p>' +
      '<p>This property falls outside our standard coverage area. However, some properties near our service boundaries may still qualify for management.</p>' +
      '<p>We review these opportunities individually to ensure we can provide the level of service our clients expect.</p>' +
      '<div class="gc-acts"><a class="gc-btn gc-btn-navy gc-review" href="/contact-us/">Request a Property Review</a></div>' };
  }

  // The review form stays hidden until a visitor asks for a review, unless GF is showing its errors or thank-you.
  function reviewForm() {
    var wrap = document.getElementById('gform_wrapper_' + REVIEW_FORM_ID);
    if (wrap && !wrap.querySelector('.gform_validation_errors, .gfield_error, .validation_error')) wrap.style.display = 'none';
    return wrap;
  }
  function openReview(wrap, address) {
    wrap.style.display = '';
    var field = document.getElementById('input_' + REVIEW_FORM_ID + '_1');
    if (field && address) field.value = address;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = document.getElementById('input_' + REVIEW_FORM_ID + '_5_3');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
  }

  function mount() {
    var root = document.getElementById('gpm-coverage');
    if (!root) { root = document.createElement('div'); root.id = 'gpm-coverage'; (script && script.parentNode ? script.parentNode : document.body).insertBefore(root, script || null); }
    root.className = 'gc';
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    root.innerHTML =
      '<div class="gc-card"><div class="gc-head">' +
      '<div class="gc-intro"><h2>Do we manage in your area?</h2><p>Type the property&rsquo;s address to see if it&rsquo;s inside the area GPM manages around Jackson, MS.</p></div>' +
      '<form class="gc-form" novalidate><label class="gc-sr" for="gc-q" style="position:absolute;left:-9999px">Property address</label>' +
      '<input id="gc-q" type="text" autocomplete="street-address" placeholder="Street address, city, ZIP" required>' +
      '<button class="gc-btn gc-btn-gold" type="submit">Check address</button></form></div>' +
      '<div class="gc-result" role="status" aria-live="polite" hidden></div>' +
      '<div class="gc-mapwrap"><div class="gc-map" aria-label="Map of the area GPM manages"></div>' +
      '<div class="gc-legend"><span class="g">We manage here</span><span class="r">Outside our area</span></div></div></div>';

    var form = root.querySelector('form'), input = root.querySelector('input'), btn = root.querySelector('button');
    var result = root.querySelector('.gc-result'), mapEl = root.querySelector('.gc-map');
    var areas = null, map = null, pin = null, review = reviewForm(), checked = '';
    result.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.gc-review');
      if (a && review) { e.preventDefault(); openReview(review, checked); }
    });

    var ready = Promise.all([
      fetch(BASE + 'coverage.geojson', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      load('link', { rel: 'stylesheet', href: LEAFLET + 'leaflet.min.css' }).then(function () { return load('script', { src: LEAFLET + 'leaflet.min.js' }); })
    ]).then(function (res) {
      areas = res[0];
      map = L.map(mapEl, { scrollWheelZoom: false }).setView(CENTER, 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      // Each colour is drawn solid in its own layer, then an SVG filter turns that layer into one tinted shape with a
      // single outline, so neighbouring areas read as one region instead of a patchwork of borders.
      function zone(status, color, tint, z) {
        var name = 'gc-' + status, pane = map.createPane(name);
        pane.style.zIndex = z; pane.style.pointerEvents = 'none';
        var layer = L.geoJSON(areas, {
          pane: name, renderer: L.svg({ pane: name, padding: 0.3 }), interactive: false,
          filter: function (f) { return f.properties.status === status; },
          style: { stroke: false, fillColor: color, fillOpacity: 1 }
        }).addTo(map);
        var svg = pane.querySelector('svg'), g = svg && svg.querySelector('g');
        if (g) {
          var NS = 'http://www.w3.org/2000/svg', defs = document.createElementNS(NS, 'defs');
          defs.innerHTML =
            '<filter id="' + name + '-edge" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
            '<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="grown"/>' +
            '<feMorphology in="grown" operator="erode" radius="2" result="shape"/>' +
            '<feMorphology in="shape" operator="erode" radius="1.4" result="inner"/>' +
            '<feFlood flood-color="' + color + '" result="ink"/>' +
            '<feComposite in="ink" in2="shape" operator="in" result="solid"/>' +
            '<feComponentTransfer in="solid" result="fill"><feFuncA type="linear" slope="' + tint + '"/></feComponentTransfer>' +
            '<feComposite in="solid" in2="inner" operator="out" result="edge"/>' +
            '<feMerge><feMergeNode in="fill"/><feMergeNode in="edge"/></feMerge></filter>';
          svg.insertBefore(defs, svg.firstChild);
          g.setAttribute('filter', 'url(#' + name + '-edge)');
        }
        return layer;
      }
      var layer = zone('green', '#1e2a44', 0.3, 410);
      zone('red', '#b3261e', 0.2, 420);
      map.fitBounds(layer.getBounds().extend(L.geoJSON(areas).getBounds()), { padding: [10, 10] });
    });
    ready.catch(function () { mapEl.style.display = 'none'; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q.length < 5) { input.focus(); return; }
      btn.disabled = true; btn.textContent = 'Checking…';
      ready.then(function () { return geocode(/\bms\b|mississippi/i.test(q) ? q : q + ', MS'); }).then(function (hit) {
        if (!hit) {
          result.className = 'gc-result err';
          result.innerHTML = '<p>We couldn&rsquo;t find that address. Check the spelling and include the city, or call us at <a href="' + TEL + '">' + PHONE + '</a>.</p>';
        } else {
          var status = statusAt(areas, hit.lng, hit.lat), m = message(status, hit.label);
          checked = hit.label;
          if (status === 'green' && review && !review.querySelector('.gform_validation_errors, .gfield_error')) review.style.display = 'none';
          result.className = 'gc-result ' + m.cls; result.innerHTML = m.html;
          if (pin) pin.remove();
          pin = L.marker([hit.lat, hit.lng], { icon: L.divIcon({ className: 'gc-pin', iconSize: [30, 40], iconAnchor: [15, 38],
            html: '<svg viewBox="0 0 30 40" width="30" height="40" aria-hidden="true"><path d="M15 38.5S28 24.5 28 14.5a13 13 0 0 0-26 0C2 24.5 15 38.5 15 38.5Z" fill="#c49a45" stroke="#1e2a44" stroke-width="2"/><circle cx="15" cy="14.5" r="4.5" fill="#1e2a44"/></svg>' }) }).addTo(map);
          map.setView([hit.lat, hit.lng], 13);
        }
        result.hidden = false;
      }).catch(function () {
        result.className = 'gc-result err'; result.hidden = false;
        result.innerHTML = '<p>Something went wrong checking that address. Please try again, or call us at <a href="' + TEL + '">' + PHONE + '</a>.</p>';
      }).then(function () { btn.disabled = false; btn.textContent = 'Check address'; });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
