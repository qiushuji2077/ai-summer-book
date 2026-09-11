'use strict';
(() => {
  const PARTS = [
    {title:'看见 AI',subtitle:'它已经走到了哪里',question:'聊天框外，还有什么？'},
    {title:'打开机器盖',subtitle:'看懂新一代 AI',question:'它到底怎样工作？'},
    {title:'学科的远方',subtitle:'让课桌连接世界',question:'为什么还要认真学习？'},
    {title:'给思考留白',subtitle:'让 AI 成为陪练',question:'怎样让理解留在脑中？'},
    {title:'握住方向盘',subtitle:'判断、保护与边界',question:'什么时候应该停下？'},
    {title:'未来的自己',subtitle:'带着问题继续走',question:'你想让什么变得更好？'}
  ];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inline(s) {
    return esc(s).replace(/&lt;br\s*\/?&gt;/g,'<br>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(_,label,url)=> /^https:\/\//.test(url) ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only">（在新标签页打开）</span></a>` : label);
  }
  function parseBook(source) {
    const matches = [...source.matchAll(/<!-- chapter:\s*(\{[^\n]+\})\s*-->\s*([\s\S]*?)(?=<!-- chapter:|$)/g)];
    const ids = new Set();
    return matches.map(m => {
      const meta = JSON.parse(m[1]);
      if (!/^(preface|ch\d{2})$/.test(meta.id) || ids.has(meta.id)) throw new Error('章节标识重复或无效');
      if (!Number.isInteger(meta.part) || meta.part < 0 || meta.part > 6) throw new Error('篇章编号无效');
      ids.add(meta.id);
      const body = m[2].replace(/^# .+\r?\n/,'').trim();
      const chars = (body.match(/[\u3400-\u9fff]/g)||[]).length;
      return {...meta,body,minutes:Math.max(2,Math.ceil(chars/260))};
    });
  }
  function demoData(raw) {
    const sections = raw.split(/^### /m), intro = sections.shift().trim().split('\n');
    return {title:intro.shift(),intro:intro.join('\n').trim(),options:sections.map(s => {const i=s.indexOf('\n');return {label:s.slice(0,i).trim(),body:s.slice(i+1).trim()};})};
  }
  function renderDemo(kind,raw,chapterId) {
    const d=demoData(raw), id=`${chapterId}-demo-${kind}`;
    const intro=`<span class="block-label">动手看看 · 教学模拟</span><h3>${inline(d.title)}</h3><p>${inline(d.intro)}</p>`;
    const note='<p class="demo-note">这是预设情境的交互演示，无须账号，也不调用真实 AI。</p>';
    if(kind==='agent') return `<section class="interactive" data-demo="agent" data-step="-1" id="${id}">${intro}<div class="agent-steps" aria-label="任务步骤">${d.options.map((o,i)=>`<span data-step-label="${i}">${esc(o.label)}</span>`).join('')}</div><div class="agent-log" aria-live="polite">准备好了，就从读取任务开始。每次前进一步，看看新信息如何影响行动。</div>${d.options.map((o,i)=>`<template data-step-content="${i}">${renderMarkdown(o.body,chapterId)}</template>`).join('')}<button class="demo-action" data-agent-next>开始任务</button><button class="demo-action secondary" data-agent-reset hidden>重新走一遍</button>${note}</section>`;
    return `<section class="interactive" data-demo="${esc(kind)}" id="${id}">${intro}<div class="demo-options" role="group" aria-label="${esc(d.title)}">${d.options.map((o,i)=>`<button data-choice="${i}" aria-pressed="false" aria-controls="${id}-result">${esc(o.label)}</button>`).join('')}</div><div class="demo-result" id="${id}-result" aria-live="polite">选择上方的一种情况，再看看它带来的变化。</div>${d.options.map((o,i)=>`<template data-result="${i}">${renderMarkdown(o.body,chapterId)}</template>`).join('')}${note}</section>`;
  }
  function renderMarkdown(markdown,chapterId='chapter',state={heading:0}) {
    const lines=markdown.split(/\r?\n/); let out=[],i=0;
    while(i<lines.length) {
      const line=lines[i].trim();
      if(!line || line.startsWith('<!--')) {i++;continue;}
      if(line.startsWith(':::')) {
        const marker=line.slice(3).trim(),space=marker.indexOf(' '),type=space<0?marker:marker.slice(0,space),title=space<0?'':marker.slice(space+1);
        const body=[];i++;while(i<lines.length && lines[i].trim()!==':::')body.push(lines[i++]);i++;
        const text=body.join('\n');
        if(type==='interactive') out.push(renderDemo(title,text,chapterId));
        else if(type==='details')out.push(`<details><summary>${inline(title)}</summary><div class="detail-content">${renderMarkdown(text,chapterId,state)}</div></details>`);
        else if(['lead','aside','pause'].includes(type))out.push(`<div class="${type}">${type!=='lead'?`<span class="block-label">${inline(title||(type==='aside'?'把概念放轻一点':'停一停 · 想一想'))}</span>`:''}${renderMarkdown(text,chapterId,state)}</div>`);
        else throw new Error('未支持的文稿块：'+type);
        continue;
      }
      if(/^## /.test(line)) {state.heading++;out.push(`<h2 id="${chapterId}--section-${state.heading}">${inline(line.slice(3))}</h2>`);i++;continue;}
      if(/^### /.test(line)) {out.push(`<h3>${inline(line.slice(4))}</h3>`);i++;continue;}
      if(/^# /.test(line)){i++;continue;}
      if(/^> /.test(line)) {const rows=[];while(i<lines.length && /^> /.test(lines[i]))rows.push(lines[i++].slice(2));out.push(`<blockquote><p>${inline(rows.join('<br>'))}</p></blockquote>`);continue;}
      if(/^[-*] /.test(line)) {const rows=[];while(i<lines.length&&/^[-*] /.test(lines[i]))rows.push(`<li>${inline(lines[i++].slice(2))}</li>`);out.push(`<ul>${rows.join('')}</ul>`);continue;}
      if(/^\d+\. /.test(line)) {const rows=[];while(i<lines.length&&/^\d+\. /.test(lines[i]))rows.push(`<li>${inline(lines[i++].replace(/^\d+\. /,''))}</li>`);out.push(`<ol>${rows.join('')}</ol>`);continue;}
      const para=[];while(i<lines.length && lines[i].trim()&&!/^(:::|#|> |[-*] |\d+\. |<!--)/.test(lines[i]))para.push(lines[i++].trim());
      if(para.length)out.push(`<p>${inline(para.join(' '))}</p>`);else i++;
    }
    return out.join('\n');
  }
  if(typeof module!=='undefined' && module.exports) module.exports={parseBook,renderMarkdown,demoData,PARTS};
  if(typeof document==='undefined') return;

  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let chapters=[],current=null,progressTimer=null,noticeTimer=null,resumeRequest=false,scrollLocked=false,revealObserver=null;
  const KEY='light-book-v1';
  let preferences={font:'normal',theme:'paper',motion:matchMedia('(prefers-reduced-motion: reduce)').matches,volume:25,last:null};
  try {const saved=JSON.parse(localStorage.getItem(KEY)); if(saved)preferences={...preferences,...saved};} catch{}
  preferences.font=['small','normal','large'].includes(preferences.font)?preferences.font:'normal';
  preferences.theme=['paper','night'].includes(preferences.theme)?preferences.theme:'paper';
  preferences.volume=Number.isFinite(Number(preferences.volume))?Math.max(0,Math.min(60,Number(preferences.volume))):25;
  function persist() {try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{}}
  function notify(msg){$('#notice').textContent=msg;$('#notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').classList.remove('visible'),3200);}
  function applySettings(){
    document.body.dataset.font=preferences.font;document.body.dataset.theme=preferences.theme;document.body.dataset.motion=preferences.motion?'reduced':'full';document.documentElement.style.scrollBehavior=preferences.motion?'auto':'';
    $$('[data-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.font===preferences.font)));
    $$('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===preferences.theme)));
    $('#motion-toggle').checked=!!preferences.motion;$('#volume').value=preferences.volume;$('#volume-value').textContent=preferences.volume+'%';
  }
  applySettings();
  const sound=new Audio('assets/window-light.mp3');sound.loop=true;sound.preload='none';sound.volume=preferences.volume/100;
  let wantedMusic=false;
  const setSoundUI=playing=>{$('#sound-toggle').setAttribute('aria-pressed',String(playing));$('.sound-label').textContent=playing?'轻音乐 · 开':'轻音乐 · 关';$('#sound-toggle').setAttribute('aria-label',playing?'暂停轻音乐':'开启轻音乐');};
  $('#sound-toggle').addEventListener('click',async()=>{
    wantedMusic=!wantedMusic;
    if(wantedMusic){try{await sound.play();if(wantedMusic){setSoundUI(true);notify('窗边 · 轻音乐已开启');}else sound.pause();}catch{wantedMusic=false;setSoundUI(false);notify('音乐暂时无法播放，请稍后重试。');}}
    else{sound.pause();setSoundUI(false);}
  });
  sound.addEventListener('error',()=>{if(wantedMusic){wantedMusic=false;setSoundUI(false);notify('音乐暂时无法加载，请稍后重试。');}});
  $('#volume').addEventListener('input',e=>{preferences.volume=Number(e.target.value);sound.volume=preferences.volume/100;$('#volume-value').textContent=preferences.volume+'%';persist();});
  $$('[data-font]').forEach(b=>b.addEventListener('click',()=>{preferences.font=b.dataset.font;applySettings();persist();updateProgress();}));
  $$('[data-theme]').forEach(b=>b.addEventListener('click',()=>{preferences.theme=b.dataset.theme;applySettings();persist();}));
  $('#motion-toggle').addEventListener('change',e=>{preferences.motion=e.target.checked;applySettings();persist();});
  const openDialog=id=>{const d=document.getElementById(id);if(d&&!d.open)d.showModal();};
  $('#contents-toggle').addEventListener('click',()=>openDialog('contents-dialog'));
  $('#settings-toggle').addEventListener('click',()=>openDialog('settings-dialog'));
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  $('#contents-list').addEventListener('click',e=>{if(e.target.closest('a'))$('#contents-dialog').close();});
  function buildContents(){
    $('#journey').innerHTML=PARTS.map((p,i)=>`<a href="#ch${String(i*3+1).padStart(2,'0')}"><span class="part-no">0${i+1}</span><strong>${p.title}</strong><p>${p.subtitle}</p></a>`).join('');
    $('#contents-list').innerHTML=`<a class="contents-preface" href="#preface"><span>序章 · 在打开这本书之前</span><span>写给你</span></a><div class="contents-grid">${PARTS.map((p,i)=>`<section class="contents-part"><h3><span>0${i+1}</span>${p.title}</h3>${chapters.filter(c=>c.part===i+1).map(c=>`<a href="#${c.id}"><span>${c.id.slice(2)}</span>${esc(c.title)}</a>`).join('')}</section>`).join('')}</div>`;
    const last=chapters.find(c=>c.id===preferences.last?.id);
    if(last){$('#start-reading').innerHTML=`继续读 <span aria-hidden="true">↗</span>`;$('#start-reading').href='#'+last.id;$('#resume-caption').textContent=`上次读到${last.label}`;}
  }
  $('#start-reading').addEventListener('click',()=>{resumeRequest=!!preferences.last;});
  function renderRoute(){
    let raw;try{raw=decodeURIComponent(location.hash.slice(1)||'cover');}catch{raw='cover';}
    const id=raw.split('--')[0];
    if(current && current.id!==id && !scrollLocked){preferences.last={id:current.id,scroll:scrollY};persist();}
    if(id==='cover'){
      current=null;$('#cover').hidden=false;$('#reader').hidden=true;$('#reading-progress').hidden=true;document.title='门后的光 · 写给你的 AI 之书';buildContents();window.scrollTo({top:0,behavior:'instant'});return;
    }
    const ch=chapters.find(c=>c.id===id);
    if(!ch){history.replaceState(null,'','#cover');notify('这一页还没有收录，先回到封面。');renderRoute();return;}
    if(current?.id===id){if(raw.includes('--'))document.getElementById(raw)?.scrollIntoView({behavior:preferences.motion?'instant':'smooth',block:'start'});else window.scrollTo({top:0,behavior:'instant'});return;}
    current=ch;scrollLocked=true;clearTimeout(progressTimer);
    $('#cover').hidden=true;$('#reader').hidden=false;$('#reading-progress').hidden=false;document.title=`${ch.title} · 门后的光`;
    const p=PARTS[ch.part-1];
    $('#chapter-heading').innerHTML=`<div class="chapter-kicker">${ch.label}${p?' · '+p.title:''}</div><h1 tabindex="-1">${esc(ch.title)}</h1><p class="subtitle">${esc(ch.subtitle)}</p><div class="chapter-meta"><span>约 ${ch.minutes} 分钟</span><span>${ch.part?'全书 '+ch.id.slice(2)+' / 18':'写给你'}</span><button class="plain-button mobile-settings" style="display:none" data-open-settings>字号与底色</button></div>`;
    $('#chapter-body').innerHTML=renderMarkdown(ch.body,ch.id);
    revealObserver?.disconnect();
    if(!preferences.motion && 'IntersectionObserver' in window){
      revealObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){e.target.classList.add('reveal');revealObserver.unobserve(e.target);}}},{threshold:.12});
      $$('#chapter-body blockquote, #chapter-body .pause, #chapter-body .interactive').forEach(el=>revealObserver.observe(el));
    }
    const part=ch.part||1;
    $('#rail-content').innerHTML=`<div class="rail-part"><span class="part-no">${String(part).padStart(2,'0')}</span><h2>${PARTS[part-1].title}</h2><p>${PARTS[part-1].question}</p></div><nav class="rail-chapters">${(ch.part===0?[ch,...chapters.filter(c=>c.part===1)]:chapters.filter(c=>c.part===ch.part)).map(c=>`<a href="#${c.id}" ${c.id===ch.id?'aria-current="page"':''}><span>${c.id==='preface'?'序':c.id.slice(2)}</span>${esc(c.title)}</a>`).join('')}</nav><button class="rail-all" data-open-contents>展开全书目录</button>`;
    const index=chapters.findIndex(c=>c.id===id),prev=chapters[index-1],next=chapters[index+1];
    $('#chapter-footer').innerHTML=next?`<a class="next-chapter" href="#${next.id}"><span>${next.part!==ch.part?'下一篇 · '+PARTS[next.part-1].title:'接下来 · '+next.label}</span><strong>${esc(next.title)} <span aria-hidden="true">↗</span></strong></a><div class="footer-links">${prev?`<a href="#${prev.id}">← 上一章</a>`:'<a href="#cover">← 封面</a>'}<button data-open-contents>回看目录</button></div>`:`<a class="next-chapter" href="#preface"><span>读完了。也可以回到最初的那个问题。</span><strong>再读一次，出发时的自己 ↗</strong></a><div class="footer-links"><a href="#${prev.id}">← 上一章</a><a href="#cover">回到封面</a></div>`;
    $('#progress-title').textContent=ch.label+' · '+ch.title;$('#progress-next').textContent=next?'下一章 →':'回到封面';$('#progress-next').href=next?'#'+next.id:'#cover';
    $('#section-nav').innerHTML=$$('#chapter-body > h2').map(h=>`<a href="#${h.id}">${esc(h.textContent)}</a>`).join('');
    $$('#contents-list a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#chapter-heading').classList.remove('reveal');$('#chapter-body').classList.remove('reveal');
    requestAnimationFrame(()=>{
      $('#chapter-heading').classList.add('reveal');$('#chapter-body').classList.add('reveal');
      if(raw.includes('--'))document.getElementById(raw)?.scrollIntoView({behavior:'instant',block:'start'});
      else if(resumeRequest&&preferences.last?.id===id)window.scrollTo({top:Math.max(0,Number(preferences.last.scroll)||0),behavior:'instant'});
      else window.scrollTo({top:0,behavior:'instant'});
      $('#chapter-heading h1').focus({preventScroll:true});resumeRequest=false;requestAnimationFrame(()=>{scrollLocked=false;updateProgress();});
    });
  }
  function updateProgress(){
    if(!current||scrollLocked)return;
    const total=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=Math.min(100,Math.max(0,Math.round(scrollY/total*100)));
    $('#progress-fill').style.width=progress+'%';$('#progress-percent').textContent=progress+'%';$('.progress-track').setAttribute('aria-valuenow',progress);
    let active=null;$$('#chapter-body > h2').forEach(h=>{if(h.getBoundingClientRect().top<innerHeight*.4)active=h.id;});$$('#section-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+active));
    clearTimeout(progressTimer);progressTimer=setTimeout(()=>{if(current&&!scrollLocked){preferences.last={id:current.id,scroll:scrollY,progress};persist();}},240);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-contents]'))openDialog('contents-dialog');
    if(e.target.closest('[data-open-settings]'))openDialog('settings-dialog');
    const choice=e.target.closest('[data-choice]');
    if(choice){const demo=choice.closest('.interactive');demo.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===choice)));const template=demo.querySelector(`template[data-result="${choice.dataset.choice}"]`);demo.querySelector('.demo-result').replaceChildren(template.content.cloneNode(true));}
    const next=e.target.closest('[data-agent-next]');
    if(next){const demo=next.closest('.interactive'),i=Number(demo.dataset.step)+1,templates=demo.querySelectorAll('template');if(i>=templates.length)return;demo.dataset.step=String(i);demo.querySelector('.agent-log').replaceChildren(templates[i].content.cloneNode(true));demo.querySelectorAll('[data-step-label]').forEach((el,j)=>{el.classList.toggle('current',j<=i);if(j===i)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});next.textContent=i===templates.length-1?'已交还给人':i===0?'读取工具结果 →':i===1?'检查并整理 →':'输出与停止 →';next.disabled=i===templates.length-1;demo.querySelector('[data-agent-reset]').hidden=false;}
    const reset=e.target.closest('[data-agent-reset]');
    if(reset){const demo=reset.closest('.interactive');demo.dataset.step='-1';demo.querySelector('.agent-log').textContent='准备好了，就从读取任务开始。每次前进一步，看看新信息如何影响行动。';demo.querySelectorAll('[data-step-label]').forEach(el=>{el.classList.remove('current');el.removeAttribute('aria-current');});const b=demo.querySelector('[data-agent-next]');b.disabled=false;b.textContent='开始任务';reset.hidden=true;}
  });
  window.addEventListener('hashchange',renderRoute);window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress,{passive:true});
  window.addEventListener('pagehide',()=>{if(current){preferences.last={id:current.id,scroll:scrollY};persist();}sound.pause();wantedMusic=false;setSoundUI(false);});
  function init(source){chapters=parseBook(source);if(chapters.length===0)throw new Error('没有找到章节');buildContents();renderRoute();}
  try{init(window.BOOK_SOURCE||'');}catch(err){$('#cover .cover-intro').textContent='正文暂时未能载入。你仍可以下载完整文稿阅读。';console.error(err);}
  if(location.protocol!=='file:')fetch('book.md',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('正文加载失败');return r.text();}).then(source=>{if(source!==window.BOOK_SOURCE){const parsed=parseBook(source);if(parsed.length){chapters=parsed;current=null;buildContents();renderRoute();}}}).catch(()=>{});
})();
