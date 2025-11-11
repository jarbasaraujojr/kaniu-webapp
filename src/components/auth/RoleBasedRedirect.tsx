'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function RoleBasedRedirect() {
  const router = useRouter()
  const { user, isLoading, getDashboardPath } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      const dashboardPath = getDashboardPath()
      router.replace(dashboardPath)
    }
  }, [user, isLoading, router, getDashboardPath])

  return null
}
