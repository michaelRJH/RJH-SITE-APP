# A fake Microsoft sign-in and SharePoint (Graph) for testing the app in Playwright.
# Keeps a little drive (folders, files with eTags, download links) and the Site records register list in memory.
import json, re, base64, itertools
from urllib.parse import unquote, urlparse, parse_qs

class FakeSP:
    def __init__(self, who='Mike Site', upn='mike@rjhowardengineers.co.uk', columns=None, fail_upload=False):
        self.who, self.upn = who, upn
        self.ids = itertools.count(100)
        self.items = {}      # path -> {id, folder, data, etag, mod}
        self.byid = {}
        self.rows = []       # register rows: {id, fields, mod}
        self.calls = []
        self.columns = columns   # None = every column exists; else a set of allowed field names
        self.fail_upload = fail_upload
        self.mkdir('Strata Homes'); self.mkdir('Strata Homes/Expression'); self.mkdir('Strata Homes/Maltby'); self.mkdir('Jones Homes'); self.mkdir('Jones Homes/Liversedge'); self.mkdir('Forms'); self.mkdir('Templates')
    def mkdir(self, path):
        parts = path.split('/')
        for i in range(1, len(parts)+1):
            p = '/'.join(parts[:i])
            if p not in self.items:
                it = {'id': 'I%d' % next(self.ids), 'folder': True, 'path': p}; self.items[p] = it; self.byid[it['id']] = it
    def put(self, path, data):
        if '/' in path: self.mkdir(path.rsplit('/', 1)[0])
        it = self.items.get(path)
        if not it:
            it = {'id': 'I%d' % next(self.ids), 'folder': False, 'path': path}; self.items[path] = it; self.byid[it['id']] = it
        it['data'] = data; it['etag'] = '"E%d"' % next(self.ids); it['mod'] = '2026-10-30T09:%02d:00Z' % (next(self.ids) % 60)
        return it
    def meta(self, it):
        name = it['path'].rsplit('/', 1)[-1]
        m = {'id': it['id'], 'name': name, 'eTag': it.get('etag', '"F"'), 'lastModifiedDateTime': it.get('mod', '2026-10-01T00:00:00Z'),
             'webUrl': 'https://rjhowardengineering.sharepoint.com/sites/RJH-Site/Shared%20Documents/' + it['path'].replace(' ', '%20')}
        if it['folder']: m['folder'] = {}
        else: m['@microsoft.graph.downloadUrl'] = 'https://dl.example/' + it['id']; m['file'] = {}; m['size'] = len(it.get('data', b''))
        return m
    def kids(self, path):
        pre = (path + '/') if path else ''
        return [it for p, it in self.items.items() if p.startswith(pre) and '/' not in p[len(pre):] and p != path]
    def files(self, pre=''):
        return sorted(p for p, it in self.items.items() if not it['folder'] and p.startswith(pre))
    def text(self, path):
        d = self.items[path].get('data', b''); return d.decode('utf-8', 'ignore')
    async def install(self, ctx):
        await ctx.route('https://login.microsoftonline.com/**', self.ms)
        await ctx.route('https://graph.microsoft.com/**', self.graph)
        await ctx.route('https://dl.example/**', self.dl)
    async def ms(self, route):
        r = route.request; u = r.url; self.calls.append(r.method + ' ' + u[:120])
        if '/oauth2/v2.0/authorize' in u:
            q = parse_qs(urlparse(u).query)
            if q.get('prompt', [''])[0] == 'none' and getattr(self, 'silent_fail', False):
                await route.fulfill(status=302, headers={'Location': q['redirect_uri'][0] + '?error=login_required&state=' + q['state'][0]}); return
            await route.fulfill(status=302, headers={'Location': q['redirect_uri'][0] + '?code=FAKECODE&state=' + q['state'][0]}); return
        if '/oauth2/v2.0/token' in u:
            idt = 'x.' + base64.urlsafe_b64encode(json.dumps({'name': self.who, 'preferred_username': self.upn}).encode()).decode().rstrip('=') + '.y'
            await route.fulfill(status=200, content_type='application/json', body=json.dumps({'access_token': 'AT1', 'refresh_token': 'RT1', 'expires_in': 3600, 'id_token': idt})); return
        await route.continue_()
    async def dl(self, route):
        iid = route.request.url.rsplit('/', 1)[-1]; it = self.byid.get(iid)
        if not it: await route.fulfill(status=404, body='nf'); return
        await route.fulfill(status=200, body=it.get('data', b''), content_type='application/octet-stream')
    def j(self, route, status, obj):
        return route.fulfill(status=status, content_type='application/json', body=json.dumps(obj))
    def check_fields(self, f):
        if self.columns is None: return None
        for k in f:
            if k not in self.columns: return k
        return None
    async def graph(self, route):
        r = route.request; u = r.url; m = r.method; self.calls.append(m + ' ' + unquote(u)[:300])
        path = u.split('graph.microsoft.com/v1.0')[1]; base = path.split('?')[0]; q = parse_qs(urlparse(u).query)
        if base.startswith('/sites/') and base.endswith('/drive'): return await self.j(route, 200, {'id': 'DRIVE1'})
        if re.match(r'/sites/[^/]+/lists/[^/]+$', base) and m == 'GET': return await self.j(route, 200, {'webUrl': 'https://rjhowardengineering.sharepoint.com/sites/RJH-Site/Lists/Site%20records'})
        # register list
        mm = re.match(r'/sites/[^/]+/lists/[^/]+/items(?:/(\d+))?(/fields)?$', base)
        if mm:
            rid, fields = mm.group(1), mm.group(2)
            if m == 'GET' and not rid and '$orderby' in q:
                return await self.j(route, 400, {'error': {'code': 'invalidRequest', 'message': 'orderby not supported in the fake'}})
            if m == 'GET' and not rid:
                flt = unquote(q.get('$filter', [''])[0]); rows = self.rows
                fm = re.match(r"fields/(\w+) eq '(.*)'", flt)
                if fm: rows = [x for x in rows if str(x['fields'].get(fm.group(1), '')) == fm.group(2).replace("''", "'")]
                return await self.j(route, 200, {'value': [{'id': x['id'], 'fields': x['fields'], 'createdDateTime': x.get('created', '2026-10-30T08:00:00Z'), 'lastModifiedDateTime': x.get('mod', '2026-10-30T08:00:00Z')} for x in rows]})
            if m == 'POST' and not rid:
                f = json.loads(r.post_data)['fields']; bad = self.check_fields(f)
                if bad: return await self.j(route, 400, {'error': {'code': 'invalidRequest', 'message': "Field '%s' is not recognized" % bad}})
                row = {'id': str(len(self.rows) + 7), 'fields': f}; self.rows.append(row); return await self.j(route, 201, {'id': row['id'], 'fields': f})
            if m == 'GET' and rid and fields:
                row = next((x for x in self.rows if x['id'] == rid), None)
                if not row: return await self.j(route, 404, {'error': {'code': 'itemNotFound', 'message': 'nf'}})
                return await self.j(route, 200, row['fields'])
            if m == 'PATCH' and rid and fields:
                f = json.loads(r.post_data); bad = self.check_fields(f)
                if bad: return await self.j(route, 400, {'error': {'code': 'invalidRequest', 'message': "Field '%s' is not recognized" % bad}})
                row = next((x for x in self.rows if x['id'] == rid), None)
                if not row: return await self.j(route, 404, {'error': {'code': 'itemNotFound', 'message': 'nf'}})
                row['fields'].update(f); return await self.j(route, 200, row['fields'])
        # drive by id
        mm = re.match(r'/drives/DRIVE1/items/([^/]+)$', base)
        if mm:
            it = self.byid.get(mm.group(1))
            if not it: return await self.j(route, 404, {'error': {'code': 'itemNotFound', 'message': 'nf'}})
            if m == 'DELETE':
                for p in [p for p in self.items if p == it['path'] or p.startswith(it['path'] + '/')]:
                    self.byid.pop(self.items[p]['id'], None); del self.items[p]
                return await route.fulfill(status=204, body='')
            if m == 'PATCH':
                b = json.loads(r.post_data); par = b.get('parentReference', {}).get('path', '').split('root:')[-1].strip('/'); name = b.get('name', it['path'].rsplit('/', 1)[-1])
                newp = (unquote(par) + '/' + name) if par else name; self.mkdir(newp.rsplit('/', 1)[0]) if '/' in newp else None
                del self.items[it['path']]; it['path'] = newp; self.items[newp] = it; return await self.j(route, 200, self.meta(it))
            return await self.j(route, 200, self.meta(it))
        # children
        if base in ('/drives/DRIVE1/root/children',) or re.match(r'/drives/DRIVE1/root:/.+:/children$', base):
            parent = '' if base.endswith('/root/children') else unquote(re.match(r'/drives/DRIVE1/root:/(.+):/children$', base).group(1))
            if m == 'POST':
                name = json.loads(r.post_data)['name']; p = (parent + '/' + name) if parent else name
                if p in self.items: return await self.j(route, 409, {'error': {'code': 'nameAlreadyExists', 'message': 'exists'}})
                self.mkdir(p); return await self.j(route, 201, self.meta(self.items[p]))
            if parent and parent not in self.items: return await self.j(route, 404, {'error': {'code': 'itemNotFound', 'message': 'nf'}})
            if 'children' in q.get('$expand', [''])[0]:   # real SharePoint refuses this on a folder listing
                return await self.j(route, 400, {'error': {'code': 'invalidRequest', 'message': 'Operation not supported'}})
            exp = False
            out = []
            for it in self.kids(parent):
                mt = self.meta(it)
                if exp and it['folder']: mt['children'] = [self.meta(k) for k in self.kids(it['path'])]
                out.append(mt)
            return await self.j(route, 200, {'value': out})
        # content upload
        mm = re.match(r'/drives/DRIVE1/root:/(.+):/content$', base)
        if mm and m == 'PUT':
            if self.fail_upload: return await self.j(route, 503, {'error': {'code': 'serviceNotAvailable', 'message': 'busy'}})
            it = self.put(unquote(mm.group(1)), r.post_data_buffer or b''); return await self.j(route, 201, self.meta(it))
        mm = re.match(r'/drives/DRIVE1/root:/(.+?)$', base)
        if mm and m == 'GET':
            it = self.items.get(unquote(mm.group(1)))
            if not it: return await self.j(route, 404, {'error': {'code': 'itemNotFound', 'message': 'The resource could not be found.'}})
            return await self.j(route, 200, self.meta(it))
        print('UNHANDLED', m, unquote(u)[:200])
        await self.j(route, 400, {'error': {'code': 'unhandled', 'message': 'unhandled in fake'}})
