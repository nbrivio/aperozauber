// Prüft jede gebaute Seite: Kopfangaben, Überschriften, Bilder, Verweise, Texte, strukturierte Daten.
import { readFile, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { dateien, bericht } from './dateien.mjs';
import { unterpfad } from './server.mjs';

const b = bericht('Seiten-Gate');
const seiten = await dateien('dist', '.html');

// Liefert den Wert eines Attributs, '' für ein leeres und undefined, wenn es fehlt.
const attribut = (tag, name) => {
  const treffer = tag.match(new RegExp(`\\s${name}(?:="([^"]*)")?(?=[\\s>])`));
  return treffer ? (treffer[1] ?? '') : undefined;
};
const vorhanden = (pfad) => access(pfad).then(() => true, () => false);

for (const datei of seiten) {
  const ort = relative('dist', datei);
  const html = await readFile(datei, 'utf8');
  const kopf = html.slice(0, html.indexOf('</head>'));
  const rumpf = html.slice(html.indexOf('<body'));
  const metas = [...kopf.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]);
  const meta = (schluessel) => {
    const tag = metas.find((m) => attribut(m, 'name') === schluessel || attribut(m, 'property') === schluessel);
    return tag ? attribut(tag, 'content') : undefined;
  };

  // Kopfangaben
  if (!/<html lang="de-CH">/.test(html)) b.melde(ort, 'lang="de-CH" fehlt');
  if (!/<title>[^<]{10,}<\/title>/.test(kopf)) b.melde(ort, 'Titel fehlt oder ist zu kurz');
  const beschreibung = meta('description');
  if (!beschreibung) b.melde(ort, 'Beschreibung fehlt');
  else if (beschreibung.length > 160) b.melde(ort, `Beschreibung hat ${beschreibung.length} Zeichen`);
  if (!/<link rel="canonical" href="https:\/\/[^"]+">/.test(kopf)) b.melde(ort, 'kanonische Adresse fehlt');
  for (const pflicht of ['robots', 'theme-color', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:locale', 'twitter:card']) {
    if (!meta(pflicht)) b.melde(ort, `Angabe ${pflicht} fehlt`);
  }
  if (meta('og:image:width') !== '1200' || meta('og:image:height') !== '630') b.melde(ort, 'Vorschaubild ist nicht 1200 auf 630');
  if (!metas.some((m) => attribut(m, 'http-equiv') === 'content-security-policy')) b.melde(ort, 'Content Security Policy fehlt');
  if (/unsafe-inline|unsafe-eval/.test(kopf)) b.melde(ort, 'Content Security Policy ist aufgeweicht');

  // Strukturierte Daten
  const daten = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (daten.length !== 1) b.melde(ort, `${daten.length} Blöcke mit strukturierten Daten, erwartet genau einer`);
  for (const block of daten) {
    try {
      if (!Array.isArray(JSON.parse(block[1])['@graph'])) b.melde(ort, 'strukturierte Daten ohne @graph');
    } catch {
      b.melde(ort, 'strukturierte Daten sind kein gültiges JSON');
    }
  }

  // Überschriften und Landmarken
  const ebenen = [...rumpf.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  if (ebenen.filter((e) => e === 1).length !== 1) b.melde(ort, 'nicht genau eine h1');
  ebenen.forEach((e, i) => {
    if (i > 0 && e > ebenen[i - 1] + 1) b.melde(ort, `Überschrift springt von h${ebenen[i - 1]} auf h${e}`);
  });
  for (const landmarke of ['header', 'main', 'footer']) {
    if (!new RegExp(`<${landmarke}[\\s>]`).test(rumpf)) b.melde(ort, `<${landmarke}> fehlt`);
  }

  // Bilder
  for (const [bild] of rumpf.matchAll(/<img\s[^>]*>/g)) {
    if (attribut(bild, 'alt') === undefined) b.melde(ort, `Bild ohne Alt-Text: ${attribut(bild, 'src')}`);
    if (!attribut(bild, 'width') || !attribut(bild, 'height')) b.melde(ort, `Bild ohne feste Masse: ${attribut(bild, 'src')}`);
  }

  // Verweise und eingebundene Dateien
  const ziele = [...html.matchAll(/<(a|link|img|script|source)\s[^>]*>/g)].flatMap(([tag, art]) => {
    const einzeln = [attribut(tag, 'href'), attribut(tag, 'src')];
    const satz = (attribut(tag, 'srcset') ?? '').split(',').map((teil) => teil.trim().split(/\s+/)[0]);
    return [...einzeln, ...satz].filter(Boolean).map((ziel) => ({ tag, art, ziel }));
  });
  for (const { tag, art, ziel } of ziele) {
    if (/^(mailto:|tel:|#)/.test(ziel)) continue;
    if (/^https?:\/\//.test(ziel)) {
      if (art !== 'a' && attribut(tag, 'rel') !== 'canonical') b.melde(ort, `fremde Datei eingebunden: ${ziel}`);
      if (art === 'a' && !(attribut(tag, 'rel') ?? '').includes('noopener')) b.melde(ort, `externer Verweis ohne rel="noopener": ${ziel}`);
      continue;
    }
    if (!ziel.startsWith(`${unterpfad}/`)) {
      b.melde(ort, `Verweis ohne Unterpfad: ${ziel}`);
      continue;
    }
    const lokal = join('dist', ziel.slice(unterpfad.length).split(/[?#]/)[0]);
    if (!(await vorhanden(lokal.endsWith('/') ? join(lokal, 'index.html') : lokal))) b.melde(ort, `Ziel fehlt: ${ziel}`);
  }

  // Sichtbarer Text
  const text = rumpf.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');
  const verboten = [
    [/ß/, 'ß statt ss'],
    [/[—–]/, 'Gedankenstrich im Text'],
    [/lorem ipsum|example\.(org|com)|platzhalter|todo/i, 'Platzhalter im Text'],
    [/Apero(?!zauber)/, '«Apéro» ohne Akzent'],
    [/"/, 'gerade Anführungszeichen statt «Guillemets»'],
  ];
  for (const [muster, hinweis] of verboten) {
    const treffer = text.match(muster);
    if (treffer) b.melde(ort, `${hinweis}: «${text.slice(Math.max(0, treffer.index - 20), treffer.index + 20).trim()}»`);
  }
}

// Sitemap und robots.txt
const sitemap = await readFile('dist/sitemap-0.xml', 'utf8').catch(() => '');
if (!sitemap) b.melde('sitemap', 'fehlt');
if (/<priority>|<changefreq>/.test(sitemap)) b.melde('sitemap', 'priority oder changefreq enthalten');
if (/grundlagen|404/.test(sitemap)) b.melde('sitemap', 'interne Seite enthalten');
if (!(await vorhanden('dist/robots.txt'))) b.melde('robots.txt', 'fehlt');

b.schliesse(`${seiten.length} Seiten`);
