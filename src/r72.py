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
