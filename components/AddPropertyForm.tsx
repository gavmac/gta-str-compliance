'use client'

import { useState } from 'react'

interface AddPropertyFormProps {
  onClose: () => void
  onAdd: () => void
}

export default function AddPropertyForm({ onClose, onAdd }: AddPropertyFormProps) {
  const [address, setAddress] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [usageType, setUsageType] = useState<'short_term' | 'long_term' | 'mixed'>('short_term')
  const [isPrincipalResidence, setIsPrincipalResidence] = useState<boolean | null>(null)
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [matNumber, setMatNumber] = useState('')
  
  // Toronto specific fields
  const [emergencyContact, setEmergencyContact] = useState(false)
  const [provides911Info, setProvides911Info] = useState(false)
  const [exitDiagramPosted, setExitDiagramPosted] = useState(false)
  const [keepsRecords, setKeepsRecords] = useState(false)
  const [annualNights, setAnnualNights] = useState('')
  
  // Mississauga specific fields
  const [localContact, setLocalContact] = useState(false)
  const [evacuationInfo, setEvacuationInfo] = useState(false)
  
  // Brampton specific fields
  const [guestInfoPackage, setGuestInfoPackage] = useState(false)
  
  // Vaughan specific fields
  const [matRegistered, setMatRegistered] = useState(false)
  
  // Newmarket specific fields
  const [collectsMAT, setCollectsMAT] = useState(false)
  const [matSeparateLine, setMatSeparateLine] = useState(false)
  const [quarterlyRemittance, setQuarterlyRemittance] = useState(false)
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_line1: address,
          municipality,
          usage_type: usageType,
          is_principal_residence: isPrincipalResidence,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          mat_number: matNumber,
          
          // Toronto fields
          emergency_contact: emergencyContact,
          provides_911_info: provides911Info,
          exit_diagram_posted: exitDiagramPosted,
          keeps_records: keepsRecords,
          annual_nights: parseInt(annualNights) || 0,
          
          // Mississauga fields
          local_contact: localContact,
          evacuation_info: evacuationInfo,
          
          // Brampton fields
          guest_info_package: guestInfoPackage,
          
          // Vaughan fields
          mat_registered: matRegistered,
          
          // Newmarket fields
          collects_mat: collectsMAT,
          mat_separate_line: matSeparateLine,
          quarterly_remittance: quarterlyRemittance,
        }),
      })

      if (response.ok) {
        onAdd()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Property creation failed:', errorData)
        alert(`Failed to add property: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding property:', error)
      alert('Network error occurred while adding property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Address
        </label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Municipality
        </label>
        <select
          required
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="">Select municipality</option>
          <option value="toronto">Toronto</option>
          <option value="mississauga">Mississauga</option>
          <option value="brampton">Brampton</option>
          <option value="vaughan">Vaughan</option>
          <option value="newmarket">Newmarket</option>
          <option value="hamilton">Hamilton (Draft Rules)</option>
          <option value="richmond_hill">Richmond Hill (Study Only)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usage Type
        </label>
        <select
          value={usageType}
          onChange={(e) => setUsageType(e.target.value as 'short_term' | 'long_term' | 'mixed')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="short_term">Short-term stays (&lt;28 days)</option>
          <option value="long_term">Long-term only (RTA-style)</option>
          <option value="mixed">Both short-term and long-term</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Is this your principal residence?
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="principal_residence"
              checked={isPrincipalResidence === true}
              onChange={() => setIsPrincipalResidence(true)}
              className="mr-2"
            />
            Yes
          </label>
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="principal_residence"
              checked={isPrincipalResidence === false}
              onChange={() => setIsPrincipalResidence(false)}
              className="mr-2"
            />
            No
          </label>
        </div>
      </div>

      {usageType !== 'long_term' && ['toronto', 'mississauga', 'brampton', 'vaughan'].includes(municipality) && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {municipality === 'toronto' ? 'STR Registration' :
             municipality === 'mississauga' ? 'STR Accommodation License' :
             municipality === 'brampton' ? 'STR Host License' :
             'STR Owner License'}
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {municipality === 'toronto' ? 'Registration Number' :
                 municipality === 'mississauga' ? 'License Number' :
                 municipality === 'brampton' ? 'Host License Number' :
                 'Owner License Number'}
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder={`Enter your ${municipality === 'toronto' ? 'registration' : 'license'} number`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {municipality === 'toronto' ? 'Registration' : 'License'} Expiry Date
              </label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

          </div>
        </div>
      )}
      
      {usageType !== 'long_term' && municipality === 'newmarket' && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">MAT Information (No STR License Required)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MAT Registration Number (if applicable)
            </label>
            <input
              type="text"
              value={matNumber}
              onChange={(e) => setMatNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Municipal Accommodation Tax number"
            />
          </div>
        </div>
      )}
      
      {usageType !== 'long_term' && ['hamilton', 'richmond_hill'].includes(municipality) && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {municipality === 'hamilton' ? 'No Current License Required (Draft Rules)' : 'No License Required (Study Only)'}
          </h3>
          <p className="text-sm text-gray-600">
            {municipality === 'hamilton' 
              ? 'Hamilton rules are based on draft framework - confirm requirements with final by-law'
              : 'Richmond Hill has no binding STR licensing requirements from available documents'
            }
          </p>
        </div>
      )}
      
      {usageType !== 'long_term' && (
        <div>
            {municipality === 'toronto' && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Toronto Requirements (Chapter 547)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.checked)}
                    />
                    Emergency contact info provided to guests
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={provides911Info}
                      onChange={(e) => setProvides911Info(e.target.checked)}
                    />
                    9-1-1 usage information provided
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={exitDiagramPosted}
                      onChange={(e) => setExitDiagramPosted(e.target.checked)}
                    />
                    Exit diagram posted in conspicuous place
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={keepsRecords}
                      onChange={(e) => setKeepsRecords(e.target.checked)}
                    />
                    Keep transaction records for 3+ years
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual nights (max 180 for entire unit)
                    </label>
                    <input
                      type="number"
                      max="180"
                      value={annualNights}
                      onChange={(e) => setAnnualNights(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Expected annual nights"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {municipality === 'mississauga' && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Mississauga Requirements (By-law 0289-2020)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={localContact}
                      onChange={(e) => setLocalContact(e.target.checked)}
                    />
                    Local contact details provided
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={evacuationInfo}
                      onChange={(e) => setEvacuationInfo(e.target.checked)}
                    />
                    Evacuation plan & safety info provided to guests
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={keepsRecords}
                      onChange={(e) => setKeepsRecords(e.target.checked)}
                    />
                    Keep records (stays, fees, MAT) for 3 years
                  </label>
                </div>
              </div>
            )}
            
            {municipality === 'brampton' && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Brampton Requirements (By-law 165-2021)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={guestInfoPackage}
                      onChange={(e) => setGuestInfoPackage(e.target.checked)}
                    />
                    Complete guest info package (24/7 contact, floor plan, exits, emergency contacts, fire safety)
                  </label>
                </div>
              </div>
            )}
            
            {municipality === 'vaughan' && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Vaughan Requirements (By-law 158-2019)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={matRegistered}
                      onChange={(e) => setMatRegistered(e.target.checked)}
                    />
                    Registered for Municipal Accommodation Tax
                  </label>
                </div>
              </div>
            )}
            
            {municipality === 'newmarket' && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Newmarket MAT Requirements (By-law 2024-68)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={collectsMAT}
                      onChange={(e) => setCollectsMAT(e.target.checked)}
                    />
                    Collect 4% MAT on stays under 28 days
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={matSeparateLine}
                      onChange={(e) => setMatSeparateLine(e.target.checked)}
                    />
                    Show MAT as separate line item
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={quarterlyRemittance}
                      onChange={(e) => setQuarterlyRemittance(e.target.checked)}
                    />
                    File quarterly MAT remittance (within 15 days)
                  </label>
                </div>
              </div>
            )}
        </div>
      )}

      {municipality === 'hamilton' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Hamilton: Rules based on draft framework - confirm against final enacted by-law
          </p>
        </div>
      )}
      
      {municipality === 'richmond_hill' && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            📝 Richmond Hill: Background study only - not enforceable by-law
          </p>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Property'}
        </button>
      </div>
    </form>
  )
}