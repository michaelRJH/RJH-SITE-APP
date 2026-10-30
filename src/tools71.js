  // ---- v71: each tool puts first what the lad opens it for ----
  const t71esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // the nodes under each heading of a sheet, so whole sections can be moved
  function sectionsOf(sec){ const out={}; let cur=null; [...sec.children].forEach(n=>{ if(n.tagName==='H2'){ cur=n.textContent.trim().toLowerCase(); out[cur]=[n]; } else if(cur) out[cur].push(n); }); return out; }
  // ---- manhole card: ref, then the clock, then photos, then levels. Cover, chamber and section fold away ----
  (function(){ const sec=$('panel-mh'); if(!sec) return; const S=sectionsOf(sec); const lv=S['levels'], pipes=S['pipes'], photos=S['photos'], cov=S['cover and chamber'], cs=S['chamber section'], notes=S['notes'];
    if(!lv||!pipes||!photos||!notes) return;
    pipes.forEach(n=>lv[0].before(n)); photos.forEach(n=>lv[0].before(n));
    if(cov&&cs){ const d=document.createElement('details'); d.className='foldsec'; d.innerHTML='<summary>Cover, chamber and section <small>fill in if you know, the office can do it</small></summary>'; notes[0].before(d); [...cov,...cs].forEach(n=>d.appendChild(n));
      d.addEventListener('toggle',()=>{ if(d.open&&typeof calcMh==='function') try{ calcMh(); }catch(e){} }); } })();
  // the job's manholes, with which have a card: tap one to start its card
  async function mhList(){ const box=$('mh-joblist'); if(!box) return; const p=(typeof PACK!=='undefined')&&PACK.get(); const mhs=(p&&p.manholes)||[]; if(!mhs.length){ box.hidden=true; return; }
    const s=SITE.get(); const done=new Set(); try{ (await DB.all()).filter(r=>r.tool==='mh'&&String(r.job||r.site||'').toLowerCase()===String(s.job||'').toLowerCase()).forEach(r=>done.add(String(((r.data||{}).f||[])[0]||'').trim().toLowerCase())); }catch(e){}
    const reg=JOBREG.get(s.job); ((reg&&reg.rows)||[]).filter(x=>x.type==='Manhole cards').forEach(x=>done.add(String(x.ref||x.title||'').replace(/^MH\s+/i,'').split(' ')[0].trim().toLowerCase()));
    const n=mhs.filter(m=>done.has(String(m.ref).toLowerCase())).length;
    box.hidden=false; box.innerHTML=`<details${n<mhs.length&&!$('mh-ref').value.trim()?' open':''}><summary>Manholes on this job <small>${n} of ${mhs.length} done</small></summary><div class="mhchips">${mhs.map(m=>{ const d=done.has(String(m.ref).toLowerCase()); return `<button type="button" class="mhchip${d?' done':''}" data-r="${t71esc(m.ref)}">${t71esc(m.ref)}${d?' ✓':''}</button>`; }).join('')}</div></details>`;
    box.querySelectorAll('.mhchip').forEach(b=>b.addEventListener('click',async()=>{ const o=SAVERS.mh; const cur=$('mh-ref').value.trim();
      if(cur&&cur.toLowerCase()===b.dataset.r.toLowerCase()) return;
      // is there a card for it on this phone already? open that; otherwise save what is open and start a new one
      const have=(await DB.all()).filter(r=>r.tool==='mh'&&String(((r.data||{}).f||[])[0]||'').trim().toLowerCase()===b.dataset.r.toLowerCase()).sort((a,b2)=>b2.date.localeCompare(a.date))[0];
      if(cur||(o.currentId)){ try{ await saveQuiet('mh'); }catch(e){} if(o.currentId&&window.syncEnqueue) syncEnqueue('mh',o.currentId); }
      if(have){ o.set(have.data); o.currentId=have.id; o.rev=have.rev||0; toast('Opened card '+b.dataset.r); }
      else { o.clear(); o.currentId=null; o.rev=0; if(PREFILL.mh) prefill(PREFILL.mh); $('mh-ref').value=b.dataset.r; $('mh-ref').dispatchEvent(new Event('change',{bubbles:true})); toast('New card for '+b.dataset.r); }
      syncStatus(); mhList(); window.scrollTo(0,0); })); }
  window.mhList=mhList;
  (function(){ const ref=$('mh-ref'); if(!ref) return; const box=document.createElement('div'); box.id='mh-joblist'; box.className='joblist'; box.hidden=true; const strip=$('panel-mh').querySelector('.jobstrip'); (strip||ref.closest('.grid2')).after(box);
    document.querySelector('[data-go="panel-mh"]').addEventListener('click',()=>setTimeout(mhList,80)); ref.addEventListener('change',()=>setTimeout(mhList,50)); })();
  // ---- foundation record: house types come from the job (set up in the office), and the long sections start folded ----
  (function(){ const sec=$('panel-fd'); if(!sec) return;
    const keep=/^(plot|draw the footing|levels at each corner|concrete|photos|design levels)/i;
    const fold=()=>sec.querySelectorAll('h2.acc').forEach(h=>{ const t=h.firstChild&&h.firstChild.nodeValue||h.textContent; if(!keep.test(String(t).trim())&&h.classList.contains('open')) h.click(); });
    setTimeout(fold,400);
    const w=$('fd-warn'); if(w){ const mo=new MutationObserver(()=>{ if(/not entered/i.test(w.textContent)&&!w.dataset.soft){ w.dataset.soft='1'; w.style.color='var(--ink-2)'; } }); mo.observe(w,{childList:true,characterData:true,subtree:true}); } })();
  // ---- remedials: the snags first; the details of their list underneath ----
  (function(){ const sec=$('panel-rm'); if(!sec) return; const S=sectionsOf(sec); const list=S['the list'], snags=S['snags']; if(!list||!snags) return;
    const d=document.createElement('details'); d.className='foldsec'; d.innerHTML='<summary>About their list <small>their ref, date, who raised it, notes</small></summary>';
    const after=snags[snags.length-1]; after.after(d); list.slice(1).forEach(n=>d.appendChild(n)); list[0].remove();
    const add=document.createElement('button'); add.type='button'; add.className='btn primary rm-bigadd'; add.textContent='+ Add a snag'; snags[0].after(add);
    add.addEventListener('click',()=>{ const b=$('rm-additem'); if(b) b.click(); else { const w=$('rm-addwrap'); if(w) w.open=true; } });
    const upd=()=>{ let n=0; try{ n=RM.items.length; }catch(e){} const f=$('rm-filter'); if(f) f.hidden=n<2; const w=$('rm-addwrap'); add.hidden=false; if(w&&w.tagName==='DETAILS'){ const s=w.querySelector('summary'); if(s) s.textContent='Paste their list or load their spreadsheet'; } if(d.querySelector('#rm-ref')&&!$('rm-ref').value&&!$('rm-notes').value) d.open=false; };
    const _rr=rmRender; rmRender=function(...x){ const r=_rr.apply(this,x); try{ upd(); }catch(e){} return r; }; sec.addEventListener('click',()=>setTimeout(upd,30)); document.querySelector('[data-go="panel-rm"]').addEventListener('click',()=>setTimeout(upd,60)); setInterval(()=>{ if(!sec.hidden) upd(); },1500); upd(); })();
  // ---- put a calculator's answer on today's sheet ----
  function putOnSheet(text,qty,unit){ const box=document.createElement('div'); box.className='putsheet';
    box.innerHTML=`<p class="note" style="margin:0 0 6px"><b>${t71esc(text)}</b> goes on:</p><div class="btnrow" style="margin:0"><button class="btn" type="button" data-t="dw">Dayworks materials</button><button class="btn" type="button" data-t="aw">Extras sizes</button></div>`;
    box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const t=b.dataset.t, o=SAVERS[t];
      if(t==='dw'){ listRow($('dw-mat'),[{p:'Description',v:text},{p:'Qty',t:'number',v:qty},{p:'Unit',v:unit},{p:'No.',v:''}],typeof dwSum==='function'?dwSum:()=>{}); }
      else { const ta=$('aw-sizes'); ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+text; ta.dispatchEvent(new Event('input',{bubbles:true})); }
      $(o.section).dispatchEvent(new Event('change')); box.remove(); toast('Added to '+(t==='dw'?'the dayworks sheet':'the extras sheet')+'. Check it there.'); go(o.section); }));
    return box; }
  [['conc','Concrete',()=>{ const e=document.querySelector('#panel-conc .ticket .big'); const v=e?parseFloat(e.textContent):NaN; return isNaN(v)||!v?null:{text:`Concrete ${v} m³`,qty:v,unit:'m³'}; }],
   ['bedding','Pipe bedding',()=>{ const e=document.querySelector('#panel-bedding .ticket .big'); const v=e?parseFloat(e.textContent):NaN; return isNaN(v)||!v?null:{text:`Pipe bedding ${v} t`,qty:v,unit:'t'}; }],
   ['kerb','Kerb race',()=>{ const e=document.querySelector('#panel-kerb .ticket .big'); const v=e?parseFloat(e.textContent):NaN; const u=e&&e.querySelector('span')?e.querySelector('span').textContent.trim():''; return isNaN(v)||!v?null:{text:`Kerb race concrete ${v} ${u}`.trim(),qty:v,unit:u}; }]].forEach(([k,name,read])=>{
    const sec=$('panel-'+k); if(!sec) return; const tk=sec.querySelector('.ticket'); if(!tk) return; const b=document.createElement('button'); b.type='button'; b.className='btn putbtn'; b.textContent='Put this on today\'s sheet'; tk.after(b);
    b.addEventListener('click',()=>{ const r=read(); if(!r){ toast('Work it out first'); return; } const old=sec.querySelector('.putsheet'); if(old) old.remove(); b.after(putOnSheet(r.text,r.qty,r.unit)); }); });
