"""Merge regional local-measure JSON files into data/local.json, normalizing fields and flagging problems."""
import json, glob, re, sys
B='/home/claude/'
counties={f['properties']['name'] for f in json.load(open(B+'geo/counties.json'))['features']}
norm=lambda s: re.sub(r'\s+','',re.sub(r'[.\'’]','',re.sub(r'\bcounty\b','',str(s).lower().replace('saint','st'))))
ck={norm(c):c for c in counties}; ck['stlouis']='St. Louis County'; ck['stlouiscity']='St. Louis City'; ck['cityofstlouis']='St. Louis City'
CATS={'sales tax','property tax','bond','use tax','marijuana tax','charter/governance','other'}
out={'measures':[],'no_measures':[],'unchecked':[],'notes':{}}; problems=[]
for fn in sorted(glob.glob(B+'local/*.json')):
    try: d=json.load(open(fn))
    except Exception as e: problems.append(f'{fn}: unreadable ({e})'); continue
    reg=d.get('region',fn)
    for m in d.get('measures',[]):
        c=ck.get(norm(m.get('county','')))
        if not c: problems.append(f"{reg}: unknown county {m.get('county')!r} for {m.get('jurisdiction')} {m.get('measure')}"); continue
        m['county']=c
        cat=str(m.get('category','other')).lower().strip(); m['category']=cat if cat in CATS else ('bond' if 'bond' in cat else 'sales tax' if 'sales' in cat else 'property tax' if 'property' in cat or 'levy' in cat else 'use tax' if 'use' in cat else 'marijuana tax' if 'marijuana' in cat or 'cannabis' in cat else 'charter/governance' if 'charter' in cat or 'govern' in cat else 'other')
        r=str(m.get('result','unknown')).lower(); m['result']='passed' if r.startswith('pass') or r=='approved' else 'failed' if r.startswith('fail') or r=='rejected' else 'unknown'
        m['jurisdiction_type']=str(m.get('jurisdiction_type','other district')).lower()
        for k in ('yes_votes','no_votes'):
            v=m.get(k); m[k]=int(str(v).replace(',','')) if v not in (None,'') and str(v).replace(',','').isdigit() else None
        yp=m.get('yes_pct'); 
        try: m['yes_pct']=float(str(yp).rstrip('%')) if yp not in (None,'') else None
        except: m['yes_pct']=None
        if m['yes_votes'] is not None and m['no_votes'] is not None and m['yes_votes']+m['no_votes']>0:
            calc=100*m['yes_votes']/(m['yes_votes']+m['no_votes'])
            if m['yes_pct'] is not None and abs(calc-m['yes_pct'])>0.6: problems.append(f"{reg}: {m['jurisdiction']} {m['measure']} yes_pct {m['yes_pct']} vs votes {calc:.1f}")
            m['yes_pct']=round(calc,2)
        if m['result']!='unknown' and m['yes_pct'] is None: problems.append(f"{reg}: {m['jurisdiction']} {m['measure']} has result {m['result']} but no vote share")
        m['sources']=[u for u in (m.get('sources') or []) if str(u).startswith('http')]
        if not m['sources']: problems.append(f"{reg}: {m['jurisdiction']} {m['measure']} has no source")
        out['measures'].append({k:m.get(k) for k in ['county','jurisdiction','jurisdiction_type','measure','category','description','threshold','yes_votes','no_votes','yes_pct','result','result_note','sources']})
    out['no_measures']+= [ck.get(norm(re.sub(r'\s*\(.*$','',str(c))),str(c)) for c in d.get('counties_no_measures_found',[])]
    out['unchecked']+= [{'county':ck.get(norm(u.get('county','')),u.get('county')),'why':u.get('why','')} for u in d.get('counties_not_checked_or_inaccessible',[]) if isinstance(u,dict)]
    out['notes'][reg]=d.get('notes','')
# duplicates
seen={}
for m in out['measures']:
    k=(m['county'],norm(m['jurisdiction']),norm(m['measure']))
    if k in seen: problems.append(f"duplicate: {k}")
    seen[k]=1
json.dump(out,open(B+'data/local.json','w'))
covered={m['county'] for m in out['measures']}|set(out['no_measures'])|{u['county'] for u in out['unchecked']}
print(len(out['measures']),'measures;',len({m['county'] for m in out['measures']}),'counties with measures; results known:',sum(m['result']!='unknown' for m in out['measures']))
print('counties never mentioned by any region file:',sorted(counties-covered))
print('PROBLEMS:',len(problems)); [print(' -',p) for p in problems[:60]]
