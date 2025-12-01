'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

interface User {
  id: number;
  name: string;
  email: string;
  college?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<boolean>;
  logout: () => void;
  logoutAndClearAll: () => void;
  isAuthenticated: () => boolean;
  isLoading: boolean;
  checkUserBanned: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to clear all site data
  const clearAllSiteData = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      console.log('All site data cleared');
    } catch (error) {
      console.error('Error clearing site data:', error);
    }
  }, []);

  // Function to check if user is banned
  const checkUserBanned = useCallback(async (userEmail: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/check-banned?email=${encodeURIComponent(userEmail)}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.is_banned) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking banned status:', error);
      return false;
    }
  }, []);

  // Check if user is logged in on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('oahelper_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        checkUserBanned(parsedUser.email).then(isBanned => {
          if (isBanned) {
            console.log('User is banned, logging out');
            alert('Your account has been banned from the platform.');
            clearAllSiteData();
            setUser(null);
            window.location.href = '/login';
          } else {
            setUser(parsedUser);
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('oahelper_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [checkUserBanned, clearAllSiteData]);

  const login = useCallback(async (userData: User): Promise<boolean> => {
    const isBanned = await checkUserBanned(userData.email);
    if (isBanned) {
      alert('This email address has been banned from the platform.');
      return false;
    }
    
    setUser(userData);
    localStorage.setItem('oahelper_user', JSON.stringify(userData));
    return true;
  }, [checkUserBanned]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('oahelper_user');
  }, []);

  const logoutAndClearAll = useCallback(() => {
    clearAllSiteData();
    setUser(null);
  }, [clearAllSiteData]);

  const isAuthenticated = useCallback((): boolean => {
    return user !== null;
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/auth/get-user?user_id=${user.id}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('oahelper_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    login,
    logout,
    logoutAndClearAll,
    isAuthenticated,
    isLoading,
    checkUserBanned,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
