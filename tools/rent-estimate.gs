/**
 * GPM rent estimate endpoint (Google Apps Script web app).
 * The website's free rental evaluation (docs/gpm-rent.js) calls this with ?address=&beds=&baths=&type=
 * and gets back {ok, rent, low, high}. The RentCast key lives in Script Properties (RENTCAST_API_KEY),
 * never in the website code. A monthly cap (MONTHLY_CAP, default 45) keeps RentCast inside its free 50 lookups;
 * repeat lookups of the same home within 6 hours come from cache and don't count.
 *
 * Deploy: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 */
var DEFAULT_CAP = 45;
var TYPES = { 'Single family house': 'Single Family', 'Townhouse': 'Townhouse', 'Condo': 'Condo', 'Duplex or multi-unit': 'Multi-Family' };

function doGet(e) {
  var p = (e && e.parameter) || {};
  var address = String(p.address || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (address.length < 6) return json({ ok: false, reason: 'address' });
  var beds = parseFloat(String(p.beds || '').replace('+', '')) || null;
  var baths = parseFloat(String(p.baths || '').replace('+', '')) || null;
  var type = TYPES[p.type] || 'Single Family';

  var cache = CacheService.getScriptCache();
  var cacheKey = 'rc_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [address.toLowerCase(), beds, baths, type].join('|')));
  var hit = cache.get(cacheKey);
  if (hit) return json(JSON.parse(hit));

  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('RENTCAST_API_KEY');
  if (!key) return json({ ok: false, reason: 'setup' });

  // RentCast bills only successful lookups, so only those count toward the cap.
  var month = 'count_' + Utilities.formatDate(new Date(), 'America/Chicago', 'yyyy-MM');
  var cap = Number(props.getProperty('MONTHLY_CAP') || DEFAULT_CAP);
  if (Number(props.getProperty(month) || 0) >= cap) return json({ ok: false, reason: 'limit' });

  var query = { address: address, propertyType: type, compCount: 10 };
  if (beds) query.bedrooms = beds;
  if (baths) query.bathrooms = baths;
  var url = 'https://api.rentcast.io/v1/avm/rent/long-term?' + Object.keys(query).map(function (k) {
    return k + '=' + encodeURIComponent(query[k]);
  }).join('&');
  var res = UrlFetchApp.fetch(url, { headers: { 'X-Api-Key': key, Accept: 'application/json' }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return json({ ok: false, reason: 'lookup', status: res.getResponseCode() });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    props.setProperty(month, String(Number(props.getProperty(month) || 0) + 1));
  } finally {
    lock.releaseLock();
  }

  var d = JSON.parse(res.getContentText());
  if (!d.rent) return json({ ok: false, reason: 'lookup' });
  var round = function (n) { return n ? Math.round(n / 5) * 5 : null; };
  var out = { ok: true, rent: round(d.rent), low: round(d.rentRangeLow), high: round(d.rentRangeHigh) };
  cache.put(cacheKey, JSON.stringify(out), 21600);
  return json(out);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
