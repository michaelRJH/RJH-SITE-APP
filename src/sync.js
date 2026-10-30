  // ---- Filing (v66, rebuilt v69): sign in with the RJH Microsoft account and every saved sheet files itself into RJH-Site ----
  //   Client / Job / Site records / <Type> / <file>.pdf      what people open
  //   Client / Job / _app / sheets / <file>.json             what the app opens (hidden from people)
  //   one file per sheet: a re-save replaces it, a renamed sheet moves it
  const M365={clientId:'8328bc3e-c40d-4ce6-a988-5c249ceeb2f3',tenantId:'b6700592-fab9-4116-868f-0c02edfef537',
    siteId:'rjhowardengineering.sharepoint.com,a0710b25-f238-4fc9-892e-a7954f243e90,5e1c7c12-7dd6-41f8-9fe8-1d67af7dda3f',   // RJH-Site (site staff + office), never RJH-Internal
    driveId:'',   // RJH-Site Shared Documents, looked up on first sign-in and remembered
    records:'Site records', app:'_app', listId:'2b6a5bfb-cda7-4be0-a119-402ba0dcdd91',   // the Site records register list in RJH-Site
    scopes:'openid profile offline_access User.Read Files.ReadWrite.All Sites.ReadWrite.All'};
  // one name per type: the tile, the folder, the register and the file name all come from here
  const TYPES={dw:{name:'Dayworks',folder:'Dayworks',code:'DW',num:true},aw:{name:'Extras',folder:'Extras',code:'AW',num:true},rm:{name:'Remedials',folder:'Remedials',code:'RM',num:true},
    th:{name:'Trial holes',folder:'Trial holes',code:'TH',num:true},mh:{name:'Manhole card',folder:'Manhole cards',code:'MH'},fd:{name:'Foundation record',folder:'Foundations',code:'FD'},
    grad:{name:'Gradient sheet',folder:'Gradient sheets',code:'GS'},lv:{name:'Level book',folder:'Level book',code:'LB',num:true},takeoff:{name:'Take-off',folder:'Take-offs',code:'TO',num:true},
    dips:{name:'Road dips',folder:'',code:'RD',local:true}};   // road dips is a calculator: it saves on the phone, it does not file
  const SYNC_TYPE=Object.fromEntries(Object.entries(TYPES).map(([k,v])=>[k,v.folder]));
  const TYPE_OF_FOLDER=Object.fromEntries(Object.entries(TYPES).filter(([k,v])=>v.folder).map(([k,v])=>[v.folder,k]));
  const pdfBuildFor=tool=>{ const P=window.PDF_BUILD_P||{}; const k=Object.keys(P).find(p=>TOOL_OF_PREFIX[p]===tool); return k?P[k]:null; };   // pdfActions registers a builder per prefix
  const sEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const b64url=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const AUTH=(()=>{
    const K='rjh-m365', KP='rjh-pkce'; const redirect=()=>location.origin+location.pathname;
    const get=()=>{ try{ return JSON.parse(localStorage.getItem(K)||'null'); }catch(e){ return null; } };
    const set=t=>{ if(t) localStorage.setItem(K,JSON.stringify(t)); else localStorage.removeItem(K); };
    const base=`https://login.microsoftonline.com/${M365.tenantId}/oauth2/v2.0`;
    // silent: try to get straight back in without asking (prompt=none); if Microsoft says it needs the person, ask them
    async function login(opt={}){ if(!crypto.subtle){ toast('Sign in needs https'); return; }
      const v=b64url(crypto.getRandomValues(new Uint8Array(48))); const ch=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))); const st=b64url(crypto.getRandomValues(new Uint8Array(12)));
      // kept in localStorage, not sessionStorage: an iPhone home-screen app can be closed while Microsoft's page is open
      localStorage.setItem(KP,JSON.stringify({v,st,back:location.hash,at:Date.now(),silent:!!opt.silent})); try{ (typeof DRAFT_FLUSH!=='undefined'?DRAFT_FLUSH:[]).forEach(f=>{ try{ f(); }catch(e){} }); }catch(e){}
      const q=new URLSearchParams({client_id:M365.clientId,response_type:'code',redirect_uri:redirect(),scope:M365.scopes,code_challenge:ch,code_challenge_method:'S256',state:st,response_mode:'query'});
      const cur=get(); if(opt.silent){ q.set('prompt','none'); if(cur&&cur.upn) q.set('login_hint',cur.upn); } else if(!cur) q.set('prompt','select_account'); else if(cur.upn) q.set('login_hint',cur.upn);
      setTimeout(()=>{ location.href=`${base}/authorize?${q}`; },opt.silent?100:600); }
    async function tokenPost(body){ const r=await fetch(`${base}/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:M365.clientId,...body})}); const j=await r.json(); if(!r.ok) throw new Error(j.error_description||j.error||'token error');
      const cur=get()||{}; let who=cur.who||''; try{ if(j.id_token){ const p=JSON.parse(atob(j.id_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); who=p.name||p.preferred_username||who; cur.upn=(p.preferred_username||cur.upn||'').toLowerCase(); } }catch(e){}
      const n={...cur,access:j.access_token,refresh:j.refresh_token||cur.refresh,exp:Date.now()+(j.expires_in||3600)*1000,who}; delete n.needLogin; set(n); return get(); }
    async function finish(){ const u=new URL(location.href); const code=u.searchParams.get('code'), st=u.searchParams.get('state'), err=u.searchParams.get('error'); if(!code&&!err) return false;
      let p={}; try{ p=JSON.parse(localStorage.getItem(KP)||sessionStorage.getItem(KP)||'{}'); }catch(e){} localStorage.removeItem(KP); sessionStorage.removeItem(KP); history.replaceState(null,'',location.pathname+(p.back||''));
      if(err){ if(p.silent&&/login_required|interaction_required|consent_required|account_selection_required/.test(err)){ login(); return true; } toast('Sign in did not finish: '+(u.searchParams.get('error_description')||err).slice(0,80)); return true; }
      if(st!==p.st||!p.v||(p.at&&Date.now()-p.at>20*60000)){ toast('Sign in did not match, try again'); return true; }
      try{ const t=await tokenPost({grant_type:'authorization_code',code,redirect_uri:redirect(),code_verifier:p.v}); toast('Connected to the office as '+t.who); }catch(e){ toast('Sign in failed: '+e.message.slice(0,80)); } return true; }
    async function token(){ const t=get(); if(!t||t.needLogin) return null; if(t.exp-60000>Date.now()) return t.access; if(!t.refresh) return null; if(!navigator.onLine) return null;
      try{ return (await tokenPost({grant_type:'refresh_token',refresh_token:t.refresh,scope:M365.scopes})).access; }catch(e){ if(/invalid_grant|interaction_required|expired|AADSTS700084|AADSTS50173/i.test(e.message)){ set({who:t.who,upn:t.upn,needLogin:true}); } return null; } }
    return {login,finish,token,get,signOut:()=>{ set(null); localStorage.removeItem('rjh-m365-drive'); },who:()=>(get()||{}).who||'',upn:()=>((get()||{}).upn||'').toLowerCase(),
      needLogin:()=>{ const t=get(); return !t||!!t.needLogin||(!t.refresh&&t.exp<Date.now()); }}; })();
  async function graph(path,opt={}){ const tk=await AUTH.token(); if(!tk) throw new Error('not signed in'); const h={Authorization:'Bearer '+tk,...(opt.headers||{})}; if(opt.json){ h['Content-Type']='application/json'; opt.body=JSON.stringify(opt.json); }
    const r=await fetch(path.startsWith('http')?path:'https://graph.microsoft.com/v1.0'+path,{method:opt.method||'GET',headers:h,body:opt.body}); if(r.status===204) return null; const j=await r.json().catch(()=>({})); if(!r.ok){ const e=new Error((j.error&&j.error.message)||('HTTP '+r.status)); e.status=r.status; e.code=j.error&&j.error.code; throw e; } return j; }
  const gpath=p=>p.split('/').map(encodeURIComponent).join('/');
  async function driveId(){ if(M365.driveId) return M365.driveId; const c=localStorage.getItem('rjh-m365-drive'); if(c){ M365.driveId=c; return c; } const d=await graph(`/sites/${M365.siteId}/drive?$select=id`); M365.driveId=d.id; localStorage.setItem('rjh-m365-drive',d.id); return d.id; }
  async function itemAt(path,sel){ try{ return await graph(`/drives/${await driveId()}/root:/${gpath(path)}${sel?'?$select='+sel:''}`); }catch(e){ if(e.status===404) return null; throw e; } }
  async function delAt(path){ try{ const it=await itemAt(path,'id'); if(it) await graph(`/drives/${await driveId()}/items/${it.id}`,{method:'DELETE'}); }catch(e){ console.warn('delete',path,e); } }
  // ---- the queue: what still has to go up. Its own little database so the main one is untouched ----
  const SQ=(()=>{ let dbp=null; const open=()=>dbp||(dbp=new Promise((res,rej)=>{ const r=indexedDB.open('rjh-sync',1); r.onupgradeneeded=()=>{ r.result.createObjectStore('q',{keyPath:'id'}); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }));
    const tx=async(mode,fn)=>{ const d=await open(); return new Promise((res,rej)=>{ const t=d.transaction('q',mode); const q=fn(t.objectStore('q')); t.oncomplete=()=>res(q&&q.result); t.onerror=()=>rej(t.error); }); };
    return {all:()=>tx('readonly',s=>s.getAll()),put:r=>tx('readwrite',s=>s.put(r)),del:id=>tx('readwrite',s=>s.delete(id))}; })();
  const SITEMAP={get:()=>{ try{ return JSON.parse(localStorage.getItem('rjh-sitemap')||'{}'); }catch(e){ return {}; } }, set:m=>localStorage.setItem('rjh-sitemap',JSON.stringify(m)),
    folderFor(site){ const s=SITE.get(); if(s.job&&(!site||site.trim().toLowerCase()===String(s.site||'').toLowerCase())) return {client:s.clientFolder||s.client||'',job:s.job}; const m=this.get()[(site||'').trim().toLowerCase()]; return m||null; } };
  const safeName=s=>String(s||'').replace(/[\\/:*?"<>|#%~]/g,'-').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,110);
  const pad3=s=>String(s||'').replace(/^(\D*?)(\d+)/,(m,a,n)=>a+n.padStart(3,'0'));
  const shortId=id=>{ const n=parseInt(String(id||'').replace(/\D/g,'').slice(-13)||'0',10); return n?n.toString(36).slice(-4):String(id||'').slice(-4); };
  // ---- what a sheet is, read off the form while it is showing: ref, where, date of the work, who, signed ----
  const FV=id=>{ const e=$(id); return e?String(e.value||'').trim():''; };
  const sigState=(sig,nosig)=>{ const s=SIGS[sig]; if(s&&s.has()) return 'Signed'; return nosig||'Not signed yet'; };
  const META={
    dw:{ref:()=>FV('dw-ref'),where:()=>FV('dw-where'),date:()=>FV('dw-date'),by:()=>FV('dw-by'),signer:()=>FV('dw-cname'),signed:()=>sigState('dw-sig1',(typeof DW!=='undefined'&&DW.nosig)||'')},
    aw:{ref:()=>FV('aw-ref'),where:()=>FV('aw-loc'),date:()=>FV('aw-date'),by:()=>FV('aw-by'),signer:()=>FV('aw-cname'),signed:()=>sigState('aw-sig',(typeof AW!=='undefined'&&AW.nosig)||'')},
    rm:{where:()=>FV('rm-ref'),date:()=>FV('rm-listdate'),by:()=>FV('rm-by'),signer:()=>FV('rm-cname'),signed:()=>sigState('rm-sig',(typeof RM!=='undefined'&&RM.nosig)||'')},
    th:{where:()=>{ try{ return (TH.holes||[]).map(h=>h.ref).filter(Boolean).join(' ').slice(0,40); }catch(e){ return ''; } },date:()=>FV('th-date'),by:()=>FV('th-by')},
    mh:{label:()=>FV('mh-ref')?'MH '+FV('mh-ref'):'',date:()=>FV('mh-date'),by:()=>FV('mh-by')},
    fd:{label:()=>FV('fd-plot')?'FD Plot '+pad3(FV('fd-plot').replace(/^plot\s*/i,'')):'',where:()=>FV('fd-type'),date:()=>FV('fd-date'),by:()=>FV('fd-by')},
    grad:{label:()=>(FV('g-from')||FV('g-to'))?`GS ${FV('g-from')||'?'} to ${FV('g-to')||'?'}`:'',date:()=>FV('g-date'),by:()=>FV('g-by')},
    lv:{date:()=>FV('lv-date'),by:()=>FV('lv-by')},
    takeoff:{where:()=>FV('to-ref'),date:()=>FV('to-date'),by:()=>FV('to-by')},
    dips:{date:()=>FV('d-date'),by:()=>FV('d-by')} };
  function readMeta(tool,rec){ const m=META[tool]||{}; const g=k=>{ try{ return m[k]?m[k]():''; }catch(e){ return ''; } };
    const o={ref:g('ref')||rec.ref||'',label:g('label'),where:g('where'),date:g('date')||(rec.created||rec.date||'').slice(0,10),by:g('by'),signer:g('signer'),signed:m.signed?g('signed'):'',links:(((rec.data&&rec.data.links)||rec.links)||[]).map(l=>l.ref).filter(Boolean)};
    if(!o.label) o.label=o.ref||TYPES[tool].code; return o; }
  function recStem(rec){ const m=rec.meta||{}; const job=(rec.job||rec.site||'').trim(); return safeName([m.label||(rec.meta?'':String(rec.name||'').replace(/ · /g,' - ')),m.where,job,m.date].filter(Boolean).join(' - '))+' ('+shortId(rec.id)+')'; }
  // where a sheet goes: its job's folder if it has one, otherwise _Unfiled (hidden, the office files it)
  function recHome(rec){ if(rec.job) return {client:rec.clientFolder||'',job:rec.job}; const f=SITEMAP.folderFor(rec.site); return f&&f.job?f:null; }
  function recBases(rec){ const h=recHome(rec); const t=TYPES[rec.tool]; if(h) { const jb=(h.client?h.client+'/':'')+h.job; return {pdf:`${jb}/${M365.records}/${t.folder}`,json:`${jb}/${M365.app}/sheets`,job:h.job,client:h.client}; }
    const s=safeName(rec.site)||'No site'; return {pdf:`_Unfiled/${s}/${t.folder}`,json:`_Unfiled/${s}/${M365.app}/sheets`,job:'',client:'',unfiled:true}; }
  // ---- job-wide numbering: the next DW, AW... comes from the register for this job, plus anything on this phone not yet filed ----
  const JOBREG={key:j=>'rjh-jobreg:'+(j||''), get(j){ try{ return JSON.parse(localStorage.getItem(this.key(j))||'null'); }catch(e){ return null; } }, set(j,v){ try{ localStorage.setItem(this.key(j),JSON.stringify(v)); }catch(e){} },
    async load(job){ if(!job||!M365.listId) return null; const rows=[]; let url=`/sites/${M365.siteId}/lists/${M365.listId}/items?$expand=fields&$filter=fields/Site eq '${job.replace(/'/g,"''")}'&$top=500`;
      while(url){ const r=await graph(url,{headers:{Prefer:'HonorNonIndexedQueriesWarningMayFailRandomly'}}); (r.value||[]).forEach(it=>{ const f=it.fields||{}; rows.push({id:it.id,type:f.Type||'',ref:f.Ref||'',title:f.Title||'',where:f.Where||'',sheetId:f.SheetId||'',status:f.Status||'New',by:f.Foreman||f.By||'',date:f.WorkDate||f.SheetDate||'',signed:f.Signed||'',link:(f.Link&&f.Link.Url)||'',app:f.AppFile||'',notes:f.Notes||'',mod:it.lastModifiedDateTime}); }); url=r['@odata.nextLink']||''; }
      const v={at:Date.now(),rows}; this.set(job,v); return v; } };
  async function nextRef(tool,job){ const t=TYPES[tool]; if(!t||!t.num) return ''; let mx=0; const re=new RegExp('^'+t.code+'-(\\d+)','i');
    const reg=JOBREG.get(job); ((reg&&reg.rows)||[]).filter(r=>r.type===t.folder).forEach(r=>{ const m=String(r.ref||r.title).match(re); if(m) mx=Math.max(mx,+m[1]); });
    try{ (await DB.all()).filter(r=>r.tool===tool&&((r.job||r.site||'').toLowerCase()===String(job||'').toLowerCase())).forEach(r=>{ const f=(r.data&&r.data.f)||[]; [(r.meta&&r.meta.ref),r.ref,tool==='dw'?f[3]:tool==='aw'?f[4]:''].forEach(v=>{ const m=String(v||'').trim().match(re); if(m) mx=Math.max(mx,+m[1]); }); }); }catch(e){}
    return t.code+'-'+String(mx+1).padStart(3,'0'); }
  // ---- building the PDF for a sheet that is not on screen: one at a time, drafts paused while the form is borrowed ----
  let ENQ=Promise.resolve(); window.SYNC_SWAP=false;
  function syncEnqueue(tool,id){ ENQ=ENQ.then(()=>enqueueOne(tool,id)).catch(e=>console.warn('enqueue',e)); return ENQ; }
  async function enqueueOne(tool,id){ const t=TYPES[tool]; let rec=await DB.get(id); if(!rec||!t||t.local) return;
    const b=pdfBuildFor(tool), o=SAVERS[tool]; let pdf=null, meta=null; const rev=(rec.rev||0)+1;
    if(o){ const onScreen=o.currentId===id; let snap=null, snapId=null, snapRev=0;
      try{ if(!onScreen){ window.SYNC_SWAP=true; document.body.classList.add('swapping'); snap=o.get(); snapId=o.currentId; snapRev=o.rev; o.set(rec.data); o.currentId=id; await new Promise(r=>setTimeout(r,250)); }
        o.rev=rev; meta=readMeta(tool,rec);
        if(b&&b.valid()&&window.jspdf){ const r=await b.build(); pdf=r instanceof Blob?r:r.output('blob'); } }
      catch(e){ console.warn('pdf for filing',e); }
      finally{ if(snap){ try{ o.set(snap); o.currentId=snapId; o.rev=snapRev; }catch(e){} } else o.rev=rev; window.SYNC_SWAP=false; document.body.classList.remove('swapping'); } }
    const cur=await DB.get(id); if(!cur) return; cur.rev=rev; if(meta) cur.meta=meta; else cur.meta=cur.meta||readMeta(tool,cur); if(!cur.job){ const h=recHome(cur); if(h){ cur.job=h.job; cur.clientFolder=h.client; } }
    if(cur.meta&&t.num){ if(!cur.meta.ref){ cur.meta.ref=cur.ref||await nextRef(tool,cur.job||cur.site); if(!cur.meta.label||cur.meta.label===t.code) cur.meta.label=cur.meta.ref; } cur.ref=cur.meta.ref; }
    await DB.put(cur);
    const stem=recStem(cur); const json=new Blob([JSON.stringify({rjhSheets:1,exported:new Date().toISOString(),sheets:[cur]})],{type:'application/json'});
    const all=await SQ.all(); for(const q of all){ if(q.sheetId===id&&q.id!==SYNC_INFLIGHT) await SQ.del(q.id); }
    await SQ.put({id:'q-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),sheetId:id,tool,stem,savedAt:cur.date,rev,pdf,json,by:AUTH.who(),created:new Date().toISOString(),tries:0,err:''});
    syncStatus(); syncRun(); }
  // snag by snag: anything fixed on either phone stays fixed, photos from both are kept, snags added on either are kept
  function mergeRm(a,b){ const key=x=>String(x.no||'')+'|'+String(x.said||'').slice(0,40); const A=JSON.parse(JSON.stringify(a)); let changed=false; const map=new Map((A.items||[]).map(x=>[key(x),x]));
    (b.items||[]).forEach(y=>{ const x=map.get(key(y)); if(!x){ (A.items=A.items||[]).push(y); map.set(key(y),y); changed=true; return; }
      if(x.st==='open'&&y.st&&y.st!=='open'){ ['st','how','fixedAt','by','note'].forEach(k=>{ if(y[k]!==undefined) x[k]=y[k]; }); changed=true; }
      ['before','after'].forEach(k=>{ const have=new Set((x[k]||[]).map(p=>typeof p==='string'?p:p.d)); (y[k]||[]).forEach(p=>{ const d=typeof p==='string'?p:p.d; if(!have.has(d)){ (x[k]=x[k]||[]).push(p); have.add(d); changed=true; } }); }); });
    return {data:A,changed}; }
  window.mergeRm=mergeRm;
  const SYNC_FOLDERS=new Set(); let SYNC_INFLIGHT='';
  async function ensureFolder(path){ if(SYNC_FOLDERS.has(path)) return; const parts=path.split('/'); let cur='';
    for(const p of parts){ const next=cur?cur+'/'+p:p; if(!SYNC_FOLDERS.has(next)){ try{ await graph(`/drives/${await driveId()}/root:/${gpath(next)}`); }catch(e){ if(e.status!==404) throw e; await graph(cur?`/drives/${await driveId()}/root:/${gpath(cur)}:/children`:`/drives/${await driveId()}/root/children`,{method:'POST',json:{name:p,folder:{},'@microsoft.graph.conflictBehavior':'fail'}}).catch(e2=>{ if(e2.status!==409) throw e2; }); } SYNC_FOLDERS.add(next); } cur=next; } }
  async function uploadFile(path,blob){ const url=`/drives/${await driveId()}/root:/${gpath(path)}:/`;
    if(blob.size<3800000) return graph(url+'content?@microsoft.graph.conflictBehavior=replace',{method:'PUT',headers:{'Content-Type':blob.type||'application/octet-stream'},body:blob});
    const s=await graph(url+'createUploadSession',{method:'POST',json:{item:{'@microsoft.graph.conflictBehavior':'replace'}}}); const CH=5*1024*1024; let last=null;
    for(let off=0;off<blob.size;off+=CH){ const end=Math.min(off+CH,blob.size); const r=await fetch(s.uploadUrl,{method:'PUT',headers:{'Content-Range':`bytes ${off}-${end-1}/${blob.size}`},body:blob.slice(off,end)}); if(!r.ok&&r.status!==202) throw new Error('upload '+r.status); last=r.status===202?null:await r.json(); } return last; }
  // the register row: what the office filters on. Older lists without the newer columns still get the basics
  const REG_BASE=['Title','Site','Type','By','SheetDate','SheetId','Link','Status'];
  async function regWrite(rec,it,web,appPath){ if(!M365.listId) return; const m=rec.meta||{}; const t=TYPES[rec.tool];
    const full={Title:[m.label,m.where].filter(Boolean).join(' · ')||rec.name||t.name,Site:rec.job||rec.site||'',Client:rec.clientFolder||'',Type:t.folder,Ref:m.ref||m.label||'',Where:m.where||'',Foreman:m.by||'',By:it.by||AUTH.who(),SignedBy:m.signer||'',Signed:m.signed||'',WorkDate:m.date||'',Rev:String(rec.rev||1),Linked:(m.links||[]).join(', '),SheetDate:it.created,SheetId:rec.id,AppFile:appPath,...(web?{Link:{Url:web,Description:'PDF'}}:{})};
    const L=`/sites/${M365.siteId}/lists/${M365.listId}/items`;
    if(!rec.listItemId){ const q=await graph(`${L}?$filter=fields/SheetId eq '${String(rec.id).replace(/'/g,"''")}'&$select=id&$top=1`,{headers:{Prefer:'HonorNonIndexedQueriesWarningMayFailRandomly'}}); if(q.value&&q.value[0]) rec.listItemId=q.value[0].id; }   // a failed lookup throws: try again later rather than make a second row
    const send=async f=>{ if(rec.listItemId){ await graph(`${L}/${rec.listItemId}/fields`,{method:'PATCH',json:f}); } else { const r=await graph(L,{method:'POST',json:{fields:{...f,Status:'New'}}}); if(r&&r.id) rec.listItemId=r.id; } };
    // a register without the newer columns: the same facts folded into the columns it has
    const basic=()=>{ const f={}; REG_BASE.forEach(k=>{ if(full[k]!==undefined) f[k]=full[k]; }); f.Title=[full.Title,m.signed&&m.signed!=='Signed'?m.signed.toUpperCase():''].filter(Boolean).join(' · '); f.By=m.by&&m.by!==full.By?`${m.by} (filed by ${full.By})`:full.By; if(m.date) f.SheetDate=m.date+'T12:00:00Z'; return f; };
    if(Date.now()-(+localStorage.getItem('rjh-reg-basic')||0)<6*3600e3){ await send(basic()); return; }   // tries the full columns again every few hours, so adding them in SharePoint just works
    try{ await send(full); }catch(e){ if(e.status===400&&/not recognized|does not exist|Field/i.test(e.message)){ try{ localStorage.setItem('rjh-reg-basic',String(Date.now())); }catch(x){} await send(basic()); } else throw e; } }
  let syncBusy=false, syncAgain=false;
  async function syncRun(){ if(!navigator.onLine) return; if(syncBusy){ syncAgain=true; return; } syncAgain=false; const q=(await SQ.all()).sort((a,b)=>a.created.localeCompare(b.created)); if(!q.length){ syncStatus(); return; } if(!(await AUTH.token())){ syncStatus(); return; } syncBusy=true; let sent=0;
    try{ for(const it of q){ if(!(await SQ.all()).some(x=>x.id===it.id)) continue; SYNC_INFLIGHT=it.id; try{ if(it.files&&!it.json){ it.pdf=(it.files.find(f=>/\.pdf$/i.test(f.name))||{}).blob||null; it.json=(it.files.find(f=>/\.json$/i.test(f.name))||{}).blob; it.stem=''; }   // queued by v68
          let rec=await DB.get(it.sheetId); if(!rec){ await SQ.del(it.id); continue; }
          if(!rec.job&&rec.listItemId&&M365.listId&&!recHome(rec)){ try{ const f=await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${rec.listItemId}/fields`); const m=String((f&&f.AppFile)||'').match(/^(.+)\/_app\/sheets\/[^/]+$/); if(m&&!/^_Unfiled\//.test(m[1])){ const p=m[1].split('/'); rec.job=p.pop(); rec.clientFolder=p.join('/'); const nb=recBases(rec); if(rec.syncName){ rec.syncBase=nb.pdf; rec.syncJson=`${nb.json}/${rec.syncName}.json`; } delete rec.pdfTag;   // the office moved its files there under the old name
              const cu=await DB.get(it.sheetId); if(cu){ ['job','clientFolder','syncBase','syncJson'].forEach(k=>{ if(rec[k]!==undefined) cu[k]=rec[k]; }); delete cu.pdfTag; await DB.put(cu); } } }catch(e){ if(e.status!==404) throw e; } }
          const B=recBases(rec); const stem=it.stem||recStem(rec); await ensureFolder(B.pdf); await ensureFolder(B.json);
          // remedials: two lads on one list. Before filing over a list someone else has filed since, merge it snag by snag
          if(rec.tool==='rm'&&rec.jsonTag){ const ex=await itemAt(`${B.json}/${stem}.json`); if(ex&&ex.eTag&&ex.eTag!==rec.jsonTag&&ex['@microsoft.graph.downloadUrl']){ try{ const j=await (await fetch(ex['@microsoft.graph.downloadUrl'])).json(); const other=(j.sheets||[])[0];
              if(other&&other.data){ const cur=await DB.get(it.sheetId)||rec; const m=mergeRm(cur.data,other.data); if(m.changed){ cur.data=m.data; cur.date=new Date().toISOString(); cur.jsonTag=ex.eTag; try{ const pe=await itemAt(`${B.pdf}/${stem}.pdf`,'eTag'); if(pe) cur.pdfTag=pe.eTag; }catch(e){} await DB.put(cur); await SQ.del(it.id); const o=SAVERS.rm; if(o&&o.currentId===cur.id){ o.set(cur.data); } toast('Snag list merged with '+(other.by||'another phone')+'\'s changes'); await syncEnqueue('rm',cur.id); continue; } } }catch(e){ console.warn('merge',e); throw e; } } }
          // someone else changed the filed PDF since this phone last filed it: keep theirs, file ours alongside
          let name=stem, clash=false; let oldPdf=rec.syncBase&&rec.syncName?`${rec.syncBase}/${rec.syncName}.pdf`:'', oldJson=rec.syncJson||'';
          if(rec.forkOf&&rec.forkOf===`${B.pdf}/${stem}`&&rec.syncName&&rec.syncBase===B.pdf) name=rec.syncName;
          // filed by v68: the old file is where its link points, with the data file next to it
          // (v68 named files by sheet name and day, so two sheets could share one: only take it away if its data file says it is this sheet)
          if(!rec.syncName&&rec.webUrl&&rec.syncPath){ try{ const dec=decodeURIComponent(new URL(rec.webUrl).pathname); const k=dec.indexOf('/Shared Documents/'); if(k>=0&&/\.pdf$/i.test(dec)){ const op=dec.slice(k+18), oj=op.replace(/\.pdf$/i,'.rjhsheet.json'); const jm=await itemAt(oj);
              const j=jm&&jm['@microsoft.graph.downloadUrl']?await (await fetch(jm['@microsoft.graph.downloadUrl'])).json():null; if(j&&(j.sheets||[]).length===1&&j.sheets[0].id===rec.id){ oldPdf=op; oldJson=oj; } } }catch(e){ console.warn('v68 copy',e); } }
          if(it.pdf&&rec.pdfTag&&oldPdf===`${B.pdf}/${stem}.pdf`){ const ex=await itemAt(`${B.pdf}/${stem}.pdf`,'eTag'); if(ex&&ex.eTag&&ex.eTag!==rec.pdfTag){ clash=true; const d=new Date(); name=safeName(`${stem} also from ${it.by||'another phone'} ${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')} ${d.toTimeString().slice(0,5).replace(':','')}`); } }
          let web='', tag=''; if(it.pdf){ const r=await uploadFile(`${B.pdf}/${name}.pdf`,it.pdf); if(r){ web=r.webUrl||''; tag=r.eTag||''; } }
          const jr=await uploadFile(`${B.json}/${name}.json`,it.json);
          // renamed or moved (new ref, new plot, filed under the job at last): take the old copy away so there is only ever one
          const same=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();   // SharePoint names are not case sensitive: never delete what was just written
          if(!clash&&(rec.syncName||oldPdf)&&(rec.syncName!==name||rec.syncBase!==B.pdf)){ if(oldPdf&&it.pdf&&!same(oldPdf,`${B.pdf}/${name}.pdf`)) await delAt(oldPdf);   /* no new PDF this time: keep the old one */ if(oldJson&&!same(oldJson,`${B.json}/${name}.json`)) await delAt(oldJson); }
          rec=await DB.get(it.sheetId)||rec;   // re-read: the lad may have saved again while this was going up
          await regWrite(rec,it,web||rec.webUrl||'',`${B.json}/${name}.json`);
          if(clash){ try{ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${rec.listItemId}/fields`,{method:'PATCH',json:{Notes:'Changed on two devices. Both kept: '+name+'.pdf'}}); }catch(e){} }
          const fresh=await DB.get(it.sheetId)||rec; Object.assign(fresh,{listItemId:rec.listItemId,syncName:name,syncBase:B.pdf,syncJson:`${B.json}/${name}.json`,filedAt:new Date().toISOString(),syncPath:B.pdf,ref:rec.ref||fresh.ref}); if(web) fresh.webUrl=web; if(tag) fresh.pdfTag=tag; if(jr&&jr.eTag) fresh.jsonTag=jr.eTag; if(clash) fresh.forkOf=`${B.pdf}/${stem}`; else if(name===stem) delete fresh.forkOf;
          const sa=it.savedAt||rec.date;   // a v68 queue item has no savedAt
          if(sa&&(!fresh.synced||fresh.synced<sa)) fresh.synced=sa; await DB.put(fresh);
          await SQ.del(it.id); sent++; }
        catch(e){ it.tries=(it.tries||0)+1; it.err=(e.message||String(e)).slice(0,160); it.status=e.status||0; await SQ.put(it); if(e.message==='not signed in') break; } } }
    finally{ SYNC_INFLIGHT=''; syncBusy=false; if(syncAgain){ syncAgain=false; setTimeout(syncRun,50); } syncStatus(); if(sent){ toast(sent===1?'1 sheet is in the office':sent+' sheets are in the office'); if(window.onFiled) try{ window.onFiled(); }catch(e){} } } }
  // ---- what the lad sees: every sheet is Filed, Waiting or Problem, in plain words ----
  function plainErr(it){ const e=String((it&&it.err)||''), s=(it&&it.status)||0;
    if(/not signed in/i.test(e)||s===401) return 'needs you to sign in again';
    if(s===403||/accessDenied|Access denied/i.test(e)) return 'this account cannot file to RJH-Site. Tell Michael';
    if(s===404||/itemNotFound/i.test(e)) return 'the job folder has moved. Pick the job again';
    if(s===507||/quota/i.test(e)) return 'SharePoint is full. Tell Michael';
    if(/Failed to fetch|NetworkError|network|Load failed/i.test(e)) return 'no signal';
    return 'could not send it ('+e.slice(0,50)+')'; }
  const hm=d=>{ const x=new Date(d); const n=new Date(); const t=x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); return x.toDateString()===n.toDateString()?t:x.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' '+t; };
  function recState(rec,q){ const t=TYPES[rec.tool]; if(!t) return {k:'phone',t:''}; if(t.local) return {k:'phone',t:'On this phone'};
    const it=(q||[]).find(x=>x.sheetId===rec.id);
    if(it&&it.err&&(it.tries||0)>=2) return {k:'problem',t:'Problem: '+plainErr(it),it};
    if(rec.synced&&rec.synced>=rec.date&&!it) return {k:'filed',t:'In the office '+hm(rec.filedAt||rec.synced)};
    if(!AUTH.who()) return {k:'phone',t:'On this phone. Sign in to send it'};
    if(AUTH.needLogin()) return {k:'wait',t:'Waiting: sign in again to send'};
    return {k:'wait',t:navigator.onLine?'Sending…':'Waiting for signal'}; }
  async function syncRetry(sheetId){ const q=await SQ.all(); for(const it of q){ if(!sheetId||it.sheetId===sheetId){ it.tries=0; it.err=''; await SQ.put(it); } } syncStatus(); syncRun(); }
  let SYNC_SEQ=0;
  async function syncStatus(){ const seq=++SYNC_SEQ; const q=await SQ.all(); if(seq!==SYNC_SEQ) return; const who=AUTH.who(); const need=AUTH.needLogin(); const bad=q.filter(x=>x.err&&(x.tries||0)>=2);
    const pill=$('sync-pill'); if(pill){ pill.hidden=false; let k, txt; if(!who){ k='off'; txt='Not signed in'; } else if(bad.length){ k='bad'; txt='Problem'; } else if(q.length){ k='wait'; txt=q.length+' waiting'; } else if(need){ k='wait'; txt='Sign in again'; } else { k='ok'; txt='All in the office'; } pill.dataset.k=k; pill.textContent=txt; }
    const box=$('home-sync'); if(box){
      let line; if(!who) line='<b>Not signed in.</b> Sheets stay on this phone until the site manager signs in.'; else if(need) line=`<b>Sign in again to send.</b> Microsoft asks every so often. It takes a second.`; else if(bad.length) line=`<b>${bad.length} sheet${bad.length>1?'s':''} could not go:</b> ${sEsc(plainErr(bad[0]))}.`; else if(q.length) line=`<b>${q.length} sheet${q.length>1?'s':''} waiting${navigator.onLine?'':' for signal'}.</b> ${navigator.onLine?'Sending now.':'They go on their own when there is signal.'}`; else line='<b>Sheets go to the office on their own.</b> All sent.';
      box.innerHTML=`<span>${line}${who?`<small>Signed in as ${sEsc(who)}</small>`:''}</span><span class="sync-btns">${!who?'<button type="button" class="btn primary" id="sync-login">Sign in with RJH email</button>':need?'<button type="button" class="btn primary" id="sync-again">Sign in again</button>':bad.length?'<button type="button" class="btn primary" id="sync-retry">Try again</button>':q.length&&navigator.onLine?'<button type="button" class="btn" id="sync-now">Send now</button>':''}</span>`;
      const on=(id,f)=>{ const e=$(id); if(e) e.addEventListener('click',f); };
      on('sync-login',()=>AUTH.login()); on('sync-again',()=>AUTH.login({silent:true})); on('sync-retry',()=>{ syncRetry(); toast('Trying again'); }); on('sync-now',()=>{ syncRun(); toast('Sending'); });
      box.dataset.k=!who||need||bad.length?'warn':q.length?'wait':'ok'; }
    // every open sheet's bar shows where that sheet is up to
    try{ Object.entries(SAVERS).forEach(async([tool,o])=>{ if(!o.currentId) return; const st=$(o.section)&&$(o.section).querySelector('.s-state'); if(!st||st.dataset.hold) return; const r=await DB.get(o.currentId); if(!r) return; const s=recState(r,q); st.textContent=s.t; st.dataset.k=s.k; }); }catch(e){}
    ['homeToday','doneLabels','applyRole'].forEach(f=>{ if(window[f]) try{ window[f](); }catch(e){} }); }
  // ---- wire up ----
  AUTH.finish().then(()=>{ syncStatus(); syncRun(); });
  window.addEventListener('online',()=>{ syncStatus(); syncRun(); }); window.addEventListener('offline',()=>syncStatus()); setInterval(()=>{ if(navigator.onLine) syncRun(); },5*60*1000); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) syncRun(); });
  Object.assign(window,{syncEnqueue,syncStatus,syncRun,syncRetry,AUTH,SQ,graph,M365,TYPES,recState,recStem,nextRef,JOBREG,plainErr,itemAt,delAt});
