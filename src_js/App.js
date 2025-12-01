import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { FaHeart, FaCopyright } from 'react-icons/fa';
import { AuthProvider } from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { preloadCompanies, preloadUserData } from './utils/preloadData';
import { API_ENDPOINTS, getApiHeaders } from './config/api';

// Eager load critical components
import LandingPage from './components/LandingPage';
import SEO from './components/SEO';
import DotPattern from './components/DotPattern';
import Loader from './components/Loader';

// Lazy load non-critical components
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const QuestionDetails = lazy(() => import('./components/QuestionDetails'));
const QuestionWithEditor = lazy(() => import('./components/QuestionWithEditor'));
const CompanyQuestions = lazy(() => import('./components/CompanyQuestions'));
const DSASheet = lazy(() => import('./components/DSASheet'));
const PremiumPlans = lazy(() => import('./components/PremiumPlans'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Admin = lazy(() => import('./components/Admin'));
const UploadQuestion = lazy(() => import('./components/UploadQuestion'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./components/RefundPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const TrustInOAHelper = lazy(() => import('./components/TrustInOAHelper'));
const ExtendPremium = lazy(() => import('./components/ExtendPremium'));
const PlacementData = lazy(() => import('./components/PlacementData'));
const InterviewExperiences = lazy(() => import('./components/InterviewExperiences'));
const GenerateAllCombined = lazy(() => import('./components/GenerateAllCombined'));
const AdvancedQuestionUpload = lazy(() => import('./components/AdvancedQuestionUpload'));
const AdvancedQuestionSolver = lazy(() => import('./components/AdvancedQuestionSolver'));
const CompanyInsightsShowcase = lazy(() => import('./components/CompanyInsightsShowcase'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));

// Component to conditionally render footer
function ConditionalFooter() {
  const location = useLocation();
  
  // Hide footer on editor and admin routes
  if (location.pathname.includes('/question-with-editor/') || location.pathname.includes('/admin')) {
    return null;
  }
  
  return (
    <footer className="w-full bg-black border-t border-white/10 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-xl tracking-tight">OAHelper.in</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Most of the Questions And Solutions on OAHelper are exclusively available here - nowhere else!
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <FaHeart className="text-gray-600" />
              <span className="text-gray-400">Trusted by Thousands Of Students</span>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="/dsa-sheet" className="text-gray-400 hover:text-white transition-colors text-sm">
                  DSA Sheet
                </a>
              </li>
              <li>
                <a href="/placement-data" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Placement Data
                </a>
              </li>
              <li>
                <a href="/interview-experiences" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Interview Experiences
                </a>
              </li>
              <li>
                <a href="/premium" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Premium Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Community</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://wa.me/919274985691" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  WhatsApp Group
                </a>
              </li>
              <li>
                <a href="/report-content" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Report Issue
                </a>
              </li>
              <li>
                <a href="/trust-oahelper" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Trust & Safety
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@oahelper.in" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Banner - Minimal */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <p className="text-gray-500 text-xs leading-relaxed">
            <span className="text-gray-300 font-medium">Educational Disclaimer:</span> OAHelper is an independent educational platform. 
            We (oahelper.in) do not own any of these images or questions. All content is uploaded by users of our platform.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <FaCopyright />
                <span>2025 OAHelper.in</span>
              </div>
              <div className="text-gray-600 text-xs">
                <span>A venture by CODEHELPER AI SOLUTIONS PRIVATE LIMITED</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <a 
                href="https://wa.me/919274985691" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors text-sm"
              >
                Chat with us
              </a>
              <span className="text-gray-600 text-sm">Made with ❤️ for Students</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  // Preload critical data in the background
  React.useEffect(() => {
    // Preload companies data
    preloadCompanies(API_ENDPOINTS, getApiHeaders);
    
    // Preload user data if logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          preloadUserData(user.id, API_ENDPOINTS, getApiHeaders);
        }
      } catch (error) {
        console.debug('Failed to parse user data for preload');
      }
    }
  }, []);



  return (
    <HelmetProvider>
      <AuthProvider>
        <PremiumProvider>
          {/* Default SEO for all pages */}
          <SEO />
        
        <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
          {/* Background Dot Pattern */}
          <DotPattern 
            width={32} 
            height={32} 
            cx={16} 
            cy={16} 
            cr={1.5} 
            className="absolute inset-0 opacity-10" 
          />
          
          {/* Main Content */}
          <div className="flex-grow">
            <Router>
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  <Route path="/premium" element={<PremiumPlans />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/questions/:id" element={<QuestionDetails />} />
                  <Route path="/question-with-editor/:id" element={<QuestionWithEditor />} />
                  <Route path="/company-questions" element={<CompanyQuestions />} />
                  <Route path="/dsa-sheet" element={<DSASheet />} />
                  <Route path="/placement-data" element={<PlacementData />} />
                  <Route path="/interview-experiences" element={<InterviewExperiences />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/upload-question" element={<UploadQuestion />} />
                  <Route path="/advanced-upload" element={<AdvancedQuestionUpload />} />
                  <Route path="/solver" element={<AdvancedQuestionSolver />} />
                  <Route path="/company-insights" element={<CompanyInsightsShowcase />} />
                  <Route path="/trust-oahelper" element={<TrustInOAHelper />} />
                  <Route path="/generate-all-combined" element={<GenerateAllCombined />} />

                  <Route path="/extend-premium" element={<ExtendPremium />} />
                </Routes>
              </Suspense>
              
              {/* Chat Widget */}
              <ChatWidget />
              
              {/* Conditional Footer */}
              <ConditionalFooter />
            </Router>
          </div>
        </div>
          </PremiumProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
