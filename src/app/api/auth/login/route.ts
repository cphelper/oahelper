import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPassword, createSession } from '@/lib/auth'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'
import crypto from 'crypto'

interface LoginInput {
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

  const input = await getJsonBody<LoginInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { email, password } = input

  if (!email?.trim() || !password) {
    return errorResponse('Please fill in all fields.', 400, request)
  }

  // Check if email is banned
  const { data: banned } = await supabaseAdmin
    .from('banned_emails')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (banned) {
    return errorResponse('This email address has been banned from the platform.', 403, request)
  }

  // Get user from Users table
  const { data: user, error } = await supabaseAdmin
    .from('Users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error || !user) {
    return errorResponse('Invalid credentials.', 401, request)
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return errorResponse('Invalid credentials.', 401, request)
  }

  // Check verification status
  if (!user.verified) {
    return errorResponse(
      'Please verify your email before logging in. Check your email for the verification code.',
      403,
      request
    )
  }

  // Create session
  await createSession(user.id)

  // Generate access token
  const accessToken = 'custom-session-' + crypto.randomBytes(16).toString('hex')

  return jsonResponse(
    {
      status: 'success',
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified ? 1 : 0,
        used_temp_password: false,
        oacoins: user.oacoins || 0,
        uuid: String(user.id),
        token: accessToken,
      },
    },
    200,
    request
  )
}
