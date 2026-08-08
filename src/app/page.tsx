import { redirect } from "next/navigation"

import { getSessionToken } from "@/lib/session"

/**
 * The portal has no marketing homepage — it is a tool, and everyone arriving at the root either
 * has a session or needs one. Only the cookie's presence is checked here; whether it is actually
 * valid is settled by the backend when the portal layout loads.
 */
export default async function RootPage() {
  redirect((await getSessionToken()) ? "/dashboard" : "/login")
}
