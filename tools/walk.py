import asyncio,json
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/shots/walk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2600)
        await pg.screenshot(path=S+'home.png',full_page=True)
        ids=await pg.evaluate("[...document.querySelectorAll('section[id^=panel-]')].map(s=>s.id)")
        info={}
        for sid in ids:
            if sid=='panel-home': continue
            if await pg.locator(f'[data-go={sid}]').count()==0: info[sid]='no button'; continue
            await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(300)
            await pg.evaluate("document.getElementById('splash')&&document.getElementById('splash').remove()")
            await pg.locator(f'[data-go={sid}]').first.click(); await pg.wait_for_timeout(500)
            r=await pg.evaluate(f"""(()=>{{const s=document.getElementById('{sid}'); const W=document.documentElement.clientWidth;
              const over=[...s.querySelectorAll('*')].filter(e=>{{const r=e.getBoundingClientRect(); return r.width>0&&r.right>W+1}}).slice(0,5).map(e=>e.tagName+'#'+e.id+'.'+e.className);
              const small=[...s.querySelectorAll('button,a,input,select,label.btn,summary')].filter(e=>{{const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&r.height<36}}).map(e=>(e.textContent||e.id||e.type).trim().slice(0,25));
              const inputs=s.querySelectorAll('input,select,textarea').length;
              return {{h:s.scrollHeight,inputs,over,small:small.slice(0,12),nsmall:small.length,scrollW:document.documentElement.scrollWidth}} }})()""")
            info[sid]=r
            await pg.screenshot(path=S+sid+'.png',full_page=True)
        print(json.dumps(info,indent=0)); print('errs',errs); await b.close()
asyncio.run(main())
