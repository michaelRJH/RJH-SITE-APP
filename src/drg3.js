  // ---- Foundation record: draw the footing from the engineer's drawing ----
  const DRG_DEFAULT=/*DRG_DEFAULT*/[];
  (function(){
    const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const HANDS={AS:'AS (as drawn)',OP:'OP (opposite hand)'}, FILLS={eng:'Engineered fill',trad:'Traditional'};
    const boxEl=$('fd-drgbox'), plotEl=$('fd-plot'); if(!boxEl||!plotEl) return;
    let hits=[], timer=0;
    function find(n){ const out=[]; DRG_DEFAULT.forEach(s=>s.boxes.forEach(b=>{ if(b.k==='plan'&&(b.plots||[]).includes(n)) out.push({s,b}); })); return out; }
    const setV=(id,v)=>{ const e=$(id); if(!e) return; e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); };
    const houseText=(b)=>b.house==='Garage'?('Garage '+(b.tag||'')).trim():(b.house+(b.hand?' ('+b.hand+')':''));
    let drawnId='', drawnPart=null, typedPlot='';
    function render(){
      const n=parseInt(plotEl.value,10);
      if(!plotEl.value.trim()||isNaN(n)){ boxEl.hidden=true; hits=[]; return; }
      hits=find(n).sort((x,y)=>(!!y.b.tpl-!!x.b.tpl)||((x.b.house==='Garage')-(y.b.house==='Garage'))); boxEl.hidden=false;
      if(!hits.length){ boxEl.innerHTML=`<b>Plot ${n} is not on the engineer's drawings I have.</b><div class="note" style="margin:4px 0 0">Draw the footing below, or pick a house type.</div>`; return; }
      const h=hits[0], s=h.s, b=h.b, ref=s.ref.replace(/-S3$/,''), info=s.status&&/information/i.test(s.status);
      const others=hits.slice(1).map((o,i)=>`<div class="note" style="margin:6px 0 0">Also on ${esc(o.s.ref.replace(/-S3$/,'').split('-').pop())}: <b>${esc(houseText(o.b))}</b>${o.b.tpl?` <a href="#" data-alt="${i+1}">draw this instead</a>`:' (draw it yourself)'}</div>`).join('');
      const checks=[b.warn,info?'issued for information only':''].filter(Boolean);
      if(drawnId===b.id){ const t=b.tpl||{}, u=t.units||1, pw=(t.pw||[]).length===u-1&&u>1; const names=u===3?['Left','Middle','Right']:(t.pw&&t.pw[0]&&t.pw[0].axis==='h'?['Top','Bottom']:['Left','Right']);
          const pairTxt=u>1?(drawnPart==null?`<div class="note" style="margin:6px 0 0;color:var(--danger)"><b>This sheet draws ${u===2?'a pair':'a row of '+u} as one block.</b> The sketch and concrete cover ${u===2?'both houses':'all '+u+' houses'}.</div>`:`<div class="note" style="margin:6px 0 0">${names[drawnPart]} house of the ${u===2?'pair':'block'}. The party wall footing is split down the middle, so each house carries half its concrete.</div>`):'';
          const pairBtns=pw?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0">${names.map((nm,i)=>`<button type="button" class="btn${drawnPart===i?' primary':''}" data-part="${i}" style="margin:0;flex:1;padding:10px 4px;width:auto">${nm} house</button>`).join('')}<button type="button" class="btn${drawnPart==null?' primary':''}" data-part="all" style="margin:0;flex:1;padding:10px 4px;width:auto">Whole block</button></div>`:'';
          boxEl.innerHTML=`<b>Footing drawn from the engineer's drawing</b>${pairTxt}${pairBtns}<div class="note" style="margin:6px 0 0">Check it against the sheet. Widths marked <b style="color:var(--danger)">CHECK</b> were not on the drawing.</div><div class="note" style="margin:6px 0 0"><a href="#" data-redraw="0">Draw it again from the drawing</a></div>${others}`; }
      else boxEl.innerHTML=`<b>Plot ${n}: ${esc(houseText(b))}</b><div class="note" style="margin:2px 0 0">${esc(FILLS[b.fill]||'')} · ${esc(ref)} rev ${esc(s.rev||'')}</div>
          ${checks.length?`<div class="note" style="margin:6px 0 0;color:var(--danger)"><b>Check:</b> ${esc(checks.join('. '))}</div>`:''}
          ${b.tpl?`<button type="button" class="btn primary" data-draw="0" style="margin:10px 0 0;width:100%">Draw the footing</button><div class="note" style="margin:8px 0 0"><a href="#" data-fill="0">Just fill in the house type and drawing</a></div>`:`<button type="button" class="btn primary" data-fill="0" style="margin:10px 0 0;width:100%">Fill in the house type and drawing</button><div class="note" style="margin:6px 0 0">No sketch for this one. Draw it below.</div>`}${others}`;
      boxEl.insertAdjacentHTML('beforeend','<div class="note" id="fd-drg-st" style="margin:6px 0 0"></div>');
      const on=(sel,f)=>boxEl.querySelectorAll(sel).forEach(e=>e.addEventListener('click',ev=>{ ev.preventDefault(); f(e); }));
      on('[data-fill]',e=>fill(hits[+e.dataset.fill])); on('[data-draw]',e=>draw(hits[+e.dataset.draw])); on('[data-redraw]',()=>{ draw(hits[0],drawnPart); }); on('[data-part]',e=>{ const v=e.dataset.part; draw(hits[0],v==='all'?null:+v); });
      on('[data-alt]',e=>{ const k=+e.dataset.alt; const x=hits[k]; hits.splice(k,1); hits.unshift(x); draw(x); });
    }
    function fill(h,quiet){ const s=h.s,b=h.b; if($('fd-dev')&&!$('fd-dev').value.trim()) setV('fd-dev','Strata Homes'); if($('fd-site')&&!$('fd-site').value.trim()) setV('fd-site','Expression, Chesterfield'); setV('fd-type',houseText(b)); setV('fd-dwg',s.ref.replace(/-S3$/,'')); setV('fd-rev',s.rev||''); if(b.fill==='eng') setV('fd-ftype','Engineered strip 450'); else if(b.fill==='trad') setV('fd-ftype','Traditional strip 300');
      if(window.__fdDsum) window.__fdDsum(); if(!quiet){ $('fd-drg-st').textContent='Filled in: house type, drawing, revision'+(b.fill?' and foundation type':'')+'. Check them against the drawing.'; toast('Filled from the drawing'); } }
    // ---- geometry: whole block, or one house cut out at the party wall(s) ----
    function geom(t,part){
      let P=t.pts.map((p,i)=>({x:p[0],y:p[1],w:t.w[i],q:(t.q||[]).includes(i)?1:0}));
      let W=(t.walls||[]).map(w=>({a:{x:w.p[0][0],y:w.p[0][1]},b:{x:w.p[1][0],y:w.p[1][1]},w:w.w}));
      const sideAt=(Q,k,at)=>{ const A=Q[k],B=Q[(k+1)%Q.length],L=Math.hypot(B.x-A.x,B.y-A.y)||1; return {x:A.x+(B.x-A.x)*at/L,y:A.y+(B.y-A.y)*at/L}; };
      let Bs=(t.bays||[]).map(y=>({...y,pt:sideAt(P,y.side,y.at)}));
      if(part!=null&&t.pw&&t.pw.length){ const pw=t.pw, ax=pw[0].axis, key=ax==='v'?'x':'y';
        const cuts=[]; const cut=(p,sg)=>({at:p.at+sg*p.w/4000,sg,w:Math.round(p.w/2),pat:p.at}); if(part>0) cuts.push(cut(pw[part-1],1)); if(part<pw.length) cuts.push(cut(pw[part],-1));
        cuts.forEach(c=>{ const inn=p=>c.sg*(p[key]-c.at)>=-1e-6; const X=(S,E)=>{ const f=(c.at-S[key])/(E[key]-S[key]); return {x:S.x+(E.x-S.x)*f,y:S.y+(E.y-S.y)*f}; };
          const out=[]; const n=P.length;
          for(let i=0;i<n;i++){ const S=P[i],E=P[(i+1)%n],si=inn(S),ei=inn(E),nx=P[(i+1)%n];
            if(si&&ei) out.push({x:E.x,y:E.y,w:nx.w,q:nx.q});
            else if(si&&!ei){ const I=X(S,E); out.push({...I,w:c.w,q:0,lab:'Party (half)'}); }
            else if(!si&&ei){ const I=X(S,E); out.push({...I,w:S.w,q:S.q}); out.push({x:E.x,y:E.y,w:nx.w,q:nx.q}); } }
          P=out.filter((p,i)=>{ const o=out[(i+1)%out.length]; return Math.hypot(o.x-p.x,o.y-p.y)>0.01; });
          W=W.filter(w=>!(Math.abs(w.a[key]-c.pat)<0.06&&Math.abs(w.b[key]-c.pat)<0.06)).map(w=>{ const ia=inn(w.a),ib=inn(w.b); if(ia&&ib) return w; if(!ia&&!ib) return null; const I=X(w.a,w.b); return ia?{...w,b:I}:{...w,a:I}; }).filter(w=>w&&Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y)>0.2);
          Bs=Bs.filter(y=>inn(y.pt)); });
        // drop straight-through corners left by the cut
        for(let k=0;k<P.length&&P.length>3;){ const a=P[(k-1+P.length)%P.length],b=P[k],c=P[(k+1)%P.length]; const cr=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x); if(Math.abs(cr)<1e-6){ const prev=(k-1+P.length)%P.length; if(Math.hypot(c.x-b.x,c.y-b.y)>Math.hypot(b.x-a.x,b.y-a.y)){ P[prev].w=b.w; P[prev].q=b.q; P[prev].lab=b.lab; } P.splice(k,1); } else k++; }
        // start at the top-left corner, like the drawn block
        const k0=P.reduce((m,p,i)=>(Math.round(p.y*10)<Math.round(P[m].y*10)||(Math.round(p.y*10)===Math.round(P[m].y*10)&&p.x<P[m].x))?i:m,0); P=P.slice(k0).concat(P.slice(0,k0));
        const mx=Math.min(...P.map(p=>p.x))-1, my=Math.min(...P.map(p=>p.y))-1;
        P.forEach(p=>{ p.x=+(p.x-mx).toFixed(3); p.y=+(p.y-my).toFixed(3); }); W.forEach(w=>{ [w.a,w.b].forEach(q=>{ q.x=+(q.x-mx).toFixed(3); q.y=+(q.y-my).toFixed(3); }); }); Bs.forEach(y=>{ y.pt={x:y.pt.x-mx,y:y.pt.y-my}; });
        // put each kept nib back on whichever side it sits on
        Bs=Bs.map(y=>{ let best=null; P.forEach((A,i)=>{ const B=P[(i+1)%P.length],L=Math.hypot(B.x-A.x,B.y-A.y)||1,ux=(B.x-A.x)/L,uy=(B.y-A.y)/L; const at=(y.pt.x-A.x)*ux+(y.pt.y-A.y)*uy, off=Math.abs((y.pt.x-A.x)*uy-(y.pt.y-A.y)*ux); if(at>-0.05&&at<L+0.05&&(!best||off<best.off)) best={off,i,at}; }); return best?{...y,side:best.i,at:+best.at.toFixed(2)}:null; }).filter(Boolean);
      }
      return {P,W,Bs};
    }
    function draw(h,part){ const b=h.b, t=b.tpl; if(!t) return;
      const lv=[...FD.pts,...FD.spts].some(p=>p.gl||p.exc||p.toc);
      if(FD.pts.length&&(lv||drawnId!==b.id)&&!confirm('Replace the sketch with the engineer\'s footing?'+(lv?' The levels you entered will be cleared.':''))) return;
      const g=geom(t,part);
      push(); FD.pts=g.P.map(p=>({x:p.x,y:p.y,gl:'',exc:'',toc:'',nm:'',dU:''}));
      FD.sides=g.P.map(p=>({w:p.w,label:p.lab||'',steps:[],chk:p.q?1:0}));
      FD.walls=g.W.map(w=>({pts:[{x:w.a.x,y:w.a.y},{x:w.b.x,y:w.b.y}],w:w.w,label:'',gl:'',exc:'',toc:''}));
      FD.bays=g.Bs.map(y=>({side:y.side,at:y.at,w:y.w,d:y.d,fw:y.fw,label:y.label||'Nib',exc:'',toc:''})); FD.spts=[]; FD.ppts=[];
      FD.closed=true; FD.kind='plot'; FD.hand='as'; handUI(); setKindUI(); fill(h,true); FD.sel=null; $('fd-side').hidden=true; FD.autoFit=true; drawFd(); const ft=$('fd-fit'); if(ft) ft.click(); if(window.__fdDsum) window.__fdDsum();
      // plot label: the whole block is recorded as e.g. "132-133"; one house keeps the number typed
      const units=t.units||1; if(!typedPlot||drawnId!==b.id) typedPlot=plotEl.value.trim(); const n0=parseInt(typedPlot,10); const grp=(t.grp||[]).find(gp=>gp.includes(n0));
      if(units>1){ plotEl.value=(part==null&&grp)?grp[0]+'-'+grp[grp.length-1]:typedPlot; const ty=$('fd-type'); if(ty) ty.value=part==null?String(b.name||b.house).split('·')[0].trim():b.house; }
      drawnPart=part; drawnId=b.id; render(); toast(part==null?'Footing drawn':'One house kept'); }
    plotEl.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(render,250); });
    window.addEventListener('pageshow',render); plotEl.addEventListener('change',()=>{ drawnId=''; }); setTimeout(render,600);
    window.RJH_DRG={ find, render, data:DRG_DEFAULT };
  })();
