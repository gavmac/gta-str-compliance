import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types'

/**
 * Server-side authentication utilities
 */

export async function getServerSession() {
  const supabase = createServerClient()
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    return session
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

export async function getServerUser(): Promise<User | null> {
  const session = await getServerSession()
  return session?.user ?? null
}

export async function getServerAppUser(): Promise<AppUser | null> {
  const user = await getServerUser()
  if (!user) return null

  const supabase = createServerClient()
  
  try {
    const { data: appUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching app user:', error)
      return null
    }

    return appUser
  } catch (error) {
    console.error('Error getting server app user:', error)
    return null
  }
}

export async function requireAuth(): Promise<{ user: User; appUser: AppUser }> {
  const user = await getServerUser()
  const appUser = await getServerAppUser()

  if (!user || !appUser) {
    redirect('/auth/signin')
  }

  return { user, appUser }
}

export async function requirePaidPlan(): Promise<{ user: User; appUser: AppUser }> {
  const { user, appUser } = await requireAuth()

  if (appUser.plan !== 'paid') {
    redirect('/upgrade')
  }

  return { user, appUser }
}

export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const user = await getServerUser()
  
  if (user) {
    redirect(redirectTo)
  }
}

/**
 * Client-side authentication utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

export function getPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Include numbers')
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include special characters')
  }

  return { score, feedback }
}

export function formatAuthError(error: any): string {
  if (!error) return 'An unknown error occurred'

  // Handle Supabase auth errors
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.'
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.'
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long.'
    case 'Unable to validate email address: invalid format':
      return 'Please enter a valid email address.'
    case 'Signup is disabled':
      return 'Account creation is currently disabled. Please contact support.'
    default:
      return error.message || 'An error occurred during authentication.'
  }
}

/**
 * Route protection helpers
 */

export const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password']
export const protectedRoutes = ['/dashboard', '/properties', '/documents', '/settings']
export const premiumRoutes = ['/properties', '/documents']

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export function isPremiumRoute(pathname: string): boolean {
  return premiumRoutes.some(route => pathname.startsWith(route))
}