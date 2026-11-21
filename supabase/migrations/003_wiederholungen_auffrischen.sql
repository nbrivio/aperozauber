-- Sicherheitsnetz gegen vorübergehende Störungen beim Mailversand.
-- Die Funktion gibt bei versuche >= 5 auf. Im Minutentakt ist dieses Budget nach fünf Minuten
-- aufgebraucht, eine kurze Störung beim Mailanbieter würde eine Anfrage dauerhaft verlieren.
-- Alle 15 Minuten wird der Zähler offener Anfragen der letzten 24 Stunden zurückgesetzt.
-- Ergebnis: fünf schnelle Versuche, rund zehn Minuten Pause, wieder fünf Versuche — also wachsende
-- Abstände statt endgültiges Aufgeben, ohne die Funktion zu ändern. Nach 24 Stunden endet es,
-- damit eine dauerhaft unzustellbare Anfrage nicht ewig gegen den Mailserver läuft.
select cron.schedule(
  'anfragen-wiederholungen-auffrischen',
  '*/15 * * * *',
  $$
  update public.anfragen
     set versuche = 0
   where versuche > 0
     and eingang > now() - interval '24 hours'
     and (mitteilung_gesendet is null
          or (email is not null and bestaetigung_um is not null
              and bestaetigung_gesendet is null and selbst_antworten = false))
  $$
);
