import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const altText = z.string().min(12, 'Der Alt-Text beschreibt die Szene in einem Satz.');

const groesse = z.object({
  groesse: z.enum(['S', 'M', 'L']),
  personen: z.string().min(1),
  // Richtpreis «ab» in Franken.
  preis: z.number().positive(),
});

// Je Kreation und Beilage eine Datei, die Beschreibung steht unter den Angaben.
// Solange «bestaetigt» auf false steht, ist der Eintrag ein Entwurf: Er wird auf der
// Testadresse geduldet, eine Veröffentlichung auf der richtigen Adresse schlägt fehl.
const kreationen = defineCollection({
  loader: glob({ pattern: '*.md', base: './inhalt/kreationen' }),
  schema: ({ image }) =>
    z
      .object({
        name: z.string().min(1),
        art: z.enum(['kreation', 'beilage']),
        reihenfolge: z.number().int(),
        notiz: z.string().min(1).optional(),
        groessen: z.array(groesse).default([]),
        stueckpreis: z.number().positive().optional(),
        einheit: z.enum(['Brot', 'Glas']).optional(),
        allergene: z.array(z.string()).optional(),
        vegetarisch: z.boolean().optional(),
        bild: image().optional(),
        bildAlt: altText.optional(),
        // Farbe der Kachel, solange das Bild fehlt.
        ton: z.enum(['gruen', 'terrakotta', 'olive', 'fig', 'pine']).optional(),
        bestaetigt: z.boolean(),
      })
      .superRefine((k, ctx) => {
        const fehlt = (feld, text) => ctx.addIssue({ code: 'custom', path: [feld], message: text });
        if (k.bild && !k.bildAlt) fehlt('bildAlt', 'Jedes Bild braucht einen Alt-Text.');
        if (!k.bild && !k.ton) fehlt('ton', 'Ohne Bild braucht die Kachel einen Farbton.');
        if (k.art === 'kreation' && k.groessen.length === 0) fehlt('groessen', 'Grössen mit Preis fehlen.');
        if (k.art === 'beilage' && (!k.stueckpreis || !k.einheit)) fehlt('stueckpreis', 'Stückpreis und Einheit fehlen.');
        if (!k.bestaetigt) return;
        if (!k.notiz) fehlt('notiz', 'Ein bestätigter Eintrag braucht seine Notiz.');
        if (!k.bild) fehlt('bild', 'Ein bestätigter Eintrag braucht ein Bild.');
        if (!k.allergene) fehlt('allergene', 'Allergene angeben, bei keinen eine leere Liste.');
      }),
});

// Alle Texte der Startseite, je Kapitel eine Datei. Ein Teil zwischen Sternen im Titel
// wird in Handschrift gesetzt. Fliesstext steht unter den Angaben.
const texte = defineCollection({
  loader: glob({ pattern: '*.md', base: './inhalt/texte' }),
  schema: ({ image }) => {
    const mitBild = (objekt) =>
      objekt.refine((o) => !o.bild || o.bildAlt, { path: ['bildAlt'], message: 'Jedes Bild braucht einen Alt-Text.' });
    const punkt = mitBild(
      z.object({
        etikett: z.string().optional(),
        titel: z.string().min(1),
        text: z.string().optional(),
        liste: z.array(z.string()).optional(),
        knopf: z.string().optional(),
        wert: z.string().optional(),
        bild: image().optional(),
        bildAlt: altText.optional(),
      }),
    );
    return mitBild(
      z.object({
        kapitel: z.string().min(1),
        titel: z.string().min(1),
        etikett: z.string().optional(),
        hand: z.string().optional(),
        zeig: z.string().optional(),
        satz: z.string().optional(),
        knopf: z.string().optional(),
        punkte: z.array(punkt).optional(),
        // Kurze Texte der Bedienung, etwa Meldungen der Anfrage.
        meldungen: z.record(z.string(), z.string().min(1)).optional(),
        bild: image().optional(),
        bildAlt: altText.optional(),
        freigegeben: z.boolean(),
      }),
    );
  },
});

// Impressum, AGB, Qualität & Hygiene, Datenschutz.
const recht = defineCollection({
  loader: glob({ pattern: '*.md', base: './inhalt/recht' }),
  schema: z.object({
    titel: z.string().min(1),
    reihenfolge: z.number().int(),
    vermerk: z.string().optional(),
    punkte: z.array(z.object({ begriff: z.string().min(1), text: z.string().min(1) })).min(1),
    freigegeben: z.boolean(),
  }),
});

export const collections = { kreationen, texte, recht };
