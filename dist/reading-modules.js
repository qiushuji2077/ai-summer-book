'use strict';
(function(root,factory){const m=factory();if(typeof module!=='undefined')module.exports=m;else root.BookModules=m;})(typeof window!=='undefined'?window:{},function(){
  const note=(s)=>`<p class="module-boundary">${s}</p>`;
  function tabs(d,api){return `<div class="scenario-tabs" role="group" aria-label="选择情境">${d.options.map((o,i)=>`<button data-scenario="${i}" aria-pressed="${i===0}">${api.inline(o.label)}</button>`).join('')}</div>`;}
  function templates(d,api){return d.options.map((o,i)=>`<template data-option="${i}"><div class="material">${api.render(o.prompt)}</div><div class="explanation">${api.render(o.body)}</div></template>`).join('');}
  function choices(labels){return `<div class="judgement" role="group" aria-label="你的初步判断，可跳过">${labels.map((s,i)=>`<button data-judge="${i}" aria-pressed="false">${s}</button>`).join('')}</div><p class="choice-status" role="status"></p>`;}
  const controls=(a)=>`<div class="module-controls">${a}</div>`;
  const showAll='<button class="text-button" data-show-all>直接看全部解释</button>';
  function rectangle(w,h,label){
    const unit=22;return `<figure class="rectangle-figure"><div class="shape-space"><svg viewBox="0 0 242 132" role="img" aria-label="${label}厘米的长方形，与其他图使用相同比例"><g transform="translate(${(242-w*unit)/2},${(132-h*unit)/2})"><rect class="rect-outline" width="${w*unit}" height="${h*unit}"/>${Array.from({length:w*h},(_,i)=>`<rect class="unit-square" x="${(i%w)*unit}" y="${Math.floor(i/w)*unit}" width="${unit}" height="${unit}"/>`).join('')}</g></svg></div><figcaption>${label} 厘米</figcaption><div class="measure-p" hidden>周长：2×(${h}+${w}) = <strong>${2*(w+h)} 厘米</strong></div><div class="measure-a" hidden>面积：${h}×${w} = <strong>${w*h} 平方厘米</strong></div></figure>`;
  }
  function geometry(d){return d.options.map((o,i)=>`<template data-geometry="${i}"><div class="rectangle-pair">${o.meta.rectangles.map(r=>rectangle(r.width,r.height,`${r.height}×${r.width}`)).join('')}</div></template>`).join('');}
  function demo(kind,d,api){
    if(d.options.some(o=>o.meta.schemaVersion!==1))return '';
    const header=`<h3>${api.inline(d.title)}</h3><p>${api.inline(d.intro)}</p>`;
    if(kind==='prediction'||kind==='context')return header+tabs(d,api)+`<div class="material-board"><span class="board-label">${kind==='context'?'目前提供的材料':'先在心里接一句'}</span><div data-material>${api.render(d.options[0].prompt)}</div></div>`+controls(`<button class="filled" data-reveal>${kind==='context'?'看看这份材料能支持什么':'看看一种接法'}</button>${showAll}`)+`<div class="answer-area" data-answer aria-live="polite" hidden><span class="board-label">${kind==='context'?'这一份材料允许我们先做到哪里':'一种接法与它的理由'}</span><div data-feedback></div></div>`+templates(d,api);
    if(kind==='counterexample')return header+tabs(d,api)+note('正方形也属于长方形。四个图始终使用同一厘米比例。')+`<div data-shapes>${d.options[0].meta.rectangles.map(r=>rectangle(r.width,r.height,`${r.height}×${r.width}`)).join('')}</div><p class="question-label">周长越大，面积一定越大？</p>`+choices(['赞同','不赞同','暂时拿不准'])+controls('<button class="filled" data-measure="p">比较周长</button><button data-measure="a">比较面积</button><button data-reveal>查看结论</button>'+showAll)+`<div class="answer-area" data-answer aria-live="polite" hidden><div data-feedback></div><p class="transfer-question">能不能反过来说，周长越大，面积一定越小？</p></div>`+templates(d,api)+geometry(d);
    if(kind==='evidence'||kind==='permission')return header+(kind==='permission'?`<div class="material-board fixed-authority"><span class="board-label">当前授权</span><p>老师只授权整理三个郊游备选方案。</p></div>`:note('虚构查证练习：桥梁、书名和档案均为本书编写。'))+tabs(d,api)+`<div class="current-question"><span class="board-label">${kind==='permission'?'准备做的动作':'正在读到的句子'}</span><p data-claim>${api.inline(d.options[0].label)}</p></div>`+choices(kind==='permission'?['可以继续','需要确认','暂时拿不准']:['我要找资料','我要听理由','这是故事'])+controls('<button class="filled" data-reveal>看看判断的依据</button>'+showAll)+`<div class="answer-area" data-answer aria-live="polite" hidden><p data-judgement-feedback></p><div data-feedback></div>${kind==='permission'?'<div class="return-note" data-return></div>':''}</div>`+d.options.map((o,i)=>`<template data-correct="${i}">${o.meta.judgement}</template>`).join('')+templates(d,api);
    if(kind==='agent')return header+note('步骤由本书预设，未调用搜索或真实智能体。')+`<ol class="work-track">${d.options.map((o,i)=>`<li data-work-label="${i}" ${i===0?'aria-current="step"':''}>${api.inline(o.label)}</li>`).join('')}</ol><div class="work-log" data-work-log aria-live="polite">${record(0,d.options[0],api)}</div><div class="agent-branch" hidden><p class="question-label">C 仍有两种可能。接下来怎样处理？</p>`+choices(['继续补一个名称','保留待确认'])+`<div class="branch-feedback" role="status"></div></div>`+controls('<button class="filled" data-agent-next>看工具返回的材料</button><button class="text-button" data-agent-prev disabled>上一步</button><button class="text-button" data-agent-all>看完整工作记录</button><button class="text-button" data-agent-reset>重新开始</button>')+d.options.map((o,i)=>`<template data-record="${i}">${record(i,o,api)}</template>`).join('');
    return '';
  }
  function record(i,o,api){
    const materials=['老师提供的三项材料与观察要求','需要核对的 A、B、C 三项','A、B 能对应；C 还不能唯一确认','两项可用资料、一项缺口'];
    const actions=['读取要求，找出还不清楚的地方','读取工具返回的查询材料','根据新材料调整原来的计划','检查限制，把决定交还给老师'];
    const next=['核对资料，不随意补名称','先判断 C 存疑会怎样影响清单','保留缺口，核对“不采摘”的要求','停止猜测，等待有依据的新材料'];
    return `<section class="work-record"><h4>${i+1} · ${api.inline(o.label)}</h4><dl><dt>当前材料</dt><dd>${materials[i]}</dd><dt>做了什么</dt><dd>${actions[i]}</dd><dt>得到什么</dt><dd>${api.render(o.body)}</dd><dt>下一步</dt><dd>${next[i]}</dd></dl>${i===3?'<p class="work-outcome">已整理：A、B；待确认：C 的名称；已保留要求：不采摘；当前结果：交老师检查的草稿。</p>':''}</section>`;
  }
  // Move authored paragraphs into comparable layouts without maintaining a second copy.
  function prepare(blocks,id){
    const hook=(visual,indices)=>{const v=blocks.find(b=>b.type==='visual'&&b.meta.id===visual);if(!v)return;v.items=indices.map(i=>blocks[i]);indices.forEach(i=>blocks[i].consumed=true);};
    const moveToFirst=visual=>{const v=blocks.find(b=>b.type==='visual'&&b.meta.id===visual);if(!v?.items?.length)return;blocks.splice(blocks.indexOf(v),1);blocks.splice(blocks.indexOf(v.items[0]),0,v);};
    const find=prefix=>blocks.findIndex(b=>b.type==='p'&&b.text.startsWith(prefix));
    if(id==='ch07'){const a=[find('第一个现场里'),find('第二个现场里')].filter(i=>i>=0);hook('V07',a);const vi=blocks.findIndex(b=>b.type==='visual'&&b.meta.id==='V07');if(a.length&&vi>=0){const v=blocks.splice(vi,1)[0];blocks.splice(a[0],0,v);}}
    if(id==='ch10'){hook('V10',['“原来，','“后来，','“现在，'].map(find).filter(i=>i>=0));moveToFirst('V10');}
    if(id==='ch11'){
      const v=blocks.find(b=>b.type==='visual'&&b.meta.id==='V11');
      if(v){const start=find('**第一点提示：**'),end=find('第三步给出了');if(start>=0&&end>start){v.items=blocks.slice(start,end+1);for(let i=start;i<=end;i++)blocks[i].consumed=true;}}
    }
    if(id==='ch14'){hook('V14',[find('原来的材料是：'),find('准备交给工具的版本')].filter(i=>i>=0));moveToFirst('V14');}
    if(id==='ch18'){hook('V18',['“现在，我最想','“我准备先去','“我希望 AI','“有一件事，','“过一段时间，'].map(find).filter(i=>i>=0));moveToFirst('V18');}
  }
  function frame(id,title,body,boundary='教学示意，帮助比较关系。'){return `<section class="visual-module" data-visual="${id}" id="visual-${id}"><p class="module-eyebrow">看一看 · ${id.slice(1)}</p><h3>${title}</h3>${body}${boundary?note(boundary):''}</section>`;}
  function steps(items){return `<ol class="relation-steps">${items.map((s,i)=>`<li><span class="step-index">${String(i+1).padStart(2,'0')}</span>${s}</li>`).join('')}</ol>`;}
  function deskDrawing(revealed){
    const title=revealed?'补充可见信息：笔袋移开，在本示意图中可确认4支笔':'增加照片：3支笔完整可见，遮挡处的细长物件暂时无法确认';
    let svg=`<svg viewBox="0 0 520 260" role="img" aria-label="${title}"><rect x="10" y="10" width="500" height="240" rx="4" fill="var(--paper)" stroke="var(--line)"/>`;
    [80,148,216].forEach((x,i)=>svg+=`<g transform="translate(${x},45)"><path d="M0 18 L8 0 L16 18 V150 H0 Z" fill="${i===1?'var(--accent)':'var(--blue)'}" opacity=".8"/><path d="M0 18 L8 0 L16 18 Z" fill="var(--paper)" stroke="var(--ink)"/><path d="M8 4 V142" stroke="var(--paper)" stroke-width="2"/></g>`);
    if(revealed)svg+='<g transform="translate(284,45)"><path d="M0 18 L8 0 L16 18 V150 H0 Z" fill="var(--blue)"/><path d="M0 18 L8 0 L16 18 Z" fill="var(--paper)" stroke="var(--ink)"/></g><rect x="347" y="133" width="142" height="70" rx="8" fill="var(--soft)" stroke="var(--ink)"/><path d="M360 146 H474" stroke="var(--muted)" stroke-width="3"/>';
    else svg+='<path d="M284 154 H300 V195 H284 Z" fill="var(--blue)"/><rect x="258" y="37" width="213" height="132" rx="8" fill="var(--soft)" stroke="var(--ink)"/><path d="M272 54 H455" stroke="var(--muted)" stroke-width="3"/>';
    return svg+'</svg>';
  }
  function leafDiagram(){return `<figure class="measurement-figure"><svg viewBox="0 0 680 360" role="img" aria-label="叶片长度从叶片基部量到叶尖，不计叶柄；旁边的尺子与叶片在同一平面。右下的侧视图表示斜拍时长度投影可能变短。"><path d="M150 270 C55 193 80 90 150 42 C225 110 245 195 150 270Z" fill="var(--soft)" stroke="var(--blue)" stroke-width="2"/><path d="M150 42 V270" stroke="var(--blue)"/><path d="M150 270 L169 318" stroke="var(--muted)" stroke-width="7" fill="none"/><path d="M255 42 V270 M247 42 H263 M247 270 H263" stroke="var(--blue)" stroke-width="2"/><path d="M168 42 H244 M166 270 H244" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="280" y="52">叶尖</text><text x="280" y="160">本次记录的叶片长度</text><text x="280" y="280">叶片基部</text><text x="188" y="328">叶柄：不计入</text></svg><figcaption>测量口径示意：标尺与叶片尽量处于同一平面，不为观察随意采摘。</figcaption></figure><div class="angle-comparison"><div><strong>正视、同一平面</strong><svg viewBox="0 0 200 55" role="img" aria-label="侧面示意：对象与参照位于同一平面"><path d="M25 15 H175 M25 40 H175" stroke="currentColor" stroke-width="3"/><path d="M25 15 V40 M175 15 V40" stroke="currentColor" stroke-dasharray="3 3"/></svg><p>距离的比较有共同参照。</p></div><div><strong>斜拍、投影变短</strong><svg viewBox="0 0 200 85" role="img" aria-label="侧面示意：斜放的线段投影到参照平面后变短"><path d="M25 65 L145 15 M25 75 H175" stroke="currentColor" stroke-width="3"/><path d="M145 15 V75" stroke="currentColor" stroke-dasharray="3 3"/></svg><p>屏幕上的长短会受到角度影响。</p></div></div>`;}
  function visual(id,api,b){
    const p=t=>`<p>${api.inline(t)}</p>`,items=b.items||[];
    if(id==='V02')return frame(id,'照片多了一张，能确认什么？',`<div class="module-live"><div class="material-board"><span class="board-label">只有文字</span><p>桌上有几支笔？</p></div><div class="occlusion-views"><figure data-occluded hidden>${deskDrawing(false)}<figcaption>增加照片：完整可见 3 支；遮挡处暂时无法确认。</figcaption></figure><template data-uncovered><figure>${deskDrawing(true)}<figcaption>补充可见信息：在本示意图中，现在能确认 4 支。</figcaption></figure></template><div data-uncovered-slot></div></div>${controls('<button class="filled" data-photo>增加照片</button><button data-uncover hidden>看看被遮住的地方</button><button class="text-button" data-occlusion-reset hidden>回到遮挡状态</button>')}<p role="status" data-photo-status>先想一想：只有这句话，能确认数量吗？</p></div><div class="module-static"><div class="occlusion-views"><figure>${deskDrawing(false)}<figcaption>遮挡状态：3 支完整可见，其余暂时不能确认。</figcaption></figure><figure>${deskDrawing(true)}<figcaption>补充信息：此示意图中可以确认 4 支。</figcaption></figure></div></div>`,'笔和笔袋是预先绘制的教学示意；浏览器没有识别图片，不展示识别置信度。');
    if(id==='V03')return frame(id,'一个预测，处在研究的哪一步？',steps(['<strong>提出问题</strong><span>某些塑料怎样处理？</span>','<strong>结构预测</strong><span>AI 提供进一步研究的线索。</span>','<strong>实验检验</strong><span>检查判断、条件和效果。</span>','<strong>实际应用</strong><span>还需继续研究可行性。</span>']),'研究步骤示意；预测结果尚须实验验证，不表示污染问题已经解决。');
    if(id==='V04')return frame(id,'把两个时刻分开看',`<div class="time-lane"><h4>训练时 <small>提前练本领</small></h4>${steps(['训练材料','预测与比较','调整参数','形成模型能力'])}</div><div class="time-lane"><h4>回答时 <small>现在用材料</small></h4><div class="answer-relation"><div>现有模型</div><span>＋</span><div class="current-material">当前材料<p data-new-condition hidden>纸桥跨度是 15 厘米</p></div><span>→</span><div>生成回答</div></div><div class="module-live">${controls('<button class="filled" data-condition>把新条件放到当前材料</button><button class="text-button" data-condition-reset>只看关系</button>')}<p data-condition-result role="status"></p></div><div class="module-static"><p>新条件“纸桥跨度是 15 厘米”放进当前材料。这次回答可以利用这个条件。</p></div></div>`,'这是区分两个时刻的教学示意，没有展示完整训练流程。一次对话使用了新条件，不等于该信息被永久训练进模型。');
    if(id==='V05')return frame(id,'从资料柜，到当前工作桌',`<div class="memory-comparison"><div><span class="board-label">资料柜 · 可能保存的记录</span><p>旧安排：周六观察</p><p class="outdated">可能过时，需核对</p></div><div class="memory-check"><strong>找回并核对</strong><p>哪一份与任务有关？<br>日期和条件还适用吗？</p></div><div><span class="board-label">当前工作桌 · 这次可用的材料</span><p>最新说明：已改为周日</p><p>按最新说明重新安排。</p></div></div>`,'日期更新为独立教学情境。保存过的记录，需要找回并核对，才能进入当前材料；不同产品的记忆方式可能不同。');
    if(id==='V06')return frame(id,'反馈，让计划在这里拐了一个弯',`<div class="feedback-fork"><div><span class="board-label">原先打算</span><p>交三项完整资料</p></div><div><span class="board-label">收到新结果</span><p>C 无法准确对应</p></div><div class="changed-plan"><span class="board-label">调整以后</span><p>保留 A、B<br>C 留在待确认栏<br>交给老师检查</p></div></div>`,'工作步骤示意，不是模型内部思考的实况。');
    if(id==='V07')return frame(id,'同一句话，两种现场',`<p class="fixed-quote">“你可真会挑时间。”</p><div class="two-scenes">${items.map((x,i)=>`<div><span class="board-label">现场 ${i+1}</span>${p(x.text)}</div>`).join('')}</div>`,'语句保持不变，周围的事情改变了理解。还要结合语气与两人的关系。');
    if(id==='V09')return frame(id,'先看“近”，再看“适合”',`<div class="table-scroll" tabindex="0" role="region" aria-label="假想校园路线比较"><table><thead><tr><th scope="col">示例路线</th><th scope="col">距离</th><th scope="col">已有信息</th><th scope="col">还要检查</th></tr></thead><tbody><tr><th scope="row">A</th><td>180 米</td><td>经过空旷广场</td><td rowspan="2">开放情况、台阶与坡道、当天条件、使用者需要</td></tr><tr><th scope="row">B</th><td>260 米</td><td>部分路段有树荫</td></tr></tbody></table></div>`,'假想校园与示例距离，非真实导航。不采集位置，也不根据距离替你选出“最佳”。');
    if(id==='V10')return frame(id,'把想法改变的理由留下来',`<div class="version-comparison">${items.map((x,i)=>`<div><span class="board-label">${['第一判断','补充证据','修订判断'][i]}</span>${p(x.text)}</div>`).join('')}</div>`,'示例想法与方法提醒，未发生真实测量。旧判断保留，方便回看。');
    if(id==='V11'){
      const hints=[];items.forEach(x=>{if(x.type==='p'&&x.text.startsWith('**'))hints.push([]);if(hints.length)hints[hints.length-1].push(x);});
      return frame(id,'帮助，可以一次多给一点',`<p>我看到折法 B 有几次托住更多橡皮，不知道能不能写它永远更结实。</p><div class="module-live"><div class="hint-stack">${hints.map((h,i)=>`<section><button data-hint="${i}" aria-expanded="false" aria-controls="hint-${i}"><span>${['01 · 检查条件','02 · 选择比较方法','03 · 找到表达起点'][i]}</span>${['看第一点提示','再给我一点帮助','看看表达起点'][i]}</button><div id="hint-${i}" data-hint-body="${i}" hidden>${h.map(x=>p(x.text)).join('')}</div></section>`).join('')}</div>${controls('<button class="filled" data-hints-all>直接看全部提示</button><button class="text-button" data-hints-reset>收起提示</button>')}</div><div class="module-static">${items.map(x=>p(x.text)).join('')}</div>`,'这里不会生成结论，请使用你实际得到的记录。你可以停在任何一层，也可以继续阅读。');
    }
    if(id==='V12')return frame(id,'同样叫“长度”，量的是同一段吗？',leafDiagram(),'叶片为测量口径示意，不对应特定树种。上方六条长度记录均为示例数据，未进行实地测量。');
    if(id==='V13')return frame(id,'把主张与原文放在一起',`<p class="fiction-label">虚构查证练习</p><div class="evidence-comparison"><div><span class="board-label">准备写入作品的主张</span><p>这座桥<strong>建于 1998 年</strong>。</p></div><div><span class="board-label">练习档案 · 第 37 页</span><p>一张注明“1998 年”的桥梁照片。</p><p>假设拍摄日期与桥的身份已核实，未记载建造年份。</p></div></div><div class="module-live">${controls('<button class="filled" data-evidence-scope>原文支持了哪一步？</button>')}<div data-scope-answer hidden><p class="supported">能支持：1998 年<strong>已经存在</strong>。</p><p>暂时不能支持：恰好建于 1998 年。桥也可能更早建成；建造年份仍待查证。</p></div></div><div class="module-static"><p>能支持：1998 年已经存在。不能据此确认：恰好建于 1998 年。</p></div>`,'溪桥、书名、照片说明和页码均为练习编写，不是真实档案。');
    if(id==='V14')return frame(id,'把故事需要的材料留下',`<div class="redaction-comparison">${items.map((x,i)=>`<div><span class="board-label">${i?'精简以后':'原来的材料'}</span>${p(x.text)}</div>`).join('')}</div>`,'虚构材料对照。删除无关私密细节；只换姓名仍可能认出一个人。这里没有真实材料上传入口。');
    if(id==='V15')return frame(id,'准备与执行，有各自的范围',`<div class="permission-boundary"><div><span class="board-label">已授权的准备</span><p>比较公开信息<br>整理备选方案<br>交回草稿</p></div><div><span class="board-label">需要另行授权的行动</span><p>向家长发送通知<br>提交报名资料<br>付款</p></div></div>`,'行动的许可取决于当前授权。此处只解释边界，不发送消息、不提交信息、不执行交易。');
    if(id==='V16')return frame(id,'一本校园指南里，有许多种工作',`<div class="task-lines">${[['调查','听见新同学的困难'],['核对','确认地点与开放信息'],['设计','把路线画得看得清'],['表达','把说明写得读得懂'],['试用','带着反馈再改一版']].map(([a,z])=>`<p><strong>${a}</strong><span>${z}</span></p>`).join('')}</div>`,'职业情境示意，不预测职业消失，也不替你选择未来。');
    if(id==='V17')return frame(id,'一次反馈，怎样进入下一版',`<div class="version-comparison"><div><span class="board-label">原稿</span><p>按规定借阅。</p></div><div><span class="board-label">读者反馈</span><p>我还是不知道该问谁。</p></div><div><span class="board-label">改稿的方向</span><p>把学校允许公开的咨询角色放到这句话旁边。</p><p class="outdated">具体角色待老师确认，暂不对外发出。</p></div></div>`,'示例修改，只说明如何回应读者困难；没有补编学校联系人、开放时间或借阅规则。');
    if(id==='V18')return `<section class="letter-sheet" data-visual="V18"><span class="module-eyebrow">留在纸上 · 给未来的自己</span>${items.map(x=>p(x.text)).join('')}<p class="letter-note">这封信由你来写。这里不收集、不代写，也不上传。</p></section>`;
    return '';
  }
  function mount(container){
    const select=(node,sel)=>node.querySelector(sel);
    container.querySelectorAll('[data-module]').forEach(el=>{
      if(!select(el,'.module-live'))return;
      el.classList.add('module-ready');el.dataset.selected='0';el.dataset.workStep='0';
    });
    container.querySelectorAll('[data-visual]').forEach(el=>el.classList.add('module-ready'));
  }
  function handle(event,container){
    const target=event.target.closest('button');if(!target||!container.contains(target))return;
    const m=target.closest('[data-module],[data-visual]');if(!m)return;
    const $=s=>m.querySelector(s),all=s=>[...m.querySelectorAll(s)],kind=m.dataset.module;
    const feedback=()=>{const t=$(`template[data-option="${m.dataset.selected}"]`);return t?.content.querySelector('.explanation')?.cloneNode(true);};
    function resetAnswer(){if($('[data-answer]'))$('[data-answer]').hidden=true;all('[data-judge]').forEach(b=>b.setAttribute('aria-pressed','false'));if($('.choice-status'))$('.choice-status').textContent='';delete m.dataset.judgement;}
    if(target.hasAttribute('data-scenario')){
      m.dataset.selected=target.dataset.scenario;all('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));resetAnswer();
      const t=$(`template[data-option="${m.dataset.selected}"]`);
      if($('[data-material]')){$('[data-material]').replaceChildren(t.content.querySelector('.material').cloneNode(true));$('[data-material]').classList.remove('material-changed');void $('[data-material]').offsetWidth;$('[data-material]').classList.add('material-changed');}
      if($('[data-claim]'))$('[data-claim]').textContent=target.textContent;
      if($('[data-shapes]')){$('[data-shapes]').replaceChildren($(`template[data-geometry="${m.dataset.selected}"]`).content.cloneNode(true));m.classList.remove('perimeter-visible','area-visible');}
    }
    if(target.hasAttribute('data-judge')){
      if(target.closest('.agent-branch')){
        const branch=target.closest('.agent-branch');branch.querySelectorAll('[data-judge]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));
        $('.branch-feedback').textContent=target.dataset.judge==='0'?'补一个名称会让清单显得完整，却把没确认的猜测写成了事实。我们保留 C 的缺口，交给老师确认。':'保留待确认，让老师看见缺少什么。下一步留下 A、B，并明确 C 需要补充的材料。';
      }else{
        m.dataset.judgement=target.dataset.judge;all('[data-judge]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));$('.choice-status').textContent='先留住这份判断，再看看依据。';
      }
    }
    const reveal=()=>{
      const explanation=feedback();if(explanation)$('[data-feedback]')?.replaceChildren(explanation);if($('[data-answer]'))$('[data-answer]').hidden=false;
      if(kind==='evidence'||kind==='permission'){
        const correct=$(`template[data-correct="${m.dataset.selected}"]`).content.textContent.trim();
        $('[data-judgement-feedback]').textContent=m.dataset.judgement===undefined?'可以先看解释，再回头形成自己的判断。':m.dataset.judgement===correct?'你的判断有这样的依据：':'把这份初步判断与下面的依据放在一起，再想一想。';
        if(kind==='permission')$('[data-return]').textContent=m.dataset.selected==='0'?'交还：保留出处、核对时间与待确认事项。':m.dataset.selected==='1'?'交还：通知仅作草稿，请老师决定是否发送。':'交还：涉及报名、个人资料和费用，请相应负责人决定。';
      }
    };
    if(target.hasAttribute('data-reveal'))reveal();
    if(target.hasAttribute('data-show-all')){const s=$('.module-static');s.classList.toggle('reader-expanded');target.setAttribute('aria-expanded',String(s.classList.contains('reader-expanded')));target.textContent=s.classList.contains('reader-expanded')?'收起完整解释':'直接看全部解释';}
    if(target.hasAttribute('data-measure')){const p=target.dataset.measure;m.classList.add(p==='p'?'perimeter-visible':'area-visible');all(p==='p'?'.measure-p':'.measure-a').forEach(x=>x.hidden=false);}
    function work(step){m.dataset.workStep=String(step);$('[data-work-log]').replaceChildren($(`template[data-record="${step}"]`).content.cloneNode(true));$('.agent-branch').hidden=step!==1;all('[data-work-label]').forEach((x,i)=>{if(i===step)x.setAttribute('aria-current','step');else x.removeAttribute('aria-current');});$('[data-agent-prev]').disabled=step===0;$('[data-agent-next]').disabled=step===3;$('[data-agent-next]').textContent=['看工具返回的材料','保留缺口，调整清单','检查并交还','已交还给老师'][step];}
    if(target.hasAttribute('data-agent-next'))work(Math.min(3,Number(m.dataset.workStep)+1));
    if(target.hasAttribute('data-agent-prev'))work(Math.max(0,Number(m.dataset.workStep)-1));
    if(target.hasAttribute('data-agent-reset')){work(0);$('.branch-feedback').textContent='';all('.agent-branch [data-judge]').forEach(b=>b.setAttribute('aria-pressed','false'));}
    if(target.hasAttribute('data-agent-all')){$('[data-work-log]').replaceChildren(...all('template[data-record]').map(t=>t.content.cloneNode(true)));$('.agent-branch').hidden=false;}
    if(target.hasAttribute('data-photo')){$('[data-occluded]').hidden=false;target.hidden=true;$('[data-uncover]').hidden=false;$('[data-photo-status]').textContent='现在完整可见 3 支；遮挡处暂时无法确认。';$('[data-uncover]').focus({preventScroll:true});}
    if(target.hasAttribute('data-uncover')){$('[data-uncovered-slot]').replaceChildren($('template[data-uncovered]').content.cloneNode(true));target.hidden=true;$('[data-occlusion-reset]').hidden=false;$('[data-photo-status]').textContent='补充了可见信息，在本示意图中能确认 4 支。';$('[data-occlusion-reset]').focus({preventScroll:true});}
    if(target.hasAttribute('data-occlusion-reset')){$('[data-uncovered-slot]').replaceChildren();target.hidden=true;$('[data-uncover]').hidden=false;$('[data-photo-status]').textContent='回到遮挡状态，只能确认完整可见的 3 支。';$('[data-uncover]').focus({preventScroll:true});}
    if(target.hasAttribute('data-condition')){$('[data-new-condition]').hidden=false;$('[data-condition-result]').textContent='这次回答可以利用这个条件。训练时的参数调整流程保持原样。';}
    if(target.hasAttribute('data-condition-reset')){$('[data-new-condition]').hidden=true;$('[data-condition-result]').textContent='';}
    if(target.hasAttribute('data-hint')){const body=$(`[data-hint-body="${target.dataset.hint}"]`);body.hidden=!body.hidden;target.setAttribute('aria-expanded',String(!body.hidden));}
    if(target.hasAttribute('data-hints-all')||target.hasAttribute('data-hints-reset')){const open=target.hasAttribute('data-hints-all');all('[data-hint-body]').forEach(x=>x.hidden=!open);all('[data-hint]').forEach(x=>x.setAttribute('aria-expanded',String(open)));}
    if(target.hasAttribute('data-evidence-scope')){$('[data-scope-answer]').hidden=false;target.setAttribute('aria-expanded','true');}
  }
  function staticExtra(kind,d){if(kind!=='counterexample')return '';return `<div class="static-geometry">${d.options.map(o=>`<div class="rectangle-pair">${(o.meta.rectangles||[]).map(r=>rectangle(r.width,r.height,`${r.height}×${r.width}`).replaceAll(' hidden','')).join('')}</div>`).join('')}</div>`;}
  return {prepare,visual,demo,mount,handle,staticExtra};
});
