import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // Check if user profile exists, create if not
        const { data: existingUser } = await (supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single as any)()

        if (!existingUser) {
          // Create user profile
          const userData: Database['public']['Tables']['users']['Insert'] = {
            id: data.user.id,
            email: data.user.email!,
            plan: 'free',
          }
          const { error: profileError } = await (supabase
            .from('users')
            .insert as any)(userData)

          if (profileError) {
            console.error('Error creating user profile:', profileError)
            // Don't fail the auth flow for this
          }
        }

        // Redirect to dashboard
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=Authentication failed`)
    }
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/signin`)
}