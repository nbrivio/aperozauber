// Gebündelt aus text.mjs, sendezeit.mjs und index.ts. Nicht von Hand ändern: node supabase/werkzeug/buendeln.mjs
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';

// Wann geht die Bestätigung an die Kundschaft hinaus?
// Regel: etwa 20 Minuten nach der Anfrage, nie vor 08:00 und nie ab 21:00 Schweizer Zeit.
// Fällt der Zeitpunkt aus dem Fenster, geht sie am nächsten Morgen kurz nach 08:00 hinaus.
// Die Streuung (18 bis 22 Minuten, am Morgen 3 bis 25 Minuten) lässt es nicht nach Uhrwerk aussehen.

const ZONE = 'Europe/Zurich';
const teile = (zeit) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(zeit));
  const w = Object.fromEntries(f.map((p) => [p.type, Number(p.value)]));
  return { j: w.year, m: w.month, t: w.day, h: w.hour, min: w.minute };
};

// Der Zeitpunkt, an dem es in Zürich genau h:min Uhr ist, am Tag j-m-t.
function zuerichUm(j, m, t, h, min) {
  for (const versatz of [1, 2]) {
    const zeit = Date.UTC(j, m - 1, t, h - versatz, min);
    const p = teile(zeit);
    if (p.h === h && p.min === min && p.t === t) return zeit;
  }
  throw new Error('Zeit nicht darstellbar');
}

function sendezeit(eingang, { von = 8, bis = 21, zufall = Math.random } = {}) {
  const spanne = (a, b) => a + zufall() * (b - a);
  const kandidat = eingang + spanne(18, 22) * 60_000;
  const p = teile(kandidat);
  if (p.h >= von && p.h < bis) return kandidat;
  // Vor Öffnung: am selben Tag um 08:00. Ab 21 Uhr: am nächsten Tag.
  const tag = p.h < von ? Date.UTC(p.j, p.m - 1, p.t) : Date.UTC(p.j, p.m - 1, p.t) + 86_400_000;
  const d = new Date(tag);
  const morgen = zuerichUm(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), von, 0);
  return morgen + spanne(3, 25) * 60_000;
}

// Reine Logik der Anfrage-Funktion: prüfen, Kontakt erkennen, Mails formulieren.
// Ohne Abhängigkeiten, damit sie in den Prüfungen unter Node läuft und in Supabase unter Deno.

const SEITE = 'https://www.aperozauber.ch';
const steuer = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g;

/** Text säubern: Steuerzeichen raus, Ränder weg, Länge begrenzen. Zeilenumbrüche bleiben. */
function bereinige(wert, max) {
  if (typeof wert !== 'string') return '';
  return wert.replace(steuer, '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}

/** Einzeiliger Text für Betreff und Namen: keine Umbrüche, damit nichts in Kopfzeilen eingeschleust wird. */
const einzeilig = (wert, max) => bereinige(wert, max).replace(/\s*\n\s*/g, ' ');

function emailAus(kontakt) {
  const treffer = kontakt.match(/[^\s@<>,;:()"']+@[^\s@<>,;:()"']+\.[A-Za-z]{2,}/);
  return treffer ? treffer[0].toLowerCase().slice(0, 200) : null;
}

/** Nummer für wa.me: nur Ziffern mit Landesvorwahl. Schweizer Nummern ohne Vorwahl bekommen 41. */
function whatsappNummer(kontakt) {
  if (emailAus(kontakt)) return null;
  let ziffern = kontakt.replace(/[^\d+]/g, '');
  if (ziffern.startsWith('+')) ziffern = ziffern.slice(1);
  else if (ziffern.startsWith('00')) ziffern = ziffern.slice(2);
  else if (ziffern.startsWith('0')) ziffern = `41${ziffern.slice(1)}`;
  ziffern = ziffern.replace(/\D/g, '');
  return ziffern.length >= 9 && ziffern.length <= 15 ? ziffern : null;
}

function vorname(name) {
  const erstes = einzeilig(name, 120).split(/\s+/)[0] ?? '';
  return /^[\p{L}][\p{L}'’-]{0,39}$/u.test(erstes) ? erstes : '';
}

/** Prüft die Eingabe des Formulars. Gibt gesäuberte Daten zurück oder den Grund der Ablehnung. */
function pruefeAnfrage(roh) {
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

function zusammenfassung(d) {
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

function bestaetigungsMail(d) {
  const gruss = vorname(d.name);
  const angekommen = zusammenfassung(d).map((z) => `- ${z}`);
  const text = [
    gruss ? `Hoi ${gruss}` : 'Hoi',
    '',
    'Danke für deine Anfrage, ich freue mich auf deinen Apéro!',
    ...(angekommen.length ? ['', 'Das ist bei mir angekommen:', ...angekommen] : []),
    '',
    'Ich schaue mir alles in Ruhe an und melde mich persönlich bei dir, vielleicht mit einer kurzen Frage. Danach bekommst du mein Angebot.',
    '',
    'Fällt dir noch etwas ein? Antworte einfach auf diese Mail, sie landet direkt bei mir.',
    '',
    'Wie Abholung, Lieferung und Bezahlung laufen, steht hier:',
    `${SEITE}/info/`,
    '',
    'Liäbi Grüäss',
    'Sibylle',
    '',
    'Dein Anlass. Mein Apérozauber.',
    'Sibylle’s Apérozauber, Villmergen',
  ].join('\n');
  return { betreff: 'Deine Anfrage bei Sibylle’s Apérozauber', text };
}

const zuerich = (zeit) =>
  new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(zeit));

/** Die Mitteilung an Sibylle: ganze Anfrage, schnelle Wege zur Antwort, Zeitpunkt der Bestätigung. */
function mitteilungsMail(d, { bestaetigungUm, selbstLink }) {
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

// Anfrage-Funktion für aperozauber.ch.
//   POST /anfrage          nimmt die Anfrage des Formulars entgegen, speichert sie, meldet sie Sibylle
//   POST /anfrage/versand  jede Minute vom Zeitplan aufgerufen: Mitteilungen nachholen, fällige Bestätigungen senden
//   GET  /anfrage/selbst   Sibylle antwortet selbst: die automatische Bestätigung entfällt
// Geheimnisse (Supabase Secrets): SMTP_USER, SMTP_PASS, CRON_GEHEIMNIS, TOKEN_GEHEIMNIS, IP_SALZ.
// Optional: SMTP_HOST, SMTP_PORT, MAIL_VON, MAIL_AN, ERLAUBTE_HERKUENFTE.

const env = (name: string, vorgabe = '') => Deno.env.get(name) ?? vorgabe;
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const erlaubt = env('ERLAUBTE_HERKUENFTE', 'https://www.aperozauber.ch,https://aperozauber.ch,https://nbrivio.github.io').split(',');
const von = env('MAIL_VON', 'anfrage@aperozauber.ch');
const an = env('MAIL_AN', 'anfrage@aperozauber.ch');
const FENSTER_MINUTEN = 10; // gleiche Adresse innerhalb dieser Zeit: nur eine Bestätigung
const MAX_PRO_STUNDE = 6; // je Absender

const post = () =>
  nodemailer.createTransport({
    host: env('SMTP_HOST', 'asmtp.mail.hostpoint.ch'),
    port: Number(env('SMTP_PORT', '465')),
    secure: env('SMTP_PORT', '465') === '465',
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

const hex = (puffer: ArrayBuffer) => [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hmac(schluessel: string, text: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(schluessel), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text)));
}
const sha = async (text: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
function gleich(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function kopf(herkunft: string | null) {
  const h: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (herkunft && erlaubt.includes(herkunft)) {
    h['Access-Control-Allow-Origin'] = herkunft;
    h['Vary'] = 'Origin';
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type, Accept';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}
const antwort = (status: number, koerper: unknown, herkunft: string | null = null) =>
  new Response(JSON.stringify(koerper), { status, headers: kopf(herkunft) });

const selbstLink = async (id: string) => `${env('SUPABASE_URL')}/functions/v1/anfrage/selbst?id=${id}&t=${await hmac(env('TOKEN_GEHEIMNIS'), id)}`;

async function sendeMitteilung(zeile: Record<string, any>) {
  const d = zeile.daten;
  const m = mitteilungsMail(d, {
    bestaetigungUm: zeile.bestaetigung_um && !zeile.bestaetigung_gesendet ? new Date(zeile.bestaetigung_um).getTime() : null,
    selbstLink: await selbstLink(zeile.id),
  });
  await post().sendMail({ from: `Apérozauber Website <${von}>`, to: an, replyTo: m.replyTo ?? undefined, subject: m.betreff, text: m.text });
}

async function sendeBestaetigung(zeile: Record<string, any>) {
  const m = bestaetigungsMail(zeile.daten);
  await post().sendMail({ from: `Sibylle’s Apérozauber <${von}>`, to: zeile.email, replyTo: von, bcc: von, subject: m.betreff, text: m.text });
}

async function annehmen(anfrage: Request, herkunft: string | null) {
  if (!herkunft || !erlaubt.includes(herkunft)) return antwort(403, { ok: false });
  if (Number(anfrage.headers.get('content-length') ?? 0) > 20_000) return antwort(413, { ok: false }, herkunft);
  let roh: any;
  try {
    roh = JSON.parse((await anfrage.text()).slice(0, 20_000));
  } catch {
    return antwort(400, { ok: false }, herkunft);
  }
  // Spamschutz: verstecktes Feld und Mindestdauer. Bots bekommen ein freundliches Ja und nichts wird gespeichert.
  if (typeof roh?.website === 'string' && roh.website.trim() !== '') return antwort(200, { ok: true }, herkunft);
  if (Number(roh?.dauer) < 2000) return antwort(200, { ok: true }, herkunft);

  const geprueft = pruefeAnfrage(roh);
  if (!geprueft.ok) return antwort(400, { ok: false, grund: geprueft.grund }, herkunft);
  const d = geprueft.daten;

  const ip = (anfrage.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  const ipHash = await sha(`${env('IP_SALZ')}:${ip}`);
  const vorStunde = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from('anfragen').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('eingang', vorStunde);
  if ((count ?? 0) >= MAX_PRO_STUNDE) return antwort(429, { ok: false }, herkunft);

  const email = emailAus(d.kontakt);
  let bestaetigungUm: string | null = null;
  if (email) {
    const kurz = new Date(Date.now() - FENSTER_MINUTEN * 60_000).toISOString();
    const { count: doppelt } = await db.from('anfragen').select('id', { count: 'exact', head: true }).eq('email', email).gte('eingang', kurz).not('bestaetigung_um', 'is', null);
    if (!doppelt) bestaetigungUm = new Date(sendezeit(Date.now())).toISOString();
  }

  const { data: zeile, error } = await db
    .from('anfragen')
    .insert({ daten: d, email, ip_hash: ipHash, bestaetigung_um: bestaetigungUm })
    .select()
    .single();
  if (error || !zeile) {
    console.error('speichern fehlgeschlagen', error?.code);
    return antwort(500, { ok: false }, herkunft);
  }

  // Sibylle sofort informieren. Klappt der Versand nicht, holt der Zeitplan es nach.
  try {
    await sendeMitteilung(zeile);
    await db.from('anfragen').update({ mitteilung_gesendet: new Date().toISOString() }).eq('id', zeile.id);
  } catch (e) {
    console.error('mitteilung fehlgeschlagen', (e as Error).message);
  }
  return antwort(200, { ok: true }, herkunft);
}

async function versand(anfrage: Request) {
  if (!gleich(anfrage.headers.get('x-cron') ?? '', env('CRON_GEHEIMNIS')) || !env('CRON_GEHEIMNIS')) return antwort(401, { ok: false });
  if (new URL(anfrage.url).searchParams.has('probe')) {
    try {
      await post().verify();
      return antwort(200, { ok: true, smtp: 'verbindung und anmeldung erfolgreich' });
    } catch (e) {
      return antwort(200, { ok: false, smtp: (e as Error).message });
    }
  }
  const bericht = { mitteilungen: 0, bestaetigungen: 0, fehler: 0 };

  const { data: offen } = await db.from('anfragen').select('*').is('mitteilung_gesendet', null).lt('versuche', 5).order('eingang').limit(10);
  for (const zeile of offen ?? []) {
    try {
      await sendeMitteilung(zeile);
      await db.from('anfragen').update({ mitteilung_gesendet: new Date().toISOString() }).eq('id', zeile.id);
      bericht.mitteilungen++;
    } catch (e) {
      bericht.fehler++;
      await db.from('anfragen').update({ versuche: zeile.versuche + 1 }).eq('id', zeile.id);
      console.error('mitteilung wiederholt fehlgeschlagen', (e as Error).message);
    }
  }

  const { data: faellig } = await db
    .from('anfragen').select('*')
    .not('email', 'is', null).not('bestaetigung_um', 'is', null)
    .lte('bestaetigung_um', new Date().toISOString())
    .is('bestaetigung_gesendet', null).eq('selbst_antworten', false).lt('versuche', 5)
    .order('bestaetigung_um').limit(10);
  for (const zeile of faellig ?? []) {
    // Den Platz belegen, damit nie zwei Läufe dieselbe Mail senden.
    const { data: belegt } = await db.from('anfragen').update({ bestaetigung_gesendet: new Date().toISOString() })
      .eq('id', zeile.id).is('bestaetigung_gesendet', null).eq('selbst_antworten', false).select('id');
    if (!belegt?.length) continue;
    try {
      await sendeBestaetigung(zeile);
      bericht.bestaetigungen++;
    } catch (e) {
      bericht.fehler++;
      await db.from('anfragen').update({ bestaetigung_gesendet: null, versuche: zeile.versuche + 1 }).eq('id', zeile.id);
      console.error('bestätigung fehlgeschlagen', (e as Error).message);
    }
  }
  return antwort(200, { ok: true, ...bericht });
}

async function selbst(anfrage: Request) {
  const q = new URL(anfrage.url).searchParams;
  const id = q.get('id') ?? '';
  const t = q.get('t') ?? '';
  const text = (s: string, status = 200) => new Response(s, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  if (!/^[0-9a-f-]{36}$/.test(id) || !gleich(t, await hmac(env('TOKEN_GEHEIMNIS'), id))) return text('Ungültiger Link.', 403);
  const { data } = await db.from('anfragen').update({ selbst_antworten: true }).eq('id', id).is('bestaetigung_gesendet', null).select('id');
  return text(data?.length ? 'Erledigt. Die automatische Bestätigung wird nicht gesendet. Du antwortest selbst.' : 'Die Bestätigung ist schon gesendet oder der Link ist nicht mehr gültig.');
}

Deno.serve(async (anfrage) => {
  const herkunft = anfrage.headers.get('origin');
  const weg = new URL(anfrage.url).pathname.replace(/\/+$/, '');
  try {
    if (anfrage.method === 'OPTIONS') return new Response(null, { status: 204, headers: kopf(herkunft) });
    if (anfrage.method === 'POST' && weg.endsWith('/versand')) return await versand(anfrage);
    if (anfrage.method === 'GET' && weg.endsWith('/selbst')) return await selbst(anfrage);
    if (anfrage.method === 'POST') return await annehmen(anfrage, herkunft);
    return antwort(405, { ok: false });
  } catch (e) {
    console.error('unerwarteter fehler', (e as Error).message);
    return antwort(500, { ok: false }, herkunft);
  }
});
