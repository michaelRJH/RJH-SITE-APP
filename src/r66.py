# ===== v66: SharePoint sync =====
rep("function pdfActions(prefix,build,nameFn,statusId,validFn){ const sentHook=","function pdfActions(prefix,build,nameFn,statusId,validFn){ (window.PDF_BUILD_P=window.PDF_BUILD_P||{})[prefix]={build,name:nameFn,valid:validFn}; const sentHook=")
rep("opts.currentId=id; toast('Saved: '+name);","opts.currentId=id; toast('Saved: '+name); if(window.syncEnqueue) syncEnqueue(tool,id);")
t=t.replace("o.currentId=id; }catch(e){} }","o.currentId=id; }catch(e){} } if(window.syncEnqueue) syncEnqueue(typeof tool==='string'?tool:(o===SAVERS.aw?'aw':'rm'),id);")
rep("['home-site','home-client','home-by'].forEach(id=>$(id).addEventListener('input',()=>{ SITE.set({site:$('home-site').value.trim(),client:$('home-client').value.trim(),by:$('home-by').value.trim()}); siteSummary(); }));",
    "['home-site','home-client','home-by'].forEach(id=>$(id).addEventListener('input',()=>{ const o=SITE.get(); const site=$('home-site').value.trim(); if(site!==o.site){ delete o.job; delete o.clientFolder; } SITE.set({...o,site,client:$('home-client').value.trim(),by:$('home-by').value.trim()}); siteSummary(); }));")
rep('''      <p class="note">Set once and every new sheet starts with these filled in. Change them when you move site.</p>''',
    '''      <div class="btnrow" style="margin-top:0"><button class="btn" type="button" id="site-pickbtn">Pick the job from SharePoint</button></div>
      <div id="site-pick" class="fd-side" hidden></div>
      <p class="note">Set once and every new sheet starts with these filled in. Picking the job from SharePoint means every sheet files itself in that job folder.</p>''')
rep('''    <h2>Saved on this phone</h2>''','''    <h2>Sending to the office</h2>
    <div class="fd-side" id="home-sync"><span>Checking…</span></div>
    <p class="note">Every saved sheet goes to SharePoint on its own when the phone has signal: the PDF and the sheet, in the job folder under Site records. Nothing to send by hand.</p>
    <h2>Saved on this phone</h2>''')
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('sync.js',encoding='utf-8').read()+a)
CSS.append('''#home-sync{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;border-left-color:#1E6F3F;margin:0 0 6px;font-size:14px}
#home-sync.warn{border-left-color:var(--hivis)}
#home-sync>span:first-child{flex:1 1 200px}
.sync-btns{display:flex;gap:6px;flex-wrap:wrap}.sync-btns .btn{margin:0;width:auto;padding:10px 12px;font-size:14px}
.pick-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.pick-h .btn{margin:0;width:auto;padding:6px 10px;font-size:13px}
.pick{display:block;width:100%;text-align:left;appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:12px 14px;margin:0 0 6px;font:inherit;font-size:16px;font-weight:700;cursor:pointer}''')

# sheets loaded from a file (a lad without a sign-in sends his to the site manager) go up under the loader's name
rep("if(!h){ await DB.put({...r,loaded:r.date}); n++; continue; }","if(!h){ await DB.put({...r,loaded:r.date}); n++; if(window.syncEnqueue) syncEnqueue(r.tool,r.id); continue; }")
rep("if(newer===r){ await DB.put({...h,...r,loaded:r.date,sends:Math.max(h.sends||0,r.sends||0)}); n++; }","if(newer===r){ await DB.put({...h,...r,loaded:r.date,sends:Math.max(h.sends||0,r.sends||0)}); n++; if(window.syncEnqueue) syncEnqueue(r.tool,r.id); }")

# Save keeps what the record already carries (register row id, synced time) instead of rebuilding it from scratch
rep("let sent=null, sends=0, created=new Date().toISOString(); if(opts.currentId){ try{ const prev=await DB.get(opts.currentId); if(prev){","let sent=null, sends=0, created=new Date().toISOString(), prev=null; if(opts.currentId){ try{ prev=await DB.get(opts.currentId); if(prev){")
rep("try{ await DB.put({id,tool,name,site:opts.site?opts.site():'',date:new Date().toISOString(),created,data,sent,sends}); opts.currentId=id;","try{ await DB.put({...(prev||{}),id,tool,name,site:opts.site?opts.site():'',date:new Date().toISOString(),created,data,sent,sends}); opts.currentId=id;")
