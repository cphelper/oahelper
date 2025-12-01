import { NextRequest, NextResponse } from 'next/server'

const API_KEY = 'oa_helper_secure_key_2024_v1_prod'

const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:8888',
    'http://127.0.0.1:8888',
  ],
  staging: ['https://placement.helperr.io', 'https://oahelper.in'],
  production: ['https://oahelper.in', 'https://placement.helperr.io'],
}

export function getEnvironment(): 'development' | 'staging' | 'production' {
  if (process.env.NODE_ENV === 'development') return 'development'
  return 'production'
}

export function getAllowedOrigins(): string[] {
  const env = getEnvironment()
  return ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.production
}

export function setCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const allowedOrigins = getAllowedOrigins()
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  
  return response
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return setCorsHeaders(response, origin)
  }
  
  return null
}

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
  return apiKey === API_KEY
}

export function jsonResponse(data: object, status = 200, request?: NextRequest): NextResponse {
  const response = NextResponse.json(data, { status })
  const origin = request?.headers.get('origin')
  return setCorsHeaders(response, origin)
}

export function errorResponse(message: string, status = 400, request?: NextRequest): NextResponse {
  return jsonResponse({ status: 'error', message }, status, request)
}

export function successResponse(message: string, data?: object, request?: NextRequest): NextResponse {
  return jsonResponse({ status: 'success', message, ...data }, 200, request)
}

export function unauthorizedResponse(request?: NextRequest): NextResponse {
  return errorResponse('Unauthorized: Invalid API key', 401, request)
}

export async function getJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
