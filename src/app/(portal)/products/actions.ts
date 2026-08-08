"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { api } from "@/lib/api"

interface CreatedProduct {
  product: { productId: string; handle: string; publicationState: string }
}

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

/**
 * Create a product from the baker's form.
 *
 * Sizes arrive as parallel `size-label` / `size-price` arrays, and photos as repeated `imageUrl`
 * inputs, because that is what a plain HTML form of repeated rows produces. Blank rows are dropped
 * so a baker who added one and changed their mind is not told off for leaving it empty.
 *
 * Validation is NOT duplicated here. The backend already validates and returns messages written for
 * a baker to read; re-implementing those rules in the portal would guarantee the two drift, and the
 * copy would then differ depending on whether JavaScript happened to run.
 */
export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim()
  const categoryId = String(formData.get("categoryId") || "")
  const description = String(formData.get("description") || "").trim()
  const prepHoursRaw = String(formData.get("prepHours") || "").trim()

  // One hidden input per uploaded photo, in the order shown in the picker — so the first is the
  // one the baker chose as the main image.
  const imageUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean)

  const labels = formData.getAll("size-label").map((v) => String(v).trim())
  const prices = formData.getAll("size-price").map((v) => String(v).trim())

  const sizes = labels
    .map((label, i) => ({ label, price: Number(prices[i]) }))
    .filter((s) => s.label !== "")

  const result = await api.post<CreatedProduct>("/baker/products", {
    name,
    categoryId,
    description: description || undefined,
    imageUrls: imageUrls.length ? imageUrls : undefined,
    prepHours: prepHoursRaw ? Number(prepHoursRaw) : undefined,
    sizes,
  })

  if (!result.data) {
    // Round-trip what the baker entered so a validation error never costs them the form — including
    // every uploaded photo, which would otherwise have to be taken and uploaded again.
    const params = new URLSearchParams({
      error: result.error ?? "Couldn't save this product.",
      name,
      categoryId,
      description,
      prepHours: prepHoursRaw,
    })
    imageUrls.forEach((u) => params.append("imageUrl", u))
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
