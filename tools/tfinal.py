import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(600)
        await pg.click('[data-go=panel-fd]'); await pg.fill('#fd-by','Dave'); await pg.fill('#fd-plot','20'); await pg.wait_for_timeout(700); await pg.click('[data-draw="0"]'); await pg.wait_for_timeout(500)
        # side chips via sketch tap
        await pg.locator('#fd-canvas').scroll_into_view_if_needed()
        box=await pg.locator('#fd-canvas svg').bounding_box(); sc=box['width']/float((await pg.evaluate("document.querySelector('#fd-canvas svg').getAttribute('viewBox')")).split()[2])
        mid=await pg.evaluate("(()=>{const a=FD.pts[1],b=FD.pts[2];return [((a.x+b.x)/2+FD.ox)*FD.ppm,((a.y*0.6+b.y*0.4)+FD.oy)*FD.ppm]})()")
        await pg.touchscreen.tap(box['x']+mid[0]*sc, box['y']+mid[1]*sc); await pg.wait_for_timeout(300)
        print('sel',await pg.evaluate("JSON.stringify(FD.sel)"), 'chk before',await pg.evaluate("FD.sides[1].chk"))
        await pg.click('[data-sw="750"]'); await pg.wait_for_timeout(200)
        print('side2 w',await pg.evaluate("FD.sides[1].w"),'chk after',await pg.evaluate("FD.sides[1].chk"))
        await pg.click('#fd-side-close')
        await pg.click('[data-all="600"]'); print('all',await pg.evaluate("FD.sides.map(s=>s.w).join()"))
        # save, new, reload saved
        await pg.click('#panel-fd >> text=Save'); await pg.wait_for_timeout(500)
        await pg.click('#panel-fd >> text=New'); await pg.wait_for_timeout(500)
        print('after new: pts',await pg.evaluate("FD.pts.length"),'by',await pg.input_value('#fd-by'))
        await pg.click('#panel-fd >> text=Saved'); await pg.wait_for_timeout(500)
        opens=pg.locator('.savelist .open:visible'); print('saved rows',await opens.count())
        if await opens.count(): await opens.first.click(); await pg.wait_for_timeout(600)
        print('reloaded pts',await pg.evaluate("FD.pts.length"),'plot',await pg.input_value('#fd-plot'),'wl rows',await pg.locator('[data-w]').count())
        # other kinds
        for k in ('run','photo','plot'):
            await pg.click('#fd-kind [data-k=%s]'%k); await pg.wait_for_timeout(300)
        # other tools still fine
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(500)
        for g in await pg.evaluate("[...document.querySelectorAll('[data-go]')].map(e=>e.dataset.go)"):
            try:
                await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(250); await pg.click('[data-go=%s]'%g,timeout=2000); await pg.wait_for_timeout(200)
            except Exception as e: print('nav fail',g)
        print('errs',errs); await b.close()
asyncio.run(main())
