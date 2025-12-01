import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/email'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

interface ResendCodeInput {
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

  const input = await getJsonBody<ResendCodeInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email } = input

  if (!email?.trim()) {
    return errorResponse('Please provide email address.', 400, request)
  }

  // Get user
  const { data: user, error } = await supabaseAdmin
    .from('Users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error || !user) {
    return errorResponse('No user found with this email.', 404, request)
  }

  if (user.verified) {
    return errorResponse('Email is already verified. You can login now.', 400, request)
  }

  // Generate new 4-digit verification code
  const verificationCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  // Update user with new code
  const { error: updateError } = await supabaseAdmin
    .from('Users')
    .update({
      verification_code: verificationCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return errorResponse('Failed to generate new code. Please try again.', 500, request)
  }

  // Send verification email
  const emailSent = await sendVerificationEmail(user.email, verificationCode)

  if (!emailSent) {
    return errorResponse('Failed to send verification email. Please try again.', 500, request)
  }

  return jsonResponse(
    {
      status: 'success',
      message: 'New verification code sent to your email!',
    },
    200,
    request
  )
}
