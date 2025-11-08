export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Supabase URL:</h3>
            <p className="text-sm text-gray-600 break-all">
              {supabaseUrl || 'Not set'}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">Supabase Anon Key:</h3>
            <p className="text-sm text-gray-600 break-all">
              {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not set'}
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Status:</h3>
            <p className={`text-sm ${supabaseUrl && supabaseKey ? 'text-green-600' : 'text-red-600'}`}>
              {supabaseUrl && supabaseKey ? '✅ Environment variables are loaded' : '❌ Environment variables missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}