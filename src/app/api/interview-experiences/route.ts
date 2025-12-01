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

  try {
    if (action === 'get_all') {
      const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10))
      const offset = Math.max(0, Number(searchParams.get('offset')) || 0)
      const search = searchParams.get('search')?.trim()

      let query = supabaseAdmin
        .from('InterviewExperiences')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')

      if (search) {
        query = query.or(
          `company.ilike.%${search}%,role.ilike.%${search}%,college.ilike.%${search}%,experience.ilike.%${search}%`
        )
      }

      const { data: experiences, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const formattedExperiences = (experiences || []).map((exp) => ({
        ...exp,
        timestamp: exp.created_at
          ? new Date(exp.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : null,
      }))

      return jsonResponse(
        {
          status: 'success',
          data: formattedExperiences,
          count: formattedExperiences.length,
          total: count || 0,
          offset,
          limit,
          hasMore: offset + limit < (count || 0),
          search: search || '',
        },
        200,
        request
      )
    }

    if (action === 'get_unverified') {
      const { data: experiences, error } = await supabaseAdmin
        .from('InterviewExperiences')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          data: experiences || [],
          count: experiences?.length || 0,
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Interview experiences GET error:', error)
    return errorResponse('Server error', 500, request)
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<Record<string, unknown>>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const action = (input.action as string) || new URL(request.url).searchParams.get('action')

  try {
    if (action === 'submit') {
      const required = ['company', 'role', 'college', 'interview_type', 'result', 'experience', 'user_email']
      for (const field of required) {
        if (!input[field]) {
          return errorResponse(`Field '${field}' is required`, 400, request)
        }
      }

      const userEmail = input.user_email as string
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail)) {
        return errorResponse('Invalid email address', 400, request)
      }

      const { data: result, error } = await supabaseAdmin
        .from('InterviewExperiences')
        .insert({
          company: input.company,
          role: input.role,
          college: input.college,
          interview_date: input.interview_date || null,
          interview_type: input.interview_type,
          result: input.result,
          difficulty: input.difficulty || null,
          rounds: input.rounds || null,
          topics_asked: input.topics_asked || null,
          experience: input.experience,
          user_email: userEmail,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          message: 'Thank you! Your experience is under review. You will earn OACoins once verified.',
          id: result?.id,
        },
        200,
        request
      )
    }

    if (action === 'verify_experience') {
      const experienceId = input.experience_id as number
      if (!experienceId) {
        return errorResponse('Experience ID is required', 400, request)
      }

      const { data: experience, error: fetchError } = await supabaseAdmin
        .from('InterviewExperiences')
        .select('*')
        .eq('id', experienceId)
        .maybeSingle()

      if (fetchError || !experience || !experience.user_email) {
        return errorResponse('Experience not found or no user email associated', 404, request)
      }

      const { error: updateError } = await supabaseAdmin
        .from('InterviewExperiences')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', experienceId)

      if (updateError) throw updateError

      const oacoinsAmount = Number(input.oacoins_amount) || 0
      if (oacoinsAmount > 0) {
        const { data: user } = await supabaseAdmin
          .from('Users')
          .select('id, oacoins')
          .eq('email', experience.user_email)
          .maybeSingle()

        if (user) {
          const newBalance = (user.oacoins || 0) + oacoinsAmount
          await supabaseAdmin
            .from('Users')
            .update({ oacoins: newBalance, updated_at: new Date().toISOString() })
            .eq('id', user.id)

          return jsonResponse(
            {
              status: 'success',
              message: `Experience verified successfully and ${oacoinsAmount} OACoins added to user account`,
            },
            200,
            request
          )
        }

        return jsonResponse(
          {
            status: 'success',
            message: 'Experience verified successfully but user not found for OACoins reward',
          },
          200,
          request
        )
      }

      return jsonResponse({ status: 'success', message: 'Experience verified successfully' }, 200, request)
    }

    if (action === 'delete_experience') {
      const experienceId = input.experience_id as number
      if (!experienceId) {
        return errorResponse('Experience ID is required', 400, request)
      }

      const { error } = await supabaseAdmin.from('InterviewExperiences').delete().eq('id', experienceId)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Experience deleted successfully' }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Interview experiences POST error:', error)
    return errorResponse('Server error', 500, request)
  }
}
