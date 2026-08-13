"use client"

import { useFormStatus } from "react-dom"

import { deleteProductAction } from "../../actions"

/**
 * Deletion, behind a confirmation that names the product.
 *
 * A client component only because `onSubmit` needs to intercept — the action itself is a plain
 * server action and the form works without JavaScript, in which case the backend's own order check
 * is still the thing that actually protects anyone. The confirm is a courtesy, not the guard.
 */
export default function DeleteProductButton({
  productId,
  title,
}: {
  productId: string
  title: string
}) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This can't be undone.`)) {
          e.preventDefault()
        }
      }}
      className="mt-3"
    >
      <input type="hidden" name="productId" value={productId} />
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="tap-target rounded-rounded border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete permanently"}
    </button>
  )
}
