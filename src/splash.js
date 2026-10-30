  // ---- a lad with a thumbs up when the app opens, just for fun. Once per open, tap to close ----
  (function(){ const el=$('splash'); if(!el) return; if(sessionStorage.getItem('rjh-splash')) return; try{ sessionStorage.setItem('rjh-splash','1'); }catch(e){}
    const lines=['Now then, lad!','Nice one!','Get it done!','Reyt good that','Kettle on?','Mint, that','Champion!','Dig in!'];
    $('sp-bubble').textContent=lines[Math.floor(Math.random()*lines.length)];
    el.hidden=false; let gone=false; const go=()=>{ if(gone) return; gone=true; el.classList.add('out'); setTimeout(()=>{ el.hidden=true; },320); };
    el.addEventListener('click',go); el.addEventListener('touchstart',go,{passive:true}); setTimeout(go,2200); })();
