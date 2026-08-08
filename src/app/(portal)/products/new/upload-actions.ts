"use server"

import { api } from "@/lib/api"

interface PresignedUpload {
  url: string
  fields: Record<string, string>
  publicUrl: string
  /** The exact S3 key the policy pins. Needed when recording a bakery photo against the profile. */
  key: string
  maxBytes: number
}

export interface SignResult {
  upload: PresignedUpload | null
  error: string | null
}

/**
 * Asks the backend for permission to upload one image.
 *
 * The portal never learns S3 credentials and never picks the destination — it receives a policy
 * that already names the exact key, and posts the file to S3 with it. Everything that decides where
 * a baker's bytes may land is computed from their session on the backend.
 *
 * Called from the browser via a Server Action so the session cookie is read server-side; the
 * signature it returns is safe to hand to the client, because the policy it carries is narrow
 * (one key, one content type, a size range) and expires in five minutes.
 */
export async function signUploadAction(
  contentType: string,
  sizeBytes: number,
  purpose: "product" | "profile" | "banner" = "product"
): Promise<SignResult> {
  const result = await api.post<PresignedUpload>("/baker/uploads", {
    purpose,
    contentType,
    sizeBytes,
  })

  return { upload: result.data, error: result.error }
}
