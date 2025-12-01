import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

interface ResetPasswordInput {
  email: string
  password: string
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

  const input = await getJsonBody<ResetPasswordInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email, password } = input

  if (!email?.trim() || !password) {
    return errorResponse('Please provide both email and password.', 400, request)
  }

  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters long.', 400, request)
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

  // Check if reset code exists and hasn't expired
  if (!user.password_reset_code || !user.password_reset_expires) {
    return errorResponse(
      'Password reset code has expired or is invalid. Please request a new code.',
      400,
      request
    )
  }

  const expiresAt = new Date(user.password_reset_expires).getTime()
  if (expiresAt < Date.now()) {
    return errorResponse(
      'Password reset code has expired or is invalid. Please request a new code.',
      400,
      request
    )
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update password
  const { error: updateError } = await supabaseAdmin
    .from('Users')
    .update({
      password: hashedPassword,
      password_reset_code: null,
      password_reset_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return errorResponse('Failed to update password. Please try again.', 500, request)
  }

  return jsonResponse(
    {
      status: 'success',
      message: 'Password has been successfully updated. You can now login with your new password.',
    },
    200,
    request
  )
}
