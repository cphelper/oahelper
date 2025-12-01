// src/components/Signup.js

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import useScrollToTop from '../hooks/useScrollToTop';

const Signup = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1: email check, 2: full signup
  const [emailStatus, setEmailStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailCheck = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.CHECK_EMAIL, {
        email: formData.email,
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'available') {
        // Email is available, proceed to step 2
        setStep(2);
        setEmailStatus(response.data);
      } else if (response.data.status === 'exists_verified') {
        // Email exists and verified - show login option
        setEmailStatus(response.data);
        setError(response.data.message);
      } else if (response.data.status === 'exists_unverified') {
        // Email exists but not verified - show verify option
        setEmailStatus(response.data);
        setError(response.data.message);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.college || formData.college.trim() === '') {
      setError('Please select or enter your college name');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.SIGNUP, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        college: formData.college,
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);

        if (response.data.requires_verification) {
          // Redirect to verification page
          setTimeout(() => {
            navigate('/verify-email', {
              state: { email: formData.email }
            });
          }, 1500);
        } else {
          // Auto-login the user (in case verification is not required) (now async)
          const loginSuccess = await login(response.data.user);
          if (loginSuccess) {
            setTimeout(() => {
              navigate('/');
            }, 1500);
          } else {
            setError('This email address has been banned from the platform.');
          }
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.RESEND_CODE, {
        email: formData.email,
      }, {
        headers: getApiHeaders()
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate('/verify-email', {
            state: { email: formData.email }
          });
        }, 1500);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
      console.error('Resend verification error:', err);
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
        <h2 className="text-3xl md:text-4xl font-normal text-white text-center mb-6 tracking-tight">
          {step === 1 ? 'Join OAHelper' : 'Complete Registration'}
        </h2>

        {/* Privacy Notice */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <FaShieldAlt className="w-4 h-4" />
            <span className="text-sm font-medium">Privacy Protected</span>
          </div>
          <p className="text-center text-gray-400 text-xs mt-2 font-light">
            We don't send promotional emails or share your information with third parties
          </p>
        </div>

        {step === 1 && (
          <p className="text-center text-gray-400 text-sm mb-6 font-light">
            Enter your email to get started
          </p>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center">
            {success}
          </div>
        )}
        {step === 1 ? (
          // Step 1: Email Check
          <form onSubmit={handleEmailCheck} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="your@gmail.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-600 mt-2 font-light">
                Only Gmail addresses (@gmail.com) are supported
              </p>
            </div>

            {/* Action buttons based on email status */}
            {emailStatus && emailStatus.status === 'exists_verified' && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02]"
                >
                  Go to Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailStatus(null);
                    setError('');
                    setFormData({ ...formData, email: '' });
                  }}
                  disabled={loading}
                  className="w-full bg-transparent text-gray-400 border border-white/10 hover:text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-4 px-6 rounded-full transition-all"
                >
                  Try Different Email
                </button>
              </div>
            )}

            {emailStatus && emailStatus.status === 'exists_unverified' && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 inline" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Code'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/verify-email', { state: { email: formData.email } })}
                  disabled={loading}
                  className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-medium py-4 px-6 rounded-full transition-all"
                >
                  I Have Verification Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailStatus(null);
                    setError('');
                    setFormData({ ...formData, email: '' });
                  }}
                  disabled={loading}
                  className="w-full bg-transparent text-gray-400 border border-white/10 hover:text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-4 px-6 rounded-full transition-all"
                >
                  Try Different Email
                </button>
              </div>
            )}

            {!emailStatus && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 inline" />
                      Checking...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            )}
          </form>
        ) : (
          // Step 2: Full Signup Form
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-10 pr-16 py-4 bg-[#0A0A0A] text-gray-300 rounded-xl border border-white/10 cursor-not-allowed opacity-60"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setEmailStatus(null);
                    setError('');
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white text-xs font-medium border border-white/10 px-2 py-1 rounded hover:border-white/30 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Name</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">College/University</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                placeholder="Enter your college/university name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 inline" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        )}
        <p className="text-center text-gray-500 text-sm mt-8 font-light">
          Already have an account? <Link to="/login" className="text-white font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
