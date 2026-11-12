import { z } from 'astro/zod';
import roh from '../../inhalt/betrieb.json';

// Eine Quelle für Name, Ort und Kontakt: Seite, Fuss und strukturierte Daten lesen hier.
const schema = z.object({
  name: z.string().min(1),
  inhaberin: z.string().min(1),
  strasse: z.string().min(1),
  plz: z.string().regex(/^\d{4}$/),
  ort: z.string().min(1),
  land: z.string().length(2),
  email: z.email(),
  instagram: z.url(),
});

export const betrieb = schema.parse(roh);
