'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  appUser: AppUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, cityId?: number) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const refreshUser = useCallback(async () => {
    if (!user) {
      setAppUser(null)
      return
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        setAppUser(null)
      } else {
        setAppUser(userData)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setAppUser(null)
    }
  }, [user, supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, cityId?: number) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (!error && data.user) {
      // Create user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          plan: 'free',
          city_id: cityId || null,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        return { error: profileError }
      }
    }

    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setAppUser(null)
      setSession(null)
    }
    return { error }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle sign in/sign up events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh user data when signed in
          if (session?.user) {
            // Small delay to ensure user record exists
            setTimeout(() => {
              refreshUser()
            }, 100)
          }
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setAppUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshUser, supabase.auth])

  // Refresh app user data when auth user changes
  useEffect(() => {
    if (user && !loading) {
      refreshUser()
    }
  }, [user, loading, refreshUser])

  // If Supabase is not configured, provide a mock auth state
  if (!supabase) {
    const mockValue = {
      user: null,
      appUser: null,
      session: null,
      loading: false,
      signIn: async () => ({ error: new Error('Supabase not configured') }),
      signUp: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      refreshUser: async () => {},
    }
    
    return (
      <AuthContext.Provider value={mockValue}>
        {children}
      </AuthContext.Provider>
    )
  }

  const value = {
    user,
    appUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}