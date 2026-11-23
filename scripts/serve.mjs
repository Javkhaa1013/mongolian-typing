/* Орон нутгийн сервер: node scripts/serve.mjs  ->  http://localhost:4321
   Эх файлуудыг шууд тараана (dist хэрэггүй). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT) || 4321;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

http.createServer((req, res) => {
  let clean;
  try { clean = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { clean = '/'; }
  const name = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const file = path.join(root, name);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Олдсонгүй: ' + name);
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
}).listen(port, () => console.log('http://localhost:' + port));
