'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data for demo
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@example.com',
}

const mockProfile = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  plan: 'free' as const,
  city_id: 1,
  created_at: new Date().toISOString()
}

const mockPaidProfile = {
  ...mockProfile,
  plan: 'paid' as const,
}

export default function DemoPage() {
  const [isPaid, setIsPaid] = useState(false)
  const user = mockUser
  const profile = isPaid ? mockPaidProfile : mockProfile

  const handleSignOut = () => {
    alert('Demo mode - Sign out clicked!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Demo Mode</span>
            <span className="text-sm text-yellow-700">This is a preview of the dashboard with mock data</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPaid(!isPaid)}
              className="text-sm bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded-lg transition-colors"
            >
              Toggle {isPaid ? 'Free' : 'Paid'} Plan
            </button>
            <Link href="/" className="text-sm text-yellow-700 hover:text-yellow-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

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
                  {profile.city_id ? 'Toronto, ON' : 'No city selected'}
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
                  {profile.plan === 'paid' ? '3 properties monitored' : 'Upgrade to add properties'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section (Paid Plan Only) */}
        {profile.plan === 'paid' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Properties</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Add Property
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Property 1 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">123 Main St</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Score: 85
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Toronto, ON • Short-term Rental</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">STR License</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fire Inspection</span>
                    <span className="text-yellow-600 font-medium">Due Soon</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Insurance</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                </div>
              </div>

              {/* Sample Property 2 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">456 Oak Ave</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Score: 70
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Mississauga, ON • Long-term Rental</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rental License</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fire Inspection</span>
                    <span className="text-red-600 font-medium">Overdue</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Insurance</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                </div>
              </div>

              {/* Sample Property 3 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">789 Pine Rd</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Score: 95
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Brampton, ON • Short-term Rental</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">STR License</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fire Inspection</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Insurance</span>
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile.plan === 'free' ? (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
              <p className="mb-4 opacity-90">
                Get property-specific monitoring, compliance scoring, and personalized alerts.
              </p>
              <button
                onClick={() => setIsPaid(true)}
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Try Pro Demo
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compliance Overview</h3>
              <p className="text-gray-600 mb-4">
                Your properties are performing well with an average score of 83/100.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Properties monitored</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items due soon</span>
                  <span className="font-medium text-yellow-600">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overdue items</span>
                  <span className="font-medium text-red-600">1</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Updates</h3>
            <p className="text-gray-600 mb-4">
              Stay informed about the latest compliance changes in your area.
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">New STR Regulations</h4>
                <p className="text-sm text-gray-600">Toronto updated short-term rental licensing requirements</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium text-gray-900">Fire Safety Update</h4>
                <p className="text-sm text-gray-600">Mississauga extended inspection deadlines by 30 days</p>
                <p className="text-xs text-gray-500 mt-1">1 week ago</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}