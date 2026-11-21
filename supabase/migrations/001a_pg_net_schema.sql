-- pg_net gehört ins Schema extensions, nicht nach public.
drop extension if exists pg_net cascade;
create extension pg_net with schema extensions;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
