import re, json, sys
t = open(sys.argv[1]).read()
GREEN = {'0F9D58', '097138'}; RED = {'FF0000', 'FF5252', 'A52714'}
def ring(s): return [[round(float(x), 6), round(float(y), 6)] for x, y, *_ in (c.split(',') for c in s.split())]
feats = []
for p in re.findall(r'<Placemark>(.*?)</Placemark>', t, re.S):
    col = re.search(r'<styleUrl>#poly-([0-9A-F]{6})', p)
    if not col: continue
    status = 'green' if col.group(1) in GREEN else 'red' if col.group(1) in RED else None
    assert status, col.group(1)
    polys = []
    for poly in re.findall(r'<Polygon>(.*?)</Polygon>', p, re.S):
        outer = re.search(r'<outerBoundaryIs>.*?<coordinates>(.*?)</coordinates>', poly, re.S).group(1)
        inner = re.findall(r'<innerBoundaryIs>.*?<coordinates>(.*?)</coordinates>', poly, re.S)
        polys.append([ring(outer)] + [ring(i) for i in inner])
    feats.append({'type': 'Feature', 'properties': {'status': status}, 'geometry': {'type': 'MultiPolygon', 'coordinates': polys}})
json.dump({'type': 'FeatureCollection', 'source': 'Google My Maps "GPM Coverage Area Map" (mid 1mRfUg6Ehw3LKBohrjJX8D3n4pwjx9hk)', 'features': feats}, open(sys.argv[2], 'w'), separators=(',', ':'))
print(len(feats), 'areas,', sum(1 for f in feats if f['properties']['status'] == 'green'), 'green,', sum(len(pp) - 1 for f in feats for pp in f['geometry']['coordinates']), 'cut-outs')
