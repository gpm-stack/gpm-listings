"""Read GPM's public AppFolio listings into plain data. Read-only; touches nothing."""
import html, json, re, sys, urllib.request

BASE = 'https://goodpm.appfolio.com'
UA = {'User-Agent': 'Mozilla/5.0 (GPM website listings sync)'}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def text(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()


def first(pattern, s, default=''):
    m = re.search(pattern, s, re.S)
    return text(m.group(1)) if m else default


def youtube_id(s):
    m = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([\w-]{11})', s)
    return m.group(1) if m else None


def parse_list(page):
    chunks = page.split('class="listing-item result js-listing-item"')[1:]
    out = []
    for c in chunks:
        uid = re.search(r'/listings/detail/([a-f0-9-]{36})', c)
        if not uid:
            continue
        facts = dict((text(k).lower(), text(v)) for k, v in re.findall(
            r'<dt class="detail-box__label">(.*?)</dt>\s*<dd class="detail-box__value[^"]*">(.*?)</dd>', c, re.S))
        thumb = re.search(r'data-original="(https://images\.cdn\.appfolio\.com/[^"]+)"', c)
        out.append({
            'uid': uid.group(1),
            'title': first(r'class="listing-item__title js-listing-title">\s*<a[^>]*>(.*?)</a>', c),
            'address': first(r'class="u-pad-rm js-listing-address">(.*?)</span>', c),
            'rent': facts.get('rent', ''),
            'bed_bath': facts.get('bed / bath', ''),
            'sqft': facts.get('square feet', ''),
            'available': facts.get('available', ''),
            'thumb': thumb.group(1) if thumb else None,
        })
    return out


def parse_detail(page):
    photos, seen = [], set()
    for m in re.finditer(r'https://images\.cdn\.appfolio\.com/goodpm/images/([a-f0-9-]+)/(large|medium)\.(\w+)', page):
        if m.group(1) not in seen:
            seen.add(m.group(1))
            photos.append(f'https://images.cdn.appfolio.com/goodpm/images/{m.group(1)}/large.{m.group(3)}')
    desc_html = re.search(r'<p class="[^"]*listing-detail__description[^"]*">(.*?)</p>', page, re.S)
    desc = text(desc_html.group(1)) if desc_html else ''
    terms = [text(x) for x in re.findall(r'<li class="list__item">(.*?)</li>', page, re.S)]
    return {'photos': photos, 'description': desc, 'terms': terms, 'youtube': youtube_id(page)}


def scrape():
    page = get(BASE + '/listings?filters%5Border_by%5D=rent_desc')
    expected = page.count('js-listing-item"')
    listings = parse_list(page)
    if expected and len(listings) != expected:
        raise RuntimeError(f'parsed {len(listings)} of {expected} listings; AppFolio layout may have changed')
    for l in listings:
        d = parse_detail(get(BASE + '/listings/detail/' + l['uid']))
        if not d['photos'] and l['thumb']:
            d['photos'] = [l['thumb'].replace('/medium.', '/large.')]
        l.update(d)
        l['detail_url'] = BASE + '/listings/detail/' + l['uid']
        l['apply_url'] = BASE + '/listings/rental_applications/new?listable_uid=' + l['uid'] + '&source=Website'
    return {'expected': expected, 'listings': listings}


if __name__ == '__main__':
    data = scrape()
    json.dump(data, open(sys.argv[1] if len(sys.argv) > 1 else 'listings.json', 'w'), indent=1)
    for l in data['listings']:
        print(f"{l['rent']:>7} | {l['bed_bath']:<14} | {l['sqft'] or '-':>6} | photos {len(l['photos']):>2} | yt {'yes' if l['youtube'] else 'no ':3} | terms {len(l['terms'])} | {l['address']}")
    print('total', len(data['listings']), 'expected', data['expected'])
