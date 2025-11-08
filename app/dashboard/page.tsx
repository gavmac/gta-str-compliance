'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  plan: 'free' | 'paid'
  city_id: number | null
  created_at: string
}

interface RuleUpdate {
  id: number
  title: string
  summary_markdown: string
  effective_date: string | null
  published_at: string
  city: {
    name: string
    slug: string
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentUpdates, setRecentUpdates] = useState<RuleUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we're in development mode
    const urlParams = new URLSearchParams(window.location.search)
    const isDev = urlParams.get('dev') === 'true' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
    
    if (isDev) {
      // Check if user was upgraded or has paid plan in localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const wasUpgraded = urlParams.get('upgraded') === 'true'
      const storedPlan = localStorage.getItem('user_plan')
      
      // If upgraded, save to localStorage
      if (wasUpgraded) {
        localStorage.setItem('user_plan', 'paid')
      }
      
      const currentPlan = wasUpgraded || storedPlan === 'paid' ? 'paid' : 'free'
      
      // Mock user data for development
      setUser({
        id: 'dev-user-123',
        email: 'dev@example.com',
      } as User)
      setProfile({
        id: 'dev-user-123',
        email: 'dev@example.com',
        plan: currentPlan,
        city_id: null,
        created_at: new Date().toISOString()
      })
      // Mock recent updates for development
      setRecentUpdates([
        {
          id: 1,
          title: 'Updated STR License Requirements',
          summary_markdown: 'New requirements for short-term rental licenses',
          effective_date: '2024-01-01',
          published_at: new Date().toISOString(),
          city: { name: 'Toronto', slug: 'toronto' }
        },
        {
          id: 2,
          title: 'Fire Safety Inspection Changes',
          summary_markdown: 'Updated fire safety inspection process',
          effective_date: '2024-03-31',
          published_at: new Date().toISOString(),
          city: { name: 'Mississauga', slug: 'mississauga' }
        }
      ])
      setLoading(false)
      return
    }

    if (!supabase) {
      router.push('/signin')
      return
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }

      setUser(user)

      // Get user profile
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else if (profileData) {
        setProfile(profileData)
      }

      // Fetch recent updates
      const { data: updatesData } = await supabase
        .from('rule_updates')
        .select(`
          id,
          title,
          summary_markdown,
          effective_date,
          published_at,
          cities!inner(name, slug)
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5)

      if (updatesData) {
        const formattedUpdates = updatesData.map((update: any) => ({
          ...update,
          city: update.cities
        }))
        setRecentUpdates(formattedUpdates)
      }

      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    if (!supabase) return
    
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GTA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Compliance Digest</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-gray-900">{user.email}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  profile.plan === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.plan === 'paid' ? 'Pro' : 'Free'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to your compliance monitoring dashboard
          </p>
          {profile.plan === 'free' && (
            <button 
              onClick={() => {
                localStorage.setItem('user_plan', 'paid')
                setProfile({...profile, plan: 'paid'})
              }}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🧪 Test: Upgrade to Paid
            </button>
          )}
        </div>

        {/* Plan Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  profile.plan === 'paid' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    profile.plan === 'paid' ? 'text-green-600' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {profile.plan === 'paid' ? 'Pro Plan' : 'Free Plan'}
                </h3>
                <p className="text-sm text-gray-600">
                  {profile.plan === 'paid' 
                    ? 'Property-specific monitoring active' 
                    : 'City-wide updates only'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Location</h3>
                <p className="text-sm text-gray-600">
                  {profile.city_id ? 'City selected' : 'No city selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-2 8h2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Properties</h3>
                <p className="text-sm text-gray-600">
                  {profile.plan === 'paid' ? '0 properties added' : 'Upgrade to add properties'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile.plan === 'free' ? (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
              <p className="mb-4 opacity-90">
                Get property-specific monitoring, compliance scoring, and personalized alerts.
              </p>
              <Link
                href="/upgrade"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Upgrade Now
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Your Properties</h3>
              <p className="text-gray-600 mb-4">
                Add properties, track compliance scores, and monitor deadlines.
              </p>
              <Link href="/properties" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Manage Properties
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Updates</h3>
            <p className="text-gray-600 mb-4">
              Stay informed about the latest compliance changes in your area.
            </p>
            {recentUpdates.length > 0 ? (
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{update.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {update.city.name} • {new Date(update.published_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link 
                  href="/updates" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all updates →
                </Link>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No recent updates available
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}