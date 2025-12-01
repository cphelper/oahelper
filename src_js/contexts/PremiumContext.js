import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const PremiumContext = createContext();

export const usePremium = () => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
};

export const PremiumProvider = ({ children }) => {
    const { user, isAuthenticated, checkUserBanned } = useAuth();
    const [premiumStatus, setPremiumStatus] = useState({
        is_premium: false,
        subscription: null,
        loading: true
    });

    // Check premium status when user changes or on mount
    useEffect(() => {
        if (isAuthenticated() && user?.id) {
            // PARALLEL CHECK: Run both banned and premium checks simultaneously
            Promise.all([
                checkUserBanned(user.email),
                checkPremiumStatusWithCache()
            ]).then(([isBanned, premiumData]) => {
                if (isBanned) {
                    console.log('User is banned during premium check, logging out');
                    // User will be logged out by AuthContext
                    return;
                }
                // Set premium status from parallel fetch
                if (premiumData) {
                    setPremiumStatus(premiumData);
                }
            }).catch(error => {
                console.error('Error in parallel premium check:', error);
                setPremiumStatus({
                    is_premium: false,
                    subscription: null,
                    loading: false
                });
            });
        } else {
            setPremiumStatus({
                is_premium: false,
                subscription: null,
                loading: false
            });
        }
    }, [user, isAuthenticated, checkUserBanned]);

    // Enhanced premium check with caching and faster response
    const checkPremiumStatusWithCache = async () => {
        try {
            // Check cache first (5 minute cache)
            const cacheKey = `premium_status_${user.id}`;
            const cached = sessionStorage.getItem(cacheKey);
            const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
            
            if (cached && cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < 5 * 60 * 1000) { // 5 minutes
                    const cachedData = JSON.parse(cached);
                    return {
                        is_premium: cachedData.is_premium,
                        subscription: cachedData.subscription,
                        loading: false
                    };
                }
            }

            // Add timeout and AbortController for faster failover
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
            
            const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=check_premium_status&user_id=${user.id}`, {
                headers: getApiHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            const premiumData = {
                is_premium: data.status === 'success' ? data.data.is_premium : false,
                subscription: data.status === 'success' ? data.data.subscription : null,
                loading: false
            };

            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify(premiumData));
            sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
            
            return premiumData;
            
        } catch (error) {
            console.error('Error checking premium status:', error);
            return {
                is_premium: false,
                subscription: null,
                loading: false
            };
        }
    };

    const checkPremiumStatus = async () => {
        const result = await checkPremiumStatusWithCache();
        setPremiumStatus(result);
    };

    const checkQuestionAccess = async (companyId) => {
        if (!isAuthenticated() || !user?.id) {
            return { can_access: false, is_premium: false, questions_accessed: 0 };
        }

        try {
            const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=check_question_access&user_id=${user.id}&company_id=${companyId}`, {
                headers: getApiHeaders()
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    can_access: data.data.is_premium || data.data.questions_accessed <= 1,
                    is_premium: data.data.is_premium,
                    questions_accessed: data.data.questions_accessed,
                    can_access_all: data.data.can_access_all
                };
            }
        } catch (error) {
            console.error('Error checking question access:', error);
        }
        
        return { can_access: false, is_premium: false, questions_accessed: 0 };
    };

    const updateQuestionAccess = async (companyId) => {
        if (!isAuthenticated() || !user?.id) {
            return false;
        }

        try {
            const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=update_question_access`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    user_id: user.id,
                    company_id: companyId
                })
            });
            
            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Error updating question access:', error);
            return false;
        }
    };

    const refreshPremiumStatus = () => {
        if (isAuthenticated() && user?.id) {
            checkPremiumStatus();
        }
    };

    const value = {
        ...premiumStatus,
        checkQuestionAccess,
        updateQuestionAccess,
        refreshPremiumStatus
    };

    return (
        <PremiumContext.Provider value={value}>
            {children}
        </PremiumContext.Provider>
    );
};