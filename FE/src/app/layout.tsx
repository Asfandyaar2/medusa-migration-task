import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
