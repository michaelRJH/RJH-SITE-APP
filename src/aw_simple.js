  // ---- Additional works, the simple screen (v64): one sizes box that turns into measured items, photos on the sheet, a header strip ----
  AW.photos=AW.photos||[]; AW.sizes=AW.sizes||'';
  const AW_KINDS=[ // first match wins; the regex runs on the lower-case line
    [/type ?1|6f2|crushed|clean stone|\bstone\b|\bfill\b|sub.?base|hardcore|mot/,'layer'],
    [/concrete|\bconc\b|gen ?[13]|c25|c32|st2|blind/,'conc'],
    [/\bdig|excavat|soft spot|muck|strip|\bdug\b/,'dig'],
    [/pipe|drain|duct|sewer|gull(y|ey|ies)|connection/,'pipe'],
    [/flag|pav|block/,'pave'],
    [/kerb|edging|channel/,'kerb'],
    [/\bloads?\b|wagon|tipp/,'loads'],
    [/\bhrs?\b|hours?|standing|waiting|attend|sweep|clean/,'hours'],
    [/topsoil|membrane|seed|turf|\barea\b|geotex|tarmac|macadam|plane/,'area'],
    [/\bnr\b|number|cover|manhole|post|raise|lower|bollard|sign/,'count']];
  const AW_MATWORD=[[/6f2/,'6F2'],[/crushed/,'Crushed concrete'],[/clean stone/,'Clean stone'],[/\bsand\b/,'Sand'],[/topsoil/,'Topsoil']];
  // one line like "Dig out 3 x 2 x 600, 4 loads away" becomes one measured item, the same as if it had been tapped in
  function awLineItem(line){ const raw=line.trim(); if(!raw) return null; const lc=raw.toLowerCase();
    const dimsRe=/(\d+(?:\.\d+)?\s*(?:mm|m)?(?:\s*(?:x|×|\*|by)\s*\d+(?:\.\d+)?\s*(?:mm|m)?)+)/i;
    let t='other'; if(!dimsRe.test(lc)&&/\d+\s*loads?\b/.test(lc)) t='loads'; else for(const [re,k] of AW_KINDS){ if(re.test(lc)){ t=k; break; } }
    const ty=AW_TYPES[t]; const it={t,photos:[],auto:true,desc:raw,opt:{}}; let body=raw;
    if(t==='pipe'){ const s=lc.match(/(\d{2,4})\s*(?:mm)?\s*(?:dia\.?\s*)?(pvc|clay|conc|twin ?wall|duct|pipe|drain|storm|foul|sewer)?/); if(s){ it.S=(s[1]+' mm'+(s[2]&&!/pipe|drain|sewer/.test(s[2])?' '+s[2]:'')).trim(); body=raw.slice(0,s.index)+raw.slice(s.index+s[1].length); } }
    if(t==='pave'||t==='kerb'){ const s=raw.match(/\b(\d{3})\s*x\s*(\d{3})\b(?!\s*(?:x|mm|m\b))/i); if(s){ it.S=s[1]+' x '+s[2]; body=raw.slice(0,s.index)+raw.slice(s.index+s[0].length); } else { const k=raw.match(/\b(HB2|BN|SP|EF|HB3|KL|KR)\b/i); if(k) it.S=k[1]; } }
    if(t==='layer'){ it.mat='Type 1'; for(const [re,m] of AW_MATWORD){ if(re.test(lc)){ it.mat=m; break; } } }
    const dm=body.match(dimsRe); const lcb=body.toLowerCase();
    if(ty.dims){ if(dm){ const p=awParse(dm[1],ty.dims)||{}; const b={sz:dm[1].replace(/\s+/g,' ')}; ['L','W','D','N'].forEach(k=>{ if(p[k]!==undefined) b[k]=String(p[k]); }); it.bits=[b]; }
      else { const one=lcb.match(/(\d+(?:\.\d+)?)\s*(m3|m³|m2|m²|\bm\b|\bt\b|tonnes?)/); if(one){ it.t='other'; it.Q=one[1]; it.U=/m3|³/.test(one[2])?'m³':/m2|²/.test(one[2])?'m²':/^t/.test(one[2])?'t':'m'; delete it.bits; it.desc=raw; }
        else if(ty.dims==='L'){ const n=lcb.match(/(\d+(?:\.\d+)?)/); if(n) it.bits=[{L:n[1],sz:n[1]}]; } }
      if(t==='dig'){ const ld=lc.match(/(\d+)\s*loads?/); if(ld) it.Q=ld[1]; }
      }
    else { const n=lc.replace(dimsRe,'').match(/(\d+(?:\.\d+)?)\s*(?:nr|no|loads?|hrs?|hours?)?/); if(n) it.Q=n[1];
      if(t==='hours'){ const h=lc.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/); if(h) it.Q=h[1]; const men=raw.match(/\d+\s*(men|man|lads?)[^,.]*/i); if(men) it.S=men[0].trim(); if(/stand|wait/.test(lc)) it.opt.kind='Standing time'; else if(/attend/.test(lc)) it.opt.kind='Attendance on others'; else if(/sweep|clean/.test(lc)) it.opt.kind='Sweeping / cleaning'; }
      if(t==='loads'){ it.opt.wag='8-wheeler'; it.opt.dir=/deliver|brought|tipped in/.test(lc)?'Delivered in':'Carted away'; }
      if(t==='count'){ it.S=raw.replace(/^\s*\d+\s*(nr|no\.?)?\s*/i,'').trim(); it.desc=''; }
      if(t==='other'){ const u=lc.match(/\d+(?:\.\d+)?\s*(m3|m³|m2|m²|\bm\b|\bt\b|nr|no)/); it.U=u?(/m3|³/.test(u[1])?'m³':/m2|²/.test(u[1])?'m²':/^t/.test(u[1])?'t':/nr|no/.test(u[1])?'nr':'m'):'nr'; } }
    return awFix(it); }
  function awSizesApply(){ const txt=$('aw-sizes').value; AW.sizes=txt; const keep=AW.items.filter(it=>!it.auto); const fresh=txt.split('\n').map(awLineItem).filter(Boolean);
    AW.items=keep.concat(fresh); awRender(); awSizesOut(); }
  function awSizesOut(){ const box=$('aw-sizesout'); const auto=AW.items.filter(it=>it.auto); box.hidden=!auto.length; if(!auto.length) return;
    box.innerHTML=auto.map(it=>{ const r=awQty(it); const ty=AW_TYPES[it.t]||AW_TYPES.other; return `<div><span>${awEsc(ty.n)}${it.t==='layer'&&it.mat?' ('+awEsc(it.mat)+')':it.S?' · '+awEsc(it.S):''}${r.extra?' <small>'+awEsc(r.extra)+'</small>':''}</span><b>${isNaN(r.q)?'?':fq(r.q,r.u)+' '+r.u}</b></div>`; }).join('')+'<p class="note" style="margin:4px 0 0">The office prices from these. A ? means it could not read the size: write it like 3 x 2 x 600.</p>'; }
  let awSzT; $('aw-sizes').addEventListener('input',()=>{ clearTimeout(awSzT); awSzT=setTimeout(awSizesApply,250); });
  // photos on the sheet itself (the measured items still have their own)
  function awDrawPhotos(){ const ph=$('aw-photos'); ph.innerHTML=''; AW.photos.forEach((p,k)=>{ const w=document.createElement('div'); w.innerHTML=`<img src="${p.d}"><button type="button" aria-label="Remove">×</button>`; w.querySelector('button').addEventListener('click',()=>{ AW.photos.splice(k,1); awDrawPhotos(); awSum(); }); ph.appendChild(w); }); }
  ['aw-photo','aw-photo2'].forEach(id=>$(id).addEventListener('change',async e=>{ for(const f of e.target.files){ AW.photos.push({d:await shrink(f),at:new Date().toISOString()}); } e.target.value=''; awDrawPhotos(); awSum(); $('panel-aw').dispatchEvent(new Event('input',{bubbles:true})); }));
  // header strip: site, ref, date, foreman, filled in from the home screen; tap Change to edit
  function awHead(){ const v=id=>$(id).value.trim(); $('aw-headline').textContent=[v('aw-ref')||'Additional works',v('aw-site')].filter(Boolean).join(' · '); $('aw-headsub').textContent=[v('aw-date')?fmtDate(v('aw-date')):'',v('aw-by')?'by '+v('aw-by'):'',v('aw-client')].filter(Boolean).join(' · '); }
  ['aw-site','aw-client','aw-date','aw-ref','aw-by'].forEach(id=>$(id).addEventListener('input',awHead));
  $('aw-headedit').addEventListener('click',()=>{ $('aw-more').open=true; $('aw-site').scrollIntoView({block:'center',behavior:'smooth'}); setTimeout(()=>$('aw-site').focus(),300); });
  document.querySelector('[data-go="panel-aw"]').addEventListener('click',()=>setTimeout(awHead,80));
  window.awHead=awHead; window.awDrawPhotos=awDrawPhotos; window.awSizesOut=awSizesOut;
