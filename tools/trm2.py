import asyncio
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,accept_downloads=True,device_scale_factor=2); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(700)
        # the lad receives the Radial Park file
        await pg.set_input_files('#home-restore','/mnt/user-data/outputs/Radial_Park_manholes_29-07-2026.rjhsheet.json'); await pg.wait_for_timeout(500)
        await pg.click('#home-saved'); await pg.locator('#home-savelist .open').first.click(); await pg.wait_for_timeout(600)
        print('list rows',await pg.locator('.rm-item').count(),'open cards',await pg.locator('.rm-item.sel').count())
        await pg.locator('#rm-sum').scroll_into_view_if_needed(); await pg.screenshot(path=S+'shots/rm2_list.png',clip={'x':0,'y':(await pg.locator('#rm-sum').bounding_box())['y']-10,'width':390,'height':600})
        await pg.locator('.rm-row').first.click(); await pg.wait_for_timeout(300)
        sel=pg.locator('.rm-item.sel'); print('opened snag:',await sel.locator('.aw-top b').inner_text())
        await sel.locator('input[type=file][data-ph=before]:not([capture])').set_input_files([S+'shots/image1.jpeg',S+'shots/image3.jpeg']); await pg.wait_for_timeout(300)
        await sel.locator('[data-st=fixed]').click(); await pg.wait_for_timeout(200); sel=pg.locator('.rm-item.sel')
        await sel.locator('[data-fx="Reset to level"]').click(); await sel.locator('input[type=file][data-ph=after][capture]').set_input_files(S+'shots/image3.jpeg'); await pg.wait_for_timeout(300)
        await sel.screenshot(path=S+'shots/rm2_card.png')
        await sel.locator('.rm-next').click(); await pg.wait_for_timeout(300)
        print('before photos on first snag:',await pg.evaluate("RM.items.find(i=>i.st==='fixed').before.length")); print('after next, open snag:',await pg.locator('.rm-item.sel .aw-top b').inner_text(),'| fixed count',await pg.evaluate("RM.items.filter(i=>i.st==='fixed').length"),'| open view rows',await pg.locator('.rm-item').count())
        await pg.locator('.rm-item.sel [data-st=notours]').click(); await pg.wait_for_timeout(200); await pg.locator('.rm-item.sel [data-k=why]').fill('Cover slab cracks are a manufacturer issue'); await pg.locator('.rm-item.sel .rm-next').click(); await pg.wait_for_timeout(200)
        await pg.click('#panel-rm .s-save'); await pg.wait_for_timeout(300)
        async with pg.expect_download() as d: await pg.click('#rm-download')
        dl=await d.value; await dl.save_as(S+'shots/rm2.pdf')
        await pg.click('#rm-filter [data-f=fixed]'); await pg.wait_for_timeout(200); print('fixed view rows',await pg.locator('.rm-item').count())
        print('errs',errs); await b.close()
asyncio.run(main())
