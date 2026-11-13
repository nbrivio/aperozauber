// Misst die Startseite wie auf einem mittleren Handy mit gedrosseltem Netz, dreimal.
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { bericht } from './dateien.mjs';
import { starteServer } from './server.mjs';

const grenzen = {
  'largest-contentful-paint': [2500, 'ms', 'grösstes Element'],
  'cumulative-layout-shift': [0.1, '', 'Layoutsprung'],
  'total-blocking-time': [200, 'ms', 'blockierte Zeit'],
  'total-byte-weight': [1_000_000, 'Bytes', 'Seitengewicht'],
};

const b = bericht('Ladezeit');
const { adresse, schliessen } = await starteServer();
const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });

// Eine einzelne Messung schwankt mit der Maschine. Gewertet wird der mittlere von drei Läufen.
const laeufe = [];
for (let i = 0; i < 3; i += 1) {
  const { lhr: lauf } = await lighthouse(`${adresse}/`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
  laeufe.push(lauf);
}
const lcp = (lauf) => lauf.audits['largest-contentful-paint'].numericValue;
const lhr = laeufe.sort((a, b) => lcp(a) - lcp(b))[1];
await chrome.kill();
await schliessen();

const werte = [];
for (const [pruefung, [grenze, einheit, name]] of Object.entries(grenzen)) {
  const wert = lhr.audits[pruefung].numericValue;
  werte.push(`${name} ${Math.round(wert * 1000) / 1000}${einheit ? ` ${einheit}` : ''}`);
  if (wert > grenze) b.melde(name, `${wert} ${einheit}, erlaubt ${grenze}`);
}
for (const [bereich, mindestens] of [['performance', 0.95], ['accessibility', 1], ['best-practices', 1]]) {
  const punkte = lhr.categories[bereich].score;
  werte.push(`${bereich} ${Math.round(punkte * 100)}`);
  if (punkte < mindestens) {
    const schwach = Object.values(lhr.audits).filter((a) => lhr.categories[bereich].auditRefs.some((r) => r.id === a.id && r.weight > 0) && a.score !== null && a.score < 1).map((a) => a.id);
    b.melde(bereich, `${Math.round(punkte * 100)} Punkte, verlangt ${mindestens * 100} (${schwach.join(', ')})`);
  }
}

await mkdir('berichte', { recursive: true });
await writeFile('berichte/ladezeit.json', JSON.stringify(lhr));
b.schliesse(werte.join(', '));
