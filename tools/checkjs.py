# every inline script in index.html must parse, or the build stops
import re, subprocess, sys, tempfile, os
h=open(sys.argv[1],encoding='utf-8').read()
bad=0
for i,m in enumerate(re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',h,re.S)):
    js=m.group(1)
    if not js.strip(): continue
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as f: f.write(js); p=f.name
    r=subprocess.run(['node','--check',p],capture_output=True,text=True); os.unlink(p)
    if r.returncode: bad+=1; print('script',i,'does not parse:',r.stderr.strip().splitlines()[-1] if r.stderr else '')
sys.exit(1 if bad else 0)
