  // ---- Jobs and the site pack (v68): the job is picked from RJH-Site, never typed; everything about a job lives in its own folder ----
  const JOBS={list:[],loaded:0};
  const PACK={cur:null,key:'',
    keyOf:(client,job)=>(client||'')+'/'+(job||''),
    blank:(client,job)=>({v:1,client,job,status:'live',notice:'',people:[],plots:[],manholes:[],runs:[],houseTypes:[],updated:new Date().toISOString()}),
    get(){ const s=SITE.get(); const k=this.keyOf(s.clientFolder,s.job); if(this.key!==k){ this.key=k; try{ this.cur=JSON.parse(localStorage.getItem('rjh-pack:'+k)||'null'); }catch(e){ this.cur=null; } } return this.cur; },
    set(p){ this.cur=p; this.key=this.keyOf(p.client,p.job); try{ localStorage.setItem('rjh-pack:'+this.key,JSON.stringify(p)); }catch(e){} packApply(); jobHome(); },
    path:(client,job)=>`${client}/${job}/${M365.records}/_job.json`,
    async load(client,job,force){ try{ const meta=await graph(`/drives/${await driveId()}/root:/${gpath(this.path(client,job))}?$select=id,lastModifiedDateTime,@microsoft.graph.downloadUrl`); const cur=this.get(); if(!force&&cur&&cur.client===client&&cur.job===job&&cur._mod===meta.lastModifiedDateTime) return cur;
        const p=await (await fetch(meta['@microsoft.graph.downloadUrl'])).json(); p.client=client; p.job=job; p._mod=meta.lastModifiedDateTime; this.set(p); return p; }
      catch(e){ if(e.status===404){ const p=this.blank(client,job); this.set(p); return p; } throw e; } },
    async save(p){ p.updated=new Date().toISOString(); delete p._mod; await ensureFolder(`${p.client}/${p.job}/${M365.records}`); const r=await uploadFile(this.path(p.client,p.job),new Blob([JSON.stringify(p,null,1)],{type:'application/json'})); p._mod=r&&r.lastModifiedDateTime; this.set(p); return p; } };
  const jEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shortClient=c=>String(c||'').replace(/\s+(Homes?|Ltd|Limited|Developments?|Group|Housing)\b/gi,'').trim()||c;
  async function jobsRefresh(){ if(!(await AUTH.token())) return JOBS.list; const d=await driveId();
    const r=await graph(`/drives/${d}/root/children?$select=name,folder&$expand=children($select=name,folder)&$top=200`); const list=[];
    (r.value||[]).forEach(c=>{ if(!c.folder||/^_|^Forms$|unfiled/i.test(c.name)) return; (c.children||[]).forEach(j=>{ if(!j.folder||/^_/.test(j.name)) return; list.push({client:c.name,job:j.name,status:'live',notice:''}); }); });
    // status and notice from each job's pack, a few at a time
    const known={}; try{ Object.assign(known,JSON.parse(localStorage.getItem('rjh-jobs-meta')||'{}')); }catch(e){}
    const q=[...list]; const worker=async()=>{ while(q.length){ const j=q.shift(); const k=PACK.keyOf(j.client,j.job); try{ const meta=await graph(`/drives/${d}/root:/${gpath(PACK.path(j.client,j.job))}?$select=lastModifiedDateTime,@microsoft.graph.downloadUrl`); if(known[k]&&known[k].mod===meta.lastModifiedDateTime){ Object.assign(j,known[k]); continue; } const p=await (await fetch(meta['@microsoft.graph.downloadUrl'])).json(); j.status=p.status||'live'; j.notice=p.notice||''; known[k]={status:j.status,notice:j.notice,mod:meta.lastModifiedDateTime}; }catch(e){ known[k]={status:'live',notice:'',mod:''}; } } };
    await Promise.all([worker(),worker(),worker()]); try{ localStorage.setItem('rjh-jobs-meta',JSON.stringify(known)); }catch(e){}
    list.sort((a,b)=>(a.client+a.job).localeCompare(b.client+b.job)); JOBS.list=list; JOBS.loaded=Date.now(); try{ localStorage.setItem('rjh-jobs',JSON.stringify(list)); }catch(e){} return list; }
  (function(){ try{ JOBS.list=JSON.parse(localStorage.getItem('rjh-jobs')||'[]'); }catch(e){} })();
  async function jobPick(client,job){ const s=SITE.get(); Object.assign(s,{site:job,client:shortClient(client),clientFolder:client,job}); SITE.set(s); const m=SITEMAP.get(); m[job.toLowerCase()]={client,job}; SITEMAP.set(m);
    $('home-site').value=job; $('home-client').value=s.client; siteSummary(); jobHome(); toast('On '+job); try{ await PACK.load(client,job); }catch(e){} packApply(); jobHome(); }
  async function jobNew(){ const client=(prompt('Client, as the folder should be called (e.g. Strata Homes)')||'').trim(); if(!client) return; const job=(prompt('Job name (e.g. Expression)')||'').trim(); if(!job) return;
    try{ await ensureFolder(`${client}/${job}/${M365.records}`); const p=PACK.blank(client,job); await PACK.save(p); JOBS.list.push({client,job,status:'live',notice:''}); await jobPick(client,job); toast('Job made: '+job); }catch(e){ toast('Could not make the job: '+(e.message||e)); } }
  async function jobPicker(){ const box=$('site-pick'); if(!box) return; if(!(await AUTH.token())){ toast('Sign in first (bottom of the home screen)'); return; } box.hidden=false;
    const draw=()=>{ const live=JOBS.list.filter(j=>j.status!=='complete'); const by={}; live.forEach(j=>(by[j.client]=by[j.client]||[]).push(j));
      box.innerHTML='<div class="pick-h"><b>Which job?</b><button type="button" class="btn" id="pick-x">Close</button></div>'+(live.length?Object.keys(by).sort().map(c=>`<div class="savegroup">${jEsc(c)}</div>`+by[c].map(j=>`<button type="button" class="pick" data-c="${jEsc(j.client)}" data-j="${jEsc(j.job)}">${jEsc(j.job)}${j.notice?`<small>${jEsc(j.notice)}</small>`:''}</button>`).join('')).join(''):'<p class="note">No jobs yet.</p>')+'<button type="button" class="btn" id="pick-new" style="margin-top:8px">+ New job</button>';
      box.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>{ box.hidden=true; jobPick(b.dataset.c,b.dataset.j); })); $('pick-x').addEventListener('click',()=>{ box.hidden=true; }); $('pick-new').addEventListener('click',()=>{ box.hidden=true; jobNew(); }); };
    if(JOBS.list.length) draw(); else box.innerHTML='<p class="note">Loading jobs…</p>';
    if(Date.now()-JOBS.loaded>60000){ try{ await jobsRefresh(); }catch(e){ if(!JOBS.list.length) box.innerHTML='<p class="note">Could not read the jobs: '+jEsc(e.message||e)+'</p>'; return; } if(!box.hidden) draw(); } }
  function jobHome(){ const s=SITE.get(); const b=$('job-box'); if(!b) return; const p=PACK.get(); const on=!!s.job;
    b.innerHTML=on?`<div class="job-now"><small>This job</small><b>${jEsc(s.job)}</b><span>${jEsc(s.clientFolder||s.client||'')}${s.by?' · '+jEsc(s.by):''}</span>${p&&p.notice?`<div class="job-notice">${jEsc(p.notice)}</div>`:''}</div><div class="job-row"><div class="in"><input id="job-by" type="text" placeholder="Your name" value="${jEsc(s.by||'')}"></div><button class="btn" type="button" id="job-change">Change job</button></div>`
      :`<p class="note" style="margin:0 0 6px"><b>No job picked.</b> Pick the job and every sheet files itself in the right place.</p><div class="job-row"><div class="in"><input id="job-by" type="text" placeholder="Your name" value="${jEsc(s.by||'')}"></div><button class="btn primary" type="button" id="job-change">Pick the job</button></div>`;
    $('job-change').addEventListener('click',jobPicker); $('job-by').addEventListener('input',()=>{ const o=SITE.get(); o.by=$('job-by').value.trim(); SITE.set(o); const hb=$('home-by'); if(hb) hb.value=o.by; siteSummary(); }); ['home-site','home-client'].forEach(id=>{ const e=$(id); if(!e) return; e.readOnly=on; e.classList.toggle('locked',on); }); const pb=$('site-pickbtn'); if(pb) pb.hidden=true; }
  // the pack feeds the forms: names, plots and manholes offered as you type; site and client locked to the job
  function packApply(){ const p=PACK.get(); const dl=(id,items)=>{ let d=$(id); if(!d){ d=document.createElement('datalist'); d.id=id; document.body.appendChild(d); } d.innerHTML=[...new Set(items.filter(Boolean))].map(x=>`<option value="${jEsc(x)}">`).join(''); };
    const people=p?(p.people||[]).map(x=>x.name):[], plots=p?(p.plots||[]).map(x=>'Plot '+x.plot):[], mhs=p?(p.manholes||[]).map(x=>x.ref):[];
    dl('pack-people',people); dl('pack-plots',plots.concat(mhs)); dl('pack-mh',mhs);
    [['aw-inst','pack-people'],['aw-cname','pack-people'],['rm-from','pack-people'],['rm-cname','pack-people'],['dw-inst','pack-people'],['dw-cname','pack-people'],['aw-loc','pack-plots'],['fd-plot','pack-plots'],['mh-ref','pack-mh'],['g-from','pack-mh'],['g-to','pack-mh']].forEach(([id,l])=>{ const e=$(id); if(e&&(p&&(people.length||plots.length||mhs.length))) e.setAttribute('list',l); else if(e&&e.getAttribute('list')&&e.getAttribute('list').startsWith('pack-')) e.removeAttribute('list'); });
    // the datalists the tools already keep (names used before) merge in the pack's people
    ['aw-names','rm-names'].forEach(id=>{ const d=$(id); if(d&&people.length){ const have=new Set([...d.options].map(o=>o.value)); people.forEach(n=>{ if(!have.has(n)) d.insertAdjacentHTML('beforeend',`<option value="${jEsc(n)}">`); }); } }); }
  document.addEventListener('focusin',e=>{ const el=e.target; if(el&&el.matches&&el.matches('input[data-k="where"]')&&$('pack-plots')&&$('pack-plots').options.length) el.setAttribute('list','pack-plots'); });
  // manhole card: typing a ref from the schedule fills the design levels; gradient sheet: picking the manholes fills the levels and the run
  function packMh(ref){ const p=PACK.get(); if(!p) return null; const r=String(ref||'').trim().toLowerCase(); return (p.manholes||[]).find(m=>String(m.ref).toLowerCase()===r)||null; }
  function mhFromPack(){ const m=packMh($('mh-ref').value); if(!m) return; const put=(id,v)=>{ const e=$(id); if(e&&v!==undefined&&v!==''&&!String(e.value).trim()){ e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); } };
    put('mh-cl',m.cl); put('mh-dia',m.dia); if(m.sys&&$('mh-sys')){ const b=$('mh-sys').querySelector(`[data-s="${m.sys}"]`); if(b&&b.getAttribute('aria-pressed')!=='true') b.click(); }
    if(typeof MH!=='undefined'){ MH.design={cl:m.cl,il:m.il,dia:m.dia,depth:m.depth}; } toast('Design: CL '+(m.cl||'?')+(m.il?', IL '+m.il:'')); }
  function gradFromPack(){ const a=packMh($('g-from').value), b=packMh($('g-to').value); const put=(id,v)=>{ const e=$(id); if(e&&v!==undefined&&v!==''&&!String(e.value).trim()){ e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); } };
    if(a){ put('g-cl1',a.cl); put('g-il1',a.ilOut||a.il); } if(b){ put('g-cl2',b.cl); put('g-il2',b.ilIn||b.il); }
    const p=PACK.get(); if(p&&a&&b){ const run=(p.runs||[]).find(r=>String(r.from).toLowerCase()===String(a.ref).toLowerCase()&&String(r.to).toLowerCase()===String(b.ref).toLowerCase()); if(run){ put('g-len',run.len); put('g-dia',run.dia); } } }
  (function(){ const m=$('mh-ref'); if(m) m.addEventListener('change',mhFromPack); ['g-from','g-to'].forEach(id=>{ const e=$(id); if(e) e.addEventListener('change',gradFromPack); }); })();
  // ---- Job set-up (office): people, plots, manholes, runs, notice, complete ----
  const JS={job:null};
  function jsLines(id){ return $(id).value.split('\n').map(l=>l.trim()).filter(Boolean); }
  const splitRow=l=>l.split(/\t|,|;/).map(x=>x.trim());
  function jsFill(p){ $('js-notice').value=p.notice||''; $('js-status').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===(p.status||'live')));
    $('js-people').value=(p.people||[]).map(x=>[x.name,x.company,x.role].filter(Boolean).join(', ')).join('\n');
    $('js-plots').value=(p.plots||[]).map(x=>[x.plot,x.type,x.hand,x.road].filter(Boolean).join(', ')).join('\n');
    $('js-mh').value=(p.manholes||[]).map(x=>[x.ref,x.cl,x.il,x.dia,x.depth,x.sys].map(v=>v==null?'':v).join('\t')).join('\n');
    $('js-runs').value=(p.runs||[]).map(x=>[x.from,x.to,x.dia,x.len].map(v=>v==null?'':v).join('\t')).join('\n');
    $('js-ht').textContent=(p.houseTypes||[]).length?`${p.houseTypes.length} house types loaded`:'No house types loaded for this job yet.'; }
  function jsRead(p){ p.notice=$('js-notice').value.trim(); p.status=$('js-status').querySelector('[aria-pressed=true]').dataset.s;
    p.people=jsLines('js-people').map(l=>{ const [name,company,role]=splitRow(l); return {name,company:company||'',role:role||''}; });
    p.plots=jsLines('js-plots').map(l=>{ const [plot,type,hand,road]=splitRow(l); return {plot:plot.replace(/^plot\s*/i,''),type:type||'',hand:hand||'',road:road||''}; });
    p.manholes=jsLines('js-mh').map(l=>{ const [ref,cl,il,dia,depth,sys]=splitRow(l); const n=v=>v===''||v===undefined?'':(isNaN(parseFloat(v))?v:String(parseFloat(v))); return {ref,cl:n(cl),il:n(il),dia:n(dia),depth:n(depth),sys:(sys||'').toLowerCase()}; }).filter(m=>m.ref);
    p.runs=jsLines('js-runs').map(l=>{ const [from,to,dia,len]=splitRow(l); return {from,to,dia:dia||'',len:len||''}; }).filter(r=>r.from&&r.to); return p; }
  async function jsOpen(client,job){ $('js-title').textContent=job+' · '+client; $('js-body').hidden=false; $('js-body').querySelectorAll('textarea,input').forEach(e=>e.disabled=true); try{ const p=await PACK.load(client,job,true); JS.job=p; jsFill(p); }catch(e){ toast('Could not load the job: '+(e.message||e)); JS.job=PACK.blank(client,job); jsFill(JS.job); } $('js-body').querySelectorAll('textarea,input').forEach(e=>e.disabled=false); }
  (function(){ if(!$('js-pick')) return;
    $('js-pick').addEventListener('click',async()=>{ const box=$('js-list'); box.hidden=false; box.innerHTML='<p class="note">Loading jobs…</p>'; try{ await jobsRefresh(); }catch(e){} const by={}; JOBS.list.forEach(j=>(by[j.client]=by[j.client]||[]).push(j));
      box.innerHTML=Object.keys(by).sort().map(c=>`<div class="savegroup">${jEsc(c)}</div>`+by[c].map(j=>`<button type="button" class="pick" data-c="${jEsc(j.client)}" data-j="${jEsc(j.job)}">${jEsc(j.job)}${j.status==='complete'?' <small>complete</small>':''}</button>`).join('')).join('')+'<button type="button" class="btn" id="js-new" style="margin-top:8px">+ New job</button>';
      box.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>{ box.hidden=true; jsOpen(b.dataset.c,b.dataset.j); })); $('js-new').addEventListener('click',async()=>{ box.hidden=true; await jobNew(); const s=SITE.get(); if(s.job) jsOpen(s.clientFolder,s.job); }); });
    $('js-status').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; $('js-status').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
    $('js-save').addEventListener('click',async()=>{ if(!JS.job) return; try{ jsRead(JS.job); await PACK.save(JS.job); const j=JOBS.list.find(x=>x.client===JS.job.client&&x.job===JS.job.job); if(j){ j.status=JS.job.status; j.notice=JS.job.notice; } toast('Job saved. Phones on '+JS.job.job+' pick it up next time they sync.'); }catch(e){ toast('Could not save: '+(e.message||e)); } });
    $('js-mhfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; try{ let rows; if(/\.csv$/i.test(f.name)) rows=rmCsvRows(await f.text()); else rows=rmXlsxRows(await rmUnzip(await f.arrayBuffer()));
        const hi=rows.findIndex(r=>r.filter(Boolean).length>=2&&r.some(c=>/mh|manhole|ref|cover|invert|\bcl\b|\bil\b/i.test(c))); const h=(rows[hi>=0?hi:0]||[]).map(c=>(c||'').toLowerCase()); const col=(...re)=>{ for(const x of re){ const k=h.findIndex(c=>x.test(c)); if(k>=0) return k; } return -1; };
        const cRef=col(/^(mh|manhole|ref|chamber|node|name)/,/ref/), cCL=col(/cover|\bcl\b|^cl/), cIL=col(/invert out|il out|outgoing/,/invert|\bil\b|^il/), cDia=col(/dia|size/), cDep=col(/depth/), cSys=col(/system|type|foul|surface/);
        const body=rows.slice((hi>=0?hi:0)+1).filter(r=>cRef>=0&&(r[cRef]||'').trim()); const lines=body.map(r=>[r[cRef],cCL>=0?r[cCL]:'',cIL>=0?r[cIL]:'',cDia>=0?r[cDia]:'',cDep>=0?r[cDep]:'',cSys>=0?r[cSys]:''].map(v=>(v||'').trim()).join('\t'));
        if(!lines.length){ toast('Could not find manholes in that file'); return; } $('js-mh').value=($('js-mh').value.trim()?$('js-mh').value.trim()+'\n':'')+lines.join('\n'); toast(lines.length+' manholes read. Check them, then Save job.'); }
      catch(err){ toast('Could not read that file'); } });
    $('js-htfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f||!JS.job) return; try{ const j=JSON.parse(await f.text()); const ht=Array.isArray(j)?j:(j.houseTypes||j.drawings||[]); if(!ht.length) throw new Error('no house types in that file'); JS.job.houseTypes=ht; $('js-ht').textContent=ht.length+' house types loaded (save the job to keep them)'; }catch(err){ toast('Could not read that file: '+(err.message||err)); } });
    document.querySelector('[data-go="panel-jobsetup"]').addEventListener('click',()=>{ const s=SITE.get(); if(s.job&&(!JS.job||JS.job.job!==s.job||JS.job.client!==s.clientFolder)) jsOpen(s.clientFolder,s.job); }); })();
  // site and client on every sheet follow the job
  const _prefill=prefill; prefill=function(map){ _prefill(map); const o=SITE.get(); Object.entries(map).forEach(([k,id])=>{ const e=$(id); if(!e) return; if(o.job&&(k==='site'||k==='client')){ if(o[k]) e.value=o[k]; e.readOnly=true; e.classList.add('locked'); e.title='Follows the job picked on the home screen'; } else { e.readOnly=false; e.classList.remove('locked'); } }); };
  // keep the pack fresh: after each sync run, and when the job is picked
  const _syncRun=syncRun; syncRun=async function(){ await _syncRun(); const s=SITE.get(); if(s.job&&navigator.onLine){ try{ await PACK.load(s.clientFolder,s.job); jobHome(); }catch(e){} } };
  window.syncRun=syncRun; window.PACK=PACK; window.JOBS=JOBS; window.jobsRefresh=jobsRefresh; window.jobPick=jobPick;
  jobHome(); packApply();
