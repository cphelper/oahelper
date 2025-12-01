import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import PremiumModal from './PremiumModal';
import LanguageSelectionModal from './LanguageSelectionModal';
import SEO from './SEO';
import { FaCode, FaQuestionCircle, FaCalendarDay, FaLock, FaSignInAlt, FaPaperPlane, FaCheckCircle, FaSpinner, FaCrown, FaRocket, FaStar, FaHome, FaChevronRight } from 'react-icons/fa';
import { decryptId, encryptId } from '../utils/encryption';
import DotPattern from './DotPattern';
import useScrollToTop from '../hooks/useScrollToTop';
import Loader from './Loader';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';



function CompanyQuestions() {
    useScrollToTop();
    const { isAuthenticated, user } = useAuth();
    const { checkQuestionAccess } = usePremium();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const encryptedId = queryParams.get('id');
    const companyId = decryptId(encryptedId);
    const [questions, setQuestions] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedQuestions, setSavedQuestions] = useState(
        JSON.parse(localStorage.getItem('savedQuestions') || '[]')
    );
    const [questionAccess, setQuestionAccess] = useState({
        can_access: false,
        is_premium: false,
        questions_accessed: 0,
        can_access_all: false
    });

    // Solution request state
    const [solutionRequests, setSolutionRequests] = useState({});
    const [requestingSolution, setRequestingSolution] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [selectedQuestionForLanguage, setSelectedQuestionForLanguage] = useState(null);
    const [visibleTooltip, setVisibleTooltip] = useState(null);



    // Function to toggle tooltip visibility
    const toggleTooltip = (questionId) => {
        if (visibleTooltip === questionId) {
            setVisibleTooltip(null);
        } else {
            setVisibleTooltip(questionId);
        }
    };

    useEffect(() => {
        const fetchCompanyQuestions = async () => {
            if (!companyId) {
                setError('Invalid company ID.');
                setLoading(false);
                return;
            }

            try {
                // Check premium access for this company
                if (isAuthenticated() && user?.id) {
                    const access = await checkQuestionAccess(companyId);
                    setQuestionAccess(access);
                }

                const companyResponse = await fetch(API_ENDPOINTS.COMPANY_BY_ID(companyId), {
                    headers: getApiHeaders()
                });
                const companyData = await companyResponse.json();

                if (companyData.status === 'success' && companyData.data) {
                    setCompany(companyData.data);
                } else {
                    throw new Error('Failed to fetch company details.');
                }

                const response = await fetch(API_ENDPOINTS.QUESTIONS_BY_COMPANY(companyId), {
                    headers: getApiHeaders()
                });
                const data = await response.json();

                if (data.status === 'success' && Array.isArray(data.data)) {
                    const sortedQuestions = data.data.sort((a, b) => a.id - b.id);
                    setQuestions(sortedQuestions);
                } else {
                    throw new Error('Failed to fetch questions for the company.');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyQuestions();
    }, [companyId, isAuthenticated, user, checkQuestionAccess]);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (visibleTooltip && !event.target.closest('.tooltip-container')) {
                setVisibleTooltip(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visibleTooltip]);

    // Function to handle saving questions
    const handleSaveQuestion = (question) => {
        let updatedSavedQuestions;
        if (isQuestionSaved(question.id)) {
            updatedSavedQuestions = savedQuestions.filter(q => q.id !== question.id);
        } else {
            updatedSavedQuestions = [...savedQuestions, question];
        }
        setSavedQuestions(updatedSavedQuestions);
        localStorage.setItem('savedQuestions', JSON.stringify(updatedSavedQuestions));
    };

    // Function to check if a question is saved
    const isQuestionSaved = (questionId) => {
        return savedQuestions.some(q => q.id === questionId);
    };

    // Function to check solution request status for multiple questions at once
    const checkSolutionRequestStatus = async (questionIds) => {
        if (!isAuthenticated() || !user?.id || !questionIds.length) return;

        try {
            // Batch check all questions in a single request
            const response = await fetch(`${API_ENDPOINTS.SOLUTION_REQUESTS}?action=check_request_status&user_id=${user.id}&question_ids=${questionIds.join(',')}`, {
                headers: getApiHeaders()
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Update all statuses at once
                setSolutionRequests(prev => ({
                    ...prev,
                    ...data.data
                }));
            }
        } catch (error) {
            console.error('Error checking solution request status:', error);
        }
    };

    // Function to show language selection modal
    const requestSolution = (question) => {
        if (!isAuthenticated() || !user?.id) return;
        setSelectedQuestionForLanguage(question);
        setShowLanguageModal(true);
    };

    // Function to submit solution request with selected language
    const submitSolutionRequest = async (language) => {
        if (!isAuthenticated() || !user?.id || !selectedQuestionForLanguage) return;

        setRequestingSolution(selectedQuestionForLanguage.id);
        setShowLanguageModal(false);

        try {
            const response = await fetch(`${API_ENDPOINTS.SOLUTION_REQUESTS}?action=request_solution`, {
                method: 'POST',
                headers: getApiHeaders(),
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    question_id: selectedQuestionForLanguage.id,
                    company_id: companyId,
                    requested_language: language
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Update request status
                setSolutionRequests(prev => ({
                    ...prev,
                    [selectedQuestionForLanguage.id]: { ...prev[selectedQuestionForLanguage.id], already_requested: true }
                }));
                // Refresh navbar request count
                if (window.refreshRequestCount) {
                    window.refreshRequestCount();
                }
                alert(`Solution request submitted successfully! Admin will send the ${language.toUpperCase()} code to your email.`);
            } else {
                alert(data.message || 'Failed to submit solution request');
            }
        } catch (error) {
            console.error('Error requesting solution:', error);
            alert('An error occurred while submitting the request');
        } finally {
            setRequestingSolution(null);
            setSelectedQuestionForLanguage(null);
        }
    };

    // Check solution request status for all questions when component mounts
    useEffect(() => {
        if (isAuthenticated() && user?.id && questions.length > 0) {
            questions.forEach(question => {
                checkSolutionRequestStatus(question.id);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id, questions.length]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white relative overflow-hidden">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <p className="text-red-500 text-lg font-bold">Error: {error}</p>
                </div>
            </div>
        );
    }

    // Create structured data for company questions page
    const companyStructuredData = company ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${company.name} OA Questions & Online Assessment`,
        "description": `Complete collection of ${company.name} coding OA questions and online assessment problems. Practice ${questions.length} real OA questions with detailed solutions.`,
        "url": window.location.href,
        "isPartOf": {
            "@type": "WebSite",
            "name": "OAHelper",
            "url": "https://oahelper.in"
        },
        "about": {
            "@type": "Organization",
            "name": company.name,
            "sameAs": [
                `https://www.google.com/search?q=${company.name}+careers`,
                `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`
            ]
        },
        "mainEntity": {
            "@type": "ItemList",
            "name": `${company.name} OA Questions`,
            "description": `Collection of ${questions.length} coding OA questions from ${company.name}`,
            "numberOfItems": questions.length,
            "itemListElement": questions.slice(0, 5).map((question, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "Question",
                    "name": question.title || `${company.name} Question ${index + 1}`,
                    "text": question.description?.slice(0, 200) + "..." || `Practice coding question from ${company.name} online assessment`,
                    "dateCreated": question.created_at,
                    "author": {
                        "@type": "Organization",
                        "name": "OAHelper"
                    }
                }
            }))
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://oahelper.in"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Companies",
                    "item": "https://oahelper.in/#companies"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": `${company.name} Questions`,
                    "item": window.location.href
                }
            ]
        }
    } : null;

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Company-specific SEO */}
            <SEO
                title={`${company?.name || 'Company'} OA Questions & Online Assessment | OAHelper`}
                description={`Practice ${company?.name || 'company'} coding OA questions and online assessment problems. ${questions.length} real OA questions with detailed solutions. Ace your ${company?.name || 'company'} OA preparation.`}
                keywords={`${company?.name || 'company'} OA questions, ${company?.name || 'company'} online assessment, ${company?.name || 'company'} coding OA, ${company?.name || 'company'} OA, ${company?.name || 'company'} programming questions, OA preparation, coding challenges`}
                companyName={company?.name}
                questionCount={questions.length}
                structuredData={companyStructuredData}
                type="article"
            />

            {/* Grid Background Pattern - Same as TrustInOAHelper */}
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
            
            {/* Animated gradient background elements - REMOVED for Antigravity dark theme */}
            
            <Navbar />

            <div className="relative z-10 max-w-6xl mx-auto px-3 py-8 sm:py-16">
                {/* Breadcrumb Navigation - Clean Minimalist */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center space-x-1.5 text-xs bg-white/5 rounded-full px-3 py-1.5 border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Home
                        </button>
                        <span className="text-gray-600">/</span>
                        <button
                            onClick={() => navigate('/#companies')}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Companies
                        </button>
                        <span className="text-gray-600">/</span>
                        <span className="text-white font-medium">
                            {company?.name || 'Loading...'}
                        </span>
                    </div>
                </div>

                {/* Header Section - Antigravity Style */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-4">
                        Master {company?.name || 'Company'} <br />
                        <span className="text-gray-500">OA Questions</span>
                    </h1>
                    <p className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed font-light">
                        Practice {questions.length} real OA questions with detailed solutions. 
                        updated daily to help you ace your next {company?.name} OA Preparation.
                    </p>
                    
                    {/* Stats Pill */}
                    <div className="flex flex-wrap justify-center gap-2 mt-5">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Solutions Included
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Updated Daily
                        </div>
                    </div>
                </div>

                {/* Enhanced Notice Sections - Clean Cards */}
                <div className="mb-10 space-y-4 max-w-3xl mx-auto">
                    {/* Login requirement notice */}
                    {!isAuthenticated() && questions.length > 1 && (
                        <Card className="bg-[#111] border-white/10 rounded-2xl p-5 md:p-6 text-center overflow-hidden">
                            <CardContent className="p-0">
                                <CardTitle className="text-lg font-normal text-white mb-2">Unlock Full Access</CardTitle>
                                <p className="text-gray-400 mb-5 max-w-md mx-auto font-light text-sm">
                                    You can preview the first question for free. Sign up to access all {questions.length} premium questions from {company?.name} and unlock exclusive features.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <Button
                                        onClick={() => navigate('/signup')}
                                        className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-all duration-300"
                                    >
                                        Get Started Free
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/login')}
                                        className="px-5 py-2.5 bg-transparent text-white border-white/20 rounded-full text-sm font-medium hover:bg-white/5 transition-all duration-300"
                                    >
                                        Login to Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Premium upgrade notice */}
                    {isAuthenticated() && !questionAccess.can_access_all && questionAccess.questions_accessed >= 1 && (
                        <Card className="bg-[#111] border-white/10 rounded-2xl p-5 md:p-6 text-center">
                            <CardContent className="p-0">
                                <CardTitle className="text-lg font-normal text-white mb-2">Upgrade to Premium</CardTitle>
                                <p className="text-gray-400 mb-5 max-w-md mx-auto font-light text-sm">
                                    You've used your free question for {company?.name}. Upgrade to premium and get unlimited access.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <Button
                                        onClick={() => navigate('/premium')}
                                        className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-all duration-300 gap-2"
                                    >
                                        <FaCrown className="text-xs" />
                                        <span>View Premium Plans</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/')}
                                        className="px-5 py-2.5 bg-transparent text-white border-white/20 rounded-full text-sm font-medium hover:bg-white/5 transition-all duration-300"
                                    >
                                        Explore Others
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Questions Grid - tweakcn Style Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                    {questions.map((question, index) => {
                        const isSaved = isQuestionSaved(question.id);
                        const isLocked = (!isAuthenticated() && index > 0) ||
                                         (isAuthenticated() && !questionAccess.can_access_all && index > 0);

                        return (
                            <Card
                                key={question.id}
                                className={`group relative flex flex-col p-6 rounded-2xl transition-all duration-300 min-h-[260px] ${
                                    isLocked 
                                        ? 'bg-[#0A0A0A] border-white/5 opacity-75' 
                                        : 'bg-[#111] border-white/10 hover:border-white/20 hover:-translate-y-1'
                                }`}
                            >
                                <CardHeader className="p-0 mb-4">
                                    <div className="flex justify-between items-start">
                                        <Badge className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                            isLocked 
                                                ? 'bg-white/5 text-gray-500 border-white/5'
                                                : 'bg-white/10 text-white border-white/10'
                                        }`}>
                                            {isLocked ? <FaLock className="mr-1.5 text-[8px]" /> : null}
                                            Question #{index + 1}
                                        </Badge>
                                        
                                        {/* Difficulty Dot */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0 flex-1">
                                    <CardTitle className={`text-base font-normal mb-2 line-clamp-2 leading-snug ${
                                        isLocked ? 'text-gray-500' : 'text-white'
                                    }`}>
                                        {question.title}
                                    </CardTitle>
                                    
                                    <p className="text-xs text-gray-500 font-light">
                                        {company?.name} OA • Medium
                                    </p>
                                </CardContent>

                                <CardFooter className="p-0 mt-auto flex-col space-y-3">
                                    <Button
                                        className={`w-full py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                                            isLocked
                                                ? 'bg-white/5 text-gray-500 cursor-not-allowed hover:bg-white/5'
                                                : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                        onClick={() => !isLocked && navigate(`/question-with-editor/${encryptId(question.id)}?company_id=${encryptId(companyId)}`)}
                                        disabled={isLocked}
                                    >
                                        {isLocked ? 'Locked' : 'Solve Question'}
                                    </Button>

                                    {!isLocked && (
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                className={`py-2 px-3 rounded-full text-[10px] font-bold transition-all ${
                                                    isSaved
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-transparent'
                                                }`}
                                                onClick={() => handleSaveQuestion(question)}
                                            >
                                                {isSaved ? 'Solved ✓' : 'Mark Solved'}
                                            </Button>
                                            
                                            {isAuthenticated() && (
                                                <div className="relative tooltip-container">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => toggleTooltip(question.id)}
                                                        className="w-full py-2 px-3 rounded-full text-[10px] font-bold bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-transparent"
                                                    >
                                                        Solution?
                                                    </Button>
                                                    {visibleTooltip === question.id && (
                                                        <Card className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-[#222] text-white text-center text-[10px] rounded-lg border-white/10 shadow-xl z-30">
                                                            <p>Solutions available for premium users inside.</p>
                                                        </Card>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State */}
                {questions.length === 0 && !loading && (
                    <Card className="text-center py-12 bg-transparent border-white/10">
                        <CardContent>
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
                                <FaQuestionCircle className="text-2xl text-gray-600" />
                            </div>
                            <CardTitle className="text-gray-400 text-sm font-semibold mb-2">No questions available</CardTitle>
                            <p className="text-gray-500 text-xs">Check back later or explore other companies!</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Premium Modal */}
            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />

            {/* Language Selection Modal */}
            <LanguageSelectionModal
                isOpen={showLanguageModal}
                onClose={() => {
                    setShowLanguageModal(false);
                    setSelectedQuestionForLanguage(null);
                }}
                onConfirm={submitSolutionRequest}
                questionTitle={selectedQuestionForLanguage?.title}
            />
        </div>
    );
}

export default CompanyQuestions;