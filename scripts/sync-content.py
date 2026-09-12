from pathlib import Path
import json
import subprocess

root = Path(__file__).resolve().parents[1]
source = (root / 'dist/book.md').read_text(encoding='utf-8')
(root / 'dist/book-data.js').write_text('window.BOOK_SOURCE = ' + json.dumps(source, ensure_ascii=False) + ';\n', encoding='utf-8')
subprocess.run(['node', str(root / 'scripts/build-static.cjs')], check=True, cwd=root)
print('已同步正文、离线数据与静态阅读版。')
