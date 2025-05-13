
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request for authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get the request body
    const requestData = await req.json()
    const { email } = requestData

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get the authenticated user's information
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // In a production environment, this would use a service like SendGrid, Mailgun, or Resend
    // For this example, we're simulating the email sending process
    
    // Generate a unique invitation token (in production, store this in a database table)
    const invitationToken = crypto.randomUUID()
    
    // Build the invitation URL (frontend would handle this route)
    const invitationUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`
    
    console.log(`Sending invitation email to: ${email}`)
    console.log(`Invitation URL: ${invitationUrl}`)
    console.log(`Invited by user: ${user.email}`)
    
    // In production: Store invitation in database
    // const { error: inviteError } = await supabaseClient
    //   .from('team_invitations')
    //   .insert({
    //     email,
    //     invited_by: user.id,
    //     token: invitationToken,
    //     expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    //   })
    
    // In production: Send actual email using a service
    // await emailService.send({
    //   to: email,
    //   from: 'no-reply@yourdomain.com',
    //   subject: 'Invitation to join our team',
    //   html: `<p>You've been invited to join our team. <a href="${invitationUrl}">Click here to accept</a></p>`
    // })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        // In production, don't expose the token in the response
        debug: { invitationUrl } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in send-invitation function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
