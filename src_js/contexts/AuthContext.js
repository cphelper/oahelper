import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to clear all site data
    const clearAllSiteData = () => {
        try {
            // Clear localStorage
            localStorage.clear();
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            // Clear all cookies
            document.cookie.split(";").forEach((c) => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            });
            
            // Clear IndexedDB if available
            if ('indexedDB' in window) {
                indexedDB.databases().then(databases => {
                    databases.forEach(db => {
                        indexedDB.deleteDatabase(db.name);
                    });
                }).catch(() => {
                    // Ignore errors
                });
            }
            
            // Clear Cache Storage if available
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                }).catch(() => {
                    // Ignore errors
                });
            }
            
            console.log('All site data cleared due to banned email');
        } catch (error) {
            console.error('Error clearing site data:', error);
        }
    };

    // Function to check if user is banned
    const checkUserBanned = async (userEmail) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_SUBMISSIONS}?action=check_user_banned&email=${encodeURIComponent(userEmail)}`, {
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
    };

    // Check if user is logged in on app load
    useEffect(() => {
        const savedUser = localStorage.getItem('oahelper_user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                
                // Check if user is banned
                checkUserBanned(parsedUser.email).then(isBanned => {
                    if (isBanned) {
                        console.log('User is banned, logging out and clearing data');
                        alert('Your account has been banned from the platform. You will be logged out.');
                        
                        // Clear all site data
                        clearAllSiteData();
                        
                        // Reset user state
                        setUser(null);
                        
                        // Redirect to login page
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
    }, []);

    // Periodic check for banned status while user is active
    useEffect(() => {
        if (!user?.email) return;

        // Check every 5 minutes if user is banned
        const checkInterval = setInterval(async () => {
            const isBanned = await checkUserBanned(user.email);
            if (isBanned) {
                console.log('User became banned during session, logging out');
                alert('Your account has been banned from the platform. You will be logged out.');
                
                // Clear all site data
                clearAllSiteData();
                
                // Reset user state
                setUser(null);
                
                // Redirect to login page
                window.location.href = '/login';
                
                // Clear the interval
                clearInterval(checkInterval);
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        // Also check when page becomes visible (user switches back to tab)
        const handleVisibilityChange = async () => {
            if (!document.hidden && user?.email) {
                const isBanned = await checkUserBanned(user.email);
                if (isBanned) {
                    console.log('User is banned when returning to tab, logging out');
                    alert('Your account has been banned from the platform. You will be logged out.');
                    
                    // Clear all site data
                    clearAllSiteData();
                    
                    // Reset user state
                    setUser(null);
                    
                    // Redirect to login page
                    window.location.href = '/login';
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            clearInterval(checkInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user?.email]);

    const login = async (userData) => {
        // Check if user is banned before logging in
        const isBanned = await checkUserBanned(userData.email);
        if (isBanned) {
            console.log('Attempted login with banned email');
            alert('This email address has been banned from the platform.');
            return false;
        }
        
        setUser(userData);
        localStorage.setItem('oahelper_user', JSON.stringify(userData));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('oahelper_user');
    };

    const logoutAndClearAll = () => {
        clearAllSiteData();
        setUser(null);
    };

    const isAuthenticated = () => {
        return user !== null;
    };

    const refreshUser = async () => {
        if (!user?.id) return;
        
        try {
            // Fetch updated user data from the server
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/get-user.php?user_id=${user.id}`, {
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
    };

    const value = {
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







