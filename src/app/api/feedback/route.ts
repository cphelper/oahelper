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

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action !== 'get_feedback') {
    return errorResponse('Invalid action', 400, request)
  }

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.max(1, Number(searchParams.get('limit')) || 20)
  const status = searchParams.get('status')
  const feedbackType = searchParams.get('feedback_type')
  const offset = (page - 1) * limit

  try {
    let query = supabaseAdmin.from('feedback').select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType)
    }

    const { data: feedback, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return jsonResponse(
      {
        status: 'success',
        data: {
          feedback: feedback || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        },
      },
      200,
      request
    )
  } catch (error) {
    console.error('Feedback GET error:', error)
    return errorResponse('Internal server error', 500, request)
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    action: string
    user_id?: string
    user_email?: string
    feedback_type: string
    feedback_text: string
    page_url?: string
    user_agent?: string
  }>(request)

  if (!input) {
    return errorResponse('Invalid JSON input', 400, request)
  }

  const { action } = input

  if (action !== 'submit_feedback') {
    return errorResponse('Invalid action', 400, request)
  }

  const { feedback_type, feedback_text, user_id, user_email, page_url, user_agent } = input

  if (!feedback_type || !feedback_text) {
    return errorResponse('Missing required fields', 400, request)
  }

  const allowedTypes = ['general', 'bug', 'feature', 'improvement', 'code_editor', 'test_cases']
  if (!allowedTypes.includes(feedback_type)) {
    return errorResponse('Invalid feedback type', 400, request)
  }

  if (feedback_text.length < 10) {
    return errorResponse('Feedback text must be at least 10 characters long', 400, request)
  }

  if (feedback_text.length > 2000) {
    return errorResponse('Feedback text must be less than 2000 characters', 400, request)
  }

  try {
    const { error } = await supabaseAdmin.from('feedback').insert({
      user_id,
      user_email,
      feedback_type,
      feedback_text: feedback_text.trim(),
      page_url,
      user_agent,
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    return jsonResponse(
      { status: 'success', message: 'Feedback submitted successfully' },
      200,
      request
    )
  } catch (error) {
    console.error('Feedback POST error:', error)
    return errorResponse('Internal server error', 500, request)
  }
}
