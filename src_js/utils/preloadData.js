// Utility to preload critical data in the background
export const preloadCompanies = async (API_ENDPOINTS, getApiHeaders) => {
    const cacheKey = 'companies_page_1_limit_20';
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
    
    // Only preload if cache is expired or doesn't exist
    if (!cached || !cacheTime || (Date.now() - parseInt(cacheTime)) > 15 * 60 * 1000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${API_ENDPOINTS.COMPANY}?page=1&limit=20`, {
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
                
                sessionStorage.setItem(cacheKey, JSON.stringify(result));
                sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
            }
        } catch (error) {
            // Silently fail - this is just a preload
            console.debug('Preload failed:', error);
        }
    }
};

export const preloadUserData = async (userId, API_ENDPOINTS, getApiHeaders) => {
    if (!userId) return;

    // Preload premium status
    const premiumCacheKey = `premium_status_${userId}`;
    const premiumCached = sessionStorage.getItem(premiumCacheKey);
    const premiumCacheTime = sessionStorage.getItem(`${premiumCacheKey}_time`);
    
    if (!premiumCached || !premiumCacheTime || (Date.now() - parseInt(premiumCacheTime)) > 10 * 60 * 1000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${API_ENDPOINTS.PREMIUM}?action=check_premium_status&user_id=${userId}`, {
                headers: getApiHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            const isPremium = data.status === 'success' && data.data?.is_premium;
            
            sessionStorage.setItem(premiumCacheKey, isPremium.toString());
            sessionStorage.setItem(`${premiumCacheKey}_time`, Date.now().toString());
        } catch (error) {
            console.debug('Premium preload failed:', error);
        }
    }

    // Preload OAcoins balance
    const oacoinsCacheKey = `oacoins_${userId}`;
    const oacoinsCached = sessionStorage.getItem(oacoinsCacheKey);
    const oacoinsCacheTime = sessionStorage.getItem(`${oacoinsCacheKey}_time`);
    
    if (!oacoinsCached || !oacoinsCacheTime || (Date.now() - parseInt(oacoinsCacheTime)) > 2 * 60 * 1000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(API_ENDPOINTS.OACOINS, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    action: 'get_balance',
                    user_id: userId
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.status === 'success') {
                sessionStorage.setItem(oacoinsCacheKey, (data.oacoins || 0).toString());
                sessionStorage.setItem(`${oacoinsCacheKey}_time`, Date.now().toString());
            }
        } catch (error) {
            console.debug('OAcoins preload failed:', error);
        }
    }

    // Preload request count
    const requestCountCacheKey = `request_count_${userId}`;
    const requestCountCached = sessionStorage.getItem(requestCountCacheKey);
    const requestCountCacheTime = sessionStorage.getItem(`${requestCountCacheKey}_time`);
    
    if (!requestCountCached || !requestCountCacheTime || (Date.now() - parseInt(requestCountCacheTime)) > 2 * 60 * 1000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${API_ENDPOINTS.SOLUTION_REQUESTS}?action=get_daily_request_count&user_id=${userId}`, {
                headers: getApiHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.status === 'success') {
                sessionStorage.setItem(requestCountCacheKey, JSON.stringify(data.data));
                sessionStorage.setItem(`${requestCountCacheKey}_time`, Date.now().toString());
            }
        } catch (error) {
            console.debug('Request count preload failed:', error);
        }
    }
};
