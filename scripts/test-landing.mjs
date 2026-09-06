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
const admin=readFileSync(resolve(root,'admin.html'),'utf8');
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
test('admin script parses and allows clearing every option',()=>{
  new vm.Script(admin.match(/<script>([\s\S]*?)<\/script>/)[1]);
  assert.doesNotMatch(admin,/Add at least one option|if\s*\(!built.length\)/);
  assert.match(admin,/options: merged/);
});
test('empty poll hides entire card and restores layout when re-enabled',()=>{
  const card={hidden:false};const state={};
  const context=vm.createContext({document:{getElementById:()=>card,querySelector:()=>({classList:{toggle:(key,value)=>state[key]=value}})}});
  vm.runInContext(script.match(/function setPollVisible[^\n]+/)[0],context);
  context.setPollVisible(false);assert.equal(card.hidden,true);assert.equal(state['poll-empty'],true);
  context.setPollVisible(true);assert.equal(card.hidden,false);assert.equal(state['poll-empty'],false);
  assert.match(script,/setPollVisible\(options.length>0\)/);
  assert.match(script,/catch\{setPollVisible\(true\)/);
});
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
test('continuous shelf wraps smoothly and caps resume jumps',()=>{
  const source=script.match(/function scrollPosition\([^\n]+/)[0];
  const context=vm.createContext({});vm.runInContext(source,context);
  assert.equal(context.scrollPosition(99,50,100),.5999999999999943);
  assert.equal(context.scrollPosition(0,5000,100),1.6);
  assert.equal(context.scrollPosition(20,50,0),20);
});
test('scrolling has interaction, visibility and reduced-motion guards without a pause button',()=>{
  assert.doesNotMatch(html,/id="recent-pause"/);
  assert.match(script,/!motionPreference.matches&&!document.hidden&&!pauses.size&&shelfCycle/);
  assert.match(script,/cancelAnimationFrame\(shelfFrame\)/);
  assert.match(script,/motionPreference.addEventListener\('change',updateShelfMotion\)/);
  assert.match(script,/copy.setAttribute\('aria-hidden','true'\);copy.tabIndex=-1/);
  assert.match(script,/IntersectionObserver/);
});
function shelfHarness(){
  const events=new Map(),windowEvents=new Map(),timers=new Map(),frames=new Map();let id=0;
  const shelf={scrollLeft:0,clientWidth:320,addEventListener:(name,fn)=>events.set(name,fn),contains:()=>false};
  const context=vm.createContext({matchMedia:()=>({matches:false,addEventListener(){}}),
    document:{hidden:false,querySelector:()=>shelf,getElementById:()=>({addEventListener(){}}),addEventListener(){}},
    window:{addEventListener:(name,fn)=>windowEvents.set(name,fn)},
    setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i),
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:i=>frames.delete(i)});
  vm.runInContext(script.slice(script.indexOf('const shelf='),script.indexOf('let recentLoading=')),context);
  vm.runInContext('shelfCycle=1000;updateShelfMotion()',context);
  return {events,windowEvents,timers,frames,context,shelf};
}
test('native touch pointer cancellation does not restart automatic scrolling',()=>{
  const h=shelfHarness();assert.equal(h.frames.size,1);
  h.events.get('touchstart')();assert.equal(h.frames.size,0);
  h.events.get('pointerdown')({pointerType:'touch'});
  h.windowEvents.get('pointercancel')();assert.equal(h.frames.size,0);
  assert.equal(vm.runInContext("pauses.has('touch')",h.context),true);
});
test('mobile momentum extends quiet period and resumes from actual position',()=>{
  const h=shelfHarness();h.events.get('touchstart')();
  h.events.get('touchend')({touches:[]});assert.equal(h.frames.size,0);
  const timer=[...h.timers.keys()][0];h.shelf.scrollLeft=240;
  h.events.get('scroll')();assert.equal(h.timers.has(timer),false);
  assert.equal(h.frames.size,0);assert.equal(h.timers.size,1);
  [...h.timers.values()][0]();assert.equal(h.frames.size,1);
  assert.equal(vm.runInContext('shelfPosition',h.context),240);
  h.timers.clear();h.events.get('scroll')();assert.equal(h.timers.size,0);
});
test('preview is explicitly labeled and cannot silently replace production failures',()=>{
  assert.match(script,/new URLSearchParams\(location.search\)\.get\('preview'\) === '1'/);
  assert.doesNotMatch(script,/location.hostname !== 'welldonestreams.com'/);
  assert.match(html,/id="preview-notice"/);
  assert.match(script,/if\(IS_PREVIEW\).*no request was sent/);
  assert.match(script,/if\(IS_PREVIEW\).*no vote was sent/);
});
