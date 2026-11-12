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
| `inhalt/hinweis.json` | Band für Ferien und Fristen: `text`, `von`, `bis` (Datum als JJJJ-MM-TT). Ausserhalb des Zeitraums verschwindet es von selbst |
| `inhalt/kreationen/` | Je Kreation und Beilage eine Datei: Name, Satz, Grössen, Preise, Allergene, Bild, Alt-Text |
| `inhalt/texte/` | Texte der Startseite, je Kapitel eine Datei |
| `inhalt/stimmen.json`, `inhalt/firmen.json` | Kundenstimmen und Firmenlogos, nur mit Einverständnis |
| `inhalt/recht/` | Impressum, AGB, Qualität & Hygiene, Datenschutz |
| `inhalt/betrieb.json` | Name, Ort und Kontakt. Fuss und strukturierte Daten lesen hier |

Beispiel für einen Ferienhinweis:

```json
{ "text": "Vom 21. Dezember bis 4. Januar mache ich Ferien.", "von": "2026-12-14", "bis": "2027-01-04" }
```

Der Bau prüft die Angaben. Er bricht ab, wenn ein Pflichtfeld fehlt, ein Bild keinen Alt-Text hat oder ein Datum nicht stimmt.

### Entwurf und Freigabe

Texte tragen `freigegeben`, Kreationen `bestaetigt`. Solange dort `false` steht, ist der Eintrag ein Entwurf. Auf der Testadresse wird er geduldet. Mit `SITE_STUFE=live` bricht der Bau ab, bis alles freigegeben ist.

## Aufbau

```
inhalt/        Inhalte (siehe oben)
src/stile/     Marken-Token und Grundstile
src/layouts/   Seitengerüst mit Kopfangaben und strukturierten Daten
src/components Kopf, Fuss, Hinweisband, Siegel
src/pages/     Seiten
src/inhalt/    Einlesen und Prüfen der Inhalte
pruefungen/    Prüfungen vor jeder Veröffentlichung
werkzeuge/     Hilfen, die nur bei Bedarf laufen
docs/          Entscheide und offene Punkte
```

Die Seite `/grundlagen/` zeigt Farben, Schriften und Bausteine zur Abnahme. Sie ist nicht verlinkt und für Suchmaschinen gesperrt.

## Prüfungen

| Befehl | Prüft |
| --- | --- |
| `pruefen:html` | Gültiges HTML |
| `pruefen:gate` | Kopfangaben, eine `h1`, Überschriftenfolge, Alt-Texte, Bildmasse, tote Verweise, Schreibweise, strukturierte Daten, Sitemap |
| `pruefen:kontrast` | Farbpaare aus `pruefungen/kontrast.json` gegen ihre Schwelle |
| `pruefen:vermerke` | Dateien, gebaute Seite und Commit-Texte auf Werkzeug-Vermerke |
| `pruefen:browser` | Fünf Bildschirmbreiten in Chrome: kein Überlauf, keine Fehler, keine Abrufe nach aussen, WCAG 2.2 AA, Tastatur und Fokus |
| `pruefen:ladezeit` | Startseite wie auf einem mittleren Handy: grösstes Element unter 2,5 s, Layoutsprung unter 0,1, Gewicht unter 1 MB |

## Veröffentlichung

Jeder Push auf `main` baut, prüft und veröffentlicht (`.github/workflows/seite.yml`). Schlägt eine Prüfung fehl, bleibt die bisherige Fassung online. Ein täglicher Neubau hält das Hinweisband aktuell.

Einmalig in den Einstellungen des Repositorys:

1. **Pages**: unter «Build and deployment» als Quelle «GitHub Actions» wählen.
2. **Branches**: `main` schützen, Änderungen nur über Pull Request mit bestandener Prüfung «Bauen und prüfen».
3. **Security**: Dependabot-Meldungen und Sicherheitsupdates einschalten.

Drei Variablen (Settings, Variables, Actions) steuern die Adresse. Ohne sie läuft die Testadresse.

| Variable | Testadresse (Voreinstellung) | Nach dem Umzug |
| --- | --- | --- |
| `SITE_ADRESSE` | `https://<konto>.github.io` | `https://aperozauber.ch` |
| `SITE_PFAD` | `/aperozauber` | `/` |
| `SITE_STUFE` | `test` | `live` |

In der Stufe `test` sperren `robots.txt` und die Seiten selbst alle Suchmaschinen, damit die Testadresse nicht neben der bestehenden Seite in der Suche erscheint.

Hinweis: GitHub hält geplante Läufe in öffentlichen Repositorys an, wenn 60 Tage lang nichts geändert wurde. Ein Klick unter «Actions» schaltet sie wieder ein.

## Sicherheit

- Keine Tracker, keine fremden Skripte, keine fremden Schriften, keine Cookies.
- Content Security Policy als Meta-Angabe mit Prüfsummen, Grundregel `default-src 'none'`. GitHub Pages erlaubt keine eigenen Server-Kopfzeilen. Angaben wie `frame-ancestors` oder HSTS mit eigener Dauer brauchen später einen vorgeschalteten Dienst.
- Abhängigkeiten mit festen Versionen und Sperrdatei, Einrichtung ohne Installationsskripte, wöchentliche Aktualisierungsvorschläge.
- Workflow-Schritte sind auf Commit-Kennungen festgelegt, Rechte je Job auf das Nötige beschränkt.
- Keine Schlüssel oder Passwörter im Repository.
