"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { api } from "@/lib/api"

/**
 * Move one order along.
 *
 * The backend owns which moves are legal and what each one means. This relays the request and
 * surfaces whatever it says, so the portal cannot develop its own opinion about the workflow — the
 * buttons it renders are a convenience, not the rule.
 */
export async function setOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "")
  const status = String(formData.get("status") || "")
  const reason = String(formData.get("reason") || "").trim()

  const result = await api.post(`/baker/orders/${orderId}/status`, {
    status,
    reason: reason || undefined,
  })

  revalidatePath("/orders")
  revalidatePath("/dashboard")

  if (result.error) {
    redirect(`/orders?error=${encodeURIComponent(result.error)}`)
  }
  redirect(`/orders?moved=${encodeURIComponent(status)}`)
}
