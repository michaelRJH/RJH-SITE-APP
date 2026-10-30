  // ---- Office (v67, rebuilt v72): every job's sheets from the register, where each is up to, notes, job progress, exports ----
  const OF={rows:[],view:'tocheck',site:'',type:'',month:'',loaded:0,listUrl:''};
  // what "where it is up to" means depends on the sheet: extras and dayworks get priced, the rest get checked and passed on
  const OF_STATUS={Extras:['New','Checked','Queried','Priced','On valuation'],Dayworks:['New','Checked','Queried','Priced','On valuation'],Remedials:['New','Checked','Closed'],_:['New','Checked','Queried','Issued to drawing']};
  const ofStatuses=t=>OF_STATUS[t]||OF_STATUS._;
  const OF_DONE=new Set(['Priced','On valuation','Closed','Issued to drawing']);
  const ofEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ofAge=d=>{ const x=Date.parse(d); return isNaN(x)?0:Math.max(0,Math.floor((Date.now()-x)/864e5)); };
  const ofDate=d=>{ const x=new Date(d); return isNaN(x)?'':x.toLocaleDateString('en-GB'); };
  function ofRow(it){ const f=it.fields||{}; const title=f.Title||''; const ns=/ · (NOT SIGNED YET|NOT ON SITE|WILL SIGN LATER|REFUSED)$/i.exec(title); const notSigned=ns?[ns[1][0]+ns[1].slice(1).toLowerCase()]:null;
    return {id:it.id,name:title.replace(/ · (NOT SIGNED YET|NOT ON SITE|WILL SIGN LATER|REFUSED)$/i,''),site:f.Site||'',client:f.Client||'',type:f.Type||'',ref:f.Ref||title.split(' · ')[0],where:f.Where||'',foreman:f.Foreman||String(f.By||'').replace(/ \(filed by .*\)$/,''),filedBy:f.By||'',
      signed:f.Signed||(notSigned?notSigned[0]:''),signer:f.SignedBy||'',date:f.WorkDate||f.SheetDate||it.createdDateTime,rev:f.Rev||'',sheetId:f.SheetId||'',status:f.Status||'New',
      link:(f.Link&&f.Link.Url)||'',app:f.AppFile||'',linked:f.Linked||'',notes:f.Notes||'',created:it.createdDateTime,modified:it.lastModifiedDateTime}; }
  async function ofLoad(){ const box=$('of-list'); if(!(await AUTH.token())){ box.innerHTML='<p class="note">Sign in on the home screen first.</p>'; return; }
    box.innerHTML='<p class="note">Loading the list of sheets…</p>';
    try{ let url=`/sites/${M365.siteId}/lists/${M365.listId}/items?$expand=fields&$top=500&$orderby=createdDateTime desc`; const rows=[];
      while(url){ const r=await graph(url,{headers:{Prefer:'HonorNonIndexedQueriesWarningMayFailRandomly'}}); (r.value||[]).forEach(it=>rows.push(ofRow(it))); url=r['@odata.nextLink']||''; }
      OF.rows=rows; OF.loaded=Date.now(); ofFilters(); ofRender();
      if(!OF.listUrl){ try{ const l=await graph(`/sites/${M365.siteId}/lists/${M365.listId}?$select=webUrl`); OF.listUrl=l.webUrl||''; const a=$('of-splink'); if(a&&OF.listUrl){ a.href=OF.listUrl; a.hidden=false; } }catch(e){} } }
    catch(e){ box.innerHTML='<p class="note">Could not read the list: '+ofEsc(e.message||e)+'</p>'; } }
  function ofFilters(){ const sites=[...new Set(OF.rows.map(r=>r.site).filter(Boolean))].sort(), types=[...new Set(OF.rows.map(r=>r.type).filter(Boolean))].sort(), months=[...new Set(OF.rows.map(r=>String(r.date).slice(0,7)).filter(x=>/^\d{4}-\d\d$/.test(x)))].sort().reverse();
    const fill=(id,items,cur,all,lab)=>{ const s=$(id); s.innerHTML=`<option value="">${all}</option>`+items.map(x=>`<option value="${ofEsc(x)}"${x===cur?' selected':''}>${ofEsc(lab?lab(x):x)}</option>`).join(''); };
    fill('of-site',sites,OF.site,'All jobs'); fill('of-type',types,OF.type,'All types'); fill('of-month',months,OF.month,'Any month',m=>new Date(m+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})); }
  function ofRows(){ const me=(AUTH.who()||'').toLowerCase(); return OF.rows.filter(r=>(!OF.site||r.site===OF.site)&&(!OF.type||r.type===OF.type)&&(!OF.month||String(r.date).slice(0,7)===OF.month)&&
      (OF.view==='all'||(OF.view==='new'&&r.status==='New')||(OF.view==='tocheck'&&!OF_DONE.has(r.status))||(OF.view==='queried'&&r.status==='Queried')||(OF.view==='unsigned'&&r.signed&&r.signed!=='Signed')||(OF.view==='mine'&&(r.filedBy.toLowerCase().startsWith(me)||r.foreman.toLowerCase()===me))))
      .sort((a,b)=>String(b.date).localeCompare(String(a.date))); }
  async function ofSetStatus(r,s,row){ const old=r.status; r.status=s; ofRender();
    try{ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:{Status:s}}); toast(r.name+': '+s); }
    catch(e){ // an older register only knows New, Checked, Priced and On valuation: the rest goes in the notes
      if(e.status===400){ try{ const n=`${s} (${new Date().toLocaleDateString('en-GB')})`+(r.notes?' · '+r.notes:''); await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:{Notes:n}}); r.status=old; r.notes=n; ofRender(); toast('Noted as '+s); return; }catch(e2){} }
      r.status=old; ofRender(); toast('Could not change it: '+(e.message||e)); } }
  async function ofNote(r){ const n=prompt('Note on '+r.name+' (shows on the list for everyone)',r.notes||''); if(n===null) return;
    try{ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:{Notes:n}}); r.notes=n; ofRender(); toast('Note saved'); }catch(e){ toast('Could not save the note: '+(e.message||e)); } }
  function ofRender(){ const box=$('of-list'); const rows=ofRows();
    $('of-n-tocheck').textContent=OF.rows.filter(r=>!OF_DONE.has(r.status)).length; $('of-n-old').textContent=OF.rows.filter(r=>!OF_DONE.has(r.status)&&ofAge(r.date)>14).length; $('of-n-unsigned').textContent=OF.rows.filter(r=>r.signed&&r.signed!=='Signed').length;
    if(!rows.length){ box.innerHTML='<p class="note">Nothing here.</p>'; return; } box.innerHTML='';
    const bySite={}; rows.forEach(r=>{ const k=r.site||'Not under a job yet'; (bySite[k]=bySite[k]||[]).push(r); });
    Object.keys(bySite).sort().forEach(site=>{ const g=document.createElement('div'); g.className='savegroup'; g.textContent=site; box.appendChild(g);
      bySite[site].forEach(r=>{ const age=ofAge(r.date); const row=document.createElement('div'); row.className='of-row'+(!OF_DONE.has(r.status)&&age>14?' old':''); const st=ofStatuses(r.type);
        const unsigned=r.signed&&r.signed!=='Signed';
        row.innerHTML=`<div class="of-top"><div><b>${ofEsc(r.name)}</b><small>${ofEsc(r.type)}${r.foreman?' · '+ofEsc(r.foreman):''} · ${ofDate(r.date)}${age>0?' · '+age+' day'+(age>1?'s':'')+' ago':' · today'}${r.rev&&r.rev!=='1'?' · Rev '+ofEsc(r.rev):''}</small>${unsigned?`<span class="of-flag">${ofEsc(r.signed)}</span>`:r.signer?`<small>Signed by ${ofEsc(r.signer)}</small>`:''}${r.linked?`<small>Same work as ${ofEsc(r.linked)}</small>`:''}</div>
          <div class="of-btns">${/^https:\/\//i.test(r.link)?`<a class="btn" href="${ofEsc(r.link)}" target="_blank" rel="noopener">PDF</a>`:''}<button type="button" class="btn primary of-open">Open</button></div></div>
          <div class="of-status" style="grid-template-columns:repeat(${st.length},1fr)">${st.map(s=>`<button type="button" data-s="${ofEsc(s)}" aria-pressed="${r.status===s}">${ofEsc(s)}</button>`).join('')}</div>
          <div class="of-notes"><span>${r.notes?ofEsc(r.notes):''}</span><button type="button" class="of-note">${r.notes?'Change note':'Add a note'}</button>${!r.site||/^_Unfiled/.test(r.app)?'<button type="button" class="of-file">File under a job</button>':''}</div>`;
        row.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.s!==r.status) ofSetStatus(r,b.dataset.s,row); }));
        row.querySelector('.of-open').addEventListener('click',()=>ofOpen(r)); row.querySelector('.of-note').addEventListener('click',()=>ofNote(r));
        const fu=row.querySelector('.of-file'); if(fu) fu.addEventListener('click',()=>ofFileUnder(r));
        box.appendChild(row); }); }); }
  // the sheet's data file: the register says where; older rows had it next to the PDF
  async function ofJsonPath(r){ if(r.app) return r.app; if(!r.link) return ''; const dec=decodeURIComponent(new URL(r.link).pathname); const i=dec.indexOf('/Shared Documents/'); if(i<0) return ''; const pdf=dec.slice(i+'/Shared Documents/'.length);
    const m=pdf.match(/^(.*)\/Site records\/[^/]+\/([^/]+)\.pdf$/i); if(m){ const p=`${m[1]}/${M365.app}/sheets/${m[2]}.json`; if(await itemAt(p,'id')) return p; } return pdf.replace(/\.pdf$/i,'.rjhsheet.json'); }
  async function ofSheet(r){ const p=await ofJsonPath(r); if(!p) throw new Error('no file for this row'); const meta=await itemAt(p); if(!meta||!meta['@microsoft.graph.downloadUrl']) throw new Error('the sheet file is missing'); const j=await (await fetch(meta['@microsoft.graph.downloadUrl'])).json(); return (j.sheets||[])[0]; }
  // Open brings the sheet in to read. Changing it is a deliberate step: Edit as a revision
  async function ofOpen(r){ toast('Fetching the sheet…');
    try{ const sh=await ofSheet(r); if(!sh||!SAVERS[sh.tool]) throw new Error('not a sheet file');
      // the data file is written before its PDF goes up, so take the PDF's current name and tag from SharePoint itself
      const jp=await ofJsonPath(r); const fresh={}; if(r.link){ try{ const dec=decodeURIComponent(new URL(r.link).pathname); const k=dec.indexOf('/Shared Documents/'); const pp=k>=0?dec.slice(k+18):''; const pm=pp&&await itemAt(pp,'eTag,name'); if(pm){ fresh.pdfTag=pm.eTag; fresh.syncName=pm.name.replace(/\.pdf$/i,''); fresh.syncBase=pp.slice(0,pp.lastIndexOf('/')); fresh.syncJson=jp; fresh.webUrl=r.link; } }catch(e){} }
      if(r.id) fresh.listItemId=r.id;
      const o=SAVERS[sh.tool]; try{ await saveQuiet(sh.tool); }catch(e){} const have=await DB.get(sh.id).catch(()=>null); if(!have||have.date<=sh.date) await DB.put({...(have||{}),...sh,...fresh,loaded:sh.date,synced:sh.date,fromOffice:true});
      // this phone has a newer copy of it (an edit not yet filed): show that one, so Edit as a revision does not file the older one over it
      const show=have&&have.date>sh.date?have:sh; if(show===have) toast('This phone has a newer copy of it, not filed yet. Showing that.');
      o.set(show.data); o.currentId=sh.id; o.rev=show.rev||0; go(o.section); readOnly(sh.tool,true,r); toast('Opened '+(sh.name||r.name)+' to read'); }
    catch(e){ toast('Could not open it: '+(e.message||e)); } }
  function readOnly(tool,on,r){ const o=SAVERS[tool]; const sec=$(o.section); sec.classList.toggle('readonly',!!on); let b=sec.querySelector('.ro-banner');
    if(on){ if(!b){ b=document.createElement('div'); b.className='ro-banner'; (sec.querySelector('.jobstrip')||sec.querySelector('.savebar')).before(b); }
      b.innerHTML=`<b>Opened from the office list, to read.</b> ${r&&r.foreman?ofEsc(r.foreman)+"'s sheet. ":''}Nothing you do here changes it.<div class="btnrow"><button type="button" class="btn" data-ro="edit">Edit as a revision</button><button type="button" class="btn" data-ro="close">Close</button></div>`;
      b.querySelector('[data-ro=edit]').addEventListener('click',()=>{ if(!confirm('Change this sheet? It is filed again as the next revision, with your name as the one who changed it. The foreman stays on it.')) return; readOnly(tool,false); toast('Editing. Save files it as the next revision.'); });
      b.querySelector('[data-ro=close]').addEventListener('click',()=>{ readOnly(tool,false); o.clear(); o.currentId=null; DB.del('draft-'+tool).catch(()=>{}); go('panel-office'); }); }
    else if(b) b.remove(); }
  window.readOnly=readOnly;
  document.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>Object.keys(SAVERS).forEach(k=>{ const s=$(SAVERS[k].section); if(s&&s.classList.contains('readonly')){ s.classList.remove('readonly'); const b=s.querySelector('.ro-banner'); if(b) b.remove(); SAVERS[k].clear(); SAVERS[k].currentId=null; } })));
  // a sheet saved before its job was picked: move it under the job
  async function ofFileUnder(r){ if(!JOBS.list.length){ try{ await jobsRefresh(); }catch(e){} } const jobs=JOBS.list.filter(j=>j.status!=='complete'); if(!jobs.length){ toast('No jobs to file under'); return; }
    const pick=prompt('File "'+r.name+'" under which job?\n'+jobs.map((j,i)=>`${i+1}. ${j.job} (${j.client})`).join('\n')+'\n\nType the number:'); const j=jobs[(parseInt(pick,10)||0)-1]; if(!j) return;
    try{ const d=await driveId(); const sh=await ofSheet(r).catch(()=>null); const tf=r.type||'Other'; const base=`${j.client}/${j.job}`;
      const move=async(from,toFolder)=>{ const it=await itemAt(from,'id,name'); if(!it) return null; await ensureFolder(toFolder); return graph(`/drives/${d}/items/${it.id}`,{method:'PATCH',json:{parentReference:{path:`/drive/root:/${toFolder}`}}}); };
      let pdfPath=''; if(r.link){ const dec=decodeURIComponent(new URL(r.link).pathname); const i=dec.indexOf('/Shared Documents/'); if(i>=0) pdfPath=dec.slice(i+18); }
      const mp=pdfPath?await move(pdfPath,`${base}/${M365.records}/${tf}`):null; const jp=await ofJsonPath(r); const mj=jp?await move(jp,`${base}/${M365.app}/sheets`):null;
      const f={Site:j.job}; if(mp&&mp.webUrl) f.Link={Url:mp.webUrl,Description:'PDF'}; try{ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:{...f,Client:j.client,AppFile:mj?`${base}/${M365.app}/sheets/${mj.name}`:''}}); }catch(e){ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:f}); }
      r.site=j.job; if(mp) r.link=mp.webUrl; ofRender(); toast('Filed under '+j.job); }
    catch(e){ toast('Could not move it: '+(e.message||e)); } }
  // ---- job progress: the schedule against what is filed ----
  async function ofPack(client,job){ for(const p of [`${client}/${job}/${M365.app}/job.json`,`${client}/${job}/${M365.records}/_job.json`]){ const it=await itemAt(p); if(it&&it['@microsoft.graph.downloadUrl']) return (await fetch(it['@microsoft.graph.downloadUrl'])).json(); } return null; }
  async function ofProgress(){ const box=$('of-progress'); const job=OF.site; if(!job){ box.innerHTML='<p class="note">Pick a job above to see its progress.</p>'; box.hidden=false; return; }
    box.hidden=false; box.innerHTML='<p class="note">Reading the job…</p>'; const row=OF.rows.find(r=>r.site===job&&r.client); const client=(row&&row.client)||((JOBS.list.find(j=>j.job===job)||{}).client)||'';
    let p=null; try{ p=await ofPack(client,job); }catch(e){} const rows=OF.rows.filter(r=>r.site===job);
    const norm=s=>String(s||'').trim().toLowerCase();
    const cards=new Set(rows.filter(r=>r.type==='Manhole cards').map(r=>norm(String(r.ref||r.name).replace(/^MH\s+/i,'').split(/\s|·/)[0])));
    const fds=new Set(rows.filter(r=>r.type==='Foundations').map(r=>norm(String(r.ref||r.name).replace(/^FD\s+/i,'').replace(/^plot\s*0*/i,'').split(/\s|·/)[0])));
    const mhs=(p&&p.manholes)||[], plots=(p&&p.plots)||[];
    const chips=(list,has,lab)=>list.map(x=>{ const k=norm(lab(x)); return `<span class="pchip${has.has(k)?' done':''}">${ofEsc(lab(x))}</span>`; }).join('');
    const mhDone=mhs.filter(m=>cards.has(norm(m.ref))).length, plDone=plots.filter(x=>fds.has(norm(String(x.plot).replace(/^0+/,'')))).length;
    box.innerHTML=`<h3>${ofEsc(job)}</h3>
      <p><b>Manhole cards:</b> ${mhDone} of ${mhs.length} on the schedule${mhs.length?'':' (no schedule loaded in Job set-up)'}${cards.size>mhDone?`, plus ${cards.size-mhDone} not on it`:''}</p><div class="pchips">${chips(mhs,cards,m=>m.ref)}</div>
      <p><b>Foundation records:</b> ${plDone} of ${plots.length} plots</p><div class="pchips">${chips(plots,fds,x=>String(x.plot).replace(/^0+/,''))}</div>
      <p class="note">Green has a filed record. Grey has nothing yet.</p>`; }
  // ---- exports, from the sheets themselves: no prices, quantities only ----
  const csvQ=x=>`"${String(x==null?'':x).replace(/"/g,'""')}"`;
  function csvDownload(lines,name){ const blob=new Blob([lines.join('\r\n')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); }
  async function ofSheets(rows,label){ const out=[]; let n=0; for(const r of rows){ n++; $('of-exportst').textContent=`${label}: reading ${n} of ${rows.length}…`; try{ const sh=await ofSheet(r); if(sh) out.push({r,sh}); }catch(e){} } $('of-exportst').textContent=''; return out; }
  const hrs=row=>{ const v=(row||[]).map(x=>parseFloat(x)).filter(x=>!isNaN(x)); return v.length?v[v.length-1]:0; };
  async function ofValuation(){ const rows=ofRows().filter(r=>r.type==='Extras'||r.type==='Dayworks'); if(!rows.length){ toast('No extras or dayworks in this view'); return; }
    const S=await ofSheets(rows,'Valuation'); const L=[['Job','Type','Ref','Work date','Where','Foreman','Who asked','Signed','Signed by','Same work as','Status','Line','What','Size','Quantity','Unit','Ticket','PDF'].map(csvQ).join(',')];
    for(const {r,sh} of S){ const d=sh.data||{}; const f=d.f||[]; const base=t=>[r.site,r.type,r.ref,String(r.date).slice(0,10),r.where,r.foreman,t,r.signed,r.signer,r.linked,r.status];
      if(sh.tool==='aw'){ (d.items||[]).forEach((it,i)=>{ let q={size:'',q:NaN,u:''}; try{ q=awQty(it); }catch(e){} const ty=(typeof AW_TYPES!=='undefined'&&(AW_TYPES[it.t]||AW_TYPES.other))||{n:it.t};
          L.push([...base(f[7]||''),i+1,ty.n+(it.mat?' ('+it.mat+')':'')+(it.desc&&it.auto?': '+it.desc:''),q.size||it.S||'',isNaN(q.q)?(it.Q||''):q.q.toFixed(3),q.u||it.U||'',it.tickets||'',r.link].map(csvQ).join(',')); });
        (d.lab||[]).forEach(x=>L.push([...base(f[7]||''),'','Labour: '+[x[0],x[1]].filter(Boolean).join(', '),'',hrs(x).toFixed(1),'hr','',r.link].map(csvQ).join(',')));
        (d.plant||[]).forEach(x=>L.push([...base(f[7]||''),'','Plant: '+[x[0],x[1]].filter(Boolean).join(', '),'',hrs(x).toFixed(1),'hr','',r.link].map(csvQ).join(','))); }
      else { const who=f[5]||''; L.push([...base(who),'','Description: '+(f[6]||''),'','','','',r.link].map(csvQ).join(','));
        (d.lab||[]).forEach(x=>L.push([...base(who),'','Labour: '+[x[0],x[1]].filter(Boolean).join(', '),'',hrs(x).toFixed(1),'hr','',r.link].map(csvQ).join(',')));
        (d.plant||[]).forEach(x=>L.push([...base(who),'','Plant: '+[x[0],x[1]].filter(Boolean).join(', '),'',hrs(x).toFixed(1),'hr','',r.link].map(csvQ).join(',')));
        (d.mat||[]).forEach(x=>L.push([...base(who),'','Material: '+(x[0]||''),'',x[1]||'',x[2]||'',x[3]||'',r.link].map(csvQ).join(','))); } }
    csvDownload(L,`RJH_valuation_${OF.site||'all'}_${OF.month||today()}.csv`); toast('Downloading: '+S.length+' sheets'); }
  async function ofAsBuilt(){ const rows=ofRows().filter(r=>r.type==='Manhole cards'); if(!rows.length){ toast('No manhole cards in this view'); return; }
    const S=await ofSheets(rows,'As-built'); const L=[['Job','Manhole','System','Date','By','Cover level','Design cover level','Depths measured from','Pipe','In or out','Position (clock)','Diameter','Depth to invert (mm)','Invert level','From / to','Pipe material','Backdrop','Notes','PDF'].map(csvQ).join(',')];
    for(const {r,sh} of S){ const d=sh.data||{}; const f=d.f||[]; const cl=parseFloat(f[6]);
      (d.pipes||[]).forEach((p,i)=>{ const dep=parseFloat(p.depth); const il=p.il!==undefined&&p.il!==''?p.il:(!isNaN(cl)&&!isNaN(dep)?(cl-dep/1000).toFixed(3):'');
        L.push([r.site,f[0],d.sys||'',f[4]||'',f[3]||'',f[6]||'',f[27]||(d.design&&d.design.cl)||'',d.refl||'cover',i+1,p.dir||'',p.pos||'',p.dia||'',p.depth||'',il,p.from||'',p.mat||'',p.bd&&p.bd!=='no'?(p.bdtype||'yes'):'',p.note||'',r.link].map(csvQ).join(',')); });
      if(!(d.pipes||[]).length) L.push([r.site,f[0],d.sys||'',f[4]||'',f[3]||'',f[6]||'','','', '','','','','','','','','','no pipes recorded',r.link].map(csvQ).join(',')); }
    csvDownload(L,`RJH_asbuilt_manholes_${OF.site||'all'}.csv`); toast('Downloading: '+S.length+' cards'); }
  $('of-view').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; OF.view=b.dataset.v; $('of-view').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); ofRender(); });
  $('of-site').addEventListener('change',()=>{ OF.site=$('of-site').value; ofRender(); if(!$('of-progress').hidden) ofProgress(); }); $('of-type').addEventListener('change',()=>{ OF.type=$('of-type').value; ofRender(); }); $('of-month').addEventListener('change',()=>{ OF.month=$('of-month').value; ofRender(); });
  $('of-refresh').addEventListener('click',ofLoad); $('of-prog').addEventListener('click',()=>{ const b=$('of-progress'); if(!b.hidden){ b.hidden=true; return; } ofProgress(); });
  $('of-val').addEventListener('click',ofValuation); $('of-asb').addEventListener('click',ofAsBuilt);
  $('of-csv').addEventListener('click',()=>{ const L=[['Job','Type','Ref','Where','Foreman','Work date','Signed','Signed by','Same work as','Status','Rev','Days old','Notes','PDF'].map(csvQ).join(',')]; ofRows().forEach(r=>L.push([r.site,r.type,r.ref,r.where,r.foreman,ofDate(r.date),r.signed,r.signer,r.linked,r.status,r.rev,ofAge(r.date),r.notes,r.link].map(csvQ).join(','))); csvDownload(L,`RJH_site_sheets_${today()}.csv`); });
  document.querySelector('[data-go="panel-office"]').addEventListener('click',()=>{ if(Date.now()-OF.loaded>60000) ofLoad(); });
  window.ofLoad=ofLoad; window.OF=OF;
