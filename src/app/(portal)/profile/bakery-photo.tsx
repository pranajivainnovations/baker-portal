"use client"

import { useRef, useState } from "react"

import { signUploadAction } from "../products/new/upload-actions"
import { saveBakeryImageAction } from "./actions"

type Status = "idle" | "uploading" | "saved" | "error"

/**
 * Profile or banner photo for the bakery.
 *
 * Same three-step flow as product photos — sign, POST straight to S3, then record the URL — because
 * the backend's request body limit makes proxying images impossible. The difference is that these
 * are "most recent wins" singles, so uploading replaces rather than appends.
 *
 * Recording is a separate step from uploading: S3 accepts the bytes, then the backend re-checks the
 * key belongs to this bakery before storing it. An upload that succeeds but fails to record leaves
 * an orphan object in S3 and no visible change, which is the safe direction to fail.
 */
export default function BakeryPhoto({
  purpose,
  currentUrl,
  label,
  hint,
  aspect,
}: {
  purpose: "profile" | "banner"
  currentUrl: string | null
  label: string
  hint: string
  aspect: "square" | "wide"
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [url, setUrl] = useState(currentUrl)
  const [message, setMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setStatus("uploading")
    setMessage(null)

    const { upload, error } = await signUploadAction(file.type, file.size, purpose)
    if (!upload) {
      setStatus("error")
      setMessage(error ?? "Couldn't upload that photo.")
      return
    }

    const form = new FormData()
    for (const [k, v] of Object.entries(upload.fields)) form.append(k, v)
    form.append("file", file)

    try {
      const res = await fetch(upload.url, { method: "POST", body: form })
      if (!res.ok) {
        setStatus("error")
        setMessage("That photo was rejected — try a smaller one, under 8MB.")
        return
      }
    } catch {
      setStatus("error")
      setMessage("Upload failed. Check your connection and try again.")
      return
    }

    const saved = await saveBakeryImageAction(purpose, upload.publicUrl, upload.key)
    if (saved.error) {
      setStatus("error")
      setMessage(saved.error)
      return
    }

    setUrl(upload.publicUrl)
    setStatus("saved")
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) void handleFile(f)
        }}
      />

      <div className="mt-2 flex items-center gap-3">
        <div
          className={`shrink-0 overflow-hidden rounded-rounded border border-slate-200 bg-slate-50 ${
            aspect === "square" ? "h-20 w-20" : "h-20 w-40"
          }`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
              None yet
            </span>
          )}
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="rounded-rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cf-purple hover:text-cf-purple disabled:opacity-50"
          >
            {status === "uploading" ? "Uploading…" : url ? "Replace" : "Upload"}
          </button>
          {status === "saved" && <p className="mt-1 text-xs text-emerald-600">Saved</p>}
          {status === "error" && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
