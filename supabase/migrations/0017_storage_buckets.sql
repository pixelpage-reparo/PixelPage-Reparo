-- company-logos stays public (branding shown on OS documents and the vitrine
-- without auth — confirmed product decision). resale-device-photos and
-- service-order-photos are both private buckets: neither should be
-- reachable by a bare public URL. Path convention for all three buckets is
-- {company_id}/... (resale-device-photos further nests {resale_device_id}/
-- under that) — the policies below key off those folder segments.
--
-- SECURITY: resale-device-photos was previously created with `public: true`,
-- which in Supabase Storage serves every object through a public URL that
-- bypasses the RLS policies on storage.objects entirely — meaning a photo
-- for a device with is_public = false, or belonging to a company with
-- showcase_settings.is_enabled = false, was still downloadable by anyone
-- who had (or guessed) the path. Making the bucket private forces every
-- read through either an authenticated, company-scoped policy or a
-- signed URL — and signed URLs can only be minted by a caller who first
-- passes the "resale_device_photos_read_public" policy below, which checks
-- is_public/is_enabled. The app must call
-- supabase.storage.from('resale-device-photos').createSignedUrl(...) to
-- read these photos now; a bare public URL will 400.
insert into storage.buckets (id, name, public)
values
  ('company-logos', 'company-logos', true),
  ('service-order-photos', 'service-order-photos', false),
  ('resale-device-photos', 'resale-device-photos', false)
on conflict (id) do update set public = excluded.public;

-- company-logos: public read, company-scoped write
create policy "company_logos_read_public" on storage.objects
  for select to public
  using (bucket_id = 'company-logos');

create policy "company_logos_write_own_company" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "company_logos_update_own_company" on storage.objects
  for update to authenticated
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "company_logos_delete_own_company" on storage.objects
  for delete to authenticated
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

-- resale-device-photos: private bucket now. Company staff can read their
-- own company's photos directly (e.g. the showcase admin page); anonymous
-- vitrine visitors (and any other authenticated user) can only read a photo
-- if the specific resale_device it belongs to is_public AND that company's
-- showcase is_enabled — mirrors the "resale_devices_select_public" policy
-- on the underlying table (0014), applied here to the actual files.
create policy "resale_device_photos_read_own_company" on storage.objects
  for select to authenticated
  using (bucket_id = 'resale-device-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "resale_device_photos_read_public" on storage.objects
  for select to public
  using (
    bucket_id = 'resale-device-photos'
    and exists (
      select 1
      from resale_devices rd
      join showcase_settings ss on ss.company_id = rd.company_id
      where rd.company_id::text = (storage.foldername(name))[1]
        and rd.id::text = (storage.foldername(name))[2]
        and rd.is_public = true
        and ss.is_enabled = true
    )
  );

create policy "resale_device_photos_write_own_company" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resale-device-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "resale_device_photos_update_own_company" on storage.objects
  for update to authenticated
  using (bucket_id = 'resale-device-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "resale_device_photos_delete_own_company" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resale-device-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

-- service-order-photos: fully company-scoped, no public policy
create policy "service_order_photos_read_own_company" on storage.objects
  for select to authenticated
  using (bucket_id = 'service-order-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "service_order_photos_write_own_company" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'service-order-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "service_order_photos_update_own_company" on storage.objects
  for update to authenticated
  using (bucket_id = 'service-order-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);

create policy "service_order_photos_delete_own_company" on storage.objects
  for delete to authenticated
  using (bucket_id = 'service-order-photos' and (storage.foldername(name))[1] = fn_current_company_id()::text);
