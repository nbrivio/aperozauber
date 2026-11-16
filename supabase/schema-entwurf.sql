-- Entwurf, noch nicht eingespielt. Region Zürich (eu-central-2), damit die Daten in der Schweiz bleiben.
create table anfragen (
  id uuid primary key default gen_random_uuid(),
  eingang timestamptz not null default now(),
  name text not null check (char_length(name) <= 120),
  kontakt text not null check (char_length(kontakt) <= 200),
  email text check (char_length(email) <= 200),            -- nur gesetzt, wenn der Kontakt eine E-Mail-Adresse ist
  anlass text,
  nachricht text not null check (char_length(nachricht) <= 4000),
  bestaetigung_um timestamptz,                             -- Ergebnis von sendezeit()
  bestaetigung_gesendet timestamptz,
  selbst_antworten boolean not null default false,         -- Sibylle hat «Ich antworte selbst» geklickt
  loeschen_am timestamptz not null default now() + interval '90 days'
);
alter table anfragen enable row level security;            -- keine Policy: nur die Funktion mit Service-Schlüssel kommt dran

-- jede Minute: fällige Bestätigungen versenden
-- select cron.schedule('bestaetigungen', '* * * * *', $$ select net.http_post(url := '<Funktion>/versand', headers := '{"x-cron":"<Geheimnis>"}') $$);
-- jede Nacht: abgelaufene Anfragen löschen
-- select cron.schedule('aufraeumen', '17 3 * * *', $$ delete from anfragen where loeschen_am < now() $$);
