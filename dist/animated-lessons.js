'use strict';
(function(root,factory){
  let data=root.BookMotionData;
  if(typeof module!=='undefined'){try{data=require('./motion-data.js');}catch{data={scenes:[]};}}
  const api=factory(data||{scenes:[]});
  if(typeof module!=='undefined')module.exports=api;else root.BookAnimations=api;
})(typeof window!=='undefined'?window:{},function(data){
  const scenes=new Map((data.scenes||[]).map(s=>[s.visual,s]));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const line=(x1,y1,x2,y2,cls='diagram-line')=>`<path class="${cls}" d="M${x1} ${y1}L${x2} ${y2}"/>`;
  const label=(x,y,t,cls='',anchor='middle')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  const svg=(body,height=260)=>`<svg viewBox="0 0 360 ${height}" aria-hidden="true" focusable="false">${body}</svg>`;
  const card=(x,y,w,h,body,cls='')=>`<g class="diagram-card ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${body}</g>`;
  const dot=(x,y,n,cls='')=>`<g class="diagram-count ${cls}"><circle cx="${x}" cy="${y}" r="14"/>${label(x,y+6,n)}</g>`;
  const arrow=(x1,y1,x2,y2)=>`${line(x1,y1,x2,y2,'diagram-arrow')}${line(x2-6,y2-6,x2,y2,'diagram-arrow')}${line(x2-6,y2+6,x2,y2,'diagram-arrow')}`;
  const tag=(text,cls='')=>`<span class="lesson-tag ${cls}">${text}</span>`;

  function pencils(step){
    if(step===0)return `<div class="question-slip" data-motion="rise"><span>只听见一句话</span><strong>桌上有几支笔？</strong><div class="big-question">？</div></div>`;
    let body='<rect class="table-surface" x="8" y="8" width="344" height="236" rx="8"/>';
    for(let i=0;i<4;i++){
      const x=48+i*55;
      body+=`<g class="pencil pencil-${i}" transform="translate(${x} 40)"><path d="M0 20L8 0L16 20V139H0Z"/><path class="pencil-grain" d="M8 27V126"/><path class="pencil-tip" d="M0 20L8 0L16 20Z"/></g>`;
      if(i<3||step>=3)body+=dot(x+8,211,String(i+1),i===3?'new-count':'');
    }
    body+=`<g class="pencil-case" ${step>=3?'transform="translate(89 73)"':''} ${step===3?'data-motion="bag"':''}><rect x="190" y="24" width="132" height="140" rx="12"/><path d="M203 47H309"/><circle cx="301" cy="47" r="4"/></g>`;
    if(step===2)body+=`<g data-motion="rise"><ellipse class="question-ring" cx="221" cy="174" rx="23" ry="25"/>${label(278,196,'？','question-mark')}</g>`;
    if(step>=3)body+=`<path class="reveal-ring" d="M203 188H231" data-motion="trace" pathLength="1"/>`;
    return svg(body)+`<div class="diagram-labels">${tag(step>=3?'现在能确认 4 支':'完整看见 3 支')}${tag(step>=3?'清楚的信息补上了':'遮挡处：先留一个问号','quiet-tag')}</div>`;
  }

  function training(step){
    const trainingActive=step<2;
    const nodes=[{x:30,t:'材料'},{x:135,t:'预测'},{x:240,t:'参数'}];
    let body=label(20,28,'训练时','row-label','start');
    for(const n of nodes)body+=card(n.x,47,88,58,label(n.x+44,83,n.t),trainingActive?'focus-card':'muted-card');
    body+=arrow(121,75,128,75)+arrow(226,75,233,75);
    if(step===1){for(let i=0;i<3;i++){body+=`${line(253,117+i*12,316,117+i*12,'parameter-rail')}<circle class="parameter-dot" data-motion="slider" style="--slider-distance:${[19,-14,11][i]}px" cx="${[262,302,270][i]}" cy="${117+i*12}" r="4"/>`;}}
    body+=line(20,166,340,166,'row-divider')+label(20,197,'回答时','row-label','start');
    if(step>=2){
      body+=card(22,218,133,62,label(88,257,'现有模型'),'focus-card')+label(181,258,'＋','math-sign')+card(207,218,132,62,label(273,257,'当前材料'),'focus-card');
    }else body+=label(180,251,'先把本领练好','muted-label');
    return svg(body,301)+(step===1?'<div class="answer-strip" data-motion="rise">预测的后文 ↔ 材料中的后文<br>比一比，再调整参数</div>':'')+(step>=3?`<div class="condition-landing" ${step===3?'data-motion="slide"':''}>${tag('纸桥跨度 15 厘米')}<span>放进这次的材料里</span></div>`:'')+(step===4?'<div class="answer-strip" data-motion="rise">用现有本领和当前材料，生成这次回答</div>':'');
  }

  function memory(step){
    let body=card(15,30,125,174,label(77,64,'资料柜'),'archive-card');
    body+=line(27,85,128,85)+line(27,136,128,136)+line(27,184,128,184);
    body+=card(211,106,132,111,label(277,140,'当前材料'),'desk-card')+line(196,227,352,227,'desk-line');
    if(step===0)body+=card(33,100,89,59,label(77,136,'周六'),'old-card');
    if(step===1)body+=`<g data-motion="transfer">${card(147,32,104,67,label(199,73,'周六'),'old-card')}</g>`;
    if(step===2)body+=card(142,23,96,64,label(190,63,'周六'),'old-card')+card(247,24,96,64,label(295,63,'周日'),'fresh-card')+line(153,53,227,53,'crossed-date');
    if(step>=3)body+=card(33,99,89,59,label(77,136,'周六'),'old-card')+`<g ${step===3?'data-motion="slide"':''}>${card(226,158,102,46,label(277,189,'周日'),'fresh-card')}</g>`;
    if(step>=1)body+=`<path class="memory-path" d="M76 21Q178 -10 277 92" data-motion="trace" pathLength="1"/>`;
    return svg(body,254)+`<div class="diagram-labels">${tag(['保存过的旧记录','找出来，再核对','日期已经变了','这次用最新日期','保存 → 找回并核对 → 使用'][step])}</div>`;
  }

  function agent(step){
    if(step===0)return `<div class="task-slip" data-motion="rise"><span>老师的任务</span><strong>整理 A、B、C 的观察清单</strong><ul><li>只用给出的材料</li><li>有争议，先标明</li><li>只观察，不采摘</li></ul></div>`;
    const rows=['A','B','C'].map((item,i)=>`<div class="plant-row ${i===2?'pending-row':''}" ${step===1?`data-motion="rise" data-delay="${i*160}"`:''}><span>${item}</span><strong>${i<2?'能与资料对应':step===1?'两种可能？':'名称待确认'}</strong><b aria-hidden="true">${i<2?'✓':'？'}</b></div>`).join('');
    const branch=step===2?`<div class="agent-choice-paths"><div class="blocked-path" data-motion="rise"><span>随意填名</span><strong>猜测还没有变成事实</strong></div><div class="open-path" data-motion="slide"><span>留下问号</span><strong>让老师看见缺少什么</strong></div></div>`:'';
    const outcome=step>=3?`<div class="handoff-slip" data-motion="slide"><span>${step===4?'交给老师检查':'下一步需要什么'}</span><p>${step===4?'A、B 已整理；C 待确认。只观察，不采摘。':'请老师补充能分清 C 名称的材料。'}</p>${step===4?'<strong>草稿先到这里</strong>':''}</div>`:'';
    return `<div class="plant-list">${rows}</div>${branch}${outcome}`;
  }

  function rectangle(w,h,x,y,area=false,trace=false){
    const unit=13;
    let cells='';if(area)for(let i=0;i<w*h;i++)cells+=`<rect class="tile" x="${x+i%w*unit}" y="${y+Math.floor(i/w)*unit}" width="${unit}" height="${unit}" data-motion="fill" data-delay="${i*35}"/>`;
    return `<g>${cells}<rect class="shape-edge" x="${x}" y="${y}" width="${w*unit}" height="${h*unit}"/>${trace?`<path class="traced-edge" pathLength="1" d="M${x} ${y}h${w*unit}v${h*unit}h-${w*unit}Z" data-motion="trace"/>`:''}</g>`;
  }
  function rectangles(step){
    let body='';
    if(step<4){
      body+=rectangle(9,1,24,91,step>=2,step===1)+rectangle(4,4,245,71,step>=2,step===1);
      body+=label(82,161,'1 × 9')+label(271,161,'4 × 4');
    }else if(step===4){
      body+=rectangle(3,2,62,89,true,true)+rectangle(5,4,239,76,true,true);
      body+=label(82,164,'2 × 3')+label(271,164,'4 × 5');
    }else{
      body+=rectangle(9,1,24,42,true)+rectangle(4,4,245,23,true)+label(82,103,'1 × 9')+label(271,103,'4 × 4');
      body+=rectangle(3,2,62,158,true)+rectangle(5,4,239,145,true)+label(82,230,'2 × 3')+label(271,230,'4 × 5');
    }
    let metrics='';
    if(step===1)metrics='<div><span>左边的周长</span><strong>20 厘米</strong></div><div><span>右边的周长</span><strong>16 厘米</strong></div>';
    if(step===2)metrics='<div><span>左边的面积</span><strong>9 平方厘米</strong></div><div><span>右边的面积</span><strong>16 平方厘米</strong></div>';
    if(step===3)metrics='<div><span>周长更大</span><strong>20 厘米 ＞ 16 厘米</strong></div><div><span>面积却更小</span><strong>9 平方厘米 ＜ 16 平方厘米</strong></div>';
    if(step===4)metrics='<div><span>边长 2 厘米、3 厘米</span><strong>周长 10 厘米</strong><strong>面积 6 平方厘米</strong></div><div><span>边长 4 厘米、5 厘米</span><strong>周长 18 厘米</strong><strong>面积 20 平方厘米</strong></div>';
    if(step===5)metrics='<div><span>边长 1 厘米、9 厘米</span><strong>周长 20 厘米</strong><strong>面积 9 平方厘米</strong></div><div><span>边长 4 厘米、4 厘米</span><strong>周长 16 厘米</strong><strong>面积 16 平方厘米</strong></div><div><span>边长 2 厘米、3 厘米</span><strong>周长 10 厘米</strong><strong>面积 6 平方厘米</strong></div><div><span>边长 4 厘米、5 厘米</span><strong>周长 18 厘米</strong><strong>面积 20 平方厘米</strong></div>';
    return svg(body,step===5?258:187)+`<div class="diagram-labels">${tag('尺寸单位：厘米','quiet-tag')}${step>=2?tag('每个小方格：1 平方厘米','quiet-tag'):''}</div>`+(metrics?`<div class="lesson-metrics" data-motion="rise">${metrics}</div>`:'');
  }

  function leaf(step){
    if(step===3){
      const body=`${line(25,200,340,200,'reference-plane')}<g transform="rotate(-35 50 175)" data-motion="tilt">${line(50,175,290,175,'true-length')}</g>${line(246.6,37.3,246.6,200,'projection-guide')}${line(50,175,50,200,'projection-guide')}${line(50,200,246.6,200,'projected-length')}${label(80,34,'实际长度没变','small-label','start')}${label(177,237,'投影变短','small-label')}`;
      return svg(body)+tag('侧面示意：同一条线段','quiet-tag');
    }
    let body=`<path class="leaf-shape" d="M139 203C51 145 75 76 139 22C207 73 223 146 139 203Z"/><path class="leaf-vein" d="M139 22V203M139 103L98 79M139 142L93 117M139 96L176 70M139 144L186 107"/><path class="leaf-stem" d="M139 203L161 245"/>`;
    body+=label(178,34,'叶尖','small-label','start')+label(179,204,'叶片基部','small-label','start')+label(186,251,'叶柄','small-label','start');
    if(step>=1)body+=`<path class="leaf-measure" d="M52 203V22M45 22H59M45 203H59" pathLength="1" ${step===1?'data-motion="trace"':''}/>${line(58,22,139,22,'projection-guide')}${line(58,203,139,203,'projection-guide')}`;
    if(step===2){
      let ticks='';for(let i=0;i<10;i++)ticks+=line(15,22+i*20,28+(i%2?0:7),22+i*20,'ruler-tick');
      body+=`<g data-motion="slide"><rect class="ruler" x="10" y="15" width="31" height="200" rx="2"/>${ticks}</g>`;
    }
    return svg(body,270)+`<div class="diagram-labels">${tag(step===0?'先约定量哪一段':step===1?'这次不计入叶柄':'标尺与叶片在同一平面')}</div>`;
  }

  function evidence(step){
    const claim=step===4?'1998 年已经存在':'建于 1998 年？';
    const top=`<div class="citation-slip ${step===4?'revised-slip':''}" data-motion="rise"><span>${step===4?'改到证据能支持的地方':'准备核对的说法'}</span><strong>${claim}</strong>${step===4?'<p>具体建造年份，仍待查证。</p>':''}</div>`;
    if(step===0)return top+'<div class="evidence-wait">带着问题，去看原文。</div>';
    if(step===1)return top+'<div class="archive-page" data-motion="slide"><span>《溪桥小记》· 第 37 页</span><strong>1998 年的桥梁照片</strong><p>拍摄日期与桥的身份已核实；没有写建造年份。</p></div>';
    let body=line(32,108,338,108,'timeline-axis');
    body+=dot(80,108,'？','unknown-dot')+dot(200,108,'✓')+label(80,166,'何时建造','small-label')+label(201,52,'1998','small-label')+label(201,199,'已经存在','small-label');
    if(step>=3)body+=dot(319,108,'✓')+label(317,52,'2021','small-label')+label(306,166,'维修','small-label');
    body+=`<path class="evidence-reach" d="M112 108H177" data-motion="trace" pathLength="1"/>`;
    return top+svg(body,221);
  }

  function drawing(id,step){
    const draw={occlusion:pencils,training,memory,agent,rectangles,leaf,evidence}[id];
    return draw?draw(step):'';
  }
  function render(visual){
    const scene=scenes.get(visual);if(!scene||!scene.steps?.length)return '';
    const first=scene.steps[0];
    return `<section class="animated-lesson" data-lesson="${esc(scene.id)}" id="visual-${esc(visual)}" aria-labelledby="lesson-title-${esc(scene.id)}"><div class="lesson-heading"><p class="lesson-eyebrow">会动的小图解 <span>${scene.steps.length} 步 · 可以慢慢看</span></p><h3 id="lesson-title-${esc(scene.id)}">${esc(scene.title)}</h3></div><p class="lesson-boundary">${esc(scene.boundary)}</p><div class="lesson-live"><div class="lesson-stage" data-lesson-stage role="img" aria-label="${esc(first.alt)}">${drawing(scene.id,0)}</div><div class="lesson-caption" aria-live="polite" aria-atomic="true"><span data-lesson-counter>第 1 步</span><h4 data-lesson-step-title>${esc(first.title)}</h4><p data-lesson-caption>${esc(first.caption)}</p></div><div class="lesson-controls"><button class="lesson-play" data-lesson-action="play" aria-pressed="false"><span aria-hidden="true">▶</span> 播放动画</button><button data-lesson-action="prev" aria-label="上一步图解" disabled>上一步</button><button data-lesson-action="next" aria-label="下一步图解">下一步</button><button class="lesson-voice" data-lesson-action="voice" aria-pressed="false">听解说</button></div><div class="lesson-step-nav" role="group" aria-label="选择动画步骤">${scene.steps.map((s,i)=>`<button data-lesson-step="${i}" aria-label="第 ${i+1} 步：${esc(s.title)}" ${i===0?'aria-current="step"':''}><span aria-hidden="true">${i+1}</span></button>`).join('')}<button class="lesson-reset" data-lesson-action="reset">从头看</button></div><p class="lesson-status" role="status"></p></div><details class="lesson-transcript" open><summary>一次看完图解与解说</summary><ol>${scene.steps.map((s,i)=>`<li><h4>${i+1} · ${esc(s.title)}</h4><div class="storyboard-frame" role="img" aria-label="${esc(s.alt)}">${drawing(scene.id,i)}</div><p>${esc(s.caption)}</p></li>`).join('')}</ol></details></section>`;
  }

  const players=new Set();let active=null;let voiceOwner=null;let initialized=false;
  const reduced=()=>typeof window!=='undefined'&&(document.body.dataset.motion==='reduced'||window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const duration=text=>Math.max(5500,Math.min(17000,Array.from(text).length/4.4*1000+900));
  function chooseVoice(voices){
    return [...voices].filter(v=>/^(zh(?:[-_](?:CN|SG|TW|Hans|Hant))?|cmn)(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(/^zh[-_]CN$/i.test(b.lang))-Number(/^zh[-_]CN$/i.test(a.lang)))[0]||null;
  }
  function cancelSpeech(p){
    if(voiceOwner===p){voiceOwner=null;window.speechSynthesis?.cancel();}
    p.utterance=null;
  }
  function cancelRun(p){
    p.token++;clearTimeout(p.timer);clearTimeout(p.watchdog);cancelSpeech(p);p.animations.forEach(a=>a.cancel());p.animations=[];
  }
  function updateControls(p){
    const $=s=>p.el.querySelector(s),last=p.step===p.scene.steps.length-1;
    $('[data-lesson-action="play"]').innerHTML=p.playing?(p.singleStep?'Ⅱ 暂停解说':'Ⅱ 暂停动画'):reduced()?'逐步看图解':p.ended?'↺ 再看一次':p.started?'▶ 继续播放':'▶ 播放动画';
    $('[data-lesson-action="play"]').setAttribute('aria-pressed',String(p.playing));
    $('[data-lesson-action="prev"]').disabled=p.step===0;
    $('[data-lesson-action="next"]').disabled=last;
    $('[data-lesson-action="voice"]').setAttribute('aria-pressed',String(reduced()?p.voice&&p.playing:p.voice));
    $('[data-lesson-action="voice"]').textContent=p.voice?(reduced()?(p.playing?'暂停解说':'再听这一幅'):'解说 · 开'):'听解说';
    p.el.querySelectorAll('[data-lesson-step]').forEach((b,i)=>{if(i===p.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  }
  function announce(p,text){p.el.querySelector('.lesson-status').textContent=text;}
  function show(p){
    const step=p.scene.steps[p.step],stage=p.el.querySelector('[data-lesson-stage]');
    stage.innerHTML=drawing(p.scene.id,p.step);stage.setAttribute('aria-label',step.alt);stage.dataset.step=String(p.step);
    p.el.querySelector('[data-lesson-counter]').textContent=`第 ${p.step+1} / ${p.scene.steps.length} 步`;
    p.el.querySelector('[data-lesson-step-title]').textContent=step.title;
    p.el.querySelector('[data-lesson-caption]').textContent=step.caption;
    updateControls(p);
  }
  function animate(p){
    if(reduced())return;
    p.el.querySelectorAll('[data-lesson-stage] [data-motion]').forEach(el=>{
      if(!el.animate)return;const kind=el.dataset.motion;let frames;
      if(kind==='trace')frames=[{strokeDasharray:1,strokeDashoffset:1},{strokeDasharray:1,strokeDashoffset:0}];
      else if(kind==='fill')frames=[{opacity:0},{opacity:1}];
      else if(kind==='bag')frames=[{transform:'translate(0px,0px)'},{transform:'translate(89px,73px)'}];
      else if(kind==='tilt'){el.style.transformOrigin='50px 175px';frames=[{transform:'rotate(0deg)'},{transform:'rotate(-35deg)'}];}
      else if(kind==='slider')frames=[{transform:'translateX(var(--slider-distance))'},{transform:'translateX(0px)'}];
      else if(kind==='transfer')frames=[{transform:'translate(-85px,65px)',opacity:.4},{transform:'translate(0px,0px)',opacity:1}];
      else frames=[{opacity:.2,transform:kind==='slide'?'translateX(-36px)':'translateY(12px)'},{opacity:1,transform:'translate(0px,0px)'}];
      p.animations.push(el.animate(frames,{duration:kind==='trace'?2000:kind==='bag'||kind==='tilt'?1500:750,delay:Number(el.dataset.delay)||0,easing:'ease-in-out',fill:'both'}));
    });
  }
  function pause(p,message){
    if(!p)return;p.playing=false;p.token++;clearTimeout(p.timer);clearTimeout(p.watchdog);cancelSpeech(p);p.animations.forEach(a=>a.pause());updateControls(p);if(message)announce(p,message);if(active===p)active=null;
  }
  function pauseAll(message){for(const p of players)pause(p,message);}
  function schedule(p,ms,token){p.timer=setTimeout(()=>{if(!p.playing||token!==p.token)return;if(p.singleStep){pause(p);announce(p,'这一幅的解说结束了。按下一步继续看，或再听一次。');return;}if(p.step===p.scene.steps.length-1){p.ended=true;pause(p);announce(p,'这一段看完了。可以回看，也可以接着读。');return;}p.step++;run(p);},ms);}
  function run(p){
    cancelRun(p);show(p);if(!p.singleStep)animate(p);const token=p.token;
    if(!p.voice){schedule(p,duration(p.scene.steps[p.step].caption),token);return;}
    const synth=window.speechSynthesis,voice=synth&&chooseVoice(synth.getVoices());
    if(!voice||!window.SpeechSynthesisUtterance){p.voice=false;updateControls(p);announce(p,'这台设备暂时没有可用的中文解说声音，字幕和动画可以继续看。');schedule(p,duration(p.scene.steps[p.step].caption),token);return;}
    document.dispatchEvent(new CustomEvent('book:narration-start'));
    const utterance=new SpeechSynthesisUtterance(p.scene.steps[p.step].caption);p.utterance=utterance;voiceOwner=p;
    utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.88;utterance.pitch=1;utterance.volume=.8;
    let ended=false;const finish=()=>{if(ended||token!==p.token||!p.playing)return;ended=true;clearTimeout(p.watchdog);voiceOwner=null;p.utterance=null;schedule(p,900,token);};
    const fallback=()=>{if(ended||token!==p.token||!p.playing)return;ended=true;clearTimeout(p.watchdog);cancelSpeech(p);p.voice=false;updateControls(p);announce(p,'声音暂时没有接上。我们继续看字幕，你也可以暂停。');schedule(p,duration(p.scene.steps[p.step].caption),token);};
    utterance.onend=finish;utterance.onerror=fallback;
    p.watchdog=setTimeout(fallback,Math.max(14000,duration(utterance.text)*3));
    try{synth.speak(utterance);}catch{fallback();}
  }
  function start(p){
    if(reduced()){move(p,p.step===p.scene.steps.length-1?0:p.step+1);announce(p,'已按减少动态设置停在这一幅，可以用下一步慢慢看。');return;}
    for(const other of players)if(other!==p)pause(other);
    active=p;p.singleStep=false;if(p.ended){p.step=0;p.ended=false;}p.started=true;p.playing=true;announce(p,'');run(p);
  }
  function move(p,index){pause(p);cancelRun(p);p.step=Math.max(0,Math.min(p.scene.steps.length-1,index));p.ended=false;show(p);announce(p,'停在这一幅，按你的节奏看。');}
  function mount(container){
    container.querySelectorAll('[data-lesson]').forEach(el=>{
      const scene=[...scenes.values()].find(s=>s.id===el.dataset.lesson);if(!scene)return;
      const p={el,scene,step:0,playing:false,voice:false,singleStep:false,started:false,ended:false,token:0,timer:null,watchdog:null,animations:[]};
      players.add(p);el.classList.add('lesson-ready');el.querySelector('.lesson-transcript').open=false;updateControls(p);
      if(window.IntersectionObserver){p.observer=new IntersectionObserver(entries=>{if(p.playing&&entries.some(e=>!e.isIntersecting))pause(p,'已经暂停，回来后可以继续。');},{threshold:0});p.observer.observe(el);}
    });
    if(!initialized){initialized=true;document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll('已经暂停，回来后可以继续。');});window.addEventListener('pagehide',()=>pauseAll());window.addEventListener('beforeprint',()=>pauseAll());}
  }
  function dispose(){for(const p of players){cancelRun(p);p.observer?.disconnect();}players.clear();active=null;}
  function settingsChanged(){for(const p of players){if(reduced())pause(p);updateControls(p);}}
  function handle(event,container){
    const button=event.target.closest('button');if(!button||!container.contains(button))return;
    const el=button.closest('[data-lesson]');const p=[...players].find(x=>x.el===el);if(!p)return;
    if(button.hasAttribute('data-lesson-step')){move(p,Number(button.dataset.lessonStep));return;}
    const action=button.dataset.lessonAction;
    if(action==='play'){if(p.playing)pause(p,'停在这里了。你可以继续，也可以回看。');else start(p);}
    if(action==='prev')move(p,p.step-1);
    if(action==='next')move(p,p.step+1);
    if(action==='reset'){move(p,0);p.started=false;updateControls(p);}
    if(action==='voice'){
      if(p.voice&&(!reduced()||p.playing)){p.voice=false;cancelSpeech(p);if(p.singleStep)pause(p,'解说已暂停。');else if(p.playing)run(p);else updateControls(p);return;}
      const voice=window.speechSynthesis&&chooseVoice(window.speechSynthesis.getVoices());
      if(!voice){announce(p,'这台设备暂时没有可用的中文解说声音，字幕和动画可以继续看。');return;}
      p.voice=true;if(reduced()){for(const other of players)if(other!==p)pause(other);active=p;p.singleStep=true;p.playing=true;announce(p,'只读这一幅，画面不会自动前进。');run(p);}else start(p);
    }
  }
  return {render,drawing,mount,handle,pauseAll,dispose,settingsChanged,chooseVoice,duration,sceneCount:scenes.size};
});
