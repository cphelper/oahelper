import React, { useState, useEffect } from 'react';
import { Info, X, AlertTriangle } from 'lucide-react';

const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('disclaimerDismissed');
    const dismissedDate = localStorage.getItem('disclaimerDismissedDate');
    
    // Show banner again after 7 days
    if (!dismissed || (dismissedDate && Date.now() - parseInt(dismissedDate) > 7 * 24 * 60 * 60 * 1000)) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('disclaimerDismissed', 'true');
    localStorage.setItem('disclaimerDismissedDate', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-md border-b border-blue-400/40 py-4 px-4 relative shadow-lg">
      <div className="container mx-auto flex items-start gap-3 max-w-6xl">
        <div className="flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="text-yellow-300 animate-pulse" size={22} />
          <Info className="text-blue-300" size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white leading-relaxed">
            <strong className="text-yellow-300 font-bold">IMPORTANT DISCLAIMER:</strong> OAHelper.in is an <strong>independent educational platform</strong>. 
            All company names, logos, and trademarks mentioned on this platform are used <strong>solely for educational and informational purposes</strong>. 
            <span className="text-yellow-200 font-semibold"> We are NOT affiliated with, endorsed by, or sponsored by any of the companies mentioned.</span> All 
            trademarks are the property of their respective owners. For more details, see our <a href="/terms-of-service" className="text-blue-300 hover:text-blue-200 underline font-semibold">Terms of Service</a>.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-300 hover:text-white transition-colors flex-shrink-0 p-1 hover:bg-white/10 rounded"
          aria-label="Dismiss disclaimer"
          title="Dismiss for 7 days"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
