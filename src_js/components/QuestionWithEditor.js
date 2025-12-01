import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FaArrowLeft, FaSpinner, FaPlay, FaFileCode, FaCheckCircle, FaTimes, FaTerminal, FaBuilding, FaCode, FaBookmark, FaExternalLinkAlt, FaCommentDots, FaHome, FaChevronRight, FaFlag, FaExclamationTriangle, FaBriefcase, FaUserCircle, FaChevronDown, FaSignOutAlt, FaCoins, FaPaperPlane, FaCrown, FaSync, FaHeart, FaWhatsapp, FaClock, FaComment, FaPlus, FaReply, FaShare, FaArrowRight } from 'react-icons/fa';
import ProfileAvatar from './ProfileAvatar';
import DOMPurify from 'dompurify';
import { decryptId, encryptId } from '../utils/encryption';
import DotPattern from './DotPattern';
import useScrollToTop from '../hooks/useScrollToTop';
import Loader from './Loader';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import Editor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';

const QuestionWithEditor = () => {
    useScrollToTop();
    const { isAuthenticated, user, logout } = useAuth();
    const { updateQuestionAccess, checkQuestionAccess, is_premium } = usePremium();
    const { id: encryptedId } = useParams();
    const queryParams = new URLSearchParams(useLocation().search);
    const encryptedCompanyId = queryParams.get('company_id');

    // Content styling configuration
    const contentStyles = {
        'p': 'mb-3 text-gray-300 leading-relaxed font-light text-sm',
        'ul': 'list-disc list-inside mb-3 text-gray-300 leading-relaxed text-sm',
        'ol': 'list-decimal list-inside mb-3 text-gray-300 leading-relaxed text-sm',
        'li': 'mb-1.5 text-sm',
        'h1': 'text-xl md:text-2xl font-medium text-white mb-4 tracking-tight',
        'h2': 'text-lg md:text-xl font-medium text-white mb-3 mt-5 tracking-tight',
        'h3': 'text-base md:text-lg font-medium text-white mb-2 mt-4 tracking-tight',
        'strong': 'font-semibold text-white',
        'em': 'italic text-gray-300',
        'a': 'text-white underline decoration-white/30 hover:decoration-white/100 transition-all',
        'code': {
            inline: 'bg-white/10 text-gray-200 px-1 py-0.5 rounded text-xs font-mono border border-white/10',
            block: 'bg-[#111] p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 border border-white/10'
        },
        'pre': 'relative',
        'blockquote': 'border-l-2 border-white/20 pl-3 py-1.5 my-3 text-gray-400 italic text-sm',
        'img': 'max-w-full h-auto rounded-lg my-3 border border-white/10',
        'table': 'w-full text-left table-auto border-collapse my-3 text-sm',
        'th': 'px-3 py-1.5 border-b border-white/10 text-gray-400 font-medium text-sm',
        'td': 'px-3 py-1.5 border-b border-white/10 text-gray-300 text-sm',
    };

    // Function to apply custom styles to HTML content
    const styleHtmlContent = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Apply styles to elements
        Object.entries(contentStyles).forEach(([tag, className]) => {
            if (tag === 'code') return; // Handle code separately

            doc.querySelectorAll(tag).forEach(element => {
                element.className = className;
            });
        });

        // Handle code elements specially
        doc.querySelectorAll('code').forEach(code => {
            const pre = code.closest('pre');
            if (pre) {
                // Block code - apply block styles
                code.className = contentStyles.code.block;
                // Add syntax highlighting classes if language is specified
                const langClass = code.getAttribute('class');
                if (langClass && langClass.includes('language-')) {
                    code.className += ' ' + langClass;
                }
            } else {
                // Inline code - apply inline styles
                code.className = contentStyles.code.inline;
            }
        });

        // Enhance example sections with better spacing
        doc.querySelectorAll('h3').forEach(h3 => {
            if (h3.textContent.toLowerCase().includes('example')) {
                h3.className += ' mt-8 mb-4';
            }
        });

        return doc.body.innerHTML;
    };

    const navigate = useNavigate();
    // Responsive state
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    const [oacoins, setOacoins] = useState(0);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [requestCount, setRequestCount] = useState({ request_count: 0, remaining_requests: 3 });
    const [hasSeenNewFeatures, setHasSeenNewFeatures] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showExtendPremiumModal, setShowExtendPremiumModal] = useState(false);
    const [extendDays, setExtendDays] = useState(1);
    const [extendLoading, setExtendLoading] = useState(false);
    const [extendError, setExtendError] = useState('');
    const [extendSuccess, setExtendSuccess] = useState('');
    const [showEarnCoinsModal, setShowEarnCoinsModal] = useState(false);

    const userDropdownRef = useRef(null);
    const pendingOAcoinsRequest = useRef(null);
    const pendingRequestCountRequest = useRef(null);

    // Solutions Tab State
    const [activeTab, setActiveTab] = useState('description');
    const [solutions, setSolutions] = useState([]);
    const [solutionsLoading, setSolutionsLoading] = useState(false);
    const [showPostSolutionModal, setShowPostSolutionModal] = useState(false);
    const [newSolutionCode, setNewSolutionCode] = useState('');
    const [newSolutionLang, setNewSolutionLang] = useState('cpp');
    const [newSolutionExplanation, setNewSolutionExplanation] = useState('');
    const [postingSolution, setPostingSolution] = useState(false);
    const [expandedSolutionId, setExpandedSolutionId] = useState(null);
    const [solutionComments, setSolutionComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    // Function to fetch user's OAcoins balance with caching
    const fetchOAcoins = async () => {
        if (!isAuthenticated() || !user?.id) return;

        const cacheKey = `oacoins_${user.id}`;
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

        if (cached && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < 2 * 60 * 1000) {
                setOacoins(parseInt(cached));
                return;
            }
        }

        if (pendingOAcoinsRequest.current) return pendingOAcoinsRequest.current;

        pendingOAcoinsRequest.current = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(API_ENDPOINTS.OACOINS, {
                    method: 'POST',
                    headers: getApiHeaders(),
                    body: JSON.stringify({
                        action: 'get_balance',
                        user_id: user.id
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();

                if (data.status === 'success') {
                    const balance = data.oacoins || 0;
                    setOacoins(balance);
                    sessionStorage.setItem(cacheKey, balance.toString());
                    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                }
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Error fetching OAcoins:', error);
            } finally {
                pendingOAcoinsRequest.current = null;
            }
        })();

        return pendingOAcoinsRequest.current;
    };

    // Function to fetch user's daily request count with caching
    const fetchRequestCount = async () => {
        if (!isAuthenticated() || !user?.id) return;

        const cacheKey = `request_count_${user.id}`;
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

        if (cached && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < 2 * 60 * 1000) {
                setRequestCount(JSON.parse(cached));
                return;
            }
        }

        if (pendingRequestCountRequest.current) return pendingRequestCountRequest.current;

        pendingRequestCountRequest.current = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`${API_ENDPOINTS.SOLUTION_REQUESTS}?action=get_daily_request_count&user_id=${user.id}`, {
                    headers: getApiHeaders(),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();

                if (data.status === 'success') {
                    setRequestCount(data.data);
                    sessionStorage.setItem(cacheKey, JSON.stringify(data.data));
                    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                }
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Error fetching request count:', error);
            } finally {
                pendingRequestCountRequest.current = null;
            }
        })();

        return pendingRequestCountRequest.current;
    };

    const handleRefresh = async () => {
        if (user?.id) {
            sessionStorage.removeItem(`oacoins_${user.id}`);
            sessionStorage.removeItem(`oacoins_${user.id}_time`);
            sessionStorage.removeItem(`request_count_${user.id}`);
            sessionStorage.removeItem(`request_count_${user.id}_time`);
        }
        await Promise.all([fetchOAcoins(), fetchRequestCount()]);
    };

    useEffect(() => {
        if (isAuthenticated() && user?.id) {
            fetchRequestCount();
            fetchOAcoins();
        }
    }, [user, isAuthenticated]);

    // Check if user has seen the new features
    useEffect(() => {
        const seenNewFeatures = localStorage.getItem('hasSeenNewFeatures');
        if (seenNewFeatures === 'true') {
            setHasSeenNewFeatures(true);
        }
    }, []);

    // Close user dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserDropdown]);

    // Solutions Tab Functions
    const fetchSolutions = async () => {
        if (!encryptedId) return;
        setSolutionsLoading(true);
        try {
            const decryptedId = decryptId(encryptedId);
            const userIdParam = user?.id ? `&user_id=${user.id}` : '';
            const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=get_solutions&question_id=${decryptedId}${userIdParam}`, {
                headers: getApiHeaders()
            });
            const data = await response.json();
            if (data.status === 'success') {
                setSolutions(data.data);
                // Expand the first solution by default if available and no solution is currently expanded
                if (data.data.length > 0 && !expandedSolutionId) {
                    setExpandedSolutionId(data.data[0].id);
                    fetchComments(data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching solutions:', error);
        } finally {
            setSolutionsLoading(false);
        }
    };

    const handlePostSolution = async () => {
        if (!user?.id) {
            alert('Please login to post a solution');
            return;
        }
        if (!newSolutionCode.trim()) {
            alert('Please enter solution code');
            return;
        }

        setPostingSolution(true);
        try {
            const decryptedId = decryptId(encryptedId);
            const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=add_solution`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    user_id: user.id,
                    question_id: decryptedId,
                    solution_code: newSolutionCode,
                    language: newSolutionLang,
                    explanation: newSolutionExplanation
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('Solution posted successfully!');
                setShowPostSolutionModal(false);
                setNewSolutionCode('');
                setNewSolutionExplanation('');
                fetchSolutions();
            } else {
                alert(data.message || 'Failed to post solution');
            }
        } catch (error) {
            console.error('Error posting solution:', error);
            alert('An error occurred while posting solution');
        } finally {
            setPostingSolution(false);
        }
    };

    const fetchComments = async (solutionId) => {
        setLoadingComments(prev => ({ ...prev, [solutionId]: true }));
        try {
            const userIdParam = user?.id ? `&user_id=${user.id}` : '';
            const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=get_comments&solution_id=${solutionId}${userIdParam}`, {
                headers: getApiHeaders()
            });
            const data = await response.json();
            if (data.status === 'success') {
                setSolutionComments(prev => ({ ...prev, [solutionId]: data.data }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(prev => ({ ...prev, [solutionId]: false }));
        }
    };

    const handlePostComment = async (solutionId) => {
        if (!user?.id) {
            alert('Please login to comment');
            return;
        }
        if (!newComment.trim()) {
            return;
        }

        setPostingComment(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SOLUTIONS}?action=add_comment`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    user_id: user.id,
                    solution_id: solutionId,
                    comment: newComment
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setNewComment('');
                fetchComments(solutionId);
                // Refresh solution list to update comment count
                fetchSolutions();
            } else {
                alert(data.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('An error occurred while posting comment');
        } finally {
            setPostingComment(false);
        }
    };

    const toggleSolutionExpand = (solutionId) => {
        if (expandedSolutionId === solutionId) {
            setExpandedSolutionId(null);
        } else {
            setExpandedSolutionId(solutionId);
            if (!solutionComments[solutionId]) {
                fetchComments(solutionId);
            }
        }
    };

    // Fetch solutions when tab changes to 'solutions'
    useEffect(() => {
        if (activeTab === 'solutions') {
            fetchSolutions();
        }
    }, [activeTab]);

    const markNewFeaturesAsSeen = () => {
        setHasSeenNewFeatures(true);
        localStorage.setItem('hasSeenNewFeatures', 'true');
    };

    const handleExtendPremium = async () => {
        if (!user?.id) return;
        setExtendLoading(true);
        setExtendError('');
        setExtendSuccess('');

        try {
            const response = await fetch(API_ENDPOINTS.EXTEND_PREMIUM, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    user_id: user.id,
                    days: extendDays
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setExtendSuccess(`Successfully extended premium by ${extendDays} day(s)! New balance: ${data.data.new_balance} coins`);
                setOacoins(data.data.new_balance);
                setTimeout(() => {
                    setShowExtendPremiumModal(false);
                    setExtendSuccess('');
                    setExtendDays(1);
                    window.location.reload();
                }, 2000);
            } else {
                setExtendError(data.message || 'Failed to extend premium');
            }
        } catch (error) {
            console.error('Error extending premium:', error);
            setExtendError('An error occurred while extending premium');
        } finally {
            setExtendLoading(false);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [questionImages, setQuestionImages] = useState([]);
    const [questionAccess, setQuestionAccess] = useState({
        can_access: false,
        is_premium: false,
        questions_accessed: 0,
        can_access_all: false
    });
    const [requestingSolution, setRequestingSolution] = useState(false);
    const [showingSolution, setShowingSolution] = useState(false);
    const [fetchedSolution, setFetchedSolution] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackType, setFeedbackType] = useState('general');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Error and Success Popup State
    const [errorPopup, setErrorPopup] = useState({ show: false, title: '', message: '', type: '' });
    const [singleSuccessPopup, setSingleSuccessPopup] = useState({ show: false, message: '' });


    // Report Issue State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState(''); // 'question' or 'solution'
    const [reportDescription, setReportDescription] = useState('');
    const [reportingIssue, setReportingIssue] = useState(false);

    // Test Case Report State
    const [showTestCaseReportModal, setShowTestCaseReportModal] = useState(false);
    const [testCaseReportData, setTestCaseReportData] = useState(null);
    const [testCaseIssueType, setTestCaseIssueType] = useState('wrong_output');
    const [testCaseReportDescription, setTestCaseReportDescription] = useState('');
    const [reportingTestCase, setReportingTestCase] = useState(false);

    // Function to open report modal
    const openReportModal = (type) => {
        setReportType(type);
        setReportDescription('');
        setShowReportModal(true);
    };

    // Function to close report modal
    const closeReportModal = () => {
        setShowReportModal(false);
        setReportType('');
        setReportDescription('');
    };

    // Function to submit report
    const submitReport = async () => {
        if (!reportDescription.trim()) {
            alert('Please provide a description of the issue');
            return;
        }

        if (!isAuthenticated() || !user?.email) {
            alert('Please login to report an issue');
            return;
        }

        setReportingIssue(true);
        try {
            const decryptedQuestionId = decryptId(encryptedId);
            const response = await fetch(API_ENDPOINTS.REPORT_ISSUE, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    action: 'submit_report',
                    type: reportType, // 'question' or 'solution'
                    question_id: decryptedQuestionId,
                    user_email: user.email,
                    description: reportDescription.trim(),
                    question_link: window.location.href
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                alert('Thank you for reporting! We will review and update within 1-2 hours.');
                closeReportModal();
            } else {
                alert(data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('An error occurred while submitting the report: ' + error.message);
        } finally {
            setReportingIssue(false);
        }
    };

    // Function to open test case report modal
    const openTestCaseReportModal = (testCase) => {
        setTestCaseReportData(testCase);
        setTestCaseIssueType('wrong_output');
        setTestCaseReportDescription('');
        setShowTestCaseReportModal(true);
    };

    // Function to submit test case report
    const submitTestCaseReport = async () => {
        if (!testCaseReportData) return;

        setReportingTestCase(true);
        try {
            const decryptedQuestionId = decryptId(encryptedId);
            const response = await fetch(API_ENDPOINTS.TEST_CASE_REPORTS, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    action: 'submit_report',
                    question_id: decryptedQuestionId,
                    test_case_index: testCaseReportData.id,
                    user_id: user?.id || null,
                    user_email: user?.email || null,
                    issue_type: testCaseIssueType,
                    description: testCaseReportDescription.trim(),
                    test_input: testCaseReportData.input,
                    expected_output: testCaseReportData.expectedOutput,
                    actual_output: testCaseReportData.actualOutput || ''
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('Thank you for reporting! We will review the test case.');
                setShowTestCaseReportModal(false);
                setTestCaseReportData(null);
            } else {
                alert(data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting test case report:', error);
            alert('An error occurred while submitting the report');
        } finally {
            setReportingTestCase(false);
        }
    };

    // Test case cooldown state
    const [lastRunTime, setLastRunTime] = useState(null);
    const [isOnCooldown, setIsOnCooldown] = useState(false);

    // Code editor state
    const [code, setCode] = useState('');
    const [pregivenCode, setPregivenCode] = useState({
        cpp: '',
        python: '',
        java: ''
    });
    const [selectedLanguage, setSelectedLanguage] = useState('cpp');
    const [isRunning, setIsRunning] = useState(false);
    const [compilerErrors, setCompilerErrors] = useState([]);
    const [isAiFixing, setIsAiFixing] = useState(false);
    const [editorTheme, setEditorTheme] = useState('vs-dark');
    const [fontSize, setFontSize] = useState(14);
    const [showTestCases, setShowTestCases] = useState(true); // Load by default
    const [testCases, setTestCases] = useState([
        { id: 1, input: '', expectedOutput: '', actualOutput: '', passed: null, isRunning: false }
    ]);
    const [activeTestCase, setActiveTestCase] = useState(1);
    const [allTestCases, setAllTestCases] = useState([]); // Store all test cases from database
    const [showAllTestResults, setShowAllTestResults] = useState(false); // Toggle to show all test results
    const [terminalHeight, setTerminalHeight] = useState(25);

    // Panel sizing state
    const [leftPanelWidth, setLeftPanelWidth] = useState(37); // Percentage
    const [testPanelHeight, setTestPanelHeight] = useState(30); // Percentage
    const [resizingDirection, setResizingDirection] = useState(null); // 'horizontal', 'vertical', null

    // Refs for resize calculations
    const mainContainerRef = React.useRef(null);
    const leftPanelRef = React.useRef(null);

    // Resize handlers
    const handleResize = useCallback((e) => {
        if (!resizingDirection) return;

        if (resizingDirection === 'horizontal') {
            // Horizontal resize (Problem Statement vs Editor)
            const newWidth = (e.clientX / window.innerWidth) * 100;
            const constrainedWidth = Math.max(25, Math.min(75, newWidth));
            setLeftPanelWidth(constrainedWidth);
        } else if (resizingDirection === 'vertical') {
            // Vertical resize (Editor vs Test Cases)
            if (!leftPanelRef.current) return;

            const containerRect = leftPanelRef.current.getBoundingClientRect();
            const containerHeight = containerRect.height;
            const relativeY = e.clientY - containerRect.top;
            const newTestHeight = ((containerHeight - relativeY) / containerHeight) * 100;

            const constrainedHeight = Math.max(20, Math.min(80, newTestHeight));
            setTestPanelHeight(constrainedHeight);
        }
    }, [resizingDirection]);

    const stopResizing = useCallback(() => {
        setResizingDirection(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // Remove iframes pointer-events none if we added them (not needed here usually)
    }, []);

    // Add mouse event listeners for resizing
    useEffect(() => {
        if (resizingDirection) {
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = resizingDirection === 'horizontal' ? 'col-resize' : 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [resizingDirection, handleResize, stopResizing]);

    // Language templates
    const languageTemplates = {
        cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "Thanks for using OAHelper!" << endl;
    return 0;
}`,
        java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Thanks for using OAHelper!");
    }
}`,
        python: `print("Hello, World!")
print("Thanks for using OAHelper!")`,
        javascript: `console.log("Hello, World!");
console.log("Thanks for using OAHelper!");`,
        c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Thanks for using OAHelper!\\n");
    return 0;
}`,
        csharp: `using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
        Console.WriteLine("Thanks for using OAHelper!");
    }
}`,
        go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Thanks for using OAHelper!")
}`,
        rust: `fn main() {
    println!("Hello, World!");
    println!("Thanks for using OAHelper!");
}`,
        typescript: `console.log("Hello, World!");
console.log("Thanks for using OAHelper!");`,
        php: `<?php
echo "Hello, World!\\n";
echo "Thanks for using OAHelper!\\n";
?>`,
        ruby: `puts "Hello, World!"
puts "Thanks for using OAHelper!"`,
        swift: `import Foundation

print("Hello, World!")
print("Thanks for using OAHelper!")`,
        kotlin: `fun main() {
    println("Hello, World!")
    println("Thanks for using OAHelper!")
}`,
        scala: `object Main extends App {
    println("Hello, World!")
    println("Thanks for using OAHelper!")
}`
    };

    // Language mapping for Piston API
    const languageMapping = {
        cpp: 'c++',
        java: 'java',
        python: 'python',
        javascript: 'javascript',
        c: 'c',
        csharp: 'csharp',
        go: 'go',
        rust: 'rust',
        typescript: 'typescript',
        php: 'php',
        ruby: 'ruby',
        swift: 'swift',
        kotlin: 'kotlin',
        scala: 'scala'
    };

    // Language display names - Only C++, Python, and Java
    const languageNames = {
        cpp: 'C++',
        python: 'Python',
        java: 'Java'
    };

    // Font size options
    const fontSizes = [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30];

    // Cooldown timer effect
    React.useEffect(() => {
        let timeout;

        if (lastRunTime) {
            const cooldownDuration = 7000; // 7 seconds in milliseconds
            setIsOnCooldown(true);

            timeout = setTimeout(() => {
                setIsOnCooldown(false);
                setLastRunTime(null);
            }, cooldownDuration);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [lastRunTime]);

    // Build combined runnable code with a runner that reads stdin and calls Solution.alternatingSum
    const buildCombinedCode = (lang, userCode) => {
        switch (lang) {
            case 'python':
                // Run the user's code exactly as written
                return userCode;
            case 'cpp':
            case 'c++':
                // Check if user code already has a main() function
                if (userCode.includes('int main(') || userCode.includes('int main (')) {
                    // User has their own main, just run as-is
                    return userCode;
                }

                // Default wrapper for Solution class or standalone code
                // We include common headers and a generic main function
                return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
#include <climits>
#include <limits>
#include <numeric>
#include <iomanip>
#include <bitset>
#include <utility>
#include <functional>

using namespace std;

${userCode}

// Generic main function to handle input/output
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    // Try to detect input format and call solution
    // This is a best-effort generic wrapper
    
    // For now, assume standard input format: space-separated integers
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        
        stringstream ss(line);
        vector<int> nums;
        int x;
        while (ss >> x) {
            nums.push_back(x);
        }
        
        try {
            // Try to instantiate Solution class if it exists
            #ifdef SOLUTION_CLASS_EXISTS
            Solution s;
            // Try to call alternatingSum if it exists
            // Note: In a real C++ environment we'd use SFINAE/concepts, 
            // but here we rely on the user code structure matching the problem
            auto res = s.alternatingSum(nums);
            cout << res;
            #else
            // If no Solution class detected by preprocessor, 
            // we hope the user defined the function globally or we need more specific logic
            // For this specific problem context (alternatingSum), we try:
            Solution s;
            cout << s.alternatingSum(nums);
            #endif
        } catch (...) {
            // If something fails, just return 1
            return 1;
        }
        
        // Only process first non-empty line
        break;
    }
    
    return 0;
}
`;
            case 'java':
                // Check if user code already has a Main class or main method
                if (/class\s+Main\b/.test(userCode) || userCode.includes('public static void main')) {
                    return userCode;
                }

                return `import java.util.*;
import java.io.*;
import java.util.stream.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextLine()) {
            String line = scanner.nextLine();
            String[] tokens = line.trim().split("\\\\s+");
            List<Integer> nums = new ArrayList<>();
            for (String token : tokens) {
                if (!token.isEmpty()) {
                    try {
                        nums.add(Integer.parseInt(token));
                    } catch (NumberFormatException e) {}
                }
            }
            int[] arr = new int[nums.size()];
            for (int i = 0; i < nums.size(); i++) {
                arr[i] = nums.get(i);
            }
            
            try {
                Solution s = new Solution();
                System.out.print(s.alternatingSum(arr));
            } catch (Exception e) {
                // If method not found or other error
                System.out.print("Error: " + e.getMessage());
            }
        }
    }
}`;
            case 'javascript':
                // Check if user code contains a Solution class
                if (userCode.includes('class Solution')) {
                    return `${userCode}\nconst fs = require('fs');\nconst data = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst nums = [];\nfor (const t of data) { const n = parseInt(t, 10); if (!isNaN(n)) nums.push(n); }\ntry { const s = new Solution(); const res = s.alternatingSum(nums); process.stdout.write(String(res)); } catch (e) { process.stdout.write('Error: ' + (e && e.message ? e.message : String(e))); }\n`;
                } else {
                    // Just run the user code as-is
                    return userCode;
                }
            case 'typescript':
                // Check if user code contains a Solution class
                if (userCode.includes('class Solution')) {
                    return `${userCode}\nimport * as fs from 'fs';\nconst data = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst nums: number[] = [];\nfor (const t of data) { const n = parseInt(t, 10); if (!isNaN(n)) nums.push(n); }\ntry { const s = new Solution(); const res = s.alternatingSum(nums); process.stdout.write(String(res)); } catch (e) { process.stdout.write('Error: ' + (e && (e as Error).message ? (e as Error).message : String(e))); }\n`;
                } else {
                    // Just run the user code as-is
                    return userCode;
                }
            case 'c':
                return `#include <stdio.h>\n#include <stdlib.h>\n${userCode}\nint main(){ int capacity = 1024, n = 0; int *arr = (int*)malloc(sizeof(int)*capacity); int x; while (scanf("%d", &x) == 1){ if (n == capacity){ capacity *= 2; arr = (int*)realloc(arr, sizeof(int)*capacity);} arr[n++] = x;} int res = alternatingSum(arr, n); printf("%d", res); free(arr); return 0; }\n`;
            case 'csharp':
                // Check if user code contains a Solution class
                if (userCode.includes('class Solution')) {
                    return `using System; using System.Linq; using System.Collections.Generic;\n${userCode}\npublic class Program { public static void Main(){ var data = Console.In.ReadToEnd(); var nums = data.Split(new[]{'\\n','\\r','\\t',' '}, StringSplitOptions.RemoveEmptyEntries).Select(s => { int v; return int.TryParse(s, out v) ? (int?)v : null; }).Where(v => v.HasValue).Select(v => v.Value).ToArray(); var s = new Solution(); var res = s.AlternatingSum(nums); Console.Write(res); } }\n`;
                } else {
                    // Just run the user code as-is
                    return userCode;
                }
            case 'go':
                return `package main\nimport ("fmt"; "bufio"; "os"; "strconv"; "strings")\n${userCode}\nfunc main() { scanner := bufio.NewScanner(os.Stdin); scanner.Scan(); line := scanner.Text(); tokens := strings.Fields(line); nums := []int{}; for _, t := range tokens { if n, err := strconv.Atoi(t); err == nil { nums = append(nums, n) } }; s := Solution{}; res := s.alternatingSum(nums); fmt.Print(res) }\n`;
            case 'rust':
                return `use std::io::{self, Read};\n${userCode}\nfn main() { let mut input = String::new(); io::stdin().read_to_string(&mut input).unwrap(); let nums: Vec<i32> = input.split_whitespace().filter_map(|s| s.parse().ok()).collect(); let solution = Solution{}; let res = solution.alternating_sum(nums); print!("{}", res); }\n`;
            case 'php':
                return `<?php\n${userCode}\n$input = trim(fgets(STDIN)); $tokens = preg_split('/\\s+/', $input); $nums = array_map('intval', array_filter($tokens, 'is_numeric')); $s = new Solution(); $res = $s->alternatingSum($nums); echo $res;\n?>`;
            case 'ruby':
                return `${userCode}\ninput = gets.chomp; tokens = input.split; nums = tokens.map(&:to_i); s = Solution.new; res = s.alternating_sum(nums); print res\n`;
            case 'swift':
                return `import Foundation\n${userCode}\nlet input = readLine() ?? ""; let tokens = input.split(separator: " "); let nums = tokens.compactMap { Int($0) }; let s = Solution(); let res = s.alternatingSum(nums); print(res, terminator: "")\n`;
            case 'kotlin':
                return `${userCode}\nfun main() { val input = readLine() ?: ""; val tokens = input.split(" "); val nums = tokens.mapNotNull { it.toIntOrNull() }.toIntArray(); val s = Solution(); val res = s.alternatingSum(nums); print(res) }\n`;
            case 'scala':
                return `${userCode}\nobject Main extends App { val input = scala.io.StdIn.readLine(); val tokens = input.split(" "); val nums = tokens.flatMap(t => try { Some(t.toInt) } catch { case _: Exception => None }); val s = new Solution(); val res = s.alternatingSum(nums); print(res) }\n`;
            default:
                return userCode;
        }
    };

    const getFileNameForLang = (lang) => {
        switch (lang) {
            case 'python': return 'main.py';
            case 'cpp': return 'main.cpp';
            case 'java': return 'Main.java';
            case 'javascript': return 'main.js';
            case 'c': return 'main.c';
            case 'csharp': return 'Program.cs';
            case 'go': return 'main.go';
            case 'rust': return 'main.rs';
            case 'typescript': return 'main.ts';
            case 'php': return 'main.php';
            case 'ruby': return 'main.rb';
            case 'swift': return 'main.swift';
            case 'kotlin': return 'main.kt';
            case 'scala': return 'Main.scala';
            default: return 'main.txt';
        }
    };

    // Handle language change
    const handleLanguageChange = (newLanguage) => {
        setSelectedLanguage(newLanguage);

        // Use pregiven code if available, otherwise fall back to template
        let newCode = '';
        if (newLanguage === 'cpp' && pregivenCode.cpp) {
            newCode = pregivenCode.cpp;
        } else if (newLanguage === 'python' && pregivenCode.python) {
            newCode = pregivenCode.python;
        } else if (newLanguage === 'java' && pregivenCode.java) {
            newCode = pregivenCode.java;
        } else {
            newCode = languageTemplates[newLanguage] || '';
        }

        setCode(newCode);

        // Save the new code template to cache
        if (isAuthenticated() && user?.id) {
            saveUserCodeToCache(newCode);
        }
    };

    // Test case management functions
    const addTestCase = () => {
        // Allow adding custom test cases beyond the 2 visible ones
        const maxId = Math.max(
            ...testCases.map(tc => tc.id),
            ...allTestCases.map(tc => tc.id),
            0
        );

        const newId = maxId + 1;
        const newTestCase = {
            id: newId,
            input: '',
            expectedOutput: '',
            actualOutput: '',
            passed: null,
            isRunning: false
        };

        // Add to both visible and all test cases
        setTestCases([...testCases, newTestCase]);
        setAllTestCases([...allTestCases, newTestCase]);
        setActiveTestCase(newId);
    };

    const removeTestCase = (id) => {
        // Only allow removing custom test cases (not the original ones from database)
        const testCaseToRemove = allTestCases.find(tc => tc.id === id) || testCases.find(tc => tc.id === id);
        const isFromDatabase = testCaseToRemove?.isDatabase;

        if (isFromDatabase) {
            alert('Cannot remove test cases from the database. You can only remove custom test cases.');
            return;
        }

        if (testCases.length > 1) {
            const updatedTestCases = testCases.filter(tc => tc.id !== id);
            const updatedAllTestCases = allTestCases.filter(tc => tc.id !== id);

            setTestCases(updatedTestCases);
            setAllTestCases(updatedAllTestCases);

            if (activeTestCase === id) {
                setActiveTestCase(updatedTestCases[0].id);
            }
        } else {
            alert('At least one test case must remain visible.');
        }
    };

    const updateTestCase = (id, field, value) => {
        setTestCases(prevTestCases =>
            prevTestCases.map(tc =>
                tc.id === id ? { ...tc, [field]: value } : tc
            )
        );

        // Also update in allTestCases if it exists
        if (allTestCases.length > 0) {
            setAllTestCases(prevAllTestCases =>
                prevAllTestCases.map(tc =>
                    tc.id === id ? { ...tc, [field]: value } : tc
                )
            );
        }
    };

    const updateTestCaseInBothArrays = (id, field, value) => {
        // Update visible test cases
        setTestCases(prevTestCases =>
            prevTestCases.map(tc =>
                tc.id === id ? { ...tc, [field]: value } : tc
            )
        );

        // Update all test cases
        setAllTestCases(prevAllTestCases =>
            prevAllTestCases.map(tc =>
                tc.id === id ? { ...tc, [field]: value } : tc
            )
        );
    };

    const runTestCase = async (testCaseId, isBatch = false) => {
        const testCase = allTestCases.find(tc => tc.id === testCaseId) || testCases.find(tc => tc.id === testCaseId);
        if (!testCase || !testCase.input.trim() || !testCase.expectedOutput.trim()) {
            alert('Please provide both input and expected output for this test case');
            return false;
        }

        // Check if this is a hidden test case (index 2+) and user is not premium
        if (testCaseId > 2 && !questionAccess.can_access_all) {
            alert('Hidden test cases are only available for premium users. Please upgrade to premium to run hidden test cases.');
            return false;
        }

        // Check if on cooldown (only for individual test case runs)
        if (!isBatch && isOnCooldown) {
            alert('Please wait a few seconds before running test cases again.');
            return false;
        }

        if (!isBatch) {
            setLastRunTime(Date.now());
        }

        // Mark test case as running - update both arrays
        updateTestCaseInBothArrays(testCaseId, 'isRunning', true);
        updateTestCaseInBothArrays(testCaseId, 'passed', null);

        try {
            const langName = languageMapping[selectedLanguage] || 'c++';

            // Find the appropriate version from Piston runtimes
            const runtimesResponse = await fetch('https://emkc.org/api/v2/piston/runtimes');
            const runtimes = await runtimesResponse.json();

            // Find the runtime with the highest version for the selected language
            let runtime = null;
            const matchingRuntimes = runtimes.filter(r => r.language === langName);

            if (matchingRuntimes.length > 0) {
                matchingRuntimes.sort((a, b) => {
                    const versionA = a.version.split('.').map(Number);
                    const versionB = b.version.split('.').map(Number);

                    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                        const numA = versionA[i] || 0;
                        const numB = versionB[i] || 0;

                        if (numA > numB) return -1;
                        if (numA < numB) return 1;
                    }
                    return 0;
                });

                runtime = matchingRuntimes[0];
            }

            if (!runtime) {
                updateTestCaseInBothArrays(testCaseId, 'actualOutput', `Error: Language '${langName}' not found`);
                updateTestCaseInBothArrays(testCaseId, 'passed', false);
                if (!isBatch) {
                    setErrorPopup({
                        show: true,
                        title: 'Runtime Configuration Error',
                        message: `Language runtime for '${langName}' not found.`,
                        type: 'error'
                    });
                }
                return false;
            }

            // Build combined, runnable code that reads stdin and calls user's Solution
            const combined = buildCombinedCode(langName, code);
            const fileName = getFileNameForLang(langName);

            // Execute code using Piston API
            const executeResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ name: fileName, content: combined }],
                    stdin: testCase.input
                })
            });

            const result = await executeResponse.json();

            let actualOutput = '';
            let hasError = false;
            let errors = [];

            // Handle output based on Piston's response structure
            if (result.run) {
                if (result.run.stdout) {
                    actualOutput += result.run.stdout.trim();
                }
                if (result.run.stderr) {
                    // Only treat stderr as error if exit code is non-zero
                    if (result.run.code !== 0) {
                        hasError = true;
                        actualOutput += (actualOutput ? '\n' : '') + `Error: ${result.run.stderr}`;
                        errors.push(`Runtime Error: ${result.run.stderr}`);

                        // Show error popup only if it's a single run or the first error in a batch
                        if (!isBatch) {
                            setErrorPopup({
                                show: true,
                                title: 'Runtime Error',
                                message: result.run.stderr,
                                type: 'runtime'
                            });
                        }
                    } else {
                        // Just warnings or logs - don't flag as error, but ignore common Java warnings
                        if (!result.run.stderr.includes('uses unchecked or unsafe operations') &&
                            !result.run.stderr.includes('Recompile with -Xlint')) {
                            actualOutput += (actualOutput ? '\n' : '') + `Stderr: ${result.run.stderr}`;
                        }
                    }
                }
                if (result.run.code !== 0) {
                    hasError = true;
                    actualOutput += (actualOutput ? '\n' : '') + `Exit code: ${result.run.code}`;
                }
            } else {
                hasError = true;
                actualOutput = `Error: ${result.message || 'Unknown error occurred'}`;
                errors.push(`Execution Error: ${result.message || 'Unknown error occurred'}`);

                if (!isBatch) {
                    setErrorPopup({
                        show: true,
                        title: 'Execution Error',
                        message: result.message || 'Unknown error occurred',
                        type: 'execution'
                    });
                }
            }

            // Add compiler diagnostics (treat exit code 0 as warnings)
            if (result.compile && result.compile.output) {
                const compileOutput = result.compile.output.trim();
                if (compileOutput) {
                    if (result.compile.code && result.compile.code !== 0) {
                        hasError = true;
                        actualOutput += (actualOutput ? '\n' : '') + `Compile error: ${compileOutput}`;
                        errors.push(`Compile Error: ${compileOutput}`);

                        if (!isBatch) {
                            setErrorPopup({
                                show: true,
                                title: 'Compilation Error',
                                message: compileOutput,
                                type: 'compile'
                            });
                        }
                    } else {
                        actualOutput += (actualOutput ? '\n' : '') + `Compile warning: ${compileOutput}`;
                    }
                }
            }

            // Store compiler errors for AI fixing if there were errors
            if (errors.length > 0) {
                setCompilerErrors(errors);
            }

            // Compare outputs - only if no errors occurred
            let passed = false;
            if (!hasError) {
                // Normalize outputs for comparison
                const normalizedActual = actualOutput.replace(/\s+/g, ' ').trim();
                const normalizedExpected = testCase.expectedOutput.replace(/\s+/g, ' ').trim();
                passed = normalizedActual === normalizedExpected;
            }

            updateTestCaseInBothArrays(testCaseId, 'actualOutput', actualOutput);
            updateTestCaseInBothArrays(testCaseId, 'passed', passed);

            // If this is a hidden test case and it failed, show all test results
            if (passed === false && allTestCases.length > 2) {
                const testCaseIndex = allTestCases.findIndex(tc => tc.id === testCaseId);
                if (testCaseIndex >= 2) { // Hidden test case (index 2+)
                    setTimeout(() => {
                        setShowAllTestResults(true);
                    }, 500);
                }
            }

            // Scroll to results after a short delay
            if (!isBatch) {
                setTimeout(() => {
                    const testCaseElement = document.getElementById(`test-case-${testCaseId}`);
                    if (testCaseElement) {
                        testCaseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);

                if (passed) {
                    setSingleSuccessPopup({ show: true, message: `Test Case ${testCaseId} Passed!` });
                    setTimeout(() => setSingleSuccessPopup({ show: false, message: '' }), 3000);
                }
            }

            return passed;

        } catch (error) {
            console.error('Error running test case:', error);
            updateTestCaseInBothArrays(testCaseId, 'actualOutput', `Error: ${error.message}`);
            updateTestCaseInBothArrays(testCaseId, 'passed', false);
            return false;
        } finally {
            updateTestCaseInBothArrays(testCaseId, 'isRunning', false);
        }
    };

    const runAllTestCases = async () => {
        // Check if user is premium for running all test cases
        if (!questionAccess.can_access_all) {
            alert('Running all test cases (including hidden ones) is only available for premium users. Please upgrade to premium to access this feature.');
            return;
        }

        // Check if on cooldown
        if (isOnCooldown) {
            alert('Please wait a few seconds before running test cases again.');
            return;
        }

        setLastRunTime(Date.now());

        // Run all test cases including hidden ones
        const allCasesToRun = allTestCases.length > 0 ? allTestCases : testCases;
        let allPassed = true;
        let firstError = null;

        for (const testCase of allCasesToRun) {
            if (testCase.input.trim() && testCase.expectedOutput.trim()) {
                const passed = await runTestCase(testCase.id, true);
                if (!passed) {
                    allPassed = false;
                    // We can't easily get the error message here without state, 
                    // but the state update happens async.
                    // Ideally we'd grab the result from runTestCase return value if we changed it to return result obj.
                    // For now, we trust that runTestCase updated state.
                }
                // Add a small delay between test cases to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // After running all test cases
        setTimeout(() => {
            if (allPassed) {
                setShowSuccessPopup(true);

                // Mark question as solved if user is authenticated
                if (isAuthenticated() && user?.id) {
                    const markSolved = async () => {
                        try {
                            const decryptedQuestionId = decryptId(encryptedId);
                            await fetch(API_ENDPOINTS.USER_SOLVED_QUESTIONS, {
                                method: 'POST',
                                headers: getApiHeaders(),
                                body: JSON.stringify({
                                    action: 'mark_solved',
                                    user_id: user.id,
                                    question_id: decryptedQuestionId
                                })
                            });
                        } catch (error) {
                            console.error('Error marking question as solved:', error);
                        }
                    };
                    markSolved();
                }

                setTimeout(() => {
                    setShowSuccessPopup(false);
                }, 5000);
            } else {
                // Check for hidden failures
                if (allTestCases.length > 2) {
                    // We need to check current state, but allPassed local var should be accurate for this run
                    // except parallel/race conditions aren't handled, but we await sequentially.

                    // Just to be sure about UI update logic for hidden cases:
                    const hiddenTestCases = allTestCases.slice(2);
                    // Note: allTestCases here is stale from start of function!
                    // But we used local allPassed flag based on return values.

                    // If we want to show hidden results panel:
                    if (!allPassed) {
                        setShowAllTestResults(true);
                    }
                }
            }

            // Scroll to the first test case to show results
            setTimeout(() => {
                if (allCasesToRun.length > 0) {
                    const firstTestCaseElement = document.getElementById(`test-case-${allCasesToRun[0].id}`);
                    if (firstTestCaseElement) {
                        firstTestCaseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            }, 100);
        }, 500);
    };

    const runSpecificTestCase = async (testCaseId) => {
        // Cooldown check is inside runTestCase for batch=false
        await runTestCase(testCaseId, false);
    };

    // Function to fix code with AI
    const fixCodeWithAI = async () => {
        if (!code.trim()) {
            alert('No code to fix');
            return;
        }

        if (!compilerErrors.length) {
            alert('No compiler errors to fix. Run your code first to generate errors.');
            return;
        }

        setIsAiFixing(true);

        try {
            // Call PHP backend instead of Gemini directly
            const response = await fetch(`${API_ENDPOINTS.AI_FIX}`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    code: code,
                    errors: compilerErrors
                })
            });

            const data = await response.json();

            if (data.status === 'success' && data.fixed_code) {
                setCode(data.fixed_code);
                // Save the fixed code to cache
                if (isAuthenticated() && user?.id) {
                    saveUserCodeToCache(data.fixed_code);
                }
                // Clear compiler errors since code was fixed
                setCompilerErrors([]);
                alert('Code has been fixed by AI!');
            } else {
                alert(data.message || 'Failed to get AI response. Please try again.');
            }
        } catch (error) {
            console.error('Error fixing code with AI:', error);
            alert('An error occurred while fixing the code. Please try again.');
        } finally {
            setIsAiFixing(false);
        }
    };

    const runCode = async () => {
        // Check if on cooldown
        if (isOnCooldown) {
            alert('Please wait a few seconds before running code again.');
            return;
        }

        setIsRunning(true);
        setLastRunTime(Date.now());

        try {
            const langName = languageMapping[selectedLanguage] || 'c++';

            // Find the appropriate version from Piston runtimes
            const runtimesResponse = await fetch('https://emkc.org/api/v2/piston/runtimes');
            const runtimes = await runtimesResponse.json();

            // Find the runtime with the highest version for the selected language
            let runtime = null;
            const matchingRuntimes = runtimes.filter(r => r.language === langName);

            if (matchingRuntimes.length > 0) {
                matchingRuntimes.sort((a, b) => {
                    const versionA = a.version.split('.').map(Number);
                    const versionB = b.version.split('.').map(Number);

                    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                        const numA = versionA[i] || 0;
                        const numB = versionB[i] || 0;

                        if (numA > numB) return -1;
                        if (numA < numB) return 1;
                    }
                    return 0;
                });

                runtime = matchingRuntimes[0];
            }

            if (!runtime) {
                alert(`Error: Language '${langName}' not found in Piston runtimes`);
                setIsRunning(false);
                return;
            }

            // Build combined, runnable code
            const combined = buildCombinedCode(langName, code);
            const fileName = getFileNameForLang(langName);

            // Execute code using Piston API
            const executeResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{
                        name: fileName,
                        content: combined
                    }],
                    stdin: ''
                })
            });

            const result = await executeResponse.json();

            let outputText = '';
            let errors = [];

            if (result.run) {
                if (result.run.stdout) {
                    outputText += result.run.stdout;
                }
                if (result.run.stderr) {
                    if (result.run.code !== 0) {
                        if (outputText) outputText += '\n';
                        outputText += `Error: ${result.run.stderr}`;
                        errors.push(`Runtime Error: ${result.run.stderr}`);
                    } else {
                        if (!result.run.stderr.includes('uses unchecked or unsafe operations') &&
                            !result.run.stderr.includes('Recompile with -Xlint')) {
                            if (outputText) outputText += '\n';
                            outputText += `Stderr: ${result.run.stderr}`;
                        }
                    }
                }
                if (result.run.code !== 0) {
                    if (outputText) outputText += '\n';
                    outputText += `Exit code: ${result.run.code}`;
                }
                if (result.run.signal) {
                    if (outputText) outputText += '\n';
                    outputText += `Signal: ${result.run.signal}`;
                }
            } else {
                outputText = `Error: ${result.message || 'Unknown error occurred'}`;
                errors.push(`Execution Error: ${result.message || 'Unknown error occurred'}`);
            }

            if (result.compile && result.compile.output) {
                const compileOutput = result.compile.output.trim();
                if (compileOutput) {
                    if (result.compile.code && result.compile.code !== 0) {
                        if (outputText) outputText += '\n';
                        outputText += `Compile error: ${compileOutput}`;
                        errors.push(`Compile Error: ${compileOutput}`);
                    } else {
                        if (outputText) outputText += '\n';
                        outputText += `Compile warning: ${compileOutput}`;
                    }
                }
            }

            // Store compiler errors for AI fixing
            if (errors.length > 0) {
                setCompilerErrors(errors);
            }

            alert(outputText || 'No output');

        } catch (error) {
            console.error('Error running code:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    React.useEffect(() => {
        // Disable body scrolling for full-screen experience
        document.body.style.overflow = 'hidden';

        // NOTE: Removed keydown and contextmenu event listeners that were blocking scrolling and interactions
        // The image protection logic was overly aggressive and preventing scrolling in some cases.

        // Inject custom LeetCode-style CSS for HTML content and layout
        const style = document.createElement('style');
        style.innerHTML = `
            /* Allow text selection for question content */
            .question-content {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
                position: relative;
            }

            .question-content * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }

            /* Keep image protection */
            .question-images {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
                pointer-events: none;
                position: relative;
            }

            .question-images img {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                pointer-events: none !important;
                -webkit-user-drag: none;
                -khtml-user-drag: none;
                -moz-user-drag: none;
                -o-user-drag: none;
                user-drag: none;
            }

            /* Allow text selection for problem statement */
            .problem-statement-container {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }

            .problem-statement-container * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }
            
            /* Solution content should be copyable */
            .solution-content {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }
            
            .solution-content * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
            
            
            .question-images::before {
                content: '🔒 Protected Images';
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
                opacity: 0.7;
                pointer-events: none;
            }
            /* Custom styles for clean dark layout */
            @media (min-width: 1024px) {
                .leetcode-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    height: calc(100vh - 200px);
                    overflow: hidden;
                    max-width: 1400px;
                }
                .leetcode-left {
                    overflow-y: auto;
                    padding-right: 1rem;
                    max-width: 100%;
                }
                .leetcode-right {
                    overflow-y: auto;
                    padding-left: 1rem;
                    max-width: 100%;
                }
            }
            .html-content.leetcode-style p { 
                margin-bottom: 0.75rem; 
                line-height: 1.5; 
                color: #d1d5db;
                font-size: 0.8125rem;
                font-weight: 300;
            }
            
            .html-content.leetcode-style ul, .html-content.leetcode-style ol { 
                margin-bottom: 0.75rem; 
                padding-left: 1.25rem; 
                color: #d1d5db;
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style li { 
                margin-bottom: 0.25rem; 
                line-height: 1.5;
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style h1 { 
                font-size: 1.25rem; 
                font-weight: 500; 
                margin-bottom: 1rem; 
                margin-top: 1.25rem;
                color: white; 
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 0.5rem;
                letter-spacing: -0.02em;
            }
            
            .html-content.leetcode-style h2 { 
                font-size: 1.125rem; 
                font-weight: 500; 
                margin-bottom: 0.75rem; 
                margin-top: 1.25rem; 
                color: white;
                letter-spacing: -0.02em;
            }
            
            .html-content.leetcode-style h3 { 
                font-size: 1rem; 
                font-weight: 500; 
                margin-bottom: 0.5rem; 
                margin-top: 1rem; 
                color: #f3f4f6;
                display: flex;
                align-items: center;
                letter-spacing: -0.02em;
            }
            
            .html-content.leetcode-style strong { 
                font-weight: 600; 
                color: white; 
            }
            
            .html-content.leetcode-style em { 
                font-style: italic; 
                color: #9ca3af; 
            }
            
            .html-content.leetcode-style a { 
                color: #fff; 
                text-decoration: underline;
                text-decoration-color: rgba(255,255,255,0.3);
                transition: all 0.2s ease;
            }
            
            .html-content.leetcode-style a:hover {
                text-decoration-color: rgba(255,255,255,1);
            }
            
            .html-content.leetcode-style code { 
                background: rgba(255, 255, 255, 0.05);
                color: #e5e5e5; 
                padding: 0.125rem 0.375rem; 
                border-radius: 0.25rem; 
                font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace; 
                font-size: 0.75rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
                font-weight: 400;
            }
            
            .html-content.leetcode-style pre { 
                background: #111;
                border: 1px solid rgba(255, 255, 255, 0.1); 
                border-radius: 0.5rem; 
                padding: 0.75rem; 
                overflow-x: auto; 
                margin: 0.75rem 0;
                font-size: 0.75rem;
            }
            
            .html-content.leetcode-style img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 0.5rem; 
                margin: 0.75rem 0; 
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .html-content.leetcode-style blockquote { 
                border-left: 2px solid rgba(255, 255, 255, 0.2); 
                padding: 0.375rem 0.75rem; 
                margin: 0.75rem 0; 
                color: #cbd5e1;
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style table { 
                width: 100%; 
                border-collapse: separate;
                border-spacing: 0;
                margin: 0.75rem 0; 
                border-radius: 0.5rem;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style th { 
                padding: 0.5rem 0.75rem; 
                background: rgba(255, 255, 255, 0.05);
                color: #f3f4f6; 
                font-weight: 500;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style td { 
                padding: 0.5rem 0.75rem; 
                color: #d1d5db;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 0.8125rem;
            }
            
            .html-content.leetcode-style tr:hover td {
                background: rgba(255, 255, 255, 0.02);
            }

            /* Example sections styling */
            .html-content.leetcode-style h3:contains("Example") {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1));
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 0.375rem;
                padding: 0.5rem 0.75rem;
                margin: 1rem 0 0.5rem 0;
            }
        `;
        document.head.appendChild(style);

        // Cleanup function
        return () => {
            // Re-enable body scrolling
            document.body.style.overflow = '';

            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        const fetchQuestionDetails = async () => {
            try {
                const decryptedId = decryptId(encryptedId);
                if (!decryptedId) {
                    setError('Invalid question ID');
                    return;
                }

                const companyId = decryptId(encryptedCompanyId);

                // Get the current question details
                const response = await fetch(API_ENDPOINTS.QUESTION_BY_ID(decryptedId), {
                    headers: getApiHeaders()
                });
                const data = await response.json();

                if (data.status === 'success') {
                    setQuestion(data.data);

                    // Load pregiven code for supported languages
                    const newPregivenCode = {
                        cpp: data.data.pregiven_code_cpp || data.data.pregiven_code || '',
                        python: data.data.pregiven_code_python || '',
                        java: data.data.pregiven_code_java || ''
                    };
                    setPregivenCode(newPregivenCode);

                    // Set initial code for default language (C++)
                    if (newPregivenCode.cpp) {
                        setCode(newPregivenCode.cpp);
                    } else {
                        // Fallback to default C++ template if no pregiven code
                        setCode(`class Solution {
public:
    int alternatingSum(vector<int>& nums) {
        // Write your code here

    }
};`);
                    }

                    // Load cached user code if available (overrides pregiven code)
                    if (isAuthenticated() && user?.id) {
                        const cachedCode = loadUserCodeFromCache();
                        if (cachedCode) {
                            setCode(cachedCode);
                        }
                    }

                    // Load test cases from database if available
                    if (data.data.input_test_case && data.data.output_test_case) {
                        try {
                            const inputs = JSON.parse(data.data.input_test_case);
                            const outputs = JSON.parse(data.data.output_test_case);

                            if (Array.isArray(inputs) && Array.isArray(outputs) && inputs.length === outputs.length) {
                                const dbTestCases = inputs.map((input, index) => ({
                                    id: index + 1,
                                    input: input,
                                    expectedOutput: outputs[index],
                                    actualOutput: '',
                                    passed: null,
                                    isRunning: false,
                                    isDatabase: true
                                }));

                                setAllTestCases(dbTestCases);
                                // Show all test cases from database
                                setTestCases(dbTestCases);
                                setActiveTestCase(1);
                            }
                        } catch (error) {
                            console.error('Error parsing test cases from database:', error);
                        }
                    }

                    // Update question access for non-premium users
                    if (isAuthenticated() && user?.id) {
                        await updateQuestionAccess(companyId);
                        const access = await checkQuestionAccess(companyId);
                        setQuestionAccess(access);

                    }

                    // Fetch question images
                    const imagesResponse = await fetch(
                        API_ENDPOINTS.QUESTION_IMAGES(decryptedId),
                        { headers: getApiHeaders() }
                    );
                    const imagesData = await imagesResponse.json();

                    if (imagesData.status === 'success') {
                        setQuestionImages(imagesData.data);
                    }
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Failed to fetch question details');
            } finally {
                setLoading(false);
            }
        };

        if (encryptedId && encryptedCompanyId) {
            fetchQuestionDetails();
            // Fetch request count when component loads
            fetchRequestCount();
        }
    }, [encryptedId, encryptedCompanyId, isAuthenticated, user, updateQuestionAccess]);

    // Function to fetch solution directly from database
    const requestSolution = async () => {
        if (!isAuthenticated() || !user?.id || !question) {
            return;
        }

        // Check if solution is already cached for this user
        const cacheKey = `solution_${user.id}_${decryptId(encryptedId)}`;
        const cachedSolution = localStorage.getItem(cacheKey);
        if (cachedSolution) {
            setFetchedSolution(cachedSolution);
            setShowingSolution(true);
            // Scroll to solution after a short delay to ensure it's rendered
            setTimeout(() => {
                const solutionElement = document.getElementById('solution-section');
                if (solutionElement) {
                    solutionElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
            return;
        }

        setRequestingSolution(true);
        try {
            const decryptedQuestionId = decryptId(encryptedId);

            const apiUrl = `${API_ENDPOINTS.SOLUTION_REQUESTS}?action=get_solution&user_id=${user.id}&question_id=${decryptedQuestionId}`;

            // Fetch solution from database
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: getApiHeaders()
            });

            const data = await response.json();

            if (data.status === 'success') {
                const solution = data.data?.solution || data.solution;
                setFetchedSolution(solution);
                setShowingSolution(true);

                // Cache the solution for future use
                localStorage.setItem(cacheKey, solution);

                // Scroll to solution after a short delay to ensure it's rendered
                setTimeout(() => {
                    const solutionElement = document.getElementById('solution-section');
                    if (solutionElement) {
                        solutionElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);

                // Update solution request count for user (only if not cached)
                if (!cachedSolution) {
                    await updateQuestionAccess(decryptId(encryptedCompanyId));
                    // Refresh request count after successful solution request
                    await fetchRequestCount();
                    // Refresh global navbar request count if available
                    if (window.refreshRequestCount) {
                        window.refreshRequestCount();
                    }
                }
            } else if (data.message === "Solution not available for this question") {
                alert("We don't have this solution right now. We will upload it soon.");
            } else {
                alert(data.message || 'Failed to fetch solution');
            }
        } catch (error) {
            console.error('Error fetching solution:', error);
            alert('An error occurred while fetching the solution');
        } finally {
            setRequestingSolution(false);
        }
    };

    // Function to scroll to images
    const scrollToImages = () => {
        const imagesSection = document.getElementById('question-images-section');
        if (imagesSection) {
            imagesSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            // If images section is not rendered yet (e.g., collapsed or hidden), try to find the container
            const container = document.querySelector('.question-images');
            if (container) {
                container.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('No visual reference available for this question.');
            }
        }
    };

    // Function to scroll to solution
    const scrollToSolution = () => {
        const solutionSection = document.getElementById('solution-section');
        if (solutionSection) {
            solutionSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Function to close solution view
    const closeSolution = () => {
        setShowingSolution(false);
        setFetchedSolution(null);
    };

    // Code caching functions
    const getUserCodeCacheKey = () => {
        if (!user?.id || !encryptedId) return null;
        return `user_code_${user.id}_${decryptId(encryptedId)}`;
    };

    const saveUserCodeToCache = (code) => {
        const cacheKey = getUserCodeCacheKey();
        if (cacheKey) {
            localStorage.setItem(cacheKey, code);
        }
    };

    const loadUserCodeFromCache = () => {
        const cacheKey = getUserCodeCacheKey();
        if (cacheKey) {
            return localStorage.getItem(cacheKey);
        }
        return null;
    };

    // Function to reset to original pregiven code
    const resetToOriginalCode = () => {
        let codeToReset = '';
        if (selectedLanguage === 'cpp' && pregivenCode.cpp) {
            codeToReset = pregivenCode.cpp;
        } else if (selectedLanguage === 'python' && pregivenCode.python) {
            codeToReset = pregivenCode.python;
        } else if (selectedLanguage === 'java' && pregivenCode.java) {
            codeToReset = pregivenCode.java;
        } else {
            codeToReset = languageTemplates[selectedLanguage] || '';
        }

        if (codeToReset) {
            setCode(codeToReset);
            // Clear the cached user code so it doesn't reload on next load
            const cacheKey = getUserCodeCacheKey();
            if (cacheKey) {
                localStorage.removeItem(cacheKey);
            }
            setShowResetConfirm(false);
        }
    };

    // Function to fetch user's daily request count



    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-xl border-red-500/20 rounded-2xl p-8 shadow-2xl">
                    <CardHeader className="flex flex-row items-center space-x-3 p-0 mb-4">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <FaTimes className="text-red-400 text-lg" />
                        </div>
                        <CardTitle className="text-xl font-bold text-red-300">Error</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-red-200 text-lg">{error}</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/questions/${encryptedId}?company_id=${encryptedCompanyId}`)}
                            className="mt-4 bg-red-500/20 text-red-300 font-medium border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                        >
                            <FaArrowLeft className="mr-2" />
                            Back to Question
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden text-white font-sans selection:bg-white/20">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <DotPattern
                    width={24}
                    height={24}
                    cx={12}
                    cy={12}
                    cr={1}
                    className="absolute inset-0 opacity-[0.15] text-white/20"
                />
            </div>

            {/* Content Wrapper - Full Screen */}
            <div className="relative z-10 h-full w-full flex flex-col">
                {/* Custom Header - Minimal Clean Design */}
                <div className="bg-[#0a0a0a] border-b border-white/10 px-4 md:px-6 py-0 flex items-center justify-between h-14 relative">
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link to="/" className="font-bold text-lg tracking-tight flex items-center gap-1 text-white mr-6">
                            OA<span className="text-blue-500">Helper</span>
                        </Link>

                        {/* Breadcrumb Navigation - Moved back to left */}
                        <div className="hidden xl:flex items-center space-x-3 text-sm border-l border-white/10 pl-6">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <FaHome />
                            </button>
                            <FaChevronRight className="text-gray-600 text-xs" />
                            <button
                                onClick={() => navigate('/#companies')}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Companies
                            </button>
                            <FaChevronRight className="text-gray-600 text-xs" />
                            <button
                                onClick={() => navigate(`/company-questions?id=${encryptedCompanyId}`)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {question?.company_name || 'Company'}
                            </button>
                        </div>
                    </div>

                    {/* Navbar Options - Centered */}
                    <div className="hidden lg:flex items-center justify-center space-x-4 h-8 absolute left-1/2 transform -translate-x-1/2">
                        <Link to="/placement-data" className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-white/10 group">
                            <FaBriefcase className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                            <span className="group-hover:tracking-wide transition-all duration-300">Companies</span>
                        </Link>
                        <Link to="/interview-experiences" className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-white/10 group">
                            <FaUserCircle className="text-gray-500 group-hover:text-green-400 transition-colors" />
                            <span className="group-hover:tracking-wide transition-all duration-300">Interviews</span>
                        </Link>

                        <div className="w-px h-5 bg-white/10 mx-2"></div>

                        <div className={`flex items-center space-x-1 rounded-full border p-1.5 transition-all duration-300 ${is_premium
                            ? 'bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}>
                            <div className="relative">
                                <div className="flex items-center space-x-2 px-2 py-1 rounded-full">
                                    {is_premium ? (
                                        <div className="flex items-center space-x-1.5">
                                            <FaPaperPlane className="text-blue-400 text-xs" />
                                            <span className="text-gray-300 text-[10px] font-medium uppercase tracking-wide">Requests:</span>
                                            <span className="text-white font-bold text-xs">{requestCount.remaining_requests}</span>
                                        </div>
                                    ) : (
                                        <Link to="/premium" className="flex items-center space-x-1.5 group">
                                            <FaCrown className="text-yellow-500 text-xs group-hover:text-yellow-400 transition-colors" />
                                            <span className="text-gray-300 group-hover:text-white text-xs font-bold transition-colors">Get Premium</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3">
                        {isAuthenticated() && (
                            <>
                                {/* Solution Button */}
                                <Button
                                    variant={showingSolution ? "default" : "outline"}
                                    className={`h-9 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all space-x-2 ${showingSolution
                                        ? 'bg-white text-black border-white hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        if (showingSolution) {
                                            closeSolution();
                                        } else if (!questionAccess.can_access_all) {
                                            navigate('/payment');
                                        } else {
                                            requestSolution();
                                        }
                                    }}
                                    disabled={requestingSolution}
                                >
                                    {requestingSolution ? (
                                        <FaSpinner className="animate-spin text-[10px]" />
                                    ) : showingSolution ? (
                                        <FaTimes className="text-[10px]" />
                                    ) : (
                                        <FaCode className="text-[10px]" />
                                    )}
                                    <span className="hidden sm:inline uppercase">
                                        {requestingSolution
                                            ? 'Loading...'
                                            : showingSolution
                                                ? 'Hide Solution'
                                                : 'Solution'
                                        }
                                    </span>
                                </Button>


                                {/* User Profile Avatar & Dropdown */}
                                {user && (
                                    <div className="relative group" ref={userDropdownRef}>
                                        <button
                                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                                            className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                        >
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center border border-white/10 text-xs font-bold text-white shadow-inner">
                                                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <FaChevronDown className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showUserDropdown && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="px-4 py-2 border-b border-white/5 mb-1">
                                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>

                                                <Link
                                                    to="/dashboard"
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <FaUserCircle className="text-xs" />
                                                    <span>Dashboard</span>
                                                </Link>

                                                <Link
                                                    to="/premium"
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-yellow-300/80 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors"
                                                >
                                                    <FaBuilding className="text-xs" />
                                                    <span>Premium</span>
                                                </Link>

                                                <div className="border-t border-white/5 my-1"></div>

                                                <button
                                                    onClick={() => logout()}
                                                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                                >
                                                    <FaSignOutAlt className="text-xs" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content - Split Screen Layout */}
                <div ref={mainContainerRef} className="flex-1 flex relative overflow-hidden">
                    {question?.premium_required == 1 && !is_premium ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] relative z-50 p-4 animate-in fade-in duration-500">
                            <Card className="bg-[#121212] rounded-[2rem] p-8 max-w-md w-full border-white/5 shadow-2xl relative overflow-hidden">
                                <CardHeader className="p-0 mb-4">
                                    <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4">
                                        <FaCrown className="text-lg text-white" />
                                    </div>
                                    <CardTitle className="text-lg font-medium text-white">Premium Question</CardTitle>
                                </CardHeader>

                                <CardContent className="p-0 mb-10">
                                    <Link to="/premium" className="flex items-center justify-between w-full p-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222] transition-colors group">
                                        <span className="text-gray-300 font-medium">Upgrade to Premium</span>
                                        <FaArrowRight className="text-gray-500 group-hover:text-white transition-colors" />
                                    </Link>
                                </CardContent>

                                <CardFooter className="p-0 pt-6 border-t border-white/5 flex-col items-start">
                                    <p className="text-xs font-medium text-white mb-1">Requirement</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Active Premium Subscription. <br />
                                        Starting at just ₹99/mo.
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    ) : (
                        <>
                            {/* Left Column - Problem Statement */}
                            <div
                                className="h-full overflow-y-auto bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                                style={{ width: isDesktop ? `${leftPanelWidth}%` : '100%' }}
                            >
                                <div className="p-4 md:p-8 max-w-3xl mx-auto">
                                    {/* Tab Navigation */}
                                    <div className="flex items-center space-x-6 mb-8 border-b border-white/10 pb-1">
                                        <button
                                            onClick={() => setActiveTab('description')}
                                            className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'description' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                                        >
                                            Description
                                            {activeTab === 'description' && (
                                                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full"></div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('solutions')}
                                            className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'solutions' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                                        >
                                            Solutions
                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30 font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">New</span>
                                            {activeTab === 'solutions' && (
                                                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full"></div>
                                            )}
                                        </button>
                                    </div>

                                    {activeTab === 'description' ? (
                                        question?.premium_required == 1 && !is_premium ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
                                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                                    <FaCrown className="text-2xl text-yellow-500" />
                                                </div>
                                                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Premium Question</h2>
                                                <p className="text-gray-400 max-w-lg mb-8 text-sm leading-relaxed">
                                                    This question is part of our premium collection. Upgrade your account to unlock this question and access our full library of interview resources.
                                                </p>
                                                <Link
                                                    to="/premium"
                                                    className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                                                >
                                                    <FaCrown className="text-xl group-hover:rotate-12 transition-transform duration-300" />
                                                    <span className="text-lg">Upgrade to Premium</span>
                                                </Link>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Problem Statement */}
                                                <div className="mb-8 problem-statement-container relative">
                                                    {user?.id && (
                                                        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.04] select-none">
                                                            {Array.from({ length: 8 }).map((_, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="absolute transform -rotate-45 text-white text-sm font-bold whitespace-nowrap"
                                                                    style={{
                                                                        top: `${10 + (i * 12) + (i % 3) * 5}%`,
                                                                        left: `${5 + (i * 11) % 80}%`
                                                                    }}
                                                                >
                                                                    {user.id}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-base font-medium text-white tracking-tight flex items-center gap-2">
                                                                Problem Statement
                                                                {question?.premium_required == 1 && (
                                                                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                                        <FaCrown className="text-[10px]" /> Premium
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            {questionImages.length > 0 && (
                                                                <button
                                                                    onClick={scrollToImages}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 transition-all text-xs font-medium tracking-wide group"
                                                                >
                                                                    <FaExternalLinkAlt className="text-[10px] group-hover:scale-110 transition-transform" />
                                                                    <span>Real Question Images</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => openReportModal('question')}
                                                            className="flex items-center space-x-2 px-3 py-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-all duration-200 text-xs font-medium hover:bg-zinc-900"
                                                            title="Report issue with this question"
                                                        >
                                                            <FaFlag className="text-xs" />
                                                            <span>Report Issue</span>
                                                        </button>
                                                    </div>

                                                    {/* Problem content */}
                                                    <div className="prose prose-invert max-w-none">
                                                        <div className="html-content leetcode-style question-content"
                                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(styleHtmlContent(question?.problem_statement || '')) }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Images */}
                                                {questionImages.length > 0 && (
                                                    <div id="question-images-section" className="mb-10 question-images">
                                                        <h3 className="text-lg font-medium text-white mb-4">Visual Reference</h3>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {questionImages.map((image, index) => (
                                                                <div key={image.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                                                                    {user?.id && (
                                                                        <div
                                                                            className="absolute inset-0 z-20 opacity-15 select-none pointer-events-none"
                                                                            onContextMenu={(e) => e.preventDefault()}
                                                                        >
                                                                            {Array.from({ length: 6 }).map((_, i) => (
                                                                                <div 
                                                                                    key={i} 
                                                                                    className="absolute transform -rotate-45 text-white text-xs font-bold whitespace-nowrap"
                                                                                    style={{
                                                                                        top: `${15 + (i * 15) % 70}%`,
                                                                                        left: `${10 + (i * 18) % 75}%`
                                                                                    }}
                                                                                >
                                                                                    {user.id}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <img
                                                                        src={`${API_ENDPOINTS.BASE_URL}/${image.image_path}`}
                                                                        alt={`Question image ${index + 1}`}
                                                                        className="w-full h-auto transition-opacity duration-300"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                        draggable="false"
                                                                        onContextMenu={(e) => e.preventDefault()}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Solution Display - Only for coding questions in left panel, or on mobile */}
                                                {showingSolution && fetchedSolution && (!isDesktop || question?.question_type === 'coding') && (
                                                    <div id="solution-section" className="mt-8 border border-white/10 rounded-2xl overflow-hidden bg-[#111]">
                                                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                                            <h4 className="font-medium text-white">Solution</h4>
                                                            <button
                                                                onClick={() => openReportModal('solution')}
                                                                className="flex items-center space-x-2 text-zinc-500 hover:text-red-400 transition-colors text-xs"
                                                            >
                                                                <FaFlag className="text-xs" />
                                                                <span>Report</span>
                                                            </button>
                                                        </div>
                                                        <div className="p-0">
                                                            <Editor
                                                                height="400px"
                                                                language="cpp"
                                                                value={fetchedSolution}
                                                                theme="vs-dark"
                                                                options={{
                                                                    readOnly: true,
                                                                    minimap: { enabled: false },
                                                                    fontSize: 14,
                                                                    scrollBeyondLastLine: false,
                                                                    lineNumbers: 'off',
                                                                    padding: { top: 16, bottom: 16 },
                                                                    automaticLayout: true
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* Disclaimer Banner */}
                                            <Card className="bg-[#0a0a0a] border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
                                                <CardContent className="flex gap-4 relative z-10 p-0">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-blue-400 border border-white/5">
                                                            <FaCoins className="text-lg" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base font-bold text-white mb-2">Contribute & Earn OACoins </CardTitle>
                                                        <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                                                            Share your optimized solutions or report issues! If your solution is top-tier, or if you identify valid issues in the problem statement, solution, or test cases, you'll be rewarded with OACoins.
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold text-white tracking-tight">Community Solutions</h3>
                                                <Button
                                                    onClick={() => setShowPostSolutionModal(true)}
                                                    className="gap-2 px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-full text-sm font-bold transition-all"
                                                >
                                                    <FaPlus className="text-xs" />
                                                    <span>Post Solution</span>
                                                </Button>
                                            </div>

                                            {solutionsLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <FaSpinner className="animate-spin text-lg text-blue-500" />
                                                </div>
                                            ) : solutions.length === 0 ? (
                                                <Card className="text-center py-8 border-dashed border-white/10 bg-white/5">
                                                    <CardContent>
                                                        <FaCode className="text-2xl text-gray-600 mx-auto mb-3" />
                                                        <CardTitle className="text-lg font-medium text-white mb-2">No solutions yet</CardTitle>
                                                        <p className="text-gray-400 mb-6">Be the first to share your solution!</p>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setShowPostSolutionModal(true)}
                                                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors border-white/10"
                                                        >
                                                            Share Solution
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <div className="space-y-4">
                                                    {solutions.map((sol, index) => {
                                                        return (
                                                            <div key={sol.id} className="rounded-2xl border overflow-hidden transition-all duration-300 mb-6 bg-[#0a0a0a] border-white/5 hover:border-white/10">
                                                                <div className="flex flex-col">
                                                                    {/* Header Section */}
                                                                    <div className="p-6 pb-4">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm">
                                                                                    {sol.user_name ? sol.user_name.charAt(0).toUpperCase() : 'U'}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold text-white text-base">
                                                                                            {sol.user_name || 'Anonymous'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                                        <span>{new Date(sol.created_at).toLocaleDateString()}</span>
                                                                                        {sol.language && (
                                                                                            <>
                                                                                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                                                                <span className="uppercase tracking-wider font-medium">{sol.language}</span>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Title/Explanation */}
                                                                        {sol.explanation && (
                                                                            <div
                                                                                className="mt-4 cursor-pointer group"
                                                                                onClick={() => toggleSolutionExpand(sol.id)}
                                                                            >
                                                                                <p className={`text-gray-300 text-sm leading-relaxed transition-colors group-hover:text-white ${expandedSolutionId === sol.id ? "" : "line-clamp-3"}`}>
                                                                                    {sol.explanation}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Code Preview (if collapsed) */}
                                                                    {expandedSolutionId !== sol.id && (
                                                                        <div className="px-6 pb-6">
                                                                            <div
                                                                                className="bg-[#111] border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all group relative overflow-hidden"
                                                                                onClick={() => toggleSolutionExpand(sol.id)}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Snippet</span>
                                                                                    <span className="text-xs text-gray-500 group-hover:text-white transition-colors flex items-center gap-1">
                                                                                        View Full Code <FaChevronRight className="text-[10px]" />
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-24 overflow-hidden relative font-mono text-xs text-gray-400 opacity-60 group-hover:opacity-80 transition-opacity">
                                                                                    <pre>{sol.solution_code}</pre>
                                                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111]"></div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Footer Stats */}
                                                                            <div className="mt-4 flex items-center gap-4">
                                                                                <button
                                                                                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-colors"
                                                                                    onClick={() => toggleSolutionExpand(sol.id)}
                                                                                >
                                                                                    <FaComment />
                                                                                    <span>{sol.comment_count || 0} Comments</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Expanded Content (Code + Comments) */}
                                                                    {expandedSolutionId === sol.id && (
                                                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                                            {/* Full Code */}
                                                                            <div className="px-6 pb-6">
                                                                                <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                                                                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                                                                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                                                                                            {sol.language === 'c++' ? 'cpp' : sol.language}
                                                                                        </span>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            className="text-xs text-white hover:text-gray-300 gap-1.5 transition-colors px-2 py-1 rounded hover:bg-white/10 h-auto"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setCode(sol.solution_code);
                                                                                                setSelectedLanguage(sol.language === 'c++' ? 'cpp' : sol.language);
                                                                                                alert('Code copied to editor!');
                                                                                            }}
                                                                                        >
                                                                                            <FaFileCode /> Copy to Editor
                                                                                        </Button>
                                                                                    </div>
                                                                                    <Editor
                                                                                        height="400px"
                                                                                        language={sol.language === 'c++' ? 'cpp' : sol.language}
                                                                                        value={sol.solution_code}
                                                                                        theme="vs-dark"
                                                                                        options={{
                                                                                            readOnly: true,
                                                                                            minimap: { enabled: false },
                                                                                            fontSize: 14,
                                                                                            scrollBeyondLastLine: false,
                                                                                            lineNumbers: 'on',
                                                                                            padding: { top: 16, bottom: 16 },
                                                                                            automaticLayout: true,
                                                                                            fontFamily: "'JetBrains Mono', monospace"
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Comments Section */}
                                                                            <div className="bg-[#050505] border-t border-white/5 p-6">
                                                                                <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                                                                    <FaComment className="text-gray-500" />
                                                                                    Discussion ({sol.comment_count || 0})
                                                                                </h4>

                                                                                <div className="mb-8 flex gap-4">
                                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex-shrink-0 flex items-center justify-center text-white text-xs">
                                                                                        <FaUserCircle />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="relative">
                                                                                            <textarea
                                                                                                value={newComment}
                                                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                                                placeholder="Add to the discussion..."
                                                                                                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 min-h-[100px] resize-y placeholder-gray-600 transition-all"
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                        e.preventDefault();
                                                                                                        handlePostComment(sol.id);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <div className="absolute bottom-3 right-3">
                                                                                                <Button
                                                                                                    onClick={() => handlePostComment(sol.id)}
                                                                                                    disabled={postingComment || !newComment.trim()}
                                                                                                    className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                                                                                                >
                                                                                                    {postingComment ? <FaSpinner className="animate-spin" /> : 'Post Comment'}
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-6 pl-12 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-white/5">
                                                                                    {loadingComments[sol.id] ? (
                                                                                        <div className="text-center py-8">
                                                                                            <FaSpinner className="animate-spin text-white/20 text-xl mx-auto" />
                                                                                        </div>
                                                                                    ) : solutionComments[sol.id]?.length > 0 ? (
                                                                                        solutionComments[sol.id].map((comment) => {
                                                                                            return (
                                                                                                <div key={comment.id} className="group relative">
                                                                                                    <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 z-10">
                                                                                                        {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}
                                                                                                    </div>

                                                                                                    <div className="rounded-xl p-4 transition-all hover:bg-white/[0.02] border border-transparent hover:border-white/5">
                                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <span className="text-sm font-semibold text-white">
                                                                                                                    {comment.user_name || 'Anonymous'}
                                                                                                                </span>
                                                                                                                <span className="text-xs text-gray-600">
                                                                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">{comment.comment}</p>

                                                                                                        <div className="flex items-center gap-4">
                                                                                                            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white transition-colors">
                                                                                                                <FaReply />
                                                                                                                <span>Reply</span>
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                                                                                            <p className="text-gray-500 text-sm">No discussion yet. Start the conversation!</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vertical Resize Handle - REMOVED to fix panel size */}
                            {/* Divider with Horizontal Resize Handle */}
                            {isDesktop && (
                                <div
                                    className="w-1.5 hover:w-1.5 bg-black hover:bg-blue-500/50 relative z-20 cursor-col-resize transition-colors flex items-center justify-center group flex-shrink-0 -mx-0.5"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setResizingDirection('horizontal');
                                    }}
                                >
                                    <div className="w-0.5 h-8 bg-white/10 rounded-full group-hover:bg-white/40 transition-colors"></div>
                                </div>
                            )}

                            {/* Right Column - Code Editor or Solution */}
                            {isDesktop && (
                                <div
                                    ref={leftPanelRef}
                                    className="flex flex-col bg-[#0a0a0a] relative overflow-hidden"
                                    style={{ width: `${100 - leftPanelWidth}%` }}
                                >
                                    {question?.question_type === 'coding' ? (
                                        <>
                                            {/* Editor Header - VS Code Style */}
                                            <div className="h-10 bg-[#1e1e1e] flex items-center justify-between border-b border-[#2d2d2d] select-none">
                                                {/* File Tabs */}
                                                <div className="flex h-full overflow-x-auto scrollbar-hide">
                                                    <div className="flex items-center px-3 min-w-[120px] max-w-[200px] h-full bg-[#1e1e1e] border-t-2 border-blue-500 text-xs text-gray-300 relative group cursor-pointer">
                                                        <span className={`mr-2 text-sm ${selectedLanguage.includes('python') ? 'text-blue-400' :
                                                            selectedLanguage.includes('java') ? 'text-red-400' :
                                                                selectedLanguage.includes('script') ? 'text-yellow-400' :
                                                                    selectedLanguage.includes('cpp') ? 'text-blue-600' :
                                                                        'text-gray-400'
                                                            }`}>
                                                            <FaFileCode />
                                                        </span>
                                                        <span className="truncate font-medium">{getFileNameForLang(selectedLanguage)}</span>
                                                        <button className="ml-auto pl-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white">
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Editor Toolbar Actions */}
                                                <div className="flex items-center px-2 h-full space-x-1 bg-[#1e1e1e]">
                                                    {/* Language Selector */}
                                                    <div className="relative flex items-center px-2">
                                                        <div className="flex items-center bg-[#252526] border border-[#3e3e3e] rounded-md px-3 py-1 hover:border-blue-500/50 transition-colors group">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${selectedLanguage.includes('python') ? 'bg-blue-400' :
                                                                selectedLanguage.includes('java') ? 'bg-red-400' :
                                                                    selectedLanguage.includes('cpp') ? 'bg-blue-600' :
                                                                        'bg-yellow-400'
                                                                }`}></div>
                                                            <select
                                                                value={selectedLanguage}
                                                                onChange={(e) => handleLanguageChange(e.target.value)}
                                                                className="bg-transparent text-xs text-gray-300 hover:text-white focus:outline-none cursor-pointer appearance-none font-medium"
                                                                style={{
                                                                    textAlignLast: 'left',
                                                                    paddingRight: '1.5rem',
                                                                    backgroundImage: 'none'
                                                                }}
                                                            >
                                                                {Object.entries(languageNames).map(([key, name]) => (
                                                                    <option key={key} value={key} className="bg-[#1e1e1e] text-gray-300 py-1">
                                                                        {name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <FaChevronDown className="absolute right-4 text-[10px] text-gray-500 group-hover:text-gray-300 pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    <div className="h-4 w-px bg-[#333] mx-2"></div>

                                                    <button
                                                        onClick={() => setShowTestCases(!showTestCases)}
                                                        className={`p-1.5 rounded hover:bg-[#333] transition-colors ${showTestCases ? 'text-white' : 'text-gray-500'}`}
                                                        title="Toggle Terminal"
                                                    >
                                                        <FaTerminal className="text-sm" />
                                                    </button>


                                                </div>
                                            </div>

                                            {/* Code Editor Area */}
                                            <div className="flex-1 bg-[#1e1e1e] relative" style={{
                                                minHeight: 0,
                                                flexGrow: 1,
                                                height: showTestCases ? `${100 - testPanelHeight}%` : '100%',
                                                transition: resizingDirection ? 'none' : 'height 0.2s ease-out'
                                            }}>
                                                <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                                                    <Editor
                                                        height="100%"
                                                        width="100%"
                                                        language={selectedLanguage}
                                                        value={code}
                                                        onChange={(value) => {
                                                            setCode(value || '');
                                                            if (isAuthenticated() && user?.id) {
                                                                saveUserCodeToCache(value || '');
                                                            }
                                                        }}
                                                        theme={editorTheme}
                                                        options={{
                                                            fontSize: fontSize,
                                                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
                                                            fontLigatures: true,
                                                            minimap: { enabled: false },
                                                            scrollBeyondLastLine: true,
                                                            lineNumbers: 'on',
                                                            lineNumbersMinChars: 3,
                                                            folding: true,
                                                            glyphMargin: false,
                                                            padding: { top: 16, bottom: 16 },
                                                            overviewRulerLanes: 0,
                                                            hideCursorInOverviewRuler: true,
                                                            smoothScrolling: true,
                                                            cursorBlinking: 'smooth',
                                                            cursorSmoothCaretAnimation: 'on',
                                                            renderLineHighlight: 'all',
                                                            mouseWheelZoom: true,
                                                            scrollbar: {
                                                                vertical: 'visible',
                                                                horizontal: 'visible',
                                                                useShadows: true,
                                                                verticalScrollbarSize: 10,
                                                                horizontalScrollbarSize: 10,
                                                                alwaysConsumeMouseWheel: false
                                                            },
                                                            suggest: {
                                                                showWords: false
                                                            },
                                                            automaticLayout: true
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {showTestCases && (
                                                <div className="border-t border-white/10 flex flex-col bg-[#0a0a0a]/95 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" style={{ height: `${testPanelHeight}%` }}>
                                                    {/* Resize Handle */}
                                                    <div
                                                        className="absolute top-0 left-0 right-0 h-1 bg-transparent hover:bg-blue-500/50 cursor-row-resize transition-colors z-30 group"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setResizingDirection('vertical');
                                                        }}
                                                    >
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 rounded-full bg-white/10 group-hover:bg-blue-500/50 transition-colors opacity-0 group-hover:opacity-100" />
                                                    </div>

                                                    {/* Terminal Tabs */}
                                                    <div className="flex items-center justify-between px-4 bg-black/20 border-b border-white/5 h-10">
                                                        <div className="flex items-center h-full">
                                                            <button className="h-full px-4 text-xs font-semibold text-blue-400 border-b-2 border-blue-500 bg-blue-500/5 flex items-center gap-2">
                                                                <FaTerminal className="text-[10px]" />
                                                                TEST CASES
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center space-x-3 py-1">
                                                            <div className="text-xs text-gray-500 mr-2 font-mono">
                                                                <span className={allTestCases.some(tc => tc.passed === false) ? "text-red-400" : "text-green-400"}>
                                                                    {allTestCases.filter(tc => tc.passed === true).length}
                                                                </span>
                                                                <span className="mx-1 text-gray-600">/</span>
                                                                <span>{allTestCases.length}</span>
                                                                <span className="ml-1.5">Passed</span>
                                                            </div>

                                                            <div className="h-4 w-px bg-white/10 mx-2"></div>

                                                            <button
                                                                onClick={runAllTestCases}
                                                                className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-green-900/20 hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-1.5 overflow-hidden"
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                                <FaPaperPlane className="text-[8px]" />
                                                                <span>Submit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setShowTestCases(false)}
                                                                className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                            >
                                                                <FaTimes className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Terminal Content - Test Cases */}
                                                    <div className="flex-1 flex overflow-hidden">
                                                        {/* Test Case List */}
                                                        <div className="w-64 bg-black/20 border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
                                                            <div className="p-2 space-y-1">
                                                                {testCases.map((testCase) => (
                                                                    <div
                                                                        key={testCase.id}
                                                                        id={`test-case-${testCase.id}`}
                                                                        className={`w-full px-3 py-3 text-xs font-medium rounded-lg flex items-center justify-between group transition-all cursor-pointer border mb-1 ${activeTestCase === testCase.id
                                                                            ? 'bg-white/10 text-white border-white/10 shadow-inner'
                                                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
                                                                            }`}
                                                                        onClick={() => setActiveTestCase(testCase.id)}
                                                                    >
                                                                        <span className="flex items-center gap-3">
                                                                            <div className={`w-2 h-2 rounded-full ${testCase.passed === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                                                                testCase.passed === false ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                                                    activeTestCase === testCase.id ? 'bg-blue-500' : 'bg-gray-600'
                                                                                }`} />
                                                                            <span className="truncate font-mono">Test Case {testCase.id}</span>
                                                                        </span>

                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                runSpecificTestCase(testCase.id);
                                                                            }}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all border ${testCase.isRunning
                                                                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5 hover:border-white/20'
                                                                                }`}
                                                                            title="Run this test case"
                                                                        >
                                                                            {testCase.isRunning ? (
                                                                                <FaSpinner className="animate-spin text-[10px]" />
                                                                            ) : (
                                                                                <FaPlay className="text-[8px]" />
                                                                            )}
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Run</span>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={addTestCase}
                                                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-400 hover:text-blue-400 hover:bg-blue-500/5 rounded-lg transition-all mt-2 border border-dashed border-gray-700 hover:border-blue-500/30"
                                                                >
                                                                    <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center">
                                                                        <span className="text-lg leading-none mb-0.5">+</span>
                                                                    </div>
                                                                    <span>Add Test Case</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Test Case Details */}
                                                        <div className="flex-1 bg-[#0a0a0a]/50 p-6 overflow-y-auto font-mono custom-scrollbar">
                                                            {testCases.map((testCase) => activeTestCase === testCase.id && (
                                                                <div key={testCase.id} className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                    {/* Report Test Case Button */}
                                                                    <div className="flex justify-end mb-2">
                                                                        <button
                                                                            onClick={() => openTestCaseReportModal(testCase)}
                                                                            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all border border-red-500/20 hover:border-red-500/30"
                                                                            title="Report issue with this test case"
                                                                        >
                                                                            <FaFlag className="text-[8px]" />
                                                                            <span>Report Test Case</span>
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 gap-6">
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
                                                                                <span>Input</span>
                                                                                {testCase.id > 2 && (
                                                                                    <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                                        <FaFlag className="text-[8px]" /> Hidden
                                                                                    </span>
                                                                                )}
                                                                            </label>
                                                                            <div className="relative group">
                                                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur"></div>
                                                                                <div className="relative bg-black/40 rounded-xl border border-white/10 focus-within:border-blue-500/50 focus-within:bg-black/60 transition-all overflow-hidden">
                                                                                    {testCase.id > 2 ? (
                                                                                        <div className="w-full text-sm text-gray-500 p-4 min-h-[100px] flex flex-col items-center justify-center select-none italic bg-stripes-white-opacity-5">
                                                                                            <span className="text-2xl mb-2 opacity-20">🔒</span>
                                                                                            Hidden Input
                                                                                        </div>
                                                                                    ) : (
                                                                                        <textarea
                                                                                            value={testCase.input}
                                                                                            onChange={(e) => updateTestCase(testCase.id, 'input', e.target.value)}
                                                                                            className="w-full bg-transparent text-sm text-gray-300 p-4 focus:outline-none resize-y min-h-[100px] font-mono leading-relaxed placeholder-gray-700"
                                                                                            placeholder="Enter input..."
                                                                                            spellCheck="false"
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Output</label>
                                                                            <div className="relative group">
                                                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur"></div>
                                                                                <div className="relative bg-black/40 rounded-xl border border-white/10 focus-within:border-green-500/50 focus-within:bg-black/60 transition-all">
                                                                                    <textarea
                                                                                        value={testCase.expectedOutput}
                                                                                        onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                                                                                        className="w-full bg-transparent text-sm text-gray-300 p-4 focus:outline-none resize-y min-h-[100px] font-mono leading-relaxed placeholder-gray-700"
                                                                                        placeholder="Enter expected output..."
                                                                                        spellCheck="false"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {testCase.actualOutput && (
                                                                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                                                <label className="text-xs font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
                                                                                    <span>Actual Output</span>
                                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${testCase.passed
                                                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                                                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                                                        }`}>
                                                                                        {testCase.passed ? <FaCheckCircle /> : <FaTimes />}
                                                                                        {testCase.passed ? 'Passed' : 'Failed'}
                                                                                    </span>
                                                                                </label>
                                                                                <div className={`relative rounded-xl border p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed transition-all ${testCase.passed
                                                                                    ? 'bg-green-900/5 border-green-500/20 text-green-300/90'
                                                                                    : 'bg-red-900/5 border-red-500/20 text-red-300/90'
                                                                                    }`}>
                                                                                    {testCase.actualOutput}

                                                                                    {/* Status Indicator Line */}
                                                                                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${testCase.passed ? 'bg-green-500/50' : 'bg-red-500/50'}`} />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Premium Overlay Removed */}
                                        </>
                                    ) : (
                                        // Solution Viewer Logic for Non-Coding Questions
                                        <div className="flex flex-col h-full">
                                            {/* Solution Header */}
                                            <div className="h-10 bg-[#1e1e1e] flex items-center justify-between border-b border-[#2d2d2d] px-4 select-none">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-300">Solution</span>
                                                    {fetchedSolution && (
                                                        <button
                                                            onClick={() => openReportModal('solution')}
                                                            className="ml-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                                                            title="Report issue with solution"
                                                        >
                                                            <FaFlag />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Solution Content Area */}
                                            <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden">
                                                {showingSolution && fetchedSolution ? (
                                                    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                                                        <Editor
                                                            height="100%"
                                                            width="100%"
                                                            language="cpp"
                                                            value={fetchedSolution}
                                                            theme="vs-dark"
                                                            options={{
                                                                readOnly: true,
                                                                minimap: { enabled: false },
                                                                fontSize: 14,
                                                                scrollBeyondLastLine: false,
                                                                lineNumbers: 'off',
                                                                padding: { top: 16, bottom: 16 },
                                                                automaticLayout: true,
                                                                wordWrap: 'on'
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 border border-white/10">
                                                            <FaCode className="text-lg text-gray-500" />
                                                        </div>
                                                        <h3 className="text-sm font-medium text-white mb-2">Solution Locked</h3>
                                                        <p className="text-sm max-w-xs mx-auto mb-6">
                                                            Click the "Solution" button in the top right to view the answer for this question.
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                if (showingSolution) {
                                                                    closeSolution();
                                                                } else if (!questionAccess.can_access_all) {
                                                                    navigate('/payment');
                                                                } else {
                                                                    requestSolution();
                                                                }
                                                            }}
                                                            disabled={requestingSolution}
                                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium text-sm transition-colors flex items-center gap-2"
                                                        >
                                                            {requestingSolution ? (
                                                                <>
                                                                    <FaSpinner className="animate-spin" />
                                                                    Loading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaCode />
                                                                    View Solution
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div >
            </div >

            {/* Report Issue Modal */}
            {
                showReportModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="relative bg-[#111] border border-zinc-800 rounded-[2rem] p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                                            <FaExclamationTriangle className="text-white text-sm" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">
                                            Report Issue
                                        </h3>
                                    </div>
                                    <button
                                        onClick={closeReportModal}
                                        className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-all duration-200"
                                    >
                                        <FaTimes className="text-lg" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
                                        <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                            {reportType === 'question'
                                                ? 'If you find this question incorrect or have any issues, please report it to us. We will review and update it within 1-2 hours.'
                                                : 'If you find this solution incorrect or have any issues, please report it to us. We will review and update it within 1-2 hours.'
                                            }
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                                            <p className="text-zinc-400 text-sm font-medium">
                                                Reporting: {reportType === 'question' ? 'Question Issue' : 'Solution Issue'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-gray-300 text-sm font-medium mb-3">
                                        Describe the issue
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                            className="w-full h-36 bg-black border border-zinc-800 text-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-white focus:outline-none transition-colors duration-200 placeholder-zinc-700"
                                            placeholder={`Please describe the issue with this ${reportType}...`}
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-zinc-600">
                                            {reportDescription.length}/500
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={submitReport}
                                        disabled={reportingIssue || !reportDescription.trim()}
                                        className="flex-1 bg-white text-black rounded-xl border border-transparent hover:bg-gray-200 py-3 px-6 transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {reportingIssue ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FaFlag className="mr-2" />
                                                Submit Report
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={closeReportModal}
                                        className="bg-transparent text-gray-400 rounded-xl border border-zinc-800 hover:text-white hover:border-zinc-600 py-3 px-6 transition-all duration-200 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Test Case Report Modal */}
            {showTestCaseReportModal && testCaseReportData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="relative bg-[#111] border border-zinc-800 rounded-[2rem] p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                                        <FaFlag className="text-red-400 text-sm" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">
                                        Report Test Case #{testCaseReportData.id}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowTestCaseReportModal(false)}
                                    className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-all duration-200"
                                >
                                    <FaTimes className="text-lg" />
                                </button>
                            </div>

                            <div className="mb-5">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Issue Type</label>
                                <select
                                    value={testCaseIssueType}
                                    onChange={(e) => setTestCaseIssueType(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 text-gray-200 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none transition-colors"
                                >
                                    <option value="wrong_input">Wrong Input</option>
                                    <option value="wrong_output">Wrong Expected Output</option>
                                    <option value="both_wrong">Both Input & Output Wrong</option>
                                    <option value="other">Other Issue</option>
                                </select>
                            </div>

                            <div className="mb-5">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Description (Optional)</label>
                                <textarea
                                    value={testCaseReportDescription}
                                    onChange={(e) => setTestCaseReportDescription(e.target.value)}
                                    className="w-full h-24 bg-black border border-zinc-800 text-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-white focus:outline-none transition-colors placeholder-zinc-700"
                                    placeholder="Describe what's wrong with this test case..."
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={submitTestCaseReport}
                                    disabled={reportingTestCase}
                                    className="flex-1 bg-white text-black rounded-xl border border-transparent hover:bg-gray-200 py-3 px-6 transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {reportingTestCase ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FaFlag className="mr-2" />
                                            Submit Report
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowTestCaseReportModal(false)}
                                    className="bg-transparent text-gray-400 rounded-xl border border-zinc-800 hover:text-white hover:border-zinc-600 py-3 px-6 transition-all duration-200 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Popup */}
            {errorPopup.show && (
                <div className="fixed inset-0 flex items-center justify-center z-[70] animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setErrorPopup({ ...errorPopup, show: false })}></div>
                    <div className="relative bg-[#111] border border-red-500/30 rounded-2xl p-6 shadow-2xl max-w-lg w-full mx-4 transform animate-in zoom-in-95">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                <FaExclamationTriangle className="text-red-400 text-lg" />
                            </div>
                            <h3 className="text-xl font-medium text-red-400">
                                {errorPopup.title}
                            </h3>
                            <button
                                onClick={() => setErrorPopup({ ...errorPopup, show: false })}
                                className="ml-auto text-gray-500 hover:text-white transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl border border-red-500/10 p-4 mb-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            <pre className="text-red-300/90 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">
                                {errorPopup.message}
                            </pre>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setErrorPopup({ ...errorPopup, show: false })}
                                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Test Case Success Popup */}
            {singleSuccessPopup.show && (
                <div className="fixed top-20 right-1/2 translate-x-1/2 z-[60] animate-in slide-in-from-top-5 duration-300">
                    <div className="bg-[#0a0a0a] border border-green-500/30 rounded-xl p-4 shadow-lg shadow-green-900/20 flex items-center space-x-3 pr-6">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 animate-pulse">
                            <FaCheckCircle className="text-green-400 text-sm" />
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold text-sm">Success!</h4>
                            <p className="text-gray-400 text-xs">{singleSuccessPopup.message}</p>
                        </div>
                    </div>
                </div>
            )}



            {/* Feedback Modal */}
            {
                showFeedbackModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                        <FaCommentDots className="text-white text-lg" />
                                    </div>
                                    <h3 className="text-xl font-medium text-white">
                                        Send Feedback
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <FaTimes className="text-lg" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">
                                    Feedback Type
                                </label>
                                <select
                                    value={feedbackType}
                                    onChange={(e) => setFeedbackType(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-white/30 focus:outline-none transition-all appearance-none"
                                >
                                    <option value="general">General Feedback</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="improvement">Improvement Suggestion</option>
                                    <option value="code_editor">Code Editor Issues</option>
                                    <option value="test_cases">Test Cases Issues</option>
                                </select>
                            </div>

                            <div className="mb-8">
                                <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">
                                    Your Feedback
                                </label>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    className="w-full h-32 bg-[#111] border border-white/10 text-white rounded-xl px-4 py-3 text-sm resize-none focus:border-white/30 focus:outline-none transition-all placeholder-gray-600"
                                    placeholder="Please share your thoughts..."
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={async () => {
                                        if (!feedbackText.trim()) {
                                            alert('Please provide your feedback');
                                            return;
                                        }

                                        setSubmittingFeedback(true);
                                        try {
                                            const response = await fetch(API_ENDPOINTS.FEEDBACK, {
                                                method: 'POST',
                                                headers: getApiHeaders(),
                                                body: JSON.stringify({
                                                    action: 'submit_feedback',
                                                    user_id: user?.id,
                                                    user_email: user?.email,
                                                    feedback_type: feedbackType,
                                                    feedback_text: feedbackText.trim(),
                                                    page_url: window.location.href,
                                                    user_agent: navigator.userAgent
                                                })
                                            });

                                            const data = await response.json();

                                            if (data.status === 'success') {
                                                alert('Thank you for your feedback! We appreciate your input.');
                                                setShowFeedbackModal(false);
                                                setFeedbackText('');
                                                setFeedbackType('general');
                                            } else {
                                                alert(`Failed to submit feedback: ${data.message || 'Unknown error'}`);
                                            }
                                        } catch (error) {
                                            console.error('Error submitting feedback:', error);
                                            alert('An error occurred while submitting feedback.');
                                        } finally {
                                            setSubmittingFeedback(false);
                                        }
                                    }}
                                    disabled={submittingFeedback}
                                    className="flex-1 bg-white text-black rounded-xl border border-white hover:bg-gray-200 py-3 px-6 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {submittingFeedback ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FaCommentDots className="mr-2" />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="bg-transparent text-white rounded-xl border border-white/20 hover:bg-white/10 py-3 px-6 transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-[60] animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)}></div>
                    <div className="relative bg-[#0a0a0a] p-8 rounded-3xl border border-green-500/30 shadow-2xl transform animate-bounce-in text-center max-w-sm mx-4 overflow-hidden">
                        {/* Animated confetti effect background */}
                        <div className="absolute inset-0 bg-green-500/5"></div>

                        <div className="relative z-10">
                            <div className="mb-6 flex justify-center">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                                    <FaCheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                                Correct Solution!
                            </h3>

                            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                Congratulations! All test cases passed successfully.
                            </p>

                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-900/20"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Solution Modal */}
            {showPostSolutionModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 m-4 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-medium text-white">Post Your Solution</h3>
                            <button
                                onClick={() => setShowPostSolutionModal(false)}
                                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                            <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Language</label>
                                <select
                                    value={newSolutionLang}
                                    onChange={(e) => setNewSolutionLang(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:border-blue-500/50 focus:outline-none"
                                >
                                    {Object.entries(languageNames).map(([key, name]) => (
                                        <option key={key} value={key}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Code</label>
                                <div className="h-64 border border-white/10 rounded-xl overflow-hidden">
                                    <Editor
                                        height="100%"
                                        language={newSolutionLang === 'c++' ? 'cpp' : newSolutionLang}
                                        value={newSolutionCode}
                                        onChange={(value) => setNewSolutionCode(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Explanation (Optional)</label>
                                <textarea
                                    value={newSolutionExplanation}
                                    onChange={(e) => setNewSolutionExplanation(e.target.value)}
                                    className="w-full h-32 bg-[#111] border border-white/10 text-white rounded-xl px-4 py-3 text-sm resize-none focus:border-blue-500/50 focus:outline-none placeholder-gray-600"
                                    placeholder="Explain your approach..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setShowPostSolutionModal(false)}
                                className="px-4 py-2 bg-transparent text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostSolution}
                                disabled={postingSolution}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {postingSolution ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                <span>Post Solution</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset to Original Code Confirmation Modal */}
            {
                showResetConfirm && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                        <FaFileCode className="text-white text-lg" />
                                    </div>
                                    <h3 className="text-xl font-medium text-white">
                                        Reset to Original Code
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <FaTimes className="text-lg" />
                                </button>
                            </div>

                            <div className="mb-8 space-y-4">
                                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-400 text-sm leading-relaxed">
                                        This will reset your code editor back to the original pregiven code.
                                        Any changes you've made will be lost.
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Your cached code will also be cleared.
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={resetToOriginalCode}
                                    className="flex-1 bg-red-600 text-white rounded-xl border border-red-600 hover:bg-red-700 py-3 px-6 transition-all text-sm font-medium flex items-center justify-center"
                                >
                                    <FaFileCode className="mr-2" />
                                    Yes, Reset
                                </button>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="bg-transparent text-white rounded-xl border border-white/20 hover:bg-white/10 py-3 px-6 transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Upgrade Plan Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl
                         transform animate-bounce-in max-w-5xl mx-4 w-full my-8 p-8">

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Upgrade Plan</h3>
                                <p className="text-gray-400 text-sm">Unlock premium features and unlimited access</p>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                                <h4 className="text-base font-bold text-white mb-1">Basic</h4>
                                <div className="text-xl font-bold text-white mb-3">₹99<span className="text-xs font-normal text-gray-500">/mo</span></div>
                                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                                    <li className="flex items-center"><FaCheckCircle className="text-green-400 mr-2 text-xs" /> Unlimited Access</li>
                                    <li className="flex items-center"><FaCheckCircle className="text-green-400 mr-2 text-xs" /> 5 Solutions/day</li>
                                </ul>
                                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Basic%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-semibold">Select Basic</a>
                            </div>

                            <div className="bg-white/[0.05] border border-purple-500/30 rounded-3xl p-6 relative">
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full">POPULAR</div>
                                <h4 className="text-base font-bold text-white mb-1">Pro</h4>
                                <div className="text-xl font-bold text-white mb-3">₹199<span className="text-xs font-normal text-gray-500">/mo</span></div>
                                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                                    <li className="flex items-center"><FaCheckCircle className="text-purple-400 mr-2 text-xs" /> Unlimited Access</li>
                                    <li className="flex items-center"><FaCheckCircle className="text-purple-400 mr-2 text-xs" /> 15 Solutions/day</li>
                                    <li className="flex items-center"><FaCheckCircle className="text-purple-400 mr-2 text-xs" /> Priority Support</li>
                                </ul>
                                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Pro%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors font-bold">Select Pro</a>
                            </div>

                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                                <h4 className="text-base font-bold text-white mb-1">Unlimited</h4>
                                <div className="text-xl font-bold text-white mb-3">₹299<span className="text-xs font-normal text-gray-500">/45d</span></div>
                                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                                    <li className="flex items-center"><FaCheckCircle className="text-orange-400 mr-2 text-xs" /> Unlimited Access</li>
                                    <li className="flex items-center"><FaCheckCircle className="text-orange-400 mr-2 text-xs" /> Unlimited Solutions</li>
                                </ul>
                                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Unlimited%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-semibold">Select Unlimited</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extend Premium Modal */}
            {showExtendPremiumModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowExtendPremiumModal(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
                        <button
                            onClick={() => setShowExtendPremiumModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaClock className="text-amber-400 text-lg" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Extend Premium</h3>
                            <p className="text-gray-400 mt-1 text-xs">Use OACoins to extend your access</p>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-400 text-sm">Balance</span>
                                <span className="text-white font-bold flex items-center"><FaCoins className="text-yellow-400 mr-2" /> {oacoins}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Extend by</span>
                                <div className="flex items-center bg-black rounded-full border border-white/10 px-3 py-1">
                                    <input
                                        type="number"
                                        min="1"
                                        value={extendDays}
                                        onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="bg-transparent text-white w-12 text-center focus:outline-none font-bold"
                                    />
                                    <span className="text-gray-500 text-xs ml-1">days</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Cost</span>
                                <span className="text-white font-bold">{(extendDays * 3.5).toFixed(1)} coins</span>
                            </div>
                        </div>

                        {extendError && <p className="text-red-400 text-sm text-center mb-4">{extendError}</p>}
                        {extendSuccess && <p className="text-green-400 text-sm text-center mb-4">{extendSuccess}</p>}

                        <button
                            onClick={handleExtendPremium}
                            disabled={extendLoading || (oacoins - (extendDays * 3.5)) < 0}
                            className="w-full py-3.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {extendLoading ? 'Processing...' : 'Extend Now'}
                        </button>
                    </div>
                </div>
            )}

            {/* Earn Coins Modal */}
            {showEarnCoinsModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowEarnCoinsModal(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center">
                        <button
                            onClick={() => setShowEarnCoinsModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaCoins className="text-yellow-400 text-lg" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Earn OACoins</h3>
                        <p className="text-gray-400 text-xs mb-6">Share questions with us to earn coins.</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm mr-3">1</div>
                                <span className="text-gray-300 text-sm">Share OA questions</span>
                            </div>
                            <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm mr-3">2</div>
                                <span className="text-gray-300 text-sm">We verify the content</span>
                            </div>
                            <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm mr-3">3</div>
                                <span className="text-gray-300 text-sm">Receive OACoins</span>
                            </div>
                        </div>

                        <a
                            href="https://wa.me/919274985691?text=Hi,%20I%20want%20to%20share%20OA%20questions"
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full py-3.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                        >
                            Start Sharing
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionWithEditor;


