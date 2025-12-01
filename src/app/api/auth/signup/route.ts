import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

interface SignupInput {
  name: string
  email: string
  password: string
  college: string
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

  const input = await getJsonBody<SignupInput>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { name, email, password, college } = input

  if (!name?.trim() || !email?.trim() || !password || !college?.trim()) {
    return errorResponse('Please fill in all fields.', 400, request)
  }

  // Validate email format and ensure it's Gmail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) || !email.toLowerCase().endsWith('@gmail.com')) {
    return errorResponse('Please use a valid Gmail address (@gmail.com)', 400, request)
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Check if email is banned
  const { data: banned } = await supabaseAdmin
    .from('banned_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (banned) {
    return errorResponse('This email address has been banned from the platform.', 403, request)
  }

  // Check if email already exists
  const { data: existingUser } = await supabaseAdmin
    .from('Users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingUser) {
    return errorResponse('Email is already registered. Please use a different email.', 400, request)
  }

  // Generate 4-digit verification code
  const verificationCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const { data: newUser, error } = await supabaseAdmin
    .from('Users')
    .insert({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      college: college.trim(),
      role: 'user',
      verified: false,
      verification_code: verificationCode,
      oacoins: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !newUser) {
    console.error('Signup error:', error)
    return errorResponse('Registration failed. Please try again.', 500, request)
  }

  // Send verification email
  const emailSent = await sendVerificationEmail(normalizedEmail, verificationCode)

  if (!emailSent) {
    return errorResponse('Failed to send verification email. Please try again.', 500, request)
  }

  return jsonResponse(
    {
      status: 'success',
      message: 'Registration successful! Please check your email for the verification code.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        verified: false,
      },
      requires_verification: true,
    },
    200,
    request
  )
}
