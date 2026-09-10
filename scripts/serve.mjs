import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const root = process.argv.includes('--public') ? resolve(project, 'public') : project;
const config = JSON.parse(await readFile(resolve(project, 'firebase.json'), 'utf8'));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript', '.json':'application/json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ttf':'font/ttf', '.ico':'image/x-icon' };
const publicRoots = new Set(['index.html','studio.html','blogs.html','404.html','robots.txt','sitemap.xml','blog','css','js','img','fonts','puruvankara']);
createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const redirect = config.hosting.redirects?.find(rule => rule.source === pathname);
    if (redirect) { res.writeHead(redirect.type, { Location: redirect.destination + url.search }); res.end(); return; }
    const parts = pathname.split('/').filter(Boolean);
    if (parts.some(part => part.startsWith('.')) || (parts.length && !publicRoots.has(parts[0]))) throw new Error('Not public');
    let target = resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + sep)) throw new Error('Not public');
    let info = await stat(target);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + url.search }); res.end(); return; }
      target = resolve(target, 'index.html');
    }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(resolve(root, '404.html')).catch(() => 'Page not found'));
  }
}).listen(port, '127.0.0.1', () => console.log(`Alankaar Interiors: http://127.0.0.1:${port} (${process.argv.includes('--public') ? 'production build' : 'source preview'})`));
