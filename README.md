# Sibylle’s Apérozauber

Die Website von Sibylle’s Apérozauber: statisch gebaut mit Astro, ausgeliefert über GitHub Pages.

## Arbeiten

Voraussetzung ist Node in der Version aus `.nvmrc`.

```sh
npm ci            # Abhängigkeiten nach Sperrdatei
npm run dev       # Vorschau unter http://localhost:4321
npm run pruefen   # bauen und alle Prüfungen laufen lassen
```

`npm run pruefen` braucht ein installiertes Google Chrome.

## Inhalte ändern

Alles, was sich ändert, liegt unter `inhalt/`, getrennt vom Code. Eine Änderung ist eine geänderte Datei und ein Push auf `main`.

| Datei | Inhalt |
| --- | --- |
| `inhalt/hinweis.json` | Band für Ferien und Fristen: `text`, `von`, `bis` (Datum als JJJJ-MM-TT). Ausserhalb des Zeitraums verschwindet es von selbst. Kurz halten: auf dem Handy haben zwei Zeilen Platz |
| `inhalt/kreationen/` | Je Kreation und Beilage eine Datei: Name, Notiz, Grössen, Preise, Allergene, Bild, Alt-Text, darunter die Beschreibung. Karten und Anfrage lesen beide hier |
| `inhalt/texte/` | Texte der Startseite, je Kapitel eine Datei. Ein Teil zwischen Sternen im Titel erscheint in Handschrift |
| `inhalt/stimmen.json`, `inhalt/firmen.json` | Kundenstimmen und Firmenlogos, nur mit Einverständnis |
| `inhalt/recht/` | Impressum, AGB, Qualität & Hygiene, Datenschutz, je eine Datei, im Wortlaut |
| `inhalt/seiten/` | Unterseiten Über mich, Gut zu wissen und Firmenapéro, mit Titel und Beschreibung für Suchmaschinen |
| `inhalt/betrieb.json` | Name, Ort und Kontakt. Fuss und strukturierte Daten lesen hier |

Beispiel für einen Ferienhinweis:

```json
{ "text": "Vom 21. Dezember bis 4. Januar mache ich Ferien.", "von": "2026-12-14", "bis": "2027-01-04" }
```

Der Bau prüft die Angaben. Er bricht ab, wenn ein Pflichtfeld fehlt, ein Bild keinen Alt-Text hat oder ein Datum nicht stimmt.

### Entwurf und Freigabe

Texte und Rechtstexte tragen `freigegeben`, Kreationen `bestaetigt`. Solange dort `false` steht, ist der Eintrag ein Entwurf. Auf der Testadresse wird er geduldet. Mit `SITE_STUFE=live` bricht der Bau ab, bis alles freigegeben ist.

## Aufbau

```
inhalt/                 Inhalte (siehe oben)
src/assets/             Bilder, Schriften, Siegel
src/stile/              Marken-Token, Grundstile, Kapitel der Startseite
src/layouts/            Seitengerüst mit Kopfangaben und strukturierten Daten
src/components/         Kopf, Fuss, Hinweisband, Siegel
src/components/kapitel/ Je Kapitel der Startseite eine Datei
src/skripte/            Schalter, Bewegung der Startseite, Bestellfenster
src/pages/              Seiten
src/inhalt/             Einlesen und Prüfen der Inhalte
pruefungen/             Prüfungen vor jeder Veröffentlichung
werkzeuge/              Hilfen, die nur bei Bedarf laufen
docs/                   Entscheide und offene Punkte
```

### Bewegung

Drei Momente bewegen sich beim Scrollen: das Fenster im Auftakt, die Handschrift im Versprechen und der Bilderstapel. `src/skripte/schalter.js` schaltet die Bewegung im Kopf der Seite ein, `src/skripte/bewegung.js` führt sie aus. `src/skripte/anfrage.js` ist das Bestellfenster auf jeder Seite. Ohne Skript, bei einem Fehler und bei reduzierter Bewegung zeigt die Seite dieselben Inhalte ruhig untereinander.

Die Seite `/grundlagen/` zeigt Farben, Schriften und Bausteine zur Abnahme. Sie ist nicht verlinkt und für Suchmaschinen gesperrt.

## Seiten

| Adresse | Inhalt |
| --- | --- |
| `/` | Startseite |
| `/angebot/` | Alle Kreationen und Beilagen |
| `/angebot/<name>/` | Eine Kreation mit Grössen und Preisen |
| `/firmenapero/` | Für Firmen |
| `/uebermich/` | Sibylle |
| `/info/` | Abholung, Lieferung, Depot, Bezahlung |
| `/impressum/` | Impressum, AGB, Qualität & Hygiene, Datenschutz |
| `/llms.txt` | Sachliche Kurzfassung für Assistenten |

`/angebot`, `/uebermich`, `/info` und `/impressum` sind dieselben Adressen wie auf der bisherigen Seite.

## Prüfungen

| Befehl | Prüft |
| --- | --- |
| `pruefen:html` | Gültiges HTML |
| `pruefen:gate` | Kopfangaben, eine `h1`, Überschriftenfolge, Alt-Texte, Bildmasse, tote Verweise, Schreibweise, strukturierte Daten, Sitemap |
| `pruefen:kontrast` | Farbpaare aus `pruefungen/kontrast.json` gegen ihre Schwelle |
| `pruefen:vermerke` | Dateien, gebaute Seite und Commit-Texte auf Werkzeug-Vermerke |
| `pruefen:browser` | Fünf Bildschirmbreiten in Chrome: kein Überlauf, keine Fehler, keine Abrufe nach aussen, WCAG 2.2 AA, Tastatur und Fokus. Dazu das Bestellfenster und jede Seite ohne JavaScript |
| `pruefen:ladezeit` | Startseite wie auf einem mittleren Handy: grösstes Element unter 2,5 s, Layoutsprung unter 0,1, Gewicht unter 1 MB |

## Veröffentlichung

Jeder Push auf `main` baut, prüft und veröffentlicht (`.github/workflows/seite.yml`). Schlägt eine Prüfung fehl, bleibt die bisherige Fassung online. Ein täglicher Neubau hält das Hinweisband aktuell.

Einmalig in den Einstellungen des Repositorys:

1. **Pages**: unter «Build and deployment» als Quelle «GitHub Actions» wählen.
2. **Branches**: `main` schützen, Änderungen nur über Pull Request mit bestandener Prüfung «Bauen und prüfen».
3. **Security**: Dependabot-Meldungen und Sicherheitsupdates einschalten.

Vier Variablen (Settings, Variables, Actions) steuern Adresse und Versand. Ohne sie läuft die Testadresse.

| Variable | Testadresse (Voreinstellung) | Nach dem Umzug |
| --- | --- | --- |
| `SITE_ADRESSE` | `https://<konto>.github.io` | `https://aperozauber.ch` |
| `SITE_PFAD` | `/aperozauber` | `/` |
| `SITE_STUFE` | `test` | `live` |
| `SITE_ANFRAGE_ZIEL` | leer: die Anfrage öffnet das Mailprogramm | Adresse, die Anfragen entgegennimmt |

In der Stufe `test` sperren `robots.txt` und die Seiten selbst alle Suchmaschinen, damit die Testadresse nicht neben der bestehenden Seite in der Suche erscheint.

Hinweis: GitHub hält geplante Läufe in öffentlichen Repositorys an, wenn 60 Tage lang nichts geändert wurde. Ein Klick unter «Actions» schaltet sie wieder ein.

## Sicherheit

- Keine Tracker, keine fremden Skripte, keine fremden Schriften, keine Cookies.
- Ohne gesetzten Empfänger verlässt die Anfrage die Seite über das Mailprogramm der Besucherin, und die Seite überträgt nichts. Mit Empfänger geht sie verschlüsselt nur an diese eine Adresse, die Content Security Policy lässt keine andere zu.
- Content Security Policy als Meta-Angabe mit Prüfsummen, Grundregel `default-src 'none'`. GitHub Pages erlaubt keine eigenen Server-Kopfzeilen. Angaben wie `frame-ancestors` oder HSTS mit eigener Dauer brauchen später einen vorgeschalteten Dienst.
- Abhängigkeiten mit festen Versionen und Sperrdatei, Einrichtung ohne Installationsskripte, wöchentliche Aktualisierungsvorschläge.
- Workflow-Schritte sind auf Commit-Kennungen festgelegt, Rechte je Job auf das Nötige beschränkt.
- Keine Schlüssel oder Passwörter im Repository.
