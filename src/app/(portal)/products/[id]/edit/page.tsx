import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { api } from "@/lib/api"
import { updateProductAction } from "../../actions"
import ProductForm, { ALLERGENS, NO_ALLERGENS, EMPTY_PRODUCT_FORM } from "../../product-form"
import DeleteProductButton from "./delete-button"

export const metadata: Metadata = { title: "Edit product" }

interface ProductResponse {
  product: {
    id: string
    title: string
    description: string | null
    categoryId: string | null
    typeValue: string | null
    imageUrls: string[]
    sizes: { label: string; price: number }[]
    state: string
    prepHours: number | null
    contains: string[]
    whoIsItFor: string[]
    highlights: string[]
    careNote: string | null
  }
}

interface CategoriesResponse {
  categories: { id: string; label: string }[]
}

interface ProductTypesResponse {
  types: { value: string; label: string; emoji: string | null }[]
}

/**
 * Editing an existing listing.
 *
 * Until this page existed a baker could only create. A wrong price, a bad photo or a typo had no fix
 * short of archiving the listing — which is terminal for a baker — and every data mistake therefore
 * became an ops problem, which is the wrong place for it. The person who knows the price is wrong is
 * the baker.
 *
 * Same form as the create screen, populated from the saved product. Deletion lives at the bottom,
 * below the save button and visually separated, because it is the rarest action here and the only
 * irreversible one.
 */
export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const [product, cats, types] = await Promise.all([
    api.get<ProductResponse>(`/baker/products/${id}`),
    api.get<CategoriesResponse>("/baker/categories"),
    api.get<ProductTypesResponse>("/baker/product-types"),
  ])

  // 404 covers both "no such product" and "not yours" — the backend deliberately does not
  // distinguish them, so neither does this.
  if (!product.data) notFound()
  const p = product.data.product

  // The stored `contains` list is flat, but the form splits it into checkboxes plus a free-text
  // field. Anything matching a checkbox goes back to its box; everything else returns to the text
  // field, so a baker's own wording survives a round trip instead of quietly disappearing.
  const known = new Set<string>([...ALLERGENS, NO_ALLERGENS])
  const contains = (p.contains ?? []).filter((c) => known.has(c))
  const containsOther = (p.contains ?? []).filter((c) => !known.has(c)).join(", ")

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/products" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← My products
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Edit {p.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {p.state === "published"
          ? "This is on sale now — changes go live as soon as you save."
          : "Changes are saved to your draft."}
      </p>

      <ProductForm
        action={updateProductAction.bind(null, id)}
        categories={cats.data?.categories ?? []}
        productTypes={types.data?.types ?? []}
        submitLabel="Save changes"
        footerNote={
          p.state === "published"
            ? "If a change leaves this listing incomplete, we'll move it back to draft and tell you why."
            : "Nothing goes live until you publish it."
        }
        error={error}
        values={{
          ...EMPTY_PRODUCT_FORM,
          name: p.title,
          categoryId: p.categoryId ?? "",
          typeValue: p.typeValue ?? "",
          description: p.description ?? "",
          prepHours: p.prepHours != null ? String(p.prepHours) : "",
          contains,
          containsOther,
          whoIsItFor: (p.whoIsItFor ?? []).join(", "),
          highlights: (p.highlights ?? []).join(", "),
          careNote: p.careNote ?? "",
          imageUrls: p.imageUrls ?? [],
          // Prices come back as rupees; the form's inputs are strings.
          sizes: (p.sizes ?? []).map((s) => ({ label: s.label, price: String(s.price ?? "") })),
        }}
      />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-700">Delete this product</h2>
        <p className="mt-1 text-xs text-slate-500">
          Removes it for good. If it has ever been ordered we&apos;ll stop you — use Archive instead,
          which takes it off sale but keeps your order history intact.
        </p>
        <DeleteProductButton productId={id} title={p.title} />
      </div>
    </div>
  )
}
