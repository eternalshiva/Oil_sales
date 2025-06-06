import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { OilInventoryProvider } from "@/context/oil-inventory-context"
import { Toaster } from "@/components/ui/toaster"

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
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <OilInventoryProvider>
              {children}
              <Toaster />
            </OilInventoryProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
