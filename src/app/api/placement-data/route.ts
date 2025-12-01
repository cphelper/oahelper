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
      const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10))
      const offset = Math.max(0, Number(searchParams.get('offset')) || 0)
      const search = searchParams.get('search')?.trim()

      let query = supabaseAdmin
        .from('PlacementData')
        .select('*', { count: 'exact' })
        .eq('verified', true)

      if (search) {
        query = query.or(`college.ilike.%${search}%,company.ilike.%${search}%,role.ilike.%${search}%`)
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          data: data || [],
          count: data?.length || 0,
          total: count || 0,
          offset,
          limit,
          has_more: offset + limit < (count || 0),
          search: search || '',
        },
        200,
        request
      )
    }

    if (action === 'get_unverified') {
      const { data } = await supabaseAdmin
        .from('PlacementData')
        .select('*')
        .eq('verified', false)
        .order('created_at', { ascending: false })

      return jsonResponse(
        { status: 'success', data: data || [], count: data?.length || 0 },
        200,
        request
      )
    }

    if (action === 'get_colleges') {
      const { data } = await supabaseAdmin
        .from('PlacementData')
        .select('college')
        .order('college', { ascending: true })

      const colleges = [...new Set((data || []).map((d) => d.college).filter(Boolean))]
      return jsonResponse({ status: 'success', data: colleges }, 200, request)
    }

    if (action === 'get_companies') {
      const { data } = await supabaseAdmin
        .from('PlacementData')
        .select('company')
        .order('company', { ascending: true })

      const companies = [...new Set((data || []).map((d) => d.company).filter(Boolean))]
      return jsonResponse({ status: 'success', data: companies }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Placement data GET error:', error)
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
      const required = ['college', 'company', 'role', 'user_email']
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
        .from('PlacementData')
        .insert({
          timestamp: new Date().toISOString(),
          college: input.college,
          company: input.company,
          role: input.role,
          oa_date: input.oa_date || null,
          oa_time: input.oa_time || null,
          cgpa_criteria: input.cgpa_criteria || null,
          mtech_eligible: input.mtech_eligible || null,
          ctc_base: input.ctc_base || null,
          other_info: input.other_info || null,
          user_email: userEmail,
          verified: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          message: 'Thank you! Your submission is under review.',
          id: result?.id,
        },
        200,
        request
      )
    }

    if (action === 'verify_placement') {
      const placementId = input.placement_id as number
      if (!placementId) {
        return errorResponse('Placement ID is required', 400, request)
      }

      const { data: placement } = await supabaseAdmin
        .from('PlacementData')
        .select('*')
        .eq('id', placementId)
        .maybeSingle()

      if (!placement || !placement.user_email) {
        return errorResponse('Placement not found or no user email', 404, request)
      }

      const { error: updateError } = await supabaseAdmin
        .from('PlacementData')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('id', placementId)

      if (updateError) throw updateError

      const oacoinsAmount = Number(input.oacoins_amount) || 0
      if (oacoinsAmount > 0) {
        const { data: user } = await supabaseAdmin
          .from('Users')
          .select('id, oacoins')
          .eq('email', placement.user_email)
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
              message: `Placement verified and ${oacoinsAmount} OACoins added`,
            },
            200,
            request
          )
        }
      }

      return jsonResponse({ status: 'success', message: 'Placement verified successfully' }, 200, request)
    }

    if (action === 'delete_placement') {
      const placementId = input.placement_id as number
      if (!placementId) {
        return errorResponse('Placement ID is required', 400, request)
      }

      const { error } = await supabaseAdmin.from('PlacementData').delete().eq('id', placementId)

      if (error) throw error

      return jsonResponse({ status: 'success', message: 'Placement deleted successfully' }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Placement data POST error:', error)
    return errorResponse('Server error', 500, request)
  }
}
