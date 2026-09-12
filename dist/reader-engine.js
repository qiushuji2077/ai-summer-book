'use strict';
(function (root, factory) {
  const engine = factory(typeof module !== 'undefined' ? require('./reading-modules.js') : root.BookModules, typeof module !== 'undefined' ? require('./animated-lessons.js') : root.BookAnimations);
  if (typeof module !== 'undefined') module.exports = engine;
  else root.BookEngine = engine;
})(typeof window !== 'undefined' ? window : {}, function (modules, animations) {
  const VERSION = '0.3';
  const PARTS = [
    {title:'看见 AI',subtitle:'它已经走到了哪里',question:'聊天框外，还有什么？'},
    {title:'打开机器盖',subtitle:'看懂新一代 AI',question:'它到底怎样工作？'},
    {title:'学科的远方',subtitle:'让课桌连接世界',question:'为什么还要认真学习？'},
    {title:'给思考留白',subtitle:'让 AI 成为陪练',question:'怎样让理解留在脑中？'},
    {title:'握住方向盘',subtitle:'判断、保护与边界',question:'什么时候应该停下？'},
    {title:'未来的自己',subtitle:'带着问题继续走',question:'你想让什么变得更好？'}
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inline(s) {
    return esc(s).replace(/&lt;br\s*\/?&gt;/g,'<br>')
      .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(_,label,url)=>/^https:\/\//.test(url)?`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only">（在新标签页打开）</span></a>`:label)
      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
  }
  function parseBook(source) {
    const matches=[...source.matchAll(/<!-- chapter:\s*(\{[^\n]+\})\s*-->\s*([\s\S]*?)(?=<!-- chapter:|$)/g)];
    const ids=new Set();
    return matches.map(m=>{
      const meta=JSON.parse(m[1]);
      if(!/^(preface|ch\d{2})$/.test(meta.id)||ids.has(meta.id))throw Error('章节标识无效或重复');
      if(!Number.isInteger(meta.part)||meta.part<0||meta.part>6)throw Error('篇号无效');
      ids.add(meta.id);
      const body=m[2].replace(/^# .+\r?\n/,'').trim();
      return {...meta,body,minutes:Math.max(2,Math.ceil((body.replace(/<!--[^]*?-->/g,'').match(/[\u3400-\u9fff]/g)||[]).length/260))};
    });
  }
  function parseBlocks(markdown) {
    const lines=markdown.split(/\r?\n/), blocks=[]; let i=0;
    while(i<lines.length){
      const line=lines[i].trim();
      if(!line){i++;continue;}
      if(line.startsWith('<!--')){
        let comment=lines[i++];while(!comment.includes('-->')&&i<lines.length)comment+='\n'+lines[i++];
        const m=comment.match(/<!-- visual:\s*(\{[^]*?\})\s*-->/);if(m){try{blocks.push({type:'visual',meta:JSON.parse(m[1])});}catch{}}
        continue;
      }
      if(line.startsWith(':::')){
        const marker=line.slice(3).trim(), [type,...rest]=marker.split(' '),body=[];i++;
        while(i<lines.length&&lines[i].trim()!==':::')body.push(lines[i++]);if(i<lines.length)i++;
        blocks.push({type:'container',kind:type,title:rest.join(' '),body:body.join('\n')});continue;
      }
      const h=line.match(/^(#{1,3}) (.+)/);if(h){blocks.push({type:'heading',level:h[1].length,text:h[2]});i++;continue;}
      if(line.startsWith('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i+1]||'')){
        const cells=s=>s.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
        const header=cells(line);i+=2;const rows=[];while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(cells(lines[i++]));
        blocks.push({type:'table',header,rows});continue;
      }
      if(/^> /.test(line)){const body=[];while(i<lines.length&&/^> /.test(lines[i]))body.push(lines[i++].slice(2));blocks.push({type:'quote',text:body.join('<br>')});continue;}
      if(/^([-*]|\d+\.) /.test(line)){const ordered=/^\d/.test(line),body=[];while(i<lines.length&&/^([-*]|\d+\.) /.test(lines[i]))body.push(lines[i++].replace(/^([-*]|\d+\.) /,''));blocks.push({type:'list',ordered,items:body});continue;}
      const para=[];while(i<lines.length&&lines[i].trim()&&!/^(:::|#|> |[-*] |\d+\. |<!--)/.test(lines[i]))para.push(lines[i++].trim());
      if(para.length)blocks.push({type:'p',text:para.join(' ')});else i++;
    }
    return blocks;
  }
  function demoData(raw) {
    const sections=raw.split(/^### /m),intro=sections.shift().trim().split('\n');
    return {schemaVersion:2,title:intro.shift(),intro:intro.join('\n').trim(),options:sections.map(section=>{
      const at=section.indexOf('\n'),label=at<0?section:section.slice(0,at);let body=at<0?'':section.slice(at+1).trim(),meta={};
      const match=body.match(/<!-- option:\s*(\{[^\n]+\})\s*-->/);
      if(match){try{meta=JSON.parse(match[1]);}catch{meta={schemaVersion:0};}body=body.replace(match[0],'').trim();}
      const split=body.indexOf('<!-- response -->');
      return {label:label.trim(),meta,prompt:split<0?'':body.slice(0,split).trim(),body:split<0?body:body.slice(split+17).trim()};
    })};
  }
  function renderMarkdown(markdown,chapterId='chapter',state={heading:0},enhance=false) {
    const blocks=parseBlocks(markdown);
    if(enhance&&modules?.prepare)modules.prepare(blocks,chapterId);
    const render=text=>renderMarkdown(text,chapterId,state,false);
    const api={esc,inline,render,blocks,chapterId};
    return blocks.map(b=>{
      if(b.consumed)return '';
      if(b.type==='visual'){const fallback=()=>(b.items||[]).map(x=>render(x.text||'')).join('');try{return enhance?(animations?.render(b.meta.id)||modules?.visual?.(b.meta.id,api,b)||fallback()):fallback();}catch{return fallback();}}
      if(b.type==='heading'){if(b.level===1)return '';if(b.level===2){state.heading++;return `<h2 id="${chapterId}--section-${state.heading}">${inline(b.text)}</h2>`;}return `<h3>${inline(b.text)}</h3>`;}
      if(b.type==='p')return `<p>${inline(b.text)}</p>`;
      if(b.type==='quote')return `<blockquote><p>${inline(b.text)}</p></blockquote>`;
      if(b.type==='list'){const tag=b.ordered?'ol':'ul';return `<${tag}>${b.items.map(t=>`<li>${inline(t)}</li>`).join('')}</${tag}>`;}
      if(b.type==='table')return `<div class="table-scroll" role="region" aria-label="${esc(b.header.join('、'))}" tabindex="0"><table><thead><tr>${b.header.map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(row=>`<tr>${row.map((c,i)=>i===0?`<th scope="row">${inline(c)}</th>`:`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      if(b.type==='container'){
        if(b.kind==='interactive'){
          const d=demoData(b.body);
          let extra='';try{extra=modules?.staticExtra?.(b.title,d,api)||'';}catch{}
          const staticText=`<div class="module-static"><h3>${inline(d.title)}</h3><p>${inline(d.intro)}</p>${extra}${d.options.map(o=>`<section><h4>${inline(o.label)}</h4>${render(o.prompt)}${render(o.body)}</section>`).join('')}</div>`;
          let live='';try{live=modules?.demo?.(b.title,d,api)||'';}catch{}
          return `<section class="study-module" data-module="${esc(b.title)}" id="${chapterId}-demo-${esc(b.title)}"><p class="module-eyebrow">动手看看 · 预设教学演示</p><p class="module-boundary">使用本书预设材料，不调用真实 AI，不上传你的选择。</p>${live?`<div class="module-live">${live}</div>`:''}${staticText}</section>`;
        }
        if(b.kind==='details')return `<details class="reading-detail"><summary>${inline(b.title)}</summary><div class="detail-content">${render(b.body)}</div></details>`;
        if(['lead','aside','pause'].includes(b.kind))return `<div class="${b.kind}">${b.kind!=='lead'?`<span class="block-label">${inline(b.title)}</span>`:''}${render(b.body)}</div>`;
        return `<section class="text-fallback">${b.title?`<h3>${inline(b.title)}</h3>`:''}${render(b.body)}</section>`;
      }
      return '';
    }).join('\n');
  }
  const renderChapter=ch=>renderMarkdown(ch.body,ch.id,{heading:0},true);
  return {VERSION,PARTS,esc,inline,parseBook,parseBlocks,demoData,renderMarkdown,renderChapter};
});
