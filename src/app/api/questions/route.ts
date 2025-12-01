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
  const action = searchParams.get('action')

  try {
    if (action === 'get_question') {
      const id = searchParams.get('id')
      if (!id) {
        return errorResponse('Question ID is required', 400, request)
      }

      const { data: question } = await supabaseAdmin
        .from('Questions')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle()

      if (!question) {
        return errorResponse('Question not found', 404, request)
      }

      // Get company name
      let companyName = 'Unknown Company'
      if (question.company_id) {
        const { data: company } = await supabaseAdmin
          .from('Companies')
          .select('name')
          .eq('id', question.company_id)
          .maybeSingle()
        companyName = company?.name || 'Unknown Company'
      }

      return jsonResponse(
        {
          status: 'success',
          data: { ...question, company_name: companyName },
        },
        200,
        request
      )
    }

    if (action === 'get_questions_by_company') {
      const companyId = searchParams.get('company_id')
      if (!companyId) {
        return errorResponse('Company ID is required', 400, request)
      }

      const { data: questions } = await supabaseAdmin
        .from('Questions')
        .select('id, title, premium_required, company_id')
        .eq('company_id', Number(companyId))
        .order('created_at', { ascending: false })

      // Get company name
      const { data: company } = await supabaseAdmin
        .from('Companies')
        .select('name')
        .eq('id', Number(companyId))
        .maybeSingle()

      const companyName = company?.name || 'Unknown Company'

      const enrichedQuestions = (questions || []).map((q) => ({
        ...q,
        company_name: companyName,
      }))

      return jsonResponse({ status: 'success', data: enrichedQuestions }, 200, request)
    }

    if (action === 'get_question_by_title') {
      const title = searchParams.get('title')
      if (!title) {
        return errorResponse('Question title is required', 400, request)
      }

      const { data: question } = await supabaseAdmin
        .from('Questions')
        .select('*')
        .eq('title', title)
        .maybeSingle()

      if (!question) {
        return errorResponse(`Question not found with title: ${title}`, 404, request)
      }

      // Get company name
      let companyName = 'Unknown Company'
      if (question.company_id) {
        const { data: company } = await supabaseAdmin
          .from('Companies')
          .select('name')
          .eq('id', question.company_id)
          .maybeSingle()
        companyName = company?.name || 'Unknown Company'
      }

      return jsonResponse(
        {
          status: 'success',
          data: { ...question, company_name: companyName },
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Questions API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
