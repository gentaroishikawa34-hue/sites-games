// DOM integration checks. This is not a browser-rendering or device test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const memory=new Map();
function boot(save){
 const {window}=parseHTML(html);const document=window.document;
 if(save)memory.set('momikeshi-producer-v1',JSON.stringify(save));
 const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 document.querySelector('#dialog').showModal=function(){this.open=true;};document.querySelector('#dialog').close=function(){this.open=false;};
 const sandbox={window,document,localStorage,console,matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout:()=>{},location:{protocol:'https:',href:'https://example.test/momikeshi/'},navigator:{},Math};window.scrollTo=()=>{};
 vm.createContext(sandbox);for(const f of ['news.js','engine.js','ending.js','music.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),sandbox,{filename:f});
 return {sandbox,document,click(sel){const el=document.querySelector(sel);assert(el,sel);el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));},saved:()=>JSON.parse(memory.get('momikeshi-producer-v1'))};
}
let env=boot();assert.match(env.document.querySelector('#app').textContent,/もみけして/);env.click('#begin');assert.match(env.document.querySelector('#app').textContent,/世界を獲れ/);env.click('#storyNext');assert.equal(env.document.querySelectorAll('.story-members article').length,5);env.click('#storyNext');env.document.querySelector('#unitName').value='<夢&光>';env.document.querySelector('#newGame').dispatchEvent(new env.sandbox.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(env.saved().name,'<夢&光>');assert.equal(env.document.querySelector('.unit').textContent,'<夢&光>');assert.equal(env.document.querySelectorAll('[data-action]').length,4);
env.click('[data-action="0"]');assert.equal(env.saved().phase,'result');const result=env.saved();env=boot();env.click('#resume');assert.equal(env.saved().phase,'result');assert.match(env.document.querySelector('#app').textContent,/RESPONSE RESULT/);
let steps=0;while(env.saved().phase!=='ending'){
 assert(++steps<150);const s=env.saved();if(['news','fireNews'].includes(s.phase))env.click('[data-action="0"]');else if(s.phase==='confession')env.click('#accept');else env.click('[data-next]');
}
assert(env.document.querySelector('#endResults'));env.click('#endResults');assert(env.document.querySelector('[data-end-share]'));assert.match(env.document.querySelector('#app').textContent,/FINAL REPORT/);env.click('#endMessages');assert(env.document.querySelector('.farewell-list'));env.click('[data-end-replay]');assert(env.document.querySelector('#unitName'));
const G=env.sandbox.Game,news=env.sandbox.NEWS;
const pick=(n,o)=>G.choicesFor(n).findIndex(c=>c.outcome===o);
const serious=news.find(n=>n.serious);let s=G.create('秘密');s.phase='news';s.current={...serious,fire:false};env=boot(s);env.click('#resume');assert(!env.document.querySelector('#app').textContent.includes(serious.truth));assert(!env.document.querySelector('.truth'));env.click('[data-action="3"]');assert(!env.document.querySelector('.truth'));assert.equal(env.saved().history[0].truth,'');
s=G.create('告白確認');s.affection[0]=80;s.phase='confession';s.confessions=[0];env=boot(s);env.click('#resume');assert(env.document.querySelector('#accept'));env.click('#accept');assert(env.saved().accepted[0]);
s=G.create('炎上確認');s.phase='fireNotice';s.flare=true;s.suspicion=30;env=boot(s);env.click('#resume');env.click('[data-next]');assert(env.document.querySelector('[data-action="3"]').disabled);const f=env.saved().current;env.click(`[data-action="${pick(f,'lose')}"]`);assert(env.document.querySelector('.leave'));assert(env.document.querySelector('.truth'));env.click('[data-next]');assert(env.document.querySelector('[data-action="3"]').disabled);
console.log('PASS DOM integration: prologue, names/XSS escaping, 36 months through buttons, ending, replay, save/resume, hidden truth, coverup, confession, fire and departure. No rendered-browser test performed.');


for(const leaves of [false,true]){
 s=G.create('通常重大・離脱結果');s.popularity=50;s.phase='news';s.current={...serious,fire:false};G.resolve(s,pick(serious,'lose'),()=>leaves?0:0.3);
 env=boot(s);env.click('#resume');assert.equal(!!env.document.querySelector('.leave'),leaves);assert.equal(env.saved().popularity,25);
 const savedBefore=JSON.stringify(env.saved());env=boot();env.click('#resume');assert.equal(JSON.stringify(env.saved()),savedBefore);assert.equal(!!env.document.querySelector('.leave'),leaves);
}
// Legacy result saves have no departures field and must remain readable.
s=G.create('旧セーブ');s.phase='fireNews';s.flare=true;s.current={...serious,fire:true};G.resolve(s,pick(serious,'lose'));delete s.result.departures;env=boot(s);env.click('#resume');assert(env.document.querySelector('.leave'));
console.log('PASS new and legacy departure result UI, resume without reroll.');


// All 200 news render their own labels, never outcome keys or the serious truth.
for(const n of news){
 s=G.create('専用選択肢');s.phase='news';s.current={...n,fire:false};env=boot(s);env.click('#resume');
 const buttons=[...env.document.querySelectorAll('.commands button')];assert.equal(buttons.length,3);
 buttons.forEach((b,i)=>{assert(b.textContent.includes(n.choices[i].text));assert(!b.hasAttribute('data-outcome'));});
 assert(!env.document.querySelector('.truth'));if(n.serious)assert(!env.document.querySelector('#app').textContent.includes(n.truth));
}
// An unprocessed legacy news snapshot gets the new labels by ID.
s=G.create('旧ニュース');s.phase='news';s.current={...serious,fire:false,attr:1};delete s.current.choices;env=boot(s);env.click('#resume');env.click(`[data-action="${pick(serious,'win')}"]`);assert.equal(env.saved().result.outcome,'win');assert(env.document.querySelector('#app').textContent.includes(env.saved().result.choiceText));
console.log('PASS all 200 dedicated-choice screens and legacy news migration.');
