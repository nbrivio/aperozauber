// Liefert den gebauten Ordner lokal aus, unter demselben Unterpfad wie auf der Zieladresse.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const arten = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

export const unterpfad = (process.env.SITE_PFAD ?? '/').replace(/\/$/, '');

export async function starteServer(ordner = 'dist') {
  const wurzel = resolve(ordner);
  const server = createServer(async (anfrage, antwort) => {
    const pfad = decodeURIComponent(new URL(anfrage.url, 'http://lokal').pathname);
    const innen = pfad.startsWith(unterpfad) ? pfad.slice(unterpfad.length) : null;
    let datei = innen === null ? null : join(wurzel, normalize(innen));
    try {
      if (!datei || !datei.startsWith(wurzel)) throw new Error('ausserhalb');
      if ((await stat(datei)).isDirectory()) datei = join(datei, 'index.html');
      antwort.writeHead(200, { 'Content-Type': arten[extname(datei)] ?? 'application/octet-stream' });
      antwort.end(await readFile(datei));
    } catch {
      antwort.writeHead(404, { 'Content-Type': arten['.html'] });
      antwort.end(await readFile(join(wurzel, '404.html')));
    }
  });
  await new Promise((fertig) => server.listen(0, '127.0.0.1', fertig));
  const adresse = `http://127.0.0.1:${server.address().port}${unterpfad}`;
  return { adresse, schliessen: () => new Promise((fertig) => server.close(fertig)) };
}
