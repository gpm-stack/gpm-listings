# GPM homes for rent

Keeps the Homes for Rent page on goodpropertymanager.com in sync with GPM's AppFolio listings.

- `sync/` reads the public AppFolio listings page (no login) and writes `docs/listings.json`.
- `.github/workflows/sync.yml` runs that every 3 hours. To refresh right away: **Actions → Sync AppFolio listings → Run workflow**.
- `docs/gpm-listings.js` draws the listings grid and each home's page on the website. The Carrot page only loads this script.
- If AppFolio can't be read, the sync fails without changing anything, so the website keeps the last good list. GitHub emails the account owner when a run fails.

Apply buttons go to AppFolio's application. Everything else (photos, video tours, details) stays on goodpropertymanager.com.
