  // ---- Office (v67): the Site records register from RJH-Site, with status, and Open to pull any sheet into this app ----
  const OF={rows:[],view:'toprice',site:'',type:'',loaded:0};
  const OF_STATUS=['New','Checked','Priced','On valuation'];
  const ofEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ofAge=d=>Math.floor((Date.now()-Date.parse(d))/864e5);
  async function ofLoad(){ const box=$('of-list'); if(!(await AUTH.token())){ box.innerHTML='<p class="note">Sign in on the home screen first.</p>'; return; }
    box.innerHTML='<p class="note">Loading the register…</p>';
    try{ let url=`/sites/${M365.siteId}/lists/${M365.listId}/items?$expand=fields($select=Title,Site,Type,By,SheetDate,SheetId,Status,Link,Notes)&$top=500&$orderby=createdDateTime desc`; const rows=[];
      while(url){ const r=await graph(url,{headers:{Prefer:'HonorNonIndexedQueriesWarningMayFailRandomly'}}); (r.value||[]).forEach(it=>{ const f=it.fields||{}; rows.push({id:it.id,name:f.Title||'',site:f.Site||'',type:f.Type||'',by:f.By||'',date:f.SheetDate||it.createdDateTime,sheetId:f.SheetId||'',status:f.Status||'New',link:(f.Link&&f.Link.Url)||'',notes:f.Notes||'',created:it.createdDateTime,modified:it.lastModifiedDateTime}); }); url=r['@odata.nextLink']||''; }
      OF.rows=rows; OF.loaded=Date.now(); ofFilters(); ofRender(); }
    catch(e){ box.innerHTML='<p class="note">Could not read the register: '+ofEsc(e.message||e)+'</p>'; } }
  function ofFilters(){ const sites=[...new Set(OF.rows.map(r=>r.site).filter(Boolean))].sort(), types=[...new Set(OF.rows.map(r=>r.type).filter(Boolean))].sort();
    const fill=(id,items,cur,all)=>{ const s=$(id); s.innerHTML=`<option value="">${all}</option>`+items.map(x=>`<option value="${ofEsc(x)}"${x===cur?' selected':''}>${ofEsc(x)}</option>`).join(''); };
    fill('of-site',sites,OF.site,'All sites'); fill('of-type',types,OF.type,'All types'); }
  function ofRows(){ const me=(AUTH.who()||'').toLowerCase(); return OF.rows.filter(r=>(!OF.site||r.site===OF.site)&&(!OF.type||r.type===OF.type)&&(OF.view==='all'||(OF.view==='new'&&r.status==='New')||(OF.view==='toprice'&&(r.status==='New'||r.status==='Checked'))||(OF.view==='mine'&&r.by.toLowerCase()===me))); }
  function ofRender(){ const box=$('of-list'); const rows=ofRows(); const now=new Date();
    $('of-n-toprice').textContent=OF.rows.filter(r=>r.status==='New'||r.status==='Checked').length; $('of-n-old').textContent=OF.rows.filter(r=>(r.status==='New'||r.status==='Checked')&&ofAge(r.date)>14).length; $('of-n-month').textContent=OF.rows.filter(r=>{ const d=new Date(r.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
    if(!rows.length){ box.innerHTML='<p class="note">Nothing here.</p>'; return; } box.innerHTML='';
    const bySite={}; rows.forEach(r=>{ (bySite[r.site||'No site']=bySite[r.site||'No site']||[]).push(r); });
    Object.keys(bySite).sort().forEach(site=>{ const g=document.createElement('div'); g.className='savegroup'; g.textContent=site; box.appendChild(g);
      bySite[site].forEach(r=>{ const age=ofAge(r.date); const row=document.createElement('div'); row.className='of-row'+((r.status==='New'||r.status==='Checked')&&age>14?' old':'');
        row.innerHTML=`<div class="of-top"><div><b>${ofEsc(r.name)}</b><small>${ofEsc(r.type)} · ${ofEsc(r.by)} · ${new Date(r.date).toLocaleDateString('en-GB')}${age>0?' · '+age+' day'+(age>1?'s':'')+' ago':' · today'}</small></div>
          <div class="of-btns">${r.link?`<a class="btn" href="${ofEsc(r.link)}" target="_blank" rel="noopener">PDF</a>`:''}<button type="button" class="btn primary of-open">Open</button></div></div>
          <div class="of-status">${OF_STATUS.map(s=>`<button type="button" data-s="${s}" aria-pressed="${r.status===s}">${s}</button>`).join('')}</div>
          ${r.notes?`<div class="note of-notes">${ofEsc(r.notes)}</div>`:''}`;
        row.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',async()=>{ const s=b.dataset.s; if(s===r.status) return; const old=r.status; r.status=s; row.querySelectorAll('[data-s]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.s===s));
          try{ await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items/${r.id}/fields`,{method:'PATCH',json:{Status:s}}); toast(r.name+': '+s); ofRender(); }catch(e){ r.status=old; row.querySelectorAll('[data-s]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.s===old)); toast('Could not change it: '+(e.message||e)); } }));
        row.querySelector('.of-open').addEventListener('click',()=>ofOpen(r));
        box.appendChild(row); }); }); }
  // pull the sheet file that sits next to the PDF and open it in the right tool
  async function ofOpen(r){ if(!r.link){ toast('No file link on this row'); return; } toast('Fetching the sheet…');
    try{ const u=new URL(r.link); const dec=decodeURIComponent(u.pathname); const i=dec.indexOf('/Shared Documents/'); if(i<0) throw new Error('unexpected link'); const pdfPath=dec.slice(i+'/Shared Documents/'.length); const jsonPath=pdfPath.replace(/\.pdf$/i,'.rjhsheet.json');
      const meta=await graph(`/drives/${await driveId()}/root:/${gpath(jsonPath)}?$select=id,@microsoft.graph.downloadUrl`); const dl=meta['@microsoft.graph.downloadUrl']; if(!dl) throw new Error('no download url');
      const j=await (await fetch(dl)).json(); const sh=(j.sheets||[])[0]; if(!sh||!SAVERS[sh.tool]) throw new Error('not a sheet file');
      const o=SAVERS[sh.tool]; try{ await saveQuiet(sh.tool); }catch(e){} const have=await DB.get(sh.id).catch(()=>null); if(!have||have.date<=sh.date) await DB.put({...(have||{}),...sh,loaded:sh.date,synced:sh.date,fromOffice:true});
      o.set(sh.data); o.currentId=sh.id; o.sends=sh.sends||0; go(o.section); const st=$(o.section).querySelector('.s-state'); if(st) st.textContent='from SharePoint'; toast('Opened '+(sh.name||r.name)); }
    catch(e){ toast('Could not open it: '+(e.message||e)); } }
  $('of-view').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; OF.view=b.dataset.v; $('of-view').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); ofRender(); });
  $('of-site').addEventListener('change',()=>{ OF.site=$('of-site').value; ofRender(); }); $('of-type').addEventListener('change',()=>{ OF.type=$('of-type').value; ofRender(); });
  $('of-refresh').addEventListener('click',ofLoad);
  $('of-csv').addEventListener('click',()=>{ const q=x=>`"${String(x==null?'':x).replace(/"/g,'""')}"`; const L=[['Site','Type','Sheet','By','Date','Status','Days old','PDF'].map(q).join(',')]; ofRows().forEach(r=>L.push([r.site,r.type,r.name,r.by,new Date(r.date).toLocaleDateString('en-GB'),r.status,ofAge(r.date),r.link].map(q).join(','))); const blob=new Blob([L.join('\r\n')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`RJH_site_register_${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); });
  document.querySelector('[data-go="panel-office"]').addEventListener('click',()=>{ if(Date.now()-OF.loaded>60000) ofLoad(); });
  window.ofLoad=ofLoad; window.OF=OF;
