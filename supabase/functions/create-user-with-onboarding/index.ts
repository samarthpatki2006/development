// supabase/functions/create-user-with-onboarding/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  first_name: string
  last_name: string
  email: string
  user_type: string
  college_id: string
  user_code: string
  temp_password: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting create-user-with-onboarding function')
    
    // Parse request body
    let requestBody: CreateUserRequest
    try {
      requestBody = await req.json()
      console.log('Request received:', { email: requestBody.email, user_type: requestBody.user_type })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid request body')
    }

    const { 
      first_name, 
      last_name, 
      email, 
      user_type, 
      college_id, 
      user_code, 
      temp_password 
    } = requestBody

    // Validate required fields
    if (!first_name || !last_name || !email || !user_type || !college_id || !user_code || !temp_password) {
      const missing = []
      if (!first_name) missing.push('first_name')
      if (!last_name) missing.push('last_name')
      if (!email) missing.push('email')
      if (!user_type) missing.push('user_type')
      if (!college_id) missing.push('college_id')
      if (!user_code) missing.push('user_code')
      if (!temp_password) missing.push('temp_password')
      
      console.error('Missing required fields:', missing)
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // CRITICAL: Check if user already exists and clear their sessions
    console.log('Checking for existing user with email:', email)
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      console.log('Existing user found:', existingUser.id, '- Clearing all sessions')
      
      // Sign out all sessions for this user
      try {
        await supabase.auth.admin.signOut(existingUser.id)
        console.log('All sessions cleared for user:', existingUser.id)
      } catch (signOutError) {
        console.warn('Error signing out user (may not have active sessions):', signOutError)
        // Continue anyway - this is not critical
      }

      // Delete the existing auth user to start fresh
      console.log('Deleting existing auth user to recreate with new password')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
      
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError)
        throw new Error(`Failed to delete existing user: ${deleteError.message}`)
      }

      // Delete associated profile and onboarding records (cascade should handle this, but be explicit)
      await supabase.from('user_profiles').delete().eq('id', existingUser.id)
      await supabase.from('user_onboarding').delete().eq('user_id', existingUser.id)
      
      console.log('Existing user data cleaned up successfully')
    }

    console.log('Creating auth user for:', email)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temp_password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
        user_type: user_type,
        college_id: college_id,
        user_code: user_code
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      console.error('No user data returned from auth.admin.createUser')
      throw new Error('Failed to create user account - no user data returned')
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Create user profile
    console.log('Creating user profile...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        college_id: college_id,
        user_code: user_code,
        user_type: user_type,
        first_name: first_name,
        last_name: last_name,
        email: email,
        is_active: true
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    console.log('User profile created successfully')

    // Create onboarding record
    console.log('Creating onboarding record...')
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding')
      .insert({
        user_id: authData.user.id,
        college_id: college_id,
        temp_password: temp_password,
        welcome_email_sent: false,
        welcome_email_delivered: false,
        welcome_email_opened: false,
        welcome_email_failed: false,
        first_login_completed: false,
        password_reset_required: true,
        onboarding_completed: false
      })
      .select()
      .single()

    if (onboardingError) {
      console.error('Onboarding creation error:', onboardingError)
      throw new Error(`Failed to create onboarding record: ${onboardingError.message}`)
    }

    console.log('Onboarding record created successfully:', onboardingData.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: authData.user.id,
        onboarding_id: onboardingData.id,
        message: existingUser 
          ? 'User recreated successfully with new temporary password' 
          : 'User created successfully',
        was_existing_user: !!existingUser
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-user-with-onboarding function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})