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

  const input = await getJsonBody<{
    question_id?: number
    user_id?: string | number
    user_email?: string
    issue_type: string
    description: string
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { question_id, user_id, user_email, issue_type, description } = input

  if (!issue_type || !description?.trim()) {
    return errorResponse('Issue type and description are required', 400, request)
  }

  try {
    const { error } = await supabaseAdmin.from('issues').insert({
      question_id: question_id || null,
      user_id: user_id || null,
      user_email: user_email || null,
      issue_text: description.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    return jsonResponse(
      { status: 'success', message: 'Issue reported successfully' },
      200,
      request
    )
  } catch (error) {
    console.error('Report issue error:', error)
    return errorResponse('Failed to report issue', 500, request)
  }
}

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  try {
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return jsonResponse({ status: 'success', data: issues || [] }, 200, request)
  } catch (error) {
    console.error('Get issues error:', error)
    return errorResponse('Failed to fetch issues', 500, request)
  }
}
