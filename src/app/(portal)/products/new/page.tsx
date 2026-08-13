import type { Metadata } from "next"
import Link from "next/link"

import { api } from "@/lib/api"
import { createProductAction } from "../actions"
import ProductForm, { EMPTY_PRODUCT_FORM } from "../product-form"

export const metadata: Metadata = { title: "Add a product" }

interface CategoriesResponse {
  categories: { id: string; label: string }[]
}

interface ProductTypesResponse {
  types: { value: string; label: string; emoji: string | null }[]
}

/**
 * The baker's new-product screen.
 *
 * Four things are required — name, category, type, and one size with a price. Everything a Medusa
 * product actually needs (handle, variants, options, region, currency, status, sales channel,
 * profile) is derived server-side. A baker should never meet the word "variant".
 *
 * Categories come from the backend rather than a local constant, so the form can only ever offer
 * what the API will accept.
 *
 * On a validation error the action redirects back with everything the baker typed in the query
 * string, and it is re-rendered here — losing a half-filled form to a typo'd price is the fastest
 * way to make someone give up on listing anything.
 */
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string)) ?? ""
  const many = (k: string) =>
    Array.isArray(sp[k]) ? (sp[k] as string[]) : sp[k] ? [sp[k] as string] : []

  // Both drive required selects, and neither depends on the other, so there is no reason for the
  // round trips to a database on another cloud to happen one after the other.
  const [cats, types] = await Promise.all([
    api.get<CategoriesResponse>("/baker/categories"),
    api.get<ProductTypesResponse>("/baker/product-types"),
  ])

  const labels = many("sizeLabel")
  const prices = many("sizePrice")

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/products" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← My products
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Add a product</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tell customers what you make. You can publish it once you&apos;re happy.
      </p>

      <ProductForm
        action={createProductAction}
        categories={cats.data?.categories ?? []}
        productTypes={types.data?.types ?? []}
        submitLabel="Save product"
        footerNote="Saving keeps this as a draft. Nothing goes live until you publish it."
        error={one("error")}
        values={{
          ...EMPTY_PRODUCT_FORM,
          name: one("name"),
          categoryId: one("categoryId"),
          typeValue: one("typeValue"),
          description: one("description"),
          prepHours: one("prepHours"),
          contains: many("contains"),
          containsOther: one("containsOther"),
          whoIsItFor: one("whoIsItFor"),
          highlights: one("highlights"),
          careNote: one("careNote"),
          imageUrls: many("imageUrl"),
          sizes: labels.map((label, i) => ({ label, price: prices[i] ?? "" })),
        }}
      />
    </div>
  )
}
