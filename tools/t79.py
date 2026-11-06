# v79 foundation record: the footing on screen, corners and widths, drainage, inspection result, filing, PDF
import asyncio, json, sys, subprocess, os
sys.path.insert(0, os.path.dirname(__file__))
from fakesp import FakeSP
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8769; U=f'http://localhost:{PORT}/index.html'
R={'pass':0,'fail':0}
def ok(c,m): R['pass' if c else 'fail']+=1; print(('PASS ' if c else 'FAIL ')+m)
async def wait_for(pg,js,t=8000):
    try: await pg.wait_for_function(js,timeout=t); return True
    except Exception: return False
async def chip(pg,r):
    if not await pg.is_visible(f'.mhchip[data-r="{r}"]'): await pg.click('#fr-joblist summary')
    await pg.click(f'.mhchip[data-r="{r}"]')
async def nosplash(pg): await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
async def main():
    srv=subprocess.Popen(['python3','-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); await asyncio.sleep(0.8)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(); sp=FakeSP(); sp.no_dl=True   # Graph sometimes leaves the download link out: the app must still read the job
            pack={'v':1,'client':'Strata Homes','job':'Expression','status':'live','notice':'','people':[],'manholes':[],'runs':[],'houseTypes':[{'ref':'CHST-AWP-XX-F1-D-S-7800-S3','rev':'P3','boxes':[{'k':'plan','house':'H3-2100','hand':'OP','plots':[1],'id':'b1','tpl':{'pts':[[1.0,1.0],[10.425,1.0],[10.425,7.61],[1.0,7.61]],'w':[600,750,600,750],'walls':[{'p':[[4.695,7.31],[4.695,1.3]],'w':600}],'bays':[{'side':2,'at':3.76,'w':0.6,'d':0.6,'fw':600,'label':'Nib'}],'q':[]}},{'k':'plan','house':'H4-1800','hand':'','plots':[7,8],'id':'b2','tpl':{'pts':[[0,0],[11.0,0],[11.0,8.0],[0,8.0]],'w':[600,600,600,600],'walls':[{'p':[[5.5,0.3],[5.5,7.7]],'w':1350}],'bays':[],'q':[],'units':2,'pw':[{'axis':'v','at':5.5,'w':1350}],'grp':[[7,8]]}}]}],
              'plots':[{'plot':'7','type':'H4-1800','hand':'','design':{'found':'Strip','toc':100.0,'under':{'A':99.4,'B':99.4,'C':99.4,'D':99.4}}},{'plot':'8','type':'H4-1800','hand':'','design':{'found':'Strip','toc':100.0,'under':{'A':99.4,'B':99.4,'C':99.4,'D':99.4}}},{'plot':'1','type':'H3-2100','hand':'OP','design':{'found':'Eng Strip','ffl':102.25,'toc':101.5,'depth':'1.100','under':{'A':101.0,'B':101.0,'C':101.0,'D':101.0},'gl':{},'strata':'Eng Fill','borehole':'RBH01','suitable':101.1}},
                       {'plot':'42','type':'H4-1700','hand':'','design':{'found':'Trench','ffl':95.0,'toc':94.2,'depth':'1.200','under':{'B':93.6,'D':93.6},'gl':{},'strata':'Clay','borehole':'WS12','suitable':93.8}},
                       {'plot':'4G','type':'Single Garage','hand':'AS','garage':True,'design':{'found':'Eng Strip','ffl':101.275,'toc':100.525,'depth':'1.200','under':{'A':100.075,'B':100.075,'C':100.075,'D':100.075},'gl':{},'strata':'Eng Fill','borehole':'RBH01','suitable':100.6}}]}
            sp.put('Strata Homes/Expression/_app/job.json',json.dumps(pack).encode())
            ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True); await sp.install(ctx); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept('soft spot, deepen 300, J Smith AWP') if d.type=='prompt' else d.accept()))
            await pg.goto(U); await pg.wait_for_timeout(700); await nosplash(pg); await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200); await nosplash(pg)
            await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(1200); await pg.fill('#job-by','Kyle')
            ok(await pg.is_visible('[data-go="panel-fr"]') and not await pg.is_visible('[data-go="panel-fd"]'), 'home tile is the new record; drawing tool under More')
            await pg.evaluate("()=>go('panel-home')"); await pg.click('[data-go="panel-fr"]'); await pg.wait_for_timeout(400)
            ok(await pg.is_visible('#fr-joblist') and '0 of 5' in await pg.text_content('#fr-joblist'), 'plots on this job listed: '+(await pg.text_content('#fr-joblist'))[:60])
            await pg.click('.mhchip[data-r="1"]'); await pg.wait_for_timeout(400)
            ok((await pg.input_value('#fr-plot'))=='1' and (await pg.input_value('#fr-type'))=='H3-2100 OP' and (await pg.input_value('#fr-tocd'))=='101.500', 'plot 1: house type and design top of concrete filled')
            ks=await pg.evaluate("()=>FR.corners.map(c=>c.k+':'+c.design)"); ok(ks==['A:101.000','B:101.000','C:101.000','D:101.000'], 'design underside at A to D: '+str(ks))
            ok('Eng Strip' in await pg.text_content('#fr-plotinfo') and 'RBH01' in await pg.text_content('#fr-plotinfo') and 'drawing 7800' in await pg.text_content('#fr-plotinfo'), 'plot info line names the drawing')
            # the footing on screen, from the drawing: four corners, widths off the drawing, a wall and a nib
            P=await pg.evaluate("()=>({src:FR.plan.src,w:FR.plan.w,n:FR.plan.pts.length,walls:FR.plan.walls.length,bays:FR.plan.bays.length})")
            ok(P['src']=='tpl' and P['w']==[600,750,600,750] and P['n']==4 and P['walls']==1 and P['bays']==1, 'footing drawn from the drawing: '+json.dumps(P))
            ok(await pg.evaluate("()=>document.querySelectorAll('#fr-plan .fr-cor').length===4&&document.querySelectorAll('#fr-plan g[data-s] rect').length===4"), 'plan shows 4 corners and 4 side widths')
            ok(await pg.is_hidden('#fr-rectwrap') and await pg.is_visible('#fr-flip'), 'no rectangle boxes for a drawn footing; flip offered')
            # tap corner B: put the dug level in there
            await pg.click('#fr-plan .fr-cor[data-c="1"] circle:nth-of-type(2)'); await pg.wait_for_timeout(200)
            ok(await pg.is_visible('#fr-sel') and 'Corner B' in await pg.text_content('#fr-sel'), 'tapping B opens its box')
            await pg.fill('#fr-seldug','100.900'); await pg.dispatch_event('#fr-seldug','input'); await pg.wait_for_timeout(100)
            ok((await pg.text_content('#fr-sel .fr-out'))=='100 mm deeper than design', 'difference shown in the corner box')
            ok(await pg.evaluate("()=>FR.corners[1].dug==='100.900'&&document.querySelector('#fr-plan .fr-cor[data-c=\"1\"] circle:nth-of-type(2)').getAttribute('fill')==='#8a5a00'"), 'corner B amber on the plan with the level beside it')
            # A on level, C higher, via the list
            if not await pg.is_visible('#fr-addcorner'): await pg.click('#fr-cornerfold summary')
            rows=await pg.query_selector_all('#fr-corners .fc-row:not(.fc-head)')
            async def dug(i,v):
                ins=await rows[i].query_selector_all('input'); await ins[2].fill(v); await ins[2].dispatch_event('input')
            await dug(0,'101.010'); await dug(2,'101.050')
            outs=await pg.eval_on_selector_all('#fr-corners .fr-out','e=>e.map(x=>x.firstChild.textContent)')
            ok(outs[0].startswith('On level') and outs[1]=='100 mm deeper than design' and outs[2]=='50 mm higher than design', 'differences worked out: '+str(outs))
            # change the design on site at C, from the corner box
            await pg.click('#fr-plan .fr-cor[data-c="2"] circle:nth-of-type(2)'); await pg.wait_for_timeout(200); await pg.click('#fr-selchg'); await pg.wait_for_timeout(300)
            c=await pg.evaluate("()=>FR.corners[2]"); ok(c['from']=='101.000' and 'J Smith' in c['why'], 'design change recorded with why and who: '+json.dumps(c))
            ok(not await pg.get_attribute('#fr-seldes','readonly'), 'design box unlocked after Change')
            await pg.fill('#fr-seldes','100.700'); await pg.dispatch_event('#fr-seldes','input')
            # tap the side B to C: dug it wider
            await pg.click('#fr-plan .fr-sidelab[data-s="1"] rect'); await pg.wait_for_timeout(200)
            ok('Side B to C' in await pg.text_content('#fr-sel') and (await pg.input_value('#fr-selw'))=='750', 'side B to C opens at 750')
            await pg.click('#fr-sel .fr-wq [data-w="900"]'); await pg.wait_for_timeout(150)
            ok(await pg.evaluate("()=>FR.plan.w[1]===900&&FR.plan.w0[1]===750"), 'width changed to 900, design 750 kept')
            ok('design 750' in await pg.text_content('#fr-sel') and await pg.evaluate("()=>document.querySelector('#fr-plan .fr-sidelab[data-s=\"1\"] text').getAttribute('fill')==='#B3261E'"), 'changed width shown red with the design width')
            # the side's length: corner C and everything past it move
            await pg.fill('#fr-sell','7.0'); await pg.dispatch_event('#fr-sell','change'); await pg.wait_for_timeout(150)
            pts=await pg.evaluate("()=>FR.plan.pts.map(p=>[p.x,p.y])"); ok(abs(pts[2][1]-pts[1][1]-7.0)<0.01 and abs(pts[3][1]-pts[0][1]-7.0)<0.01 and pts[0]==[1.0,1.0], 'side B to C now 7.0 m, D moved with C, A stayed: '+str(pts))
            await pg.fill('#fr-sell','6.61'); await pg.dispatch_event('#fr-sell','change'); await pg.wait_for_timeout(100)
            # a point on side D to A
            await pg.click('#fr-plan .fr-sidelab[data-s="3"] rect'); await pg.wait_for_timeout(200); await pg.click('#fr-seladd'); await pg.wait_for_timeout(200)
            ks=await pg.evaluate("()=>FR.corners.map(c=>c.k)"); ok(ks==['A','B','C','D','E'] and await pg.evaluate("()=>FR.plan.pts.length===5&&FR.plan.w.length===5"), 'point E added on the side, plan and list in step: '+str(ks))
            ok('Corner E' in await pg.text_content('#fr-sel'), 'the new point is open for its level')
            await pg.click('#fr-selrm'); await pg.wait_for_timeout(150); ks=await pg.evaluate("()=>FR.corners.map(c=>c.k)"); ok(ks==['A','B','C','D'], 'and taken off again')
            # flip
            x0=await pg.evaluate("()=>FR.plan.pts[0].x"); await pg.click('#fr-flip'); x1=await pg.evaluate("()=>FR.plan.pts[0].x"); ok(x0!=x1 and await pg.evaluate("()=>FR.plan.flip"), 'flipped to the other hand'); await pg.click('#fr-flip')
            await pg.fill('#fr-toc','94.9'); await pg.fill('#fr-tocd','101.500'); await pg.fill('#fr-toc','101.520'); await pg.wait_for_timeout(100)
            ok('On level' in await pg.text_content('#fr-tocout'), 'top of concrete difference shown')
            # expected concrete from the footing, against what came
            txt=await pg.text_content('#fr-concout'); ok(await pg.is_visible('#fr-concout') and 'Expected about' in txt and 'as dug' in txt, 'expected concrete shown: '+txt[:90])
            exp=await pg.evaluate("()=>{ const m=document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/); return +m[1]; }")
            chk=await pg.evaluate("()=>{ const P=FR.plan,n=P.pts.length; const dd=i=>101.52-(+FR.corners[i].design+ +FR.corners[(i+1)%n].design)/2; const d=dd(0); let v=0; for(let i=0;i<n;i++){ const a=P.pts[i],b=P.pts[(i+1)%n]; const d=dd(i); v+=Math.hypot(b.x-a.x,b.y-a.y)*P.w[i]/1000*d; const wp=P.w[(i-1+n)%n]; v-=Math.min(P.w[i],wp)*wp/1e6*d; } P.walls.forEach(w=>{ v+=Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y)*w.w/1000*d; }); P.bays.forEach(y=>{ v+=y.w*y.d*d; }); return v; }")
            ok(abs(exp-chk)<0.3 and 8<exp<16, f'expected volume is the footing length x width x depth: {exp} vs {chk:.2f}')
            await pg.fill('#fr-m3',str(round(exp*1.3,1))); await pg.dispatch_event('#fr-m3','input'); txt=await pg.text_content('#fr-concout'); ok('more' in txt and (await pg.get_attribute('#fr-concout','data-k'))=='deep', 'well over: flagged: '+txt[-80:])
            await pg.fill('#fr-m3','4.2'); await pg.dispatch_event('#fr-m3','input')
            # internal legs count: take the drawn leg off and the volume drops by its length x width x depth
            await pg.click('#fr-plan [data-w="0"] rect'); await pg.wait_for_timeout(200); ok('Internal leg 1' in await pg.text_content('#fr-sel'), 'tapping the internal leg opens its box')
            await pg.click('#fr-sel .fr-wq [data-w="900"]'); ok(await pg.evaluate("()=>FR.plan.walls[0].w===900&&FR.plan.walls[0].w0===600"), 'leg width changed to 900, design 600 kept')
            e1=await pg.evaluate("()=>+document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/)[1]"); await pg.click('#fr-selrm'); await pg.wait_for_timeout(150)
            e2=await pg.evaluate("()=>+document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/)[1]"); ok(e1-e2>2.0 and await pg.evaluate("()=>FR.plan.walls.length===0"), f'the leg was in the volume: {e1} with, {e2} without')
            await pg.click('#fr-addwall'); await pg.wait_for_timeout(200); ok(await pg.evaluate("()=>FR.plan.walls.length===1&&FR.plan.walls[0].added") and 'Internal leg 1' in await pg.text_content('#fr-sel'), 'internal leg added on site')
            await pg.select_option('#fr-wa','0'); await pg.select_option('#fr-wb','2'); ok(await pg.evaluate("()=>{ const w=FR.plan.walls[0]; return w.a.x===FR.plan.pts[0].x&&w.b.y===FR.plan.pts[2].y; }"), 'leg runs between the corners picked')
            # outside-of-dig length: centre line plus half a width each end on a convex corner
            await pg.click('#fr-plan .fr-sidelab[data-s="0"] rect'); await pg.wait_for_timeout(200)
            lo=float(await pg.input_value('#fr-sello')); lc=float(await pg.input_value('#fr-sell')); ok(abs(lo-(lc+0.9/2+0.75/2))<0.02, f'outside of dig {lo} = centre line {lc} + half of 900 + half of 750')
            await pg.fill('#fr-sello',str(round(lo+0.5,2))); await pg.dispatch_event('#fr-sello','change'); await pg.wait_for_timeout(150); ok(abs(float(await pg.input_value('#fr-sell'))-(lc+0.5))<0.02, 'typing the outside length moves the centre line the same amount')
            await pg.fill('#fr-sell',str(lc)); await pg.dispatch_event('#fr-sell','change'); await pg.wait_for_timeout(100)
            ok('Split this side' in await pg.text_content('#fr-seladd'), 'split button says what it is for')
            # two pours
            await pg.click('#fr-p1fold summary'); await pg.fill('#fr-p1m3','3.0'); await pg.dispatch_event('#fr-p1m3','input'); await pg.fill('#fr-p1date','2026-11-03'); await pg.fill('#fr-p1mix','GEN1')
            txt=await pg.text_content('#fr-concout'); ok('3.0 + 4.2 = 7.2' in txt, 'delivered is both pours together: '+txt[-120:])
            # NHBC scores
            await pg.click('#fr-score [data-v="4"]'); await pg.click('#fr-drscore [data-v="5"]'); ok(await pg.evaluate("()=>FR.score==='4'&&FR.drscore==='5'"), 'NHBC scores set')
            # drainage differs, as-built PDF on the back
            await pg.click('#fr-drain [data-d="differs"]'); ok(await pg.is_visible('#fr-drainwrap'), 'drainage: differs opens the attach boxes')
            await pg.fill('#fr-drainnotes','FW run moved 600 to clear the bay')
            pdfb=await pg.evaluate("()=>{ const d=new jspdf.jsPDF(); d.text('AS BUILT DRAINAGE',20,20); return Array.from(new Uint8Array(d.output('arraybuffer'))); }")
            await pg.set_input_files('#fr-drainpdf',{'name':'plot1_drainage.pdf','mimeType':'application/pdf','buffer':bytes(pdfb)}); await pg.wait_for_timeout(400)
            ok('plot1_drainage.pdf' in await pg.text_content('#fr-drainpdf-name') and await pg.evaluate("()=>!!FR.drainPdf"), 'as-built PDF attached')
            n1=await pg.evaluate("async()=>{ const b=await buildFrBlob(); const d=await PDFLib.PDFDocument.load(await b.arrayBuffer()); return d.getPageCount(); }"); n0=await pg.evaluate("()=>buildFr().getNumberOfPages()")
            ok(n1==n0+1, f'the attached PDF goes on the back: {n0} page(s) + 1')
            # inspection: a result, no inspector signature
            ok(not await pg.evaluate("()=>!!document.getElementById('fr-sig1')"), 'no inspector signature pad')
            await pg.fill('#fr-ground','Firm clay'); await pg.fill('#fr-mix','GEN1'); await pg.fill('#fr-m3','4.2'); await pg.fill('#fr-insp','D Jones'); await pg.click('#fr-passed [data-p="Passed on site"]')
            ok(await pg.evaluate("()=>FR.passed==='Passed on site'") and await pg.is_visible('#fr-inspwrap') and (await pg.input_value('#fr-inspdate'))!='', 'passed on site, inspected date filled')
            await pg.click('#panel-fr .donebar .done'); ok(await wait_for(pg,"async()=>(await DB.all()).some(r=>r.tool==='fr'&&r.synced)&&!syncBusy",10000), 'record filed')
            await pg.wait_for_timeout(400); files=sp.files('Strata Homes/Expression/Site records/Foundations/'); ok(len(files)==1 and '/FD Plot 001 - H3-2100 OP - Expression - ' in files[0], 'filed as FD Plot 001: '+str(files))
            row=sp.rows[0]['fields']; ok(row.get('Type')=='Foundations' and row.get('Signed')=='Passed on site' and row.get('SignedBy')=='D Jones', 'register: Foundations, Passed on site, D Jones: '+json.dumps({k:row.get(k) for k in ('Type','Signed','SignedBy','Ref')}))
            filed=[f for f in files if f.endswith('.pdf')]; ok(filed and len(sp.items[filed[0]]['data'])>20000, 'filed PDF has the drawing and the attachment')
            await pg.evaluate("()=>frList()"); await pg.wait_for_timeout(300); ok('1 of 5' in await pg.text_content('#fr-joblist'), 'plots list shows 1 of 5 done')
            # a semi: plot 8 is the right-hand house, cut at the party wall, which is counted half on each plot
            await chip(pg,'8'); await pg.wait_for_timeout(500)
            P=await pg.evaluate("()=>({party:FR.plan.party,w:FR.plan.w,n:FR.plan.pts.length,walls:FR.plan.walls.length})"); ok(P['party'] and P['party']['mode']=='half' and P['party']['full']==1350 and 675 in P['w'] and P['walls']==0, 'party wall side found, half width 675: '+json.dumps(P))
            ps=P['party']['sides'][0]; await pg.click(f'#fr-plan g[data-s="{ps}"] rect'); await pg.wait_for_timeout(200); ok(await pg.is_visible('#fr-party'), 'party wall side offers half / all / none')
            v_half=await pg.evaluate("()=>+document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/)[1]")
            await pg.click('#fr-party [data-m="all"]'); await pg.wait_for_timeout(150); v_all=await pg.evaluate("()=>+document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/)[1]"); ok(await pg.evaluate(f"()=>FR.plan.w[{ps}]===1350") and v_all>v_half, f'all of it: 1350 wide, more concrete ({v_half} -> {v_all})')
            await pg.click('#fr-party [data-m="none"]'); await pg.wait_for_timeout(150); v_none=await pg.evaluate("()=>+document.getElementById('fr-concout').textContent.match(/about ([\\d.]+)/)[1]"); ok(await pg.evaluate(f"()=>FR.plan.w[{ps}]===0") and v_none<v_half, f'none: 0 wide, less concrete ({v_none})')
            await pg.click('#fr-party [data-m="half"]'); await pg.wait_for_timeout(100)
            # a plot with no drawing on the job: a plain rectangle to size, design level on every corner
            await chip(pg,'42'); await pg.wait_for_timeout(800); print('   plot now', await pg.input_value('#fr-plot'), await pg.evaluate("()=>FR.design"))
            ks=await pg.evaluate("()=>FR.corners.map(c=>c.k+':'+c.design)"); ok(ks==['A:93.600','B:93.600','C:93.600','D:93.600'] and await pg.evaluate("()=>FR.plan.src==='rect'"), 'plot 42: rectangle, schedule level on every corner: '+str(ks))
            ok(await pg.is_visible('#fr-rectwrap') and 'plain rectangle' in await pg.text_content('#fr-plotinfo'), 'size boxes shown and the info says so')
            await pg.fill('#fr-rectl','12'); await pg.dispatch_event('#fr-rectl','input'); ok(await pg.evaluate("()=>Math.abs(FR.plan.pts[1].x-12)<0.01"), 'length box resizes the rectangle')
            if not await pg.is_visible('#fr-addcorner'): await pg.click('#fr-cornerfold summary')
            await pg.click('#fr-addcorner'); ks=await pg.evaluate("()=>FR.corners.map(c=>c.k)"); ok(ks==['A','B','C','D','E'] and await pg.evaluate("()=>FR.plan.pts.length===5"), 'another corner from the list goes on the plan too')
            # reopen plot 1 from the list: the change on site is kept
            await chip(pg,'1'); await pg.wait_for_timeout(600)
            c=await pg.evaluate("()=>FR.corners[2]"); ok(c['from']=='101.000' and c['design']=='100.700' and c['dug']=='101.050' and await pg.evaluate("()=>FR.plan.w[1]===900&&FR.drain==='differs'&&!!FR.drainPdf&&FR.passed==='Passed on site'&&FR.score==='4'&&FR.plan.walls.length===1&&document.getElementById('fr-p1m3').value==='3.0'"), 'reopened plot 1 keeps the levels, the width, the drainage and the result: '+json.dumps(c))
            # garage chips in their own row
            ok(await pg.evaluate("()=>!!document.querySelector('.mhchip[data-r=\"4G\"]')"), 'garage 4G listed')
            # job details file loads in Job set-up (office)
            await ctx.close(); ctx=await b.new_context(viewport={'width':1100,'height':900}); sp.who,sp.upn='Michael Howard','michael@rjhowardengineers.co.uk'; await sp.install(ctx); pg=await ctx.new_page(); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
            await pg.goto(U); await pg.wait_for_timeout(700); await nosplash(pg); await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200); await nosplash(pg)
            await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(800); await pg.evaluate("()=>go('panel-home')"); await pg.click('[data-go="panel-jobsetup"]'); await pg.wait_for_timeout(1500)
            newpack=dict(pack); newpack['plots']=pack['plots']+[{'plot':'99','type':'H2-1300','hand':'','design':{'found':'Trench','toc':90.0,'under':{'A':89.4}}}]
            await pg.set_input_files('#js-jobfile',{'name':'Expression_job.json','mimeType':'application/json','buffer':json.dumps(newpack).encode()}); await pg.wait_for_timeout(500)
            ok('6' in await pg.text_content('#js-sum'), 'job details file loaded: 6 plots')
            await pg.click('#js-save'); await pg.wait_for_timeout(1200)
            saved=json.loads(sp.text('Strata Homes/Expression/_app/job.json')); ok(len(saved['plots'])==6 and saved['plots'][5]['design']['under']['A']==89.4, 'saved job keeps the design levels through the paste box')
            ok(not errs, 'no page errors: '+str(errs[:3]))
            await b.close()
    finally: srv.terminate()
    print(f"\n{R['pass']} passed, {R['fail']} failed")
asyncio.run(main())
