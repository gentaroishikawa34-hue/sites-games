'use strict';
(() => {
const MEMBERS = [
 {name:'ララ',role:'正統派センター',color:'#f8a8ef',bio:'まっすぐな歌声で、みんなを真ん中から照らす。',confess:'ずっと、あなたのことを特別に思っていました。ステージの私だけじゃなく、弱い私も見てくれたから。これからも、あなたの隣で夢を見たいです。',reply:'その気持ち、受け止めるよ。これからも一緒に歩こう。'},
 {name:'リン',role:'バラエティ担当・未成年',color:'#ffb57e',bio:'ルゥとの掛け合いが武器。元気のよさは通常営業。',confess:'プロデューサーのこと、けっこう好きかも！……なーんて、冗談。……全部は冗談じゃないけど。いつか、あなたみたいに頼られる大人になりたいな。',reply:'伝えてくれてありがとう。憧れに応えられる大人として、リンの成長と夢を応援するよ。'},
 {name:'ルゥ',role:'バラエティ担当・未成年',color:'#7ce2ff',bio:'リンの相棒。天然のひと言が世界を置き去りにする。',confess:'大事な発表があります。プロデューサーは、私の心の給食当番です！……笑った？ 本当は、いつも安心させてくれる人って言いたかった。大好きな、憧れの人です。',reply:'素敵な言葉をありがとう。安心して挑戦できるように、これからも見守るよ。'},
 {name:'レイコ',role:'女優志望・演技派',color:'#bfadff',bio:'台本にも人生にも真剣。クールな表情の奥に熱がある。',confess:'次の役の、告白の練習に付き合って。……あなたが好きです。仕事が終わっても、隣にいてほしい。……今の、台本にはない言葉だから。',reply:'ちゃんと届いたよ。演技じゃない気持ちに、まっすぐ応えたい。'},
 {name:'ローラ',role:'大人の魅力・自信家',color:'#ffd78b',bio:'強気なステージと、意外に照れ屋な素顔の持ち主。',confess:'ねえ、私から誘われるなんて光栄でしょ？ 仕事の話はおしまい。今夜は、私の話を聞いて。……あなたの前だと、自信家でいられないの。好きよ。',reply:'話してくれてありがとう。ステージの外のあなたも、大切にしたい。'}
];
const clamp=n=>Math.max(0,Math.min(100,n));
// Older saves embed a snapshot of the news without choices; recover by its stable ID.
function choicesFor(n){return n.choices||globalThis.NEWS?.find(item=>item.id===n.id)?.choices||[
 {text:'活動の記録と今後の窓口を整理して公開する',outcome:'win'},
 {text:'留守番電話の案内を更新する',outcome:'draw'},
 {text:'確認せず活動再開を予告する',outcome:'lose'}];}
const outcome=(action,n)=>choicesFor(n)[action]?.outcome;
const title=s=>s.active.every(a=>!a)?'孤独なプロデューサー':s.popularity===100&&s.active.every(Boolean)?'伝説のプロデューサー':s.accepted.every(Boolean)?'愛されプロデューサー':s.flare&&s.popularity>=80?'スキャンダル王':'普通のプロデューサー';
function create(name){return {version:1,name:name.trim().slice(0,30)||'Starlume',turn:0,popularity:20,suspicion:0,affection:[20,20,20,20,20],active:[true,true,true,true,true],accepted:[false,false,false,false,false],used:[],phase:'intro',current:null,result:null,confessions:[],flare:false,coverups:0,wins:0,history:[]};}
const office=t=>({id:'O'+t,title:'活動休止の事務所、留守番電話がアンコールを要求',body:'{unit}の事務所では、留守番電話だけが今日も元気に稼働中。スタッフは再出発の準備を続けている。',members:[],serious:false,truth:'',win:'活動の記録を丁寧に公開。待っているファンから応援が届いた。',draw:'留守番電話の声が小さな話題に。再出発を待つ声が少し増えた。',lose:'案内が混乱し、問い合わせが迷子に。活動再開への期待が薄れた。'});
function available(s,n){return n.members.every(i=>s.active[i]);}
function draw(s,all,rng=Math.random,fire=false){
 let pool=all.filter(n=>available(s,n)&&!s.used.includes(n.id)&&(!fire||n.serious));
 let repeated=false;
 if(fire&&!pool.length){pool=all.filter(n=>available(s,n)&&n.serious);repeated=true;}
 let n=pool.length?pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))]:office(s.turn);
 if(fire&&!n.serious)n={...n,id:'OF'+s.turn,serious:true,title:'事務所の消しゴム、なぜか全部なくなる',truth:'事務所による情報隠蔽の疑惑が表面化。運営体制の説明が求められている。',exit:'活動停止'};
 if(!s.used.includes(n.id))s.used.push(n.id);
 s.current={...n,fire,repeated};s.result=null;s.phase=fire?'fireNews':'news';return s;
}
function resolve(s,action,rng=Math.random){
 if(!['news','fireNews'].includes(s.phase))return false;
 if(![0,1,2,3].includes(action)||action===3&&(s.flare||s.current.fire))return false;
 const n=s.current,before=s.popularity,affBefore=[...s.affection],departures=[];let o,delta;
 if(action===3){o='covered';delta=0;s.suspicion+=10;s.coverups++;n.members.forEach(i=>{if(s.active[i])s.affection[i]=clamp(s.affection[i]+15);});}
 else{o=outcome(action,n);delta=(n.serious?{win:0,draw:-10,lose:-25}:{win:5,draw:2,lose:0})[o];s.popularity=clamp(s.popularity+delta);if(o==='win'){s.wins++;n.members.forEach(i=>{if(s.active[i])s.affection[i]=clamp(s.affection[i]+10);});}if(n.serious&&o==='lose')n.members.forEach(i=>{if(s.active[i]&&(n.fire||rng()<0.30)){s.active[i]=false;departures.push(i);}});}
 s.confessions=n.members.filter(i=>s.active[i]&&!s.accepted[i]&&s.affection[i]>=80);
 s.result={outcome:o,action,delta,actual:s.popularity-before,before,affBefore,departures,choiceText:action===3?'裏工作する':choicesFor(n)[action].text};s.phase='result';
 s.history.push({turn:s.turn,title:n.title,fire:n.fire,outcome:o,change:s.popularity-before,choiceText:s.result.choiceText,truth:action===3?'':n.truth});return true;
}
function finishMonth(s,all,rng){if(s.turn>=35){s.phase='ending';return;}s.turn++;draw(s,all,rng);}
function after(s,all,rng){
 if(s.confessions.length){s.phase='confession';return;}
 if(!s.flare&&s.suspicion>s.popularity){s.flare=true;s.phase='fireNotice';return;}
 finishMonth(s,all,rng);
}
function advance(s,all,rng=Math.random){
 switch(s.phase){case 'intro':draw(s,all,rng);break;case 'result':after(s,all,rng);break;case 'confession':{const i=s.confessions.shift();if(i!==undefined&&s.active[i])s.accepted[i]=true;after(s,all,rng);break;}case 'fireNotice':draw(s,all,rng,true);break;}
 return s;
}
function valid(s){return !!s&&s.version===1&&typeof s.name==='string'&&Number.isInteger(s.turn)&&s.turn>=0&&s.turn<36&&Number.isFinite(s.popularity)&&s.popularity>=0&&s.popularity<=100&&Number.isFinite(s.suspicion)&&s.suspicion>=0&&['intro','news','fireNews','result','confession','fireNotice','ending'].includes(s.phase)&&['affection','active','accepted'].every(k=>Array.isArray(s[k])&&s[k].length===5)&&s.affection.every(n=>Number.isFinite(n)&&n>=0&&n<=100)&&s.active.every(n=>typeof n==='boolean')&&s.accepted.every(n=>typeof n==='boolean')&&Array.isArray(s.used)&&s.used.every(id=>typeof id==='string')&&Array.isArray(s.confessions)&&s.confessions.every(i=>Number.isInteger(i)&&i>=0&&i<5)&&Array.isArray(s.history)&&s.history.every(h=>h&&typeof h.title==='string')&&typeof s.flare==='boolean'&&Number.isInteger(s.coverups)&&Number.isInteger(s.wins)&&(s.phase!=='confession'||s.confessions.length>0)&&(!['news','fireNews','result'].includes(s.phase)||s.current&&Array.isArray(s.current.members))&&(s.phase!=='result'||s.result);}
globalThis.Game={MEMBERS,clamp,choicesFor,outcome,title,create,draw,resolve,advance,valid};
})();


