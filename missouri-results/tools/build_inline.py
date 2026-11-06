"""Bundle index.html + app.css + app.js + data/ into one self-contained HTML file (for sharing as a single page)."""
import json, os, sys
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html=open(os.path.join(D,'index.html')).read()
css=open(os.path.join(D,'app.css')).read(); js=open(os.path.join(D,'app.js')).read()
html=html.replace('<link rel="stylesheet" href="app.css">', '<style>\n'+css+'\n</style>')
tags=[]
for key,fn in [('topo','mo.topo.json'),('meta','meta.json'),('holders','holders.json'),('places','places.json'),('local','local.json'),('about','measures.json'),('offices','offices.json')]:
    tags.append(f'<script id="data-{key}" type="application/json">{open(os.path.join(D,"data",fn)).read()}</script>')
for key,fn in [('results','results.csv'),('judicial','judicial.csv')]:
    tags.append(f'<script id="data-{key}" type="text/csv">'+open(os.path.join(D,'data',fn)).read().replace('</script','</scr"+"ipt')+'</script>')
html=html.replace('<script src="app.js" defer></script>','').replace('d3.min.js" defer>','d3.min.js">').replace('topojson.min.js" defer>','topojson.min.js">')
html=html.replace('</body>', '\n'.join(tags)+'\n<script>\n'+js.replace('</script','<\\/script')+'\n</script>\n</body>')
# absolute site paths -> fallbacks that work anywhere
import base64
site=os.path.join(D,'..')  # the site root, when run from inside the repository
for name in ['bri-wordmark.svg','bri-wordmark-light.svg']:
    p=os.path.join(site,'images',name)
    if os.path.exists(p):
        html=html.replace('src="/images/'+name+'"','src="data:image/svg+xml;base64,'+base64.b64encode(open(p,'rb').read()).decode()+'"')
html=html.replace('href="/images/','href="https://www.briannaimm.com/images/').replace('src="/images/','src="https://www.briannaimm.com/images/').replace('href="/" aria-label','href="https://www.briannaimm.com/" aria-label')
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,'..','missouri-results-standalone.html')
open(out,'w').write(html); print(out, len(html))
