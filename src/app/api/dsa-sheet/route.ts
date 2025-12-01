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
    if (action === 'get_dsa_sheet_questions') {
      // Fetch DSA sheet questions with related data
      const { data, error } = await supabaseAdmin
        .from('dsasheetcurated')
        .select(`
          lc_level,
          primary_topic,
          dsasheet_section,
          created_at,
          questions (
            id,
            title,
            problem_statement,
            lc_tags,
            company_id,
            companies (name)
          )
        `)
        .order('primary_topic', { ascending: true })
        .order('lc_level', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error

      const questions = (data || []).map((row) => {
        const q = (row.questions as unknown as Record<string, unknown>) || {}
        const c = ((q.companies as unknown as Record<string, unknown>) || {})

        let lcTags = q.lc_tags || []
        if (typeof lcTags === 'string') {
          try {
            lcTags = JSON.parse(lcTags)
          } catch {
            lcTags = []
          }
        }

        return {
          id: q.id || null,
          title: q.title || null,
          problem_statement: q.problem_statement || null,
          lc_tags: lcTags,
          company_id: q.company_id || null,
          company_name: c.name || null,
          lc_level: row.lc_level,
          primary_topic: row.primary_topic,
          dsasheet_section: row.dsasheet_section,
          created_at: row.created_at,
          topics: row.primary_topic ? [row.primary_topic] : [],
        }
      })

      return jsonResponse(
        {
          status: 'success',
          data: questions,
          count: questions.length,
        },
        200,
        request
      )
    }

    if (action === 'get_all_questions') {
      const page = Math.max(1, Number(searchParams.get('page')) || 1)
      const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
      const offset = (page - 1) * limit

      // Get total count
      const { count: totalCount } = await supabaseAdmin
        .from('Questions')
        .select('*', { count: 'exact', head: true })

      // Fetch questions with classifications
      const { data, error } = await supabaseAdmin
        .from('Questions')
        .select(`
          id,
          title,
          problem_statement,
          lc_tags,
          company_id,
          companies (name),
          questionclassifications (
            lc_level,
            primary_topic,
            dsasheet_section,
            topics
          )
        `)
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const questions = (data || []).map((row) => {
        const c = (row.companies as unknown as Record<string, unknown>) || {}
        const qcArray = row.questionclassifications || []
        const qcRaw = Array.isArray(qcArray) ? qcArray[0] || {} : qcArray
        const qc = qcRaw as unknown as Record<string, unknown>

        let lcTags = row.lc_tags || []
        if (typeof lcTags === 'string') {
          try {
            lcTags = JSON.parse(lcTags)
          } catch {
            lcTags = []
          }
        }

        let topics = qc.topics || []
        if (typeof topics === 'string') {
          try {
            topics = JSON.parse(topics)
          } catch {
            topics = []
          }
        }

        const primaryTopic = (qc.primary_topic as string) || 'Array'
        if (!Array.isArray(topics) || topics.length === 0) {
          topics = primaryTopic ? [primaryTopic] : []
        }

        return {
          id: row.id,
          title: row.title,
          problem_statement: row.problem_statement,
          lc_tags: lcTags,
          company_id: row.company_id,
          company_name: c.name || null,
          lc_level: qc.lc_level || 'Medium',
          primary_topic: primaryTopic,
          dsasheet_section: qc.dsasheet_section || null,
          topics,
          created_at: null,
        }
      })

      const hasMore = offset + limit < (totalCount || 0)

      return jsonResponse(
        {
          status: 'success',
          data: questions,
          count: questions.length,
          total: totalCount || 0,
          page,
          limit,
          has_more: hasMore,
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('DSA Sheet API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
