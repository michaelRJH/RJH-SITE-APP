import asyncio,json
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/'
ok=lambda c,m: print(('PASS ' if c else 'FAIL ')+m)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True,device_scale_factor=2); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(600); await pg.evaluate("document.getElementById('splash')&&document.getElementById('splash').remove()")
        await pg.click('#sitebox summary'); await pg.fill('#home-site','Expression, Chesterfield'); await pg.fill('#home-client','Strata'); await pg.fill('#home-by','Mike')
        await pg.click('[data-go=panel-aw]'); await pg.wait_for_timeout(400)
        ok(await pg.locator('#aw-more').evaluate('e=>!e.open'),'More detail is folded')
        print('head:',await pg.locator('#aw-head').inner_text())
        await pg.screenshot(path=S+'shots/aw5_top.png',full_page=False)
        await pg.fill('#aw-loc','Plot 40 drive'); await pg.fill('#aw-inst','Dave Jones'); await pg.fill('#aw-instco','Strata, site manager')
        await pg.fill('#aw-desc','Dug out a soft spot on the drive at plot 40 on Dave\'s say-so, filled with Type 1, muck carted away.')
        await pg.set_input_files('#aw-photo',S+'shots/image1.jpeg'); await pg.wait_for_timeout(500)
        await pg.fill('#aw-sizes','Dig out 3 x 2 x 600, 4 loads away\nType 1 3 x 2 x 600\n150 pipe 12.5\n3 covers raised\n2 men 3 hrs standing\nConcrete 2.4 x 1.2 x 150\nflags 600x600 3.5 x 0.9 x2\nTopsoil 40 x 4\n6 loads 6f2 delivered\nsomething odd')
        await pg.wait_for_timeout(600)
        rows=await pg.evaluate("AW.items.map(it=>{ const r=awQty(it); return it.t+' | '+(isNaN(r.q)?'?':fq(r.q,r.u))+' '+r.u+(it.Q&&it.t==='dig'?' loads '+it.Q:'')+(it.S?' | '+it.S:'')+(it.mat?' | '+it.mat:''); })")
        for r in rows: print('  ',r)
        ok(len(rows)==10,'10 lines gave 10 items')
        exp={'dig':'3.60 m³','layer':'3.60 m³','pipe':'12.50 m','count':'3 nr','hours':'3.00 hr','conc':'0.43 m³','pave':'6.30 m²','area':'160.00 m²','loads':'6 loads'}
        for k,v in exp.items(): ok(any(r.startswith(k+' | '+v) for r in rows),k+' = '+v)
        ok(any('loads 4' in r for r in rows),'dig picked up 4 loads')
        print('sizes out:',(await pg.locator('#aw-sizesout').inner_text()).replace('\n',' | ')[:300])
        ok(await pg.locator('#aw-np').inner_text()=='1','photo counted')
        await pg.locator('#aw-sizes').scroll_into_view_if_needed(); await pg.screenshot(path=S+'shots/aw5_sizes.png')
        # save, new, reopen: photos and sizes come back
        await pg.click('#panel-aw .s-save'); await pg.wait_for_timeout(300); await pg.click('#panel-aw .s-new'); await pg.wait_for_timeout(300)
        ok(await pg.input_value('#aw-sizes')=='' and await pg.evaluate('AW.photos.length')==0,'New clears sizes and photos')
        await pg.evaluate("go('panel-home')"); await pg.click('#home-saved'); await pg.locator('#home-savelist .open').first.click(); await pg.wait_for_timeout(400)
        ok('Dig out' in await pg.input_value('#aw-sizes') and await pg.evaluate('AW.photos.length')==1 and await pg.evaluate('AW.items.length')==10,'reopened sheet has sizes, photo and items')
        # edit sizes: items regenerate, manual ones kept
        await pg.evaluate("AW.items.push(awFix({t:'kerb',photos:[],desc:'HB2 kerbs',bits:[{L:'20',sz:'20'}]})); awRender();")
        await pg.fill('#aw-sizes','Type 1 10 x 2 x 100'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("AW.items.length")==2 and await pg.evaluate("AW.items.some(i=>i.t==='kerb'&&!i.auto)"),'regenerated: 1 auto + 1 manual')
        # PDF with description only
        await pg.fill('#aw-sizes',''); await pg.wait_for_timeout(500); await pg.evaluate("AW.items=[]; awRender();")
        async with pg.expect_download() as d: await pg.click('#aw-download')
        dl=await d.value; await dl.save_as(S+'shots/aw5_desc_only.pdf'); ok(True,'PDF with description only downloaded')
        # old sheet (no photos/sizes keys) opens
        await pg.evaluate("SAVERS.aw.set({f:['Old site','','Plot 1','2026-10-01','AW-009','Bob','Old job','Dave','','','','','','','','','',''],items:[{t:'layer',mat:'Type 1',bits:[{L:'10',W:'2',D:'100'}]}],how:'Verbal'})")
        ok(await pg.evaluate("AW.items.length")==1 and await pg.input_value('#aw-sizes')=='','old sheet opens cleanly')
        print('head after old:',await pg.locator('#aw-head').inner_text())
        print('errs',errs); await b.close()
asyncio.run(main())
