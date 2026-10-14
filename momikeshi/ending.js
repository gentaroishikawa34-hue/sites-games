'use strict';
(() => {
const RATINGS=[
 {min:90,name:'世界制覇エンド',tag:'WE ARE THE WORLD!',text:['世界ツアーは連日満員。','彼女たちは、ついに世界的なトップアイドルとなった！','あなたは世界一のプロデューサーとして、その名を歴史に刻んだ。'],empty:'かつて世界を熱狂させたユニット。その名は記録に刻まれたが、今は全員が離脱し、活動を停止している。'},
 {min:70,name:'国民的アイドルエンド',tag:'NATIONAL STARS',text:['国内では知らない人がいないほどの大スターに成長。','世界進出まで、あと一歩。','彼女たちの挑戦は、まだまだ続く！'],empty:'国内で広く知られるまでになったユニット。しかしメンバーは全員離脱し、世界進出を前に活動を停止した。その名を覚えているファンは、今もいる。'},
 {min:40,name:'そこそこ人気エンド',tag:'OUR OWN SPOTLIGHT',text:['熱心なファンに支えられ、活動を続ける彼女たち。','世界制覇には届かなかったが、確かな足跡を残した。','夢は、まだ終わらない。'],empty:'熱心なファンに支えられ、確かな足跡を残したユニット。今はメンバー全員が離脱し、活動を停止している。残された記録が、3年間を物語っていた。'},
 {min:10,name:'地下アイドルエンド',tag:'A SMALL STAGE, A BIG DREAM',text:['観客は数人。','それでも彼女たちは、今日もステージに立ち続ける。','世界は広い。きっと、どこかにファンがいる。'],empty:'数人の観客が見守った、小さなステージ。今は全員が離脱し、ユニットは活動を停止している。空の客席には、あの日の歌声の記憶だけが残っていた。'},
 {min:0,name:'事務所崩壊エンド',tag:'THE LIGHTS GO OUT',text:['かつて世界を夢見たアイドルグループ。','今では、その名前を覚えている人もほとんどいない。','プロデューサーの3年間は、静かに幕を閉じた。'],empty:'かつて世界を夢見たアイドルグループ。メンバーは全員離脱し、活動を停止した。今では、その名前を覚えている人もほとんどいない。プロデューサーの3年間は、静かに幕を閉じた。'}
];
const LINES=[
 ['3年間、ありがとうございました！ 私、もっともっと頑張ります！','世界一になれたかどうかなんて、もうどうでもいいんです。私にとっては、あなたが世界一のプロデューサーですから！'],
 ['楽しかったー！ ねえ、もう3年くらいやらない？','プロデューサー、大好き！ これからもずっと応援してね！'],
 ['3年間って、36か月なんだね。初めて知った！','世界で一番好きなプロデューサーは、世界に一人しかいないんだよ！'],
 ['貴重な経験でした。いつか、この3年間を映画にしたいですね','この3年間は、どんな映画よりもドラマチックでした。あなたと過ごせて幸せでした'],
 ['なかなか刺激的な3年間だったわ。また一緒に仕事しましょうね♡','ふふっ。世界一のアイドルにはなれなくても、あなたの一番にはなれたかしら？']
];
const evaluate=s=>RATINGS.find(r=>s.popularity>=r.min)||RATINGS[4];
const message=(s,i)=>LINES[i][s.affection[i]>=80?1:0];
const contract=s=>['3 YEARS LATER','契約期間満了','あなたと彼女たちの、3年間が終わった。','数え切れないニュース。','歓声と批判。',s.coverups?'そして、消された数々の真実。':'そして、守り抜いた数々の約束。','果たして、あなたは世界を獲れたのか？'];
function mount(s,ctx){
 const {app,esc,portrait,persist,share,history,replay}=ctx;
 if(!['contract','results','messages'].includes(s.endingStage)){s.endingStage='contract';persist();}
 const rating=evaluate(s),active=s.active.map((v,i)=>v?i:-1).filter(i=>i>=0);
 const go=stage=>{s.endingStage=stage;persist();mount(s,ctx);window.scrollTo({top:0,behavior:'instant'});};
 const buttons=`<div class="end-buttons"><button class="primary" data-end-share>SNSで結果を共有 ↗</button><button data-end-history>ニュース履歴</button><button data-end-replay>もう一度プロデュースする ↻</button></div>`;
 if(s.endingStage==='contract'){
  app.innerHTML=`<section class="contract-ending" aria-label="契約満了"><div class="contract-lines">${contract(s).map((t,i)=>`<${i===1?'h1':'p'} style="--delay:${i*.65}s" class="contract-line ${i===0?'contract-en':''}">${esc(t)}</${i===1?'h1':'p'}>`).join('')}</div><button class="primary" id="endResults" style="--delay:4.6s">最終評価を見る →</button></section>`;
  app.querySelector('#endResults').onclick=()=>go('results');return;
 }
 if(s.endingStage==='results'){
  app.innerHTML=`<section class="ending"><div class="eyebrow">36 MONTHS / FINAL REPORT</div><div class="unit">${esc(s.name)}</div><h1>${rating.name}</h1><div class="end-tag">${rating.tag}</div>${active.length?`<div class="live-cast">${active.map(i=>portrait(i,1)).join('')}</div>`:''}<div class="end-score"><small>FINAL POPULARITY</small>${s.popularity}<span style="font-size:20px;color:#b999ce"> / 100</span></div><div class="end-description">${active.length?rating.text.map(t=>`<p>${esc(t)}</p>`).join(''):`<p>${esc(rating.empty)}</p>`}</div><div class="end-title">プロデューサー称号：<b>${esc(Game.title(s))}</b></div><div class="end-grid"><div><small>最終疑惑</small><strong>${s.suspicion}</strong></div><div><small>残存メンバー</small><strong>${active.length} / 5</strong></div><div><small>告白を受けた人数</small><strong>${s.accepted.filter(Boolean).length} / 5</strong></div><div><small>裏工作</small><strong>${s.coverups} 回</strong></div><div><small>大炎上</small><strong>${s.flare?'あり':'なし'}</strong></div><div><small>三すくみ勝利</small><strong>${s.wins} 回</strong></div></div><button class="primary full" id="endMessages">${active.length?'メンバーから、最後の一言 →':'最後の楽屋へ →'}</button><div style="margin-top:12px">${buttons}</div></section>`;
  app.querySelector('#endMessages').onclick=()=>go('messages');
 }else{
  app.innerHTML=`<section class="ending final-messages"><div class="eyebrow">THANK YOU, PRODUCER</div><div class="unit">${esc(s.name)}</div><h1>3年間、ありがとう。</h1>${active.length?`<div class="farewell-list">${active.map(i=>`<article class="farewell-card" data-member="${i}">${portrait(i,s.affection[i]>=80?3:1)}<div><h2>${Game.MEMBERS[i].name} <small>♥ ${s.affection[i]}</small></h2><p>「${esc(message(s,i))}」</p>${i===1||i===2?'<small class="kinship">憧れと親愛を込めて</small>':''}</div></article>`).join('')}</div>`:'<div class="empty-dressing-room"><p>楽屋には、もう誰もいない。</p><p>5人の名前が書かれた古いポスターだけが、壁に残されていた。</p></div>'}<button class="full" id="endBack" style="margin-bottom:14px">最終リザルトに戻る</button>${buttons}</section>`;
  app.querySelector('#endBack').onclick=()=>go('results');
 }
 app.querySelectorAll('[data-end-share]').forEach(b=>b.onclick=share);app.querySelectorAll('[data-end-history]').forEach(b=>b.onclick=history);app.querySelectorAll('[data-end-replay]').forEach(b=>b.onclick=replay);
}
globalThis.Ending={evaluate,message,contract,mount};
})();
