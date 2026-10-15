const assert=require('node:assert/strict');require('./engine.js');require('./news.js');
const G=Game,N=NEWS;
function fixture(serious=true,fire=false){const s=G.create('難易度');s.popularity=50;s.current={...N.find(n=>n.serious===serious),fire};s.phase=fire?'fireNews':'news';s.flare=fire;return s;}
for(const fire of [false,true])for(const o of ['win','draw','lose'])for(const roll of [0,0.299999,0.3,0.999999]){
 let s=fixture(true,fire),calls=0;const target=s.current.members[0],a=(s.current.attr+({win:2,draw:0,lose:1}[o]))%3;
 s.affection[target]=80;G.resolve(s,a,()=>{calls++;return roll;});
 const leaves=o==='lose'&&(fire||roll<0.3);
 assert.equal(s.popularity,50+({win:0,draw:-10,lose:-25}[o]));
 assert.equal(calls,o==='lose'&&!fire?s.current.members.length:0);
 assert.equal(s.active[target],!leaves);assert.equal(s.result.departures.includes(target),leaves);
 assert.equal(s.confessions.includes(target),!leaves);assert.equal(s.affection[target],o==='win'?90:80);
 const before=JSON.stringify(s);s=JSON.parse(before);assert(G.valid(s));assert(!G.resolve(s,a,()=>{throw Error('reroll');}));assert.equal(JSON.stringify(s),before);
 if(leaves){G.draw(s,N,()=>0);assert(!s.current.members.includes(target));}
}
for(let popularity=0;popularity<=100;popularity++)for(let action=0;action<3;action++){
 const s=fixture(false);s.popularity=popularity;G.resolve(s,action,()=>{throw Error('normal departure roll');});assert(s.popularity>=popularity);assert.deepEqual(s.active,[true,true,true,true,true]);
}
// Exact 30% across evenly spaced random inputs, not a flaky sample.
let count=0;for(let i=0;i<1000;i++){const s=fixture();G.resolve(s,(s.current.attr+1)%3,()=>i/1000);count+=s.result.departures.length;}assert.equal(count,300);
const old=fixture();G.resolve(old,old.current.attr);delete old.result.departures;assert(G.valid(JSON.parse(JSON.stringify(old))));G.advance(old,N,()=>0);assert.equal(old.phase,'news');
const cover=fixture();G.resolve(cover,3,()=>{throw Error('cover departure roll');});assert.equal(cover.popularity,50);assert.equal(cover.suspicion,10);assert.deepEqual(cover.result.departures,[]);
console.log('PASS balance: deltas, 30% boundary, 100% fire without RNG, 303 normal outcomes, saved departures, legacy save, no duplicate rolls, departure exclusion.');
