# ===== v78: the new Foundation record, with design levels from the job =====
rep('  <!-- MANHOLE -->',open('fr.html',encoding='utf-8').read()+'  <!-- MANHOLE -->')
a="  const STRIP="; assert t.count(a)==1; t=t.replace(a,open('fr.js',encoding='utf-8').read()+a)
rep("const TOOL_OF_PREFIX={g:'grad',dw:'dw',aw:'aw',rm:'rm',th:'th',d:'dips',fd:'fd',to:'takeoff',mh:'mh',lv:'lv'};","const TOOL_OF_PREFIX={g:'grad',dw:'dw',aw:'aw',rm:'rm',th:'th',d:'dips',fd:'fd',fr:'fr',to:'takeoff',mh:'mh',lv:'lv'};")
rep("const TOOLNAMES={rm:'Remedials',aw:'Extras',","const TOOLNAMES={rm:'Remedials',aw:'Extras',fr:'Foundation record',")
rep("fd:'Foundation record. Check against the drawings.',","fd:'Foundation record. Check against the drawings.',fr:'Foundation record. Levels against the engineer\\'s schedule.',")
rep("fd:{site:'fd-site',client:'fd-dev',by:'fd-by'},","fd:{site:'fd-site',client:'fd-dev',by:'fd-by'},fr:{site:'fr-site',client:'fr-client',by:'fr-by'},")
# home: the new sheet takes the tile; the drawing tool moves under More
rep('''      <button class="tile rec" data-go="panel-fd"><b>Foundations</b><span>Plot record: levels, concrete</span></button>''','''      <button class="tile rec" data-go="panel-fr"><b>Foundations</b><span>Plot record: dug, poured, signed</span></button>''')
rep('''      <h3>Help</h3>''','''      <h3>Office tools</h3>
      <div class="grid"><button class="tile" data-go="panel-fd"><b>Footing drawing tool</b><span>Draw a footing from the drawing</span></button></div>
      <h3>Help</h3>''')
CSS.append('''.fr-info{border:2px solid var(--ink);border-left:8px solid #1E6F3F;border-radius:var(--r);background:#fff;padding:8px 12px;margin:0 0 12px}.fr-info b{display:block}.fr-info span{font-size:13px;color:var(--ink-2)}
.fr-note{margin:0 0 8px}
.fr-corners{margin:0 0 8px}.fr-row{display:grid;grid-template-columns:52px 1.2fr 1fr 28px;gap:6px;align-items:start;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.fr-row.fr-head span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2)}
.fr-row .in input{font-size:17px;padding:10px 6px}.fr-k input{text-align:center;font-weight:800}
.fr-row input[readonly]{background:#eee;color:var(--ink-2)}
.fr-des{position:relative}.fr-chg{appearance:none;border:0;background:none;font:inherit;font-size:12px;font-weight:700;text-decoration:underline;color:var(--ink-2);padding:2px 0;cursor:pointer}
.fr-was{display:block;font-size:11px;color:#B3261E;line-height:1.2}
.fr-out{grid-column:1 / -1;font-size:14px;font-weight:700;min-height:0}.fr-out:empty{display:none}
.fr-out[data-k=ok]{color:#1E6F3F}.fr-out[data-k=deep]{color:#8a5a00}.fr-out[data-k=high]{color:#B3261E}
.fr-x{appearance:none;border:0;background:none;font-size:20px;color:var(--ink-2);cursor:pointer;padding:10px 0}
.fr-diff{font-weight:800;padding:8px 12px;border-radius:var(--r);margin:0 0 12px;background:#E7F2EA;color:#1E6F3F}.fr-diff[data-k=deep]{background:#FFF4D6;color:#8a5a00}.fr-diff[data-k=high]{background:#FBE9E7;color:#B3261E}
.fr-sub{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2);margin:4px 0}
.mhchip.cur{outline:3px solid var(--hivis)}''')
