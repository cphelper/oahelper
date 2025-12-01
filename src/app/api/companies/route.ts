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
  const id = searchParams.get('id')

  try {
    // Search companies
    if (action === 'search') {
      const searchTerm = searchParams.get('q')?.trim()
      if (!searchTerm) {
        return jsonResponse({ status: 'success', data: [] }, 200, request)
      }

      const { data: companies } = await supabaseAdmin
        .from('Companies')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('date', { ascending: false })
        .order('name', { ascending: true })
        .limit(50)

      if (!companies) {
        return jsonResponse({ status: 'success', data: [] }, 200, request)
      }

      // Get question counts
      const companyIds = companies.map((c) => c.id)
      const { data: questionCounts } = await supabaseAdmin
        .from('Questions')
        .select('company_id')
        .in('company_id', companyIds)

      const countMap: Record<number, number> = {}
      questionCounts?.forEach((q) => {
        countMap[q.company_id] = (countMap[q.company_id] || 0) + 1
      })

      const enrichedCompanies = companies.map((c) => ({
        ...c,
        question_count: countMap[c.id] || 0,
        recent_questions: [],
      }))

      return jsonResponse({ status: 'success', data: enrichedCompanies }, 200, request)
    }

    // Get single company by ID
    if (id) {
      const { data: company } = await supabaseAdmin
        .from('Companies')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle()

      if (!company) {
        return errorResponse('Company not found.', 404, request)
      }

      // Get question count
      const { count } = await supabaseAdmin
        .from('Questions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      // Get recent questions
      const { data: recentQuestions } = await supabaseAdmin
        .from('Questions')
        .select('title')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(2)

      return jsonResponse(
        {
          status: 'success',
          data: {
            ...company,
            question_count: count || 0,
            recent_questions: recentQuestions?.map((q) => q.title) || [],
          },
        },
        200,
        request
      )
    }

    // List companies with pagination
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    // Get total count
    const { count: totalCompanies } = await supabaseAdmin
      .from('Companies')
      .select('*', { count: 'exact', head: true })

    // Get companies
    const { data: companies } = await supabaseAdmin
      .from('Companies')
      .select('*')
      .order('date', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (!companies) {
      return jsonResponse(
        { status: 'success', data: [], hasMore: false, total: 0, page, limit },
        200,
        request
      )
    }

    // Get question counts
    const companyIds = companies.map((c) => c.id)
    const { data: questionCounts } = await supabaseAdmin
      .from('Questions')
      .select('company_id')
      .in('company_id', companyIds)

    const countMap: Record<number, number> = {}
    questionCounts?.forEach((q) => {
      countMap[q.company_id] = (countMap[q.company_id] || 0) + 1
    })

    const enrichedCompanies = companies.map((c) => ({
      ...c,
      question_count: countMap[c.id] || 0,
      recent_questions: [],
    }))

    return jsonResponse(
      {
        status: 'success',
        data: enrichedCompanies,
        hasMore: offset + limit < (totalCompanies || 0),
        total: totalCompanies || 0,
        page,
        limit,
      },
      200,
      request
    )
  } catch (error) {
    console.error('Companies API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    action?: string
    company_id?: number
    name?: string
    question_id?: number
    title?: string
    problem_statement?: string
    solution_cpp?: string
    updates?: Record<string, unknown>
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { action } = input

  try {
    if (action === 'update') {
      const { company_id, name } = input
      if (!company_id || !name) {
        return errorResponse('Company ID and name are required', 400, request)
      }

      const { error } = await supabaseAdmin
        .from('Companies')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', company_id)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Company updated successfully' }, 200, request)
    }

    if (action === 'delete') {
      const { company_id } = input
      if (!company_id) {
        return errorResponse('Company ID is required', 400, request)
      }

      // Delete question images first
      const { data: questions } = await supabaseAdmin
        .from('Questions')
        .select('id')
        .eq('company_id', company_id)

      if (questions) {
        const questionIds = questions.map((q) => q.id)
        await supabaseAdmin.from('questionimages').delete().in('question_id', questionIds)
      }

      // Delete questions
      await supabaseAdmin.from('Questions').delete().eq('company_id', company_id)

      // Delete company
      const { error } = await supabaseAdmin.from('Companies').delete().eq('id', company_id)

      if (error) throw error

      return jsonResponse(
        { status: 'success', message: 'Company and all its questions deleted successfully' },
        200,
        request
      )
    }

    if (action === 'update_question') {
      const { question_id, title, problem_statement, solution_cpp } = input
      if (!question_id || !title || !problem_statement) {
        return errorResponse('Question ID, title, and problem statement are required', 400, request)
      }

      const updateData: Record<string, unknown> = {
        title,
        problem_statement,
        solution_cpp,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabaseAdmin.from('Questions').update(updateData).eq('id', question_id)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Question updated successfully' }, 200, request)
    }

    if (action === 'delete_question') {
      const { question_id } = input
      if (!question_id) {
        return errorResponse('Question ID is required', 400, request)
      }

      await supabaseAdmin.from('questionimages').delete().eq('question_id', question_id)
      const { error } = await supabaseAdmin.from('Questions').delete().eq('id', question_id)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Question deleted successfully' }, 200, request)
    }

    if (action === 'update_question_fields') {
      const { question_id, updates } = input
      if (!question_id || !updates) {
        return errorResponse('Question ID and updates are required', 400, request)
      }

      const allowedFields = [
        'title',
        'problem_statement',
        'solution_cpp',
        'solution_python',
        'solution_java',
        'input_test_case',
        'output_test_case',
        'question_type',
        'difficulty',
        'premium_required',
        'pregiven_code_cpp',
        'pregiven_code_python',
        'pregiven_code_java',
      ]

      const validUpdates: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          validUpdates[key] = value
        }
      }

      if (Object.keys(validUpdates).length === 0) {
        return errorResponse('No valid fields to update', 400, request)
      }

      validUpdates.updated_at = new Date().toISOString()

      const { error } = await supabaseAdmin.from('Questions').update(validUpdates).eq('id', question_id)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Question updated successfully' }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Companies POST error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
