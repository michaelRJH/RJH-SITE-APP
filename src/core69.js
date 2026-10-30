  // ---- v69: numbering, who is office, today's sheets, clear this phone ----
  // the next DW / AW number for this job, put in the sheet's ref box if it is empty
  async function REFFILL(tool){ const ids={dw:'dw-ref',aw:'aw-ref'}; const id=ids[tool]; if(!id||!$(id)) return; if($(id).value.trim()) return; const o=SAVERS[tool]; if(o&&o.currentId) return;
    const s=SITE.get(); const job=s.job||($(tool+'-site')?$(tool+'-site').value.trim():''); const ref=await nextRef(tool,job);
    // the filing may have borrowed the form to print the sheet just saved: wait for it to hand the form back, then only fill a box that is still empty on a new sheet
    for(let i=0;window.SYNC_SWAP&&i<100;i++) await new Promise(r=>setTimeout(r,100)); if($(id).value.trim()||(o&&o.currentId)) return;
    $(id).value=ref; if(SAVERS[tool]&&SAVERS[tool]._strip) SAVERS[tool]._strip(); }
  window.REFFILL=REFFILL;
  // office people see Office and Job set-up; everyone else sees the site screens only.
  // The list lives in RJH-Site _app/settings.json (office: emails or names), with these names until that file says otherwise.
  const OFFICE={names:['michael howard','martin grainger','steven gilmartin','liam barrett','richard howard'],
    get(){ try{ return JSON.parse(localStorage.getItem('rjh-office')||'null'); }catch(e){ return null; } },
    is(){ const t=AUTH.get(); if(!t||!t.who) return false; const who=String(t.who).toLowerCase(), upn=String(t.upn||'').toLowerCase(); const list=((this.get()||{}).office||this.names).map(x=>String(x).toLowerCase().trim());
      return list.includes(upn)||list.includes(who)||list.some(n=>n&&who.startsWith(n)); },
    async load(){ try{ const it=await itemAt(`${M365.app}/settings.json`); if(it&&it['@microsoft.graph.downloadUrl']){ const j=await (await fetch(it['@microsoft.graph.downloadUrl'])).json(); localStorage.setItem('rjh-office',JSON.stringify(j)); } }catch(e){} applyRole(); } };
  function applyRole(){ const on=OFFICE.is(); document.querySelectorAll('[data-office]').forEach(e=>e.hidden=!on); document.body.classList.toggle('is-office',on); }
  window.OFFICE=OFFICE; window.applyRole=applyRole;
  // today's sheets on this job, with where each one is up to
  async function homeToday(){ const box=$('home-today'); if(!box) return; let all=[], Q=[]; try{ all=await DB.all(); Q=await SQ.all(); }catch(e){ return; }
    const s=SITE.get(); const day=new Date().toDateString(); const job=String(s.job||s.site||'').toLowerCase();
    const mine=all.filter(r=>r.tool!=='draft'&&SAVERS[r.tool]&&new Date(r.date).toDateString()===day&&(!job||String(r.job||r.site||'').toLowerCase()===job)).sort((a,b)=>b.date.localeCompare(a.date));
    const waiting=all.filter(r=>r.tool!=='draft'&&SAVERS[r.tool]&&new Date(r.date).toDateString()!==day&&['wait','problem'].includes(recState(r,Q).k));
    if(!mine.length&&!waiting.length){ box.innerHTML=''; box.hidden=true; return; } box.hidden=false;
    const row=r=>{ const st=recState(r,Q); return `<button type="button" class="today-row" data-id="${sEsc(r.id)}"><b>${sEsc(r.name)}</b><span class="rstate" data-k="${st.k}">${sEsc(st.t)}</span></button>`; };
    box.innerHTML=(mine.length?`<h3>Today${s.job?' on '+sEsc(s.job):''}</h3>`+mine.map(row).join(''):'')+(waiting.length?`<h3>Not in the office yet</h3>`+waiting.map(row).join(''):'');
    box.querySelectorAll('.today-row').forEach(b=>b.addEventListener('click',async()=>{ const r=all.find(x=>x.id===b.dataset.id); const o=r&&SAVERS[r.tool]; if(!o) return; if(o.currentId!==r.id){ try{ await saveQuiet(r.tool); }catch(e){} o.set(r.data); o.currentId=r.id; o.rev=r.rev||0; } go(o.section); syncStatus(); })); }
  window.homeToday=homeToday;
  // clear this phone: for a phone handed to someone else, or a leaver. Refuses while sheets have not reached the office.
  async function clearPhone(){ let Q=[]; try{ Q=await SQ.all(); }catch(e){} let unsent=0; try{ unsent=(await DB.all()).filter(r=>r.tool!=='draft'&&SAVERS[r.tool]&&!(TYPES[r.tool]||{}).local&&!(r.synced&&r.synced>=r.date)).length; }catch(e){}
    if(Q.length||unsent){ alert(`${Math.max(Q.length,unsent)} sheet${Math.max(Q.length,unsent)>1?'s have':' has'} not reached the office yet. Get signal and let ${Math.max(Q.length,unsent)>1?'them':'it'} go first, or back up to a file.`); return; }
    if(!confirm('Clear this phone? Every sheet, draft, job and the sign-in are taken off it. Sheets already in the office stay there.')) return;
    if(!confirm('Sure? This cannot be undone on this phone.')) return;
    try{ AUTH.signOut(); }catch(e){} try{ localStorage.clear(); sessionStorage.clear(); }catch(e){}
    const del=n=>new Promise(r=>{ const q=indexedDB.deleteDatabase(n); q.onsuccess=q.onerror=q.onblocked=()=>r(); });
    await del('rjh-site-app'); await del('rjh-sync'); try{ const ks=await caches.keys(); await Promise.all(ks.filter(k=>k!=='rjh-site-app-'+((document.getElementById('ver')||{}).textContent||'').trim()).map(k=>caches.delete(k))); }catch(e){}
    alert('This phone is cleared.'); location.href=location.pathname; }
  window.clearPhone=clearPhone;
  (function(){ const p=$('sync-pill'); if(p) p.addEventListener('click',()=>go('panel-home'));
    const c=$('home-clear'); if(c) c.addEventListener('click',clearPhone);
    const so=$('home-signout'); if(so) so.addEventListener('click',()=>{ if(confirm('Sign out? Sheets saved on this phone wait here until someone signs in again.')){ AUTH.signOut(); syncStatus(); applyRole(); } });
    applyRole(); if(AUTH.who()&&navigator.onLine) setTimeout(()=>OFFICE.load(),1500);
    document.querySelectorAll('[data-go="panel-dw"],[data-go="panel-aw"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>REFFILL(b.dataset.go==='panel-dw'?'dw':'aw'),60)));
    setTimeout(homeToday,1000); })();
  // the register for the current job: numbering, and the progress lists in the tools
  window.onFiled=async()=>{ const s=SITE.get(); if(s.job&&navigator.onLine){ try{ await JOBREG.load(s.job); }catch(e){} } };
  (async()=>{ const s=SITE.get(); if(s.job&&navigator.onLine&&AUTH.who()){ setTimeout(async()=>{ try{ await JOBREG.load(s.job); }catch(e){} },2500); } })();
