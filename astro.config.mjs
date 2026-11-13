import { defineConfig } from 'astro/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';

// Adresse und Unterpfad kommen aus der Umgebung, damit dieselbe Quelle
// auf der Testadresse und später auf aperozauber.ch läuft.
const site = process.env.SITE_ADRESSE ?? 'https://aperozauber.ch';
const base = process.env.SITE_PFAD ?? '/';

// Empfänger der Anfrage. Ohne diese Angabe öffnet die Anfrage das Mailprogramm.
const anfrageZiel = process.env.SITE_ANFRAGE_ZIEL ?? '';
const verbinden = ["'self'", anfrageZiel && new URL(anfrageZiel).origin].filter(Boolean).join(' ');

// Der Schalter für die Bewegung steht als einziges Skript direkt im Kopf der Startseite.
// Seine Prüfsumme wird hier aus der Datei gerechnet, damit die Policy ihn zulässt.
const schalter = createHash('sha256').update(readFileSync('src/skripte/schalter.js')).digest('base64');

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: { syntaxHighlight: false },
  integrations: [
    sitemap({
      // Interne Arbeitsseiten gehören nicht in die Sitemap.
      filter: (seite) => !seite.includes('/grundlagen/'),
    }),
  ],
  security: {
    // GitHub Pages erlaubt keine eigenen Server-Kopfzeilen, deshalb als Meta-Angabe.
    // Skripte und Stile werden beim Bau mit Prüfsummen eingetragen.
    csp: {
      scriptDirective: { hashes: [`sha256-${schalter}`] },
      directives: [
        "default-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src ${verbinden}`,
        "manifest-src 'self'",
        "base-uri 'self'",
        "form-action 'self' mailto:",
      ],
    },
  },
});
