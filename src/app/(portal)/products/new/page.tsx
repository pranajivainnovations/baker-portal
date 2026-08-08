import type { Metadata } from "next"
import Link from "next/link"

import { api } from "@/lib/api"
import { createProductAction } from "../actions"
import PhotoField from "./photo-field"
import SizeRows from "./size-rows"

export const metadata: Metadata = { title: "Add a product" }

interface CategoriesResponse {
  categories: { id: string; label: string }[]
}

/**
 * Lead-time bands, in the words a baker would use.
 *
 * The value is the UPPER bound of each band in hours, which is what gets stored — a band promises
 * "ready within this", so quoting the ceiling is the honest reading and never over-promises.
 * "Immediate" is 0, and the empty string means the baker did not say.
 */
const PREP_TIME_OPTIONS = [
  { label: "Not specified", value: "" },
  { label: "Immediate — ready now", value: "0" },
  { label: "Within 4 hours", value: "4" },
  { label: "4 – 8 hours", value: "8" },
  { label: "8 – 12 hours", value: "12" },
  { label: "Same day (within 24 hours)", value: "24" },
  { label: "1 – 2 days", value: "48" },
  { label: "2 – 3 days", value: "72" },
  { label: "3 – 5 days", value: "120" },
  { label: "Up to a week", value: "168" },
  { label: "More than a week", value: "336" },
] as const

/**
 * The baker's product form.
 *
 * Four things are required — name, category, one size with a price, and nothing else. Everything a
 * Medusa product actually needs (handle, variants, options, region, currency, status, sales
 * channel, profile) is derived server-side. A baker should never meet the word "variant".
 *
 * Categories come from the backend rather than a local constant, so the form can only ever offer
 * what the API will accept.
 *
 * On a validation error the action redirects back with everything the baker typed in the query
 * string and it is re-rendered here — losing a half-filled form to a typo'd price is the fastest
 * way to make someone give up on listing anything.
 */
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string)) ?? ""
  const many = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[]) : sp[k] ? [sp[k] as string] : [])

  const cats = await api.get<CategoriesResponse>("/baker/categories")
  const categories = cats.data?.categories ?? []

  const labels = many("sizeLabel")
  const prices = many("sizePrice")
  const initialSizes = labels.map((label, i) => ({ label, price: prices[i] ?? "" }))

  const error = one("error")

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/products" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← My products
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Add a product</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tell customers what you make. You can publish it once you&apos;re happy.
      </p>

      <form action={createProductAction} className="mt-6 space-y-5">
        {error && (
          <p
            role="alert"
            className="rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
            What is it?
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={one("name")}
            placeholder="Chocolate Truffle Cake"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-semibold text-slate-700">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={one("categoryId")}
            className="mt-1.5 w-full rounded-rounded border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
          >
            <option value="" disabled>
              Choose one
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Sizes and prices</legend>
          <p className="mt-0.5 text-xs text-slate-400">
            Add every size you sell this in. Customers pick one when they order.
          </p>
          <SizeRows initial={initialSizes.length ? initialSizes : undefined} />
        </fieldset>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={one("description")}
            placeholder="Rich chocolate sponge layered with ganache."
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
          />
        </div>

        <PhotoField initialUrls={many("imageUrl")} />

        <div>
          <label htmlFor="prepHours" className="block text-sm font-semibold text-slate-700">
            How long do you need to deliver it or prepare it?{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          {/* A free-number field asked bakers to convert "about half a day" into hours, which is
              work they should not have to do and which produced values nobody could compare. These
              bands are how a baker actually thinks about lead time, and they map to the same
              prep_hours the backend already validates. */}
          <select
            id="prepHours"
            name="prepHours"
            defaultValue={one("prepHours")}
            className="mt-1.5 w-full rounded-rounded border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
          >
            {PREP_TIME_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-400">
            Customers see this on the product, so they know when to expect it.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <button
            type="submit"
            className="rounded-rounded bg-cf-orange px-5 py-3 text-base font-semibold text-white transition hover:bg-cf-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-orange sm:flex-1"
          >
            Save product
          </button>
          <Link
            href="/products"
            className="tap-target inline-flex items-center justify-center rounded-rounded border border-slate-300 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Cancel
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          Saving keeps this as a draft. Nothing goes live until you publish it.
        </p>
      </form>
    </div>
  )
}
