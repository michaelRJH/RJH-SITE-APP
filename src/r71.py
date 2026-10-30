# ===== v71: tool by tool =====
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('tools71.js',encoding='utf-8').read()+a)
# manhole card keeps the design levels from the job's schedule, and prints design against built for the outlet too
rep("photos:MH.photos.slice()}),","photos:MH.photos.slice(),design:MH.design||null}),")
rep("MH.sys=d.sys||'foul'; MH.refl=d.refl||'cover';","MH.sys=d.sys||'foul'; MH.design=d.design||null; MH.refl=d.refl||'cover';")
rep("S('mh-date',today()); S('mh-frame','150'); MH.sys='foul';","S('mh-date',today()); S('mh-frame','150'); MH.design=null; MH.sys='foul';")
rep("{label:'Outlet invert',value:out&&!isNaN(out.il)?out.il.toFixed(3)+' m':(out&&!isNaN(out.depthN)?out.depthN+' mm down':'–'),w:CW*0.18,bold:true,size:11}",
    "{label:'Outlet invert'+(MH.design&&MH.design.il&&out&&!isNaN(out.il)?' · design '+(+MH.design.il).toFixed(3)+', '+((out.il-MH.design.il)>=0?'+':'')+Math.round((out.il-MH.design.il)*1000)+' mm':''),value:out&&!isNaN(out.il)?out.il.toFixed(3)+' m':(out&&!isNaN(out.depthN)?out.depthN+' mm down':'–'),w:CW*0.18,bold:true,size:11}")
CSS.append('''.foldsec{border:2px solid var(--line);border-radius:var(--r);background:#fff;padding:0 10px;margin:14px 0}
.foldsec>summary{padding:12px 0;font-weight:800;cursor:pointer}.foldsec>summary small{display:block;font-weight:500;font-size:12px;color:var(--ink-2)}
.foldsec[open]>summary{border-bottom:1px solid var(--line);margin-bottom:8px}
.joblist{margin:0 0 12px}.joblist details{border:2px solid var(--ink);border-radius:var(--r);background:#fff;padding:0 10px}
.joblist summary{padding:10px 0;font-weight:800;cursor:pointer}.joblist summary small{font-weight:600;color:var(--ink-2);margin-left:6px}
.mhchips{display:flex;flex-wrap:wrap;gap:6px;padding:0 0 10px}
.mhchip{appearance:none;border:2px solid var(--ink);background:#fff;border-radius:var(--r);padding:8px 10px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;min-width:52px}
.mhchip.done{background:#E7F2EA;border-color:#1E6F3F;color:#1E6F3F}
.rm-bigadd{width:100%;font-size:18px;padding:14px;margin:4px 0 10px}
.putbtn{margin-top:10px}.putsheet{margin:8px 0;padding:10px;border:2px dashed var(--ink);border-radius:var(--r)}
#th-mats .chip,#th-mats button{min-height:44px;font-size:15px}''')
