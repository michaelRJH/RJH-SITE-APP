import asyncio,json,datetime
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/shots/'
U='http://localhost:8765/index.html'
ok=lambda c,m: print(('PASS ' if c else 'FAIL ')+m)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True)
        pg=await ctx.new_page(); errs=[]; toasts=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(U); await pg.wait_for_timeout(2700)
        order=await pg.evaluate("[...document.querySelectorAll('#panel-home h2')].map(h=>h.textContent)"); ok(order[0]=='Records', 'Records first: '+str(order))
        ok(await pg.locator('#to-val,#to-prices').count()==0,'no price boxes in take-off')
        r=await pg.evaluate("(()=>{ try{ go('panel-to'); toRender&&toRender(); }catch(e){} try{ let d=buildOffice(); d=d.doc||d; return 'pdf '+(d.output('arraybuffer').byteLength>1000); }catch(e){ return 'ERR '+e.message; } })()"); ok(r=='pdf true','take-off office PDF builds: '+r)
        await pg.evaluate("go('panel-home')")
        ok(await pg.locator('#home-carry').is_hidden(),'carry on hidden when nothing started')
        # start a dayworks sheet, do not save
        await pg.click('[data-go=panel-dw]'); await pg.fill('#dw-site','Expression plot 40'); await pg.fill('#dw-desc','Dig out soft spot'); await pg.wait_for_timeout(1500)
        await pg.click('#panel-dw .back'); await pg.wait_for_timeout(500)
        txt=await pg.locator('#home-carry').inner_text(); ok('DAYWORKS' in txt.upper() and 'today' in txt,'carry on shows dayworks: '+txt.replace('\n',' | '))
        await pg.locator('#home-carry .carry').first.click(); await pg.wait_for_timeout(300); ok(not await pg.locator('#panel-dw').is_hidden(),'carry on opens dayworks')
        # save it, nudge appears
        await pg.click('#panel-dw .s-save'); await pg.wait_for_timeout(400); await pg.evaluate("go('panel-home')"); await pg.wait_for_timeout(400)
        ok(await pg.locator('#home-nudge').is_visible(),'backup nudge shows: '+(await pg.locator('#home-nudge').inner_text())[:90])
        # unsaved new work, then open the saved sheet: new work must be kept
        await pg.click('[data-go=panel-dw]'); await pg.click('#panel-dw .s-new'); await pg.wait_for_timeout(200); await pg.fill('#dw-site','Plot 41 second job'); await pg.fill('#dw-desc','Extra gully'); await pg.wait_for_timeout(1200)
        await pg.evaluate("go('panel-home')"); await pg.click('#home-saved'); await pg.wait_for_timeout(300)
        await pg.locator('#home-savelist .saverow',has_text='Expression').locator('.open').click(); await pg.wait_for_timeout(600)
        n=await pg.evaluate("DB.all().then(a=>a.filter(r=>r.tool==='dw').map(r=>r.site))"); ok(len(n)==2,'unsaved sheet was saved before opening another: '+str(n))
        ok(await pg.input_value('#dw-site')=='Expression plot 40','saved sheet opened')
        # unsaved AW draft, then back up
        await pg.click('#panel-dw .back'); await pg.click('[data-go=panel-aw]'); await pg.evaluate("document.getElementById('aw-more').open=true"); await pg.fill('#aw-site','Draft only site'); await pg.fill('#aw-desc','Not saved yet'); await pg.wait_for_timeout(1300); await pg.evaluate("go('panel-home')")
        async with pg.expect_download() as d: await pg.click('#home-backup')
        dl=await d.value; await dl.save_as(S+'b63.json'); bk=json.load(open(S+'b63.json'))
        ok(any(r['tool']=='draft' and r['name']=='aw' for r in bk['sheets']),'backup includes unsaved additional works')
        await pg.wait_for_timeout(300); ok(await pg.locator('#home-nudge').is_hidden(),'nudge gone after backup')
        # conflict: edit the Expression sheet here, and load a different newer version of it
        exp=[r for r in bk['sheets'] if r['tool']=='dw' and r['site']=='Expression plot 40'][0]
        await pg.click('[data-go=panel-dw]'); await pg.fill('#dw-desc','Dig out soft spot, edited in office'); await pg.click('#panel-dw .s-save'); await pg.wait_for_timeout(400)
        other=json.loads(json.dumps(exp)); other['date']=(datetime.datetime.utcnow()+datetime.timedelta(minutes=5)).isoformat()+'Z'
        other['data']['f']=other['data'].get('f',[]) if isinstance(other['data'],dict) else other['data']
        other['data']=json.loads(json.dumps(other['data']).replace('Dig out soft spot','Dig out soft spot, edited by Mike'))
        json.dump({'rjhSheets':1,'sheets':[other]},open(S+'c63.json','w'))
        await pg.evaluate("go('panel-home')"); await pg.set_input_files('#home-restore',S+'c63.json'); await pg.wait_for_timeout(800)
        recs=await pg.evaluate("DB.all().then(a=>a.filter(r=>r.tool==='dw').map(r=>r.name+' :: '+((JSON.stringify(r.data).match(/Dig out soft spot[^\\\\\"]*/)||['none'])[0])))")
        ok(len(recs)==3 and any('edited by Mike' in x for x in recs) and any('edited in office' in x for x in recs),'both versions kept: '+str(recs))
        await pg.set_input_files('#home-restore',S+'c63.json'); await pg.wait_for_timeout(600)
        recs2=await pg.evaluate("DB.all().then(a=>a.filter(r=>r.tool==='dw').length)"); ok(recs2==3,'loading same file again adds nothing')
        # fresh phone restores the backup: unsaved AW comes back as a sheet
        ctx2=await b.new_context(viewport={'width':390,'height':844}); p2=await ctx2.new_page(); p2.on('pageerror',lambda e: errs.append('P2 '+str(e))); p2.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await p2.goto(U); await p2.wait_for_timeout(1200); await p2.set_input_files('#home-restore',S+'b63.json'); await p2.wait_for_timeout(800)
        nm=await p2.evaluate("DB.all().then(a=>a.filter(r=>r.tool!=='draft').map(r=>r.name))"); ok(any('unsaved work from backup' in x for x in nm),'fresh phone gets the unsaved work: '+str(nm))
        await pg.evaluate("go('panel-home')"); await pg.wait_for_timeout(400); await pg.screenshot(path=S+'home63.png')
        print('errs',errs); await b.close()
asyncio.run(main())
