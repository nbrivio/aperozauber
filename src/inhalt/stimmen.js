import { z } from 'astro/zod';
import stimmenRoh from '../../inhalt/stimmen.json';
import firmenRoh from '../../inhalt/firmen.json';

// Beides nur mit Einverständnis, das Feld hält fest, dass es vorliegt.
// Eine Stimme ist entweder eine öffentliche Rezension mit Quelle, als wörtlicher Auszug,
// oder eine persönliche Rückmeldung mit festgehaltenem Einverständnis.
const stimme = z
  .object({ text: z.string().min(1), von: z.string().min(1), quelle: z.string().min(1).optional(), einverstaendnis: z.literal(true).optional() })
  .refine((s) => s.quelle || s.einverstaendnis, { message: 'Eine Stimme braucht eine Quelle oder das Einverständnis.' });
// Logo: Dateiname in src/assets/firmen, freigestellt und einfarbig. Adresse: Website der Firma.
const firma = z.object({
  name: z.string().min(1),
  logo: z.string().regex(/^[a-z0-9-]+\.png$/).optional(),
  // Optischer Ausgleich: schwere Zeichen kleiner, schmale Schriftzüge breiter.
  mass: z.enum(['klein', 'breit']).optional(),
  adresse: z.string().url().startsWith('https://').optional(),
  einverstaendnis: z.literal(true),
});

export const stimmen = z.array(stimme).parse(stimmenRoh);
export const firmen = z.array(firma).parse(firmenRoh);
