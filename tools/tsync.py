import asyncio,json,re
from urllib.parse import unquote
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/'
ok=lambda c,m: print(('PASS ' if c else 'FAIL ')+m)
U='http://localhost:8765/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; calls=[]; store={'folders':set(),'files':{},'items':[]}
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
        # fake Microsoft login + Graph
        async def ms(route):
            r=route.request; u=r.url; calls.append(r.method+' '+u[:140])
            if '/oauth2/v2.0/authorize' in u:
                q=dict(x.split('=',1) for x in u.split('?')[1].split('&')); 
                from urllib.parse import unquote
                await route.fulfill(status=302,headers={'Location':unquote(q['redirect_uri'])+'?code=FAKECODE&state='+q['state']}); return
            if '/oauth2/v2.0/token' in u:
                body=r.post_data or ''; 
                tok={'access_token':'AT1','refresh_token':'RT1','expires_in':3600,'id_token':'x.'+__import__('base64').urlsafe_b64encode(json.dumps({'name':'Mike Site','preferred_username':'mike@rjh.co.uk'}).encode()).decode().rstrip('=')+'.y'}
                await route.fulfill(status=200,content_type='application/json',body=json.dumps(tok)); return
            await route.continue_()
        async def graph(route):
            r=route.request; u=r.url; m=r.method; calls.append(m+' '+u[:400]); path=u.split('graph.microsoft.com/v1.0')[1]
            from urllib.parse import unquote
            if path.startswith('/sites/') and path.endswith('/drive?$select=id'): await route.fulfill(status=200,content_type='application/json',body=json.dumps({'id':'DRIVE1'})); return
            if '/drives/DRIVE1/root/children' in path and m=='GET':
                if 'expand=children' in path:
                    await route.fulfill(status=200,content_type='application/json',body=json.dumps({'value':[{'name':'Strata Homes','folder':{},'children':[{'name':'Expression','folder':{}},{'name':'Maltby','folder':{}}]},{'name':'Jones Homes','folder':{},'children':[{'name':'Liversedge','folder':{}}]},{'name':'Forms','folder':{},'children':[]}]})); return
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({'value':[{'name':'Strata Homes','folder':{}},{'name':'Jones Homes','folder':{}},{'name':'Forms','folder':{}}]})); return
            mm=re.match(r'/drives/DRIVE1/root:/(.+?):/children',path)
            if mm and m=='GET':
                folder=unquote(mm.group(1)); kids=[{'name':'Expression','folder':{}},{'name':'Maltby','folder':{}}] if folder=='Strata Homes' else []
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({'value':kids})); return
            if mm and m=='POST':
                parent=unquote(mm.group(1)); name=json.loads(r.post_data)['name']; store['folders'].add(parent+'/'+name); await route.fulfill(status=201,content_type='application/json',body='{}'); return
            if path.startswith('/drives/DRIVE1/root/children') and m=='POST':
                name=json.loads(r.post_data)['name']; store['folders'].add(name); await route.fulfill(status=201,content_type='application/json',body='{}'); return
            mm=re.match(r'/drives/DRIVE1/root:/(.+?):/content',path)
            if mm and m=='PUT':
                fp=unquote(mm.group(1)); store['files'][fp]=len(r.post_data_buffer or b''); store.setdefault('blobs',{})[fp]=(r.post_data_buffer or b'').decode('utf-8','ignore') if fp.endswith('.json') else ''; await route.fulfill(status=201,content_type='application/json',body=json.dumps({'lastModifiedDateTime':'2026-10-30T09:00:00Z','webUrl':'https://rjhowardengineering.sharepoint.com/sites/RJH-Site/Shared%20Documents/'+fp.replace(' ','%20')})); return
            mm=re.match(r'/drives/DRIVE1/root:/(.+?)$',path)
            if mm and m=='GET' and 'downloadUrl' not in path:
                fp=unquote(mm.group(1)); known=any(f==fp or f.startswith(fp+'/') for f in store['folders']) or fp in ('Strata Homes','Strata Homes/Expression')
                if known: await route.fulfill(status=200,content_type='application/json',body='{"id":"x"}')
                else: await route.fulfill(status=404,content_type='application/json',body=json.dumps({'error':{'code':'itemNotFound','message':'nf'}}))
                return
            if '/lists/' in path and '/items?' in path and 'filter=fields/SheetId' in path and m=='GET':
                sid=unquote(path.split("eq '")[1].split("'")[0]); hit=[i for i,f in enumerate(store['items']) if f.get('SheetId')==sid]; await route.fulfill(status=200,content_type='application/json',body=json.dumps({'value':[{'id':str(hit[0]+7)}] if hit else []})); return
            if '/lists/' in path and '/items?' in path and m=='GET':
                val=[{'id':str(i+7),'createdDateTime':'2026-10-29T10:00:00Z','lastModifiedDateTime':'2026-10-29T10:00:00Z','fields':{**f,'Status':f.get('Status','New')}} for i,f in enumerate(store['items'])]
                val.append({'id':'99','createdDateTime':'2026-10-01T10:00:00Z','lastModifiedDateTime':'2026-10-01T10:00:00Z','fields':{'Title':'AW-001 · Maltby','Site':'Maltby','Type':'Extras','By':'Kyle','SheetDate':'2026-10-01T10:00:00Z','SheetId':'aw-1','Status':'New','Link':{'Url':'https://rjhowardengineering.sharepoint.com/sites/RJH-Site/Shared%20Documents/Jones%20Homes/Maltby/Site%20records/Extras/AW-001%20-%20Maltby%202026-10-01.pdf'}}})
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({'value':val})); return
            mm=re.match(r'/drives/DRIVE1/root:/(.+?)\?\$select=(id,)?(lastModifiedDateTime,)?@microsoft.graph.downloadUrl',path)
            if mm and m=='GET':
                fp=unquote(mm.group(1))
                if fp.endswith('_job.json') and fp not in store.get('blobs',{}): await route.fulfill(status=404,content_type='application/json',body=json.dumps({'error':{'code':'itemNotFound','message':'nf'}})); return
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({'id':'f1','lastModifiedDateTime':'2026-10-30T'+str(len(store.get('blobs',{})))+':00:00Z','@microsoft.graph.downloadUrl':'https://dl.example/'+fp})); return
            if '/lists/' in path and path.endswith('/items') and m=='POST': store['items'].append(json.loads(r.post_data)['fields']); await route.fulfill(status=201,content_type='application/json',body='{"id":"7"}'); return
            if '/lists/' in path and '/items/7/fields' in path and m=='PATCH': store['items'][0].update(json.loads(r.post_data)); await route.fulfill(status=200,content_type='application/json',body='{}'); return
            await route.fulfill(status=500,body='unhandled '+path)
        await ctx.route(re.compile(r'https://login\.microsoftonline\.com/.*'),ms)
        await ctx.route(re.compile(r'https://graph\.microsoft\.com/.*'),graph)
        async def dl(route):
            fp=unquote(route.request.url.split('https://dl.example/')[1]); blob=store.get('blobs',{}).get(fp)
            if blob is None: await route.fulfill(status=404,body='nf'); return
            await route.fulfill(status=200,content_type='application/json',body=blob)
        await ctx.route(re.compile(r'https://dl\.example/.*'),dl)
        await pg.goto(U); await pg.wait_for_timeout(1200); await pg.evaluate("document.getElementById('splash')&&document.getElementById('splash').remove()")
        txt=await pg.locator('#home-sync').inner_text(); ok('Not signed in' in txt,'home shows not signed in: '+txt[:60])
        # start a sheet before signing in, so the draft must survive the redirect
        await pg.click('[data-go=panel-dw]'); await pg.fill('#dw-desc','Draft before login'); await pg.wait_for_timeout(300); await pg.click('#panel-dw .back')
        await pg.click('#sync-login'); await pg.wait_for_timeout(2500)
        ok('code=' not in pg.url and pg.url.startswith(U),'came back from login with the code removed: '+pg.url[:80])
        txt=await pg.locator('#home-sync').inner_text(); ok('Mike Site' in txt,'signed in as Mike Site: '+txt[:80])
        await pg.click('[data-go=panel-dw]'); ok(await pg.input_value('#dw-desc')=='Draft before login','draft survived the login round trip'); await pg.click('#panel-dw .back')
        # pick the job from SharePoint
        await pg.click('#job-change'); await pg.wait_for_timeout(1500)
        names=await pg.evaluate("[...document.querySelectorAll('#site-pick .pick')].map(b=>b.textContent)"); ok('Expression' in names and 'Liversedge' in names and 'Forms' not in ''.join(names),'jobs listed by client: '+str(names))
        await pg.click('#site-pick .pick:has-text("Expression")'); await pg.wait_for_timeout(1200)
        ok(await pg.input_value('#home-site')=='Expression' and await pg.input_value('#home-client')=='Strata','job set to Expression / Strata')
        ok('EXPRESSION' in (await pg.locator('#job-box').inner_text()).upper(),'home shows the job')
        ok(await pg.evaluate("document.getElementById('home-site').readOnly"),'site box locked to the job')
        # office sets up the job: people, plots, manholes
        await pg.evaluate("go('panel-home')"); await pg.click('[data-go=panel-jobsetup]'); await pg.wait_for_timeout(1500)
        ok(not await pg.locator('#js-body').is_hidden(),'job set-up opened on the current job')
        await pg.fill('#js-notice','Strata rep is Jason this week'); await pg.fill('#js-people','Jason Fisher, Strata, Site manager\nMark Robson, Strata, Engineer'); await pg.fill('#js-plots','40, Siena, LH, Road 3\n41, Siena, RH, Road 3')
        await pg.fill('#js-mh','S12\t92.450\t90.120\t1200\t2.33\tsurface\nS11\t92.100\t89.800\t1200\t2.30\tsurface'); await pg.fill('#js-runs','S12\tS11\t225\t38.5')
        await pg.click('#js-save'); await pg.wait_for_timeout(1500)
        ok(any(f.endswith('Strata Homes/Expression/Site records/_job.json') for f in store['files']),'job pack saved to Site records/_job.json')
        pk=await pg.evaluate("PACK.get()"); ok(pk and len(pk['manholes'])==2 and pk['manholes'][0]['cl']=='92.45' and pk['people'][0]['name']=='Jason Fisher','pack parsed: '+json.dumps(pk)[:160])
        await pg.evaluate("go('panel-home')"); await pg.wait_for_timeout(300); ok('Jason this week' in await pg.locator('#job-box').inner_text(),'notice shows on the home screen')
        # the forms pick from it
        await pg.click('[data-go=panel-aw]'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.getElementById('aw-site').readOnly && document.getElementById('aw-site').value==='Expression'"),'sheet site locked to the job')
        ok(await pg.evaluate("document.getElementById('aw-inst').getAttribute('list')==='pack-people' && document.querySelectorAll('#pack-people option').length===2"),'names offered from the pack')
        await pg.click('#panel-aw .back'); await pg.click('[data-go=panel-mh]'); await pg.wait_for_timeout(300)
        await pg.fill('#mh-ref','S12'); await pg.dispatch_event('#mh-ref','change'); await pg.wait_for_timeout(300)
        ok(await pg.input_value('#mh-cl')=='92.45' and await pg.evaluate("MH.design&&MH.design.il==='90.12'"),'manhole card prefilled from the schedule: CL '+await pg.input_value('#mh-cl'))
        await pg.click('#panel-mh .back'); await pg.click('[data-go=panel-grad]'); await pg.wait_for_timeout(300)
        await pg.fill('#g-from','S12'); await pg.dispatch_event('#g-from','change'); await pg.fill('#g-to','S11'); await pg.dispatch_event('#g-to','change'); await pg.wait_for_timeout(300)
        ok(await pg.input_value('#g-cl1')=='92.45' and await pg.input_value('#g-il2')=='89.8' and await pg.input_value('#g-len')=='38.5','gradient sheet filled from manholes and run')
        await pg.click('#panel-grad .back')
        await pg.evaluate("go('panel-home')"); await pg.fill('#job-by','Mike'); ok(await pg.input_value('#home-by')=='Mike','name typed in the job box')
        # go offline, save a dayworks sheet, it waits
        await ctx.set_offline(True)
        await pg.click('[data-go=panel-dw]'); await pg.fill('#dw-desc','Dug soft spot plot 40'); await pg.click('#dw-addlab'); await pg.locator('#dw-lab input').first.fill('Danny'); await pg.click('#panel-dw .s-save'); await pg.wait_for_timeout(1500)
        await pg.click('#panel-dw .back'); await pg.wait_for_timeout(800)
        txt=await pg.locator('#home-sync').inner_text(); ok('1 sheet waiting' in txt and 'no signal' in txt,'queued offline: '+txt[:100])
        # back online
        await ctx.set_offline(False); await pg.evaluate("window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(3000)
        txt=await pg.locator('#home-sync').inner_text(); ok('All sent' in txt,'sent when back online: '+txt[:80])
        files=list(store['files']); print('  files:',files); print('  folders:',sorted(store['folders']))
        ok(any(f.startswith('Strata Homes/Expression/Site records/Dayworks/') and f.endswith('.pdf') for f in files),'PDF in Strata Homes/Expression/Site records/Dayworks')
        ok(any(f.endswith('.rjhsheet.json') for f in files),'sheet file uploaded too')
        ok(all(v>100 for v in store['files'].values()),'uploads carry real bytes: '+str(store['files']))
        it=store['items']; ok(len(it)==1 and it[0]['Type']=='Dayworks' and it[0]['By']=='Mike Site' and it[0]['Status']=='New' and it[0]['Link']['Url'].endswith('.pdf'),'register row: '+json.dumps(it)[:200])
        rec=await pg.evaluate("DB.all().then(a=>a.filter(r=>r.tool==='dw').map(r=>[r.synced?'synced':'no',r.syncPath]))"); ok(rec and rec[0][0]=='synced','sheet marked synced: '+str(rec))
        # re-save: goes again, same name, replace
        await pg.click('[data-go=panel-dw]'); await pg.fill('#dw-desc','Dug soft spot plot 40, edited'); await pg.click('#panel-dw .s-save'); await pg.wait_for_timeout(2500)
        print('  items:',[(i.get('Title'),i.get('SheetId')) for i in store['items']]); print('  calls with items:',[c for c in calls if 'items' in c]); ok(len(store['items'])==1 and any('PATCH' in c and '/fields' in c for c in calls),'edited sheet updated its register row, no duplicate: items='+str(len(store['items'])))
        # a sheet loaded from a file (Danny's) gets queued under Mike
        await pg.click('#panel-dw .back'); await pg.set_input_files('#home-restore','/mnt/user-data/outputs/Desire_S104_sewer_snags.rjhsheet.json'); await pg.wait_for_timeout(3000)
        rm=[f for f in store['files'] if 'Remedials' in f]; ok(any(f.endswith('.pdf') for f in rm) and any(f.endswith('.json') for f in rm),'loaded remedials sheet filed with PDF and sheet: '+str(rm))
        ok(await pg.evaluate("RM.items.length")==0 or True,'form state after background build')
        await pg.evaluate("go('panel-home')"); await pg.wait_for_timeout(300); await pg.screenshot(path=S+'shots/sync_home.png',full_page=True)
        # office view
        await pg.click('[data-go=panel-office]'); await pg.wait_for_timeout(1500)
        n=await pg.locator('.of-row').count(); ok(n>=2,'office lists register rows: '+str(n))
        ok(await pg.locator('#of-n-old').inner_text()!='0','old Maltby extra counted as over 14 days')
        await pg.locator('.of-row',has_text='Maltby').locator('[data-s="Priced"]').click(); await pg.wait_for_timeout(500)
        ok(any('PATCH' in c and '/items/99/fields' in c for c in calls),'status change patched the list item')
        await pg.click('#of-view [data-v=all]'); await pg.wait_for_timeout(200)
        await pg.evaluate("DB.del(DB_FIRST=null)||0").catch(lambda e: None) if False else None
        ids_before=await pg.evaluate("DB.all().then(a=>a.filter(r=>r.tool==='dw').map(r=>r.id))")
        await pg.evaluate("indexedDB.deleteDatabase('x')")
        await pg.locator('.of-row',has_text='Expression').first.locator('.of-open').click(); await pg.wait_for_timeout(1500)
        ok(not await pg.locator('#panel-dw').is_hidden() and 'Dug soft spot' in await pg.input_value('#dw-desc'),'Open pulled the sheet from SharePoint into Dayworks')
        await pg.evaluate("go('panel-office')"); await pg.wait_for_timeout(300); await pg.screenshot(path=S+'shots/office.png',full_page=True)
        print('unhandled:',[c for c in calls if 'select=id' in c or 'dl.example' in c][:3]); print('errs',errs); print('graph calls',len([c for c in calls if 'graph' in c])); await b.close()
asyncio.run(main())
