from pathlib import Path
import json
import subprocess

root = Path(__file__).resolve().parents[1]
source = (root / 'dist/book.md').read_text(encoding='utf-8')
(root / 'dist/book-data.js').write_text('window.BOOK_SOURCE = ' + json.dumps(source, ensure_ascii=False) + ';\n', encoding='utf-8')
motion = json.loads((root / 'content/animation-scripts.json').read_text(encoding='utf-8'))
assert len(motion['scenes']) == 7 and len({s['visual'] for s in motion['scenes']}) == 7
for scene in motion['scenes']:
    assert all(scene.get(key) for key in ['id', 'visual', 'chapter', 'title', 'boundary', 'steps'])
    assert all(all(step.get(key) for key in ['title', 'caption', 'alt']) for step in scene['steps'])
bundle = '(function(root){const data=' + json.dumps(motion, ensure_ascii=False) + ';if(typeof module!=="undefined")module.exports=data;else root.BookMotionData=data;})(typeof window!=="undefined"?window:{});\n'
(root / 'dist/motion-data.js').write_text(bundle, encoding='utf-8')
script = ['# 门后的光 · 动画字幕与解说稿 v' + motion['version'], '', '字幕与语音使用同一份文字。语音由读者主动开启，取决于设备是否提供中文朗读声音。', '']
for scene in motion['scenes']:
    script.extend([f"## {scene['chapter']} · {scene['title']}", '', f"<!-- visual: {scene['visual']} -->", '', scene['boundary'], ''])
    for index, step in enumerate(scene['steps'], 1):
        script.extend([f"### {index}. {step['title']}", '', step['caption'], '', '**画面说明：** ' + step['alt'], ''])
(root / 'dist/animation-script.md').write_text('\n'.join(script), encoding='utf-8')
subprocess.run(['node', str(root / 'scripts/build-static.cjs')], check=True, cwd=root)
print('已同步正文、七段动画脚本、离线数据与静态阅读版。')
