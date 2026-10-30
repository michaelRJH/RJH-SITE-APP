# ===== v67: Office view =====
rep('''    <h2>Sending to the office</h2>''','''    <h2>Office</h2>
    <div class="grid"><button class="tile rec" data-go="panel-office"><b>Office</b><span>Every site's sheets, to price, status</span></button></div>
    <h2>Sending to the office</h2>''')
rep('  <!-- TRIAL HOLES -->',open('office.html',encoding='utf-8').read()+'  <!-- TRIAL HOLES -->')
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('office.js',encoding='utf-8').read()+a)
CSS.append('''.of-bar{margin:0 0 10px}
.of-sel{width:100%;border:0;background:transparent;font:inherit;font-weight:600;padding:0 8px}
.of-row{border:2px solid var(--ink);border-left:8px solid var(--line);border-radius:var(--r);background:var(--field);padding:10px 12px;margin:0 0 10px}
.of-row.old{border-left-color:var(--hivis)}
.of-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.of-top b{display:block;font-size:16px}.of-top small{display:block;font-size:12px;color:var(--ink-2);margin-top:2px}
.of-btns{display:flex;gap:6px;flex-shrink:0}.of-btns .btn{margin:0;width:auto;padding:8px 12px;font-size:13px;text-decoration:none;display:inline-block}
.of-status{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:8px}
.of-status button{appearance:none;border:2px solid var(--line);background:#fff;border-radius:var(--r);padding:8px 2px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.of-status button[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:#fff}
.of-status button[data-s="Priced"][aria-pressed=true],.of-status button[data-s="On valuation"][aria-pressed=true]{background:#1E6F3F;border-color:#1E6F3F}
.of-notes{margin:6px 0 0}''')
