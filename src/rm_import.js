  // ---- Remedials: load the client's list straight from a spreadsheet (xlsx or csv, e.g. a Field View export) ----
  async function rmUnzip(buf){ // tiny zip reader: enough for an xlsx (deflate or stored)
    const dv=new DataView(buf), u8=new Uint8Array(buf); const out={}; let i=buf.byteLength-22;
    while(i>0&&dv.getUint32(i,true)!==0x06054b50) i--; if(i<=0) throw new Error('not a zip'); const n=dv.getUint16(i+10,true); let p=dv.getUint32(i+16,true);
    for(let k=0;k<n;k++){ if(dv.getUint32(p,true)!==0x02014b50) break; const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), off=dv.getUint32(p+42,true);
      const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl)); p+=46+nl+el+cl;
      const lnl=dv.getUint16(off+26,true), lel=dv.getUint16(off+28,true); const data=u8.subarray(off+30+lnl+lel,off+30+lnl+lel+csize);
      if(/\.xml$/.test(name)){ if(method===0) out[name]=new TextDecoder().decode(data); else if(method===8){ const ds=new DecompressionStream('deflate-raw'); const w=ds.writable.getWriter(); w.write(data); w.close(); out[name]=await new Response(ds.readable).text(); } } }
    return out; }
  const rmXml=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
  function rmXlsxRows(files){ const ss=[]; const sx=files['xl/sharedStrings.xml']||''; sx.replace(/<si>([\s\S]*?)<\/si>/g,(m,b)=>{ ss.push(rmXml((b.match(/<t[^>]*>([\s\S]*?)<\/t>/g)||[]).map(t=>t.replace(/<[^>]+>/g,'')).join(''))); return ''; });
    const sheet=files['xl/worksheets/sheet1.xml']||Object.keys(files).filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort().map(k=>files[k])[0]||''; const rows=[];
    sheet.replace(/<row[^>]*>([\s\S]*?)<\/row>/g,(m,b)=>{ const r=[]; b.replace(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,(mm,col,attrs,inner)=>{ let ci=0; for(const ch of col) ci=ci*26+(ch.charCodeAt(0)-64); const t=(attrs.match(/t="(\w+)"/)||[])[1]; let v='';
        if(inner){ if(t==='s'){ v=ss[+((inner.match(/<v>(.*?)<\/v>/)||[])[1]||0)]||''; } else if(t==='inlineStr'){ v=rmXml((inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[])[1]||''); } else v=rmXml((inner.match(/<v>(.*?)<\/v>/)||[])[1]||''); }
        r[ci-1]=String(v).trim(); return ''; }); rows.push(r); return ''; });
    return rows; }
  function rmCsvRows(txt){ const rows=[]; let r=[],f='',q=false; txt=txt.replace(/^﻿/,'');
    for(let i=0;i<txt.length;i++){ const c=txt[i]; if(q){ if(c==='"'){ if(txt[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; } else if(c==='"') q=true; else if(c===','){ r.push(f.trim()); f=''; } else if(c==='\n'||c==='\r'){ if(c==='\r'&&txt[i+1]==='\n') i++; r.push(f.trim()); rows.push(r); r=[]; f=''; } else f+=c; }
    if(f||r.length){ r.push(f.trim()); rows.push(r); } return rows; }
  function rmPickCols(rows){ // find the header row and guess which column is which
    let hi=rows.findIndex(r=>r.filter(Boolean).length>=2&&r.some(c=>/ref|issue|desc|snag|defect|comment|location|mh|status/i.test(c))); if(hi<0) hi=0; const h=rows[hi].map(c=>(c||'').toLowerCase());
    const find=(...re)=>{ for(const x of re){ const k=h.findIndex(c=>x.test(c)); if(k>=0) return k; } return -1; };
    let said=find(/issue|description|defect|snag|comment|detail|problem/,/^desc/); let where=find(/^mh|manhole|location|plot|where|area|sheet/); let no=find(/^ref|reference|^no\.?$|^id$|number/); let st=find(/status/); let to=find(/issued to|assigned|contractor|responsib/);
    if(said<0){ // longest text column
      const len=h.map((_,k)=>rows.slice(hi+1).reduce((a,r)=>a+((r[k]||'').length),0)); said=len.indexOf(Math.max(...len)); }
    if(no===said) no=-1; if(where===said) where=-1; return {hi,said,where,no,st,to}; }
  function rmImportRows(rows,fileName){ const {hi,said,where,no,st,to}=rmPickCols(rows); const body=rows.slice(hi+1).filter(r=>(r[said]||'').trim());
    const closed=r=>st>=0&&/signed off|closed|complete|done|resolved/i.test(r[st]||''); const open=body.filter(r=>!closed(r)); const skipped=body.length-open.length;
    const toUs=r=>to<0||!(r[to]||'').trim()||/howard|rjh/i.test(r[to]||''); const ours=open.filter(toUs); const notOurs=open.length-ours.length;
    if(!ours.length){ toast(skipped?'Every item on that list is already signed off':'Could not find the snags in that file'); return; }
    const before=RM.items.length;
    ours.forEach((r,i)=>{ let n=(no>=0?r[no]:'')||String(before+i+1); n=n.replace(/^[A-Z]\d{5,}\./i,'').replace(/^T1\./i,''); RM.items.push({no:n,where:where>=0?(r[where]||''):'',said:r[said],st:'open',before:[],after:[]}); });
    if(!$('rm-ref').value.trim()) $('rm-ref').value=fileName.replace(/\.(xlsx|csv)$/i,'').replace(/^Copy of /i,'').replace(/_/g,' ').slice(0,60);
    if(notOurs){ const nt=$('rm-notes'); nt.value=(nt.value?nt.value+'\n':'')+`${notOurs} open item${notOurs>1?'s':''} on the list ${notOurs>1?'are':'is'} not issued to RJH, so not loaded.`; }
    RM.filter='open'; $('rm-filter').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f==='open')); rmRender();
    toast(`${ours.length} snags loaded`+(skipped?`, ${skipped} already signed off skipped`:'')); }
  $('rm-xlsx').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ let rows; if(/\.csv$/i.test(f.name)||/csv|text/.test(f.type)) rows=rmCsvRows(await f.text()); else { if(typeof DecompressionStream==='undefined') throw new Error('old'); rows=rmXlsxRows(await rmUnzip(await f.arrayBuffer())); }
      rmImportRows(rows,f.name); }
    catch(err){ toast(err.message==='old'?'This phone cannot read xlsx. Save the list as CSV and load that.':'Could not read that file. Save it as CSV and try again.'); } });
