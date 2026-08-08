"use client"

import { useState } from "react"

interface Row {
  key: number
  label: string
  price: string
}

/**
 * The size/price rows — the one genuinely interactive part of the form.
 *
 * A baker sells the same cake at 0.5 kg, 1 kg and 2 kg, so a fixed set of inputs would be wrong for
 * almost everyone. Rows start with one and grow on demand.
 *
 * Kept as an uncontrolled-ish list of plain named inputs (`size-label` / `size-price` repeated) so
 * the form still submits correctly if this component never hydrates — the server action reads them
 * with getAll(). Adding rows needs JavaScript; entering the first size does not.
 */
export default function SizeRows({
  initial,
}: {
  initial?: { label: string; price: string }[]
}) {
  const seed =
    initial && initial.length
      ? initial.map((r, i) => ({ key: i, label: r.label, price: r.price }))
      : [{ key: 0, label: "", price: "" }]

  const [rows, setRows] = useState<Row[]>(seed)

  const addRow = () =>
    setRows((prev) => [...prev, { key: Date.now(), label: "", price: "" }])

  const removeRow = (key: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)))

  return (
    <div className="mt-1.5 space-y-2">
      {rows.map((row, index) => (
        <div key={row.key} className="flex items-start gap-2">
          <div className="flex-1">
            <input
              name="size-label"
              defaultValue={row.label}
              required={index === 0}
              placeholder="1 kg"
              aria-label={`Size ${index + 1} name`}
              className="w-full rounded-rounded border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-cf-purple focus:outline-none"
            />
          </div>
          <div className="w-32">
            <div className="flex items-center rounded-rounded border border-slate-300 focus-within:border-cf-purple">
              <span className="pl-3 text-base text-slate-400" aria-hidden="true">
                ₹
              </span>
              <input
                name="size-price"
                defaultValue={row.price}
                required={index === 0}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="899"
                aria-label={`Price for size ${index + 1}`}
                className="w-full rounded-rounded bg-transparent px-2 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            disabled={rows.length === 1}
            aria-label={`Remove size ${index + 1}`}
            className="mt-0.5 rounded-rounded px-2 py-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="rounded-rounded px-1 py-2 text-sm font-semibold text-cf-purple transition hover:text-cf-purple-700"
      >
        + Add another size
      </button>
    </div>
  )
}
