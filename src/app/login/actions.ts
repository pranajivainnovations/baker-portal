"use server"

import { redirect } from "next/navigation"

import { api } from "@/lib/api"
import { clearSessionToken, setSessionToken } from "@/lib/session"

interface LoginResponse {
  token: string
  expiresIn: number
  baker: { publicId: string; name: string; role: "owner" | "staff" }
}

/**
 * Sign in with Baker ID + password.
 *
 * The credentials are posted to the backend, which is the only thing that can verify them; this
 * action's entire job is to take the token it hands back and put it in an httpOnly cookie.
 *
 * The error is passed back through the URL rather than returned as state so the login page stays a
 * server component with a plain form — it works before any JavaScript loads, which matters for a
 * baker on a bad connection. Whatever the backend says is shown verbatim: it is already written to
 * be safe (one generic message for both a wrong password and an unknown Baker ID).
 */
export async function loginAction(formData: FormData) {
  const bakerId = String(formData.get("bakerId") || "").trim()
  const password = String(formData.get("password") || "")

  if (!bakerId || !password) {
    redirect("/login?error=" + encodeURIComponent("Enter your Baker ID and password."))
  }

  const result = await api.post<LoginResponse>(
    "/baker/auth/login",
    { bakerId, password },
    { authenticated: false }
  )

  if (!result.data) {
    redirect("/login?error=" + encodeURIComponent(result.error ?? "Sign in failed."))
  }

  await setSessionToken(result.data.token, result.data.expiresIn)
  redirect("/dashboard")
}

export async function logoutAction() {
  await clearSessionToken()
  redirect("/login")
}
