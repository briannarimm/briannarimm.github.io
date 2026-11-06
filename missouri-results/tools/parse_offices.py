"""Pull county/local office contests out of county election summary reports.

Input: text from `pdftotext -raw` or OCR. Handles the common report layouts
(ElectionWare/ES&S "Election Summary Report", Clarity-style "(VOTE FOR 1)" pages,
and "Times Cast" summaries), including candidate names that wrap onto two lines.
Each contest records the printed "Total Votes" when there is one, so a parse can be
checked: sum(candidate votes) must equal it.
"""
import re, sys, os, json

OFFICE = re.compile(r"COMMISSION|COUNTY CLERK|CIRCUIT CLERK|CLERK OF|RECORDER|TREASURER|COLLECTOR|PROSECUT|PUBLIC ADMIN|ASSESSOR|SHERIFF|CORONER|SURVEYOR|ASSOCIATE CIRCUIT|ASST\.? CIR|CIRCUIT JUDGE|JUDGE OF THE CIRCUIT|COUNTY EXECUTIVE|LEGISLAT|COUNCIL|ALDERM|MAYOR|COUNTY AUDITOR|^AUDITOR|FOR AUDITOR|BOARD MEMBER|DIRECTOR|TRUSTEE|MAGISTRATE|PROBATE|COLLECTOR|CLERK", re.I)
NOT = re.compile(r"STATE AUDITOR|STATE SENATOR|STATE REPRESENTATIVE|U\.?\s?S\.? REP|UNITED STATES|CONGRESS|SUPREME COURT|COURT OF APPEALS|AMENDMENT|PROPOSITION|QUESTION|RETAIN|HARDWICK|HAMNER|WILSON|STATE OF MISSOURI", re.I)
PWORD = {'REP':'R','REPUBLICAN':'R','DEM':'D','DEMOCRATIC':'D','LIB':'L','LIBERTARIAN':'L','GRN':'G','GREEN':'G',
         'CON':'C','CONSTITUTION':'C','IND':'I','INDEPENDENT':'I','WI':'W','NP':'','NON':''}
NUM = r"\d{1,3}(?:[,.]\d{3})+|\d+"
SKIP = re.compile(r"^(Number of Precincts|Precincts Reporting|Vote For|VOTE FOR|\(VOTE FOR|Times Cast|Registered|Overvote|Over Votes|Undervote|Under Votes|Unresolved|Candidate( Party)?( Total)?$|Party$|Total$|VIEW RESULTS|Total Ballots|Ballots Cast|\d+(\.\d+)?%$|Page \d|Date:|Time:|Statistics|Election Day|Absentee|Not Assigned|Contest Totals|TOTAL VOTE)|Page:? ?\d+ ?(of|cf)|Election Summary|Report generated|Summary Res|Copyright|GENERAL ELECTION|COUNTY, MISSOURI|November \d|NOVEMBER \d|Election Night Reporting|^MO \w+ \d{6}", re.I)

def split_party(name):
    """Return (clean name, party code) from strings like 'X (REP)', 'X (REPUBLICAN PARTY)', 'REP X', 'X REP'."""
    p = ''
    m = re.search(r"\((REPUBLICAN|DEMOCRATIC|LIBERTARIAN|GREEN|CONSTITUTION|INDEPENDENT)(?: PARTY)?\)|\((REP|DEM|LIB|GRN|CON|IND|WI|NP)\)", name, re.I)
    if m:
        p = PWORD[(m.group(1) or m.group(2)).upper()]; name = (name[:m.start()] + name[m.end():]).strip()
    else:
        m = re.match(r"^(REP|DEM|LIB|GRN|CON|IND)\.?\s+(.+)$", name)
        if m: p = PWORD[m.group(1)]; name = m.group(2)
        else:
            m = re.match(r"^(.+?)\s+(REP|DEM|LIB|GRN|CON|IND|Republican|Democratic|Libertarian)$", name, re.I)
            if m: p = PWORD[m.group(2).upper()]; name = m.group(1)
    name = re.sub(r"\s+", " ", name).strip(" .:|“”\"")
    name = re.sub(r"^(Candidate\s*:?\s*Total|Day|a|Election Absentee Day)\s+", "", name)
    if re.search(r"WRITE[- ]?IN|IRITE", name, re.I): p = 'W'; name = 'Write-in'
    return name, p

def parse(text):
    L = [l.strip() for l in text.replace('\r', '').split('\n')]
    out, cur, buf = [], None, []
    # "Summary Results Report" PDFs with Times Cast tables: pdftotext puts each contest's title AFTER its
    # results, so a title closes the block above it instead of opening the one below.
    first_title = next((i for i, l in enumerate(L) if re.search(r'\(Vote for \d+\)\s*$', l, re.I)), None)
    first_cand = next((i for i, l in enumerate(L) if re.match(r'^Candidate Party Total', l)), None)
    shifted = bool(re.search(r'Times Cast', text)) and first_cand is not None and first_title is not None and first_cand < first_title
    if shifted: cur = {'contest': None, 'cands': [], 'total': None}
    def is_header(i):
        l = L[i]
        if not re.match(r"^[A-Z0-9][A-Za-z0-9 .,'’&/#()\-]{5,}$", l): return False
        if SKIP.match(l) or re.search(r"Precincts|Total|Registered", l, re.I): return False
        nxt = ' '.join(L[i+1:i+4])
        return bool(re.search(r"^(\(VOTE FOR|\(Vote for|Number of Precincts|Vote For|Times Cast|Total Votes|Precincts Reporting)", nxt, re.I))
    for i, l in enumerate(L):
        if not l: continue
        m2 = re.match(r"^(.*?)\s*\(Vote for \d+\)\s*$", l, re.I)
        if (m2 and len(m2.group(1)) > 4) or is_header(i):
            title = re.sub(r"\s*\(?VOTE FOR.*$", "", m2.group(1) if m2 and len(m2.group(1)) > 4 else l, flags=re.I).strip()
            if shifted:
                cur['contest'] = title; out.append(cur); cur = {'contest': None, 'cands': [], 'total': None}
            else:
                cur = {'contest': title, 'cands': [], 'total': None}; out.append(cur)
            buf = []; continue
        if cur is None: continue
        mt = re.match(r"^Total Votes(?: Cast)?:?\s*(" + NUM + r")?(?:\s.*)?$", l, re.I)
        if mt:
            if mt.group(1): cur['total'] = int(re.sub(r"[,.]", "", mt.group(1)))
            elif i > 0 and re.fullmatch(NUM, L[i-1]): cur['total'] = int(re.sub(r"[,.]", "", L[i-1]))
            buf = []; continue
        if SKIP.match(l): buf = []; continue
        # candidate line: [name] votes [pct]
        m = re.match(r"^(?P<n>.*?)\s*(?P<v>" + NUM + r")\s*[;:|,.]?(?:\s*\d{1,3}(?:\.\d{1,2})?\s?%\.?)?(?:\s+[\d,]+)*\s*[.;:|]?$", l)
        if m and (m.group('n') or buf):
            name = (' '.join(buf) + ' ' + m.group('n')).strip()
            buf = []
            if not name or re.fullmatch(r"[\d,.%/ ]+", name) or re.search(r"NOVEMBER|Tuesday|MISSOURI|Total Votes|AMENDMENT NO|\bof$", name, re.I): continue
            n, p = split_party(name)
            if re.fullmatch(r"(?i)yes|no", n): n = n.capitalize()
            cur['cands'].append([n, p, int(re.sub(r"[,.]", "", m.group('v')))]); continue
        if re.search(r"[A-Za-z]", l) and len(l) < 60: buf.append(l)
        else: buf = []
    return [c for c in out if c['cands'] and c['contest']]

def offices(text):
    return [c for c in parse(text) if OFFICE.search(c['contest']) and not NOT.search(c['contest'])]

if __name__ == '__main__':
    for f in sys.argv[1:]:
        cs = offices(open(f, errors='ignore').read())
        print('=====', os.path.basename(f), len(cs))
        for c in cs:
            s = sum(x[2] for x in c['cands']); s2 = sum(x[2] for x in c['cands'] if x[1]!='W')
            ok = '' if c['total'] is None else ('OK' if c['total'] in (s, s2) else f'SUM {s}!={c["total"]}')
            print('  ', c['contest'], '|', c['cands'], ok)
