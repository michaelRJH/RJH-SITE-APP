# ===== v68: jobs and the site pack =====
rep('''      <div id="site-pick" class="fd-side" hidden></div>\n''','''''')
rep('''    <details class="sitebox" id="sitebox">''','''    <div class="fd-side" id="job-box" style="border-left-color:var(--hivis)"></div>
    <div id="site-pick" class="fd-side" hidden></div>
    <details class="sitebox" id="sitebox">''')
rep('''    <div class="grid"><button class="tile rec" data-go="panel-office"><b>Office</b><span>Every site's sheets, to price, status</span></button></div>''',
    '''    <div class="grid"><button class="tile rec" data-go="panel-office"><b>Office</b><span>Every site's sheets, to price, status</span></button><button class="tile rec" data-go="panel-jobsetup"><b>Job set-up</b><span>People, plots, manholes, runs, notice</span></button></div>''')
rep('  <!-- TRIAL HOLES -->',open('jobs.html',encoding='utf-8').read()+'  <!-- TRIAL HOLES -->')
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1; t=t.replace(a,open('jobs.js',encoding='utf-8').read()+a)
CSS.append('''#job-box{margin:0 0 10px}
.job-now small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2)}
.job-now b{display:block;font-family:"Barlow Condensed",sans-serif;font-size:26px;line-height:1.1}
.job-now span{display:block;font-size:14px;color:var(--ink-2)}
.job-notice{margin-top:6px;padding:8px 10px;background:#fff;border:2px solid var(--ink);border-radius:var(--r);font-size:15px;font-weight:600}
.pick small{display:block;font-weight:500;font-size:12px;color:var(--ink-2)}
input.locked{background:#eee;color:var(--ink-2)}
.seg.two{grid-template-columns:1fr 1fr}
.job-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:8px}.job-row .btn{margin:0;width:auto;padding:10px 14px}.job-row .in input{font-size:16px}''')
