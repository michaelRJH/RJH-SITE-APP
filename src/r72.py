# ===== v72: office side, From the office =====
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('fromoffice72.js',encoding='utf-8').read()+a)
CSS.append('''.seg.of-six{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.of-flag{display:inline-block;margin-top:4px;background:#FBE9E7;color:#B3261E;border:1px solid #B3261E;border-radius:99px;padding:1px 8px;font-size:12px;font-weight:700}
.of-notes{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;font-size:14px}.of-notes span{flex:1 1 100%}.of-notes span:empty{display:none}
.of-notes button{appearance:none;border:0;background:none;font:inherit;font-size:13px;font-weight:700;text-decoration:underline;color:var(--ink-2);cursor:pointer;padding:2px 0}
.of-status button{font-size:11px;padding:8px 1px}
#of-progress h3{margin:0 0 6px}.pchips{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 10px}
.pchip{border:1px solid var(--line);border-radius:6px;padding:3px 7px;font-size:12px;font-weight:700;background:#eee;color:var(--ink-2)}.pchip.done{background:#E7F2EA;border-color:#1E6F3F;color:#1E6F3F}
.readonly .savebar .s-save,.readonly .donebar .done{display:none}
.readonly input,.readonly textarea,.readonly select,.readonly canvas,.readonly .seg,.readonly .lrow,.readonly .mhring{pointer-events:none}
.readonly .jobstrip,.readonly h2,.readonly .field{opacity:.85}
.ro-banner{border:2px solid #1E6FBF;border-left:8px solid #1E6FBF;border-radius:var(--r);background:#EEF4FB;padding:10px 12px;margin:0 0 12px;font-size:14px}.ro-banner .btnrow{margin:8px 0 0}
.fr-row{display:flex;gap:6px;align-items:center;margin:0 0 6px}.fr-open{flex:1;text-align:left;appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);padding:8px 10px;font:inherit;cursor:pointer}
.fr-open b{display:block;font-size:15px;word-break:break-word}.fr-open small{font-size:12px;color:var(--ink-2)}.fr-rm{margin:0;width:auto;padding:8px 10px;font-size:13px}
.fr-new{background:var(--hivis);border-radius:99px;padding:1px 7px;font-size:11px;font-weight:800;color:var(--ink);margin-left:6px}
.js-sum{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.js-sum span{border:2px solid #1E6F3F;border-radius:99px;padding:2px 10px;font-size:13px;background:#E7F2EA}.js-sum span.zero{border-color:var(--line);background:#fff;color:var(--ink-2)}''')
# ===== v72 fixes =====
# a sheet saved on the way to opening another (My sheets, Today, From the office, office Open) goes to the office too; a read-only office copy is never saved
rep("""  async function saveQuiet(tool){ const o=SAVERS[tool]; if(!o) return false; let data;""",
    """  async function saveQuiet(tool){ const o=SAVERS[tool]; if(!o) return false; if($(o.section).classList.contains('readonly')) return false; let data;""")
rep("""    o.currentId=id; return true; }
  const ago=""","""    o.currentId=id; if(window.syncEnqueue) syncEnqueue(tool,id); return true; }
  const ago=""")
rep("""    opts.saveNow=async(loud)=>{ if(window.REFFILL) await REFFILL(tool);""","""    opts.saveNow=async(loud)=>{ if(sec.classList.contains('readonly')) return true; if(window.REFFILL) await REFFILL(tool);""")
# New and Open leave the read-only office view, so the next sheet can be typed in and saved
rep("""const was=had?(opts.name()||TOOLNAMES[tool]):''; opts.clear();""","""const was=had?(opts.name()||TOOLNAMES[tool]):''; if(window.readOnly) readOnly(tool,false); opts.clear();""")
rep("""o.set(r.data); o.currentId=r.id; o.sends=r.sends||0; if(tool==='all') go(o.section);""","""if(window.readOnly) readOnly(r.tool,false); o.set(r.data); o.currentId=r.id; o.sends=r.sends||0; if(tool==='all') go(o.section);""")
# an older copy kept from a backup is its own sheet: it must not carry the original's register row or file names (it would delete the original's files)
rep("""await DB.put({...older,id:cid,name:older.name+' (older copy '+new Date(older.date).toLocaleDateString('en-GB')+')'});""",
    """await DB.put((c=>{ ['listItemId','syncName','syncBase','syncJson','syncPath','pdfTag','jsonTag','webUrl','forkOf','fromOffice'].forEach(k=>delete c[k]); return c; })({...older,id:cid,name:older.name+' (older copy '+new Date(older.date).toLocaleDateString('en-GB')+')'}));""")
# photos from a sheet someone else saved go into the page escaped
rep('w.innerHTML=`<img src="${d}"><button','w.innerHTML=`<img src="${esc63(d)}"><button')
rep('w.innerHTML=`<img src="${o.d}" alt="">','w.innerHTML=`<img src="${esc63(o.d)}" alt="">')
# wording: densities, not rates
rep('are the shared rates from the home screen','are the shared figures from the home screen',2)
rep('They are shared rates: change them','They are shared figures: change them')
rep("Put every rate back to the RJH defaults?","Put every density back to the RJH defaults?")
CSS.append('body.swapping .wrap section:not([hidden]){pointer-events:none;opacity:.6}body.swapping::after{content:"One moment, filing a sheet";position:fixed;left:50%;top:12px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:8px 14px;border-radius:99px;font-weight:700;font-size:14px;z-index:99}')
