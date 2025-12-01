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

function getPlanDetails(amount: number) {
  if (amount >= 999) return { type: 'yearly', name: 'Yearly Plan', duration: 365 }
  if (amount >= 299) return { type: 'unlimited', name: 'Unlimited Plan', duration: 45 }
  if (amount >= 199) return { type: 'pro', name: 'Pro Plan', duration: 30 }
  return { type: 'basic', name: 'Basic Plan', duration: 30 }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    user_id: string | number
    amount: number
    plan_type: string
  }>(request)

  if (!input || !input.user_id || !input.amount || !input.plan_type) {
    return errorResponse('Missing required fields', 400, request)
  }

  const { user_id, amount, plan_type } = input

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

    if (currentBalance < amount) {
      return jsonResponse(
        {
          status: 'error',
          message: 'Insufficient OACoins balance',
          data: {
            current_balance: currentBalance,
            required: amount,
            shortage: amount - currentBalance,
          },
        },
        400,
        request
      )
    }

    // Deduct coins
    const newBalance = currentBalance - amount
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({ oacoins: newBalance, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Get plan details
    const planDetails = getPlanDetails(amount)
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000).toISOString()

    // Create subscription
    const { error: subError } = await supabaseAdmin.from('premium_subscriptions').insert({
      user_id: user.id,
      subscription_type: planDetails.type,
      amount,
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      payment_method: 'oacoins',
      created_at: startDate,
      updated_at: startDate,
    })

    if (subError) {
      // Rollback
      await supabaseAdmin.from('Users').update({ oacoins: currentBalance }).eq('id', user.id)
      throw subError
    }

    // Log transaction
    await supabaseAdmin.from('oacoins_transactions').insert({
      user_id: user.id,
      amount,
      transaction_type: 'debit',
      description: `Premium subscription purchase: ${planDetails.name}`,
      balance_after: newBalance,
      created_at: startDate,
    })

    return jsonResponse(
      {
        status: 'success',
        message: 'Premium subscription activated successfully',
        data: {
          plan: planDetails.name,
          end_date: endDate,
          coins_deducted: amount,
          new_balance: newBalance,
        },
      },
      200,
      request
    )
  } catch (error) {
    console.error('OACoins payment error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
