-- Zählt jeden Aufruf des Formulars, nicht nur die gültigen Anfragen.
-- Vorher griff die Mengenbegrenzung erst, wenn eine Anfrage gespeichert wurde; ungültige Eingaben
-- und Treffer in die Spamfalle blieben ungezählt und damit unbegrenzt möglich.
-- Gespeichert wird nur der gesalzene Hash der Herkunft und der Zeitpunkt, nichts weiter.
create table public.zugriffe (
  id bigserial primary key,
  ip_hash text not null,
  zeit timestamptz not null default now()
);

alter table public.zugriffe enable row level security;
revoke all on public.zugriffe from anon, authenticated;
revoke all on sequence public.zugriffe_id_seq from anon, authenticated;

create index zugriffe_ip_idx on public.zugriffe (ip_hash, zeit);

-- Die Tabelle ist reine Buchhaltung für eine Stunde. Stündlich alles ältere als ein Tag löschen,
-- damit sie auch unter Beschuss klein bleibt.
select cron.schedule('zugriffe-aufraeumen', '43 * * * *',
  $$ delete from public.zugriffe where zeit < now() - interval '24 hours' $$);
