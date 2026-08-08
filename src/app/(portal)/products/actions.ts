"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { api } from "@/lib/api"

interface CreatedProduct {
  product: { productId: string; handle: string; publicationState: string }
}

/**
 * Create a product from the baker's form.
 *
 * Sizes arrive as parallel `size-label` / `size-price` arrays because that is what a plain HTML
 * form of repeated rows produces. They are zipped here and blank rows dropped, so a baker who
 * added a row and changed their mind is not told off for leaving it empty.
 *
 * Validation is NOT duplicated here. The backend already validates and returns messages written for
 * a baker to read; re-implementing those rules in the portal would guarantee the two drift, and the
 * copy would then differ depending on whether JavaScript happened to run.
 */
/**
 * Publish, pause, or retire one product.
 *
 * The backend owns the state machine — which moves are legal, and what each one means in Medusa.
 * This action just relays the request and surfaces whatever the backend says, so the portal cannot
 * develop its own opinion about when something is on sale.
 */
export async function setProductStateAction(formData: FormData) {
  const productId = String(formData.get("productId") || "")
  const state = String(formData.get("state") || "")

  const result = await api.post(`/baker/products/${productId}/state`, { state })

  revalidatePath("/products")
  revalidatePath("/dashboard")

  if (result.error) {
    redirect(`/products?error=${encodeURIComponent(result.error)}`)
  }
  redirect(`/products?state=${encodeURIComponent(state)}`)
}

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim()
  const categoryId = String(formData.get("categoryId") || "")
  const description = String(formData.get("description") || "").trim()
  const imageUrl = String(formData.get("imageUrl") || "").trim()
  const prepHoursRaw = String(formData.get("prepHours") || "").trim()

  const labels = formData.getAll("size-label").map((v) => String(v).trim())
  const prices = formData.getAll("size-price").map((v) => String(v).trim())

  const sizes = labels
    .map((label, i) => ({ label, price: Number(prices[i]) }))
    .filter((s) => s.label !== "" || prices[s ? labels.indexOf(s.label) : 0] !== "")
    .filter((s) => s.label !== "")

  const result = await api.post<CreatedProduct>("/baker/products", {
    name,
    categoryId,
    description: description || undefined,
    imageUrl: imageUrl || undefined,
    prepHours: prepHoursRaw ? Number(prepHoursRaw) : undefined,
    sizes,
  })

  if (!result.data) {
    // Round-trip what the baker typed so a validation error never costs them the form.
    const params = new URLSearchParams({
      error: result.error ?? "Couldn't save this product.",
      name,
      categoryId,
      description,
      imageUrl,
      prepHours: prepHoursRaw,
    })
    labels.forEach((l, i) => {
      params.append("sizeLabel", l)
      params.append("sizePrice", prices[i] ?? "")
    })
    redirect(`/products/new?${params}`)
  }

  revalidatePath("/products")
  revalidatePath("/dashboard")
  redirect("/products?created=1")
}
