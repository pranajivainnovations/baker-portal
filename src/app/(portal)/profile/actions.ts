"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { api } from "@/lib/api"

/**
 * Save the bakery's own details.
 *
 * Only sends the fields the baker can actually change. The backend enforces that allowlist too —
 * this is convenience, not the control. Verification badges, public visibility, ranking and the URL
 * slug are ops-only and are neither rendered as inputs nor sent from here.
 */
export async function updateProfileAction(formData: FormData) {
  const str = (k: string) => String(formData.get(k) || "").trim()
  const turnaround = str("avgTurnaroundHours")

  const result = await api.patch("/baker/me/profile", {
    name: str("name"),
    contactPerson: str("contactPerson"),
    phone: str("phone"),
    whatsappNumber: str("whatsappNumber"),
    email: str("email"),
    address: str("address"),
    bio: str("bio"),
    websiteUrl: str("websiteUrl"),
    avgTurnaroundHours: turnaround ? Number(turnaround) : null,
    // Comma-separated is what a baker will type; normalising here keeps the input forgiving.
    specialtyTags: str("specialtyTags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")

  if (result.error) {
    redirect(`/profile?error=${encodeURIComponent(result.error)}`)
  }
  redirect("/profile?saved=1")
}

/**
 * Records a profile or banner photo that the browser has already uploaded to S3.
 *
 * Called from the client after the upload succeeds. The backend re-checks that the S3 key sits
 * inside this baker's own folder before storing it, so a tampered call cannot point their profile
 * at another bakery's image.
 */
export async function saveBakeryImageAction(
  purpose: "profile" | "banner",
  url: string,
  s3Key: string
): Promise<{ error: string | null }> {
  const result = await api.patch("/baker/me/profile", { image: { purpose, url, s3Key } })
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { error: result.error }
}
