import { z } from 'astro/zod';
import roh from '../../inhalt/hinweis.json';

const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als JJJJ-MM-TT');

const schema = z
  .object({ text: z.string(), von: tag.nullable(), bis: tag.nullable() })
  .refine((h) => h.text === '' || (h.von && h.bis), 'Ein Hinweis braucht «von» und «bis».')
  .refine((h) => !h.von || !h.bis || h.von <= h.bis, '«von» liegt nach «bis».');

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
