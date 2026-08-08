import type { Metadata } from "next"
import Link from "next/link"

import { requireBaker } from "@/lib/api"

export const metadata: Metadata = { title: "Dashboard" }

/**
 * The baker's home.
 *
 * Leads with what to do next rather than with statistics. A bakery with nothing listed does not
 * need a chart of its zero sales — it needs the one action that changes that. Counts are shown
 * because they are genuinely useful, but they are not the point of the page.
 *
 * `requireBaker` is called again here; React's request-level cache means the layout's call and this
 * one are a single round trip.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const { welcome } = await searchParams
  const me = await requireBaker()
  const { baker, products } = me

  const nothingListed = products.total === 0
  const notPublic = !baker.isPublic

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {welcome && (
        <div className="mb-6 rounded-large border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            Welcome to CrossFriend, {baker.name}.
          </p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Your account is ready. Add your first product to start selling.
          </p>
        </div>
      )}

      <h1 className="text-xl font-bold text-slate-900">
        {nothingListed ? "Let's get you selling" : "Your bakery"}
      </h1>

      {/* Primary next action */}
      {nothingListed ? (
        <div className="mt-4 rounded-large border border-cf-warm-dark bg-white p-6">
          <p className="text-base font-semibold text-slate-900">Add your first product</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Tell us what you make, what it costs, and add a photo. Customers near you will be able
            to order it straight away.
          </p>
          <Link
            href="/products/new"
            className="tap-target mt-4 inline-flex items-center justify-center rounded-rounded bg-cf-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cf-orange-dark"
          >
            Add a product
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Live" value={products.published} tone="good" />
          <Stat label="Drafts" value={products.draft} />
          <Stat label="Total" value={products.total} />
        </div>
      )}

      {/* Profile visibility — the thing most likely to be quietly wrong */}
      {notPublic && (
        <div className="mt-6 rounded-large border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            Your bakery page isn&apos;t visible yet
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            CrossFriend switches this on once your profile is complete. Add a description and a
            photo to move things along.
          </p>
          <Link
            href="/profile"
            className="mt-2 inline-block text-sm font-semibold text-amber-900 underline"
          >
            Finish your profile
          </Link>
        </div>
      )}

      {/* Standing — read-only facts, not something to act on here */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Your standing
        </h2>
        <div className="divide-y divide-cf-warm-dark rounded-large border border-cf-warm-dark bg-white">
          <Row
            label="Verified bakery"
            granted={baker.trustBadge}
            note="CrossFriend has confirmed your bakery is real and operating."
          />
          <Row
            label="Blue tick"
            granted={baker.blueTick}
            note="Awarded once you meet CrossFriend's quality criteria. Separate from being verified."
          />
          {baker.rating != null && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Rating</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  From your Google reviews, shown on your public page.
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-800 tabular-nums">
                ★ {baker.rating.toFixed(1)}
                {baker.reviewCount > 0 && (
                  <span className="ml-1 font-normal text-slate-400">({baker.reviewCount})</span>
                )}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "good"
}) {
  return (
    <div className="rounded-large border border-cf-warm-dark bg-white px-4 py-3">
      <p
        className={`text-2xl font-bold tabular-nums ${
          tone === "good" && value > 0 ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}

function Row({
  label,
  granted,
  note,
}: {
  label: string
  granted: boolean
  note: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{note}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          granted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {granted ? "Granted" : "Not yet"}
      </span>
    </div>
  )
}
