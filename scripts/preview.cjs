// Development-only static server. The published book needs no server runtime.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const args = process.argv.slice(2);
const flag = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const port = Number(flag('--port', '4173'));
const host = flag('--host', '0.0.0.0');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
http.createServer((req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/__qa') {
      const content = fs.readFileSync(path.resolve(__dirname, '../tests/layout.html'));
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
      return res.end(req.method === 'HEAD' ? undefined : content);
    }
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const size = fs.statSync(file).size;
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start = 0, end = size - 1;
    if (range) {
      start = Number(range[1]); end = Math.min(range[2] ? Number(range[2]) : end, end);
      if (start > end) { res.writeHead(416, {'Content-Range':`bytes */${size}`}); return res.end(); }
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
    res.writeHead(range ? 206 : 200, {...headers, 'Content-Length':end-start+1});
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file,{start,end}).pipe(res);
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port,host,()=>console.log(`Book preview available on port ${port}`));
