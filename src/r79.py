# ===== v79: the footing on screen, drainage back, inspection is a result not a signature =====
# the four-way result row and the seg of quick widths
CSS.append('''.seg.five{grid-template-columns:repeat(5,minmax(0,1fr))}.fr-wq button{font-size:15px;padding:10px 2px;min-height:44px}
.fr-planwrap{border:2px solid var(--ink);border-radius:var(--r);background:#fff;padding:6px;margin:0 0 6px;touch-action:manipulation}
.fr-planwrap svg{display:block;width:100%;height:auto;max-height:70vh;font-family:inherit}.fr-planwrap svg text{pointer-events:none;user-select:none}
.fr-planwrap .fr-cor,.fr-planwrap .fr-sidelab{cursor:pointer}
.fr-plantools .btn{font-size:14px;min-height:42px;padding:8px 10px}
.fr-sel{border:2px solid var(--ink);border-left:8px solid var(--hivis);border-radius:var(--r);background:#fffbea;padding:10px 12px;margin:8px 0 12px}
.fr-selh{display:flex;align-items:center;gap:10px;margin:0 0 8px}.fr-selh b{font-size:18px;flex:1}.fr-selh span{font-size:13px;color:var(--ink-2)}
.fr-close{appearance:none;border:2px solid var(--ink);border-radius:var(--r);background:var(--ink);color:#fff;font:inherit;font-weight:700;font-size:14px;padding:6px 14px;cursor:pointer;min-height:36px}
.fr-sel .fr-out{margin:0 0 8px}.fr-selbtns{margin:0}.fr-selbtns .btn{font-size:14px;min-height:42px;padding:8px 10px}
.fr-info span{display:block}
.fr-conc{font-size:14px;padding:8px 12px;border-radius:var(--r);margin:0 0 12px;background:#f1efe9;color:var(--ink)}.fr-conc[data-k=ok]{background:#E7F2EA;color:#1E6F3F}.fr-conc[data-k=deep]{background:#FFF4D6;color:#8a5a00}.fr-conc[data-k=high]{background:#FBE9E7;color:#B3261E}
.seg.seven{grid-template-columns:repeat(7,minmax(0,1fr))}.fr-score button{padding:10px 0;min-height:44px;font-size:15px}#fr-party button{font-size:13px;padding:10px 4px}
.fr-sel .in select{font:inherit;font-size:16px;padding:10px 8px;border:2px solid var(--line);border-radius:var(--r);background:#fff;width:100%;min-height:48px}
#fr-passed button{font-size:14px;padding:10px 4px}''')
