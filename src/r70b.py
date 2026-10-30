# ===== v70 part 2: dayworks matches extras; the same signature words on all three signed sheets =====
# dayworks: Where (plot or road), Ticket on materials, "if they can't sign"
rep('''      <div class="field"><label for="dw-ref">Sheet ref</label><div class="in"><input id="dw-ref" type="text" placeholder="DW-001"></div></div>''',
    '''      <div class="field"><label for="dw-ref">Sheet ref</label><div class="in"><input id="dw-ref" type="text" placeholder="DW-001"></div></div>
      <div class="field"><label for="dw-where">Where</label><div class="in"><input id="dw-where" type="text" placeholder="Plot 40, haul road, MH S12" data-k="where"></div></div>''')
rep('''<input id="dw-inst" type="text" placeholder="Client rep name">''','''<input id="dw-inst" type="text" placeholder="Their name">''')
rep('''    <div class="mt"><div class="lhead"><span>Description</span><span>Qty</span><span>Unit</span><span></span></div><div id="dw-mat"></div></div>''',
    '''    <div class="mt"><div class="lhead"><span>Description</span><span>Qty</span><span>Unit</span><span>Ticket</span><span></span></div><div id="dw-mat"></div></div>''')
rep("""  $('dw-addmat').addEventListener('click',()=>listRow($('dw-mat'),[{p:'Description'},{p:'Qty',t:'number'},{p:'Unit'}],dwSum).querySelector('input').focus());""",
    """  $('dw-addmat').addEventListener('click',()=>listRow($('dw-mat'),[{p:'Description'},{p:'Qty',t:'number'},{p:'Unit'},{p:'No.'}],dwSum).querySelector('input').focus());""")
rep("""      $('dw-mat').innerHTML=''; (d.mat||[]).forEach(r=>listRow($('dw-mat'),[{p:'Description',v:r[0]},{p:'Qty',t:'number',v:r[1]},{p:'Unit',v:r[2]}],dwSum));""",
    """      $('dw-mat').innerHTML=''; (d.mat||[]).forEach(r=>listRow($('dw-mat'),[{p:'Description',v:r[0]},{p:'Qty',t:'number',v:r[1]},{p:'Unit',v:r[2]},{p:'No.',v:r[3]||''}],dwSum));""")
CSS.append('.mt .lrow,.mt .lhead{grid-template-columns:1.5fr 0.6fr 0.6fr 0.7fr 32px}')
rep('''    <h2>Signatures</h2>
    <div class="grid2">
      <div class="field"><label for="dw-cname">Client rep name</label><div class="in"><input id="dw-cname" type="text" placeholder="Name"></div></div>
      <div class="field"><label for="dw-cpos">Position</label><div class="in"><input id="dw-cpos" type="text" placeholder="Site manager"></div></div>
    </div>
    <div class="field"><label>Client signature</label><div class="sigwrap"><canvas class="sig" id="dw-sig1"></canvas><button type="button" class="clear" data-sig="dw-sig1">Clear</button><span class="hint">Sign here</span></div></div>
    <div class="field"><label>RJH signature</label>''',
'''    <h2>Get it signed</h2>
    <div class="grid2">
      <div class="field"><label for="dw-cname">Their name</label><div class="in"><input id="dw-cname" type="text" placeholder="Name"></div></div>
      <div class="field"><label for="dw-cpos">Their job</label><div class="in"><input id="dw-cpos" type="text" placeholder="Site manager"></div></div>
    </div>
    <div class="field" id="dw-sigfield"><label>Their signature</label><div class="sigwrap"><canvas class="sig" id="dw-sig1"></canvas><button type="button" class="clear" data-sig="dw-sig1">Clear</button><span class="hint">Sign here</span></div></div>
    <div class="field"><label>If they can't sign</label><div class="seg three" id="dw-nosig"><button type="button" data-n="" aria-pressed="true" hidden>Signed</button><button type="button" data-n="Not on site" aria-pressed="false">Not on site</button><button type="button" data-n="Will sign later" aria-pressed="false">Will sign later</button><button type="button" data-n="Refused" aria-pressed="false">Would not sign</button></div></div>
    <div class="field" id="dw-nosigwrap" hidden><label for="dw-nosigwhy">Anything to add</label><div class="in"><input id="dw-nosigwhy" type="text" placeholder="e.g. said he'd check with the office"></div></div>
    <div class="field"><label>Your signature</label>''')
for p in ('aw','rm'):
    rep(f'''      <div class="field"><label for="{p}-cname">Client rep name</label>''',f'''      <div class="field"><label for="{p}-cname">Their name</label>''')
    rep(f'''      <div class="field"><label for="{p}-cpos">Position</label>''',f'''      <div class="field"><label for="{p}-cpos">Their job</label>''')
    rep(f'''    <div class="field" id="{p}-sigfield"><label>Client signature</label>''',f'''    <div class="field" id="{p}-sigfield"><label>Their signature</label>''')
    rep(f'''    <div class="field"><label>Not signed?</label><div class="seg four" id="{p}-nosig"><button type="button" data-n="" aria-pressed="true">Signed</button><button type="button" data-n="Not on site" aria-pressed="false">Not on site</button><button type="button" data-n="Will sign later" aria-pressed="false">Sign later</button><button type="button" data-n="Refused" aria-pressed="false">Refused</button></div></div>''',
        f'''    <div class="field"><label>If they can't sign</label><div class="seg three" id="{p}-nosig"><button type="button" data-n="" aria-pressed="true" hidden>Signed</button><button type="button" data-n="Not on site" aria-pressed="false">Not on site</button><button type="button" data-n="Will sign later" aria-pressed="false">Will sign later</button><button type="button" data-n="Refused" aria-pressed="false">Would not sign</button></div></div>''')
rep('    <h2>Signed off</h2>','    <h2>Get it signed</h2>',2)
CSS.append('.seg.three{grid-template-columns:repeat(3,1fr)}')
# dayworks keeps Where, "if they can't sign" and the reason with the sheet
rep("""    get:()=>({f:['dw-site','dw-client','dw-date','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos'].map(V),lab:rowsOf($('dw-lab')),""",
    """    get:()=>({f:['dw-site','dw-client','dw-date','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos','dw-where','dw-nosigwhy'].map(V),nosig:DW.nosig||'',links:(DW.links||[]).slice(),lab:rowsOf($('dw-lab')),""")
rep("""    set:d=>{ ['dw-site','dw-client','dw-date','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos'].forEach((id,i)=>S(id,d.f[i]));""",
    """    set:d=>{ ['dw-site','dw-client','dw-date','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos','dw-where','dw-nosigwhy'].forEach((id,i)=>S(id,d.f[i])); DW.nosig=d.nosig||''; DW.links=(d.links||[]).slice(); dwNosigUI(); if(window.linksDraw) linksDraw('dw');""")
rep("""    clear:()=>{ $('dw-clear').dispatchEvent(new Event('clear')); ['dw-site','dw-client','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos'].forEach(id=>S(id,''));""",
    """    clear:()=>{ $('dw-clear').dispatchEvent(new Event('clear')); ['dw-site','dw-client','dw-ref','dw-by','dw-inst','dw-desc','dw-cname','dw-cpos','dw-where','dw-nosigwhy'].forEach(id=>S(id,'')); DW.nosig=''; DW.links=[]; dwNosigUI(); if(window.linksDraw) linksDraw('dw');""")
rep("  const DW={photos:[]};","""  const DW={photos:[],nosig:'',links:[]};
  const dwNosigUI=()=>{ $('dw-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.n===DW.nosig)); $('dw-nosigwrap').hidden=!DW.nosig; $('dw-sigfield').style.opacity=DW.nosig?'0.4':''; };
  $('dw-nosig').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; DW.nosig=(DW.nosig===b.dataset.n)?'':b.dataset.n; dwNosigUI(); });""")
# extras and remedials: tapping the reason again takes it off (the hidden Signed button is the "no reason" state)
for p,o in (('aw','AW'),('rm','RM')):
    a=f"$('{p}-nosig').addEventListener('click',e=>{{ const b=e.target.closest('button'); if(!b) return; RM.nosig=b.dataset.n;" if p=='rm' else None
rep("  $('rm-nosig').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; RM.nosig=b.dataset.n;","  $('rm-nosig').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; RM.nosig=(RM.nosig===b.dataset.n)?'':b.dataset.n; if(!RM.nosig){ $('rm-nosig').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.n==='')); rmNosigUI(); return; }")
# the printed sheets: Where on dayworks, NOT SIGNED when it was not, and the same line under every signature
rep("""    y=cellRow(doc,M,y,CW,11,[{label:'RJH foreman',value:v('dw-by')||'–',w:CW*0.5},{label:'Instructed by',value:v('dw-inst')||'–',w:CW*0.5}]);""",
    """    y=cellRow(doc,M,y,CW,11,[{label:'Where',value:v('dw-where')||'–',w:CW*0.34},{label:'Our foreman',value:v('dw-by')||'–',w:CW*0.33},{label:'Who asked for it',value:v('dw-inst')||'–',w:CW*0.33}]);
    if((DW.links||[]).length) y=cellRow(doc,M,y,CW,9,[{label:'Linked sheets',value:DW.links.map(l=>l.ref).join(', '),w:CW}]);""")
rep("""    table('MATERIALS',[{l:'Description',w:CW*0.6},{l:'Unit',w:CW*0.2},{l:'Qty',w:CW*0.2,r:true}],rowsOf($('dw-mat')).map(r=>[r[0],r[2],r[1]]));""",
    """    table('MATERIALS',[{l:'Description',w:CW*0.5},{l:'Ticket',w:CW*0.18},{l:'Unit',w:CW*0.14},{l:'Qty',w:CW*0.18,r:true}],rowsOf($('dw-mat')).map(r=>[r[0],r[3]||'',r[2],r[1]]));""")
rep("""    sig(M,'Client representative',v('dw-cname'),v('dw-cpos'),SIGS['dw-sig1'].data());""",
    """    const dwNs=DW.nosig||(SIGS['dw-sig1'].has()?'':'Not signed yet');
    sig(M,'Client representative',v('dw-cname'),v('dw-cpos'),dwNs?null:SIGS['dw-sig1'].data());
    if(dwNs){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(dwNs+(v('dw-nosigwhy')?': '+v('dw-nosigwhy'):''),sw-6),M+3,y+21); }""")
SIGLINE='Signature confirms the record of work done and quantities measured. Value and entitlement per the contract.'
rep("""    doc.text('Signed as a true record of labour, plant and materials expended. Rates and valuation per the contract. Hours recorded on site, priced in the office.',M,y);""",
    """    doc.text(doc.splitTextToSize('"""+SIGLINE+""" Hours recorded on site.',CW),M,y);""")
rep("""    if(AW.nosig){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(AW.nosig+""",
    """    const awNs=AW.nosig||(SIGS['aw-sig'].has()?'':'Not signed yet'); if(awNs){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(awNs+""")
rep("""    if(RM.nosig){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(RM.nosig+""",
    """    const rmNs=RM.nosig||(SIGS['rm-sig'].has()?'':'Not signed yet'); if(rmNs){ doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(179,38,30); doc.text('NOT SIGNED',M+3,y+15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(rmNs+""")
rep("""    doc.text(doc.splitTextToSize('Work carried out on instruction, in addition to the contract. Quantities measured on site. Valuation per the contract.',CW),M,y);""",
    """    doc.text(doc.splitTextToSize('Work carried out on instruction, in addition to the contract. """+SIGLINE+"""',CW),M,y);""")
# extras: the PDF and screen say Extras; the ref stays AW- so numbers already given to clients carry on
rep("""<b id="aw-headline">Additional works</b>""","""<b id="aw-headline">Extras</b>""")
rep('<section id="panel-aw" data-title="Additional works" hidden>','<section id="panel-aw" data-title="Extras" hidden>')
rep("const TOOLNAMES={rm:'Remedials',aw:'Additional works',","const TOOLNAMES={rm:'Remedials',aw:'Extras',")
rep("aw:'Additional works record. Quantities measured on site.'","aw:'Extras (additional works) record. Quantities measured on site.'")
# gradient sheets and take-offs file with a PDF like everything else
rep("""  function makeBlob(){ const doc=buildPdf(); return {doc,blob:doc.output('blob')}; }""",
    """  function makeBlob(){ const doc=buildPdf(); return {doc,blob:doc.output('blob')}; }
  (window.PDF_BUILD_P=window.PDF_BUILD_P||{}).g={build:()=>buildPdf(),name:pdfName,valid:()=>!!G.valid};""")
rep("""  async function toPdfBlob(kind,sup){""","""  (window.PDF_BUILD_P=window.PDF_BUILD_P||{}).to={build:()=>toPdfBlob('office'),name:()=>toFile('office'),valid:()=>!!(TOM&&TOM.areas&&TOM.areas.length)};
  async function toPdfBlob(kind,sup){""")
rep("""    let y=pdfHeader(doc,'ADDITIONAL WORKS',`${v('aw-ref')||'No ref'}  ·  ${date}  ·  ${v('aw-site')}`);""","""    let y=pdfHeader(doc,'EXTRAS (ADDITIONAL WORKS)',`${v('aw-ref')||'No ref'}  ·  ${date}  ·  ${v('aw-site')}`);""")
rep("""    y=cellRow(doc,M,y,CW,11,[{label:'Where on site',value:v('aw-loc')||'–',w:CW*0.6},{label:'RJH foreman',value:v('aw-by')||'–',w:CW*0.4}]);""",
    """    y=cellRow(doc,M,y,CW,11,[{label:'Where on site',value:v('aw-loc')||'–',w:CW*0.6},{label:'Our foreman',value:v('aw-by')||'–',w:CW*0.4}]);
    if((AW.links||[]).length) y=cellRow(doc,M,y,CW,9,[{label:'Linked sheets (same work, do not price twice)',value:AW.links.map(l=>l.ref).join(', '),w:CW}]);""")
rep("""    hasContent:d=>d.f&&(d.f[0]||d.f[6]||(d.lab&&d.lab.length)) });""","""    hasContent:d=>d.f&&(d.f[6]||(d.lab&&d.lab.length)||(d.plant&&d.plant.length)||(d.mat&&d.mat.length)||(d.photos&&d.photos.length)) });""")
CSS.append('.jobstrip>summary{text-transform:none;letter-spacing:0;font-weight:400}.jobstrip>summary::after{content:none!important}.jobstrip .js-line b{font-weight:800}')
# the address line only on the home screen
rep("  function go(id){ PANELS.forEach(p=>p.hidden=p.id!==id);","  function go(id){ PANELS.forEach(p=>p.hidden=p.id!==id); { const ft=document.querySelector('footer'); if(ft) ft.hidden=id!=='panel-home'; }")
