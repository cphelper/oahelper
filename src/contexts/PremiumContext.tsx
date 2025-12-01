'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

interface Subscription {
  id: number;
  start_date: string;
  end_date: string;
  amount: number;
  plan_type: string;
}

interface PremiumContextType {
  is_premium: boolean;
  subscription: Subscription | null;
  loading: boolean;
  checkQuestionAccess: (companyId: number) => Promise<{
    can_access: boolean;
    is_premium: boolean;
    questions_accessed: number;
    can_access_all?: boolean;
  }>;
  updateQuestionAccess: (companyId: number) => Promise<boolean>;
  refreshPremiumStatus: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const { user, isAuthenticated, checkUserBanned } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState({
    is_premium: false,
    subscription: null as Subscription | null,
    loading: true
  });

  const checkPremiumStatusWithCache = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      // Check cache first (5 minute cache)
      const cacheKey = `premium_status_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) {
          const cachedData = JSON.parse(cached);
          return {
            is_premium: cachedData.is_premium,
            subscription: cachedData.subscription,
            loading: false
          };
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
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
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      Promise.all([
        checkUserBanned(user.email),
        checkPremiumStatusWithCache()
      ]).then(([isBanned, premiumData]) => {
        if (isBanned) {
          console.log('User is banned during premium check');
          return;
        }
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
  }, [user, isAuthenticated, checkUserBanned, checkPremiumStatusWithCache]);

  const checkQuestionAccess = useCallback(async (companyId: number) => {
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
  }, [isAuthenticated, user?.id]);

  const updateQuestionAccess = useCallback(async (companyId: number): Promise<boolean> => {
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
  }, [isAuthenticated, user?.id]);

  const refreshPremiumStatus = useCallback(() => {
    if (isAuthenticated() && user?.id) {
      // Clear cache
      sessionStorage.removeItem(`premium_status_${user.id}`);
      sessionStorage.removeItem(`premium_status_${user.id}_time`);
      
      checkPremiumStatusWithCache().then(data => {
        if (data) {
          setPremiumStatus(data);
        }
      });
    }
  }, [isAuthenticated, user?.id, checkPremiumStatusWithCache]);

  const value: PremiumContextType = {
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
