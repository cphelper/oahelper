/**
 * API Configuration for Next.js Frontend
 * Connects to the backend API routes
 */

// Base URL for API calls - uses relative paths in Next.js
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Client-side: use relative URLs
  }
  // Server-side: use absolute URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'oa_helper_secure_key_2024_v1_prod';

// Helper function to get headers with API key
export const getApiHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
};

export const API_ENDPOINTS = {
  BASE_URL: getBaseUrl(),
  
  // Question endpoints
  QUESTION_BY_ID: (id: number) => `/api/questions?action=get_question&id=${id}`,
  QUESTIONS_BY_COMPANY: (companyId: number) => `/api/questions?action=get_questions_by_company&company_id=${companyId}`,
  QUESTION_BY_TITLE: (title: string) => `/api/questions?action=get_question_by_title&title=${encodeURIComponent(title)}`,
  RECENT_QUESTIONS: `/api/questions?action=get_recent_questions`,

  // Company endpoints
  COMPANY: `/api/companies`,
  COMPANY_BY_ID: (id: number) => `/api/companies?id=${id}`,

  // Auth endpoints
  LOGIN: `/api/auth/login`,
  SIGNUP: `/api/auth/signup`,
  CHECK_EMAIL: `/api/auth/check-email`,
  VERIFY_CODE: `/api/auth/verify-code`,
  RESEND_CODE: `/api/auth/resend-code`,
  FORGOT_PASSWORD: `/api/auth/forgot-password`,
  RESET_PASSWORD: `/api/auth/reset-password`,

  // Profile endpoints
  UPDATE_PROFILE: `/api/profile`,

  // Premium endpoints
  PREMIUM: `/api/premium`,

  // Solution requests endpoints
  SOLUTION_REQUESTS: `/api/solution-requests`,

  // Feedback endpoints
  FEEDBACK: `/api/feedback`,

  // AI endpoints
  AI_FIX: `/api/ai-fix`,

  // OAcoins endpoints
  OACOINS: `/api/oacoins`,
  OACOINS_PAYMENT: `/api/oacoins-payment`,

  // Chat endpoint
  CHAT: `/api/chat`,

  // Placement Data endpoints
  PLACEMENT_DATA: `/api/placement-data`,

  // Interview Experiences endpoints
  INTERVIEW_EXPERIENCES: `/api/interview-experiences`,

  // User Solved Questions endpoint
  USER_SOLVED_QUESTIONS: `/api/user-solved-questions`,

  // Community Solutions endpoint
  COMMUNITY_SOLUTIONS: `/api/community-solutions`,

  // Company insights endpoint
  COMPANY_INSIGHTS: `/api/company-insights`,

  // DSA Sheet endpoint
  DSA_SHEET: `/api/dsa-sheet`,

  // Request Company endpoint
  REQUEST_COMPANY: `/api/request-company`,

  // Search endpoint
  SEARCH: `/api/search`,
};
