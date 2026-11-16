// Prüft die Regel für die automatische Bestätigung: 20 Minuten nach der Anfrage, nur zwischen 08:00 und 21:00.
import { sendezeit } from '../supabase/functions/_shared/sendezeit.mjs';
import { bericht } from './dateien.mjs';

const b = bericht('Sendezeit');
const lokal = (z) => new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }).format(z);
const stunde = (z) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hourCycle: 'h23' }).format(z));
const min = (a, z) => Math.round((z - a) / 60000);

const faelle = [
  ['2026-11-17T10:00:00Z', 'mittags: 18 bis 22 Minuten später', (a, z) => min(a, z) >= 18 && min(a, z) <= 22],
  ['2026-11-17T19:45:00Z', '20:45 Uhr: wäre 21:05, deshalb am nächsten Morgen', (a, z) => lokal(z).startsWith('18.11.26, 08:')],
  ['2026-11-17T20:50:00Z', '21:50 Uhr: am nächsten Morgen', (a, z) => lokal(z).startsWith('18.11.26, 08:')],
  ['2026-11-17T03:00:00Z', '04:00 Uhr nachts: am selben Morgen um 08', (a, z) => lokal(z).startsWith('17.11.26, 08:')],
  ['2026-07-01T05:50:00Z', 'Sommerzeit 07:50 Uhr: 08:10 Uhr, im Fenster', (a, z) => lokal(z) === '01.07.26, 08:10' || (stunde(z) === 8 && min(a, z) <= 22)],
  ['2026-03-28T20:30:00Z', 'Vortag der Zeitumstellung, 21:30 Uhr: 08 Uhr Sommerzeit', (a, z) => lokal(z).startsWith('29.03.26, 08:')],
  ['2026-10-24T20:30:00Z', 'Vortag der Rückstellung, 22:30 Uhr: 08 Uhr Winterzeit', (a, z) => lokal(z).startsWith('25.10.26, 08:')],
];
for (const zufall of [() => 0, () => 0.5, () => 0.999]) {
  for (const [eingang, text, ok] of faelle) {
    const a = Date.parse(eingang);
    const z = sendezeit(a, { zufall });
    if (!ok(a, z)) b.melde(text, `Eingang ${lokal(a)}, Versand ${lokal(z)}`);
    if (stunde(z) < 8 || stunde(z) >= 21) b.melde(text, `ausserhalb des Fensters: ${lokal(z)}`);
  }
}
// Zufällig gestreut: 2000 Eingänge über zwei Wochen, nie ausserhalb 08 bis 21.
for (let i = 0; i < 2000; i++) {
  const a = Date.parse('2026-03-20T00:00:00Z') + Math.random() * 14 * 86_400_000;
  const z = sendezeit(a);
  if (stunde(z) < 8 || stunde(z) >= 21 || z <= a) b.melde('Zufallslauf', `Eingang ${lokal(a)}, Versand ${lokal(z)}`);
}
b.schliesse(`${faelle.length * 3} Fälle und 2000 Zufallsläufe`);
