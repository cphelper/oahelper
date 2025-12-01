import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

interface VerifyCodeInput {
  email: string
  code: string
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

  const input = await getJsonBody<VerifyCodeInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email, code } = input

  if (!email?.trim() || !code?.trim()) {
    return errorResponse('Please provide both email and verification code.', 400, request)
  }

  // Validate code format (4 digits)
  if (!/^\d{4}$/.test(code)) {
    return errorResponse('Verification code must be 4 digits.', 400, request)
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

  const { password_reset_code, password_reset_expires, verified, verification_code } = user

  // Check if this is a password reset request
  if (password_reset_code && password_reset_expires) {
    const expiresAt = new Date(password_reset_expires).getTime()
    if (expiresAt > Date.now()) {
      if (code !== password_reset_code) {
        return errorResponse('Invalid verification code. Please check and try again.', 400, request)
      }

      return jsonResponse(
        {
          status: 'success',
          message: 'Verification code is valid. You can now reset your password.',
          reset_verified: true,
          user_id: user.id,
        },
        200,
        request
      )
    }
  }

  // Check if this is for email verification (signup verification)
  if (!verified && verification_code) {
    if (code !== verification_code) {
      return errorResponse('Invalid verification code. Please check and try again.', 400, request)
    }

    // Update user as verified
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({
        verified: true,
        verification_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return errorResponse('Failed to verify email. Please try again.', 500, request)
    }

    return jsonResponse(
      {
        status: 'success',
        message: 'Email verified successfully! You can now login.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          verified: true,
        },
      },
      200,
      request
    )
  }

  return errorResponse(
    'Invalid verification code or code has expired. Please request a new code.',
    400,
    request
  )
}
