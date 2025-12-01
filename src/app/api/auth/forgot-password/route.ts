import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

interface ForgotPasswordInput {
  email: string
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<ForgotPasswordInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email } = input

  if (!email?.trim()) {
    return errorResponse('Please provide your email address.', 400, request)
  }

  // Validate email format and ensure it's Gmail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) || !email.toLowerCase().endsWith('@gmail.com')) {
    return errorResponse('Please use a valid Gmail address (@gmail.com)', 400, request)
  }

  // Get user
  const { data: user, error } = await supabaseAdmin
    .from('Users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error || !user) {
    return errorResponse('No account found with this email address.', 404, request)
  }

  if (!user.verified) {
    return errorResponse('Please verify your email first before resetting password.', 403, request)
  }

  // Generate 4-digit verification code
  const verificationCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  // Update user with reset code
  const { error: updateError } = await supabaseAdmin
    .from('Users')
    .update({
      password_reset_code: verificationCode,
      password_reset_expires: expiry,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return errorResponse('Failed to generate temporary password. Please try again.', 500, request)
  }

  // Send password reset email
  const emailSent = await sendPasswordResetEmail(user.email, verificationCode)

  if (!emailSent) {
    return errorResponse('Failed to send password reset email. Please try again.', 500, request)
  }

  return jsonResponse(
    {
      status: 'success',
      message:
        'A verification code has been sent to your email. Please check your inbox and use it to reset your password.',
    },
    200,
    request
  )
}
