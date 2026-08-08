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

        <PhotoField initialUrl={one("imageUrl") || undefined} />

        <div>
          <label htmlFor="prepHours" className="block text-sm font-semibold text-slate-700">
            How long do you need? <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="prepHours"
              name="prepHours"
              type="number"
              min="0"
              max="720"
              step="1"
              inputMode="numeric"
              defaultValue={one("prepHours")}
              placeholder="24"
              className="w-28 rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
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
