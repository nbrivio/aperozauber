# Entscheide

Stand: 13. November 2026. Grundlage sind die Brand Guidelines 1.0 und der Umsetzungsauftrag.

## Entschieden

- **Gerüst:** Astro mit statischer Ausgabe, Auslieferung über GitHub Actions. Die Testadresse läuft auf GitHub Pages.
- **Vorlage ist der Prototyp:** Aufbau, Texte, Farben, Schriftgrössen und alle Bewegungen der Startseite sind aus dem Prototyp übernommen.
- **Siegel:** fliegt und rollt nicht. Im Auftakt steht es gross über dem Fenster und blendet mit der Einladung aus. Gleichzeitig blendet der Kopf ein, in dem es klein und fest links steht. Es ist nie zweimal gleichzeitig zu sehen. Im Fuss steht es weiss auf Deep Pine.
- **Farben und Schriften:** nach Brand Guidelines 1.0. Instrument Serif für Titel, DM Sans für Text, Oooh Baby als Handschrift. Alle selbst ausgeliefert.
- **Kein dunkles Farbschema:** Die Marke definiert eines, das helle.
- **Ein Raster für alles:** Kopf, Titel und Text teilen dieselbe linke Kante und dieselbe Breite (1320 Pixel, zwölf Spalten). Titel sind auf grossen Bildschirmen grösser gesetzt, Textblöcke hängen an einer Linie statt frei im Raum.
- **Blase:** Ein runder, von Hand geschnittener Knopf «Apéro anfragen» läuft unten rechts mit und öffnet das Bestellfenster. Dasselbe tut jeder andere Knopf zur Anfrage.
- **Bestellfenster:** Jede Kreation mit rundem Bild, Notiz und Preis, Mengen mit Plus und Minus, darunter die Angaben zum Anlass und die Vorschau der Nachricht. Ohne Skript steht dasselbe Formular im Kapitel Anfrage.
- **Versand:** Solange kein Empfänger gesetzt ist, öffnet «Anfrage senden» das Mailprogramm, und die Seite überträgt nichts. Mit der Variable `SITE_ANFRAGE_ZIEL` geht die Anfrage direkt an diese Adresse. Der Dank erscheint nur nach bestätigtem Versand, bei einem Fehler bleiben die Angaben stehen.

## Abweichungen vom Prototyp

Jede ist begründet, keine ändert das Bild.

- **Ruhige Fassung als Grundzustand:** Die Bewegung wird vom Skript eingeschaltet. Ohne Skript, bei einem Skriptfehler und bei reduzierter Bewegung steht dieselbe Seite ohne Scroll-Effekte da, mit allen Inhalten. Im Prototyp blieb der Titel ohne Skript unsichtbar.
- **Bilder:** AVIF und WebP in mehreren Grössen statt einer Datei. Die Vorlagen sind die Dateien aus dem Prototyp (760 und 1280 Pixel breit). Für grosse Bildschirme braucht es die Originale.
- **Schriften:** selbst ausgeliefert statt von Google geladen.
- **Felder «Noch etwas?» und «Antwort an?»:** zusätzlich in der Anfrage, für Wünsche und Allergien und für die Rückmeldung.
- **Komposition:** Versprechen, Ablauf, Sibylle, Anfrage, Rechtliches und Fuss sind auf grossen Bildschirmen neu gesetzt (Entscheid 13.11.2026). Der Ablauf steht als Liste neben dem Titel statt in vier schmalen Spalten.
- **Blase statt Knopf:** Der schwebende rechteckige Knopf ist durch die runde Blase ersetzt.
- **«Anfrage senden»:** ist ein echter Knopf des Formulars statt eines Verweises. Aussehen gleich.
- **Sibylle, mittlere Breiten:** Bild und Abstand werden zwischen 800 und 1060 Pixel schmaler, weil das Wort «zusammenkommen.» sonst über den Rand lief.
- **Fokus und Tastatur:** heller Fokusrahmen auf dunklen Flächen, grössere Klickflächen bei «Anfragen» und im Fuss, Kopf wird sichtbar, sobald die Tastatur ihn erreicht.
- **Überschriften für Vorleseprogramme:** der Bilderstapel und «Für Private, für Firmen» tragen je einen unsichtbaren Titel.
- **Hinweis unter der Anfrage:** beschreibt, was wirklich passiert, statt auf den Prototyp zu verweisen.
- **Datenschutz, Punkt WhatsApp:** entfällt bis Phase 7 und ist durch den Punkt E-Mail ersetzt.
- **Stimmen und Firmenlogos:** Die leeren Plätze erscheinen nur auf der Testadresse. Auf der richtigen Adresse fehlt der Teil, bis echte Einträge mit Einverständnis vorliegen.
- **Farbige Kacheln «Bild folgt»:** nur auf der Testadresse möglich, eine bestätigte Kreation verlangt ihr Bild.

## Umgesetzt, zur Bestätigung

- **Logo-Auslieferung:** Die Vektordatei bleibt die unveränderte Vorlage (430 KB). Für die Seite wird sie in passende Grössen gerechnet (4 bis 31 KB).
- **Favicon und Vorschaubild:** aus dem Siegel gerechnet. Die Guidelines sehen für Kleinformate ein reduziertes Zeichen vor, das es noch nicht gibt.
- **Telefonnummer im Fuss:** wie im Prototyp und im bisherigen Impressum.
- **Strukturierte Daten:** vorerst Betrieb, Website und Seite. Produkte und Fragen folgen in Phase 5 mit bestätigten Angaben.

## Unterschiede zwischen den Vorlagen

- **Startseite:** Die Guidelines nennen acht Kapitel, der Umsetzungsauftrag zehn in anderer Reihenfolge (Kreationen vor Sibylle). Es gilt der Umsetzungsauftrag als jüngerer Stand.
- **Navigation:** gebaut wie im Prototyp: Die Idee, Kreationen, Sibylle, Einblicke, Instagram. Auf dem Handy zeigt der Kopf nur Marke und Knopf, ein Menü gibt es dort nicht.
- **Schriften:** Die Guidelines führen die Schriftwahl als Vorschlag, der Umsetzungsauftrag als entschieden. Gebaut ist die Wahl aus dem Umsetzungsauftrag.
- **Oooh Baby:** steht im Umsetzungsauftrag, nicht in den Guidelines.
- **Häufige Fragen als strukturierte Daten:** bringen in der Google-Suche keine eigene Darstellung mehr. Sinnvoll bleiben sie für Assistenten, sofern die Fragen sichtbar auf der Seite stehen.
