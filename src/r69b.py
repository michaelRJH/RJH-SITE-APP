# ===== v69 part 2: header pill, core69, numbering =====
rep('<div class="sub"><h1>Site Calculator</h1><small id="ver">','<div class="sub"><h1>RJH Site</h1><button type="button" id="sync-pill" hidden></button><small id="ver">')
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('core69.js',encoding='utf-8').read()+a)
# extras number from the job, not from this phone only
rep("""  async function awNextRef(){ if($('aw-ref').value.trim()) return; const site=$('aw-site').value.trim().toLowerCase(); let mx=0;
    try{ (await DB.all()).filter(r=>r.tool==='aw'&&String(r.site||'').toLowerCase()===site).forEach(r=>{ const m=String(((r.data||{}).f||[])[4]||'').match(/(\\d+)/); if(m) mx=Math.max(mx,+m[1]); }); }catch(e){}
    $('aw-ref').value='AW-'+String(mx+1).padStart(3,'0'); }""",
    """  async function awNextRef(){ if($('aw-ref').value.trim()) return; const s=SITE.get(); $('aw-ref').value=await nextRef('aw',s.job||$('aw-site').value.trim()); }""")
CSS.append('''#sync-pill{appearance:none;border:2px solid var(--ink);border-radius:99px;background:#fff;font:inherit;font-size:12px;font-weight:700;padding:4px 10px;cursor:pointer;white-space:nowrap}
#sync-pill[data-k=ok]{background:#1E6F3F;border-color:#1E6F3F;color:#fff}
#sync-pill[data-k=wait]{background:var(--hivis);border-color:var(--hivis)}
#sync-pill[data-k=bad]{background:#B3261E;border-color:#B3261E;color:#fff}
#sync-pill[data-k=off]{background:#eee;color:var(--ink-2);border-color:#ccc}
header .sub{display:flex;align-items:center;gap:8px;flex-wrap:wrap}header .sub small{margin-left:auto}
.s-state[data-k=filed],.rstate[data-k=filed]{color:#1E6F3F;font-weight:700}
.s-state[data-k=wait],.rstate[data-k=wait]{color:#8a5a00;font-weight:700}
.s-state[data-k=problem],.rstate[data-k=problem]{color:#B3261E;font-weight:700}
.rstate{display:block;font-size:12px;margin-top:2px}
.saverow .retry{appearance:none;border:2px solid #B3261E;background:#fff;color:#B3261E;border-radius:var(--r);font:inherit;font-size:13px;font-weight:700;padding:6px 8px;cursor:pointer}
.savelist .passon{margin:0 0 8px;font-size:14px;padding:10px}
#home-sync small{display:block;font-size:12px;color:var(--ink-2);margin-top:2px}
#home-sync[data-k=ok]{border-left-color:#1E6F3F}#home-sync[data-k=wait],#home-sync[data-k=warn]{border-left-color:var(--hivis)}
#home-today{margin:0 0 10px}#home-today h3{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2);margin:8px 0 4px}
.today-row{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;text-align:left;appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);padding:10px 12px;margin:0 0 6px;font:inherit;font-size:15px;cursor:pointer}
.today-row .rstate{margin:0;text-align:right}''')
