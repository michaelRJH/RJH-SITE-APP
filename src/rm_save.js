  // Remedials
  const RM_F=['rm-site','rm-client','rm-ref','rm-listdate','rm-from','rm-by','rm-notes','rm-cname','rm-cpos','rm-nosigwhy','rm-to','rm-toother'];
  registerSave('rm',{section:'panel-rm',recalc:rmRender,
    name:()=>{ const r=V('rm-ref').trim(), s=V('rm-site').trim(); return r||s?`${r||'Remedials'}${s?' · '+s:''}`:''; }, site:()=>V('rm-site').trim(),
    get:()=>({f:RM_F.map(V),items:JSON.parse(JSON.stringify(RM.items)),nosig:RM.nosig,sig:SIGS['rm-sig'].data()}),
    set:d=>{ RM_F.forEach((id,i)=>S(id,(d.f||[])[i]||'')); if((d.f||[])[10]===undefined) $('rm-to').selectedIndex=0; RM.items=(d.items||[]).map(x=>({before:[],after:[],st:'open',...x})); RM.nosig=d.nosig||''; $('rm-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.n===RM.nosig)); SIGS['rm-sig'].load(d.sig); rmNosigUI(); rmToUI(); RM.filter='open'; RM.sel=null; $('rm-filter').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f==='open')); rmRender(); if(window.__rmHead) window.__rmHead(); },
    clear:()=>{ RM_F.forEach(id=>{ if(id!=='rm-to') S(id,''); }); $('rm-to').selectedIndex=0; S('rm-listdate',today()); RM.items=[]; RM.nosig=''; RM.sel=null; $('rm-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.n==='')); SIGS['rm-sig'].clear(); rmNosigUI(); rmToUI(); rmRender(); if(window.__rmHead) window.__rmHead(); },
    hasContent:d=>d.f&&(d.f[0]||d.f[2]||(d.items&&d.items.length)) });
