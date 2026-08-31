-- Autorizado pela proprietária: aposenta o acesso público às RPCs legadas.
-- As funções não são apagadas; basta restaurar os GRANTs para reverter.

revoke execute on function public.accept_booking_proposal(uuid,text)
  from public, anon, authenticated;
revoke execute on function public.cancel_booking_by_phone(uuid,text)
  from public, anon, authenticated;
revoke execute on function public.cancel_booking_public(uuid,text)
  from public, anon, authenticated;
revoke execute on function public.create_booking_secure(text,text,text,text,text,text,date,time,time,numeric)
  from public, anon, authenticated;
revoke execute on function public.create_booking_secure_v2(text,text,text[],text,text,date,time,time)
  from public, anon, authenticated;
revoke execute on function public.decline_booking_proposal(uuid,text)
  from public, anon, authenticated;
revoke execute on function public.get_booking_statuses(uuid[])
  from public, anon, authenticated;
revoke execute on function public.get_client_bookings_public(text)
  from public, anon, authenticated;
revoke execute on function public.request_reschedule_public(uuid,text,date,time)
  from public, anon, authenticated;

revoke execute on function public.suggest_booking_alternative_admin(uuid,date,time)
  from public, anon;

-- Funções de trigger continuam funcionando sem serem chamáveis pela Data API.
revoke execute on function public.notify_new_booking_push()
  from public, anon, authenticated;
revoke execute on function public.set_service_sort_order()
  from public, anon, authenticated;
