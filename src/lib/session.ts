import { cookies } from "next/headers"

/**
 * The portal's half of baker identity: hold the token, forward the token. Nothing else.
 *
 * This app cannot verify a session, cannot read the database, and cannot decide what a baker owns.
 * It stores an opaque string the backend issued and attaches it to requests. Every meaningful
 * question — is this session valid, is this baker active, does this baker own that product — is
 * answered by the backend on every single call.
 *
 * That is why there is no `jose` and no `pg` in package.json. A frontend that *could* answer "which
 * baker am I" is a frontend that can eventually be persuaded to answer it wrongly; keeping the
 * capability absent is stronger than keeping it unused.
 */

export const BAKER_SESSION_COOKIE = "baker_session"

/**
 * Matches the backend's own token lifetime. If they drift, the cookie outliving the JWT is the
 * harmless direction (the next API call 401s and we clear it); the reverse would log bakers out
 * while their token was still perfectly good.
 */
export const BAKER_SESSION_MAX_AGE = 60 * 60 * 24 * 7

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(BAKER_SESSION_COOKIE)?.value ?? null
}

export async function setSessionToken(token: string, maxAge = BAKER_SESSION_MAX_AGE) {
  const store = await cookies()
  store.set(BAKER_SESSION_COOKIE, token, {
    httpOnly: true,
    // Scoped to this host only. The portal runs on baker.crossfriend.in and must NOT set a
    // cookie on .crossfriend.in — a baker session has no business travelling to the customer
    // storefront, and a shared parent domain is how that accident happens.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

export async function clearSessionToken() {
  const store = await cookies()
  store.delete(BAKER_SESSION_COOKIE)
}
