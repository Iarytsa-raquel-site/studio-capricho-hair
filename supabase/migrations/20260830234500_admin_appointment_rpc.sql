create or replace function public.admin_save_appointment(
  p_id uuid,
  p_client_name text,
  p_client_phone text,
  p_service_summary text,
  p_scheduled_date date,
  p_scheduled_time time,
  p_total numeric,
  p_notes text,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_client_id uuid;
  v_phone text;
  v_service_id uuid;
  v_previous_status text;
begin
  if not public.is_admin() then raise exception 'Acesso não autorizado.'; end if;
  if char_length(trim(p_client_name)) not between 2 and 120 then
    raise exception 'Informe o nome da cliente.';
  end if;
  v_phone := public.normalize_phone(p_client_phone);
  if v_phone !~ '^55[0-9]{10,11}$' then
    raise exception 'Informe um WhatsApp válido com DDD.';
  end if;
  if char_length(trim(p_service_summary)) not between 2 and 300 then
    raise exception 'Informe o serviço.';
  end if;
  if p_total < 0 then raise exception 'O valor não pode ser negativo.'; end if;
  if p_status not in ('Agendado','Confirmado','Cancelado') then
    raise exception 'Status inválido.';
  end if;
  if coalesce(char_length(p_notes), 0) > 1000 then
    raise exception 'A observação está muito longa.';
  end if;

  insert into public.clients(name, phone)
  values (trim(p_client_name), v_phone)
  on conflict (phone) do update set name = excluded.name
  returning id into v_client_id;

  if p_id is null then
    insert into public.appointments(
      client_id, client_name, client_phone, service_summary,
      scheduled_date, scheduled_time, total, notes, status
    ) values (
      v_client_id, trim(p_client_name), v_phone, trim(p_service_summary),
      p_scheduled_date, p_scheduled_time, p_total,
      nullif(trim(p_notes),''), p_status
    ) returning id into v_id;
  else
    select status into v_previous_status
    from public.appointments where id = p_id for update;
    if not found then raise exception 'Agendamento não encontrado.'; end if;
    if v_previous_status = 'Concluído' then
      raise exception 'Reabra o atendimento antes de editar o agendamento.';
    end if;
    update public.appointments set
      client_id = v_client_id,
      client_name = trim(p_client_name),
      client_phone = v_phone,
      service_summary = trim(p_service_summary),
      scheduled_date = p_scheduled_date,
      scheduled_time = p_scheduled_time,
      total = p_total,
      notes = nullif(trim(p_notes),''),
      status = p_status
    where id = p_id
    returning id into v_id;
    delete from public.appointment_items where appointment_id = v_id;
  end if;

  select id into v_service_id
  from public.services
  where lower(name) = lower(trim(p_service_summary))
  order by active desc, created_at desc
  limit 1;

  if not exists (
    select 1 from public.appointment_items where appointment_id = v_id
  ) then
    insert into public.appointment_items(
      appointment_id, service_id, service_name, quantity, unit_price
    ) values (v_id, v_service_id, trim(p_service_summary), 1, p_total);
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'Este horário já está ocupado.';
end;
$$;

revoke execute on function public.admin_save_appointment(uuid,text,text,text,date,time,numeric,text,text)
  from public, anon, authenticated;
grant execute on function public.admin_save_appointment(uuid,text,text,text,date,time,numeric,text,text)
  to authenticated;
