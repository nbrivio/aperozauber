// Durchlauf im echten Browser: jede Seite auf fünf Breiten, ohne Überlauf, ohne Fehler in der Konsole
// (dort melden sich auch Verstösse gegen die Content Security Policy), dazu die Prüfung nach WCAG 2.2 AA
// und ein Tastaturdurchlauf mit sichtbarem Fokus. Zum Schluss jede Seite ohne JavaScript.
import { relative } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { dateien, bericht } from './dateien.mjs';
import { starteServer } from './server.mjs';

const breiten = [
  ['kleines Handy', 320, 640],
  ['grosses Handy', 430, 932],
  ['Tablet', 820, 1180],
  ['Laptop', 1366, 768],
  ['grosser Bildschirm', 1920, 1080],
];

const b = bericht('Browser-Durchlauf');
const seiten = (await dateien('dist', '.html')).map((d) => `/${relative('dist', d)}`.replace(/index\.html$/, ''));
const { adresse, schliessen } = await starteServer();
const browser = await chromium.launch({ channel: 'chrome' });

for (const seite of seiten) {
  for (const [name, width, height] of breiten) {
    const ort = `${seite} (${name})`;
    const kontext = await browser.newContext({ viewport: { width, height }, reducedMotion: name === 'Tablet' ? 'reduce' : 'no-preference' });
    const fenster = await kontext.newPage();
    fenster.on('console', (meldung) => meldung.type() === 'error' && !/404 \(Not Found\)/.test(meldung.text()) && b.melde(ort, `Konsole: ${meldung.text()}`));
    fenster.on('pageerror', (fehler) => b.melde(ort, `Skriptfehler: ${fehler.message}`));
    fenster.on('requestfailed', (anfrage) => b.melde(ort, `Abruf gescheitert: ${anfrage.url()}`));
    fenster.on('request', (anfrage) => !anfrage.url().startsWith(adresse) && b.melde(ort, `Abruf nach aussen: ${anfrage.url()}`));

    await fenster.goto(adresse + seite, { waitUntil: 'networkidle' });
    await fenster.evaluate(() => document.fonts.ready);

    const ueberlauf = await fenster.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ueberlauf > 0) b.melde(ort, `horizontaler Überlauf um ${ueberlauf} Pixel`);

    const kaputt = await fenster.evaluate(() => [...document.images].filter((bild) => bild.complete && bild.naturalWidth === 0).map((bild) => bild.currentSrc));
    for (const bild of kaputt) b.melde(ort, `Bild lädt nicht: ${bild}`);

    const { violations } = await new AxeBuilder({ page: fenster }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    for (const v of violations) b.melde(ort, `${v.id}: ${v.help} (${v.nodes.length}x, ${v.nodes[0].target.join(' ')})`);

    // Tastatur: jedes Ziel erreichbar, Fokus sichtbar und im Bild.
    const ziele = await fenster.locator('a[href], button, input, select, textarea, [tabindex="0"]').count();
    for (let i = 0; i < ziele; i += 1) {
      await fenster.keyboard.press('Tab');
      const fokus = await fenster.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return null;
        const r = e.getBoundingClientRect();
        const stil = getComputedStyle(e);
        return {
          name: e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label'),
          rahmen: stil.outlineStyle !== 'none' && parseFloat(stil.outlineWidth) >= 2,
          sichtbar: r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
          // Verweise im Fliesstext sind von der Mindestgrösse ausgenommen (WCAG 2.5.8).
          gross: stil.display === 'inline' || (r.width >= 24 && r.height >= 24),
        };
      });
      // Zurück am Seitenanfang: alle sichtbaren Ziele sind durchlaufen.
      if (!fokus) {
        if (i === 0) b.melde(ort, 'Tab erreicht kein Ziel');
        break;
      }
      {
        if (!fokus.rahmen) b.melde(ort, `kein Fokusrahmen: ${fokus.name}`);
        if (!fokus.sichtbar) b.melde(ort, `Fokus ausserhalb des Bildes: ${fokus.name}`);
        if (!fokus.gross) b.melde(ort, `Ziel kleiner als 24 Pixel: ${fokus.name}`);
      }
    }
    await kontext.close();
  }
}

// Bestellfenster: öffnet über die Blase, besteht die Prüfung, rechnet die Vorschau und schliesst mit Escape.
for (const [name, width, height] of [breiten[0], breiten[3]]) {
  const ort = `Bestellfenster (${name})`;
  const kontext = await browser.newContext({ viewport: { width, height } });
  const fenster = await kontext.newPage();
  fenster.on('console', (meldung) => meldung.type() === 'error' && b.melde(ort, `Konsole: ${meldung.text()}`));
  fenster.on('pageerror', (fehler) => b.melde(ort, `Skriptfehler: ${fehler.message}`));
  await fenster.goto(`${adresse}/`, { waitUntil: 'networkidle' });
  await fenster.mouse.wheel(0, height * 2);
  await fenster.locator('.blase.an').click();
  const dialog = fenster.locator('dialog[open]');
  if ((await dialog.count()) !== 1) {
    b.melde(ort, 'die Blase öffnet das Fenster nicht');
  } else {
    await dialog.locator('[data-schritt="1"]').first().click();
    await dialog.locator('#name').fill('Probe');
    const vorschau = await dialog.locator('[data-vorschau]').textContent();
    if (!/1 × /.test(vorschau) || !/Name: Probe/.test(vorschau)) b.melde(ort, 'die Vorschau zeigt die Angaben nicht');
    const breiter = await dialog.evaluate((e) => e.scrollWidth - e.clientWidth);
    if (breiter > 0) b.melde(ort, `Fenster läuft um ${breiter} Pixel über`);
    const { violations } = await new AxeBuilder({ page: fenster }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of violations) b.melde(ort, `${v.id}: ${v.help} (${v.nodes.length}x, ${v.nodes[0].target.join(' ')})`);
    await fenster.keyboard.press('Escape');
    if ((await fenster.locator('dialog[open]').count()) !== 0) b.melde(ort, 'Escape schliesst das Fenster nicht');
  }
  await kontext.close();
}

// Ohne JavaScript: die ruhige Fassung zeigt jede Überschrift und das Formular und läuft nicht über.
for (const seite of seiten) {
  const ort = `${seite} (ohne JavaScript)`;
  const kontext = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const fenster = await kontext.newPage();
  await fenster.goto(adresse + seite, { waitUntil: 'load' });
  for (const titel of await fenster.locator('h1, h2:not(.verborgen), h3').all()) {
    const sichtbar = await titel.evaluate((e) => {
      // Das Bestellfenster ist ohne Skript geschlossen, das Formular steht dann im Kapitel.
      if (e.closest('dialog:not([open])')) return true;
      const r = e.getBoundingClientRect();
      let deckkraft = 1;
      for (let k = e; k; k = k.parentElement) deckkraft *= Number(getComputedStyle(k).opacity);
      return r.width > 0 && r.height > 0 && deckkraft > 0.9 && getComputedStyle(e).visibility === 'visible';
    });
    if (!sichtbar) b.melde(ort, `Überschrift nicht sichtbar: ${(await titel.textContent()).trim().slice(0, 40)}`);
  }
  const formular = fenster.locator('form[data-anfrage]');
  if ((await formular.count()) === 1 && !(await formular.isVisible())) b.melde(ort, 'das Formular ist nicht sichtbar');
  const ueberlauf = await fenster.locator('html').evaluate((e) => e.scrollWidth - e.clientWidth);
  if (ueberlauf > 0) b.melde(ort, `horizontaler Überlauf um ${ueberlauf} Pixel`);
  await kontext.close();
}

await browser.close();
await schliessen();
b.schliesse(`${seiten.length} Seiten auf ${breiten.length} Breiten`);
