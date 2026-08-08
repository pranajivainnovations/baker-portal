import type { Metadata } from "next"
import Link from "next/link"

import { api } from "@/lib/api"
import { activateAction } from "./actions"

export const metadata: Metadata = { title: "Set up your account" }

interface ActivationPreview {
  baker: { bakerPublicId: string; bakerName: string; city: string | null }
}

/**
 * Where an invited bakery claims its account.
 *
 * The token is validated and the bakery's name shown BEFORE asking for a password. That ordering is
 * the point: a page that demands a secret while telling you nothing is indistinguishable from a
 * phishing page, and we should not train bakers to accept that. Seeing "Sweet Moments Bakery ·
 * CFB-00042" is how they know the link is genuinely theirs.
 *
 * An invalid, expired, used or revoked token all produce the same message. There is nothing useful
 * to distinguish for the person holding a bad link, and being vague costs an attacker information.
 */
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  if (!token) {
    return <Invalid />
  }

  // Explicitly unauthenticated — the person opening this link has no account yet. The token IS the
  // credential here, which is why it is single-use, expiring, and stored only as a hash.
  const preview = await api.get<ActivationPreview>(
    `/baker/auth/activate?token=${encodeURIComponent(token)}`,
    { authenticated: false }
  )

  if (!preview.data) {
    return <Invalid />
  }

  const { bakerName, bakerPublicId, city } = preview.data.baker

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-cf-purple uppercase">
            CrossFriend
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Set up your account</h1>
        </div>

        <div className="mb-5 rounded-large border border-cf-purple-200 bg-cf-purple-50 px-4 py-3 text-center">
          <p className="text-base font-semibold text-slate-900">{bakerName}</p>
          <p className="mt-0.5 font-mono text-sm text-cf-purple-700">{bakerPublicId}</p>
          {city && <p className="mt-0.5 text-sm text-slate-500">{city}</p>}
        </div>

        <form
          action={activateAction}
          className="rounded-large border border-cf-warm-dark bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="token" value={token} />

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <p className="mb-5 text-sm leading-relaxed text-slate-500">
            Choose a password. You&apos;ll sign in from now on with{" "}
            <span className="font-mono font-semibold text-slate-700">{bakerPublicId}</span> and this
            password — keep the ID somewhere safe.
          </p>

          <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
            Your name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Who's setting this up?"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
          />

          <label htmlFor="email" className="mt-4 block text-sm font-semibold text-slate-700">
            Email <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="So we can reach you"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
          />

          <label htmlFor="password" className="mt-4 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            At least 10 characters. A short phrase you&apos;ll remember beats a short jumble you
            won&apos;t.
          </p>

          <label
            htmlFor="confirmPassword"
            className="mt-4 block text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-rounded bg-cf-orange px-4 py-3 text-base font-semibold text-white transition hover:bg-cf-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-orange"
          >
            Create my account
          </button>
        </form>
      </div>
    </main>
  )
}

function Invalid() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-slate-900">This link doesn&apos;t work</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Activation links can only be used once, and they expire after two weeks. Ask the
          CrossFriend team to send you a fresh one.
        </p>
        <Link
          href="/login"
          className="tap-target mt-6 inline-flex items-center justify-center rounded-rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cf-purple hover:text-cf-purple"
        >
          Go to sign in
        </Link>
      </div>
    </main>
  )
}
