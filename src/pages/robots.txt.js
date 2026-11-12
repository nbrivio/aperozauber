import { istLive } from '../inhalt/stufe.js';
import { pfad } from '../inhalt/pfad.js';

// Auf der Testadresse bleibt alles gesperrt, damit sie nicht neben der richtigen Seite in der Suche landet.
export function GET({ site }) {
  const zeilen = istLive
    ? ['User-agent: *', 'Allow: /', `Disallow: ${pfad('/grundlagen/')}`, '', `Sitemap: ${new URL(pfad('/sitemap-index.xml'), site).href}`]
    : ['User-agent: *', 'Disallow: /'];
  return new Response(`${zeilen.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
