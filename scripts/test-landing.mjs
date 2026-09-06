// No network, browser, packages, credentials, or live form submissions required.
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'css/landing.css'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const helpers=script.slice(script.indexOf('async function requestJSON'),script.indexOf("document.getElementById('preview-notice')"));
function harness(fetch) {
  const timers=new Map();let timerId=0;
  const context=vm.createContext({API:'/api',fetch,AbortController,URL,
    setTimeout(fn,ms){timers.set(++timerId,{fn,ms});return timerId},
    clearTimeout(id){timers.delete(id)}});
  vm.runInContext(helpers,context);
  return {context,timers};
}
test('complete inline script parses',()=>{new vm.Script(script)});
test('all local landing-page assets exist',()=>{
  for(const [,url] of html.matchAll(/(?:src|href)="([^"$]+)"/g)) {
    if(/^(?:https?:|#)/.test(url))continue;
    assert.ok(existsSync(resolve(root,url.replace(/^\//,'').split('?')[0]||'index.html')),url);
  }
});
test('JSON read uses bounded, noncached request and cleans timer',async()=>{
  let seen;
  const {context,timers}=harness(async(url,options)=>{seen={url,options};return Response.json({options:[]})});
  const data=await context.requestJSON('/poll');
  assert.equal(data.options.length,0);assert.equal(seen.url,'/api/poll');
  assert.equal(seen.options.cache,'no-store');assert.ok(seen.options.signal);assert.equal(timers.size,0);
});
test('existing Worker plain-text POST responses remain compatible',async()=>{
  for(const path of ['/submit','/vote']) {
    const {context,timers}=harness(async()=>new Response('Success',{headers:{'content-type':'text/plain'}}));
    assert.equal((await context.requestJSON(path,{method:'POST'})).message,'Success');
    assert.equal(timers.size,0);
  }
});
test('Pages HTML fallback cannot masquerade as successful API call',async()=>{
  const {context}=harness(async()=>new Response('<html>fallback</html>',{headers:{'content-type':'text/html'}}));
  await assert.rejects(context.requestJSON('/poll'),/temporarily unavailable/);
  await assert.rejects(context.requestJSON('/submit',{method:'POST'}),/temporarily unavailable/);
});
test('plain-text reads are rejected',async()=>{
  const {context}=harness(async()=>new Response('Not JSON'));
  await assert.rejects(context.requestJSON('/recent'),/temporarily unavailable/);
});
test('API error surfaced without automatic write retry',async()=>{
  let calls=0;
  const {context,timers}=harness(async()=>{calls++;return Response.json({error:'Too many requests.'},{status:429})});
  await assert.rejects(context.requestJSON('/vote',{method:'POST'}),/Too many requests/);
  assert.equal(calls,1);assert.equal(timers.size,0);
});
test('timeout aborts request and clears timer',async()=>{
  const {context,timers}=harness((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})))));
  const promise=context.requestJSON('/recent');
  const timer=[...timers.values()][0];assert.equal(timer.ms,12000);timer.fn();
  await assert.rejects(promise,/taking too long/);assert.equal(timers.size,0);
});
test('malformed JSON releases timer',async()=>{
  const {context,timers}=harness(async()=>new Response('{',{headers:{'content-type':'application/json'}}));
  await assert.rejects(context.requestJSON('/poll'));assert.equal(timers.size,0);
});
test('poster URLs reject active content and invalid values',()=>{
  const {context}=harness(()=>{});
  for(const value of ['javascript:alert(1)','data:image/svg+xml,test','http://example.com/poster','garbage',null,undefined])assert.equal(context.safePoster(value),'');
  assert.equal(context.safePoster('https://example.com/poster.jpg'),'https://example.com/poster.jpg');
});
test('native accessible controls and responsive safeguards remain present',()=>{
  assert.match(html,/<dialog[^>]+aria-labelledby="theme-title"/);
  assert.match(script,/themePop\.showModal\(\)/);assert.match(script,/themePop\.close\(\)/);
  assert.match(html,/<form id="status-form">/);assert.match(script,/<button type="button" class="poll-choice/);
  for(const id of ['name','email','status-email'])assert.ok(html.includes(`for="${id}"`));
  assert.match(css,/@media\(max-width:700px\)/);assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(script,/setInterval\(|html\+html/);
});
test('preview is explicitly labeled and cannot silently replace production failures',()=>{
  assert.match(script,/new URLSearchParams\(location.search\)\.get\('preview'\) === '1'/);
  assert.doesNotMatch(script,/location.hostname !== 'welldonestreams.com'/);
  assert.match(html,/id="preview-notice"/);
  assert.match(script,/if\(IS_PREVIEW\).*no request was sent/);
  assert.match(script,/if\(IS_PREVIEW\).*no vote was sent/);
});
