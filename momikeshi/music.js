'use strict';
/* Original, procedural game soundtrack. No audio files, APIs or network calls. */
(() => {
  const AudioClass = window.AudioContext || window.webkitAudioContext;
  const TRACKS = {
    title:      {bpm:122, chords:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]], bass:1,drums:1,lead:1},
    news:       {bpm:104, chords:[[62,65,69],[58,62,65],[53,57,60],[60,64,67]], bass:1,drums:.45,lead:.6},
    fire:       {bpm:132, chords:[[52,55,59],[53,57,60],[50,53,57],[52,55,59]], bass:1,drums:1,lead:.7},
    confession: {bpm:88,  chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], bass:0,drums:0,lead:.6},
    ending:     {bpm:124, chords:[[53,57,60],[60,64,67],[55,59,62],[57,60,64]], bass:1,drums:1,lead:1},
    quiet:      {bpm:82,  chords:[[57,60,64],[53,57,60],[50,53,57],[52,56,59]], bass:0,drums:0,lead:.35}
  };
  const LEAD = [0,-1,1,-1,2,-1,1,0,-1,2,1,-1,0,-1,2,-1];
  let ctx=null, master=null, bus=null, noise=null, timer=null, enabled=false, scene='title', cursor=0, step=0;
  const freq = midi => 440 * Math.pow(2,(midi-69)/12);
  function ready(){
    if(!AudioClass) return false;
    if(!ctx){
      ctx=new AudioClass();
      master=ctx.createGain();master.gain.value=.65;master.connect(ctx.destination);
      noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.19),ctx.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return true;
  }
  function note(midi,at,duration,kind='triangle',volume=.025,to=bus){
    if(!ctx||!to)return;
    const t=Math.max(at,ctx.currentTime+.002),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=kind;o.frequency.setValueAtTime(freq(midi),t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.014);
    g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(to);o.start(t);o.stop(t+duration+.02);
  }
  function percussion(kind,at,strength=1){
    if(!ctx||!bus)return;
    const t=Math.max(at,ctx.currentTime+.002);
    if(kind==='kick'){
      const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
      o.frequency.setValueAtTime(138,t);o.frequency.exponentialRampToValueAtTime(48,t+.17);
      g.gain.setValueAtTime(.10*strength,t);g.gain.exponentialRampToValueAtTime(.0001,t+.20);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+.21);
    }else{
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
      src.buffer=noise;filter.type=kind==='hat'?'highpass':'bandpass';
      filter.frequency.value=kind==='hat'?6500:1900;
      g.gain.setValueAtTime((kind==='hat'?.023:.055)*strength,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='hat'?.045:.12));
      src.connect(filter);filter.connect(g);g.connect(bus);
      src.start(t);src.stop(t+(kind==='hat'?.06:.14));
    }
  }
  function playStep(at){
    const track=TRACKS[scene],pos=step%64,part=pos%16,chord=track.chords[Math.floor(pos/16)];
    if(part%8===0){
      const dur=(60/track.bpm)*1.5;
      chord.forEach((m,i)=>note(m,at+i*.012,dur,scene==='confession'||scene==='quiet'?'sine':'triangle',.020));
    }
    if(track.bass && part%4===0){
      note(chord[0]-12,at,60/track.bpm*.35,'sawtooth',scene==='fire'?.032:.020);
    }
    if(track.drums){
      if(part%4===0)percussion('kick',at,track.drums);
      if(part===4||part===12)percussion('snare',at,track.drums*.55);
      if(part%2===0)percussion('hat',at,track.drums*.6);
    }
    if(track.lead && LEAD[part]>=0 && (scene!=='news'||part%4===0)){
      const index=LEAD[part];
      note(chord[index]+12,at,60/track.bpm*.32,scene==='confession'||scene==='quiet'?'sine':'square',.011*track.lead);
    }
    step++;
  }
  function schedule(){
    if(!enabled || document.hidden || !ctx || !bus) return;
    const ahead=ctx.currentTime+.28, length=60/TRACKS[scene].bpm/4;
    if(cursor<ctx.currentTime-.5)cursor=ctx.currentTime+.03;
    while(cursor<ahead){playStep(cursor);cursor+=length;}
  }
  function stop(){
    if(timer){clearInterval(timer);timer=null;}
    if(bus && ctx){
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(.0001,ctx.currentTime,.07);
      bus=null;
    }
  }
  function start(){
    stop();
    if(!enabled || document.hidden || !ready())return;
    bus=ctx.createGain();bus.gain.setValueAtTime(.0001,ctx.currentTime);
    bus.gain.linearRampToValueAtTime(.48,ctx.currentTime+.24);bus.connect(master);
    cursor=ctx.currentTime+.05;step=0;schedule();timer=setInterval(schedule,90);
  }
  function setScene(next){
    if(!TRACKS[next])next='news';
    if(scene===next)return;
    scene=next;
    if(enabled)start();
  }
  function enable(value){
    enabled=!!value && !!AudioClass;
    if(enabled)start();else stop();
    return enabled;
  }
  function cue(type){
    if(!enabled || !ready())return;
    const seq=type==='win'?[72,76,79,84]:type==='lose'?[52,49,45]:type==='heart'?[72,76,79,84,88]:
              type==='covered'?[69,66,62]:type==='draw'?[64,67]:[76,79];
    seq.forEach((m,i)=>note(m,ctx.currentTime+.04+i*(type==='heart'?.105:.075),
      type==='heart'?.26:.16,type==='lose'?'sawtooth':'sine',type==='lose'?.055:.048,master));
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(enabled)start();});
  window.addEventListener('pagehide',stop);
  window.GameMusic={enable,setScene,cue,isEnabled:()=>enabled};
})();
