import { requireBaker } from "@/lib/api"
import PortalShell from "./portal-shell"

/**
 * Everything inside this route group requires a signed-in baker.
 *
 * The check lives in the layout rather than in each page, so a page added later is protected by
 * default — the failure mode of per-page guards is the one page somebody forgets. `requireBaker`
 * asks the backend, which re-reads is_active on every call, so a baker deactivated in OPS is
 * signed out on their next navigation rather than at token expiry.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireBaker()

  return (
    <PortalShell bakerName={me.baker.name} bakerPublicId={me.baker.publicId}>
      {children}
    </PortalShell>
  )
}
