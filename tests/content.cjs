const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const engine = require('../dist/reader-engine.js');
const modules = require('../dist/reading-modules.js');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const source = read('dist/book.md');
const chapters = engine.parseBook(source);
assert.deepEqual(chapters.map(c=>c.id),['preface',...Array.from({length:18},(_,i)=>'ch'+String(i+1).padStart(2,'0'))]);
assert.equal(chapters[4].title,'一句话，怎样接着长出来');
const data={window:{}};vm.runInNewContext(read('dist/book-data.js'),data);
assert.equal(data.window.BOOK_SOURCE,source,'download and bundled manuscript must match');
const html=chapters.map(engine.renderChapter).join('\n');
const types=[...html.matchAll(/data-module="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(types,['prediction','context','agent','counterexample','evidence','permission']);
for(const chapter of chapters){
  const rendered=engine.renderChapter(chapter);
  // Every authored paragraph remains available, even when moved into a visual layout.
  for(const block of engine.parseBlocks(chapter.body)){
    if(block.type==='p')assert.ok(rendered.includes(engine.inline(block.text)),`Missing paragraph in ${chapter.id}: ${block.text.slice(0,24)}`);
  }
}
assert.ok(html.includes('<table>')&&html.includes('scope="col"')&&html.includes('scope="row"'),'tables must retain accessible headers');
assert.ok(html.includes('6.2')&&html.includes('7.0')&&html.includes('5.8'),'leaf example records must remain');
const figures=modules.staticExtra('counterexample',{options:[{meta:{rectangles:[{width:9,height:1},{width:4,height:4},{width:3,height:2},{width:5,height:4}]}}]});
for(const value of ['20 厘米','16 厘米','10 厘米','18 厘米','9 平方厘米','16 平方厘米','6 平方厘米','20 平方厘米'])assert.ok(figures.includes(value),value);
assert.equal((figures.match(/viewBox="0 0 242 132"/g)||[]).length,4,'all rectangles use one scale');
assert.ok(!figures.includes(' hidden'),'static geometry must expose results');
const unknown=engine.renderMarkdown(':::interactive future-kind\n保留标题\n说明\n### 选项\n完整后备正文\n:::');
assert.ok(unknown.includes('完整后备正文')&&unknown.includes('module-static'));
const malformed=engine.renderMarkdown(':::interactive counterexample\n标题\n说明\n### 情境\n<!-- option: {"schemaVersion":1,"rectangles":null} -->\n<!-- response -->\n仍可阅读的解释\n:::');
assert.ok(malformed.includes('仍可阅读的解释'),'malformed enhancement must not erase text');
const visual=modules.visual;modules.visual=()=>{throw Error('fixture');};
const originalJudgement=engine.parseBlocks(chapters[10].body).find(b=>b.type==='p'&&b.text.startsWith('“原来，'));
assert.ok(engine.renderChapter(chapters[10]).includes(engine.inline(originalJudgement.text)),'failed visual keeps moved prose');modules.visual=visual;
const hints=engine.renderChapter(chapters[11]);
assert.equal((hints.match(/data-hint="\d"/g)||[]).length,3,'all three authored hints must remain individually available after wording changes');
assert.ok(hints.includes('hint-2'),'third hint retains its accessible target');
assert.ok(!engine.inline('[bad](javascript:alert(1))').includes('href='));
assert.ok(!engine.inline('<img src=x onerror=alert(1)>').includes('<img'));
const staticHtml=read('dist/read.html');
assert.equal((staticHtml.match(/class="chapter-static"/g)||[]).length,19);
assert.ok(!/<script\b/.test(staticHtml),'static book must need no scripts');
assert.ok(!/<details class="reading-detail">/.test(staticHtml),'static source notes open by default');
assert.equal((staticHtml.match(/class="lesson-transcript" open/g)||[]).length,7,'all illustrated transcripts are open in the static book');
assert.equal((staticHtml.match(/class="storyboard-frame"/g)||[]).length,35,'static book contains every animation step');
assert.equal((staticHtml.match(/class="chapter-static"/g)||[]).length,(staticHtml.match(/<article class="prose">/g)||[]).length);
const removedName=String.fromCodePoint(0x601d,0x7fbd);
for(const file of ['dist/book.md','dist/book-data.js','dist/read.html','dist/index.html','dist/app.js'])assert.ok(!read(file).includes(removedName),`Unexpected personal name: ${file}`);
console.log('PASS: 19 chapters, source sync, paragraph preservation, six modules, tables, geometry, safe fallbacks, static reading, anonymous copy.');
