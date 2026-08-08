"use client"

import { useRef, useState } from "react"

import { signUploadAction } from "./upload-actions"

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; name: string }
  | { kind: "done"; url: string; name: string }
  | { kind: "error"; message: string }

/**
 * Photo picker that uploads straight to S3.
 *
 * Three steps, all invisible to the baker: ask the backend to sign an upload, POST the file to S3
 * with that policy, then keep the resulting public URL in a hidden field the form submits. The
 * bytes never touch our servers — they cannot, since the backend's JSON body limit is ~100KB.
 *
 * `capture="environment"` matters more than it looks: on a phone this offers the camera directly,
 * which is how most bakers will actually photograph a cake — from the kitchen, in the moment.
 *
 * If the upload fails the form remains submittable without a photo. A missing picture is a worse
 * listing; a lost form is a baker who gives up.
 */
export default function PhotoField({ initialUrl }: { initialUrl?: string }) {
  const [status, setStatus] = useState<Status>(
    initialUrl ? { kind: "done", url: initialUrl, name: "Current photo" } : { kind: "idle" }
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadedUrl = status.kind === "done" ? status.url : ""

  async function handleFile(file: File) {
    setStatus({ kind: "uploading", name: file.name })

    const { upload, error } = await signUploadAction(file.type, file.size)
    if (!upload) {
      setStatus({ kind: "error", message: error ?? "Couldn't upload that photo." })
      return
    }

    // S3 requires the policy fields to appear BEFORE the file part, in order.
    const form = new FormData()
    for (const [key, value] of Object.entries(upload.fields)) {
      form.append(key, value)
    }
    form.append("file", file)

    try {
      const res = await fetch(upload.url, { method: "POST", body: form })
      if (!res.ok) {
        // S3 rejects here when the real bytes break the signed policy — most often a photo larger
        // than the range allows, which the browser could not have known before reading it.
        setStatus({
          kind: "error",
          message: "That photo was rejected — try a smaller one, under 8MB.",
        })
        return
      }
      setStatus({ kind: "done", url: upload.publicUrl, name: file.name })
    } catch {
      setStatus({ kind: "error", message: "Upload failed. Check your connection and try again." })
    }
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-slate-700">
        Photo <span className="font-normal text-slate-400">(optional)</span>
      </span>

      {/* The value the form actually submits. */}
      <input type="hidden" name="imageUrl" value={uploadedUrl} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      <div className="mt-1.5 flex items-center gap-3">
        {status.kind === "done" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={status.url}
            alt=""
            className="h-20 w-20 shrink-0 rounded-rounded border border-slate-200 object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status.kind === "uploading"}
            className="rounded-rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cf-purple hover:text-cf-purple disabled:opacity-50"
          >
            {status.kind === "uploading"
              ? "Uploading…"
              : status.kind === "done"
                ? "Choose a different photo"
                : "Add a photo"}
          </button>

          {status.kind === "uploading" && (
            <p className="mt-1.5 truncate text-xs text-slate-400">{status.name}</p>
          )}
          {status.kind === "done" && (
            <p className="mt-1.5 truncate text-xs text-emerald-600">Photo added</p>
          )}
          {status.kind === "error" && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {status.message}
            </p>
          )}
          {status.kind === "idle" && (
            <p className="mt-1.5 text-xs text-slate-400">
              A clear photo of the finished item. JPEG, PNG or WEBP, under 8MB.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
