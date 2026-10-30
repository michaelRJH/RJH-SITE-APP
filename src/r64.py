# ===== v64: Additional works on one screen =====
a="  // ---- Additional works: every kind of extra on site"; i=t.index(a); j=t.index("\n  // Trial holes\n  registerSave('th',",i)
# the simple-screen script goes straight after aw.js (which ends at the share2 handler)
k=t.index("catch(e){ $('aw-status').textContent='PDF error: '+(e.message||e); toast('PDF error'); } });\n",i); k=t.index('\n',k)+1
t=t[:k]+open('aw_simple.js',encoding='utf-8').read()+t[k:]
# photo count includes the sheet photos
rep("$('aw-np').textContent=AW.items.reduce((a,it)=>a+(it.photos||[]).length,0);","$('aw-np').textContent=AW.photos.length+AW.items.reduce((a,it)=>a+(it.photos||[]).length,0);")
# an item made from the sizes box says so; editing it by hand keeps it as its own item
rep("c.className='aw-item';\n      const dimF=","c.className='aw-item'+(it.auto?' auto':''); c.addEventListener('input',()=>{ if(it.auto){ it.auto=false; c.classList.remove('auto'); const nt=c.querySelector('.aw-autonote'); if(nt) nt.remove(); awSizesOut(); } },true);\n      const dimF=")
rep("c.innerHTML=`<div class=\"aw-top\"><b>Item ${i+1}</b>","c.innerHTML=`${it.auto?'<p class=\"note aw-autonote\" style=\"margin:0 0 6px\">From your sizes box. Change anything here and it becomes its own item.</p>':''}<div class=\"aw-top\"><b>Item ${i+1}</b>")
# PDF: sheet photos first, and a sheet with only a description still prints
rep("const ph=[]; AW.items.forEach((it,i)=>(it.photos||[]).forEach(p=>{","const ph=AW.photos.map(p=>{ const t=p.at?new Date(p.at):null; return {d:p.d,cap:'Job photo'+(t?'  ·  '+t.toLocaleDateString('en-GB')+' '+t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'')}; }); AW.items.forEach((it,i)=>(it.photos||[]).forEach(p=>{")
rep("doc.text('No items',M+2.5,y+5); y+=8; }","doc.text(v('aw-desc')?'As described above. No sizes given; to be measured or agreed.':'No items',M+2.5,y+5); y+=8; }")
rep("'aw-status',()=>AW.items.length>0);","'aw-status',()=>AW.items.length>0||!!$('aw-desc').value.trim()||AW.photos.length>0);")
rep("$('aw-share2').addEventListener('click',async()=>{ if(!AW.items.length){ toast('Add an item first'); return; }","$('aw-share2').addEventListener('click',async()=>{ if(!AW.items.length&&!$('aw-desc').value.trim()&&!AW.photos.length){ toast('Say what was done first'); return; }")
# the sizes box feeds the email summary too (items already cover it); nothing to change there
CSS.append('''.aw-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:2px solid var(--ink);border-left:8px solid var(--hivis);border-radius:var(--r);background:var(--field);padding:8px 12px;margin:0 0 12px}
.aw-head b{font-family:"Barlow Condensed",sans-serif;font-size:19px;text-transform:uppercase}
.aw-head span{font-size:13px;color:var(--ink-2);flex:1 1 auto}
.aw-headbtn{appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);padding:6px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
textarea.aw-big{min-height:150px;font-size:18px}
#aw-sizes{min-height:96px;font-size:17px}
.aw-opt{font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-2);font-size:12px}
.aw-sizesout{border:2px solid var(--ink);border-radius:var(--r);background:#fff;padding:6px 12px;margin:-4px 0 14px;font-size:15px}
.aw-sizesout>div{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--line)}
.aw-sizesout>div:last-of-type{border:0}
.aw-sizesout b{font-family:"Barlow Condensed",sans-serif;font-size:19px;white-space:nowrap}
.aw-moresum{font-weight:800;padding:12px 0;cursor:pointer;font-size:17px}
.aw-moresum small{display:block;font-weight:500;font-size:13px;color:var(--ink-2)}
#aw-more{border-top:2px solid var(--line);border-bottom:2px solid var(--line);margin:4px 0 14px}
.aw-item.auto{border-left-color:var(--line)}''')
