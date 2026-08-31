-- Studio Capricho Hair — estrutura inicial segura para Supabase/PostgreSQL
create extension if not exists pgcrypto;

create sequence if not exists public.quote_protocol_seq start 1001;
create sequence if not exists public.receipt_number_seq start 1;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_phone(value text)
returns text language sql immutable strict as $$
  select case
    when regexp_replace(value, '[^0-9]', '', 'g') like '55%' then regexp_replace(value, '[^0-9]', '', 'g')
    else '55' || regexp_replace(value, '[^0-9]', '', 'g')
  end
$$;

create table if not exists public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.administrators
    where user_id = auth.uid() and active = true
  )
$$;

create table if not exists public.studio_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton = true),
  name text not null check (char_length(name) between 2 and 120),
  specialty text not null default '',
  slogan text not null default '',
  whatsapp text not null,
  instagram text not null default '',
  address text not null default '',
  city text not null default '',
  opening_hours text not null default '',
  primary_color text not null default '#101010' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#c6a25b' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  thank_you_message text not null default 'Agradecemos a preferência e a confiança em nosso trabalho.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.studio_settings
  (name, specialty, slogan, whatsapp, instagram, address, city, opening_hours)
values
  ('Studio Capricho Hair', 'Cabelos com técnica, cuidado e capricho',
   'Transformando seu visual com resultados personalizados.', '5511972706437',
   '@caprichoohair_', 'Av. Presbítero Manoel Antônio Dias Filho, N° 1420 - Parque Res. Jundiaí, Jundiaí - SP, 13212-461',
   'Jundiaí, SP', '09h às 18h')
on conflict (singleton) do nothing;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (char_length(category) between 2 and 80),
  description text check (description is null or char_length(description) <= 600),
  price numeric(12,2) not null check (price >= 0),
  unit text check (unit is null or char_length(unit) <= 40),
  active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null unique check (phone ~ '^55[0-9]{10,11}$'),
  birth_date date,
  notes text check (notes is null or char_length(notes) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  available_date date not null,
  start_time time not null,
  active boolean not null default true,
  blocked boolean not null default false,
  block_reason text check (block_reason is null or char_length(block_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (available_date, start_time)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_phone text not null check (client_phone ~ '^55[0-9]{10,11}$'),
  requested_date date not null,
  requested_time time not null,
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'Pendente' check (status in ('Pendente','Confirmado','Recusado','Concluído','Cancelado')),
  total numeric(12,2) not null default 0 check (total >= 0),
  request_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid unique references public.quotes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  availability_id uuid references public.availability(id) on delete set null,
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_phone text not null check (client_phone ~ '^55[0-9]{10,11}$'),
  service_summary text not null,
  scheduled_date date not null,
  scheduled_time time not null,
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'Agendado' check (status in ('Agendado','Confirmado','Concluído','Cancelado')),
  payment_method text,
  receipt_number text unique,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appointments_active_slot_uidx
on public.appointments (scheduled_date, scheduled_time)
where status in ('Agendado','Confirmado','Concluído');

create table if not exists public.appointment_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('Pix','Dinheiro','Cartão de débito','Cartão de crédito','Outro')),
  receipt_number text not null unique,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(description) between 2 and 180),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (char_length(category) between 2 and 80),
  expense_date date not null,
  payment_method text not null check (char_length(payment_method) between 2 and 60),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_created_at_idx on public.quotes(created_at desc);
create index if not exists quotes_phone_created_idx on public.quotes(client_phone, created_at desc);
create index if not exists appointments_date_idx on public.appointments(scheduled_date, scheduled_time);
create index if not exists attendances_completed_idx on public.attendances(completed_at desc);
create index if not exists expenses_date_idx on public.expenses(expense_date desc);

drop trigger if exists set_updated_at_administrators on public.administrators;
create trigger set_updated_at_administrators before update on public.administrators for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_settings on public.studio_settings;
create trigger set_updated_at_settings before update on public.studio_settings for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_services on public.services;
create trigger set_updated_at_services before update on public.services for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_availability on public.availability;
create trigger set_updated_at_availability before update on public.availability for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_quotes on public.quotes;
create trigger set_updated_at_quotes before update on public.quotes for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_appointments on public.appointments;
create trigger set_updated_at_appointments before update on public.appointments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_expenses on public.expenses;
create trigger set_updated_at_expenses before update on public.expenses for each row execute function public.set_updated_at();

alter table public.administrators enable row level security;
alter table public.studio_settings enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.availability enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_items enable row level security;
alter table public.attendances enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Admins read own authorization" on public.administrators;
create policy "Admins read own authorization" on public.administrators for select using (user_id = auth.uid());
drop policy if exists "Public reads studio settings" on public.studio_settings;
create policy "Public reads studio settings" on public.studio_settings for select using (true);
drop policy if exists "Public reads active services" on public.services;
create policy "Public reads active services" on public.services for select using (active = true or public.is_admin());

do $$
declare table_name text;
begin
  foreach table_name in array array['studio_settings','services','clients','availability','quotes','quote_items','appointments','appointment_items','attendances','expenses']
  loop
    execute format('drop policy if exists "Administrators manage %s" on public.%I', table_name, table_name);
    execute format('create policy "Administrators manage %s" on public.%I for all using (public.is_admin()) with check (public.is_admin())', table_name, table_name);
  end loop;
end $$;

create or replace function public.public_available_dates()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(d.available_date order by d.available_date), '[]'::jsonb)
  from (
    select distinct a.available_date
    from public.availability a
    where a.active = true and a.blocked = false and a.available_date >= current_date
      and not exists (
        select 1 from public.appointments ap
        where ap.scheduled_date = a.available_date and ap.scheduled_time = a.start_time
          and ap.status in ('Agendado','Confirmado','Concluído')
      )
    order by a.available_date
    limit 90
  ) d
$$;

create or replace function public.public_available_slots(p_date date)
returns table(availability_id uuid, date date, start_time time)
language sql stable security definer set search_path = public as $$
  select a.id, a.available_date, a.start_time
  from public.availability a
  where a.available_date = p_date and a.available_date >= current_date
    and a.active = true and a.blocked = false
    and not exists (
      select 1 from public.appointments ap
      where ap.scheduled_date = a.available_date and ap.scheduled_time = a.start_time
        and ap.status in ('Agendado','Confirmado','Concluído')
    )
  order by a.start_time
$$;

create or replace function public.submit_public_request(
  p_client_name text,
  p_client_phone text,
  p_requested_date date,
  p_requested_time time,
  p_notes text,
  p_items jsonb,
  p_honeypot text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_quote_id uuid;
  v_client_id uuid;
  v_protocol text;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_service public.services%rowtype;
  v_quantity integer;
  v_hash text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Solicitação inválida.'; end if;
  if char_length(trim(p_client_name)) not between 2 and 120 then raise exception 'Informe seu nome completo.'; end if;
  v_phone := public.normalize_phone(p_client_phone);
  if v_phone !~ '^55[0-9]{10,11}$' then raise exception 'Informe um WhatsApp válido com DDD.'; end if;
  if p_requested_date < current_date then raise exception 'Escolha uma data futura.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Selecione de 1 a 20 serviços.';
  end if;
  if coalesce(char_length(p_notes), 0) > 500 then raise exception 'A observação está muito longa.'; end if;

  perform 1 from public.availability
    where available_date = p_requested_date and start_time = p_requested_time and active and not blocked
    for update;
  if not found then raise exception 'Este horário não está mais disponível.'; end if;

  if exists (select 1 from public.appointments where scheduled_date = p_requested_date and scheduled_time = p_requested_time and status in ('Agendado','Confirmado','Concluído')) then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro.';
  end if;
  if (select count(*) from public.quotes where client_phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Muitas solicitações em pouco tempo. Aguarde 10 minutos.';
  end if;

  v_hash := encode(digest(lower(trim(p_client_name)) || v_phone || p_requested_date::text || p_requested_time::text || p_items::text, 'sha256'), 'hex');
  if exists (select 1 from public.quotes where request_hash = v_hash and created_at > now() - interval '24 hours') then
    raise exception 'Esta solicitação já foi registrada.';
  end if;

  insert into public.clients(name, phone)
  values (trim(p_client_name), v_phone)
  on conflict (phone) do update set name = excluded.name
  returning id into v_client_id;

  v_protocol := 'CH-' || to_char(current_date,'YYYYMMDD') || '-' || lpad(nextval('public.quote_protocol_seq')::text, 5, '0');
  insert into public.quotes(protocol, client_id, client_name, client_phone, requested_date, requested_time, notes, request_hash)
  values (v_protocol, v_client_id, trim(p_client_name), v_phone, p_requested_date, p_requested_time, nullif(trim(p_notes),''), v_hash)
  returning id into v_quote_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin v_quantity := (v_item->>'quantity')::integer; exception when others then raise exception 'Quantidade inválida.'; end;
    if v_quantity not between 1 and 20 then raise exception 'Quantidade inválida.'; end if;
    select * into v_service from public.services where id = (v_item->>'service_id')::uuid and active = true;
    if not found then raise exception 'Um dos serviços não está mais disponível.'; end if;
    insert into public.quote_items(quote_id, service_id, service_name, quantity, unit_price)
    values (v_quote_id, v_service.id, v_service.name, v_quantity, v_service.price);
    v_total := v_total + (v_service.price * v_quantity);
  end loop;
  update public.quotes set total = v_total where id = v_quote_id;
  return jsonb_build_object('quote_id', v_quote_id, 'protocol', v_protocol, 'total', v_total);
end;
$$;

create or replace function public.confirm_quote(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_quote public.quotes%rowtype; v_appointment_id uuid; v_summary text;
begin
  if not public.is_admin() then raise exception 'Acesso não autorizado.'; end if;
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if not found then raise exception 'Solicitação não encontrada.'; end if;
  if v_quote.status = 'Confirmado' and exists(select 1 from public.appointments where quote_id = p_quote_id) then
    select id into v_appointment_id from public.appointments where quote_id = p_quote_id;
    return jsonb_build_object('appointment_id', v_appointment_id, 'already_created', true);
  end if;
  if v_quote.status <> 'Pendente' then raise exception 'Somente solicitações pendentes podem ser confirmadas.'; end if;
  select string_agg(service_name || case when quantity > 1 then ' x' || quantity else '' end, ', ' order by created_at)
    into v_summary from public.quote_items where quote_id = p_quote_id;
  insert into public.appointments(quote_id, client_id, client_name, client_phone, service_summary, scheduled_date, scheduled_time, total, notes, status)
  values (v_quote.id, v_quote.client_id, v_quote.client_name, v_quote.client_phone, v_summary, v_quote.requested_date, v_quote.requested_time, v_quote.total, v_quote.notes, 'Confirmado')
  returning id into v_appointment_id;
  insert into public.appointment_items(appointment_id, service_id, service_name, quantity, unit_price)
    select v_appointment_id, service_id, service_name, quantity, unit_price from public.quote_items where quote_id = p_quote_id;
  update public.quotes set status = 'Confirmado' where id = p_quote_id;
  return jsonb_build_object('appointment_id', v_appointment_id, 'already_created', false);
exception when unique_violation then
  raise exception 'Este horário já está ocupado.';
end;
$$;

create or replace function public.complete_appointment(p_appointment_id uuid, p_payment_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_appointment public.appointments%rowtype; v_attendance_id uuid; v_receipt text;
begin
  if not public.is_admin() then raise exception 'Acesso não autorizado.'; end if;
  if p_payment_method not in ('Pix','Dinheiro','Cartão de débito','Cartão de crédito','Outro') then raise exception 'Forma de pagamento inválida.'; end if;
  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'Agendamento não encontrado.'; end if;
  select id, receipt_number into v_attendance_id, v_receipt from public.attendances where appointment_id = p_appointment_id;
  if found then return jsonb_build_object('attendance_id', v_attendance_id, 'receipt_number', v_receipt, 'already_completed', true); end if;
  if v_appointment.status = 'Cancelado' then raise exception 'Um agendamento cancelado não pode ser concluído.'; end if;
  v_receipt := 'REC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0');
  insert into public.attendances(appointment_id, client_id, amount, payment_method, receipt_number)
  values (p_appointment_id, v_appointment.client_id, v_appointment.total, p_payment_method, v_receipt)
  returning id into v_attendance_id;
  update public.appointments set status = 'Concluído', payment_method = p_payment_method, receipt_number = v_receipt, completed_at = now() where id = p_appointment_id;
  if v_appointment.quote_id is not null then update public.quotes set status = 'Concluído' where id = v_appointment.quote_id; end if;
  return jsonb_build_object('attendance_id', v_attendance_id, 'receipt_number', v_receipt, 'already_completed', false);
end;
$$;

create or replace function public.set_appointment_status(p_appointment_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_quote_id uuid;
begin
  if not public.is_admin() then raise exception 'Acesso não autorizado.'; end if;
  if p_status not in ('Agendado','Confirmado','Cancelado') then raise exception 'Status inválido.'; end if;
  select quote_id into v_quote_id from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'Agendamento não encontrado.'; end if;
  delete from public.attendances where appointment_id = p_appointment_id;
  update public.appointments set status = p_status, payment_method = null, receipt_number = null, completed_at = null where id = p_appointment_id;
  if v_quote_id is not null then update public.quotes set status = case when p_status = 'Cancelado' then 'Cancelado' else 'Confirmado' end where id = v_quote_id; end if;
end;
$$;

create or replace function public.admin_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  with months as (
    select generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month')::date month
  ), revenue as (
    select date_trunc('month', completed_at)::date month, sum(amount) amount from public.attendances group by 1
  ), costs as (
    select date_trunc('month', expense_date)::date month, sum(amount) amount from public.expenses group by 1
  ), current_metrics as (
    select
      coalesce((select sum(amount) from public.attendances where completed_at >= date_trunc('month',now())),0) revenue,
      (select count(*) from public.attendances where completed_at >= date_trunc('month',now())) completed,
      coalesce((select avg(amount) from public.attendances where completed_at >= date_trunc('month',now())),0) ticket,
      (select count(*) from public.services where active) active_services,
      coalesce((select sum(amount) from public.expenses where expense_date >= date_trunc('month',current_date)::date),0) expenses,
      (select count(*) from public.quotes where status = 'Pendente') pending
  )
  select case when public.is_admin() then jsonb_build_object(
    'metrics', (select to_jsonb(current_metrics) || jsonb_build_object('profit', revenue-expenses) from current_metrics),
    'chart', (select coalesce(jsonb_agg(jsonb_build_object('month',to_char(m.month,'Mon'),'revenue',coalesce(r.amount,0),'expenses',coalesce(c.amount,0)) order by m.month),'[]'::jsonb) from months m left join revenue r using(month) left join costs c using(month)),
    'upcoming', (select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,client_name,service_summary,scheduled_date,scheduled_time,status,total from public.appointments where status in ('Agendado','Confirmado') and scheduled_date >= current_date order by scheduled_date,scheduled_time limit 6) x),
    'pending_quotes', (select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,client_name,requested_date,requested_time,total,created_at from public.quotes where status='Pendente' order by created_at limit 6) x),
    'top_services', (select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select ai.service_name, sum(ai.quantity) quantity from public.appointment_items ai join public.appointments a on a.id=ai.appointment_id where a.status='Concluído' group by ai.service_name order by quantity desc limit 5) x),
    'payments', (select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select payment_method, count(*) quantity, sum(amount) total from public.attendances group by payment_method order by total desc) x)
  ) else null end
$$;

revoke all on function public.submit_public_request(text,text,date,time,text,jsonb,text) from public;
grant execute on function public.submit_public_request(text,text,date,time,text,jsonb,text) to anon, authenticated;
grant execute on function public.public_available_dates() to anon, authenticated;
grant execute on function public.public_available_slots(date) to anon, authenticated;
revoke all on function public.confirm_quote(uuid) from public;
revoke all on function public.complete_appointment(uuid,text) from public;
revoke all on function public.set_appointment_status(uuid,text) from public;
revoke all on function public.admin_dashboard() from public;
grant execute on function public.confirm_quote(uuid) to authenticated;
grant execute on function public.complete_appointment(uuid,text) to authenticated;
grant execute on function public.set_appointment_status(uuid,text) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;
