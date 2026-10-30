# ===== v70: the screens. Home built round your job; every sheet has the same strip at the top and the same Done at the bottom =====
import re as _re
# ---- home ----
h0=t.index('  <section id="panel-home" class="home">'); h1=t.index('  <!-- TYPE 1 -->')
home=t[h0:h1]
def cut(a,b):
    i=home.index(a); j=home.index(b,i)+len(b); return home[i:j]
upd=cut('<div class="fd-side" id="home-update"','</div>'); nud=cut('<div class="fd-side" id="home-nudge"','</div>')
sitebox=cut('<details class="sitebox" id="sitebox">','</details>'); rates=cut('<details class="sitebox" id="ratesbox">','</details>')
inst=cut('<div class="fd-side" id="home-install"','</div>')
sitebox=sitebox.replace('<summary><span>This site</span><b id="site-summary">not set</b></summary>','<summary><span>One-off site, not a job on the list</span><b id="site-summary">not set</b></summary>')
sitebox=sitebox.replace('<div class="btnrow" style="margin-top:0"><button class="btn" type="button" id="site-pickbtn">Pick the job from SharePoint</button></div>\n','')
sitebox=sitebox.replace('<p class="note">Set once and every new sheet starts with these filled in. Picking the job from SharePoint means every sheet files itself in that job folder.</p>','<p class="note">Only for a one-off away from our jobs. Sheets for a site typed here wait in the office\'s Unfiled list until they are put under a job.</p><button class="btn" type="button" id="site-pickbtn" hidden></button>')
rates=rates.replace('<summary><span>Densities, loads and waste</span>','<summary><span>Densities and waste</span>')
rates=rates.replace("Change a rate here or in any tool's Adjust box and every tool follows.","Change a density here or in any tool's Adjust box and every tool follows.")
newhome='''  <section id="panel-home" class="home">
    '''+upd+'''
    '''+nud+'''
    <div class="jobcard">
      <div id="job-box"></div>
      <div class="fd-side" id="home-sync"><span>Checking…</span></div>
      <div id="home-today" hidden></div>
    </div>
    <div id="site-pick" class="fd-side" hidden></div>
    <div id="home-carry" hidden></div>
    <div id="home-from" hidden></div>
    <h2>Sheets</h2>
    <div class="grid">
      <button class="tile rec" data-go="panel-dw"><b>Dayworks</b><span>Men and machines by the hour, signed</span></button>
      <button class="tile rec" data-go="panel-aw"><b>Extras</b><span>What we did and how big, with photos</span></button>
      <button class="tile rec" data-go="panel-mh"><b>Manhole card</b><span>Pipes on a clock, levels, photos</span></button>
      <button class="tile rec" data-go="panel-rm"><b>Remedials</b><span>Their snag list, before and after</span></button>
      <button class="tile rec" data-go="panel-fd"><b>Foundations</b><span>Plot record: levels, concrete</span></button>
      <button class="tile rec" data-go="panel-th"><b>Trial holes</b><span>Log with sketch</span></button>
      <button class="tile rec" data-go="panel-grad"><b>Gradient sheet</b><span>Pipe laser sheet</span></button>
      <button class="tile rec" data-go="panel-level"><b>Level book</b><span>Collimation and reduced levels</span></button>
    </div>
    <h2>Quantities</h2>
    <div class="grid">
      <button class="tile" data-go="panel-tarmac"><b>Tarmac</b><span>Tonnes from area and depth</span></button>
      <button class="tile" data-go="panel-bedding"><b>Pipe bedding</b><span>Tonnes by pipe size</span></button>
      <button class="tile" data-go="panel-type1"><b>Type 1</b><span>Sub-base tonnes and loads</span></button>
      <button class="tile" data-go="panel-conc"><b>Concrete</b><span>m³ for slabs, trenches, pads</span></button>
      <button class="tile" data-go="panel-kerb"><b>Kerb race</b><span>Race, haunch and kerbs</span></button>
      <button class="tile" data-go="panel-to"><b>Take-off</b><span>Orders, tonnes, loads</span></button>
    </div>
    <h2>Setting out</h2>
    <div class="grid">
      <button class="tile" data-go="panel-fall"><b>Fall</b><span>Levels, distance, gradient</span></button>
      <button class="tile" data-go="panel-radius"><b>Radius kerb</b><span>Offsets to set a curve</span></button>
      <button class="tile" data-go="panel-dips"><b>Road dips</b><span>Kerb build-up, layers, travellers</span></button>
    </div>
    <div data-office hidden>
      <h2>Office</h2>
      <div class="grid"><button class="tile rec" data-go="panel-office"><b>Office</b><span>Every job's sheets, where they are up to</span></button><button class="tile rec" data-go="panel-jobsetup"><b>Job set-up</b><span>People, plots, manholes, drawings, notice</span></button></div>
    </div>
    <details class="sitebox homemore" id="home-more"><summary><span>More</span><b>my sheets, backup, help</b></summary>
      <h3>My sheets</h3>
      <button class="btn" type="button" id="home-saved">Show every sheet on this phone</button>
      <div class="savelist" id="home-savelist" hidden></div>
      <h3>Backup</h3>
      <div class="btnrow"><button class="btn" type="button" id="home-backup">Back up everything to a file</button><label class="btn filebtn">Load a backup or a sheet<input type="file" id="home-restore" accept=".json,application/json"></label></div>
      <p class="note" id="home-backupnote">Never backed up.</p>
      <p class="note">Signed in, every sheet already goes to the office. A backup file is for a phone that is not signed in.</p>
      '''+sitebox+'''
      '''+rates+'''
      <h3>Help</h3>
      <div class="btnrow"><button class="btn" type="button" id="home-feedback">Something wrong or missing? Tell Michael</button><button class="btn" type="button" id="home-checkupd">Check for updates</button></div>
      <h3>This phone</h3>
      <div class="btnrow"><button class="btn" type="button" id="home-signout">Sign out</button><button class="btn" type="button" id="home-clear">Clear this phone</button></div>
      <p class="note">Clear this phone takes every sheet, job and the sign-in off it. Use it before handing the phone to someone else. It will not run while sheets are still waiting to go.</p>
    </details>
    '''+inst+'''
  </section>

'''
t=t[:h0]+newhome+t[h1:]
# ---- the job card: your job, your name, change job, one-off ----
# ---- one strip at the top of every sheet: job, date, name. Tap it to change them ----
STRIP={'dw':['dw-site','dw-client','dw-date','dw-by'],'rm':['rm-site','rm-client','rm-by'],'th':['th-site','th-date','th-by'],'mh':['mh-site','mh-client','mh-by','mh-date'],
       'fd':['fd-dev','fd-site','fd-by','fd-date'],'grad':['g-site','g-client','g-by','g-date'],'lv':['lv-site','lv-by','lv-date'],'takeoff':['to-site','to-client','to-by','to-date'],'dips':['d-site','d-client','d-by','d-date']}
a="  if('serviceWorker' in navigator){"; assert t.count(a)==1
t=t.replace(a,'  const STRIP='+__import__('json').dumps(STRIP)+';\n'+open('screens70.js',encoding='utf-8').read()+a)
# ---- words: the lad's words, not the office's ----
rep('<details><summary>Adjust rates</summary>','<details><summary>Adjust densities</summary>',2)
rep('placeholder="paver rate"','placeholder="loads an hour"')
rep("row('Office copy','everything: workings, delivery plan, photos, prices','office'); }","row('Office copy','everything: workings, delivery plan, photos','office'); }")
rep('<title>RJH Site Calculator</title>','<title>RJH Site</title>')
# dayworks: a Where box (plot or road), the same "if they can't sign" choices as extras, and Same gang at the top of the labour
rep('<label for="dw-inst">Instructed by</label>','<label for="dw-inst">Who asked for it</label>')
rep('''<label for="dw-by">RJH foreman</label>''','''<label for="dw-by">Our foreman</label>''')
exec(open('r70b.py',encoding='utf-8').read())
CSS.append('''.jobcard{border:2px solid var(--ink);border-left:8px solid var(--hivis);border-radius:var(--r);background:var(--field);padding:12px;margin:0 0 12px}
.jobcard #job-box,.jobcard #home-sync{border:0;padding:0;margin:0 0 8px;background:none}
.jobcard #home-sync{border-top:1px solid var(--line);padding-top:8px}
.job-now b{font-size:28px}
.job-hint{margin:4px 0 0}
.homemore{margin-top:18px}.homemore h3{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2);margin:14px 0 6px}
.homemore .sitebox{margin-top:10px}
.jobstrip{border:2px solid var(--line);border-radius:var(--r);background:#fff;margin:0 0 12px;padding:0 10px}
.jobstrip>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;cursor:pointer;font-size:14px}
.jobstrip>summary::-webkit-details-marker{display:none}
.jobstrip .js-ch{font-size:13px;font-weight:700;text-decoration:underline;color:var(--ink-2);flex-shrink:0}
.jobstrip.nojob{border-color:var(--hivis)}.jobstrip .js-line em{color:#8a5a00;font-style:normal;font-weight:700}
.jobstrip[open]>summary{border-bottom:1px solid var(--line);margin-bottom:8px}
.donebar{margin:16px 0 8px}.donebar .done{width:100%;font-size:19px;padding:16px;margin:0 0 8px}
.donebar .clientcopy{width:100%;margin:0 0 8px}
.pdfmore>summary{font-size:14px;font-weight:700;color:var(--ink-2);padding:8px 0;cursor:pointer}
.s-state.flash{animation:flash70 1.6s}@keyframes flash70{0%,40%{background:var(--hivis)}100%{background:transparent}}
.links{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:-4px 0 12px;font-size:14px}
.links .lk-h{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-2)}
.links .lk{display:inline-flex;align-items:center;gap:4px;border:2px solid var(--ink);border-radius:99px;padding:2px 4px 2px 10px;font-weight:700;background:#fff}
.links .lk button{appearance:none;border:0;background:none;font-size:16px;cursor:pointer;padding:0 4px}
.links .lk-none{color:var(--ink-2)}
.links .lk-add{appearance:none;border:0;background:none;font:inherit;font-size:13px;font-weight:700;text-decoration:underline;cursor:pointer;color:var(--ink-2)}
.links .lk-pick{flex-basis:100%}''')
