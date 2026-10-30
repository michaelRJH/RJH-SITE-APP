# v69 filing test: numbering, one file per sheet, re-save replaces, rename moves, clash keeps both, share saves first, problems shown, older lists
import asyncio, json, re, sys, subprocess, os
sys.path.insert(0, os.path.dirname(__file__))
from fakesp import FakeSP
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8766; U = f'http://localhost:{PORT}/index.html'
R = {'pass': 0, 'fail': 0}
def ok(c, m):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + m)
async def wait_for(pg, js, t=8000):
    try: await pg.wait_for_function(js, timeout=t); return True
    except Exception: return False
async def signin_pick(pg, sp, client='Strata Homes', job='Expression'):
    await pg.goto(U); await pg.wait_for_timeout(800)
    await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
    await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200)
    await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
    await pg.evaluate(f"()=>jobPick({json.dumps(client)},{json.dumps(job)})"); await pg.wait_for_timeout(600)
async def open_tool(pg, panel):
    await pg.evaluate("()=>go('panel-home')"); await pg.click(f'[data-go="{panel}"]'); await pg.wait_for_timeout(250)
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # ---------- main run ----------
            sp = FakeSP(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); await sp.install(ctx)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await signin_pick(pg, sp)
            ok((await pg.evaluate("()=>AUTH.who()")) == 'Mike Site', 'signed in')
            ok((await pg.evaluate("()=>SITE.get().job")) == 'Expression', 'job picked')
            pill = await pg.text_content('#sync-pill'); ok(pill in ('All in the office', '0 waiting'), 'header pill shows ' + str(pill))
            # dayworks gets DW-001 from the job
            await open_tool(pg, 'panel-dw')
            await pg.evaluate("()=>REFFILL('dw')"); await pg.wait_for_timeout(200)
            ok((await pg.input_value('#dw-ref')) == 'DW-001', 'dayworks numbered DW-001: ' + await pg.input_value('#dw-ref'))
            ok((await pg.input_value('#dw-site')) == 'Expression', 'site follows the job')
            await pg.fill('#dw-desc', 'Soft spot by plot 40, dug out and filled'); await pg.click('#panel-dw .s-save')
            ok(await wait_for(pg, "async()=>{ const q=await SQ.all(); return q.length===0 && (await DB.all()).some(r=>r.tool==='dw'&&r.synced); }"), 'dayworks filed'); await pg.wait_for_timeout(400)
            pdfs = sp.files('Strata Homes/Expression/Site records/Dayworks/'); jsons = sp.files('Strata Homes/Expression/_app/sheets/')
            ok(len(pdfs) == 1 and re.search(r'/DW-001 - Expression - \d{4}-\d\d-\d\d \(\w{4}\)\.pdf$', pdfs[0] if pdfs else ''), 'PDF named by ref, job, date, id: ' + str(pdfs))
            ok(len(jsons) == 1 and jsons[0].endswith('.json'), 'sheet data in _app/sheets: ' + str(jsons))
            ok(not any(p.endswith('.rjhsheet.json') for p in sp.files('Strata Homes/Expression/Site records/')), 'no json next to the PDFs')
            row = sp.rows[0]['fields'] if sp.rows else {}
            ok(row.get('Ref') == 'DW-001' and row.get('Type') == 'Dayworks' and row.get('Site') == 'Expression' and row.get('Client') == 'Strata Homes', 'register row: ' + json.dumps({k: row.get(k) for k in ('Ref', 'Type', 'Site', 'Client', 'Rev', 'Signed', 'WorkDate')}))
            ok(row.get('Signed') == 'Not signed yet', 'unsigned sheet says so in the register')
            st = await pg.text_content('#panel-dw .s-state'); ok('In the office' in (st or ''), 'bar says In the office: ' + str(st))
            # re-save replaces, one file, Rev 2
            await pg.fill('#dw-desc', 'Soft spot by plot 40, dug out 3 x 2 x 0.6 and filled'); await pg.click('#panel-dw .s-save')
            await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000); await pg.wait_for_timeout(300)
            ok(len(sp.files('Strata Homes/Expression/Site records/Dayworks/')) == 1, 're-save keeps one PDF')
            ok(len(sp.rows) == 1 and sp.rows[0]['fields'].get('Rev') == '2', 're-save updates the same row to Rev 2: ' + str([r['fields'].get('Rev') for r in sp.rows]))
            # New saves quietly, no question, next number
            await pg.click('#panel-dw .s-new'); await pg.wait_for_timeout(500)
            ok((await pg.input_value('#dw-ref')) == 'DW-002', 'New starts DW-002: ' + await pg.input_value('#dw-ref'))
            ok((await pg.input_value('#dw-desc')) == '', 'New clears the sheet')
            # Share saves first and so files the sheet
            await pg.fill('#dw-desc', 'Breaking out concrete obstruction'); await pg.evaluate("()=>{ navigator.canShare=()=>false; }")
            async with pg.expect_download(timeout=8000) as dl: await pg.click('#panel-dw .clientcopy')
            ok(await wait_for(pg, "async()=>(await DB.all()).filter(r=>r.tool==='dw'&&r.synced).length===2", 8000), 'sharing a PDF also saves and files it')
            await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000); await pg.wait_for_timeout(300); print('   files:', sp.files('Strata Homes/Expression/'), [c for c in sp.calls if 'DELETE' in c])
            ok(len(sp.files('Strata Homes/Expression/Site records/Dayworks/')) == 2, 'two dayworks PDFs now')
            # renaming moves: change ref of DW-002 to DW-010 and save
            await pg.fill('#dw-ref', 'DW-010'); await pg.click('#panel-dw .s-save'); await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000); await pg.wait_for_timeout(300)
            names = [x.rsplit('/', 1)[-1] for x in sp.files('Strata Homes/Expression/Site records/Dayworks/')]; print('   after rename:', sp.files('Strata Homes/Expression/'), [c for c in sp.calls if 'DELETE' in c or 'content' in c][-6:])
            ok(len(names) == 2 and any(n.startswith('DW-010') for n in names) and not any(n.startswith('DW-002') for n in names), 'changing the ref renames the file, no old copy: ' + str(names))
            ok(len(sp.files('Strata Homes/Expression/_app/sheets/')) == 2, 'and its data file moved too')
            # clash: someone changed DW-001's PDF in SharePoint; this phone edits DW-001 again -> both kept
            p1 = [x for x in sp.files('Strata Homes/Expression/Site records/Dayworks/') if '/DW-001' in x][0]; sp.put(p1, b'office edit')
            await pg.evaluate("async()=>{ const r=(await DB.all()).find(x=>x.tool==='dw'&&x.ref==='DW-001'); const o=SAVERS.dw; o.set(r.data); o.currentId=r.id; o.rev=r.rev; }")
            await pg.fill('#dw-desc', 'Edited on the phone after the office changed it'); await pg.click('#panel-dw .s-save'); await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000); await pg.wait_for_timeout(300)
            names = [x.rsplit('/', 1)[-1] for x in sp.files('Strata Homes/Expression/Site records/Dayworks/')]
            ok(len(names) == 3 and sum(1 for n in names if n.startswith('DW-001')) == 2 and any('also from' in n for n in names), 'a clash keeps both copies: ' + str(names))
            ok(sp.text(p1) == 'office edit', 'the office copy is untouched')
            ok(any('Changed on two devices' in (r['fields'].get('Notes') or '') for r in sp.rows), 'register notes the clash')
            # and after the clash this phone keeps filing to its own copy, never back over the office's
            await pg.fill('#dw-desc', 'Edited again on the phone'); await pg.click('#panel-dw .s-save'); await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000); await pg.wait_for_timeout(300)
            names = [x.rsplit('/', 1)[-1] for x in sp.files('Strata Homes/Expression/Site records/Dayworks/')]
            ok(sp.text(p1) == 'office edit' and len(names) == 3, 'a second save after a clash leaves the office copy alone: ' + str(names))
            # numbering counts a sheet saved a moment ago, before its filing has run
            ok(await pg.evaluate("async()=>{ await DB.put({id:'dw-1700000000000',tool:'dw',name:'x',site:'Expression',job:'Expression',date:new Date().toISOString(),data:{f:['Expression','','','DW-041']}}); const n=await nextRef('dw','Expression'); await DB.del('dw-1700000000000'); return n; }") == 'DW-042', 'next number counts a just-saved sheet')
            # opening another sheet saves the open one quietly and that goes to the office too
            await pg.fill('#dw-desc', 'Changed then left by opening another'); cur = await pg.evaluate("()=>SAVERS.dw.currentId")
            await pg.evaluate("async()=>{ await saveQuiet('dw'); }"); ok(await wait_for(pg, "async id=>{ const r=await DB.get(id); return r&&r.synced>=r.date; }".replace('id=>','()=>').replace('DB.get(id)', "DB.get('%s')" % cur), 8000), 'a quiet save is filed too')
            # extras numbered from the job
            await pg.evaluate("()=>go('panel-aw')"); await pg.evaluate("()=>{ document.getElementById('aw-ref').value=''; return awNextRef(); }"); await pg.wait_for_timeout(200)
            ok((await pg.input_value('#aw-ref')) == 'AW-001', 'extras numbered AW-001 for the job')
            # problems are shown and can be retried
            sp.fail_upload = True
            await pg.evaluate("()=>go('panel-dw')"); await pg.click('#panel-dw .s-new'); await pg.wait_for_timeout(300); await pg.fill('#dw-desc', 'Will not go first time'); await pg.click('#panel-dw .s-save')
            for _ in range(3): await pg.evaluate("()=>syncRun()"); await pg.wait_for_timeout(500)
            st = await pg.text_content('#panel-dw .s-state'); pill = await pg.text_content('#sync-pill')
            ok('Problem' in (st or '') and pill == 'Problem', 'a failing sheet shows Problem on its bar and the header: ' + str(st) + ' / ' + str(pill))
            sp.fail_upload = False; await pg.evaluate("()=>syncRetry()"); ok(await wait_for(pg, "async()=>(await SQ.all()).length===0", 6000), 'Try again sends it'); await pg.wait_for_timeout(500)
            pill = await pg.text_content('#sync-pill'); ok(pill == 'All in the office', 'header back to All in the office: ' + str(pill))
            # the PDF says Rev and Page x of y (check the builder text)
            ok(await pg.evaluate("()=>/Rev \\$\\{issue\\}/.test(pdfFooter.toString())"), 'PDF footer prints Rev')
            ok(not [e for e in errs if 'Failed to load resource' not in e], 'no page errors: ' + str(errs[:5]))
            await ctx.close()
            # ---------- an older register without the new columns still gets rows ----------
            sp2 = FakeSP(columns={'Title', 'Site', 'Type', 'By', 'SheetDate', 'SheetId', 'Link', 'Status', 'Notes'}); ctx = await b.new_context(viewport={'width': 390, 'height': 844}); await sp2.install(ctx)
            pg = await ctx.new_page(); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept())); await signin_pick(pg, sp2)
            await open_tool(pg, 'panel-dw'); await pg.fill('#dw-desc', 'x'); await pg.click('#panel-dw .s-save'); 
            await wait_for(pg, "async()=>(await DB.all()).some(r=>r.synced)&&!syncBusy", 10000); await pg.wait_for_timeout(500)
            ok(len(sp2.rows) == 1 and 'Ref' not in sp2.rows[0]['fields'], 'register without new columns: row made with the basics '+str(sp2.rows)[:300])
            # ---------- not signed in: stays on the phone, says so ----------
            await ctx.close(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}); sp3 = FakeSP(); await sp3.install(ctx)
            pg = await ctx.new_page(); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept())); await pg.goto(U); await pg.wait_for_timeout(600)
            await open_tool(pg, 'panel-dw'); await pg.click('#panel-dw .jobstrip summary'); await pg.fill('#dw-site', 'Somewhere'); await pg.fill('#dw-desc', 'y'); await pg.click('#panel-dw .s-save'); await pg.wait_for_timeout(800)
            st = await pg.text_content('#panel-dw .s-state'); ok('On this phone' in (st or ''), 'not signed in: bar says On this phone: ' + str(st))
            ok(await pg.text_content('#sync-pill') == 'Not signed in', 'pill says Not signed in')
            # clear this phone refuses while a sheet has not gone
            await pg.evaluate("()=>clearPhone()"); await pg.wait_for_timeout(300)
            ok((await pg.evaluate("async()=>(await DB.all()).filter(r=>r.tool==='dw').length")) == 1, 'clear this phone refuses while sheets are waiting')
            await b.close()
    finally:
        srv.terminate()
    print(f"\n{R['pass']} passed, {R['fail']} failed")
asyncio.run(main())
