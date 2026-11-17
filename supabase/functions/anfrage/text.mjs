// Reine Logik der Anfrage-Funktion: prüfen, Kontakt erkennen, Mails formulieren.
// Ohne Abhängigkeiten, damit sie in den Prüfungen unter Node läuft und in Supabase unter Deno.

const SEITE = 'https://www.aperozauber.ch';
const steuer = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g;

/** Text säubern: Steuerzeichen raus, Ränder weg, Länge begrenzen. Zeilenumbrüche bleiben. */
export function bereinige(wert, max) {
  if (typeof wert !== 'string') return '';
  return wert.replace(steuer, '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}

/** Einzeiliger Text für Betreff und Namen: keine Umbrüche, damit nichts in Kopfzeilen eingeschleust wird. */
export const einzeilig = (wert, max) => bereinige(wert, max).replace(/\s*\n\s*/g, ' ');

export function emailAus(kontakt) {
  const treffer = kontakt.match(/[^\s@<>,;:()"']+@[^\s@<>,;:()"']+\.[A-Za-z]{2,}/);
  return treffer ? treffer[0].toLowerCase().slice(0, 200) : null;
}

/** Nummer für wa.me: nur Ziffern mit Landesvorwahl. Schweizer Nummern ohne Vorwahl bekommen 41. */
export function whatsappNummer(kontakt) {
  if (emailAus(kontakt)) return null;
  let ziffern = kontakt.replace(/[^\d+]/g, '');
  if (ziffern.startsWith('+')) ziffern = ziffern.slice(1);
  else if (ziffern.startsWith('00')) ziffern = ziffern.slice(2);
  else if (ziffern.startsWith('0')) ziffern = `41${ziffern.slice(1)}`;
  ziffern = ziffern.replace(/\D/g, '');
  return ziffern.length >= 9 && ziffern.length <= 15 ? ziffern : null;
}

export function vorname(name) {
  const erstes = einzeilig(name, 120).split(/\s+/)[0] ?? '';
  return /^[\p{L}][\p{L}'’-]{0,39}$/u.test(erstes) ? erstes : '';
}

/** Prüft die Eingabe des Formulars. Gibt gesäuberte Daten zurück oder den Grund der Ablehnung. */
export function pruefeAnfrage(roh) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return { ok: false, grund: 'form' };
  const name = einzeilig(roh.name, 120);
  const kontakt = einzeilig(roh.kontakt, 200);
  if (!name || kontakt.length < 5) return { ok: false, grund: 'pflicht' };
  const posten = (Array.isArray(roh.posten) ? roh.posten : []).slice(0, 20).map((p) => ({
    anzahl: Math.min(99, Math.max(1, Math.trunc(Number(p?.anzahl)) || 1)),
    kreation: einzeilig(p?.kreation, 60),
    groesse: einzeilig(p?.groesse, 3),
  })).filter((p) => p.kreation);
  const datum = einzeilig(roh.datum, 10);
  return {
    ok: true,
    daten: {
      name,
      kontakt,
      fuer: roh.fuer === 'Firma' ? 'Firma' : 'Privat',
      anlass: einzeilig(roh.anlass, 80),
      posten,
      gaeste: einzeilig(roh.gaeste, 6),
      datum: /^\d{2}\.\d{2}\.\d{4}$/.test(datum) ? datum : '',
      ort: einzeilig(roh.ort, 120),
      wuensche: bereinige(roh.wuensche, 1000),
      nachricht: bereinige(roh.nachricht, 4000),
    },
  };
}

export function zusammenfassung(d) {
  const zeilen = [];
  if (d.anlass) zeilen.push(`Anlass: ${d.anlass}`);
  if (d.datum) zeilen.push(`Datum: ${d.datum}`);
  if (d.gaeste) zeilen.push(`Gäste: ${d.gaeste}`);
  if (d.ort) zeilen.push(`Ort: ${d.ort}`);
  if (d.posten.length) {
    zeilen.push(`Bestellung: ${d.posten.map((p) => `${p.anzahl} × ${p.kreation}${p.groesse ? ` ${p.groesse}` : ''}`).join(', ')}`);
  }
  if (d.wuensche) zeilen.push(`Wünsche: ${d.wuensche.replace(/\n+/g, ' ')}`);
  return zeilen;
}

export function bestaetigungsMail(d) {
  const gruss = vorname(d.name);
  const notiert = zusammenfassung(d).map((z) => `- ${z}`);
  const text = [
    gruss ? `Hallo ${gruss}` : 'Hallo',
    '',
    'Danke für deine Anfrage. Sie ist bei mir angekommen.',
    ...(notiert.length ? ['', 'Das habe ich notiert:', ...notiert] : []),
    '',
    'Ich schaue mir alles in Ruhe an und melde mich persönlich bei dir, falls nötig mit einer kurzen Rückfrage, und schicke dir danach das Angebot. Wenn du in der Zwischenzeit etwas ergänzen möchtest, antworte einfach auf diese Mail.',
    '',
    'Fragen zu Abholung, Lieferung und Bezahlung beantworte ich dir hier:',
    `${SEITE}/info/`,
    '',
    'Herzlich',
    'Sibylle',
    'Sibylle’s Apérozauber, Villmergen',
    '',
    'Diese Bestätigung wurde automatisch verschickt. Deine Antwort kommt direkt bei mir an.',
  ].join('\n');
  return { betreff: 'Deine Anfrage bei Sibylle’s Apérozauber', text };
}

const zuerich = (zeit) =>
  new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(zeit));

/** Die Mitteilung an Sibylle: ganze Anfrage, schnelle Wege zur Antwort, Zeitpunkt der Bestätigung. */
export function mitteilungsMail(d, { bestaetigungUm, selbstLink }) {
  const email = emailAus(d.kontakt);
  const wa = whatsappNummer(d.kontakt);
  const gruss = vorname(d.name);
  const waText = `Hallo${gruss ? ` ${gruss}` : ''}, hier ist Sibylle vom Apérozauber. Danke für deine Anfrage.`;
  const wege = [];
  if (email) wege.push(`Antworten: einfach auf diese Mail antworten (geht an ${email})`);
  if (wa) {
    wege.push(`WhatsApp: https://wa.me/${wa}?text=${encodeURIComponent(waText)}`);
    wege.push(`Anrufen: tel:+${wa}`);
  }
  const bestaetigung = bestaetigungUm
    ? `Bestätigung an die Kundschaft: automatisch um ${zuerich(bestaetigungUm)} Uhr.\nSelbst antworten und die Bestätigung verhindern: ${selbstLink}`
    : 'Keine automatische Bestätigung (keine E-Mail-Adresse angegeben).';
  const text = [
    `Neue Anfrage von ${d.name}`,
    `Kontakt: ${d.kontakt}`,
    `Für: ${d.fuer}`,
    '',
    ...zusammenfassung(d),
    '',
    ...wege,
    '',
    bestaetigung,
  ].join('\n');
  const betreff = einzeilig(`Neue Anfrage: ${d.name}${d.datum ? `, ${d.datum}` : ''}${d.anlass ? `, ${d.anlass}` : ''}`, 120);
  return { betreff, text, replyTo: email };
}
