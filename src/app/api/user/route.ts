import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return errorResponse('User ID is required', 400, request)
  }

  let user = null

  if (!isNaN(Number(userId))) {
    const { data } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', Number(userId))
      .maybeSingle()
    user = data
  } else {
    // Try by email
    const { data } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('email', userId)
      .maybeSingle()
    user = data
  }

  if (!user) {
    return errorResponse('User not found', 404, request)
  }

  return jsonResponse(
    {
      status: 'success',
      message: 'User data retrieved',
      user: {
        id: user.id,
        uuid: String(user.id),
        name: user.name,
        email: user.email,
        oacoins: user.oacoins || 0,
      },
    },
    200,
    request
  )
}
