import { redirect } from "next/navigation"
import { getSessionToken } from "./session"

/**
 * The single door between this app and the CrossFriend backend.
 *
 * Everything the portal knows comes through here, which is what makes "the backend decides
 * authorization" enforceable rather than aspirational: there is one place that attaches the
 * session, and it attaches it to every call.
 *
 * A 401 always means the same thing — the session is gone, expired, or the baker was deactivated
 * in OPS — so it is handled centrally: clear the cookie and send them to sign in. Leaving that to
 * each caller guarantees one of them eventually forgets and renders a broken page instead.
 */

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export interface ApiResult<T> {
  data: T | null
  error: string | null
  status: number
}

async function request<T>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {}
): Promise<ApiResult<T>> {
  const { authenticated = true, ...rest } = init

  const headers = new Headers(rest.headers)
  headers.set("Content-Type", "application/json")

  if (authenticated) {
    const token = await getSessionToken()
    if (!token) {
      return { data: null, error: "Not signed in.", status: 401 }
    }
    headers.set("Authorization", `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      headers,
      // Baker data is per-session and changes as they work — never serve it from a cache.
      cache: "no-store",
    })
  } catch (error) {
    console.error(`[portal] ${path} unreachable`, error)
    return {
      data: null,
      error: "Can't reach CrossFriend right now. Please try again in a moment.",
      status: 0,
    }
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Some responses legitimately have no body; only an error path cares.
  }

  if (!res.ok) {
    const error =
      (body as { error?: string } | null)?.error ?? "Something went wrong. Please try again."
    return { data: null, error, status: res.status }
  }

  return { data: body as T, error: null, status: res.status }
}

export const api = {
  // `authenticated` is opt-OUT rather than opt-in: the overwhelming majority of calls are made on
  // behalf of a signed-in baker, and a route that quietly forgot to attach the session would fail
  // closed (401) rather than leak. The handful of pre-login calls — activation preview, sign-in —
  // must pass it explicitly.
  get: <T>(path: string, opts?: { authenticated?: boolean }) =>
    request<T>(path, { method: "GET", authenticated: opts?.authenticated }),
  post: <T>(path: string, body?: unknown, opts?: { authenticated?: boolean }) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      authenticated: opts?.authenticated,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

export interface BakerMe {
  user: { id: string; role: "owner" | "staff" }
  baker: {
    publicId: string
    name: string
    slug: string | null
    city: string | null
    state: string | null
    pincode: string | null
    bio: string | null
    profilePhotoUrl: string | null
    bannerUrl: string | null
    contactPerson: string | null
    phone: string | null
    whatsappNumber: string | null
    email: string | null
    address: string | null
    websiteUrl: string | null
    avgTurnaroundHours: number | null
    specialtyTags: string[]
    isPublic: boolean
    blueTick: boolean
    trustBadge: boolean
    rating: number | null
    reviewCount: number
  }
  products: { published: number; draft: number; total: number }
}

/**
 * The signed-in baker, or a redirect to sign-in. Used by every page inside the portal shell.
 *
 * Deliberately calls the backend rather than decoding a token locally — a baker deactivated in OPS
 * is signed out on their next navigation, not whenever their week-old token happens to expire.
 */
export async function requireBaker(): Promise<BakerMe> {
  const result = await api.get<BakerMe>("/baker/me")

  if (result.status === 401) {
    // Deliberately does NOT clear the cookie here. Next.js forbids writing cookies during a page
    // render — only Server Actions and Route Handlers may — and calling delete() from a layout
    // throws, turning what should be a redirect to sign-in into a 500. The stale value is harmless:
    // it is a token the backend has already rejected, it is httpOnly, and it is overwritten on the
    // next successful sign-in (or removed properly by logoutAction, which IS a Server Action).
    redirect("/login?expired=1")
  }
  if (!result.data) {
    // 403 (bakery deactivated) and transport failures both land here. The session is not
    // necessarily invalid, so the cookie is left alone and the reason is shown instead.
    redirect(`/login?error=${encodeURIComponent(result.error ?? "Unavailable")}`)
  }

  return result.data
}
