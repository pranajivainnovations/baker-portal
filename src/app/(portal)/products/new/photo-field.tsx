"use client"

import { useRef, useState } from "react"

import { signUploadAction } from "./upload-actions"

interface Photo {
  key: number
  url: string
  status: "uploading" | "done" | "error"
  name: string
  message?: string
}

const MAX_PHOTOS = 6

/**
 * Photo picker — multiple images, uploaded straight to S3.
 *
 * Three steps per file, all invisible to the baker: ask the backend to sign an upload, POST the
 * file to S3 with that policy, keep the resulting public URL. The bytes never touch our servers —
 * they cannot, since the backend's JSON body limit is around 100KB.
 *
 * Uploads run in parallel and each row reports its own outcome, so one oversized photo does not
 * lose the four that worked. Failed rows can be dismissed and the form still submits.
 *
 * The FIRST successful photo becomes the product thumbnail, which is why reordering matters and
 * why the first tile is labelled. `capture="environment"` opens the camera on a phone, which is how
 * most bakers will actually photograph a cake.
 */
export default function PhotoField({ initialUrls = [] }: { initialUrls?: string[] }) {
  const [photos, setPhotos] = useState<Photo[]>(
    initialUrls.map((url, i) => ({ key: i, url, status: "done" as const, name: "Photo" }))
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const uploaded = photos.filter((p) => p.status === "done")
  const remaining = MAX_PHOTOS - photos.filter((p) => p.status !== "error").length

  async function handleFiles(files: File[]) {
    const accepted = files.slice(0, Math.max(remaining, 0))
    if (accepted.length === 0) return

    const started = accepted.map((file, i) => ({
      key: Date.now() + i,
      url: "",
      status: "uploading" as const,
      name: file.name,
    }))
    setPhotos((prev) => [...prev, ...started])

    // Parallel, not sequential: six phone photos uploaded one after another is a long wait for no
    // reason, and each already reports its own result.
    await Promise.all(
      accepted.map(async (file, i) => {
        const key = started[i].key
        const { upload, error } = await signUploadAction(file.type, file.size)

        if (!upload) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.key === key
                ? { ...p, status: "error", message: error ?? "Couldn't upload that photo." }
                : p
            )
          )
          return
        }

        const form = new FormData()
        for (const [k, v] of Object.entries(upload.fields)) form.append(k, v)
        form.append("file", file)

        try {
          const res = await fetch(upload.url, { method: "POST", body: form })
          setPhotos((prev) =>
            prev.map((p) =>
              p.key === key
                ? res.ok
                  ? { ...p, status: "done", url: upload.publicUrl }
                  : {
                      ...p,
                      status: "error",
                      // S3 rejects here when the real bytes break the signed policy — usually a
                      // photo larger than the range allows, which the browser could not know first.
                      message: "Rejected — try a smaller photo, under 8MB.",
                    }
                : p
            )
          )
        } catch {
          setPhotos((prev) =>
            prev.map((p) =>
              p.key === key
                ? { ...p, status: "error", message: "Upload failed. Check your connection." }
                : p
            )
          )
        }
      })
    )
  }

  const remove = (key: number) => setPhotos((prev) => prev.filter((p) => p.key !== key))

  const move = (key: number, delta: number) =>
    setPhotos((prev) => {
      const i = prev.findIndex((p) => p.key === key)
      const j = i + delta
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <div>
      <span className="block text-sm font-semibold text-slate-700">
        Photos <span className="font-normal text-slate-400">(optional)</span>
      </span>
      <p className="mt-0.5 text-xs text-slate-400">
        Up to {MAX_PHOTOS}. The first one is what customers see in listings.
      </p>

      {/* One hidden input per photo — the action reads them with getAll(), in this order. */}
      {uploaded.map((p) => (
        <input key={p.key} type="hidden" name="imageUrl" value={p.url} />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = "" // let the same file be re-picked after a removal
          if (files.length) void handleFiles(files)
        }}
      />

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 xsmall:grid-cols-4">
          {photos.map((p, index) => (
            <li
              key={p.key}
              className={`relative aspect-square overflow-hidden rounded-rounded border ${
                p.status === "error" ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              {p.status === "done" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              )}
              {p.status === "uploading" && (
                <span className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                  Uploading…
                </span>
              )}
              {p.status === "error" && (
                <span className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-red-700">
                  {p.message}
                </span>
              )}

              {index === 0 && p.status === "done" && (
                <span className="absolute left-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Main
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(p.key)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              </button>

              {p.status === "done" && photos.length > 1 && (
                <div className="absolute bottom-1 left-1 flex gap-0.5">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => move(p.key, -1)}
                      aria-label="Move photo earlier"
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-900/70 text-xs text-white hover:bg-slate-900"
                    >
                      ←
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(p.key, 1)}
                      aria-label="Move photo later"
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-900/70 text-xs text-white hover:bg-slate-900"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={remaining <= 0}
        className="mt-3 rounded-rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cf-purple hover:text-cf-purple disabled:opacity-50"
      >
        {photos.length === 0 ? "Add photos" : `Add more (${Math.max(remaining, 0)} left)`}
      </button>
      {photos.length === 0 && (
        <p className="mt-1.5 text-xs text-slate-400">JPEG, PNG or WEBP. Each under 8MB.</p>
      )}
    </div>
  )
}
