const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const data=require('../dist/motion-data.js');
const original=JSON.parse(fs.readFileSync(require.resolve('../content/animation-scripts.json'),'utf8'));
assert.deepEqual(data,original,'generated captions and editable source must stay identical');

// A small DOM/timer boundary lets us check playback and stale speech callbacks
// without depending on a device voice, wall-clock waits, or a browser package.
class Node {
  constructor(dataset={}){this.dataset=dataset;this.attributes=new Map();this.children=new Map();this.textContent='';this.innerHTML='';this.classList={add(){}};}
  setAttribute(k,v){this.attributes.set(k,String(v));}
  getAttribute(k){return this.attributes.get(k)??null;}
  removeAttribute(k){this.attributes.delete(k);}
  hasAttribute(k){return this.attributes.has(k);}
  querySelector(k){return this.children.get(k);}
  querySelectorAll(k){return k==='[data-lesson-step]'?this.steps||[]:[];}
  closest(k){return k==='button'?this:k==='[data-lesson]'?this.lesson:null;}
}
const events=new Map(),timers=new Map();let clock=0,nextTimer=0,voiceAvailable=true,cancels=0;
const spoken=[];
const doc={body:{dataset:{motion:'full'}},hidden:false,addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:event=>events.get(event.type)?.(event)};
const win={BookMotionData:data,matchMedia:()=>({matches:false}),addEventListener:(name,fn)=>events.set(name,fn),speechSynthesis:{getVoices:()=>voiceAvailable?[{name:'fixture',lang:'zh-CN',localService:true}]:[],cancel:()=>cancels++,speak:u=>spoken.push(u)}};
function Utterance(text){this.text=text;}win.SpeechSynthesisUtterance=Utterance;
const context={window:win,document:doc,SpeechSynthesisUtterance:Utterance,CustomEvent:class{constructor(type){this.type=type;}},setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{at:clock+ms,fn});return id;},clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/animated-lessons.js'),'utf8'),context);
const api=win.BookAnimations;
function advance(ms){const end=clock+ms;let turns=0;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;assert.ok(turns++<100,'no automatic loop');clock=next[1].at;timers.delete(next[0]);next[1].fn();}clock=end;}
function fixture(id){
  const scene=data.scenes.find(s=>s.id===id),el=new Node({lesson:id});
  for(const key of ['.lesson-transcript','.lesson-status','[data-lesson-stage]','[data-lesson-counter]','[data-lesson-step-title]','[data-lesson-caption]'])el.children.set(key,new Node());
  for(const action of ['play','prev','next','voice','reset']){const b=new Node({lessonAction:action});b.lesson=el;el.children.set(`[data-lesson-action="${action}"]`,b);}
  el.steps=scene.steps.map((s,i)=>{const b=new Node({lessonStep:String(i)});b.setAttribute('data-lesson-step',i);b.lesson=el;return b;});
  const container={querySelectorAll:()=>[el],contains:()=>true};api.mount(container);
  return {el,scene,click:action=>api.handle({target:typeof action==='number'?el.steps[action]:el.querySelector(`[data-lesson-action="${action}"]`)},container),counter:()=>el.querySelector('[data-lesson-counter]').textContent,status:()=>el.querySelector('.lesson-status').textContent};
}

let f=fixture('rectangles');
assert.equal(timers.size,0,'nothing starts on mount');
f.click('play');advance(api.duration(f.scene.steps[0].caption)+1);assert.equal(f.counter(),'第 2 / 6 步');
f.click('play');advance(60000);assert.equal(f.counter(),'第 2 / 6 步','pause freezes progress');
f.click('next');assert.equal(f.counter(),'第 3 / 6 步');f.click('prev');assert.equal(f.counter(),'第 2 / 6 步');f.click('reset');assert.equal(f.counter(),'第 1 / 6 步');
f.click(5);f.click('play');advance(20000);assert.equal(f.counter(),'第 6 / 6 步');assert.ok(f.status().includes('看完了'));assert.equal(timers.size,0,'animation ends without looping');
api.dispose();

f=fixture('occlusion');voiceAvailable=false;f.click('voice');assert.ok(f.status().includes('没有可用的中文'));assert.equal(timers.size,0,'voice unavailable does not unexpectedly start playback');
voiceAvailable=true;f.click('voice');const old=spoken.at(-1);f.click('play');old.onend();advance(60000);assert.equal(f.counter(),'第 1 / 5 步','late speech completion cannot restart a paused lesson');assert.ok(cancels>0);
f.click('voice');f.click('play');doc.hidden=true;events.get('visibilitychange')();advance(60000);assert.equal(f.counter(),'第 1 / 5 步','hidden page stays paused');doc.hidden=false;
api.dispose();

doc.body.dataset.motion='reduced';f=fixture('leaf');f.click('play');assert.equal(f.counter(),'第 2 / 4 步');assert.equal(timers.size,0,'reduced motion advances only on request');
f.click('voice');const single=spoken.at(-1);single.onend();advance(1000);assert.equal(f.counter(),'第 2 / 4 步');assert.equal(timers.size,0,'static narration never advances the image');
f.click('voice');const leaving=spoken.at(-1);api.dispose();leaving.onend();advance(60000);assert.equal(timers.size,0,'leaving a chapter cancels pending narration');

const html=data.scenes.map(s=>api.render(s.visual)).join('');
assert.equal(data.scenes.reduce((n,s)=>n+s.steps.length,0),35);
assert.equal((html.match(/class="storyboard-frame"/g)||[]).length,35,'every step has a no-script illustrated fallback');
for(const scene of data.scenes)for(const step of scene.steps)assert.ok(html.includes(step.caption),'every caption remains readable without playback');
assert.equal(api.chooseVoice([{lang:'en-US'},{lang:'yue-HK'}]),null,'do not silently read Chinese in the wrong language');
assert.equal(api.chooseVoice([{lang:'zh-CN',localService:false},{lang:'zh-TW',localService:true}]).lang,'zh-TW','prefer an available local Chinese voice');
console.log('PASS: 7 scenes, 35 captions, manual playback, pause, completion, unavailable voice, stale callbacks, background pause, reduced-motion narration, chapter cleanup.');
