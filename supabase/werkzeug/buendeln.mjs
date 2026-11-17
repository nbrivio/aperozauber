// Fasst die Funktion in eine einzige Datei zusammen, die sich im Supabase-Dashboard einfügen lässt.
// Aufruf: node supabase/werkzeug/buendeln.mjs  →  supabase/functions/anfrage/gebuendelt.ts
import { readFileSync, writeFileSync } from 'node:fs';
const ordner = new URL('../functions/anfrage/', import.meta.url);
const lies = (n) => readFileSync(new URL(n, ordner), 'utf8');
const ohneExport = (t) => t.replace(/^export (async )?function /gm, '$1function ').replace(/^export const /gm, 'const ');
const haupt = lies('index.ts').replace(/^import .*(text|sendezeit)\.mjs';\n/gm, '');
const teile = [
  '// Gebündelt aus text.mjs, sendezeit.mjs und index.ts. Nicht von Hand ändern: node supabase/werkzeug/buendeln.mjs',
  haupt.split('\n').filter((z) => z.startsWith('import ')).join('\n'),
  '',
  ohneExport(lies('sendezeit.mjs')),
  ohneExport(lies('text.mjs')),
  haupt.split('\n').filter((z) => !z.startsWith('import ')).join('\n'),
];
writeFileSync(new URL('gebuendelt.ts', ordner), teile.join('\n'));
