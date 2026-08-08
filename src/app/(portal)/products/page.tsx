import type { Metadata } from "next"
import Link from "next/link"

import { api } from "@/lib/api"
import { setProductStateAction } from "./actions"

export const metadata: Metadata = { title: "My products" }

/**
 * The moves a baker can make on one product.
 *
 * Only legal transitions are offered — the backend would refuse the others anyway, and a button
 * that exists only to produce an error is worse than no button. Archive is deliberately absent
 * from the row: it is irreversible for a baker, so it belongs behind a confirmation on the
 * product's own page rather than one tap away from "Pause".
 */
function StateControls({ id, state }: { id: string; state: BakerProduct["state"] }) {
  const actions: { label: string; next: string; primary?: boolean }[] =
    state === "draft"
      ? [{ label: "Publish", next: "published", primary: true }]
      : state === "published"
        ? [{ label: "Pause", next: "unavailable" }]
        : state === "unavailable"
          ? [{ label: "Publish", next: "published", primary: true }]
          : []

  if (actions.length === 0) return null

  return (
    <div className="flex gap-1.5">
      {actions.map((a) => (
        <form key={a.next} action={setProductStateAction}>
          <input type="hidden" name="productId" value={id} />
          <input type="hidden" name="state" value={a.next} />
          <button
            type="submit"
            className={`rounded-rounded px-3 py-1.5 text-xs font-semibold transition ${
              a.primary
                ? "bg-cf-orange text-white hover:bg-cf-orange-dark"
                : "border border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {a.label}
          </button>
        </form>
      ))}
    </div>
  )
}

interface BakerProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  category: string | null
  state: "draft" | "published" | "unavailable" | "archived"
  variantCount: number
  fromPrice: number | null
  updatedAt: string
}

const STATE_LABEL: Record<BakerProduct["state"], { text: string; className: string }> = {
  // Named for what they mean to a baker, not for the column value. "Draft" is a publishing term;
  // "Not listed" is what is actually true from where they are standing.
  draft: { text: "Not listed", className: "bg-slate-100 text-slate-600" },
  published: { text: "Live", className: "bg-emerald-100 text-emerald-700" },
  unavailable: { text: "Paused", className: "bg-amber-100 text-amber-800" },
  archived: { text: "Archived", className: "bg-slate-100 text-slate-400" },
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; state?: string; error?: string }>
}) {
  const { created, state: changedTo, error: stateError } = await searchParams
  const result = await api.get<{ products: BakerProduct[] }>("/baker/products")
  const products = result.data?.products ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">My products</h1>
        {products.length > 0 && (
          <Link
            href="/products/new"
            className="tap-target inline-flex items-center justify-center rounded-rounded bg-cf-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cf-orange-dark"
          >
            Add a product
          </Link>
        )}
      </div>

      {created && (
        <div className="mb-5 rounded-large border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">Saved.</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            It&apos;s a draft for now — publishing comes next, and then customers can order it.
          </p>
        </div>
      )}

      {changedTo === "published" && (
        <div className="mb-5 rounded-large border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">It&apos;s live.</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Customers can find it and order it now.
          </p>
        </div>
      )}
      {changedTo === "unavailable" && (
        <div className="mb-5 rounded-large border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Paused.</p>
          <p className="mt-0.5 text-sm text-amber-800">
            It&apos;s off sale and hidden. Publish again whenever you&apos;re ready.
          </p>
        </div>
      )}

      {(stateError || result.error) && (
        <p role="alert" className="mb-5 rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {stateError || result.error}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-large border border-dashed border-cf-warm-dark bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-800">Nothing listed yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Add what you make — a name, a category and a price is enough to start.
          </p>
          <Link
            href="/products/new"
            className="tap-target mt-5 inline-flex items-center justify-center rounded-rounded bg-cf-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cf-orange-dark"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const state = STATE_LABEL[p.state] ?? STATE_LABEL.draft
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-large border border-cf-warm-dark bg-white p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-rounded bg-cf-purple-50">
                  {p.thumbnail ? (
                    // Bakers paste links from anywhere, so next/image's host allowlist would reject
                    // most of them outright. A plain img keeps the listing working; optimisation
                    // arrives with real uploads.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-cf-purple-200">
                      {p.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.category && <span>{p.category} · </span>}
                    {p.variantCount === 1 ? "1 size" : `${p.variantCount} sizes`}
                    {p.fromPrice != null && (
                      // Built as one string rather than interpolated mid-JSX so the price renders
                      // as a single text node — otherwise "₹" and the number are split apart in
                      // the markup, which breaks text selection and copy-paste.
                      <span className="tabular-nums">
                        {` · from ₹${p.fromPrice.toLocaleString("en-IN")}`}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state.className}`}
                  >
                    {state.text}
                  </span>
                  <StateControls id={p.id} state={p.state} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
