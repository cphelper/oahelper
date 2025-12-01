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

const GEMINI_API_KEY = 'AIzaSyDVDPAnrKCXDJRC5b9I2KEODS5uMT3veRU'

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

  if (action === 'get_chat_history') {
    const limit = Math.max(1, Number(searchParams.get('limit')) || 100)
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

    try {
      const { data: chats, count } = await supabaseAdmin
        .from('ChatHistory')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return jsonResponse(
        { status: 'success', data: chats || [], total: count || 0 },
        200,
        request
      )
    } catch (error) {
      console.error('Chat history error:', error)
      return errorResponse('Failed to fetch chat history', 500, request)
    }
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
    message: string
    user_id?: number
    is_logged_in?: boolean
    is_premium?: boolean
    user_email?: string
    premium_plan?: string
    premium_amount?: number
    premium_expiry?: string
    daily_limit?: number
    conversation_history?: Array<{ role: string; content: string }>
    oacoins_balance?: number
    session_id?: string
  }>(request)

  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const { message: userMessage } = input
  if (!userMessage?.trim()) {
    return errorResponse('Message is required', 400, request)
  }

  // Build user context
  let userContext = '\n\n=== USER CONTEXT ===\n'
  if (input.is_logged_in) {
    userContext += `User Status: Logged In\nUser ID: ${input.user_id}\n`
    if (input.user_email) userContext += `User Email: ${input.user_email}\n`
    userContext += `OACoins Balance: ${input.oacoins_balance || 0} coins\n`

    if (input.is_premium) {
      userContext += 'Premium Status: ACTIVE (User has premium access)\n'
      if (input.premium_plan) userContext += `Premium Plan Type: ${input.premium_plan.toUpperCase()}\n`
      if (input.premium_amount) userContext += `Plan Amount Paid: ₹${input.premium_amount}\n`
      if (input.premium_expiry) {
        const expiryDate = new Date(input.premium_expiry).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const daysLeft = Math.max(
          0,
          Math.floor((new Date(input.premium_expiry).getTime() - Date.now()) / 86400000)
        )
        userContext += `Premium Expires On: ${expiryDate} (${daysLeft} days remaining)\n`
      }
      if (input.daily_limit) {
        userContext +=
          input.daily_limit === -1 || input.daily_limit >= 999
            ? 'Daily Solution Limit: Unlimited\n'
            : `Daily Solution Limit: ${input.daily_limit} solutions per day\n`
      }
    } else {
      userContext += 'Premium Status: FREE (User does not have premium)\n'
    }
  } else {
    userContext += 'User Status: Not Logged In (Guest)\n'
  }
  userContext += '===================\n'

  // Build conversation context
  let conversationContext = ''
  if (input.conversation_history?.length) {
    conversationContext = '\n\n=== CONVERSATION HISTORY ===\n'
    for (const msg of input.conversation_history) {
      const role = msg.role === 'user' ? 'User' : 'Krish'
      conversationContext += `${role}: ${msg.content}\n`
    }
    conversationContext += '===========================\n'
  }

  const systemPrompt = `You are Krish, a friendly and professional customer support assistant at OA Helper. You help students with their coding interview preparation.

Your personality:
- Professional yet friendly and approachable
- Clear and concise communication
- Helpful and patient with all questions
- Warm and understanding tone
- No slang or emojis - keep it professional

⚠️ CRITICAL: Keep responses SHORT and CONCISE (2-4 sentences max). Get straight to the point.

=== OA HELPER PREMIUM PLANS ===
1. BASIC PLAN - ₹99 (or 99 OACoins) - 30 days, 5 Solutions Daily
2. PRO PLAN - ₹199 (or 199 OACoins) - 30 days, 15 Solutions Daily [MOST POPULAR]
3. UNLIMITED PLAN - ₹299 (or 299 OACoins) - 45 days, Unlimited Solutions [BEST VALUE]
4. YEARLY PLAN - ₹999 (or 999 OACoins) - 365 days, Unlimited Solutions

CONTACT & SUPPORT:
- WhatsApp: +91 9274985691
- Email: support@oahelper.in
- Website: oahelper.in`

  const fullPrompt = `${systemPrompt}${userContext}${conversationContext}

User's current question: ${userMessage}

As Krish, provide a SHORT, CONCISE response (2-4 sentences max). Be warm, friendly, and professional.`

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
          topP: 0.9,
          topK: 40,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response. Please contact our support team.'

    // Check if user wants to connect with a real person
    const connectKeywords = [
      'talk to human',
      'speak to someone',
      'real person',
      'human support',
      'connect me',
      'live chat',
      'live support',
    ]
    const shouldConnectToHuman = connectKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    )

    // Save chat to database
    try {
      await supabaseAdmin.from('ChatHistory').insert({
        user_id: input.user_id || null,
        user_email: input.user_email || null,
        user_message: userMessage,
        bot_response: aiResponse,
        is_logged_in: input.is_logged_in || false,
        is_premium: input.is_premium || false,
        premium_plan: input.premium_plan || null,
        session_id: input.session_id || `guest_${Date.now()}`,
        created_at: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error('Failed to save chat history:', dbError)
    }

    return jsonResponse(
      {
        status: 'success',
        response: aiResponse,
        connect_to_human: shouldConnectToHuman,
      },
      200,
      request
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return jsonResponse(
      {
        status: 'error',
        message: 'Connection error',
        response:
          'Sorry, I am having trouble connecting right now. Please try again or contact our support team.',
      },
      200,
      request
    )
  }
}
