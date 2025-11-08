'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        if (data.error === 'Stripe not configured') {
          alert(`Stripe Setup Required:\n\n1. Go to ${data.testUrl}\n2. Copy your test secret key\n3. Replace STRIPE_SECRET_KEY in .env.local\n4. Restart your dev server`)
        } else {
          alert(`Payment Error: ${data.error}${data.details ? '\n' + data.details : ''}`)
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Payment setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GTA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Compliance Digest</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/signin" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get property-specific monitoring, compliance scoring, and personalized alerts to never miss a deadline again.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Test Mode Active
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Use test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code> with any future date and CVC.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/10 rounded-full"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Pro Plan</h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold">$29</span>
                  <span className="text-xl ml-2 opacity-80">/month</span>
                </div>
                <p className="text-blue-100 mt-2">Everything you need for compliance management</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="text-blue-100 font-medium mb-3">Everything in Free, plus:</div>
                {[
                  'Property-specific monitoring',
                  'Compliance scoring (0-100)',
                  'Deadline reminders & alerts',
                  'Document management',
                  'Priority support'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-blue-200 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-white text-blue-600 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Start Free Trial'}
              </button>

              <p className="text-center text-blue-100 text-sm mt-4">
                Cancel anytime. No long-term commitments.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}