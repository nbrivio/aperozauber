# Anfrage-Automatisierung: Bestätigung 20 Minuten nach der Anfrage

Ziel: Wer eine Anfrage schickt, bekommt etwa 20 Minuten später eine persönliche, ruhige Bestätigung, nie vor 08:00 und nie ab 21:00 Uhr. Sibylle sieht jede Anfrage sofort. Persönliche Bestellungen bleiben geschützt.

## Ist-Stand

Das Formular öffnet heute das Mailprogramm (`SITE_ANFRAGE_ZIEL` ist nicht gesetzt). Die Anfrage landet also nur dann bei `anfrage@aperozauber.ch`, wenn die Person im Mailprogramm auf Senden drückt. Das Formular kann schon an einen Server senden (JSON mit `name`, `kontakt`, `nachricht`, Spamschutz), es fehlt nur der Empfänger. Mit ihm bekommen wir drei Dinge: keine verlorenen Anfragen, sofortige Mitteilung an Sibylle und die Automatik.

## Aufbau (Empfehlung)

1. **Formular** sendet per POST an eine Funktion in Supabase (Region Zürich). Die Adresse kommt als Variable `SITE_ANFRAGE_ZIEL`, die Seite lässt sie dann automatisch in der Sicherheitsrichtlinie zu.
2. **Funktion `anfrage`** prüft die Eingabe (Längen, Spamfeld, Mindestdauer, Rate-Limit je Absender), speichert die Anfrage und schickt sofort eine Mitteilung an `anfrage@aperozauber.ch`. Darin steht die ganze Anfrage und ein Knopf «Ich antworte selbst». Er verhindert die automatische Bestätigung.
3. **Planung:** `sendezeit()` (`supabase/functions/_shared/sendezeit.mjs`, getestet) legt den Versandzeitpunkt fest: 18 bis 22 Minuten nach Eingang. Fällt er vor 08:00 oder ab 21:00 Uhr, geht die Mail am Morgen danach zwischen 08:03 und 08:25 hinaus. Sommer- und Winterzeit sind eingerechnet.
4. **Versand:** Eine geplante Aufgabe prüft jede Minute, was fällig ist, und sendet die Bestätigung. Hat Sibylle «Ich antworte selbst» geklickt oder schon geantwortet, wird nichts gesendet.
5. **Absender:** `Sibylle's Apérozauber <anfrage@aperozauber.ch>` über den Hostpoint-SMTP-Server derselben Postfachadresse. Damit passen SPF und Absender, es kommt kein weiterer Anbieter dazu, und eine Antwort der Kundschaft landet direkt in Sibylles Postfach. Eine Kopie geht per BCC an dieselbe Adresse.
6. **Aufbewahrung:** Anfragen werden nach 90 Tagen gelöscht. Die Tabelle ist gegen Zugriffe von aussen gesperrt (`supabase/schema-entwurf.sql`).

Anfragen mit Telefonnummer statt E-Mail erhalten keine Bestätigung. Sibylle bekommt die Mitteilung trotzdem sofort. Für Telefonnummern ist WhatsApp der spätere Weg (Backlog).

## Mailtext (Entwurf)

**Betreff:** Deine Anfrage bei Sibylle's Apérozauber

> Hallo {Vorname}
>
> Danke für deine Anfrage. Sie ist bei mir angekommen.
>
> Das habe ich notiert:
> {Zusammenfassung: Anlass, Datum, Gäste, Ort, Bestellung}
>
> Ich schaue mir alles in Ruhe an und melde mich persönlich bei dir. Wenn du in der Zwischenzeit etwas ergänzen möchtest, antworte einfach auf diese Mail.
>
> Fragen zu Abholung, Lieferung und Bezahlung beantworte ich dir hier: https://www.aperozauber.ch/info/
>
> Herzlich
> Sibylle
> Sibylle's Apérozauber, Villmergen
>
> _Diese Bestätigung wurde automatisch verschickt. Deine Antwort kommt direkt bei mir an._

Der Text verspricht keine Antwortzeit, weil die Website auch keine nennt (siehe Entscheid unten). Er nennt keinen Preis. Der letzte Satz ist bewusst klein und ehrlich: Er macht die Mail nicht weniger warm und vermeidet, dass sie als persönlich verfasst auftritt.

## Entscheide, damit morgen nichts offen ist

| Punkt | Entscheid |
|---|---|
| Versandfenster | 08:00 bis 21:00 Uhr Schweizer Zeit, alle sieben Tage |
| Verzögerung | 20 Minuten, gestreut auf 18 bis 22 |
| Antwortzeit im Mailtext | keine Zusage, bis Sibylle eine nennt |
| Absender | anfrage@aperozauber.ch über Hostpoint-SMTP, keine zweite Mail-Plattform |
| Speicherort | Supabase Region Zürich, Löschung nach 90 Tagen |
| Datenschutz | Text anpassen: Anfrage wird auf dem Server gespeichert, Anbieter und Land nennen, Löschfrist 90 Tage |
| Doppelte Anfragen | gleiche E-Mail innerhalb von 10 Minuten: nur eine Bestätigung |

## Was ich morgen mache (Reihenfolge)

1. Supabase-Projekt in Zürich anlegen, Schema einspielen, Zugriffsschutz prüfen.
2. Funktion `anfrage` und Versandfunktion schreiben und mit Testanfragen prüfen (Fenster, Zeitumstellung, Spam, Doppelte).
3. Hostpoint-SMTP-Zugang als Geheimnis hinterlegen. **Dafür brauche ich von dir das Passwort des Postfachs `anfrage@aperozauber.ch` nicht im Chat**: du trägst es selbst in den Geheimnissen von Supabase ein, ich sage dir wo.
4. Variable `SITE_ANFRAGE_ZIEL` setzen, Seite neu bauen, Datenschutzseite aktualisieren.
5. Testanfrage von dir, Mitteilung an Sibylle, Bestätigung nach 20 Minuten.
6. DMARC prüfen: Falls für `aperozauber.ch` noch keine DMARC-Regel besteht, setzen wir eine zurückhaltende (`p=none` mit Berichten), damit Bestätigungen nicht im Spam landen.

## Risiken

- Hostpoint begrenzt den SMTP-Versand pro Stunde. Für das Volumen eines Apérobetriebs ist das weit genug.
- Landet die Bestätigung im Spam, ist DMARC/DKIM die erste Stelle zum Prüfen.
- Ein Formular, das Daten an einen Server schickt, braucht den angepassten Datenschutztext, bevor es scharf geht.
