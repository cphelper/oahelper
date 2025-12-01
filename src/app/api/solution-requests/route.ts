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

async function getUserDailyLimit(userId: string | number): Promise<number> {
  const now = new Date().toISOString()
  const { data: subscriptions } = await supabaseAdmin
    .from('premium_subscriptions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(1)

  if (!subscriptions || subscriptions.length === 0) return 0

  const amount = subscriptions[0].amount || 0
  if (amount >= 299) return -1 // Unlimited
  if (amount >= 199) return 15 // Pro
  return 5 // Basic
}

async function getDailyRequestCount(userId: string | number, date: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('user_daily_requests')
    .select('request_count')
    .eq('user_id', String(userId))
    .eq('request_date', date)
    .maybeSingle()

  return data?.request_count || 0
}

async function incrementDailyRequestCount(userId: string | number, date: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('user_daily_requests')
    .select('id, request_count')
    .eq('user_id', String(userId))
    .eq('request_date', date)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from('user_daily_requests')
      .update({ request_count: existing.request_count + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabaseAdmin.from('user_daily_requests').insert({
      user_id: String(userId),
      request_date: date,
      request_count: 1,
    })
  }
}

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
    if (action === 'get_daily_request_count') {
      const userId = searchParams.get('user_id')
      if (!userId) return errorResponse('User ID is required', 400, request)

      const today = new Date().toISOString().split('T')[0]
      const dailyLimit = await getUserDailyLimit(userId)
      const requestCount = await getDailyRequestCount(userId, today)
      const remainingRequests = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - requestCount)

      return jsonResponse(
        {
          status: 'success',
          message: 'Daily request count retrieved',
          data: {
            request_count: requestCount,
            remaining_requests: remainingRequests,
            daily_limit: dailyLimit,
            is_unlimited: dailyLimit === -1,
            reset_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          },
        },
        200,
        request
      )
    }

    if (action === 'get_solution') {
      const userId = searchParams.get('user_id')
      const questionId = searchParams.get('question_id')

      if (!userId || !questionId) {
        return errorResponse('User ID and Question ID are required', 400, request)
      }

      // Check premium status
      const now = new Date().toISOString()
      const { data: subscription } = await supabaseAdmin
        .from('premium_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', now)
        .maybeSingle()

      if (!subscription) {
        return errorResponse('Premium subscription required to access solution codes', 403, request)
      }

      // Check if already viewed
      const { data: existingView } = await supabaseAdmin
        .from('user_solution_views')
        .select('id, view_count')
        .eq('user_id', userId)
        .eq('question_id', Number(questionId))
        .maybeSingle()

      const hasViewedBefore = !!existingView

      // Check daily limit if not viewed before
      if (!hasViewedBefore) {
        const today = new Date().toISOString().split('T')[0]
        const dailyLimit = await getUserDailyLimit(userId)
        const requestCount = await getDailyRequestCount(userId, today)

        if (dailyLimit !== -1 && requestCount >= dailyLimit) {
          return errorResponse(
            `Daily limit reached. Your plan allows up to ${dailyLimit} solution codes per day.`,
            403,
            request
          )
        }
      }

      // Get solution
      const { data: question } = await supabaseAdmin
        .from('Questions')
        .select('solution_cpp, company_id')
        .eq('id', Number(questionId))
        .maybeSingle()

      if (!question || !question.solution_cpp) {
        return errorResponse('Solution not available for this question', 404, request)
      }

      // Update counts
      if (!hasViewedBefore) {
        const today = new Date().toISOString().split('T')[0]
        await incrementDailyRequestCount(userId, today)

        await supabaseAdmin.from('user_solution_views').insert({
          user_id: userId,
          question_id: Number(questionId),
          company_id: question.company_id,
          view_count: 1,
          last_viewed_at: new Date().toISOString(),
        })
      } else {
        await supabaseAdmin
          .from('user_solution_views')
          .update({
            view_count: (existingView.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString(),
          })
          .eq('id', existingView.id)
      }

      return jsonResponse(
        {
          status: 'success',
          message: 'Solution retrieved successfully',
          data: { solution: question.solution_cpp },
        },
        200,
        request
      )
    }

    if (action === 'get_requests') {
      const { data: requests } = await supabaseAdmin
        .from('solution_requests')
        .select('*')
        .order('created_at', { ascending: false })

      return jsonResponse(
        { status: 'success', message: 'Solution requests retrieved', data: requests || [] },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Solution requests GET error:', error)
    return errorResponse('An error occurred', 500, request)
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

  const action = new URL(request.url).searchParams.get('action')

  try {
    if (action === 'request_solution') {
      const { user_id, question_id, company_id, requested_language } = input

      if (!user_id || !question_id || !company_id) {
        return errorResponse('Missing required fields', 400, request)
      }

      // Check premium
      const now = new Date().toISOString()
      const { data: subscription } = await supabaseAdmin
        .from('premium_subscriptions')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .gt('end_date', now)
        .maybeSingle()

      if (!subscription) {
        return errorResponse('Premium subscription required to request solution codes', 403, request)
      }

      const today = new Date().toISOString().split('T')[0]

      // Check daily limit
      const dailyLimit = await getUserDailyLimit(user_id as string)
      const requestCount = await getDailyRequestCount(user_id as string, today)

      if (dailyLimit !== -1 && requestCount >= dailyLimit) {
        return errorResponse(
          `Daily limit reached. Your plan allows up to ${dailyLimit} solution codes per day.`,
          403,
          request
        )
      }

      // Check if already requested today
      const { count } = await supabaseAdmin
        .from('solution_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('question_id', question_id)
        .eq('request_date', today)

      if (count && count > 0) {
        return errorResponse('You have already requested the solution for this question today.', 400, request)
      }

      // Create request
      await supabaseAdmin.from('solution_requests').insert({
        user_id,
        question_id,
        company_id,
        request_date: today,
        requested_language: requested_language || 'cpp',
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      await incrementDailyRequestCount(user_id as string, today)

      return jsonResponse(
        {
          status: 'success',
          message: 'Solution request submitted successfully. Admin will review and send the code.',
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Solution requests POST error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
