import { NextRequest } from 'next/server'
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

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<{ code: string; errors: string[] }>(request)

  if (!input || !input.code || !input.errors) {
    return errorResponse('Missing required fields: code and errors', 400, request)
  }

  const { code, errors } = input

  if (!code.trim()) {
    return errorResponse('Code cannot be empty', 400, request)
  }

  if (!errors.length) {
    return errorResponse('No errors provided', 400, request)
  }

  const prompt = `You are an expert C++ programmer. Please fix the following C++ code that has compilation errors:

Current Code:
${code}

Compilation Errors:
${errors.join('\n')}

Please provide only the corrected C++ code without any explanations or markdown formatting. The code should be complete and ready to compile.`

  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash']

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      })

      if (!response.ok) {
        console.error(`Model ${model} returned HTTP error ${response.status}`)
        continue
      }

      const data = await response.json()

      if (data.error) {
        console.error(`Model ${model} returned error:`, data.error)
        continue
      }

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (aiResponse) {
        // Clean up the response - remove markdown code blocks if present
        let cleanedCode = aiResponse.replace(/```(?:cpp)?\n?/g, '')
        cleanedCode = cleanedCode.replace(/```\n?/g, '')
        cleanedCode = cleanedCode.trim()

        return jsonResponse(
          {
            status: 'success',
            fixed_code: cleanedCode,
          },
          200,
          request
        )
      }
    } catch (error) {
      console.error(`Error with model ${model}:`, error)
      continue
    }
  }

  return errorResponse('AI service error: All models failed', 500, request)
}
