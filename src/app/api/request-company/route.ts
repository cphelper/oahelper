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
  const check = searchParams.get('check')
  const companyName = searchParams.get('company')

  try {
    if (action === 'get_requests') {
      const { data: requests } = await supabaseAdmin
        .from('company_requests')
        .select('*')
        .order('requested_at', { ascending: false })

      return jsonResponse({ status: 'success', data: requests || [] }, 200, request)
    }

    if (check && companyName) {
      const { data: company } = await supabaseAdmin
        .from('Companies')
        .select('id, name')
        .ilike('name', companyName.trim())
        .maybeSingle()

      if (company) {
        const { count } = await supabaseAdmin
          .from('Questions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)

        return jsonResponse(
          {
            status: 'found',
            company: { id: company.id, name: company.name, question_count: count || 0 },
          },
          200,
          request
        )
      }

      return jsonResponse({ status: 'not_found', message: 'Company not found' }, 200, request)
    }

    return errorResponse('Invalid GET request parameters', 400, request)
  } catch (error) {
    console.error('Request company GET error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    company_name: string
    user_email?: string
    user_id?: string | number
  }>(request)

  if (!input || !input.company_name?.trim()) {
    return errorResponse('Company name is required', 400, request)
  }

  const companyName = input.company_name.trim()

  try {
    // Check if company already exists
    const { data: existingCompany } = await supabaseAdmin
      .from('Companies')
      .select('id, name')
      .ilike('name', companyName)
      .maybeSingle()

    if (existingCompany) {
      const { count } = await supabaseAdmin
        .from('Questions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', existingCompany.id)

      return jsonResponse(
        {
          status: 'found',
          message: 'Company already exists!',
          company: { id: existingCompany.id, name: existingCompany.name, question_count: count || 0 },
        },
        200,
        request
      )
    }

    // Check if already requested
    const { data: existingRequest } = await supabaseAdmin
      .from('company_requests')
      .select('*')
      .ilike('company_name', companyName)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRequest) {
      return jsonResponse(
        {
          status: 'already_requested',
          message: 'This company has already been requested!',
          request: existingRequest,
        },
        200,
        request
      )
    }

    // Create new request
    const { data: newRequest, error } = await supabaseAdmin
      .from('company_requests')
      .insert({
        company_name: companyName,
        user_email: input.user_email || null,
        user_id: input.user_id || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return jsonResponse(
      {
        status: 'success',
        message: 'Company request submitted successfully!',
        request_id: newRequest?.id,
      },
      200,
      request
    )
  } catch (error) {
    console.error('Request company POST error:', error)
    return errorResponse('Failed to submit company request', 500, request)
  }
}

export async function PUT(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{
    action: string
    request_id: number
    status?: string
    admin_notes?: string
    approval_type?: string
  }>(request)

  if (!input || input.action !== 'update_status' || !input.request_id) {
    return errorResponse('Action and request_id are required', 400, request)
  }

  try {
    const { error } = await supabaseAdmin
      .from('company_requests')
      .update({
        status: input.status,
        admin_notes: input.admin_notes || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', input.request_id)

    if (error) throw error

    return jsonResponse(
      { status: 'success', message: 'Company request status updated successfully' },
      200,
      request
    )
  } catch (error) {
    console.error('Request company PUT error:', error)
    return errorResponse('Failed to update company request', 500, request)
  }
}

export async function DELETE(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{ action: string; request_id: number }>(request)

  if (!input || input.action !== 'delete' || !input.request_id) {
    return errorResponse('Invalid delete request', 400, request)
  }

  try {
    const { error } = await supabaseAdmin
      .from('company_requests')
      .delete()
      .eq('id', input.request_id)

    if (error) throw error

    return jsonResponse(
      { status: 'success', message: 'Company request deleted successfully' },
      200,
      request
    )
  } catch (error) {
    console.error('Request company DELETE error:', error)
    return errorResponse('Failed to delete company request', 500, request)
  }
}
