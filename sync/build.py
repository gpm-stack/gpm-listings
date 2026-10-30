"""Build docs/listings.json from GPM's public AppFolio listings.

Run by the GitHub Actions schedule. If AppFolio can't be read or looks different
than expected, this exits with an error and leaves the published file untouched,
so the website keeps showing the last good list.
"""
import json, os, re, sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from scrape import scrape  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'docs', 'listings.json')


def slug(address):
    return re.sub(r'[^a-z0-9]+', '-', address.split(',')[0].lower()).strip('-')


def paragraphs(desc):
    keep = []
    for line in desc.split('\n'):
        s = line.strip()
        if re.search(r'virtual tour of this home', s, re.I) or re.match(r'https?://', s):
            continue
        if re.search(r'schedule (your|a) showing', s, re.I):
            continue
        keep.append(s)
    return [p.strip() for p in '\n'.join(keep).split('\n\n') if p.strip()]


def term(terms, label):
    for t in terms:
        if t.lower().startswith(label.lower()):
            return t.split(':', 1)[1].strip() if ':' in t else t
    return ''


def main():
    data = scrape()
    homes = []
    for l in data['listings']:
        homes.append({
            'uid': l['uid'],
            'slug': slug(l['address']),
            'title': l['title'],
            'address': l['address'],
            'street': l['address'].split(',')[0],
            'rent': l['rent'],
            'bed_bath': l['bed_bath'],
            'sqft': l['sqft'],
            'available': l['available'],
            'photos': l['photos'],
            'youtube': l['youtube'],
            'description': paragraphs(l['description']),
            'deposit': term(l['terms'], 'Security Deposit'),
            'application_fee': term(l['terms'], 'Application Fee'),
            'apply_url': l['apply_url'],
            'appfolio_url': l['detail_url'],
        })
    old = None
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT))
        except ValueError:
            old = None
    if old and old.get('homes') == homes:
        print(f'No listing changes ({len(homes)} homes).')
        return
    json.dump({'updated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'homes': homes},
              open(OUT, 'w'), indent=1)
    print(f'Wrote {len(homes)} homes to docs/listings.json')


if __name__ == '__main__':
    main()
