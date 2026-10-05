// Server-only bridge: all deployments share the original store and its authentication.
const DEFAULT_BACKEND = 'https://dua-medical-store.saadcr224.chatgpt.site';
export async function proxyStore(request: Request, endpoint: '/api/store' | '/api/formula') {
  const fail = (error: string, status: number) => Response.json({error}, {status, headers:{'Cache-Control':'no-store'}});
  if (!['GET','POST'].includes(request.method) || (endpoint === '/api/formula' && request.method !== 'GET')) return fail('Method not allowed.',405);
  const incoming = new URL(request.url);
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    if (request.headers.get('sec-fetch-site') === 'cross-site') return fail('Invalid origin',403);
    if (origin) {
      try { if (new URL(origin).host !== (request.headers.get('host') || incoming.host)) return fail('Invalid origin',403); }
      catch { return fail('Invalid origin',403); }
    }
  }
  try {
    const backend = new URL(process.env.DUA_BACKEND_URL || DEFAULT_BACKEND);
    if (backend.protocol !== 'https:' || backend.username || backend.password || backend.origin === incoming.origin || backend.pathname !== '/' || backend.search || backend.hash) return fail('Invalid store backend configuration.',503);
    const target = new URL(endpoint, backend); target.search = incoming.search;
    const headers = new Headers({'Accept':'application/json'});
    const cookie = request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('dua_session='));
    if(cookie) headers.set('Cookie',cookie);
    let body: string | undefined;
    if(request.method === 'POST') {
      if(!request.headers.get('content-type')?.includes('application/json')) return fail('JSON request required.',415);
      body = await request.text();
      if(new TextEncoder().encode(body).length > 4*1024*1024) return fail('Use smaller import batches.',413);
      headers.set('Content-Type','application/json'); headers.set('Origin',backend.origin);
    }
    const response = await fetch(target,{method:request.method,headers,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(45000)});
    if(response.status >= 300 && response.status < 400) return fail('Store backend redirected unexpectedly.',502);
    if(!response.headers.get('content-type')?.includes('application/json')) return fail('Store backend is unavailable. Your offline data remains on this device.',502);
    const outputHeaders = new Headers({'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie'});
    for(const value of response.headers.getSetCookie()) if(value.startsWith('dua_session=') && !/;\s*domain=/i.test(value)) outputHeaders.append('Set-Cookie',value);
    const retry = response.headers.get('retry-after'); if(retry) outputHeaders.set('Retry-After',retry);
    return new Response(response.body,{status:response.status,headers:outputHeaders});
  } catch { return fail('Unable to reach the shared store. Your offline data is still available.',503); }
}
