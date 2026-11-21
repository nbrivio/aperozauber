-- Wachhund für den HTTP-Arbeiter von pg_net. Am 17.11.2026 blieb er in der Namensauflösung hängen,
-- der Zeitplan erreichte die Funktion nicht mehr. Alle 10 Minuten: Gab es in den letzten 10 Minuten
-- mindestens drei Aufrufe mit Fehler und keinen einzigen mit Antwort, wird der Arbeiter neu gestartet.
-- Aus dem laufenden Zeitplan übernommen; in der Datenbank ist er nicht als Migration verzeichnet.
select cron.schedule(
  'http-arbeiter-wachhund',
  '*/10 * * * *',
  $$
  select case
    when (select count(*) from net._http_response
           where created > now() - interval '10 minutes' and status_code is null and error_msg is not null) >= 3
     and (select count(*) from net._http_response
           where created > now() - interval '10 minutes' and status_code is not null) = 0
    then (select net.worker_restart()::text)
    else 'nichts zu tun'
  end
  $$
);
