"""Population centers per district from 2020 Census PL 94-171 blocks (exact block counts, assigned by block internal point)."""
import json, re, collections, numpy as np, shapely
from shapely.geometry import shape
B='/home/claude/'
names={}; bx=[]; by=[]; bp=[]; bpl=[]
for line in open(B+'geo-raw/pl/mogeo2020.pl',encoding='latin-1'):
    f=line.rstrip('\n').split('|')
    if f[2]=='160': names[f[31]]=f[-10]
    elif f[2]=='750':
        p=int(f[-7])
        if p>0: bx.append(float(f[-4])); by.append(float(f[-5])); bp.append(p); bpl.append(f[31])
bx=np.array(bx); by=np.array(by); bp=np.array(bp); bpl=np.array(bpl)
clean=lambda n: re.sub(r' (city|village|town)$','',n)
placeTot=collections.Counter()
for pl,p in zip(bpl,bp): placeTot[pl]+=p
out={}
for layer in ['house','senate','congress']:
    out[layer]={}
    for ft in json.load(open(B+f'geo/{layer}.json'))['features']:
        g=shape(ft['geometry']).buffer(0); x0,y0,x1,y1=g.bounds
        idx=np.where((bx>=x0)&(bx<=x1)&(by>=y0)&(by<=y1))[0]
        inside=idx[shapely.contains_xy(g,bx[idx],by[idx])]
        c=collections.Counter()
        for pl,p in zip(bpl[inside],bp[inside]):
            if pl in names: c[pl]+=p
        L=[]
        for pl,p in c.most_common(4):
            if p<300: continue
            nm=names[pl]; cdp=nm.endswith(' CDP')
            L.append([clean(nm[:-4] if cdp else nm), int(p), int(placeTot[pl]), cdp])
        tot=int(bp[inside].sum())
        out[layer][ft['properties']['id']]={'places':L,'pop':tot,'uninc':tot-int(sum(v for k,v in c.items() if not names[k].endswith(' CDP')))}
pl=json.load(open(B+'data/places.json')); pl['district']=out; json.dump(pl,open(B+'data/places.json','w'))
for l,d in [('house','25'),('house','44'),('house','94'),('house','112'),('house','1'),('senate','8'),('congress','5')]: print(l,d,out[l][d])
