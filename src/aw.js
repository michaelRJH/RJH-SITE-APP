  // ---- Additional works: every kind of extra on site, measured, with the details the office needs to price it. Quantities only: no prices in the app ----
  const AW={items:[],how:'Verbal',nosig:'',why:'',links:[]};
  try{ localStorage.removeItem('rjh-aw-prices'); localStorage.removeItem('rjh-aw-ohp'); }catch(e){}   // v55 briefly kept rates on the phone; none are kept now
  // dims: LWD volume (m³), LW area (m²), L length (m); each item can have several bits, each with a "times" count
  const AW_TYPES={
    layer:{n:'Stone / fill',dims:'LWD',mat:true,tickets:true},
    dig:{n:'Dig out',dims:'LWD',opts:[['how','Dug by',['Machine','Hand']],['spoil','Spoil went',['Spread on site','Stockpiled','Carted away']]],loads:true},
    conc:{n:'Concrete',dims:'LWD',tickets:true,opts:[['mix','Mix',['GEN1','GEN3','ST2','C25','C32/40']],['place','Placed by',['Chute','Dumper','Skip','Pump']]]},
    pipe:{n:'Drainage / ducts',dims:'L',text:['S','Size and type','150 mm PVC'],opts:[['dep','Depth',['Up to 1 m','1 to 1.5 m','1.5 to 2 m','2 to 3 m','Over 3 m']],['grd','Dug through',['Soft ground','Tarmac / flags']],['bed','Bed and surround',['Pea gravel','Concrete','None']]]},
    pave:{n:'Paving',dims:'LW',text:['S','Flag or block','600 x 600 grey'],opts:[['work','Work',['New','Relaid']],['sup','Material from',['RJH','Client']]]},
    kerb:{n:'Kerbs / edging',dims:'L',text:['S','Kerb type','HB2'],opts:[['work','Work',['New','Relaid']],['sup','Material from',['RJH','Client']]]},
    area:{n:'Area',dims:'LW'},
    count:{n:'Number of',qty:['Q','How many','nr'],text:['S','What','manholes raised']},
    loads:{n:'Loads',qty:['Q','Number of loads','loads'],tickets:true,opts:[['wag','Wagon',['8-wheeler','6-wheeler','Tractor and trailer']],['dir','Loads',['Carted away','Delivered in']]]},
    hours:{n:'Hours only',qty:['Q','Hours','hr'],text:['S','Who or what','2 men and a dumper'],opts:[['kind','For',['Standing time','Attendance on others','Sweeping / cleaning','Other']]]},
    other:{n:'Other',qty:['Q','Quantity',''],text:['U','Unit','nr']}};
  const AW_QUICK={t1:{t:'layer',mat:'Type 1'},dig:{t:'dig'},pipe:{t:'pipe'},conc:{t:'conc'},pave:{t:'pave'},kerb:{t:'kerb'},count:{t:'count'},loads:{t:'loads',opt:{wag:'8-wheeler',dir:'Carted away'}},area:{t:'area'},hours:{t:'hours'},other:{t:'other'}};
  const awDens=m=>m==='Type 1'?(RATES.get().stone||2.2):({'6F2':2.0,'Crushed concrete':1.9,'Clean stone':1.6,'Sand':1.6,'Topsoil':1.4}[m]||0);
  const AW_MATS=['Type 1','6F2','Crushed concrete','Clean stone','Sand','Topsoil','Other'];
  const awNum=v=>{ const n=parseFloat(v); return isNaN(n)?NaN:n; };
  const f2=n=>isNaN(n)?'–':(Math.round(n*100)/100).toFixed(2);
  const fq=(q,u)=>!isNaN(q)&&['nr','loads'].includes(u)&&Math.abs(q-Math.round(q))<1e-9?String(Math.round(q)):f2(q);
  const awEsc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const awFix=it=>{ const ty=AW_TYPES[it.t]||AW_TYPES.other; it.opt=it.opt||{}; if(ty.dims&&!it.bits) it.bits=[{L:it.L,W:it.W,D:it.D,N:it.t==='pave'?it.N:undefined,sz:it.sz}]; if(ty.dims&&!it.bits.length) it.bits=[{}]; return it; };
  // sizes typed the way the lads write them: "40 x 4 x 50", "40mx4mx50mm", "3.5m x 900mm x2"
  function awParse(txt,dims){ const parts=String(txt||'').toLowerCase().replace(/×|\*|by/g,'x').split('x').map(p=>p.trim()).filter(Boolean);
    const vals=parts.map(p=>{ const m=p.match(/(-?\d+(?:\.\d+)?)\s*(mm|m)?/); return m?{v:parseFloat(m[1]),u:m[2]||''}:null; }).filter(Boolean);
    if(!vals.length) return null; const met=x=>x.u==='mm'?x.v/1000:x.v; const wid=x=>x.u===''&&x.v>20?x.v/1000:met(x); const out={};
    out.L=met(vals[0]);
    if(dims==='L'){ if(vals[1]) out.N=vals[1].v; }
    else { if(vals[1]) out.W=wid(vals[1]);
      if(dims==='LW'){ if(vals[2]) out.N=vals[2].v; }
      else { if(vals[2]) out.D=vals[2].u==='m'||(vals[2].u===''&&vals[2].v<2)?Math.round(vals[2].v*1000):vals[2].v; if(vals[3]) out.N=vals[3].v; } }
    Object.keys(out).forEach(k=>out[k]=+(+out[k]).toFixed(3)); return out; }
  function awBitQ(b,dims){ const L=awNum(b.L),W=awNum(b.W),D=awNum(b.D); let n=awNum(b.N); if(isNaN(n)||n<=0) n=1;
    return (dims==='LWD'?L*W*D/1000:dims==='LW'?L*W:L)*n; }
  function awBitSize(b,dims){ const n=awNum(b.N); const t=!isNaN(n)&&n>1?` x${n}`:''; const L=f2(awNum(b.L)),W=f2(awNum(b.W)),D=awNum(b.D);
    return (dims==='LWD'?`${L} x ${W} m x ${isNaN(D)?'–':D} mm`:dims==='LW'?`${L} x ${W} m`:`${L} m`)+t; }
  function awQty(it){ awFix(it); const ty=AW_TYPES[it.t]||AW_TYPES.other;
    if(ty.dims){ const bits=it.bits.filter(b=>!isNaN(awBitQ(b,ty.dims))); const q=bits.length?bits.reduce((a,b)=>a+awBitQ(b,ty.dims),0):NaN;
      const u=ty.dims==='LWD'?'m³':ty.dims==='LW'?'m²':'m'; let size=(it.S||'').trim(); if(ty.dims!=='L'||it.bits.length>1){ const s=it.bits.map(b=>awBitSize(b,ty.dims)).join('; '); size=size?size+'; '+s:s; } else if(it.bits[0]&&awNum(it.bits[0].N)>1) size=(size?size+'; ':'')+awBitSize(it.bits[0],'L');
      let extra='', t=NaN;
      if(it.t==='layer'){ const den=awDens(it.mat); if(den&&!isNaN(q)){ t=q*den; extra=`about ${t.toFixed(1)} t`; } }
      if(it.t==='dig'&&!isNaN(q)) extra=`${(q*1.3).toFixed(1)} m³ loose`+(awNum(it.Q)>0?`, ${it.Q} loads`:'');
      return {q,u,size,t,extra}; }
    const q=awNum(it.Q); const u=it.t==='other'?((it.U||'').trim()||'item'):ty.qty[2];
    let extra='', t=NaN; if(it.t==='loads'&&it.opt.wag==='8-wheeler'&&!isNaN(q)){ t=q*(RATES.get().wagon||20); extra=`about ${t.toFixed(0)} t`; }
    return {q,u,size:it.t==='other'||(it.t==='count'&&!(it.desc||'').trim())?'':(it.S||'').trim(),t,extra}; }
  const awName=it=>{ const ty=AW_TYPES[it.t]||AW_TYPES.other; return (it.desc||'').trim()||(it.t==='layer'&&it.mat?it.mat:it.t==='count'&&it.S?it.S:ty.n); };
  // the details that set the rate, as one line: depth band, machine or hand, mix, tickets, where
  const awDetails=it=>{ awFix(it); const ty=AW_TYPES[it.t]||AW_TYPES.other; const d=[]; (ty.opts||[]).forEach(([k,l])=>{ if(it.opt[k]) d.push(`${l.toLowerCase()} ${it.opt[k].toLowerCase()}`); });
    if(it.where) d.push('at '+it.where); if(it.tickets) d.push('tickets '+it.tickets); return d.join(', '); };
  // labour and plant: hours grouped by trade or machine
  function awTimeGroups(){ const g=[]; const add=(kind,name,h)=>{ const nm=(name||'').trim()||(kind==='lab'?'Labour':'Plant'); const key=(kind+'|'+nm).toLowerCase(); let x=g.find(y=>y.key===key); if(!x){ x={key,kind,name:nm,h:0}; g.push(x); } x.h+=awNum(h)||0; };
    rowsOf($('aw-lab')).forEach(r=>add('lab',r[1]||'Labour',r[2])); rowsOf($('aw-plant')).forEach(r=>add('pl',r[0]||'Plant',r[2])); return g; }
  const AWUPD=[];
  function awRender(){ const box=$('aw-items'); box.innerHTML=''; AWUPD.length=0;
    AW.items.forEach((it,i)=>{ awFix(it); const ty=AW_TYPES[it.t]||AW_TYPES.other; const c=document.createElement('div'); c.className='aw-item';
      const dimF=ty.dims?[['L','Length','m'],...(ty.dims!=='L'?[['W','Width','m']]:[]),...(ty.dims==='LWD'?[['D','Depth','mm']]:[]),['N','Times','']]:[];
      const ph1=ty.dims==='LWD'?'40 x 4 x 50':ty.dims==='LW'?'3.5 x 900 x 2':'90';
      c.innerHTML=`<div class="aw-top"><b>Item ${i+1}</b><span><button type="button" class="aw-dup">Same again</button><button type="button" class="x" aria-label="Remove item">×</button></span></div>
        <div class="aw-types">${Object.entries(AW_TYPES).map(([k,v])=>`<button type="button" data-t="${k}" aria-pressed="${it.t===k}">${v.n}</button>`).join('')}</div>
        <div class="field"><label>What was done</label><div class="in"><input data-k="desc" type="text" placeholder="e.g. re-stoned the forks turning area" value="${awEsc(it.desc)}"></div></div>
        ${ty.mat?`<div class="field"><label>Material</label><div class="aw-mats">${AW_MATS.map(m=>`<button type="button" data-m="${m}" aria-pressed="${it.mat===m}">${m}</button>`).join('')}</div></div>`:''}
        ${ty.text?`<div class="field"><label>${ty.text[1]}</label><div class="in"><input data-k="${ty.text[0]}" type="text" placeholder="${ty.text[2]}" value="${awEsc(it[ty.text[0]])}"></div></div>`:''}
        ${ty.dims?it.bits.map((b,j)=>`<div class="aw-bit" data-b="${j}">${it.bits.length>1?`<div class="aw-bith"><b>Bit ${j+1}</b><button type="button" class="aw-delbit" data-b="${j}">Remove</button></div>`:''}
          <div class="field"><label>Sizes, as you'd write them</label><div class="in"><input data-bsz="${j}" type="text" autocomplete="off" placeholder="${ph1}" value="${awEsc(b.sz)}"></div></div>
          <div class="aw-dims">${dimF.map(([k,l,u])=>`<div class="field"><label>${l}</label><div class="in"><input data-bk="${k}" data-b="${j}" type="number" inputmode="decimal" step="any" placeholder="${k==='N'?'1':''}" value="${awEsc(b[k]===undefined?'':b[k])}">${u?`<span class="unit">${u}</span>`:''}</div></div>`).join('')}</div></div>`).join('')+`<button type="button" class="btn aw-addbit" style="margin:4px 0 0">+ Another bit</button>`:''}
        ${ty.qty?`<div class="aw-dims"><div class="field"><label>${ty.qty[1]}</label><div class="in"><input data-k="Q" type="number" inputmode="decimal" step="any" value="${awEsc(it.Q)}">${ty.qty[2]?`<span class="unit">${ty.qty[2]}</span>`:''}</div></div>${it.t==='other'?'':'<div></div>'}</div>`:''}
        ${ty.loads?`<div class="aw-dims"><div class="field"><label>Loads carted (if any)</label><div class="in"><input data-k="Q" type="number" inputmode="decimal" step="any" value="${awEsc(it.Q)}"><span class="unit">loads</span></div></div><div></div></div>`:''}
        ${(ty.opts||[]).map(([k,l,ch])=>`<div class="field"><label>${l}</label><div class="aw-mats">${ch.map(v=>`<button type="button" data-ok="${k}" data-ov="${awEsc(v)}" aria-pressed="${it.opt[k]===v}">${v}</button>`).join('')}</div></div>`).join('')}
        <div class="aw-res"></div>
        <div class="aw-more"><div class="field"><label>Where (plot or spot)</label><div class="in"><input data-k="where" type="text" placeholder="plot 40 drive" value="${awEsc(it.where)}"></div></div>${ty.tickets?`<div class="field"><label>Delivery ticket numbers</label><div class="in"><input data-k="tickets" type="text" placeholder="e.g. 48812, 48815" value="${awEsc(it.tickets)}"></div></div>`:''}</div>
        <div class="photos aw-ph"></div>
        <label class="btn primary filebtn" style="margin-top:8px">Take photo${ty.tickets?' (work or tickets)':''}<input type="file" accept="image/*" capture="environment"></label>`;
      c.querySelector('.x').addEventListener('click',()=>{ if((it.desc||(it.bits&&it.bits.some(b=>b.L))||it.Q||(it.photos||[]).length)&&!confirm('Remove item '+(i+1)+'?')) return; AW.items.splice(i,1); awRender(); });
      c.querySelector('.aw-dup').addEventListener('click',()=>{ const cp=JSON.parse(JSON.stringify(it)); cp.photos=[]; cp.bits=ty.dims?[{}]:undefined; ['Q','tickets'].forEach(k=>delete cp[k]); AW.items.splice(i+1,0,cp); awRender(); const cs=$('aw-items').querySelectorAll('.aw-item'); const nx=cs[i+1]; if(nx){ nx.scrollIntoView({block:'start',behavior:'smooth'}); const f=nx.querySelector('[data-bsz]')||nx.querySelector('[data-k=Q]'); if(f) setTimeout(()=>f.focus(),300); } });
      c.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{ const old=AW_TYPES[it.t]||{}; it.t=b.dataset.t; const nw=AW_TYPES[it.t]; if(it.t==='layer'&&!it.mat) it.mat='Type 1'; if(nw.dims&&old.dims&&nw.dims!==old.dims){ /* keep the bits, the extra sizes just go unused */ } awRender(); }));
      c.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{ it.mat=b.dataset.m; c.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',x===b)); upd(); }));
      c.querySelectorAll('[data-ok]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.ok; it.opt[k]=it.opt[k]===b.dataset.ov?'':b.dataset.ov; c.querySelectorAll(`[data-ok="${k}"]`).forEach(x=>x.setAttribute('aria-pressed',x.dataset.ov===it.opt[k])); upd(); }));
      c.querySelectorAll('input[data-k]').forEach(inp=>inp.addEventListener('input',()=>{ it[inp.dataset.k]=inp.value; upd(); }));
      c.querySelectorAll('input[data-bk]').forEach(inp=>inp.addEventListener('input',()=>{ it.bits[+inp.dataset.b][inp.dataset.bk]=inp.value; upd(); }));
      c.querySelectorAll('input[data-bsz]').forEach(inp=>inp.addEventListener('input',()=>{ const j=+inp.dataset.bsz, b=it.bits[j]; b.sz=inp.value; const p=awParse(inp.value,ty.dims); if(p){ ['L','W','D','N'].forEach(k=>{ if(p[k]!==undefined){ b[k]=String(p[k]); const f=c.querySelector(`input[data-bk="${k}"][data-b="${j}"]`); if(f) f.value=p[k]; } }); } upd(); }));
      const ab=c.querySelector('.aw-addbit'); if(ab) ab.addEventListener('click',()=>{ it.bits.push({}); awRender(); const cs=$('aw-items').querySelectorAll('.aw-item'); const f=cs[i]&&cs[i].querySelector(`[data-bsz="${it.bits.length-1}"]`); if(f) setTimeout(()=>f.focus(),100); });
      c.querySelectorAll('.aw-delbit').forEach(b=>b.addEventListener('click',()=>{ it.bits.splice(+b.dataset.b,1); awRender(); }));
      const ph=c.querySelector('.aw-ph');
      const drawPh=()=>{ ph.innerHTML=''; (it.photos||[]).forEach((p,k)=>{ const w=document.createElement('div'); w.innerHTML=`<img src="${p.d}"><button type="button" aria-label="Remove">×</button>`; w.querySelector('button').addEventListener('click',()=>{ it.photos.splice(k,1); drawPh(); awSum(); }); ph.appendChild(w); }); };
      c.querySelector('input[type=file]').addEventListener('change',async e=>{ it.photos=it.photos||[]; for(const f of e.target.files){ it.photos.push({d:await shrink(f),at:new Date().toISOString()}); } e.target.value=''; drawPh(); awSum(); c.dispatchEvent(new Event('input',{bubbles:true})); });
      const upd=()=>{ const r=awQty(it); c.querySelector('.aw-res').innerHTML=isNaN(r.q)?`<span class="note" style="margin:0">${ty.dims?'Type the sizes to get the quantity':'Put how many'}</span>`:`<b>${fq(r.q,r.u)} ${r.u}</b>${r.extra?` <span>· ${r.extra}</span>`:''}`; awSum(); };
      AWUPD.push(upd); drawPh(); upd(); box.appendChild(c); });
    awSum(); }
  function awSum(){ $('aw-n').textContent=AW.items.length; $('aw-np').textContent=AW.items.reduce((a,it)=>a+(it.photos||[]).length,0);
    const inst=$('aw-inst').value.trim(); $('aw-instwarn').innerHTML=inst?'':'<b style="color:var(--danger)">Put who asked for it.</b> Without a name it is hard to get paid.'; }
  const awAdd=q=>{ const p=JSON.parse(JSON.stringify(AW_QUICK[q]||{t:'layer',mat:'Type 1'})); AW.items.push(awFix({photos:[],...p})); awRender(); const cs=$('aw-items').querySelectorAll('.aw-item'); const last=cs[cs.length-1]; if(last){ last.scrollIntoView({block:'start',behavior:'smooth'}); const f=last.querySelector('[data-bsz]')||last.querySelector('input[data-k=Q]')||last.querySelector('input[data-k=desc]'); if(f) setTimeout(()=>f.focus(),350); } };
  const awWhy=()=>AW.why?(AW.why==='Damage by others'&&$('aw-trade').value.trim()?'Damage by others ('+$('aw-trade').value.trim()+')':AW.why):'';
  const awWhyUI=()=>{ $('aw-tradewrap').hidden=AW.why!=='Damage by others'; };
  $('aw-why').addEventListener('click',e=>{ const b=e.target.closest('[data-w]'); if(!b) return; AW.why=AW.why===b.dataset.w?'':b.dataset.w; $('aw-why').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===AW.why)); awWhyUI(); });
  $('aw-quick').addEventListener('click',e=>{ const b=e.target.closest('[data-q]'); if(b) awAdd(b.dataset.q); });
  $('aw-additem').addEventListener('click',()=>awAdd('t1'));
  $('aw-date').value=today();
  const awSeg=(id,key,attr,after)=>$(id).addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; AW[key]=b.dataset[attr]; $(id).querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); if(after) after(); });
  const awSegSet=(id,attr,v)=>$(id).querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset[attr]===v));
  awSeg('aw-how','how','h');
  const awNosigUI=()=>{ $('aw-nosigwrap').hidden=!AW.nosig; $('aw-sigfield').style.opacity=AW.nosig?'0.4':''; };
  awSeg('aw-nosig','nosig','n',awNosigUI);
  $('aw-inst').addEventListener('input',()=>awSum());
  const awToUI=()=>{ const sel=$('aw-to'); $('aw-towrap').hidden=sel.value!==''; const nm=sel.options[sel.selectedIndex].text; $('aw-email').textContent=sel.value?'Email '+nm.split(' ')[0]:'Email it'; };
  $('aw-to').addEventListener('change',awToUI); awToUI();
  const awLab=r=>listRow($('aw-lab'),[{p:'Name',v:r&&r[0]},{p:'Trade',v:r&&r[1]},{p:'Hrs',t:'number',v:r&&r[2]}],()=>awSum());
  const awPlant=r=>listRow($('aw-plant'),[{p:'Machine',v:r&&r[0]},{p:'Operator',v:r&&r[1]},{p:'Hrs',t:'number',v:r&&r[2]}],()=>awSum());
  $('aw-addlab').addEventListener('click',()=>awLab()); $('aw-addplant').addEventListener('click',()=>awPlant());
  $('aw-fromdw').addEventListener('click',async()=>{ const box=$('aw-dwlist'); if(!box.hidden){ box.hidden=true; return; }
    const all=(await DB.all()).filter(r=>r.tool==='dw').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
    box.innerHTML=all.length?'':'<p class="note">No dayworks sheets saved on this phone.</p>';
    all.forEach(r=>{ const d=r.data||{}; const row=document.createElement('div'); row.className='saverow'; const nl=(d.lab||[]).length, np=(d.plant||[]).length;
      row.innerHTML=`<div><b>${awEsc(r.name||'Dayworks')}</b><div class="note" style="margin:0">${nl} labour, ${np} plant · ${new Date(r.date).toLocaleDateString('en-GB')}</div></div><button type="button" class="btn" style="margin:0;width:auto;padding:8px 12px">Copy</button>`;
      row.querySelector('button').addEventListener('click',async()=>{ (d.lab||[]).forEach(x=>awLab(x)); (d.plant||[]).forEach(x=>awPlant(x)); box.hidden=true; awSum(); const ref=(d.f||[])[3]||r.name;
        if(!$('aw-desc').value.trim()&&(d.f||[])[6]){ $('aw-desc').value=d.f[6]; } if(!$('aw-loc').value.trim()&&(d.f||[])[9]){ $('aw-loc').value=d.f[9]; }
        AW.links=AW.links||[]; if(!AW.links.some(l=>l.ref===ref)) AW.links.push({id:r.id,tool:'dw',ref}); if(window.linksDraw) linksDraw('aw');
        // and the dayworks sheet points back at this extra, so the office never prices the same work twice
        const awRef=$('aw-ref').value.trim(); if(awRef){ r.data.links=r.data.links||[]; if(!r.data.links.some(l=>l.ref===awRef)){ r.data.links.push({id:SAVERS.aw.currentId||'',tool:'aw',ref:awRef}); r.date=new Date().toISOString(); await DB.put(r); if(window.syncEnqueue) syncEnqueue('dw',r.id); } }
        toast('Copied from '+ref+' and linked'); });
      box.appendChild(row); });
    box.hidden=false; });
  // names used before on this phone, offered as you type
  async function awNames(){ try{ const all=await DB.all(); const names=new Set(), cos=new Set();
      all.forEach(r=>{ const f=(r.data||{}).f||[]; if(r.tool==='aw'){ [f[7],f[11]].forEach(n=>n&&names.add(n)); if(f[8]) cos.add(f[8]); } if(r.tool==='dw'){ [f[5],f[7]].forEach(n=>n&&names.add(n)); } });
      $('aw-names').innerHTML=[...names].map(n=>`<option value="${awEsc(n)}">`).join(''); $('aw-cos').innerHTML=[...cos].map(n=>`<option value="${awEsc(n)}">`).join(''); }catch(e){} }
  // next AW number for this site
  async function awNextRef(){ if($('aw-ref').value.trim()) return; const site=$('aw-site').value.trim().toLowerCase(); let mx=0;
    try{ (await DB.all()).filter(r=>r.tool==='aw'&&String(r.site||'').toLowerCase()===site).forEach(r=>{ const m=String(((r.data||{}).f||[])[4]||'').match(/(\d+)/); if(m) mx=Math.max(mx,+m[1]); }); }catch(e){}
    $('aw-ref').value='AW-'+String(mx+1).padStart(3,'0'); }
  $('aw-site').addEventListener('change',()=>{ if(/^AW-\d+$/.test($('aw-ref').value.trim())&&!SAVERS.aw.currentId){ $('aw-ref').value=''; } awNextRef(); });
  document.querySelector('[data-go="panel-aw"]').addEventListener('click',()=>setTimeout(()=>{ awNextRef(); awNames(); },50));
  // office: open a sheet the lads sent (the .rjhsheet.json that travels with the PDF)
  $('aw-load').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ const j=JSON.parse(await f.text()); const sh=(j.sheets||[]).filter(s=>s.tool==='aw'); if(!sh.length){ toast('No additional works sheet in that file'); return; }
      for(const r of sh){ try{ await DB.put(r); }catch(err){} } const r=sh[0]; SAVERS.aw.set(r.data); SAVERS.aw.currentId=r.id; SAVERS.aw.sends=r.sends||0; toast('Opened '+(r.name||'the sheet')); awNames(); }
    catch(err){ toast('Could not read that file'); } });
  // office: quantities out to a spreadsheet, to price there
  $('aw-csv').addEventListener('click',()=>{ const v=id=>$(id).value.trim(); const q=x=>`"${String(x==null?'':x).replace(/"/g,'""')}"`; const why=awWhy(); const L=[['Ref','Site','Date','Why extra','Item','Type','Description','Details','Where','Tickets','Size','Quantity','Unit','Tonnes'].map(q).join(',')];
    AW.items.forEach((it,i)=>{ const r=awQty(it); const ty=AW_TYPES[it.t]||AW_TYPES.other; const det=(ty.opts||[]).map(([k,l])=>it.opt[k]?l+': '+it.opt[k]:'').filter(Boolean).join('; '); L.push([v('aw-ref'),v('aw-site'),v('aw-date'),why,i+1,ty.n+(it.t==='layer'&&it.mat?' ('+it.mat+')':''),awName(it),det,it.where||'',it.tickets||'',r.size,isNaN(r.q)?'':r.q.toFixed(3),r.u,isNaN(r.t)?'':r.t.toFixed(2)].map(q).join(',')); });
    awTimeGroups().forEach(g=>L.push([v('aw-ref'),v('aw-site'),v('aw-date'),why,'',g.kind==='lab'?'Labour':'Plant',g.name,'','','','',g.h.toFixed(1),'hr',''].map(q).join(',')));
    const blob=new Blob([L.join('\r\n')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`RJH_${(v('aw-ref')||'AW').replace(/\W/g,'')}_quantities.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); toast('Downloading the CSV'); });
  // email: written-out summary so the quantities travel even if the PDF is not attached
  function awSummary(){ const v=id=>$(id).value.trim(); const L=[];
    L.push(`Additional works ${v('aw-ref')} · ${v('aw-site')}${v('aw-loc')?' · '+v('aw-loc'):''} · ${fmtDate(v('aw-date'))}`); L.push('');
    if(v('aw-desc')) { L.push(v('aw-desc')); L.push(''); }
    L.push(`Why it's extra: ${awWhy()||'not said'}`); L.push(`Instructed by: ${v('aw-inst')||'not recorded'}${v('aw-instco')?', '+v('aw-instco'):''} (${AW.how}${v('aw-instref')?', ref '+v('aw-instref'):''}${v('aw-instdate')?', '+fmtDate(v('aw-instdate')):''})`); L.push('');
    AW.items.forEach((it,i)=>{ const r=awQty(it); const d=awDetails(it); L.push(`${i+1}. ${awName(it)}: ${fq(r.q,r.u)} ${r.u}${r.size?' ('+r.size+')':''}${r.extra?', '+r.extra:''}${d?'. '+d.charAt(0).toUpperCase()+d.slice(1):''}`); });
    const lab=rowsOf($('aw-lab')), pl=rowsOf($('aw-plant'));
    if(lab.length||pl.length){ L.push(''); L.push('Time:'); lab.forEach(r=>L.push(`  ${r[0]||'–'} (${r[1]||'labour'}) ${r[2]||'–'} hrs`)); pl.forEach(r=>L.push(`  ${r[0]||'–'} (${r[1]||'plant'}) ${r[2]||'–'} hrs`)); }
    L.push(''); L.push(AW.nosig?`Not signed: ${AW.nosig}${v('aw-nosigwhy')?', '+v('aw-nosigwhy'):''}`:`Signed on site by ${v('aw-cname')||'–'}${v('aw-cpos')?', '+v('aw-cpos'):''}`);
    L.push(`RJH foreman: ${v('aw-by')||'–'}`); L.push(''); L.push('PDF and sheet file attached.'); return L.join('\n'); }
  $('aw-email').addEventListener('click',()=>{ const to=$('aw-to').value||$('aw-toother').value.trim(); const sub=`Additional works ${$('aw-ref').value.trim()} ${$('aw-site').value.trim()}`.trim();
    location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(awSummary())}`; });
  // PDF
  function pdfPhotosCap(doc,photos,y,label){ const W=210,M=16,CW=W-2*M; if(!photos.length) return y;
    if(y>200){ doc.addPage(); y=42; }
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(label,M,y); y+=4;
    const pw=(CW-6)/2, ph=pw*0.75; let col=0;
    photos.forEach(p=>{ if(y+ph+6>276){ doc.addPage(); y=42; col=0; } const x=M+col*(pw+6); doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.rect(x,y,pw,ph); try{ doc.addImage(p.d,'JPEG',x+0.5,y+0.5,pw-1,ph-1,undefined,'FAST'); }catch(e){}
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(p.cap||'',pw)[0]||'',x,y+ph+3.8); col++; if(col===2){ col=0; y+=ph+8; } });
    if(col===1) y+=ph+8; return y; }
  function buildAw(){
    const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'}); const W=210,M=16,CW=W-2*M;
    const pu=x=>String(x).replace(/³/g,'3').replace(/²/g,'2'); const _t=doc.text.bind(doc); doc.text=(x,...r)=>_t(Array.isArray(x)?x.map(pu):pu(x),...r);   // the PDF fonts have no ³ or ²
    const v=id=>$(id).value.trim(); const date=fmtDate(v('aw-date'));
    let y=pdfHeader(doc,'ADDITIONAL WORKS',`${v('aw-ref')||'No ref'}  ·  ${date}  ·  ${v('aw-site')}`);
    y=cellRow(doc,M,y,CW,11,[{label:'Site',value:v('aw-site')||'–',w:CW*0.4},{label:'Client',value:v('aw-client')||'–',w:CW*0.3},{label:'Sheet ref',value:v('aw-ref')||'–',w:CW*0.15,bold:true},{label:'Date',value:date,w:CW*0.15}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Where on site',value:v('aw-loc')||'–',w:CW*0.6},{label:'RJH foreman',value:v('aw-by')||'–',w:CW*0.4}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Instructed by',value:(v('aw-inst')||'NOT RECORDED')+(v('aw-instco')?', '+v('aw-instco'):''),w:CW*0.5,bold:true},{label:'How',value:AW.how,w:CW*0.16},{label:'Instruction ref',value:v('aw-instref')||'–',w:CW*0.17},{label:'Date asked',value:v('aw-instdate')?fmtDate(v('aw-instdate')):'–',w:CW*0.17}]);
    y=cellRow(doc,M,y,CW,11,[{label:'Why it is extra',value:awWhy()||'–',w:CW,bold:true}]);
    if(v('aw-desc')){ y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text('THE JOB',M,y); y+=5; doc.setFont('helvetica','normal'); doc.setFontSize(9.5); const lines=doc.splitTextToSize(v('aw-desc'),CW); doc.text(lines,M,y); y+=lines.length*4.5+2; }
    y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text('WORK DONE',M,y); y+=2.5;
    const cols=[{l:'No',w:CW*0.06},{l:'Item',w:CW*0.44},{l:'Size',w:CW*0.32},{l:'Quantity',w:CW*0.18,r:true}];
    const head=()=>{ let cx=M; doc.setFillColor(...INK); doc.rect(M,y,CW,6,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...PAPER); cols.forEach(c=>{ doc.text(c.l.toUpperCase(),c.r?cx+c.w-2.5:cx+2.5,y+4,{align:c.r?'right':'left'}); cx+=c.w; }); y+=6; };
    head();
    if(!AW.items.length){ doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...GREY); doc.text('No items',M+2.5,y+5); y+=8; }
    AW.items.forEach((it,i)=>{ const r=awQty(it); const name=awName(it)+(r.extra?`  (${r.extra})`:''); const nl=doc.splitTextToSize(name,cols[1].w-5); const det=awDetails(it); doc.setFontSize(8); const dl=det?doc.splitTextToSize(det.charAt(0).toUpperCase()+det.slice(1),cols[1].w-5):[]; doc.setFontSize(9.5); const sl=doc.splitTextToSize(r.size||'–',cols[2].w-5); const h=Math.max(7,nl.length*4.2+dl.length*3.6+3,sl.length*4.2+3);
      if(y+h>272){ doc.addPage(); y=42; head(); } doc.setFillColor(...(i%2?PAPER:[255,255,255])); doc.setDrawColor(...LINE); doc.setLineWidth(0.25); doc.rect(M,y,CW,h,'FD');
      const cells=[String(i+1),nl,sl,isNaN(r.q)?'–':`${fq(r.q,r.u)} ${r.u}`];
      let cx=M; cols.forEach((c,k)=>{ doc.setFont('helvetica',c.r||k===0?'bold':'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(cells[k],c.r?cx+c.w-2.5:cx+2.5,y+5,{align:c.r?'right':'left'}); cx+=c.w; });
      if(dl.length){ doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GREY); doc.text(dl,M+cols[0].w+2.5,y+5+nl.length*4.2); }
      y+=h; });
    y+=7;
    const lab=rowsOf($('aw-lab')), pl=rowsOf($('aw-plant'));
    const tbl=(title,cl,rows)=>{ if(!rows.length) return; if(y>240){ doc.addPage(); y=42; } doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(title,M,y); y+=2.5;
      let x=M; doc.setFillColor(...INK); doc.rect(M,y,CW,6,'F'); doc.setFontSize(6.5); doc.setTextColor(...PAPER); cl.forEach(c=>{ doc.text(c.l.toUpperCase(),c.r?x+c.w-2.5:x+2.5,y+4,{align:c.r?'right':'left'}); x+=c.w; }); y+=6; let tot=0;
      rows.forEach((r,i)=>{ if(y>270){ doc.addPage(); y=42; } doc.setFillColor(...(i%2?PAPER:[255,255,255])); doc.setDrawColor(...LINE); doc.rect(M,y,CW,7,'FD'); x=M; cl.forEach((c,k)=>{ doc.setFont('helvetica',c.r?'bold':'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(r[k]||'–',c.r?x+c.w-2.5:x+2.5,y+5,{align:c.r?'right':'left'}); x+=c.w; }); tot+=parseFloat(r[2])||0; y+=7; });
      doc.setFillColor(...PAPER); doc.rect(M,y,CW,7,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.text('Total hours',M+2.5,y+5); doc.text(tot.toFixed(1),W-M-2.5,y+5,{align:'right'}); y+=14; };
    tbl('LABOUR',[{l:'Name',w:CW*0.45},{l:'Trade',w:CW*0.35},{l:'Hours',w:CW*0.2,r:true}],lab);
    tbl('PLANT',[{l:'Machine',w:CW*0.45},{l:'Operator / ref',w:CW*0.35},{l:'Hours',w:CW*0.2,r:true}],pl);
    const ph=[]; AW.items.forEach((it,i)=>(it.photos||[]).forEach(p=>{ const t=p.at?new Date(p.at):null; ph.push({d:p.d,cap:`Item ${i+1}: ${awName(it)}${t?'  ·  '+t.toLocaleDateString('en-GB')+' '+t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):''}`}); }));
    y=pdfPhotosCap(doc,ph,y,'PHOTOS');
    if(y>222){ doc.addPage(); y=42; } else y=Math.max(y,222);
    const sw=(CW-10)/2;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.setFillColor(...PAPER); doc.rect(M,y,sw,44,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('CLIENT REPRESENTATIVE',M+2.5,y+4);
    if(AW.nosig){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(AW.nosig+(v('aw-nosigwhy')?': '+v('aw-nosigwhy'):''),sw-6),M+3,y+21); }
    else{ const sd=SIGS['aw-sig'].data(); if(sd) try{ doc.addImage(sd,'PNG',M+3,y+6,sw-6,22,undefined,'FAST'); }catch(e){} }
    doc.setDrawColor(...LINE); doc.line(M+3,y+30,M+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(v('aw-cname')||'',M+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(`${v('aw-cpos')||''}${v('aw-cpos')?'  ·  ':''}${date}`,M+3,y+41);
    const x2=M+sw+10; doc.setDrawColor(...INK); doc.setFillColor(...PAPER); doc.rect(x2,y,sw,44,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text('FOR R.J. HOWARD ENGINEERS LTD',x2+2.5,y+4);
    doc.setDrawColor(...LINE); doc.line(x2+3,y+30,x2+sw-3,y+30); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(v('aw-by')||'',x2+3,y+36); doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.text(date,x2+3,y+41);
    y+=50; doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize('Work carried out on instruction, in addition to the contract. Quantities measured on site. Valuation per the contract.',CW),M,y);
    stampFooters(doc,'aw'); return doc; }
  pdfActions('aw',buildAw,()=>`RJH_AdditionalWorks_${($('aw-ref').value.trim()||'sheet').replace(/\W/g,'')}_${$('aw-date').value}.pdf`,'aw-status',()=>AW.items.length>0);
  // share the PDF and the sheet file together, so the office can open it in the app and price it
  $('aw-share2').addEventListener('click',async()=>{ if(!AW.items.length){ toast('Add an item first'); return; } if(!window.jspdf){ $('aw-status').textContent='PDF tool not loaded. Reload the page.'; return; }
    try{ const o=SAVERS.aw; const data=o.get(); const name=o.name()||'Additional works'; const id=o.currentId||('aw-'+Date.now());
      if(!o.currentId){ try{ await DB.put({id,tool:'aw',name,site:o.site(),date:new Date().toISOString(),created:new Date().toISOString(),data,sent:null,sends:0}); o.currentId=id; }catch(e){} }
      const pdf=buildAw().output('blob'); const pname=`RJH_AdditionalWorks_${($('aw-ref').value.trim()||'sheet').replace(/\W/g,'')}_${$('aw-date').value}.pdf`;
      const js=new Blob([JSON.stringify({rjhSheets:1,exported:new Date().toISOString(),sheets:[{id,tool:'aw',name,site:o.site(),date:new Date().toISOString(),created:new Date().toISOString(),data,sent:null,sends:o.sends||0}]})],{type:'application/json'});
      const files=[new File([pdf],pname,{type:'application/pdf'}),new File([js],`${name.replace(/[^\w-]+/g,'_')}.rjhsheet.json`,{type:'application/json'})];
      if(navigator.canShare&&navigator.canShare({files})){ try{ await navigator.share({files,title:name,text:'Additional works '+name}); markSent('aw'); return; }catch(e){ if(e.name==='AbortError') return; } }
      if(navigator.canShare&&navigator.canShare({files:[files[0]]})){ try{ await navigator.share({files:[files[0]],title:name}); markSent('aw'); return; }catch(e){ if(e.name==='AbortError') return; } }
      files.forEach(f=>{ const url=URL.createObjectURL(f); const a=document.createElement('a'); a.href=url; a.download=f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); }); markSent('aw'); toast('Downloaded instead'); }
    catch(e){ $('aw-status').textContent='PDF error: '+(e.message||e); toast('PDF error'); } });
