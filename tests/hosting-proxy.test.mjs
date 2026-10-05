import assert from 'node:assert/strict';
import {proxyStore} from '../lib/hosting-proxy.ts';
const realFetch=globalThis.fetch;
let calls=[];
try {
 globalThis.fetch=async (url,options)=>{calls.push({url:String(url),options});return Response.json({ok:true},{headers:{'Set-Cookie':'dua_session=test-token; HttpOnly; Secure; SameSite=Strict; Path=/'}})};
 const req=(headers={})=>new Request('https://store.example/api/store',{method:'POST',headers:{'content-type':'application/json',origin:'https://store.example',...headers},body:JSON.stringify({action:'login'})});
 let response=await proxyStore(req(),'/api/store');
 assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.equal(calls[0].options.headers.get('origin'),'https://dua-medical-store.saadcr224.chatgpt.site');
 assert.equal(calls[0].options.redirect,'manual');
 const before=calls.length;
 assert.equal((await proxyStore(req({origin:'https://attacker.example'}),'/api/store')).status,403);
 assert.equal((await proxyStore(req({'sec-fetch-site':'cross-site'}),'/api/store')).status,403);assert.equal(calls.length,before);
 await proxyStore(new Request('https://store.example/api/store?view=catalog',{headers:{cookie:'unrelated=secret; dua_session=session-id; other=secret',authorization:'Bearer do-not-forward'}}),'/api/store');
 assert.equal(calls.at(-1).options.headers.get('cookie'),'dua_session=session-id');assert.equal(calls.at(-1).options.headers.get('authorization'),null);assert.match(calls.at(-1).url,/\?view=catalog$/);
 globalThis.fetch=async()=>Response.json({error:'Please sign in.'},{status:401});assert.equal((await proxyStore(new Request('https://store.example/api/store'),'/api/store')).status,401);
 globalThis.fetch=async()=>new Response('redirect',{status:302,headers:{location:'https://other.example'}});assert.equal((await proxyStore(req(),'/api/store')).status,502);
 globalThis.fetch=async()=>{throw new Error('timeout')};assert.equal((await proxyStore(req(),'/api/store')).status,503);
 console.log('Proxy tests passed: same-origin writes, session cookies, query forwarding, authentication and failures.');
} finally {globalThis.fetch=realFetch;}
