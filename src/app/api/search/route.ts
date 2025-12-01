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
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return errorResponse('No search query provided', 400, request)
  }

  try {
    // Search companies
    const { data: companies } = await supabaseAdmin
      .from('Companies')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('date', { ascending: false })
      .order('name', { ascending: true })
      .limit(10)

    if (!companies || companies.length === 0) {
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
    }))

    // Sort: exact match first, then starts with, then contains
    const lowerQuery = query.toLowerCase()
    enrichedCompanies.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()

      const aScore = aName === lowerQuery ? 1 : aName.startsWith(lowerQuery) ? 2 : 3
      const bScore = bName === lowerQuery ? 1 : bName.startsWith(lowerQuery) ? 2 : 3

      if (aScore !== bScore) return aScore - bScore
      return aName.localeCompare(bName)
    })

    return jsonResponse({ status: 'success', data: enrichedCompanies }, 200, request)
  } catch (error) {
    console.error('Search API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
