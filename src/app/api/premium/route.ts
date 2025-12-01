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

interface PlanDetails {
  type: string
  daily_limit: number
  name: string
  duration: string
}

function getPlanDetails(amount: number, planType?: string | null): PlanDetails {
  if (planType) {
    const type = planType.toLowerCase()
    if (type === 'yearly') return { type: 'yearly', daily_limit: -1, name: 'Yearly Plan', duration: '+1 year' }
    if (type === 'unlimited') return { type: 'unlimited', daily_limit: -1, name: 'Unlimited Plan', duration: '+45 days' }
    if (type === 'pro') return { type: 'pro', daily_limit: 15, name: 'Pro Plan', duration: '+30 days' }
    if (type === 'basic') return { type: 'basic', daily_limit: 5, name: 'Basic Plan', duration: '+30 days' }
  }

  if (amount >= 999) return { type: 'yearly', daily_limit: -1, name: 'Yearly Plan', duration: '+1 year' }
  if (amount >= 299) return { type: 'unlimited', daily_limit: -1, name: 'Unlimited Plan', duration: '+45 days' }
  if (amount >= 199) return { type: 'pro', daily_limit: 15, name: 'Pro Plan', duration: '+30 days' }
  return { type: 'basic', daily_limit: 5, name: 'Basic Plan', duration: '+30 days' }
}

async function getUserPremiumStatus(userId: string | number) {
  let legacyId = userId
  if (typeof userId === 'string' && isNaN(Number(userId))) {
    const { data: user } = await supabaseAdmin
      .from('Users')
      .select('id')
      .eq('email', userId)
      .maybeSingle()
    if (user) legacyId = user.id
    else return null
  }

  const now = new Date().toISOString()
  const { data: subscriptions } = await supabaseAdmin
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', legacyId)
    .eq('status', 'active')
    .gt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(1)

  return subscriptions && subscriptions.length > 0 ? subscriptions[0] : null
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
    if (action === 'check_premium_status') {
      const userId = searchParams.get('user_id')
      if (!userId) return errorResponse('User ID is required', 400, request)

      const premiumStatus = await getUserPremiumStatus(userId)
      return jsonResponse(
        {
          status: 'success',
          message: 'Premium status retrieved',
          data: {
            is_premium: premiumStatus !== null,
            subscription: premiumStatus,
          },
        },
        200,
        request
      )
    }

    if (action === 'check_question_access') {
      const userId = searchParams.get('user_id')
      const companyId = searchParams.get('company_id')
      if (!userId || !companyId) {
        return errorResponse('User ID and Company ID are required', 400, request)
      }

      const premiumStatus = await getUserPremiumStatus(userId)
      const isPremium = premiumStatus !== null

      const { data: access } = await supabaseAdmin
        .from('user_question_access')
        .select('questions_accessed')
        .eq('user_id', userId)
        .eq('company_id', Number(companyId))
        .maybeSingle()

      return jsonResponse(
        {
          status: 'success',
          message: 'Question access retrieved',
          data: {
            is_premium: isPremium,
            questions_accessed: access?.questions_accessed || 1,
            can_access_all: isPremium,
          },
        },
        200,
        request
      )
    }

    if (action === 'get_payment_requests') {
      const { data: requests } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .order('submitted_at', { ascending: false })

      return jsonResponse(
        { status: 'success', message: 'Payment requests retrieved', data: requests || [] },
        200,
        request
      )
    }

    if (action === 'get_premium_users') {
      const { data: subs } = await supabaseAdmin
        .from('premium_subscriptions')
        .select('*')
        .eq('status', 'active')
        .order('end_date', { ascending: false })

      if (!subs) {
        return jsonResponse({ status: 'success', message: 'Premium users retrieved', data: [] }, 200, request)
      }

      const userIds = [...new Set(subs.map((s) => s.user_id))]
      const { data: users } = await supabaseAdmin.from('Users').select('id, name, email').in('id', userIds)

      const userMap: Record<number, { name: string; email: string }> = {}
      users?.forEach((u) => {
        userMap[u.id] = { name: u.name, email: u.email }
      })

      const enrichedSubs = subs.map((sub) => ({
        ...sub,
        user_name: userMap[sub.user_id]?.name || 'Unknown',
        user_email: userMap[sub.user_id]?.email || 'Unknown',
      }))

      return jsonResponse(
        { status: 'success', message: 'Premium users retrieved', data: enrichedSubs },
        200,
        request
      )
    }

    if (action === 'get_premium_stats') {
      const { data: subscriptions } = await supabaseAdmin
        .from('premium_subscriptions')
        .select('*')
        .eq('status', 'active')

      if (!subscriptions) {
        return jsonResponse(
          {
            status: 'success',
            message: 'Premium stats retrieved',
            data: {
              total_subscribers: 0,
              total_revenue: 0,
              plan_breakdown: {},
              monthly_stats: {},
              daily_stats: {},
            },
          },
          200,
          request
        )
      }

      let totalRevenue = 0
      const planBreakdown: Record<string, { count: number; revenue: number }> = {
        basic: { count: 0, revenue: 0 },
        pro: { count: 0, revenue: 0 },
        unlimited: { count: 0, revenue: 0 },
        yearly: { count: 0, revenue: 0 },
      }
      const monthlyStats: Record<string, { count: number; revenue: number }> = {}
      const dailyStats: Record<string, { count: number; revenue: number; types: Record<string, number> }> = {}
      const processedUsers = new Set<number>()

      for (const row of subscriptions) {
        processedUsers.add(row.user_id)
        totalRevenue += row.amount || 0

        let planType = row.subscription_type
        if (!planType) {
          const details = getPlanDetails(row.amount || 0, null)
          planType = details.type
        }

        if (planBreakdown[planType]) {
          planBreakdown[planType].count++
          planBreakdown[planType].revenue += row.amount || 0
        }

        const createdDate = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        const monthKey = createdDate.substring(0, 7)

        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { count: 0, revenue: 0 }
        }
        monthlyStats[monthKey].count++
        monthlyStats[monthKey].revenue += row.amount || 0

        if (!dailyStats[createdDate]) {
          dailyStats[createdDate] = {
            count: 0,
            revenue: 0,
            types: { basic: 0, pro: 0, unlimited: 0, yearly: 0 },
          }
        }
        dailyStats[createdDate].count++
        dailyStats[createdDate].revenue += row.amount || 0
        if (dailyStats[createdDate].types[planType] !== undefined) {
          dailyStats[createdDate].types[planType]++
        }
      }

      return jsonResponse(
        {
          status: 'success',
          message: 'Premium stats retrieved',
          data: {
            total_subscribers: processedUsers.size,
            total_revenue: totalRevenue,
            plan_breakdown: planBreakdown,
            monthly_stats: monthlyStats,
            daily_stats: dailyStats,
          },
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Premium GET error:', error)
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

  const action = (input.action as string) || new URL(request.url).searchParams.get('action')

  try {
    if (action === 'submit_payment') {
      const requiredFields = ['user_id', 'user_email', 'user_name', 'amount', 'payment_method']
      for (const field of requiredFields) {
        if (!input[field]) {
          return errorResponse(`Missing required field: ${field}`, 400, request)
        }
      }

      const userId = input.user_id as string | number
      const userEmail = input.user_email as string
      const userName = input.user_name as string
      const amount = Number(input.amount)
      const paymentMethod = input.payment_method as string
      const planType = input.plan_type as string | undefined
      const utrNumber = input.utr_number as string | undefined
      const paymentDetails = input.payment_details as string | undefined
      const paymentScreenshot = input.payment_screenshot as string | undefined
      const autoApprove = input.auto_approve === true

      let legacyId = userId
      if (typeof userId === 'string' && isNaN(Number(userId))) {
        const { data: user } = await supabaseAdmin
          .from('Users')
          .select('id')
          .eq('email', userId)
          .maybeSingle()
        if (user) legacyId = user.id
      }

      const { error: insertError } = await supabaseAdmin.from('payment_requests').insert({
        user_id: legacyId,
        user_email: userEmail,
        user_name: userName,
        amount,
        payment_method: paymentMethod,
        plan_type: planType,
        utr_number: utrNumber,
        payment_details: paymentDetails,
        payment_screenshot: paymentScreenshot,
        status: autoApprove ? 'approved' : 'pending',
        submitted_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      if (autoApprove) {
        const planDetails = getPlanDetails(amount, planType)
        const startDate = new Date().toISOString()
        const endDate = new Date(Date.now() + parseDuration(planDetails.duration)).toISOString()

        await supabaseAdmin.from('premium_subscriptions').insert({
          user_id: Number(legacyId),
          subscription_type: planDetails.type,
          amount,
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          created_at: startDate,
          updated_at: startDate,
        })
      }

      return jsonResponse(
        {
          status: 'success',
          message: autoApprove
            ? 'Payment verified automatically. Premium subscription activated instantly!'
            : 'Payment request submitted successfully',
          data: { auto_approved: autoApprove },
        },
        200,
        request
      )
    }

    if (action === 'update_question_access') {
      const userId = input.user_id as number
      const companyId = input.company_id as number
      if (!userId || !companyId) {
        return errorResponse('User ID and Company ID are required', 400, request)
      }

      const { data: existing } = await supabaseAdmin
        .from('user_question_access')
        .select('questions_accessed')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle()

      const currentAccess = existing?.questions_accessed || 0
      const newAccess = currentAccess + 1

      await supabaseAdmin.from('user_question_access').upsert({
        user_id: String(userId),
        company_id: companyId,
        questions_accessed: newAccess,
        updated_at: new Date().toISOString(),
      })

      return jsonResponse(
        {
          status: 'success',
          message: 'Question access updated',
          data: { questions_accessed: newAccess },
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Premium POST error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}

function parseDuration(duration: string): number {
  if (duration.includes('year')) return 365 * 24 * 60 * 60 * 1000
  if (duration.includes('45')) return 45 * 24 * 60 * 60 * 1000
  return 30 * 24 * 60 * 60 * 1000
}
