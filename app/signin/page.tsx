'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the actual signin page
    router.replace('/auth/signin')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}