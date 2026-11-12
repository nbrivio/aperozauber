import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Alle Dateien unter einem Ordner, optional nach Endung gefiltert. */
export async function dateien(ordner, endung) {
  const gefunden = [];
  for (const eintrag of await readdir(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) gefunden.push(...(await dateien(pfad, endung)));
    else if (!endung || pfad.endsWith(endung)) gefunden.push(pfad);
  }
  return gefunden;
}

/** Sammelt Befunde und beendet die Prüfung mit dem passenden Status. */
export function bericht(name) {
  const befunde = [];
  return {
    melde: (ort, text) => befunde.push(`  ${ort}: ${text}`),
    schliesse(zusatz = '') {
      if (befunde.length > 0) {
        console.error(`✗ ${name}: ${befunde.length} Befund(e)\n${befunde.join('\n')}`);
        process.exit(1);
      }
      console.log(`✓ ${name}${zusatz ? ` (${zusatz})` : ''}`);
    },
  };
}
