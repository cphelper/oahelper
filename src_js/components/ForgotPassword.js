// src/components/ForgotPassword.js

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowLeft, FaKey, FaLock } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import useScrollToTop from '../hooks/useScrollToTop';

const ForgotPassword = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: verification, 3: new password

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        setStep(2);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.VERIFY_CODE, {
        email,
        code: verificationCode
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success' && response.data.reset_verified) {
        setStep(3);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD, {
        email,
        password: newPassword
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        setSubmitted(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Grid Background Pattern */}
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

      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
      >
        <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="relative z-10 bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/10 max-w-md w-full mx-4 shadow-2xl">
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-end mb-6">
          <Link
            to="/login"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-xs font-medium"
          >
            <span>Back to Login</span>
            <FaArrowLeft className="w-3 h-3 rotate-180" />
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/5 rounded-full border border-white/10">
              <FaKey className="text-2xl text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-normal text-white mb-3 tracking-tight">
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Verification Code"}
            {step === 3 && "Set New Password"}
          </h2>
          <p className="text-gray-400 text-sm font-light">
            {step === 1 && "Enter your email and we'll send you a verification code."}
            {step === 2 && "Enter the 4-digit code sent to your email."}
            {step === 3 && "Choose a new secure password for your account."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2">
            <FaCheckCircle />
            <p>{success}</p>
          </div>
        )}

        {!submitted ? (
          <>
            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600"
                      placeholder="your@gmail.com"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-2">
                    Only Gmail addresses (@gmail.com) are supported
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <form onSubmit={handleCodeVerification} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Verification Code
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600 text-center text-xl tracking-[0.5em] font-mono"
                      placeholder="0000"
                      maxLength="4"
                      pattern="[0-9]{4}"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-light text-center mt-2">
                    Check your email inbox for the code
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 4}
                    className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600"
                        placeholder="Enter new password"
                        required
                        minLength="6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600"
                        placeholder="Confirm new password"
                        required
                        minLength="6"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem]">
              <FaCheckCircle className="text-4xl text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-normal text-white mb-2">Password Updated!</h3>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Go to Login</span>
            </Link>
          </div>
        )}

        {!submitted && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm font-light">
              Remember your password? 
              <Link to="/login" className="text-white font-medium hover:underline transition-colors ml-1">
                Login here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
