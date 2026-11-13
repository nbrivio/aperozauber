import { z } from 'astro/zod';
import stimmenRoh from '../../inhalt/stimmen.json';
import firmenRoh from '../../inhalt/firmen.json';

// Beides nur mit Einverständnis, das Feld hält fest, dass es vorliegt.
const stimme = z.object({ text: z.string().min(1), von: z.string().min(1), einverstaendnis: z.literal(true) });
const firma = z.object({ name: z.string().min(1), einverstaendnis: z.literal(true) });

export const stimmen = z.array(stimme).parse(stimmenRoh);
export const firmen = z.array(firma).parse(firmenRoh);
