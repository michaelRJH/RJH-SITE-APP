  // ---- Remedials: the client's snag list, closed out one item at a time with how it was fixed and before/after photos ----
  const RM={items:[],nosig:'',filter:'open',keep:null,sel:null};   // keep: the snag just changed stays on screen until the filter is tapped
  const RM_ST=[['open','Open'],['fixed','Fixed'],['notours','Not ours'],['client','Needs the client']];
  const RM_FIX=['Relaid','Replaced','Reset to level','Re-jetted','Re-sealed','Made good','Cleaned','Re-pointed','Topped up','Re-compacted'];
  const rmEsc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const rmStName=s=>(RM_ST.find(x=>x[0]===s)||RM_ST[0])[1];
  const rmShow=it=>RM.filter==='all'||it===RM.keep||(RM.filter==='open'?(it.st==='open'||it.st==='client'):RM.filter==='fixed'?it.st==='fixed':it.st==='notours');
  function rmCounts(){ const c={open:0,fixed:0,notours:0,client:0}; RM.items.forEach(it=>{ c[it.st||'open']=(c[it.st||'open']||0)+1; }); return c; }
  function rmRender(){ const box=$('rm-items'); box.innerHTML='';
    const c=rmCounts(); $('rm-n').textContent=RM.items.length; $('rm-left').textContent=c.open+c.client;
    $('rm-sum').innerHTML=RM.items.length?`<span><b>${RM.items.length}</b> snags</span><span class="rm-k fixed"><b>${c.fixed}</b> fixed</span><span class="rm-k open"><b>${c.open}</b> open</span>${c.client?`<span class="rm-k client"><b>${c.client}</b> need the client</span>`:''}${c.notours?`<span class="rm-k notours"><b>${c.notours}</b> not ours</span>`:''}`:'<span class="note" style="margin:0">No snags yet. Add them one at a time, or paste the client\'s list.</span>';
    let shown=0; const openIdx=RM.items.map((it,i)=>i).filter(i=>RM.items[i].st==='open'||RM.items[i].st==='client');
    RM.items.forEach((it,i)=>{ it.st=it.st||'open'; it.before=it.before||[]; it.after=it.after||[]; if(!rmShow(it)) return; shown++;
      const c=document.createElement('div'); c.className='rm-item st-'+it.st+(RM.sel===i?' sel':''); const title=`${it.where?rmEsc(it.where)+' · ':''}${rmEsc(it.said||'(nothing written)')}`;
      if(RM.sel!==i){ // compact: one tap opens it
        c.innerHTML=`<button type="button" class="rm-row"><span class="rm-no">${rmEsc(it.no||(i+1))}</span><span class="rm-txt">${title}</span><span class="rm-stt">${rmStName(it.st)}${it.after.length||it.before.length?' · 📷':''}</span></button>`;
        c.querySelector('.rm-row').addEventListener('click',()=>{ RM.sel=i; RM.keep=null; rmRender(); const el=$('rm-items').querySelector('.rm-item.sel'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); });
        box.appendChild(c); return; }
      c.innerHTML=`<div class="aw-top"><b>Snag ${rmEsc(it.no||(i+1))}${it.where?' · '+rmEsc(it.where):''}</b><span><button type="button" class="rm-close">Close</button></span></div>
        <p class="rm-said">${rmEsc(it.said||'')}</p>
        <details class="rm-edit"><summary>Change the wording, number or where</summary>
          <div class="grid2"><div class="field"><label>Their number</label><div class="in"><input data-k="no" type="text" value="${rmEsc(it.no)}"></div></div><div class="field"><label>Where</label><div class="in"><input data-k="where" type="text" placeholder="Plot 12 front" value="${rmEsc(it.where)}"></div></div></div>
          <div class="field"><label>What they said is wrong</label><div class="in"><input data-k="said" type="text" value="${rmEsc(it.said)}"></div></div>
          <button type="button" class="x rm-del" style="width:auto;padding:0 12px;height:36px;font-size:14px">Remove this snag</button></details>
        <div class="field"><div class="photos rm-ph" data-ph="before"></div><div class="rm-phbtns"><label class="btn filebtn">📷 Before photo<input type="file" accept="image/*" capture="environment" data-ph="before"></label><label class="btn filebtn">Add from gallery<input type="file" accept="image/*" multiple data-ph="before"></label></div></div>
        <div class="rm-big">${RM_ST.filter(x=>x[0]!=='open').map(([k,n])=>`<button type="button" data-st="${k}" aria-pressed="${it.st===k}">${n}</button>`).join('')}</div>
        ${it.st!=='open'?`<div class="note" style="margin:0 0 8px;text-align:center"><a href="#" class="rm-reopen">Put it back to open</a></div>`:''}
        <div class="rm-fixwrap" ${it.st==='fixed'?'':'hidden'}>
          <div class="field"><label>How we fixed it</label><div class="aw-mats">${RM_FIX.map(f=>`<button type="button" data-fx="${f}" aria-pressed="${(it.fixes||[]).includes(f)}">${f}</button>`).join('')}</div><div class="in" style="margin-top:6px"><input data-k="how" type="text" placeholder="anything else to say" value="${rmEsc(it.how)}"></div></div>
          <div class="field"><div class="photos rm-ph" data-ph="after"></div><div class="rm-phbtns"><label class="btn primary filebtn">📷 After photo<input type="file" accept="image/*" capture="environment" data-ph="after"></label><label class="btn filebtn">Add from gallery<input type="file" accept="image/*" multiple data-ph="after"></label></div></div>
          <details class="rm-edit"><summary>Date and who (${rmEsc(it.date?fmtDate(it.date):'today')}, ${rmEsc(it.who||'')})</summary><div class="grid2"><div class="field"><label>Date fixed</label><div class="in"><input data-k="date" type="date" value="${rmEsc(it.date)}"></div></div><div class="field"><label>Fixed by</label><div class="in"><input data-k="who" type="text" value="${rmEsc(it.who)}"></div></div></div></details>
        </div>
        <div class="rm-whywrap" ${it.st==='notours'||it.st==='client'?'':'hidden'}>
          <div class="field"><label>${it.st==='client'?'What we need from the client':'Why it is not ours'}</label><div class="in"><input data-k="why" type="text" placeholder="${it.st==='client'?'e.g. need the drive clear of materials':'e.g. damaged by the brickies, see photo'}" value="${rmEsc(it.why)}"></div></div>
          ${it.st==='notours'?`<div class="field"><label>Will we do it anyway?</label><div class="seg two rm-extra"><button type="button" data-ex="0" aria-pressed="${!it.extra}">No</button><button type="button" data-ex="1" aria-pressed="${!!it.extra}">Yes, as an extra</button></div></div>`:''}
        </div>
        <button type="button" class="btn primary rm-next" style="margin-top:4px;padding:16px">Next open snag ▸</button>`;
      c.querySelector('.rm-close').addEventListener('click',()=>{ RM.sel=null; RM.keep=null; rmRender(); });
      c.querySelector('.rm-next').addEventListener('click',()=>{ const nx=openIdx.find(k=>k>i)??openIdx.find(k=>k!==i); RM.keep=null; if(nx===undefined){ RM.sel=null; rmRender(); toast('Nothing left open'); return; } RM.sel=nx; rmRender(); const el=$('rm-items').querySelector('.rm-item.sel'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); });
      c.querySelector('.rm-del').addEventListener('click',()=>{ if(!confirm('Remove snag '+(it.no||(i+1))+'?')) return; RM.items.splice(i,1); RM.sel=null; rmRender(); });
      c.querySelectorAll('input[data-k]').forEach(inp=>inp.addEventListener('input',()=>{ it[inp.dataset.k]=inp.value; }));
      c.querySelectorAll('[data-st]').forEach(b=>b.addEventListener('click',()=>{ it.st=it.st===b.dataset.st?'open':b.dataset.st; RM.keep=it; if(it.st==='fixed'){ if(!it.date) it.date=today(); if(!it.who) it.who=$('rm-by').value.trim(); } rmRender(); }));
      const ro=c.querySelector('.rm-reopen'); if(ro) ro.addEventListener('click',e=>{ e.preventDefault(); it.st='open'; RM.keep=it; rmRender(); });
      c.querySelectorAll('[data-fx]').forEach(b=>b.addEventListener('click',()=>{ it.fixes=it.fixes||[]; const k=it.fixes.indexOf(b.dataset.fx); if(k>=0) it.fixes.splice(k,1); else it.fixes.push(b.dataset.fx); b.setAttribute('aria-pressed',k<0); }));
      c.querySelectorAll('[data-ex]').forEach(b=>b.addEventListener('click',()=>{ it.extra=b.dataset.ex==='1'; c.querySelectorAll('[data-ex]').forEach(x=>x.setAttribute('aria-pressed',x===b)); }));
      ['before','after'].forEach(ph=>{ const grid=c.querySelector(`.rm-ph[data-ph="${ph}"]`); if(!grid) return;
        const draw=()=>{ grid.innerHTML=''; it[ph].forEach((p,k)=>{ const w=document.createElement('div'); w.innerHTML=`<img src="${rmEsc(p.d)}"><button type="button" aria-label="Remove">×</button>`; w.querySelector('button').addEventListener('click',()=>{ it[ph].splice(k,1); draw(); }); grid.appendChild(w); }); };
        c.querySelectorAll(`input[type=file][data-ph="${ph}"]`).forEach(inp=>inp.addEventListener('change',async e=>{ for(const f of e.target.files){ it[ph].push({d:await shrink(f),at:new Date().toISOString()}); } e.target.value=''; draw(); c.dispatchEvent(new Event('input',{bubbles:true})); }));
        draw(); });
      box.appendChild(c); });
    if(RM.items.length&&!shown) box.innerHTML=`<p class="note">Nothing ${RM.filter==='open'?'still open':RM.filter==='fixed'?'fixed yet':'marked not ours'}. Tap All to see every snag.</p>`; }
  function rmAdd(seed){ RM.items.push({st:'open',before:[],after:[],no:String(RM.items.length+1),...(seed||{})}); RM.sel=RM.items.length-1; RM.filter=RM.filter==='fixed'||RM.filter==='other'?'open':RM.filter; $('rm-filter').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f===RM.filter)); rmRender();
    const cs=$('rm-items').querySelectorAll('.rm-item'); const last=cs[cs.length-1]; if(last){ last.scrollIntoView({block:'start',behavior:'smooth'}); const d=last.querySelector('details.rm-edit'); if(d&&!seed){ d.open=true; const f=last.querySelector('input[data-k=said]'); if(f) setTimeout(()=>f.focus(),350); } } }
  $('rm-additem').addEventListener('click',()=>rmAdd());
  $('rm-filter').addEventListener('click',e=>{ const b=e.target.closest('[data-f]'); if(!b) return; RM.filter=b.dataset.f; RM.keep=null; RM.sel=null; $('rm-filter').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); rmRender(); });
  $('rm-paste').addEventListener('click',()=>{ $('rm-pastebox').hidden=!$('rm-pastebox').hidden; if(!$('rm-pastebox').hidden) $('rm-pastetxt').focus(); });
  $('rm-pastex').addEventListener('click',()=>{ $('rm-pastebox').hidden=true; });
  $('rm-pastego').addEventListener('click',()=>{ const lines=$('rm-pastetxt').value.split(/\n/).map(l=>l.replace(/^\s*(\d+)[.)]\s*/,'').trim()).filter(Boolean); if(!lines.length){ toast('Nothing to add'); return; }
    lines.forEach(l=>{ const m=l.match(/^(.{2,30}?)\s+[-–:]\s+(.+)$/); RM.items.push({st:'open',before:[],after:[],no:String(RM.items.length+1),where:m?m[1].trim():'',said:m?m[2].trim():l}); });
    $('rm-pastetxt').value=''; $('rm-pastebox').hidden=true; rmRender(); toast(lines.length+' snags added'); });
  $('rm-listdate').value=today();
  $('rm-nosig').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; RM.nosig=b.dataset.n; $('rm-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); rmNosigUI(); });
  const rmNosigUI=()=>{ $('rm-nosigwrap').hidden=!RM.nosig; $('rm-sigfield').style.opacity=RM.nosig?'0.4':''; };
  const rmToUI=()=>{ const sel=$('rm-to'); $('rm-towrap').hidden=sel.value!==''; const nm=sel.options[sel.selectedIndex].text; $('rm-email').textContent=sel.value?'Email '+nm.split(' ')[0]:'Email it'; };
  $('rm-to').addEventListener('change',rmToUI); rmToUI();
  async function rmNames(){ try{ const all=await DB.all(); const names=new Set(); all.forEach(r=>{ const f=(r.data||{}).f||[]; if(r.tool==='rm'){ [f[4],f[7]].forEach(n=>n&&names.add(n)); } if(r.tool==='aw'){ [f[7],f[11]].forEach(n=>n&&names.add(n)); } if(r.tool==='dw'){ [f[5],f[7]].forEach(n=>n&&names.add(n)); } }); $('rm-names').innerHTML=[...names].map(n=>`<option value="${rmEsc(n)}">`).join(''); }catch(e){} }
  document.querySelector('[data-go="panel-rm"]').addEventListener('click',()=>setTimeout(rmNames,50));
  const rmFixText=it=>[...(it.fixes||[]),(it.how||'').trim()].filter(Boolean).join(', ');
  function rmSummary(){ const v=id=>$(id).value.trim(); const c=rmCounts(); const L=[];
    L.push(`Remedials: ${v('rm-ref')||'snag list'} · ${v('rm-site')} · ${fmtDate(v('rm-listdate'))}`); L.push('');
    L.push(`${RM.items.length} snags: ${c.fixed} fixed, ${c.open} open${c.client?', '+c.client+' need the client':''}${c.notours?', '+c.notours+' not ours':''}.`); L.push('');
    RM.items.forEach((it,i)=>{ const h=rmFixText(it); L.push(`${it.no||(i+1)}. ${it.where?it.where+': ':''}${it.said||'–'}`); L.push(`   ${rmStName(it.st)}${it.st==='fixed'?(h?': '+h:'')+(it.date?' ('+fmtDate(it.date)+(it.who?', '+it.who:'')+')':''):(it.why?': '+it.why:'')}${it.st==='notours'&&it.extra?' - will do as an extra':''}`); });
    L.push(''); L.push(RM.nosig?`Not signed: ${RM.nosig}${v('rm-nosigwhy')?', '+v('rm-nosigwhy'):''}`:`Signed off by ${v('rm-cname')||'–'}${v('rm-cpos')?', '+v('rm-cpos'):''}`);
    L.push(`RJH foreman: ${v('rm-by')||'–'}`); L.push(''); L.push('PDF with before and after photos attached.'); return L.join('\n'); }
  $('rm-email').addEventListener('click',()=>{ const to=$('rm-to').value||$('rm-toother').value.trim(); const sub=`Remedials ${$('rm-ref').value.trim()} ${$('rm-site').value.trim()}`.trim();
    location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(rmSummary())}`; });
  function buildRm(){
    const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'}); const W=210,M=16,CW=W-2*M;
    const v=id=>$(id).value.trim(); const date=fmtDate(today()); const c=rmCounts(); const done=RM.items.length&&!c.open&&!c.client;
    let y=pdfHeader(doc,'REMEDIALS CLOSE-OUT',`${v('rm-ref')||'Snag list'}  ·  ${v('rm-site')}  ·  ${date}`);
    y=cellRow(doc,M,y,CW,11,[{label:'Site',value:v('rm-site')||'–',w:CW*0.4},{label:'Client',value:v('rm-client')||'–',w:CW*0.3},{label:'Their list',value:v('rm-ref')||'–',w:CW*0.15,bold:true},{label:'List dated',value:v('rm-listdate')?fmtDate(v('rm-listdate')):'–',w:CW*0.15}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Raised by',value:v('rm-from')||'–',w:CW*0.5},{label:'RJH foreman',value:v('rm-by')||'–',w:CW*0.5}]);
    // summary band
    y+=4; doc.setFillColor(...(done?[30,111,63]:HIVIS)); doc.rect(M,y,CW,12,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...(done?[255,255,255]:INK));
    doc.text(done?`ALL ${RM.items.length} SNAGS CLOSED OUT`:`${RM.items.length} SNAGS  ·  ${c.fixed} FIXED  ·  ${c.open} OPEN${c.client?'  ·  '+c.client+' NEED THE CLIENT':''}${c.notours?'  ·  '+c.notours+' NOT OURS':''}`,M+3,y+8); y+=16;
    if(v('rm-notes')){ doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); const nl=doc.splitTextToSize(v('rm-notes'),CW); doc.text(nl,M,y+3); y+=nl.length*4.2+5; }
    // one block per snag
    const pw=(CW-6)/2, ph=pw*0.7;
    RM.items.forEach((it,i)=>{ const hasPh=it.before.length||it.after.length; const need=22+(hasPh?ph+8:0)+10; if(y+need>278){ doc.addPage(); y=42; }
      doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M,y,W-M,y); y+=5;
      const col=it.st==='fixed'?[30,111,63]:it.st==='notours'?[90,90,86]:[179,38,30];
      doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text(`SNAG ${it.no||(i+1)}${it.where?'  ·  '+it.where:''}`,M,y);
      doc.setTextColor(...col); const stt=rmStName(it.st).toUpperCase()+(it.st==='fixed'&&it.date?'  '+fmtDate(it.date):''); doc.text(stt,W-M,y,{align:'right'}); y+=5;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...GREY); doc.text('They said:',M,y); doc.setTextColor(...INK); const sl=doc.splitTextToSize(it.said||'–',CW-20); doc.text(sl,M+18,y); y+=sl.length*4.2+1;
      const what=it.st==='fixed'?('What we did: '+(rmFixText(it)||'fixed')+(it.who?'  ·  by '+it.who:'')):it.st==='notours'?('Not ours: '+(it.why||'–')+(it.extra?'  ·  will be done as an extra':'')):it.st==='client'?('Needs the client: '+(it.why||'–')):'Still open';
      doc.setFont('helvetica','bold'); doc.setTextColor(...col); const wl=doc.splitTextToSize(what,CW); doc.text(wl,M,y); y+=wl.length*4.2+2;
      if(hasPh){ const cell=(x,p,lab)=>{ doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.rect(x,y,pw,ph); if(p){ try{ doc.addImage(p.d,'JPEG',x+0.5,y+0.5,pw-1,ph-1,undefined,'FAST'); }catch(e){} } else { doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GREY); doc.text('no photo',x+pw/2,y+ph/2,{align:'center'}); }
          doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...INK); doc.text(lab+(p&&p.at?'  ·  '+new Date(p.at).toLocaleDateString('en-GB'):''),x,y+ph+3.8); };
        cell(M,it.before[0],'BEFORE'); cell(M+pw+6,it.after[0],'AFTER'); y+=ph+8;
        const extra=[...it.before.slice(1).map(p=>({p,l:'BEFORE'})),...it.after.slice(1).map(p=>({p,l:'AFTER'}))]; let colk=0;
        extra.forEach(x=>{ if(y+ph+8>278){ doc.addPage(); y=42; colk=0; } cell(M+colk*(pw+6),x.p,x.l); colk++; if(colk===2){ colk=0; y+=ph+8; } }); if(colk===1) y+=ph+8; }
      y+=3; });
    // sign-off
    if(y>222){ doc.addPage(); y=42; } else y=Math.max(y,222);
    const sw=(CW-10)/2;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.setFillColor(...PAPER); doc.rect(M,y,sw,44,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('CLIENT REPRESENTATIVE',M+2.5,y+4);
    if(RM.nosig){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(RM.nosig+(v('rm-nosigwhy')?': '+v('rm-nosigwhy'):''),sw-6),M+3,y+21); }
    else{ const sd=SIGS['rm-sig'].data(); if(sd) try{ doc.addImage(sd,'PNG',M+3,y+6,sw-6,22,undefined,'FAST'); }catch(e){} }
    doc.setDrawColor(...LINE); doc.line(M+3,y+30,M+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(v('rm-cname')||'',M+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(`${v('rm-cpos')||''}${v('rm-cpos')?'  ·  ':''}${date}`,M+3,y+41);
    const x2=M+sw+10; doc.setDrawColor(...INK); doc.setFillColor(...PAPER); doc.rect(x2,y,sw,44,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('FOR R.J. HOWARD ENGINEERS LTD',x2+2.5,y+4);
    doc.setDrawColor(...LINE); doc.line(x2+3,y+30,x2+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(v('rm-by')||'',x2+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(date,x2+3,y+41);
    y+=50; doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize('Remedial works to the client\'s list, carried out and photographed on site. Items marked not ours are outside R.J. Howard\'s works and are listed so the client can see what was pushed back and why.',CW),M,y);
    stampFooters(doc,'rm'); return doc; }
  pdfActions('rm',buildRm,()=>`RJH_Remedials_${($('rm-ref').value.trim()||'list').replace(/\W/g,'')}_${today()}.pdf`,'rm-status',()=>RM.items.length>0);
  $('rm-share2').addEventListener('click',async()=>{ if(!RM.items.length){ toast('Add a snag first'); return; } if(!window.jspdf){ $('rm-status').textContent='PDF tool not loaded. Reload the page.'; return; }
    try{ const o=SAVERS.rm; const data=o.get(); const name=o.name()||'Remedials'; const id=o.currentId||('rm-'+Date.now());
      if(!o.currentId){ try{ await DB.put({id,tool:'rm',name,site:o.site(),date:new Date().toISOString(),created:new Date().toISOString(),data,sent:null,sends:0}); o.currentId=id; }catch(e){} }
      const pdf=buildRm().output('blob'); const pname=`RJH_Remedials_${($('rm-ref').value.trim()||'list').replace(/\W/g,'')}_${today()}.pdf`;
      const js=new Blob([JSON.stringify({rjhSheets:1,exported:new Date().toISOString(),sheets:[{id,tool:'rm',name,site:o.site(),date:new Date().toISOString(),created:new Date().toISOString(),data,sent:null,sends:o.sends||0}]})],{type:'application/json'});
      const files=[new File([pdf],pname,{type:'application/pdf'}),new File([js],`${name.replace(/[^\w-]+/g,'_')}.rjhsheet.json`,{type:'application/json'})];
      if(navigator.canShare&&navigator.canShare({files})){ try{ await navigator.share({files,title:name,text:'Remedials '+name}); markSent('rm'); return; }catch(e){ if(e.name==='AbortError') return; } }
      if(navigator.canShare&&navigator.canShare({files:[files[0]]})){ try{ await navigator.share({files:[files[0]],title:name}); markSent('rm'); return; }catch(e){ if(e.name==='AbortError') return; } }
      files.forEach(f=>{ const url=URL.createObjectURL(f); const a=document.createElement('a'); a.href=url; a.download=f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); }); markSent('rm'); toast('Downloaded instead'); }
    catch(e){ $('rm-status').textContent='PDF error: '+(e.message||e); toast('PDF error'); } });
  // ---- Remedials: load the client's list straight from a spreadsheet (xlsx or csv, e.g. a Field View export) ----
  async function rmUnzip(buf){ // tiny zip reader: enough for an xlsx (deflate or stored)
    const dv=new DataView(buf), u8=new Uint8Array(buf); const out={}; let i=buf.byteLength-22;
    while(i>0&&dv.getUint32(i,true)!==0x06054b50) i--; if(i<=0) throw new Error('not a zip'); const n=dv.getUint16(i+10,true); let p=dv.getUint32(i+16,true);
    for(let k=0;k<n;k++){ if(dv.getUint32(p,true)!==0x02014b50) break; const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), off=dv.getUint32(p+42,true);
      const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl)); p+=46+nl+el+cl;
      const lnl=dv.getUint16(off+26,true), lel=dv.getUint16(off+28,true); const data=u8.subarray(off+30+lnl+lel,off+30+lnl+lel+csize);
      if(/\.xml$/.test(name)){ if(method===0) out[name]=new TextDecoder().decode(data); else if(method===8){ const ds=new DecompressionStream('deflate-raw'); const w=ds.writable.getWriter(); w.write(data); w.close(); out[name]=await new Response(ds.readable).text(); } } }
    return out; }
  const rmXml=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
  function rmXlsxRows(files){ const ss=[]; const sx=files['xl/sharedStrings.xml']||''; sx.replace(/<si>([\s\S]*?)<\/si>/g,(m,b)=>{ ss.push(rmXml((b.match(/<t[^>]*>([\s\S]*?)<\/t>/g)||[]).map(t=>t.replace(/<[^>]+>/g,'')).join(''))); return ''; });
    const sheet=files['xl/worksheets/sheet1.xml']||Object.keys(files).filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort().map(k=>files[k])[0]||''; const rows=[];
    sheet.replace(/<row[^>]*>([\s\S]*?)<\/row>/g,(m,b)=>{ const r=[]; b.replace(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,(mm,col,attrs,inner)=>{ let ci=0; for(const ch of col) ci=ci*26+(ch.charCodeAt(0)-64); const t=(attrs.match(/t="(\w+)"/)||[])[1]; let v='';
        if(inner){ if(t==='s'){ v=ss[+((inner.match(/<v>(.*?)<\/v>/)||[])[1]||0)]||''; } else if(t==='inlineStr'){ v=rmXml((inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[])[1]||''); } else v=rmXml((inner.match(/<v>(.*?)<\/v>/)||[])[1]||''); }
        r[ci-1]=String(v).trim(); return ''; }); rows.push(r); return ''; });
    return rows; }
  function rmCsvRows(txt){ const rows=[]; let r=[],f='',q=false; txt=txt.replace(/^﻿/,'');
    for(let i=0;i<txt.length;i++){ const c=txt[i]; if(q){ if(c==='"'){ if(txt[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; } else if(c==='"') q=true; else if(c===','){ r.push(f.trim()); f=''; } else if(c==='\n'||c==='\r'){ if(c==='\r'&&txt[i+1]==='\n') i++; r.push(f.trim()); rows.push(r); r=[]; f=''; } else f+=c; }
    if(f||r.length){ r.push(f.trim()); rows.push(r); } return rows; }
  function rmPickCols(rows){ // find the header row and guess which column is which
    let hi=rows.findIndex(r=>r.filter(Boolean).length>=2&&r.some(c=>/ref|issue|desc|snag|defect|comment|location|mh|status/i.test(c))); if(hi<0) hi=0; const h=rows[hi].map(c=>(c||'').toLowerCase());
    const find=(...re)=>{ for(const x of re){ const k=h.findIndex(c=>x.test(c)); if(k>=0) return k; } return -1; };
    let said=find(/issue|description|defect|snag|comment|detail|problem/,/^desc/); let where=find(/^mh|manhole|location|plot|where|area|sheet/); let no=find(/^ref|reference|^no\.?$|^id$|number/); let st=find(/status/); let to=find(/issued to|assigned|contractor|responsib/);
    if(said<0){ // longest text column
      const len=h.map((_,k)=>rows.slice(hi+1).reduce((a,r)=>a+((r[k]||'').length),0)); said=len.indexOf(Math.max(...len)); }
    if(no===said) no=-1; if(where===said) where=-1; return {hi,said,where,no,st,to}; }
  function rmImportRows(rows,fileName){ const {hi,said,where,no,st,to}=rmPickCols(rows); const body=rows.slice(hi+1).filter(r=>(r[said]||'').trim());
    const closed=r=>st>=0&&/signed off|closed|complete|done|resolved/i.test(r[st]||''); const open=body.filter(r=>!closed(r)); const skipped=body.length-open.length;
    const named=to>=0&&open.some(r=>/howard|rjh/i.test(r[to]||''));   // if the list names RJH on some rows, rows naming nobody are not ours
    const toUs=r=>to<0||/howard|rjh/i.test(r[to]||'')||(!named&&!(r[to]||'').trim()); const ours=open.filter(toUs); const notOurs=open.length-ours.length;
    if(!ours.length){ toast(skipped?'Every item on that list is already signed off':'Could not find the snags in that file'); return; }
    const before=RM.items.length;
    ours.forEach((r,i)=>{ let n=(no>=0?r[no]:'')||String(before+i+1); n=n.replace(/^[A-Z]\d{5,}\./i,'').replace(/^T1\./i,''); RM.items.push({no:n,where:where>=0?(r[where]||''):'',said:r[said],st:'open',before:[],after:[]}); });
    if(!$('rm-ref').value.trim()) $('rm-ref').value=fileName.replace(/\.(xlsx|csv)$/i,'').replace(/^Copy of /i,'').replace(/_/g,' ').slice(0,60);
    if(notOurs){ const nt=$('rm-notes'); nt.value=(nt.value?nt.value+'\n':'')+`${notOurs} open item${notOurs>1?'s':''} on the list ${notOurs>1?'are':'is'} not issued to RJH, so not loaded.`; }
    RM.filter='open'; $('rm-filter').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f==='open')); rmRender();
    toast(`${ours.length} snags loaded`+(skipped?`, ${skipped} already signed off skipped`:'')); }
  $('rm-xlsx').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ let rows; if(/\.csv$/i.test(f.name)||/csv|text/.test(f.type)) rows=rmCsvRows(await f.text()); else { if(typeof DecompressionStream==='undefined') throw new Error('old'); rows=rmXlsxRows(await rmUnzip(await f.arrayBuffer())); }
      rmImportRows(rows,f.name); }
    catch(err){ toast(err.message==='old'?'This phone cannot read xlsx. Save the list as CSV and load that.':'Could not read that file. Save it as CSV and try again.'); } });
  // the list header folds to one line once the site is in, so the snags are at the top of the screen
  (function(){ const grid=$('rm-site').closest('.grid2'), notes=$('rm-notes').closest('.field'); if(!grid) return;
    const line=document.createElement('div'); line.className='fd-dsum'; line.style.cssText='border:2px solid var(--line);border-radius:var(--r);padding:10px 12px;display:flex;gap:10px;align-items:center;justify-content:space-between;margin:0 0 6px'; grid.before(line); let force=false;
    const v=id=>$(id).value.trim();
    function upd(){ const full=v('rm-site')&&!force; line.hidden=!full; grid.hidden=full; notes.hidden=full;
      if(full) line.innerHTML=`<div style="min-width:0"><b>${rmEsc(v('rm-site'))}${v('rm-client')?' · '+rmEsc(v('rm-client')):''}</b><div class="note" style="margin:2px 0 0;overflow-wrap:anywhere">${rmEsc(v('rm-ref')||'Snag list')}${v('rm-listdate')?' · '+fmtDate(v('rm-listdate')):''}${v('rm-notes')?' · '+rmEsc(v('rm-notes').slice(0,80))+(v('rm-notes').length>80?'…':''):''}</div></div><button type="button" class="btn" style="margin:0;width:auto;padding:8px 12px">Change</button>`;
      const b=line.querySelector('button'); if(b) b.onclick=()=>{ force=true; upd(); }; }
    // fold only once you have left the whole block, not as soon as one box is done
    const inside=()=>{ const a=document.activeElement; return a&&(grid.contains(a)||notes.contains(a)); };
    [grid,notes].forEach(el=>el.addEventListener('focusout',()=>setTimeout(()=>{ if(!inside()){ force=false; upd(); } },250)));
    window.__rmHead=()=>{ force=false; upd(); }; setTimeout(upd,300); })();
