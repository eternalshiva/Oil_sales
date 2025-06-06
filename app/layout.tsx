import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { OilInventoryProvider } from "@/context/oil-inventory-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Oil Inventory Management System",
  description: "Track and manage oil inventory, sales, and dispatches",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <OilInventoryProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
          </OilInventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
