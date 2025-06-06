"use client"

import { SessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/sidebar'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // If not authenticated and not on login page, redirect to login
    if (!session && pathname !== '/login') {
      router.push('/login')
      return
    }

    // If authenticated and on login page, redirect to dashboard
    if (session && pathname === '/login') {
      router.push('/dashboard')
      return
    }
  }, [session, status, pathname, router])

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show login page without sidebar
  if (!session && pathname === '/login') {
    return <>{children}</>
  }

  // Show authenticated layout with sidebar
  if (session && pathname !== '/login') {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    )
  }

  // Default fallback
  return <>{children}</>
}