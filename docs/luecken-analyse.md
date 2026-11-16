# Was noch fehlt: Analyse nach dem Livegang (17.11.2026)

Technisch ist die Seite in gutem Zustand: Seiten-Gate, Barrierefreiheit (100), Performance (97 bis 99), Weiterleitungen und Sitemap stehen. Offen ist, was Anfragen bringt, misst und absichert. Sortiert nach Wirkung.

## Hoch

| # | Lücke | Warum es zählt | Aufwand | Wann |
|---|---|---|---|---|
| 1 | **Anfragen landen nur im Mailprogramm.** Wer dort nicht auf Senden drückt, ist verloren. | Direkter Umsatzverlust, unsichtbar | 1 Tag | morgen, siehe `anfrage-automation.md` |
| 2 | **Keine Messung.** Wir wissen nicht, welche Seite Anfragen bringt. | Ohne Zahlen keine Verbesserung | 0,5 Tag | mit 1 |
| 3 | **Google Unternehmensprofil dünn.** Inhalte liegen bereit. | Lokale Suche («Apéro Villmergen», «Apéroplatten Freiamt») läuft über das Profil | 1 Stunde | morgen, siehe `google-unternehmensprofil.md` |
| 4 | **Saison.** Weihnachts- und Neujahrsapéro für Firmen werden jetzt bestellt. Die Themenseiten stehen, aber kaum jemand weiss davon. | Das Zeitfenster ist kurz | 1 Stunde | diese Woche: zwei Beiträge im Profil, Instagram |
| 5 | **Rückverweise fehlen.** Wenige Seiten verlinken auf aperozauber.ch. | Stärkster Hebel für die Suche | laufend | ab dieser Woche |

### Zu 2: Messung
Empfehlung: ein Messdienst ohne Cookies, in der EU oder Schweiz gehostet (zum Beispiel Plausible oder Umami). Ohne Cookies braucht es keinen Hinweisbalken. Gemessen werden Seitenaufrufe, Herkunft (Google, Instagram, Profil) und das Ereignis «Anfrage gesendet». Der Datenschutztext wird dafür um einen Absatz ergänzt, die Sicherheitsrichtlinie der Seite um die Adresse des Dienstes. Ergänzend gilt die Search Console, in der die Domain bestätigt ist.

### Zu 5: Rückverweise
- Die sieben Firmen der Logowand um einen Link auf aperozauber.ch bitten («Partner» oder «Empfehlung» auf ihrer Seite): Kaiser & Korn, Feldhaas, Brückenwerk, Wedding with Jenni, WEY, sie & er, Blumen-Bahnhof. Wedding with Jenni ist zusätzlich eine Empfehlungsquelle für Hochzeitsapéros.
- Einträge mit identischen Angaben (Name, Adresse, Telefon): Apple Business Connect, Bing Places, local.ch, search.ch, Facebook-Seite, Gewerbeverzeichnis Villmergen und Freiamt.
- Instagram: Link in der Biografie auf `https://www.aperozauber.ch/`, in Beiträgen zu Weihnachten auf die Themenseite.

## Mittel

| # | Lücke | Hinweis |
|---|---|---|
| 6 | Mehr Google-Rezensionen | Zettel mit QR-Code in jeder Holzkiste, Rezensionslink in der Bestätigungsmail |
| 7 | E-Mail-Absicherung | DMARC und DKIM für aperozauber.ch prüfen (ausgeblendete System-Einträge bei Hostpoint), damit Bestätigungen nicht im Spam landen |
| 8 | Logo Blumen-Bahnhof fehlt in der Logowand | Datei von Sibylle oder dem Kunden, dann einbauen |
| 9 | Datenschutztext | Anpassen, sobald die Anfrage über einen Server läuft (Anbieter, Land, Löschfrist) und eine Messung läuft |
| 10 | Offene Punkte aus `offene-entscheide.md` | Preise «ab» und MWST-Angabe, Telefon im Impressum, Herkunft und Allergene je Kreation auf Anfrage |
| 11 | WhatsApp | Backlog: für Privatpersonen oft der einfachste Weg, kommt nach der Mailstrecke |
| 12 | Weitere Themenseiten | Vereinsanlass und Generalversammlung, Konfirmation und Firmung, Jubiläum, Hochzeit (mit Wedding with Jenni). Bewusst zurückgestellt, bis die Basis läuft |

## Niedrig

- Web-App-Manifest und eigene Vorschaubilder je Themenseite (heute ein gemeinsames Vorschaubild)
- Gutscheine oder Geschenkideen (Geschenkboxen gibt es bewusst nicht)
- Newsletter

## Bewusst nicht tun
- Eigene Bewertungen mit Sternen in den strukturierten Daten der Seite auszeichnen: Google wertet das bei Selbstbewertungen nicht und kann es bestrafen.
- Seiten je Ortsname (Wohlen, Muri, Lenzburg …) mit nahezu gleichem Text: gilt als Türseiten und schadet. Wenn, dann eine ehrliche Seite zum Liefergebiet.

## Kennzahlen, die wir ab jetzt wöchentlich ansehen
Anfragen pro Woche (Quelle: Mitteilung an Sibylle), Klicks und Impressionen in der Search Console (Ausgangslage vor dem Umzug: 85 Klicks, 4 indexierte Seiten), Aufrufe, Anrufe und Routen im Unternehmensprofil, neue Bewertungen.
