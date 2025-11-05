// supabase/functions/send-welcome-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const FROM_EMAIL = Deno.env.get('FROM_EMAIL') 
const FROM_NAME = Deno.env.get('FROM_NAME') || 'College Portal'
const LOGIN_URL = Deno.env.get('LOGIN_URL')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  email: string
  firstName: string
  userCode: string
  tempPassword: string
  onboardingId: string
}

serve(async (req) => {
  console.log('Request method:', req.method)
  console.log('Timestamp:', new Date().toISOString())

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody: WelcomeEmailRequest = await req.json()

    const { email, firstName, userCode, tempPassword, onboardingId } = requestBody

    // Validate required fields
    if (!email || !firstName || !userCode || !tempPassword || !onboardingId) {
      const missing = []
      if (!email) missing.push('email')
      if (!firstName) missing.push('firstName')
      if (!userCode) missing.push('userCode')
      if (!tempPassword) missing.push('tempPassword')
      if (!onboardingId) missing.push('onboardingId')
      
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }


    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Prepare email data
    const emailData = {
      sender: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      to: [
        {
          email: email,
          name: firstName
        }
      ],
      subject: 'Welcome to College Portal - Your Account Details',
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to College Portal</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to ${FROM_NAME}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.5;">
                          Dear <strong>${firstName}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.5;">
                          Your account has been successfully created! Below are your login credentials to access the College Portal.
                        </p>
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f8f9fa; border-radius: 8px; border: 2px solid #e9ecef;">
                          <tr>
                            <td style="padding: 20px;">
                              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 10px 0; font-weight: bold; color: #495057; font-size: 14px; width: 40%;">User Code:</td>
                                  <td style="padding: 10px 0; color: #212529; font-size: 16px; font-family: 'Courier New', monospace; font-weight: bold;">${userCode}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; font-weight: bold; color: #495057; font-size: 14px;">Email:</td>
                                  <td style="padding: 10px 0; color: #212529; font-size: 16px;">${email}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; font-weight: bold; color: #495057; font-size: 14px;">Temporary Password:</td>
                                  <td style="padding: 10px 0; color: #212529; font-size: 16px; font-family: 'Courier New', monospace; font-weight: bold;">${tempPassword}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                          <p style="margin: 0 0 10px; font-weight: bold; color: #856404; font-size: 16px;">⚠️ Important Security Notice</p>
                          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                            For your security, you will be required to change this temporary password when you log in for the first time. Please keep your credentials confidential.
                          </p>
                        </div>
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${LOGIN_URL}" 
                                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Login to Your Account
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 0; font-size: 14px; color: #666666; line-height: 1.5;">
                          If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                        <p style="margin: 20px 0 0; font-size: 14px; color: #666666; line-height: 1.5;">
                          Best regards,<br>
                          <strong>${FROM_NAME} Team</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; font-size: 12px; color: #6c757d;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #6c757d;">
                          © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Brevo API error response:', errorText)
      
      // Try to parse as JSON
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
        console.error('Brevo API error details:', errorDetails)
      } catch {
        console.error('Brevo API raw error:', errorText)
      }
      
      // Mark email as failed in database
      await supabase
        .from('user_onboarding')
        .update({
          welcome_email_failed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingId)
      
      throw new Error(`Brevo API error (${res.status}): ${errorText}`)
    }

    const responseData = await res.json()

    // Update onboarding record - email delivered
    const { error: updateError } = await supabase
      .from('user_onboarding')
      .update({
        welcome_email_delivered: true,
        welcome_email_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', onboardingId)

    if (updateError) {
      console.error('Database update error:', updateError)
    } else {
      console.log('Database updated successfully')
    }


    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: responseData.messageId,
        message: 'Welcome email sent successfully via Brevo' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('EMAIL FUNCTION FAILED')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})