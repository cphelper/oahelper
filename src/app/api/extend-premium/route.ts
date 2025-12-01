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

const COST_PER_DAY = 3.5

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{ user_id: string | number; days: number }>(request)

  if (!input || !input.user_id || !input.days) {
    return errorResponse('Missing required fields', 400, request)
  }

  const { user_id, days } = input

  if (days <= 0) {
    return errorResponse('Days must be a positive number', 400, request)
  }

  const totalCost = days * COST_PER_DAY

  try {
    // Get user
    const { data: user } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', Number(user_id))
      .maybeSingle()

    if (!user) {
      return errorResponse('User not found', 404, request)
    }

    const currentBalance = user.oacoins || 0

    if (currentBalance < totalCost) {
      return jsonResponse(
        {
          status: 'error',
          message: 'Insufficient OACoins balance',
          data: {
            current_balance: currentBalance,
            required: totalCost,
            shortage: totalCost - currentBalance,
          },
        },
        400,
        request
      )
    }

    // Check for active subscription
    const now = new Date().toISOString()
    const { data: subscriptions } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)

    if (!subscriptions || subscriptions.length === 0) {
      return errorResponse('No active premium subscription found', 400, request)
    }

    const subscription = subscriptions[0]

    // Deduct coins
    const newBalance = currentBalance - totalCost
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({ oacoins: newBalance, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Calculate new end date
    const currentEndDate = new Date(subscription.end_date)
    currentEndDate.setDate(currentEndDate.getDate() + days)
    const newEndDate = currentEndDate.toISOString()

    // Extend subscription
    const { error: extendError } = await supabaseAdmin
      .from('premium_subscriptions')
      .update({ end_date: newEndDate, updated_at: new Date().toISOString() })
      .eq('id', subscription.id)

    if (extendError) {
      // Rollback
      await supabaseAdmin.from('Users').update({ oacoins: currentBalance }).eq('id', user.id)
      throw extendError
    }

    // Log transaction
    await supabaseAdmin.from('oacoins_transactions').insert({
      user_id: user.id,
      amount: totalCost,
      transaction_type: 'debit',
      description: `Premium subscription extended by ${days} day(s)`,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    })

    return jsonResponse(
      {
        status: 'success',
        message: 'Premium subscription extended successfully',
        data: {
          days_extended: days,
          coins_deducted: totalCost,
          new_balance: newBalance,
          new_end_date: newEndDate,
        },
      },
      200,
      request
    )
  } catch (error) {
    console.error('Extend premium error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
