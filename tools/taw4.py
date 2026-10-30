import asyncio,json
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(800)
        await pg.click('[data-go=panel-aw]'); await pg.wait_for_timeout(300)
        # an old v56 sheet still opens and adds up
        await pg.set_input_files('#aw-load',S+'aw_sheet_v56.json'); await pg.wait_for_timeout(600)
        print('old sheet:',await pg.evaluate("[...document.querySelectorAll('.aw-item .aw-res')].map(e=>e.textContent)"))
        await pg.click('#panel-aw .s-new'); await pg.wait_for_timeout(300)
        await pg.evaluate("document.getElementById('aw-more').open=true"); await pg.fill('#aw-site','Expression, Chesterfield'); await pg.press('#aw-site','Tab'); await pg.fill('#aw-client','Strata Homes'); await pg.fill('#aw-by','Mike')
        await pg.click('#aw-why [data-w="Damage by others"]'); await pg.fill('#aw-trade','Scaffolders')
        async def add(q): 
            await pg.click('#aw-quick [data-q=%s]'%q); await pg.wait_for_timeout(120); return pg.locator('.aw-item').last
        c=await add('t1'); await c.locator('[data-k=desc]').fill('Type 1 stone laid'); await c.locator('[data-bsz="0"]').fill('40mx4mx50mm'); await c.locator('[data-k=tickets]').fill('48812, 48815')
        c=await add('pipe'); await c.locator('[data-k=desc]').fill('New 150 storm connection'); await c.locator('[data-k=S]').fill('150 mm PVC'); await c.locator('[data-bsz="0"]').fill('12.5')
        await c.locator('[data-ok=dep][data-ov="1 to 1.5 m"]').click(); await c.locator('[data-ok=grd][data-ov="Tarmac / flags"]').click(); await c.locator('[data-ok=bed][data-ov="Pea gravel"]').click()
        c=await add('pave'); await c.locator('[data-k=desc]').fill('Re-flagged the walkways'); await c.locator('[data-bsz="0"]').fill('3.5mx900mm x2')
        await c.locator('.aw-addbit').click(); await pg.wait_for_timeout(150); c=pg.locator('.aw-item').last; await c.locator('[data-bsz="1"]').fill('2.4 x 1.2')
        await c.locator('[data-ok=work][data-ov="Relaid"]').click(); await c.locator('[data-k=where]').fill('site entrance')
        c=await add('count'); await c.locator('[data-k=S]').fill('Manhole covers raised'); await c.locator('[data-k=Q]').fill('3')
        c=await add('loads'); await c.locator('[data-k=desc]').fill('Muck away from soft spot'); await c.locator('[data-k=Q]').fill('4'); await c.locator('[data-k=tickets]').fill('T101-T104')
        c=await add('hours'); await c.locator('[data-k=desc]').fill('Standing time waiting for Openreach'); await c.locator('[data-k=S]').fill('2 men and a 9 t dumper'); await c.locator('[data-k=Q]').fill('3'); await c.locator('[data-ok=kind][data-ov="Standing time"]').click()
        c=await add('dig'); await c.locator('[data-k=desc]').fill('Soft spot dug out'); await c.locator('[data-bsz="0"]').fill('3 x 2 x 600'); await c.locator('[data-k=Q]').fill('4'); await c.locator('[data-ok=how][data-ov="Machine"]').click(); await c.locator('[data-ok=spoil][data-ov="Carted away"]').click()
        await pg.wait_for_timeout(200)
        print('items:',await pg.evaluate("[...document.querySelectorAll('.aw-item .aw-res')].map(e=>e.textContent)"))
        await pg.locator('.aw-item').nth(2).screenshot(path=S+'aw4_pave.png'); await pg.locator('.aw-item').nth(1).screenshot(path=S+'aw4_pipe.png')
        await pg.locator('#aw-quick').screenshot(path=S+'aw4_quick.png')
        await pg.click('#panel-aw .s-save'); await pg.wait_for_timeout(300)
        await pg.click('#panel-aw .s-new'); await pg.wait_for_timeout(200)
        await pg.click('#panel-aw .s-list'); await pg.wait_for_timeout(300); await pg.locator('#panel-aw .savelist .open').first.click(); await pg.wait_for_timeout(500)
        print('reopened:',await pg.inner_text('#aw-n'),'why pressed:',await pg.evaluate("[...document.querySelectorAll('#aw-why [aria-pressed=true]')].map(b=>b.dataset.w)"),'trade',await pg.input_value('#aw-trade'))
        async with pg.expect_download() as d: await pg.evaluate("document.getElementById('aw-more').open=true"); await pg.click('#aw-csv')
        dl=await d.value; await dl.save_as(S+'aw4.csv'); print(open(S+'aw4.csv').read())
        async with pg.expect_download() as d: await pg.click('#aw-download')
        dl=await d.value; await dl.save_as(S+'aw4.pdf')
        print('errs',errs); await b.close()
asyncio.run(main())
