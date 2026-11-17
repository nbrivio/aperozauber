-- Anfragen von aperozauber.ch. Region Zürich (eu-central-2), damit die Daten in der Schweiz bleiben.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.anfragen (
  id uuid primary key default gen_random_uuid(),
  eingang timestamptz not null default now(),
  daten jsonb not null,                                   -- geprüfte Angaben aus dem Formular
  email text,                                             -- nur gesetzt, wenn der Kontakt eine E-Mail-Adresse enthält
  ip_hash text not null,                                  -- gesalzener Hash, nur für die Mengenbegrenzung
  bestaetigung_um timestamptz,                            -- Ergebnis von sendezeit(): frühestens 20 Minuten, nur 08:00 bis 21:00
  bestaetigung_gesendet timestamptz,
  mitteilung_gesendet timestamptz,                        -- Mitteilung an Sibylle
  selbst_antworten boolean not null default false,        -- Sibylle hat «Ich antworte selbst» gewählt
  versuche int not null default 0,
  loeschen_am timestamptz not null default now() + interval '90 days'
);

-- Zeilenschutz ohne Richtlinie: von aussen kommt niemand an die Tabelle. Nur die Funktion mit dem Dienstschlüssel.
alter table public.anfragen enable row level security;
revoke all on public.anfragen from anon, authenticated;

create index anfragen_ip_idx on public.anfragen (ip_hash, eingang);
create index anfragen_email_idx on public.anfragen (email, eingang) where email is not null;
create index anfragen_faellig_idx on public.anfragen (bestaetigung_um) where bestaetigung_gesendet is null;

-- Jede Nacht abgelaufene Anfragen löschen (90 Tage).
select cron.schedule('anfragen-aufraeumen', '17 3 * * *', $$ delete from public.anfragen where loeschen_am < now() $$);
