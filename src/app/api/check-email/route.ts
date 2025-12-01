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

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{ email: string }>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email } = input

  if (!email?.trim()) {
    return errorResponse('Please provide email address.', 400, request)
  }

  // Validate email format and ensure it's Gmail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) || !email.toLowerCase().endsWith('@gmail.com')) {
    return errorResponse('Please use a valid Gmail address (@gmail.com)', 400, request)
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('name, verified')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (!user) {
    return jsonResponse(
      {
        status: 'available',
        message: 'Email is available for registration',
        action: 'signup',
      },
      200,
      request
    )
  }

  if (user.verified) {
    return jsonResponse(
      {
        status: 'exists_verified',
        message: 'This email is already registered and verified. Please login instead.',
        action: 'login',
        user_name: user.name,
      },
      200,
      request
    )
  }

  return jsonResponse(
    {
      status: 'exists_unverified',
      message: 'This email is already registered but not verified. Please verify your email.',
      action: 'verify',
      user_name: user.name,
    },
    200,
    request
  )
}
