// Anfrage-Funktion für aperozauber.ch.
//   POST /anfrage          nimmt die Anfrage des Formulars entgegen, speichert sie, meldet sie Sibylle
//   POST /anfrage/versand  jede Minute vom Zeitplan aufgerufen: Mitteilungen nachholen, fällige Bestätigungen senden
//   GET  /anfrage/selbst   Sibylle antwortet selbst: die automatische Bestätigung entfällt
// Geheimnisse (Supabase Secrets): SMTP_USER, SMTP_PASS, CRON_GEHEIMNIS, TOKEN_GEHEIMNIS, IP_SALZ.
// Optional: SMTP_HOST, SMTP_PORT, MAIL_VON, MAIL_AN, ERLAUBTE_HERKUENFTE.
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';
import { bestaetigungsMail, emailAus, mitteilungsMail, pruefeAnfrage } from './text.mjs';
import { sendezeit } from './sendezeit.mjs';

const env = (name: string, vorgabe = '') => Deno.env.get(name) ?? vorgabe;
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const erlaubt = env('ERLAUBTE_HERKUENFTE', 'https://www.aperozauber.ch,https://aperozauber.ch').split(',');
const von = env('MAIL_VON', 'anfrage@aperozauber.ch');
const an = env('MAIL_AN', 'anfrage@aperozauber.ch');
const FENSTER_MINUTEN = 10; // gleiche Adresse innerhalb dieser Zeit: nur eine Bestätigung
const MAX_PRO_STUNDE = 6; // gespeicherte Anfragen je Absender und Stunde
const MAX_VERSUCHE_PRO_STUNDE = 20; // Aufrufe je Absender und Stunde, gueltige wie abgewiesene
const MAX_KOERPER = 20_000; // Bytes

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

/** Liest den Körper mit harter Obergrenze, statt ihn erst ganz einzulesen und dann zu kürzen.
 * Gibt null zurück, sobald die Grenze überschritten ist; die Verbindung wird dann abgebrochen. */
async function koerperLesen(anfrage: Request, max: number) {
  const leser = anfrage.body?.getReader();
  if (!leser) return '';
  const stuecke: Uint8Array[] = [];
  let summe = 0;
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    summe += value.byteLength;
    if (summe > max) {
      await leser.cancel();
      return null;
    }
    stuecke.push(value);
  }
  const alles = new Uint8Array(summe);
  let pos = 0;
  for (const s of stuecke) {
    alles.set(s, pos);
    pos += s.byteLength;
  }
  return new TextDecoder().decode(alles);
}

async function annehmen(anfrage: Request, herkunft: string | null) {
  if (!herkunft || !erlaubt.includes(herkunft)) return antwort(403, { ok: false });
  if (Number(anfrage.headers.get('content-length') ?? 0) > MAX_KOERPER) return antwort(413, { ok: false }, herkunft);

  // Jeder Aufruf zählt, nicht erst der gültige. Sonst liesse sich mit ungültigen Eingaben
  // und Treffern in die Spamfalle beliebig oft anklopfen, ohne je an die Grenze zu stossen.
  const ip = (anfrage.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  const ipHash = await sha(`${env('IP_SALZ')}:${ip}`);
  const vorStunde = new Date(Date.now() - 3_600_000).toISOString();
  const { count: versuche } = await db.from('zugriffe').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('zeit', vorStunde);
  if ((versuche ?? 0) >= MAX_VERSUCHE_PRO_STUNDE) return antwort(429, { ok: false }, herkunft);
  await db.from('zugriffe').insert({ ip_hash: ipHash });

  const text = await koerperLesen(anfrage, MAX_KOERPER);
  if (text === null) return antwort(413, { ok: false }, herkunft);
  let roh: any;
  try {
    roh = JSON.parse(text);
  } catch {
    return antwort(400, { ok: false }, herkunft);
  }
  // Spamschutz: verstecktes Feld und Mindestdauer. Bots bekommen ein freundliches Ja und nichts wird gespeichert.
  if (typeof roh?.website === 'string' && roh.website.trim() !== '') return antwort(200, { ok: true }, herkunft);
  if (Number(roh?.dauer) < 2000) return antwort(200, { ok: true }, herkunft);

  const geprueft = pruefeAnfrage(roh);
  if (!geprueft.ok) return antwort(400, { ok: false, grund: geprueft.grund }, herkunft);
  const d = geprueft.daten;

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
