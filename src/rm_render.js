  function rmRender(){ const box=$('rm-items'); box.innerHTML='';
    const c=rmCounts(); $('rm-n').textContent=RM.items.length; $('rm-open').textContent=c.open+c.client;
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
        <div class="btnrow" style="margin-top:4px"><button type="button" class="btn primary rm-next">Next open snag ▸</button></div>`;
      c.querySelector('.rm-close').addEventListener('click',()=>{ RM.sel=null; RM.keep=null; rmRender(); });
      c.querySelector('.rm-next').addEventListener('click',()=>{ const nx=openIdx.find(k=>k>i)??openIdx.find(k=>k!==i); RM.keep=null; if(nx===undefined){ RM.sel=null; rmRender(); toast('Nothing left open'); return; } RM.sel=nx; rmRender(); const el=$('rm-items').querySelector('.rm-item.sel'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); });
      c.querySelector('.rm-del').addEventListener('click',()=>{ if(!confirm('Remove snag '+(it.no||(i+1))+'?')) return; RM.items.splice(i,1); RM.sel=null; rmRender(); });
      c.querySelectorAll('input[data-k]').forEach(inp=>inp.addEventListener('input',()=>{ it[inp.dataset.k]=inp.value; }));
      c.querySelectorAll('[data-st]').forEach(b=>b.addEventListener('click',()=>{ it.st=it.st===b.dataset.st?'open':b.dataset.st; RM.keep=it; if(it.st==='fixed'){ if(!it.date) it.date=today(); if(!it.who) it.who=$('rm-by').value.trim(); } rmRender(); }));
      const ro=c.querySelector('.rm-reopen'); if(ro) ro.addEventListener('click',e=>{ e.preventDefault(); it.st='open'; RM.keep=it; rmRender(); });
      c.querySelectorAll('[data-fx]').forEach(b=>b.addEventListener('click',()=>{ it.fixes=it.fixes||[]; const k=it.fixes.indexOf(b.dataset.fx); if(k>=0) it.fixes.splice(k,1); else it.fixes.push(b.dataset.fx); b.setAttribute('aria-pressed',k<0); }));
      c.querySelectorAll('[data-ex]').forEach(b=>b.addEventListener('click',()=>{ it.extra=b.dataset.ex==='1'; c.querySelectorAll('[data-ex]').forEach(x=>x.setAttribute('aria-pressed',x===b)); }));
      ['before','after'].forEach(ph=>{ const grid=c.querySelector(`.rm-ph[data-ph="${ph}"]`); if(!grid) return;
        const draw=()=>{ grid.innerHTML=''; it[ph].forEach((p,k)=>{ const w=document.createElement('div'); w.innerHTML=`<img src="${p.d}"><button type="button" aria-label="Remove">×</button>`; w.querySelector('button').addEventListener('click',()=>{ it[ph].splice(k,1); draw(); }); grid.appendChild(w); }); };
        c.querySelectorAll(`input[type=file][data-ph="${ph}"]`).forEach(inp=>inp.addEventListener('change',async e=>{ for(const f of e.target.files){ it[ph].push({d:await shrink(f),at:new Date().toISOString()}); } e.target.value=''; draw(); c.dispatchEvent(new Event('input',{bubbles:true})); }));
        draw(); });
      box.appendChild(c); });
    if(RM.items.length&&!shown) box.innerHTML=`<p class="note">Nothing ${RM.filter==='open'?'still open':RM.filter==='fixed'?'fixed yet':'marked not ours'}. Tap All to see every snag.</p>`; }
