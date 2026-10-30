# ===== v69: filing and data safety =====
# Save: the sheet carries its job, gets its job-wide number, and its bar shows where it is up to
rep("""bar.innerHTML=`<button type="button" class="s-save">Save</button><button type="button" class="s-list">Saved</button><button type="button" class="s-new">New</button><button type="button" class="s-send" title="Send this sheet to another phone">Send</button><span class="s-state"></span>`;""",
    """bar.innerHTML=`<button type="button" class="s-save">Save</button><button type="button" class="s-list">My sheets</button><button type="button" class="s-new">New</button><span class="s-state"></span>`;""")
rep("""    bar.querySelector('.s-save').addEventListener('click',async()=>{ const data=opts.get(); const name=opts.name()||TOOLNAMES[tool]; const id=opts.currentId||(tool+'-'+Date.now());""",
    """    bar.querySelector('.s-save').addEventListener('click',()=>opts.saveNow(true));
    opts.saveNow=async(loud)=>{ if(window.REFFILL) await REFFILL(tool); const data=opts.get(); const name=opts.name()||TOOLNAMES[tool]; const id=opts.currentId||(tool+'-'+Date.now());""")
rep("""      try{ await DB.put({...(prev||{}),id,tool,name,site:opts.site?opts.site():'',date:new Date().toISOString(),created,data,sent,sends}); opts.currentId=id; toast('Saved: '+name); if(window.syncEnqueue) syncEnqueue(tool,id); bar.querySelector('.s-state').textContent='saved '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }catch(e){ toast('Could not save: '+(e.message||e)); } });""",
    """      const js=SITE.get(); const site=opts.site?opts.site():''; const onJob=js.job&&(!site||site.toLowerCase()===String(js.site||'').toLowerCase());
      try{ await DB.put({...(prev||{}),id,tool,name,site,...(onJob?{job:js.job,clientFolder:js.clientFolder||''}:{}),date:new Date().toISOString(),created,data,sent,sends}); opts.currentId=id; if(loud) toast(TYPES[tool]&&!TYPES[tool].local?(AUTH.who()?'Saved. Going to the office':'Saved on this phone'):'Saved: '+name); if(window.syncEnqueue) syncEnqueue(tool,id); const st=bar.querySelector('.s-state'); st.textContent='Saved '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); setTimeout(()=>{ if(window.syncStatus) syncStatus(); },400); return true; }catch(e){ toast('Could not save: '+(e.message||e)); return false; } };""")
# New: the sheet you were on is saved first, no question asked (only if it could not be saved)
rep("""    bar.querySelector('.s-new').addEventListener('click',()=>{ if(!confirm('Start a new sheet? Unsaved changes are lost.')) return; opts.clear();""",
    """    bar.querySelector('.s-new').addEventListener('click',async()=>{ let had=false, ok=true; try{ const d=opts.get(); had=hasStuff(tool,d); if(had){ let prev=null; if(opts.currentId){ try{ prev=await DB.get(opts.currentId); }catch(e){} } if(!prev||JSON.stringify(prev.data)!==JSON.stringify(d)) ok=await opts.saveNow(false); } }catch(e){ ok=false; }
      if(!ok&&!confirm('This sheet could not be saved. Start a new one anyway and lose it?')) return; const was=had?(opts.name()||TOOLNAMES[tool]):''; opts.clear();""")
rep("""if(PREFILL[tool]) prefill(PREFILL[tool]); if(opts.recalc) opts.recalc(); bar.querySelector('.s-state').textContent=''; list.hidden=true; });""",
    """if(PREFILL[tool]) prefill(PREFILL[tool]); if(opts.recalc) opts.recalc(); bar.querySelector('.s-state').textContent=''; list.hidden=true; if(window.REFFILL) REFFILL(tool); toast(was?was+' saved. Starting a new one.':'New sheet'); window.scrollTo(0,0); });""")
# drafts are not written while the filing borrows the form to print another sheet
rep("""    let t; const writeDraft=()=>{ clearTimeout(t); t=null; try{""","""    let t; const writeDraft=()=>{ clearTimeout(t); t=null; if(window.SYNC_SWAP){ t=setTimeout(writeDraft,700); return; } try{""")
rep("""    const queue=()=>{ clearTimeout(t); t=setTimeout(writeDraft,700); };""","""    const queue=()=>{ if(window.SYNC_SWAP) return; clearTimeout(t); t=setTimeout(writeDraft,700); };""")
# My sheets: names escaped, where each sheet is up to, try again, pass it to another phone
rep("""    bar.querySelector('.s-list').addEventListener('click',async()=>{ if(!list.hidden){ list.hidden=true; return; } const all=(await DB.all()).filter(r=>r.tool===tool).sort((a,b)=>b.date.localeCompare(a.date)); renderSaveList(list,all,tool); list.hidden=false; });""",
    """    bar.querySelector('.s-list').addEventListener('click',async()=>{ if(!list.hidden){ list.hidden=true; return; } const all=(await DB.all()).filter(r=>r.tool===tool).sort((a,b)=>b.date.localeCompare(a.date)); await renderSaveList(list,all,tool); const p=document.createElement('button'); p.type='button'; p.className='btn passon'; p.textContent='Pass this sheet to another phone'; p.addEventListener('click',()=>sendSheet(tool)); list.prepend(p); list.hidden=false; });""")
rep("""  function renderSaveList(list,all,tool){ list.innerHTML=all.length?'':'<p class="note">Nothing saved yet. Fill in a sheet and tap Save.</p>';""",
    """  async function renderSaveList(list,all,tool){ list.innerHTML=all.length?'':'<p class="note">Nothing saved yet. Fill in a sheet and tap Save.</p>'; let Q=[]; try{ Q=await SQ.all(); }catch(e){}""")
rep("""        row.innerHTML=`<div><b>${r.name}<span class="sent ${r.sent?'':'unsent'}">${r.sent?'sent'+(r.sends>1?' ×'+r.sends:''):'not sent'}</span></b><small>${TOOLNAMES[r.tool]||r.tool} · ${new Date(r.date).toLocaleDateString('en-GB')} ${new Date(r.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</small></div><button type="button" class="open">Open</button><button type="button" class="x" aria-label="Delete">×</button>`;""",
    """        const st=recState(r,Q); row.innerHTML=`<div><b>${esc63(r.name)}</b><small>${esc63(TOOLNAMES[r.tool]||r.tool)} · ${new Date(r.date).toLocaleDateString('en-GB')} ${new Date(r.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}${r.sent?' · client copy given':''}</small><span class="rstate" data-k="${st.k}">${esc63(st.t)}</span></div>${st.k==='problem'?'<button type="button" class="retry">Try again</button>':''}<button type="button" class="open">Open</button><button type="button" class="x" aria-label="Delete">×</button>`;
        const rt=row.querySelector('.retry'); if(rt) rt.addEventListener('click',()=>{ syncRetry(r.id); toast('Trying again'); rt.remove(); });""")
rep("""        row.querySelector('.x').addEventListener('click',async()=>{ if(!confirm('Delete "'+r.name+'"?')) return; await DB.del(r.id); row.remove(); });""",
    """        row.querySelector('.x').addEventListener('click',async()=>{ const filed=r.synced&&r.synced>=r.date; if(!confirm(filed?'Take "'+r.name+'" off this phone? The office copy stays.':'Delete "'+r.name+'"? It has not reached the office, so it will be gone for good.')) return; await DB.del(r.id); row.remove(); });""")
rep("""const st=$(o.section).querySelector('.s-state'); if(st) st.textContent=r.sent?'PDF sent':'opened'; toast('Opened '+r.name+(first?'. The sheet you had open was saved first':'')); });""",
    """o.rev=r.rev||0; if(window.syncStatus) syncStatus(); toast('Opened '+r.name+(first?'. The sheet you had open was saved first':'')); });""")
# a backup brought back onto a phone only sends what never reached the office
rep("""if(!h){ await DB.put({...r,loaded:r.date}); n++; if(window.syncEnqueue) syncEnqueue(r.tool,r.id); continue; }""",
    """if(!h){ await DB.put({...r,loaded:r.date}); n++; if(window.syncEnqueue&&!(r.synced&&r.synced>=r.date)) syncEnqueue(r.tool,r.id); continue; }""")
rep("""if(newer===r){ await DB.put({...h,...r,loaded:r.date,sends:Math.max(h.sends||0,r.sends||0)}); n++; if(window.syncEnqueue) syncEnqueue(r.tool,r.id); }""",
    """if(newer===r){ await DB.put({...h,...r,loaded:r.date,sends:Math.max(h.sends||0,r.sends||0)}); n++; if(window.syncEnqueue&&!(r.synced&&r.synced>=r.date)) syncEnqueue(r.tool,r.id); }""")
# Share, Download and Open save the sheet first, so a sheet sent by WhatsApp is always filed too
rep("""    const toBlob=async()=>{ const r=await build(); return r instanceof Blob?r:r.output('blob'); };""",
    """    const toBlob=async()=>{ const tool=TOOL_OF_PREFIX[prefix], o=SAVERS[tool]; if(o&&o.saveNow&&!window.SYNC_SWAP){ try{ let prev=null; if(o.currentId) prev=await DB.get(o.currentId); if(!prev||JSON.stringify(prev.data)!==JSON.stringify(o.get())) await o.saveNow(false); }catch(e){} } const r=await build(); return r instanceof Blob?r:r.output('blob'); };""")
# the footer says which revision this is and which sheet: Rev goes up each time the sheet is filed again
rep("""  function stampFooters(doc,tool){ const n=doc.getNumberOfPages(); const o=tool&&SAVERS[tool]; const issue=o?(o.sends||0)+1:1; for(let i=1;i<=n;i++){ doc.setPage(i); pdfFooter(doc,i,n,tool?FOOTNOTE[tool]:'',issue); } }""",
    """  function stampFooters(doc,tool){ const n=doc.getNumberOfPages(); const o=tool&&SAVERS[tool]; const rev=o?Math.max(1,o.rev||1):1; for(let i=1;i<=n;i++){ doc.setPage(i); pdfFooter(doc,i,n,tool?FOOTNOTE[tool]:'',rev); } }""")
rep("""    doc.text(`Sheet ${sheet} of ${of}`+(issue?`  ·  Issue ${issue}`:''),W-M,289.5,{align:'right'});""",
    """    doc.text(`Page ${sheet} of ${of}`+(issue?`  ·  Rev ${issue}`:''),W-M,289.5,{align:'right'});""")
rep("""if(st) st.textContent=`PDF sent · issue ${r.sends}`; } }catch(e){} }""","""if(st) st.textContent='Client copy given'; } }catch(e){} }""")
# the back-up nudge is for phones that are not filing to the office
rep("""    if(saved.length&&old&&newer){""","""    if(saved.length&&old&&newer&&!(window.AUTH&&AUTH.who())){""")
rep("""    bar.querySelector('.s-send').addEventListener('click',()=>sendSheet(tool));
""",'')
exec(open('r69b.py',encoding='utf-8').read())
