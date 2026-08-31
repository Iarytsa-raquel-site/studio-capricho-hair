-- Endurecimento pós-migração sem alterar dependências do sistema legado.

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'studio_profile','clients','services','professionals','portfolio','bookings',
    'availability_blocks','reviews','recurring_availability_blocks','expenses',
    'notification_deliveries','studio_settings','service_promotions'
  ]
  loop
    execute format(
      'alter table backup_capricho_20260830.%I enable row level security',
      table_name
    );
  end loop;
end $$;

revoke all on schema backup_capricho_20260830 from public, anon, authenticated;
revoke all on all tables in schema backup_capricho_20260830
  from public, anon, authenticated;

alter function public.set_service_sort_order()
  set search_path = public, pg_temp;
-- Políticas públicas separadas das políticas administrativas evitam avaliações
-- duplicadas e não expõem is_admin() a visitantes anônimos.
drop policy if exists capricho_v2_public_settings on public.studio_settings;
create policy capricho_v2_public_settings
  on public.studio_settings for select to anon using (true);

drop policy if exists capricho_v2_public_active_services on public.services;
create policy capricho_v2_public_active_services
  on public.services for select to anon using (active = true);

drop policy if exists capricho_v2_admin_manage_services on public.services;
drop policy if exists capricho_v2_authenticated_active_services on public.services;
drop policy if exists capricho_v2_authenticated_services_select on public.services;
create policy capricho_v2_authenticated_services_select
  on public.services for select to authenticated
  using (active = true or (select public.is_admin()));
drop policy if exists capricho_v2_admin_insert_services on public.services;
create policy capricho_v2_admin_insert_services
  on public.services for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists capricho_v2_admin_update_services on public.services;
create policy capricho_v2_admin_update_services
  on public.services for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists capricho_v2_admin_delete_services on public.services;
create policy capricho_v2_admin_delete_services
  on public.services for delete to authenticated
  using ((select public.is_admin()));

revoke execute on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
