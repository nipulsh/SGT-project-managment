import { createClient } from "@/lib/supabase/server";

/** Object path within bucket (e.g. `{projectId}/{file}`) */
export async function getSignedFileUrl(
  bucket: "bills" | "qr-codes" | "receipts" | "project-files",
  path: string | null | undefined,
  expiresSec = 3600,
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
