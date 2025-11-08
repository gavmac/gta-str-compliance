'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<RuleUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const isDev = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
    
    if (isDev) {
      setUpdates([
        {
          id: 1,
          title: 'Updated STR License Requirements',
          summary_markdown: '## New Requirements\n\nEffective January 1, 2024, all short-term rental operators must:\n\n- Provide proof of primary residence\n- Submit annual safety inspection reports\n- Maintain $2M liability insurance\n\n**Action Required:** Renew your license with updated documentation.',
          effective_date: '2024-01-01',
          published_at: new Date().toISOString(),
          city: { name: 'Toronto', slug: 'toronto' }
        },
        {
          id: 2,
          title: 'Fire Safety Inspection Changes',
          summary_markdown: '## Updated Inspection Process\n\nNew fire safety inspection requirements include:\n\n- Carbon monoxide detector verification\n- Emergency exit lighting checks\n- Updated fire extinguisher requirements\n\n**Deadline:** All properties must comply by March 31, 2024.',
          effective_date: '2024-03-31',
          published_at: new Date().toISOString(),
          city: { name: 'Mississauga', slug: 'mississauga' }
        }
      ])
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const fetchUpdates = async () => {
      const { data } = await supabase
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

      if (data) {
        const formattedUpdates = data.map(update => ({
          ...update,
          city: update.cities
        }))
        setUpdates(formattedUpdates)
      }
      setLoading(false)
    }

    fetchUpdates()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GTA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Compliance Digest</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Updates</h1>
          <p className="text-gray-600 mt-2">
            Latest regulatory changes across GTA municipalities
          </p>
        </div>

        {updates.length > 0 ? (
          <div className="space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{update.title}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {update.city.name}
                      </span>
                      <span>Published {new Date(update.published_at).toLocaleDateString()}</span>
                      {update.effective_date && (
                        <span>Effective {new Date(update.effective_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {update.summary_markdown.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No updates available at this time.</p>
          </div>
        )}
      </main>
    </div>
  )
}