# Umstellung auf www.aperozauber.ch

Ziel: Die neue Seite ersetzt die bisherige (Squarespace) ohne Verlust an Sichtbarkeit. Die Adresse bleibt `https://www.aperozauber.ch`, die Mails bleiben unberührt.

## Was schon vorbereitet ist

- **Hauptadresse www:** Die bisherige Seite war unter `www.aperozauber.ch` indexiert. Canonical, Sitemap, robots.txt, strukturierte Daten und Vorschau-Angaben zeigen im Livebau alle auf www.
- **Gleiche Pfade:** `/angebot`, `/uebermich`, `/info`, `/impressum` bestehen weiter. Die Auslieferung leitet `/angebot` auf `/angebot/` (mit Schrägstrich) weiter, das Canonical zeigt auf die Schreibweise mit Schrägstrich.
- **Weiterleitungen:** `/home` → Startseite, `/cart` und `/checkout` → Angebot (siehe `src/inhalt/weiterleitungen.js`). Diese Seiten stehen nicht in der Sitemap und sind für Suchmaschinen als Weiterleitung markiert.
- **Alter Sitemap-Pfad:** `/sitemap.xml` liefert dieselbe Sitemap wie `/sitemap-index.xml`, falls die alte Adresse irgendwo eingereicht ist.
- **Trockenlauf:** Bei jedem Push baut ein eigener Job die Seite mit den Einstellungen der richtigen Adresse und lässt alle Prüfungen laufen, inklusive `pruefen:umstellung` (alle bisherigen Adressen kommen an, kein Verweis auf die Testadresse, richtiges Canonical, Sitemap, keine versehentliche Sperre).
- **Preise, Überschriften, Beschreibungen:** Die Preise stimmen mit der bisherigen Seite überein. Die Seitentitel sind neu geschrieben und auf die Suche ausgerichtet.

## Ist-Stand der DNS-Zone bei Hostpoint (16.11.2026)

- `@` hat zwei A-Einträge auf Squarespace (`198.185.159.144`, `198.185.159.145`), dazu ein Wildcard-A `*` auf `198.185.159.145`. Es gibt keinen eigenen Eintrag für `www`, er läuft über das Wildcard.
- Mail: MX `mx1` und `mx2.mail.hostpoint.ch` für `@` und `*`, SPF `v=spf1 redirect=spf.mail.hostpoint.ch`, CNAME `autoconfig`, `autodiscover` und `lists` auf Hostpoint. **Alles bleibt.**
- CNAME `e5p9sbfsjssfkzfzg86s` auf `verify.squarespace.com`: Bestätigung für Squarespace, bleibt bis zum Ende des Rückwegs.
- TXT `google-site-verification=…`: Search Console, bleibt dauerhaft.
- Alle A- und CNAME-Einträge haben schon TTL 300 Sekunden, eine Absenkung ist nicht nötig. Es gibt weder AAAA noch CAA.

## Vor dem Umstellungstag

1. Bei Hostpoint «Zone herunterladen» und die Datei aufbewahren (Rückweg).
2. Erledigt (17.11.2026): Domain `aperozauber.ch` ist bei GitHub verifiziert (TXT `_github-pages-challenge-nbrivio`). Der Eintrag muss dauerhaft stehen bleiben.
3. Erledigt: Domain-Property `aperozauber.ch` in der Search Console ist bestätigt. Die bisherige Property `https://www.aperozauber.ch/` bleibt bestehen und zeigt nach dem Umhängen, ob die alten Adressen ankommen.

## Umstellungstag

1. **Variablen setzen** (GitHub → Settings → Secrets and variables → Actions → Variables):
   - `SITE_ADRESSE` = `https://www.aperozauber.ch`
   - `SITE_PFAD` = `/`
   - `SITE_STUFE` = `live`
2. **Bau auslösen:** Workflow «Prüfen und veröffentlichen» mit «Run workflow». Er muss grün sein.
3. **Domain in Pages eintragen:** Settings → Pages → Custom domain = `www.aperozauber.ch`. Ab jetzt leitet die Testadresse auf die richtige Adresse um.
4. **DNS bei Hostpoint umstellen** (Reihenfolge einhalten, in einem Zug):
   - Löschen: die zwei A-Einträge auf `@` (`198.185.159.144`, `198.185.159.145`) und das Wildcard-A `*` auf `198.185.159.145`
   - Neu: `www` als CNAME auf `nbrivio.github.io`
   - Neu: `@` als A auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Neu: `@` als AAAA auf `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - **Nicht anfassen:** die beiden TXT-Einträge (Google und GitHub), MX (auch der Wildcard-MX), SPF, `autoconfig`, `autodiscover`, `lists`, der Google-TXT-Eintrag und der Squarespace-Bestätigungs-CNAME
5. **HTTPS:** In Pages warten, bis das Zertifikat ausgestellt ist (Minuten bis eine Stunde), dann «Enforce HTTPS» setzen. Die Variante ohne www leitet GitHub automatisch auf www um.
6. **Prüfen** (nach Weitergabe der DNS-Änderung):
   - `https://www.aperozauber.ch/`, `/angebot`, `/uebermich`, `/info`, `/impressum` laden, ebenso `/home` und `/cart` (müssen auf Startseite bzw. Angebot springen)
   - `http://aperozauber.ch` und `https://aperozauber.ch` landen auf `https://www.aperozauber.ch/`
   - `/robots.txt` erlaubt alles und nennt die Sitemap, `/sitemap-index.xml` und `/sitemap.xml` laden
   - Anfrage-Formular einmal ausfüllen und Eingang bei `anfrage@aperozauber.ch` prüfen
7. **Search Console:** Sitemap `https://www.aperozauber.ch/sitemap-index.xml` einreichen. Bei Startseite, Angebot, Über mich, Info die URL-Prüfung ausführen und Indexierung anfordern. Eine «Adressänderung» ist nicht nötig, die Domain bleibt gleich.
8. **Google Unternehmensprofil, Instagram, Mail-Signatur:** Die Adresse bleibt `https://www.aperozauber.ch`, es ist nichts zu ändern.

## Rückweg

Bis zur Bestätigung durch die Prüfung das Squarespace-Abo nicht kündigen. Notfalls die drei alten A-Einträge zurückschreiben und die GitHub-Einträge löschen (TTL ist 300 Sekunden, das greift binnen Minuten) und die Variable `SITE_STUFE` wieder auf `test` setzen.

## Nach der Umstellung

- Eine Woche lang in der Search Console unter «Seiten» beobachten: keine Fehler bei «Nicht gefunden (404)» für die bisherigen Adressen.
- Nach ein bis zwei Wochen den Squarespace-Bestätigungs-CNAME löschen und die TTL der neuen Einträge auf 3600 erhöhen.
- Datenschutztext prüfen, sobald die Anfrage nicht mehr über das Mailprogramm, sondern direkt verschickt wird.
