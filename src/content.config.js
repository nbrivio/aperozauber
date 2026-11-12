import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const groesse = z.object({
  groesse: z.enum(['S', 'M', 'L']),
  personen: z.string().min(1),
  preis: z.number().positive(),
});

// Je Kreation und Beilage eine Datei. Solange «bestaetigt» auf false steht,
// ist der Eintrag ein Entwurf: Er wird auf der Testadresse geduldet,
// eine Veröffentlichung auf der richtigen Adresse schlägt fehl.
const kreationen = defineCollection({
  loader: glob({ pattern: '*.md', base: './inhalt/kreationen' }),
  schema: ({ image }) =>
    z
      .object({
        name: z.string().min(1),
        art: z.enum(['kreation', 'beilage']),
        reihenfolge: z.number().int(),
        satz: z.string().min(1).optional(),
        groessen: z.array(groesse).default([]),
        stueckpreis: z.number().positive().optional(),
        allergene: z.array(z.string()).optional(),
        vegetarisch: z.boolean().optional(),
        bild: image().optional(),
        bildAlt: z.string().min(12, 'Der Alt-Text beschreibt die Szene in einem Satz.').optional(),
        bestaetigt: z.boolean(),
      })
      .superRefine((k, ctx) => {
        if (k.bild && !k.bildAlt) {
          ctx.addIssue({ code: 'custom', path: ['bildAlt'], message: 'Jedes Bild braucht einen Alt-Text.' });
        }
        if (!k.bestaetigt) return;
        const fehlt = (feld, text) => ctx.addIssue({ code: 'custom', path: [feld], message: text });
        if (!k.satz) fehlt('satz', 'Ein bestätigter Eintrag braucht seinen Satz.');
        if (!k.bild) fehlt('bild', 'Ein bestätigter Eintrag braucht ein Bild.');
        if (!k.allergene) fehlt('allergene', 'Allergene angeben, bei keinen eine leere Liste.');
        if (k.art === 'kreation' && k.groessen.length === 0) fehlt('groessen', 'Grössen mit Preis fehlen.');
        if (k.art === 'beilage' && !k.stueckpreis) fehlt('stueckpreis', 'Der Stückpreis fehlt.');
      }),
});

// Alle Texte der Startseite, je Kapitel eine Datei. Der Fliesstext steht unter den Angaben.
const texte = defineCollection({
  loader: glob({ pattern: '*.md', base: './inhalt/texte' }),
  schema: z.object({
    kapitel: z.string().min(1),
    dachzeile: z.string().optional(),
    titel: z.string().min(1),
    knopf: z.string().optional(),
    abgang: z.string().optional(),
    quelle: z.string().optional(),
    freigegeben: z.boolean(),
  }),
});

export const collections = { kreationen, texte };
