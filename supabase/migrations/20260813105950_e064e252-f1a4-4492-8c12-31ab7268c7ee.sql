DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clubs','table_rows','fixtures','scorers','squads','news','albums','gallery','settings'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
  EXECUTE 'GRANT SELECT ON public.admins TO authenticated';
  EXECUTE 'GRANT ALL ON public.admins TO service_role';
  EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role';
END $$;