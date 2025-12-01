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

async function getUser(userId: string | number) {
  if (!isNaN(Number(userId))) {
    const { data } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', Number(userId))
      .maybeSingle()
    return data
  }
  const { data } = await supabaseAdmin
    .from('Users')
    .select('*')
    .eq('email', userId)
    .maybeSingle()
  return data
}

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'get_user_by_email') {
    const email = searchParams.get('email')
    if (!email) {
      return errorResponse('Email is required', 400, request)
    }

    const { data: user } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (!user) {
      return errorResponse('User not found with this email', 404, request)
    }

    return jsonResponse(
      {
        status: 'success',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          oacoins: user.oacoins || 0,
          verified: user.verified ? 1 : 0,
          created_at: user.created_at,
        },
      },
      200,
      request
    )
  }

  return errorResponse('Invalid action', 400, request)
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    action: string
    user_id?: string | number
    amount?: number
    reason?: string
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { action, user_id, amount, reason } = input

  try {
    if (action === 'get_balance') {
      if (!user_id) {
        return errorResponse('User ID is required', 400, request)
      }

      const user = await getUser(user_id)
      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      return jsonResponse({ status: 'success', oacoins: user.oacoins || 0 }, 200, request)
    }

    if (action === 'add_coins') {
      if (!user_id || !amount || amount <= 0) {
        return errorResponse('Valid user ID and positive amount are required', 400, request)
      }

      const user = await getUser(user_id)
      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      const oldBalance = user.oacoins || 0
      const newBalance = oldBalance + amount

      const { error } = await supabaseAdmin
        .from('Users')
        .update({ oacoins: newBalance, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      // Record transaction
      await supabaseAdmin.from('oacoins_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: 'credit',
        description: reason || 'Admin reward for community contribution',
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      })

      return jsonResponse(
        {
          status: 'success',
          message: 'Coins added successfully and notification sent',
          new_balance: newBalance,
          email_sent: true,
        },
        200,
        request
      )
    }

    if (action === 'deduct_coins') {
      if (!user_id || !amount || amount <= 0) {
        return errorResponse('Valid user ID and positive amount are required', 400, request)
      }

      const user = await getUser(user_id)
      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      const currentBalance = user.oacoins || 0
      if (currentBalance < amount) {
        return jsonResponse(
          {
            status: 'error',
            message: 'Insufficient coins',
            current_balance: currentBalance,
          },
          400,
          request
        )
      }

      const newBalance = currentBalance - amount

      const { error } = await supabaseAdmin
        .from('Users')
        .update({ oacoins: newBalance, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      // Record transaction
      await supabaseAdmin.from('oacoins_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: 'debit',
        description: 'Admin deduction',
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      })

      return jsonResponse(
        {
          status: 'success',
          message: 'Coins deducted successfully',
          new_balance: newBalance,
        },
        200,
        request
      )
    }

    if (action === 'set_coins') {
      if (!user_id || amount === undefined || amount < 0) {
        return errorResponse('Valid user ID and non-negative amount are required', 400, request)
      }

      const user = await getUser(user_id)
      if (!user) {
        return errorResponse('User not found', 404, request)
      }

      const { error } = await supabaseAdmin
        .from('Users')
        .update({ oacoins: amount, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          message: 'Coins set successfully',
          new_balance: amount,
        },
        200,
        request
      )
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('OACoins API error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
