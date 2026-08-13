import Link from "next/link"

import PhotoField from "./new/photo-field"
import SizeRows from "./new/size-rows"

/**
 * The one product form, used to create and to edit.
 *
 * Extracted rather than copied: these two screens must collect exactly the same fields in exactly
 * the same words, and two copies of a 250-line form drift within a release — someone adds an
 * allergen to one list, or fixes a placeholder on one screen. Whichever copy is edited less often
 * becomes the one that quietly asks for the wrong thing.
 *
 * Purely value-driven. Every field takes its default from `values`, which is populated from the
 * query string after a validation bounce on create, and from the saved product on edit. Neither page
 * knows anything about the other's source.
 */

/**
 * Common allergens, offered as checkboxes.
 *
 * A free-text ingredients box produces "chocolate, cream, love" — fine prose, useless for a customer
 * scanning for nuts. This is a food marketplace in India, where allergen disclosure is an FSSAI
 * obligation, so the common ones are pickable and the free-text field is for everything else.
 */
export const ALLERGENS = [
  "Milk / dairy",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Wheat / gluten",
  "Soy",
  "Sesame",
] as const

/** Ticked when a product genuinely has none — see the note by the checkbox. */
export const NO_ALLERGENS = "No common allergens"

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

export interface ProductFormValues {
  name: string
  categoryId: string
  typeValue: string
  description: string
  prepHours: string
  /** Only the values that match a checkbox above; anything else belongs in containsOther. */
  contains: string[]
  containsOther: string
  whoIsItFor: string
  highlights: string
  careNote: string
  imageUrls: string[]
  sizes: { label: string; price: string }[]
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  categoryId: "",
  typeValue: "",
  description: "",
  prepHours: "",
  contains: [],
  containsOther: "",
  whoIsItFor: "",
  highlights: "",
  careNote: "",
  imageUrls: [],
  sizes: [],
}

const INPUT =
  "mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
const SELECT =
  "mt-1.5 w-full rounded-rounded border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
const SMALL_INPUT =
  "mt-1 w-full rounded-rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"

export default function ProductForm({
  action,
  values,
  categories,
  productTypes,
  submitLabel,
  footerNote,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>
  values: ProductFormValues
  categories: { id: string; label: string }[]
  productTypes: { value: string; label: string; emoji: string | null }[]
  submitLabel: string
  footerNote: string
  error?: string
}) {
  return (
    <form action={action} className="mt-6 space-y-5">
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
          defaultValue={values.name}
          placeholder="Chocolate Truffle Cake"
          className={INPUT}
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
          defaultValue={values.categoryId}
          className={SELECT}
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

      <div>
        <label htmlFor="typeValue" className="block text-sm font-semibold text-slate-700">
          What kind of product is this?
        </label>
        {/* Separate from Category on purpose, and the two are not interchangeable: Category is the
            marketplace shelf a customer browses, while this decides which occasion pages the product
            appears on (Birthday, Diwali…) and what /store?type= finds. Every product created before
            this field existed has no type and is invisible to both. */}
        <select
          id="typeValue"
          name="typeValue"
          required
          defaultValue={values.typeValue}
          className={SELECT}
        >
          <option value="" disabled>
            Choose one
          </option>
          {productTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji ? `${t.emoji} ` : ""}
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-400">
          This decides where your product shows up — birthday pages, festival pages, and so on.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">Sizes and prices</legend>
        <p className="mt-0.5 text-xs text-slate-400">
          Add every size you sell this in. Customers pick one when they order.
        </p>
        <SizeRows initial={values.sizes.length ? values.sizes : undefined} />
      </fieldset>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values.description}
          placeholder="Rich chocolate sponge layered with ganache."
          className={INPUT}
        />
      </div>

      <PhotoField initialUrls={values.imageUrls} />

      <div>
        <label htmlFor="prepHours" className="block text-sm font-semibold text-slate-700">
          How long do you need to deliver it or prepare it?{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        {/* A free-number field asked bakers to convert "about half a day" into hours, which is work
            they should not have to do and which produced values nobody could compare. These bands
            are how a baker actually thinks about lead time, and they map to the same prep_hours the
            backend already validates. */}
        <select id="prepHours" name="prepHours" defaultValue={values.prepHours} className={SELECT}>
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

      {/* Required to PUBLISH, not to save — a baker can save a draft and come back. The backend
          enforces the same rule, so this is the explanation, not the control. */}
      <fieldset className="rounded-large border border-amber-200 bg-amber-50/60 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">What&apos;s in it?</legend>
        <p className="mt-0.5 text-xs text-slate-600">
          Needed before you can publish. Customers with allergies rely on this.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="contains"
                value={a}
                defaultChecked={values.contains.includes(a)}
                className="h-4 w-4 rounded border-slate-300 text-cf-purple focus:ring-cf-purple"
              />
              {a}
            </label>
          ))}
        </div>

        <label htmlFor="containsOther" className="mt-3 block text-xs font-semibold text-slate-700">
          Anything else <span className="font-normal text-slate-500">(comma separated)</span>
        </label>
        <input
          id="containsOther"
          name="containsOther"
          defaultValue={values.containsOther}
          placeholder="dark chocolate, fresh cream, vanilla"
          className={SMALL_INPUT}
        />
        <label className="mt-3 flex items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            name="contains"
            value={NO_ALLERGENS}
            defaultChecked={values.contains.includes(NO_ALLERGENS)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cf-purple focus:ring-cf-purple"
          />
          {/* Without this, "no allergens" and "hasn't filled it in yet" look identical to the
              publish gate, and a baker with a genuinely allergen-free product would be stuck. */}
          None of the above — this contains no common allergens
        </label>
      </fieldset>

      <details className="rounded-large border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Help it sell <span className="font-normal text-slate-400">(optional)</span>
        </summary>
        <p className="mt-1 text-xs text-slate-400">Listings with these details get more orders.</p>

        <label htmlFor="whoIsItFor" className="mt-3 block text-xs font-semibold text-slate-700">
          Who is it for? <span className="font-normal text-slate-400">(comma separated)</span>
        </label>
        <input
          id="whoIsItFor"
          name="whoIsItFor"
          defaultValue={values.whoIsItFor}
          placeholder="birthdays, office parties, kids"
          className={SMALL_INPUT}
        />

        <label htmlFor="highlights" className="mt-3 block text-xs font-semibold text-slate-700">
          What makes it special?{" "}
          <span className="font-normal text-slate-400">(comma separated)</span>
        </label>
        <input
          id="highlights"
          name="highlights"
          defaultValue={values.highlights}
          placeholder="eggless option, real Belgian chocolate, made fresh daily"
          className={SMALL_INPUT}
        />

        <label htmlFor="careNote" className="mt-3 block text-xs font-semibold text-slate-700">
          How should they keep it?
        </label>
        <input
          id="careNote"
          name="careNote"
          maxLength={500}
          defaultValue={values.careNote}
          placeholder="Refrigerate and eat within 2 days."
          className={SMALL_INPUT}
        />
      </details>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        <button
          type="submit"
          className="rounded-rounded bg-cf-orange px-5 py-3 text-base font-semibold text-white transition hover:bg-cf-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-orange sm:flex-1"
        >
          {submitLabel}
        </button>
        <Link
          href="/products"
          className="tap-target inline-flex items-center justify-center rounded-rounded border border-slate-300 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Cancel
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400">{footerNote}</p>
    </form>
  )
}
