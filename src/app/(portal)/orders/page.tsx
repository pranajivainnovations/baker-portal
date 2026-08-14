import type { Metadata } from "next"

import { api } from "@/lib/api"
import { setOrderStatusAction } from "./actions"

export const metadata: Metadata = { title: "Orders" }
export const dynamic = "force-dynamic"

type Status = "new" | "accepted" | "baking" | "ready" | "delivered" | "rejected"

interface OrderItem {
  lineItemId: string
  title: string
  thumbnail: string | null
  quantity: number
  unitPrice: number
}

interface BakerOrder {
  orderId: string
  displayId: number
  status: Status
  placedAt: string
  customerName: string | null
  city: string | null
  postalCode: string | null
  bakerTotal: number
  items: OrderItem[]
}

/**
 * What each state looks like, in a baker's words.
 *
 * "New" is amber rather than green: an unaccepted order is the one thing on this page that needs
 * someone to do something, and it should be the first thing the eye lands on.
 */
const STATUS: Record<Status, { label: string; chip: string }> = {
  new: { label: "New order", chip: "bg-amber-100 text-amber-900" },
  accepted: { label: "Accepted", chip: "bg-sky-100 text-sky-800" },
  baking: { label: "Baking", chip: "bg-violet-100 text-violet-800" },
  ready: { label: "Ready", chip: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Delivered", chip: "bg-slate-100 text-slate-600" },
  rejected: { label: "Declined", chip: "bg-red-100 text-red-700" },
}

/**
 * The moves offered from each state.
 *
 * Mirrors the backend's transition table, which remains the authority — a button that only produces
 * an error is worse than no button, so this shows exactly what will be accepted. "Accepted" offers
 * Ready as well as Baking, because a baker who already had it made should not have to click through
 * a step that never happened.
 */
const MOVES: Record<Status, { label: string; next: Status; primary?: boolean }[]> = {
  new: [
    { label: "Accept order", next: "accepted", primary: true },
    { label: "Can't take it", next: "rejected" },
  ],
  accepted: [
    { label: "Start baking", next: "baking", primary: true },
    { label: "It's ready", next: "ready" },
  ],
  baking: [{ label: "It's ready", next: "ready", primary: true }],
  ready: [{ label: "Handed over", next: "delivered", primary: true }],
  delivered: [],
  rejected: [],
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

function whenPlaced(iso: string): string {
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; moved?: string }>
}) {
  const { error, moved } = await searchParams
  const result = await api.get<{ orders: BakerOrder[] }>("/baker/orders")
  const orders = result.data?.orders ?? []

  // New first — they are the ones with a clock running. Everything else keeps its natural order.
  const sorted = [...orders].sort((a, b) => {
    const aNew = a.status === "new" ? 0 : 1
    const bNew = b.status === "new" ? 0 : 1
    return aNew - bNew
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold text-slate-900">Orders</h1>
      <p className="mt-1 text-sm text-slate-500">
        Everything customers have ordered from you. Only your items are shown — anything else in the
        basket is handled by CrossFriend.
      </p>

      {moved && (
        <div className="mt-5 rounded-large border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            {moved === "rejected" ? "Order declined — we'll take it from here." : "Updated."}
          </p>
        </div>
      )}
      {(error || result.error) && (
        <p
          role="alert"
          className="mt-5 rounded-rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error || result.error}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="mt-6 rounded-large border border-dashed border-cf-warm-dark bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-800">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            When a customer orders one of your products, it will appear here and we&apos;ll let you
            know.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sorted.map((o) => {
            const status = STATUS[o.status]
            const moves = MOVES[o.status]

            return (
              <article
                key={o.orderId}
                className={`rounded-large border bg-white p-4 ${
                  o.status === "new" ? "border-amber-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Order #{o.displayId}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {whenPlaced(o.placedAt)}
                      {o.customerName ? ` · ${o.customerName}` : ""}
                      {o.city ? ` · ${o.city}` : ""}
                      {o.postalCode ? ` ${o.postalCode}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.chip}`}>
                    {status.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {o.items.map((i) => (
                    <li key={i.lineItemId} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.thumbnail ? (
                        <img
                          src={i.thumbnail}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-rounded bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{i.title}</p>
                        <p className="text-xs text-slate-500">
                          {i.quantity} × {inr(i.unitPrice)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="text-sm font-bold text-slate-900">
                    Your total: {inr(o.bakerTotal)}
                  </p>
                  {moves.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {moves.map((m) => (
                        <form key={m.next} action={setOrderStatusAction}>
                          <input type="hidden" name="orderId" value={o.orderId} />
                          <input type="hidden" name="status" value={m.next} />
                          <button
                            type="submit"
                            className={`tap-target rounded-rounded px-4 py-2 text-sm font-semibold transition ${
                              m.primary
                                ? "bg-cf-orange text-white hover:bg-cf-orange-dark"
                                : "border border-slate-300 text-slate-600 hover:border-slate-400"
                            }`}
                          >
                            {m.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
