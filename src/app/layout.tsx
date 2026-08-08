import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "CrossFriend for Bakers",
    template: "%s · CrossFriend for Bakers",
  },
  description:
    "Manage your bakery on CrossFriend — list what you make, set your prices, and reach customers near you.",
  // A private working tool. Nothing here should ever appear in search results.
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-cf-warm text-slate-800">{children}</body>
    </html>
  )
}
