"use server"

import { redirect } from "next/navigation"

import { api } from "@/lib/api"
import { setSessionToken } from "@/lib/session"

interface ActivateResponse {
  token: string
  expiresIn: number
  baker: { publicId: string; name: string; role: "owner" | "staff" }
}

/**
 * Claim a bakery account: set a password against a single-use activation token.
 *
 * The confirm-password check happens here rather than in the backend on purpose — it is a typo
 * guard for one specific form, not a property of the account. The backend validates what actually
 * matters (token validity, single use, password length) and would rightly not care that this
 * particular UI asked twice.
 *
 * On success the backend signs them straight in, so this stores the token and drops them on the
 * dashboard. Making someone who just proved control of the account re-type the password they set
 * two seconds ago is friction with no security value.
 */
export async function activateAction(formData: FormData) {
  const token = String(formData.get("token") || "")
  const password = String(formData.get("password") || "")
  const confirm = String(formData.get("confirmPassword") || "")
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()

  const back = (message: string) =>
    redirect(`/activate?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`)

  if (!token) {
    redirect("/login?error=" + encodeURIComponent("That activation link is missing its code."))
  }
  if (password !== confirm) {
    back("Those passwords don't match.")
  }

  const result = await api.post<ActivateResponse>(
    "/baker/auth/activate",
    { token, password, name: name || undefined, email: email || undefined },
    { authenticated: false }
  )

  if (!result.data) {
    back(result.error ?? "We couldn't set up your account.")
  }

  await setSessionToken(result.data!.token, result.data!.expiresIn)
  redirect("/dashboard?welcome=1")
}
