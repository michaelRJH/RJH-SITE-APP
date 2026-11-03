  // ---- Foundation record (v79): the footing on screen. Tap a corner for the level you dug to, tap a side for its width ----
  // plan: {pts:[{x,y}] in m, w:[mm, side i runs from corner i to corner i+1], w0:[design widths], walls:[{a,b,w}], bays:[{x,y,side,w,d,fw}], src:'tpl'|'rect', flip, ref, house}
  // corners[i] sits at plan.pts[i]: {k:'A', design:'101.000', dug:'', from:'', why:''}   from/why: the design level was changed on site
  const FR={corners:[],plan:null,photos:[],drain:'design',drainPhotos:[],drainPdf:null,passed:'',design:null,sel:null};
  const FR_LET='ABCDEFGHJKLMNPRSTUVWXYZ';
  const frEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const frNum=v=>{ const n=parseFloat(v); return isNaN(n)?NaN:n; };
  const frMm=(a,b)=>{ const x=frNum(a), y=frNum(b); return isNaN(x)||isNaN(y)?null:Math.round((x-y)*1000); };
  const frDiffText=(dug,design)=>{ const d=frMm(dug,design); if(d===null) return {t:'',k:''}; if(Math.abs(d)<=25) return {t:'On level ('+(d>0?'+':'')+d+' mm)',k:'ok'}; return d<0?{t:(-d)+' mm deeper than design',k:'deep'}:{t:d+' mm higher than design',k:'high'}; };
  const FR_COL={'':'#6b6b6b',ok:'#1E6F3F',deep:'#8a5a00',high:'#B3261E'};
  function frPlotRec(plot){ const p=(typeof PACK!=='undefined')&&PACK.get(); if(!p) return null; const q=String(plot||'').trim().replace(/^plot\s*/i,'').replace(/\s+/g,'').toUpperCase(); return (p.plots||[]).find(x=>String(x.plot).replace(/\s+/g,'').toUpperCase()===q)||null; }
  // the design underside for a corner: one level for the whole plot on nearly every schedule, else matched by the engineer's letter
  function frDesignFor(k){ const u=(FR.design&&FR.design.under)||{}; const vals=Object.values(u).map(Number).filter(v=>!isNaN(v)); if(!vals.length) return ''; if(new Set(vals.map(v=>v.toFixed(3))).size===1) return vals[0].toFixed(3); return u[k]!=null?(+u[k]).toFixed(3):''; }
  // ---- the footing shape: from the engineer's drawing for the house type, or a plain rectangle ----
  function frTplFor(x){ if(!x||!window.RJH_DRG||!RJH_DRG.find||!RJH_DRG.geom) return null; const isG=!!x.garage; const nums=String(x.plot).replace(/G$/i,'').split(/[^0-9]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    for(const n of nums){ const hits=RJH_DRG.find(n).filter(h=>h.b.tpl&&((h.b.house==='Garage')===isG)); if(hits.length){ const h=hits[0], t=h.b.tpl; let part=null; if((t.units||1)>1){ const g=(t.grp||[]).find(gp=>gp.includes(n)); if(g) part=g.indexOf(n); } return {t,part,h}; } }
    return null; }
  function frPlanFromTpl(x){ const tp=frTplFor(x); if(!tp) return null; let g; try{ g=RJH_DRG.geom(tp.t,tp.part); }catch(e){ return null; } if(!g||!g.P||g.P.length<3) return null;
    return {pts:g.P.map(p=>({x:+(+p.x).toFixed(3),y:+(+p.y).toFixed(3)})),w:g.P.map(p=>+p.w||600),w0:g.P.map(p=>+p.w||600),walls:(g.W||[]).map(w=>({a:{x:w.a.x,y:w.a.y},b:{x:w.b.x,y:w.b.y},w:+w.w||600})),bays:(g.Bs||[]).map(y=>({x:y.pt.x,y:y.pt.y,side:y.side,w:y.w||0.6,d:y.d||0.6,fw:y.fw||600})),src:'tpl',flip:false,ref:String(tp.h.s.ref||'').replace(/-S3$/,'').split('-').pop(),house:[tp.h.b.house,tp.h.b.hand].filter(Boolean).join(' ')}; }
  function frRectPlan(L,Wd){ L=frNum(L); Wd=frNum(Wd); if(!(L>0)) L=9; if(!(Wd>0)) Wd=6; return {pts:[{x:0,y:0},{x:L,y:0},{x:L,y:Wd},{x:0,y:Wd}],w:[600,600,600,600],w0:[600,600,600,600],walls:[],bays:[],src:'rect',flip:false}; }
  // a new shape: the corners are made again (levels from the schedule), unless keep is set and the count matches
  function frSetPlan(plan,keep){ const old=FR.corners; FR.plan=plan; FR.sel=null;
    FR.corners=plan.pts.map((p,i)=>{ const k=FR_LET[i]||('P'+(i+1)); const o=keep&&old.find(c=>c.k===k); return o?{...o}:{k,design:frDesignFor(k),dug:'',from:'',why:''}; });
    if(keep) old.filter(c=>c.dug&&!FR.corners.some(n=>n.k===c.k)).forEach(c=>{ frAddPoint(plan.pts.length-1,c); });
    frRectUI(); frDraw(); frCorners(); frSel(); }
  function frRectUI(){ const P=FR.plan; const r=$('fr-rectwrap'); r.hidden=!(P&&P.src==='rect'); if(P&&P.src==='rect'){ const xs=P.pts.map(p=>p.x), ys=P.pts.map(p=>p.y); const L=Math.max(...xs)-Math.min(...xs), W=Math.max(...ys)-Math.min(...ys); if(!$('fr-rectl').matches(':focus')) $('fr-rectl').value=+L.toFixed(2); if(!$('fr-rectw').matches(':focus')) $('fr-rectw').value=+W.toFixed(2); }
    const x=frPlotRec($('fr-plot').value); const has=!!frTplFor(x); $('fr-rect').textContent=(P&&P.src==='rect'&&has)?"Use the engineer's footing":'Draw a plain rectangle'; $('fr-rect').hidden=!(has||(P&&P.src!=='rect')); $('fr-flip').hidden=!(P&&P.src==='tpl'); }
  // geometry helpers
  const frInside=(pts,x,y)=>{ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const a=pts[i],b=pts[j]; if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) c=!c; } return c; };
  function frSide(i){ const P=FR.plan, n=P.pts.length; const a=P.pts[i], b=P.pts[(i+1)%n]; const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy)||1; let nx=dy/L, ny=-dx/L; const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; if(frInside(P.pts,mx+nx*0.05,my+ny*0.05)){ nx=-nx; ny=-ny; } return {a,b,L,mx,my,nx,ny,ux:dx/L,uy:dy/L}; }
  function frOut(i){ const n=FR.plan.pts.length; const s1=frSide((i-1+n)%n), s2=frSide(i); let ox=s1.nx+s2.nx, oy=s1.ny+s2.ny; const L=Math.hypot(ox,oy); if(L<1e-6){ ox=s2.nx; oy=s2.ny; } else { ox/=L; oy/=L; } return {ox,oy}; }
  function frBounds(){ const P=FR.plan; const xs=P.pts.map(p=>p.x), ys=P.pts.map(p=>p.y); const pad=Math.max(...P.w,600)/2000+1.45; return {x0:Math.min(...xs)-pad,y0:Math.min(...ys)-pad,x1:Math.max(...xs)+pad,y1:Math.max(...ys)+pad}; }
  function frAddPoint(i,corner){ const P=FR.plan, n=P.pts.length; const s=frSide(i); const used=new Set(FR.corners.map(c=>c.k)); const k=[...FR_LET].find(x=>!used.has(x))||('P'+(n+1));
    P.pts.splice(i+1,0,{x:+s.mx.toFixed(3),y:+s.my.toFixed(3)}); P.w.splice(i+1,0,P.w[i]); P.w0.splice(i+1,0,P.w0[i]); P.bays.forEach(y=>{ if(y.side>i) y.side++; });
    FR.corners.splice(i+1,0,corner?{...corner,k:corner.k&&!used.has(corner.k)?corner.k:k}:{k,design:FR.corners[i]?FR.corners[i].design:frDesignFor(k),dug:'',from:'',why:''}); return i+1; }
  function frRemovePoint(i){ const P=FR.plan; if(P.pts.length<=3){ toast('A footing needs at least three corners'); return false; } P.pts.splice(i,1); P.w.splice(i,1); P.w0.splice(i,1); P.bays.forEach(y=>{ if(y.side>=i) y.side=Math.max(0,y.side-1); }); FR.corners.splice(i,1); return true; }
  function frFlip(){ const P=FR.plan; if(!P) return; const xs=P.pts.map(p=>p.x); const X=Math.max(...xs)+Math.min(...xs); const f=p=>{ p.x=+(X-p.x).toFixed(3); }; P.pts.forEach(f); P.walls.forEach(w=>{ f(w.a); f(w.b); }); P.bays.forEach(f); P.flip=!P.flip; frDraw(); frSel(); }
  // ---- the picture ----
  function frDraw(){ const svg=$('fr-plan'); const P=FR.plan; if(!P||!P.pts.length){ svg.innerHTML=''; return; } const pts=P.pts, n=pts.length; const b=frBounds(); svg.setAttribute('viewBox',`${b.x0} ${b.y0} ${b.x1-b.x0} ${b.y1-b.y0}`);
    const fs=(b.x1-b.x0)*0.036, sel=FR.sel||{}; const out=[]; const f3=v=>+(+v).toFixed(3);
    // concrete: each side and wall drawn at its width
    pts.forEach((p,i)=>{ const q=pts[(i+1)%n]; const on=sel.t==='s'&&sel.i===i; out.push(`<g data-s="${i}" class="fr-sidelab"><line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${on?'#f3d36b':(P.w[i]!==P.w0[i]?'#e6c3bf':'#cfc8ba')}" stroke-width="${Math.max(P.w[i],450)/1000}" stroke-linecap="square"/></g>`); });
    P.walls.forEach(w=>out.push(`<line x1="${w.a.x}" y1="${w.a.y}" x2="${w.b.x}" y2="${w.b.y}" stroke="#d9d3c6" stroke-width="${w.w/1000}" stroke-linecap="butt"/>`));
    P.bays.forEach(y=>{ const s=frSide(Math.min(y.side,n-1)); const cx=y.x+s.nx*y.d/2, cy=y.y+s.ny*y.d/2; const ang=Math.atan2(s.uy,s.ux)*180/Math.PI; out.push(`<rect x="${cx-y.w/2}" y="${cy-y.d/2}" width="${y.w}" height="${y.d}" fill="#d9d3c6" transform="rotate(${ang} ${cx} ${cy})"/>`); });
    out.push(`<polygon points="${pts.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="#333" stroke-width="${fs*0.06}" stroke-dasharray="${fs*0.5} ${fs*0.35}"/>`);
    // side widths, tappable
    pts.forEach((p,i)=>{ const s=frSide(i); const tw=fs*2.6, th=fs*1.3; if(s.L<tw*1.1) return; const off=P.w[i]/2000+fs*0.85; const x=s.mx-s.nx*off, y=s.my-s.ny*off; const chg=P.w[i]!==P.w0[i]; const on=sel.t==='s'&&sel.i===i;
      out.push(`<g class="fr-sidelab" data-s="${i}"><rect x="${x-tw/2}" y="${y-th/2}" width="${tw}" height="${th}" rx="${fs*0.2}" fill="${on?'#f3d36b':'#fff'}" stroke="${chg?'#B3261E':'#999'}" stroke-width="${fs*0.06}"/><text x="${x}" y="${y+fs*0.33}" text-anchor="middle" font-size="${fs*0.85}" font-weight="700" fill="${chg?'#B3261E':'#333'}">${P.w[i]}</text></g>`); });
    // corners: letter in a circle, coloured by how the dug level compares; the levels beside it
    const multi=new Set(FR.corners.map(c=>String(c.design||''))).size>1;
    pts.forEach((p,i)=>{ const c=FR.corners[i]||{k:'?'}; const df=frDiffText(c.dug,c.design); const col=FR_COL[df.k]; const on=sel.t==='c'&&sel.i===i; const o=frOut(i); const r=fs*0.75;
      const tx=p.x+o.ox*(r+fs*0.45), ty=p.y+o.oy*(r+fs*0.45); const anc=o.ox>0.3?'start':o.ox<-0.3?'end':'middle'; const dy=o.oy>0.3?fs*0.9:o.oy<-0.3?-fs*0.35:fs*0.3;
      const l1=c.dug?f3(c.dug).toFixed(3):'', l2=c.design&&(multi||c.from)?f3(c.design).toFixed(3):'';
      out.push(`<g class="fr-cor" data-c="${i}"><circle cx="${p.x}" cy="${p.y}" r="${r*1.9}" fill="${on?'rgba(243,211,107,.45)':'transparent'}"/><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${col}" stroke="${c.from?'#B3261E':'#fff'}" stroke-width="${fs*(c.from?0.14:0.08)}"/><text x="${p.x}" y="${p.y+fs*0.33}" text-anchor="middle" font-size="${fs*0.95}" font-weight="800" fill="#fff">${frEsc(c.k)}</text>`+
        (l1?`<text x="${tx}" y="${ty+dy}" text-anchor="${anc}" font-size="${fs*0.8}" font-weight="800" fill="${col}">${l1}</text>`:'')+(l2?`<text x="${tx}" y="${ty+dy+(l1?fs*0.85:0)}" text-anchor="${anc}" font-size="${fs*0.66}" fill="${c.from?'#B3261E':'#666'}">${l1?'':'design '}${l2}</text>`:'')+`</g>`); });
    if(P.house||P.ref){ const cx=(b.x0+b.x1)/2; out.push(`<text x="${cx}" y="${b.y1-fs*0.35}" text-anchor="middle" font-size="${fs*0.62}" fill="#777">${frEsc([P.house,P.ref?'drg '+P.ref:'',P.flip?'flipped on site':''].filter(Boolean).join(' · '))}</text>`); }
    svg.innerHTML=out.join(''); }
  $('fr-plan').addEventListener('click',e=>{ const c=e.target.closest('[data-c]'), s=e.target.closest('[data-s]'); if(c) FR.sel={t:'c',i:+c.dataset.c}; else if(s) FR.sel={t:'s',i:+s.dataset.s}; else FR.sel=null; frDraw(); frSel(true); });
  // ---- what you tapped: one corner or one side ----
  function frSel(scroll){ const box=$('fr-sel'); const P=FR.plan, sel=FR.sel; if(!P||!sel||!FR.corners[sel.i]&&sel.t==='c'){ box.hidden=true; box.innerHTML=''; return; } box.hidden=false; const n=P.pts.length; const kk=i=>(FR.corners[i]||{}).k||'?';
    if(sel.t==='c'){ const i=sel.i, c=FR.corners[i]; const df=frDiffText(c.dug,c.design);
      box.innerHTML=`<div class="fr-selh"><b>Corner ${frEsc(c.k)}</b><button type="button" class="fr-close" aria-label="Done">Done</button></div>
        <div class="grid2"><div class="field"><label>Dug to</label><div class="in"><input id="fr-seldug" type="number" inputmode="decimal" step="0.001" value="${frEsc(c.dug)}" placeholder="measured"><span class="unit">m</span></div></div>
        <div class="field"><label>Design underside</label><div class="in"><input id="fr-seldes" type="number" inputmode="decimal" step="0.001" value="${frEsc(c.design)}" ${c.from||!FR.design?'':'readonly'} placeholder="design"><span class="unit">m</span></div>${FR.design&&!c.from?'<button type="button" class="fr-chg" id="fr-selchg">Change the design level</button>':''}${c.from?`<small class="fr-was">was ${frEsc(c.from)}${c.why?': '+frEsc(c.why):''}</small>`:''}</div></div>
        <div class="fr-out" data-k="${df.k}"><span>${df.t}</span></div>
        <div class="btnrow fr-selbtns"><button type="button" class="btn" id="fr-seladd">+ Point between ${frEsc(c.k)} and ${frEsc(kk((i+1)%n))}</button><button type="button" class="btn" id="fr-selrm">Take ${frEsc(c.k)} off</button></div>`;
      const dug=$('fr-seldug'), des=$('fr-seldes'); const upd=()=>{ const o=frDiffText(c.dug,c.design); const out=box.querySelector('.fr-out'); out.firstChild.textContent=o.t; out.dataset.k=o.k; frDraw(); frCorners(); };
      dug.addEventListener('input',()=>{ c.dug=dug.value; upd(); }); des.addEventListener('input',()=>{ c.design=des.value; upd(); });
      const ch=$('fr-selchg'); if(ch) ch.addEventListener('click',()=>{ const why=prompt('Design level at '+c.k+' changed on site. Why, and who said? (e.g. soft spot, deepen 300, J Smith AWP)'); if(why===null) return; c.from=c.design; c.why=why.trim(); frSel(); setTimeout(()=>{ const d=$('fr-seldes'); if(d) d.focus(); },50); });
      $('fr-seladd').addEventListener('click',()=>{ const j=frAddPoint(i); FR.sel={t:'c',i:j}; frDraw(); frCorners(); frSel(); frChanged(); toast('Point '+FR.corners[j].k+' added. Put its level in'); });
      $('fr-selrm').addEventListener('click',()=>{ if(frRemovePoint(i)){ FR.sel=null; frDraw(); frCorners(); frSel(); frChanged(); } });
      if(scroll) setTimeout(()=>{ dug.focus({preventScroll:true}); box.scrollIntoView({block:'nearest',behavior:'smooth'}); },30); }
    else { const i=sel.i; const s=frSide(i); const chg=P.w[i]!==P.w0[i];
      box.innerHTML=`<div class="fr-selh"><b>Side ${frEsc(kk(i))} to ${frEsc(kk((i+1)%n))}</b><span>${s.L.toFixed(2)} m long</span><button type="button" class="fr-close" aria-label="Done">Done</button></div>
        <div class="field"><label>Width of the footing on this side</label><div class="in"><input id="fr-selw" type="number" inputmode="numeric" step="50" value="${P.w[i]}"><span class="unit">mm</span></div>${chg?`<small class="fr-was">design ${P.w0[i]} <button type="button" class="fr-chg" id="fr-selw0">Put it back</button></small>`:`<small class="note" style="margin:4px 0 0">As the drawing. Change it if you dug it wider.</small>`}</div>
        <div class="seg five fr-wq">${[600,750,900,1050,1200].map(w=>`<button type="button" data-w="${w}" aria-pressed="${P.w[i]===w}">${w}</button>`).join('')}</div>
        <div class="btnrow fr-selbtns"><button type="button" class="btn" id="fr-seladd">+ Point on this side</button></div>`;
      const w=$('fr-selw'); const setW=v=>{ v=Math.round(frNum(v)); if(!(v>=100)) return; P.w[i]=v; box.querySelectorAll('.fr-wq button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.w===v)); const was=box.querySelector('.fr-was'); frDraw(); frChanged(); if(!!was!==(v!==P.w0[i])) frSel(); };
      w.addEventListener('input',()=>setW(w.value)); box.querySelectorAll('.fr-wq button').forEach(x=>x.addEventListener('click',()=>{ w.value=x.dataset.w; setW(x.dataset.w); }));
      const back=$('fr-selw0'); if(back) back.addEventListener('click',()=>{ w.value=P.w0[i]; setW(P.w0[i]); });
      $('fr-seladd').addEventListener('click',()=>{ const j=frAddPoint(i); FR.sel={t:'c',i:j}; frDraw(); frCorners(); frSel(true); frChanged(); });
      if(scroll) setTimeout(()=>{ w.focus({preventScroll:true}); box.scrollIntoView({block:'nearest',behavior:'smooth'}); },30); }
    box.querySelector('.fr-close').addEventListener('click',()=>{ FR.sel=null; frDraw(); frSel(); }); }
  const frChanged=()=>$('panel-fr').dispatchEvent(new Event('change'));
  $('fr-flip').addEventListener('click',()=>{ frFlip(); frChanged(); });
  $('fr-rect').addEventListener('click',()=>{ const x=frPlotRec($('fr-plot').value); const P=FR.plan; const dug=FR.corners.some(c=>c.dug); if(dug&&!confirm('Change the shape? The levels you put in are kept where the corner letters match.')) return;
    if(P&&P.src==='rect'){ const t=frPlanFromTpl(x); if(t) frSetPlan(t,true); } else frSetPlan(frRectPlan($('fr-rectl').value,$('fr-rectw').value),true); frChanged(); });
  ['fr-rectl','fr-rectw'].forEach(id=>$(id).addEventListener('input',()=>{ const P=FR.plan; if(!P||P.src!=='rect') return; const L=frNum($('fr-rectl').value), W=frNum($('fr-rectw').value); if(!(L>0&&W>0)) return; const xs=P.pts.map(p=>p.x), ys=P.pts.map(p=>p.y); const oL=Math.max(...xs)-Math.min(...xs)||1, oW=Math.max(...ys)-Math.min(...ys)||1, x0=Math.min(...xs), y0=Math.min(...ys);
    P.pts.forEach(p=>{ p.x=+(x0+(p.x-x0)*L/oL).toFixed(3); p.y=+(y0+(p.y-y0)*W/oW).toFixed(3); }); frDraw(); frSel(); }));
  // the plot picked: house type, design levels and the footing shape, unless the sheet already has them
  function frFromPlot(force){ const x=frPlotRec($('fr-plot').value); FR.design=x&&x.design||null; const info=$('fr-plotinfo');
    if(!x){ info.hidden=true; if(!FR.plan) frSetPlan(frRectPlan(),true); else { frRectUI(); frDraw(); } frCorners(); return; }
    const d=x.design||{}; if(force||!$('fr-type').value.trim()) $('fr-type').value=[x.type,x.hand].filter(Boolean).join(' ');
    if(d.toc!=null&&(force||!$('fr-tocd').value)) $('fr-tocd').value=(+d.toc).toFixed(3);
    if(force||!FR.plan){ frSetPlan(frPlanFromTpl(x)||frRectPlan(),!force); }
    else { FR.corners.forEach(c=>{ if(!c.design&&!c.from) c.design=frDesignFor(c.k); }); frRectUI(); frDraw(); }
    const u=d.under||{}; const vals=Object.values(u).map(Number); const multi=vals.length>1&&new Set(vals.map(v=>v.toFixed(3))).size>1;
    const P=FR.plan; const shape=P&&P.src==='tpl'?`Footing from drawing ${frEsc(P.ref||'')}${P.house?' ('+frEsc(P.house)+')':''}.`:'No drawing for this house type on the job, so a plain rectangle: put the size in.';
    info.hidden=false; info.innerHTML=`<b>Plot ${frEsc(x.plot)}: ${frEsc(x.type)}${x.hand?' ('+frEsc(x.hand)+')':''}</b><span>${frEsc(d.found||'')}${d.depth?' · about '+frEsc(d.depth)+' m deep':''}${d.ffl!=null?' · FFL '+(+d.ffl).toFixed(3):''}${d.strata?' · onto '+frEsc(d.strata):''}${d.borehole?' ('+frEsc(d.borehole)+')':''}</span><span>Design underside ${multi?Object.keys(u).map(k=>k+' '+(+u[k]).toFixed(3)).join(', '):(vals.length?vals[0].toFixed(3):'not on the schedule')}. ${shape}</span>`;
    frCorners(); frToc(); }
  // the same corners as a list, for anyone who would rather type
  function frCorners(){ const box=$('fr-corners'); box.innerHTML='';
    if(!FR.corners.length){ box.innerHTML='<p class="note fr-note">No corners yet.</p>'; return; }
    const head=document.createElement('div'); head.className='fr-row fr-head'; head.innerHTML='<span>Corner</span><span>Design underside</span><span>Dug to</span><span></span>'; box.appendChild(head);
    FR.corners.forEach((c,i)=>{ const r=document.createElement('div'); r.className='fr-row'; const df=frDiffText(c.dug,c.design);
      r.innerHTML=`<div class="in fr-k"><input type="text" value="${frEsc(c.k)}" maxlength="4" aria-label="Corner"></div>
        <div class="fr-des"><div class="in"><input type="number" inputmode="decimal" step="0.001" value="${frEsc(c.design)}" ${c.from||!FR.design?'':'readonly'} aria-label="Design level" placeholder="design"></div>${FR.design&&!c.from?'<button type="button" class="fr-chg">Change</button>':''}${c.from?`<small class="fr-was">was ${frEsc(c.from)}${c.why?': '+frEsc(c.why):''}</small>`:''}</div>
        <div class="in"><input type="number" inputmode="decimal" step="0.001" value="${frEsc(c.dug)}" aria-label="Dug level" placeholder="measured"></div>
        <button type="button" class="fr-x" aria-label="Remove">×</button><div class="fr-out" data-k="${df.k}"><span>${df.t}</span></div>`;
      const [ik,id,ig]=r.querySelectorAll('input'); const upd=()=>{ const o=frDiffText(c.dug,c.design); const out=r.querySelector('.fr-out'); out.firstChild.textContent=o.t; out.dataset.k=o.k; frDraw(); if(FR.sel&&FR.sel.t==='c'&&FR.sel.i===i) frSel(); };
      ik.addEventListener('input',()=>{ c.k=ik.value.trim().toUpperCase(); ik.value=c.k; frDraw(); });
      id.addEventListener('input',()=>{ c.design=id.value; upd(); }); ig.addEventListener('input',()=>{ c.dug=ig.value; upd(); });
      const ch=r.querySelector('.fr-chg'); if(ch) ch.addEventListener('click',()=>{ const why=prompt('Design level at '+c.k+' changed on site. Why, and who said? (e.g. soft spot, deepen 300, J Smith AWP)'); if(why===null) return; c.from=c.design; c.why=why.trim(); frCorners(); frDraw(); setTimeout(()=>{ const rr=box.querySelectorAll('.fr-row')[i+1]; if(rr) rr.querySelectorAll('input')[1].focus(); },50); });
      r.querySelector('.fr-x').addEventListener('click',()=>{ if(FR.plan&&FR.plan.pts.length===FR.corners.length){ if(!frRemovePoint(i)) return; } else FR.corners.splice(i,1); FR.sel=null; frCorners(); frDraw(); frSel(); frChanged(); });
      box.appendChild(r); }); }
  function frToc(){ const o=$('fr-tocout'); const df=frDiffText($('fr-toc').value,$('fr-tocd').value); o.hidden=!df.t; o.textContent=df.t?'Top of concrete: '+df.t:''; o.dataset.k=df.k; }
  ['fr-toc','fr-tocd'].forEach(id=>$(id).addEventListener('input',frToc));
  $('fr-addcorner').addEventListener('click',()=>{ let j; if(FR.plan&&FR.plan.pts.length===FR.corners.length){ j=frAddPoint(FR.plan.pts.length-1); } else { const used=new Set(FR.corners.map(c=>c.k)); const k=[...FR_LET].find(x=>!used.has(x))||''; FR.corners.push({k,design:'',dug:'',from:'',why:''}); j=FR.corners.length-1; }
    frCorners(); frDraw(); const rows=$('fr-corners').querySelectorAll('.fr-row'); const last=rows[j+1]; if(last) last.querySelectorAll('input')[2].focus(); });
  $('fr-plot').addEventListener('change',()=>frFromPlot(false)); $('fr-plot').addEventListener('blur',()=>frFromPlot(false));
  // inspection: a result, not a signature
  const frPassUI=()=>{ $('fr-passed').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.p===FR.passed)); $('fr-inspwrap').hidden=!FR.passed; };
  $('fr-passed').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; FR.passed=b.dataset.p; if(FR.passed&&!$('fr-inspdate').value) $('fr-inspdate').value=today(); frPassUI(); });
  // plot drainage, as the old record: as design, not yet, or differs with the as-built attached
  const frDrainRender=photoStore('fr-drainphoto','fr-drainphotos',()=>FR.drainPhotos);
  $('fr-drainpdf').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>8*1024*1024){ toast('PDF too big (8 MB max)'); e.target.value=''; return; } const rd=new FileReader(); rd.onload=()=>{ FR.drainPdf={name:f.name,data:rd.result}; frDrainPdfUI(); toast('PDF attached: '+f.name); }; rd.readAsDataURL(f); e.target.value=''; });
  function frDrainPdfUI(){ const el=$('fr-drainpdf-name'); if(FR.drainPdf){ el.hidden=false; el.innerHTML=`Attached PDF: <b>${frEsc(FR.drainPdf.name)}</b> · goes on the back of the record &nbsp;<button type="button" class="x" id="fr-drainpdf-x" style="height:24px;width:24px;border-radius:4px;vertical-align:middle">×</button>`; $('fr-drainpdf-x').addEventListener('click',()=>{ FR.drainPdf=null; frDrainPdfUI(); }); } else { el.hidden=true; el.innerHTML=''; } }
  $('fr-drain').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; FR.drain=b.dataset.d; frDrainUI(); });
  function frDrainUI(){ $('fr-drain').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.d===FR.drain)); $('fr-drainwrap').hidden=FR.drain!=='differs'; }
  const frRender=photoStore('fr-photo','fr-photos',()=>FR.photos);
  [['fr-photo-cam','fr-photo'],['fr-drainphoto-cam','fr-drainphoto']].forEach(([c,i])=>{ const cam=$(c), inp=$(i); cam.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; try{ const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.dispatchEvent(new Event('change')); }catch(err){ toast('Could not take that photo'); } e.target.value=''; }); });
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
  document.querySelector('[data-go="panel-fr"]').addEventListener('click',()=>setTimeout(()=>{ frList(); if(!$('fr-date').value) $('fr-date').value=today(); if(!FR.plan) frFromPlot(false); },80));
  // ---- the printed record ----
  function frPdfPlan(doc,X,Y,BW,BH){ const P=FR.plan; if(!P||!P.pts.length) return; const pts=P.pts, n=pts.length; const b=frBounds(); const s=Math.min(BW/(b.x1-b.x0),BH/(b.y1-b.y0)); const ox=X+(BW-(b.x1-b.x0)*s)/2, oy=Y+(BH-(b.y1-b.y0)*s)/2; const T=p=>[ox+(p.x-b.x0)*s,oy+(p.y-b.y0)*s]; const fs=Math.max(6,Math.min(9,s*0.42*2.8));
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.rect(X,Y,BW,BH); const cap=v=>{ try{ doc.setLineCap(v); }catch(e){} };
    cap('square'); pts.forEach((p,i)=>{ const q=pts[(i+1)%n]; const chg=P.w[i]!==P.w0[i]; doc.setDrawColor(...(chg?[230,195,191]:[207,200,186])); doc.setLineWidth(Math.max(0.6,P.w[i]/1000*s)); const [ax,ay]=T(p),[bx,by]=T(q); doc.line(ax,ay,bx,by); });
    cap('butt'); doc.setDrawColor(217,211,198); P.walls.forEach(w=>{ doc.setLineWidth(Math.max(0.6,w.w/1000*s)); const [ax,ay]=T(w.a),[bx,by]=T(w.b); doc.line(ax,ay,bx,by); });
    doc.setFillColor(217,211,198); P.bays.forEach(y=>{ const sd=frSide(Math.min(y.side,n-1)); const cx=y.x+sd.nx*y.d/2, cy=y.y+sd.ny*y.d/2; const [px,py]=T({x:cx,y:cy}); const r=Math.max(y.w,y.d)*s/2; doc.rect(px-r,py-r,2*r,2*r,'F'); });
    doc.setDrawColor(60,60,60); doc.setLineWidth(0.25); try{ doc.setLineDashPattern([1.2,0.9],0); }catch(e){} pts.forEach((p,i)=>{ const q=pts[(i+1)%n]; const [ax,ay]=T(p),[bx,by]=T(q); doc.line(ax,ay,bx,by); }); try{ doc.setLineDashPattern([],0); }catch(e){}
    pts.forEach((p,i)=>{ const sd=frSide(i); if(sd.L*s<fs*1.6) return; const off=P.w[i]/2000+0.9*(fs/2.8/s); const [x,y]=T({x:sd.mx-sd.nx*off,y:sd.my-sd.ny*off}); const chg=P.w[i]!==P.w0[i]; doc.setFont('helvetica','bold'); doc.setFontSize(fs*0.85); doc.setTextColor(...(chg?[179,38,30]:[60,60,60])); const t=String(P.w[i]); const tw=doc.getTextWidth(t); doc.setFillColor(255,255,255); doc.rect(x-tw/2-0.8,y-fs*0.3,tw+1.6,fs*0.42,'F'); doc.text(t,x,y,{align:'center'}); });
    const multi=new Set(FR.corners.map(c=>String(c.design||''))).size>1;
    pts.forEach((p,i)=>{ const c=FR.corners[i]||{k:'?'}; const df=frDiffText(c.dug,c.design); const col=df.k==='ok'?[30,111,63]:df.k==='deep'?[138,90,0]:df.k==='high'?[179,38,30]:[107,107,107]; const [x,y]=T(p); const r=fs*0.33; doc.setFillColor(...col); doc.setDrawColor(...(c.from?[179,38,30]:[255,255,255])); doc.setLineWidth(c.from?0.5:0.3); doc.circle(x,y,r,'FD');
      doc.setFont('helvetica','bold'); doc.setFontSize(fs); doc.setTextColor(255,255,255); doc.text(String(c.k),x,y+fs*0.12,{align:'center'});
      const o=frOut(i); const tx=x+o.ox*(r+fs*0.2), ty=y+o.oy*(r+fs*0.2); const al=o.ox>0.3?'left':o.ox<-0.3?'right':'center'; const dy=o.oy>0.3?fs*0.35:o.oy<-0.3?-fs*0.12:fs*0.12;
      if(c.dug){ doc.setFont('helvetica','bold'); doc.setFontSize(fs*0.85); doc.setTextColor(...col); doc.text((+c.dug).toFixed(3),tx,ty+dy,{align:al}); }
      if(c.design&&(multi||c.from)){ doc.setFont('helvetica','normal'); doc.setFontSize(fs*0.7); doc.setTextColor(...(c.from?[179,38,30]:[110,110,110])); doc.text((c.dug?'':'design ')+(+c.design).toFixed(3),tx,ty+dy+(c.dug?fs*0.33:0),{align:al}); } });
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text([P.house,P.ref?'drg '+P.ref:'',P.flip?'flipped on site':'',P.src==='rect'?'plain rectangle, not from a drawing':'','widths in mm, levels m AOD, not to scale'].filter(Boolean).join(' · '),X+BW/2,Y+BH-2,{align:'center'}); }
  function buildFr(){ const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'}); const W=210,M=16,CW=W-2*M; const v=id=>$(id).value.trim(); const x=frPlotRec(v('fr-plot')); const d=(x&&x.design)||{};
    const plot=v('fr-plot').replace(/^plot\s*/i,''); let y=pdfHeader(doc,'FOUNDATION RECORD',`Plot ${plot||'?'}  ·  ${fmtDate(v('fr-date'))}  ·  ${v('fr-site')}`);
    y=cellRow(doc,M,y,CW,11,[{label:'Site',value:v('fr-site')||'–',w:CW*0.34},{label:'Client',value:v('fr-client')||'–',w:CW*0.26},{label:'Plot',value:plot||'–',w:CW*0.14,bold:true},{label:'House type',value:v('fr-type')||'–',w:CW*0.26,bold:true}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Foundation',value:d.found||'–',w:CW*0.26},{label:'Design depth',value:d.depth?d.depth+' m':'–',w:CW*0.18},{label:'Onto',value:[d.strata,d.borehole].filter(Boolean).join(', ')||'–',w:CW*0.3},{label:'FFL',value:d.ffl!=null?(+d.ffl).toFixed(3):'–',w:CW*0.26}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Recorded by',value:v('fr-by')||'–',w:CW*0.34},{label:'Dug on',value:v('fr-digdate')?fmtDate(v('fr-digdate')):'–',w:CW*0.22},{label:'Poured on',value:v('fr-pourdate')?fmtDate(v('fr-pourdate')):'–',w:CW*0.22},{label:'Inspected',value:v('fr-inspdate')?fmtDate(v('fr-inspdate')):'–',w:CW*0.22}]);
    y+=6; const H=(t)=>{ doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(t,M,y); y+=2.5; };
    if(FR.plan&&FR.plan.pts.length){ H('THE FOOTING AS DUG'); frPdfPlan(doc,M,y,CW,78); y+=82; }
    const table=(cols,rows)=>{ let cx=M; doc.setFillColor(...INK); doc.rect(M,y,CW,6,'F'); doc.setFontSize(6.5); doc.setTextColor(...PAPER); cols.forEach(c=>{ doc.text(c.l.toUpperCase(),cx+2.5,y+4); cx+=c.w; }); y+=6;
      rows.forEach((r,i)=>{ if(y>262){ doc.addPage(); y=42; } doc.setFillColor(...(i%2?PAPER:[255,255,255])); doc.setDrawColor(...LINE); doc.setLineWidth(0.25); doc.rect(M,y,CW,7,'FD'); cx=M; cols.forEach((c,k)=>{ doc.setFont('helvetica',r.bold&&r.bold[k]?'bold':'normal'); let fs=9; doc.setFontSize(fs); doc.setTextColor(...(r.red&&r.red[k]?[179,38,30]:INK)); let txt=String(r.v[k]||'–'); while(doc.getTextWidth(txt)>c.w-4&&fs>6){ fs-=0.5; doc.setFontSize(fs); } while(doc.getTextWidth(txt)>c.w-4&&txt.length>4) txt=txt.slice(0,-2)+'…'; doc.text(txt,cx+2,y+5); cx+=c.w; }); y+=7; }); y+=5; };
    H('LEVELS AT EACH CORNER (m AOD)');
    table([{l:'Corner',w:CW*0.09},{l:'Design',w:CW*0.14},{l:'Dug to',w:CW*0.14},{l:'Difference',w:CW*0.27},{l:'Design changed on site',w:CW*0.36}],
      FR.corners.map(c=>{ const df=frDiffText(c.dug,c.design); return {v:[c.k,c.design||'',c.dug||'',df.t||'',c.from?`was ${c.from}${c.why?': '+c.why:''}`:''],bold:[true,false,true,false,false],red:[false,false,false,df.k==='high',!!c.from]}; }));
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    const line=(lab,val)=>{ if(!val) return; if(y>270){ doc.addPage(); y=42; } doc.setFont('helvetica','bold'); doc.text(lab,M,y); doc.setFont('helvetica','normal'); const L=doc.splitTextToSize(val,CW-40); doc.text(L,M+40,y); y+=L.length*4.5+1.5; };
    const P=FR.plan; if(P&&P.pts.length){ const n=P.pts.length; const kk=i=>(FR.corners[i]||{}).k||'?'; const same=P.w.every(w=>w===P.w[0]); const chg=P.w.map((w,i)=>w!==P.w0[i]?`${kk(i)}–${kk((i+1)%n)} ${w} (design ${P.w0[i]})`:'').filter(Boolean);
      line('Footing widths',(same?`${P.w[0]} mm all round`:P.w.map((w,i)=>`${kk(i)}–${kk((i+1)%n)} ${w}`).join(', ')+' mm')+(chg.length?'. Changed on site: '+chg.join(', '):'')); }
    line('Ground at the bottom',v('fr-ground')); line('Dug deeper or wider',v('fr-deeper')); y+=4;
    if(y>235){ doc.addPage(); y=42; }
    H('POUR'); const tdf=frDiffText(v('fr-toc'),v('fr-tocd'));
    y=cellRow(doc,M,y,CW,11,[{label:'Mix',value:v('fr-mix')||'–',w:CW*0.16},{label:'Delivered m3',value:v('fr-m3')||'–',w:CW*0.16},{label:'Tickets',value:v('fr-tickets')||'–',w:CW*0.28},{label:'Top of concrete, design',value:v('fr-tocd')||'–',w:CW*0.2},{label:'Poured',value:v('fr-toc')||'–',w:CW*0.2,bold:true}]);
    if(tdf.t){ doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...(tdf.k==='high'?[179,38,30]:INK)); doc.text('Top of concrete: '+tdf.t,M,y+5); y+=6; }
    y+=6; H('PLOT DRAINAGE'); y+=2; doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    const dr=FR.drain==='design'?'As per the design drawings.':FR.drain==='notyet'?'Not yet installed at the date of this record.':'Differs from the design.'+(v('fr-drainnotes')?' '+v('fr-drainnotes'):'')+(FR.drainPdf?' As-built drawing attached at the back of this record.':''); const DL=doc.splitTextToSize(dr,CW); doc.text(DL,M,y+2); y+=DL.length*4.5+4;
    y=pdfPhotos(doc,FR.photos,y,'PHOTOS'); if(FR.drain==='differs'&&FR.drainPhotos.length) y=pdfPhotos(doc,FR.drainPhotos,y,'PLOT DRAINAGE AS BUILT');
    if(y>215){ doc.addPage(); y=42; } else y=Math.max(y,215);
    const sw=(CW-10)/2;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.setFillColor(...PAPER); doc.rect(M,y,sw,44,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('NHBC INSPECTION',M+2.5,y+4);
    const pr=FR.passed||'Not inspected yet'; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...(FR.passed==='Not passed'?[179,38,30]:FR.passed?[30,111,63]:GREY)); doc.text(doc.splitTextToSize(pr.toUpperCase(),sw-6),M+3,y+13);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(v('fr-inspnote')||'',sw-6).slice(0,2),M+3,y+24);
    doc.setDrawColor(...LINE); doc.line(M+3,y+30,M+sw-3,y+30); doc.setFontSize(9); doc.text(v('fr-insp')||'',M+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(v('fr-inspdate')?'Inspected '+fmtDate(v('fr-inspdate')):'',M+3,y+41);
    const x0=M+sw+10; doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.setFillColor(...PAPER); doc.rect(x0,y,sw,44,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('FOR R.J. HOWARD ENGINEERS LTD',x0+2.5,y+4);
    const sg=SIGS['fr-sig2'].data(); if(sg) try{ doc.addImage(sg,'PNG',x0+3,y+6,sw-6,22,undefined,'FAST'); }catch(e){}
    doc.setDrawColor(...LINE); doc.line(x0+3,y+30,x0+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(v('fr-by')||'',x0+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(fmtDate(v('fr-date')),x0+3,y+41);
    y+=50; doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize('Record of the foundation as dug and poured, against the engineer\'s schedule and drawing. The inspection result is as told to us by the inspector on the day.'+(v('fr-notes')?'  Notes: '+v('fr-notes'):''),CW),M,y);
    stampFooters(doc,'fr'); return doc; }
  async function buildFrBlob(){ const doc=buildFr(); const base=doc.output('arraybuffer'); if(!(FR.drain==='differs'&&FR.drainPdf&&window.PDFLib)) return new Blob([base],{type:'application/pdf'});
    try{ const out=await PDFLib.PDFDocument.load(base); const att=await PDFLib.PDFDocument.load(FR.drainPdf.data,{ignoreEncryption:true}); const pages=await out.copyPages(att,att.getPageIndices()); pages.forEach(p=>out.addPage(p)); const bytes=await out.save(); return new Blob([bytes],{type:'application/pdf'}); }
    catch(e){ console.warn('drainage pdf',e); return new Blob([base],{type:'application/pdf'}); } }
  pdfActions('fr',buildFrBlob,()=>`RJH_Foundation_Plot${($('fr-plot').value.trim()||'').replace(/\W/g,'')}_${$('fr-date').value}.pdf`,'fr-status',()=>!!$('fr-plot').value.trim());
  const FR_F=['fr-site','fr-client','fr-by','fr-date','fr-plot','fr-type','fr-digdate','fr-ground','fr-deeper','fr-pourdate','fr-mix','fr-m3','fr-tickets','fr-tocd','fr-toc','fr-insp','fr-inspdate','fr-inspnote','fr-notes','fr-drainnotes'];
  registerSave('fr',{section:'panel-fr',
    name:()=>{ const p=$('fr-plot').value.trim().replace(/^plot\s*/i,''); return p?`Plot ${p}${$('fr-type').value.trim()?' · '+$('fr-type').value.trim():''}`:''; }, site:()=>$('fr-site').value.trim(),
    get:()=>({f:FR_F.map(id=>$(id).value),corners:JSON.parse(JSON.stringify(FR.corners)),plan:FR.plan?JSON.parse(JSON.stringify(FR.plan)):null,photos:FR.photos.slice(),drain:FR.drain,drainPhotos:FR.drainPhotos.slice(),drainPdf:FR.drainPdf,passed:FR.passed,sig2:SIGS['fr-sig2'].data(),design:FR.design,v:2}),
    set:d=>{ FR_F.forEach((id,i)=>{ $(id).value=(d.f||[])[i]||''; }); FR.corners=(d.corners||[]).map(c=>({from:'',why:'',...c})); FR.plan=d.plan||null; FR.sel=null; FR.photos=(d.photos||[]).slice(); FR.drain=d.drain||'design'; FR.drainPhotos=(d.drainPhotos||[]).slice(); FR.drainPdf=d.drainPdf||null; FR.passed=d.passed||''; FR.design=d.design||null;
      frPassUI(); frDrainUI(); frDrainPdfUI(); frRender(); frDrainRender(); SIGS['fr-sig2'].load(d.sig2); frFromPlot(false);
      if(!FR.plan){ const x=frPlotRec($('fr-plot').value); frSetPlan(frPlanFromTpl(x)||frRectPlan(),true); } else { frRectUI(); frDraw(); } frCorners(); frSel(); frToc(); },
    clear:()=>{ FR_F.forEach(id=>{ $(id).value=''; }); $('fr-date').value=today(); FR.corners=[]; FR.plan=null; FR.sel=null; FR.photos=[]; FR.drain='design'; FR.drainPhotos=[]; FR.drainPdf=null; FR.passed=''; FR.design=null; frPassUI(); frDrainUI(); frDrainPdfUI(); frRender(); frDrainRender(); SIGS['fr-sig2'].clear(); $('fr-plotinfo').hidden=true; $('fr-plan').innerHTML=''; $('fr-rectwrap').hidden=true; frCorners(); frSel(); frToc(); },
    hasContent:d=>!!(d.f&&(d.f[4]||d.f[8]||d.f[11])||(d.corners||[]).some(c=>c.dug)||(d.photos||[]).length) });
  window.FR=FR; window.frFromPlot=frFromPlot; window.buildFr=buildFr; window.frDraw=frDraw;
