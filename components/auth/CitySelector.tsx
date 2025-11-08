'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { City } from '@/types'

interface CitySelectorProps {
  value: number | null
  onChange: (cityId: number | null) => void
  required?: boolean
  className?: string
}

export default function CitySelector({ 
  value, 
  onChange, 
  required = false, 
  className = '' 
}: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) {
          setError('Failed to load cities')
          console.error('Error loading cities:', error)
        } else {
          setCities(data || [])
          setError(null)
        }
      } catch (err) {
        setError('Failed to load cities')
        console.error('Error loading cities:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCities()
  }, [supabase])

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <select
          disabled
          className="block w-full px-3 py-2 border border-red-300 rounded-lg shadow-sm bg-red-50 text-red-900"
        >
          <option>Error loading cities</option>
        </select>
        <p className="mt-1 text-xs text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        required={required}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select your city</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        You&apos;ll receive compliance updates for your selected city
      </p>
    </div>
  )
}