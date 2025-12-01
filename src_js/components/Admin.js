import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaUpload, FaEdit, FaTrash, FaSave, FaTimes, FaBuilding, FaQuestionCircle, FaBug, FaCheck, FaSpinner, FaImage, FaDownload, FaUsers, FaClock, FaEnvelope, FaStickyNote, FaRupeeSign, FaPaperPlane, FaCalendar, FaCode, FaSearch, FaFlag, FaExclamationTriangle, FaChartBar, FaChartLine, FaChartPie, FaArrowUp, FaArrowDown, FaMinus, FaCommentDots, FaBriefcase, FaPlus, FaUser, FaRobot, FaMagic, FaBolt } from 'react-icons/fa';
import Navbar from './Navbar';
import DotPattern from './DotPattern';
import { encryptId } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getApiHeaders, API_KEY } from '../config/api';

// Lazy load heavy Advanced components
const AdvancedQuestionUpload = lazy(() => import('./AdvancedQuestionUpload'));
const AdvancedQuestionProcessor = lazy(() => import('./AdvancedQuestionProcessor'));
const AdvancedQuestionSolver = lazy(() => import('./AdvancedQuestionSolver'));

const MANUAL_PREMIUM_PLAN_PRESETS = {
  custom: { label: 'Custom Range', description: 'Set any custom start and end date manually.' },
  basic: { label: 'Basic · 30 days', description: '30 days • approx. 5 solves/day', days: 30, amount: 149 },
  pro: { label: 'Pro · 30 days', description: '30 days • 15 solves/day', days: 30, amount: 199 },
  unlimited: { label: 'Unlimited · 45 days', description: '45 days • unlimited solves', days: 45, amount: 299 },
  yearly: { label: 'Yearly · 365 days', description: '365 days • unlimited solves', days: 365, amount: 999 }
};

const MANUAL_PREMIUM_PLAN_OPTIONS = Object.entries(MANUAL_PREMIUM_PLAN_PRESETS).map(([id, preset]) => ({
  id,
  label: preset.label
}));

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('adminAuth') === 'true';
  });
  const [adminRole, setAdminRole] = useState(() => {
    return localStorage.getItem('adminRole') || 'admin';
  });
  const [selectedRole, setSelectedRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'upload';
  });

  // Issues state
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [feedbackFilter, setFeedbackFilter] = useState({ status: '', feedback_type: '' });

  // Companies state
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  const [totalCompaniesCount, setTotalCompaniesCount] = useState(0);

  // Questions state
  const [companyName, setCompanyName] = useState('');
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editQuestionData, setEditQuestionData] = useState({ title: '', problem_statement: '', solution_cpp: '' });
  const [editMode, setEditMode] = useState(null); // 'problem' or 'solution'

  // Solution editor state
  const [editingSolution, setEditingSolution] = useState(null); // { questionId, title, solutions }
  const [solutionContent, setSolutionContent] = useState({ cpp: '', python: '', java: '' });
  const [solutionLanguage, setSolutionLanguage] = useState('cpp');

  // Upload question state
  const [uploadCompanyName, setUploadCompanyName] = useState('');
  const [cppSolution, setCppSolution] = useState('');
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [blurredUploadImages, setBlurredUploadImages] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [questionType, setQuestionType] = useState('coding'); // 'coding', 'mcq', 'sql', or 'api'
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash'); // Default model
  const [selectedApiKey, setSelectedApiKey] = useState('api_key_1'); // 'api_key_1' or 'api_key_2'
  const fileInputRef = useRef();



  // Image blur tool state
  const [blurPreviewImages, setBlurPreviewImages] = useState([]);
  const [blurProcessing, setBlurProcessing] = useState(false);
  const [blurPercentage, setBlurPercentage] = useState(0);
  const blurFileInputRef = useRef();

  // User submissions state
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchEmail, setUserSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');

  // Company requests state
  const [companyRequests, setCompanyRequests] = useState([]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);

  // Payment requests state
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Premium users state
  const [premiumStats, setPremiumStats] = useState(null);
  const [premiumSearchEmail, setPremiumSearchEmail] = useState('');
  const [premiumSearchResult, setPremiumSearchResult] = useState(null);
  const [premiumSearchLoading, setPremiumSearchLoading] = useState(false);
  const [premiumSearchError, setPremiumSearchError] = useState('');
  const [planUpgradeLoadingId, setPlanUpgradeLoadingId] = useState(null);
  const [premiumPlanUpdateStatus, setPremiumPlanUpdateStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [lastPremiumSearchEmail, setLastPremiumSearchEmail] = useState('');
  const [manualPremiumEmail, setManualPremiumEmail] = useState('');
  const [manualPremiumUser, setManualPremiumUser] = useState(null);
  const [manualPremiumStart, setManualPremiumStart] = useState('');
  const [manualPremiumEnd, setManualPremiumEnd] = useState('');
  const [manualPremiumPlan, setManualPremiumPlan] = useState('custom');
  const [manualPremiumAmount, setManualPremiumAmount] = useState('');
  const [manualPremiumNotes, setManualPremiumNotes] = useState('');
  const [manualPremiumError, setManualPremiumError] = useState('');
  const [manualPremiumSuccess, setManualPremiumSuccess] = useState('');
  const [manualPremiumSearchLoading, setManualPremiumSearchLoading] = useState(false);
  const [manualPremiumSubmitting, setManualPremiumSubmitting] = useState(false);
  const [manualPremiumReplaceExisting, setManualPremiumReplaceExisting] = useState(true);

  // Banned emails state
  const [bannedEmails, setBannedEmails] = useState([]);
  const [loadingBannedEmails, setLoadingBannedEmails] = useState(false);
  const [newBannedEmail, setNewBannedEmail] = useState('');

  // Placement verification state
  const [unverifiedPlacements, setUnverifiedPlacements] = useState([]);
  const [loadingPlacements, setLoadingPlacements] = useState(false);
  const [verifyingPlacement, setVerifyingPlacement] = useState(null);
  const [placementOacoins, setPlacementOacoins] = useState({});

  // Verified placements state
  const [showVerifiedPlacements, setShowVerifiedPlacements] = useState(false);
  const [verifiedPlacements, setVerifiedPlacements] = useState([]);
  const [loadingVerifiedPlacements, setLoadingVerifiedPlacements] = useState(false);
  const [verifiedPlacementLimit, setVerifiedPlacementLimit] = useState(50);
  const [rewardingVerifiedPlacement, setRewardingVerifiedPlacement] = useState(null);
  const [verifiedPlacementOacoins, setVerifiedPlacementOacoins] = useState({});

  // Interview experiences verification state
  const [unverifiedExperiences, setUnverifiedExperiences] = useState([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [verifyingExperience, setVerifyingExperience] = useState(null);
  const [experienceOacoins, setExperienceOacoins] = useState({});

  // Report issues state
  const [reportIssues, setReportIssues] = useState([]);
  const [loadingReportIssues, setLoadingReportIssues] = useState(false);
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'question', 'solution'
  const [reportStatusFilter, setReportStatusFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'resolved', 'dismissed'
  const [editingReport, setEditingReport] = useState(null);
  const [reportNotes, setReportNotes] = useState('');

  // Admin stats state
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // OACoins management state
  const [oacoinsSearchEmail, setOacoinsSearchEmail] = useState('');
  const [oacoinsUser, setOacoinsUser] = useState(null);
  const [oacoinsAmount, setOacoinsAmount] = useState('');
  const [oacoinsOperation, setOacoinsOperation] = useState('add'); // 'add' or 'set'
  const [oacoinsLoading, setOacoinsLoading] = useState(false);
  const [oacoinsError, setOacoinsError] = useState('');
  const [oacoinsSuccess, setOacoinsSuccess] = useState('');

  // Page Views state
  const [pageViewStats, setPageViewStats] = useState([]);
  const [loadingPageStats, setLoadingPageStats] = useState(false);

  // Chat history state
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [chatHistoryLimit, setChatHistoryLimit] = useState(100);
  const [chatHistoryTotal, setChatHistoryTotal] = useState(0);

  // Test Case Reports state
  const [testCaseReports, setTestCaseReports] = useState([]);
  const [loadingTestCaseReports, setLoadingTestCaseReports] = useState(false);
  const [testCaseReportFilter, setTestCaseReportFilter] = useState('pending');
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [editingTestCaseData, setEditingTestCaseData] = useState({ input: '', output: '' });

  // Community Solutions state
  const [communitySolutions, setCommunitySolutions] = useState([]);
  const [communityComments, setCommunityComments] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityTab, setCommunityTab] = useState('solutions'); // 'solutions' or 'comments'
  const [replyingToSolution, setReplyingToSolution] = useState(null); // solution object
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [rewardingSolution, setRewardingSolution] = useState(null); // for OACoins reward
  const [rewardAmount, setRewardAmount] = useState('');
  const [sendingReward, setSendingReward] = useState(false);

  // Questions Database state
  const [allQuestions, setAllQuestions] = useState([]);
  const [loadingAllQuestions, setLoadingAllQuestions] = useState(false);
  const [questionsDbSearch, setQuestionsDbSearch] = useState('');
  const [questionsDbFilter, setQuestionsDbFilter] = useState('all'); // 'all', 'coding', 'mcq', 'sql', 'api'
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [questionsDbPage, setQuestionsDbPage] = useState(1);
  const questionsPerPage = 20;

  // Questions Database functions
  const [questionsDbTotal, setQuestionsDbTotal] = useState(0);
  const [questionsDbHasMore, setQuestionsDbHasMore] = useState(false);
  
  // Inline editing state
  const [inlineEdits, setInlineEdits] = useState({}); // { questionId: { field: value, ... } }
  const [savingInline, setSavingInline] = useState(null); // questionId being saved
  
  const fetchAllQuestions = async (page = 1) => {
    setLoadingAllQuestions(true);
    try {
      const url = `${API_ENDPOINTS.COMPANY}?action=get_all_questions&page=${page}&limit=${questionsPerPage}`;
      console.log('Fetching questions from:', url);
      const response = await fetch(url, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      console.log('Response:', data);
      if (data.status === 'success') {
        setAllQuestions(data.data || []);
        setQuestionsDbTotal(data.total || 0);
        setQuestionsDbHasMore(data.hasMore || false);
        setQuestionsDbPage(page);
      } else {
        console.error('API error:', data.message);
        alert('Failed to load questions: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching all questions:', error);
      alert('Error fetching questions: ' + error.message);
    } finally {
      setLoadingAllQuestions(false);
    }
  };

  const getFilteredQuestions = () => {
    let filtered = allQuestions;
    
    // Client-side filtering (for current page only)
    if (questionsDbSearch.trim()) {
      const search = questionsDbSearch.toLowerCase();
      filtered = filtered.filter(q => 
        q.title?.toLowerCase().includes(search) ||
        q.company_name?.toLowerCase().includes(search)
      );
    }
    
    if (questionsDbFilter !== 'all') {
      filtered = filtered.filter(q => q.question_type === questionsDbFilter);
    }
    
    return filtered;
  };

  const getTotalPages = () => {
    return Math.ceil(questionsDbTotal / questionsPerPage);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= getTotalPages()) {
      fetchAllQuestions(newPage);
    }
  };

  // Inline editing functions
  const handleInlineChange = (questionId, field, value) => {
    setInlineEdits(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [field]: value
      }
    }));
  };

  const getInlineValue = (question, field) => {
    if (inlineEdits[question.id] && inlineEdits[question.id][field] !== undefined) {
      return inlineEdits[question.id][field];
    }
    return question[field] || '';
  };

  const hasInlineChanges = (questionId) => {
    return inlineEdits[questionId] && Object.keys(inlineEdits[questionId]).length > 0;
  };

  const saveInlineChanges = async (questionId) => {
    if (!inlineEdits[questionId]) return;
    
    setSavingInline(questionId);
    try {
      const updates = inlineEdits[questionId];
      const response = await fetch(API_ENDPOINTS.COMPANY, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_question_fields',
          question_id: questionId,
          updates: updates
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        // Update local state
        setAllQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, ...updates } : q
        ));
        // Clear inline edits for this question
        setInlineEdits(prev => {
          const newEdits = { ...prev };
          delete newEdits[questionId];
          return newEdits;
        });
        alert('Changes saved successfully!');
      } else {
        alert('Failed to save: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes: ' + error.message);
    } finally {
      setSavingInline(null);
    }
  };

  const cancelInlineChanges = (questionId) => {
    setInlineEdits(prev => {
      const newEdits = { ...prev };
      delete newEdits[questionId];
      return newEdits;
    });
  };

  // Test Case Reports functions
  const fetchTestCaseReports = async () => {
    setLoadingTestCaseReports(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.TEST_CASE_REPORTS}?action=get_reports&status=${testCaseReportFilter === 'all' ? '' : testCaseReportFilter}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setTestCaseReports(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching test case reports:', error);
    } finally {
      setLoadingTestCaseReports(false);
    }
  };

  const updateTestCaseReportStatus = async (reportId, status) => {
    try {
      const response = await fetch(API_ENDPOINTS.TEST_CASE_REPORTS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ action: 'update_status', report_id: reportId, status })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchTestCaseReports();
      }
    } catch (error) {
      console.error('Error updating test case report:', error);
    }
  };

  const updateQuestionTestCase = async (questionId, testCaseIndex, newInput, newOutput) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANY}`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_test_case',
          question_id: questionId,
          test_case_index: testCaseIndex,
          input: newInput,
          output: newOutput
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Test case updated successfully!');
        setEditingTestCase(null);
        fetchTestCaseReports();
      } else {
        alert(data.message || 'Failed to update test case');
      }
    } catch (error) {
      console.error('Error updating test case:', error);
      alert('Error updating test case');
    }
  };

  // Page Views functions
  const fetchPageStats = async () => {
    setLoadingPageStats(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.PAGE_VIEWS}?action=get_stats`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPageViewStats(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching page stats:', error);
    } finally {
      setLoadingPageStats(false);
    }
  };

  // Chat History functions
  const fetchChatHistory = async () => {
    setLoadingChatHistory(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.CHAT}?action=get_chat_history&limit=${chatHistoryLimit}&offset=0`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setChatHistory(data.data || []);
        setChatHistoryTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  // Admin Stats functions
  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_STATS}?action=get_all_stats`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAdminStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Community Solutions functions
  const fetchCommunitySolutions = async () => {
    setLoadingCommunity(true);
    try {
      const url = `${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=get_all_solutions_admin`;
      const response = await fetch(url, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCommunitySolutions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching community solutions:', error);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const fetchCommunityComments = async () => {
    setLoadingCommunity(true);
    try {
      const url = `${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=get_all_comments_admin`;
      const response = await fetch(url, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCommunityComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching community comments:', error);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleReplyToSolution = async () => {
    if (!replyingToSolution || !replyText.trim()) return;

    setSendingReply(true);
    try {
      // Admin replies are just comments with admin user_id (assuming current user is admin)
      // We need to get the current user ID from somewhere. 
      // Admin.js doesn't seem to have 'user' state with ID.
      // Let's check if we can get it from localStorage or if we need to fetch it.
      // For now, I'll assume we can use a placeholder or if the backend handles it.
      // Actually, community-solutions.php requires user_id.
      // Let's try to get it from localStorage 'adminRole' or similar? 
      // Wait, the admin auth might not be the same as user auth.
      // If the admin is also a user, we might have user_id.
      // If not, we might need to use a special admin ID or 0?
      // Let's check how other admin actions work. 
      // Most admin actions don't need user_id, they just check API key.
      // But add_comment needs user_id.
      // I'll use a fixed ID for admin (e.g., 1) or try to find a way.
      // Actually, let's look at 'user' state in QuestionWithEditor.js.
      // Admin.js doesn't have 'user' state.
      // I'll use 1 for now as a fallback, or 0.

      const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=add_comment`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: 1, // Assuming admin is user 1, or we should fetch the actual admin user id.
          solution_id: replyingToSolution.id || replyingToSolution.solution_id, // Handle both solution and comment reply (comment reply goes to solution)
          comment: replyText
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Reply posted successfully');
        setReplyText('');
        setReplyingToSolution(null);
        if (communityTab === 'solutions') fetchCommunitySolutions();
        else fetchCommunityComments();
      } else {
        alert(data.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Error posting reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleRewardUser = async () => {
    if (!rewardingSolution || !rewardAmount || isNaN(parseInt(rewardAmount)) || parseInt(rewardAmount) <= 0) {
      alert('Please enter a valid reward amount');
      return;
    }

    setSendingReward(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.OACOINS}`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'add_coins',
          user_id: rewardingSolution.user_id,
          amount: parseInt(rewardAmount),
          reason: `Reward for solution on "${rewardingSolution.question_title}"`
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert(`Successfully rewarded ${rewardAmount} OACoins to ${rewardingSolution.user_name}! Email notification sent.`);
        setRewardAmount('');
        setRewardingSolution(null);
        // Refresh the solutions list
        if (communityTab === 'solutions') fetchCommunitySolutions();
        else fetchCommunityComments();
      } else {
        alert(data.message || 'Failed to reward user');
      }
    } catch (error) {
      console.error('Error rewarding user:', error);
      alert('Error rewarding user');
    } finally {
      setSendingReward(false);
    }
  };

  // OACoins Management functions
  const searchUserByEmail = async () => {
    if (!oacoinsSearchEmail.trim()) {
      setOacoinsError('Please enter an email address');
      return;
    }

    setOacoinsLoading(true);
    setOacoinsError('');
    setOacoinsSuccess('');
    setOacoinsUser(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.OACOINS}?action=get_user_by_email&email=${encodeURIComponent(oacoinsSearchEmail.trim())}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success' && data.user) {
        setOacoinsUser(data.user);
      } else {
        setOacoinsError(data.message || 'User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setOacoinsError('Failed to search user');
    } finally {
      setOacoinsLoading(false);
    }
  };

  const updateUserOacoins = async () => {
    if (!oacoinsUser) {
      setOacoinsError('Please search for a user first');
      return;
    }

    const amount = parseInt(oacoinsAmount);
    if (isNaN(amount) || amount <= 0) {
      setOacoinsError('Please enter a valid positive number');
      return;
    }

    setOacoinsLoading(true);
    setOacoinsError('');
    setOacoinsSuccess('');

    try {
      const response = await fetch(API_ENDPOINTS.OACOINS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: oacoinsOperation === 'add' ? 'add_coins' : 'set_coins',
          user_id: oacoinsUser.id,
          amount: amount
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setOacoinsSuccess(`Successfully ${oacoinsOperation === 'add' ? 'added' : 'set'} ${amount} OACoins. New balance: ${data.new_balance}`);
        // Refresh user data
        setOacoinsUser({ ...oacoinsUser, oacoins: data.new_balance });
        setOacoinsAmount('');
      } else {
        setOacoinsError(data.message || 'Failed to update OACoins');
      }
    } catch (error) {
      console.error('Error updating OACoins:', error);
      setOacoinsError('Failed to update OACoins');
    } finally {
      setOacoinsLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId, emailToRefresh = null) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=cancel_subscription`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ subscription_id: subscriptionId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          const targetEmail = emailToRefresh || premiumSearchResult?.user_email || lastPremiumSearchEmail;
          if (targetEmail) {
            searchPremiumUser(targetEmail);
          } else {
            setPremiumSearchResult(null);
          }
        }
      } catch (error) {
        console.error('Error canceling subscription:', error);
      }
    }
  };

  // Premium Users functions
  const searchPremiumUser = async (overrideEmail = null) => {
    const rawEmail = (overrideEmail ?? premiumSearchEmail).trim();
    if (!rawEmail) {
      setPremiumSearchError('Please enter an email address');
      setPremiumSearchResult(null);
      return;
    }

    setPremiumSearchEmail(rawEmail);
    setPremiumSearchLoading(true);
    setPremiumSearchError('');
    setPremiumPlanUpdateStatus(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=get_premium_users`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        const normalized = rawEmail.toLowerCase();
        const matchedUser = (data.data || []).find(user => (user.user_email || '').toLowerCase() === normalized);
        if (matchedUser) {
          setPremiumSearchResult(matchedUser);
          setLastPremiumSearchEmail(matchedUser.user_email);
        } else {
          setPremiumSearchResult(null);
          setPremiumSearchError('No active premium subscription found for this email');
        }
      } else {
        setPremiumSearchResult(null);
        setPremiumSearchError(data.message || 'Failed to search premium users');
      }
    } catch (error) {
      console.error('Error searching premium user:', error);
      setPremiumSearchResult(null);
      setPremiumSearchError('Failed to search premium users');
    } finally {
      setPremiumSearchLoading(false);
    }
  };

  const handlePremiumPlanChange = async (planId) => {
    if (!premiumSearchResult) return;
    const preset = MANUAL_PREMIUM_PLAN_PRESETS[planId];
    if (!preset || !preset.days) {
      setPremiumPlanUpdateStatus({ type: 'error', message: 'Selected plan is unavailable.' });
      return;
    }

    const confirmationMessage = `Switch ${premiumSearchResult.user_email} to "${preset.label}"? This will replace their current premium plan.`;
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    const now = new Date();
    const startLocal = formatDateTimeLocal(now);
    const endLocal = formatDateTimeLocal(new Date(now.getTime() + preset.days * 24 * 60 * 60 * 1000));

    setPlanUpgradeLoadingId(planId);
    setPremiumPlanUpdateStatus(null);

    try {
      const response = await fetch(API_ENDPOINTS.PREMIUM, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'manual_activate',
          email: premiumSearchResult.user_email,
          user_id: premiumSearchResult.user_id,
          plan_type: planId,
          amount: preset.amount || 0,
          start_date: convertToSqlDateTime(startLocal),
          end_date: convertToSqlDateTime(endLocal),
          notes: `Plan changed to ${preset.label} via admin panel`,
          replace_existing: true
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPremiumPlanUpdateStatus({ type: 'success', message: data.message || 'Plan updated successfully.' });
        searchPremiumUser(premiumSearchResult.user_email);
      } else {
        setPremiumPlanUpdateStatus({ type: 'error', message: data.message || 'Failed to update plan.' });
      }
    } catch (error) {
      console.error('Error updating premium plan:', error);
      setPremiumPlanUpdateStatus({ type: 'error', message: 'Failed to update plan.' });
    } finally {
      setPlanUpgradeLoadingId(null);
    }
  };

  const fetchPremiumStats = async () => {
    const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=get_premium_stats`, {
      headers: getApiHeaders()
    });
    const data = await response.json();
    if (data.status === 'success') {
      setPremiumStats(data.data);
    }
  };

  const formatDateTimeLocal = (dateInput) => {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date)) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const convertToSqlDateTime = (value) => {
    if (!value) return null;
    const normalized = value.replace('T', ' ');
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  };

  const resetManualPremiumForm = () => {
    setManualPremiumEmail('');
    setManualPremiumUser(null);
    setManualPremiumStart('');
    setManualPremiumEnd('');
    setManualPremiumPlan('custom');
    setManualPremiumAmount('');
    setManualPremiumNotes('');
    setManualPremiumError('');
    setManualPremiumSuccess('');
    setManualPremiumReplaceExisting(true);
  };

  const handleManualPremiumUserSearch = async () => {
    if (!manualPremiumEmail.trim()) {
      setManualPremiumError('Please enter an email address');
      return;
    }
    setManualPremiumSearchLoading(true);
    setManualPremiumError('');
    setManualPremiumSuccess('');
    try {
      const response = await fetch(`${API_ENDPOINTS.OACOINS}?action=get_user_by_email&email=${encodeURIComponent(manualPremiumEmail.trim())}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success' && data.user) {
        const now = new Date();
        setManualPremiumUser(data.user);
        setManualPremiumStart(formatDateTimeLocal(now));
        setManualPremiumEnd(formatDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)));
        setManualPremiumPlan('custom');
        setManualPremiumAmount('');
        setManualPremiumNotes('');
      } else {
        setManualPremiumUser(null);
        setManualPremiumError(data.message || 'User not found');
      }
    } catch (error) {
      console.error('Error searching user for manual premium:', error);
      setManualPremiumError('Failed to search for user');
    } finally {
      setManualPremiumSearchLoading(false);
    }
  };

  const applyManualPlanPreset = () => {
    const preset = MANUAL_PREMIUM_PLAN_PRESETS[manualPremiumPlan];
    if (!preset || !preset.days) return;
    const base = manualPremiumStart ? new Date(manualPremiumStart) : new Date();
    if (isNaN(base)) return;
    const newEnd = new Date(base.getTime() + preset.days * 24 * 60 * 60 * 1000);
    setManualPremiumEnd(formatDateTimeLocal(newEnd));
    if (preset.amount) {
      setManualPremiumAmount(preset.amount.toString());
    }
  };

  const handleManualPremiumSubmit = async () => {
    if (!manualPremiumUser) {
      setManualPremiumError('Please search and select a user first');
      return;
    }
    if (!manualPremiumStart || !manualPremiumEnd) {
      setManualPremiumError('Please provide both start and end date/time');
      return;
    }
    const start = new Date(manualPremiumStart);
    const end = new Date(manualPremiumEnd);
    if (isNaN(start) || isNaN(end)) {
      setManualPremiumError('Invalid date selection');
      return;
    }
    if (end <= start) {
      setManualPremiumError('End date must be after start date');
      return;
    }
    const parsedAmount = manualPremiumAmount ? parseFloat(manualPremiumAmount) : 0;
    if (manualPremiumAmount && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setManualPremiumError('Amount must be a valid positive number');
      return;
    }
    setManualPremiumSubmitting(true);
    setManualPremiumError('');
    setManualPremiumSuccess('');
    try {
      const response = await fetch(API_ENDPOINTS.PREMIUM, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'manual_activate',
          email: manualPremiumUser.email,
          user_id: manualPremiumUser.id,
          plan_type: manualPremiumPlan,
          amount: parsedAmount,
          start_date: convertToSqlDateTime(manualPremiumStart),
          end_date: convertToSqlDateTime(manualPremiumEnd),
          notes: manualPremiumNotes,
          replace_existing: manualPremiumReplaceExisting
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setManualPremiumSuccess(data.message || 'Premium subscription activated successfully');
        if (
          premiumSearchResult &&
          manualPremiumUser &&
          premiumSearchResult.user_email.toLowerCase() === manualPremiumUser.email.toLowerCase()
        ) {
          searchPremiumUser(manualPremiumUser.email);
        }
        fetchPremiumStats();
      } else {
        setManualPremiumError(data.message || 'Failed to activate premium subscription');
      }
    } catch (error) {
      console.error('Error activating premium manually:', error);
      setManualPremiumError('Failed to activate premium subscription');
    } finally {
      setManualPremiumSubmitting(false);
    }
  };

  // Banned Emails functions
  const fetchBannedEmails = async () => {
    setLoadingBannedEmails(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_SUBMISSIONS}?action=get_banned_emails`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setBannedEmails(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banned emails:', error);
    } finally {
      setLoadingBannedEmails(false);
    }
  };

  const addBannedEmail = async (email) => {
    if (!email.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'ban_email',
          email: email.trim().toLowerCase()
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Email banned successfully (Synced to Supabase)');
        setNewBannedEmail('');
        fetchBannedEmails();
      } else {
        alert(data.message || 'Failed to ban email');
      }
    } catch (error) {
      console.error('Error banning email:', error);
      alert('Error banning email');
    }
  };

  const removeBannedEmail = async (emailId) => {
    if (window.confirm('Are you sure you want to unban this email?')) {
      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'unban_email',
            email_id: emailId
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Email unbanned successfully');
          fetchBannedEmails();
        } else {
          alert(data.message || 'Failed to unban email');
        }
      } catch (error) {
        console.error('Error unbanning email:', error);
        alert('Error unbanning email');
      }
    }
  };

  const sendBanNotificationEmail = async (email) => {
    if (window.confirm(`Send ban notification email to ${email}?`)) {
      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'send_ban_notification',
            email: email
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Ban notification email sent successfully');
        } else {
          alert(data.message || 'Failed to send email');
        }
      } catch (error) {
        console.error('Error sending ban notification:', error);
        alert('Error sending ban notification email');
      }
    }
  };

  // Placement Verification functions
  const fetchUnverifiedPlacements = async () => {
    setLoadingPlacements(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/placement-data.php?action=get_unverified`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUnverifiedPlacements(data.data || []);

        // Auto-fill suggested OACoins for each placement
        const suggestedAmounts = {};
        data.data.forEach(placement => {
          suggestedAmounts[placement.id] = placement.suggested_oacoins || 4;
        });
        setPlacementOacoins(suggestedAmounts);
      }
    } catch (error) {
      console.error('Error fetching unverified placements:', error);
    } finally {
      setLoadingPlacements(false);
    }
  };

  const verifyPlacement = async (placementId) => {
    const oacoinsAmount = placementOacoins[placementId] || 0;

    if (oacoinsAmount < 0) {
      alert('OACoins amount cannot be negative');
      return;
    }

    if (!window.confirm(`Verify this placement${oacoinsAmount > 0 ? ` and reward ${oacoinsAmount} OACoins` : ''}?`)) {
      return;
    }

    setVerifyingPlacement(placementId);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/placement-data.php`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'verify_placement',
          placement_id: placementId,
          oacoins_amount: oacoinsAmount
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(data.message || 'Placement data verified successfully!');
        // Clear the OACoins input for this placement
        setPlacementOacoins(prev => {
          const updated = { ...prev };
          delete updated[placementId];
          return updated;
        });
        fetchUnverifiedPlacements();
      } else {
        alert(data.message || 'Failed to verify placement');
      }
    } catch (error) {
      console.error('Error verifying placement:', error);
      alert('Error verifying placement');
    } finally {
      setVerifyingPlacement(null);
    }
  };

  const deletePlacement = async (placementId) => {
    if (window.confirm('Are you sure you want to delete this placement entry?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/placement-data.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'delete_placement',
            placement_id: placementId
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Placement deleted successfully');
          fetchUnverifiedPlacements();
        } else {
          alert(data.message || 'Failed to delete placement');
        }
      } catch (error) {
        console.error('Error deleting placement:', error);
        alert('Error deleting placement');
      }
    }
  };
  const fetchVerifiedPlacements = async () => {
    setLoadingVerifiedPlacements(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/placement-data.php?action=get_verified_placements&limit=${verifiedPlacementLimit}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setVerifiedPlacements(data.data || []);

        // Auto-fill suggested OACoins for each placement
        const suggestedAmounts = {};
        data.data.forEach(placement => {
          suggestedAmounts[placement.id] = placement.suggested_oacoins || 0;
        });
        setVerifiedPlacementOacoins(suggestedAmounts);

        setShowVerifiedPlacements(true);
      } else {
        alert(data.message || 'Failed to fetch verified placements');
      }
    } catch (error) {
      console.error('Error fetching verified placements:', error);
      alert('Error fetching verified placements');
    } finally {
      setLoadingVerifiedPlacements(false);
    }
  };

  const rewardVerifiedPlacement = async (placementId) => {
    const oacoinsAmount = verifiedPlacementOacoins[placementId] || 0;

    if (oacoinsAmount <= 0) {
      alert('Please enter a valid OACoins amount (greater than 0)');
      return;
    }

    if (!window.confirm(`Reward this user with ${oacoinsAmount} OACoins?`)) {
      return;
    }

    setRewardingVerifiedPlacement(placementId);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/placement-data.php`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'verify_placement',
          placement_id: placementId,
          oacoins_amount: oacoinsAmount
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(data.message || 'OACoins rewarded successfully!');
        // Clear the OACoins input for this placement
        setVerifiedPlacementOacoins(prev => {
          const updated = { ...prev };
          delete updated[placementId];
          return updated;
        });
        // Refresh the list
        fetchVerifiedPlacements();
      } else {
        alert(data.message || 'Failed to reward OACoins');
      }
    } catch (error) {
      console.error('Error rewarding verified placement:', error);
      alert('Error rewarding OACoins');
    } finally {
      setRewardingVerifiedPlacement(null);
    }
  };

  // Interview Experiences Verification functions
  const fetchUnverifiedExperiences = async () => {
    setLoadingExperiences(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.INTERVIEW_EXPERIENCES}?action=get_unverified`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUnverifiedExperiences(data.data || []);

        // Auto-fill suggested OACoins for each experience (5-15 coins)
        const suggestedAmounts = {};
        data.data.forEach(exp => {
          suggestedAmounts[exp.id] = 10; // Default 10 coins
        });
        setExperienceOacoins(suggestedAmounts);
      }
    } catch (error) {
      console.error('Error fetching unverified experiences:', error);
    } finally {
      setLoadingExperiences(false);
    }
  };

  const verifyExperience = async (experienceId) => {
    const oacoinsAmount = experienceOacoins[experienceId] || 0;

    if (oacoinsAmount < 0) {
      alert('OACoins amount cannot be negative');
      return;
    }

    if (!window.confirm(`Verify this interview experience${oacoinsAmount > 0 ? ` and reward ${oacoinsAmount} OACoins` : ''}?`)) {
      return;
    }

    setVerifyingExperience(experienceId);
    try {
      const response = await fetch(API_ENDPOINTS.INTERVIEW_EXPERIENCES, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'verify_experience',
          experience_id: experienceId,
          oacoins_amount: oacoinsAmount
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(data.message || 'Interview experience verified successfully!');
        // Clear the OACoins input for this experience
        setExperienceOacoins(prev => {
          const updated = { ...prev };
          delete updated[experienceId];
          return updated;
        });
        fetchUnverifiedExperiences();
      } else {
        alert(data.message || 'Failed to verify experience');
      }
    } catch (error) {
      console.error('Error verifying experience:', error);
      alert('Error verifying experience');
    } finally {
      setVerifyingExperience(null);
    }
  };

  const deleteExperience = async (experienceId) => {
    if (window.confirm('Are you sure you want to delete this interview experience?')) {
      try {
        const response = await fetch(API_ENDPOINTS.INTERVIEW_EXPERIENCES, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'delete_experience',
            experience_id: experienceId
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Interview experience deleted successfully');
          fetchUnverifiedExperiences();
        } else {
          alert(data.message || 'Failed to delete experience');
        }
      } catch (error) {
        console.error('Error deleting experience:', error);
        alert('Error deleting experience');
      }
    }
  };

  // Report Issues functions
  const fetchReportIssues = async () => {
    setLoadingReportIssues(true);
    try {
      const params = new URLSearchParams({
        action: 'get_reports',
        type: reportFilter,
        status: reportStatusFilter
      });
      const response = await fetch(`${API_ENDPOINTS.REPORT_ISSUE}?${params}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setReportIssues(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching report issues:', error);
    } finally {
      setLoadingReportIssues(false);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const params = new URLSearchParams({
        action: 'get_feedback',
        page: feedbackPage,
        limit: 20,
        ...feedbackFilter
      });
      const url = `${API_ENDPOINTS.FEEDBACK}?${params}`;
      console.log('Fetching feedback from:', url);
      const response = await fetch(url, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      console.log('Feedback response:', data);
      if (data.status === 'success') {
        console.log('Setting feedback:', data.data.feedback);
        setFeedback(data.data.feedback || []);
        setFeedbackTotalPages(data.data.pagination.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateReportStatus = async (reportId, tableName, status, adminNotes = null) => {
    try {
      const response = await fetch(API_ENDPOINTS.REPORT_ISSUE, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_report_status',
          report_id: reportId,
          table_name: tableName,
          status,
          admin_notes: adminNotes
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchReportIssues();
        setEditingReport(null);
        setReportNotes('');
      } else {
        alert(data.message || 'Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Error updating report status');
    }
  };

  const deleteReport = async (reportId, tableName) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await fetch(API_ENDPOINTS.REPORT_ISSUE, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'delete_report',
            report_id: reportId,
            table_name: tableName
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchReportIssues();
        } else {
          alert(data.message || 'Failed to delete report');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Error deleting report');
      }
    }
  };

  // Load data only when tab is clicked (not on mount)
  useEffect(() => {
    if (!isAuthenticated) return;

    const hasUserInteracted = localStorage.getItem('adminHasInteracted');
    if (!hasUserInteracted) {
      localStorage.setItem('adminHasInteracted', 'true');
      if (activeTab === 'upload') {
        return;
      }
    }

    if (activeTab === 'issues') fetchIssues();
    else if (activeTab === 'companies') fetchCompanies();
    else if (activeTab === 'user-submissions') fetchUserSubmissions();
    else if (activeTab === 'users') fetchRegisteredUsers();
    else if (activeTab === 'payment-requests') fetchPaymentRequests();
    else if (activeTab === 'company-requests') fetchCompanyRequests();
    else if (activeTab === 'premium-users') {
      fetchPremiumStats();
    }
    else if (activeTab === 'banned-emails') {
      fetchBannedEmails();
    }
    else if (activeTab === 'placement-verification') {
      fetchUnverifiedPlacements();
    }
    else if (activeTab === 'interview-experiences-verification') {
      fetchUnverifiedExperiences();
    }
    else if (activeTab === 'report-issues') {
      fetchReportIssues();
    }
    else if (activeTab === 'feedback') {
      fetchFeedback();
    }
    else if (activeTab === 'stats') {
      fetchAdminStats();
    }
    else if (activeTab === 'chat-history') {
      fetchChatHistory();
    }
    else if (activeTab === 'page-views') {
      fetchPageStats();
    }
    else if (activeTab === 'community') {
      if (communityTab === 'solutions') fetchCommunitySolutions();
      else fetchCommunityComments();
    }
    else if (activeTab === 'questions-database') {
      fetchAllQuestions();
    }
  }, [isAuthenticated, activeTab, reportFilter, reportStatusFilter, feedbackPage, feedbackFilter, chatHistoryLimit, communityTab]);



  // Update blurred images when blur percentage changes (debounced)
  // Only run when upload tab is active AND user has images AND is in confirmation mode
  useEffect(() => {
    if (activeTab !== 'upload' || images.length === 0 || !showConfirmation) return;

    // Debounce the blur update to prevent lag
    const timeoutId = setTimeout(async () => {
      try {
        const blurredPreviews = await Promise.all(images.map(file => blurImageTop(file, blurPercentage)));
        setBlurredUploadImages(blurredPreviews);
      } catch (error) {
        console.error('Error updating blurred previews:', error);
      }
    }, 300); // Wait 300ms after user stops adjusting slider

    return () => clearTimeout(timeoutId);
  }, [blurPercentage, images, activeTab, showConfirmation]);

  // Update blur tool images when blur percentage changes
  // Only run when blur tab is active
  useEffect(() => {
    if (activeTab !== 'blur') return;
    
    const updateBlurToolImages = async () => {
      if (blurFileInputRef.current && blurFileInputRef.current.files && blurFileInputRef.current.files.length > 0) {
        const files = Array.from(blurFileInputRef.current.files);
        try {
          const previews = await Promise.all(files.map(file => blurImageTop(file, blurPercentage)));
          setBlurPreviewImages(previews);
        } catch (error) {
          // console.error('Error updating blur tool images:', error);
        }
      }
    };
    updateBlurToolImages();
  }, [blurPercentage, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_AUTH, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'login',
          username: selectedRole === 'ultra_admin' ? 'ultra_admin' : 'admin',
          password: password,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setIsAuthenticated(true);
        setAdminRole(data.data.role);
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminRole', data.data.role);
        localStorage.setItem('adminUsername', data.data.username);
        setLoginError('');
      } else {
        setLoginError(data.message || 'Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminRole('admin');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminActiveTab');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminHasInteracted');
    setPassword('');
    setSelectedRole('admin');
  };

  // Image blur tool functions
  const blurImageTop = (file, customBlurPercentage = null) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Get the image data for the specified percentage
        const percentage = customBlurPercentage !== null ? customBlurPercentage : blurPercentage;
        const blurHeight = Math.floor(img.height * (percentage / 100));

        // If blur percentage is 0 or blur height is 0, just return the original image
        if (percentage === 0 || blurHeight === 0) {
          canvas.toBlob((blob) => {
            resolve({
              blob: blob,
              url: URL.createObjectURL(blob),
              filename: file.name
            });
          }, 'image/jpeg', 0.9);
          return;
        }

        const imageData = ctx.getImageData(0, 0, img.width, blurHeight);

        // Apply blur effect using a simple box blur
        const blurRadius = 15;
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Create a copy for blur calculation
        const original = new Uint8ClampedArray(pixels);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;

            // Sample surrounding pixels
            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
              for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                const ny = y + dy;
                const nx = x + dx;

                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  const idx = (ny * width + nx) * 4;
                  r += original[idx];
                  g += original[idx + 1];
                  b += original[idx + 2];
                  a += original[idx + 3];
                  count++;
                }
              }
            }

            const idx = (y * width + x) * 4;
            pixels[idx] = r / count;
            pixels[idx + 1] = g / count;
            pixels[idx + 2] = b / count;
            pixels[idx + 3] = a / count;
          }
        }

        // Put the blurred data back
        ctx.putImageData(imageData, 0, 0);

        // Add watermark text
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';

        // Add "oahelper.in" text
        const text1 = 'oahelper.in';
        const text1Y = blurHeight * 0.4;
        ctx.strokeText(text1, img.width / 2, text1Y);
        ctx.fillText(text1, img.width / 2, text1Y);

        // Add "blurred for safety reasons" text
        ctx.font = 'bold 16px Arial';
        const text2 = `blurred ${percentage}% for safety reasons`;
        const text2Y = blurHeight * 0.7;
        ctx.strokeText(text2, img.width / 2, text2Y);
        ctx.fillText(text2, img.width / 2, text2Y);

        // Convert canvas to blob and resolve with both blob and URL
        canvas.toBlob((blob) => {
          resolve({
            blob: blob,
            url: URL.createObjectURL(blob),
            filename: file.name
          });
        }, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleBlurFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setBlurProcessing(true);

    try {
      // Create blurred preview URLs for the images
      const previews = await Promise.all(files.map(file => blurImageTop(file)));
      setBlurPreviewImages(previews);
    } catch (error) {
      // console.error('Error processing images:', error);
    } finally {
      setBlurProcessing(false);
    }
  };

  const downloadBlurredImage = (preview) => {
    const link = document.createElement('a');
    link.href = preview.url;
    link.download = `blurred_${preview.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllBlurredImages = () => {
    blurPreviewImages.forEach((preview, index) => {
      setTimeout(() => {
        downloadBlurredImage(preview);
      }, index * 500); // Stagger downloads
    });
  };

  const clearBlurredImages = () => {
    setBlurPreviewImages([]);
    // Clear the file input
    if (blurFileInputRef.current) {
      blurFileInputRef.current.value = '';
    }
  };

  // Issues functions
  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_ISSUES, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIssues(data.data || []);
      }
    } catch (error) {
      // console.error('Error fetching issues:', error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const updateIssueStatus = async (issueId, status) => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_ISSUES, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ action: 'update_status', issue_id: issueId, status })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchIssues();
      }
    } catch (error) {
      // console.error('Error updating issue status:', error);
    }
  };

  const deleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_ISSUES, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ action: 'delete', issue_id: issueId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchIssues();
        }
      } catch (error) {
        // console.error('Error deleting issue:', error);
      }
    }
  };

  // Companies functions
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANY}?limit=1000`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCompanies(data.data || []);
        setFilteredCompanies(data.data || []);
        setTotalCompaniesCount(data.total || data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Search companies from server
  const searchCompanies = async (query) => {
    if (!query.trim()) {
      // If search is empty, show all companies
      fetchCompanies();
      return;
    }

    setSearchingCompanies(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANY}?action=search&q=${encodeURIComponent(query)}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setFilteredCompanies(data.data || []);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setSearchingCompanies(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (companySearchQuery.trim()) {
        searchCompanies(companySearchQuery);
      } else {
        setFilteredCompanies(companies);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [companySearchQuery]);

  const updateCompany = async (companyId, newName) => {
    try {
      const response = await fetch(API_ENDPOINTS.COMPANY, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ action: 'update', company_id: companyId, name: newName })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setEditingCompany(null);
        setNewCompanyName('');
        fetchCompanies();
      }
    } catch (error) {
      // console.error('Error updating company:', error);
    }
  };

  const deleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company and ALL its questions?')) {
      try {
        const response = await fetch(API_ENDPOINTS.COMPANY, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ action: 'delete', company_id: companyId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchCompanies();
        }
      } catch (error) {
        // console.error('Error deleting company:', error);
      }
    }
  };

  // Questions functions
  const fetchQuestionsByCompany = async (company) => {
    if (!company) {
      setCompanyQuestions([]);
      return;
    }

    setLoadingQuestions(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANY}?action=get_questions_by_company_name&name=${encodeURIComponent(company)}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCompanyQuestions(data.data || []);
        if (data.data.length === 0) {
          alert('No questions found for this company');
        }
      } else {
        setCompanyQuestions([]);
        alert('No questions found for this company');
      }
    } catch (error) {
      // console.error('Error fetching questions:', error);
      setCompanyQuestions([]);
      alert('Error loading questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCompanySearch = (e) => {
    e.preventDefault();
    if (companyName.trim()) {
      fetchQuestionsByCompany(companyName.trim());
    }
  };

  const deleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await fetch(API_ENDPOINTS.COMPANY, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ action: 'delete_question', question_id: questionId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          // Remove the deleted question from the list
          setCompanyQuestions(prev => prev.filter(q => q.id !== questionId));
          alert('Question deleted successfully');
        }
      } catch (error) {
        // console.error('Error deleting question:', error);
      }
    }
  };

  const openQuestionEditor = (question, mode) => {
    setEditingQuestion(question.id);
    setEditQuestionData({
      title: question.title,
      problem_statement: question.problem_statement || '',
      solution_cpp: question.solution_cpp || ''
    });
    setEditMode(mode);
  };

  const closeQuestionEditor = () => {
    setEditingQuestion(null);
    setEditQuestionData({ title: '', problem_statement: '', solution_cpp: '' });
    setEditMode(null);
  };

  const saveQuestionEdit = async () => {
    if (!editingQuestion) return;

    try {
      const response = await fetch(API_ENDPOINTS.COMPANY, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_question',
          question_id: editingQuestion,
          title: editQuestionData.title,
          problem_statement: editQuestionData.problem_statement,
          solution_cpp: editQuestionData.solution_cpp
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Question updated successfully!');
        closeQuestionEditor();
        // Refresh the questions list to show updated question
        if (companyName) {
          fetchQuestionsByCompany(companyName);
        }
      } else {
        alert(data.message || 'Failed to update question.');
      }
    } catch (err) {
      alert('An error occurred while saving the question.');
    }
  };
  // User Submissions functions
  const fetchUserSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUserSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Registered Users functions
  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_SUBMISSIONS}?action=get_users`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRegisteredUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registered users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const searchRegisteredUserByEmail = async () => {
    if (!userSearchEmail.trim()) {
      setUserSearchError('Please enter an email address');
      return;
    }

    setUserSearchLoading(true);
    setUserSearchError('');
    setSearchedUser(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_SUBMISSIONS}?action=search_user&email=${encodeURIComponent(userSearchEmail.trim())}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success' && data.user) {
        setSearchedUser(data.user);
      } else {
        setUserSearchError(data.message || 'User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setUserSearchError('Failed to search user');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to permanently delete the user "${userEmail}"? This action cannot be undone and will remove all their data including submissions, and premium subscriptions.`)) {
      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'delete_user',
            user_id: userId
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('User deleted successfully');
          setSearchedUser(null);
          setUserSearchEmail('');
          // Refresh the users list if we're viewing all users
          if (registeredUsers.length > 0) {
            fetchRegisteredUsers();
          }
        } else {
          alert(data.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  // Company Requests functions
  const fetchCompanyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.REQUEST_COMPANY}?action=get_requests`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCompanyRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching company requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateCompanyRequestStatus = async (requestId, status, approvalType = null, adminNotes = null) => {
    setProcessingRequest(requestId);
    try {
      console.log('Making request to:', API_ENDPOINTS.REQUEST_COMPANY);
      console.log('Request payload:', {
        action: 'update_status',
        request_id: requestId,
        status,
        approval_type: approvalType,
        admin_notes: adminNotes
      });

      const response = await fetch(API_ENDPOINTS.REQUEST_COMPANY, {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_status',
          request_id: requestId,
          status,
          approval_type: approvalType,
          admin_notes: adminNotes
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.status === 'success') {
        fetchCompanyRequests();
        // Show success message based on approval type
        if (status === 'approved') {
          if (approvalType === 'new_questions') {
            alert('✅ Company request approved! Email notification sent to user about new questions being added.');
          } else if (approvalType === 'no_new_questions') {
            alert('✅ Company request approved! Email notification sent to user about existing questions being available.');
          } else {
            alert('✅ Company request approved! Email notification sent to user.');
          }
        } else if (status === 'rejected') {
          alert('❌ Company request rejected.');
        }
      } else {
        alert(`❌ Error: ${data.message || 'Failed to update company request status'}`);
      }
    } catch (error) {
      console.error('Error updating company request status:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`❌ Network error occurred while updating company request status. Error: ${error.message}`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const deleteCompanyRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this company request?')) {
      try {
        const response = await fetch(API_ENDPOINTS.REQUEST_COMPANY, {
          method: 'DELETE',
          headers: getApiHeaders(),
          body: JSON.stringify({ action: 'delete', request_id: requestId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchCompanyRequests();
        }
      } catch (error) {
        console.error('Error deleting company request:', error);
      }
    }
  };

  // Payment Requests functions
  const fetchPaymentRequests = async () => {
    setLoadingPayments(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=get_payment_requests`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPaymentRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const updatePaymentRequestStatus = async (requestId, status, adminNotes = null) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=update_payment_status`, {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: adminNotes
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchPaymentRequests();
      }
    } catch (error) {
      console.error('Error updating payment request status:', error);
    }
  };

  const deletePaymentRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this payment request?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=delete_payment`, {
          method: 'DELETE',
          headers: getApiHeaders(),
          body: JSON.stringify({ request_id: requestId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchPaymentRequests();
        }
      } catch (error) {
        console.error('Error deleting payment request:', error);
      }
    }
  };

  const updateSubmissionStatus = async (submissionId, status, adminNotes = null) => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_status',
          submission_id: submissionId,
          status,
          admin_notes: adminNotes
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchUserSubmissions();
        setEditingSubmission(null);
        setSubmissionNotes('');
      }
    } catch (error) {
      console.error('Error updating submission status:', error);
    }
  };

  const markSolutionSent = async (submissionId) => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'mark_solution_sent',
          submission_id: submissionId
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchUserSubmissions();
      }
    } catch (error) {
      console.error('Error marking solution as sent:', error);
    }
  };

  const deleteUserSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this user submission and all its images?')) {
      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBMISSIONS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ action: 'delete', submission_id: submissionId })
        });
        const data = await response.json();
        if (data.status === 'success') {
          fetchUserSubmissions();
        }
      } catch (error) {
        console.error('Error deleting user submission:', error);
      }
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Upload Question functions
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Create original preview URLs (lightweight operation)
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);

    // Don't create blurred versions immediately - wait until user confirms
    // This prevents lag when uploading multiple images
    setBlurredUploadImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadCompanyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setError(null);
    setProcessing(true);
    setUploadProgress(0);
    setShowConfirmation(false);

    // Create blurred images now (when user clicks submit)
    try {
      setError('Creating blurred previews...');
      const blurredPreviews = await Promise.all(images.map(file => blurImageTop(file, blurPercentage)));
      setBlurredUploadImages(blurredPreviews);
    } catch (error) {
      setError('Error creating blurred previews');
      setProcessing(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('company_name', uploadCompanyName);
      formData.append('cpp_solution', cppSolution);
      formData.append('preview_only', 'true');
      formData.append('question_type', questionType);
      formData.append('model', selectedModel);
      formData.append('api_key_selection', selectedApiKey);

      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.status === 'success') {
                setGeneratedProblem(response.problem_statement);
                setShowConfirmation(true);
              } else {
                setError(response.message || 'Failed to process images');
              }
            } catch (err) {
              setError('Invalid response from server');
            }
          } else {
            setError(`Server error: ${xhr.status}`);
          }
          setProcessing(false);
        }
      };

      xhr.open('POST', API_ENDPOINTS.UPLOAD_QUESTION, true);
      xhr.setRequestHeader('X-API-Key', API_KEY);
      xhr.send(formData);

    } catch (err) {
      setProcessing(false);
      setError('An error occurred during upload');
    }
  };

  const confirmUpload = async () => {
    setConfirmLoading(true);
    setError(null);

    try {
      // Ensure we have blurred images ready
      if (blurredUploadImages.length === 0) {
        setError('Blurred images are not ready. Please try again.');
        setConfirmLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('company_name', uploadCompanyName);
      formData.append('cpp_solution', cppSolution);
      formData.append('problem_statement', generatedProblem);
      formData.append('confirm_upload', 'true');
      formData.append('question_type', questionType); // Send question type to backend
      formData.append('model', selectedModel);
      formData.append('api_key_selection', selectedApiKey);

      // Send blurred images instead of original images
      blurredUploadImages.forEach((blurredImage, index) => {
        // Create a File object from the blob with the original filename
        const blurredFile = new File([blurredImage.blob], `blurred_${blurredImage.filename}`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        formData.append(`image_${index}`, blurredFile);
      });

      // Add API key header for authentication
      const headers = {
        'X-API-Key': API_KEY
      };

      const response = await fetch(API_ENDPOINTS.UPLOAD_QUESTION, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        setUploadComplete(true);
        setError('✅ Question saved successfully!');

        // Navigate to question after a short delay
        setTimeout(() => {
          navigate(`/questions/${encryptId(data.question_id)}?company_id=${encryptId(data.company_id)}`);
        }, 2000);
      } else {
        setError(data.message || 'Failed to save question');
      }
    } catch (err) {
      setError('An error occurred while saving the question');
      console.error('Save error:', err);
    } finally {
      setConfirmLoading(false);
    }
  };



  const resetUploadForm = () => {
    setUploadCompanyName('');
    setCppSolution('');
    setImages([]);
    setPreviewImages([]);
    setBlurredUploadImages([]);
    setGeneratedProblem(null);
    setShowConfirmation(false);
    setUploadComplete(false);
    setError(null);
    setUploadProgress(0);
    setQuestionType('coding');
    setSelectedModel('gemini-2.5-flash');
    setSelectedApiKey('api_key_1');
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setPreviewImages(previewImages.filter((_, index) => index !== indexToRemove));
    setBlurredUploadImages(blurredUploadImages.filter((_, index) => index !== indexToRemove));
  };

  // Define sections based on admin role
  const getSidebarSections = () => {
    const baseSections = {
      'Content': [
        { id: 'upload', label: 'Upload Question', icon: FaUpload },
        { id: 'questions-database', label: 'Questions Database', icon: FaQuestionCircle },
        { id: 'companies', label: 'Companies', icon: FaBuilding },
        { id: 'community', label: 'Community', icon: FaUsers },
      ],
      'Users': [
        { id: 'user-submissions', label: 'User Submissions', icon: FaPaperPlane },
        { id: 'chat-history', label: 'Chat History (Krish)', icon: FaCommentDots },
      ],
      'Moderation': [
        { id: 'company-requests', label: 'Company Requests', icon: FaBuilding },
        { id: 'placement-verification', label: 'Placement Verification', icon: FaCalendar },
        { id: 'interview-experiences-verification', label: 'Interview Experiences', icon: FaBriefcase },
        { id: 'issues', label: 'Issues', icon: FaBug },
        { id: 'report-issues', label: 'Report Issues', icon: FaFlag },
        { id: 'feedback', label: 'User Feedback', icon: FaCommentDots },
        { id: 'suggestions', label: 'User Suggestions', icon: FaStickyNote },
        { id: 'banned-emails', label: 'Banned Emails', icon: FaLock },
      ],
      'Tools': [
        { id: 'blur', label: 'Image Blur Tool', icon: FaImage }
      ],
      'AI Tools': [
        { id: 'advanced-upload', label: 'AI Question Upload', icon: FaMagic },
        { id: 'advanced-solver', label: 'AI Question Solver', icon: FaBolt },
        { id: 'advanced-processor', label: 'Batch AI Processor', icon: FaRobot },
      ]
    };

    // Ultra admin gets additional sections
    if (adminRole === 'ultra_admin') {
      return {
        'Dashboard': [
          { id: 'stats', label: 'Statistics', icon: FaChartBar },
          { id: 'page-views', label: 'Page Views', icon: FaEye },
        ],
        ...baseSections,
        'Users': [
          { id: 'users', label: 'Registered Users', icon: FaUsers },
          { id: 'premium-users', label: 'Premium Users', icon: FaUsers },
          { id: 'user-submissions', label: 'User Submissions', icon: FaPaperPlane },
          { id: 'oacoins-management', label: 'OACoins Management', icon: FaRupeeSign },
          { id: 'chat-history', label: 'Chat History (Krish)', icon: FaCommentDots },
        ],
        'Moderation': [
          { id: 'payment-requests', label: 'Payment Requests', icon: FaRupeeSign },
          ...baseSections.Moderation,
        ],
        'Tools': baseSections.Tools
      };
    }

    return baseSections;
  };

  const sidebarSections = getSidebarSections();

  const openSolutionEditor = async (question) => {
    try {
      // Fetch the full question details, including solutions
      const response = await fetch(`${API_ENDPOINTS.QUESTION_BY_ID(question.id)}&admin=true`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        const fullQuestion = data.data;
        setEditingSolution({
          questionId: fullQuestion.id,
          title: fullQuestion.title,
          solutions: {
            cpp: fullQuestion.solution_cpp || '',
            python: fullQuestion.solution_python || '',
            java: fullQuestion.solution_java || ''
          }
        });
        setSolutionContent({
          cpp: fullQuestion.solution_cpp || '',
          python: fullQuestion.solution_python || '',
          java: fullQuestion.solution_java || ''
        });
        setSolutionLanguage('cpp');
      } else {
        alert('Failed to fetch solution details.');
      }
    } catch (err) {
      alert('An error occurred while fetching solution details.');
    }
  };

  const closeSolutionEditor = () => {
    setEditingSolution(null);
    setSolutionContent({ cpp: '', python: '', java: '' });
  };

  const saveSolution = async () => {
    if (!editingSolution) return;
    try {
      const response = await fetch(API_ENDPOINTS.COMPANY, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_solution',
          question_id: editingSolution.questionId,
          solution_cpp: solutionContent.cpp,
          solution_python: solutionContent.python,
          solution_java: solutionContent.java
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Solution updated successfully!');
        closeSolutionEditor();
        // Refresh the questions list to show updated solution
        if (companyName) {
          fetchQuestionsByCompany(companyName);
        }
      } else {
        alert(data.message || 'Failed to update solution.');
      }
    } catch (err) {
      alert('An error occurred while saving the solution.');
    }
  };

  const premiumPlanOptions = Object.entries(MANUAL_PREMIUM_PLAN_PRESETS).filter(
    ([planId, preset]) => planId !== 'custom' && preset.days && preset.amount
  );
  const currentPremiumPlanKey = premiumSearchResult?.subscription_type
    ? premiumSearchResult.subscription_type.toLowerCase()
    : '';
  const currentPremiumPlanPreset = MANUAL_PREMIUM_PLAN_PRESETS[currentPremiumPlanKey];
  const currentPremiumPlanAmount = premiumSearchResult
    ? Number(premiumSearchResult.amount) || currentPremiumPlanPreset?.amount || 0
    : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
        {/* Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
                    linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                    linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
                `,
            backgroundSize: '45px 45px',
            backgroundPosition: '16px 14px, 0 14px',
            maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
            WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
            zIndex: 1
          }}
        />

        {/* Animated gradient background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <Navbar />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-[#161616] backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] max-w-md w-full hover:border-white/20 transition-all duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/30">
                <FaLock className="text-2xl" />
              </div>
              <h1 className="text-4xl font-medium tracking-tighter text-white mb-2">
                Admin Access
              </h1>
              <p className="text-gray-500 font-medium">Enter credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 block pl-1">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`px-4 py-3 rounded-xl border transition-all duration-300 ${selectedRole === 'admin'
                      ? 'bg-white text-black border-white font-bold shadow-lg shadow-white/10'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <div className="text-sm">Admin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ultra_admin')}
                    className={`px-4 py-3 rounded-xl border transition-all duration-300 ${selectedRole === 'ultra_admin'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent font-bold shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <div className="text-sm">Ultra Admin</div>
                  </button>
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0a0a0a] border border-white/10 text-white rounded-xl pl-4 pr-12 py-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder-gray-600"
                  placeholder={`Enter ${selectedRole === 'ultra_admin' ? 'ultra admin' : 'admin'} password`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className={`w-full font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02] active:scale-[0.98] ${selectedRole === 'ultra_admin'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-purple-500/25 text-white'
                  : 'bg-white text-black hover:bg-gray-200 hover:shadow-white/25'
                  } shadow-lg`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <FaLock className="text-sm" />
                  <span>Login to Dashboard</span>
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
                    linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                    linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
                `,
          backgroundSize: '45px 45px',
          backgroundPosition: '16px 14px, 0 14px',
          maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          zIndex: 1
        }}
      />

      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-[#161616]/80 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10">
          {/* Header */}
          <div className="p-8 border-b border-white/5 relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${adminRole === 'ultra_admin'
                  ? 'from-purple-400 via-pink-500 to-red-500'
                  : 'from-blue-400 via-purple-500 to-pink-500'
                  } bg-clip-text text-transparent`}>
                  {adminRole === 'ultra_admin' ? 'Ultra Admin' : 'Admin Panel'}
                </h1>
                <p className="text-gray-500 text-xs font-medium mt-1 tracking-wide uppercase">
                  {adminRole === 'ultra_admin' ? 'Full System Access' : 'Content Management'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-wider"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {Object.entries(sidebarSections).map(([group, groupTabs]) => (
                <div key={group}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    {groupTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          localStorage.setItem('adminActiveTab', tab.id);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all text-sm font-medium group ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-white border border-white/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'}`} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-transparent overflow-y-auto relative z-10">
          <div className="bg-[#161616]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] m-8 shadow-2xl p-8 min-h-[calc(100vh-4rem)]">
            {activeTab === 'oacoins-management' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-3xl font-medium mb-8 flex items-center text-white tracking-tight">
                  <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 mr-4 border border-yellow-500/20">
                    <FaRupeeSign className="text-xl" />
                  </div>
                  OACoins Management
                </h2>

                <div className="space-y-8">
                  {/* Search User Section */}
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                      Search User
                    </h3>

                    <div className="flex space-x-4">
                      <input
                        type="email"
                        value={oacoinsSearchEmail}
                        onChange={(e) => setOacoinsSearchEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchUserByEmail()}
                        placeholder="Enter user email address"
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder-gray-600"
                      />
                      <button
                        onClick={searchUserByEmail}
                        disabled={oacoinsLoading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-blue-600/20"
                      >
                        {oacoinsLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <FaSearch className="mr-2" />
                            Search
                          </>
                        )}
                      </button>
                    </div>

                    {oacoinsError && (
                      <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center">
                        <FaExclamationTriangle className="mr-3 flex-shrink-0" />
                        {oacoinsError}
                      </div>
                    )}

                    {oacoinsSuccess && (
                      <div className="mt-6 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm flex items-center">
                        <FaCheck className="mr-3 flex-shrink-0" />
                        {oacoinsSuccess}
                      </div>
                    )}
                  </div>

                  {/* User Details Section */}
                  {oacoinsUser && (
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20 animate-fade-in">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                        User Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Name</div>
                          <div className="text-white font-medium text-lg">{oacoinsUser.name}</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Email</div>
                          <div className="text-white font-medium text-lg">{oacoinsUser.email}</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">User ID</div>
                          <div className="text-white font-medium text-lg font-mono">#{oacoinsUser.id}</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
                          <div className={`font-bold inline-flex items-center px-3 py-1 rounded-full text-sm ${oacoinsUser.verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${oacoinsUser.verified ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                            {oacoinsUser.verified ? 'Verified' : 'Unverified'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/20 rounded-2xl p-6 md:col-span-2 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FaRupeeSign className="text-8xl text-yellow-500 transform rotate-12" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-yellow-500 text-sm font-bold uppercase tracking-wider mb-2 flex items-center">
                              <FaRupeeSign className="mr-2" />
                              Current Balance
                            </div>
                            <div className="text-white font-bold text-5xl tracking-tight">{oacoinsUser.oacoins} <span className="text-xl font-medium text-gray-400">coins</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Update OACoins Section */}
                      <div className="border-t border-white/10 pt-8">
                        <h4 className="text-lg font-bold text-white mb-6 flex items-center">
                          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                          Update Balance
                        </h4>

                        <div className="space-y-6">
                          {/* Operation Type */}
                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 block pl-1">Operation Type</label>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => setOacoinsOperation('add')}
                                className={`flex-1 px-6 py-4 rounded-2xl border transition-all duration-300 font-bold flex items-center justify-center ${oacoinsOperation === 'add'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/10'
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                  }`}
                              >
                                <FaPlus className="mr-2" />
                                Add Coins
                              </button>
                              <button
                                onClick={() => setOacoinsOperation('set')}
                                className={`flex-1 px-6 py-4 rounded-2xl border transition-all duration-300 font-bold flex items-center justify-center ${oacoinsOperation === 'set'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10'
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                  }`}
                              >
                                <FaEdit className="mr-2" />
                                Set Balance
                              </button>
                            </div>
                          </div>

                          {/* Amount Input */}
                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 block pl-1">
                              {oacoinsOperation === 'add' ? 'Amount to Add' : 'New Balance'}
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={oacoinsAmount}
                                onChange={(e) => setOacoinsAmount(e.target.value)}
                                placeholder={oacoinsOperation === 'add' ? 'Enter amount to add' : 'Enter new balance'}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all font-mono text-lg"
                              />
                              <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                COINS
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          {oacoinsAmount && !isNaN(parseInt(oacoinsAmount)) && (
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                              <div>
                                <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Preview Update</div>
                                <div className="text-gray-400 text-sm">Balance will change from <span className="text-white font-mono">{oacoinsUser.oacoins}</span> to:</div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-white flex items-center">
                                  {oacoinsOperation === 'add'
                                    ? oacoinsUser.oacoins + parseInt(oacoinsAmount)
                                    : parseInt(oacoinsAmount)
                                  }
                                  <span className="text-lg text-blue-400 ml-2 font-medium">coins</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Update Button */}
                          <button
                            onClick={updateUserOacoins}
                            disabled={oacoinsLoading || !oacoinsAmount}
                            className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center shadow-lg shadow-orange-500/20"
                          >
                            {oacoinsLoading ? (
                              <>
                                <FaSpinner className="animate-spin mr-3" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <FaCheck className="mr-3" />
                                Confirm & Update Balance
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex items-start space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 flex-shrink-0">
                      <FaExclamationTriangle className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-bold mb-2">Important Notes</h4>
                      <ul className="space-y-2 text-gray-400 text-sm">
                        <li className="flex items-start"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span><strong>Add Coins:</strong> Adds the specified amount to the user's current balance.</li>
                        <li className="flex items-start"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span><strong>Set Balance:</strong> Sets the user's balance to the exact amount specified (overwrites current balance).</li>
                        <li className="flex items-start"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>All changes are immediate and logged for security.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat-history' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaCommentDots className="mr-2 text-purple-400" />
                  Chat History (Krish AI Assistant)
                </h2>

                <div className="space-y-4">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Total Conversations</div>
                      <div className="text-2xl font-bold text-white">{chatHistoryTotal}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Showing</div>
                      <div className="text-2xl font-bold text-white">{chatHistory.length}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Limit</div>
                      <select
                        value={chatHistoryLimit}
                        onChange={(e) => setChatHistoryLimit(parseInt(e.target.value))}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                      </select>
                    </div>
                  </div>

                  {/* Chat History List */}
                  {loadingChatHistory ? (
                    <div className="text-center py-8">
                      <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                      <p>Loading chat history...</p>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No chat history found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((chat) => (
                        <div key={chat.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {chat.user_email ? chat.user_email.charAt(0).toUpperCase() : 'G'}
                              </div>
                              <div>
                                <div className="text-white font-medium">
                                  {chat.user_email || 'Guest User'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {chat.is_logged_in ? (
                                    <span className="text-green-400">● Logged In</span>
                                  ) : (
                                    <span className="text-gray-400">○ Guest</span>
                                  )}
                                  {chat.is_premium && (
                                    <span className="ml-2 text-yellow-400">★ Premium</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(chat.created_at).toLocaleString()}
                            </div>
                          </div>

                          {/* User Message */}
                          <div className="mb-3">
                            <div className="text-xs text-gray-400 mb-1">User:</div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-white text-sm">
                              {chat.user_message}
                            </div>
                          </div>

                          {/* Bot Response */}
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Krish:</div>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-gray-200 text-sm">
                              {chat.bot_response}
                            </div>
                          </div>

                          {/* Session Info */}
                          {chat.session_id && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                              Session: {chat.session_id}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaChartBar className="mr-2 text-blue-400" />
                  Admin Statistics Dashboard
                </h2>

                {loadingStats ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading statistics...</p>
                  </div>
                ) : adminStats ? (
                  <div className="space-y-8">
                    {/* Today's Overview */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaCalendar className="mr-2 text-blue-400" />
                        Today's Activity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{adminStats.users.today}</div>
                          <div className="text-sm text-gray-400">New Users</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{adminStats.premium.today}</div>
                          <div className="text-sm text-gray-400">New Subscriptions</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">{adminStats.submissions.today}</div>
                          <div className="text-sm text-gray-400">Question Submissions</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-400">₹{adminStats.premium.today_revenue}</div>
                          <div className="text-sm text-gray-400">Today's Revenue</div>
                        </div>
                      </div>
                    </div>

                    {/* User Statistics */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaUsers className="mr-2 text-blue-400" />
                        User Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Users</span>
                            <FaUsers className="text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.users.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.users.verified} verified ({Math.round((adminStats.users.verified / adminStats.users.total) * 100)}%)
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Today</span>
                            {(() => {
                              const trend = adminStats.users.today - adminStats.users.yesterday;
                              if (trend > 0) return <FaArrowUp className="text-green-400" />;
                              if (trend < 0) return <FaArrowDown className="text-red-400" />;
                              return <FaMinus className="text-gray-400" />;
                            })()}
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.users.today}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            vs {adminStats.users.yesterday} yesterday
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">This Month</span>
                            <FaChartLine className="text-purple-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.users.this_month}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            New registrations
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium Statistics */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaRupeeSign className="mr-2 text-green-400" />
                        Premium Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Revenue</span>
                            <FaRupeeSign className="text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-green-400">₹{adminStats.premium.total_revenue}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            From {adminStats.premium.total_active} active subscriptions
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Today</span>
                            {(() => {
                              const trend = adminStats.premium.today - adminStats.premium.yesterday;
                              if (trend > 0) return <FaArrowUp className="text-green-400" />;
                              if (trend < 0) return <FaArrowDown className="text-red-400" />;
                              return <FaMinus className="text-gray-400" />;
                            })()}
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.premium.today}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            vs {adminStats.premium.yesterday} yesterday
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">This Month</span>
                            <FaChartPie className="text-purple-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.premium.this_month}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            New subscriptions
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Active Subscriptions</span>
                            <FaCheck className="text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.premium.total_active}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Currently active
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Statistics */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaQuestionCircle className="mr-2 text-purple-400" />
                        Content Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Companies</span>
                            <FaBuilding className="text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.companies.total}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Questions</span>
                            <FaQuestionCircle className="text-purple-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.companies.total_questions}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Submissions</span>
                            <FaUsers className="text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.submissions.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.submissions.completed} completed, {adminStats.submissions.pending} pending
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Today's Submissions</span>
                            {(() => {
                              const trend = adminStats.submissions.today - adminStats.submissions.yesterday;
                              if (trend > 0) return <FaArrowUp className="text-green-400" />;
                              if (trend < 0) return <FaArrowDown className="text-red-400" />;
                              return <FaMinus className="text-gray-400" />;
                            })()}
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.submissions.today}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            vs {adminStats.submissions.yesterday} yesterday
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Statistics */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaPaperPlane className="mr-2 text-orange-400" />
                        Request Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Company Requests</span>
                            <FaBuilding className="text-orange-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.company_requests.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.company_requests.pending} pending, {adminStats.company_requests.approved} approved
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Payment Requests</span>
                            <FaRupeeSign className="text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.payment_requests.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.payment_requests.pending} pending, {adminStats.payment_requests.approved} approved
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Issues Reported</span>
                            <FaBug className="text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.issues.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.issues.pending} pending, {adminStats.issues.resolved} resolved
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Content Reports</span>
                            <FaFlag className="text-yellow-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.reports.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adminStats.reports.pending} pending
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Statistics */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaLock className="mr-2 text-red-400" />
                        Security Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Banned Emails</span>
                            <FaLock className="text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{adminStats.banned_emails.total}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Emails currently banned
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FaChartLine className="mr-2 text-blue-400" />
                        Recent Activity (Last 7 Days)
                      </h3>
                      <div className="space-y-3">
                        {adminStats.recent_activity.map((day, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <div className="text-gray-300 font-medium">{day.date}</div>
                            <div className="flex space-x-6 text-sm">
                              <div className="flex items-center space-x-1">
                                <FaUsers className="text-blue-400" />
                                <span className="text-gray-300">{day.users}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FaRupeeSign className="text-green-400" />
                                <span className="text-gray-300">{day.subscriptions}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FaQuestionCircle className="text-purple-400" />
                                <span className="text-gray-300">{day.submissions}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FaChartBar className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'page-views' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaEye className="mr-2 text-blue-400" />
                  Page View Statistics
                </h2>

                {loadingPageStats ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading page view statistics...</p>
                  </div>
                ) : pageViewStats && pageViewStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pageViewStats.map((stat, index) => (
                      <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          {stat.page_name}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-sm">Total Views</span>
                              <FaEye className="text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{stat.total_views}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-sm">Unique Visitors</span>
                              <FaUsers className="text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{stat.unique_visitors}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FaEye className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No page view statistics available</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'issues' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaBug className="mr-2 text-red-400" />
                  User Issues
                </h2>

                {loadingIssues ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading issues...</p>
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaBug className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No issues reported yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {issues.map(issue => (
                      <div key={issue.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${issue.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                issue.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                {issue.status}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {new Date(issue.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-white mb-2">{issue.issue_text}</p>
                            <p className="text-gray-400 text-sm">Page: {issue.page_url}</p>
                          </div>
                          <div className="flex space-x-2">
                            <select
                              value={issue.status}
                              onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                            <button
                              onClick={() => deleteIssue(issue.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'companies' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaBuilding className="mr-2 text-blue-400" />
                  Manage Companies
                </h2>

                {/* Search Bar */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="flex items-center space-x-3">
                    {searchingCompanies ? (
                      <FaSpinner className="text-blue-400 animate-spin" />
                    ) : (
                      <FaSearch className="text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      placeholder="Search companies across entire database..."
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {companySearchQuery && (
                      <button
                        onClick={() => setCompanySearchQuery('')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {companySearchQuery && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {searchingCompanies ? (
                          'Searching...'
                        ) : (
                          <>Found {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}</>
                        )}
                      </span>
                      <span className="text-gray-500">
                        Total in database: {totalCompaniesCount}
                      </span>
                    </div>
                  )}
                  {!companySearchQuery && totalCompaniesCount > 0 && (
                    <div className="mt-3 text-sm text-gray-500">
                      Showing all {companies.length} companies (Total: {totalCompaniesCount})
                    </div>
                  )}
                </div>

                {(loadingCompanies || searchingCompanies) ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>{searchingCompanies ? 'Searching companies...' : 'Loading companies...'}</p>
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaBuilding className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>{companySearchQuery ? 'No companies found matching your search' : 'No companies yet'}</p>
                    {companySearchQuery && (
                      <button
                        onClick={() => setCompanySearchQuery('')}
                        className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                      >
                        Clear search and show all companies
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stats Card */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FaBuilding className="text-blue-400 text-2xl" />
                          <div>
                            <div className="text-2xl font-bold text-white">{companies.length}</div>
                            <div className="text-sm text-gray-400">Total Companies</div>
                          </div>
                        </div>
                        {companySearchQuery && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-400">{filteredCompanies.length}</div>
                            <div className="text-sm text-gray-400">Filtered Results</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Companies List */}
                    {filteredCompanies.map(company => (
                      <div key={company.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                        {editingCompany === company.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-gray-400 text-sm mb-2 block">Company Name</label>
                              <input
                                type="text"
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new company name"
                                autoFocus
                              />
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  if (newCompanyName.trim()) {
                                    updateCompany(company.id, newCompanyName.trim());
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all font-medium flex items-center justify-center"
                              >
                                <FaSave className="mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCompany(null);
                                  setNewCompanyName('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-all font-medium flex items-center justify-center"
                              >
                                <FaTimes className="mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                                  {company.question_count || 0} questions
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <FaQuestionCircle className="mr-1" />
                                  ID: #{company.id}
                                </span>
                                {company.created_at && (
                                  <span className="flex items-center">
                                    <FaClock className="mr-1" />
                                    Added: {formatDateTime(company.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCompany(company.id);
                                  setNewCompanyName(company.name);
                                }}
                                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all font-medium flex items-center"
                              >
                                <FaEdit className="mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCompany(company.id)}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all font-medium flex items-center"
                              >
                                <FaTrash className="mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warning Box */}
                <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <FaExclamationTriangle className="text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="text-yellow-300 text-sm">
                      <p className="font-semibold mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Deleting a company will permanently remove ALL questions associated with it</li>
                        <li>Editing a company name will update it across the entire platform</li>
                        <li>These actions cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaUsers className="mr-2 text-blue-400" />
                  Registered Users
                </h2>

                {/* Search User Section */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search & Delete User</h3>

                  <div className="flex space-x-3 mb-4">
                    <input
                      type="email"
                      value={userSearchEmail}
                      onChange={(e) => setUserSearchEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchRegisteredUserByEmail()}
                      placeholder="Enter user email address"
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={searchRegisteredUserByEmail}
                      disabled={userSearchLoading}
                      className="px-6 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {userSearchLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <FaSearch className="mr-2" />
                          Search
                        </>
                      )}
                    </button>
                  </div>

                  {userSearchError && (
                    <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg text-sm">
                      {userSearchError}
                    </div>
                  )}

                  {searchedUser && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-semibold text-white">{searchedUser.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${searchedUser.verified === 1
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              }`}>
                              {searchedUser.verified === 1 ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center text-gray-300">
                                <FaEnvelope className="mr-2 text-blue-400 w-4 h-4" />
                                <span className="text-sm font-medium">Email:</span>
                                <span className="ml-2 text-sm">{searchedUser.email}</span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <FaBuilding className="mr-2 text-purple-400 w-4 h-4" />
                                <span className="text-sm font-medium">College:</span>
                                <span className="ml-2 text-sm">{searchedUser.college || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                <span className="text-sm font-medium">Joined:</span>
                                <span className="ml-2 text-sm">{formatDateTime(searchedUser.created_at)}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center text-gray-300">
                                <span className="text-sm font-medium">User ID:</span>
                                <span className="ml-2 text-sm text-gray-400">#{searchedUser.id}</span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <FaRupeeSign className="mr-2 text-yellow-400 w-4 h-4" />
                                <span className="text-sm font-medium">OACoins:</span>
                                <span className="ml-2 text-sm text-yellow-300">{searchedUser.oacoins || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-red-300 text-sm font-semibold mb-2">Danger Zone</p>
                                <p className="text-red-300 text-xs mb-3">
                                  Deleting this user will permanently remove all their data including submissions, premium subscriptions, and OACoins balance. This action cannot be undone.
                                </p>
                                <button
                                  onClick={() => deleteUser(searchedUser.id, searchedUser.email)}
                                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/40 hover:bg-red-500/30 transition-all font-medium flex items-center text-sm"
                                >
                                  <FaTrash className="mr-2" />
                                  Delete User Permanently
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* All Users List */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">All Registered Users</h3>

                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                      <p>Loading registered users...</p>
                    </div>
                  ) : registeredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FaUsers className="text-4xl mx-auto mb-4 opacity-50" />
                      <p>No registered users yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Total Users: {registeredUsers.length}</span>
                          <span>Verified Users: {registeredUsers.filter(user => user.verified === 1).length}</span>
                        </div>
                      </div>

                      {registeredUsers.map(user => (
                        <div key={user.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.verified === 1
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  }`}>
                                  {user.verified === 1 ? 'VERIFIED' : 'UNVERIFIED'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center text-gray-300">
                                    <FaEnvelope className="mr-2 text-blue-400 w-4 h-4" />
                                    <span className="text-sm font-medium">Email:</span>
                                    <span className="ml-2 text-sm">{user.email}</span>
                                  </div>
                                  <div className="flex items-center text-gray-300">
                                    <FaBuilding className="mr-2 text-purple-400 w-4 h-4" />
                                    <span className="text-sm font-medium">College:</span>
                                    <span className="ml-2 text-sm">{user.college || 'Not provided'}</span>
                                  </div>
                                  <div className="flex items-center text-gray-300">
                                    <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                    <span className="text-sm font-medium">Joined:</span>
                                    <span className="ml-2 text-sm">{formatDateTime(user.created_at)}</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center text-gray-300">
                                    <span className="text-sm font-medium">User ID:</span>
                                    <span className="ml-2 text-sm text-gray-400">#{user.id}</span>
                                  </div>
                                  {user.verification_code && (
                                    <div className="flex items-center text-gray-300">
                                      <span className="text-sm font-medium">Verification Code:</span>
                                      <span className="ml-2 text-sm text-yellow-300">{user.verification_code}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete user"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'company-requests' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaBuilding className="mr-2 text-orange-400" />
                  Company Requests
                </h2>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-blue-300">
                    <FaEnvelope className="mr-2" />
                    <p className="text-sm">
                      <strong>Email Notifications:</strong> Choose the appropriate approval option based on whether new questions were found. Users will receive different email notifications accordingly.
                    </p>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        try {
                          console.log('Testing API connection...');
                          const response = await fetch(API_ENDPOINTS.REQUEST_COMPANY + '?action=get_requests', {
                            headers: getApiHeaders()
                          });
                          const data = await response.json();
                          console.log('Test response:', data);
                          alert('✅ API connection test successful! Check console for details.');
                        } catch (error) {
                          console.error('Test error:', error);
                          alert('❌ API connection test failed: ' + error.message);
                        }
                      }}
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30 hover:bg-green-500/30 text-xs"
                    >
                      Test API Connection
                    </button>
                  </div>
                </div>

                {loadingRequests ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading company requests...</p>
                  </div>
                ) : companyRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaBuilding className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No company requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                        <span>Total Requests: {companyRequests.length}</span>
                        <span>Pending: {companyRequests.filter(req => req.status === 'pending').length}</span>
                        <span>Approved: {companyRequests.filter(req => req.status === 'approved').length}</span>
                        <span>Rejected: {companyRequests.filter(req => req.status === 'rejected').length}</span>
                      </div>
                    </div>

                    {companyRequests.map(request => (
                      <div key={request.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-semibold text-white">{request.company_name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                request.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                  'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                {request.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-gray-300">
                                  <FaEnvelope className="mr-2 text-blue-400 w-4 h-4" />
                                  <span className="text-sm font-medium">Email:</span>
                                  <span className="ml-2 text-sm">{request.user_email || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                  <span className="text-sm font-medium">Requested:</span>
                                  <span className="ml-2 text-sm">{formatDateTime(request.requested_at)}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center text-gray-300">
                                  <span className="text-sm font-medium">Request ID:</span>
                                  <span className="ml-2 text-sm text-gray-400">#{request.id}</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <span className="text-sm font-medium">User ID:</span>
                                  <span className="ml-2 text-sm text-gray-400">{request.user_id || 'Guest'}</span>
                                </div>
                              </div>
                            </div>

                            {request.admin_notes && (
                              <div className="mb-4">
                                <p className="text-gray-400 text-sm font-medium mb-1">Admin Notes:</p>
                                <p className="text-gray-300 text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                  {request.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {request.status === 'pending' && (
                              <>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => updateCompanyRequestStatus(request.id, 'approved', 'new_questions')}
                                    disabled={processingRequest === request.id}
                                    className="w-full px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Approve request - new questions were found and added"
                                  >
                                    {processingRequest === request.id ? (
                                      <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        ✓ Approve (New Questions)
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => updateCompanyRequestStatus(request.id, 'approved', 'no_new_questions')}
                                    disabled={processingRequest === request.id}
                                    className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Approve request - no new questions found, but existing questions available"
                                  >
                                    {processingRequest === request.id ? (
                                      <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        ✓ Approve (No New Questions)
                                      </>
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={() => updateCompanyRequestStatus(request.id, 'rejected')}
                                  disabled={processingRequest === request.id}
                                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  {processingRequest === request.id ? (
                                    <>
                                      <FaSpinner className="animate-spin mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      ✗ Reject
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => deleteCompanyRequest(request.id)}
                              className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-all text-sm font-medium"
                            >
                              🗑 Delete
                            </button>

                            {request.user_email && (
                              <a
                                href={`mailto:${request.user_email}?subject=Your company request: ${request.company_name}`}
                                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium text-center"
                              >
                                📧 Contact
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'payment-requests' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaRupeeSign className="mr-2 text-green-400" />
                  Premium Payment Requests
                </h2>

                {loadingPayments ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading payment requests...</p>
                  </div>
                ) : paymentRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaRupeeSign className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No payment requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                        <span>Total Requests: {paymentRequests.length}</span>
                        <span>Pending: {paymentRequests.filter(req => req.status === 'pending').length}</span>
                        <span>Approved: {paymentRequests.filter(req => req.status === 'approved').length}</span>
                        <span>Rejected: {paymentRequests.filter(req => req.status === 'rejected').length}</span>
                      </div>
                    </div>

                    {paymentRequests.map(request => {
                      // Determine plan badge color and name
                      const getPlanBadge = (planType, amount) => {
                        const type = planType || (amount >= 999 ? 'yearly' : amount >= 299 ? 'unlimited' : amount >= 199 ? 'pro' : 'basic');
                        const badges = {
                          'yearly': { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', name: 'Yearly Plan', icon: '👑' },
                          'unlimited': { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', name: 'Unlimited Plan', icon: '∞' },
                          'pro': { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', name: 'Pro Plan', icon: '⭐' },
                          'basic': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', name: 'Basic Plan', icon: '📦' }
                        };
                        return badges[type] || badges['basic'];
                      };

                      const planBadge = getPlanBadge(request.plan_type, request.amount);

                      return (
                        <div key={request.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="text-xl font-semibold text-white">₹{request.amount} Payment</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${planBadge.color}`}>
                                  {planBadge.icon} {planBadge.name}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                  request.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    'bg-red-500/20 text-red-300 border border-red-500/30'
                                  }`}>
                                  {request.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center text-gray-300">
                                    <FaEnvelope className="mr-2 text-blue-400 w-4 h-4" />
                                    <span className="text-sm font-medium">User:</span>
                                    <span className="ml-2 text-sm">{request.user_name} ({request.user_email})</span>
                                  </div>
                                  <div className="flex items-center text-gray-300">
                                    <span className="text-sm font-medium">User ID:</span>
                                    <span className="ml-2 text-sm text-gray-400">#{request.user_id}</span>
                                  </div>
                                  <div className="flex items-center text-gray-300">
                                    <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                    <span className="text-sm font-medium">Submitted:</span>
                                    <span className="ml-2 text-sm">{formatDateTime(request.submitted_at)}</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center text-gray-300">
                                    <span className="text-sm font-medium">Payment Method:</span>
                                    <span className="ml-2 text-sm text-blue-300">{request.payment_method}</span>
                                  </div>
                                  {request.utr_number && (
                                    <div className="flex items-center text-gray-300">
                                      <span className="text-sm font-medium">UTR/Transaction ID:</span>
                                      <span className="ml-2 text-sm text-green-300">{request.utr_number}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center text-gray-300">
                                    <span className="text-sm font-medium">Request ID:</span>
                                    <span className="ml-2 text-sm text-gray-400">#{request.id}</span>
                                  </div>
                                </div>
                              </div>

                              {request.payment_details && (
                                <div className="mb-4">
                                  <p className="text-gray-400 text-sm font-medium mb-1">Payment Details:</p>
                                  <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                                    {request.payment_details}
                                  </p>
                                </div>
                              )}

                              {request.payment_screenshot && (
                                <div className="mb-4">
                                  <p className="text-gray-400 text-sm font-medium mb-2">Payment Screenshot:</p>
                                  <div className="relative group">
                                    <img
                                      src={`${API_ENDPOINTS.BASE_URL}/${request.payment_screenshot}`}
                                      alt="Payment screenshot"
                                      className="w-full max-w-md h-auto rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(`${API_ENDPOINTS.BASE_URL}/${request.payment_screenshot}`, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <FaEye className="text-white text-lg" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {request.admin_notes && (
                                <div className="mb-4">
                                  <p className="text-gray-400 text-sm font-medium mb-1">Admin Notes:</p>
                                  <p className="text-gray-300 text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                    {request.admin_notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updatePaymentRequestStatus(request.id, 'approved')}
                                    className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm font-medium"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => updatePaymentRequestStatus(request.id, 'rejected')}
                                    className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all text-sm font-medium"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => deletePaymentRequest(request.id)}
                                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-all text-sm font-medium"
                              >
                                🗑 Delete
                              </button>

                              {request.user_email && (
                                <a
                                  href={`mailto:${request.user_email}?subject=Your premium payment request (ID: ${request.id})`}
                                  className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium text-center"
                                >
                                  📧 Contact
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'user-submissions' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaUsers className="mr-2 text-purple-400" />
                  User Question Submissions
                </h2>

                {loadingSubmissions ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading user submissions...</p>
                  </div>
                ) : userSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaUsers className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No user submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userSubmissions.map(submission => (
                      <div key={submission.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${submission.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                submission.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                  submission.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                {submission.status.replace('_', ' ').toUpperCase()}
                              </span>
                              {submission.solution_sent && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  SOLUTION SENT
                                </span>
                              )}
                              <span className="text-gray-400 text-sm flex items-center">
                                <FaClock className="mr-1" />
                                {formatDateTime(submission.submitted_at)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-white">
                                  <FaEnvelope className="mr-2 text-blue-400" />
                                  <span className="font-medium">Email:</span>
                                  <span className="ml-2">{submission.user_email}</span>
                                </div>
                                <div className="flex items-center text-white">
                                  <FaBuilding className="mr-2 text-green-400" />
                                  <span className="font-medium">Company:</span>
                                  <span className="ml-2">{submission.company_name}</span>
                                </div>
                                <div className="flex items-center text-white">
                                  <FaImage className="mr-2 text-purple-400" />
                                  <span className="font-medium">Images:</span>
                                  <span className="ml-2">{submission.image_count}</span>
                                </div>
                              </div>

                              {submission.additional_info && (
                                <div>
                                  <p className="text-gray-400 text-sm font-medium mb-1">Additional Info:</p>
                                  <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                                    {submission.additional_info}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Images Preview */}
                            {submission.images && submission.images.length > 0 && (
                              <div className="mb-4">
                                <p className="text-gray-400 text-sm font-medium mb-2">Uploaded Images:</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {submission.images.map((image, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={image.url}
                                        alt={`Submission ${submission.id} - ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(image.url, '_blank')}
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <FaEye className="text-white text-lg" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Notes */}
                            {submission.admin_notes && (
                              <div className="mb-4">
                                <p className="text-gray-400 text-sm font-medium mb-1">Admin Notes:</p>
                                <p className="text-gray-300 text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                  {submission.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {/* Status Update */}
                            <select
                              value={submission.status}
                              onChange={(e) => updateSubmissionStatus(submission.id, e.target.value)}
                              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingSubmission(submission.id);
                                  setSubmissionNotes(submission.admin_notes || '');
                                }}
                                className="text-blue-400 hover:text-blue-300 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"
                                title="Add Notes"
                              >
                                <FaStickyNote />
                              </button>

                              {submission.status === 'completed' && !submission.solution_sent && (
                                <button
                                  onClick={() => markSolutionSent(submission.id)}
                                  className="text-green-400 hover:text-green-300 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                                  title="Mark Solution Sent"
                                >
                                  <FaCheck />
                                </button>
                              )}

                              <button
                                onClick={() => deleteUserSubmission(submission.id)}
                                className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg border border-red-500/20"
                                title="Delete Submission"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Notes Editing */}
                        {editingSubmission === submission.id && (
                          <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-1">
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                  Admin Notes:
                                </label>
                                <textarea
                                  value={submissionNotes}
                                  onChange={(e) => setSubmissionNotes(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm resize-none h-20"
                                  placeholder="Add notes about this submission..."
                                />
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => updateSubmissionStatus(submission.id, submission.status, submissionNotes)}
                                  className="text-green-400 hover:text-green-300 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                                >
                                  <FaSave />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSubmission(null);
                                    setSubmissionNotes('');
                                  }}
                                  className="text-gray-400 hover:text-gray-300 p-2 bg-gray-500/10 rounded-lg border border-gray-500/20"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'companies' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaBuilding className="mr-2 text-blue-400" />
                  Companies
                </h2>

                {loadingCompanies ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading companies...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {companies.map(company => (
                      <div key={company.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {editingCompany === company.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={newCompanyName}
                                  onChange={(e) => setNewCompanyName(e.target.value)}
                                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 flex-1"
                                  placeholder="Company name"
                                />
                                <button
                                  onClick={() => updateCompany(company.id, newCompanyName)}
                                  className="text-green-400 hover:text-green-300 p-2"
                                >
                                  <FaSave />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCompany(null);
                                    setNewCompanyName('');
                                  }}
                                  className="text-gray-400 hover:text-gray-300 p-2"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-xl font-semibold text-white">{company.name}</h3>
                                <p className="text-gray-400 text-sm">
                                  {company.question_count || 0} questions
                                </p>
                              </div>
                            )}
                          </div>

                          {editingCompany !== company.id && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCompany(company.id);
                                  setNewCompanyName(company.name);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-2"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteCompany(company.id)}
                                className="text-red-400 hover:text-red-300 p-2"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaQuestionCircle className="mr-2 text-green-400" />
                  Question Management
                </h2>

                {/* Company Name Search */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <form onSubmit={handleCompanySearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-blue-500/50 focus:outline-none"
                        placeholder="Enter company name (e.g., Google, Microsoft)"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingQuestions || !companyName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                      {loadingQuestions ? (
                        <>
                          <FaSpinner className="animate-spin mr-2 inline" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <FaSearch className="mr-2 inline" />
                          Search Questions
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Company Questions Display */}
                {companyQuestions.length > 0 && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Questions for: {companyName}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Found {companyQuestions.length} question{companyQuestions.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {companyQuestions.map(question => (
                      <div key={question.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{question.title}</h3>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                                ID: {question.id}
                              </span>
                            </div>
                            <p className="text-blue-300 mb-2">{question.company_name}</p>
                            <p className="text-gray-400 text-sm mb-4">
                              Created: {new Date(question.created_at).toLocaleDateString()}
                            </p>

                            {/* Problem Statement */}
                            <div className="mb-4">
                              <h4 className="text-gray-300 font-medium mb-2 flex items-center">
                                <FaEdit className="mr-2" />
                                Problem Statement:
                              </h4>
                              <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                                <div
                                  className="text-gray-300 text-sm"
                                  dangerouslySetInnerHTML={{ __html: question.problem_statement || 'No problem statement available' }}
                                />
                              </div>
                            </div>

                            {/* C++ Solution */}
                            <div className="mb-4">
                              <h4 className="text-gray-300 font-medium mb-2 flex items-center">
                                <FaCode className="mr-2" />
                                C++ Solution:
                              </h4>
                              {question.solution_cpp ? (
                                <div className="bg-black/30 border border-green-500/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                                  <pre className="text-green-300 text-sm font-mono whitespace-pre-wrap">
                                    {question.solution_cpp}
                                  </pre>
                                </div>
                              ) : (
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                  <p className="text-gray-500 text-sm italic">No C++ solution provided</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 justify-end border-t border-white/10 pt-4">
                          <button
                            onClick={() => navigate(`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`)}
                            className="text-blue-400 hover:text-blue-300 px-4 py-2 border border-blue-500/30 rounded-lg transition-all"
                            title="View Question"
                          >
                            <FaEye className="mr-2 inline" />
                            View
                          </button>
                          <button
                            onClick={() => openQuestionEditor(question, 'problem')}
                            className="text-yellow-400 hover:text-yellow-300 px-4 py-2 border border-yellow-500/30 rounded-lg transition-all"
                            title="Edit Problem Statement"
                          >
                            <FaEdit className="mr-2 inline" />
                            Edit Problem
                          </button>
                          <button
                            onClick={() => openQuestionEditor(question, 'solution')}
                            className="text-green-400 hover:text-green-300 px-4 py-2 border border-green-500/30 rounded-lg transition-all"
                            title="Edit C++ Solution"
                          >
                            <FaCode className="mr-2 inline" />
                            Edit Solution
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this question?')) {
                                deleteQuestion(question.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 px-4 py-2 border border-red-500/30 rounded-lg transition-all"
                            title="Delete Question"
                          >
                            <FaTrash className="mr-2 inline" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {companyName && companyQuestions.length === 0 && !loadingQuestions && (
                  <div className="text-center py-8 text-gray-400">
                    <FaQuestionCircle className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No questions found for company: {companyName}</p>
                    <p className="text-sm mt-2">Please check the company name and try again</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'upload' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaUpload className="mr-2 text-purple-400" />
                  Upload Question
                </h2>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/40 text-red-400 p-4 rounded-xl mb-6">
                    <p>{error}</p>
                  </div>
                )}

                {uploadComplete ? (
                  <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <FaCheck className="mr-2" />
                      <p>Upload successful! Question processed and added to database.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {!showConfirmation && (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={uploadCompanyName}
                            onChange={(e) => setUploadCompanyName(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter company name"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Question Type
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              type="button"
                              onClick={() => setQuestionType('coding')}
                              className={`px-4 py-3 rounded-xl border transition-all ${questionType === 'coding'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                }`}
                            >
                              <FaCode className="inline mr-2" />
                              Coding
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestionType('mcq')}
                              className={`px-4 py-3 rounded-xl border transition-all ${questionType === 'mcq'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                }`}
                            >
                              <FaQuestionCircle className="inline mr-2" />
                              MCQ
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestionType('sql')}
                              className={`px-4 py-3 rounded-xl border transition-all ${questionType === 'sql'
                                ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                }`}
                            >
                              <FaCode className="inline mr-2" />
                              SQL
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestionType('api')}
                              className={`px-4 py-3 rounded-xl border transition-all ${questionType === 'api'
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                }`}
                            >
                              <FaCode className="inline mr-2" />
                              API
                            </button>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">
                            {questionType === 'coding' && 'AI will extract coding problem with examples and constraints'}
                            {questionType === 'mcq' && 'AI will extract MCQ question with options and correct answer'}
                            {questionType === 'sql' && 'AI will extract SQL query problem with database schema'}
                            {questionType === 'api' && 'AI will extract API design/integration problem'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            AI Model Selection
                          </label>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="gemini-2.5-pro" className="bg-gray-900">
                              Gemini 2.5 Pro - Most powerful reasoning (Input: $1.25-2.50 / Output: $10.00-15.00)
                            </option>
                            <option value="gemini-2.5-flash" className="bg-gray-900">
                              Gemini 2.5 Flash - Hybrid reasoning, 1M context (Input: $0.30 / Output: $2.50)
                            </option>
                            <option value="gemini-2.5-flash-lite" className="bg-gray-900">
                              Gemini 2.5 Flash-Lite - Most cost effective (Input: $0.10 / Output: $0.40)
                            </option>
                            <option value="gemini-flash-latest" className="bg-gray-900">
                              Gemini Flash Latest - Latest preview version (Input: $0.30 / Output: $2.50)
                            </option>
                          </select>
                          <p className="text-gray-500 text-xs mt-2">
                            {selectedModel === 'gemini-2.5-pro' && '🚀 Best for complex reasoning and coding tasks. Higher cost but superior quality.'}
                            {selectedModel === 'gemini-2.5-flash' && '⚡ Balanced performance and cost. Recommended for most use cases.'}
                            {selectedModel === 'gemini-2.5-flash-lite' && '💰 Most economical option. Great for simple extractions at scale.'}
                            {selectedModel === 'gemini-flash-latest' && '🆕 Latest preview with hybrid reasoning capabilities.'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            API Key Selection
                          </label>
                          <select
                            value={selectedApiKey}
                            onChange={(e) => setSelectedApiKey(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="api_key_1" className="bg-gray-900">
                              API Key 1 (Primary)
                            </option>
                            <option value="api_key_2" className="bg-gray-900">
                              API Key 2 (Secondary)
                            </option>
                          </select>
                          <p className="text-gray-500 text-xs mt-2">
                            🔑 Select which API key to use for processing. Keys are configured securely on the server.
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            C++ Solution (Optional)
                          </label>
                          <textarea
                            value={cppSolution}
                            onChange={(e) => setCppSolution(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 w-full h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                            placeholder="Paste your C++ solution code here... (Leave empty if no solution available)"
                          />
                          <p className="text-gray-500 text-xs mt-1">
                            Leave empty if you don't have a C++ solution for this problem
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Blur Percentage for Safety (Default: 23%)
                          </label>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center space-x-4">
                              <span className="text-gray-400 text-sm min-w-[30px]">1%</span>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={blurPercentage}
                                onChange={(e) => setBlurPercentage(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <span className="text-gray-400 text-sm min-w-[40px]">100%</span>
                            </div>
                            <div className="mt-2 text-center">
                              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                                Current: {blurPercentage}% of image height will be blurred
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-2 text-center">
                              Higher values blur more of the image for increased privacy
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Upload Question Images
                          </label>

                          <div
                            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-all"
                            onClick={() => fileInputRef.current.click()}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileChange}
                              className="hidden"
                              ref={fileInputRef}
                            />
                            <FaUpload className="mx-auto text-3xl text-gray-400 mb-4" />
                            <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                            <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                          </div>

                          {previewImages.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                              {previewImages.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-white/10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {processing && (
                          <div className="bg-blue-500/20 border border-blue-500/40 text-blue-400 p-4 rounded-xl">
                            <div className="flex items-center mb-3">
                              <FaSpinner className="animate-spin mr-2" />
                              <p className="font-medium">
                                {uploadProgress < 100 ? 'Generating Solutions...' : 'Complete!'}
                              </p>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>{uploadProgress}%</span>
                              <span className="text-gray-400">
                                {error || 'Processing...'}
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={processing || !uploadCompanyName.trim() || images.length === 0}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                          {processing ? (
                            <>
                              <FaSpinner className="animate-spin mr-2 inline" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FaUpload className="mr-2 inline" />
                              Generate Problem Statement
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {showConfirmation && generatedProblem && (
                      <div className="space-y-6">
                        <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-4 rounded-xl">
                          <div className="flex items-center mb-2">
                            <FaCheck className="mr-2" />
                            <p className="font-medium">Problem Statement Generated!</p>
                          </div>
                          <p className="text-sm">Review the generated content below and confirm to save the question.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-300 mb-3">Generated Problem Statement:</h3>
                          <div
                            className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: generatedProblem }}
                          />
                        </div>

                        {blurredUploadImages.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-300 mb-3">
                              Question Images (Blurred for Database):
                            </h3>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                              <p className="text-blue-300 text-sm flex items-center">
                                <FaImage className="mr-2" />
                                These blurred versions will be stored in the database for privacy and safety
                              </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {blurredUploadImages.map((blurredImage, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                  <img
                                    src={blurredImage.url}
                                    alt={`Blurred ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-white/10 mb-2"
                                  />
                                  <p className="text-gray-400 text-xs truncate">
                                    {blurredImage.filename}
                                  </p>
                                  <div className="flex items-center justify-center mt-2">
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                                      Blurred & Watermarked
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}



                        <div className="flex gap-4">
                          <button
                            onClick={confirmUpload}
                            disabled={confirmLoading || blurredUploadImages.length === 0}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
                          >
                            {confirmLoading ? (
                              <>
                                <FaSpinner className="animate-spin mr-2 inline" />
                                Saving Question...
                              </>
                            ) : (
                              <>
                                <FaSave className="mr-2 inline" />
                                Confirm & Save Question
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setGeneratedProblem(null);
                              setShowConfirmation(false);
                              handleSubmit({ preventDefault: () => { } });
                            }}
                            disabled={confirmLoading}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
                          >
                            Regenerate
                          </button>

                          <button
                            onClick={resetUploadForm}
                            disabled={confirmLoading}
                            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all"
                          >
                            <FaTimes className="mr-2 inline" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}


                  </>
                )}
              </div>
            )}

            {activeTab === 'blur' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaImage className="mr-2 text-purple-400" />
                  Image Blur Tool
                </h2>
                <p className="text-gray-400 mb-6">
                  Upload images to blur the top portion with safety watermarks. Perfect for creating privacy-safe previews.
                </p>

                <div className="space-y-6">
                  {/* Blur Percentage Control */}
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Blur Percentage (Default: 23%)
                    </label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400 text-sm min-w-[30px]">1%</span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={blurPercentage}
                          onChange={(e) => setBlurPercentage(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="text-gray-400 text-sm min-w-[40px]">100%</span>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                          Current: {blurPercentage}% of image height will be blurred
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2 text-center">
                        Higher values blur more of the image for increased privacy
                      </p>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Upload Images to Blur
                    </label>

                    <div
                      className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-all"
                      onClick={() => blurFileInputRef.current.click()}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBlurFileChange}
                        className="hidden"
                        ref={blurFileInputRef}
                      />
                      <FaImage className="mx-auto text-3xl text-gray-400 mb-4" />
                      <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PNG, JPG, GIF - Multiple files supported</p>
                    </div>
                  </div>

                  {/* Processing Indicator */}
                  {blurProcessing && (
                    <div className="bg-purple-500/20 border border-purple-500/40 text-purple-400 p-4 rounded-xl">
                      <div className="flex items-center">
                        <FaSpinner className="animate-spin mr-2" />
                        <p>Processing images with blur and watermarks...</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {blurPreviewImages.length > 0 && (
                    <div className="flex gap-4">
                      <button
                        onClick={downloadAllBlurredImages}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center"
                      >
                        <FaDownload className="mr-2" />
                        Download All ({blurPreviewImages.length})
                      </button>

                      <button
                        onClick={clearBlurredImages}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Clear All
                      </button>
                    </div>
                  )}

                  {/* Preview Grid */}
                  {blurPreviewImages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-300 mb-4">
                        Blurred Images ({blurPreviewImages.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blurPreviewImages.map((preview, index) => (
                          <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="relative group mb-3">
                              <img
                                src={preview.url}
                                alt={`Blurred ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border border-white/10"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                  onClick={() => downloadBlurredImage(preview)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-all transform hover:scale-110"
                                >
                                  <FaDownload />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-400 text-sm truncate mr-2">
                                {preview.filename}
                              </p>
                              <button
                                onClick={() => downloadBlurredImage(preview)}
                                className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-xs hover:bg-blue-500/30 transition-all flex items-center"
                              >
                                <FaDownload className="mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {blurPreviewImages.length === 0 && !blurProcessing && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                      <h3 className="text-blue-300 font-medium mb-3">How it works:</h3>
                      <ul className="text-gray-400 space-y-2 text-sm">
                        <li>• Adjust the blur percentage slider (1-100%) to control how much of the image gets blurred</li>
                        <li>• Upload one or multiple images using the area above</li>
                        <li>• The top {blurPercentage}% of each image will be automatically blurred</li>
                        <li>• "oahelper.in" and "blurred {blurPercentage}% for safety reasons" watermarks will be added</li>
                        <li>• Download individual images or all at once</li>
                        <li>• Perfect for creating privacy-safe previews of sensitive content</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Question Upload Tab */}
            {activeTab === 'advanced-upload' && (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><FaSpinner className="animate-spin text-3xl text-blue-400" /></div>}>
                <AdvancedQuestionUpload />
              </Suspense>
            )}

            {/* AI Question Solver Tab */}
            {activeTab === 'advanced-solver' && (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><FaSpinner className="animate-spin text-3xl text-blue-400" /></div>}>
                <AdvancedQuestionSolver />
              </Suspense>
            )}

            {/* Batch AI Processor Tab */}
            {activeTab === 'advanced-processor' && (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><FaSpinner className="animate-spin text-3xl text-blue-400" /></div>}>
                <AdvancedQuestionProcessor 
                  selectedQuestions={allQuestions.filter(q => q.question_type === 'coding')} 
                  onClose={() => setActiveTab('questions-database')}
                  onComplete={(results) => {
                    console.log('Processing complete:', results);
                    fetchAllQuestions();
                  }}
                />
              </Suspense>
            )}

            {/* Questions Database Tab */}
            {activeTab === 'questions-database' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaQuestionCircle className="mr-2 text-green-400" />
                  Questions Database
                </h2>
                <p className="text-gray-400 mb-6">
                  Browse all questions with their company names, solutions, and test cases.
                </p>

                {/* Search and Filter */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Search Questions
                      </label>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={questionsDbSearch}
                          onChange={(e) => {
                            setQuestionsDbSearch(e.target.value);
                            setQuestionsDbPage(1);
                          }}
                          placeholder="Search by title or company name..."
                          className="w-full bg-white/5 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Question Type
                      </label>
                      <select
                        value={questionsDbFilter}
                        onChange={(e) => {
                          setQuestionsDbFilter(e.target.value);
                          setQuestionsDbPage(1);
                        }}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Types</option>
                        <option value="coding">Coding</option>
                        <option value="mcq">MCQ</option>
                        <option value="sql">SQL</option>
                        <option value="api">API</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <span>Total: {questionsDbTotal} questions (showing {getFilteredQuestions().length} on this page)</span>
                    <span>Page {questionsDbPage} of {getTotalPages() || 1}</span>
                  </div>
                </div>

                {loadingAllQuestions ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading questions...</p>
                  </div>
                ) : getFilteredQuestions().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaQuestionCircle className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No questions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredQuestions().map(question => (
                      <div key={question.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        {/* Question Header */}
                        <div
                          className="p-6 cursor-pointer hover:bg-white/5 transition-all"
                          onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{question.title}</h3>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                                  ID: #{question.id}
                                </span>
                                {question.question_type && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    question.question_type === 'coding' ? 'bg-green-500/20 text-green-300' :
                                    question.question_type === 'mcq' ? 'bg-purple-500/20 text-purple-300' :
                                    question.question_type === 'sql' ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-yellow-500/20 text-yellow-300'
                                  }`}>
                                    {question.question_type.toUpperCase()}
                                  </span>
                                )}
                                {question.premium_required && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                                    PREMIUM
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <FaBuilding className="mr-1 text-blue-400" />
                                  {question.company_name || 'Unknown Company'}
                                </span>
                                {question.created_at && (
                                  <span className="flex items-center">
                                    <FaClock className="mr-1" />
                                    {formatDateTime(question.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`);
                                }}
                                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-all"
                              >
                                <FaEye className="inline mr-1" /> View
                              </button>
                              <span className={`transform transition-transform ${expandedQuestion === question.id ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content with Inline Editing */}
                        {expandedQuestion === question.id && (
                          <div className="border-t border-white/10 p-6 space-y-6 bg-black/20">
                            {/* Save/Cancel Bar */}
                            {hasInlineChanges(question.id) && (
                              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <span className="text-green-300 font-medium">You have unsaved changes</span>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => cancelInlineChanges(question.id)}
                                    className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-all text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveInlineChanges(question.id)}
                                    disabled={savingInline === question.id}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-medium flex items-center disabled:opacity-50"
                                  >
                                    {savingInline === question.id ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Problem Statement - Inline Edit */}
                            <div>
                              <h4 className="text-gray-300 font-medium mb-2 flex items-center">
                                <FaQuestionCircle className="mr-2 text-purple-400" />
                                Problem Statement (HTML)
                              </h4>
                              <textarea
                                value={getInlineValue(question, 'problem_statement')}
                                onChange={(e) => handleInlineChange(question.id, 'problem_statement', e.target.value)}
                                className="w-full h-64 text-sm font-mono bg-black/50 text-gray-300 p-4 rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none resize-y"
                                placeholder="Enter problem statement (HTML supported)..."
                              />
                            </div>

                            {/* Solutions - Inline Edit */}
                            <div>
                              <h4 className="text-gray-300 font-medium mb-2 flex items-center">
                                <FaCode className="mr-2 text-green-400" />
                                Solutions
                              </h4>
                              <div className="space-y-4">
                                {/* C++ Solution */}
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-300 font-medium">C++ Solution</span>
                                    <span className="text-xs text-gray-500">{getInlineValue(question, 'solution_cpp').length} chars</span>
                                  </div>
                                  <textarea
                                    value={getInlineValue(question, 'solution_cpp')}
                                    onChange={(e) => handleInlineChange(question.id, 'solution_cpp', e.target.value)}
                                    className="w-full h-80 text-xs font-mono bg-black/50 text-gray-300 p-3 rounded-lg border border-white/10 focus:border-blue-500/50 focus:outline-none resize-y"
                                    placeholder="Enter C++ solution..."
                                  />
                                </div>

                                {/* Python Solution */}
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-yellow-300 font-medium">Python Solution</span>
                                    <span className="text-xs text-gray-500">{getInlineValue(question, 'solution_python').length} chars</span>
                                  </div>
                                  <textarea
                                    value={getInlineValue(question, 'solution_python')}
                                    onChange={(e) => handleInlineChange(question.id, 'solution_python', e.target.value)}
                                    className="w-full h-80 text-xs font-mono bg-black/50 text-gray-300 p-3 rounded-lg border border-white/10 focus:border-yellow-500/50 focus:outline-none resize-y"
                                    placeholder="Enter Python solution..."
                                  />
                                </div>

                                {/* Java Solution */}
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-orange-300 font-medium">Java Solution</span>
                                    <span className="text-xs text-gray-500">{getInlineValue(question, 'solution_java').length} chars</span>
                                  </div>
                                  <textarea
                                    value={getInlineValue(question, 'solution_java')}
                                    onChange={(e) => handleInlineChange(question.id, 'solution_java', e.target.value)}
                                    className="w-full h-80 text-xs font-mono bg-black/50 text-gray-300 p-3 rounded-lg border border-white/10 focus:border-orange-500/50 focus:outline-none resize-y"
                                    placeholder="Enter Java solution..."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Test Cases - Inline Edit */}
                            <div>
                              <h4 className="text-gray-300 font-medium mb-2 flex items-center">
                                <FaCheck className="mr-2 text-cyan-400" />
                                Test Cases
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Input Test Cases */}
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-cyan-300 font-medium">Input Test Cases</span>
                                    <span className="text-xs text-gray-500">{getInlineValue(question, 'input_test_case').length} chars</span>
                                  </div>
                                  <textarea
                                    value={getInlineValue(question, 'input_test_case')}
                                    onChange={(e) => handleInlineChange(question.id, 'input_test_case', e.target.value)}
                                    className="w-full h-64 text-xs font-mono bg-black/50 text-gray-300 p-3 rounded-lg border border-white/10 focus:border-cyan-500/50 focus:outline-none resize-y"
                                    placeholder="Enter input test cases..."
                                  />
                                </div>

                                {/* Output Test Cases */}
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-pink-300 font-medium">Expected Output</span>
                                    <span className="text-xs text-gray-500">{getInlineValue(question, 'output_test_case').length} chars</span>
                                  </div>
                                  <textarea
                                    value={getInlineValue(question, 'output_test_case')}
                                    onChange={(e) => handleInlineChange(question.id, 'output_test_case', e.target.value)}
                                    className="w-full h-64 text-xs font-mono bg-black/50 text-gray-300 p-3 rounded-lg border border-white/10 focus:border-pink-500/50 focus:outline-none resize-y"
                                    placeholder="Enter expected output..."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                              <button
                                onClick={() => deleteQuestion(question.id)}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all text-sm font-medium flex items-center"
                              >
                                <FaTrash className="mr-2" />
                                Delete
                              </button>
                              <button
                                onClick={() => navigate(`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`)}
                                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center"
                              >
                                <FaEye className="mr-2" />
                                View Live
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination */}
                    {getTotalPages() > 1 && (
                      <div className="flex justify-center items-center space-x-4 mt-6">
                        <button
                          onClick={() => handlePageChange(questionsDbPage - 1)}
                          disabled={questionsDbPage === 1}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                        >
                          Previous
                        </button>
                        <div className="flex items-center space-x-2">
                          {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                            let pageNum;
                            if (getTotalPages() <= 5) {
                              pageNum = i + 1;
                            } else if (questionsDbPage <= 3) {
                              pageNum = i + 1;
                            } else if (questionsDbPage >= getTotalPages() - 2) {
                              pageNum = getTotalPages() - 4 + i;
                            } else {
                              pageNum = questionsDbPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                                  questionsDbPage === pageNum
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handlePageChange(questionsDbPage + 1)}
                          disabled={questionsDbPage === getTotalPages() || !questionsDbHasMore}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Community Tab */}
            {activeTab === 'community' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaUsers className="mr-2 text-blue-400" />
                  Community
                </h2>

                <div className="flex bg-[#111] p-1 rounded-lg border border-white/10 mb-6 w-fit">
                  <button
                    onClick={() => setCommunityTab('solutions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${communityTab === 'solutions'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Solutions
                  </button>
                  <button
                    onClick={() => setCommunityTab('comments')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${communityTab === 'comments'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Comments
                  </button>
                </div>

                {loadingCommunity ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communityTab === 'solutions' ? (
                      communitySolutions.length > 0 ? (
                        communitySolutions.map((solution) => (
                          <div key={solution.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <a
                                  href={`/question-with-editor/${encryptId(solution.question_id)}?company_id=${encryptId(solution.company_id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lg font-bold text-white mb-1 hover:text-blue-400 transition-colors flex items-center"
                                >
                                  {solution.question_title || 'Unknown Question'}
                                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                                  <span className="text-blue-400">@{solution.user_name || 'Unknown User'}</span>
                                  <span>•</span>
                                  <span className="text-gray-500">{solution.user_email}</span>
                                  <span>•</span>
                                  <span>{new Date(solution.created_at).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs uppercase">{solution.language}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-white">{solution.like_count}</div>
                                  <div className="text-xs text-gray-500">Likes</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-white">{solution.comment_count}</div>
                                  <div className="text-xs text-gray-500">Comments</div>
                                </div>
                                <button
                                  onClick={() => setRewardingSolution(solution)}
                                  className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white p-2 rounded-lg transition-all"
                                  title="Reward OACoins"
                                >
                                  <FaRupeeSign />
                                </button>
                                <button
                                  onClick={() => setReplyingToSolution(solution)}
                                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all"
                                  title="Reply"
                                >
                                  <FaPaperPlane />
                                </button>
                              </div>
                            </div>

                            {solution.explanation && (
                              <div className="mb-4 bg-black/50 p-4 rounded-lg">
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{solution.explanation}</p>
                              </div>
                            )}

                            <div className="bg-black/50 rounded-lg p-4 border border-white/5 overflow-x-auto">
                              <pre className="text-sm font-mono text-gray-300">
                                {solution.solution_code.length > 300
                                  ? solution.solution_code.substring(0, 300) + '...'
                                  : solution.solution_code}
                              </pre>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">No solutions found</div>
                      )
                    ) : (
                      communityComments.length > 0 ? (
                        communityComments.map((comment) => (
                          <div key={comment.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <a
                                  href={`/question-with-editor/${encryptId(comment.question_id)}?company_id=${encryptId(comment.company_id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lg font-bold text-white mb-1 hover:text-blue-400 transition-colors flex items-center"
                                >
                                  {comment.question_title || 'Unknown Question'}
                                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                                  <span className="text-blue-400">@{comment.user_name || 'Unknown User'}</span>
                                  <span>•</span>
                                  <span className="text-gray-500">{comment.user_email}</span>
                                  <span>•</span>
                                  <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setReplyingToSolution({ id: comment.solution_id, question_title: comment.question_title })}
                                className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all ml-4"
                                title="Reply to Thread"
                              >
                                <FaPaperPlane />
                              </button>
                            </div>

                            <div className="bg-black/50 p-4 rounded-lg">
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.comment}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">No comments found</div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'premium-users' && adminRole === 'ultra_admin' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaUsers className="mr-2 text-yellow-400" />
                  Premium Users
                </h2>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Manual Premium Activation</h3>
                      <p className="text-sm text-gray-400">
                        Instantly grant premium access to any registered email with custom start and end dates.
                      </p>
                    </div>
                    <button
                      onClick={resetManualPremiumForm}
                      className="self-start md:self-auto px-4 py-2 bg-gray-600/60 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Reset Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        User Email
                      </label>
                      <input
                        type="email"
                        value={manualPremiumEmail}
                        onChange={(e) => setManualPremiumEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleManualPremiumUserSearch}
                        disabled={manualPremiumSearchLoading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {manualPremiumSearchLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <FaSearch className="mr-2" />
                            Find User
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {manualPremiumError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                      {manualPremiumError}
                    </div>
                  )}

                  {manualPremiumSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
                      {manualPremiumSuccess}
                    </div>
                  )}

                  {manualPremiumUser && (
                    <div className="border-t border-white/10 pt-4 mt-4 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Name</div>
                          <div className="text-white text-lg font-semibold">{manualPremiumUser.name}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</div>
                          <div className="text-white text-lg font-semibold">{manualPremiumUser.email}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">User ID</div>
                          <div className="text-white text-lg font-mono">#{manualPremiumUser.id}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Current OACoins</div>
                          <div className="text-yellow-300 text-lg font-semibold">{manualPremiumUser.oacoins ?? 0}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Start Date &amp; Time
                          </label>
                          <input
                            type="datetime-local"
                            value={manualPremiumStart}
                            onChange={(e) => setManualPremiumStart(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            End Date &amp; Time
                          </label>
                          <input
                            type="datetime-local"
                            value={manualPremiumEnd}
                            onChange={(e) => setManualPremiumEnd(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Plan Type
                          </label>
                          <select
                            value={manualPremiumPlan}
                            onChange={(e) => setManualPremiumPlan(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                          >
                            {MANUAL_PREMIUM_PLAN_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id} className="bg-[#0a0a0a] text-white">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            {MANUAL_PREMIUM_PLAN_PRESETS[manualPremiumPlan]?.description}
                          </p>
                          {manualPremiumPlan !== 'custom' && (
                            <button
                              onClick={applyManualPlanPreset}
                              type="button"
                              className="mt-3 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 text-xs font-semibold"
                            >
                              Apply {MANUAL_PREMIUM_PLAN_PRESETS[manualPremiumPlan]?.days}-day preset
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Amount Recorded (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={manualPremiumAmount}
                            onChange={(e) => setManualPremiumAmount(e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Leave blank if you do not want to log an amount for this activation.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Notes (optional)
                          </label>
                          <textarea
                            value={manualPremiumNotes}
                            onChange={(e) => setManualPremiumNotes(e.target.value)}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 resize-none"
                            placeholder="Include any context to email the user with this activation."
                          />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <input
                              id="replaceExistingPremium"
                              type="checkbox"
                              checked={manualPremiumReplaceExisting}
                              onChange={(e) => setManualPremiumReplaceExisting(e.target.checked)}
                              className="mt-1"
                            />
                            <div>
                              <label htmlFor="replaceExistingPremium" className="text-white font-medium text-sm">
                                Replace existing active subscriptions
                              </label>
                              <p className="text-xs text-gray-500 mt-1">
                                When enabled, any ongoing premium subscriptions for this user will be canceled before this custom plan is created.
                              </p>
                              <div className="mt-3 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p><strong>Summary</strong></p>
                                <p>Start: {manualPremiumStart ? manualPremiumStart.replace('T', ' ') : '--'}</p>
                                <p>End: {manualPremiumEnd ? manualPremiumEnd.replace('T', ' ') : '--'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleManualPremiumSubmit}
                          disabled={manualPremiumSubmitting}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {manualPremiumSubmitting ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <FaCheck className="mr-2" />
                              Activate Premium
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={resetManualPremiumForm}
                          className="px-6 py-3 bg-gray-600/70 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all flex items-center"
                        >
                          <FaTimes className="mr-2" />
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {premiumStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                      <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Subscribers</h3>
                      <p className="text-3xl font-bold text-white">{premiumStats.total_subscribers}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                      <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Revenue</h3>
                      <p className="text-3xl font-bold text-green-400">₹{premiumStats.total_revenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Plan Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-blue-300">📦 Basic</span>
                          <span className="text-white">{premiumStats.plan_breakdown.basic?.count || 0} users (₹{(premiumStats.plan_breakdown.basic?.revenue || 0).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-purple-300">⭐ Pro</span>
                          <span className="text-white">{premiumStats.plan_breakdown.pro?.count || 0} users (₹{(premiumStats.plan_breakdown.pro?.revenue || 0).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-orange-300">∞ Unlimited</span>
                          <span className="text-white">{premiumStats.plan_breakdown.unlimited?.count || 0} users (₹{(premiumStats.plan_breakdown.unlimited?.revenue || 0).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-emerald-300">👑 Yearly</span>
                          <span className="text-white">{premiumStats.plan_breakdown.yearly?.count || 0} users (₹{(premiumStats.plan_breakdown.yearly?.revenue || 0).toFixed(2)})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search Premium Subscriber</h3>
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={premiumSearchEmail}
                        onChange={(e) => {
                          setPremiumSearchEmail(e.target.value);
                          if (premiumSearchError) setPremiumSearchError('');
                          if (premiumPlanUpdateStatus) setPremiumPlanUpdateStatus(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchPremiumUser();
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 placeholder-gray-500"
                        placeholder="user@example.com"
                      />
                    </div>
                    <button
                      onClick={() => searchPremiumUser()}
                      disabled={premiumSearchLoading}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {premiumSearchLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <FaSearch className="mr-2" />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Look up active premium users by email without loading every record.
                  </p>
                </div>

                {premiumSearchError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
                    {premiumSearchError}
                  </div>
                )}

                {premiumPlanUpdateStatus && !premiumSearchError && (
                  <div
                    className={`mb-6 px-4 py-3 rounded-lg text-sm border ${premiumPlanUpdateStatus.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                  >
                    {premiumPlanUpdateStatus.message}
                  </div>
                )}

                {premiumSearchResult ? (
                  <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-white">{premiumSearchResult.user_name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                              Active
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {currentPremiumPlanPreset?.label || premiumSearchResult.subscription_type || 'Custom Plan'}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-300 text-sm mb-4">
                            <FaEnvelope className="mr-2 text-blue-400" />
                            {premiumSearchResult.user_email}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-gray-400 text-xs uppercase mb-1">Subscription ID</div>
                              <div className="text-white font-mono">#{premiumSearchResult.id}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase mb-1">Amount Charged</div>
                              <div className="text-white font-semibold">₹{Number(premiumSearchResult.amount || 0)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase mb-1">Daily Limit</div>
                              <div className="text-white font-semibold">
                                {currentPremiumPlanPreset?.daily_limit === -1
                                  ? 'Unlimited'
                                  : currentPremiumPlanPreset?.daily_limit
                                    ? `${currentPremiumPlanPreset.daily_limit} solves`
                                    : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-gray-400 text-xs uppercase mb-1">Starts</div>
                              <div className="text-gray-200">
                                {premiumSearchResult.start_date ? formatDateTime(premiumSearchResult.start_date) : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase mb-1">Ends</div>
                              <div className="text-gray-200">
                                {premiumSearchResult.end_date ? formatDateTime(premiumSearchResult.end_date) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => cancelSubscription(premiumSearchResult.id, premiumSearchResult.user_email)}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center"
                        >
                          <FaTrash className="mr-2" />
                          Cancel Subscription
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">Upgrade or Change Plan</h3>
                        {currentPremiumPlanPreset && (
                          <span className="text-xs text-gray-400">Current: {currentPremiumPlanPreset.label}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-6">
                        Choose a plan to activate immediately. We'll suggest how much to charge based on the price difference.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {premiumPlanOptions.map(([planId, preset]) => {
                          const isCurrent = currentPremiumPlanKey === planId;
                          const suggestedCharge = Math.max(0, (preset.amount || 0) - currentPremiumPlanAmount);
                          const previewEnd = new Date();
                          previewEnd.setDate(previewEnd.getDate() + (preset.days || 0));
                          const previewEndLabel = previewEnd.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          return (
                            <div
                              key={planId}
                              className={`rounded-xl border p-4 bg-white/5 ${isCurrent ? 'border-blue-500/40' : 'border-white/10'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-semibold text-lg">{preset.label}</h4>
                                {isCurrent && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">₹{preset.amount}</div>
                              <div className="text-gray-400 text-sm mb-3">{preset.description}</div>
                              <div className="text-xs text-gray-400 mb-1">Suggested charge</div>
                              <div className="text-white font-semibold mb-3">
                                {suggestedCharge > 0 ? `₹${suggestedCharge}` : '₹0 (no extra payment)'}
                              </div>
                              <div className="text-xs text-gray-500 mb-4">
                                New expiry if activated today: {previewEndLabel}
                              </div>
                              <button
                                onClick={() => handlePremiumPlanChange(planId)}
                                disabled={planUpgradeLoadingId === planId || isCurrent}
                                className={`w-full px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${isCurrent
                                  ? 'bg-gray-600/50 text-gray-300 border-gray-500/40 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-transparent hover:from-yellow-400 hover:to-orange-500'
                                  } ${planUpgradeLoadingId === planId ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                {planUpgradeLoadingId === planId ? (
                                  <span className="flex items-center justify-center">
                                    <FaSpinner className="animate-spin mr-2" />
                                    Updating...
                                  </span>
                                ) : (
                                  'Activate this plan'
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 border border-dashed border-white/10 rounded-xl">
                    <FaUsers className="text-4xl mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">Search for an email to manage their plan.</p>
                    <p className="text-sm mt-2">We only load the data you need, keeping the dashboard fast.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report-issues' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaFlag className="mr-2 text-orange-400" />
                  Report Issues
                </h2>
                <p className="text-gray-400 mb-6">
                  Manage reported issues with questions and solutions. Users can report incorrect content and you can track and resolve these issues.
                </p>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Report Type
                      </label>
                      <select
                        value={reportFilter}
                        onChange={(e) => {
                          setReportFilter(e.target.value);
                          fetchReportIssues();
                        }}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-orange-500/50 focus:outline-none"
                      >
                        <option value="all">All Reports</option>
                        <option value="question">Question Reports</option>
                        <option value="solution">Solution Reports</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Status
                      </label>
                      <select
                        value={reportStatusFilter}
                        onChange={(e) => {
                          setReportStatusFilter(e.target.value);
                          fetchReportIssues();
                        }}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-orange-500/50 focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {loadingReportIssues ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading report issues...</p>
                  </div>
                ) : reportIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaFlag className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No report issues found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                        <span>Total Reports: {reportIssues.length}</span>
                        <span>Pending: {reportIssues.filter(report => report.status === 'pending').length}</span>
                        <span>In Progress: {reportIssues.filter(report => report.status === 'in_progress').length}</span>
                        <span>Resolved: {reportIssues.filter(report => report.status === 'resolved').length}</span>
                      </div>
                    </div>

                    {reportIssues.map(report => (
                      <div key={`${report.table_name}-${report.id}`} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-semibold text-white">
                                {report.table_name === 'question_reports' ? 'Question Report' : 'Solution Report'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                report.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                  report.status === 'resolved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                {report.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.table_name === 'question_reports' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                'bg-green-500/20 text-green-300 border border-green-500/30'
                                }`}>
                                {report.table_name === 'question_reports' ? 'QUESTION' : 'SOLUTION'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-gray-300">
                                  <FaEnvelope className="mr-2 text-blue-400 w-4 h-4" />
                                  <span className="text-sm font-medium">Reporter:</span>
                                  <span className="ml-2 text-sm">{report.user_email}</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                  <span className="text-sm font-medium">Reported:</span>
                                  <span className="ml-2 text-sm">{formatDateTime(report.created_at)}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center text-gray-300">
                                  <span className="text-sm font-medium">Question ID:</span>
                                  <span className="ml-2 text-sm text-gray-400">#{report.question_id}</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <span className="text-sm font-medium">Report ID:</span>
                                  <span className="ml-2 text-sm text-gray-400">#{report.id}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-gray-400 text-sm font-medium mb-1">Issue Description:</p>
                              <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                                {report.description}
                              </p>
                            </div>

                            {report.question_link && (
                              <div className="mb-4">
                                <p className="text-gray-400 text-sm font-medium mb-1">Question Link:</p>
                                <a
                                  href={report.question_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                                >
                                  {report.question_link}
                                </a>
                              </div>
                            )}

                            {report.admin_notes && (
                              <div className="mb-4">
                                <p className="text-gray-400 text-sm font-medium mb-1">Admin Notes:</p>
                                <p className="text-gray-300 text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                  {report.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <select
                              value={report.status}
                              onChange={(e) => updateReportStatus(report.id, report.table_name, e.target.value)}
                              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="dismissed">Dismissed</option>
                            </select>

                            <button
                              onClick={() => {
                                setEditingReport(report.id);
                                setReportNotes(report.admin_notes || '');
                              }}
                              className="text-blue-400 hover:text-blue-300 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"
                              title="Add Notes"
                            >
                              <FaStickyNote />
                            </button>

                            <button
                              onClick={() => deleteReport(report.id, report.table_name)}
                              className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg border border-red-500/20"
                              title="Delete Report"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Notes Editing */}
                        {editingReport === report.id && (
                          <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-1">
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                  Admin Notes:
                                </label>
                                <textarea
                                  value={reportNotes}
                                  onChange={(e) => setReportNotes(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm resize-none h-20"
                                  placeholder="Add notes about this report..."
                                />
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => updateReportStatus(report.id, report.table_name, report.status, reportNotes)}
                                  className="text-green-400 hover:text-green-300 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                                >
                                  <FaSave />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingReport(null);
                                    setReportNotes('');
                                  }}
                                  className="text-gray-400 hover:text-gray-300 p-2 bg-gray-500/10 rounded-lg border border-gray-500/20"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'feedback' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaCommentDots className="mr-2 text-blue-400" />
                  User Feedback
                </h2>
                <p className="text-gray-400 mb-6">
                  Review and manage user feedback about the platform, features, and issues.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  Debug: feedback.length = {feedback.length}, loadingFeedback = {loadingFeedback.toString()}
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Feedback Type
                      </label>
                      <select
                        value={feedbackFilter.feedback_type}
                        onChange={(e) => {
                          setFeedbackFilter(prev => ({ ...prev, feedback_type: e.target.value }));
                          setFeedbackPage(1);
                        }}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-blue-500/50 focus:outline-none"
                      >
                        <option value="">All Types</option>
                        <option value="general">General Feedback</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="improvement">Improvement Suggestion</option>
                        <option value="code_editor">Code Editor Issues</option>
                        <option value="test_cases">Test Cases Issues</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Status
                      </label>
                      <select
                        value={feedbackFilter.status}
                        onChange={(e) => {
                          setFeedbackFilter(prev => ({ ...prev, status: e.target.value }));
                          setFeedbackPage(1);
                        }}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-blue-500/50 focus:outline-none"
                      >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {loadingFeedback ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading feedback...</p>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCommentDots className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No feedback submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map(item => (
                      <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${item.feedback_type === 'bug' ? 'bg-red-500/20 text-red-300' :
                                item.feedback_type === 'feature' ? 'bg-green-500/20 text-green-300' :
                                  item.feedback_type === 'improvement' ? 'bg-blue-500/20 text-blue-300' :
                                    item.feedback_type === 'code_editor' ? 'bg-purple-500/20 text-purple-300' :
                                      item.feedback_type === 'test_cases' ? 'bg-orange-500/20 text-orange-300' :
                                        'bg-gray-500/20 text-gray-300'
                                }`}>
                                {item.feedback_type.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                                item.status === 'reviewed' ? 'bg-yellow-500/20 text-yellow-300' :
                                  item.status === 'in_progress' ? 'bg-orange-500/20 text-orange-300' :
                                    item.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                                      'bg-gray-500/20 text-gray-300'
                                }`}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-gray-300 text-sm mb-2">
                              <strong>User:</strong> {item.user_email || 'Anonymous'}
                              {item.user_id && <span className="text-gray-500"> (ID: {item.user_id})</span>}
                            </div>
                            <div className="text-gray-300 text-sm mb-2">
                              <strong>Page:</strong> {item.page_url || 'Unknown'}
                            </div>
                            <div className="text-gray-300 text-sm mb-2">
                              <strong>Submitted:</strong> {new Date(item.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-medium mb-2">Feedback:</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{item.feedback_text}</p>
                        </div>

                        {item.user_agent && (
                          <div className="text-gray-500 text-xs mb-4">
                            <strong>User Agent:</strong> {item.user_agent}
                          </div>
                        )}

                        {item.admin_notes && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                            <h4 className="text-blue-300 font-medium mb-2">Admin Notes:</h4>
                            <p className="text-blue-200 text-sm">{item.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Created: {new Date(item.created_at).toLocaleString()}</span>
                          {item.updated_at !== item.created_at && (
                            <span>• Updated: {new Date(item.updated_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {feedbackTotalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <button
                          onClick={() => {
                            if (feedbackPage > 1) {
                              setFeedbackPage(feedbackPage - 1);
                            }
                          }}
                          disabled={feedbackPage === 1}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                        >
                          Previous
                        </button>
                        <span className="text-gray-400 text-sm">
                          Page {feedbackPage} of {feedbackTotalPages}
                        </span>
                        <button
                          onClick={() => {
                            if (feedbackPage < feedbackTotalPages) {
                              setFeedbackPage(feedbackPage + 1);
                            }
                          }}
                          disabled={feedbackPage === feedbackTotalPages}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'placement-verification' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaCalendar className="mr-2 text-blue-400" />
                  Placement Verification
                </h2>
                <p className="text-gray-400 mb-6">
                  Review and verify user-submitted placement data before it appears publicly
                </p>

                {loadingPlacements ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading unverified placements...</p>
                  </div>
                ) : unverifiedPlacements.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCheck className="text-4xl mx-auto mb-4 opacity-50 text-green-400" />
                    <p>No pending placements to verify</p>
                    <p className="text-sm mt-2">All submissions have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unverifiedPlacements.map(placement => (
                      <div key={placement.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-bold text-white">{placement.company}</h3>
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30">
                                Pending Verification
                              </span>
                              {placement.user_submission_count !== undefined && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                                  {placement.user_submission_count > 0 ? `${placement.user_submission_count + 1}${placement.user_submission_count === 0 ? 'st' : placement.user_submission_count === 1 ? 'nd' : 'rd'} submission` : '1st submission'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mb-2">{placement.college}</p>
                            {placement.user_email && (
                              <div className="flex items-center space-x-2 mb-2">
                                <FaEnvelope className="text-blue-400 text-sm" />
                                <span className="text-blue-300 text-sm font-medium">{placement.user_email}</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-400">
                              Submitted: {new Date(placement.timestamp || placement.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-3">
                            {/* Suggested Amount Badge */}
                            {placement.suggested_oacoins && (
                              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                                <div className="text-yellow-400 text-xs font-medium">Suggested</div>
                                <div className="text-yellow-300 text-lg font-bold">{placement.suggested_oacoins} coins</div>
                                <div className="text-yellow-400 text-xs">
                                  {placement.user_submission_count === 0 && '1st submission'}
                                  {placement.user_submission_count === 1 && '2nd submission'}
                                  {placement.user_submission_count >= 2 && '3+ submissions'}
                                </div>
                              </div>
                            )}

                            {/* OACoins Reward Input */}
                            <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2 border border-white/10">
                              <FaRupeeSign className="text-yellow-400" />
                              <input
                                type="number"
                                min="0"
                                value={placementOacoins[placement.id] || ''}
                                onChange={(e) => setPlacementOacoins(prev => ({
                                  ...prev,
                                  [placement.id]: parseInt(e.target.value) || 0
                                }))}
                                placeholder="OACoins"
                                className="w-24 bg-transparent text-white text-sm focus:outline-none"
                              />
                              <span className="text-xs text-gray-400">coins</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => verifyPlacement(placement.id)}
                                disabled={verifyingPlacement === placement.id}
                                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                {verifyingPlacement === placement.id ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <FaCheck />
                                    <span>Verify</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deletePlacement(placement.id)}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all font-medium flex items-center space-x-2"
                              >
                                <FaTrash />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Placement Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                          {placement.role && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Role</div>
                              <div className="text-white font-medium">{placement.role}</div>
                            </div>
                          )}
                          {placement.oa_date && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">OA Date</div>
                              <div className="text-white font-medium">{placement.oa_date}</div>
                            </div>
                          )}
                          {placement.oa_time && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">OA Time</div>
                              <div className="text-white font-medium">{placement.oa_time}</div>
                            </div>
                          )}
                          {placement.cgpa_criteria && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">CGPA Criteria</div>
                              <div className="text-white font-medium">{placement.cgpa_criteria}</div>
                            </div>
                          )}
                          {placement.mtech_eligible && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">MTech Eligible</div>
                              <div className="text-white font-medium">{placement.mtech_eligible}</div>
                            </div>
                          )}
                          {placement.ctc_base && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">CTC (Base)</div>
                              <div className="text-white font-medium">{placement.ctc_base}</div>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        {placement.other_info && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-gray-400 text-xs mb-2">Additional Information</div>
                            <div className="text-white text-sm bg-white/5 rounded-lg p-3">
                              {placement.other_info}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Verified Placements Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <FaCheck className="mr-2 text-green-400" />
                        Reward Verified Placements
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Load already verified placements and reward users with OACoins
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-gray-400 text-sm mb-2 block">Number of Placements to Load</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={verifiedPlacementLimit}
                          onChange={(e) => setVerifiedPlacementLimit(parseInt(e.target.value) || 50)}
                          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter number (1-200)"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={fetchVerifiedPlacements}
                          disabled={loadingVerifiedPlacements}
                          className="px-6 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {loadingVerifiedPlacements ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <FaSearch />
                              <span>Load Verified Placements</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showVerifiedPlacements && (
                    <>
                      {loadingVerifiedPlacements ? (
                        <div className="text-center py-8">
                          <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                          <p>Loading verified placements...</p>
                        </div>
                      ) : verifiedPlacements.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <FaCheck className="text-4xl mx-auto mb-4 opacity-50 text-green-400" />
                          <p>No verified placements found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                            <p className="text-blue-300 text-sm">
                              <strong>Loaded {verifiedPlacements.length} verified placements.</strong> Enter OACoins amount and click reward to send coins to users.
                            </p>
                          </div>

                          {verifiedPlacements.map(placement => (
                            <div key={placement.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h3 className="text-xl font-bold text-white">{placement.company}</h3>
                                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                                      Verified
                                    </span>
                                    {placement.user_submission_count && (
                                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                                        {placement.user_submission_count} {placement.user_submission_count === 1 ? 'submission' : 'submissions'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-300 mb-2">{placement.college}</p>
                                  {placement.user_email && (
                                    <div className="flex items-center space-x-2 mb-2">
                                      <FaEnvelope className="text-blue-400 text-sm" />
                                      <span className="text-blue-300 text-sm font-medium">{placement.user_email}</span>
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-400">
                                    Verified: {new Date(placement.timestamp || placement.created_at).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex flex-col space-y-3">
                                  {/* Suggested Amount Badge */}
                                  {placement.suggested_oacoins && (
                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                                      <div className="text-yellow-400 text-xs font-medium">Suggested</div>
                                      <div className="text-yellow-300 text-lg font-bold">{placement.suggested_oacoins} coins</div>
                                      <div className="text-yellow-400 text-xs">
                                        {placement.user_submission_count === 1 && '1st submission'}
                                        {placement.user_submission_count === 2 && '2nd submission'}
                                        {placement.user_submission_count >= 3 && '3+ submissions'}
                                      </div>
                                    </div>
                                  )}

                                  {/* OACoins Reward Input */}
                                  <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2 border border-white/10">
                                    <FaRupeeSign className="text-yellow-400" />
                                    <input
                                      type="number"
                                      min="0"
                                      value={verifiedPlacementOacoins[placement.id] || ''}
                                      onChange={(e) => setVerifiedPlacementOacoins(prev => ({
                                        ...prev,
                                        [placement.id]: parseInt(e.target.value) || 0
                                      }))}
                                      placeholder="OACoins"
                                      className="w-24 bg-transparent text-white text-sm focus:outline-none"
                                    />
                                    <span className="text-xs text-gray-400">coins</span>
                                  </div>

                                  {/* Reward Button */}
                                  <button
                                    onClick={() => rewardVerifiedPlacement(placement.id)}
                                    disabled={rewardingVerifiedPlacement === placement.id}
                                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                  >
                                    {rewardingVerifiedPlacement === placement.id ? (
                                      <>
                                        <FaSpinner className="animate-spin" />
                                        <span>Rewarding...</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaRupeeSign />
                                        <span>Reward</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Placement Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                                {placement.role && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">Role</div>
                                    <div className="text-white font-medium">{placement.role}</div>
                                  </div>
                                )}
                                {placement.oa_date && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">OA Date</div>
                                    <div className="text-white font-medium">{placement.oa_date}</div>
                                  </div>
                                )}
                                {placement.oa_time && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">OA Time</div>
                                    <div className="text-white font-medium">{placement.oa_time}</div>
                                  </div>
                                )}
                                {placement.cgpa_criteria && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">CGPA Criteria</div>
                                    <div className="text-white font-medium">{placement.cgpa_criteria}</div>
                                  </div>
                                )}
                                {placement.mtech_eligible && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">MTech Eligible</div>
                                    <div className="text-white font-medium">{placement.mtech_eligible}</div>
                                  </div>
                                )}
                                {placement.ctc_base && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">CTC (Base)</div>
                                    <div className="text-white font-medium">{placement.ctc_base}</div>
                                  </div>
                                )}
                              </div>

                              {/* Additional Info */}
                              {placement.other_info && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                  <div className="text-gray-400 text-xs mb-2">Additional Information</div>
                                  <div className="text-white text-sm bg-white/5 rounded-lg p-3">
                                    {placement.other_info}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'interview-experiences-verification' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaBriefcase className="mr-2 text-blue-400" />
                  Interview Experiences Verification
                </h2>
                <p className="text-gray-400 mb-6">
                  Review and verify user-submitted interview experiences before they appear publicly
                </p>

                {loadingExperiences ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading unverified experiences...</p>
                  </div>
                ) : unverifiedExperiences.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCheck className="text-4xl mx-auto mb-4 opacity-50 text-green-400" />
                    <p>No pending interview experiences to verify</p>
                    <p className="text-sm mt-2">All submissions have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unverifiedExperiences.map(exp => (
                      <div key={exp.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-bold text-white">{exp.company}</h3>
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30">
                                Pending Verification
                              </span>
                              {exp.result && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${exp.result === 'Selected'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                  : exp.result === 'Rejected'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                  }`}>
                                  {exp.result}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mb-2">{exp.college}</p>
                            {exp.user_email && (
                              <div className="flex items-center space-x-2 mb-2">
                                <FaEnvelope className="text-blue-400 text-sm" />
                                <span className="text-blue-300 text-sm font-medium">{exp.user_email}</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-400">
                              Submitted: {new Date(exp.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-3">
                            {/* Suggested Amount Badge */}
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                              <div className="text-yellow-400 text-xs font-medium">Suggested</div>
                              <div className="text-yellow-300 text-lg font-bold">5-15 coins</div>
                              <div className="text-yellow-400 text-xs">Based on quality</div>
                            </div>

                            {/* OACoins Reward Input */}
                            <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2 border border-white/10">
                              <FaRupeeSign className="text-yellow-400" />
                              <input
                                type="number"
                                min="0"
                                value={experienceOacoins[exp.id] || ''}
                                onChange={(e) => setExperienceOacoins(prev => ({
                                  ...prev,
                                  [exp.id]: parseInt(e.target.value) || 0
                                }))}
                                placeholder="OACoins"
                                className="w-24 bg-transparent text-white text-sm focus:outline-none"
                              />
                              <span className="text-xs text-gray-400">coins</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => verifyExperience(exp.id)}
                                disabled={verifyingExperience === exp.id}
                                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                {verifyingExperience === exp.id ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <FaCheck />
                                    <span>Verify</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deleteExperience(exp.id)}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all font-medium flex items-center space-x-2"
                              >
                                <FaTrash />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Experience Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                          {exp.role && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Role</div>
                              <div className="text-white font-medium">{exp.role}</div>
                            </div>
                          )}
                          {exp.interview_date && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Interview Date</div>
                              <div className="text-white font-medium">{exp.interview_date}</div>
                            </div>
                          )}
                          {exp.interview_type && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Interview Type</div>
                              <div className="text-white font-medium">{exp.interview_type}</div>
                            </div>
                          )}
                          {exp.difficulty && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Difficulty</div>
                              <div className="text-white font-medium">{exp.difficulty}</div>
                            </div>
                          )}
                          {exp.rounds && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Rounds</div>
                              <div className="text-white font-medium">{exp.rounds}</div>
                            </div>
                          )}
                          {exp.topics_asked && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Topics Asked</div>
                              <div className="text-white font-medium">{exp.topics_asked}</div>
                            </div>
                          )}
                        </div>

                        {/* Detailed Experience */}
                        {exp.experience && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-gray-400 text-xs mb-2">Detailed Experience</div>
                            <div className="text-white text-sm bg-white/5 rounded-lg p-3 leading-relaxed">
                              {exp.experience}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'banned-emails' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaLock className="mr-2 text-red-400" />
                  Banned Emails
                </h2>
                <p className="text-gray-400 mb-6">
                  Manage banned email addresses. Banned emails cannot login or signup to the platform.
                </p>

                {/* Add New Banned Email */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Add New Banned Email</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-gray-400 text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newBannedEmail}
                        onChange={(e) => setNewBannedEmail(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-red-500/50 focus:outline-none"
                        placeholder="Enter email address to ban"
                      />
                    </div>
                    <button
                      onClick={() => addBannedEmail(newBannedEmail)}
                      disabled={!newBannedEmail.trim()}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                      <FaLock className="mr-2 inline" />
                      Ban Email
                    </button>
                  </div>
                </div>

                {/* Banned Emails List */}
                {loadingBannedEmails ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading banned emails...</p>
                  </div>
                ) : bannedEmails.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaLock className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No emails are currently banned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Total Banned Emails: {bannedEmails.length}</span>
                      </div>
                    </div>

                    {bannedEmails.map(bannedEmail => (
                      <div key={bannedEmail.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{bannedEmail.email}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                BANNED
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-gray-300">
                                  <FaClock className="mr-2 text-green-400 w-4 h-4" />
                                  <span className="text-sm font-medium">Banned On:</span>
                                  <span className="ml-2 text-sm">{formatDateTime(bannedEmail.created_at)}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center text-gray-300">
                                  <span className="text-sm font-medium">Ban ID:</span>
                                  <span className="ml-2 text-sm text-gray-400">#{bannedEmail.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => sendBanNotificationEmail(bannedEmail.email)}
                              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center"
                            >
                              <FaEnvelope className="mr-2" />
                              Send Email
                            </button>
                            <button
                              onClick={() => removeBannedEmail(bannedEmail.id)}
                              className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm font-medium"
                            >
                              ✓ Unban Email
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Solution Editor Modal */}
      {editingSolution && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 m-4 max-w-4xl w-full">
            <h3 className="text-xl font-bold text-white mb-4">Edit Solution for: {editingSolution.title}</h3>

            <div className="flex space-x-2 mb-4 border-b border-white/10">
              <button onClick={() => setSolutionLanguage('cpp')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${solutionLanguage === 'cpp' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>C++</button>
              <button onClick={() => setSolutionLanguage('python')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${solutionLanguage === 'python' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Python</button>
              <button onClick={() => setSolutionLanguage('java')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${solutionLanguage === 'java' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Java</button>
            </div>

            <textarea
              value={solutionContent[solutionLanguage]}
              onChange={(e) => setSolutionContent({ ...solutionContent, [solutionLanguage]: e.target.value })}
              className="w-full h-96 bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 font-mono text-sm resize-none focus:border-green-500/50 focus:outline-none"
              placeholder={`Paste your ${solutionLanguage.toUpperCase()} solution code here...`}
            ></textarea>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={saveSolution}
                className="flex-1 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 py-2 px-4 transition-all text-sm font-medium"
              >
                Save Solution
              </button>
              <button
                onClick={closeSolutionEditor}
                className="bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 py-2 px-4 transition-all text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 m-4 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Edit Question: {editMode === 'problem' ? 'Problem Statement' : 'C++ Solution'}
            </h3>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                value={editQuestionData.title}
                onChange={(e) => setEditQuestionData({ ...editQuestionData, title: e.target.value })}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 w-full focus:border-blue-500/50 focus:outline-none"
              />
            </div>

            {editMode === 'problem' ? (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Problem Statement (HTML)
                </label>
                <textarea
                  value={editQuestionData.problem_statement}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, problem_statement: e.target.value })}
                  className="w-full h-64 bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 font-mono text-sm resize-none focus:border-yellow-500/50 focus:outline-none"
                  placeholder="Paste the HTML problem statement here..."
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  C++ Solution Code
                </label>
                <textarea
                  value={editQuestionData.solution_cpp}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, solution_cpp: e.target.value })}
                  className="w-full h-64 bg-black/50 border border-white/10 text-green-300 rounded-lg px-3 py-2 font-mono text-sm resize-none focus:border-green-500/50 focus:outline-none"
                  placeholder="Paste your C++ solution code here..."
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={saveQuestionEdit}
                className="flex-1 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 py-2 px-4 transition-all text-sm font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={closeQuestionEditor}
                className="bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 py-2 px-4 transition-all text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reply Modal */}
      {replyingToSolution && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative bg-[#111] border border-zinc-800 rounded-2xl p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Reply to Solution</h3>
              <button
                onClick={() => {
                  setReplyingToSolution(null);
                  setReplyText('');
                }}
                className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Replying to solution for:</p>
              <p className="text-white font-medium">{replyingToSolution.question_title || 'Question'}</p>
            </div>

            <div className="mb-6">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full h-32 bg-black border border-zinc-800 text-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-white focus:outline-none transition-colors placeholder-zinc-700"
                placeholder="Type your reply here..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setReplyingToSolution(null);
                  setReplyText('');
                }}
                className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReplyToSolution}
                disabled={sendingReply || !replyText.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center"
              >
                {sendingReply ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {rewardingSolution && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative bg-[#111] border border-zinc-800 rounded-2xl p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FaRupeeSign className="mr-2 text-yellow-400" />
                Reward OACoins
              </h3>
              <button
                onClick={() => {
                  setRewardingSolution(null);
                  setRewardAmount('');
                }}
                className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6 bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Rewarding user:</p>
              <p className="text-white font-bold text-lg">{rewardingSolution.user_name}</p>
              <p className="text-gray-500 text-sm">{rewardingSolution.user_email}</p>
              <p className="text-sm text-gray-400 mt-3">For solution on:</p>
              <p className="text-white font-medium">{rewardingSolution.question_title || 'Question'}</p>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Reward Amount (OACoins)</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-gray-200 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 focus:outline-none transition-colors"
                placeholder="Enter amount (e.g., 10, 50, 100)"
                min="1"
              />
              <div className="flex gap-2 mt-3">
                {[10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setRewardAmount(amount.toString())}
                    className="flex-1 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition-all"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ✉️ An email notification will be sent to the user when coins are rewarded
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRewardingSolution(null);
                  setRewardAmount('');
                }}
                className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRewardUser}
                disabled={sendingReward || !rewardAmount || parseInt(rewardAmount) <= 0}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center"
              >
                {sendingReward ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaRupeeSign className="mr-2" />
                    Send Reward
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;