  // ---- v70: the same strip at the top of every sheet, and the same Done at the bottom ----
  const s70esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shortDay=v=>{ if(!v) return ''; const d=new Date(v+'T12:00:00'); return isNaN(d)?v:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}); };
  // job, date and name: filled in for you, folded into one line. Tap it to change them.
  Object.entries(STRIP).forEach(([tool,ids])=>{ const o=SAVERS[tool]; if(!o) return; const sec=$(o.section); const bar=sec.querySelector('.savebar'); if(!bar) return;
    const d=document.createElement('details'); d.className='jobstrip'; d.innerHTML='<summary><span class="js-line"></span><span class="js-ch">Change</span></summary><div class="grid2"></div>';
    const list=sec.querySelector('.savelist'); (list||bar).after(d); const g=d.querySelector('.grid2');
    ids.forEach(id=>{ const e=$(id); if(!e) return; const f=e.closest('.field'); if(f) g.appendChild(f); });
    // a heading left with nothing under it goes
    sec.querySelectorAll('h2').forEach(h=>{ const n=h.nextElementSibling; if(n&&n.classList.contains('grid2')&&!n.children.length){ n.remove(); if(/^(Job|Run details|The list)$/i.test(h.textContent.trim())&&h.nextElementSibling&&h.nextElementSibling.tagName==='H2') h.remove(); } });
    sec.querySelectorAll('.grid2').forEach(x=>{ if(!x.children.length&&!x.closest('.jobstrip')) x.remove(); });
    const draw=()=>{ const v=k=>{ const id=ids.find(i=>new RegExp('-(?:'+k+')$').test(i)); return id&&$(id)?$(id).value.trim():''; };
      const site=v('site'), client=v('client|dev'), by=v('by'), date=v('date'); const sj=SITE.get();
      d.querySelector('.js-line').innerHTML=`<b>${s70esc(site||'No job')}</b>${client?' · '+s70esc(client):''}${date?' · '+s70esc(shortDay(date)):''}${by?' · '+s70esc(by):' · <em>your name?</em>'}`;
      d.classList.toggle('nojob',!site); d.classList.toggle('noname',!by); };
    sec.addEventListener('input',e=>{ if(d.contains(e.target)) draw(); }); o._strip=draw;
    const _set=o.set, _clear=o.clear; o.set=x=>{ _set(x); draw(); }; o.clear=()=>{ _clear(); setTimeout(draw,0); }; draw(); });
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>Object.values(SAVERS).forEach(o=>o._strip&&o._strip()),30)));
  // one way to finish: Done (saves and sends to the office), then a client copy if they want one. The rest folds away under More.
  const DONEPFX={dw:'dw',aw:'aw',rm:'rm',th:'th',mh:'mh',fd:'fd',g:'grad',lv:'lv',d:'dips'};
  Object.entries(DONEPFX).forEach(([p,tool])=>{ const o=SAVERS[tool]; const sh=$(p+'-share'); if(!o||!sh) return; const sec=$(o.section); const row=sh.closest('.btnrow'); if(!row) return;
    const box=document.createElement('div'); box.className='donebar'; box.innerHTML=`<button type="button" class="btn primary done">Done</button><button type="button" class="btn clientcopy">Give the client a copy (PDF)</button><details class="pdfmore"><summary>More: show it, download, email</summary></details>`;
    row.before(box); const more=box.querySelector('.pdfmore');
    // everything that was a way of sending goes under More
    [row,$(p+'-towrap'),$(p+'-to')&&$(p+'-to').closest('.field')].forEach(x=>{ if(x&&x!==box) more.appendChild(x); });
    sec.querySelectorAll('.btnrow').forEach(r=>{ if(r!==row&&(r.querySelector('#'+p+'-download')||r.querySelector('#'+p+'-open')||r.querySelector('#'+p+'-share2')||r.querySelector('#'+p+'-email'))) more.appendChild(r); });
    ['dw-clear','th-clear','fd-clear'].forEach(id=>{ const x=$(id); if(x&&sec.contains(x)) x.hidden=true; });
    const st=$(p+'-status'); if(st) more.appendChild(st);
    sec.querySelectorAll('h2').forEach(h=>{ if(/^Send it$/i.test(h.textContent.trim())) h.textContent='Done?'; });
    box.querySelector('.done').addEventListener('click',async()=>{ const ok=await o.saveNow(true); if(ok){ window.scrollTo({top:0,behavior:'smooth'}); const s=sec.querySelector('.s-state'); if(s){ s.classList.add('flash'); setTimeout(()=>s.classList.remove('flash'),1600); } } });
    box.querySelector('.clientcopy').addEventListener('click',()=>sh.click()); });
  function doneLabels(){ const local=!(window.AUTH&&AUTH.who()); document.querySelectorAll('.donebar .done').forEach(b=>{ const tool=Object.keys(SAVERS).find(k=>$(SAVERS[k].section).contains(b)); b.textContent=(TYPES[tool]&&TYPES[tool].local)||local?'Done. Save it':'Done. Send to the office'; }); }
  doneLabels(); window.doneLabels=doneLabels;
  // "if they can't sign": tap the same reason again to take it off
  ['aw-nosig'].forEach(id=>{ const seg=$(id); if(!seg) return; seg.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||b.hidden) return; if(b.getAttribute('aria-pressed')==='true'){ e.stopImmediatePropagation(); const z=seg.querySelector('button[data-n=""]'); if(z) z.click(); } },true); });
  // ---- links between dayworks and extras: the same work is never priced twice ----
  const LINKOF={dw:{other:'aw',box:'dw-desc',obj:()=>DW},aw:{other:'dw',box:'aw-desc',obj:()=>AW}};
  function linksDraw(tool){ const L=LINKOF[tool]; if(!L) return; let box=$(tool+'-links'); if(!box){ const anchor=$(L.box); if(!anchor) return; box=document.createElement('div'); box.id=tool+'-links'; box.className='links'; anchor.closest('.field').after(box); }
    const list=(L.obj().links||[]); const otherName=TYPES[L.other].name.toLowerCase();
    box.innerHTML=`<span class="lk-h">Same work as:</span>${list.map((l,i)=>`<span class="lk">${s70esc(l.ref)}<button type="button" data-i="${i}" aria-label="Take the link off">×</button></span>`).join('')||'<span class="lk-none">nothing linked</span>'}<button type="button" class="lk-add">+ Link ${tool==='dw'?'an extra':'a dayworks sheet'}</button><div class="lk-pick" hidden></div>`;
    box.querySelectorAll('.lk button').forEach(b=>b.addEventListener('click',()=>{ L.obj().links.splice(+b.dataset.i,1); linksDraw(tool); $(SAVERS[tool].section).dispatchEvent(new Event('change')); }));
    box.querySelector('.lk-add').addEventListener('click',async()=>{ const pk=box.querySelector('.lk-pick'); if(!pk.hidden){ pk.hidden=true; return; } const s=SITE.get(); const job=String(s.job||s.site||'').toLowerCase();
      let cands=(await DB.all()).filter(r=>r.tool===L.other&&(!job||String(r.job||r.site||'').toLowerCase()===job)).map(r=>({ref:(r.meta&&r.meta.ref)||r.ref||((r.data&&r.data.f)||[])[L.other==='dw'?3:4]||r.name,id:r.id,date:r.date,name:r.name}));
      const reg=JOBREG.get(s.job); ((reg&&reg.rows)||[]).filter(x=>x.type===TYPES[L.other].folder&&x.ref&&!cands.some(c=>c.ref===x.ref)).forEach(x=>cands.push({ref:x.ref,id:x.sheetId,date:x.date,name:x.title}));
      cands=cands.filter(c=>c.ref&&!(L.obj().links||[]).some(l=>l.ref===c.ref)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,20);
      pk.innerHTML=cands.length?cands.map((c,i)=>`<button type="button" class="pick" data-i="${i}">${s70esc(c.ref)}<small>${s70esc(c.name||'')}</small></button>`).join(''):`<p class="note">No ${otherName} sheets for this job yet.</p>`;
      pk.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>{ const c=cands[+b.dataset.i]; const o=L.obj(); o.links=o.links||[]; o.links.push({id:c.id,tool:L.other,ref:c.ref}); linksDraw(tool); $(SAVERS[tool].section).dispatchEvent(new Event('change')); toast('Linked to '+c.ref); }));
      pk.hidden=false; }); }
  window.linksDraw=linksDraw; linksDraw('dw'); linksDraw('aw');
