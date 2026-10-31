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
    '.gc { --navy: #1e2a44; --gold: #c49a45; --gold-deep: #85621f; --ink: #1f2430; --muted: #5c6475; --line: #e1e4ea; --mist: #f4f5f8; --ok: #1d7a46; --ok-bg: #e9f6ee; --no: #b3261e; --no-bg: #fcecea; color: var(--ink); font-family: Figtree, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: left; }',
    '.gc *, .gc *::before, .gc *::after { box-sizing: border-box; }',
    '.gc h1, .gc h2 { font-family: "Source Serif 4", Georgia, serif; color: var(--navy); margin: 0; text-wrap: balance; }',
    '.gc h1 { font-size: clamp(30px, 4vw, 42px); line-height: 1.15; }',
    '.gc-intro { display: grid; gap: 10px; max-width: 680px; margin-bottom: 22px; } .gc-intro p { margin: 0; color: var(--muted); font-size: 17px; line-height: 1.6; }',
    // Carrot's theme styles every <form> (dark panel, column layout), so these rules use the id to win.
    '#gpm-coverage .gc-form { display: flex; flex-direction: row; gap: 10px; flex-wrap: wrap; margin: 0 0 16px; padding: 0; width: auto; max-width: none; height: auto; min-height: 0; background: none; border: 0; box-shadow: none; }',
    '#gpm-coverage .gc-form input { flex: 1 1 280px; height: auto; min-height: 0; margin: 0; min-width: 0; font: inherit; font-size: 16px; padding: 13px 14px; border: 1px solid #c9ced8; border-radius: 6px; background: #fff; color: var(--ink); }',
    '.gc-form input:focus { outline: 3px solid var(--gold); outline-offset: 1px; }',
    '.gc-btn { display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: 600; font-size: 16px; padding: 13px 22px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; text-decoration: none !important; }',
    '.gc-btn-navy { background: var(--navy); color: #fff !important; } .gc-btn-gold { background: var(--gold); color: #1a1a1a !important; } .gc-btn-ghost { background: #fff; color: var(--navy) !important; border-color: var(--line); }',
    '.gc-btn[disabled] { opacity: .6; cursor: wait; }',
    '.gc-result { border-radius: 10px; padding: 20px 22px; margin-bottom: 18px; display: grid; gap: 8px; border: 1px solid var(--line); }',
    '.gc-result[hidden] { display: none; }',
    '.gc-result h2 { font-size: 24px; } .gc-result p { margin: 0; line-height: 1.55; } .gc-result .gc-addr { font-size: 14.5px; color: var(--muted); }',
    '.gc-result.ok { background: var(--ok-bg); border-color: #b7dfc6; } .gc-result.ok h2 { color: var(--ok); }',
    '.gc-result.no { background: var(--no-bg); border-color: #f1c4bf; } .gc-result.no h2 { color: var(--no); }',
    '.gc-result.err { background: var(--mist); }',
    '.gc-acts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }',
    '.gc-map { height: 460px; max-width: 100%; border-radius: 10px; border: 1px solid var(--line); overflow: hidden; background: var(--mist); }',
    '.gc-legend { display: flex; gap: 18px; flex-wrap: wrap; font-size: 14.5px; color: var(--muted); margin-top: 10px; }',
    '.gc-legend span::before { content: ""; display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 7px; vertical-align: -1px; }',
    '.gc-legend .g::before { background: #0f9d58; } .gc-legend .r::before { background: #ff5252; }',
    '#gpm-coverage .gc-form .gc-btn { flex: 0 0 auto; width: auto; margin: 0; }',
    '@media (max-width: 560px) { .gc-map { height: 340px; } #gpm-coverage .gc-form .gc-btn { flex: 1 1 100%; } }'
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
      '<div class="gc-intro"><h1>Do we manage in your area?</h1><p>Type the property&rsquo;s address to see if it&rsquo;s inside the area GPM manages around Jackson, MS.</p></div>' +
      '<form class="gc-form" novalidate><label class="gc-sr" for="gc-q" style="position:absolute;left:-9999px">Property address</label>' +
      '<input id="gc-q" type="text" autocomplete="street-address" placeholder="Street address, city, ZIP" required>' +
      '<button class="gc-btn gc-btn-navy" type="submit">Check address</button></form>' +
      '<div class="gc-result" role="status" aria-live="polite" hidden></div>' +
      '<div class="gc-map" aria-label="Map of the area GPM manages"></div>' +
      '<div class="gc-legend"><span class="g">We manage here</span><span class="r">Outside our area</span></div>';

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
      var layer = L.geoJSON(areas, { style: function (f) {
        var g = f.properties.status === 'green';
        return { color: g ? '#0f9d58' : '#e53935', weight: 1.5, fillColor: g ? '#0f9d58' : '#ff5252', fillOpacity: 0.3 };
      } }).addTo(map);
      map.fitBounds(layer.getBounds(), { padding: [12, 12] });
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
          pin = L.marker([hit.lat, hit.lng]).addTo(map); map.setView([hit.lat, hit.lng], 13);
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
