import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaExternalLinkAlt, FaBuilding, FaCode, FaShare, FaArrowLeft, FaPaperPlane, FaSpinner, FaCheckCircle, FaTimes, FaFlag, FaExclamationTriangle, FaBookmark, FaHeart, FaStar, FaExclamationCircle, FaFileCode, FaHome, FaChevronRight } from 'react-icons/fa';
import Navbar from './Navbar';
import PremiumModal from './PremiumModal';
import DOMPurify from 'dompurify';
import { decryptId, encryptId } from '../utils/encryption';
import DotPattern from './DotPattern';
import useScrollToTop from '../hooks/useScrollToTop';
import Loader from './Loader';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';

const QuestionDetails = () => {
    useScrollToTop();
    const { isAuthenticated, user } = useAuth();
    const { updateQuestionAccess, checkQuestionAccess } = usePremium();
    const { id: encryptedId } = useParams();
    const queryParams = new URLSearchParams(useLocation().search);
    const encryptedCompanyId = queryParams.get('company_id');
    const contentStyles = {
        'p': 'mb-6 text-gray-300 leading-relaxed text-lg',
        'ul': 'list-disc list-outside ml-6 mb-6 text-gray-300 leading-relaxed space-y-2',
        'ol': 'list-decimal list-outside ml-6 mb-6 text-gray-300 leading-relaxed space-y-2',
        'li': 'mb-2 text-gray-300 pl-1',
        'h1': 'text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight',
        'h2': 'text-2xl md:text-3xl font-semibold text-white mb-6 mt-10 tracking-tight',
        'h3': 'text-xl md:text-2xl font-medium text-white mb-5 mt-8',
        'strong': 'font-semibold text-white',
        'em': 'italic text-gray-400',
        'a': 'text-blue-400 hover:text-blue-300 underline underline-offset-4',
        'code': {
            inline: 'bg-zinc-800 text-gray-200 px-1.5 py-0.5 rounded-md text-sm font-mono border border-zinc-700',
            block: 'bg-zinc-900 p-6 rounded-2xl text-gray-200 text-sm font-mono overflow-x-auto my-6 border border-zinc-800 shadow-sm'
        },
        'pre': 'relative group',
        'blockquote': 'border-l-4 border-zinc-700 pl-6 py-2 my-6 text-gray-400 italic bg-zinc-900/50 rounded-r-lg',
        'img': 'max-w-full h-auto rounded-2xl my-6 border border-zinc-800 shadow-lg',
        'table': 'w-full text-left table-auto border-collapse my-6 rounded-xl overflow-hidden border border-zinc-800',
        'th': 'px-6 py-4 bg-zinc-900 border-b border-zinc-800 text-white font-semibold text-sm uppercase tracking-wider',
        'td': 'px-6 py-4 border-b border-zinc-800 text-gray-300',
        'div': 'text-gray-300',
        'span': 'text-gray-300',
    };

    React.useEffect(() => {
        // Prevent right-click context menu and keyboard shortcuts for images only
        const preventCopy = (e) => {
            // Check if the target is within images (not question content)
            const isQuestionImage = e.target.closest('.question-images');

            if (isQuestionImage) {
                // Prevent right-click context menu for images
                if (e.type === 'contextmenu') {
                    e.preventDefault();
                    return false;
                }

                // Prevent common copy shortcuts for images
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key.toLowerCase()) {
                        case 'c': // Ctrl+C
                        case 'a': // Ctrl+A (select all)
                        case 'x': // Ctrl+X
                        case 's': // Ctrl+S (save)
                        case 'p': // Ctrl+P (print)
                        case 'u': // Ctrl+U (view source)
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                    }
                }

                // Prevent F12 (developer tools)
                if (e.key === 'F12') {
                    e.preventDefault();
                    return false;
                }
            }
        };

        // Add event listeners
        document.addEventListener('contextmenu', preventCopy);
        document.addEventListener('keydown', preventCopy);

        // Prevent drag and drop for images only
        const preventDrag = (e) => {
            const isQuestionImage = e.target.closest('.question-images');

            if (isQuestionImage) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('dragstart', preventDrag);
        document.addEventListener('drag', preventDrag);
        document.addEventListener('dragend', preventDrag);

        // Additional protection against screenshots for images only
        const preventScreenshot = () => {
            // Only add overlay when hovering over images
            const images = document.querySelectorAll('.question-images img');
            let hasOverlay = false;

            images.forEach(img => {
                if (img.matches(':hover')) {
                    if (!hasOverlay) {
                        const overlay = document.createElement('div');
                        overlay.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: transparent;
                            z-index: 999999;
                            pointer-events: none;
                            user-select: none;
                            -webkit-user-select: none;
                            -moz-user-select: none;
                            -ms-user-select: none;
                        `;
                        document.body.appendChild(overlay);
                        hasOverlay = true;

                        // Remove overlay after a short delay
                        setTimeout(() => {
                            if (overlay.parentNode) {
                                overlay.parentNode.removeChild(overlay);
                            }
                        }, 100);
                    }
                }
            });
        };

        // Trigger overlay periodically to disrupt image screenshots
        const screenshotInterval = setInterval(preventScreenshot, 500);

        // Inject custom LeetCode-style CSS for HTML content and layout
        const style = document.createElement('style');
        style.innerHTML = `
            /* Allow text selection for question content */
            .question-content {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
                -webkit-touch-callout: default;
                -webkit-tap-highlight-color: default;
                position: relative;
            }

            .question-content * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
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
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
                -webkit-touch-callout: default;
                -webkit-tap-highlight-color: default;
            }

            .problem-statement-container * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
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
            /* Custom styles for LeetCode-style layout */
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
                margin-bottom: 1.5rem; 
                line-height: 1.8; 
                color: #d1d5db;
                font-size: 1.125rem;
            }
            
            .html-content.leetcode-style ul, .html-content.leetcode-style ol { 
                margin-bottom: 1.5rem; 
                padding-left: 1.5rem; 
                color: #d1d5db;
            }
            
            .html-content.leetcode-style li { 
                margin-bottom: 0.75rem; 
                line-height: 1.7;
            }
            
            .html-content.leetcode-style h1 { 
                font-size: 2.5rem; 
                font-weight: 700; 
                margin-bottom: 2.5rem; 
                margin-top: 3rem;
                color: white; 
                letter-spacing: -0.02em;
                border-bottom: 1px solid #333;
                padding-bottom: 1.5rem;
            }
            
            .html-content.leetcode-style h2 { 
                font-size: 2rem; 
                font-weight: 600; 
                margin-bottom: 1.75rem; 
                margin-top: 3rem; 
                color: white;
                letter-spacing: -0.02em;
            }
            
            /* Removed colored left border for h2 */
            
            .html-content.leetcode-style h3 { 
                font-size: 1.5rem; 
                font-weight: 600; 
                margin-bottom: 1.25rem; 
                margin-top: 2.5rem; 
                color: #f3f4f6;
                display: flex;
                align-items: center;
            }
            
            .html-content.leetcode-style h3:before {
                content: '';
                display: inline-block;
                width: 6px;
                height: 6px;
                background-color: #fff;
                border-radius: 50%;
                margin-right: 1rem;
                opacity: 0.6;
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
                color: #60a5fa; 
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: all 0.2s ease;
            }
            
            .html-content.leetcode-style a:hover {
                border-bottom-color: #60a5fa;
            }
            
            .html-content.leetcode-style code { 
                background-color: #27272a;
                color: #e5e7eb; 
                padding: 0.2rem 0.4rem; 
                border-radius: 0.375rem; 
                font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace; 
                font-size: 0.9rem;
                border: 1px solid #3f3f46;
            }
            
            .html-content.leetcode-style pre { 
                background-color: #18181b;
                border: 1px solid #27272a; 
                border-radius: 1rem; 
                padding: 1.5rem; 
                overflow-x: auto; 
                margin: 2rem 0;
                position: relative;
            }
            
            .html-content.leetcode-style pre:before {
               display: none;
            }
            
            .html-content.leetcode-style img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 1rem; 
                margin: 2rem 0; 
                border: 1px solid #27272a;
            }
            
            .html-content.leetcode-style blockquote { 
                border-left: 4px solid #3f3f46; 
                background: #18181b;
                padding: 1.5rem; 
                margin: 2rem 0; 
                color: #cbd5e1; 
                border-radius: 0 0.75rem 0.75rem 0;
                position: relative;
            }
            
            .html-content.leetcode-style blockquote:before {
                content: '"';
                position: absolute;
                top: -0.5rem;
                left: 1rem;
                font-size: 3rem;
                color: #3f3f46;
                opacity: 0.5;
                font-family: serif;
            }
            
            .html-content.leetcode-style table { 
                width: 100%; 
                border-collapse: separate;
                border-spacing: 0;
                margin: 2rem 0; 
                border-radius: 1rem;
                overflow: hidden;
                border: 1px solid #27272a;
            }
            
            .html-content.leetcode-style th { 
                padding: 1rem 1.5rem; 
                background: #18181b;
                color: #f3f4f6; 
                font-weight: 600;
                border-bottom: 1px solid #27272a;
                text-transform: uppercase;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
            }
            
            .html-content.leetcode-style td { 
                padding: 1rem 1.5rem; 
                color: #d1d5db;
                border-bottom: 1px solid #27272a;
                background: #09090b;
            }
            
            .html-content.leetcode-style tr:last-child td {
                border-bottom: none;
            }
            
            .html-content.leetcode-style tr:hover td {
                background: #18181b;
            }

            /* Example sections styling - Minimalist */
            .html-content.leetcode-style h3:contains("Example") {
                background: transparent;
                border: none;
                padding: 0;
                margin: 2.5rem 0 1rem 0;
                color: white;
            }

            /* Test cases styling - ensure white text visibility */
            .html-content.leetcode-style .test-case,
            .html-content.leetcode-style [class*="test"],
            .html-content.leetcode-style [class*="example"] {
                color: white !important;
            }

            .html-content.leetcode-style .test-case *,
            .html-content.leetcode-style [class*="test"] *,
            .html-content.leetcode-style [class*="example"] * {
                color: white !important;
            }

            /* Specific test case sections */
            .html-content.leetcode-style h3:contains("test"),
            .html-content.leetcode-style h3:contains("Test"),
            .html-content.leetcode-style h3:contains("example"),
            .html-content.leetcode-style h3:contains("Example"),
            .html-content.leetcode-style h4:contains("test"),
            .html-content.leetcode-style h4:contains("Test"),
            .html-content.leetcode-style h4:contains("example"),
            .html-content.leetcode-style h4:contains("Example") {
                color: white !important;
            }

            /* Any div or section that might contain test cases */
            .html-content.leetcode-style div[class*="test"],
            .html-content.leetcode-style div[class*="example"],
            .html-content.leetcode-style section[class*="test"],
            .html-content.leetcode-style section[class*="example"] {
                color: white !important;
            }

            .html-content.leetcode-style div[class*="test"] *,
            .html-content.leetcode-style div[class*="example"] *,
            .html-content.leetcode-style section[class*="test"] *,
            .html-content.leetcode-style section[class*="example"] * {
                color: white !important;
            }
        `;
        document.head.appendChild(style);

        // Cleanup function
        return () => {
            document.head.removeChild(style);
            document.removeEventListener('contextmenu', preventCopy);
            document.removeEventListener('keydown', preventCopy);
            document.removeEventListener('dragstart', preventDrag);
            document.removeEventListener('drag', preventDrag);
            document.removeEventListener('dragend', preventDrag);
            clearInterval(screenshotInterval);
        };
    }, []);

    const companyId = decryptId(encryptedCompanyId);

    const navigate = useNavigate();
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
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showingSolution, setShowingSolution] = useState(false);
    const [fetchedSolution, setFetchedSolution] = useState(null);
    const [isLayoutSplit, setIsLayoutSplit] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState(''); // 'question' or 'solution'
    const [reportDescription, setReportDescription] = useState('');
    const [reportingIssue, setReportingIssue] = useState(false);
    const [showBetaModal, setShowBetaModal] = useState(false);
    const [canProceed, setCanProceed] = useState(false);
    const [remainingTime, setRemainingTime] = useState(5);



    // Timer for beta modal proceed button
    useEffect(() => {
        if (showBetaModal) {
            setRemainingTime(5);

            const countdownInterval = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        setCanProceed(true);
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const timer = setTimeout(() => {
                setCanProceed(true);
                clearInterval(countdownInterval);
            }, 5000);

            return () => {
                clearTimeout(timer);
                clearInterval(countdownInterval);
            };
        } else {
            setCanProceed(false);
            setRemainingTime(5);
        }
    }, [showBetaModal]);

    useEffect(() => {
        const fetchQuestionDetails = async () => {
            try {
                const decryptedId = decryptId(encryptedId);
                if (!decryptedId) {
                    setError('Invalid question ID');
                    return;
                }

                // First, fetch all questions for this company to determine if this is the first question
                const companyQuestionsResponse = await fetch(
                    API_ENDPOINTS.QUESTIONS_BY_COMPANY(companyId),
                    { headers: getApiHeaders() }
                );
                // ... existing code ...

                // Get the current question details
                const response = await fetch(API_ENDPOINTS.QUESTION_BY_ID(decryptedId), {
                    headers: getApiHeaders()
                });
                const data = await response.json();

                if (data.status === 'success') {
                    setQuestion(data.data);


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

        if (encryptedId && companyId) {
            fetchQuestionDetails();
        }
    }, [encryptedId, companyId, isAuthenticated, user, updateQuestionAccess]);



    // Function to fetch solution directly from database
    const requestSolution = async () => {


        if (!isAuthenticated() || !user?.id || !question) {

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
                setIsLayoutSplit(true);

                // Update solution request count for user (only if this is the first time viewing)
                // The API will handle tracking whether this is a new view or repeat view
                await updateQuestionAccess(companyId);

                // Refresh navbar request count
                if (window.refreshRequestCount) {
                    window.refreshRequestCount();
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

    // Function to close solution view
    const closeSolution = () => {
        setShowingSolution(false);
        setFetchedSolution(null);
        setIsLayoutSplit(false);
    };


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

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${question?.company_name} - ${question?.title}`,
                    text: 'Check out this OA question!',
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch (err) {
            // console.error('Error sharing:', err);
        }
    };

    // Function to handle Write Code button click
    const handleWriteCodeClick = () => {
        // Check if beta modal was already shown
        const betaModalShown = localStorage.getItem('beta_modal_shown');

        if (betaModalShown) {
            // Beta modal was already shown, navigate directly
            navigate(`/question-with-editor/${encryptedId}?company_id=${encryptedCompanyId}`);
        } else {
            // Show beta modal for the first time
            setShowBetaModal(true);
        }
    };

    // Function to handle proceeding with beta modal
    const handleProceedWithBeta = () => {
        // Mark beta modal as shown so it won't appear again
        localStorage.setItem('beta_modal_shown', 'true');
        setShowBetaModal(false);
        // Navigate to code editor
        navigate(`/question-with-editor/${encryptedId}?company_id=${encryptedCompanyId}`);
    };

    // Function to apply custom LeetCode-style styles to HTML content
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
                code.className = contentStyles.code.code;
            }
        });

        // Enhance example sections with better spacing
        doc.querySelectorAll('h3').forEach(h3 => {
            if (h3.textContent.toLowerCase().includes('example')) {
                h3.className += ' border-l-4 border-indigo-500 pl-4 bg-indigo-500/5 py-2 rounded-r';
            }
        });

        return doc.body.innerHTML;
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F7F7F7]">
                <Navbar />
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500 text-xl font-bold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black relative overflow-hidden font-sans selection:bg-white/20">
            {/* Subtle Grid Background Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, white 1px, transparent 1px),
                        linear-gradient(white 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    backgroundPosition: 'center',
                }}
            />

            {/* Removed animated colored blobs for cleaner dark theme */}

            {/* Content Wrapper */}
            <div className="relative z-10">
                <Navbar />

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8">
                    {/* Breadcrumb Navigation - Clean Style */}
                    <div className="mb-8">
                        <div className="flex items-center flex-wrap gap-2 text-sm">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
                            >
                                <FaHome className="text-sm" />
                                <span>Home</span>
                            </button>
                            <FaChevronRight className="text-zinc-700 text-xs" />
                            <button
                                onClick={() => navigate('/#companies')}
                                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
                            >
                                Companies
                            </button>
                            <FaChevronRight className="text-zinc-700 text-xs" />
                            <button
                                onClick={() => navigate(`/company-questions?id=${encryptId(question?.company_id)}`)}
                                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
                            >
                                {question?.company_name || 'Company'}
                            </button>
                            <FaChevronRight className="text-zinc-700 text-xs" />
                            <div className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-bold tracking-wide">
                                Question Details
                            </div>
                        </div>
                    </div>

                    {/* Conditional layout - single column initially, two columns when solution is shown */}
                    <div className={isLayoutSplit ? "leetcode-grid" : "max-w-[1000px] mx-auto"}>

                        {/* Problem Statement Column */}
                        <div className={`${isLayoutSplit ? "leetcode-left" : ""} space-y-6`}>

                            {/* Company Header - Clean Card */}
                            <div className="mb-8">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-sm">
                                            <FaBuilding className="text-3xl text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                                {question?.company_name}
                                            </h2>
                                            <div className="flex items-center mt-2 space-x-3">
                                                <span className="px-3 py-1 bg-zinc-900 rounded-full text-xs font-medium text-gray-400 border border-zinc-800 uppercase tracking-wider">
                                                    Online Assessment
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Container - Antigravity Style Buttons */}
                                    {isAuthenticated() && (
                                        <div className="flex flex-wrap gap-3">
                                            {/* Solution Button */}
                                            <button
                                                className={`px-6 py-3 font-medium rounded-full flex items-center space-x-2 transition-all duration-200 transform active:scale-95 ${showingSolution
                                                    ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'
                                                    : !questionAccess.can_access_all
                                                        ? 'bg-white text-black hover:bg-gray-200 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                                        : requestingSolution
                                                            ? 'bg-zinc-800 text-gray-400 border border-zinc-700'
                                                            : 'bg-white text-black hover:bg-gray-200 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]'
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
                                                    <FaSpinner className="animate-spin" />
                                                ) : showingSolution ? (
                                                    <FaTimes />
                                                ) : !questionAccess.can_access_all ? (
                                                    <FaCheckCircle />
                                                ) : (
                                                    <FaCode />
                                                )}
                                                <span className="font-bold tracking-tight">
                                                    {requestingSolution
                                                        ? 'Loading...'
                                                        : showingSolution
                                                            ? 'Hide Solution'
                                                            : !questionAccess.can_access_all
                                                                ? 'Get Premium Access'
                                                                : 'Show Solution'
                                                    }
                                                </span>
                                            </button>


                                            {/* Write Code Button */}
                                            {question?.question_type?.toLowerCase() !== 'mcq' && (
                                                <button
                                                    className="px-4 py-3 font-medium rounded-full flex items-center justify-center transition-all duration-200 border bg-transparent text-gray-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                                                    onClick={handleWriteCodeClick}
                                                    title="Open code editor with question"
                                                >
                                                    <FaFileCode />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Problem Statement - Clean Card Design */}
                            <div className="mb-8 problem-statement-container">
                                {/* Antigravity Style Card */}
                                <div className="bg-[#0c0c0c] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm relative">

                                    {/* Header with random tags and report button */}
                                    <div className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between bg-zinc-900/30">
                                        <div className="flex items-center space-x-4">
                                            {(() => {
                                                const tagOptions = [
                                                    {
                                                        text: "If you know the enemy and know yourself, you need not fear the result of a hundred battles. - Sun Tzu",
                                                        color: "text-zinc-400 bg-zinc-900 border-zinc-800"
                                                    },
                                                    // ... keep other options simple or reuse existing
                                                ];
                                                // Using a simplified version for this theme or reusing existing logic but with new classes
                                                const quotes = [
                                                    "If you know the enemy and know yourself, you need not fear the result of a hundred battles.",
                                                    "The supreme art of war is to subdue the enemy without fighting.",
                                                    "Appear weak when you are strong, and strong when you are weak.",
                                                    "All warfare is based on deception.",
                                                    "In the midst of chaos, there is also opportunity."
                                                ];
                                                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

                                                return (
                                                    <div className="hidden md:block">
                                                        {!showingSolution && (
                                                            <div className="text-xs font-mono text-zinc-500 flex items-center space-x-2">
                                                                <span className="w-2 h-2 bg-zinc-700 rounded-full"></span>
                                                                <span>{randomQuote} - Sun Tzu</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <button
                                            onClick={() => openReportModal('question')}
                                            className="flex items-center space-x-2 px-4 py-2 text-zinc-500 hover:text-red-400 rounded-lg transition-all duration-200 text-sm font-medium hover:bg-zinc-900"
                                            title="Report issue with this question"
                                        >
                                            <FaFlag className="text-xs" />
                                            <span>Report Issue</span>
                                        </button>
                                    </div>

                                    {/* Problem content */}
                                    <div className="p-6 md:p-10">
                                        <div className="prose prose-invert max-w-none">
                                            <div className="html-content leetcode-style question-content"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(styleHtmlContent(question?.problem_statement || '')) }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer with hints/notes - Minimal */}
                                    <div className="border-t border-zinc-800 px-8 py-6 bg-zinc-900/30">
                                        <div className="flex items-center text-zinc-500 text-sm">
                                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full mr-3"></div>
                                            <span>Hint: Break down the problem into smaller subproblems to solve efficiently.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Images */}
                            {questionImages.length > 0 && (
                                <div className="mb-8 question-images">
                                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Attached Images</h3>

                                    {/* Disclaimer Notice - Clean */}
                                    <div className="mb-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                                        <div className="flex items-start space-x-4">
                                            <FaExclamationCircle className="text-zinc-500 text-lg mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-zinc-400 leading-relaxed">
                                                <p className="font-semibold text-white mb-1">Content Disclaimer</p>
                                                <p>
                                                    We do not own any of these images. Content is user-uploaded. Contact
                                                    <a href="mailto:support@oahelper.in" className="text-white hover:underline ml-1">
                                                        support@oahelper.in
                                                    </a> for issues.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {questionImages.map((image, index) => (
                                            <div key={image.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c0c]">
                                                <img
                                                    src={`${API_ENDPOINTS.BASE_URL}/${image.image_path}`}
                                                    alt={`Question image ${index + 1}`}
                                                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105 cursor-pointer opacity-90 group-hover:opacity-100"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                    draggable="false"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        window.location.href = `${API_ENDPOINTS.BASE_URL}/${image.image_path}`;
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `${API_ENDPOINTS.BASE_URL}/${image.image_path}`;
                                                        }}
                                                        className="px-5 py-2.5 bg-white text-black rounded-full font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center space-x-2"
                                                    >
                                                        <FaExternalLinkAlt className="text-xs" />
                                                        <span>View Full Size</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Solution (only shown when layout is split) */}
                        {isLayoutSplit && (
                            <div className="leetcode-right space-y-6">
                                {/* Solution Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Solution</h3>
                                </div>

                                {/* Solution Display - Antigravity Style */}
                                {showingSolution && fetchedSolution && (
                                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
                                        <div className="bg-zinc-900/50 border-b border-zinc-800 px-8 py-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                                                        <FaCode className="text-white text-xl" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-bold text-white">
                                                            {question?.question_type?.toLowerCase() === 'mcq' ? 'MCQ Solution' : 'C++ Solution'}
                                                        </h4>
                                                        <p className="text-zinc-500 text-sm mt-1">Official solution provided by OAHelper</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            {question?.question_type?.toLowerCase() === 'mcq' ? (
                                                // MCQ Solution Display
                                                <div className="space-y-6">
                                                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                                                        <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                                                            <span className="text-white font-semibold text-sm uppercase tracking-wider">MCQ Breakdown</span>
                                                            <button
                                                                onClick={() => openReportModal('solution')}
                                                                className="flex items-center space-x-2 px-3 py-1.5 bg-transparent text-zinc-500 hover:text-red-400 transition-colors text-sm font-medium"
                                                            >
                                                                <FaFlag className="text-xs" />
                                                                <span>Report</span>
                                                            </button>
                                                        </div>
                                                        <div className="p-8 solution-content">
                                                            <div className="prose prose-lg prose-invert max-w-none">
                                                                <div
                                                                    className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans"
                                                                    style={{ fontSize: '16px', lineHeight: '1.8' }}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: fetchedSolution
                                                                            .replace(/###\s+\*\*(.*?)\*\*/g, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>')
                                                                            .replace(/###\s+(.*?)$/gm, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>')
                                                                            .replace(/##\s+\*\*(.*?)\*\*/g, '<h2 class="text-2xl font-bold text-white mt-10 mb-6">$1</h2>')
                                                                            .replace(/##\s+(.*?)$/gm, '<h2 class="text-2xl font-bold text-white mt-10 mb-6">$1</h2>')
                                                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                                                            .replace(/Question\s+(\d+):/g, '<div class="mt-8 mb-3"><span class="inline-block bg-zinc-800 text-white px-3 py-1 rounded-md font-medium text-sm border border-zinc-700">Question $1</span></div>')
                                                                            .replace(/Answer:\s*\(([A-Z])\)/g, '<div class="mt-4 mb-3"><span class="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-lg font-semibold border border-white/10">✅ Answer: ($1)</span></div>')
                                                                            .replace(/Answer:\s*([A-Z])/g, '<div class="mt-4 mb-3"><span class="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-lg font-semibold border border-white/10">✅ Answer: $1</span></div>')
                                                                            .replace(/Explanation:/g, '<div class="mt-4 mb-2"><span class="text-zinc-400 font-medium uppercase text-xs tracking-wider">Explanation</span></div>')
                                                                            .replace(/---/g, '<hr class="my-8 border-zinc-800">')
                                                                            .replace(/\n\n/g, '<br/><br/>')
                                                                            .replace(/\n/g, '<br/>')
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Coding Solution Display
                                                <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                                                    <div className="bg-zinc-900 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
                                                        <span className="text-gray-400 font-mono text-sm">solution.cpp</span>
                                                        <button
                                                            onClick={() => openReportModal('solution')}
                                                            className="text-zinc-600 hover:text-white transition-colors text-sm"
                                                        >
                                                            Report Issue
                                                        </button>
                                                    </div>
                                                    <pre className="p-6 text-sm text-gray-300 overflow-x-auto solution-content font-mono leading-relaxed">
                                                        <code className="language-cpp">
                                                            {fetchedSolution}
                                                        </code>
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Placeholder when no solution is shown */}
                                {!showingSolution && (
                                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-[2rem] p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
                                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-800">
                                            <FaCode className="text-4xl text-zinc-700" />
                                        </div>
                                        <h3 className="text-white text-2xl font-bold mb-4">
                                            {questionAccess.can_access_all ? 'Solution Hidden' : 'Premium Content'}
                                        </h3>
                                        <p className="text-zinc-500 text-lg max-w-md mx-auto mb-8">
                                            {questionAccess.can_access_all
                                                ? 'Click the "Show Solution" button above to reveal the answer.'
                                                : 'Upgrade to premium to access verified solutions for this company.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Modal */}
            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />

            {/* Report Issue Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    {/* Modal container - Antigravity Style */}
                    <div className="relative bg-[#111] border border-zinc-800 rounded-[2rem] p-8 m-4 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                                        <FaExclamationTriangle className="text-white text-lg" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">
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

                            {/* Description section */}
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

                            {/* Textarea */}
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
                                    {/* Character count indicator */}
                                    <div className="absolute bottom-3 right-3 text-xs text-zinc-600">
                                        {reportDescription.length}/500
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
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
            )}



            {/* Beta Warning Modal */}
            {showBetaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    {/* Modal container - Antigravity Style */}
                    <div className="relative bg-[#111] border border-zinc-800 rounded-[2rem] p-10 m-4 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                                    <span className="text-4xl">🚧</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight mb-3">
                                    Code Editor - Beta Mode
                                </h3>
                                <p className="text-zinc-500 text-lg">
                                    Important Notice Before Proceeding
                                </p>
                            </div>

                            {/* Warning message */}
                            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 mb-10">
                                <div className="space-y-4 text-gray-300 leading-relaxed text-base">
                                    <p>
                                        <strong className="text-white">Beta Feature:</strong> The code editor is currently in beta testing phase.
                                    </p>

                                    <ul className="space-y-3 list-disc list-inside text-zinc-400">
                                        <li>You may experience bugs, crashes, or unexpected behavior.</li>
                                        <li>Your code might not be saved properly in some cases.</li>
                                        <li>Not all features are fully implemented yet.</li>
                                    </ul>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-6 text-center">
                                        <p className="text-zinc-300 text-sm">
                                            <strong>We are working to improve this.</strong>
                                            <br />
                                            <span className="text-zinc-500">Your feedback is valuable.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timer indicator */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center space-x-2 text-zinc-500 text-sm">
                                    <div className={`w-1.5 h-1.5 rounded-full ${canProceed ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                                    <span>{canProceed ? 'Ready to proceed' : `Please wait ${remainingTime}s...`}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setShowBetaModal(false)}
                                    className="flex-1 bg-transparent text-gray-400 rounded-xl border border-zinc-800 hover:text-white hover:border-zinc-600 py-4 px-6 transition-all duration-200 text-base font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceedWithBeta}
                                    disabled={!canProceed}
                                    className={`flex-1 py-4 px-6 transition-all duration-200 text-base font-bold rounded-xl flex items-center justify-center ${canProceed
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    {canProceed ? 'I Understand, Proceed' : `Wait ${remainingTime}s`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionDetails;





