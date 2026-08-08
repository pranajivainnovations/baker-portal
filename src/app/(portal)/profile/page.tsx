import type { Metadata } from "next"

import { requireBaker } from "@/lib/api"

export const metadata: Metadata = { title: "Bakery profile" }

/**
 * The bakery's public profile, as the baker sees it.
 *
 * Read-only in this phase — editing needs a write endpoint that carefully separates what a baker
 * may change (bio, photo) from what only ops may change (verification, visibility, Baker ID).
 * Showing the current state now is still worth it: a baker whose page is not yet visible should be
 * able to see exactly which parts are missing.
 */
export default async function ProfilePage() {
  const me = await requireBaker()
  const { baker } = me
  const location = [baker.city, baker.state].filter(Boolean).join(", ")

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold text-slate-900">Bakery profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        This is what customers see on your CrossFriend page.
      </p>

      <dl className="mt-6 divide-y divide-cf-warm-dark rounded-large border border-cf-warm-dark bg-white">
        <Field label="Bakery name" value={baker.name} />
        <Field label="Baker ID" value={baker.publicId} mono note="This never changes." />
        <Field label="Location" value={location} />
        <Field label="Pincode" value={baker.pincode} />
        <Field label="About" value={baker.bio} missing="Not written yet" />
        <Field
          label="Page address"
          value={baker.slug ? `crossfriend.in/bakers/${baker.slug}` : null}
          mono
        />
        <Field
          label="Visible to customers"
          value={baker.isPublic ? "Yes" : "Not yet — CrossFriend switches this on"}
        />
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Need something here changed? Contact the CrossFriend team — editing from the portal is
        coming soon.
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  note,
  missing = "—",
}: {
  label: string
  value: string | null
  mono?: boolean
  note?: string
  missing?: string
}) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${
          value ? "text-slate-800" : "text-slate-400 italic"
        }`}
      >
        {value || missing}
      </dd>
      {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
    </div>
  )
}
