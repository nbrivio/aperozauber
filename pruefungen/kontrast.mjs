// Rechnet die Farbpaare aus kontrast.json gegen ihre Schwelle.
import { readFile } from 'node:fs/promises';
import { farbtoken, kontrast } from '../src/inhalt/kontrast.js';
import { bericht } from './dateien.mjs';

const b = bericht('Kontrast');
const farben = farbtoken(await readFile('src/stile/tokens.css', 'utf8'));
const paare = JSON.parse(await readFile('pruefungen/kontrast.json', 'utf8'));

for (const { text, grund, mindestens, wofuer } of paare) {
  if (!farben[text] || !farben[grund]) {
    b.melde(`${text} auf ${grund}`, 'Token nicht gefunden');
    continue;
  }
  const wert = kontrast(farben[text], farben[grund]);
  if (wert < mindestens) b.melde(`${text} auf ${grund}`, `${wert.toFixed(2)}:1, verlangt ${mindestens}:1 (${wofuer})`);
}

b.schliesse(`${paare.length} Paare`);
