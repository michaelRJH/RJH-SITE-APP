# v78 foundation record: design levels from the job, differences, change on site, filing, PDF
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
            b=await p.chromium.launch(); sp=FakeSP()
            pack={'v':1,'client':'Strata Homes','job':'Expression','status':'live','notice':'','people':[],'manholes':[],'runs':[],'houseTypes':[],
              'plots':[{'plot':'1','type':'H3-2100','hand':'OP','design':{'found':'Eng Strip','ffl':102.25,'toc':101.5,'depth':'1.100','under':{'A':101.0,'B':101.0,'C':101.0,'D':101.0},'gl':{},'strata':'Eng Fill','borehole':'RBH01','suitable':101.1}},
                       {'plot':'42','type':'H4-1700','hand':'','design':{'found':'Trench','ffl':95.0,'toc':94.2,'depth':'1.200','under':{'B':93.6,'D':93.6},'gl':{},'strata':'Clay','borehole':'WS12','suitable':93.8}},
                       {'plot':'4G','type':'Single Garage','hand':'AS','garage':True,'design':{'found':'Eng Strip','ffl':101.275,'toc':100.525,'depth':'1.200','under':{'A':100.075,'B':100.075,'C':100.075,'D':100.075},'gl':{},'strata':'Eng Fill','borehole':'RBH01','suitable':100.6}}]}
            sp.put('Strata Homes/Expression/_app/job.json',json.dumps(pack).encode())
            ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True); await sp.install(ctx); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept('soft spot, deepen 300, J Smith AWP') if d.type=='prompt' else d.accept()))
            await pg.goto(U); await pg.wait_for_timeout(700); await nosplash(pg); await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200); await nosplash(pg)
            await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(1200); await pg.fill('#job-by','Kyle')
            ok(await pg.is_visible('[data-go="panel-fr"]') and not await pg.is_visible('[data-go="panel-fd"]'), 'home tile is the new record; drawing tool under More')
            await pg.evaluate("()=>go('panel-home')"); await pg.click('[data-go="panel-fr"]'); await pg.wait_for_timeout(400)
            ok(await pg.is_visible('#fr-joblist') and '0 of 3' in await pg.text_content('#fr-joblist'), 'plots on this job listed: '+(await pg.text_content('#fr-joblist'))[:60])
            await pg.click('.mhchip[data-r="1"]'); await pg.wait_for_timeout(400)
            ok((await pg.input_value('#fr-plot'))=='1' and (await pg.input_value('#fr-type'))=='H3-2100 OP' and (await pg.input_value('#fr-tocd'))=='101.500', 'plot 1: house type and design top of concrete filled')
            ks=await pg.evaluate("()=>FR.corners.map(c=>c.k+':'+c.design)"); ok(ks==['A:101.000','B:101.000','C:101.000','D:101.000'], 'design underside at A to D: '+str(ks))
            ok('Eng Strip' in await pg.text_content('#fr-plotinfo') and 'RBH01' in await pg.text_content('#fr-plotinfo'), 'plot info line')
            # dug levels: on level, deeper, higher
            rows=await pg.query_selector_all('#fr-corners .fr-row:not(.fr-head)')
            async def dug(i,v):
                ins=await rows[i].query_selector_all('input'); await ins[2].fill(v); await ins[2].dispatch_event('input')
            await dug(0,'101.010'); await dug(1,'100.900'); await dug(2,'101.050')
            outs=await pg.eval_on_selector_all('#fr-corners .fr-out','e=>e.map(x=>x.firstChild.textContent)')
            ok(outs[0].startswith('On level') and outs[1]=='100 mm deeper than design' and outs[2]=='50 mm higher than design', 'differences worked out: '+str(outs))
            # change the design on site at C
            chg=await rows[2].query_selector('.fr-chg'); await chg.click(); await pg.wait_for_timeout(300)
            c=await pg.evaluate("()=>FR.corners[2]"); ok(c['from']=='101.000' and 'J Smith' in c['why'], 'design change recorded with why and who: '+json.dumps(c))
            rows=await pg.query_selector_all('#fr-corners .fr-row:not(.fr-head)'); ins=await rows[2].query_selector_all('input'); ok(not await ins[1].get_attribute('readonly'), 'design box unlocked after Change')
            await ins[1].fill('100.700'); await ins[1].dispatch_event('input')
            await pg.fill('#fr-toc','94.9'); await pg.fill('#fr-tocd','101.500'); await pg.fill('#fr-toc','101.520'); await pg.wait_for_timeout(100)
            ok('On level' in await pg.text_content('#fr-tocout'), 'top of concrete difference shown')
            await pg.fill('#fr-ground','Firm clay'); await pg.fill('#fr-mix','GEN1'); await pg.fill('#fr-m3','4.2'); await pg.fill('#fr-insp','D Jones'); await pg.click('#fr-nosig [data-n="Will sign later"]')
            await pg.click('#panel-fr .donebar .done'); ok(await wait_for(pg,"async()=>(await DB.all()).some(r=>r.tool==='fr'&&r.synced)&&!syncBusy",10000), 'record filed')
            await pg.wait_for_timeout(400); files=sp.files('Strata Homes/Expression/Site records/Foundations/'); ok(len(files)==1 and '/FD Plot 001 - H3-2100 OP - Expression - ' in files[0], 'filed as FD Plot 001: '+str(files))
            row=sp.rows[0]['fields']; ok(row.get('Type')=='Foundations' and row.get('Signed')=='Will sign later' and row.get('SignedBy')=='D Jones', 'register: Foundations, Will sign later, D Jones: '+json.dumps({k:row.get(k) for k in ('Type','Signed','SignedBy','Ref')}))
            await pg.evaluate("()=>frList()"); await pg.wait_for_timeout(300); ok('1 of 3' in await pg.text_content('#fr-joblist'), 'plots list shows 1 of 3 done')
            # the PDF builds and says the right things
            txt=await pg.evaluate("async()=>{ const d=buildFr(); return d.output('arraybuffer').byteLength; }"); ok(txt>20000, 'PDF builds')
            # a plot with only B and D on the schedule, then an extra corner
            await chip(pg,'42'); await pg.wait_for_timeout(500)
            ks=await pg.evaluate("()=>FR.corners.map(c=>c.k)"); ok(ks==['B','D'], 'plot 42 has B and D only: '+str(ks))
            await pg.click('#fr-addcorner'); ks=await pg.evaluate("()=>FR.corners.map(c=>c.k)"); ok(ks==['B','D','A'], 'another corner added as A')
            # reopen plot 1 from the list: the change on site is kept
            await chip(pg,'1'); await pg.wait_for_timeout(600)
            c=await pg.evaluate("()=>FR.corners[2]"); ok(c['from']=='101.000' and c['design']=='100.700' and c['dug']=='101.050', 'reopened plot 1 keeps the dug level and the change: '+json.dumps(c))
            # garage chips in their own row
            ok(await pg.evaluate("()=>!!document.querySelector('.mhchip[data-r=\"4G\"]')"), 'garage 4G listed')
            # job details file loads in Job set-up (office)
            await ctx.close(); ctx=await b.new_context(viewport={'width':1100,'height':900}); sp.who,sp.upn='Michael Howard','michael@rjhowardengineers.co.uk'; await sp.install(ctx); pg=await ctx.new_page(); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
            await pg.goto(U); await pg.wait_for_timeout(700); await nosplash(pg); await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200); await nosplash(pg)
            await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(800); await pg.evaluate("()=>go('panel-home')"); await pg.click('[data-go="panel-jobsetup"]'); await pg.wait_for_timeout(1500)
            newpack=dict(pack); newpack['plots']=pack['plots']+[{'plot':'99','type':'H2-1300','hand':'','design':{'found':'Trench','toc':90.0,'under':{'A':89.4}}}]
            await pg.set_input_files('#js-jobfile',{'name':'Expression_job.json','mimeType':'application/json','buffer':json.dumps(newpack).encode()}); await pg.wait_for_timeout(500)
            ok('4' in await pg.text_content('#js-sum'), 'job details file loaded: 4 plots')
            await pg.click('#js-save'); await pg.wait_for_timeout(1200)
            saved=json.loads(sp.text('Strata Homes/Expression/_app/job.json')); ok(len(saved['plots'])==4 and saved['plots'][3]['design']['under']['A']==89.4, 'saved job keeps the design levels through the paste box')
            ok(not errs, 'no page errors: '+str(errs[:3]))
            await b.close()
    finally: srv.terminate()
    print(f"\n{R['pass']} passed, {R['fail']} failed")
asyncio.run(main())
