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
  const userId = searchParams.get('user_id')

  if (action === 'get_solved_count') {
    if (!userId) {
      return errorResponse('Missing user_id', 400, request)
    }

    const { count } = await supabaseAdmin
      .from('user_solved_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return jsonResponse({ status: 'success', count: count || 0 }, 200, request)
  }

  return errorResponse('Invalid action', 400, request)
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
    question_id?: number
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { action, user_id, question_id } = input

  if (action === 'mark_solved') {
    if (!user_id || !question_id) {
      return errorResponse('Missing user_id or question_id', 400, request)
    }

    // Check if already solved
    const { data: existing } = await supabaseAdmin
      .from('user_solved_questions')
      .select('id')
      .eq('user_id', user_id)
      .eq('question_id', question_id)
      .maybeSingle()

    if (existing) {
      return jsonResponse(
        { status: 'success', message: 'Question already marked as solved' },
        200,
        request
      )
    }

    const { error } = await supabaseAdmin.from('user_solved_questions').insert({
      user_id,
      question_id,
      solved_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Mark solved error:', error)
      return errorResponse('Failed to mark question as solved', 500, request)
    }

    return jsonResponse({ status: 'success', message: 'Question marked as solved' }, 200, request)
  }

  return errorResponse('Invalid action', 400, request)
}
