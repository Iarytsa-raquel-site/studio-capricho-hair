-- O projeto existente mantém pgcrypto no schema extensions.
-- O caminho permanece fixo para proteger a função SECURITY DEFINER.
alter function public.submit_public_request(text,text,date,time,text,jsonb,text)
  set search_path = public, extensions, pg_temp;
