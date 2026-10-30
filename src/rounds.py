def rep(a,b,n=1):
    global t
    assert t.count(a)==n, ('count',t.count(a),a[:80]); t=t.replace(a,b)
CSS=[]
# ===== Round 2: levels, one compact row per point =====
a=t[t.index("      r.innerHTML=`<div class=\"nm\">${pt.name}</div><div class=\"lf\"><small>Design U/S</small>"):]
a=a[:a.index("box.appendChild(r); }); }")+len("box.appendChild(r); }); }")]
b='''      const dg=isNaN(pt.diff)?{t:'Dug level not in yet',c:'var(--ink-2)'}:pt.diff>25?{t:pt.diff+' mm over-dug',c:'#B3261E'}:pt.diff<-25?{t:(-pt.diff)+' mm short of design',c:'#B3261E'}:{t:'On level ('+(pt.diff>0?'+':'')+pt.diff+' mm)',c:'#1E6FBF'};
      const more=!!(src.dU||src.mat);
      r.innerHTML=`<div class="nm">${pt.name}</div><div class="in c-gl"><input data-f="gl" type="number" inputmode="decimal" step="0.001" placeholder="ground" value="${src.gl||''}"></div><div class="in c-exc"><input data-f="exc" type="number" inputmode="decimal" step="0.001" placeholder="${ph(pt.dU,'dug to')}" value="${src.exc||''}"></div><div class="in c-toc"><input data-f="toc" type="number" inputmode="decimal" step="0.001" placeholder="${ph(FDM.D.toc,'concrete')}" value="${src.toc||''}"></div>
        <div class="lx"><b style="color:${dg.c}">${dg.t}</b><button type="button" class="lmb">${more?'Hide':'More'}</button></div>
        <div class="lmore" ${more?'':'hidden'}><div class="lf"><small>Design U/S here</small><div class="in"><input data-f="dU" type="number" inputmode="decimal" step="0.001" placeholder="${ph(FDM.D.exc,'as plot')}" value="${src.dU||''}"></div></div><div class="lf"><small>Ground at the bottom</small><div class="in"><input data-f="mat" type="text" placeholder="as plot" value="${src.mat||''}"></div></div></div>`;
      const f=k=>r.querySelector(`[data-f="${k}"]`);
      ['dU','gl','exc','toc'].forEach(k=>f(k).addEventListener('input',()=>{ src[k]=f(k).value; drawFd(true); }));
      f('mat').addEventListener('input',()=>{ src.mat=f('mat').value; });
      f('exc').addEventListener('change',()=>renderLevels()); f('dU').addEventListener('change',()=>renderLevels());
      r.querySelector('.lmb').addEventListener('click',e=>{ const m=r.querySelector('.lmore'); m.hidden=!m.hidden; e.target.textContent=m.hidden?'More':'Hide'; });
      box.appendChild(r); }); }'''
rep(a,b)
rep("    const ph=(v,alt)=>isNaN(v)?alt:v.toFixed(3);\n    (FDM.points||[])","    const ph=(v,alt)=>isNaN(v)?alt:v.toFixed(3);\n    if((FDM.points||[]).length){ const hd=document.createElement('div'); hd.className='lrow lvhd'; hd.innerHTML='<div></div><small class=\"c-gl\">Ground</small><small class=\"c-exc\">Dug to</small><small class=\"c-toc\">Concrete top</small>'; box.appendChild(hd); }\n    (FDM.points||[])")
rep('<p class="note">One row per point named on the plan. <b>Design U/S</b> is the underside of foundation off the drawing (the plot level unless a point has its own). <b>GL</b> ground as found · <b>Exc</b> bottom of the trench as dug · <b>TOC</b> top of concrete as poured, all m AOD. Difference is as dug against design.</p>',
    '<p class="note">One row per corner on the sketch, levels in m AOD. Blank boxes use the design level.</p>')
rep('<h2 id="fd-lvh">Levels at each survey point</h2>','<h2 id="fd-lvh">Levels at each corner</h2>')
CSS.append('''.fd-lv .lrow{grid-template-columns:30px 1fr 1fr 1fr;align-items:center;gap:6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.fd-lv .lrow.lvhd{border:0;padding:0;margin:0 0 2px}
.fd-lv .lrow.lvhd small{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2)}
.fd-lv .lrow .nm{padding:0;font-size:20px}
.fd-lv .lrow .in input{font-size:17px;padding:10px 6px}
.fd-lv .lx{grid-column:2 / -1;display:flex;justify-content:space-between;align-items:center;font-size:14px}
.fd-lv .lmb{appearance:none;border:0;background:none;font:inherit;font-size:13px;font-weight:700;text-decoration:underline;color:var(--ink-2);padding:6px 0 6px 10px;cursor:pointer}
.fd-lv .lmore{grid-column:2 / -1;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.fd-lv .lmore[hidden]{display:none}''')
# levels in letter order A, B, C...
rep("    (FDM.points||[]).forEach(pt=>{ const src=pt.kind==='corner'?FD.pts[pt.i]","    (FDM.points||[]).slice().sort((a,b)=>(String(a.name).length-String(b.name).length)||String(a.name).localeCompare(String(b.name))).forEach(pt=>{ const src=pt.kind==='corner'?FD.pts[pt.i]")

# ===== Round 1: fold the long page into sections =====
CSS.append('''#panel-fd h2.acc{cursor:pointer;display:flex;align-items:baseline;gap:8px;user-select:none}
#panel-fd h2.acc::after{content:"+";margin-left:auto;font-size:26px;line-height:1}
#panel-fd h2.acc.open::after{content:"–"}
#panel-fd h2.acc .accs{font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
#panel-fd .accb[hidden]{display:none}''')

# headings set by the app must not wipe the fold summary
rep("$('fd-lvh').textContent='Levels at each survey point'; $('fd-lsh').textContent=run?'Long section along the wall':'Long section round the plot';",
    "$('fd-lvh').firstChild.nodeValue='Levels at each corner'; $('fd-lsh').firstChild.nodeValue=run?'Long section along the wall':'Long section round the plot';")

# ===== Round 4: sketch fills the phone, design levels easy to reach =====
rep("const cv=$('fd-canvas'); const CW_=560, CH_=380;","const cv=$('fd-canvas'); const CW_=560; let CH_=380; const fitH=(w,h,mg)=>{ CH_=Math.round(Math.max(380,Math.min(720,CW_*(h+2*mg+0.5)/(w+2*mg+0.5)))); };")
rep("const mg=FD.bays.length?3:2; const need=","const mg=FD.bays.length?3:2; fitH(maxx-minx,maxy-miny,mg); const need=")
rep("const mg=FD.bays.length?3:2; FD.ppm=Math.max(8,Math.min(60,Math.min(CW_/(w+2*mg+0.5),CH_/(h+2*mg+0.5))));","const mg=FD.bays.length?3:2; fitH(w,h,mg); FD.ppm=Math.max(8,Math.min(60,Math.min(CW_/(w+2*mg+0.5),CH_/(h+2*mg+0.5))));")
rep("<h2>Design levels from the drawing</h2>","<h2>Design levels</h2>")
CSS.append("#fd-warn:not(:empty){cursor:pointer;text-decoration:underline}")

# ===== Round 7: printed record =====
rep("    M.points.forEach((c,i)=>{ if(y>268){ doc.addPage(); y=pdfHeader(doc,'RECORD (CONT.)',sub); }","    M.points.slice().sort((a,b)=>(String(a.name).length-String(b.name).length)||String(a.name).localeCompare(String(b.name))).forEach((c,i)=>{ if(y>268){ doc.addPage(); y=pdfHeader(doc,'RECORD (CONT.)',sub); }")
rep("doc.text('LEVELS AT THE SURVEY POINTS',Mg,y);","doc.text('LEVELS AT EACH CORNER',Mg,y);")
rep("else pdfPlan_fd(doc,Mg,y,CW,80,M); y+=(isPhoto()?95:85);","else pdfPlan_fd(doc,Mg,y,CW,PH_,M); y+=(isPhoto()?95:PH_+5);")
i=t.index("else pdfPlan_fd(doc,Mg,y,CW,PH_,M);"); j=t.rindex("\n",0,i)+1
t=t[:j]+"    const PH_=(()=>{ const xs=FD.pts.map(p=>p.x), ys=FD.pts.map(p=>p.y); if(xs.length<3) return 80; const w=Math.max(...xs)-Math.min(...xs), h=Math.max(...ys)-Math.min(...ys); return h>w*0.9?118:80; })();\n"+t[j:]

# ===== Item 3: on a phone the sketch draws at real pixel size, so numbers and corners come out about 1.6x bigger =====
rep("const cv=$('fd-canvas'); const CW_=560; let CH_=380; const fitH=(w,h,mg)=>{ CH_=Math.round(Math.max(380,Math.min(720,CW_*(h+2*mg+0.5)/(w+2*mg+0.5)))); };",
    "const cv=$('fd-canvas'); let CW_=560; let CH_=380; const fitH=(w,h,mg)=>{ const cw=cv.clientWidth||0; if(cw>100) CW_=Math.round(Math.max(330,Math.min(560,cw-4))); CH_=Math.round(Math.max(Math.min(380,CW_*0.9),Math.min(720,CW_*1.6,CW_*(h+2*mg+0.5)/(w+2*mg+0.5)))); };")

# bigger finger target: a corner or side within about 18 px of the tap counts
rep("const ci=FD.pts.findIndex(p=>Math.hypot(p.x-m.x,p.y-m.y)<=0.45);","const ci=FD.pts.findIndex(p=>Math.hypot(p.x-m.x,p.y-m.y)<=Math.max(0.45,18/FD.ppm));")
rep("let best=null,bd=0.45;","let best=null,bd=Math.max(0.45,16/FD.ppm);")

# ===== Item 5: dig day / pour day =====
rep('<div class="fd-lv"><div id="fd-lvrows"></div></div>','<div class="seg three" id="fd-stage" style="margin:0 0 10px"><button type="button" data-st="dig" aria-pressed="false">Dig day</button><button type="button" data-st="pour" aria-pressed="false">Pour day</button><button type="button" data-st="all" aria-pressed="true">Both</button></div>\n    <div class="fd-lv" id="fd-lvwrap"><div id="fd-lvrows"></div></div>')
CSS.append('''.fd-lv.st-dig .lrow,.fd-lv.st-pour .lrow{grid-template-columns:30px 1fr 1fr}
.fd-lv.st-dig .c-toc,.fd-lv.st-pour .c-gl{display:none}''')

# small nibs: no size boxes or long label on the sketch and PDF, just "Nib" (tap it to edit)
rep("      g+=`<rect data-dim=\"bayw\" data-i=\"${i}\"","      const nib=bay.label==='Nib'; if(nib){ g+=T(lx,ly+4,'Nib',{s:9.5,c:'#4A4A46',w:600}); return; }\n      g+=`<rect data-dim=\"bayw\" data-i=\"${i}\"")
rep("doc.text(`Bay ${i+1}${bay.label?' '+bay.label:''}  ${bay.w.toFixed(2)} x ${bay.d.toFixed(2)}  ·  ${bay.fw}`,X(gm.wbox.x),Y(gm.wbox.y)+1,{align:'center'});",
    "doc.text(bay.label==='Nib'?'Nib':`Bay ${i+1}${bay.label?' '+bay.label:''}  ${bay.w.toFixed(2)} x ${bay.d.toFixed(2)}  ·  ${bay.fw}`,X(gm.wbox.x),Y(gm.wbox.y)+1,{align:'center'});")

# ===== Additional works tool =====
rep('<button class="tile rec" data-go="panel-dw"><b>Dayworks</b><span>Signed sheet, PDF</span></button>','<button class="tile rec" data-go="panel-dw"><b>Dayworks</b><span>Signed sheet, PDF</span></button>\n      <button class="tile rec" data-go="panel-aw"><b>Additional works</b><span>Measured extras, photos, PDF</span></button>')
rep('  <!-- TRIAL HOLES -->',open('aw.html',encoding='utf-8').read()+'  <!-- TRIAL HOLES -->')
a="pdfActions('dw',buildDw,"; i=t.index(a); j=t.index('\n',i)+1; t=t[:j]+open('aw.js',encoding='utf-8').read()+t[j:]
rep("  // Trial holes\n  registerSave('th',",open('aw_save.js',encoding='utf-8').read()+"  // Trial holes\n  registerSave('th',")
rep("const TOOLNAMES={mh:'Manhole card',","const TOOLNAMES={aw:'Additional works',mh:'Manhole card',")
rep("const TOOL_OF_PREFIX={g:'grad',dw:'dw',","const TOOL_OF_PREFIX={g:'grad',dw:'dw',aw:'aw',")
rep("const PREFILL={mh:{site:'mh-site',client:'mh-client',by:'mh-by'},","const PREFILL={aw:{site:'aw-site',client:'aw-client',by:'aw-by'},mh:{site:'mh-site',client:'mh-client',by:'mh-by'},")
rep("const FOOTNOTE={grad:","const FOOTNOTE={aw:'Additional works record. Quantities measured on site.',grad:")
rep("    'panel-dw':[`Hours and quantities only","    'panel-aw':[`For extra work someone asked for on site: one sheet per job, one item per bit of work.`,`Pick the type of each item and type the sizes. The quantity (m³, tonnes, m², m) works itself out.`,`Put who asked for it and how. That name is what gets the work paid.`,`Add a photo to each item. Get the client rep to sign, or tick why they did not.`,`Share PDF sends the sheet with photos. Email writes the quantities into an email to Steven (or whoever you pick).`],\n    'panel-dw':[`Hours and quantities only")
CSS.append('''.seg.four{grid-template-columns:repeat(4,minmax(0,1fr))}
.seg.four button{font-size:14px;padding:12px 2px}
.aw-item{border:2px solid var(--ink);border-left:8px solid var(--hivis);border-radius:var(--r);background:var(--field);padding:10px 12px 12px;margin:0 0 12px}
.aw-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.aw-top b{font-family:"Barlow Condensed",sans-serif;font-size:20px;text-transform:uppercase}
.aw-top .x{appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);width:40px;height:36px;font-size:20px;cursor:pointer}
.aw-types,.aw-mats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.aw-types button,.aw-mats button{appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:9px 10px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.aw-types button[aria-pressed=true],.aw-mats button[aria-pressed=true]{background:var(--ink);color:#fff}
.aw-dims{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px}
.aw-res{margin:8px 0 2px;font-size:15px}
.aw-res b{font-size:22px;font-family:"Barlow Condensed",sans-serif}
.aw-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 12px}
.aw-quick button{appearance:none;border:2px solid var(--ink);background:var(--hivis);color:var(--ink);border-radius:var(--r);padding:14px 6px;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
.aw-quick button:last-child{grid-column:1/-1;background:#fff}
.aw-quick button small{display:block;font-size:11px;font-weight:600;margin-top:2px}
.aw-why{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.aw-why button{appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:11px 6px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.aw-why button[aria-pressed=true]{background:var(--ink);color:#fff}
.aw-bit{border-top:1px dashed var(--line);padding-top:6px;margin-top:4px}
.aw-bith{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
.aw-delbit{appearance:none;border:0;background:none;font:inherit;font-size:13px;font-weight:700;text-decoration:underline;color:var(--ink-2);cursor:pointer;padding:4px}
.aw-more{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:6px}
.aw-dims{grid-template-columns:repeat(auto-fit,minmax(84px,1fr))}
.aw-top span{display:flex;gap:6px}
.aw-dup{appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:0 10px;height:36px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}''')

# footer: the issue/note text ran into the address on every PDF; give each its own line
rep("doc.setFont('helvetica','normal'); doc.text('Howard House, Lowfields Road, Leeds LS12 6BS  ·  Civil Engineering Contractors since 1967',M,293.5);",
    "doc.setFont('helvetica','normal'); doc.text('Howard House, Lowfields Road, Leeds LS12 6BS',M,293.5);")
rep("doc.text(`Sheet ${sheet} of ${of}`,W-M,289.5,{align:'right'});","doc.text(`Sheet ${sheet} of ${of}`+(issue?`  ·  Issue ${issue}`:''),W-M,289.5,{align:'right'});")
rep("doc.text((issue?`Issue ${issue}  ·  `:'')+(note||'Site record. Check against the drawings.'),W-M,293.5,{align:'right'});","doc.text(note||'Site record. Check against the drawings.',W-M,293.5,{align:'right'});")

rep("doc.setFont('helvetica','normal'); doc.text('Howard House, Lowfields Road, Leeds LS12 6BS',M,293.5);","doc.setFont('helvetica','normal'); doc.text('Civil Engineering Contractors since 1967',M+doc.getTextWidth('R.J. HOWARD ENGINEERS LTD')*1.08+3,289.5); doc.text('Howard House, Lowfields Road, Leeds LS12 6BS',M,293.5);")

CSS.append('''.aw-dims .in input{min-width:0;padding-left:8px;padding-right:2px}
.aw-dims .in .unit{padding:0 6px;min-width:0}
#panel-aw .dw:has(> div:empty) .lhead{display:none}''')

# ===== Remedials tool =====
rep('<button class="tile rec" data-go="panel-aw"><b>Additional works</b><span>Measured extras, photos, PDF</span></button>','<button class="tile rec" data-go="panel-aw"><b>Additional works</b><span>Measured extras, photos, PDF</span></button>\n      <button class="tile rec" data-go="panel-rm"><b>Remedials</b><span>Snag list closed out, before and after</span></button>')
rep('  <!-- TRIAL HOLES -->',open('rm.html',encoding='utf-8').read()+'  <!-- TRIAL HOLES -->')
a="pdfActions('aw',buildAw,"; i=t.index(a); j=t.index('\n',i)+1; t=t[:j]+open('rm.js',encoding='utf-8').read()+t[j:]
rep("  // Trial holes\n  registerSave('th',",open('rm_save.js',encoding='utf-8').read()+"  // Trial holes\n  registerSave('th',")
rep("const TOOLNAMES={aw:'Additional works',","const TOOLNAMES={rm:'Remedials',aw:'Additional works',")
rep("const TOOL_OF_PREFIX={g:'grad',dw:'dw',aw:'aw',","const TOOL_OF_PREFIX={g:'grad',dw:'dw',aw:'aw',rm:'rm',")
rep("const PREFILL={aw:{site:'aw-site',client:'aw-client',by:'aw-by'},","const PREFILL={rm:{site:'rm-site',client:'rm-client',by:'rm-by'},aw:{site:'aw-site',client:'aw-client',by:'aw-by'},")
rep("const FOOTNOTE={aw:","const FOOTNOTE={rm:'Remedials close-out. Photographed on site.',aw:")
rep("    'panel-aw':[`For extra work","    'panel-rm':[`For a snag or remedial list from the client. One sheet per list, one item per snag.`,`Type the snags in, or paste the whole list and each line becomes a snag. Take a before photo, fix it, mark it Fixed, say how, take an after photo.`,`Not ours: say why, and whether we will do it anyway as an extra. Needs the client: say what you need from them.`,`Open shows what is left to do. Save it and come back over as many visits as it takes.`,`The PDF is the close-out report with before and after photos. Share it when the list is done, or part way to show progress.`],\n    'panel-aw':[`For extra work")
CSS.append('''.rm-item{border:2px solid var(--ink);border-left:8px solid var(--danger);border-radius:var(--r);background:var(--field);padding:10px 12px 12px;margin:0 0 12px}
.rm-item.st-fixed{border-left-color:#1E6F3F}.rm-item.st-notours{border-left-color:#8a8a86}.rm-item.st-client{border-left-color:var(--hivis)}
.rm-item .rm-st button{font-size:13px;padding:11px 2px}
.rm-fixwrap[hidden],.rm-whywrap[hidden]{display:none}
.rm-sum{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin:0 0 10px;font-size:15px}
.rm-sum b{font-family:"Barlow Condensed",sans-serif;font-size:22px}
.rm-row{appearance:none;width:100%;border:0;background:none;padding:2px 0;display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;text-align:left;font:inherit;cursor:pointer}
.rm-no{font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:22px}
.rm-txt{font-size:15px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.rm-stt{font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-2);white-space:nowrap}
.rm-item:not(.sel){padding:8px 10px;margin-bottom:6px}
.rm-item.st-fixed .rm-stt{color:#1E6F3F}.rm-item.st-open .rm-stt{color:var(--danger)}
.rm-said{font-size:18px;font-weight:600;margin:4px 0 10px;line-height:1.3}
.rm-edit summary{font-size:13px;font-weight:700;color:var(--ink-2);text-decoration:underline;cursor:pointer;padding:4px 0 8px}
.rm-big{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:4px 0 10px}
.rm-big button{appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:16px 4px;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
.rm-big button[aria-pressed=true]{background:var(--ink);color:#fff}
.rm-big button[data-st=fixed][aria-pressed=true]{background:#1E6F3F;border-color:#1E6F3F}
.rm-close{appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);padding:0 12px;height:36px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.rm-addsum{font-weight:700;padding:10px 0;cursor:pointer}
.rm-k.fixed b{color:#1E6F3F}.rm-k.open b{color:var(--danger)}.rm-k.client b{color:#b07800}.rm-k.notours b{color:#8a8a86}''')

# ===== opening pop-up =====
rep('<section id="panel-home"','\n'.join([open('splash.html',encoding='utf-8').read().rstrip(),'  <section id="panel-home"']),1) if t.count('<section id="panel-home"')==1 else None
CSS.append(open('splash.css',encoding='utf-8').read())
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('splash.js',encoding='utf-8').read()+a)

exec(open('r63.py',encoding='utf-8').read())
exec(open('r64.py',encoding='utf-8').read())
exec(open('r66.py',encoding='utf-8').read())
exec(open('r67.py',encoding='utf-8').read())
exec(open('r68.py',encoding='utf-8').read())
exec(open('r69.py',encoding='utf-8').read())
exec(open('r70.py',encoding='utf-8').read())
exec(open('r71.py',encoding='utf-8').read())
exec(open('r72.py',encoding='utf-8').read())
CSS.append('.rm-phbtns{display:grid;grid-template-columns:1fr 1fr;gap:6px}.rm-phbtns .filebtn{margin:0}')
#__END__
rep('</head>','<style>'+'\n'.join(CSS)+'</style>\n</head>')
# guard: no money in the site app
assert '£' not in t and 'money(' not in t, 'price text found in the build'
