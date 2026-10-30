  // Additional works
  const AW_F=['aw-site','aw-client','aw-loc','aw-date','aw-ref','aw-by','aw-desc','aw-inst','aw-instco','aw-instdate','aw-instref','aw-cname','aw-cpos','aw-nosigwhy','aw-timeval','aw-to','aw-toother','aw-trade'];   // aw-timeval: old slot, kept so saved sheets line up
  const AWV=id=>{ const e=$(id); return e?e.value:''; }, AWS=(id,v)=>{ if($(id)) S(id,v); };
  registerSave('aw',{section:'panel-aw',recalc:awSum,
    name:()=>{ const r=V('aw-ref').trim(), s=V('aw-site').trim(); return r||s?`${r||'Additional works'}${s?' · '+s:''}`:''; }, site:()=>V('aw-site').trim(),
    get:()=>({f:AW_F.map(AWV),items:JSON.parse(JSON.stringify(AW.items)),how:AW.how,nosig:AW.nosig,why:AW.why,lab:rowsOf($('aw-lab')),plant:rowsOf($('aw-plant')),sig:SIGS['aw-sig'].data(),photos:AW.photos,sizes:AW.sizes,links:(AW.links||[]).slice()}),
    set:d=>{ AW_F.forEach((id,i)=>AWS(id,(d.f||[])[i]||'')); if((d.f||[])[15]===undefined) $('aw-to').selectedIndex=0;
      AW.items=(d.items||[]).map(x=>({photos:[],...x})); AW.how=d.how||'Verbal'; AW.nosig=d.nosig||''; AW.why=d.why||''; $('aw-why').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===AW.why)); awWhyUI();
      awSegSet('aw-how','h',AW.how); awSegSet('aw-nosig','n',AW.nosig);
      $('aw-lab').innerHTML=''; (d.lab||[]).forEach(r=>awLab(r)); $('aw-plant').innerHTML=''; (d.plant||[]).forEach(r=>awPlant(r));
      SIGS['aw-sig'].load(d.sig); AW.photos=d.photos||[]; AW.links=(d.links||[]).slice(); if(window.linksDraw) linksDraw('aw'); AW.sizes=d.sizes||''; $('aw-sizes').value=AW.sizes; awNosigUI(); awToUI(); awRender(); awDrawPhotos(); awSizesOut(); awHead(); $('aw-more').open=false; },
    clear:()=>{ AW_F.forEach(id=>{ if(id!=='aw-to') AWS(id,''); }); $('aw-to').selectedIndex=0; S('aw-date',today()); AW.items=[]; AW.how='Verbal'; AW.nosig=''; AW.why=''; $('aw-why').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); awWhyUI();
      awSegSet('aw-how','h','Verbal'); awSegSet('aw-nosig','n',''); $('aw-lab').innerHTML=''; $('aw-plant').innerHTML=''; SIGS['aw-sig'].clear(); AW.photos=[]; AW.links=[]; if(window.linksDraw) linksDraw('aw'); AW.sizes=''; $('aw-sizes').value=''; awNosigUI(); awToUI(); awRender(); awDrawPhotos(); awSizesOut(); $('aw-more').open=false; setTimeout(()=>{ awNextRef(); awHead(); },50); },
    hasContent:d=>d.f&&(d.f[0]||d.f[2]||d.f[6]||d.f[7]||(d.items&&d.items.length)||(d.photos&&d.photos.length)) });
