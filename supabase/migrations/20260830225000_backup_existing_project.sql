-- Snapshot privado antes da evolução Capricho v2.
-- As tabelas ficam fora do schema exposto pela Data API e preservam os dados atuais.

create schema if not exists backup_capricho_20260830;

revoke all on schema backup_capricho_20260830 from public, anon, authenticated;

create table if not exists backup_capricho_20260830.studio_profile
  as table public.studio_profile with data;
create table if not exists backup_capricho_20260830.clients
  as table public.clients with data;
create table if not exists backup_capricho_20260830.services
  as table public.services with data;
create table if not exists backup_capricho_20260830.professionals
  as table public.professionals with data;
create table if not exists backup_capricho_20260830.portfolio
  as table public.portfolio with data;
create table if not exists backup_capricho_20260830.bookings
  as table public.bookings with data;
create table if not exists backup_capricho_20260830.availability_blocks
  as table public.availability_blocks with data;
create table if not exists backup_capricho_20260830.reviews
  as table public.reviews with data;
create table if not exists backup_capricho_20260830.recurring_availability_blocks
  as table public.recurring_availability_blocks with data;
create table if not exists backup_capricho_20260830.expenses
  as table public.expenses with data;
create table if not exists backup_capricho_20260830.notification_deliveries
  as table public.notification_deliveries with data;
create table if not exists backup_capricho_20260830.studio_settings
  as table public.studio_settings with data;
create table if not exists backup_capricho_20260830.service_promotions
  as table public.service_promotions with data;

revoke all on all tables in schema backup_capricho_20260830
  from public, anon, authenticated;
