  // ---- v66: sign in with the RJH Microsoft account, and every saved sheet files itself into SharePoint (Client / Job / Site records / Type) ----
  const M365={clientId:'8328bc3e-c40d-4ce6-a988-5c249ceeb2f3',tenantId:'b6700592-fab9-4116-868f-0c02edfef537',
    siteId:'rjhowardengineering.sharepoint.com,a0710b25-f238-4fc9-892e-a7954f243e90,5e1c7c12-7dd6-41f8-9fe8-1d67af7dda3f',   // RJH-Site (site staff + office), never RJH-Internal
    driveId:'',   // RJH-Site Shared Documents, looked up on first sign-in and remembered
    records:'Site records', listId:'2b6a5bfb-cda7-4be0-a119-402ba0dcdd91',   // the Site records register list in RJH-Site
    scopes:'openid profile offline_access User.Read Files.ReadWrite.All Sites.ReadWrite.All'};
  const SYNC_TYPE={dw:'Dayworks',aw:'Extras',rm:'Remedials',mh:'Manhole cards',fd:'Foundations',grad:'Gradient sheets',th:'Trial holes',lv:'Level book',dips:'Road dips',takeoff:'Take-offs'};
  const pdfBuildFor=tool=>{ const P=window.PDF_BUILD_P||{}; const k=Object.keys(P).find(p=>TOOL_OF_PREFIX[p]===tool); return k?P[k]:null; };   // pdfActions registers a builder per prefix
  const b64url=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const AUTH=(()=>{
    const K='rjh-m365'; const redirect=()=>location.origin+location.pathname;
    const get=()=>{ try{ return JSON.parse(localStorage.getItem(K)||'null'); }catch(e){ return null; } };
    const set=t=>{ if(t) localStorage.setItem(K,JSON.stringify(t)); else localStorage.removeItem(K); };
    const base=`https://login.microsoftonline.com/${M365.tenantId}/oauth2/v2.0`;
    async function login(){ if(!crypto.subtle){ toast('Sign in needs https'); return; }
      const v=b64url(crypto.getRandomValues(new Uint8Array(48))); const ch=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))); const st=b64url(crypto.getRandomValues(new Uint8Array(12)));
      sessionStorage.setItem('rjh-pkce',JSON.stringify({v,st,back:location.hash})); try{ (typeof DRAFT_FLUSH!=='undefined'?DRAFT_FLUSH:[]).forEach(f=>{ try{ f(); }catch(e){} }); }catch(e){}
      const q=new URLSearchParams({client_id:M365.clientId,response_type:'code',redirect_uri:redirect(),scope:M365.scopes,code_challenge:ch,code_challenge_method:'S256',state:st,response_mode:'query'});
      if(!get()) q.set('prompt','select_account'); setTimeout(()=>{ location.href=`${base}/authorize?${q}`; },600); }
    async function tokenPost(body){ const r=await fetch(`${base}/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:M365.clientId,...body})}); const j=await r.json(); if(!r.ok) throw new Error(j.error_description||j.error||'token error');
      const cur=get()||{}; let who=cur.who||''; try{ if(j.id_token){ const p=JSON.parse(atob(j.id_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); who=p.name||p.preferred_username||who; cur.upn=p.preferred_username||cur.upn; } }catch(e){}
      set({...cur,access:j.access_token,refresh:j.refresh_token||cur.refresh,exp:Date.now()+(j.expires_in||3600)*1000,who}); return get(); }
    async function finish(){ const u=new URL(location.href); const code=u.searchParams.get('code'), st=u.searchParams.get('state'), err=u.searchParams.get('error'); if(!code&&!err) return false;
      const p=JSON.parse(sessionStorage.getItem('rjh-pkce')||'{}'); sessionStorage.removeItem('rjh-pkce'); history.replaceState(null,'',location.pathname+(p.back||''));
      if(err){ toast('Sign in did not finish: '+(u.searchParams.get('error_description')||err).slice(0,80)); return true; }
      if(st!==p.st||!p.v){ toast('Sign in did not match, try again'); return true; }
      try{ const t=await tokenPost({grant_type:'authorization_code',code,redirect_uri:redirect(),code_verifier:p.v}); toast('Signed in as '+t.who); }catch(e){ toast('Sign in failed: '+e.message.slice(0,80)); } return true; }
    async function token(){ const t=get(); if(!t) return null; if(t.exp-60000>Date.now()) return t.access; if(!t.refresh) return null; if(!navigator.onLine) return null;
      try{ return (await tokenPost({grant_type:'refresh_token',refresh_token:t.refresh,scope:M365.scopes})).access; }catch(e){ if(/invalid_grant|interaction_required|expired/i.test(e.message)){ set({who:t.who,upn:t.upn,needLogin:true}); } return null; } }
    return {login,finish,token,get,signOut:()=>set(null),who:()=>(get()||{}).who||'',needLogin:()=>{ const t=get(); return !t||t.needLogin||(!t.refresh&&t.exp<Date.now()); }}; })();
  async function graph(path,opt={}){ const tk=await AUTH.token(); if(!tk) throw new Error('not signed in'); const h={Authorization:'Bearer '+tk,...(opt.headers||{})}; if(opt.json){ h['Content-Type']='application/json'; opt.body=JSON.stringify(opt.json); }
    const r=await fetch(path.startsWith('http')?path:'https://graph.microsoft.com/v1.0'+path,{method:opt.method||'GET',headers:h,body:opt.body}); if(r.status===204) return null; const j=await r.json().catch(()=>({})); if(!r.ok){ const e=new Error((j.error&&j.error.message)||('HTTP '+r.status)); e.status=r.status; e.code=j.error&&j.error.code; throw e; } return j; }
  const gpath=p=>p.split('/').map(encodeURIComponent).join('/');
  async function driveId(){ if(M365.driveId) return M365.driveId; const c=localStorage.getItem('rjh-m365-drive'); if(c){ M365.driveId=c; return c; } const d=await graph(`/sites/${M365.siteId}/drive?$select=id`); M365.driveId=d.id; localStorage.setItem('rjh-m365-drive',d.id); return d.id; }
  // ---- the queue: what still has to go up. Its own little database so the main one is untouched ----
  const SQ=(()=>{ let dbp=null; const open=()=>dbp||(dbp=new Promise((res,rej)=>{ const r=indexedDB.open('rjh-sync',1); r.onupgradeneeded=()=>{ r.result.createObjectStore('q',{keyPath:'id'}); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }));
    const tx=async(mode,fn)=>{ const d=await open(); return new Promise((res,rej)=>{ const t=d.transaction('q',mode); const q=fn(t.objectStore('q')); t.oncomplete=()=>res(q&&q.result); t.onerror=()=>rej(t.error); }); };
    return {all:()=>tx('readonly',s=>s.getAll()),put:r=>tx('readwrite',s=>s.put(r)),del:id=>tx('readwrite',s=>s.delete(id))}; })();
  const SITEMAP={get:()=>{ try{ return JSON.parse(localStorage.getItem('rjh-sitemap')||'{}'); }catch(e){ return {}; } }, set:m=>localStorage.setItem('rjh-sitemap',JSON.stringify(m)),
    folderFor(site){ const s=SITE.get(); if(s.job&&(!site||site===s.site)) return {client:s.clientFolder||s.client||'',job:s.job}; const m=this.get()[(site||'').trim().toLowerCase()]; return m||null; } };
  const safeName=s=>String(s||'').replace(/[\\/:*?"<>|#%]/g,'-').replace(/\s+/g,' ').trim().slice(0,120);
  async function syncEnqueue(tool,id){ const rec=await DB.get(id); if(!rec) return; const b=pdfBuildFor(tool); let pdf=null, pname='';
    const o=SAVERS[tool]; const onScreen=o&&o.currentId===id;
    if(b&&o){ let snap=null, snapId=null; try{ if(!onScreen){ snap=o.get(); snapId=o.currentId; o.set(rec.data); o.currentId=id; await new Promise(r=>setTimeout(r,250)); }
        if(b.valid()&&window.jspdf){ const r=await b.build(); pdf=r instanceof Blob?r:r.output('blob'); pname=b.name(); } }catch(e){ console.warn('pdf for sync',e); }
      finally{ if(snap){ try{ o.set(snap); o.currentId=snapId; }catch(e){} } } }
    const day=(rec.date||new Date().toISOString()).slice(0,10); const stem=safeName(`${(rec.name||TOOLNAMES[tool]).replace(/ · /g,' - ')} ${day}`);
    const files=[{name:stem+'.rjhsheet.json',blob:new Blob([JSON.stringify({rjhSheets:1,exported:new Date().toISOString(),sheets:[rec]})],{type:'application/json'})}];
    if(pdf) files.unshift({name:stem+'.pdf',blob:pdf});
    const old=(await SQ.all()).find(q=>q.sheetId===id); await SQ.put({id:old?old.id:'q-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),sheetId:id,tool,name:rec.name,site:rec.site||'',by:AUTH.who(),type:SYNC_TYPE[tool]||tool,files,created:new Date().toISOString(),tries:0,err:''});
    syncStatus(); syncRun(); }
  const SYNC_FOLDERS=new Set();
  async function ensureFolder(path){ if(SYNC_FOLDERS.has(path)) return; const parts=path.split('/'); let cur='';
    for(const p of parts){ const next=cur?cur+'/'+p:p; if(!SYNC_FOLDERS.has(next)){ try{ await graph(`/drives/${await driveId()}/root:/${gpath(next)}`); }catch(e){ if(e.status!==404) throw e; await graph(cur?`/drives/${await driveId()}/root:/${gpath(cur)}:/children`:`/drives/${await driveId()}/root/children`,{method:'POST',json:{name:p,folder:{},'@microsoft.graph.conflictBehavior':'fail'}}).catch(e2=>{ if(e2.status!==409) throw e2; }); } SYNC_FOLDERS.add(next); } cur=next; } }
  async function uploadFile(path,blob){ const url=`/drives/${await driveId()}/root:/${gpath(path)}:/`;
    if(blob.size<3800000) return graph(url+'content?@microsoft.graph.conflictBehavior=replace',{method:'PUT',headers:{'Content-Type':blob.type||'application/octet-stream'},body:blob});
    const s=await graph(url+'createUploadSession',{method:'POST',json:{item:{'@microsoft.graph.conflictBehavior':'replace'}}}); const CH=5*1024*1024; let last=null;
    for(let off=0;off<blob.size;off+=CH){ const end=Math.min(off+CH,blob.size); const r=await fetch(s.uploadUrl,{method:'PUT',headers:{'Content-Range':`bytes ${off}-${end-1}/${blob.size}`},body:blob.slice(off,end)}); if(!r.ok&&r.status!==202) throw new Error('upload '+r.status); last=r.status===202?null:await r.json(); } return last; }
  let syncBusy=false;
  async function syncRun(){ if(syncBusy||!navigator.onLine) return; const q=(await SQ.all()).filter(x=>!x.done); if(!q.length){ syncStatus(); return; } if(!(await AUTH.token())){ syncStatus(); return; } syncBusy=true; let sent=0;
    try{ for(const it of q){ try{ const f=SITEMAP.folderFor(it.site); const base=f?`${f.client?f.client+'/':''}${f.job}/${M365.records}/${it.type}`:`${M365.records} (unfiled)/${safeName(it.site)||'No site'}/${it.type}`;
          await ensureFolder(base); let web=''; for(const file of it.files){ const r=await uploadFile(base+'/'+file.name,file.blob); if(r&&r.webUrl&&/\.pdf$/i.test(file.name)) web=r.webUrl; }
          let rec=null; try{ rec=await DB.get(it.sheetId); }catch(e){}
          if(M365.listId){ try{ const fields={Title:it.name,Site:it.site,Type:it.type,By:it.by,SheetDate:it.created,SheetId:it.sheetId,...(web?{Link:{Url:web,Description:'PDF'}}:{})};
              if(rec&&!rec.listItemId){ try{ const q=await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items?$filter=fields/SheetId eq '${encodeURIComponent(it.sheetId).replace(/'/g,"''")}'&$select=id&$top=1`,{headers:{Prefer:'HonorNonIndexedQueriesWarningMayFailRandomly'}}); if(q.value&&q.value[0]) rec.listItemId=q.value[0].id; }catch(e){} }
              if(rec&&rec.listItemId){ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${rec.listItemId}/fields`,{method:'PATCH',json:fields}); }
              else { const r=await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items`,{method:'POST',json:{fields:{...fields,Status:'New'}}}); if(rec&&r&&r.id) rec.listItemId=r.id; } }catch(e){ console.warn('register',e); } }
          try{ if(rec){ rec.synced=new Date().toISOString(); rec.syncPath=base; if(web) rec.webUrl=web; await DB.put(rec); } }catch(e){}
          await SQ.del(it.id); sent++; }
        catch(e){ it.tries=(it.tries||0)+1; it.err=(e.message||String(e)).slice(0,120); await SQ.put(it); if(e.message==='not signed in') break; } } }
    finally{ syncBusy=false; syncStatus(); if(sent) toast(sent===1?'1 sheet filed in SharePoint':sent+' sheets filed in SharePoint'); } }
  async function syncStatus(){ const box=$('home-sync'); if(!box) return; const q=(await SQ.all()).filter(x=>!x.done); const who=AUTH.who(); const need=AUTH.needLogin(); const bad=q.filter(x=>x.err);
    let line; if(!who) line='Not signed in. Sheets stay on this phone until you sign in.'; else if(need) line=`Signed in as ${who}, but Microsoft wants you to sign in again.`; else line=`Signed in as ${who}.`;
    const qs=q.length?` <b>${q.length} sheet${q.length>1?'s':''} waiting to send</b>${navigator.onLine?'':' (no signal)'}${bad.length?`. Last problem: ${bad[0].err}`:''}`:(who&&!need?' <b>All sent.</b>':'');
    box.innerHTML=`<span>${line}${qs}</span><span class="sync-btns">${!who||need?'<button type="button" class="btn primary" id="sync-login">Sign in with RJH email</button>':`${q.length?'<button type="button" class="btn primary" id="sync-now">Send now</button>':''}<button type="button" class="btn" id="sync-out">Sign out</button>`}</span>`;
    const li=$('sync-login'); if(li) li.addEventListener('click',()=>AUTH.login()); const sn=$('sync-now'); if(sn) sn.addEventListener('click',()=>{ syncRun(); toast('Sending'); }); const so=$('sync-out'); if(so) so.addEventListener('click',()=>{ if(confirm('Sign out? Sheets will stay on this phone until someone signs in again.')){ AUTH.signOut(); syncStatus(); } });
    box.classList.toggle('warn',!!(q.length||!who||need)); }
  // ---- the site picker: clients and jobs are the folders in Shared Documents ----
  async function listFolders(path){ const r=await graph(path?`/drives/${await driveId()}/root:/${gpath(path)}:/children?$select=name,folder&$top=200`:`/drives/${await driveId()}/root/children?$select=name,folder&$top=200`); return (r.value||[]).filter(x=>x.folder&&!/^_|^Forms$/.test(x.name)).map(x=>x.name).sort((a,b)=>a.localeCompare(b)); }
  async function sitePick(){ const box=$('site-pick'); if(!box) return; if(!(await AUTH.token())){ toast('Sign in first (bottom of the home screen)'); return; } box.hidden=false; box.innerHTML='<p class="note">Loading clients from SharePoint…</p>';
    let clients; try{ clients=await listFolders(''); }catch(e){ box.innerHTML='<p class="note">Could not read SharePoint: '+(e.message||e)+'</p>'; return; }
    const show=(title,items,onpick,back)=>{ box.innerHTML=`<div class="pick-h"><b>${title}</b>${back?'<button type="button" class="btn" id="pick-back">Back</button>':''}</div>`+items.map(n=>`<button type="button" class="pick" data-n="${n.replace(/"/g,'&quot;')}">${n}</button>`).join('')+'<button type="button" class="btn" id="pick-x" style="margin-top:8px">Cancel</button>';
      box.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>onpick(b.dataset.n))); $('pick-x').addEventListener('click',()=>{ box.hidden=true; }); const bk=$('pick-back'); if(bk) bk.addEventListener('click',back); };
    const newJob=()=>{ const client=prompt('Client (as the folder should be called), e.g. Strata Homes'); if(!client) return; const job=prompt('Job (as the folder should be called), e.g. Expression'); if(!job) return; pick(client.trim(),job.trim()); };
    const step1=()=>show('Client',clients.concat(['+ New client or job']),async client=>{ if(client==='+ New client or job'){ newJob(); return; } box.innerHTML='<p class="note">Loading jobs…</p>'; let jobs=[]; try{ jobs=await listFolders(client); }catch(e){} if(!jobs.length){ pick(client,''); return; }
      show(client,jobs,job=>pick(client,job),step1); });
    const pick=(client,job)=>{ const s=SITE.get(); const site=job||client; Object.assign(s,{site,client:client.replace(/ Homes?$| Ltd$/i,''),clientFolder:client,job}); SITE.set(s); $('home-site').value=site; $('home-client').value=s.client; siteSummary(); const m=SITEMAP.get(); m[site.toLowerCase()]={client,job}; SITEMAP.set(m); box.hidden=true; toast('Site set: '+site); };
    step1(); }
  (function(){ const pb=$('site-pickbtn'); if(pb) pb.addEventListener('click',sitePick); })();
  // ---- wire up ----
  AUTH.finish().then(()=>{ syncStatus(); syncRun(); });
  window.addEventListener('online',()=>syncRun()); setInterval(()=>{ if(navigator.onLine) syncRun(); },5*60*1000); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) syncRun(); });
  window.syncEnqueue=syncEnqueue; window.syncStatus=syncStatus; window.syncRun=syncRun; window.AUTH=AUTH; window.SQ=SQ; window.graph=graph; window.M365=M365;
