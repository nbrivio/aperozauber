import { z } from 'astro/zod';
import roh from '../../inhalt/hinweis.json';

const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als JJJJ-MM-TT');

// Das Band zeigt hoechstens zwei Zeilen. Auf einem schmalen Handy passen rund 50 Zeichen je Zeile,
// alles darueber wird stillschweigend abgeschnitten. Darum hier eine harte Grenze: lieber ein
// fehlgeschlagener Bau als ein Hinweis, dessen Pointe auf dem Handy fehlt.
const MAX_ZEICHEN = 95;

const schema = z
  .object({ text: z.string(), von: tag.nullable(), bis: tag.nullable() })
  .refine((h) => h.text === '' || (h.von && h.bis), 'Ein Hinweis braucht «von» und «bis».')
  .refine((h) => !h.von || !h.bis || h.von <= h.bis, '«von» liegt nach «bis».')
  .refine(
    (h) => h.text.length <= MAX_ZEICHEN,
    `Der Hinweis ist zu lang: hoechstens ${MAX_ZEICHEN} Zeichen, sonst wird er auf dem Handy abgeschnitten.`,
  );

const hinweis = schema.parse(roh);

/** Heutiges Datum in der Schweiz als JJJJ-MM-TT. */
function heute() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());
}

/** Der Hinweis, falls heute einer gilt, sonst null. Der tägliche Neubau hält das aktuell. */
export function gueltigerHinweis(stichtag = heute()) {
  if (!hinweis.text) return null;
  return hinweis.von <= stichtag && stichtag <= hinweis.bis ? hinweis.text : null;
}
