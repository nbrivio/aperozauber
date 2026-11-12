import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adresse und Unterpfad kommen aus der Umgebung, damit dieselbe Quelle
// auf der Testadresse und später auf aperozauber.ch läuft.
const site = process.env.SITE_ADRESSE ?? 'https://aperozauber.ch';
const base = process.env.SITE_PFAD ?? '/';

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
      directives: [
        "default-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
