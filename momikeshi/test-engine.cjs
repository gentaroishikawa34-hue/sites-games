const assert=require('node:assert/strict');
require('./engine.js');require('./news.js');
const G=globalThis.Game,N=globalThis.NEWS;
assert.equal(N.length,200);assert.equal(N.filter(n=>n.serious).length,20);
for(const key of ['id','title','body','win','draw','lose'])assert.equal(new Set(N.map(n=>n[key])).size,200,`duplicate ${key}`);
N.forEach(n=>{assert([0,1,2].includes(n.attr));assert(n.members.length);assert(n.members.every(i=>i>=0&&i<5));if(n.serious)assert(n.truth&&n.exit);});
const matrix=[['draw','win','lose'],['lose','draw','win'],['win','lose','draw']];
for(let a=0;a<3;a++)for(let b=0;b<3;b++)assert.equal(G.outcome(a,b),matrix[a][b]);
const chooseNews=(s,n,fire=false)=>{s.current={...n,fire};s.phase=fire?'fireNews':'news';};
for(const serious of [false,true])for(const [outcome,actionOffset,delta] of [['win',2,serious?8:5],['draw',0,serious?-5:2],['lose',1,serious?-12:-4]]){
 const s=G.create('試験');s.popularity=50;const n=N.find(n=>n.serious===serious);chooseNews(s,n);assert(G.resolve(s,(n.attr+actionOffset)%3));assert.equal(s.popularity,50+delta);assert.equal(s.result.outcome,outcome);n.members.forEach(i=>assert.equal(s.affection[i],outcome==='win'?30:20));assert(!G.resolve(s,0),'double resolution rejected');
}
for(const high of [false,true]){const s=G.create('上限');s.popularity=high?99:1;const n=N.find(n=>n.serious);chooseNews(s,n);G.resolve(s,(n.attr+(high?2:1))%3);assert.equal(s.popularity,high?100:0);}
{
 const s=G.create('裏工作');const n=N.find(n=>n.serious);chooseNews(s,n);G.resolve(s,3);assert.equal(s.popularity,20);assert.equal(s.suspicion,10);assert.equal(s.history[0].truth,'');n.members.forEach(i=>assert.equal(s.affection[i],35));
 G.advance(s,N,()=>0);assert.equal(s.phase,'news');G.resolve(s,3);G.advance(s,N,()=>0);assert.equal(s.phase,'news','equality does not trigger');G.resolve(s,3);G.advance(s,N,()=>0);assert.equal(s.phase,'fireNotice');assert.equal(s.turn,2);G.advance(s,N,()=>0);assert(s.current.serious);assert.equal(s.phase,'fireNews');assert(!G.resolve(s,3));const ids=[...s.current.members];G.resolve(s,(s.current.attr+1)%3);ids.forEach(i=>assert(!s.active[i]));G.advance(s,N,()=>0);assert.equal(s.turn,3,'fire consumes no month');assert(!G.resolve(s,3),'cover permanently locked');assert(s.current.members.every(i=>s.active[i]));
}
{
 const s=G.create('低下炎上');s.suspicion=19;const n=N.find(n=>!n.serious);chooseNews(s,n);G.resolve(s,(n.attr+1)%3);G.advance(s,N);assert.equal(s.phase,'fireNotice','popularity drop triggers');
}
{
 const s=G.create('告白');const n=N.find(n=>n.members.length===2);assert(n,'duo news required');n.members.forEach(i=>s.affection[i]=75);chooseNews(s,n);G.resolve(s,(n.attr+2)%3);G.advance(s,N);assert.equal(s.phase,'confession');for(let j=0;j<n.members.length;j++)G.advance(s,N,()=>0);n.members.forEach(i=>assert(s.accepted[i]));chooseNews(s,n);G.resolve(s,(n.attr+2)%3);assert.equal(s.confessions.length,0);n.members.forEach(i=>s.affection[i]=99);chooseNews(s,n);G.resolve(s,(n.attr+2)%3);n.members.forEach(i=>assert.equal(s.affection[i],100));
}
{
 const s=G.create('最終月');s.turn=35;s.suspicion=30;chooseNews(s,N[0]);G.resolve(s,0);G.advance(s,N);assert.equal(s.phase,'fireNotice');G.advance(s,N);G.resolve(s,s.current.attr);G.advance(s,N);assert.equal(s.phase,'ending');assert.equal(s.turn,35);
}
{
 const s=G.create('全員離脱');s.active.fill(false);G.advance(s,N);for(let i=0;i<36;i++){assert.equal(s.current.members.length,0);G.resolve(s,0);G.advance(s,N);}assert.equal(s.phase,'ending');assert.equal(G.title(s),'孤独なプロデューサー');
}
{
 const s=G.create('未使用優先');s.used=N.filter(n=>n.serious).slice(0,19).map(n=>n.id);G.draw(s,N,()=>0,true);assert.equal(s.current.id,N.filter(n=>n.serious)[19].id);assert(!s.current.repeated);
}
let seed=82712;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let fireCount=0,confessCount=0;
for(let run=0;run<500;run++){
 let s=G.create('完走'+run);let steps=0,previous=[...s.affection];while(s.phase!=='ending'){
  assert(++steps<170);assert(G.valid(s));s=JSON.parse(JSON.stringify(s));
  if(['news','fireNews'].includes(s.phase)){assert(s.current.members.every(i=>s.active[i]));let action=run%5===0?(s.current.attr+2)%3:run%5===1&&!s.flare?3:Math.floor(random()*3);G.resolve(s,action);}
  else {if(s.phase==='confession')confessCount++;G.advance(s,N,random);}
  s.affection.forEach((n,i)=>assert(n>=previous[i]));previous=[...s.affection];
 }
 assert.equal(s.history.filter(h=>!h.fire).length,36);assert(s.history.filter(h=>h.fire).length<=1);assert.equal(new Set(s.used).size,s.used.length);assert.equal(s.turn,35);if(s.flare)fireCount++;
}
console.log(JSON.stringify({status:'PASS',news:N.length,normal:180,serious:20,completeRuns:500,fireRuns:fireCount,confessions:confessCount,checks:'matrix, deltas, clamps, secrecy, cover lock, departure, duo confession, no repeats, final-month interrupt, save roundtrips, zero-member fallback'}));
