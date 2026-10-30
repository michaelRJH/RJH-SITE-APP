# ===== v63: home screen, safer saving and restore =====
upd='''    <div class="fd-side" id="home-update" hidden style="border-left-color:var(--hivis)"><b>A new version is ready.</b> <button class="btn primary" type="button" id="home-update-go" style="margin-top:8px">Update now</button></div>\n'''
rep(upd,'')
nudge='''    <div class="fd-side" id="home-nudge" hidden><b>Back up your sheets.</b> <span></span> <button class="btn primary" type="button" id="home-nudge-go" style="margin-top:8px">Back up now</button></div>\n'''
rep('''    <details class="sitebox" id="sitebox">''',upd+nudge+'''    <details class="sitebox" id="sitebox">''')
rep('''    <details class="sitebox" id="ratesbox">''','''    <div id="home-carry" hidden></div>\n    <details class="sitebox" id="ratesbox">''')
rep('<summary><span>Rates every tool uses</span>','<summary><span>Densities, loads and waste</span>')
i=t.index('    <h2>Records</h2>'); j=t.index('    </div>\n',i)+len('    </div>\n'); rec=t[i:j]; t=t[:i]+t[j:]
rep('    <h2>Quantities</h2>',rec+'    <h2>Quantities</h2>')
CSS.append('''.carry{display:block;width:100%;text-align:left;appearance:none;border:2px solid var(--ink);background:#fff;color:var(--ink);border-radius:var(--r);padding:12px 14px;margin:0 0 8px;font:inherit;cursor:pointer}
.carry b{display:block;font-size:17px;font-weight:800;text-transform:uppercase;letter-spacing:.3px}
.carry span{display:block;font-size:14px;color:var(--ink-2);margin-top:2px}
#home-carry h2{margin-top:14px}
#home-nudge{border-left-color:var(--hivis);margin:10px 0;font-size:14px}''')

js=r'''  // ---- v63: carry on where you left off, back-up nudge, quiet save ----
  const esc63=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const hasStuff=(tool,d)=>{ try{ const o=SAVERS[tool]; return !!(o&&d&&(o.hasContent?o.hasContent(d):true)); }catch(e){ return false; } };
  async function saveQuiet(tool){ const o=SAVERS[tool]; if(!o) return false; let data; try{ data=o.get(); }catch(e){ return false; } if(!hasStuff(tool,data)) return false;
    let prev=null; if(o.currentId){ try{ prev=await DB.get(o.currentId); }catch(e){} }
    if(prev&&JSON.stringify(prev.data)===JSON.stringify(data)) return false;
    const id=o.currentId||(tool+'-'+Date.now()); const now=new Date().toISOString();
    await DB.put({...(prev||{}),id,tool,name:o.name()||TOOLNAMES[tool],site:o.site?o.site():'',date:now,created:(prev&&prev.created)||now,data,sent:prev?prev.sent||null:null,sends:prev?prev.sends||0:0});
    o.currentId=id; return true; }
  const ago=d=>{ const x=new Date(d), n=new Date(); const hm=x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); if(x.toDateString()===n.toDateString()) return 'today '+hm; if(new Date(n-864e5).toDateString()===x.toDateString()) return 'yesterday '+hm; return x.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); };
  async function homeRefresh(){ let all=[]; try{ all=await DB.all(); }catch(e){ return; }
    const box=$('home-carry'); const drafts=all.filter(r=>r.tool==='draft'&&r.data&&SAVERS[r.name]&&hasStuff(r.name,r.data.data)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
    box.innerHTML=drafts.length?'<h2>Carry on</h2>':'';
    drafts.forEach(r=>{ const tool=r.name, o=SAVERS[tool]; let nm=''; try{ nm=o.name()||''; const tn=(TOOLNAMES[tool]||'')+' · '; if(nm.startsWith(tn)) nm=nm.slice(tn.length); }catch(e){} const b=document.createElement('button'); b.type='button'; b.className='carry';
      b.innerHTML=`<b>${esc63(TOOLNAMES[tool]||tool)}</b><span>${esc63(nm||'Not named yet')} · ${ago(r.date)}</span>`; b.addEventListener('click',()=>go(o.section)); box.appendChild(b); });
    box.hidden=!drafts.length;
    const saved=all.filter(r=>r.tool!=='draft'&&SAVERS[r.tool]); const last=localStorage.getItem('rjh-backup'); const old=!last||(Date.now()-new Date(last))>7*864e5;
    const newer=last?saved.filter(r=>r.date>last).length:saved.length; const nd=$('home-nudge');
    if(saved.length&&old&&newer){ nd.querySelector('span').textContent=`${newer} sheet${newer>1?'s are':' is'} only on this phone${last?' (last backed up '+ago(last)+')':''}. If the phone is lost or broken, ${newer>1?'they are':'it is'} gone. Back up, then send the file to yourself.`; nd.hidden=false; } else nd.hidden=true; }
  window.homeRefresh=homeRefresh;
  $('home-nudge-go').addEventListener('click',()=>$('home-backup').click());
  window.addEventListener('popstate',()=>setTimeout(()=>{ if(!$('panel-home').hidden) homeRefresh(); },50));
  setTimeout(homeRefresh,900);
'''
rep("\n  // ---- this site (set once on the home screen) ----","\n"+js+"  // ---- this site (set once on the home screen) ----")
rep("function go(id){ PANELS.forEach(p=>p.hidden=p.id!==id);","function go(id){ PANELS.forEach(p=>p.hidden=p.id!==id); if(id==='panel-home'&&window.homeRefresh) window.homeRefresh();")
# back-up includes unsaved work
rep("const all=(await DB.all()).filter(r=>r.tool!=='draft');","const every=await DB.all(); const byId={}; every.forEach(r=>byId[r.id]=r); const all=every.filter(r=>r.tool!=='draft'||(r.data&&SAVERS[r.name]&&hasStuff(r.name,r.data.data)&&!(r.data.id&&byId[r.data.id]&&JSON.stringify(byId[r.data.id].data)===JSON.stringify(r.data.data))));")
rep("if(ok) localStorage.setItem('rjh-backup',new Date().toISOString()); backupNote(); });","if(ok) localStorage.setItem('rjh-backup',new Date().toISOString()); backupNote(); homeRefresh(); });")
# restore: never lose either copy
old_loop="""      for(const r of list){ if(!r||!r.data||!r.tool||!r.id) continue; if(r.tool==='draft') continue; const h=have.find(x=>x.id===r.id); if(h&&h.date>=r.date){ skipped++; continue; } await DB.put({...h,...r,sends:Math.max((h&&h.sends)||0,r.sends||0)}); n++; }
      toast(`Loaded ${n} sheet${n===1?'':'s'}${skipped?', '+skipped+' already up to date':''}`); }"""
new_loop="""      let kept=0;
      for(const r of list){ if(!r||!r.data||!r.tool||!r.id) continue;
        if(r.tool==='draft'){ const tool=r.name; if(!SAVERS[tool]||!hasStuff(tool,r.data.data)) continue; const id='fromdraft-'+tool+'-'+Date.parse(r.date); if(have.find(x=>x.id===id)){ skipped++; continue; }
          await DB.put({id,tool,name:(TOOLNAMES[tool]||tool)+' (unsaved work from backup)',site:'',date:r.date,created:r.date,data:r.data.data,sent:null,sends:0,loaded:r.date}); n++; continue; }
        const h=have.find(x=>x.id===r.id);
        if(!h){ await DB.put({...r,loaded:r.date}); n++; continue; }
        if(JSON.stringify(h.data)===JSON.stringify(r.data)){ skipped++; continue; }
        const mark=[h.sent,h.loaded].filter(Boolean).sort().pop()||''; const localEdited=!mark||Date.parse(h.date)>Date.parse(mark)+2000;
        const newer=r.date>h.date?r:h, older=newer===r?h:r;
        if(localEdited){ const cid=older.id+'~'+Date.parse(older.date); if(!have.find(x=>x.id===cid)){ await DB.put({...older,id:cid,name:older.name+' (older copy '+new Date(older.date).toLocaleDateString('en-GB')+')'}); kept++; } }
        if(newer===r){ await DB.put({...h,...r,loaded:r.date,sends:Math.max(h.sends||0,r.sends||0)}); n++; } else if(!localEdited) skipped++; }
      toast(`Loaded ${n} sheet${n===1?'':'s'}${kept?`, ${kept} older version${kept>1?'s':''} kept as a copy`:''}${skipped?', '+skipped+' already up to date':''}`); homeRefresh(); }"""
rep(old_loop,new_loop)
# opening a saved sheet never throws away what is on the form
rep("""row.querySelector('.open').addEventListener('click',()=>{ const o=SAVERS[r.tool]; if(!o) return; o.set(r.data); o.currentId=r.id; o.sends=r.sends||0; list.hidden=true; if(tool==='all') go(o.section); const st=$(o.section).querySelector('.s-state'); if(st) st.textContent=r.sent?'PDF sent':'opened'; toast('Opened '+r.name); });""",
"""row.querySelector('.open').addEventListener('click',async()=>{ const o=SAVERS[r.tool]; if(!o) return; list.hidden=true; if(o.currentId===r.id){ if(tool==='all') go(o.section); toast(r.name+' is already open'); return; }
          let first=false; try{ first=await saveQuiet(r.tool); }catch(e){} o.set(r.data); o.currentId=r.id; o.sends=r.sends||0; if(tool==='all') go(o.section); const st=$(o.section).querySelector('.s-state'); if(st) st.textContent=r.sent?'PDF sent':'opened'; toast('Opened '+r.name+(first?'. The sheet you had open was saved first':'')); });""")
