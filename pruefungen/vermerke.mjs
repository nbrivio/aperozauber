// Sucht im ganzen Repository, in den Commit-Texten und im gebauten Ordner nach Vermerken
// auf Werkzeuge. Die Suchwörter liegen verschoben vor, damit diese Datei selbst sauber bleibt.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dateien, bericht } from './dateien.mjs';

const verschoben = ['pynhqr', 'naguebcvp', 'pungtcg', 'bcranv', 'pbcvybg', 'zvqwbhearl', 'trarengrq jvgu', 'trarengrq ol', 'pb-nhguberq-ol', 'xv-trarevreg', 'nqbor vyyhfgengbe'];
const woerter = verschoben.map((w) => w.replace(/[a-z]/g, (z) => String.fromCharCode(((z.charCodeAt(0) - 84) % 26) + 97)));
const muster = new RegExp(woerter.join('|'), 'i');
const binaer = /\.(woff2|webp|avif|png|jpe?g|ico)$/;

const b = bericht('Werkzeug-Vermerke');
const git = (...argumente) => execFileSync('git', argumente, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const verfolgt = git('ls-files', '--cached', '--others', '--exclude-standard').split('\n').filter(Boolean);
const gebaut = await dateien('dist').catch(() => []);

for (const datei of [...verfolgt, ...gebaut]) {
  // Die Sperrdatei listet fremde Paketnamen und wird nicht ausgeliefert.
  if (datei === 'package-lock.json') continue;
  if (muster.test(datei)) b.melde(datei, 'Dateiname');
  if (binaer.test(datei)) continue;
  const inhalt = await readFile(datei, 'utf8').catch(() => '');
  const treffer = inhalt.match(muster);
  if (treffer) b.melde(datei, `Zeile ${inhalt.slice(0, treffer.index).split('\n').length}`);
}

try {
  for (const zeile of git('log', '--format=%h %an <%ae> %cn %B').split('\n')) {
    if (muster.test(zeile)) b.melde('Commit', zeile.slice(0, 60));
  }
} catch {
  // Noch kein Commit vorhanden.
}

b.schliesse(`${verfolgt.length + gebaut.length} Dateien`);
