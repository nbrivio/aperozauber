// Prüft, dass die Seite für die richtige Adresse bereit ist und nichts an Sichtbarkeit verliert:
// jede bisherige Adresse führt auf eine bestehende Seite, und auf der richtigen Adresse zeigt alles auf www.aperozauber.ch.
import { readFile, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { dateien, bericht } from './dateien.mjs';
import { unterpfad } from './server.mjs';
import { weiterleitungen, bisherigeAdressen } from '../src/inhalt/weiterleitungen.js';

const b = bericht('Umstellung');
const live = process.env.SITE_STUFE === 'live';
const hauptadresse = 'https://www.aperozauber.ch';
const vorhanden = (p) => access(p).then(() => true, () => false);
const seitenDatei = (pfad) => join('dist', pfad.replace(/^\//, ''), 'index.html');

// 1. Jede bisherige Adresse muss ankommen: als Seite oder als Weiterleitung auf eine Seite.
for (const alt of bisherigeAdressen) {
  const datei = seitenDatei(alt === '/' ? '/' : `${alt.replace(/\/$/, '')}/`);
  if (!(await vorhanden(datei))) {
    b.melde(alt, 'bisherige Adresse führt ins Leere');
    continue;
  }
  const html = await readFile(datei, 'utf8');
  const ziel = html.match(/http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
  if (!ziel) continue;
  if (!ziel.startsWith(`${unterpfad}/`)) b.melde(alt, `Weiterleitung zeigt ausserhalb der Seite: ${ziel}`);
  else if (!(await vorhanden(seitenDatei(ziel.slice(unterpfad.length))))) b.melde(alt, `Weiterleitungsziel fehlt: ${ziel}`);
  if (weiterleitungen[alt] === undefined) b.melde(alt, 'Weiterleitung ohne Eintrag in weiterleitungen.js');
}

const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
const sitemapAdressen = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const alt of Object.keys(weiterleitungen)) {
  if (sitemapAdressen.some((a) => a.endsWith(`${alt}/`))) b.melde(alt, 'Weiterleitung steht in der Sitemap');
}

// 2. Die Hauptseiten der bisherigen Seite müssen in der Sitemap bleiben.
for (const alt of ['/', '/angebot/', '/uebermich/', '/info/', '/impressum/']) {
  if (!sitemapAdressen.some((a) => a === `${hauptadresse}${alt}` || a.endsWith(`${unterpfad}${alt}`))) {
    b.melde(alt, 'fehlt in der Sitemap');
  }
}

if (!(await vorhanden('dist/sitemap.xml'))) b.melde('sitemap.xml', 'alter Sitemap-Pfad fehlt');

const robots = await readFile('dist/robots.txt', 'utf8');
const seiten = await dateien('dist', '.html');

if (live) {
  // 3. Auf der richtigen Adresse zeigt jede Angabe auf www, ohne Unterpfad, ohne Testadresse.
  if (unterpfad !== '') b.melde('SITE_PFAD', `muss auf der richtigen Adresse leer sein, ist «${unterpfad}»`);
  if (!robots.includes(`Sitemap: ${hauptadresse}/sitemap-index.xml`)) b.melde('robots.txt', 'Sitemap-Zeile fehlt oder zeigt falsch');
  if (/^Disallow: \/$/m.test(robots)) b.melde('robots.txt', 'sperrt die ganze Seite');
  for (const a of sitemapAdressen) if (!a.startsWith(`${hauptadresse}/`)) b.melde('Sitemap', `falsche Adresse: ${a}`);

  for (const datei of [...seiten, 'dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/robots.txt', 'dist/llms.txt']) {
    if (!(await vorhanden(datei))) continue;
    const ort = relative('dist', datei);
    const text = await readFile(datei, 'utf8');
    if (/github\.io/.test(text)) b.melde(ort, 'verweist auf die Testadresse');
    if (/https?:\/\/aperozauber\.ch/.test(text)) b.melde(ort, 'verweist auf aperozauber.ch ohne www');
    if (!datei.endsWith('.html')) continue;
    const umleitung = /http-equiv="refresh"/.test(text);
    const kanon = text.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!kanon) b.melde(ort, 'Canonical fehlt');
    else if (!kanon.startsWith(`${hauptadresse}/`) || !kanon.endsWith('/')) b.melde(ort, `Canonical falsch: ${kanon}`);
    if (!umleitung && ort !== '404.html' && /<meta name="robots" content="[^"]*noindex/.test(text) && !ort.startsWith('grundlagen')) {
      b.melde(ort, 'noindex auf einer Seite, die in die Suche soll');
    }
  }
} else if (!/^Disallow: \/$/m.test(robots)) {
  b.melde('robots.txt', 'Testadresse muss für Suchmaschinen gesperrt sein');
}

b.schliesse(`${bisherigeAdressen.length} bisherige Adressen, ${sitemapAdressen.length} in der Sitemap, Stufe ${live ? 'live' : 'test'}`);
