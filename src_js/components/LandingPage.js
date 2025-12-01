// src/components/LandingPage.js

import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import { FaBuilding, FaCalendar, FaQuestionCircle, FaLock, FaUnlock, FaArrowRight, FaTimes, FaShare, FaSignInAlt, FaPlus, FaPaperPlane, FaSpinner, FaCheck, FaCrown } from 'react-icons/fa';
import Navbar from './Navbar';
import SEO from './SEO';
import { useNavigate } from 'react-router-dom';
import { encryptId } from '../utils/encryption';
import DotPattern from './DotPattern';
import yourImage from './redpill.png'; // Update the path to your image
import useScrollToTop from '../hooks/useScrollToTop';
import Loader from './Loader';
import CompanyCardSkeleton from './CompanyCardSkeleton';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingPage.css';

// Memoized Company Row Component with Premium Locking
const CompanyRow = memo(({ company, isAuthenticated, user, handleCompanyClick, navigate, isPremium, premiumLoading }) => {
    const formatDate = useCallback((dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }, []);

    // Check if company is locked (2 or fewer questions and user is not premium)
    const isCompanyLocked = premiumLoading ? false : (company.question_count <= 2 && !isPremium);

    return (
        <tr 
            onClick={() => {
                if (isCompanyLocked) {
                    navigate('/premium');
                } else {
                    handleCompanyClick(company);
                }
            }}
            className={`group border-b border-white/5 last:border-0 transition-colors duration-200 cursor-pointer
                ${isCompanyLocked 
                    ? 'bg-amber-900/5 hover:bg-amber-900/10' 
                    : 'hover:bg-white/5'
                }`}
        >
            {/* Company Name & Icon */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-inner ${isCompanyLocked
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-white/5 text-white group-hover:bg-white/10'
                        }`}>
                        <FaBuilding className="text-sm" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1" title={company.name}>
                            {company.name}
                        </h3>
                    </div>
                </div>
            </td>

            {/* Date */}
            <td className="py-4 px-6 hidden md:table-cell">
                <div className="flex items-center text-sm font-medium text-gray-500">
                    <FaCalendar className="mr-2 opacity-50" />
                    {formatDate(company.date)}
                </div>
            </td>

            {/* Questions Count */}
            <td className="py-4 px-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                     <span className="text-sm font-bold text-white">{company.question_count}</span>
                     <span className="text-[10px] text-gray-500 uppercase tracking-wider">Qs</span>
                </div>
            </td>

            {/* Status */}
            <td className="py-4 px-6 text-center">
                 {isCompanyLocked ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <FaLock className="mr-1.5 text-[10px]" /> Premium
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FaUnlock className="mr-1.5 text-[10px]" /> Available
                    </span>
                )}
            </td>

            {/* Action */}
            <td className="py-4 px-6 text-right">
                <button
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300
                            ${isCompanyLocked
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black'
                            : 'bg-white/5 border-white/10 text-white group-hover:bg-white group-hover:text-black'
                        }`}
                >
                    {isCompanyLocked ? (
                        <FaCrown className="text-xs" />
                    ) : (
                        <FaArrowRight className="text-xs -rotate-45 group-hover:rotate-0 transition-transform" />
                    )}
                </button>
            </td>
        </tr>
    );
});

CompanyRow.displayName = 'CompanyRow';

function LandingPage() {

    useScrollToTop();
    const { isAuthenticated, user } = useAuth();
    const { is_premium, loading: premiumLoading } = usePremium(); // Use PremiumContext instead of duplicate check
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
    const [allCompanies, setAllCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState(() => {
        // Initialize from localStorage
        return localStorage.getItem('oahelper_search_term') || '';
    });
    const [activeSearchTerm, setActiveSearchTerm] = useState(() => {
        // Initialize from localStorage - this is the actual search being performed
        return localStorage.getItem('oahelper_search_term') || '';
    });
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);

    // Company request states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [requestCompanyName, setRequestCompanyName] = useState('');
    const [isRequestLoading, setIsRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    const navigate = useNavigate();

    // REMOVED: Duplicate premium check - now using PremiumContext exclusively for better performance
    // REMOVED: Welcome popup logic

    const handleCloseWelcomePopup = () => {
        setShowWelcomePopup(false);
        // Remember that user has seen the popup
        localStorage.setItem('oahelper_welcome_seen', 'true');
    };

    // Memoized filtered companies (now just returns allCompanies since filtering is done on backend)
    const filteredCompanies = useMemo(() => {
        return allCompanies;
    }, [allCompanies]);

    // Request deduplication map
    const pendingRequests = useRef(new Map());

    const fetchCompanies = useCallback(async (page = 1, limit = 100) => {
        // Cache companies data for 15 minutes (increased from 10)
        const cacheKey = `companies_page_${page}_limit_${limit}`;
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

        if (cached && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < 15 * 60 * 1000) { // 15 minutes
                return JSON.parse(cached);
            }
        }

        // Request deduplication - prevent duplicate requests
        if (pendingRequests.current.has(cacheKey)) {
            return pendingRequests.current.get(cacheKey);
        }

        const requestPromise = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(`${API_ENDPOINTS.COMPANY}?page=${page}&limit=${limit}`, {
                    headers: getApiHeaders(),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    const result = {
                        companies: data.data,
                        hasMore: data.hasMore || false,
                        total: data.total || data.data.length
                    };

                    // Cache the result
                    sessionStorage.setItem(cacheKey, JSON.stringify(result));
                    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

                    return result;
                } else {

                    return {
                        companies: [],
                        hasMore: false,
                        total: 0
                    };
                }
            } catch (error) {
                if (error.name === 'AbortError') {

                }
                return {
                    companies: [],
                    hasMore: false,
                    total: 0
                };
            } finally {
                pendingRequests.current.delete(cacheKey);
            }
        })();

        pendingRequests.current.set(cacheKey, requestPromise);
        return requestPromise;
    }, []);

    const loadInitialCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchCompanies(1, 100);
            setAllCompanies(result.companies);
            setHasMoreCompanies(result.hasMore);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, [fetchCompanies]);

    const loadMoreCompanies = useCallback(async () => {
        if (loadingMore || !hasMoreCompanies) return;

        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const result = await fetchCompanies(nextPage, 100);

            if (result.companies.length > 0) {
                setAllCompanies(prev => [...prev, ...result.companies]);
                setHasMoreCompanies(result.hasMore);
                setCurrentPage(nextPage);
            } else {
                setHasMoreCompanies(false);
            }
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMoreCompanies, currentPage, fetchCompanies]);

    // Debounced search with caching
    const searchTimeoutRef = useRef(null);

    const handleSearch = useCallback(async () => {
        const trimmedSearch = searchTerm.trim();

        if (trimmedSearch) {
            // Cache search results for 10 minutes
            const searchCacheKey = `search_${trimmedSearch.toLowerCase()}`;
            const cachedSearch = sessionStorage.getItem(searchCacheKey);
            const searchCacheTime = sessionStorage.getItem(`${searchCacheKey}_time`);

            if (cachedSearch && searchCacheTime) {
                const age = Date.now() - parseInt(searchCacheTime);
                if (age < 10 * 60 * 1000) { // 10 minutes
                    const cachedData = JSON.parse(cachedSearch);
                    setAllCompanies(cachedData);
                    setHasMoreCompanies(false);
                    setActiveSearchTerm(trimmedSearch);
                    localStorage.setItem('oahelper_search_term', trimmedSearch);
                    return;
                }
            }

            setLoading(true);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                const response = await fetch(`${API_ENDPOINTS.COMPANY}?action=search&q=${encodeURIComponent(trimmedSearch)}`, {
                    headers: getApiHeaders(),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    setAllCompanies(data.data);
                    setHasMoreCompanies(false); // No pagination for search results
                    setActiveSearchTerm(trimmedSearch);
                    // Persist search term to localStorage
                    localStorage.setItem('oahelper_search_term', trimmedSearch);

                    // Cache search results
                    sessionStorage.setItem(searchCacheKey, JSON.stringify(data.data));
                    sessionStorage.setItem(`${searchCacheKey}_time`, Date.now().toString());
                }
            } catch (error) {
                if (error.name !== 'AbortError') {

                }
            } finally {
                setLoading(false);
            }
        } else {
            // If search is empty, reload initial companies
            setActiveSearchTerm('');
            localStorage.removeItem('oahelper_search_term');
            loadInitialCompanies();
        }
    }, [searchTerm, loadInitialCompanies]);

    // Load companies on mount - check for persisted search
    useEffect(() => {
        // Check if there's a persisted search term
        const persistedSearch = localStorage.getItem('oahelper_search_term');
        if (persistedSearch && persistedSearch.trim()) {
            // If there's a persisted search, perform the search
            handleSearch();
        } else {
            // Otherwise load initial companies
            loadInitialCompanies();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Show welcome popup after loading is complete (only for non-logged-in users or first-time visitors)
    const handleShareSite = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'OA Helper - Your Ultimate Online Assessment Companion',
                    text: 'Check out OA Helper for amazing coding interview questions!',
                    url: 'https://oahelper.in'
                });
            } else {
                await navigator.clipboard.writeText('https://oahelper.in');
                alert('Link copied to clipboard!');
            }
            // Close popup after sharing
            handleCloseWelcomePopup();
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };



    const handleCompanyClick = useCallback((company) => {
        const encryptedId = encryptId(company.id);
        navigate(`/company-questions?id=${encryptedId}`);
    }, [navigate]);

    // Company request functions
    const submitCompanyRequest = async () => {
        if (!requestCompanyName.trim()) {
            setRequestMessage('Please enter a company name');
            return;
        }

        setIsRequestLoading(true);
        setRequestMessage('');

        try {
            // Check if user is premium first
            const premiumResponse = await fetch(`${API_ENDPOINTS.PREMIUM}?action=check_premium_status&user_id=${user.id}`, {
                headers: getApiHeaders()
            });
            const premiumData = await premiumResponse.json();

            if (premiumData.status === 'success' && premiumData.data?.is_premium) {
                // User is premium, proceed with request
                const requestData = {
                    company_name: requestCompanyName.trim(),
                    user_email: user?.email || null,
                    user_id: user?.id || null
                };

                const response = await fetch(API_ENDPOINTS.REQUEST_COMPANY, {
                    method: 'POST',
                    headers: getApiHeaders(),
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();

                if (data.status === 'found') {
                    // Company already exists
                    setRequestMessage(`Great! "${data.company.name}" is already available with ${data.company.question_count} questions.`);
                    setTimeout(() => {
                        setShowRequestModal(false);
                        navigate(`/company-questions?id=${encryptId(data.company.id)}`);
                    }, 2000);
                } else if (data.status === 'already_requested') {
                    setRequestMessage('This company has already been requested! We\'ll add it soon.');
                    setRequestSuccess(true);
                } else if (data.status === 'success') {
                    setRequestMessage('Company request submitted successfully! We\'ll review and add it soon.');
                    setRequestSuccess(true);
                } else {
                    setRequestMessage(data.message || 'Failed to submit request');
                }
            } else {
                // User is not premium - don't allow the request at all
                setRequestMessage('Company requests are only available to premium subscribers. Please upgrade to premium to request companies.');
                setRequestSuccess(false);
                // Close the modal after showing the error
                setTimeout(() => {
                    setShowRequestModal(false);
                    setRequestCompanyName('');
                    setRequestMessage('');
                    setRequestSuccess(false);
                }, 3000);
            }
        } catch (error) {
            setRequestMessage('Network error. Please try again.');
        } finally {
            setIsRequestLoading(false);
        }
    };

    const closeRequestModal = () => {
        setShowRequestModal(false);
        setRequestCompanyName('');
        setRequestMessage('');
        setRequestSuccess(false);
        setIsRequestLoading(false);
    };

    // Show skeleton on initial load only, not on search
    const showSkeleton = loading && allCompanies.length === 0;



    // Create structured data for companies and search functionality
    const companyNames = allCompanies.map(company => company.name).join(', ');
    const totalQuestions = allCompanies.reduce((sum, company) => sum + company.question_count, 0);

    const homePageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "OAHelper",
        "alternateName": "OA Helper",
        "url": "https://oahelper.in",
        "description": `Practice online assessment questions from ${allCompanies.length} top companies including ${companyNames.slice(0, 100)}...`,
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://oahelper.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        },
        "publisher": {
            "@type": "Organization",
            "name": "OAHelper",
            "logo": {
                "@type": "ImageObject",
                "url": "https://oahelper.in/logo512.png",
                "width": 512,
                "height": 512
            }
        },
        "mainEntity": {
            "@type": "ItemList",
            "name": "Company OA Questions",
            "description": "Collection of online assessment and coding OA questions from top companies",
            "numberOfItems": allCompanies.length,
            "itemListElement": allCompanies.slice(0, 10).map((company, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "WebPage",
                    "name": `${company.name} OA Questions`,
                    "description": `${company.question_count} coding OA questions and online assessment problems from ${company.name}`,
                    "url": `https://oahelper.in/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`
                }
            }))
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
            {/* Dynamic SEO for Landing Page */}
            <SEO
                title={`OAHelper - Online Assessment Questions from ${allCompanies.length} Top Companies`}
                description={`Practice coding OA questions from ${allCompanies.length} top companies including ${companyNames.slice(0, 200)}. ${totalQuestions}+ solved problems with detailed explanations. Ace your next online assessment!`}
                keywords={`online assessment, coding OA, ${companyNames.slice(0, 300)}, OA questions, programming challenges, OA questions, tech OA prep`}
                structuredData={homePageStructuredData}
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

            {/* Animated gradient background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10">
                <Navbar />

                {/* Exclusive Content Banner */}
                <div className="relative z-40 animate-fade-in">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
                        
                        .handwriting-text {
                            font-family: 'Caveat', cursive;
                            font-weight: 600;
                            
                                font-size: 3.5rem;
                            line-height: 1.4;
                        }
                        
                        @media (max-width: 768px) {
                            .handwriting-text {
                                font-size: 1.5rem;
                            }
                        }
                    `}</style>
                    <div className="  rounded-2xl mx-5xl">
                        <div className="px-2 py-1">
                            <div className="flex items-center justify-center">
                                <p className="handwriting-text text-white/90 text-center">
                                    Karlo DSA kahin se,
                                    Question ayenge yhi se.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Section with glass design */}
                <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">

                    {/* Main Heading - Clean and Bold like Antigravity */}
                    <div className="mb-12 relative z-10">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-8 leading-tight drop-shadow-sm">
                            Practice OA Questions<br />
                            from Top Companies.
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                            Exclusive collection of real online assessment questions and detailed solutions to help you ace your next OA.
                        </p>
                    </div>

                    <div className="flex justify-center mb-16">
                        <img
                            src={yourImage}
                            alt="Red pill"
                            className="max-w-md w-full h-auto rounded-2xl  hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Search Container with Request Company Button */}
                    <div className="max-w-2xl mx-auto mb-24">
                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute -inset-1 bg-white/5 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>

                            <div className="relative flex items-center bg-[#161616] border border-white/10 rounded-full p-2 transition-all duration-300 hover:border-white/20">
                                <div className="pl-6 pr-4 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none 
                                             text-white placeholder-gray-500 text-lg h-12"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchTerm.trim()) {
                                            handleSearch();
                                        }
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setActiveSearchTerm('');
                                            localStorage.removeItem('oahelper_search_term');
                                            loadInitialCompanies();
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
                                    >
                                        <FaTimes className="text-gray-400 text-sm" />
                                    </button>
                                )}
                                <button
                                    onClick={handleSearch}
                                    className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors text-base"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Request Button below search */}
                        <div className="mt-8 flex justify-center">
                            {isAuthenticated() ? (
                                <button
                                    onClick={() => {
                                        if (is_premium) {
                                            setRequestCompanyName('');
                                            setShowRequestModal(true);
                                        } else {
                                            setShowPremiumModal(true);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium"
                                >
                                    <FaPlus className="text-xs" />
                                    <span>Request a specific company</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium"
                                >
                                    <FaPlus className="text-xs" />
                                    <span>Login to request companies</span>
                                </button>
                            )}
                        </div>
                    </div>


                    {/* Search Tip - Show when no results found */}
                    {activeSearchTerm && !loading && filteredCompanies.length === 0 && (
                        <div className="max-w-4xl mx-auto mb-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-lg">
                                <p className="text-gray-300 text-sm">
                                    💡 <strong>Tip:</strong> Try using a shorter or different name for the company
                                </p>
                                <p className="text-gray-400 text-xs mt-2">
                                    Example: Instead of "Google LLC", try "Google"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Search Results Info */}
                    {activeSearchTerm && !loading && filteredCompanies.length > 0 && (
                        <div className="max-w-6xl mx-auto mb-6">
                            <p className="text-gray-400 text-sm">
                                Found {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} matching "{activeSearchTerm}"
                            </p>
                        </div>
                    )}

                    {/* Search Loading State */}
                    {loading && activeSearchTerm && (
                        <div className="max-w-6xl mx-auto mb-6 flex items-center justify-center space-x-2">
                            <FaSpinner className="animate-spin text-white" />
                            <p className="text-gray-400 text-sm">Searching companies...</p>
                        </div>
                    )}

                    {/* Companies List Table */}
                    <div className="max-w-7xl mx-auto">
                        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Company</th>
                                        <th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date Added</th>
                                        <th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Questions</th>
                                        <th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {showSkeleton ? (
                                        // Show skeleton rows on initial load
                                        Array.from({ length: 8 }).map((_, index) => (
                                            <CompanyCardSkeleton key={`skeleton-${index}`} />
                                        ))
                                    ) : (
                                        // Show actual company rows
                                        (filteredCompanies || []).map((company) => (
                                            <CompanyRow
                                                key={company.id}
                                                company={company}
                                                isAuthenticated={isAuthenticated}
                                                user={user}
                                                handleCompanyClick={handleCompanyClick}
                                                navigate={navigate}
                                                isPremium={is_premium}
                                                premiumLoading={premiumLoading}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Load More Button - Only show when not searching */}
                    {hasMoreCompanies && !activeSearchTerm && (
                        <div className="text-center mt-8">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={loadMoreCompanies}
                                disabled={loadingMore}
                                className="px-8 py-4 bg-white/10 text-white rounded-xl
                                         border border-white/20 hover:bg-white/20 
                                         transition-all duration-300 backdrop-blur-xl font-medium
                                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
                            >
                                {loadingMore ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        <span>Loading more companies...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaPlus />
                                        <span>Load More Companies</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    )}

                    {/* No Results State */}
                    {filteredCompanies.length === 0 && !loading && (
                        <div className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
                            <div className="mb-4">
                                <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-white mb-2">No companies found</p>
                            <p className="text-gray-400 mb-4">
                                {activeSearchTerm
                                    ? `No results for "${activeSearchTerm}".`
                                    : 'Try adjusting your search terms'
                                }
                            </p>
                            {activeSearchTerm && isAuthenticated() && is_premium && (
                                <button
                                    onClick={() => {
                                        setRequestCompanyName(activeSearchTerm);
                                        setShowRequestModal(true);
                                    }}
                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500
                                             text-white rounded-xl hover:from-orange-600 hover:to-pink-600
                                             transition-all font-medium"
                                >
                                    <FaPlus />
                                    <span>Request "{activeSearchTerm}"</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Company Request Modal */}
                <AnimatePresence>
                    {showRequestModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={closeRequestModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Grid Pattern for Modal */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-20"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                                            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '45px 45px',
                                        backgroundPosition: '0 0',
                                        zIndex: 0
                                    }}
                                />

                                <div className="relative z-10">
                                    {!isAuthenticated() ? (
                                        // Login Required Content
                                        <>
                                            <div className="text-center mb-8">
                                                <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
                                                    <FaBuilding className="text-white text-2xl" />
                                                </div>
                                                <h2 className="text-2xl font-normal text-white mb-3">Premium Feature</h2>
                                                <p className="text-gray-400 font-light text-sm leading-relaxed">
                                                    Company requests are available only to premium subscribers. Login and upgrade to request companies.
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => {
                                                        closeRequestModal();
                                                        navigate('/premium');
                                                    }}
                                                    className="w-full py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200
                                                             transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                                >
                                                    <span>Upgrade to Premium</span>
                                                </button>
                                                <button
                                                    onClick={closeRequestModal}
                                                    className="w-full py-4 bg-transparent text-gray-400 border border-white/10 rounded-full hover:text-white hover:border-white/30
                                                             transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // Check premium status for authenticated users
                                        <>
                                            {(() => {
                                                // This will be checked when the component renders
                                                // For now, assume user has premium since they got here
                                                return (
                                                    <>
                                                        <div className="text-center mb-8">
                                                            <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
                                                                <FaBuilding className="text-white text-2xl" />
                                                            </div>
                                                            <h2 className="text-2xl font-normal text-white mb-3">Request Company</h2>
                                                            <p className="text-gray-400 font-light text-sm leading-relaxed">
                                                                Help us grow! Request a company and we'll add their questions.
                                                            </p>
                                                        </div>

                                                        <div className="space-y-5">
                                                            <div>
                                                                <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                                                                    Company Name
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={requestCompanyName}
                                                                    onChange={(e) => setRequestCompanyName(e.target.value)}
                                                                    className="w-full px-4 py-4 bg-[#0A0A0A] border border-white/10 text-white rounded-xl
                                                                             focus:outline-none focus:border-white/30 transition-all placeholder-gray-600"
                                                                    placeholder="e.g., Google, Microsoft, Apple..."
                                                                    disabled={isRequestLoading}
                                                                />
                                                            </div>

                                                            {requestMessage && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className={`p-4 rounded-xl text-sm text-center ${requestSuccess
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-center space-x-2">
                                                                        {requestSuccess && <FaCheck className="text-emerald-400" />}
                                                                        <span>{requestMessage}</span>
                                                                    </div>
                                                                </motion.div>
                                                            )}

                                                            <div className="flex flex-col gap-3 pt-2">
                                                                <button
                                                                    onClick={submitCompanyRequest}
                                                                    disabled={isRequestLoading || !requestCompanyName.trim()}
                                                                    className="w-full py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200
                                                                             transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                                                             flex items-center justify-center gap-2"
                                                                >
                                                                    {isRequestLoading ? (
                                                                        <>
                                                                            <FaSpinner className="animate-spin" />
                                                                            <span>Submitting...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaPaperPlane />
                                                                            <span>Submit Request</span>
                                                                        </>
                                                                    )}
                                                                </button>

                                                                <button
                                                                    onClick={closeRequestModal}
                                                                    className="w-full py-4 bg-transparent text-gray-400 border border-white/10 rounded-full hover:text-white hover:border-white/30
                                                                             transition-colors font-medium"
                                                                    disabled={isRequestLoading}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>

                                                            <div className="text-center">
                                                                <p className="text-gray-600 text-xs font-light">
                                                                    We'll review your request and add the company within 24-48 hours
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Premium Upgrade Modal */}
                <AnimatePresence>
                    {showPremiumModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowPremiumModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Grid Pattern for Modal */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-20"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                                            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '45px 45px',
                                        backgroundPosition: '0 0',
                                        zIndex: 0
                                    }}
                                />

                                <div className="relative z-10">
                                    <div className="text-center mb-8">
                                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
                                            <FaCrown className="text-white text-2xl" />
                                        </div>
                                        <h2 className="text-2xl font-normal text-white mb-3">Premium Feature</h2>
                                        <p className="text-gray-400 font-light text-sm leading-relaxed">
                                            Company requests are available only to premium subscribers. Upgrade to request unlimited companies and get priority support.
                                        </p>
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/10">
                                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Premium Benefits</h3>
                                            <ul className="text-gray-400 text-sm space-y-3 font-light">
                                                <li className="flex items-center gap-2"><FaCheck className="text-white text-xs" /> Request unlimited companies</li>
                                                <li className="flex items-center gap-2"><FaCheck className="text-white text-xs" /> 5 daily solution requests</li>
                                                <li className="flex items-center gap-2"><FaCheck className="text-white text-xs" /> Unlimited question access</li>
                                                <li className="flex items-center gap-2"><FaCheck className="text-white text-xs" /> Priority support</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                setShowPremiumModal(false);
                                                navigate('/premium');
                                            }}
                                            className="w-full py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200
                                                     transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                        >
                                            <FaCrown />
                                            <span>Upgrade Now</span>
                                        </button>
                                        <button
                                            onClick={() => setShowPremiumModal(false)}
                                            className="w-full py-4 bg-transparent text-gray-400 border border-white/10 rounded-full hover:text-white hover:border-white/30
                                                     transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto px-4 py-16 mb-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-3">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-gray-400">Everything you need to know about OAHelper</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                question: "What is OAHelper?",
                                answer: "OAHelper is a comprehensive platform providing coding OA questions from top companies. We offer exclusive questions with detailed solutions to help you ace your online assessments."
                            },
                            {
                                question: "Are the questions really exclusive?",
                                answer: "Yes! Most questions and solutions on OAHelper are exclusively available here and nowhere else. We continuously add fresh questions daily from various companies."
                            },
                            {
                                question: "Do I need to login to access questions?",
                                answer: "You can view one question per company without logging in. To unlock all questions and access premium features, create a free account."
                            },
                            {
                                question: "What are the benefits of Premium?",
                                answer: "Premium members get unlimited question access, 5 daily solution requests, ability to request companies, priority support, and access to our premium community."
                            },
                            {
                                question: "How often are new questions added?",
                                answer: "We add fresh coding questions every day from various companies. Our database is constantly growing with the latest OA questions."
                            },
                            {
                                question: "Can I request a specific company?",
                                answer: "Yes! Premium members can request companies that aren't listed yet. We review all requests and typically add them within 24-48 hours."
                            }
                        ].map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// FAQ Item Component with Accordion
const FAQItem = memo(({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={false}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden
                       hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
            >
                <span className="text-white font-semibold text-lg pr-4">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                >
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pb-5 pt-0">
                            <div className="border-t border-white/10 pt-4">
                                <p className="text-gray-300 leading-relaxed">{answer}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

FAQItem.displayName = 'FAQItem';

export default LandingPage;
