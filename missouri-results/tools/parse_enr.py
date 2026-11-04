"""Parse Missouri SOS election-night (enr.sos.mo.gov) PDF printouts (as pdftotext -layout text)
into the site's long CSV format.

usage: python3 parse_enr.py TXT_DIR OUT_CSV
"""
import csv, os, re, sys, json

KEEP = [
    (re.compile(r'^State Auditor$'), lambda m: ('State Auditor', '')),
    (re.compile(r'^Constitutional Amendment No\. (\d+)$'), lambda m: (f'Amendment {m.group(1)}', '')),
    (re.compile(r'^Proposition ([A-Z])$'), lambda m: (f'Proposition {m.group(1)}', '')),
    (re.compile(r'^Missouri Supreme Court$'), lambda m: ('Supreme Court Retention', '')),
    (re.compile(r'^U\.S\. Representative - District (\d+)$'), lambda m: ('U.S. House', m.group(1))),
    (re.compile(r'^State Senator - District (\d+)$'), lambda m: ('State Senate', m.group(1))),
    (re.compile(r'^State Representative - District (\d+)$'), lambda m: ('State House', m.group(1))),
]
PARTY = {'Republican': 'R', 'Democratic': 'D', 'Libertarian': 'L', 'Green': 'G', 'Constitution': 'C',
         'Write-in': 'W', 'Independent': 'I', 'Nonpartisan': ''}
HDR = re.compile(r'^\s+(\S.*?)\s{2,}([\d,]+) of ([\d,]+) Precincts Reported\s*$')
ROW = re.compile(r'^\s+(?:(\S.*?)\s{2,})?(\S.*?)\s{2,}([\d,]+)\s+([\d.]+)%\s*$')
NOISE = re.compile(r'^(State of Missouri - Election Night Results|https://enr\.sos)')

def parse(text):
    county = None
    m = re.search(r'Choose County:\s+(.+?)\s{2,}', text)
    if m: county = m.group(1).strip()
    asof = re.search(r'as of (\d+/\d+/\d+ [\d:]+ [AP]M)', text)
    races = []; cur = None; last_name = None
    for line in text.splitlines():
        if NOISE.match(line.strip()) or not line.strip():
            continue
        h = HDR.match(line)
        if h:
            title = h.group(1).strip(); cur = None
            for rx, fn in KEEP:
                mm = rx.match(title)
                if mm:
                    name, dist = fn(mm)
                    cur = {'race': name, 'district': dist, 'rep': int(h.group(2).replace(',', '')),
                           'of': int(h.group(3).replace(',', '')), 'rows': []}
                    races.append(cur)
            last_name = None
            continue
        if cur is None or 'Total Votes' in line:
            continue
        r = ROW.match(line)
        if not r:
            continue
        name, party, votes = (r.group(1) or '').strip(), r.group(2).strip(), int(r.group(3).replace(',', ''))
        if party.upper() in ('YES', 'NO'):           # amendment
            choice, pty = party.capitalize(), ''
        elif party in ('Yes Votes', 'No Votes'):        # judicial retention
            choice, pty = party.split()[0], ''
        else:
            if not name:   # name wrapped weirdly; skip
                continue
            choice, pty = name, PARTY.get(party, party[:1])
            if pty == 'W':
                if votes == 0: continue
                choice = 'Write-ins'
        # merge duplicate write-in rows
        ex = next((x for x in cur['rows'] if x[0] == choice), None)
        if ex: ex[2] += votes
        else: cur['rows'].append([choice, pty, votes])
    return county, (asof.group(1) if asof else None), races

SKIP = {}  # all files verified

def main(src, out):
    rows = []; meta = {'statewide_asof': None, 'counties': {}, 'needs_redownload': sorted(SKIP.values())}
    for fn in sorted(os.listdir(src)):
        if not fn.endswith('.txt') or fn in SKIP: continue
        county, asof, races = parse(open(os.path.join(src, fn), encoding='utf-8', errors='replace').read())
        if county is None:
            meta['statewide_asof'] = asof
            for rc in races:
                unit, uid = ('district', rc['district']) if rc['district'] else ('state', 'MO')
                for c, p, v in rc['rows']:
                    rows.append([rc['race'], rc['district'], unit, uid, c, p, v, round(100 * rc['rep'] / rc['of'], 1) if rc['of'] else '', ''])
        else:
            meta['counties'][county] = {'file': fn, 'asof': asof, 'races': len(races)}
            for rc in races:
                for c, p, v in rc['rows']:
                    rows.append([rc['race'], rc['district'], 'county', county, c, p, v, round(100 * rc['rep'] / rc['of'], 1) if rc['of'] else '', ''])
    with open(out, 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['race', 'district', 'unit', 'unit_id', 'choice', 'party', 'votes', 'reporting', 'winner']); w.writerows(rows)
    json.dump(meta, open(out.replace('.csv', '.meta.json'), 'w'), indent=1)
    print(len(rows), 'rows;', len(meta['counties']), 'county files; statewide as of', meta['statewide_asof'])

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
