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
  const limit = Math.min(60, Math.max(1, Number(searchParams.get('limit')) || 12))
  const minQuestions = Number(searchParams.get('min_questions')) || 0
  const search = searchParams.get('search')?.trim()

  try {
    let query = supabaseAdmin
      .from('company_insights')
      .select('*')
      .order('question_count', { ascending: false })
      .order('company_name', { ascending: true })
      .limit(limit)

    if (minQuestions > 0) {
      query = query.gte('question_count', minQuestions)
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,canonical_name.ilike.%${search}%`)
    }

    const { data: insights, error } = await query

    if (error) throw error

    return jsonResponse({ status: 'success', data: insights || [] }, 200, request)
  } catch (error) {
    console.error('Company insights error:', error)
    return errorResponse('Failed to fetch insights', 500, request)
  }
}
