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
      // Fetch DSA sheet questions from QuestionClassifications where dsasheet = true
      const { data, error } = await supabaseAdmin
        .from('QuestionClassifications')
        .select(`
          question_id,
          lc_level,
          primary_topic,
          dsasheet_section,
          topics,
          created_at
        `)
        .eq('dsasheet', true)
        .order('primary_topic', { ascending: true })
        .order('lc_level', { ascending: true })

      if (error) throw error

      // Get question details for each classification
      const questionIds = (data || []).map((d) => d.question_id)
      
      const { data: questionsData } = await supabaseAdmin
        .from('Questions')
        .select('id, title, problem_statement, lc_tags, company_id')
        .in('id', questionIds)

      // Get company names
      const companyIds = [...new Set((questionsData || []).map((q) => q.company_id).filter(Boolean))]
      const { data: companiesData } = await supabaseAdmin
        .from('Companies')
        .select('id, name')
        .in('id', companyIds)

      const companyMap: Record<number, string> = {}
      companiesData?.forEach((c) => {
        companyMap[c.id] = c.name
      })

      type QuestionData = { id: number; title: string; problem_statement: string; lc_tags: unknown; company_id: number }
      const questionMap: Record<number, QuestionData> = {}
      questionsData?.forEach((q) => {
        questionMap[q.id] = q as QuestionData
      })

      const questions = (data || []).map((row) => {
        const q = questionMap[row.question_id] || {}

        let lcTags = q.lc_tags || []
        if (typeof lcTags === 'string') {
          try {
            lcTags = JSON.parse(lcTags)
          } catch {
            lcTags = []
          }
        }

        let topics = row.topics || []
        if (typeof topics === 'string') {
          try {
            topics = JSON.parse(topics)
          } catch {
            topics = []
          }
        }

        return {
          id: q.id || null,
          title: q.title || null,
          problem_statement: q.problem_statement || null,
          lc_tags: lcTags,
          company_id: q.company_id || null,
          company_name: q.company_id ? companyMap[q.company_id] || null : null,
          lc_level: row.lc_level,
          primary_topic: row.primary_topic,
          dsasheet_section: row.dsasheet_section,
          created_at: row.created_at,
          topics: Array.isArray(topics) ? topics : row.primary_topic ? [row.primary_topic] : [],
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
          Companies (name),
          QuestionClassifications (
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
        const c = (row.Companies as unknown as Record<string, unknown>) || {}
        const qcArray = row.QuestionClassifications || []
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
