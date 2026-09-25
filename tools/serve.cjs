const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, {'content-type':mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
}).listen(Number(process.env.PORT) || 0, '127.0.0.1', function () {
  console.log(`Preview: http://127.0.0.1:${this.address().port}`);
});
