import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from fakesp import FakeSP
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/shots'
os.makedirs(OUT,exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
        sp=FakeSP(); await sp.install(ctx); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8766/index.html'); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
        await pg.screenshot(path=OUT+'/home-new.png',full_page=True)
        await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200)
        await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
        await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(500)
        await pg.fill('#job-by','Jack Brown'); await pg.wait_for_timeout(200)
        for panel in sys.argv[2:] or ['panel-dw','panel-aw','panel-rm','panel-mh','panel-fd','panel-grad','panel-th','panel-level']:
            await pg.evaluate("()=>go('panel-home')"); await pg.click(f'[data-go="{panel}"]'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'{OUT}/{panel}.png',full_page=True)
        await pg.evaluate("()=>go('panel-home')"); await pg.wait_for_timeout(400); await pg.screenshot(path=OUT+'/home-signed.png',full_page=True)
        print('errors',errs)
        await b.close()
asyncio.run(main())
