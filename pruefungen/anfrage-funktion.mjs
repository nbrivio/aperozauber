// Prüft die Logik der Anfrage-Funktion: Eingabe, Kontakterkennung, Mailtexte.
import { pruefeAnfrage, emailAus, whatsappNummer, vorname, bestaetigungsMail, mitteilungsMail, einzeilig } from '../supabase/functions/anfrage/text.mjs';
import { bericht } from './dateien.mjs';

const b = bericht('Anfrage-Funktion');
const gleich = (ort, ist, soll) => { if (JSON.stringify(ist) !== JSON.stringify(soll)) b.melde(ort, `erwartet ${JSON.stringify(soll)}, erhalten ${JSON.stringify(ist)}`); };
const wahr = (ort, bed) => { if (!bed) b.melde(ort, 'Bedingung nicht erfüllt'); };

// Kontakt erkennen
gleich('E-Mail', emailAus('Anna.Muster@Example.ch'), 'anna.muster@example.ch');
gleich('E-Mail im Text', emailAus('schreib mir: a@b.ch bitte'), 'a@b.ch');
gleich('keine E-Mail', emailAus('079 123 45 67'), null);
gleich('WhatsApp 079', whatsappNummer('079 123 45 67'), '41791234567');
gleich('WhatsApp +41', whatsappNummer('+41 79 123 45 67'), '41791234567');
gleich('WhatsApp 0041', whatsappNummer('0041 79 123 45 67'), '41791234567');
gleich('WhatsApp bei E-Mail', whatsappNummer('a@b.ch'), null);
gleich('WhatsApp zu kurz', whatsappNummer('12345'), null);
gleich('Vorname', vorname('anna Muster'), 'anna');
gleich('Vorname unsinnig', vorname('12345 xyz'), '');

// Eingabe prüfen
wahr('ohne Name', !pruefeAnfrage({ name: '', kontakt: 'a@b.ch' }).ok);
wahr('ohne Kontakt', !pruefeAnfrage({ name: 'Anna', kontakt: '' }).ok);
wahr('kein Objekt', !pruefeAnfrage('x').ok && !pruefeAnfrage(null).ok && !pruefeAnfrage([]).ok);
const gut = pruefeAnfrage({
  name: 'Anna Muster', kontakt: 'anna@example.ch', fuer: 'Firma', anlass: 'Weihnachtsapéro', gaeste: '12', datum: '19.12.2026', ort: 'Bremgarten',
  posten: [{ anzahl: 2, kreation: 'Bergzauber', groesse: 'M' }, { anzahl: 'x', kreation: '', groesse: 'L' }], wuensche: 'vegetarisch', nachricht: 'Hallo',
});
wahr('gute Anfrage', gut.ok);
gleich('Posten gefiltert', gut.daten.posten, [{ anzahl: 2, kreation: 'Bergzauber', groesse: 'M' }]);
gleich('Firma bleibt', gut.daten.fuer, 'Firma');
gleich('Datum falsch', pruefeAnfrage({ name: 'A', kontakt: 'a@b.ch', datum: '2026-12-19' }).daten.datum, '');
gleich('unbekanntes Fuer', pruefeAnfrage({ name: 'A', kontakt: 'a@b.ch', fuer: 'x' }).daten.fuer, 'Privat');
const lang = pruefeAnfrage({ name: 'A'.repeat(500), kontakt: 'a@b.ch', nachricht: 'x'.repeat(10000), posten: Array(100).fill({ anzahl: 500, kreation: 'K' }) });
wahr('Längen begrenzt', lang.daten.name.length === 120 && lang.daten.nachricht.length === 4000 && lang.daten.posten.length === 20 && lang.daten.posten[0].anzahl === 99);

// Kopfzeilen dürfen nichts einschleusen
const boese = pruefeAnfrage({ name: 'Anna\r\nBcc: boese@example.com', kontakt: 'a@b.ch', ort: 'x\ny' });
wahr('Name einzeilig', !/[\r\n]/.test(boese.daten.name));
const mitteilung = mitteilungsMail(boese.daten, { bestaetigungUm: Date.now() + 1.2e6, selbstLink: 'https://x/selbst' });
wahr('Betreff einzeilig', !/[\r\n]/.test(mitteilung.betreff));
gleich('einzeilig', einzeilig('a\n\nb', 10), 'a b');

// Mailtexte
const best = bestaetigungsMail(gut.daten);
wahr('Betreff Bestätigung', best.betreff === 'Deine Anfrage bei Sibylle’s Apérozauber');
wahr('Anrede', best.text.startsWith('Hallo Anna\n'));
wahr('Zusammenfassung', best.text.includes('- Datum: 19.12.2026') && best.text.includes('2 × Bergzauber M'));
wahr('Hinweis automatisch', best.text.includes('automatisch verschickt'));
wahr('keine Zusage, kein Preis', !/CHF|innerhalb von|Stunden/.test(best.text));
wahr('Link Info', best.text.includes('https://www.aperozauber.ch/info/'));
const leer = bestaetigungsMail(pruefeAnfrage({ name: '1234', kontakt: 'a@b.ch' }).daten);
wahr('ohne Angaben', leer.text.startsWith('Hallo\n') && !leer.text.includes('Das habe ich notiert'));

const tel = mitteilungsMail(pruefeAnfrage({ name: 'Ben', kontakt: '079 123 45 67', anlass: 'Geburtstag' }).daten, { bestaetigungUm: null, selbstLink: 'x' });
wahr('Telefon: WhatsApp und Anruf', tel.text.includes('https://wa.me/41791234567?text=') && tel.text.includes('tel:+41791234567'));
wahr('Telefon: keine Bestätigung', tel.text.includes('Keine automatische Bestätigung') && tel.replyTo === null);
wahr('Mail: Reply-To', mitteilung.replyTo === 'a@b.ch' && mitteilung.text.includes('https://x/selbst'));

b.schliesse('Eingabe, Kontakt, Mailtexte');
