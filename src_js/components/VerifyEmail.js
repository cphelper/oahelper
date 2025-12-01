import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('verification_email');
    
    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem('verification_email', emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // If no email found, redirect to signup
      navigate('/signup');
    }
  }, [location, navigate]);

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const verificationCode = code.join('');
    
    if (verificationCode.length !== 4) {
      setError('Please enter the complete 4-digit code.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.VERIFY_CODE, {
        email,
        code: verificationCode,
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        
        // Auto-login the user after successful verification (now async)
        const loginSuccess = await login(response.data.user);
        if (!loginSuccess) {
          setError('This email address has been banned from the platform.');
          return;
        }
        
        // Clear stored email
        localStorage.removeItem('verification_email');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.RESEND_CODE, {
        email
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        // Clear the current code inputs
        setCode(['', '', '', '']);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/5 w-full max-w-md p-8 rounded-2xl 
                     border border-white/10 hover:border-indigo-500/20 
                     transition-all duration-300">
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
          >
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Back to Signup</span>
            <FaArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-500/20 rounded-full">
              <FaEnvelope className="text-3xl text-indigo-300" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-gray-400 text-sm">
            We've sent a 4-digit code to<br />
            <span className="text-indigo-300 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 flex items-center">
            <FaCheckCircle className="mr-2" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verification Code Input */}
          <div className="space-y-2">
            <label className="block text-gray-400 text-sm font-medium">
              Enter Verification Code
            </label>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-white/10 text-white rounded-xl 
                           border border-white/20 focus:border-indigo-500/20 
                           focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  maxLength={1}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-500/10 text-indigo-300 rounded-xl 
                     border border-indigo-500/20 hover:bg-indigo-500/20 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Email</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Didn't receive the code?
          </p>
          <button
            onClick={resendCode}
            className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
          >
            Resend Code
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            The verification code will expire in 10 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
