// Bekannte Sicherheitslücken in den Abhängigkeiten.
// Anders als «npm audit --audit-level=high» blockiert diese Prüfung nicht blind. Für eine Meldung,
// die das fertige Werk nachweislich nicht betrifft und für die es noch keine Behebung gibt, darf in
// abhaengigkeiten-ausnahmen.json eine Ausnahme stehen — mit Begründung und Ablaufdatum. Läuft sie ab,
// blockiert sie wieder. Wird eine Meldung nicht mehr gefunden, verlangt die Prüfung das Aufräumen.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { bericht } from './dateien.mjs';

const SCHWER = new Set(['high', 'critical']);
const ausnahmen = JSON.parse(readFileSync(new URL('./abhaengigkeiten-ausnahmen.json', import.meta.url), 'utf8'));
const heute = new Date().toISOString().slice(0, 10);

let roh;
try {
  roh = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (fehler) {
  roh = fehler.stdout ?? ''; // npm endet mit Status 1, sobald es etwas findet
}
if (!roh.trim()) {
  console.error('✗ Abhängigkeiten: npm audit lieferte keine Ausgabe');
  process.exit(1);
}

const gefunden = new Map();
for (const eintrag of Object.values(JSON.parse(roh).vulnerabilities ?? {})) {
  for (const via of eintrag.via ?? []) {
    if (typeof via === 'string' || !SCHWER.has(via.severity)) continue;
    const kennung = String(via.url ?? '').split('/').pop() || via.title;
    if (!gefunden.has(kennung)) gefunden.set(kennung, { paket: via.name, titel: via.title, schwere: via.severity });
  }
}

const b = bericht('Abhängigkeiten');
for (const [kennung, m] of gefunden) {
  const a = ausnahmen[kennung];
  if (!a) b.melde(kennung, `${m.schwere}: ${m.titel} (${m.paket})`);
  else if (a.pruefen_bis < heute) b.melde(kennung, `Ausnahme am ${a.pruefen_bis} abgelaufen, neu beurteilen (${m.paket})`);
  else console.log(`  hingenommen bis ${a.pruefen_bis}: ${kennung} (${m.paket}) — ${a.grund}`);
}
// Eine Ausnahme, deren Meldung verschwunden ist, ist Aufraeumarbeit und kein Sicherheitsproblem.
// Sie wird angemahnt, blockiert den Bau aber nicht: sonst bricht ausgerechnet die gute Nachricht
// die Veroeffentlichung.
for (const kennung of Object.keys(ausnahmen)) {
  if (!gefunden.has(kennung)) console.log(`  ueberfluessig: ${kennung} wird nicht mehr gemeldet, Eintrag entfernen`);
}
b.schliesse(`${gefunden.size} schwere Meldung(en), ${Object.keys(ausnahmen).length} hingenommen`);
