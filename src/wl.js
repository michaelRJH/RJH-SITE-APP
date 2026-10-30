  // ---- Trench widths: one simple list under the sketch ----
  (function(){
    const box=$('fd-wl'); if(!box) return; const CH=[450,600,750,900,1050];
    let key='';
    function build(){ const dn=$('fd-drawnote'); if(dn&&!isPhoto()&&FD.pts.length) dn.textContent='Tap a number to change it. Drag a corner to move it.'+(FD.walls.length?' Internal walls stay put when you move a side, so drag their ends too.':''); const n=NS(); box.hidden=!(n>0&&!isPhoto());
      if(box.hidden){ key=''; return; }
      const k=n+'|'+isRun(); if(k!==key){ key=k;
        box.innerHTML=`<div class="lhead" style="grid-template-columns:1fr"><span>Trench width (outer walls)</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">${CH.map(w=>`<button type="button" class="btn" data-all="${w}" style="margin:0;padding:12px 0;width:calc(33.3% - 6px);font-size:18px">${w}</button>`).join('')}<div class="in" style="width:calc(33.3% - 6px)"><input type="number" inputmode="numeric" step="25" id="fd-wl-all" placeholder="Other" style="font-size:18px;min-width:0"><span class="unit">mm</span></div></div>
        <div class="note" id="fd-wl-sum" style="margin:0 0 8px"></div>
        <details id="fd-wl-det"><summary style="font-weight:700;padding:8px 0;cursor:pointer">Change one side</summary>
        <div style="display:grid;gap:6px">${Array.from({length:n},(_,i)=>`<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center"><div><b data-n="${i}"></b> <span class="note" data-l="${i}" style="margin:0"></span></div><div class="in" style="width:160px"><input type="number" inputmode="numeric" step="25" data-w="${i}" style="font-size:18px;min-width:0"><span class="unit">mm</span></div></div>`).join('')}</div></details>`;
        const all=$('fd-wl-all'); all.addEventListener('change',()=>{ const v=parseFloat(all.value); if(!(v>0)) return; push(); FD.sides.forEach((s,i)=>{ if(i<NS()){ s.w=v; s.chk=0; } }); all.value=''; drawFd(); });
        if(new Set(FD.sides.slice(0,n).map(s=>s.w)).size>1||FD.sides.some(s=>s.chk)) $('fd-wl-det').open=true;
        box.querySelectorAll('[data-all]').forEach(b=>b.addEventListener('click',()=>{ push(); FD.sides.forEach((s,i)=>{ if(i<NS()){ s.w=+b.dataset.all; s.chk=0; } }); drawFd(); }));
        box.querySelectorAll('[data-w]').forEach(inp=>inp.addEventListener('input',()=>{ const i=+inp.dataset.w, v=parseFloat(inp.value); if(!(v>0)||!FD.sides[i]) return; if(!inp._p){ push(); inp._p=1; } FD.sides[i].w=v; FD.sides[i].chk=0; drawFd(); }));
        box.querySelectorAll('[data-w]').forEach(inp=>inp.addEventListener('blur',()=>{ inp._p=0; }));
      }
      const ws=FD.sides.slice(0,n).map(s=>+s.w), mn=Math.min(...ws), mx=Math.max(...ws);
      box.querySelectorAll('[data-all]').forEach(b=>{ const on=mn===mx&&mn===+b.dataset.all; b.classList.toggle('primary',on); });
      const nc=FD.sides.slice(0,n).filter(s=>s.chk).length; const sm=$('fd-wl-sum'); if(sm) sm.innerHTML=(mn===mx?'All outer sides '+mn+' mm.':'Sides differ, '+mn+' to '+mx+' mm.')+(nc?' <b style="color:var(--danger)">'+nc+' to check.</b>':'');
      for(let i=0;i<n;i++){ const nm=box.querySelector(`[data-n="${i}"]`), ln=box.querySelector(`[data-l="${i}"]`), inp=box.querySelector(`[data-w="${i}"]`); if(!nm) continue;
        nm.textContent=sideName(i); ln.innerHTML=sideLen(i).toFixed(2)+' m'+((FD.sides[i]||{}).label?' · '+FD.sides[i].label:'')+((FD.sides[i]||{}).chk?' <b style="color:var(--danger)">CHECK</b>':'');
        if(document.activeElement!==inp&&FD.sides[i]) inp.value=FD.sides[i].w; }
    }
    const old=drawFd; drawFd=function(){ const r=old.apply(this,arguments); try{ build(); }catch(e){} return r; };

  })();

  // ---- keep the sketch screen simple for a phone ----
  (function(){
    const note=$('fd-drawnote'); if(note) note.textContent='Tap a number to change it. Drag a corner to move it.';
    document.querySelectorAll('p.note').forEach(p=>{ if(p.textContent.startsWith('Pinch to zoom in on the detail')) p.hidden=true; });
    const adv=['fd-mode-bay','fd-mode-notch','fd-mode-split','fd-mode-wall','fd-mode-point','fd-snap','fd-clear'].map(id=>$(id)).filter(Boolean); if(!adv.length) return;
    const tg=document.createElement('button'); tg.type='button'; tg.className='tb'; tg.id='fd-more'; tg.textContent='More tools ▾';
    adv[0].parentNode.insertBefore(tg,adv[0]);
    const set=o=>{ adv.forEach(b=>{ b.style.display=o?'':'none'; }); tg.textContent=o?'Fewer tools ▴':'More tools ▾'; }; set(false);
    tg.addEventListener('click',()=>set(adv[0].style.display==='none'));
  })();
  // ---- fold the record into sections so a phone shows only what is being worked on ----
  (function(){
    const panel=$('panel-fd'); if(!panel) return;
    const OPEN={'Plot':1,'fd-lvh':1,'Concrete':1,'Photos':1,'Comments':1};
    const MERGE={'3D view':1,'Cross sections':1,'Step detail':1};
    const KEY='rjh-fd-acc'; let st={}; try{ st=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
    const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} };
    const heads=[...panel.children].filter(c=>c.tagName==='H2'&&!MERGE[c.textContent.trim()]);
    const keyOf=h=>h.id||h.textContent.trim();
    window.__fdAcc={};
    heads.forEach(h=>{ const name=keyOf(h); const body=document.createElement('div'); body.className='accb';
      let n=h.nextElementSibling; const move=[];
      while(n&&!(n.tagName==='H2'&&!MERGE[n.textContent.trim()])&&!(n.tagName==='DIV'&&(n.id==='fd-photowrap'||n.id==='fd-drawwrap'))){ move.push(n); n=n.nextElementSibling; }
      if(!move.length) return;
      h.after(body); move.forEach(m=>body.appendChild(m));
      h.classList.add('acc'); const sum=document.createElement('span'); sum.className='accs'; h.appendChild(sum);
      const set=o=>{ body.hidden=!o; h.classList.toggle('open',o); };
      set(st[name]!==undefined?st[name]:!!OPEN[name]);
      h.addEventListener('click',()=>{ const o=body.hidden; set(o); st[name]=o; save(); if(o){ try{ drawFd(); }catch(e){} } });
      window.__fdAcc[name]={h,body,sum,set};
    });
  })();
  // ---- one-line summaries on folded sections ----
  (function(){
    const A=()=>window.__fdAcc||{}; const tx=id=>{ const e=$(id); return e?(e.value!==undefined?e.value:e.textContent).trim():''; };
    function sums(){ const a=A(); const put=(k,html)=>{ if(a[k]) a[k].sum.innerHTML=html; };
      const toc=tx('fd-dtoc'), exc=tx('fd-dexc');
      put('Design levels', toc&&exc?`TOC ${toc} · U/S ${exc}`:'<span style="color:var(--danger)">not entered</span>');
      let L=0,n=0; try{ for(let i=0;i<NS();i++){ L+=sideLen(i); n++; } (FD.walls||[]).forEach(w=>{ for(let k=0;k<w.pts.length-1;k++){ L+=Math.hypot(w.pts[k+1].x-w.pts[k].x,w.pts[k+1].y-w.pts[k].y); } n++; }); }catch(e){}
      put('Runs', n?`${n} runs · ${L.toFixed(1)} m`:'');
      const dig=tx('fd-dig'); put('Excavation', dig&&dig!=='–'?dig+' m³ dug':'');
      const dr=document.querySelector('#fd-drain [aria-pressed="true"]'); put('Plot drainage', dr?dr.textContent.trim():'');
      const ni=document.querySelectorAll('#fd-insp .lrow').length; put('Inspections', ni?ni+' logged':'none yet');
      const np=document.querySelectorAll('#fd-photos img').length; put('Photos', np?np+' taken':'');
    }
    window.__fdSums=sums;
    const old=drawFd; drawFd=function(){ const r=old.apply(this,arguments); try{ sums(); }catch(e){} return r; };
    const p=$('panel-fd'); if(p){ p.addEventListener('input',()=>{ try{ sums(); }catch(e){} }); p.addEventListener('click',()=>setTimeout(()=>{ try{ sums(); }catch(e){} },50)); }
  })();
  // ---- tapping the missing-levels warning takes you to the boxes ----
  (function(){ const w=$('fd-warn'); if(!w) return; w.addEventListener('click',()=>{ const a=(window.__fdAcc||{})['Design levels']; if(a){ a.set(true); } const e=$('fd-dtoc'); if(e){ e.scrollIntoView({block:'center'}); setTimeout(()=>e.focus(),300); } }); })();
  // ---- drawing details fold to one line once filled; remember who records ----
  (function(){
    const ids=['fd-type','fd-dwg','fd-rev','fd-ftype']; const flds=ids.map(id=>$(id)&&$(id).closest('.field')).filter(Boolean); if(flds.length<4) return;
    const line=document.createElement('div'); line.className='fd-dsum'; line.style.cssText='grid-column:1/-1;border:2px solid var(--line);border-radius:var(--r);padding:10px 12px;display:flex;gap:10px;align-items:center;justify-content:space-between';
    flds[0].before(line); let force=false;
    function upd(){ const v=ids.map(id=>($(id).value||'').trim()); const ft=$('fd-ftype'); const ftx=ft&&ft.selectedIndex>=0?ft.options[ft.selectedIndex].text:v[3];
      const full=v[0]&&v[1]&&v[3]&&!force; line.hidden=!full; flds.forEach(f=>f.hidden=full);
      const oth=$('fd-ftype-other-wrap'); if(full&&oth) oth.hidden=true;
      if(full) line.innerHTML=`<div style="min-width:0"><b>${v[0].replace(/</g,'&lt;')}</b><div class="note" style="margin:2px 0 0;overflow-wrap:anywhere">${v[1].replace(/</g,'&lt;')}${v[2]?' rev '+v[2].replace(/</g,'&lt;'):''} · ${String(ftx).replace(/</g,'&lt;')}</div></div><button type="button" class="btn" style="margin:0;width:auto;padding:8px 12px">Change</button>`;
      const b=line.querySelector('button'); if(b) b.onclick=()=>{ force=true; upd(); $('fd-type').focus(); }; }
    ids.forEach(id=>{ $(id).addEventListener('change',()=>{ force=false; setTimeout(upd,0); }); });
    window.__fdDsum=()=>{ force=false; upd(); };
    const by=$('fd-by'); const K='rjh-fd-by';
    by.addEventListener('input',()=>{ try{ if(by.value.trim()) localStorage.setItem(K,by.value.trim()); }catch(e){} });
    const refill=()=>{ try{ const v=localStorage.getItem(K); if(v&&!by.value.trim()) by.value=v; }catch(e){} upd(); };
    document.addEventListener('click',()=>setTimeout(refill,120),true); setTimeout(refill,700);
  })();
  // ---- tapping the sketch opens its panel right under the sketch, with width chips ----
  (function(){
    const wl=$('fd-wl'), sd=$('fd-side'); if(!wl||!sd) return;
    sd.after(wl);   // width list sits below the tap panels, so a tapped side shows straight under the sketch
    ['fd-side','fd-corner','fd-bay'].forEach(id=>{ const el=$(id); if(!el) return;
      new MutationObserver(()=>{ if(!el.hidden){ const r=el.getBoundingClientRect(); if(r.top>window.innerHeight-120||r.bottom<0) el.scrollIntoView({block:'nearest',behavior:'smooth'}); } }).observe(el,{attributes:true,attributeFilter:['hidden']}); });
    const w=$('fs-w'); if(!w) return; const fld=w.closest('.field').parentNode;
    const row=document.createElement('div'); row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 10px';
    row.innerHTML=[450,600,750,900,1050].map(v=>`<button type="button" class="btn" data-sw="${v}" style="margin:0;padding:10px 0;flex:1;min-width:56px;font-size:16px">${v}</button>`).join('');
    fld.after(row);
    const mark=()=>{ row.querySelectorAll('[data-sw]').forEach(b=>b.classList.toggle('primary',+b.dataset.sw===parseFloat(w.value))); };
    row.addEventListener('click',e=>{ const b=e.target.closest('[data-sw]'); if(!b) return; w.value=b.dataset.sw; w.dispatchEvent(new Event('input',{bubbles:true})); w.dispatchEvent(new Event('change',{bubbles:true})); mark(); });
    w.addEventListener('input',()=>{ if(FD.sel&&FD.sel.t==='side'&&FD.sides[FD.sel.i]) FD.sides[FD.sel.i].chk=0; mark(); try{ drawFd(); }catch(e){} });
    new MutationObserver(mark).observe(sd,{attributes:true,attributeFilter:['hidden']}); 
  })();
  // ---- dig day / pour day: only the boxes needed that day ----
  (function(){ const seg=$('fd-stage'), w=$('fd-lvwrap'); if(!seg||!w) return; const K='rjh-fd-stage';
    const set=st=>{ w.classList.toggle('st-dig',st==='dig'); w.classList.toggle('st-pour',st==='pour'); seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.st===st)); try{ localStorage.setItem(K,st); }catch(e){} };
    let st='all'; try{ st=localStorage.getItem(K)||'all'; }catch(e){} set(st);
    seg.addEventListener('click',e=>{ const b=e.target.closest('[data-st]'); if(b) set(b.dataset.st); });
  })();
