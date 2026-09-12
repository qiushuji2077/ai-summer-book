'use strict';
(() => {
  const {VERSION,PARTS,esc,parseBook,renderChapter}=window.BookEngine;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const measureHeader=()=>document.documentElement.style.setProperty('--header-height',$('.site-header').getBoundingClientRect().height+'px');
  measureHeader();if(window.ResizeObserver)new ResizeObserver(measureHeader).observe($('.site-header'));
  let chapters=[],current=null,progressTimer=null,noticeTimer=null,resumeRequest=false,scrollLocked=false,storageWarned=false;
  const KEY='light-book-v1';
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let preferences={font:'normal',theme:'paper',motion:matchMedia('(prefers-reduced-motion: reduce)').matches,volume:25,last:null};
  try {const saved=JSON.parse(localStorage.getItem(KEY)); if(saved)preferences={...preferences,...saved};} catch{}
  preferences.font=['small','normal','large'].includes(preferences.font)?preferences.font:'normal';
  preferences.theme=['paper','night'].includes(preferences.theme)?preferences.theme:'paper';
  preferences.volume=Number.isFinite(Number(preferences.volume))?Math.max(0,Math.min(60,Number(preferences.volume))):25;
  const updatedContent=!!preferences.last && preferences.contentVersion!==VERSION;
  if(updatedContent)preferences.last={id:preferences.last.id,scroll:0};
  preferences.contentVersion=VERSION;
  function persist() {try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{if(!storageWarned){storageWarned=true;notify('本次阅读设置未能保存，页面仍可继续阅读。');}}}
  function notify(msg){$('#notice').textContent=msg;$('#notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').classList.remove('visible'),3200);}
  function applySettings(){
    document.body.dataset.font=preferences.font;document.body.dataset.theme=preferences.theme;document.body.dataset.motion=(preferences.motion||systemMotion.matches)?'reduced':'full';document.documentElement.style.scrollBehavior=(preferences.motion||systemMotion.matches)?'auto':'';
    $$('[data-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.font===preferences.font)));
    $$('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===preferences.theme)));
    $('#motion-toggle').checked=!!preferences.motion||systemMotion.matches;$('#motion-toggle').disabled=systemMotion.matches;$('#motion-system-note').hidden=!systemMotion.matches;$('#volume').value=preferences.volume;$('#volume-value').textContent=preferences.volume+'%';
  }
  systemMotion.addEventListener('change',applySettings);
  applySettings();
  const sound=new Audio('assets/window-light.mp3');sound.loop=true;sound.preload='none';sound.volume=preferences.volume/100;
  let wantedMusic=false;
  const setSoundUI=playing=>{$('#sound-toggle').setAttribute('aria-pressed',String(playing));$('.sound-label').textContent=playing?'轻音乐 · 开':'轻音乐 · 关';$('#sound-toggle').setAttribute('aria-label',playing?'暂停轻音乐':'开启轻音乐');};
  $('#sound-toggle').addEventListener('click',async()=>{
    wantedMusic=!wantedMusic;
    if(wantedMusic){try{await sound.play();if(wantedMusic){setSoundUI(true);notify('窗边 · 轻音乐已开启');}else sound.pause();}catch{wantedMusic=false;setSoundUI(false);notify('音乐未能播放，阅读可以继续。');}}
    else{sound.pause();setSoundUI(false);}
  });
  sound.addEventListener('error',()=>{if(wantedMusic){wantedMusic=false;setSoundUI(false);notify('音乐未能播放，阅读可以继续。');}});
  const quiet=()=>{wantedMusic=false;sound.pause();setSoundUI(false);};
  $('#quiet-reading').addEventListener('click',quiet);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
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
    $('#start-reading').href='#preface';
    const last=chapters.find(c=>c.id===preferences.last?.id);
    if(last){$('#start-reading').innerHTML=`继续读 <span aria-hidden="true">↗</span>`;$('#start-reading').href='#'+last.id;$('#resume-caption').textContent=`上次读到${last.label}`;}
  }
  $('#start-reading').addEventListener('click',()=>{resumeRequest=!!preferences.last;});
  function renderRoute(){
    let raw;try{raw=decodeURIComponent(location.hash.slice(1)||'cover');}catch{raw='cover';}
    if(raw==='main'){document.getElementById('main').focus();return;}
    const id=raw.split('--')[0];
    if(current && current.id!==id && !scrollLocked){preferences.last={id:current.id,scroll:scrollY};persist();}
    if(id==='cover'){
      current=null;delete document.body.dataset.chapter;$('#cover').hidden=false;$('#reader').hidden=true;$('#reading-progress').hidden=true;document.title='门后的光 · 写给你的 AI 之书';buildContents();window.scrollTo({top:0,behavior:'instant'});return;
    }
    const ch=chapters.find(c=>c.id===id);
    if(!ch){history.replaceState(null,'','#cover');notify('这一页还没有收录，先回到封面。');renderRoute();return;}
    if(current?.id===id){if(raw.includes('--'))document.getElementById(raw)?.scrollIntoView({behavior:(preferences.motion||systemMotion.matches)?'instant':'smooth',block:'start'});else window.scrollTo({top:0,behavior:'instant'});return;}
    current=ch;document.body.dataset.chapter=id;scrollLocked=true;clearTimeout(progressTimer);
    $('#cover').hidden=true;$('#reader').hidden=false;$('#reading-progress').hidden=false;document.title=`${ch.title} · 门后的光`;
    const p=PARTS[ch.part-1];
    $('#chapter-heading').innerHTML=`<div class="chapter-kicker">${ch.label}${p?' · '+p.title:''}</div><h1 tabindex="-1">${esc(ch.title)}</h1><p class="subtitle">${esc(ch.subtitle)}</p><div class="chapter-meta"><span>约 ${ch.minutes} 分钟 · 仅作参考</span><span>${ch.part?'全书 '+ch.id.slice(2)+' / 18':'写给你'}</span><button class="plain-button mobile-settings" style="display:none" data-open-settings>字号与底色</button></div>`;
    $('#chapter-body').innerHTML=renderChapter(ch);
    window.BookModules.mount($('#chapter-body'));
    document.body.classList.add('reader-enhanced');
    const part=ch.part||1;
    $('#rail-content').innerHTML=`<div class="rail-part"><span class="part-no">${String(part).padStart(2,'0')}</span><h2>${PARTS[part-1].title}</h2><p>${PARTS[part-1].question}</p></div><nav class="rail-chapters">${(ch.part===0?[ch,...chapters.filter(c=>c.part===1)]:chapters.filter(c=>c.part===ch.part)).map(c=>`<a href="#${c.id}" ${c.id===ch.id?'aria-current="page"':''}><span>${c.id==='preface'?'序':c.id.slice(2)}</span>${esc(c.title)}</a>`).join('')}</nav><button class="rail-all" data-open-contents>展开全书目录</button>`;
    const index=chapters.findIndex(c=>c.id===id),prev=chapters[index-1],next=chapters[index+1];
    $('#chapter-footer').innerHTML=next?`<a class="next-chapter" href="#${next.id}"><span>${next.part!==ch.part?'下一篇 · '+PARTS[next.part-1].title:'接下来 · '+next.label}</span><strong>${esc(next.title)} <span aria-hidden="true">↗</span></strong></a>`:`<a class="next-chapter" href="#cover"><span>读完了，带着一个小行动回到生活中。</span><strong>合上这本书 ↗</strong></a>`;
    const related={ch08:['ch01','回看纸桥的开始'],ch11:['ch08','回看比较条件'],ch12:['ch09','回到校园观察'],ch17:['ch12','回看一页观察记录'],ch18:['preface','回到最初的问题']};
    const link=related[id]||(prev?[prev.id,'回看上一章']:null);
    if(link)$('#chapter-footer').insertAdjacentHTML('beforeend',`<a class="related-reading" href="#${link[0]}">${link[1]} →</a>`);
    if(!link)$('#chapter-footer').insertAdjacentHTML('beforeend','<button class="related-reading" data-open-contents>回看目录</button>');
    $('#chapter-footer').insertAdjacentHTML('beforeend','<button class="pause-reading" data-pause-reading>在这里停一会儿</button>');
    $('#progress-title').textContent=ch.label+' · '+ch.title;$('#progress-next').textContent=next?'下一章 →':'回到封面';$('#progress-next').href=next?'#'+next.id:'#cover';
    $('#section-nav').innerHTML=$$('#chapter-body > h2').map(h=>`<a href="#${h.id}">${esc(h.textContent)}</a>`).join('');
    $$('#contents-list a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    requestAnimationFrame(()=>{
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
    window.BookModules.handle(e,$('#chapter-body'));
    if(e.target.closest('a[target="_blank"]'))quiet();
    if(e.target.closest('[data-pause-reading]')){quiet();if(current){preferences.last={id:current.id,scroll:scrollY};persist();}location.hash='cover';}

  });
  window.addEventListener('hashchange',renderRoute);window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress,{passive:true});
  window.addEventListener('pagehide',()=>{if(current){preferences.last={id:current.id,scroll:scrollY};persist();}sound.pause();wantedMusic=false;setSoundUI(false);});
  function init(source){chapters=parseBook(source);if(chapters.length!==19)throw new Error('章节未完整载入');buildContents();renderRoute();$('#reading-fallback').hidden=true;if(updatedContent)notify('正文已更新为 0.2，保留上次章节，从章首继续读。');}
  try{init(window.BOOK_SOURCE||'');}catch(err){$('#cover .cover-intro').textContent='正文暂时未能载入。你仍可以下载完整文稿阅读。';$('#reading-fallback').hidden=false;console.error(err);}
  // Bundled text and enhanced content always come from the same build.
  const openBeforePrint=[];
  window.addEventListener('beforeprint',()=>{$$('#chapter-body details').forEach(d=>{if(!d.open){openBeforePrint.push(d);d.open=true;}});});
  window.addEventListener('afterprint',()=>{openBeforePrint.splice(0).forEach(d=>d.open=false);});
})();
