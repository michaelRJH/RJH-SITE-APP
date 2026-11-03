  // ---- Foundation record (v78): plot, dig, pour, photos, NHBC sign off. Design levels come from the job's schedule ----
  const FR={corners:[],photos:[],nosig:'',design:null};   // corners: [{k:'A',design:'101.000',dug:'',from:'',why:''}]  from/why: the design was changed on site
  const frEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const frNum=v=>{ const n=parseFloat(v); return isNaN(n)?NaN:n; };
  const frMm=(a,b)=>{ const x=frNum(a), y=frNum(b); return isNaN(x)||isNaN(y)?null:Math.round((x-y)*1000); };
  const frDiffText=(dug,design)=>{ const d=frMm(dug,design); if(d===null) return {t:'',k:''}; if(Math.abs(d)<=25) return {t:'On level ('+(d>0?'+':'')+d+' mm)',k:'ok'}; return d<0?{t:(-d)+' mm deeper than design',k:'deep'}:{t:d+' mm higher than design',k:'high'}; };
  function frPlotRec(plot){ const p=(typeof PACK!=='undefined')&&PACK.get(); if(!p) return null; const q=String(plot||'').trim().replace(/^plot\s*/i,'').replace(/\s+/g,'').toUpperCase(); return (p.plots||[]).find(x=>String(x.plot).replace(/\s+/g,'').toUpperCase()===q)||null; }
  // the plot picked: fill the house type and the design levels, unless the sheet already has them
  function frFromPlot(force){ const x=frPlotRec($('fr-plot').value); FR.design=x&&x.design||null; const info=$('fr-plotinfo');
    if(!x){ info.hidden=true; frCorners(); return; }
    const d=x.design||{}; if(force||!$('fr-type').value.trim()) $('fr-type').value=[x.type,x.hand].filter(Boolean).join(' ');
    if(d.toc!=null&&(force||!$('fr-tocd').value)) $('fr-tocd').value=(+d.toc).toFixed(3);
    const corners=Object.keys(d.under||{});
    if(force||!FR.corners.length){ FR.corners=corners.map(k=>({k,design:(+d.under[k]).toFixed(3),dug:'',from:'',why:''})); }
    else { corners.forEach(k=>{ const c=FR.corners.find(c=>c.k===k); if(c&&!c.design&&!c.from) c.design=(+d.under[k]).toFixed(3); }); }
    info.hidden=false; info.innerHTML=`<b>Plot ${frEsc(x.plot)}: ${frEsc(x.type)}${x.hand?' ('+frEsc(x.hand)+')':''}</b><span>${frEsc(d.found||'')}${d.depth?' · about '+frEsc(d.depth)+' m deep':''}${d.ffl!=null?' · FFL '+(+d.ffl).toFixed(3):''}${d.strata?' · onto '+frEsc(d.strata):''}${d.borehole?' ('+frEsc(d.borehole)+')':''}</span>`;
    frCorners(); frToc(); }
  function frCorners(){ const box=$('fr-corners'); box.innerHTML='';
    if(!FR.corners.length){ box.innerHTML='<p class="note fr-note">No design levels for this plot on the job yet. Add the corners you measured.</p>'; return; }
    const head=document.createElement('div'); head.className='fr-row fr-head'; head.innerHTML='<span>Corner</span><span>Design underside</span><span>Dug to</span><span></span>'; box.appendChild(head);
    FR.corners.forEach((c,i)=>{ const r=document.createElement('div'); r.className='fr-row'; const df=frDiffText(c.dug,c.design);
      r.innerHTML=`<div class="in fr-k"><input type="text" value="${frEsc(c.k)}" maxlength="4" aria-label="Corner"></div>
        <div class="fr-des"><div class="in"><input type="number" inputmode="decimal" step="0.001" value="${frEsc(c.design)}" ${c.from||!FR.design?'':'readonly'} aria-label="Design level" placeholder="design"></div>${FR.design&&!c.from?'<button type="button" class="fr-chg">Change</button>':''}${c.from?`<small class="fr-was">was ${frEsc(c.from)}${c.why?': '+frEsc(c.why):''}</small>`:''}</div>
        <div class="in"><input type="number" inputmode="decimal" step="0.001" value="${frEsc(c.dug)}" aria-label="Dug level" placeholder="measured"></div>
        <button type="button" class="fr-x" aria-label="Remove">×</button><div class="fr-out" data-k="${df.k}"><span>${df.t}</span></div>`;
      const [ik,id,ig]=r.querySelectorAll('input');
      ik.addEventListener('input',()=>{ c.k=ik.value.trim().toUpperCase(); ik.value=c.k; });
      id.addEventListener('input',()=>{ c.design=id.value; const o=frDiffText(c.dug,c.design); const out=r.querySelector('.fr-out'); out.firstChild.textContent=o.t; out.dataset.k=o.k; });
      ig.addEventListener('input',()=>{ c.dug=ig.value; const o=frDiffText(c.dug,c.design); const out=r.querySelector('.fr-out'); out.firstChild.textContent=o.t; out.dataset.k=o.k; });
      const ch=r.querySelector('.fr-chg'); if(ch) ch.addEventListener('click',()=>{ const why=prompt('Design level at '+c.k+' changed on site. Why, and who said? (e.g. soft spot, deepen 300, J Smith AWP)'); if(why===null) return; c.from=c.design; c.why=why.trim(); frCorners(); setTimeout(()=>{ const rr=box.querySelectorAll('.fr-row')[i+1]; if(rr) rr.querySelectorAll('input')[1].focus(); },50); });
      r.querySelector('.fr-x').addEventListener('click',()=>{ FR.corners.splice(i,1); frCorners(); $('panel-fr').dispatchEvent(new Event('change')); });
      box.appendChild(r); }); }
  function frToc(){ const o=$('fr-tocout'); const df=frDiffText($('fr-toc').value,$('fr-tocd').value); o.hidden=!df.t; o.textContent=df.t?'Top of concrete: '+df.t:''; o.dataset.k=df.k; }
  ['fr-toc','fr-tocd'].forEach(id=>$(id).addEventListener('input',frToc));
  $('fr-addcorner').addEventListener('click',()=>{ const used=new Set(FR.corners.map(c=>c.k)); const k=[...'ABCDEFGHJKLM'].find(x=>!used.has(x))||''; FR.corners.push({k,design:'',dug:'',from:'',why:''}); frCorners(); const rows=$('fr-corners').querySelectorAll('.fr-row'); const last=rows[rows.length-1]; if(last) last.querySelectorAll('input')[2].focus(); });
  $('fr-plot').addEventListener('change',()=>frFromPlot(false)); $('fr-plot').addEventListener('blur',()=>frFromPlot(false));
  const frNosigUI=()=>{ $('fr-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.n===FR.nosig)); $('fr-nosigwrap').hidden=!FR.nosig; $('fr-sigfield').style.opacity=FR.nosig?'0.4':''; };
  $('fr-nosig').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; FR.nosig=(FR.nosig===b.dataset.n)?'':b.dataset.n; frNosigUI(); });
  const frRender=photoStore('fr-photo','fr-photos',()=>FR.photos);
  (function(){ const cam=$('fr-photo-cam'), inp=$('fr-photo'); cam.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; try{ const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.dispatchEvent(new Event('change')); }catch(err){ toast('Could not take that photo'); } e.target.value=''; }); })();
  // the job's plots, with which have a record: tap one to start its sheet
  async function frList(){ const box=$('fr-joblist'); if(!box) return; const p=(typeof PACK!=='undefined')&&PACK.get(); const plots=(p&&p.plots)||[]; if(!plots.length){ box.hidden=true; return; }
    const s=SITE.get(); const norm=v=>String(v||'').replace(/^plot\s*/i,'').replace(/^0+(\d)/,'$1').replace(/\s+/g,'').toUpperCase(); const done=new Set();
    try{ (await DB.all()).filter(r=>(r.tool==='fr'||r.tool==='fd')&&String(r.job||r.site||'').toLowerCase()===String(s.job||'').toLowerCase()).forEach(r=>{ const f=(r.data||{}).f||[]; done.add(norm(r.tool==='fr'?f[4]:f[2])); }); }catch(e){}
    const reg=JOBREG.get(s.job); ((reg&&reg.rows)||[]).filter(x=>x.type==='Foundations').forEach(x=>done.add(norm(String(x.ref||x.title||'').replace(/^FD\s+/i,'').split(/\s·|·/)[0])));
    const houses=plots.filter(x=>!x.garage), gar=plots.filter(x=>x.garage); const n=plots.filter(x=>done.has(norm(x.plot))).length;
    const cur=norm($('fr-plot').value);
    const chips=list=>list.map(x=>{ const d=done.has(norm(x.plot)); return `<button type="button" class="mhchip${d?' done':''}${norm(x.plot)===cur?' cur':''}" data-r="${frEsc(x.plot)}">${frEsc(x.plot)}${d?' ✓':''}</button>`; }).join('');
    box.hidden=false; box.innerHTML=`<details${!cur?' open':''}><summary>Plots on this job <small>${n} of ${plots.length} have a record</small></summary><div class="in" style="margin:6px 0"><input type="search" id="fr-find" placeholder="Find a plot" inputmode="numeric"></div><div class="mhchips" id="fr-chips">${chips(houses)}</div>${gar.length?`<small class="fr-sub">Garages</small><div class="mhchips">${chips(gar)}</div>`:''}</details>`;
    $('fr-find').addEventListener('input',()=>{ const q=norm($('fr-find').value); box.querySelectorAll('.mhchip').forEach(b=>{ b.hidden=!!q&&!norm(b.dataset.r).startsWith(q); }); });
    box.querySelectorAll('.mhchip').forEach(b=>b.addEventListener('click',async()=>{ const o=SAVERS.fr; const curp=$('fr-plot').value.trim(); if(curp&&norm(curp)===norm(b.dataset.r)) return;
      const have=(await DB.all()).filter(r=>r.tool==='fr'&&norm(((r.data||{}).f||[])[4])===norm(b.dataset.r)).sort((a,b2)=>b2.date.localeCompare(a.date))[0];
      if(curp||o.currentId){ try{ await saveQuiet('fr'); }catch(e){} if(o.currentId&&window.syncEnqueue) syncEnqueue('fr',o.currentId); }
      if(have){ o.set(have.data); o.currentId=have.id; o.rev=have.rev||0; toast('Opened plot '+b.dataset.r); }
      else { o.clear(); o.currentId=null; o.rev=0; if(PREFILL.fr) prefill(PREFILL.fr); $('fr-plot').value=b.dataset.r; frFromPlot(true); toast('New record for plot '+b.dataset.r); }
      if(o._strip) o._strip(); syncStatus(); frList(); window.scrollTo(0,0); })); }
  window.frList=frList;
  document.querySelector('[data-go="panel-fr"]').addEventListener('click',()=>setTimeout(()=>{ frList(); if(!$('fr-date').value) $('fr-date').value=today(); },80));
  // ---- the printed record ----
  function buildFr(){ const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'}); const W=210,M=16,CW=W-2*M; const v=id=>$(id).value.trim(); const x=frPlotRec(v('fr-plot')); const d=(x&&x.design)||{};
    const plot=v('fr-plot').replace(/^plot\s*/i,''); let y=pdfHeader(doc,'FOUNDATION RECORD',`Plot ${plot||'?'}  ·  ${fmtDate(v('fr-date'))}  ·  ${v('fr-site')}`);
    y=cellRow(doc,M,y,CW,11,[{label:'Site',value:v('fr-site')||'–',w:CW*0.34},{label:'Client',value:v('fr-client')||'–',w:CW*0.26},{label:'Plot',value:plot||'–',w:CW*0.14,bold:true},{label:'House type',value:v('fr-type')||'–',w:CW*0.26,bold:true}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Foundation',value:d.found||'–',w:CW*0.26},{label:'Design depth',value:d.depth?d.depth+' m':'–',w:CW*0.18},{label:'Onto',value:[d.strata,d.borehole].filter(Boolean).join(', ')||'–',w:CW*0.3},{label:'FFL',value:d.ffl!=null?(+d.ffl).toFixed(3):'–',w:CW*0.26}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Recorded by',value:v('fr-by')||'–',w:CW*0.34},{label:'Dug on',value:v('fr-digdate')?fmtDate(v('fr-digdate')):'–',w:CW*0.22},{label:'Poured on',value:v('fr-pourdate')?fmtDate(v('fr-pourdate')):'–',w:CW*0.22},{label:'Inspected',value:v('fr-inspdate')?fmtDate(v('fr-inspdate')):'–',w:CW*0.22}]);
    y+=6; const H=(t)=>{ doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(t,M,y); y+=2.5; };
    const table=(cols,rows)=>{ let cx=M; doc.setFillColor(...INK); doc.rect(M,y,CW,6,'F'); doc.setFontSize(6.5); doc.setTextColor(...PAPER); cols.forEach(c=>{ doc.text(c.l.toUpperCase(),cx+2.5,y+4); cx+=c.w; }); y+=6;
      rows.forEach((r,i)=>{ if(y>262){ doc.addPage(); y=42; } doc.setFillColor(...(i%2?PAPER:[255,255,255])); doc.setDrawColor(...LINE); doc.setLineWidth(0.25); doc.rect(M,y,CW,7,'FD'); cx=M; cols.forEach((c,k)=>{ doc.setFont('helvetica',r.bold&&r.bold[k]?'bold':'normal'); let fs=9; doc.setFontSize(fs); doc.setTextColor(...(r.red&&r.red[k]?[179,38,30]:INK)); let txt=String(r.v[k]||'–'); while(doc.getTextWidth(txt)>c.w-4&&fs>6){ fs-=0.5; doc.setFontSize(fs); } while(doc.getTextWidth(txt)>c.w-4&&txt.length>4) txt=txt.slice(0,-2)+'…'; doc.text(txt,cx+2,y+5); cx+=c.w; }); y+=7; }); y+=5; };
    H('DIG: LEVELS AT EACH CORNER (m AOD)');
    table([{l:'Corner',w:CW*0.09},{l:'Design',w:CW*0.14},{l:'Dug to',w:CW*0.14},{l:'Difference',w:CW*0.27},{l:'Design changed on site',w:CW*0.36}],
      FR.corners.map(c=>{ const df=frDiffText(c.dug,c.design); return {v:[c.k,c.design||'',c.dug||'',df.t||'',c.from?`was ${c.from}${c.why?': '+c.why:''}`:''],bold:[true,false,true,false,false],red:[false,false,false,df.k==='high',!!c.from]}; }));
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    const line=(lab,val)=>{ if(!val) return; doc.setFont('helvetica','bold'); doc.text(lab,M,y); doc.setFont('helvetica','normal'); const L=doc.splitTextToSize(val,CW-40); doc.text(L,M+40,y); y+=L.length*4.5+1.5; };
    line('Ground at the bottom',v('fr-ground')); line('Dug deeper or wider',v('fr-deeper')); y+=4;
    H('POUR'); const tdf=frDiffText(v('fr-toc'),v('fr-tocd'));
    y=cellRow(doc,M,y,CW,11,[{label:'Mix',value:v('fr-mix')||'–',w:CW*0.16},{label:'Delivered m3',value:v('fr-m3')||'–',w:CW*0.16},{label:'Tickets',value:v('fr-tickets')||'–',w:CW*0.28},{label:'Top of concrete, design',value:v('fr-tocd')||'–',w:CW*0.2},{label:'Poured',value:v('fr-toc')||'–',w:CW*0.2,bold:true}]);
    if(tdf.t){ doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...(tdf.k==='high'?[179,38,30]:INK)); doc.text('Top of concrete: '+tdf.t,M,y+5); y+=6; }
    y+=6; y=pdfPhotos(doc,FR.photos,y,'PHOTOS');
    if(y>215){ doc.addPage(); y=42; } else y=Math.max(y,215);
    const sw=(CW-10)/2;
    const sig=(x0,title,name,sub,data,ns)=>{ doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.setFillColor(...PAPER); doc.rect(x0,y,sw,44,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text(title.toUpperCase(),x0+2.5,y+4);
      if(ns){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',x0+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(ns,sw-6),x0+3,y+21); }
      else if(data) try{ doc.addImage(data,'PNG',x0+3,y+6,sw-6,22,undefined,'FAST'); }catch(e){}
      doc.setDrawColor(...LINE); doc.line(x0+3,y+30,x0+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(name||'',x0+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(sub||'',x0+3,y+41); };
    const ns=FR.nosig||(SIGS['fr-sig1'].has()?'':'Not signed yet');
    sig(M,'NHBC inspector',v('fr-insp'),v('fr-inspdate')?fmtDate(v('fr-inspdate')):'',ns?null:SIGS['fr-sig1'].data(),ns?ns+(v('fr-nosigwhy')?': '+v('fr-nosigwhy'):''):'');
    sig(M+sw+10,'For R.J. Howard Engineers Ltd',v('fr-by'),fmtDate(v('fr-date')),SIGS['fr-sig2'].data(),'');
    y+=50; doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize('Record of the foundation as dug and poured, against the engineer\'s schedule. Signature confirms the record of work done and levels measured. Value and entitlement per the contract.'+(v('fr-notes')?'  Notes: '+v('fr-notes'):''),CW),M,y);
    stampFooters(doc,'fr'); return doc; }
  pdfActions('fr',buildFr,()=>`RJH_Foundation_Plot${($('fr-plot').value.trim()||'').replace(/\W/g,'')}_${$('fr-date').value}.pdf`,'fr-status',()=>!!$('fr-plot').value.trim());
  const FR_F=['fr-site','fr-client','fr-by','fr-date','fr-plot','fr-type','fr-digdate','fr-ground','fr-deeper','fr-pourdate','fr-mix','fr-m3','fr-tickets','fr-tocd','fr-toc','fr-insp','fr-inspdate','fr-nosigwhy','fr-notes'];
  registerSave('fr',{section:'panel-fr',
    name:()=>{ const p=$('fr-plot').value.trim().replace(/^plot\s*/i,''); return p?`Plot ${p}${$('fr-type').value.trim()?' · '+$('fr-type').value.trim():''}`:''; }, site:()=>$('fr-site').value.trim(),
    get:()=>({f:FR_F.map(id=>$(id).value),corners:JSON.parse(JSON.stringify(FR.corners)),photos:FR.photos.slice(),nosig:FR.nosig,sig1:SIGS['fr-sig1'].data(),sig2:SIGS['fr-sig2'].data(),design:FR.design}),
    set:d=>{ FR_F.forEach((id,i)=>{ $(id).value=(d.f||[])[i]||''; }); FR.corners=(d.corners||[]).map(c=>({from:'',why:'',...c})); FR.photos=(d.photos||[]).slice(); FR.nosig=d.nosig||''; FR.design=d.design||null; frNosigUI(); frRender(); SIGS['fr-sig1'].load(d.sig1); SIGS['fr-sig2'].load(d.sig2); frFromPlot(false); frCorners(); frToc(); },
    clear:()=>{ FR_F.forEach(id=>{ $(id).value=''; }); $('fr-date').value=today(); FR.corners=[]; FR.photos=[]; FR.nosig=''; FR.design=null; frNosigUI(); frRender(); SIGS['fr-sig1'].clear(); SIGS['fr-sig2'].clear(); $('fr-plotinfo').hidden=true; frCorners(); frToc(); },
    hasContent:d=>!!(d.f&&(d.f[4]||d.f[8]||d.f[11])||(d.corners||[]).some(c=>c.dug)||(d.photos||[]).length) });
  window.FR=FR; window.frFromPlot=frFromPlot;
