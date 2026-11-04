"""Bundle index.html + app.css + app.js + data/ into one self-contained HTML file (for sharing as a single page)."""
import json, os, sys
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html=open(os.path.join(D,'index.html')).read()
css=open(os.path.join(D,'app.css')).read(); js=open(os.path.join(D,'app.js')).read()
html=html.replace('<link rel="stylesheet" href="app.css">', '<style>\n'+css+'\n</style>')
tags=[]
for key,fn in [('topo','mo.topo.json'),('meta','meta.json'),('holders','holders.json'),('places','places.json'),('local','local.json'),('about','measures.json')]:
    tags.append(f'<script id="data-{key}" type="application/json">{open(os.path.join(D,"data",fn)).read()}</script>')
tags.append('<script id="data-results" type="text/csv">'+open(os.path.join(D,'data','results.csv')).read().replace('</script','</scr"+"ipt')+'</script>')
html=html.replace('<script src="app.js" defer></script>','')
html=html.replace('</body>', '\n'.join(tags)+'\n<script>\n'+js.replace('</script','<\\/script')+'\n</script>\n</body>')
# absolute site paths -> fallbacks that work anywhere
html=html.replace('href="/images/','href="https://www.briannaimm.com/images/').replace('src="/images/','src="https://www.briannaimm.com/images/').replace('href="/" aria-label','href="https://www.briannaimm.com/" aria-label')
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,'..','missouri-results-standalone.html')
open(out,'w').write(html); print(out, len(html))
