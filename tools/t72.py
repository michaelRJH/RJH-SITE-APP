# v70-v72: screens, tools and the office side, against a fake SharePoint
import asyncio, json, re, sys, subprocess, os, csv, io
sys.path.insert(0, os.path.dirname(__file__))
from fakesp import FakeSP
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8767; U = f'http://localhost:{PORT}/index.html'
R = {'pass': 0, 'fail': 0}
def ok(c, m):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + m)
async def wait_for(pg, js, t=8000):
    try: await pg.wait_for_function(js, timeout=t); return True
    except Exception: return False
async def nosplash(pg): await pg.evaluate("()=>{ const s=document.getElementById('splash'); if(s) s.hidden=true; }")
async def signin(pg):
    await pg.goto(U); await pg.wait_for_timeout(700); await nosplash(pg)
    await pg.click('#sync-login'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(1200); await nosplash(pg)
async def open_tool(pg, panel):
    await pg.evaluate("()=>go('panel-home')"); await pg.click(f'[data-go="{panel}"]'); await pg.wait_for_timeout(300)
def seed(sp):
    # Expression's job details still in the old place (Site records/_job.json): the app must read it and move it on save
    pack = {'v': 1, 'client': 'Strata Homes', 'job': 'Expression', 'status': 'live', 'notice': 'No deliveries Friday', 'people': [{'name': 'Jason Fisher', 'company': 'Strata', 'role': 'Site manager'}],
            'plots': [{'plot': '1', 'type': 'H3-2100', 'hand': 'AS'}, {'plot': '2', 'type': 'H3-2100', 'hand': 'OP'}, {'plot': '42', 'type': 'Siena', 'hand': 'AS'}],
            'manholes': [{'ref': 'S12', 'cl': '92.450', 'il': '90.120', 'dia': '1200', 'sys': 'surface'}, {'ref': 'S13', 'cl': '92.300', 'il': '90.000', 'dia': '1200', 'sys': 'surface'}, {'ref': 'F1', 'cl': '92.100', 'il': '89.500', 'dia': '1200', 'sys': 'foul'}], 'runs': [], 'houseTypes': []}
    sp.put('Strata Homes/Expression/Site records/_job.json', json.dumps(pack).encode())
    sp.put('Strata Homes/Expression/To site/Strata snag list 3.csv', b'No,Location,Defect\n1,Plot 4,Gully grating loose\n2,Plot 5,Kerb chipped\n')
    sp.put('Strata Homes/Expression/Drawings/Drainage layout P3.pdf', b'%PDF-1.4 fake')
    sp.mkdir('Templates/Letters')   # just a folder someone made: must not show as a job
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # ================= a lad: Mike, site manager =================
            sp = FakeSP(); seed(sp)
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, accept_downloads=True); await sp.install(ctx)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await signin(pg); await pg.fill('#job-by', 'Mike Edley')
            ok(await pg.is_hidden('[data-office]'), 'a site manager does not see the office tiles')
            # picker: Templates is not a job; one-off is offered; no New job for a lad
            await pg.click('#job-change'); await pg.wait_for_timeout(1200)
            picks = await pg.eval_on_selector_all('#site-pick .pick', 'e=>e.map(x=>x.dataset.j)')
            ok('Expression' in picks and 'Letters' not in picks, 'job list has the jobs, not stray folders: ' + str(picks))
            ok(await pg.is_visible('#pick-one') and not await pg.query_selector('#pick-new'), 'lad gets One-off, not New job')
            await pg.click('#site-pick .pick[data-j="Expression"]'); await pg.wait_for_timeout(1500)
            ok('No deliveries Friday' in (await pg.text_content('#job-box')), 'job notice on the home card')
            # From the office
            ok(await wait_for(pg, "()=>!document.getElementById('home-from').hidden", 6000), 'From the office shows')
            txt = await pg.text_content('#home-from'); ok('Strata snag list 3.csv' in txt and 'Drainage layout P3.pdf' in txt and '2 new' in txt, 'lists To site and Drawings files, 2 new')
            await pg.click('#home-from summary') if not await pg.is_visible('.fr-rm') else None
            await pg.click('.fr-rm'); await pg.wait_for_timeout(1200)
            n = await pg.evaluate("()=>RM.items.length"); ok(n == 2, 'snag list from the office loads into Remedials: %s snags' % n)
            # remedials: big add button, filter shown once 2+ snags, About their list folded
            ok(await pg.is_visible('.rm-bigadd'), 'Remedials has the big + Add a snag')
            ok(await pg.evaluate("()=>!document.getElementById('rm-filter').hidden"), 'filters show with 2 snags')
            ok(await pg.evaluate("()=>!!document.querySelector('#panel-rm .foldsec #rm-ref')"), 'their list ref sits under About their list')
            # manhole card: job list chips, tap S12 starts its card with design CL in the design box, not the built box
            await open_tool(pg, 'panel-mh'); await pg.wait_for_timeout(300)
            ok(await pg.is_visible('#mh-joblist'), 'manhole card lists the job\'s manholes')
            ok('0 of 3 done' in await pg.text_content('#mh-joblist'), 'progress 0 of 3')
            await pg.click('.mhchip[data-r="S12"]'); await pg.wait_for_timeout(500)
            ok((await pg.input_value('#mh-ref')) == 'S12' and (await pg.input_value('#mh-covld')) == '92.45' or (await pg.input_value('#mh-covld')) == '92.450', 'S12 card: design cover level filled: ' + await pg.input_value('#mh-covld'))
            ok((await pg.input_value('#mh-cl')) == '', 'built cover level left for the lad')
            order = await pg.evaluate("()=>[...document.querySelectorAll('#panel-mh > h2')].map(h=>h.textContent.trim())")
            ok(order.index('Pipes') < order.index('Levels') and order.index('Photos') < order.index('Levels'), 'manhole card: pipes and photos before levels: ' + str(order))
            await pg.fill('#mh-cl', '92.470'); await pg.click('#panel-mh .donebar .done'); await pg.wait_for_timeout(300)
            ok(await wait_for(pg, "async()=>(await DB.all()).some(r=>r.tool==='mh'&&r.synced)&&!syncBusy", 10000), 'manhole card filed')
            rec = await pg.evaluate("async()=>(await DB.all()).find(r=>r.tool==='mh')")
            ok(rec['data'].get('design') and rec['data']['design'].get('il') == '90.120', 'design levels saved with the card')
            ok(any('/Manhole cards/MH S12 - Expression - ' in f for f in sp.files()), 'file named MH S12: ' + str([f for f in sp.files() if 'Manhole' in f]))
            await pg.evaluate("()=>mhList()"); await pg.wait_for_timeout(300); ok('1 of 3 done' in await pg.text_content('#mh-joblist'), 'progress 1 of 3 after filing')
            # foundations: plot datalist offers plain numbers
            ok(await pg.evaluate("()=>[...document.getElementById('pack-plotno').options].map(o=>o.value).includes('42')"), 'plot list offers 42, not Plot 42')
            # extras: 2 men 3 hrs is 6 hours; link to a dayworks sheet both ways
            await open_tool(pg, 'panel-dw'); await pg.fill('#dw-desc', 'Soft spot plot 42'); await pg.fill('#dw-where', 'Plot 42 drive')
            await pg.click('#dw-addlab'); await pg.fill('#dw-lab .lrow input >> nth=0', 'Danny'); await pg.fill('#dw-lab .lrow input >> nth=2', '4')
            await pg.click('#panel-dw .donebar .done'); await wait_for(pg, "async()=>(await SQ.all()).length===0&&!syncBusy", 8000)
            await open_tool(pg, 'panel-aw'); await pg.fill('#aw-sizes', '2 men 3 hrs standing'); await pg.wait_for_timeout(500)
            q = await pg.evaluate("()=>AW.items.filter(i=>i.auto).map(i=>[i.t,i.Q,i.S])"); ok(q and q[0][1] == '6', '2 men 3 hrs = 6 hours: ' + str(q))
            await pg.click('#aw-more summary') if await pg.query_selector('#aw-more summary') else None
            await pg.evaluate("()=>{ document.getElementById('aw-more').open=true; }"); await pg.click('#aw-fromdw'); await pg.wait_for_timeout(400)
            await pg.click('#aw-dwlist .saverow button'); await pg.wait_for_timeout(600)
            ok(await pg.evaluate("()=>AW.links.length===1&&AW.links[0].ref==='DW-001'"), 'extra linked to DW-001')
            ok((await pg.input_value('#aw-desc')) == 'Soft spot plot 42', 'description copied from the dayworks sheet')
            back = await pg.evaluate("async()=>{ const r=(await DB.all()).find(x=>x.tool==='dw'); return (r.data.links||[]).map(l=>l.ref); }")
            ok(back == ['AW-001'], 'dayworks points back at AW-001: ' + str(back))
            await pg.click('#panel-aw .donebar .done'); await wait_for(pg, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pg.wait_for_timeout(500)
            rows = {r['fields'].get('Ref'): r['fields'] for r in sp.rows}
            ok(rows.get('AW-001', {}).get('Linked') == 'DW-001' and rows.get('DW-001', {}).get('Linked') == 'AW-001', 'register shows the link both ways')
            ok(rows.get('DW-001', {}).get('Where') == 'Plot 42 drive', 'dayworks Where in the register')
            # calculators: put concrete on the dayworks sheet
            await open_tool(pg, 'panel-conc'); inputs = [i for i in await pg.query_selector_all('#panel-conc input[type=number]') if await i.is_visible()]
            for i, v in zip(inputs[:3], ['4', '3', '150']): await i.fill(v)
            await pg.wait_for_timeout(300); await pg.click('#panel-conc .putbtn'); await pg.wait_for_timeout(200)
            if await pg.query_selector('#panel-conc .putsheet'):
                await pg.click('#panel-conc .putsheet [data-t="dw"]'); await pg.wait_for_timeout(300)
                mats = await pg.evaluate("()=>rowsOf(document.getElementById('dw-mat'))"); ok(mats and 'Concrete' in mats[-1][0], 'concrete put on the dayworks materials: ' + str(mats))
            else: ok(False, 'put on sheet box did not open (calculator read nothing)')
            # wording: no "rates" on the lad's screens
            body = await pg.evaluate("()=>document.body.innerText")
            ok('Adjust rates' not in body and 'Change a rate' not in body, 'no "rates" wording')
            ok(not [e for e in errs], 'lad: no page errors ' + str(errs[:3]))
            await ctx.close()
            # ================= the office: Michael =================
            ctx = await b.new_context(viewport={'width': 1100, 'height': 900}, accept_downloads=True); sp.who, sp.upn = 'Michael Howard', 'michael@rjhowardengineers.co.uk'; await sp.install(ctx)
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept('Checked with Jason') if d.type == 'prompt' else d.accept()))
            await signin(pg); await pg.evaluate("()=>jobPick('Strata Homes','Expression')"); await pg.wait_for_timeout(800)
            ok(await pg.is_visible('[data-office]'), 'Michael sees the office tiles')
            await pg.click('[data-go="panel-office"]'); ok(await wait_for(pg, "()=>document.querySelectorAll('#of-list .of-row').length>=3", 8000), 'office list loads')
            names = await pg.eval_on_selector_all('#of-list .of-row b', 'e=>e.map(x=>x.textContent)'); ok(any('DW-001' in n for n in names) and any('MH S12' in n for n in names), 'rows: ' + str(names))
            ok('Not signed' in (await pg.text_content('#of-n-unsigned')) or int(await pg.text_content('#of-n-unsigned')) >= 1, 'not signed counted')
            # status per type: extras have Priced, manhole cards have Issued to drawing
            mh_btns = await pg.evaluate("()=>[...document.querySelectorAll('#of-list .of-row')].filter(r=>/MH S12/.test(r.textContent)).map(r=>[...r.querySelectorAll('[data-s]')].map(b=>b.dataset.s))[0]")
            ok('Issued to drawing' in mh_btns and 'Priced' not in mh_btns, 'manhole statuses: ' + str(mh_btns))
            await pg.evaluate("()=>[...document.querySelectorAll('#of-list .of-row')].find(r=>/DW-001/.test(r.textContent)).querySelector('[data-s=Checked]').click()"); await pg.wait_for_timeout(500)
            ok(rows and any(r['fields'].get('Ref') == 'DW-001' and r['fields'].get('Status') == 'Checked' for r in sp.rows), 'status saved to the register')
            await pg.evaluate("()=>[...document.querySelectorAll('#of-list .of-row')].find(r=>/DW-001/.test(r.textContent)).querySelector('.of-note').click()"); await pg.wait_for_timeout(500)
            ok(any(r['fields'].get('Notes') == 'Checked with Jason' for r in sp.rows), 'note saved')
            # progress
            await pg.select_option('#of-site', 'Expression'); await pg.click('#of-prog'); await pg.wait_for_timeout(1200)
            pt = await pg.text_content('#of-progress'); ok('1 of 3' in pt, 'job progress: manholes 1 of 3: ' + pt[:120])
            # exports
            async with pg.expect_download() as dl: await pg.click('#of-asb')
            d = await dl.value; t = open(await d.path()).read(); ok('92.470' in t and 'S12' in t, 'as-built CSV has S12 at 92.470')
            async with pg.expect_download() as dl: await pg.click('#of-val')
            d = await dl.value; t = open(await d.path()).read(); ok('DW-001' in t and 'Labour: Danny' in t and 'AW-001' in t and '£' not in t, 'valuation CSV has the dayworks labour and the extra, no prices')
            # open read-only, then edit as a revision
            await pg.evaluate("()=>[...document.querySelectorAll('#of-list .of-row')].find(r=>/DW-001/.test(r.textContent)).querySelector('.of-open').click()"); await pg.wait_for_timeout(1500)
            ok(await pg.evaluate("()=>document.getElementById('panel-dw').classList.contains('readonly')"), 'office opens a sheet read only')
            ok(not await pg.is_visible('#panel-dw .donebar .done'), 'no Done while reading')
            await pg.click('#panel-dw [data-ro=edit]'); await pg.wait_for_timeout(200); await pg.fill('#dw-desc', 'Soft spot plot 42, checked by office'); await pg.click('#panel-dw .donebar .done')
            await wait_for(pg, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pg.wait_for_timeout(500)
            dwrow = next(r['fields'] for r in sp.rows if r['fields'].get('Ref') == 'DW-001')
            ok(dwrow.get('Rev') == '3' and dwrow.get('Foreman') == 'Mike Edley' and dwrow.get('By') == 'Michael Howard', 'office revision: Rev 3 (2 was the link), foreman kept, filed by Michael: ' + json.dumps({k: dwrow.get(k) for k in ('Rev', 'Foreman', 'By')}))
            ok(len([f for f in sp.files('Strata Homes/Expression/Site records/Dayworks/')]) == 1, 'still one dayworks file')
            # job details moved to _app on save
            await pg.click('[data-go="panel-home"]') if await pg.is_visible('[data-go="panel-home"]') else await pg.evaluate("()=>go('panel-home')")
            await pg.evaluate("()=>go('panel-home')"); await pg.click('[data-go="panel-jobsetup"]'); await pg.wait_for_timeout(1500)
            ok('3' in await pg.text_content('#js-sum'), 'job set-up shows counts: ' + await pg.text_content('#js-sum'))
            await pg.click('#js-save'); await pg.wait_for_timeout(1200)
            ok('Strata Homes/Expression/_app/job.json' in sp.files() and 'Strata Homes/Expression/Site records/_job.json' not in sp.files(), 'job details moved to _app/job.json')
            # new job makes the whole tree
            await pg.evaluate("()=>jobNew()"); await pg.wait_for_timeout(300); await pg.fill('#jn-client', 'jones homes'); await pg.fill('#jn-job', 'Eggborough'); await pg.click('#jn-go'); await pg.wait_for_timeout(2500)
            tree = [p for p in sp.items if p.startswith('Jones Homes/Eggborough')]
            ok('Jones Homes/Eggborough/Site records/Dayworks' in tree and 'Jones Homes/Eggborough/To site' in tree and 'Jones Homes/Eggborough/_app/job.json' in tree, 'new job: folders made under the existing client spelling: ' + str(sorted(tree))[:300])
            ok(not [e for e in errs], 'office: no page errors ' + str(errs[:3]))
            await ctx.close()
            # ================= remedials on two phones merge =================
            sp2 = FakeSP(); seed(sp2)
            ca = await b.new_context(viewport={'width': 390, 'height': 844}); await sp2.install(ca); pa = await ca.new_page(); pa.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await signin(pa); await pa.evaluate("()=>jobPick('Strata Homes','Expression')"); await pa.wait_for_timeout(800)
            await open_tool(pa, 'panel-rm'); await pa.evaluate("()=>{ RM.items=[{no:'1',said:'Gully loose',st:'open',before:[],after:[]},{no:'2',said:'Kerb chipped',st:'open',before:[],after:[]}]; rmRender(); }")
            await pa.click('#panel-rm .donebar .done'); await wait_for(pa, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pa.wait_for_timeout(400)
            rec = await pa.evaluate("async()=>(await DB.all()).find(r=>r.tool==='rm')")
            # phone B gets the same list, fixes snag 2 and files it
            cb = await b.new_context(viewport={'width': 390, 'height': 844}); await sp2.install(cb); pb = await cb.new_page(); pb.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await signin(pb); await pb.evaluate("()=>jobPick('Strata Homes','Expression')"); await pb.wait_for_timeout(800)
            await pb.evaluate("async r=>{ await DB.put(r); const o=SAVERS.rm; o.set(r.data); o.currentId=r.id; o.rev=r.rev; RM.items[1].st='fixed'; RM.items[1].after=['data:image/jpeg;base64,BBB']; rmRender(); }", rec)
            await open_tool(pb, 'panel-rm'); await pb.evaluate("async r=>{ const o=SAVERS.rm; o.set(r.data); o.currentId=r.id; o.rev=r.rev; RM.items[1].st='fixed'; RM.items[1].after=['data:image/jpeg;base64,BBB']; rmRender(); }", rec)
            await pb.click('#panel-rm .donebar .done'); await wait_for(pb, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pb.wait_for_timeout(400)
            # phone A fixes snag 1 and files: it should merge B's fix in, not wipe it
            await pa.evaluate("()=>{ RM.items[0].st='fixed'; RM.items[0].after=['data:image/jpeg;base64,AAA']; rmRender(); }"); await pa.click('#panel-rm .donebar .done')
            await wait_for(pa, "async()=>(await SQ.all()).length===0&&!syncBusy", 12000); await pa.wait_for_timeout(1500)
            print('   A calls:', [c[:150] for c in sp2.calls[-14:]]); print('   A rec:', await pa.evaluate("async()=>{ const r=(await DB.all()).find(r=>r.tool==='rm'); return [r.jsonTag,r.syncName,(r.data.items||[]).map(i=>i.st)]; }"))
            js = [f for f in sp2.files('Strata Homes/Expression/_app/sheets/') if 'RM-' in f]; print('   files', js)
            data = json.loads(sp2.text(js[0]))['sheets'][0]['data'] if js else {}
            sts = [(i['no'], i['st']) for i in data.get('items', [])]
            ok(sts == [('1', 'fixed'), ('2', 'fixed')], 'two phones on one snag list: both fixes kept: ' + str(sts))
            # ================= a one-off sheet the office files under a job: the phone follows it there =================
            sp3 = FakeSP(); seed(sp3); cc = await b.new_context(viewport={'width': 390, 'height': 844}); await sp3.install(cc); pc = await cc.new_page()
            pc.on('dialog', lambda d: asyncio.ensure_future(d.accept('1') if d.type == 'prompt' else d.accept()))
            await signin(pc); await pc.evaluate("()=>{ SITE.set({site:'Somewhere',client:'',by:'Mike'}); }")
            await open_tool(pc, 'panel-dw'); await pc.evaluate("()=>{ document.getElementById('dw-site').value='Somewhere'; }"); await pc.fill('#dw-desc', 'One-off job'); await pc.click('#panel-dw .s-save')
            await wait_for(pc, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pc.wait_for_timeout(300)
            ok(any(f.startswith('_Unfiled/Somewhere/Dayworks/') for f in sp3.files()), 'one-off sheet goes to _Unfiled')
            await pc.evaluate("async()=>{ await jobsRefresh(); const r=(await graph(`/sites/${M365.siteId}/lists/${M365.listId}/items?$expand=fields`)).value[0]; await ofFileUnder(ofRow(r)); }"); await pc.wait_for_timeout(500)
            await pc.fill('#dw-desc', 'One-off job, more added'); await pc.click('#panel-dw .s-save'); await wait_for(pc, "async()=>(await SQ.all()).length===0&&!syncBusy", 10000); await pc.wait_for_timeout(300)
            fl = sp3.files(); dws = [f for f in fl if '/Dayworks/' in f or f.startswith('_Unfiled/')]
            ok(not any(f.startswith('_Unfiled/') and f.endswith('.pdf') for f in fl) and len([f for f in fl if f.startswith('Strata Homes/Expression/Site records/Dayworks/')]) == 1 and not any('also from' in f for f in fl) and sp3.rows[0]['fields'].get('Site') == 'Expression', 'filed under a job by the office: the next save stays there, one PDF: ' + str(dws))
            await cc.close()
            await b.close()
    finally:
        srv.terminate()
    print(f"\n{R['pass']} passed, {R['fail']} failed")
asyncio.run(main())
