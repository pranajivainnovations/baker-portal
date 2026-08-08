import type { Metadata } from "next"

import { requireBaker } from "@/lib/api"
import { updateProfileAction } from "./actions"
import BakeryPhoto from "./bakery-photo"

export const metadata: Metadata = { title: "Bakery profile" }

const input =
  "mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
const labelCls = "block text-sm font-semibold text-slate-700"

/**
 * The bakery's own profile, editable by the baker.
 *
 * This exists because ops cannot be the write path for every bakery's phone number as the network
 * grows — that queue only gets longer, and the person who knows the answer is the baker.
 *
 * What is editable and what is not is decided by the backend allowlist, and the split is
 * deliberate: a baker maintains the facts about their business, while anything that affects how
 * CrossFriend ranks or vouches for them stays with ops. Those read-only signals are still SHOWN, so
 * the page explains their standing rather than hiding it — a baker who cannot see they are
 * unlisted has no idea why they have no orders.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { saved, error } = await searchParams
  const me = await requireBaker()
  const b = me.baker

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold text-slate-900">Bakery profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        This is what customers see on your CrossFriend page.
      </p>

      {saved && (
        <p className="mt-4 rounded-rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Saved.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Photos save on upload, so they sit outside the form — a baker who changes a photo and
          navigates away should not silently lose it. */}
      <section className="mt-6 space-y-5 rounded-large border border-cf-warm-dark bg-white p-5">
        <BakeryPhoto
          purpose="profile"
          currentUrl={b.profilePhotoUrl}
          label="Bakery photo"
          hint="Shown next to your name. A clear shot of your shopfront or logo works well."
          aspect="square"
        />
        <BakeryPhoto
          purpose="banner"
          currentUrl={b.bannerUrl}
          label="Banner"
          hint="The wide image across the top of your page."
          aspect="wide"
        />
      </section>

      <form action={updateProfileAction} className="mt-6 space-y-5">
        <section className="space-y-4 rounded-large border border-cf-warm-dark bg-white p-5">
          <div>
            <label htmlFor="name" className={labelCls}>
              Bakery name
            </label>
            <input id="name" name="name" required maxLength={120} defaultValue={b.name} className={input} />
          </div>

          <div>
            <label htmlFor="bio" className={labelCls}>
              About your bakery
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={2000}
              defaultValue={b.bio ?? ""}
              placeholder="What you make, how long you've been baking, what you're known for."
              className={input}
            />
          </div>

          <div>
            <label htmlFor="specialtyTags" className={labelCls}>
              Specialities <span className="font-normal text-slate-400">(comma separated)</span>
            </label>
            <input
              id="specialtyTags"
              name="specialtyTags"
              defaultValue={(b.specialtyTags ?? []).join(", ")}
              placeholder="eggless, fondant, custom themes"
              className={input}
            />
          </div>

          <div>
            <label htmlFor="avgTurnaroundHours" className={labelCls}>
              How long you usually need <span className="font-normal text-slate-400">(hours)</span>
            </label>
            <input
              id="avgTurnaroundHours"
              name="avgTurnaroundHours"
              type="number"
              min="0"
              max="720"
              inputMode="numeric"
              defaultValue={b.avgTurnaroundHours ?? ""}
              placeholder="48"
              className={`${input} w-32`}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Shown on your page as &ldquo;usually ready in…&rdquo;. Individual products can differ.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-large border border-cf-warm-dark bg-white p-5">
          <p className="text-sm font-bold text-slate-900">How we reach you</p>
          <p className="-mt-2 text-xs text-slate-400">
            Used by the CrossFriend team, not shown publicly.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactPerson" className={labelCls}>
                Contact name
              </label>
              <input id="contactPerson" name="contactPerson" defaultValue={b.contactPerson ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>
                Phone
              </label>
              <input id="phone" name="phone" type="tel" defaultValue={b.phone ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="whatsappNumber" className={labelCls}>
                WhatsApp
              </label>
              <input id="whatsappNumber" name="whatsappNumber" type="tel" defaultValue={b.whatsappNumber ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input id="email" name="email" type="email" defaultValue={b.email ?? ""} className={input} />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelCls}>
              Address
            </label>
            <textarea id="address" name="address" rows={2} defaultValue={b.address ?? ""} className={input} />
          </div>

          <div>
            <label htmlFor="websiteUrl" className={labelCls}>
              Website <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={b.websiteUrl ?? ""}
              placeholder="https://…"
              className={input}
            />
          </div>
        </section>

        <button
          type="submit"
          className="w-full rounded-rounded bg-cf-orange px-5 py-3 text-base font-semibold text-white transition hover:bg-cf-orange-dark sm:w-auto sm:px-8"
        >
          Save changes
        </button>
      </form>

      {/* Read-only: things only CrossFriend can change. Shown, not hidden — a baker who cannot see
          they are unlisted has no way to understand why nothing is selling. */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Set by CrossFriend
        </h2>
        <dl className="divide-y divide-cf-warm-dark rounded-large border border-cf-warm-dark bg-white">
          <Row label="Baker ID" value={b.publicId} note="Your login. This never changes." mono />
          <Row
            label="Page address"
            value={b.slug ? `crossfriend.in/bakers/${b.slug}` : "Not set"}
            mono
          />
          <Row
            label="Visible to customers"
            value={b.isPublic ? "Yes" : "Not yet"}
            note={b.isPublic ? undefined : "CrossFriend switches this on once your profile is complete."}
          />
          <Row label="Verified bakery" value={b.trustBadge ? "Granted" : "Not yet"} />
          <Row
            label="Blue tick"
            value={b.blueTick ? "Granted" : "Not yet"}
            note="Awarded on quality criteria, separate from being verified."
          />
        </dl>
        <p className="mt-2 text-xs text-slate-400">
          Need any of these changed? Contact the CrossFriend team.
        </p>
      </section>
    </div>
  )
}

function Row({
  label,
  value,
  note,
  mono,
}: {
  label: string
  value: string
  note?: string
  mono?: boolean
}) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</dd>
      {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
    </div>
  )
}
