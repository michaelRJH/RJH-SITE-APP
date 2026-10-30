# Builds the app (index.html) from v50base.html plus every later round of changes.
# Run from this folder:  python3 splice52.py   (or ../build.sh from the repo root)
import os
s=open('v50base.html',encoding='utf-8').read()
drg='[]'   # house types and drawings now come from each job's pack in SharePoint, never from this public repo
js=(open('drg3.js').read()+open('wl.js').read()).replace('/*DRG_DEFAULT*/[]',drg)
a='<div class="field"><label for="fd-plot">Plot</label><div class="in"><input id="fd-plot" type="text" placeholder="12"></div></div>'
assert s.count(a)==1; s=s.replace(a,a+'\n      <div class="fd-side" id="fd-drgbox" hidden style="grid-column:1/-1"></div>')
a="  PANELS.forEach(pnl=>{ const txt=HELP[pnl.id]; if(!txt) return;"; assert s.count(a)==1; s=s.replace(a,js+'\n'+a)
VER=open('VERSION').read().strip()
assert s.count('<small id="ver">v50 · offline</small>')==1; s=s.replace('<small id="ver">v50 · offline</small>','<small id="ver">'+VER+'</small>')
t=s
b='<div id="fd-side" class="fd-side" hidden>'
assert t.count(b)==1; t=t.replace(b,'<div id="fd-wl" class="fd-side" hidden></div>\n    '+b)
exec(open('rounds.py',encoding='utf-8').read())
open('v52.html','w',encoding='utf-8').write(t)
print('built',VER,len(t))
