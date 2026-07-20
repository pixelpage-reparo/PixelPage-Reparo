import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import type { ShowcaseSettingsFormValues } from "@/lib/validators/showcase.schema"

type ResaleDeviceInsert = Database["public"]["Tables"]["resale_devices"]["Insert"]
type ResaleDeviceUpdate = Database["public"]["Tables"]["resale_devices"]["Update"]

export function useResaleDevices() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["resale-devices", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_devices")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCreateResaleDevice() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<ResaleDeviceInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("resale_devices")
        .insert({ ...input, company_id: company.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resale-devices"] }),
  })
}

export function useUpdateResaleDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ResaleDeviceUpdate>) => {
      const { data, error } = await supabase
        .from("resale_devices")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resale-devices"] }),
  })
}

export function useDeleteResaleDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resale_devices").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resale-devices"] }),
  })
}

export function useShowcaseSettings() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["showcase-settings", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_settings")
        .select("*")
        .eq("company_id", company!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useUpsertShowcaseSettings() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: ShowcaseSettingsFormValues) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("showcase_settings")
        .upsert({ ...input, company_id: company.id }, { onConflict: "company_id" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["showcase-settings"] }),
  })
}

/** Public lookup used by the unauthenticated /showcase/:companySlug page. */
export function usePublicShowcase(companySlug: string | undefined) {
  return useQuery({
    queryKey: ["public-showcase", companySlug],
    queryFn: async () => {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, logo_url, primary_color")
        .eq("slug", companySlug!)
        .single()
      if (companyError) throw companyError

      const [{ data: settings }, { data: devices }] = await Promise.all([
        supabase.from("showcase_settings").select("*").eq("company_id", company.id).maybeSingle(),
        supabase
          .from("resale_devices")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_public", true)
          .eq("status", "available")
          .order("created_at", { ascending: false }),
      ])

      return { company, settings, devices: devices ?? [] }
    },
    enabled: !!companySlug,
  })
}

const RESALE_PHOTOS_BUCKET = "resale-device-photos"
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1h — re-signed on next query, not stored/cached beyond that

/**
 * The bucket is private (see 0017_storage_buckets.sql — it used to be
 * `public: true`, which served every photo through a bare public URL with
 * no regard for is_public/is_enabled). Every read now goes through a signed
 * URL, and the storage.objects RLS policy only lets that signing succeed
 * for photos whose resale_devices row is_public and whose company has
 * showcase_settings.is_enabled — so an unpublished device's photos simply
 * fail to sign instead of being fetchable by anyone with the path.
 */
async function signResaleDevicePhotos(
  photos: { storage_path: string }[]
): Promise<string[]> {
  const urls: string[] = []
  for (const photo of photos) {
    const { data, error } = await supabase.storage
      .from(RESALE_PHOTOS_BUCKET)
      .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS)
    if (error || !data) continue
    urls.push(data.signedUrl)
  }
  return urls
}

/** Public vitrine page: relies on the RLS-gated signing above, not on any app-level trust. */
export function usePublicResaleDevicePhotoUrls(resaleDeviceId: string | undefined) {
  return useQuery({
    queryKey: ["public-resale-device-photo-urls", resaleDeviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_device_photos")
        .select("storage_path")
        .eq("resale_device_id", resaleDeviceId!)
        .order("position", { ascending: true })
      if (error) throw error
      return signResaleDevicePhotos(data ?? [])
    },
    enabled: !!resaleDeviceId,
  })
}

/** Showcase admin page: same signed-URL pattern, scoped to the caller's own company via RLS. */
export function useResaleDevicePhotoUrls(resaleDeviceId: string | undefined) {
  return useQuery({
    queryKey: ["resale-device-photo-urls", resaleDeviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_device_photos")
        .select("storage_path")
        .eq("resale_device_id", resaleDeviceId!)
        .order("position", { ascending: true })
      if (error) throw error
      return signResaleDevicePhotos(data ?? [])
    },
    enabled: !!resaleDeviceId,
  })
}
