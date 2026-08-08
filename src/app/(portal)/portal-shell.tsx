"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logoutAction } from "@/app/login/actions"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "My products" },
  { href: "/profile", label: "Bakery profile" },
]

/**
 * Portal chrome.
 *
 * Bottom tab bar on mobile, sidebar on desktop — not a hamburger. A baker checks this between
 * orders with one hand and flour on the other; the three things they do should be one thumb-reach
 * away, not behind a menu.
 */
export default function PortalShell({
  bakerName,
  bakerPublicId,
  children,
}: {
  bakerName: string
  bakerPublicId: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="flex min-h-full flex-1 flex-col sm:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-cf-warm-dark bg-white sm:flex">
        <div className="px-5 py-5">
          <p className="text-xs font-semibold tracking-wide text-cf-purple uppercase">
            CrossFriend
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900" title={bakerName}>
            {bakerName}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{bakerPublicId}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`block rounded-rounded px-3 py-2 text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-cf-purple text-white"
                  : "text-slate-600 hover:bg-cf-warm"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-cf-warm-dark p-3">
          <form action={logoutAction} onSubmit={() => setSigningOut(true)}>
            <button
              type="submit"
              className="w-full rounded-rounded px-3 py-2 text-left text-xs font-medium text-slate-500 transition hover:bg-cf-warm hover:text-slate-800"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-cf-warm-dark bg-white px-4 py-3 sm:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{bakerName}</p>
          <p className="font-mono text-xs text-slate-400">{bakerPublicId}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-2 text-xs font-medium text-slate-500">
            Sign out
          </button>
        </form>
      </header>

      {/* pb-20 keeps content clear of the mobile tab bar */}
      <main className="min-w-0 flex-1 pb-20 sm:pb-0">{children}</main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-cf-warm-dark bg-white sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex-1 px-2 py-3 text-center text-xs font-semibold transition ${
              isActive(item.href) ? "text-cf-purple" : "text-slate-400"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
