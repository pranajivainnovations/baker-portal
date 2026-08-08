import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSessionToken } from "@/lib/session"
import { loginAction } from "./actions"

export const metadata: Metadata = { title: "Sign in" }

/**
 * Baker sign-in.
 *
 * Baker ID, not email. Bakeries are onboarded by ops from Google Places data where the email is
 * routinely missing, shared across outlets, or simply wrong — so the credential is an identifier
 * CrossFriend mints and puts on the onboarding paperwork.
 *
 * There is no "create an account" link and no password reset, because neither exists: the network
 * is invite-only, and a baker who is locked out is re-invited by ops. Saying so plainly is kinder
 * than leaving someone hunting for a link that was never there.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expired?: string }>
}) {
  if (await getSessionToken()) {
    redirect("/dashboard")
  }

  const { error, expired } = await searchParams
  const message = expired ? "Your session expired. Please sign in again." : error

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-cf-purple uppercase">
            CrossFriend
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">For Bakers</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your bakery and what you sell.
          </p>
        </div>

        <form
          action={loginAction}
          className="rounded-large border border-cf-warm-dark bg-white p-6 shadow-sm"
        >
          {message && (
            <p
              role="alert"
              className="mb-5 rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {message}
            </p>
          )}

          <label htmlFor="bakerId" className="block text-sm font-semibold text-slate-700">
            Baker ID
          </label>
          <input
            id="bakerId"
            name="bakerId"
            type="text"
            required
            autoFocus
            autoCapitalize="characters"
            autoComplete="username"
            spellCheck={false}
            placeholder="CFB-00001"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 font-mono text-base tracking-wide text-slate-900 uppercase placeholder:text-slate-300 placeholder:normal-case focus:border-cf-purple focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            This was given to you when your bakery joined CrossFriend.
          </p>

          <label
            htmlFor="password"
            className="mt-5 block text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-cf-purple focus:outline-none"
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-rounded bg-cf-orange px-4 py-3 text-base font-semibold text-white transition hover:bg-cf-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-orange"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
          CrossFriend is invite-only for bakeries. Lost your Baker ID or password? Contact the
          CrossFriend team and we&apos;ll send you a new activation link.
        </p>
      </div>
    </main>
  )
}
