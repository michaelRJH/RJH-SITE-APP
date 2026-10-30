# ===== v63: no prices anywhere in the site app (Take-off and orders) =====
rep('''      <div class="box"><small>Order value</small><b id="to-val">–</b></div>\n''','')
i=t.index('    <details id="to-pricewrap">'); j=t.index('</details>',i)+len('</details>\n'); t=t[:i]+t[j:]
rep("m.price=pf(TO.price[m.key],NaN); m.val=isNaN(m.price)?NaN:m.now*m.price; m.valAll=isNaN(m.price)?NaN:m.need*m.price;","")
rep("    const priced=list.filter(m=>!isNaN(m.price)); const value=priced.length?priced.reduce((s,m)=>s+m.val,0):NaN, valueAll=priced.length?priced.reduce((s,m)=>s+m.valAll,0):NaN;\n","")
rep("nowLoads,value,valueAll,","nowLoads,")
rep(" $('to-val').textContent=isNaN(M.value)?'–':money(M.value);","")
i=t.index("    const sig=M.list.map(m=>m.key).join('|'); if(sig!==toPriceSig"); j=t.index("pb.appendChild(g); } }",i)+len("pb.appendChild(g); } }"); t=t[:i]+'    }'+t[j:]
rep("{l:'Material',w:0.3},{l:'Needed',w:0.12,r:true},{l:'Ordered',w:0.12,r:true},{l:'This order',w:0.13,r:true},{l:'Left',w:0.11,r:true},{l:'Rate',w:0.1,r:true},{l:'Value',w:0.12,r:true}]",
    "{l:'Material',w:0.4},{l:'Needed',w:0.15,r:true},{l:'Ordered',w:0.15,r:true},{l:'This order',w:0.15,r:true},{l:'Left',w:0.15,r:true}]")
rep(",isNaN(m.price)?'–':money(m.price),isNaN(m.price)||!m.now?'–':money(m.val)]),{sub,head,bold:[0,3,6]});","]),{sub,head,bold:[0,3]});")
rep("{label:'This order',value:M.nowT?fmt1(M.nowT)+' t':'–',w:TOCW*0.25,bold:true,size:11},{label:'Loads',value:M.nowLoads?String(M.nowLoads):'–',w:TOCW*0.15,size:11},{label:'Whole take-off',value:M.allT?fmt1(M.allT)+' t':'–',w:TOCW*0.25,size:11},{label:'Order value',value:isNaN(M.value)?'no rates':money(M.value),w:TOCW*0.35,bold:true,size:11}]",
    "{label:'This order',value:M.nowT?fmt1(M.nowT)+' t':'–',w:TOCW*0.35,bold:true,size:11},{label:'Loads',value:M.nowLoads?String(M.nowLoads):'–',w:TOCW*0.3,size:11},{label:'Whole take-off',value:M.allT?fmt1(M.allT)+' t':'–',w:TOCW*0.35,size:11}]")
rep("price:clone(TO.price),","price:{},")
rep("TO.price=clone(d.price||{});","TO.price={};")
rep("TO.desc=m.desc; TO.price=m.price; }","TO.desc=m.desc; TO.price={}; }")
rep("TO.ls=m.ls; TO.price=m.price;","TO.ls=m.ls; TO.price={};")
rep("the office copy has the workings, photos and prices.","the office copy has the workings and photos. Prices are done in the office, not here.")
a=t[t.index("  const money=v=>"):]; a=a[:a.index('\n')+1]; rep(a,'')
exec(open('r63b.py',encoding='utf-8').read())
