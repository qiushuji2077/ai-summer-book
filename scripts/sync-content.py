from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
source = (root / 'dist/book.md').read_text(encoding='utf-8')
(root / 'dist/book-data.js').write_text('window.BOOK_SOURCE = ' + json.dumps(source, ensure_ascii=False) + ';\n', encoding='utf-8')
print('已同步文稿与离线阅读数据。')
