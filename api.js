/**
 * API Configuration
 * 
 * This file contains configuration for API endpoints and helper functions.
 */

// Obfuscated API configuration
const _0x3c1d = ['b2FfaGVscGVyX3NlY3VyZV9rZXlfMjAyNF92MV9wcm9k', 'ZmFsbGJhY2tfa2V5'];

// Base64 decode with additional obfuscation
const _d = (s) => {
  try {
    return atob(s);
  } catch {
    return s;
  }
};

// Dynamic key generation
const _k = () => {
  const env = process.env.REACT_APP_API_KEY;
  if (env) return env;

  const parts = [
    _d(_0x3c1d[0]),
    'oa_helper_secure_key_2024_v1_prod'
  ];
  return parts[0] || _d(_0x3c1d[1]);
};

// API configuration from environment variables with fallback
const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Obfuscated API Key
export const API_KEY = _k();

// Helper function to get headers with API key
export const getApiHeaders = (additionalHeaders = {}) => {
  return {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
};

export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  // Question endpoints
  QUESTION_BY_ID: (id) => `${BASE_URL}/question.php?action=get_question&id=${id}`,
  QUESTIONS_BY_COMPANY: (companyId) => `${BASE_URL}/question.php?action=get_questions_by_company&company_id=${companyId}`,
  QUESTION_IMAGES: (questionId) => `${BASE_URL}/question_images.php?action=get_question_images&question_id=${questionId}`,
  RECENT_QUESTIONS: `${BASE_URL}/question.php?action=get_recent_questions`,

  // Company endpoints
  COMPANY: `${BASE_URL}/company.php`,
  COMPANY_BY_ID: (id) => `${BASE_URL}/company.php?id=${id}`,

  // Upload endpoints
  UPLOAD_QUESTION: `${BASE_URL}/upload_question.php`,
  USER_UPLOAD_QUESTION: `${BASE_URL}/user_upload_question.php`,
  SOLVE_QUESTION: `${BASE_URL}/solve_question.php`,

  // Admin endpoints
  ADMIN_AUTH: `${BASE_URL}/admin-auth.php`,
  ADMIN_ISSUES: `${BASE_URL}/admin-issues.php`,
  ADMIN_USER_SUBMISSIONS: `${BASE_URL}/admin_user_submissions.php`,
  ADMIN_STATS: `${BASE_URL}/admin-stats.php`,
  ADMIN_NOTIFICATIONS: `${BASE_URL}/admin-stats.php?action=check_notifications`,

  // Search endpoints
  SEARCH: `${BASE_URL}/search.php`,
  REQUEST_COMPANY: `${BASE_URL}/request-company.php`,

  // Report issue endpoint
  REPORT_ISSUE: `${BASE_URL}/report-issue.php`,

  // Auth endpoints
  LOGIN: `${BASE_URL}/login.php`,
  SIGNUP: `${BASE_URL}/signup.php`,
  CHECK_EMAIL: `${BASE_URL}/check-email.php`,
  VERIFY_CODE: `${BASE_URL}/verify-code.php`,
  RESEND_CODE: `${BASE_URL}/resend-code.php`,
  FORGOT_PASSWORD: `${BASE_URL}/forgot-password.php`,
  RESET_PASSWORD: `${BASE_URL}/reset-password.php`,

  // Profile endpoints
  UPDATE_PROFILE: `${BASE_URL}/update_profile.php`,

  // Premium endpoints
  PREMIUM: `${BASE_URL}/premium.php`,

  // Solution requests endpoints
  SOLUTION_REQUESTS: `${BASE_URL}/solution-requests.php`,


  // Feedback endpoints
  FEEDBACK: `${BASE_URL}/feedback.php`,

  // AI endpoints
  AI_FIX: `${BASE_URL}/ai-fix.php`,

  // OAcoins endpoints
  OACOINS: `${BASE_URL}/oacoins.php`,
  OACOINS_PAYMENT: `${BASE_URL}/oacoins-payment.php`,
  EXTEND_PREMIUM: `${BASE_URL}/extend-premium.php`,

  // Chat endpoint
  CHAT: `${BASE_URL}/chat.php`,

  // Placement Data endpoints
  PLACEMENT_DATA: `${BASE_URL}/placement-data.php`,

  // Interview Experiences endpoints
  INTERVIEW_EXPERIENCES: `${BASE_URL}/interview-experiences.php`,

  // Page Views endpoint
  PAGE_VIEWS: `${BASE_URL}/page-views.php`,

  // User Solved Questions endpoint
  USER_SOLVED_QUESTIONS: `${BASE_URL}/user-solved-questions.php`,

  // Community Solutions endpoint
  COMMUNITY_SOLUTIONS: `${BASE_URL}/community-solutions.php`,

  // Test Case Reports endpoint
  TEST_CASE_REPORTS: `${BASE_URL}/test-case-reports.php`,

  // Company insights endpoint
  COMPANY_INSIGHTS: `${BASE_URL}/company-insights.php`,
  COMPANY_INSIGHT_LIKES: `${BASE_URL}/company-insight-likes.php`,
}; 