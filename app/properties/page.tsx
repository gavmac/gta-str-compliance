'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateComplianceScore } from '@/lib/compliance/scoring'
import AddPropertyForm from '@/components/AddPropertyForm'
import NotificationBell from '@/components/NotificationBell'

interface Property {
  id: string
  address_line1: string
  municipality: string
  usage_type: 'short_term' | 'long_term' | 'mixed'
  compliance_status?: 'compliant' | 'at_risk' | 'non_compliant'
  compliance_score?: number
  compliance_explanation?: string
  failing_rules?: any[]
  mat_reporting?: {
    reporting_frequency: 'monthly' | 'quarterly'
    due_description: string
    requires_zero_return: boolean
  }
  next_mat_due?: {
    dueDate: string
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    if (!supabase) {
      setProperties([
        {
          id: '1',
          address_line1: '123 Main St',
          municipality: 'toronto',
          usage_type: 'short_term' as const,
          compliance_score: 85,
          compliance_status: 'at_risk' as const
        }
      ])
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/properties')
      const { properties } = await response.json()
      
      // Use properties from API with compliance data
      const propertiesWithCompliance = properties || []
      
      setProperties(propertiesWithCompliance)
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

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
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600 mt-2">Manage your rental properties and compliance</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Property
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-2 8h2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Add your first property to start monitoring compliance</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{property.address_line1}</h3>
                    <p className="text-gray-600 capitalize">{property.municipality} • {property.usage_type.replace('_', '-')}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      property.compliance_status === 'compliant' ? 'text-green-600' :
                      property.compliance_status === 'at_risk' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {property.compliance_status === 'compliant' ? '✓ COMPLIANT' :
                       property.compliance_status === 'at_risk' ? '⚠ AT RISK' : '✗ NON-COMPLIANT'}
                    </div>
                    <p className="text-sm text-gray-500">Compliance Status</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    property.compliance_status === 'compliant' ? 'bg-green-100 text-green-800' :
                    property.compliance_status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {property.compliance_status === 'compliant' ? 'Compliant' :
                     property.compliance_status === 'at_risk' ? 'At Risk' : 'Likely Non-Compliant'}
                  </div>
                  
                  {property.failing_rules && property.failing_rules.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">Issues Found:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {property.failing_rules.map((rule: any, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {rule.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {property.mat_reporting && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">MAT Reporting Required</p>
                      <p className="text-sm text-blue-700">
                        {property.mat_reporting.reporting_frequency === 'monthly' ? 'Monthly' : 'Quarterly'} reporting - {property.mat_reporting.due_description}
                      </p>
                      {property.next_mat_due?.dueDate && (
                        <p className="text-sm text-blue-600 mt-1">
                          Next due: {new Date(property.next_mat_due.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {property.mat_reporting.requires_zero_return && (
                        <p className="text-xs text-blue-600 mt-1">
                          ⚠️ Zero returns required even if no MAT collected
                        </p>
                      )}
                    </div>
                  )}
                  
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      View detailed explanation
                    </summary>
                    <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                      {property.compliance_explanation}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Property</h3>
              <AddPropertyForm onClose={() => setShowAddForm(false)} onAdd={fetchProperties} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}