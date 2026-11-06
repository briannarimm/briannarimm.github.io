"""Build data/offices.json (county and local offices) from parsed county reports + hand-read sheets.

Auto-parsed sources go through parse_offices.offices(); hand-read rows come from manual.txt
(County|Office|name:party:votes;...|note). Circuit-judge races are left out here because the
Secretary of State reports them (they live in data/judicial.csv)."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_offices import offices

HERE = os.path.dirname(os.path.abspath(__file__))
# usage: build_offices.py TXT_DIR [MANUAL_FILE] [OUT_JSON]
T = (sys.argv[1] if len(sys.argv) > 1 else 'txt').rstrip('/') + '/'
MANUAL = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'offices_manual.txt')
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, '..', 'data', 'offices.json')
AUTO = {  # file -> (county, source label)
    '110326TOTAL_Election_Summary.txt': ('Howard', 'Howard County Clerk election summary'),
    '1f1c2766-Election_Night_Results.txt': ('Ste. Genevieve', 'Ste. Genevieve County Clerk election-night results'),
    '20261103sgn.txt': ('Boone', 'Boone County Clerk election summary'),
    '216_PALL_Election_Summaryfinal.txt': ('Camden', 'Camden County Clerk election summary'),
    '221_PALL_Election_Summary_202611032131491644.txt': ('Cass', 'Cass County Clerk election summary'),
    '5c3f3266-UNOFFICIAL20ALL.txt': ('Pike', 'Pike County Clerk unofficial results'),
    '6aeaa84272370.pdf.ocr.txt': ('Saline', 'Saline County Clerk unofficial results (scanned)'),
    'Nov 2026 County Summary UNOFFICIAL.txt': ('Lafayette', 'Lafayette County Clerk county summary'),
    'RUN6Election_Summary.txt': ('Christian', 'Christian County Clerk election summary'),
    'UNOFFICIAL RESULTS.txt': ('Pettis', 'Pettis County Clerk unofficial results'),
    'buchanan.txt': ('Buchanan', 'Buchanan County Clerk election summary'),
    'caldwell.txt': ('Caldwell', 'Caldwell County Clerk election summary'),
    'cape-g.txt': ('Cape Girardeau', 'Cape Girardeau County Clerk election summary'),
    'cooper.txt': ('Cooper', 'Cooper County Clerk election summary'),
    'e205b0c52dca23a06472ae9113555cf6.txt': ('DeKalb', 'DeKalb County Clerk election summary'),
    'nov_2026__election_summary_.txt': ('Johnson', 'Johnson County Clerk election summary'),
    'ray.txt': ('Ray', 'Ray County Clerk election summary'),
}
MANUAL_SRC = {
    'Barry': 'Barry County Clerk election summary (scanned)', 'Benton': 'Benton County Clerk election summary',
    'Bates': 'Bates County Clerk election summary', 'Daviess': 'Daviess County Clerk election summary',
    'Cole': 'Cole County Clerk cumulative results', 'Carroll': 'Carroll County Clerk election summary',
    'Clinton': 'Clinton County Clerk election summary', 'Taney': 'Taney County Clerk election summary',
    'Barton': 'Barton County Clerk unofficial results', 'Callaway': 'Callaway County Clerk election summary',
    'Linn': 'Linn County Clerk election detail report', 'Adair': 'Adair County Clerk unofficial results',
    'Osage': 'Osage County Clerk summary', 'Crawford': 'Crawford County Clerk summary (no party labels)',
    'Polk': 'Polk County Clerk summary', 'Macon': 'Macon County Clerk summary (11 of 12 Election Day precincts)',
    'Sullivan': 'Sullivan County Clerk machine tape', 'Randolph': 'Randolph County Clerk election summary',
    'Audrain': 'Mexico Ledger, from the Audrain County Clerk (no party labels)',
    'Bollinger': 'Southeast Missourian roundup (no party labels)', 'Scott': 'Southeast Missourian roundup (no party labels)',
    'Perry': 'Southeast Missourian roundup (no party labels)', 'Atchison': 'Atchison County Clerk unofficial results (no party labels)',
    'Madison': 'KFVS12 election results (contested races only)', 'Wayne': 'KFVS12 election results (contested races only)',
    'Dallas': 'KY3 election results (contested races only)', 'Greene': 'KY3 election results (contested races only)',
    'Oregon': 'KY3 election results (contested races only)', 'Phelps': 'KY3 election results (contested races only)',
    'Shannon': 'KY3 election results (contested races only)', 'Texas': 'KY3 election results (contested races only)',
    'Webster': 'KY3 election results (contested races only)',
    'McDonald': 'KOAM election results (contested races only, no party labels)',
    'Newton': 'KOAM election results (contested races only, no party labels)',
    'Pulaski': 'Pulaski County Clerk election summary (photos)', 'Laclede': 'Laclede County Clerk election summary (scanned)',
    'Andrew': 'Andrew County Clerk unofficial results', 'Chariton': 'Chariton County Clerk statement of votes cast (scanned)',
    'Jackson': 'The Beacon (KC), unofficial results as of 10 p.m. Nov. 3',
}
# counties where the source only lists contested races, so uncontested offices are missing
PARTIAL = {k for k, v in MANUAL_SRC.items() if 'contested races only' in v} | {'Jackson'}

SMALL = {'of', 'the', 'and', 'for', 'de'}
def tcase(s):
    letters = re.sub(r'[^A-Za-z]', '', s)
    if letters and sum(ch.isupper() for ch in letters) / len(letters) > 0.7:  # (mostly) ALL CAPS -> Title Case
        w = []
        for i, t in enumerate(s.lower().split()):
            t = t.capitalize() if (i == 0 or t not in SMALL) else t
            t = re.sub(r"^(\(?)[Mm]c([a-z])", lambda m: m.group(1) + 'Mc' + m.group(2).upper(), t)
            t = re.sub(r"(['\-(\"])([a-z])", lambda m: m.group(1) + m.group(2).upper(), t)
            t = re.sub(r"^(Ii|Iii|Iv)$", lambda m: m.group(1).upper(), t)
            t = re.sub(r"^Dl", "Dl", t)
            w.append(t)
        s = ' '.join(w)
    s = s.replace('Delong', 'DeLong')
    return s

def office_name(o):
    o = re.sub(r'^(FOR|Macon County)\s+', '', o.strip(), flags=re.I)
    o = re.sub(r'^County (Presiding|Circuit|Recorder|Prosecuting|Collector)', r'\1', o, flags=re.I)
    o = re.sub(r'\bASST\.? CIR\.? JUDGE\b', 'Associate Circuit Judge', o, flags=re.I)
    o = re.sub(r'\bPRES\.? COMMISSIONER\b', 'Presiding Commissioner', o, flags=re.I)
    o = re.sub(r'\bPROS\.? ATTNY\b', 'Prosecuting Attorney', o, flags=re.I)
    o = re.sub(r'\bCOUNTY COUNTY CLERK\b', 'County Clerk', o, flags=re.I)
    o = re.sub(r'\s+(AII|All)$', '', o)
    o = tcase(o)
    o = re.sub(r'^Presiding Commissioner of the County Commission$', 'Presiding Commissioner', o)
    o = re.sub(r'^Associate Circuit Judge (\d+)-(\d+)$', r'Associate Circuit Judge Circuit \1 Division \2', o)
    return o

CATS = [  # (key, label, regex) — first match wins
    ('exec', 'County executive', r'county executive'),
    ('leg', 'County legislature', r'legislat|council'),
    ('judge', 'Associate circuit judges', r'associate circuit|magistrate|probate'),
    ('presiding', 'Presiding commissioner', r'presiding'),
    ('commish', 'Other commissioners', r'commissioner'),
    ('circuit', 'Circuit clerk', r'circuit clerk|clerk of (the )?circuit|circuit court clerk'),
    ('clerk', 'County clerk', r'county clerk|clerk of the county|county commission clerk'),
    ('recorder', 'Recorder of deeds', r'recorder'),
    ('treasurer', 'Treasurer', r'treasurer'),
    ('collector', 'Collector', r'collector'),
    ('prosecutor', 'Prosecuting attorney', r'prosecut'),
    ('auditor', 'County auditor', r'auditor'),
    ('other', 'Other offices', r'.'),
]
def cat(o):
    for k, _, rx in CATS:
        if re.search(rx, o, re.I): return k

counties = {}
def add(county, src, office, cands, note=''):
    if re.search(r'^(Judge of the )?Circuit Judge|Judge of the Circuit Court', office, re.I): return  # SOS reports these
    c = counties.setdefault(county, {'source': src, 'races': []})
    if note and not c.get('note') and 'contested races only' in src: pass
    cands = sorted(cands, key=lambda x: (x['p'] == 'W', -(x['v'] or 0)))
    c['races'].append({'office': office, 'cat': cat(office), 'cands': cands, **({'note': note} if note else {})})

for f, (county, src) in AUTO.items():
    for c in offices(open(T + f, errors='ignore').read()):
        off = office_name(c['contest'])
        cs = [x for x in c['cands'] if not re.search(r'Precincts Reporting', x[0])]
        if all(x[0] in ('Yes', 'No') for x in cs): continue  # a ballot question, not an office (Pike, Lafayette)
        note = ''
        if county == 'Lafayette' and re.search(r'presiding|southern', off, re.I):
            note = ('The county report shows the presiding commissioner race on about half the county\u2019s ballots (5,731 of 11,758) '
                    'and the southern-district race on all of them, which looks reversed. Check the county\u2019s final report.')
        add(county, src, off, [{'n': tcase(n), 'p': p, 'v': v} for n, p, v in cs], note)

for line in open(MANUAL):
    if line.startswith('#') or not line.strip(): continue
    p = line.rstrip('\n').split('|')
    county, off, cl = p[0], p[1], p[2]
    note = p[3] if len(p) > 3 else ''
    cands = []
    for c in filter(None, cl.split(';')):
        n, pa, v = c.rsplit(':', 2)
        cands.append({'n': n, 'p': pa, 'v': int(v) if v else None})
    add(county, MANUAL_SRC[county], office_name(off), cands, note)

# winner = top vote-getter who isn't a lone write-in total (or the named write-in winner)
for c in counties.values():
    for r in c['races']:
        named = [x for x in r['cands'] if x['n'] != 'Write-in']
        if 'vote for 2' in r['office'].lower():
            for x in sorted(named, key=lambda x: -(x['v'] or 0))[:2]: x['w'] = 1
        elif named:
            top = max(named, key=lambda x: x['v'] or 0); top['w'] = 1
    order = [k for k, _, _ in CATS]
    nat = lambda t: [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', t)]
    c['races'].sort(key=lambda r: (order.index(r['cat']), nat(r['office'])))
    if c['source'] and any(k in c['source'] for k in ['contested races only']) or c['source'].startswith('The Beacon'):
        c['partial'] = True

out = {
    '_about': 'County and local offices on the Nov. 3, 2026 ballot, from county clerks, election boards and local news. Unofficial election-night counts. The Secretary of State does not publish county offices, so coverage depends on what each county or outlet posted.',
    'categories': [[k, l] for k, l, _ in CATS],
    'counties': dict(sorted(counties.items())),
}
json.dump(out, open(OUT, 'w'), indent=1, ensure_ascii=False)
print(len(counties), 'counties', sum(len(c['races']) for c in counties.values()), 'races')
for k, c in counties.items():
    print(k, len(c['races']), '|', '; '.join(f"{r['office']}={','.join(x['n']+'/'+x['p']+'/'+str(x['v']) for x in r['cands'])}" for r in c['races'])[:400])
