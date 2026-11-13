// Kurze, sachliche Beschreibung für Assistenten. Alles stammt aus denselben Inhaltsdateien wie die Seiten.
import { getCollection, getEntry } from 'astro:content';
import { betrieb } from '../inhalt/betrieb.js';
import { pfad } from '../inhalt/pfad.js';
import { preiszeile } from '../inhalt/preis.js';

export async function GET({ site }) {
  const voll = (ziel) => new URL(pfad(ziel), site).href;
  const kreationen = (await getCollection('kreationen')).sort((a, b) => a.data.reihenfolge - b.data.reihenfolge);
  const info = (await getEntry('seiten', 'info')).data;
  const ablauf = (await getEntry('texte', 'ablauf')).data;
  const klar = (text) => text.replaceAll(' ', ' ');
  const anlaesse = (await getCollection('anlaesse')).sort((a, b) => a.data.reihenfolge - b.data.reihenfolge);

  const zeilen = [
    `# ${betrieb.name}`,
    '',
    `> ${betrieb.inhaberin} gestaltet in ${betrieb.plz} ${betrieb.ort} (Kanton Aargau, Schweiz) Apéro-Kreationen von Hand, für private Anlässe und Firmen. Bestellt wird per Anfrage, verbindlich wird sie mit der schriftlichen Bestätigung.`,
    '',
    '## Kreationen und Beilagen',
    '',
    ...kreationen.map(({ id, data: k, body }) => {
      const groessen = k.art === 'kreation' ? ` Grössen: ${k.groessen.map((g) => `${g.groesse} für ${g.personen} Personen ab CHF ${g.preis}`).join(', ')}.` : ` ${klar(preiszeile(k))}.`;
      return `- [${k.name}](${voll(`/angebot/${id}/`)}): ${body.trim()}${groessen}`;
    }),
    '',
    'Preise sind Richtpreise in Schweizer Franken. Jede Platte wird individuell und nach Saison zusammengestellt.',
    '',
    '## Ablauf',
    '',
    ...ablauf.punkte.map((p, i) => `${i + 1}. ${p.titel}. ${p.text}`),
    '',
    '## Fragen und Antworten',
    '',
    ...info.fragen.flatMap((f) => [`### ${f.frage}`, '', f.antwort, '']),
    '## Kontakt',
    '',
    `- E-Mail: ${betrieb.email}`,
    `- Telefon: ${betrieb.telefon}`,
    `- Adresse: ${betrieb.strasse}, ${betrieb.plz} ${betrieb.ort}, Schweiz`,
    `- Instagram: ${betrieb.instagram}`,
    '',
    '## Seiten',
    '',
    `- [Startseite](${voll('/')})`,
    `- [Kreationen](${voll('/angebot/')})`,
    `- [Firmenapéro](${voll('/firmenapero/')})`,
    `- [Über mich](${voll('/uebermich/')})`,
    `- [Abholung, Lieferung und Bezahlung](${voll('/info/')})`,
    `- [Impressum, AGB und Datenschutz](${voll('/impressum/')})`,
    '',
    '## Nach Anlass',
    '',
    ...anlaesse.map((a) => `- [${a.data.seitentitel}](${voll(`/apero/${a.id}/`)}): ${a.data.lead}`),
    '',
  ];
  return new Response(zeilen.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
