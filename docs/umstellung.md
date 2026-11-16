# Umstellung auf www.aperozauber.ch

Ziel: Die neue Seite ersetzt die bisherige (Squarespace) ohne Verlust an Sichtbarkeit. Die Adresse bleibt `https://www.aperozauber.ch`, die Mails bleiben unberührt.

## Was schon vorbereitet ist

- **Hauptadresse www:** Die bisherige Seite war unter `www.aperozauber.ch` indexiert. Canonical, Sitemap, robots.txt, strukturierte Daten und Vorschau-Angaben zeigen im Livebau alle auf www.
- **Gleiche Pfade:** `/angebot`, `/uebermich`, `/info`, `/impressum` bestehen weiter. Die Auslieferung leitet `/angebot` auf `/angebot/` (mit Schrägstrich) weiter, das Canonical zeigt auf die Schreibweise mit Schrägstrich.
- **Weiterleitungen:** `/home` → Startseite, `/cart` und `/checkout` → Angebot (siehe `src/inhalt/weiterleitungen.js`). Diese Seiten stehen nicht in der Sitemap und sind für Suchmaschinen als Weiterleitung markiert.
- **Alter Sitemap-Pfad:** `/sitemap.xml` liefert dieselbe Sitemap wie `/sitemap-index.xml`, falls die alte Adresse irgendwo eingereicht ist.
- **Trockenlauf:** Bei jedem Push baut ein eigener Job die Seite mit den Einstellungen der richtigen Adresse und lässt alle Prüfungen laufen, inklusive `pruefen:umstellung` (alle bisherigen Adressen kommen an, kein Verweis auf die Testadresse, richtiges Canonical, Sitemap, keine versehentliche Sperre).
- **Preise, Überschriften, Beschreibungen:** Die Preise stimmen mit der bisherigen Seite überein. Die Seitentitel sind neu geschrieben und auf die Suche ausgerichtet.

## Eine Woche vorher

1. Bei Hostpoint die heutigen DNS-Einträge der Domain exportieren oder abfotografieren (für den Rückweg).
2. Die TTL der Einträge `@` und `www` auf 300 Sekunden stellen und einen Tag warten.
3. In GitHub unter Settings → Pages die Domain `aperozauber.ch` verifizieren (TXT-Eintrag `_github-pages-challenge-nbrivio`). Das verhindert, dass jemand anderes die Domain auf Pages beansprucht.
4. In der Search Console die Domain-Property `aperozauber.ch` anlegen (TXT-Eintrag bei Hostpoint). Das ist unabhängig vom Umhängen möglich.

## Umstellungstag

1. **Variablen setzen** (GitHub → Settings → Secrets and variables → Actions → Variables):
   - `SITE_ADRESSE` = `https://www.aperozauber.ch`
   - `SITE_PFAD` = `/`
   - `SITE_STUFE` = `live`
2. **Bau auslösen:** Workflow «Prüfen und veröffentlichen» mit «Run workflow». Er muss grün sein.
3. **Domain in Pages eintragen:** Settings → Pages → Custom domain = `www.aperozauber.ch`. Ab jetzt leitet die Testadresse auf die richtige Adresse um.
4. **DNS bei Hostpoint umstellen:**
   - `www` als CNAME auf `nbrivio.github.io`
   - `@` (ohne www) als A-Einträge auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` und als AAAA auf `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Alte Einträge, die auf Squarespace zeigen, entfernen
   - **MX, SPF, DKIM, DMARC und alle anderen Mail-Einträge nicht anfassen.** Ein CAA-Eintrag, falls vorhanden, muss `letsencrypt.org` erlauben.
5. **HTTPS:** In Pages warten, bis das Zertifikat ausgestellt ist (Minuten bis eine Stunde), dann «Enforce HTTPS» setzen. Die Variante ohne www leitet GitHub automatisch auf www um.
6. **Prüfen** (nach Weitergabe der DNS-Änderung):
   - `https://www.aperozauber.ch/`, `/angebot`, `/uebermich`, `/info`, `/impressum` laden, ebenso `/home` und `/cart` (müssen auf Startseite bzw. Angebot springen)
   - `http://aperozauber.ch` und `https://aperozauber.ch` landen auf `https://www.aperozauber.ch/`
   - `/robots.txt` erlaubt alles und nennt die Sitemap, `/sitemap-index.xml` und `/sitemap.xml` laden
   - Anfrage-Formular einmal ausfüllen und Eingang bei `anfrage@aperozauber.ch` prüfen
7. **Search Console:** Sitemap `https://www.aperozauber.ch/sitemap-index.xml` einreichen. Bei Startseite, Angebot, Über mich, Info die URL-Prüfung ausführen und Indexierung anfordern. Eine «Adressänderung» ist nicht nötig, die Domain bleibt gleich.
8. **Google Unternehmensprofil, Instagram, Mail-Signatur:** Die Adresse bleibt `https://www.aperozauber.ch`, es ist nichts zu ändern.

## Rückweg

Bis zur Bestätigung durch die Prüfung das Squarespace-Abo nicht kündigen. Notfalls die alten DNS-Einträge zurückschreiben (wegen der kurzen TTL greift das binnen Minuten) und die Variable `SITE_STUFE` wieder auf `test` setzen.

## Nach der Umstellung

- Eine Woche lang in der Search Console unter «Seiten» beobachten: keine Fehler bei «Nicht gefunden (404)» für die bisherigen Adressen.
- Die TTL wieder auf einen normalen Wert (z. B. 3600) erhöhen.
- Datenschutztext prüfen, sobald die Anfrage nicht mehr über das Mailprogramm, sondern direkt verschickt wird.
