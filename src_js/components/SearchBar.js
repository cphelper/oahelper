import React, { useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaArrowRight, FaSpinner, FaPlus, FaBuilding, FaPaperPlane, FaCheck } from 'react-icons/fa';
import { encryptId } from '../utils/encryption';
import debounce from 'lodash/debounce';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { AuthContext } from '../contexts/AuthContext';

const SearchBar = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // Company request states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestCompanyName, setRequestCompanyName] = useState('');
    const [isRequestLoading, setIsRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (query.length < 1) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(API_ENDPOINTS.SEARCH + `?query=${encodeURIComponent(query)}`, {
                    headers: getApiHeaders()
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setSearchResults(data.data);
                    setShowResults(true);
                }
            } catch (error) {
                // console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        []
    );

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handleRequestCompany = () => {
        setRequestCompanyName(searchQuery);
        setShowRequestModal(true);
        setShowResults(false);
    };

    const submitCompanyRequest = async () => {
        if (!requestCompanyName.trim()) {
            setRequestMessage('Please enter a company name');
            return;
        }

        setIsRequestLoading(true);
        setRequestMessage('');

        try {
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

    return (
        <div className="w-full max-w-xl mx-auto mb-8 relative">
            {/* Search Input and Request Company Button Container */}
            <div className="flex items-center space-x-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search companies..."
                        className="w-full px-5 py-3 bg-white/5 border border-white/10 text-white rounded-full 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                   transition-all pl-12 pr-4"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    {isSearching && (
                        <FaSpinner className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" />
                    )}
                </div>

                {/* Request Company Button - Always Visible */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setRequestCompanyName('');
                        setShowRequestModal(true);
                        setShowResults(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 
                               text-white rounded-full hover:from-orange-600 hover:to-pink-600 
                               transition-all font-medium whitespace-nowrap border border-orange-500/20
                               shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <FaPlus className="text-sm" />
                    <span className="hidden sm:inline">Request Company</span>
                    <span className="sm:hidden">Request</span>
                </motion.button>
            </div>

            {showResults && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 bg-white/10 backdrop-blur-lg rounded-xl 
                               border border-white/10 shadow-lg mt-2 overflow-hidden z-20"
                >
                    <div className="max-h-96 overflow-y-auto">
                        {searchResults.length > 0 ? (
                            searchResults.map((company) => (
                                <motion.div
                                    key={company.id}
                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    onClick={() => navigate(`/company-questions?id=${encryptId(company.id)}`)}
                                    className="group px-6 py-4 cursor-pointer transition-colors duration-200
                                             border-b border-white/5 last:border-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium">{company.name}</h3>
                                            <p className="text-gray-400 text-sm">
                                                {company.question_count} questions available
                                            </p>
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            className="text-indigo-400"
                                        >
                                            <FaArrowRight />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            searchQuery.length > 0 && !isSearching && (
                                <motion.div
                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    onClick={handleRequestCompany}
                                    className="group px-6 py-4 cursor-pointer transition-colors duration-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full">
                                                <FaPlus className="text-white text-sm" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">Request Company</h3>
                                                <p className="text-gray-400 text-sm">
                                                    Can't find "{searchQuery}"? Request it and we'll add it!
                                                </p>
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            whileHover={{ opacity: 1, x: 0 }}
                                            className="text-orange-400"
                                        >
                                            <FaArrowRight />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )
                        )}
                    </div>
                </motion.div>
            )}

            {/* Company Request Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeRequestModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                                    <FaBuilding className="text-white text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Request Company</h2>
                                <p className="text-gray-400">
                                    Help us grow! Request a company and we'll add their questions.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        value={requestCompanyName}
                                        onChange={(e) => setRequestCompanyName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl 
                                                 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                                                 transition-all placeholder-gray-400"
                                        placeholder="e.g., Google, Microsoft, Apple..."
                                        disabled={isRequestLoading}
                                    />
                                </div>

                                {requestMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl text-sm ${
                                            requestSuccess 
                                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {requestSuccess && <FaCheck className="text-green-400" />}
                                            <span>{requestMessage}</span>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex space-x-3 pt-2">
                                    <button
                                        onClick={closeRequestModal}
                                        className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 
                                                 transition-colors font-medium"
                                        disabled={isRequestLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitCompanyRequest}
                                        disabled={isRequestLoading || !requestCompanyName.trim()}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 
                                                 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 
                                                 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed
                                                 flex items-center justify-center space-x-2"
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
                                </div>

                                <div className="text-center pt-2">
                                    <p className="text-gray-500 text-xs">
                                        We'll review your request and add the company within 24-48 hours
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar; 