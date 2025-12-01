import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashPassword, verifyPassword } from '@/lib/auth'
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

  const input = await getJsonBody<{
    action: string
    user_id?: string | number
    name?: string
    current_password?: string
    new_password?: string
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { action, user_id } = input

  try {
    if (action === 'update_profile') {
      const { name } = input
      if (!name || !user_id) {
        return errorResponse('Name and user ID are required', 400, request)
      }

      // Get user
      const { data: user } = await supabaseAdmin
        .from('Users')
        .select('id')
        .eq('id', Number(user_id))
        .maybeSingle()

      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      const { error } = await supabaseAdmin
        .from('Users')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      return jsonResponse(
        { status: 'success', message: 'Profile updated successfully' },
        200,
        request
      )
    }

    if (action === 'change_password') {
      const { current_password, new_password } = input
      if (!current_password || !new_password || !user_id) {
        return errorResponse(
          'Current password, new password, and user ID are required',
          400,
          request
        )
      }

      // Get user with password
      const { data: user } = await supabaseAdmin
        .from('Users')
        .select('id, password')
        .eq('id', Number(user_id))
        .maybeSingle()

      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      // Verify current password
      const isValid = await verifyPassword(current_password, user.password)
      if (!isValid) {
        return errorResponse('Current password is incorrect', 401, request)
      }

      // Hash new password
      const hashedPassword = await hashPassword(new_password)

      const { error } = await supabaseAdmin
        .from('Users')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      return jsonResponse(
        { status: 'success', message: 'Password changed successfully' },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Profile API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
